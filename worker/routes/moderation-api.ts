import type { Context } from 'hono'
import { loi } from '../lib/http'
import { actorKey } from '../lib/auth'
import { kiemTraPhien, layPhien } from '../lib/session'
import { laGiaoVienDaDuyet, laQuanTriTruong, layPhamViQuanTri } from '../lib/scope'
import { kiemTraQuyenTruyCapPhong, xacDinhQuyenModeratorPhong } from '../lib/room-gate'
import {
  RoomKickPayloadSchema,
  RoomBanPayloadSchema,
  ReportPayloadSchema,
  type BannedMemberItem,
} from '../../shared/protocol/room'

function parsePhongId(c: Context): number | null {
  const param = c.req.param('id')
  if (!param) return null
  const num = parseInt(param.replace(/^phong-/, ''), 10)
  return Number.isFinite(num) && num > 0 ? num : null
}

async function ghiAuditLog(
  env: Env,
  params: {
    actorId: number
    targetId: number | null
    roomId: number | null
    action: string
    reason?: string | null
    metadata?: Record<string, unknown> | null
  },
): Promise<{ ok: boolean; error?: unknown }> {
  try {
    await env.DB.prepare(
      `INSERT INTO moderation_audit_logs (actor_id, target_id, room_id, action, reason, metadata, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    )
      .bind(
        params.actorId,
        params.targetId,
        params.roomId,
        params.action,
        params.reason ?? null,
        params.metadata ? JSON.stringify(params.metadata) : null,
        Date.now(),
      )
      .run()
    return { ok: true }
  } catch (err) {
    console.error('CRITICAL: Lỗi ghi moderation_audit_logs:', err)
    return { ok: false, error: err }
  }
}

async function layTargetRank(
  db: D1Database,
  targetAccountId: number | null,
  targetActorKey: string,
  chuPhongKhoa: string,
): Promise<number> {
  if (!targetAccountId) {
    return targetActorKey === chuPhongKhoa ? 1 : 0
  }

  const targetUser = await db.prepare(
    'SELECT id, vai_tro, la_admin_truong, teacher_pending FROM tai_khoan_campus WHERE id = ?1',
  )
    .bind(targetAccountId)
    .first<{ id: number; vai_tro: string; la_admin_truong: number; teacher_pending: number }>()

  if (targetUser?.la_admin_truong === 1) return 3 // Admin
  if (targetUser?.vai_tro === 'teacher' && targetUser?.teacher_pending === 0) return 2 // Teacher
  if (targetActorKey === chuPhongKhoa) return 1 // Host
  return 0 // Student / Member
}

/**
 * POST /api/rooms/:id/kick
 * Mời một thành viên ra khỏi phòng học (Server-Authoritative, Scoped Authority)
 */
export async function kickMemberFromRoom(c: Context<{ Bindings: Env }>): Promise<Response> {
  const phongId = parsePhongId(c)
  if (!phongId) return loi('ID phòng không hợp lệ.', 400)

  const gate = await kiemTraQuyenTruyCapPhong(c.req.raw, c.env, phongId)
  if (!gate.ok) return gate.response

  const callerKey = actorKey(gate.phien)
  const modQuyen = await xacDinhQuyenModeratorPhong(c.env.DB, gate.taiKhoan, gate.phongRow, callerKey)
  if (!modQuyen.canModerate) {
    return loi('Bạn không có quyền mời thành viên ra khỏi phòng học này.', 403)
  }

  let rawBody: unknown
  try {
    rawBody = await c.req.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const parsed = RoomKickPayloadSchema.safeParse(rawBody)
  if (!parsed.success) {
    return loi(parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.', 400)
  }

  const { targetActorKey, reason, banFromRoom } = parsed.data

  if (targetActorKey === callerKey) {
    return loi('Không thể tự mời bản thân ra khỏi phòng.', 400)
  }

  let targetAccountId: number | null = null
  if (targetActorKey.startsWith('acc:')) {
    targetAccountId = parseInt(targetActorKey.slice(4), 10) || null
  }

  const targetRank = await layTargetRank(c.env.DB, targetAccountId, targetActorKey, gate.phongRow.chu_phong_khoa)

  // Invariant hierarchy: caller must strictly outrank target
  if (modQuyen.authorityRank <= targetRank) {
    if (targetRank === 3) return loi('Không thể mời quản trị viên ra khỏi phòng.', 403)
    if (targetRank === 2) return loi('Chủ phòng không thể mời giáo viên ra khỏi phòng.', 403)
    if (targetRank === 1) return loi('Không thể mời chủ phòng ra khỏi phòng.', 403)
    return loi('Bạn không có đủ thẩm quyền đối với thành viên này.', 403)
  }

  // Nếu chọn cấm vào phòng luôn (banFromRoom)
  if (banFromRoom && targetAccountId) {
    try {
      await c.env.DB.prepare(
        `INSERT INTO phong_ban (phong_id, tai_khoan_id, ly_do, ban_boi, tao_luc)
         VALUES (?1, ?2, ?3, ?4, datetime('now'))
         ON CONFLICT(phong_id, tai_khoan_id) DO UPDATE SET ly_do = ?3, ban_boi = ?4, tao_luc = datetime('now')`,
      )
        .bind(phongId, targetAccountId, reason || 'Bị cấm bởi người điều hành', gate.taiKhoan.id)
        .run()

      const auditBanRes = await ghiAuditLog(c.env, {
        actorId: gate.taiKhoan.id,
        targetId: targetAccountId,
        roomId: phongId,
        action: 'ban',
        reason,
        metadata: {
          authorityRank: modQuyen.authorityRank,
          role: gate.taiKhoan.role,
          banFromKick: true,
        },
      })
      if (!auditBanRes.ok) {
        console.warn('Lưu ý: Audit log ban ghi thất bại nhưng phong_ban đã được lưu.')
      }
    } catch (err) {
      console.error('Lỗi ghi phong_ban khi kick:', err)
      return loi('Lỗi khi thiết lập cấm phòng.', 500)
    }
  }

  // Gửi lệnh kick tới RoomDO
  const doId = c.env.ROOMS.idFromName('phong-' + phongId)
  const roomStub = c.env.ROOMS.get(doId)

  try {
    const kickRes = await roomStub.fetch(
      new Request('http://internal/internal/moderation/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetActorKey,
          reason,
          byActorName: gate.taiKhoan.ten || gate.taiKhoan.username,
          byActorKey: callerKey,
        }),
      }),
    )

    const kickJson = (await kickRes.json().catch(() => null)) as {
      ok?: boolean
      removed?: boolean
      absent?: boolean
      message?: string
    } | null

    if (!kickRes.ok || !kickJson?.ok) {
      return loi(kickJson?.message || 'Không thể mời thành viên ra khỏi phòng.', 400)
    }
  } catch (err) {
    console.error('Lỗi RPC kick RoomDO:', err)
    return loi('Lỗi kết nối máy chủ phòng.', 502)
  }

  // Ghi audit log hành động kick kèm role/rank snapshot
  await ghiAuditLog(c.env, {
    actorId: gate.taiKhoan.id,
    targetId: targetAccountId,
    roomId: phongId,
    action: 'kick',
    reason,
    metadata: {
      targetActorKey,
      banFromRoom: Boolean(banFromRoom),
      authorityRank: modQuyen.authorityRank,
      role: gate.taiKhoan.role,
    },
  })

  return c.json({ ok: true, kicked: true, banned: Boolean(banFromRoom) })
}

/**
 * POST /api/rooms/:id/ban
 * Cấm một tài khoản vào phòng học vĩnh viễn (phong_ban, Scoped Authority, Live-Session Consistency)
 */
export async function banMemberFromRoom(c: Context<{ Bindings: Env }>): Promise<Response> {
  const phongId = parsePhongId(c)
  if (!phongId) return loi('ID phòng không hợp lệ.', 400)

  const gate = await kiemTraQuyenTruyCapPhong(c.req.raw, c.env, phongId)
  if (!gate.ok) return gate.response

  const callerKey = actorKey(gate.phien)
  const modQuyen = await xacDinhQuyenModeratorPhong(c.env.DB, gate.taiKhoan, gate.phongRow, callerKey)
  if (!modQuyen.canModerate) {
    return loi('Bạn không có quyền cấm thành viên vào phòng học này.', 403)
  }

  let rawBody: unknown
  try {
    rawBody = await c.req.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const parsed = RoomBanPayloadSchema.safeParse(rawBody)
  if (!parsed.success) {
    return loi(parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.', 400)
  }

  const { targetAccountId, reason } = parsed.data

  if (targetAccountId === gate.taiKhoan.id) {
    return loi('Không thể tự cấm chính mình.', 400)
  }

  const targetActorKey = `acc:${targetAccountId}`
  const targetRank = await layTargetRank(c.env.DB, targetAccountId, targetActorKey, gate.phongRow.chu_phong_khoa)

  if (modQuyen.authorityRank <= targetRank) {
    if (targetRank === 3) return loi('Không thể cấm quản trị viên trường.', 403)
    if (targetRank === 2) return loi('Không thể cấm giáo viên.', 403)
    if (targetRank === 1) return loi('Không thể cấm chủ phòng.', 403)
    return loi('Bạn không có đủ thẩm quyền để cấm thành viên này.', 403)
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO phong_ban (phong_id, tai_khoan_id, ly_do, ban_boi, tao_luc)
       VALUES (?1, ?2, ?3, ?4, datetime('now'))
       ON CONFLICT(phong_id, tai_khoan_id) DO UPDATE SET ly_do = ?3, ban_boi = ?4, tao_luc = datetime('now')`,
    )
      .bind(phongId, targetAccountId, reason || 'Bị cấm bởi người điều hành', gate.taiKhoan.id)
      .run()
  } catch (err) {
    console.error('Lỗi chèn phong_ban:', err)
    return loi('Lỗi khi lưu lệnh cấm phòng.', 500)
  }

  // Handle live session removal explicitly:
  let removedFromLiveSession = false
  let liveSessionAbsent = false
  let liveRemovalError: string | null = null

  const doId = c.env.ROOMS.idFromName('phong-' + phongId)
  const roomStub = c.env.ROOMS.get(doId)
  try {
    const kickRes = await roomStub.fetch(
      new Request('http://internal/internal/moderation/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetActorKey,
          reason: reason || 'Bị cấm vào phòng',
          byActorName: gate.taiKhoan.ten || gate.taiKhoan.username,
          byActorKey: callerKey,
        }),
      }),
    )
    const kickJson = (await kickRes.json().catch(() => null)) as {
      ok?: boolean
      removed?: boolean
      absent?: boolean
    } | null

    if (kickJson?.removed) {
      removedFromLiveSession = true
    } else if (kickJson?.absent) {
      liveSessionAbsent = true
    }
  } catch (err) {
    console.warn('Lưu ý: Không thể ngắt kết nối trực tiếp mục tiêu (RoomDO offline hoặc không phản hồi):', err)
    liveRemovalError = 'Lỗi gửi lệnh ngắt kết nối trực tiếp'
  }

  await ghiAuditLog(c.env, {
    actorId: gate.taiKhoan.id,
    targetId: targetAccountId,
    roomId: phongId,
    action: 'ban',
    reason,
    metadata: {
      authorityRank: modQuyen.authorityRank,
      role: gate.taiKhoan.role,
      removedFromLiveSession,
      liveSessionAbsent,
      liveRemovalError,
    },
  })

  return c.json({
    ok: true,
    banned: true,
    removedFromLiveSession,
    targetWasPresent: removedFromLiveSession,
    absent: liveSessionAbsent,
    liveRemovalError: liveRemovalError ?? undefined,
  })
}

