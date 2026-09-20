// Digital Campus v2: Milestone A1 — Admin Control Plane & Room Lifecycle Management
// worker/routes/room-api.ts — Study Room Creation & Owner Lifecycle APIs

import { Hono } from 'hono'
import { layPhien, kiemTraPhien } from '../lib/session'
import { laQuanTriTruong } from '../lib/scope'
import { actorKey } from '../lib/auth'
import { xacDinhQuyenModeratorPhong } from '../lib/room-gate'
import { bamMatKhau, taoSalt, DEFAULT_ITERATIONS } from '../lib/passwords'
import { getRoomLifecyclePolicy, closeStudyRoomCanonical } from '../services/room-lifecycle'
import {
  CreateStudyRoomPayloadSchema,
  CloseRoomPayloadSchema,
  UPLOAD_ERROR_CODES,
  type RoomDocumentItem,
} from '../../shared/protocol/room'
import { lamSachVanBan } from '../../shared/protocol/common'
import { recordAnalyticsEvent } from '../lib/analytics'
import { validateDocumentUpload } from '../lib/document-validation'
import { kiemTraPhamVi, type DongPhong } from '../lib/room-gate'

export const roomRouter = new Hono<{ Bindings: Env }>()

function loi(thongBao: string, maLoi = 400, errorCode?: string): Response {
  return new Response(JSON.stringify({ ok: false, error: thongBao, loi: thongBao, errorCode, code: errorCode }), {
    status: maLoi,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * POST /api/rooms
 * Tạo phòng học mới kèm khởi tạo chu kỳ sống RoomDO & cơ chế bù trừ (Compensation)
 * Tuân thủ Section 10 & 25.
 */
roomRouter.post('/', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  let rawBody: unknown
  try {
    rawBody = await c.req.json()
  } catch {
    return loi('Dữ liệu JSON không hợp lệ.', 400)
  }

  const parsed = CreateStudyRoomPayloadSchema.safeParse(rawBody)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || 'Dữ liệu tạo phòng không hợp lệ.'
    return loi(msg, 400)
  }

  const payload = parsed.data
  const cleanTen = lamSachVanBan(payload.ten)
  if (!cleanTen || cleanTen.length < 2) {
    return loi('Tên phòng phải từ 2 ký tự trở lên.', 400)
  }

  const cleanMoTa = payload.moTa ? lamSachVanBan(payload.moTa) : null

  // Kiểm tra quyền hạn phạm vi (Scope Authorization)
  let lopId: number | null = null
  if (payload.phamVi === 'lop') {
    if (!payload.lopId) {
      return loi('Phòng phạm vi lớp yêu cầu chỉ định mã lớp.', 400)
    }
    lopId = payload.lopId

    const isAdmin = laQuanTriTruong(kq.taiKhoan)
    const isStudentInClass = kq.taiKhoan.role === 'student' && kq.taiKhoan.lopId === lopId

    // Nếu là giáo viên, kiểm tra xem có dạy lớp này không
    let isTeacherInClass = false
    if (kq.taiKhoan.role === 'teacher') {
      try {
        const gvRow = await c.env.DB.prepare(
          'SELECT 1 FROM giao_vien_lop WHERE giao_vien_id = ?1 AND lop_id = ?2 LIMIT 1',
        )
          .bind(kq.taiKhoan.id, lopId)
          .first()
        isTeacherInClass = Boolean(gvRow)
      } catch (err) {
        console.error('[roomRouter.create] Lỗi tra cứu giao_vien_lop:', err)
      }
    }

    if (!isAdmin && !isStudentInClass && !isTeacherInClass) {
      return loi('Bạn không có quyền tạo phòng cho lớp học này.', 403)
    }
  }

  // Mật khẩu bảo vệ nếu accessMode = password
  let matKhauHash: string | null = null
  let matKhauSalt: string | null = null
  let matKhauIterations: number | null = null

  if (payload.accessMode === 'password') {
    const pwd = (payload.password || '').trim()
    if (!pwd || pwd.length < 4) {
      return loi('Mật khẩu phòng học phải có ít nhất 4 ký tự.', 400)
    }
    matKhauSalt = taoSalt()
    matKhauIterations = DEFAULT_ITERATIONS
    matKhauHash = await bamMatKhau(pwd, matKhauSalt, matKhauIterations)
  }

  const now = Date.now()
  const callerKey = actorKey(kq.phien)
  const callerName = kq.taiKhoan.ten || kq.taiKhoan.username
  const sucChua = Math.min(100, Math.max(2, payload.sucChua || 20))

  // Đọc cấu hình chính sách hiện hành từ D1
  const policy = await getRoomLifecyclePolicy(c.env.DB)

  // 1. Tạo bản ghi phòng trong D1 (trạng thái OPEN 'mo', ever_joined = 0, kèm snapshot chính sách)
  let createdRoom: { id: number; ten: string; pham_vi: string; lop_id: number | null; access_mode: string; suc_chua: number } | null = null
  try {
    const insertRes = await c.env.DB.prepare(`
      INSERT INTO phong (
        loai, ten, mo_ta, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten,
        trang_thai, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations,
        suc_chua, created_at, last_activity_at, ever_joined, lifecycle_revision,
        lifecycle_auto_close_enabled, lifecycle_never_joined_ttl_minutes,
        lifecycle_empty_room_ttl_minutes, lifecycle_max_lifetime_minutes,
        lifecycle_policy_revision,
        tao_luc, cap_nhat_luc
      ) VALUES (
        'video', ?1, ?2, ?3, ?4, ?5, ?6,
        'mo', ?7, ?8, ?9, ?10,
        ?11, ?12, ?12, 0, 1,
        ?13, ?14, ?15, ?16, ?17,
        datetime('now'), datetime('now')
      ) RETURNING id, ten, pham_vi, lop_id, access_mode, suc_chua
    `)
      .bind(
        cleanTen,
        cleanMoTa,
        payload.phamVi,
        lopId,
        callerKey,
        callerName,
        payload.accessMode,
        matKhauHash,
        matKhauSalt,
        matKhauIterations,
        sucChua,
        now,
        policy.autoCloseEnabled ? 1 : 0,
        policy.neverJoinedTtlMinutes,
        policy.emptyRoomTtlMinutes,
        policy.maxRoomLifetimeMinutes,
        policy.revision,
      )
      .first<{ id: number; ten: string; pham_vi: string; lop_id: number | null; access_mode: string; suc_chua: number }>()

    createdRoom = insertRes
  } catch (err: any) {
    console.error('[roomRouter.create] Lỗi ghi D1 khi tạo phòng:', err)
    return loi('Lỗi cơ sở dữ liệu khi tạo phòng học: ' + (err.message || String(err)), 500)
  }

  if (!createdRoom) {
    return loi('Không thể tạo phòng học trong cơ sở dữ liệu.', 500)
  }

  const roomId = createdRoom.id

  // 2. Khởi tạo nghĩa vụ chu kỳ sống RoomDO (/internal/lifecycle/init)
  let initSuccess = false
  try {
    const doId = c.env.ROOMS.idFromName(`phong-${roomId}`)
    const roomStub = c.env.ROOMS.get(doId)
    const initRes = await roomStub.fetch('http://room.internal/internal/lifecycle/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        createdAt: now,
        policy,
      }),
    })

    if (initRes.ok) {
      const resJson = (await initRes.json().catch(() => null)) as { ok?: boolean } | null
      if (resJson?.ok === true) {
        initSuccess = true
      }
    }
  } catch (rpcErr) {
    console.error(`[roomRouter.create] Ngoại lệ khi gọi RoomDO lifecycle init cho phòng ${roomId}:`, rpcErr)
  }

  // 3. Cơ chế bù trừ an toàn (Compensation - Section 10 & 25)
  // Nếu khởi tạo RoomDO thất bại, tuyệt đối KHÔNG để phòng mồ côi ở trạng thái OPEN.
  if (!initSuccess) {
    console.error(`[roomRouter.create] BÙ TRỪ: Đóng phòng ${roomId} vì khởi tạo RoomDO thất bại.`)
    try {
      await c.env.DB.prepare(`
        UPDATE phong
        SET trang_thai = 'dong',
            closed_at = ?1,
            close_reason = 'lifecycle_bootstrap_failed',
            cap_nhat_luc = datetime('now')
        WHERE id = ?2
      `)
        .bind(now, roomId)
        .run()

      await c.env.DB.prepare(`
        INSERT INTO moderation_audit_logs (actor_id, target_id, room_id, action, reason, metadata, created_at)
        VALUES (?1, NULL, ?2, 'room_lifecycle_bootstrap_failed', ?3, ?4, ?5)
      `)
        .bind(
          kq.taiKhoan.id,
          roomId,
          'Khởi tạo chu kỳ hoạt động RoomDO thất bại',
          JSON.stringify({ status: 'do_rpc_error' }),
          now,
        )
        .run()
    } catch (compErr) {
      console.error(`[roomRouter.create] Lỗi ghi bù trừ cho phòng ${roomId}:`, compErr)
    }

    return loi('Không thể khởi tạo chu kỳ hoạt động của phòng học. Vui lòng thử lại.', 503)
  }

  // Analytics event
  if (c.env.ANALYTICS_DB) {
    try {
      void recordAnalyticsEvent(c.env.ANALYTICS_DB, c.executionCtx, {
        event: 'room.lifecycle.created',
        actorId: kq.taiKhoan.id,
        roomId,
        properties: {
          phamVi: payload.phamVi,
          accessMode: payload.accessMode,
          sucChua,
        },
      })
    } catch {}
  }

  return c.json(
    {
      ok: true,
      room: {
        id: roomId,
        ten: createdRoom.ten,
        phamVi: createdRoom.pham_vi,
        lopId: createdRoom.lop_id,
        accessMode: createdRoom.access_mode,
        sucChua: createdRoom.suc_chua,
        createdAt: now,
      },
    },
    201,
  )
})

