// Digital Campus v2: Milestone A1 — Admin Control Plane & Room Lifecycle Management
// worker/routes/admin-api.ts — School Admin Authority Control Plane API

import { Hono, type Context } from 'hono'
import { layPhien, kiemTraPhien, type TaiKhoan } from '../lib/session'
import { laQuanTriTruong } from '../lib/scope'
import {
  getRoomLifecyclePolicy,
  updateRoomLifecyclePolicy,
  closeStudyRoomCanonical,
} from '../services/room-lifecycle'
import {
  CloseRoomPayloadSchema,
  UpdateRoomPolicyPayloadSchema,
  type AdminRoomItem,
} from '../../shared/protocol/room'
import { recordAnalyticsEvent } from '../lib/analytics'

export const adminRouter = new Hono<{ Bindings: Env }>()

function loi(thongBao: string, maLoi = 400): Response {
  return new Response(JSON.stringify({ ok: false, error: thongBao, loi: thongBao }), {
    status: maLoi,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Gate xác thực quyền Quản trị viên Trường học (School Admin RBAC)
 * FAIL-CLOSED: Bất kỳ trường hợp nào không thỏa mãn đều từ chối 401 hoặc 403.
 * Tuyệt đối không tin tưởng client role, React state, query params hay headers.
 */
export async function requireSchoolAdmin(
  c: Context<{ Bindings: Env }>,
): Promise<{ ok: true; admin: TaiKhoan } | { ok: false; response: Response }> {
  const phienData = await layPhien(c.req.raw, c.env)
  const kq = await kiemTraPhien(phienData, c.env)
  if (!kq.hopLe) {
    return { ok: false, response: loi(kq.thongBao, 401) }
  }

  if (!laQuanTriTruong(kq.taiKhoan)) {
    return {
      ok: false,
      response: loi('Chỉ quản trị viên nhà trường mới có quyền truy cập bảng điều khiển vận hành.', 403),
    }
  }

  return { ok: true, admin: kq.taiKhoan }
}

/**
 * GET /api/admin/rooms
 * Danh mục toàn bộ phòng học (bão hòa/phân trang, có bộ lọc và tìm kiếm)
 */
adminRouter.get('/rooms', async (c) => {
  const auth = await requireSchoolAdmin(c)
  if (!auth.ok) return auth.response

  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10) || 20))
  const offset = (page - 1) * limit
  const status = c.req.query('status') || 'all'
  const q = (c.req.query('q') || '').trim()
  const lopIdParam = c.req.query('lopId')
  const chuPhongIdParam = c.req.query('chuPhongId')

  const conditions: string[] = ["p.loai = 'video'"]
  const params: unknown[] = []

  if (status === 'mo') {
    conditions.push("p.trang_thai = 'mo'")
  } else if (status === 'closing') {
    conditions.push("p.trang_thai = 'closing'")
  } else if (status === 'dong') {
    conditions.push("p.trang_thai = 'dong'")
  } else if (status === 'never_joined') {
    conditions.push("p.trang_thai = 'mo' AND p.ever_joined = 0")
  } else if (status === 'empty') {
    conditions.push("p.trang_thai = 'mo' AND p.last_participant_left_at IS NOT NULL")
  }

  if (q) {
    conditions.push('(p.ten LIKE ? OR p.chu_phong_ten LIKE ?)')
    params.push(`%${q}%`, `%${q}%`)
  }

  if (lopIdParam) {
    const lopId = parseInt(lopIdParam, 10)
    if (Number.isFinite(lopId)) {
      conditions.push('p.lop_id = ?')
      params.push(lopId)
    }
  }

  if (chuPhongIdParam) {
    const cpId = parseInt(chuPhongIdParam, 10)
    if (Number.isFinite(cpId)) {
      conditions.push('p.chu_phong_khoa = ?')
      params.push(`acc:${cpId}`)
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    // 1. Đếm tổng số lượng bản ghi thỏa mãn điều kiện
    const countSql = `SELECT COUNT(*) AS total FROM phong p ${whereClause}`
    const countStmt = c.env.DB.prepare(countSql)
    const countRow = await (params.length > 0 ? countStmt.bind(...params) : countStmt).first<{ total: number }>()
    const total = countRow?.total ?? 0

    // 2. Lấy danh sách phân trang
    const listSql = `
      SELECT p.id, p.ten, p.mo_ta, p.pham_vi, p.lop_id, p.access_mode, p.suc_chua, p.trang_thai,
             p.chu_phong_khoa, p.chu_phong_ten,
             p.created_at, p.last_activity_at, p.last_join_at, p.last_participant_left_at,
             p.ever_joined, p.closing_at, p.closed_at, p.closed_by, p.close_reason, p.lifecycle_revision,
             p.tao_luc, p.cap_nhat_luc,
             l.ten AS ten_lop
      FROM phong p
      LEFT JOIN lop l ON p.lop_id = l.id
      ${whereClause}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `
    const listStmt = c.env.DB.prepare(listSql)
    const queryParams = [...params, limit, offset]
    const rows = await listStmt.bind(...queryParams).all<{
      id: number
      ten: string
      mo_ta: string | null
      pham_vi: string
      lop_id: number | null
      access_mode: string
      suc_chua: number
      trang_thai: string
      chu_phong_khoa: string
      chu_phong_ten: string
      created_at: number | null
      last_activity_at: number | null
      last_join_at: number | null
      last_participant_left_at: number | null
      ever_joined: number
      closing_at: number | null
      closed_at: number | null
      closed_by: number | null
      close_reason: string | null
      lifecycle_revision: number
      tao_luc: string
      cap_nhat_luc: string
      ten_lop: string | null
    }>()

    // 3. Đọc cấu hình chính sách hiện tại để tính toán auto_close_deadline
    const policy = await getRoomLifecyclePolicy(c.env.DB)
    const now = Date.now()

    const rooms: AdminRoomItem[] = (rows.results || []).map((r) => {
      let chuPhongId = 0
      if (r.chu_phong_khoa.startsWith('acc:')) {
        chuPhongId = parseInt(r.chu_phong_khoa.slice(4), 10) || 0
      }

      const createdAt = r.created_at ?? (new Date(r.tao_luc).getTime() || now)
      const everJoined = Boolean(r.ever_joined)

      let autoCloseDeadline: number | null = null
      if (r.trang_thai === 'mo' && policy.autoCloseEnabled) {
        if (!everJoined && policy.neverJoinedTtlMinutes > 0) {
          autoCloseDeadline = createdAt + policy.neverJoinedTtlMinutes * 60 * 1000
        } else if (r.last_participant_left_at && policy.emptyRoomTtlMinutes > 0) {
          autoCloseDeadline = r.last_participant_left_at + policy.emptyRoomTtlMinutes * 60 * 1000
        } else if (policy.maxRoomLifetimeMinutes > 0) {
          autoCloseDeadline = createdAt + policy.maxRoomLifetimeMinutes * 60 * 1000
        }
      }

      const lifecycleStatus: AdminRoomItem['lifecycleStatus'] =
        r.trang_thai === 'closing' ? 'closing' : r.trang_thai === 'dong' ? 'closed' : 'open'

      return {
        id: r.id,
        name: r.ten,
        description: r.mo_ta,
        ownerAccountId: chuPhongId,
        ownerKey: r.chu_phong_khoa,
        ownerDisplayName: r.chu_phong_ten,
        scope: r.pham_vi as AdminRoomItem['scope'],
        classId: r.lop_id,
        accessMode: r.access_mode as AdminRoomItem['accessMode'],
        capacity: r.suc_chua,
        lifecycleStatus,
        rawStatus: r.trang_thai,
        createdAt,
        lastActivityAt: r.last_activity_at,
        lastJoinAt: r.last_join_at,
        lastParticipantLeftAt: r.last_participant_left_at,
        everJoined,
        closingAt: r.closing_at,
        closedAt: r.closed_at,
        closedBy: r.closed_by,
        closeReason: r.close_reason,
        lifecycleRevision: r.lifecycle_revision,
        roomAgeMinutes: Math.max(0, Math.floor((now - createdAt) / 60000)),
        autoCloseDeadline,
      } satisfies AdminRoomItem
    })

    // 4. Đếm số lượng tổng quan nhanh
    const statsRow = await c.env.DB.prepare(`
      SELECT
        SUM(CASE WHEN trang_thai = 'mo' THEN 1 ELSE 0 END) AS openCount,
        SUM(CASE WHEN trang_thai = 'closing' THEN 1 ELSE 0 END) AS closingCount,
        SUM(CASE WHEN trang_thai = 'dong' AND closed_at >= ?1 THEN 1 ELSE 0 END) AS closedTodayCount,
        SUM(CASE WHEN trang_thai = 'mo' AND ever_joined = 0 THEN 1 ELSE 0 END) AS neverJoinedCount
      FROM phong WHERE loai = 'video'
    `)
      .bind(now - 24 * 60 * 60 * 1000)
      .first<{
        openCount: number
        closingCount: number
        closedTodayCount: number
        neverJoinedCount: number
      }>()

    return c.json({
      ok: true,
      rooms,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        openCount: statsRow?.openCount ?? 0,
        closingCount: statsRow?.closingCount ?? 0,
        closedTodayCount: statsRow?.closedTodayCount ?? 0,
        neverJoinedCount: statsRow?.neverJoinedCount ?? 0,
      },
    })
  } catch (err: any) {
    console.error('[AdminAPI.rooms] Lỗi tra cứu danh sách phòng:', err)
    return loi('Lỗi cơ sở dữ liệu khi truy vấn danh sách phòng: ' + (err.message || String(err)), 500)
  }
})

