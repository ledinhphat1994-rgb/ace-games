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
import { msTuD1 } from '../lib/thoi-gian'
import { TEN_CAMPUS } from '../campus/danh-tinh'
import { ghiAuditLog } from './moderation-api'
import {
  HanhDongTaiKhoanSchema,
  LOC_TAI_KHOAN,
  type AdminAccountCounts,
  type AdminAccountItem,
  type HanhDongTaiKhoan,
  type LocTaiKhoan,
} from '../../shared/protocol/admin-accounts'

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
             p.lifecycle_auto_close_enabled, p.lifecycle_never_joined_ttl_minutes,
             p.lifecycle_empty_room_ttl_minutes, p.lifecycle_max_lifetime_minutes,
             p.lifecycle_policy_revision,
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
      lifecycle_auto_close_enabled?: number | null
      lifecycle_never_joined_ttl_minutes?: number | null
      lifecycle_empty_room_ttl_minutes?: number | null
      lifecycle_max_lifetime_minutes?: number | null
      lifecycle_policy_revision?: number | null
      tao_luc: string
      cap_nhat_luc: string
      ten_lop: string | null
    }>()

    // 3. Tính toán auto_close_deadline từ chính sách snapshot của từng phòng
    const now = Date.now()

    const rooms: AdminRoomItem[] = (rows.results || []).map((r) => {
      let chuPhongId = 0
      if (r.chu_phong_khoa.startsWith('acc:')) {
        chuPhongId = parseInt(r.chu_phong_khoa.slice(4), 10) || 0
      }

      const createdAt = r.created_at ?? (new Date(r.tao_luc).getTime() || now)
      const everJoined = Boolean(r.ever_joined)

      const autoCloseEnabled = Boolean(r.lifecycle_auto_close_enabled ?? 1)
      const neverJoinedTtl = r.lifecycle_never_joined_ttl_minutes ?? 5
      const emptyRoomTtl = r.lifecycle_empty_room_ttl_minutes ?? 15
      const maxRoomLifetime = r.lifecycle_max_lifetime_minutes ?? 480
      const policyRevision = r.lifecycle_policy_revision ?? 1

      let autoCloseDeadline: number | null = null
      if (r.trang_thai === 'mo' && autoCloseEnabled) {
        if (!everJoined && neverJoinedTtl > 0) {
          autoCloseDeadline = createdAt + neverJoinedTtl * 60 * 1000
        } else if (r.last_participant_left_at && emptyRoomTtl > 0) {
          autoCloseDeadline = r.last_participant_left_at + emptyRoomTtl * 60 * 1000
        } else if (maxRoomLifetime > 0) {
          autoCloseDeadline = createdAt + maxRoomLifetime * 60 * 1000
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
        effectivePolicyRevision: policyRevision,
        effectiveNeverJoinedTtl: neverJoinedTtl,
        effectiveEmptyRoomTtl: emptyRoomTtl,
        effectiveMaxLifetime: maxRoomLifetime,
        effectiveAutoCloseEnabled: autoCloseEnabled,
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

    const effectivePolicyRevision = row.lifecycle_policy_revision ?? 1
    const effectiveNeverJoinedTtl = row.lifecycle_never_joined_ttl_minutes ?? 5
    const effectiveEmptyRoomTtl = row.lifecycle_empty_room_ttl_minutes ?? 15
    const effectiveMaxLifetime = row.lifecycle_max_lifetime_minutes ?? 480
    const effectiveAutoCloseEnabled = Boolean(row.lifecycle_auto_close_enabled ?? 1)

    return c.json({
      ok: true,
      room: {
        ...row,
        effectivePolicyRevision,
        effectiveNeverJoinedTtl,
        effectiveEmptyRoomTtl,
        effectiveMaxLifetime,
        effectiveAutoCloseEnabled,
      },
      effectivePolicyRevision,
      effectiveNeverJoinedTtl,
      effectiveEmptyRoomTtl,
      effectiveMaxLifetime,
      effectiveAutoCloseEnabled,
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

// ─── Quản lý tài khoản (docs/contracts/account-administration-v1.md) ─────────

interface DongTaiKhoanQuanTri {
  id: number
  username: string
  displayName: string | null
  role: string | null
  teacherPending: number | null
  active: number | null
  isSchoolAdmin: number | null
  lopId: number | null
  lopTen: string | null
  googleEmail: string | null
  createdAt: string | null
}

const COT_TAI_KHOAN = `tk.id, tk.ten_dang_nhap AS username, tk.ten_hien_thi AS displayName, tk.vai_tro AS role,
       tk.teacher_pending AS teacherPending, tk.dang_hoat_dong AS active, tk.la_admin_truong AS isSchoolAdmin,
       tk.lop_id AS lopId, l.ten AS lopTen, tk.tao_luc AS createdAt,
       (SELECT g.email FROM lien_ket_google g WHERE g.account_id = tk.id) AS googleEmail`

// Tài khoản kỹ thuật `system` (actor của audit trail) không phải người dùng: không liệt kê, không thao tác.
const LA_NGUOI_DUNG = "tk.ten_dang_nhap != 'system'"
const DIEU_KIEN_GV_CHO_DUYET =
  "tk.vai_tro = 'teacher' AND tk.teacher_pending = 1 AND tk.dang_hoat_dong = 1 AND tk.la_admin_truong = 0"

function sangTaiKhoan(r: DongTaiKhoanQuanTri): AdminAccountItem {
  return {
    id: r.id,
    username: r.username,
    displayName: r.displayName || r.username,
    role: r.role === 'teacher' ? 'teacher' : 'student',
    teacherPending: r.teacherPending === 1,
    active: r.active === 1,
    isSchoolAdmin: r.isSchoolAdmin === 1,
    lopId: r.lopId,
    lopTen: r.lopTen,
    googleEmail: r.googleEmail,
    createdAt: msTuD1(r.createdAt),
  }
}

/**
 * GET /api/admin/accounts
 * Danh sách tài khoản Campus (tìm theo tên / tên đăng nhập, lọc vai trò / trạng thái, phân trang).
 */
adminRouter.get('/accounts', async (c) => {
  const auth = await requireSchoolAdmin(c)
  if (!auth.ok) return auth.response

  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10) || 20))
  const offset = (page - 1) * limit
  const locRaw = c.req.query('filter') || 'all'
  const loc: LocTaiKhoan = (LOC_TAI_KHOAN as readonly string[]).includes(locRaw) ? (locRaw as LocTaiKhoan) : 'all'
  const q = (c.req.query('q') || '').trim().slice(0, 64)

  const conditions: string[] = [LA_NGUOI_DUNG]
  const params: unknown[] = []
  if (loc === 'pending_teacher') conditions.push(DIEU_KIEN_GV_CHO_DUYET)
  else if (loc === 'teacher') conditions.push("tk.vai_tro = 'teacher' AND tk.teacher_pending = 0")
  else if (loc === 'student') conditions.push("tk.vai_tro = 'student'")
  else if (loc === 'locked') conditions.push('tk.dang_hoat_dong = 0')
  if (q) {
    conditions.push('(tk.ten_hien_thi LIKE ? OR tk.ten_dang_nhap LIKE ?)')
    params.push(`%${q}%`, `%${q.toLowerCase()}%`)
  }
  const where = `WHERE ${conditions.join(' AND ')}`

  try {
    const [countRow, rows, counts] = await Promise.all([
      c.env.DB.prepare(`SELECT COUNT(*) AS total FROM tai_khoan_campus tk ${where}`)
        .bind(...params)
        .first<{ total: number }>(),
      c.env.DB.prepare(
        `SELECT ${COT_TAI_KHOAN}
           FROM tai_khoan_campus tk LEFT JOIN lop l ON l.id = tk.lop_id
           ${where}
          ORDER BY tk.id DESC
          LIMIT ? OFFSET ?`,
      )
        .bind(...params, limit, offset)
        .all<DongTaiKhoanQuanTri>(),
      c.env.DB.prepare(
        `SELECT SUM(CASE WHEN ${DIEU_KIEN_GV_CHO_DUYET} THEN 1 ELSE 0 END) AS pendingTeacher,
                SUM(CASE WHEN tk.dang_hoat_dong = 0 THEN 1 ELSE 0 END) AS locked,
                COUNT(*) AS total
           FROM tai_khoan_campus tk WHERE ${LA_NGUOI_DUNG}`,
      ).first<{ pendingTeacher: number | null; locked: number | null; total: number }>(),
    ])
    const total = countRow?.total ?? 0
    return c.json({
      ok: true,
      accounts: (rows.results ?? []).map(sangTaiKhoan),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
      counts: {
        pendingTeacher: counts?.pendingTeacher ?? 0,
        locked: counts?.locked ?? 0,
        total: counts?.total ?? 0,
      } satisfies AdminAccountCounts,
    })
  } catch (err) {
    console.error('[AdminAPI.accounts] Lỗi tra cứu tài khoản:', err)
    return loi('Lỗi cơ sở dữ liệu khi tra cứu tài khoản.', 500)
  }
})

/**
 * POST /api/admin/accounts/:id/action   { action: 'approve_teacher' | 'reject_teacher' | 'grant_teacher' | 'lock' | 'unlock' }
 * - Duyệt/từ chối chỉ với tài khoản còn hoạt động, đang chờ duyệt giáo viên, không phải quản trị viên.
 *   Từ chối đưa tài khoản về học sinh (vẫn dùng Campus được), không khoá.
 * - Cấp quyền giáo viên: nâng tài khoản học sinh đang hoạt động lên giáo viên đã duyệt (form đăng ký chỉ tạo học sinh).
 * - Không tự khoá, không khoá/mở khoá quản trị viên. Khoá xong ngắt ngay mọi kết nối Campus/phòng đang mở.
 * - UPDATE kèm đúng trạng thái đã kiểm tra: đổi cạnh tranh → 409 (cần tải lại).
 */
adminRouter.post('/accounts/:id/action', async (c) => {
  const auth = await requireSchoolAdmin(c)
  if (!auth.ok) return auth.response

  const accountId = parseInt(c.req.param('id'), 10)
  if (!Number.isInteger(accountId) || accountId <= 0) return loi('ID tài khoản không hợp lệ.', 400)

  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    return loi('Dữ liệu JSON không hợp lệ.', 400)
  }
  const parsed = HanhDongTaiKhoanSchema.safeParse(raw)
  if (!parsed.success) return loi('Thao tác không hợp lệ.', 400)
  const { action } = parsed.data

  let target: DongTaiKhoanQuanTri | null
  try {
    target = await c.env.DB.prepare(
      `SELECT ${COT_TAI_KHOAN} FROM tai_khoan_campus tk LEFT JOIN lop l ON l.id = tk.lop_id
        WHERE tk.id = ?1 AND ${LA_NGUOI_DUNG}`,
    )
      .bind(accountId)
      .first<DongTaiKhoanQuanTri>()
  } catch (err) {
    console.error('[AdminAPI.accounts/action] Lỗi đọc tài khoản:', err)
    return loi('Lỗi cơ sở dữ liệu khi tra cứu tài khoản.', 500)
  }
  if (!target) return loi('Không tìm thấy tài khoản.', 404)

  const tk = sangTaiKhoan(target)
  if (tk.isSchoolAdmin) return loi('Không thể thay đổi tài khoản quản trị viên trường.', 403)
  if (action === 'lock' && tk.id === auth.admin.id) return loi('Bạn không thể tự khoá tài khoản của mình.', 403)

  const nguoiDuyet = `acc:${auth.admin.id}`
  let sql: string
  let binds: unknown[]
  switch (action) {
    case 'approve_teacher':
    case 'reject_teacher':
      if (!(tk.role === 'teacher' && tk.teacherPending && tk.active)) {
        return loi('Tài khoản này không có yêu cầu giáo viên đang chờ duyệt.', 409)
      }
      sql = `UPDATE tai_khoan_campus
                SET ${action === 'approve_teacher' ? '' : "vai_tro = 'student', "}teacher_pending = 0,
                    duyet_boi_khoa = ?2, duyet_luc = CURRENT_TIMESTAMP, cap_nhat_luc = CURRENT_TIMESTAMP
              WHERE id = ?1 AND vai_tro = 'teacher' AND teacher_pending = 1 AND dang_hoat_dong = 1 AND la_admin_truong = 0`
      binds = [tk.id, nguoiDuyet]
      break
    case 'grant_teacher':
      if (!(tk.role === 'student' && tk.active)) {
        return loi('Chỉ cấp quyền giáo viên cho tài khoản học sinh đang hoạt động.', 409)
      }
      sql = `UPDATE tai_khoan_campus
                SET vai_tro = 'teacher', teacher_pending = 0,
                    duyet_boi_khoa = ?2, duyet_luc = CURRENT_TIMESTAMP, cap_nhat_luc = CURRENT_TIMESTAMP
              WHERE id = ?1 AND vai_tro = 'student' AND dang_hoat_dong = 1 AND la_admin_truong = 0`
      binds = [tk.id, nguoiDuyet]
      break
    case 'lock':
      if (!tk.active) return loi('Tài khoản này đã bị khoá.', 409)
      sql = `UPDATE tai_khoan_campus SET dang_hoat_dong = 0, cap_nhat_luc = CURRENT_TIMESTAMP
              WHERE id = ?1 AND dang_hoat_dong = 1 AND la_admin_truong = 0`
      binds = [tk.id]
      break
    case 'unlock':
      if (tk.active) return loi('Tài khoản này đang hoạt động.', 409)
      sql = `UPDATE tai_khoan_campus SET dang_hoat_dong = 1, cap_nhat_luc = CURRENT_TIMESTAMP
              WHERE id = ?1 AND dang_hoat_dong = 0 AND la_admin_truong = 0`
      binds = [tk.id]
      break
  }

  try {
    const res = await c.env.DB.prepare(sql)
      .bind(...binds)
      .run()
    if ((res.meta.changes ?? 0) !== 1) {
      return loi('Trạng thái tài khoản vừa thay đổi. Vui lòng tải lại danh sách.', 409)
    }
  } catch (err) {
    console.error('[AdminAPI.accounts/action] Lỗi cập nhật tài khoản:', err)
    return loi('Lỗi cơ sở dữ liệu khi cập nhật tài khoản.', 500)
  }

  // Khoá có hiệu lực ngay ở mọi API (kiemTraPhien đọc dang_hoat_dong); ngắt luôn WebSocket đang mở.
  let daNgatKetNoi = false
  if (action === 'lock') {
    try {
      await c.env.CAMPUS.get(c.env.CAMPUS.idFromName(TEN_CAMPUS)).dangNhapMoi(tk.id, `locked_${crypto.randomUUID()}`, 'tai_khoan_khoa')
      daNgatKetNoi = true
    } catch (err) {
      console.warn('[AdminAPI.accounts/action] Không ngắt được kết nối của tài khoản vừa khoá:', err)
    }
  }

  const TEN_AUDIT: Record<HanhDongTaiKhoan, string> = {
    approve_teacher: 'teacher_approve',
    reject_teacher: 'teacher_reject',
    grant_teacher: 'teacher_grant',
    lock: 'account_lock',
    unlock: 'account_unlock',
  }
  await ghiAuditLog(c.env, {
    actorId: auth.admin.id,
    targetId: tk.id,
    roomId: null,
    action: TEN_AUDIT[action],
    metadata: { username: tk.username },
  })

  return c.json({ ok: true, action, accountId: tk.id, disconnected: daNgatKetNoi })
})
