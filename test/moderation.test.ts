import { exports, env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'
import { MA_DONG_SOCKET } from '../shared/protocol/common'
import type { GoiPhong } from '../shared/protocol/room'

/** Helper chèn phòng video vào D1 */
async function taoPhongTest(ten: string, hostKey = 'acc:1'): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', NULL, ?2, 'Chủ phòng', 'public', 20, 'mo')
     RETURNING id`,
  )
    .bind(ten, hostKey)
    .first<{ id: number }>()
  if (!res) throw new Error('Không tạo được phòng')
  return res.id
}

describe('Moderation & Safety v1 — Comprehensive Server-Authoritative Suite', () => {
  // ── 1. Permission Matrix & Hierarchy Guards ───────────────────────────────

  it('1.1. Học sinh thường không có quyền kick thành viên khác (403)', async () => {
    const phongId = await taoPhongTest('Phòng Kick Guard 1', 'acc:1')
    const cookieStudent2 = await dangNhapLayCookie('qa.v2.thu2') // acc:2 (student, not host)

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieStudent2 },
      body: JSON.stringify({ targetActorKey: 'acc:1', reason: 'Spam' }),
    })
    expect(res.status).toBe(403)
    const data = (await res.json()) as any
    expect(data.loi).toContain('không có quyền')
  })

  it('1.2. Không thể tự mời chính mình ra khỏi phòng (400)', async () => {
    const phongId = await taoPhongTest('Phòng Self Kick', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1') // acc:1 (host)

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetActorKey: 'acc:1', reason: 'Self' }),
    })
    expect(res.status).toBe(400)
    const data = (await res.json()) as any
    expect(data.loi).toContain('Không thể tự mời bản thân')
  })

  it('1.3. Chủ phòng không thể mời Giáo viên hoặc Admin ra khỏi phòng (403)', async () => {
    const phongId = await taoPhongTest('Phòng Hierarchy Guard', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1') // acc:1 (host, student)

    // Lấy ID tài khoản giáo viên và admin
    const gvRow = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.gv'").first<{ id: number }>()
    const adminRow = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.admin'").first<{ id: number }>()

    // Host thử kick Giáo viên
    const resGv = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetActorKey: `acc:${gvRow!.id}`, reason: 'Kick GV' }),
    })
    expect(resGv.status).toBe(403)
    const dataGv = (await resGv.json()) as any
    expect(dataGv.loi).toContain('Chủ phòng không thể mời giáo viên')

    // Host thử kick Admin
    const resAdmin = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetActorKey: `acc:${adminRow!.id}`, reason: 'Kick Admin' }),
    })
    expect(resAdmin.status).toBe(403)
    const dataAdmin = (await resAdmin.json()) as any
    expect(dataAdmin.loi).toContain('Không thể mời quản trị viên')
  })

  it('1.4. Giáo viên không thể kick Admin (403)', async () => {
    const phongId = await taoPhongTest('Phòng GV Kick Admin', 'acc:1')
    const cookieGv = await dangNhapLayCookie('qa.v2.gv')
    const adminRow = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.admin'").first<{ id: number }>()

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetActorKey: `acc:${adminRow!.id}`, reason: 'GV kick Admin' }),
    })
    expect(res.status).toBe(403)
    const data = (await res.json()) as any
    expect(data.loi).toContain('Không thể mời quản trị viên')
  })

  // ── 2. Realtime Kick & Cooldown Invariants ─────────────────────────────────

  it('2.1. Host kick học sinh thành công: WebSocket đóng với mã 4003 và ghi audit log', async () => {
    const phongId = await taoPhongTest('Phòng Realtime Kick', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1') // acc:1
    const cookieStudent2 = await dangNhapLayCookie('qa.v2.thu2') // acc:2

    // Học sinh 2 kết nối vào phòng
    const wsTarget = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieStudent2)
    const wsHost = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieHost)

    // Đợi snapshot
    await wsTarget.cho('room.snapshot')
    await wsHost.cho('room.snapshot')

    // Host gọi API kick
    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetActorKey: 'acc:2', reason: 'Vi phạm nội quy học tập' }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.ok).toBe(true)
    expect(json.kicked).toBe(true)

    // Target WebSocket phải nhận sự kiện đóng với mã 4003 (BI_CHAN)
    const dong = await wsTarget.choDong()
    expect(dong.code).toBe(MA_DONG_SOCKET.BI_CHAN)

    // Host nhận được gói room.kicked
    const goiKicked = await wsHost.cho('room.kicked')
    expect(goiKicked.targetKey).toBe('acc:2')
    expect(goiKicked.reason).toBe('Vi phạm nội quy học tập')

    // Kiểm tra bản ghi trong moderation_audit_logs
    const audit = await env.DB.prepare(
      "SELECT action, reason FROM moderation_audit_logs WHERE action = 'kick' AND room_id = ?1",
    )
      .bind(phongId)
      .first<{ action: string; reason: string }>()
    expect(audit).not.toBeNull()
    expect(audit!.action).toBe('kick')
    expect(audit!.reason).toBe('Vi phạm nội quy học tập')

    wsHost.dong()
  })

  it('2.2. Học sinh vừa bị kick bị từ chối khi cố kết nối lại ngay (Kick Cooldown 403)', async () => {
    const phongId = await taoPhongTest('Phòng Kick Cooldown', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const cookieStudent2 = await dangNhapLayCookie('qa.v2.thu2')

    // Target kết nối và bị kick
    const ws = await moKetNoi(`/ws/room/phong-${phongId}`, cookieStudent2)
    await ws.cho('room.snapshot')

    await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetActorKey: 'acc:2', reason: 'Cooldown test' }),
    })
    await ws.choDong()

    // Thử kết nối lại ngay lập tức -> status 403
    const kn = await moKetNoi(`/ws/room/phong-${phongId}`, cookieStudent2)
    expect(kn.status).toBe(403)
    expect(kn.ws).toBeNull()
  })

  // ── 3. Ban & Admission Integration ────────────────────────────────────────

  it('3.1. Ban member: Chèn phong_ban, kick ra khỏi phòng và chặn vĩnh viễn (403 fail-closed)', async () => {
    const phongId = await taoPhongTest('Phòng Ban Test', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const cookieStudent2 = await dangNhapLayCookie('qa.v2.thu2')

    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    // Target kết nối vào phòng trước
    const ws = await moKetNoi(`/ws/room/phong-${phongId}`, cookieStudent2)
    await ws.cho('room.snapshot')

    // Host thực hiện ban
    const resBan = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'Quấy rối lớp học' }),
    })
    expect(resBan.status).toBe(200)

    // Socket bị đóng
    const dong = await ws.choDong()
    expect(dong.code).toBe(MA_DONG_SOCKET.BI_CHAN)

    // Kiểm tra danh sách cấm qua API
    const resList = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/banned-members`, {
      method: 'GET',
      headers: { Cookie: cookieHost },
    })
    expect(resList.status).toBe(200)
    const listJson = (await resList.json()) as any
    expect(listJson.bannedMembers.length).toBe(1)
    expect(listJson.bannedMembers[0].accountId).toBe(stu2Row!.id)
    expect(listJson.bannedMembers[0].reason).toBe('Quấy rối lớp học')

    // Target cố gắng vào lại phòng -> bị chặn 403 bởi room-gate
    const knBanned = await moKetNoi(`/ws/room/phong-${phongId}`, cookieStudent2)
    expect(knBanned.status).toBe(403)
    expect(knBanned.ws).toBeNull()

    // Gỡ cấm (unban)
    const resUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu2Row!.id }),
    })
    expect(resUnban.status).toBe(200)

    // Sau khi unban, kiểm tra danh sách cấm rỗng
    const resList2 = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/banned-members`, {
      method: 'GET',
      headers: { Cookie: cookieHost },
    })
    const listJson2 = (await resList2.json()) as any
    expect(listJson2.bannedMembers.length).toBe(0)
  })

  // ── 4. Reports & Review Lifecycle ─────────────────────────────────────────

  it('4.1. Học sinh gửi báo cáo vi phạm thành công; tự báo cáo bản thân bị từ chối (400)', async () => {
    const phongId = await taoPhongTest('Phòng Report Test', 'acc:1')
    const cookieStudent1 = await dangNhapLayCookie('qa.v2.thu1')
    const stu1Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu1'").first<{ id: number }>()
    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    // Tự báo cáo chính mình -> 400
    const resSelf = await exports.default.fetch(`${GOC}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieStudent1 },
      body: JSON.stringify({
        reportedAccountId: stu1Row!.id,
        category: 'spam',
        reason: 'Tự phạt',
      }),
    })
    expect(resSelf.status).toBe(400)

    // Báo cáo học sinh 2 -> 200
    const res = await exports.default.fetch(`${GOC}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieStudent1 },
      body: JSON.stringify({
        reportedAccountId: stu2Row!.id,
        roomId: phongId,
        category: 'harassment',
        reason: 'Có hành vi xúc phạm trong chat',
        contentSnippet: 'Nội dung tin nhắn không phù hợp...',
      }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.ok).toBe(true)
    expect(json.reportId).toBeGreaterThan(0)
  })

  it('4.2. Học sinh thường không được xem danh sách reports (403); Giáo viên xem và resolve report (200)', async () => {
    const cookieStudent = await dangNhapLayCookie('qa.v2.thu1')
    const cookieGv = await dangNhapLayCookie('qa.v2.gv')

    // Học sinh xem -> 403
    const resStudent = await exports.default.fetch(`${GOC}/api/reports`, {
      method: 'GET',
      headers: { Cookie: cookieStudent },
    })
    expect(resStudent.status).toBe(403)

    // Giáo viên xem -> 200
    const resGv = await exports.default.fetch(`${GOC}/api/reports?status=pending`, {
      method: 'GET',
      headers: { Cookie: cookieGv },
    })
    expect(resGv.status).toBe(200)
    const gvJson = (await resGv.json()) as any
    expect(Array.isArray(gvJson.reports)).toBe(true)
    expect(gvJson.reports.length).toBeGreaterThan(0)

    const reportId = gvJson.reports[0].id

    // Giáo viên xử lý báo cáo (resolve)
    const resResolve = await exports.default.fetch(`${GOC}/api/reports/${reportId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({
        status: 'actioned',
        resolutionNote: 'Đã nhắc nhở học sinh và tạm cấm phát ngôn.',
      }),
    })
    expect(resResolve.status).toBe(200)

    // Kiểm tra danh sách audit logs dành cho Giáo viên
    const resAudit = await exports.default.fetch(`${GOC}/api/moderation/audit-logs`, {
      method: 'GET',
      headers: { Cookie: cookieGv },
    })
    expect(resAudit.status).toBe(200)
    const auditJson = (await resAudit.json()) as any
    expect(auditJson.auditLogs.some((a: any) => a.action === 'report_resolved')).toBe(true)
  })
})