/**
 * GET /api/admin/rooms/:id
 * Xem chi tiết phòng học + trạng thái RoomDO live nếu đang mở
 */
adminRouter.get('/rooms/:id', async (c) => {
  const auth = await requireSchoolAdmin(c)
  if (!auth.ok) return auth.response

  const roomId = parseInt(c.req.param('id'), 10)
  if (!roomId || roomId <= 0) return loi('ID phòng không hợp lệ.', 400)

  try {
    const row = await c.env.DB.prepare(`
      SELECT p.*, l.ten AS ten_lop
      FROM phong p
      LEFT JOIN lop l ON p.lop_id = l.id
      WHERE p.id = ?1 AND p.loai = 'video'
    `)
      .bind(roomId)
      .first<any>()

    if (!row) return loi('Không tìm thấy phòng học.', 404)

    let liveState: any = null
    if (row.trang_thai === 'mo' || row.trang_thai === 'closing') {
      try {
        const doId = c.env.ROOMS.idFromName(`phong-${roomId}`)
        const stub = c.env.ROOMS.get(doId)
        const doRes = await stub.fetch('http://room.internal/internal/lifecycle/state')
        if (doRes.ok) {
          liveState = await doRes.json()
        }
      } catch (doErr) {
        console.warn(`[AdminAPI.rooms/:id] Không thể đọc live state từ RoomDO phòng ${roomId}:`, doErr)
      }
    }

    return c.json({
      ok: true,
      room: row,
      liveState,
    })
  } catch (err: any) {
    console.error(`[AdminAPI.rooms/:id] Lỗi đọc chi tiết phòng ${roomId}:`, err)
    return loi('Lỗi cơ sở dữ liệu khi tra cứu phòng học.', 500)
  }
})

