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
} from '../../shared/protocol/room'
import { lamSachVanBan } from '../../shared/protocol/common'
import { recordAnalyticsEvent } from '../lib/analytics'

export const roomRouter = new Hono<{ Bindings: Env }>()

function loi(thongBao: string, maLoi = 400): Response {
  return new Response(JSON.stringify({ ok: false, error: thongBao }), {
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

  // 1. Tạo bản ghi phòng trong D1 (trạng thái OPEN 'mo', ever_joined = 0)
  let createdRoom: { id: number; ten: string; pham_vi: string; lop_id: number | null; access_mode: string; suc_chua: number } | null = null
  try {
    const insertRes = await c.env.DB.prepare(`
      INSERT INTO phong (
        loai, ten, mo_ta, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten,
        trang_thai, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations,
        suc_chua, created_at, last_activity_at, ever_joined, lifecycle_revision, tao_luc, cap_nhat_luc
      ) VALUES (
        'video', ?1, ?2, ?3, ?4, ?5, ?6,
        'mo', ?7, ?8, ?9, ?10,
        ?11, ?12, ?12, 0, 1, datetime('now'), datetime('now')
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