/**
 * POST /api/rooms/:id/close
 * Đóng phòng học dành cho Chủ phòng (Owner) hoặc Điều hành viên (Moderator/Teacher)
 * Tuân thủ Section 16: Hội tụ qua cùng 1 canonical close service.
 */
roomRouter.post('/:id/close', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const roomId = parseInt(c.req.param('id'), 10)
  if (!roomId || roomId <= 0) return loi('ID phòng không hợp lệ.', 400)

  // Tra cứu thông tin phòng
  let roomRow: any = null
  try {
    roomRow = await c.env.DB.prepare('SELECT * FROM phong WHERE id = ?1 AND loai = \'video\'')
      .bind(roomId)
      .first()
  } catch {
    return loi('Không thể tra cứu thông tin phòng học.', 500)
  }

  if (!roomRow) return loi('Không tìm thấy phòng học.', 404)

  const callerKey = actorKey(kq.phien)
  const isOwner = roomRow.chu_phong_khoa === callerKey
  const isAdmin = laQuanTriTruong(kq.taiKhoan)
  const modQuyen = await xacDinhQuyenModeratorPhong(c.env.DB, kq.taiKhoan, roomRow, callerKey)

  if (!isOwner && !isAdmin && !modQuyen.canModerate) {
    return loi('Bạn không có quyền đóng phòng học này.', 403)
  }

  let body: { reason?: string; note?: string } = {}
  try {
    const raw = await c.req.json()
    const parsed = CloseRoomPayloadSchema.safeParse(raw)
    if (parsed.success) body = parsed.data
  } catch {}

  const actorType = isAdmin ? 'admin' : isOwner ? 'owner' : 'moderator'
  const reasonCode = isOwner ? 'owner_closed' : isAdmin ? 'admin_closed' : 'moderator_room_close'
  const humanNote = body.note || body.reason || null

  const res = await closeStudyRoomCanonical(
    c.env,
    roomId,
    {
      type: actorType,
      accountId: kq.taiKhoan.id,
      name: kq.taiKhoan.ten || kq.taiKhoan.username,
    },
    reasonCode,
    humanNote,
  )

  if (!res.ok) {
    if (res.partial) {
      return c.json(
        {
          ok: false,
          partial: true,
          retryable: true,
          lifecycleStatus: res.lifecycleStatus || 'closing',
          error: res.error || 'Đóng phòng học gặp sự cố từng phần. Vui lòng thử lại.',
        },
        502,
      )
    }
    return loi(res.error || 'Đóng phòng học thất bại.', 500)
  }

  return c.json({
    ok: true,
    closed: true,
    alreadyClosed: Boolean(res.alreadyClosed),
    closedSocketsCount: res.closedSocketsCount ?? 0,
    message: 'Phòng học đã được đóng thành công.',
  })
})

