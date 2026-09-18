import { exports, env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'
import { MA_DONG_SOCKET } from '../shared/protocol/common'
import type { GoiPhong } from '../shared/protocol/room'

/** Helper chèn phòng video toàn trường vào D1 */
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

/** Helper chèn phòng lớp học vào D1 */
async function taoPhongLopTest(ten: string, lopId: number, hostKey = 'acc:1'): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'lop', ?2, ?3, 'Chủ phòng lớp', 'public', 20, 'mo')
     RETURNING id`,
  )
    .bind(ten, lopId, hostKey)
    .first<{ id: number }>()
  if (!res) throw new Error('Không tạo được phòng lớp')
  return res.id
}

describe('Moderation & Safety v1 — Comprehensive Server-Authoritative Suite', () => {
  // ── 1. Basic Hierarchy & Self Guards ──────────────────────────────────────

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

  it('1.4. Trong phòng lớp được phân công, Giáo viên không thể kick Admin (403)', async () => {
    // Giáo viên qa.v2.gv phụ trách lớp 1, phòng thuộc lớp 1
    const phongId = await taoPhongLopTest('Phòng GV Kick Admin', 1, 'acc:1')
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

  // ── 2. Teacher Scoped Authority Matrix (Negative & Positive) ──────────────

  it('2.1. Phòng toàn trường: Giáo viên được duyệt không tự động có quyền moderation (403)', async () => {
    // Phòng toàn trường (pham_vi = 'truong'), host = acc:1 (học sinh)
    const phongId = await taoPhongTest('Phòng Toàn Trường Trực Thuộc', 'acc:1')
    const cookieGv = await dangNhapLayCookie('qa.v2.gv')

    // Giáo viên thử kick một học sinh trong phòng toàn trường
    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetActorKey: 'acc:2', reason: 'Kick ngoài phạm vi' }),
    })
    expect(res.status).toBe(403)
    const data = (await res.json()) as any
    expect(data.loi).toContain('Bạn không có quyền mời thành viên')
  })

  it('2.2. Lớp được phân công: Giáo viên phụ trách lớp A có quyền moderate phòng lớp A (200)', async () => {
    // Giáo viên qa.v2.gv phụ trách lớp 1, phòng lớp 1 do học sinh tạo
    const phongId = await taoPhongLopTest('Phòng Lớp 1 Học Tập', 1, 'acc:1')
    const cookieGv = await dangNhapLayCookie('qa.v2.gv')

    // Giáo viên kick học sinh 2 vi phạm
    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetActorKey: 'acc:2', reason: 'GV nhắc nhở và mời ra' }),
    })
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.ok).toBe(true)
    expect(data.kicked).toBe(true)
  })

  it('2.3. Lớp khác: Giáo viên phụ trách lớp 1 KHÔNG thể moderate phòng lớp 2 (403)', async () => {
    // Phòng lớp 2 (pham_vi = 'lop', lop_id = 2)
    const phongId = await taoPhongLopTest('Phòng Lớp 2 Biệt Lập', 2, 'acc:4')
    const cookieGv = await dangNhapLayCookie('qa.v2.gv') // chỉ phụ trách lớp 1

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetActorKey: 'acc:4', reason: 'Lấn sân lớp khác' }),
    })
    expect(res.status).toBe(403)
    const data = (await res.json()) as any
    expect(data.loi).toMatch(/không phụ trách|không có quyền/)
  })

  it('2.4. Quản trị trường (Admin): Có quyền moderate cả phòng lớp và phòng trường (200)', async () => {
    const phongLop2 = await taoPhongLopTest('Phòng Lớp 2 Admin Test', 2, 'acc:4')
    const phongTruong = await taoPhongTest('Phòng Toàn Trường Admin Test', 'acc:1')
    const cookieAdmin = await dangNhapLayCookie('qa.v2.admin')

    // Admin kick trong phòng lớp 2
    const resLop2 = await exports.default.fetch(`${GOC}/api/rooms/${phongLop2}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetActorKey: 'acc:4', reason: 'Admin can thiệp lớp 2' }),
    })
    expect(resLop2.status).toBe(200)

    // Admin kick trong phòng toàn trường
    const resTruong = await exports.default.fetch(`${GOC}/api/rooms/${phongTruong}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetActorKey: 'acc:1', reason: 'Admin can thiệp toàn trường' }),
    })
    expect(resTruong.status).toBe(200)
  })

  // ── 3. Realtime Kick & Durable Cooldown (RoomDO SQLite) ───────────────────

  it('3.1. Host kick học sinh thành công: WebSocket đóng với mã 4003 và ghi audit log có metadata', async () => {
    const phongId = await taoPhongTest('Phòng Realtime Kick', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1') // acc:1
    const cookieStudent2 = await dangNhapLayCookie('qa.v2.thu2') // acc:2

    const wsTarget = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieStudent2)
    const wsHost = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieHost)

    await wsTarget.cho('room.snapshot')
    await wsHost.cho('room.snapshot')

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetActorKey: 'acc:2', reason: 'Vi phạm nội quy học tập' }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.ok).toBe(true)
    expect(json.kicked).toBe(true)

    const dong = await wsTarget.choDong()
    expect(dong.code).toBe(MA_DONG_SOCKET.BI_CHAN)

    const goiKicked = await wsHost.cho('room.kicked')
    expect(goiKicked.targetKey).toBe('acc:2')
    expect(goiKicked.reason).toBe('Vi phạm nội quy học tập')

    const audit = await env.DB.prepare(
      "SELECT action, reason, metadata FROM moderation_audit_logs WHERE action = 'kick' AND room_id = ?1",
    )
      .bind(phongId)
      .first<{ action: string; reason: string; metadata: string }>()
    expect(audit).not.toBeNull()
    expect(audit!.action).toBe('kick')
    expect(audit!.reason).toBe('Vi phạm nội quy học tập')
    expect(audit!.metadata).toContain('authorityRank')

    wsHost.dong()
  })

  it('3.2. Durable Cooldown: Kick lưu vào RoomDO SQLite; kết nối lại ngay bị chặn 403; hết hạn phục hồi kết nối', async () => {
    const phongId = await taoPhongTest('Phòng Kick Cooldown Durable', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const cookieStudent2 = await dangNhapLayCookie('qa.v2.thu2')

    // Kết nối và bị kick
    const ws = await moKetNoi(`/ws/room/phong-${phongId}`, cookieStudent2)
    await ws.cho('room.snapshot')

    await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetActorKey: 'acc:2', reason: 'Durable cooldown test' }),
    })
    await ws.choDong()

    // 1. Thử kết nối lại ngay lập tức -> status 403
    const kn1 = await moKetNoi(`/ws/room/phong-${phongId}`, cookieStudent2)
    expect(kn1.status).toBe(403)
    expect(kn1.ws).toBeNull()

    // 2. Kiểm tra trực tiếp RoomDO SQLite qua internal endpoint
    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    const checkRes = await roomStub.fetch('http://do/internal/moderation/cooldown?actorKey=acc:2')
    expect(checkRes.status).toBe(200)
    const checkJson = (await checkRes.json()) as { active: boolean; remainingMs: number }
    expect(checkJson.active).toBe(true)
    expect(checkJson.remainingMs).toBeGreaterThan(0)

    // 3. Giả lập hết hạn cooldown bằng cách cập nhật SQLite expires_at trong quá khứ
    await roomStub.fetch('http://do/internal/moderation/cooldown/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorKey: 'acc:2', expiresAt: Date.now() - 5000 }),
    })

    // Đồng thời đặt cooldown còn hiệu lực cho một actor khác (acc:4) để kiểm tra pruning không ảnh hưởng actor khác
    await roomStub.fetch('http://do/internal/moderation/cooldown/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorKey: 'acc:4', expiresAt: Date.now() + 180000 }),
    })

    // 4. Kết nối lại sau khi hết hạn -> Thành công vào phòng (101)
    const kn2 = await moKetNoi(`/ws/room/phong-${phongId}`, cookieStudent2)
    expect(kn2.status).toBe(101)
    expect(kn2.ws).not.toBeNull()
    kn2.dong()

    // 5. Kiểm tra RoomDO SQLite: acc:2 đã được prune tự động, acc:4 vẫn còn active
    const checkRes2 = await roomStub.fetch('http://do/internal/moderation/cooldown?actorKey=acc:2')
    const checkJson2 = (await checkRes2.json()) as { active: boolean }
    expect(checkJson2.active).toBe(false)

    const checkResOther = await roomStub.fetch('http://do/internal/moderation/cooldown?actorKey=acc:4')
    const checkJsonOther = (await checkResOther.json()) as { active: boolean }
    expect(checkJsonOther.active).toBe(true)
  })

  // ── 4. Ban & Live-Session Consistency ────────────────────────────────────

  it('4.1. Ban member: Chèn phong_ban, kick ra khỏi phòng và chặn vĩnh viễn (403 fail-closed)', async () => {
    const phongId = await taoPhongTest('Phòng Ban Test', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const cookieStudent2 = await dangNhapLayCookie('qa.v2.thu2')

    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    const ws = await moKetNoi(`/ws/room/phong-${phongId}`, cookieStudent2)
    await ws.cho('room.snapshot')

    const resBan = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'Quấy rối lớp học' }),
    })
    expect(resBan.status).toBe(200)
    const banJson = (await resBan.json()) as any
    expect(banJson.ok).toBe(true)
    expect(banJson.banned).toBe(true)

    const dong = await ws.choDong()
    expect(dong.code).toBe(MA_DONG_SOCKET.BI_CHAN)

    const resList = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/banned-members`, {
      method: 'GET',
      headers: { Cookie: cookieHost },
    })
    expect(resList.status).toBe(200)
    const listJson = (await resList.json()) as any
    expect(listJson.bannedMembers.length).toBe(1)
    expect(listJson.bannedMembers[0].accountId).toBe(stu2Row!.id)

    const knBanned = await moKetNoi(`/ws/room/phong-${phongId}`, cookieStudent2)
    expect(knBanned.status).toBe(403)
    expect(knBanned.ws).toBeNull()
  })

  it('4.2. Ban member khi vắng mặt (absent): Ghi phong_ban thành công và trả về absent: true', async () => {
    const phongId = await taoPhongTest('Phòng Ban Vắng Mặt', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const stu3Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu3'").first<{ id: number }>()

    const resBan = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu3Row!.id, reason: 'Cấm trước khi vào' }),
    })
    expect(resBan.status).toBe(200)
    const banJson = (await resBan.json()) as any
    expect(banJson.ok).toBe(true)
    expect(banJson.banned).toBe(true)
    expect(banJson.absent).toBe(true)
  })

  // ── 5. Unban Hierarchy Invariants ─────────────────────────────────────────

  it('5.1. Host-ban -> Host có thể unban (200)', async () => {
    const phongId = await taoPhongTest('Phòng Unban 5.1', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    // Host ban
    await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'Tạm cấm' }),
    })

    // Host gỡ cấm
    const resUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu2Row!.id }),
    })
    expect(resUnban.status).toBe(200)
    const json = (await resUnban.json()) as any
    expect(json.ok).toBe(true)
    expect(json.unbanned).toBe(true)
  })

  it('5.2. Teacher-ban -> Host nhận 403 khi cố gỡ cấm (Chỉ giáo viên trở lên mới được gỡ)', async () => {
    // Phòng lớp 1 do acc:1 làm host
    const phongId = await taoPhongLopTest('Phòng Unban 5.2', 1, 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1') // Host (rank 1)
    const cookieGv = await dangNhapLayCookie('qa.v2.gv')     // Teacher lớp 1 (rank 2)
    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    // Giáo viên thực hiện ban
    const resBan = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'GV cấm nghiêm khắc' }),
    })
    expect(resBan.status).toBe(200)

    // Host cố gỡ cấm của Giáo viên -> 403
    const resUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu2Row!.id }),
    })
    expect(resUnban.status).toBe(403)
    const err = (await resUnban.json()) as any
    expect(err.loi).toContain('Chủ phòng không có quyền gỡ cấm')
  })

  it('5.3. Teacher-ban -> Giáo viên đúng thẩm quyền hoặc Admin có thể gỡ cấm (200)', async () => {
    const phongId = await taoPhongLopTest('Phòng Unban 5.3', 1, 'acc:1')
    const cookieGv = await dangNhapLayCookie('qa.v2.gv')
    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    // Giáo viên ban
    await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'GV cấm' }),
    })

    // Giáo viên gỡ cấm
    const resUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetAccountId: stu2Row!.id }),
    })
    expect(resUnban.status).toBe(200)
  })

  it('5.4. Admin-ban -> Giáo viên hoặc Host nhận 403 (Chỉ quản trị viên mới được gỡ)', async () => {
    const phongId = await taoPhongLopTest('Phòng Unban 5.4', 1, 'acc:1')
    const cookieAdmin = await dangNhapLayCookie('qa.v2.admin')
    const cookieGv = await dangNhapLayCookie('qa.v2.gv')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    // Admin ban
    const resBan = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'Lệnh cấm từ Quản trị viên' }),
    })
    expect(resBan.status).toBe(200)

    // Giáo viên cố gỡ lệnh cấm của Admin -> 403
    const resGvUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetAccountId: stu2Row!.id }),
    })
    expect(resGvUnban.status).toBe(403)
    const errGv = (await resGvUnban.json()) as any
    expect(errGv.loi).toContain('Chỉ Quản trị viên mới có quyền gỡ cấm')

    // Host cố gỡ lệnh cấm của Admin -> 403
    const resHostUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu2Row!.id }),
    })
    expect(resHostUnban.status).toBe(403)
    const errHost = (await resHostUnban.json()) as any
    expect(errHost.loi).toContain('Chỉ Quản trị viên mới có quyền gỡ cấm')
  })

  it('5.5. Admin-ban -> Admin gỡ cấm thành công (200)', async () => {
    const phongId = await taoPhongLopTest('Phòng Unban 5.5', 1, 'acc:1')
    const cookieAdmin = await dangNhapLayCookie('qa.v2.admin')
    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    // Admin ban trước
    const resBan = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'Admin tạm cấm để test unban' }),
    })
    expect(resBan.status).toBe(200)

    // Admin unban
    const resAdminUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetAccountId: stu2Row!.id }),
    })
    expect(resAdminUnban.status).toBe(200)
    const json = (await resAdminUnban.json()) as any
    expect(json.ok).toBe(true)
    expect(json.unbanned).toBe(true)
  })

  // ── 6. Reports & Audit Log Scoping (Anti-IDOR & Observability) ────────────

  it('6.1. Học sinh gửi báo cáo vi phạm thành công; tự báo cáo bản thân bị từ chối (400)', async () => {
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

  it('6.2. Scoped Reports: Giáo viên lớp 1 chỉ thấy báo cáo thuộc lớp 1; không thấy báo cáo lớp 2', async () => {
    const cookieStudent1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookieGv = await dangNhapLayCookie('qa.v2.gv') // Giáo viên lớp 1
    const stu3Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu3'").first<{ id: number }>() // Học sinh lớp 2
    const phongLop2 = await taoPhongLopTest('Phòng Báo Cáo Lớp 2', 2, 'acc:4')

    // Tạo báo cáo nhắm vào học sinh lớp 2 trong phòng lớp 2
    const resB2 = await exports.default.fetch(`${GOC}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieStudent1 },
      body: JSON.stringify({
        reportedAccountId: stu3Row!.id,
        roomId: phongLop2,
        category: 'disruptive',
        reason: 'Vi phạm phòng lớp 2',
      }),
    })
    expect(resB2.status).toBe(200)
    const report2Id = ((await resB2.json()) as any).reportId

    // Giáo viên lớp 1 lấy danh sách reports
    const resListGv = await exports.default.fetch(`${GOC}/api/reports?status=pending`, {
      method: 'GET',
      headers: { Cookie: cookieGv },
    })
    expect(resListGv.status).toBe(200)
    const listGv = ((await resListGv.json()) as any).reports as Array<{ id: number }>
    // Báo cáo của lớp 2 KHÔNG được xuất hiện trong danh sách của Giáo viên lớp 1
    expect(listGv.some((r) => r.id === report2Id)).toBe(false)

    // 6.3. Direct resolve IDOR: Giáo viên lớp 1 cố resolve trực tiếp report của lớp 2 -> 403
    const resIdor = await exports.default.fetch(`${GOC}/api/reports/${report2Id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ status: 'actioned', resolutionNote: 'IDOR bypass attempt' }),
    })
    expect(resIdor.status).toBe(403)
    const idorJson = (await resIdor.json()) as any
    expect(idorJson.loi).toContain('Bạn không có quyền xử lý báo cáo này')

    // 6.4. Admin có thể thấy và resolve báo cáo lớp 2
    const cookieAdmin = await dangNhapLayCookie('qa.v2.admin')
    const resListAdmin = await exports.default.fetch(`${GOC}/api/reports?status=pending`, {
      method: 'GET',
      headers: { Cookie: cookieAdmin },
    })
    expect(resListAdmin.status).toBe(200)
    const listAdmin = ((await resListAdmin.json()) as any).reports as Array<{ id: number }>
    expect(listAdmin.some((r) => r.id === report2Id)).toBe(true)

    const resAdminResolve = await exports.default.fetch(`${GOC}/api/reports/${report2Id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ status: 'actioned', resolutionNote: 'Admin đã giải quyết' }),
    })
    expect(resAdminResolve.status).toBe(200)
  })

  it('6.5. Scoped Audit Logs: Giáo viên lớp 1 không thấy audit log của phòng thuộc lớp 2', async () => {
    const cookieGv = await dangNhapLayCookie('qa.v2.gv')
    const cookieAdmin = await dangNhapLayCookie('qa.v2.admin')

    // Admin thực hiện một hành động kick trong phòng lớp 2
    const phongLop2 = await taoPhongLopTest('Phòng Audit Lớp 2', 2, 'acc:4')
    await exports.default.fetch(`${GOC}/api/rooms/${phongLop2}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetActorKey: 'acc:4', reason: 'Audit log scope test' }),
    })

    // Giáo viên lớp 1 xem audit logs -> Không được thấy log thuộc phòng lớp 2
    const resAuditGv = await exports.default.fetch(`${GOC}/api/moderation/audit-logs`, {
      method: 'GET',
      headers: { Cookie: cookieGv },
    })
    expect(resAuditGv.status).toBe(200)
    const logsGv = ((await resAuditGv.json()) as any).auditLogs as Array<{ roomId: number }>
    expect(logsGv.some((l) => l.roomId === phongLop2)).toBe(false)

    // Admin xem audit logs -> Thấy toàn bộ
    const resAuditAdmin = await exports.default.fetch(`${GOC}/api/moderation/audit-logs`, {
      method: 'GET',
      headers: { Cookie: cookieAdmin },
    })
    expect(resAuditAdmin.status).toBe(200)
    const logsAdmin = ((await resAuditAdmin.json()) as any).auditLogs as Array<{ roomId: number }>
    expect(logsAdmin.some((l) => l.roomId === phongLop2)).toBe(true)
  })
})