/**
 * POST /api/admin/rooms/:id/close
 * Quản trị viên trường học cưỡng chế đóng phòng học (Force Close Any Room)
 */
adminRouter.post('/rooms/:id/close', async (c) => {
  const auth = await requireSchoolAdmin(c)
  if (!auth.ok) return auth.response

  const roomId = parseInt(c.req.param('id'), 10)
  if (!roomId || roomId <= 0) return loi('ID phòng không hợp lệ.', 400)

  let body: { reason?: string; note?: string } = {}
  try {
    const raw = await c.req.json()
    const parsed = CloseRoomPayloadSchema.safeParse(raw)
    if (parsed.success) {
      body = parsed.data
    }
  } catch {}

  const humanNote = body.note || body.reason || null

  const res = await closeStudyRoomCanonical(
    c.env,
    roomId,
    {
      type: 'admin',
      accountId: auth.admin.id,
      name: auth.admin.ten || auth.admin.username,
    },
    'admin_closed',
    humanNote,
  )

  if (!res.ok) {
    if (res.notFound) {
      return loi('Không tìm thấy phòng học.', 404)
    }
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

  if (res.alreadyClosed) {
    return c.json(
      {
        ok: false,
        alreadyClosed: true,
        error: 'Phòng học này đã đóng trước đó.',
      },
      409,
    )
  }

  // Analytics event
  if (c.env.ANALYTICS_DB) {
    try {
      void recordAnalyticsEvent(c.env.ANALYTICS_DB, c.executionCtx, {
        event: 'admin.room.force_closed',
        actorId: auth.admin.id,
        roomId,
        properties: {
          reason: 'admin_closed',
          note: humanNote,
          closedSocketsCount: res.closedSocketsCount ?? 0,
        },
      })
    } catch {}
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
 * GET /api/admin/room-policy
 * Xem chính sách dọn dẹp phòng học hiện hành
 */
adminRouter.get('/room-policy', async (c) => {
  const auth = await requireSchoolAdmin(c)
  if (!auth.ok) return auth.response

  const policy = await getRoomLifecyclePolicy(c.env.DB)
  return c.json({ ok: true, policy })
})

/**
 * PUT /api/admin/room-policy
 * Cập nhật chính sách dọn dẹp phòng học của toàn trường
 */
adminRouter.put('/room-policy', async (c) => {
  const auth = await requireSchoolAdmin(c)
  if (!auth.ok) return auth.response

  let rawBody: unknown
  try {
    rawBody = await c.req.json()
  } catch {
    return loi('Dữ liệu JSON không hợp lệ.', 400)
  }

  const parsed = UpdateRoomPolicyPayloadSchema.safeParse(rawBody)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || 'Dữ liệu cấu hình không hợp lệ.'
    return loi(issue, 400)
  }

  const res = await updateRoomLifecyclePolicy(c.env.DB, auth.admin, parsed.data, c.env)
  if (!res.ok) {
    const isConflict = res.error?.includes('Xung đột')
    return loi(res.error || 'Cập nhật chính sách thất bại.', isConflict ? 409 : 400)
  }

  if (c.env.ANALYTICS_DB) {
    try {
      void recordAnalyticsEvent(c.env.ANALYTICS_DB, c.executionCtx, {
        event: 'admin.room_policy.updated',
        actorId: auth.admin.id,
        properties: {
          revision: res.policy?.revision,
          autoCloseEnabled: res.policy?.autoCloseEnabled,
        },
      })
    } catch {}
  }

  return c.json({
    ok: true,
    policy: res.policy,
    message: 'Cập nhật chính sách dọn dẹp phòng học thành công.',
  })
})

/**
 * GET /api/admin/audit-logs
 * Xem nhật ký kiểm duyệt & kiểm toán hệ thống (Audit Logs)
 */
adminRouter.get('/audit-logs', async (c) => {
  const auth = await requireSchoolAdmin(c)
  if (!auth.ok) return auth.response

  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10) || 20))
  const offset = (page - 1) * limit
  const action = c.req.query('action') || ''
  const roomIdParam = c.req.query('roomId')

  const conditions: string[] = []
  const params: unknown[] = []

  if (action) {
    conditions.push('a.action = ?')
    params.push(action)
  }

  if (roomIdParam) {
    const rid = parseInt(roomIdParam, 10)
    if (Number.isFinite(rid)) {
      conditions.push('a.room_id = ?')
      params.push(rid)
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    const countSql = `SELECT COUNT(*) AS total FROM moderation_audit_logs a ${whereClause}`
    const countStmt = c.env.DB.prepare(countSql)
    const countRow = await (params.length > 0 ? countStmt.bind(...params) : countStmt).first<{ total: number }>()
    const total = countRow?.total ?? 0

    const listSql = `
      SELECT a.id, a.actor_id AS actorId,
             COALESCE(act.ten_hien_thi, act.ten_dang_nhap) AS actorName,
             act.ten_dang_nhap AS actorUsername,
             a.target_id AS targetId,
             COALESCE(tgt.ten_hien_thi, tgt.ten_dang_nhap) AS targetName,
             tgt.ten_dang_nhap AS targetUsername,
             a.room_id AS roomId,
             p.ten AS roomTitle,
             a.action, a.reason, a.metadata, a.created_at AS createdAt
      FROM moderation_audit_logs a
      LEFT JOIN tai_khoan_campus act ON a.actor_id = act.id
      LEFT JOIN tai_khoan_campus tgt ON a.target_id = tgt.id
      LEFT JOIN phong p ON a.room_id = p.id
      ${whereClause}
      ORDER BY a.id DESC
      LIMIT ? OFFSET ?
    `
    const listStmt = c.env.DB.prepare(listSql)
    const queryParams = [...params, limit, offset]
    const rows = await listStmt.bind(...queryParams).all<any>()

    return c.json({
      ok: true,
      logs: rows.results || [],
      total,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (err: any) {
    console.error('[AdminAPI.audit-logs] Lỗi tra cứu nhật ký kiểm toán:', err)
    return loi('Lỗi cơ sở dữ liệu khi tra cứu nhật ký kiểm toán.', 500)
  }
})