/**
 * POST /api/rooms/:id/documents
 * Tải lên tài liệu mới vào phòng học (PDF, PPTX, Image)
 * Tuân thủ Section 4, 5, 6, 7, 8, 9, 10, 11 của Milestone R1.
 */
roomRouter.post('/:id/documents', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401, UPLOAD_ERROR_CODES.AUTH_REQUIRED)

  const roomId = parseInt(c.req.param('id'), 10)
  if (!roomId || roomId <= 0) return loi('ID phòng không hợp lệ.', 400)

  // 1. Kiểm tra phòng tồn tại & trạng thái vòng đời
  let roomRow: DongPhong | null = null
  try {
    roomRow = await c.env.DB.prepare(
      `SELECT id, trang_thai, pham_vi, lop_id, access_mode, mat_khau_hash, mat_khau_salt,
              mat_khau_iterations, suc_chua, chu_phong_khoa
       FROM phong WHERE id = ?1 AND loai = 'video'`,
    )
      .bind(roomId)
      .first<DongPhong>()
  } catch (err) {
    console.error('[roomRouter.uploadDocument] Lỗi tra cứu phòng D1:', err)
    return loi('Không thể tra cứu thông tin phòng học.', 500)
  }

  if (!roomRow) return loi('Không tìm thấy phòng học.', 404)

  if (roomRow.trang_thai === 'dong' || roomRow.trang_thai === 'closing') {
    return loi('Phòng học đã đóng, không thể tải lên tài liệu mới.', 409, UPLOAD_ERROR_CODES.ROOM_CLOSED)
  }

  // 2. Kiểm tra phân quyền truy cập phòng (Scope & Ban check)
  const loiPhamVi = await kiemTraPhamVi(c.env, kq.taiKhoan, roomRow)
  if (loiPhamVi) return loi('Bạn không có quyền tải tài liệu vào phòng học này.', 403, UPLOAD_ERROR_CODES.ROOM_FORBIDDEN)

  try {
    const ban = await c.env.DB.prepare(
      'SELECT 1 FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2 LIMIT 1',
    )
      .bind(roomRow.id, kq.taiKhoan.id)
      .first()
    if (ban) return loi('Bạn đã bị cấm khỏi phòng học này.', 403, UPLOAD_ERROR_CODES.ROOM_FORBIDDEN)
  } catch (banErr) {
    console.error('[roomRouter.uploadDocument] Lỗi tra cứu phong_ban:', banErr)
    return loi('Không thể xác thực quyền truy cập phòng học.', 503)
  }

  // 3. Giới hạn tần suất tải lên (Rate limiting anti-abuse)
  if (c.env.UPLOAD_LIMITER) {
    try {
      const rlRes = await c.env.UPLOAD_LIMITER.limit({ key: `up:${kq.taiKhoan.id}` })
      if (!rlRes.success) {
        return loi('Bạn đã tải lên quá nhiều tệp trong thời gian ngắn. Vui lòng đợi 1 phút.', 429)
      }
    } catch (rlErr) {
      console.warn('[roomRouter.uploadDocument] Lỗi UPLOAD_LIMITER:', rlErr)
    }
  }

  if (c.env.RATE_LIMIT) {
    const rateKey = `rate:upload:${kq.taiKhoan.id}`
    try {
      const count = parseInt((await c.env.RATE_LIMIT.get(rateKey)) || '0', 10)
      if (Number.isFinite(count) && count >= 20) {
        return loi('Bạn đã tải lên quá nhiều tệp trong thời gian ngắn. Vui lòng đợi 10 phút.', 429)
      }
      await c.env.RATE_LIMIT.put(rateKey, String(count + 1), { expirationTtl: 600 }).catch(() => {})
    } catch {}
  }

  // 4. Đọc multipart form data & kiểm tra tính hợp lệ của tệp
  let file: File | null = null
  try {
    const formData = await c.req.formData()
    file = formData.get('file') as File | null
  } catch (formErr) {
    console.error('[roomRouter.uploadDocument] Lỗi đọc formData:', formErr)
    return loi('Dữ liệu biểu mẫu tải lên không hợp lệ.', 400)
  }

  if (!file) {
    return loi('Vui lòng chọn tệp để tải lên.', 400, UPLOAD_ERROR_CODES.EMPTY_FILE)
  }

  let fileBytes: Uint8Array
  try {
    const buf = await file.arrayBuffer()
    fileBytes = new Uint8Array(buf)
  } catch (bufErr) {
    console.error('[roomRouter.uploadDocument] Lỗi đọc bytes tệp:', bufErr)
    return loi('Không thể đọc dữ liệu tệp.', 400)
  }

  const valRes = await validateDocumentUpload(file.name, file.type, fileBytes)
  if (!valRes.ok) {
    const statusCode = valRes.errorCode === UPLOAD_ERROR_CODES.FILE_TOO_LARGE ? 413 : 400
    return loi(valRes.error || 'Tệp không hợp lệ.', statusCode, valRes.errorCode)
  }

  // 5. Ghi tệp vào R2 với key phân lập theo phòng
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50)
  const key = `rooms/${roomId}/documents/${Date.now()}_${crypto.randomUUID()}_${safeName}`

  try {
    await c.env.ANH.put(key, fileBytes, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
      customMetadata: {
        originalName: encodeURIComponent(file.name),
        size: String(file.size),
        uploaderId: String(kq.taiKhoan.id),
        roomId: String(roomId),
      },
    })
  } catch (r2Err) {
    console.error('[roomRouter.uploadDocument] R2 write failed:', r2Err)
    return loi('Không thể ghi tệp vào máy chủ lưu trữ.', 503, UPLOAD_ERROR_CODES.STORAGE_WRITE_FAILED)
  }

  // 6. Ghi metadata vào D1 phong_tai_lieu kèm cơ chế bù trừ (Compensation)
  const now = Date.now()
  let docId: number
  try {
    const insertRes = await c.env.DB.prepare(`
      INSERT INTO phong_tai_lieu (
        room_id, object_key, original_name, mime_type, size_bytes, page_count,
        file_type, uploaded_by_account_id, uploaded_by_name, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
      RETURNING id
    `)
      .bind(
        roomId,
        key,
        file.name.slice(0, 200),
        file.type || 'application/octet-stream',
        file.size,
        valRes.pageCount || 1,
        valRes.fileType || 'pdf',
        kq.taiKhoan.id,
        kq.taiKhoan.ten || kq.taiKhoan.username,
        now,
      )
      .first<{ id: number }>()

    if (!insertRes?.id) throw new Error('D1 insert did not return document ID')
    docId = insertRes.id
  } catch (dbErr) {
    console.error('[roomRouter.uploadDocument] D1 insert failed, compensating R2 delete:', dbErr)
    try {
      await c.env.ANH.delete(key)
    } catch {}
    return loi('Không thể lưu thông tin tài liệu vào cơ sở dữ liệu.', 500, UPLOAD_ERROR_CODES.METADATA_FAILED)
  }

  const docItem: RoomDocumentItem = {
    id: docId,
    roomId,
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    pageCount: valRes.pageCount || 1,
    fileType: valRes.fileType || 'pdf',
    uploadedByAccountId: kq.taiKhoan.id,
    uploadedByName: kq.taiKhoan.ten || kq.taiKhoan.username,
    createdAt: now,
    url: `/api/rooms/${roomId}/documents/${docId}/file`,
  }

  return c.json({ ok: true, document: docItem }, 201)
})