/**
 * POST /api/rooms/:id/unban
 * Gỡ cấm cho một tài khoản (Enforces Authority Hierarchy: lower cannot undo higher)
 */
export async function unbanMemberFromRoom(c: Context<{ Bindings: Env }>): Promise<Response> {
  const phongId = parsePhongId(c)
  if (!phongId) return loi('ID phòng không hợp lệ.', 400)

  const gate = await kiemTraQuyenTruyCapPhong(c.req.raw, c.env, phongId)
  if (!gate.ok) return gate.response

  const callerKey = actorKey(gate.phien)
  const modQuyen = await xacDinhQuyenModeratorPhong(c.env.DB, gate.taiKhoan, gate.phongRow, callerKey)
  if (!modQuyen.canModerate) {
    return loi('Bạn không có quyền gỡ cấm cho phòng này.', 403)
  }

  let body: { targetAccountId?: number }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const targetAccountId = Number(body.targetAccountId)
  if (!Number.isInteger(targetAccountId) || targetAccountId <= 0) {
    return loi('ID tài khoản không hợp lệ.', 400)
  }

  // 1. Fetch ban record to determine banning actor and authority hierarchy
  const banRecord = await c.env.DB.prepare(
    'SELECT id, ban_boi FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2',
  )
    .bind(phongId, targetAccountId)
    .first<{ id: number; ban_boi: number | null }>()

  if (!banRecord) {
    return loi('Thành viên này không nằm trong danh sách cấm.', 404)
  }

  // 2. Determine banner's authority rank
  let bannerRank = 1 // Default Host
  if (banRecord.ban_boi === null) {
    // Unknown / null banner: fail-closed, only School Admin may unban
    bannerRank = 3
  } else {
    const bannerUser = await c.env.DB.prepare(
      'SELECT id, vai_tro, la_admin_truong, teacher_pending FROM tai_khoan_campus WHERE id = ?1',
    )
      .bind(banRecord.ban_boi)
      .first<{ id: number; vai_tro: string; la_admin_truong: number; teacher_pending: number }>()

    if (bannerUser?.la_admin_truong === 1) {
      bannerRank = 3 // Admin ban
    } else if (bannerUser?.vai_tro === 'teacher' && bannerUser?.teacher_pending === 0) {
      bannerRank = 2 // Teacher ban
    } else {
      bannerRank = 1 // Host ban
    }
  }

  // 3. Unban hierarchy check: caller must have authority rank >= bannerRank
  if (modQuyen.authorityRank < bannerRank) {
    if (bannerRank === 3) {
      return loi('Lệnh cấm này được thiết lập bởi Quản trị viên trường. Chỉ Quản trị viên mới có quyền gỡ cấm.', 403)
    }
    if (bannerRank === 2) {
      return loi('Lệnh cấm này được thiết lập bởi Giáo viên. Chủ phòng không có quyền gỡ cấm.', 403)
    }
    return loi('Bạn không có đủ thẩm quyền để gỡ lệnh cấm này.', 403)
  }

  // 4. Delete ban record
  try {
    const res = await c.env.DB.prepare(
      'DELETE FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2',
    )
      .bind(phongId, targetAccountId)
      .run()

    if (res.meta.changes === 0) {
      return loi('Thành viên này không nằm trong danh sách cấm.', 404)
    }
  } catch (err) {
    console.error('Lỗi xóa phong_ban:', err)
    return loi('Lỗi khi gỡ cấm phòng.', 500)
  }

  await ghiAuditLog(c.env, {
    actorId: gate.taiKhoan.id,
    targetId: targetAccountId,
    roomId: phongId,
    action: 'unban',
    metadata: {
      authorityRank: modQuyen.authorityRank,
      role: gate.taiKhoan.role,
      bannerId: banRecord.ban_boi,
      bannerRank,
    },
  })

  // 5. Xóa kick cooldown trong RoomDO (nếu có) để thành viên có thể vào lại ngay sau khi được gỡ cấm
  try {
    const doId = c.env.ROOMS.idFromName('phong-' + phongId)
    const roomStub = c.env.ROOMS.get(doId)
    await roomStub.fetch(
      new Request('http://internal/internal/moderation/cooldown/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorKey: `acc:${targetAccountId}` }),
      }),
    )
  } catch {}

  return c.json({ ok: true, unbanned: true })
}

