import { exports, env } from 'cloudflare:workers'
import { evictDurableObject } from 'cloudflare:test'
import { describe, expect, it, vi } from 'vitest'
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
    expect(data.kicked).toBe(false)
    expect(data.absent).toBe(true)
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

  // ── 7. Moderation / Safety v1 Closure Regression Evidence ──────────────────

  it('7.1. Admin bans student B -> Host attempts /ban overwrite -> 403 rejected; Admin ban preserved; Host unban fails with 403', async () => {
    const phongId = await taoPhongTest('Phòng Authority Hierarchy 7.1', 'acc:1')
    const cookieAdmin = await dangNhapLayCookie('qa.v2.admin')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1') // Host (rank 1)
    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    // 1. Admin ban học sinh 2 (rank 3)
    const resAdminBan = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'Admin ban tối cao' }),
    })
    expect(resAdminBan.status).toBe(200)

    // Kiểm tra phong_ban có authority_rank = 3
    const banRow1 = await env.DB.prepare(
      'SELECT ban_boi, authority_rank, revision FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2',
    )
      .bind(phongId, stu2Row!.id)
      .first<{ ban_boi: number; authority_rank: number; revision: number }>()
    expect(banRow1?.authority_rank).toBe(3)
    const adminId = banRow1?.ban_boi

    // 2. Host cố ban lại học sinh 2 -> Bị từ chối 403
    const resHostBan = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'Host ban de overwrite' }),
    })
    expect(resHostBan.status).toBe(403)
    const hostBanJson = (await resHostBan.json()) as any
    expect(hostBanJson.loi).toContain('Không thể ghi đè lệnh cấm của cấp có thẩm quyền cao hơn')

    // 3. Lệnh cấm của Admin vẫn được bảo toàn nguyên vẹn
    const banRow2 = await env.DB.prepare(
      'SELECT ban_boi, authority_rank FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2',
    )
      .bind(phongId, stu2Row!.id)
      .first<{ ban_boi: number; authority_rank: number }>()
    expect(banRow2?.ban_boi).toBe(adminId)
    expect(banRow2?.authority_rank).toBe(3)

    // 4. Host cố gỡ cấm -> 403 (không thể bypass phân quyền)
    const resHostUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu2Row!.id }),
    })
    expect(resHostUnban.status).toBe(403)
    const hostUnbanJson = (await resHostUnban.json()) as any
    expect(hostUnbanJson.loi).toContain('Chỉ Quản trị viên mới có quyền gỡ cấm')
  })

  it('7.2. Teacher bans student B via kick with banFromRoom=true -> Host attempts overwrite via kick banFromRoom=true -> 403 rejected', async () => {
    const phongId = await taoPhongLopTest('Phòng Kick Ban Hierarchy 7.2', 1, 'acc:1')
    const cookieGv = await dangNhapLayCookie('qa.v2.gv') // Teacher (rank 2)
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1') // Host (rank 1)
    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    // 1. Teacher kick kèm banFromRoom=true
    const resGvKick = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetActorKey: `acc:${stu2Row!.id}`, reason: 'GV kick cấm', banFromRoom: true }),
    })
    expect(resGvKick.status).toBe(200)

    const banRowGv = await env.DB.prepare(
      'SELECT authority_rank FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2',
    )
      .bind(phongId, stu2Row!.id)
      .first<{ authority_rank: number }>()
    expect(banRowGv?.authority_rank).toBe(2)

    // 2. Host cố ghi đè qua kick banFromRoom=true -> 403 rejected
    const resHostKick = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetActorKey: `acc:${stu2Row!.id}`, reason: 'Host kick de de lenh', banFromRoom: true }),
    })
    expect(resHostKick.status).toBe(403)
    const errJson = (await resHostKick.json()) as any
    expect(errJson.loi).toContain('Không thể ghi đè lệnh cấm của cấp có thẩm quyền cao hơn')

    // 3. Lệnh cấm của Teacher vẫn giữ nguyên rank 2
    const banRowAfter = await env.DB.prepare(
      'SELECT authority_rank FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2',
    )
      .bind(phongId, stu2Row!.id)
      .first<{ authority_rank: number }>()
    expect(banRowAfter?.authority_rank).toBe(2)
  })

  it('7.3. Giáo viên chỉ đóng vai trò Host trong phòng toàn trường nhận authority_rank = 1 trong phong_ban', async () => {
    const gvRow = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.gv'").first<{ id: number }>()
    // Giáo viên làm Host phòng toàn trường (pham_vi = 'truong')
    const phongId = await taoPhongTest('Phòng Toàn Trường Do GV Làm Host', `acc:${gvRow!.id}`)
    const cookieGv = await dangNhapLayCookie('qa.v2.gv')
    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    const resBan = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'Ban trong phòng toàn trường' }),
    })
    expect(resBan.status).toBe(200)

    // Phải ghi nhận authority_rank = 1 (vì trong phòng toàn trường giáo viên không có quyền quản trị trường, chỉ có quyền host)
    const banRow = await env.DB.prepare(
      'SELECT authority_rank FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2',
    )
      .bind(phongId, stu2Row!.id)
      .first<{ authority_rank: number }>()
    expect(banRow?.authority_rank).toBe(1)
  })

  it('7.4. Bảo toàn thẩm quyền lịch sử: Thay đổi vai trò sau khi ban không làm suy yếu quyền hạn lệnh cấm', async () => {
    const phongId = await taoPhongLopTest('Phòng Role Change 7.4', 1, 'acc:1')
    const cookieAdmin = await dangNhapLayCookie('qa.v2.admin')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()
    const adminRow = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.admin'").first<{ id: number }>()

    // 1. Admin ban học sinh 2 (rank 3)
    await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'Admin ban' }),
    })

    // 2. Thay đổi vai trò của admin trong DB thành student (hạ quyền tài khoản sau này)
    await env.DB.prepare(
      "UPDATE tai_khoan_campus SET la_admin_truong = 0, vai_tro = 'student' WHERE id = ?1",
    )
      .bind(adminRow!.id)
      .run()

    try {
      // 3. Host cố unban -> Vẫn bị từ chối 403 vì authority_rank = 3 đã được cố định lúc ban
      const resHostUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
        body: JSON.stringify({ targetAccountId: stu2Row!.id }),
      })
      expect(resHostUnban.status).toBe(403)
      const errJson = (await resHostUnban.json()) as any
      expect(errJson.loi).toContain('Chỉ Quản trị viên mới có quyền gỡ cấm')
    } finally {
      // Phục hồi quyền admin để không ảnh hưởng test khác
      await env.DB.prepare(
        "UPDATE tai_khoan_campus SET la_admin_truong = 1, vai_tro = 'teacher' WHERE id = ?1",
      )
        .bind(adminRow!.id)
        .run()
    }
  })

  it('7.5. Xử lý bản ghi cũ thiếu authority_rank: An toàn bảo thủ (fail-closed) coi như cấp 3 (Admin)', async () => {
    const phongId = await taoPhongTest('Phòng Legacy Ban 7.5', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const cookieAdmin = await dangNhapLayCookie('qa.v2.admin')
    const stu3Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu3'").first<{ id: number }>()

    // Chèn trực tiếp bản ghi legacy: authority_rank = NULL, ban_boi = NULL
    await env.DB.prepare(
      'INSERT INTO phong_ban (phong_id, tai_khoan_id, ly_do, ban_boi, authority_rank, revision, updated_at) VALUES (?1, ?2, ?3, NULL, NULL, 1, 0)',
    )
      .bind(phongId, stu3Row!.id, 'Bản ghi cũ từ hệ thống trước')
      .run()

    // Host cố unban bản ghi legacy -> 403 bị từ chối
    const resHostUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu3Row!.id }),
    })
    expect(resHostUnban.status).toBe(403)
    const err = (await resHostUnban.json()) as any
    expect(err.loi).toContain('Chỉ Quản trị viên mới có quyền gỡ cấm')

    // Admin unban -> Thành công 200
    const resAdminUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetAccountId: stu3Row!.id }),
    })
    expect(resAdminUnban.status).toBe(200)
  })

  it('7.6. Tương tranh lạc quan & Định danh lệnh cấm (OCC & Restriction Identity): Thao tác unban/update cũ bị từ chối 409 sau khi xóa & tạo lại ban', async () => {
    const phongId = await taoPhongTest('Phòng OCC ABA 7.6', 'acc:1')
    const cookieAdmin = await dangNhapLayCookie('qa.v2.admin')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    // 1. Host ban học sinh 2 (ban ban đầu, revision = 1)
    const resHostBan1 = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'Host ban v1' }),
    })
    expect(resHostBan1.status).toBe(200)
    const hostBanJson = (await resHostBan1.json()) as any
    const originalBanId = hostBanJson.banId
    expect(originalBanId).toBeDefined()
    expect(hostBanJson.revision).toBe(1)

    // 2. Host unban học sinh 2 thành công (xóa ban khỏi phong_ban)
    const resHostUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({
        targetAccountId: stu2Row!.id,
        expectedBanId: originalBanId,
        expectedRevision: 1,
      }),
    })
    expect(resHostUnban.status).toBe(200)

    // 3. Admin tạo lệnh cấm MỚI cho cùng tài khoản/phòng (bắt đầu lại tại revision = 1, nhưng có banId mới)
    const resAdminBan = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetAccountId: stu2Row!.id, reason: 'Admin ban mới v1' }),
    })
    expect(resAdminBan.status).toBe(200)
    const adminBanJson = (await resAdminBan.json()) as any
    const newAdminBanId = adminBanJson.banId
    expect(newAdminBanId).toBeDefined()
    expect(newAdminBanId).not.toBe(originalBanId)
    expect(adminBanJson.revision).toBe(1)

    // 4. Giả lập stale UNBAN từ Host: request cũ mang theo expectedBanId = originalBanId và expectedRevision = 1
    const resStaleUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({
        targetAccountId: stu2Row!.id,
        expectedBanId: originalBanId,
        expectedRevision: 1,
      }),
    })
    // Phải bị từ chối 409 Conflict, KHÔNG ĐƯỢC xóa nhầm lệnh cấm của Admin
    expect(resStaleUnban.status).toBe(409)

    // 5. Giả lập stale UPDATE từ Host: request cũ mang theo expectedBanId = originalBanId và expectedRevision = 1
    const resStaleUpdate = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({
        targetAccountId: stu2Row!.id,
        reason: 'Host stale update attempt',
        expectedBanId: originalBanId,
        expectedRevision: 1,
      }),
    })
    // Phải bị từ chối 409 Conflict, KHÔNG ĐƯỢC hạ quyền của Admin xuống 1
    expect(resStaleUpdate.status).toBe(409)

    // 6. Xác minh lệnh cấm của Admin trong D1 vẫn nguyên vẹn 100% với authority_rank = 3
    const banStillActive = await env.DB.prepare(
      'SELECT id, authority_rank, revision, ly_do FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2',
    )
      .bind(phongId, stu2Row!.id)
      .first<{ id: number; authority_rank: number; revision: number; ly_do: string }>()
    expect(banStillActive?.id).toBe(newAdminBanId)
    expect(banStillActive?.authority_rank).toBe(3)
    expect(banStillActive?.revision).toBe(1)
    expect(banStillActive?.ly_do).toBe('Admin ban mới v1')
  })

  it('7.7. Cooldown bền vững (Restart Durability qua evictDurableObject): Tái lập instance từ SQLite và từ chối 403', async () => {
    const phongId = await taoPhongTest('Phòng Cooldown Durability 7.7', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const cookieStudent2 = await dangNhapLayCookie('qa.v2.thu2')

    // 1. Kick target để lưu cooldown vào RoomDO SQLite
    const kickRes = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetActorKey: 'acc:2', reason: 'Durability kick' }),
    })
    expect(kickRes.status).toBe(200)
    const kickData = (await kickRes.json()) as any
    expect(kickData.cooldownSaved).toBe(true)

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))

    // 2. Tái lập thực sự: Gọi evictDurableObject của Cloudflare Workers test runtime để hủy instance in-memory
    await evictDurableObject(roomStub)

    // 3. Tra cứu cooldown: Instance mới được khởi tạo và đọc trực tiếp từ SQLite
    const cdCheckRes = await roomStub.fetch('http://do/internal/moderation/cooldown?actorKey=acc:2')
    expect(cdCheckRes.status).toBe(200)
    const cdCheckJson = (await cdCheckRes.json()) as any
    expect(cdCheckJson.active).toBe(true)
    expect(cdCheckJson.cooldownId).toBeDefined()

    // 4. Kết nối WebSocket trên instance mới khởi tạo: Bị từ chối 403 từ kick cooldown đã lưu trong SQLite
    const kn = await moKetNoi(`/ws/room/phong-${phongId}`, cookieStudent2)
    expect(kn.status).toBe(403)
    expect(kn.ws).toBeNull()

    // 5. Kiểm tra admission-status: Trả về 403 từ kick cooldown bền vững
    const resStatus = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/admission-status`, {
      method: 'GET',
      headers: { Cookie: cookieStudent2 },
    })
    expect(resStatus.status).toBe(403)
    const statusData = (await resStatus.json()) as any
    expect(statusData.loi).toContain('Bạn vừa bị mời ra khỏi phòng')
  })

  it('7.8. Bảo vệ xóa cooldown theo thẩm quyền & Stale revision/cooldownId: Chống xóa sai khi tái tạo cooldown', async () => {
    const phongId = await taoPhongTest('Phòng Cooldown Hierarchy 7.8', 'acc:1')
    const cookieAdmin = await dangNhapLayCookie('qa.v2.admin')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const stu2Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()

    // 1. Admin kick học sinh 2 (cooldown rank 3, không ban)
    const resAdminKick = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetActorKey: `acc:${stu2Row!.id}`, reason: 'Admin kick with cooldown' }),
    })
    expect(resAdminKick.status).toBe(200)
    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    const cdInfo1 = (await (await roomStub.fetch(`http://do/internal/moderation/cooldown?actorKey=acc:${stu2Row!.id}`)).json()) as any
    const cooldownId1 = cdInfo1.cooldownId
    expect(cooldownId1).toBeDefined()

    // 2. Host gọi /unban nhằm xóa cooldown của Admin -> Bị từ chối 403
    const resHostUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetAccountId: stu2Row!.id }),
    })
    expect(resHostUnban.status).toBe(403)
    const err = (await resHostUnban.json()) as any
    expect(err.loi).toContain('Chỉ Quản trị viên mới có quyền gỡ bỏ')

    // 3. Admin gọi /unban với stale expectedRevision -> 409 Conflict
    const resStaleRevUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        targetAccountId: stu2Row!.id,
        expectedCooldownId: cooldownId1,
        expectedRevision: 999,
      }),
    })
    expect(resStaleRevUnban.status).toBe(409)

    // 4. Admin gọi /unban với stale expectedCooldownId -> 409 Conflict
    const resStaleIdUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        targetAccountId: stu2Row!.id,
        expectedCooldownId: 'non-existent-cooldown-id',
        expectedRevision: 1,
      }),
    })
    expect(resStaleIdUnban.status).toBe(409)

    // 5. Admin unban hợp lệ -> Thành công 200, cooldownCleared: true
    const resAdminUnban = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        targetAccountId: stu2Row!.id,
        expectedCooldownId: cooldownId1,
        expectedRevision: cdInfo1.revision,
      }),
    })
    expect(resAdminUnban.status).toBe(200)
    const unbanJson = (await resAdminUnban.json()) as any
    expect(unbanJson.ok).toBe(true)
    expect(unbanJson.cooldownCleared).toBe(true)

    // 6. Sau khi unban, Admin kick lại học sinh 2 -> Tạo cooldown MỚI (cooldownId2 khác cooldownId1)
    await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetActorKey: `acc:${stu2Row!.id}`, reason: 'Admin kick round 2' }),
    })
    const cdInfo2 = (await (await roomStub.fetch(`http://do/internal/moderation/cooldown?actorKey=acc:${stu2Row!.id}`)).json()) as any
    expect(cdInfo2.cooldownId).not.toBe(cooldownId1)

    // 7. Request unban cũ mang expectedCooldownId = cooldownId1 gửi tới -> 409, cooldown MỚI không bị xóa
    const resStaleClearAcrossRecreate = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        targetAccountId: stu2Row!.id,
        expectedCooldownId: cooldownId1,
        expectedRevision: 1,
      }),
    })
    expect(resStaleClearAcrossRecreate.status).toBe(409)

    // Kiểm tra cooldown mới vẫn hoạt động
    const cdStillActive = (await (await roomStub.fetch(`http://do/internal/moderation/cooldown?actorKey=acc:${stu2Row!.id}`)).json()) as any
    expect(cdStillActive.active).toBe(true)
  })

  it('7.9. Fail-closed khi kiểm tra cooldown: Bất kỳ phản hồi lỗi/thiếu/sai định dạng đều trả về 503', async () => {
    const phongId = await taoPhongTest('Phòng Fail Closed 7.9', 'acc:1')
    const cookieStudent2 = await dangNhapLayCookie('qa.v2.thu2')

    let mockResponse: Response | null = null
    let mockError: Error | null = null

    const realGet = env.ROOMS.get.bind(env.ROOMS)
    const getSpy = vi.spyOn(env.ROOMS, 'get').mockImplementation((id: any) => {
      const stub = realGet(id)
      return new Proxy(stub, {
        get(target, prop, receiver) {
          if (prop === 'fetch' && (mockResponse || mockError)) {
            return async () => {
              if (mockError) throw mockError
              return mockResponse!
            }
          }
          return Reflect.get(target, prop, receiver)
        }
      })
    })

    // 1. Phản hồi HTTP 200 nhưng {"ok": false} -> Phải trả về 503
    mockResponse = new Response(JSON.stringify({ ok: false }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    const res1 = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/admission-status`, {
      method: 'GET',
      headers: { Cookie: cookieStudent2 },
    })
    expect(res1.status).toBe(503)

    // 2. Phản hồi HTTP 200 nhưng {"ok": true} thiếu active boolean -> Phải trả về 503
    mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    const res2 = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/admission-status`, {
      method: 'GET',
      headers: { Cookie: cookieStudent2 },
    })
    expect(res2.status).toBe(503)

    // 3. Phản hồi HTTP 200 nhưng malformed JSON -> Phải trả về 503
    mockResponse = new Response('<html>Bad Gateway</html>', { status: 200, headers: { 'Content-Type': 'text/html' } })
    const res3 = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/admission-status`, {
      method: 'GET',
      headers: { Cookie: cookieStudent2 },
    })
    expect(res3.status).toBe(503)

    // 4. Phản hồi non-2xx (HTTP 500) -> Phải trả về 503
    mockResponse = new Response(JSON.stringify({ error: 'Internal Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    const res4 = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/admission-status`, {
      method: 'GET',
      headers: { Cookie: cookieStudent2 },
    })
    expect(res4.status).toBe(503)

    // 5. Lỗi kết nối RPC / throw Exception -> Phải trả về 503
    mockResponse = null
    mockError = new Error('DO Network timeout')
    const res5 = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/admission-status`, {
      method: 'GET',
      headers: { Cookie: cookieStudent2 },
    })
    expect(res5.status).toBe(503)

    getSpy.mockRestore()
  })

  it('7.10. Báo cáo thao tác bán phần (partial: true): Giữ lệnh cấm D1 khi ngắt live session hoặc lưu cooldown lỗi', async () => {
    const phongId = await taoPhongTest('Phòng Partial 7.10', 'acc:1')
    const cookieAdmin = await dangNhapLayCookie('qa.v2.admin')
    const stu3Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu3'").first<{ id: number }>()

    let injectBanKickError = true
    let injectUnbanClearError = false

    const realGet = env.ROOMS.get.bind(env.ROOMS)
    const getSpy = vi.spyOn(env.ROOMS, 'get').mockImplementation((id: any) => {
      const stub = realGet(id)
      return new Proxy(stub, {
        get(target, prop, receiver) {
          if (prop === 'fetch') {
            return async (input: any, init?: any) => {
              const url = typeof input === 'string' ? input : input?.url || ''
              if (injectBanKickError && url.includes('/internal/moderation/kick')) {
                throw new Error('RoomDO live disconnect timeout')
              }
              if (injectUnbanClearError && url.includes('/internal/moderation/cooldown/clear')) {
                throw new Error('RoomDO cooldown clear failed')
              }
              return stub.fetch(input, init)
            }
          }
          return Reflect.get(target, prop, receiver)
        }
      })
    })

    // 1. Giả lập RoomDO gặp sự cố khi ban (RoomDO live disconnect ném lỗi)
    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetAccountId: stu3Row!.id, reason: 'Ban with live removal error' }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.ok).toBe(true)
    expect(json.banned).toBe(true)
    // Khẳng định bán phần: Lệnh cấm lưu thành công nhưng thao tác phụ trợ ngắt kết nối thất bại
    expect(json.partial).toBe(true)
    expect(json.liveRemovalError).toBeDefined()

    // Xác minh lệnh cấm phong_ban trong D1 ĐƯỢC GIỮ NGUYÊN VẸN (không bị rollback mất cấm)
    const banRow = await env.DB.prepare(
      'SELECT id, authority_rank FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2',
    )
      .bind(phongId, stu3Row!.id)
      .first<{ id: number; authority_rank: number }>()
    expect(banRow).not.toBeNull()
    expect(banRow?.authority_rank).toBe(3)

    // 2. Giả lập unban: Thiết lập cooldown cho học sinh 3 trong RoomDO để unban phát hiện targetCooldownId
    injectBanKickError = false
    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.fetch('http://do/internal/moderation/cooldown/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorKey: `acc:${stu3Row!.id}`, expiresAt: Date.now() + 300000, authorityRank: 3 }),
    })

    // Kích hoạt lỗi ném ra khi xóa cooldown trong RoomDO
    injectUnbanClearError = true

    const unbanRes = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/unban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ targetAccountId: stu3Row!.id, expectedBanId: banRow!.id }),
    })
    expect(unbanRes.status).toBe(200)
    const unbanJson = (await unbanRes.json()) as any
    expect(unbanJson.ok).toBe(true)
    expect(unbanJson.unbanned).toBe(true)
    expect(unbanJson.partial).toBe(true)
    expect(unbanJson.cooldownClearError).toBeDefined()

    // Ban D1 đã được xóa thành công
    const banAfterUnban = await env.DB.prepare(
      'SELECT id FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2',
    )
      .bind(phongId, stu3Row!.id)
      .first()
    expect(banAfterUnban).toBeNull()

    getSpy.mockRestore()
  })

  it('7.11. Target vắng mặt tuyệt đối không được báo kicked: true', async () => {
    const phongId = await taoPhongTest('Phòng Absent Kick 7.11', 'acc:1')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const stu3Row = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu3'").first<{ id: number }>()

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHost },
      body: JSON.stringify({ targetActorKey: `acc:${stu3Row!.id}`, reason: 'Kick ghost' }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.ok).toBe(true)
    expect(json.kicked).toBe(false)
    expect(json.absent).toBe(true)
    expect(json.message).toBe('Thành viên không còn trong phòng.')
  })
})