/**
 * GET /api/rooms/:id/documents
 * Danh sách tài liệu hiện có trong phòng học
 */
roomRouter.get('/:id/documents', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const roomId = parseInt(c.req.param('id'), 10)
  if (!roomId || roomId <= 0) return loi('ID phòng không hợp lệ.', 400)

  let roomRow: DongPhong | null = null
  try {
    roomRow = await c.env.DB.prepare(
      'SELECT id, trang_thai, pham_vi, lop_id, access_mode, chu_phong_khoa FROM phong WHERE id = ?1 AND loai = \'video\'',
    )
      .bind(roomId)
      .first<DongPhong>()
  } catch {
    return loi('Không thể tra cứu thông tin phòng học.', 500)
  }

  if (!roomRow) return loi('Không tìm thấy phòng học.', 404)

  const loiPhamVi = await kiemTraPhamVi(c.env, kq.taiKhoan, roomRow)
  if (loiPhamVi) return loi('Bạn không có quyền truy cập danh sách tài liệu của phòng này.', 403)

  try {
    const rows = await c.env.DB.prepare(`
      SELECT id, room_id, original_name, mime_type, size_bytes, page_count,
             file_type, uploaded_by_account_id, uploaded_by_name, created_at
      FROM phong_tai_lieu
      WHERE room_id = ?1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `)
      .bind(roomId)
      .all<any>()

    const documents: RoomDocumentItem[] = (rows.results || []).map((r: any) => ({
      id: r.id,
      roomId: r.room_id,
      originalName: r.original_name,
      mimeType: r.mime_type,
      sizeBytes: r.size_bytes,
      pageCount: r.page_count,
      fileType: r.file_type,
      uploadedByAccountId: r.uploaded_by_account_id,
      uploadedByName: r.uploaded_by_name,
      createdAt: r.created_at,
      url: `/api/rooms/${roomId}/documents/${r.id}/file`,
    }))

    return c.json({ ok: true, documents })
  } catch (err) {
    console.error('[roomRouter.listDocuments] Lỗi truy vấn danh sách tài liệu:', err)
    return loi('Không thể tải danh sách tài liệu.', 500)
  }
})