/**
 * GET /api/rooms/:id/banned-members
 * Xem danh sách bị cấm của phòng (Scoped Moderator Only)
 */
export async function listBannedMembers(c: Context<{ Bindings: Env }>): Promise<Response> {
  const phongId = parsePhongId(c)
  if (!phongId) return loi('ID phòng không hợp lệ.', 400)

  const gate = await kiemTraQuyenTruyCapPhong(c.req.raw, c.env, phongId)
  if (!gate.ok) return gate.response

  const callerKey = actorKey(gate.phien)
  const modQuyen = await xacDinhQuyenModeratorPhong(c.env.DB, gate.taiKhoan, gate.phongRow, callerKey)
  if (!modQuyen.canModerate) {
    return loi('Bạn không có quyền xem danh sách cấm của phòng học này.', 403)
  }

  try {
    const rows = await c.env.DB.prepare(
      `SELECT pb.id, pb.tai_khoan_id as accountId, tk.ten_dang_nhap as username,
              COALESCE(tk.ten_hien_thi, tk.ten_dang_nhap) as displayName,
              pb.ly_do as reason, pb.ban_boi as bannedBy,
              COALESCE(bb.ten_hien_thi, bb.ten_dang_nhap) as bannedByName, pb.tao_luc as createdAt
       FROM phong_ban pb
       JOIN tai_khoan_campus tk ON pb.tai_khoan_id = tk.id
       LEFT JOIN tai_khoan_campus bb ON pb.ban_boi = bb.id
       WHERE pb.phong_id = ?1
       ORDER BY pb.id DESC`,
    )
      .bind(phongId)
      .all<BannedMemberItem>()

    return c.json({ ok: true, bannedMembers: rows.results || [] })
  } catch (err) {
    console.error('Lỗi truy vấn phong_ban:', err)
    return loi('Không thể lấy danh sách cấm phòng.', 500)
  }
}