/**
 * GET /api/rooms/:id/documents/:docId/file
 * Tải/Xem luồng nội dung tệp có xác thực phân quyền phòng học (Authoritative Storage Gate)
 */
roomRouter.get('/:id/documents/:docId/file', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const roomId = parseInt(c.req.param('id'), 10)
  const docId = parseInt(c.req.param('docId'), 10)
  if (!roomId || !docId) return loi('Tham số yêu cầu không hợp lệ.', 400)

  let roomRow: DongPhong | null = null
  try {
    roomRow = await c.env.DB.prepare(
      'SELECT id, trang_thai, pham_vi, lop_id, access_mode, chu_phong_khoa FROM phong WHERE id = ?1 AND loai = \'video\'',
    )
      .bind(roomId)
      .first<DongPhong>()
  } catch {
    return loi('Không thể tra cứu thông tin phòng học.', 500)
  }

  if (!roomRow) return loi('Không tìm thấy phòng học.', 404)

  const loiPhamVi = await kiemTraPhamVi(c.env, kq.taiKhoan, roomRow)
  if (loiPhamVi) return loi('Bạn không có quyền truy cập tài liệu trong phòng học này.', 403)

  let docRow: any = null
  try {
    docRow = await c.env.DB.prepare(
      'SELECT * FROM phong_tai_lieu WHERE id = ?1 AND room_id = ?2 AND deleted_at IS NULL',
    )
      .bind(docId, roomId)
      .first()
  } catch {
    return loi('Không thể tra cứu thông tin tài liệu.', 500)
  }

  if (!docRow) return loi('Không tìm thấy tài liệu yêu cầu.', 404)

  const object = await c.env.ANH.get(docRow.object_key)
  if (!object) {
    return loi('Tệp không tồn tại trên máy chủ lưu trữ.', 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('Content-Type', docRow.mime_type || 'application/octet-stream')
  headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(docRow.original_name)}"`)
  headers.set('Cache-Control', 'private, max-age=3600')
  headers.set('etag', object.httpEtag)

  return new Response(object.body, { headers })
})

/**
 * DELETE /api/rooms/:id/documents/:docId
 * Xóa mềm tài liệu khỏi phòng học (Chủ phòng, Moderator hoặc người tải lên)
 */
roomRouter.delete('/:id/documents/:docId', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const roomId = parseInt(c.req.param('id'), 10)
  const docId = parseInt(c.req.param('docId'), 10)
  if (!roomId || !docId) return loi('Tham số yêu cầu không hợp lệ.', 400)

  let roomRow: any = null
  let docRow: any = null
  try {
    roomRow = await c.env.DB.prepare('SELECT * FROM phong WHERE id = ?1 AND loai = \'video\'').bind(roomId).first()
    docRow = await c.env.DB.prepare('SELECT * FROM phong_tai_lieu WHERE id = ?1 AND room_id = ?2 AND deleted_at IS NULL').bind(docId, roomId).first()
  } catch {
    return loi('Lỗi cơ sở dữ liệu khi kiểm tra tài liệu.', 500)
  }

  if (!roomRow) return loi('Không tìm thấy phòng học.', 404)
  if (!docRow) return loi('Không tìm thấy tài liệu.', 404)

  const callerKey = actorKey(kq.phien)
  const isOwner = roomRow.chu_phong_khoa === callerKey
  const isAdmin = laQuanTriTruong(kq.taiKhoan)
  const modQuyen = await xacDinhQuyenModeratorPhong(c.env.DB, kq.taiKhoan, roomRow, callerKey)
  const isUploader = docRow.uploaded_by_account_id === kq.taiKhoan.id

  if (!isOwner && !isAdmin && !modQuyen.canModerate && !isUploader) {
    return loi('Bạn không có quyền xóa tài liệu này.', 403)
  }

  try {
    await c.env.DB.prepare(
      'UPDATE phong_tai_lieu SET deleted_at = ?1 WHERE id = ?2 AND room_id = ?3',
    )
      .bind(Date.now(), docId, roomId)
      .run()
  } catch (err) {
    console.error('[roomRouter.deleteDocument] Lỗi xóa tài liệu:', err)
    return loi('Không thể xóa tài liệu.', 500)
  }

  return c.json({ ok: true, message: 'Đã xóa tài liệu khỏi phòng học.' })
})