/**
 * POST /api/reports
 * Gửi báo cáo vi phạm người dùng hoặc nội dung (Tất cả thành viên đã đăng nhập)
 */
export async function createReport(c: Context<{ Bindings: Env }>): Promise<Response> {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  // Rate-limit: Tối đa 5 báo cáo / 10 phút / tài khoản để chống flood
  const rlKey = `rate:report:${kq.taiKhoan.id}`
  const tries = parseInt((await c.env.RATE_LIMIT.get(rlKey)) || '0', 10)
  if (tries >= 5) {
    return loi('Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau 10 phút.', 429)
  }
  await c.env.RATE_LIMIT.put(rlKey, String(tries + 1), { expirationTtl: 600 })

  let rawBody: unknown
  try {
    rawBody = await c.req.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const parsed = ReportPayloadSchema.safeParse(rawBody)
  if (!parsed.success) {
    return loi(parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.', 400)
  }

  const { reportedAccountId, roomId, category, reason, contentSnippet } = parsed.data

  if (reportedAccountId === kq.taiKhoan.id) {
    return loi('Không thể tự báo cáo chính mình.', 400)
  }

  try {
    const res = await c.env.DB.prepare(
      `INSERT INTO reports (reporter_id, reported_id, room_id, category, reason, content_snippet, status, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'pending', ?7)`,
    )
      .bind(
        kq.taiKhoan.id,
        reportedAccountId ?? null,
        roomId ?? null,
        category,
        reason,
        contentSnippet ?? null,
        Date.now(),
      )
      .run()

    return c.json({
      ok: true,
      reportId: res.meta.last_row_id,
      message: 'Báo cáo vi phạm đã được ghi nhận. Ban kiểm duyệt sẽ xem xét xử lý.',
    })
  } catch (err) {
    console.error('Lỗi tạo report:', err)
    return loi('Không thể gửi báo cáo vi phạm.', 500)
  }
}

/**
 * GET /api/reports
 * Xem danh sách báo cáo (Chỉ dành cho Giáo viên trong phạm vi lớp hoặc School Admin)
 */
export async function listReports(c: Context<{ Bindings: Env }>): Promise<Response> {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const isAdmin = laQuanTriTruong(kq.taiKhoan)
  const isTeacher = laGiaoVienDaDuyet(kq.taiKhoan)
  if (!isAdmin && !isTeacher) {
    return loi('Chỉ giáo viên và quản trị viên mới có quyền xem danh sách báo cáo.', 403)
  }

  const statusFilter = c.req.query('status') || null

  try {
    let baseQuery = `
      SELECT r.id, r.reporter_id as reporterId, COALESCE(rep.ten_hien_thi, rep.ten_dang_nhap) as reporterName,
             r.reported_id as reportedId, tgt.ten_dang_nhap as reportedUsername, COALESCE(tgt.ten_hien_thi, tgt.ten_dang_nhap) as reportedName,
             tgt.lop_id as reportedLopId,
             r.room_id as roomId, p.ten as roomTitle, p.lop_id as roomLopId,
             r.category, r.reason, r.content_snippet as contentSnippet,
             r.status, r.resolved_by as resolvedBy, COALESCE(res.ten_hien_thi, res.ten_dang_nhap) as resolvedByName,
             r.resolution_note as resolutionNote, r.created_at as createdAt, r.resolved_at as resolvedAt
      FROM reports r
      LEFT JOIN tai_khoan_campus rep ON r.reporter_id = rep.id
      LEFT JOIN tai_khoan_campus tgt ON r.reported_id = tgt.id
      LEFT JOIN phong p ON r.room_id = p.id
      LEFT JOIN tai_khoan_campus res ON r.resolved_by = res.id
    `

    const whereClauses: string[] = []
    const bindings: unknown[] = []

    if (statusFilter) {
      bindings.push(statusFilter)
      whereClauses.push(`r.status = ?${bindings.length}`)
    }

    if (!isAdmin) {
      // Teacher: scoped strictly to assigned classes
      const phamVi = await layPhamViQuanTri(c.env.DB, kq.taiKhoan)
      const lopIds = phamVi.lopIds || []
      if (lopIds.length === 0) {
        return c.json({ ok: true, reports: [] })
      }

      const placeholders = lopIds.map((_, i) => `?${bindings.length + i + 1}`).join(', ')
      bindings.push(...lopIds)
      whereClauses.push(`(tgt.lop_id IN (${placeholders}) OR p.lop_id IN (${placeholders}))`)
    }

    if (whereClauses.length > 0) {
      baseQuery += ' WHERE ' + whereClauses.join(' AND ')
    }

    baseQuery += ' ORDER BY r.id DESC LIMIT 100'
    const stmt = c.env.DB.prepare(baseQuery)
    const rows = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all()
    return c.json({ ok: true, reports: rows.results || [] })
  } catch (err) {
    console.error('Lỗi lấy reports:', err)
    return loi('Không thể truy xuất danh sách báo cáo.', 500)
  }
}

/**
 * POST /api/reports/:id/resolve
 * Xử lý hoặc đóng báo cáo vi phạm (Chỉ dành cho Giáo viên được phân công hoặc School Admin - Anti-IDOR)
 */
export async function resolveReport(c: Context<{ Bindings: Env }>): Promise<Response> {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const isAdmin = laQuanTriTruong(kq.taiKhoan)
  const isTeacher = laGiaoVienDaDuyet(kq.taiKhoan)
  if (!isAdmin && !isTeacher) {
    return loi('Chỉ giáo viên và quản trị viên mới có quyền xử lý báo cáo.', 403)
  }

  const reportId = parseInt(c.req.param('id') || '', 10)
  if (!reportId || reportId <= 0) return loi('ID báo cáo không hợp lệ.', 400)

  let body: { status?: string; resolutionNote?: string }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const validStatuses = new Set(['reviewed', 'actioned', 'dismissed'])
  if (!body.status || !validStatuses.has(body.status)) {
    return loi('Trạng thái xử lý không hợp lệ.', 400)
  }

  // Anti-IDOR: Fetch the exact report and verify scope
  const report = await c.env.DB.prepare(
    `SELECT r.id, r.reported_id as reportedId, r.room_id as roomId,
            tgt.lop_id as reportedLopId, p.lop_id as roomLopId
     FROM reports r
     LEFT JOIN tai_khoan_campus tgt ON r.reported_id = tgt.id
     LEFT JOIN phong p ON r.room_id = p.id
     WHERE r.id = ?1`,
  )
    .bind(reportId)
    .first<{
      id: number
      reportedId: number | null
      roomId: number | null
      reportedLopId: number | null
      roomLopId: number | null
    }>()

  if (!report) {
    return loi('Không tìm thấy báo cáo vi phạm.', 404)
  }

  if (!isAdmin) {
    const phamVi = await layPhamViQuanTri(c.env.DB, kq.taiKhoan)
    const lopIds = phamVi.lopIds || []
    const matchTarget = report.reportedLopId != null && lopIds.includes(report.reportedLopId)
    const matchRoom = report.roomLopId != null && lopIds.includes(report.roomLopId)

    if (!matchTarget && !matchRoom) {
      return loi('Bạn không có quyền xử lý báo cáo này (ngoài phạm vi lớp được phân công).', 403)
    }
  }

  try {
    const updateRes = await c.env.DB.prepare(
      `UPDATE reports
       SET status = ?1, resolution_note = ?2, resolved_by = ?3, resolved_at = ?4
       WHERE id = ?5`,
    )
      .bind(body.status, body.resolutionNote || null, kq.taiKhoan.id, Date.now(), reportId)
      .run()

    if (updateRes.meta.changes === 0) {
      return loi('Không tìm thấy báo cáo vi phạm.', 404)
    }

    await ghiAuditLog(c.env, {
      actorId: kq.taiKhoan.id,
      targetId: report.reportedId,
      roomId: report.roomId,
      action: 'report_resolved',
      reason: body.resolutionNote,
      metadata: {
        reportId,
        status: body.status,
        reportedLopId: report.reportedLopId,
        roomLopId: report.roomLopId,
        authorityRole: isAdmin ? 'admin' : 'teacher',
      },
    })

    return c.json({ ok: true, resolved: true })
  } catch (err) {
    console.error('Lỗi resolve report:', err)
    return loi('Lỗi khi cập nhật trạng thái báo cáo.', 500)
  }
}

/**
 * GET /api/moderation/audit-logs
 * Xem nhật ký kiểm duyệt (Chỉ dành cho Giáo viên trong phạm vi lớp hoặc School Admin)
 */
export async function listAuditLogs(c: Context<{ Bindings: Env }>): Promise<Response> {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const isAdmin = laQuanTriTruong(kq.taiKhoan)
  const isTeacher = laGiaoVienDaDuyet(kq.taiKhoan)
  if (!isAdmin && !isTeacher) {
    return loi('Chỉ giáo viên và quản trị viên mới có quyền xem nhật ký kiểm duyệt.', 403)
  }

  try {
    let baseQuery = `
      SELECT a.id, a.actor_id as actorId, COALESCE(act.ten_hien_thi, act.ten_dang_nhap) as actorName, act.ten_dang_nhap as actorUsername,
             a.target_id as targetId, COALESCE(tgt.ten_hien_thi, tgt.ten_dang_nhap) as targetName, tgt.ten_dang_nhap as targetUsername,
             tgt.lop_id as targetLopId,
             a.room_id as roomId, p.ten as roomTitle, p.lop_id as roomLopId,
             a.action, a.reason, a.metadata, a.created_at as createdAt
      FROM moderation_audit_logs a
      LEFT JOIN tai_khoan_campus act ON a.actor_id = act.id
      LEFT JOIN tai_khoan_campus tgt ON a.target_id = tgt.id
      LEFT JOIN phong p ON a.room_id = p.id
    `

    const bindings: unknown[] = []

    if (!isAdmin) {
      const phamVi = await layPhamViQuanTri(c.env.DB, kq.taiKhoan)
      const lopIds = phamVi.lopIds || []
      if (lopIds.length === 0) {
        return c.json({ ok: true, auditLogs: [] })
      }
      const placeholders = lopIds.map((_, i) => `?${i + 1}`).join(', ')
      bindings.push(...lopIds)
      baseQuery += ` WHERE (tgt.lop_id IN (${placeholders}) OR p.lop_id IN (${placeholders}))`
    }

    baseQuery += ' ORDER BY a.id DESC LIMIT 100'
    const stmt = c.env.DB.prepare(baseQuery)
    const rows = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all()

    return c.json({ ok: true, auditLogs: rows.results || [] })
  } catch (err) {
    console.error('Lỗi truy vấn audit-logs:', err)
    return loi('Không thể truy xuất nhật ký kiểm duyệt.', 500)
  }
}
