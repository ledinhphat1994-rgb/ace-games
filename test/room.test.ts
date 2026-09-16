import { exports } from 'cloudflare:workers'
import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiPhong } from '../shared/protocol/room'
import { bamMatKhau, taoSalt } from '../worker/lib/passwords'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'

// ── Helpers ──────────────────────────────────────────────────────────────────

interface ThanhVien {
  key: string
  ten: string
  soKetNoi: number
  isHost: boolean
}

/** Chèn phòng học loại 'video' vào D1, trả về id để dùng canonical key phong-<id> */
async function chenPhong(
  ten: string,
  phamVi: 'truong' | 'lop',
  lopId: number | null,
  tuyChon: {
    trangThai?: string
    accessMode?: string
    matKhau?: string
    sucChua?: number
    chuPhongKhoa?: string
  } = {},
): Promise<number> {
  let hashHex: string | null = null
  let saltHex: string | null = null
  let iterations: number | null = null
  if (tuyChon.matKhau) {
    saltHex = taoSalt()
    iterations = 100000
    hashHex = await bamMatKhau(tuyChon.matKhau, saltHex, iterations)
  }
  const res = await env.DB.prepare(
    `INSERT INTO phong
       (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten,
        access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations,
        suc_chua, trang_thai)
     VALUES ('video', ?1, ?2, ?3, ?4, 'Host', ?5, ?6, ?7, ?8, ?9, ?10)
     RETURNING id`,
  )
    .bind(
      ten,
      phamVi,
      lopId,
      tuyChon.chuPhongKhoa ?? 'acc:1',
      tuyChon.accessMode ?? 'public',
      hashHex,
      saltHex,
      iterations,
      tuyChon.sucChua ?? 20,
      tuyChon.trangThai ?? 'mo',
    )
    .first<{ id: number }>()
  if (!res) throw new Error('Không chèn được phòng vào D1')
  return res.id
}

/** Kết nối WS tới Study Room theo canonical key phong-<id> */
function moPhongId(id: number, cookie: string) {
  return exports.default.fetch(`${GOC}/ws/room/phong-${id}`, {
    headers: { Upgrade: 'websocket', Cookie: cookie, Origin: GOC },
  }) as Promise<Response>
}

/** Helper: gọi API admit cho phòng có mật khẩu */
async function admitPhong(id: number, cookie: string, password: string): Promise<Response> {
  return exports.default.fetch(`${GOC}/api/rooms/${id}/admit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: GOC },
    body: JSON.stringify({ password }),
  }) as Promise<Response>
}

async function choDen(danhSach: ThanhVien[][], dieuKien: (ds: ThanhVien[]) => boolean): Promise<ThanhVien[]> {
  for (let i = 0; i < 150; i++) {
    const cuoi = danhSach.at(-1)
    if (cuoi && dieuKien(cuoi)) return cuoi
    await new Promise((r) => setTimeout(r, 20))
  }
  throw new Error('Danh sách phòng không như mong đợi: ' + JSON.stringify(danhSach.at(-1)))
}

// ── Study Room Presence (existing behaviour) ──────────────────────────────────
describe('phòng real-time (Durable Object + WebSocket)', () => {
  it('trang web lạ → 403, không có phiên → 401', async () => {
    const id = await chenPhong('Phòng thử nguồn', 'truong', null)
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    // Nguồn lạ
    const r1 = await exports.default.fetch(`${GOC}/ws/room/phong-${id}`, {
      headers: { Upgrade: 'websocket', Cookie: cookie, Origin: 'https://trang-la.example' },
    }) as Response
    await r1.body?.cancel()
    expect(r1.status).toBe(403)
    // Không có phiên
    const r2 = await moPhongId(id, '')
    await r2.body?.cancel()
    expect(r2.status).toBe(401)
  })

  it('2 người cùng phòng thấy nhau, người rời thì biến mất', async () => {
    const id = await chenPhong('Phòng 2 người', 'truong', null)
    const danhSach: ThanhVien[][] = []

    const res1 = await moPhongId(id, await dangNhapLayCookie('qa.v2.thu1'))
    expect(res1.status).toBe(101)
    const ws1 = res1.webSocket!
    ws1.accept()
    ws1.addEventListener('message', (e) => {
      const g = JSON.parse(String(e.data)) as { type?: string; members?: ThanhVien[] }
      if (g.type === 'presence' && g.members) danhSach.push(g.members)
    })

    await choDen(danhSach, (ds) => ds.length === 1 && ds[0].ten === 'QA Thử nghiệm 1')

    const res2 = await moPhongId(id, await dangNhapLayCookie('qa.v2.thu2'))
    expect(res2.status).toBe(101)
    const ws2 = res2.webSocket!
    ws2.accept()

    await choDen(danhSach, (ds) => ds.length === 2)
    ws2.close(1000, 'roi')
    await choDen(danhSach, (ds) => ds.length === 1)
    ws1.close(1000, 'xong')
  })

  it('1 người mở 2 tab → soKetNoi=2, không nhân đôi thành viên', async () => {
    const id = await chenPhong('Phòng multi-tab', 'truong', null)
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const danhSach: ThanhVien[][] = []

    const res1 = await moPhongId(id, cookie)
    expect(res1.status).toBe(101)
    res1.webSocket!.accept()
    res1.webSocket!.addEventListener('message', (e) => {
      const g = JSON.parse(String(e.data)) as { type?: string; members?: ThanhVien[] }
      if (g.type === 'presence' && g.members) danhSach.push(g.members)
    })

    const res2 = await moPhongId(id, cookie)
    expect(res2.status).toBe(101)
    res2.webSocket!.accept()

    const ds = await choDen(danhSach, (ds) => ds.length === 1 && ds[0].soKetNoi === 2)
    expect(ds[0].ten).toBe('QA Thử nghiệm 1')
    res1.webSocket!.close(1000, 'xong')
    res2.webSocket!.close(1000, 'xong')
  })
})

// ── Media, Pomodoro, Whiteboard, Notes, Queue ─────────────────────────────────
describe('Active Study Room Phase 3 (Media Sync, Pomodoro, Whiteboard, Notes, Queue)', () => {
  it('kết nối nhận snapshot phòng đầy đủ', async () => {
    const id = await chenPhong('Phòng snapshot', 'truong', null)
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const kn = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, cookie)
    expect(kn.status).toBe(101)
    const snap = await kn.cho('room.snapshot')
    expect(snap.media).toBeDefined()
    expect(snap.media.status).toBe('paused')
    expect(snap.pomodoro).toBeDefined()
    expect(Array.isArray(snap.strokes)).toBe(true)
    expect(Array.isArray(snap.queue)).toBe(true)
    kn.dong()
  })

  it('đồng bộ video: play, pause, seek broadcast tới thành viên', async () => {
    const id = await chenPhong('Phòng media sync', 'truong', null)
    const c1 = await dangNhapLayCookie('qa.v2.thu1')
    const c2 = await dangNhapLayCookie('qa.v2.thu2')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, c1)
    await host.cho('room.snapshot')
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, c2)
    await member.cho('room.snapshot')

    host.gui({ type: 'media.action', data: { action: 'load', videoId: 'dQw4w9WgXcQ', title: 'Bài giảng' } })
    const gLoad = await member.cho('media.sync', (g) => g.state.videoId === 'dQw4w9WgXcQ')
    expect(gLoad.state.status).toBe('paused')

    host.gui({ type: 'media.action', data: { action: 'seek', time: 15 } })
    await member.cho('media.sync', (g) => g.state.time === 15)
    host.gui({ type: 'media.action', data: { action: 'play' } })
    const gPlay = await member.cho('media.sync', (g) => g.state.status === 'playing')
    expect(gPlay.state.time).toBe(15)

    host.dong()
    member.dong()
  })

  it('bảng vẽ nháp: stroke.add và stroke.clear', async () => {
    const id = await chenPhong('Phòng whiteboard', 'truong', null)
    const c1 = await dangNhapLayCookie('qa.v2.thu1')
    const c2 = await dangNhapLayCookie('qa.v2.thu2')
    const a = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, c1)
    const b = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, c2)
    await a.cho('room.snapshot')
    await b.cho('room.snapshot')

    a.gui({ type: 'whiteboard.action', data: { action: 'stroke.add', stroke: { id: 'st_1', points: [[0,0],[1,1]], color: '#fff', size: 2 } } })
    const gAdd = await b.cho('whiteboard.sync', (g) => g.action === 'stroke.add')
    expect(gAdd.stroke?.id).toBe('st_1')

    a.gui({ type: 'whiteboard.action', data: { action: 'stroke.clear' } })
    const gClear = await b.cho('whiteboard.sync', (g) => g.action === 'stroke.clear')
    expect(gClear.action).toBe('stroke.clear')

    a.dong(); b.dong()
  })

  it('ghi chú chung và hàng đợi video', async () => {
    const id = await chenPhong('Phòng notes queue', 'truong', null)
    const c1 = await dangNhapLayCookie('qa.v2.thu1')
    const c2 = await dangNhapLayCookie('qa.v2.thu2')
    const a = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, c1)
    const b = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, c2)
    await a.cho('room.snapshot')
    await b.cho('room.snapshot')

    a.gui({ type: 'notes.action', data: { action: 'update', content: '# Công thức' } })
    const gN = await b.cho('notes.sync', (g) => g.notes.content === '# Công thức')
    expect(gN.notes.lastEditedBy).toBe('QA Thử nghiệm 1')

    a.gui({ type: 'queue.action', data: { action: 'add', videoId: 'abc12345678', title: 'Video tiếp' } })
    const gQ = await b.cho('queue.sync', (g) => g.queue.length === 1)
    expect(gQ.queue[0].title).toBe('Video tiếp')

    a.dong(); b.dong()
  })
})

// ── Security Matrix (23 tests) ────────────────────────────────────────────────
describe('Admission Gate — Security Matrix', () => {

  // 1. Phòng không tồn tại → 404 (FAIL CLOSED)
  it('(1) phòng không tồn tại → 404, KHÔNG tạo DO', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await exports.default.fetch(`${GOC}/ws/room/phong-999999999`, {
      headers: { Upgrade: 'websocket', Cookie: cookie, Origin: GOC },
    }) as Response
    await res.body?.cancel()
    expect(res.status).toBe(404)
  })

  // 2. Key không hợp lệ (không phải phong-<số>) → 400
  it('(2) key không hợp lệ → 400', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await exports.default.fetch(`${GOC}/ws/room/phong-thu`, {
      headers: { Upgrade: 'websocket', Cookie: cookie, Origin: GOC },
    }) as Response
    await res.body?.cancel()
    expect(res.status).toBe(400)
  })

  // 3. Phòng đóng → 403
  it('(3) phòng đóng → 403', async () => {
    const id = await chenPhong('Phòng đóng', 'truong', null, { trangThai: 'dong' })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await moPhongId(id, cookie)
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  // 4. Phòng trường public → học sinh bất kỳ được vào
  it('(4) phòng trường public → học sinh bất kỳ được vào', async () => {
    const id = await chenPhong('Phòng trường public', 'truong', null)
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await moPhongId(id, cookie)
    expect(res.status).toBe(101)
    res.webSocket?.accept(); res.webSocket?.close(1000, 'xong')
    await res.body?.cancel()
  })

  // 5. Phòng lớp 1 → học sinh lớp 1 được vào
  it('(5) phòng lớp 1 → học sinh lớp 1 được vào', async () => {
    const id = await chenPhong('Phòng lớp 1 OK', 'lop', 1)
    const cookie = await dangNhapLayCookie('qa.v2.thu1') // lopId=1
    const res = await moPhongId(id, cookie)
    expect(res.status).toBe(101)
    res.webSocket?.accept(); res.webSocket?.close(1000, 'xong')
    await res.body?.cancel()
  })

  // 6. Phòng lớp 1 → học sinh lớp 2 bị từ chối
  it('(6) phòng lớp 1 → học sinh lớp 2 bị từ chối', async () => {
    const id = await chenPhong('Phòng lớp 1 chặn', 'lop', 1)
    const cookie = await dangNhapLayCookie('qa.v2.thu3') // lopId=2
    const res = await moPhongId(id, cookie)
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  // 7. Phòng lớp 1 → tài khoản chưa có lớp bị từ chối
  it('(7) phòng lớp → tài khoản chưa liên kết lớp bị từ chối', async () => {
    const id = await chenPhong('Phòng lớp tự do', 'lop', 1)
    const cookie = await dangNhapLayCookie('qa.v2.tudo') // lopId=null
    const res = await moPhongId(id, cookie)
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  // 8. GVCN lớp 1 → phòng lớp 1 được vào
  it('(8) GVCN lớp 1 → phòng lớp 1 được vào', async () => {
    const id = await chenPhong('Phòng lớp 1 GV OK', 'lop', 1)
    const cookie = await dangNhapLayCookie('qa.v2.gv') // phụ trách lớp 1
    const res = await moPhongId(id, cookie)
    expect(res.status).toBe(101)
    res.webSocket?.accept(); res.webSocket?.close(1000, 'xong')
    await res.body?.cancel()
  })

  // 9. GVCN lớp 1 → phòng lớp 2 bị từ chối
  it('(9) GVCN lớp 1 → phòng lớp 2 bị từ chối', async () => {
    const id = await chenPhong('Phòng lớp 2 GV sai', 'lop', 2)
    const cookie = await dangNhapLayCookie('qa.v2.gv') // chỉ phụ trách lớp 1
    const res = await moPhongId(id, cookie)
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  // 10. School Admin → vào phòng lớp bất kỳ
  it('(10) admin → vào phòng lớp bất kỳ', async () => {
    const id = await chenPhong('Phòng lớp 2 admin', 'lop', 2)
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    const res = await moPhongId(id, cookie)
    expect(res.status).toBe(101)
    res.webSocket?.accept(); res.webSocket?.close(1000, 'xong')
    await res.body?.cancel()
  })

  // 11. Phòng mật khẩu → kết nối WS trực tiếp (không admit) → 403
  it('(11) phòng mật khẩu → WS không có admission → 403', async () => {
    const id = await chenPhong('Phòng PW gate', 'truong', null, { accessMode: 'password', matKhau: 'bí-mật-1' })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await moPhongId(id, cookie)
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  // 12. Admit sai mật khẩu → 403
  it('(12) admit sai mật khẩu → 403', async () => {
    const id = await chenPhong('Phòng PW sai', 'truong', null, { accessMode: 'password', matKhau: 'bí-mật-2' })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const admitRes = await admitPhong(id, cookie, 'sai-mật-khẩu')
    await admitRes.body?.cancel()
    expect(admitRes.status).toBe(403)
  })

  // 13. Admit đúng mật khẩu → WS được vào
  it('(13) admit đúng mật khẩu → WS 101', async () => {
    const id = await chenPhong('Phòng PW đúng', 'truong', null, { accessMode: 'password', matKhau: 'bí-mật-3' })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const admitRes = await admitPhong(id, cookie, 'bí-mật-3')
    expect(admitRes.status).toBe(200)
    const admitCookie = (admitRes.headers.get('Set-Cookie') ?? '').split(';')[0]
    await admitRes.body?.cancel()

    const wsRes = await moPhongId(id, `${cookie}; ${admitCookie}`)
    expect(wsRes.status).toBe(101)
    wsRes.webSocket?.accept(); wsRes.webSocket?.close(1000, 'xong')
    await wsRes.body?.cancel()
  })

  // 14. Phòng đầy (suc_chua=1) → người thứ 2 bị từ chối
  it('(14) phòng đầy (suc_chua=1) → người thứ 2 nhận 409', async () => {
    const id = await chenPhong('Phòng đầy', 'truong', null, { sucChua: 1 })
    const c1 = await dangNhapLayCookie('qa.v2.thu1')
    const c2 = await dangNhapLayCookie('qa.v2.thu2')

    const r1 = await moPhongId(id, c1)
    expect(r1.status).toBe(101)
    r1.webSocket?.accept()

    const r2 = await moPhongId(id, c2)
    await r2.body?.cancel()
    expect(r2.status).toBe(409)

    r1.webSocket?.close(1000, 'xong')
  })

  // 15. Multi-tab: cùng actor mở tab 2 KHÔNG bị đếm slot mới
  it('(15) cùng actor mở 2 tab không chiếm thêm slot (capacity=1)', async () => {
    const id = await chenPhong('Phòng multi-tab cap', 'truong', null, { sucChua: 1 })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const r1 = await moPhongId(id, cookie)
    expect(r1.status).toBe(101)
    r1.webSocket?.accept()

    // Tab 2 cùng actor → PHẢI được vào (không tốn slot)
    const r2 = await moPhongId(id, cookie)
    expect(r2.status).toBe(101)
    r2.webSocket?.accept()

    r1.webSocket?.close(1000, 'xong')
    r2.webSocket?.close(1000, 'xong')
  })

  // 16. Teacher join → hostKey KHÔNG thay đổi
  it('(16) teacher join → hostKey vẫn là chu_phong_khoa từ D1', async () => {
    const id = await chenPhong('Phòng host D1', 'truong', null, { chuPhongKhoa: 'acc:99' })
    const cookieGV = await dangNhapLayCookie('qa.v2.gv')
    const kn = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, cookieGV)
    expect(kn.status).toBe(101)
    const snap = await kn.cho('room.snapshot')
    // hostKey PHẢI là D1 canonical, không phải key của teacher
    expect(snap.hostKey).toBe('acc:99')
    kn.dong()
  })

  // 17. Moderator (teacher) ≠ isHost trong presence
  it('(17) teacher vào phòng → isHost=false trong presence', async () => {
    const id = await chenPhong('Phòng moderator check', 'truong', null, { chuPhongKhoa: 'acc:99' })
    const cookieGV = await dangNhapLayCookie('qa.v2.gv')
    const danhSach: Array<{ key: string; ten: string; isHost: boolean }[]> = []

    const res = await moPhongId(id, cookieGV)
    expect(res.status).toBe(101)
    res.webSocket!.accept()
    res.webSocket!.addEventListener('message', (e) => {
      const g = JSON.parse(String(e.data)) as { type?: string; members?: typeof danhSach[0] }
      if (g.type === 'presence' && g.members) danhSach.push(g.members as typeof danhSach[0])
    })

    for (let i = 0; i < 100; i++) {
      const cuoi = danhSach.at(-1)
      if (cuoi && cuoi.length > 0) break
      await new Promise((r) => setTimeout(r, 20))
    }

    const last = danhSach.at(-1) ?? []
    const gv = last.find((m) => m.ten === 'QA Giáo viên lớp 1')
    expect(gv?.isHost).toBe(false)
    res.webSocket!.close(1000, 'xong')
  })

  // 18. Member thường không xóa bảng vẽ (chỉ host/moderator mới xóa được)
  it('(18) member thường không xóa được bảng vẽ', async () => {
    const id = await chenPhong('Phòng whiteboard perm', 'truong', null)
    const c1 = await dangNhapLayCookie('qa.v2.thu1') // host canonical = acc:1
    const c2 = await dangNhapLayCookie('qa.v2.thu2')

    // Member (thu2) thử xóa bảng — chủ phòng là acc:1 (thu1)
    const a = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, c1)
    const b = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, c2)
    await a.cho('room.snapshot')
    await b.cho('room.snapshot')

    b.gui({ type: 'whiteboard.action', data: { action: 'stroke.clear' } })
    const errPkt = await b.cho('error', () => true, 1000).catch(() => null)
    expect(errPkt).not.toBeNull()

    a.dong(); b.dong()
  })

  // 19. Hai học sinh trùng tên không xóa được queue item của nhau
  it('(19) queue: tên trùng nhau vẫn không xóa được item của người khác', async () => {
    const id = await chenPhong('Phòng queue dup', 'truong', null)
    const c1 = await dangNhapLayCookie('qa.v2.thu1')
    const c2 = await dangNhapLayCookie('qa.v2.thu2')

    const a = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, c1)
    const b = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, c2)
    await a.cho('room.snapshot')
    await b.cho('room.snapshot')

    // A thêm 1 item
    a.gui({ type: 'queue.action', data: { action: 'add', videoId: 'vid_A', title: 'Video của A' } })
    const qSync = await b.cho('queue.sync', (g) => g.queue.length === 1)
    const itemId = qSync.queue[0].id

    // B cố xóa item của A → phải bị từ chối
    b.gui({ type: 'queue.action', data: { action: 'remove', id: itemId } })
    const errPkt = await b.cho('error', () => true, 1000).catch(() => null)
    expect(errPkt).not.toBeNull()

    // Item vẫn còn
    const stillQ = await a.cho('queue.sync', () => true, 500).catch(() => null)
    if (stillQ) expect(stillQ.queue.length).toBe(1)

    a.dong(); b.dong()
  })

  // 20. LenhPhong không hợp lệ → error
  it('(20) LenhPhong không hợp lệ → error packet', async () => {
    const id = await chenPhong('Phòng invalid cmd', 'truong', null)
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const kn = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, cookie)
    await kn.cho('room.snapshot')

    kn.gui({ type: 'do_not_exist_command', data: {} })
    const errPkt = await kn.cho('error', () => true, 1000)
    expect(errPkt.type).toBe('error')
    kn.dong()
  })

  // 21. Thành viên bị ban (phong_ban) → WS bị từ chối 403
  it('(21) thành viên bị ban → WS bị từ chối 403', async () => {
    const id = await chenPhong('Phòng ban test WS', 'truong', null)
    await env.DB.prepare('INSERT INTO phong_ban (phong_id, tai_khoan_id) VALUES (?1, 1)').bind(id).run()

    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await moPhongId(id, cookie)
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  // 22. Thành viên bị ban (phong_ban) → gọi admit API 403
  it('(22) thành viên bị ban → gọi admit API 403', async () => {
    const id = await chenPhong('Phòng ban test Admit', 'truong', null, { accessMode: 'password', matKhau: 'mk-ban-1' })
    await env.DB.prepare('INSERT INTO phong_ban (phong_id, tai_khoan_id) VALUES (?1, 1)').bind(id).run()

    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await admitPhong(id, cookie, 'mk-ban-1')
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  // 23. Lỗi tra cứu phong_ban (DB error) → FAIL CLOSED 503 cho cả WS và admit API
  it('(23) lỗi tra cứu phong_ban (DB error) → FAIL CLOSED 503 cho cả WS và admit API', async () => {
    const id = await chenPhong('Phòng ban fail-closed', 'truong', null, { accessMode: 'password', matKhau: 'mk-fc-1' })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // Tạm thời đổi tên bảng phong_ban để mô phỏng lỗi truy vấn D1
    await env.DB.exec('ALTER TABLE phong_ban RENAME TO phong_ban_temp_test')
    try {
      // 1. WebSocket admission gate gặp lỗi D1 query ban → BẮT BUỘC trả về 503
      const wsRes = await moPhongId(id, cookie)
      await wsRes.body?.cancel()
      expect(wsRes.status).toBe(503)

      // 2. Password admit API gặp lỗi D1 query ban → BẮT BUỘC trả về 503
      const admitRes = await admitPhong(id, cookie, 'mk-fc-1')
      await admitRes.body?.cancel()
      expect(admitRes.status).toBe(503)
    } finally {
      // Khôi phục lại bảng phong_ban sau khi test xong
      await env.DB.exec('ALTER TABLE phong_ban_temp_test RENAME TO phong_ban')
    }
  })

  // 24. Password mode + null hash → FAIL CLOSED 503 (không bao giờ coi là public)
  it('(24) password mode + null hash → denied 503 cho cả WS và admit API', async () => {
    const res = await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, chu_phong_khoa, chu_phong_ten, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations, suc_chua, trang_thai)
       VALUES ('video', 'P Null Hash', 'truong', 'acc:1', 'Host', 'password', NULL, 'salt123', 100000, 20, 'mo') RETURNING id`,
    ).first<{ id: number }>()
    const id = res!.id
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const wsRes = await moPhongId(id, cookie)
    await wsRes.body?.cancel()
    expect(wsRes.status).toBe(503)

    const admitRes = await admitPhong(id, cookie, 'any-pass')
    await admitRes.body?.cancel()
    expect(admitRes.status).toBe(503)
  })

  // 25. Password mode + null salt → FAIL CLOSED 503
  it('(25) password mode + null salt → denied 503 cho cả WS và admit API', async () => {
    const res = await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, chu_phong_khoa, chu_phong_ten, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations, suc_chua, trang_thai)
       VALUES ('video', 'P Null Salt', 'truong', 'acc:1', 'Host', 'password', 'hash123', NULL, 100000, 20, 'mo') RETURNING id`,
    ).first<{ id: number }>()
    const id = res!.id
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const wsRes = await moPhongId(id, cookie)
    await wsRes.body?.cancel()
    expect(wsRes.status).toBe(503)

    const admitRes = await admitPhong(id, cookie, 'any-pass')
    await admitRes.body?.cancel()
    expect(admitRes.status).toBe(503)
  })

  // 26. Password mode + null/invalid iterations → FAIL CLOSED 503
  it('(26) password mode + null/invalid iterations → denied 503 cho cả WS và admit API', async () => {
    const res1 = await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, chu_phong_khoa, chu_phong_ten, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations, suc_chua, trang_thai)
       VALUES ('video', 'P Null Iter', 'truong', 'acc:1', 'Host', 'password', 'hash123', 'salt123', NULL, 20, 'mo') RETURNING id`,
    ).first<{ id: number }>()
    const id1 = res1!.id

    const res2 = await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, chu_phong_khoa, chu_phong_ten, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations, suc_chua, trang_thai)
       VALUES ('video', 'P Zero Iter', 'truong', 'acc:1', 'Host', 'password', 'hash123', 'salt123', 0, 20, 'mo') RETURNING id`,
    ).first<{ id: number }>()
    const id2 = res2!.id

    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // Null iterations
    const ws1 = await moPhongId(id1, cookie)
    await ws1.body?.cancel()
    expect(ws1.status).toBe(503)

    const admit1 = await admitPhong(id1, cookie, 'any-pass')
    await admit1.body?.cancel()
    expect(admit1.status).toBe(503)

    // 0 iterations
    const ws2 = await moPhongId(id2, cookie)
    await ws2.body?.cancel()
    expect(ws2.status).toBe(503)

    const admit2 = await admitPhong(id2, cookie, 'any-pass')
    await admit2.body?.cancel()
    expect(admit2.status).toBe(503)
  })

  // 27. Unknown access_mode → FAIL CLOSED 403 (không bao giờ coi là public)
  it('(27) unknown access_mode → denied 403 cho cả WS và admit API', async () => {
    const res = await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, chu_phong_khoa, chu_phong_ten, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations, suc_chua, trang_thai)
       VALUES ('video', 'P Unknown Mode', 'truong', 'acc:1', 'Host', 'invite_only', NULL, NULL, NULL, 20, 'mo') RETURNING id`,
    ).first<{ id: number }>()
    const id = res!.id
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const wsRes = await moPhongId(id, cookie)
    await wsRes.body?.cancel()
    expect(wsRes.status).toBe(403)

    const admitRes = await admitPhong(id, cookie, 'any-pass')
    await admitRes.body?.cancel()
    expect(admitRes.status).toBe(403)
  })

  // 28. Unknown pham_vi → FAIL CLOSED 403 cho cả WS và admit API
  it('(28) unknown pham_vi → denied 403 cho cả WS và admit API', async () => {
    const res = await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations, suc_chua, trang_thai)
       VALUES ('video', 'P Unknown Scope', 'garbage', NULL, 'acc:1', 'Host', 'public', NULL, NULL, NULL, 20, 'mo') RETURNING id`,
    ).first<{ id: number }>()
    const id = res!.id
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const wsRes = await moPhongId(id, cookie)
    await wsRes.body?.cancel()
    expect(wsRes.status).toBe(403)

    const admitRes = await admitPhong(id, cookie, 'pass')
    await admitRes.body?.cancel()
    expect(admitRes.status).toBe(403)
  })

  // 29. pham_vi = 'lop' nhưng lop_id = NULL → FAIL CLOSED 503 (không bao giờ fallback về toàn trường)
  it('(29) pham_vi = lop nhưng lop_id = NULL → denied 503 cho cả WS và admit API', async () => {
    const res = await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations, suc_chua, trang_thai)
       VALUES ('video', 'P Lop Null', 'lop', NULL, 'acc:1', 'Host', 'public', NULL, NULL, NULL, 20, 'mo') RETURNING id`,
    ).first<{ id: number }>()
    const id = res!.id
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const wsRes = await moPhongId(id, cookie)
    await wsRes.body?.cancel()
    expect(wsRes.status).toBe(503)

    const admitRes = await admitPhong(id, cookie, 'pass')
    await admitRes.body?.cancel()
    expect(admitRes.status).toBe(503)
  })

  // 30. pham_vi = 'lop' nhưng lop_id không hợp lệ (<= 0) → FAIL CLOSED 503
  it('(30) pham_vi = lop nhưng lop_id <= 0 → denied 503 cho cả WS và admit API', async () => {
    // Chèn lớp có id = 0 để thỏa mãn Foreign Key nhưng vi phạm điều kiện positive integer của room scope
    await env.DB.prepare("INSERT INTO lop (id, ten) VALUES (0, 'Lop 0 Dummy')").run()
    let id: number | null = null
    try {
      const res = await env.DB.prepare(
        `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations, suc_chua, trang_thai)
         VALUES ('video', 'P Lop Invalid', 'lop', 0, 'acc:1', 'Host', 'public', NULL, NULL, NULL, 20, 'mo') RETURNING id`,
      ).first<{ id: number }>()
      id = res!.id
      const cookie = await dangNhapLayCookie('qa.v2.thu1')

      const wsRes = await moPhongId(id, cookie)
      await wsRes.body?.cancel()
      expect(wsRes.status).toBe(503)

      const admitRes = await admitPhong(id, cookie, 'pass')
      await admitRes.body?.cancel()
      expect(admitRes.status).toBe(503)
    } finally {
      if (id) await env.DB.prepare('DELETE FROM phong WHERE id = ?1').bind(id).run().catch(() => {})
      await env.DB.prepare('DELETE FROM lop WHERE id = 0').run().catch(() => {})
    }
  })

  // 31. Canonical scopes hoạt động chuẩn xác: truong được vào, lop kiểm tra đúng lớp
  it('(31) canonical scopes: truong được vào, lop kiểm tra đúng lớp', async () => {
    const idTruong = await chenPhong('P Toan Truong Valid', 'truong', null)
    const idLop = await chenPhong('P Lop 1 Valid', 'lop', 1)

    const c1 = await dangNhapLayCookie('qa.v2.thu1') // hs lop 1
    const c2 = await dangNhapLayCookie('qa.v2.thu3') // hs lop 2

    // Phòng trường: cả 2 hs đều vào được
    const wsT1 = await moPhongId(idTruong, c1)
    await wsT1.body?.cancel()
    expect(wsT1.status).toBe(101)

    const wsT2 = await moPhongId(idTruong, c2)
    await wsT2.body?.cancel()
    expect(wsT2.status).toBe(101)

    // Phòng lớp 1: hs lớp 1 vào được, hs lớp 2 bị 403
    const wsL1 = await moPhongId(idLop, c1)
    await wsL1.body?.cancel()
    expect(wsL1.status).toBe(101)

    const wsL2 = await moPhongId(idLop, c2)
    await wsL2.body?.cancel()
    expect(wsL2.status).toBe(403)
  })

  // 32-35. GET /api/rooms/:id/admission-status
  it('(32) admission-status: chưa đăng nhập → 401', async () => {
    const id = await chenPhong('P Public Status Check', 'truong', null)
    const res = await exports.default.fetch(`${GOC}/api/rooms/${id}/admission-status`, {
      headers: { Origin: GOC },
    }) as Response
    expect(res.status).toBe(401)
  })

  it('(33) admission-status: phòng public → accessMode=public, admitted=true', async () => {
    const id = await chenPhong('P Public Status Check 2', 'truong', null)
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await exports.default.fetch(`${GOC}/api/rooms/${id}/admission-status`, {
      headers: { Cookie: cookie, Origin: GOC },
    }) as Response
    expect(res.status).toBe(200)
    const data = await res.json() as { accessMode: string; admitted: boolean }
    expect(data.accessMode).toBe('public')
    expect(data.admitted).toBe(true)
  })

  it('(34) admission-status: phòng mật khẩu có admission cookie hợp lệ → accessMode=password, admitted=true', async () => {
    const id = await chenPhong('P Password Status Check 1', 'truong', null, {
      accessMode: 'password',
      matKhau: 'MatKhauDung@123',
    })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // Admit successfully
    const admitRes = await admitPhong(id, cookie, 'MatKhauDung@123')
    expect(admitRes.status).toBe(200)
    const setCookie = admitRes.headers.get('Set-Cookie') || ''
    const match = setCookie.match(/room_admit_\d+=[^;]+/)
    expect(match).toBeTruthy()
    const admitCookie = match![0]

    // Query status with both session cookie and admission cookie
    const combinedCookie = `${cookie}; ${admitCookie}`
    const statusRes = await exports.default.fetch(`${GOC}/api/rooms/${id}/admission-status`, {
      headers: { Cookie: combinedCookie, Origin: GOC },
    }) as Response
    expect(statusRes.status).toBe(200)
    const data = await statusRes.json() as { accessMode: string; admitted: boolean }
    expect(data.accessMode).toBe('password')
    expect(data.admitted).toBe(true)
  })

  it('(35) admission-status: phòng mật khẩu KHÔNG có cookie hoặc cookie sai/hết hạn → accessMode=password, admitted=false', async () => {
    const id = await chenPhong('P Password Status Check 2', 'truong', null, {
      accessMode: 'password',
      matKhau: 'MatKhauDung@123',
    })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // 1. No admission cookie provided
    const resNoCookie = await exports.default.fetch(`${GOC}/api/rooms/${id}/admission-status`, {
      headers: { Cookie: cookie, Origin: GOC },
    }) as Response
    expect(resNoCookie.status).toBe(200)
    const data1 = await resNoCookie.json() as { accessMode: string; admitted: boolean }
    expect(data1.accessMode).toBe('password')
    expect(data1.admitted).toBe(false)

    // 2. Invalid admission cookie
    const fakeAdmitCookie = `room_admit_${id}=invalid.token.here`
    const resFakeCookie = await exports.default.fetch(`${GOC}/api/rooms/${id}/admission-status`, {
      headers: { Cookie: `${cookie}; ${fakeAdmitCookie}`, Origin: GOC },
    }) as Response
    expect(resFakeCookie.status).toBe(200)
    const data2 = await resFakeCookie.json() as { accessMode: string; admitted: boolean }
    expect(data2.accessMode).toBe('password')
    expect(data2.admitted).toBe(false)
  })

  it('(36) admission-status: học sinh sai lớp → 403 (permanent denial)', async () => {
    // Phòng lớp 1; qa.v2.thu3 thuộc lớp 2 → bị từ chối scope
    const id = await chenPhong('P Lop Scope Status Check', 'lop', 1)
    const cookie3 = await dangNhapLayCookie('qa.v2.thu3') // lop_id=2 student
    const res = await exports.default.fetch(`${GOC}/api/rooms/${id}/admission-status`, {
      headers: { Cookie: cookie3, Origin: GOC },
    }) as Response
    expect(res.status).toBe(403)
  })

  it('(37) admission-status: tài khoản bị ban → 403 (permanent denial)', async () => {
    const id = await chenPhong('P Ban Status Check', 'truong', null)
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // Get account id for qa.v2.thu1
    const acc = await env.DB.prepare('SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = ?1').bind('qa.v2.thu1').first<{ id: number }>()
    const accountId = acc!.id
    await env.DB.prepare('INSERT INTO phong_ban (phong_id, tai_khoan_id) VALUES (?1, ?2)').bind(id, accountId).run()

    try {
      const res = await exports.default.fetch(`${GOC}/api/rooms/${id}/admission-status`, {
        headers: { Cookie: cookie, Origin: GOC },
      }) as Response
      expect(res.status).toBe(403)
    } finally {
      await env.DB.prepare('DELETE FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2').bind(id, accountId).run()
    }
  })

  it('(38) admission-status: access_mode không xác định (garbage) → 403 (không bao giờ trả về public)', async () => {
    const res = await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, chu_phong_khoa, chu_phong_ten, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations, suc_chua, trang_thai)
       VALUES ('video', 'P Garbage Mode Status', 'truong', 'acc:1', 'Host', 'garbage_mode', NULL, NULL, NULL, 20, 'mo') RETURNING id`,
    ).first<{ id: number }>()
    const id = res!.id
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const statusRes = await exports.default.fetch(`${GOC}/api/rooms/${id}/admission-status`, {
      headers: { Cookie: cookie, Origin: GOC },
    }) as Response
    await statusRes.body?.cancel()
    expect(statusRes.status).toBe(403)
  })

  it('(39) admission-status: password mode, cấu hình mật khẩu không hợp lệ (null hash) → 503 fail closed', async () => {
    const res = await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, chu_phong_khoa, chu_phong_ten, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations, suc_chua, trang_thai)
       VALUES ('video', 'P Null Hash Status', 'truong', 'acc:1', 'Host', 'password', NULL, 'salt123', 100000, 20, 'mo') RETURNING id`,
    ).first<{ id: number }>()
    const id = res!.id
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const statusRes = await exports.default.fetch(`${GOC}/api/rooms/${id}/admission-status`, {
      headers: { Cookie: cookie, Origin: GOC },
    }) as Response
    await statusRes.body?.cancel()
    expect(statusRes.status).toBe(503)
  })

  it('(40) admission-status: lỗi D1 khi truy vấn phong_ban → 503 fail closed', async () => {
    const id = await chenPhong('P Ban D1 Error Status', 'truong', null)
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    await env.DB.exec('ALTER TABLE phong_ban RENAME TO phong_ban_temp_status_test')
    try {
      const res = await exports.default.fetch(`${GOC}/api/rooms/${id}/admission-status`, {
        headers: { Cookie: cookie, Origin: GOC },
      }) as Response
      await res.body?.cancel()
      expect(res.status).toBe(503)
    } finally {
      await env.DB.exec('ALTER TABLE phong_ban_temp_status_test RENAME TO phong_ban')
    }
  })

  it('(41) admission-status: phòng đã đóng → 403', async () => {
    const id = await chenPhong('P Closed Status Check', 'truong', null)
    await env.DB.prepare(`UPDATE phong SET trang_thai = 'dong' WHERE id = ?1`).bind(id).run()
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const res = await exports.default.fetch(`${GOC}/api/rooms/${id}/admission-status`, {
      headers: { Cookie: cookie, Origin: GOC },
    }) as Response
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  it('(42) admission-status: phòng không tồn tại → 404', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const res = await exports.default.fetch(`${GOC}/api/rooms/999999/admission-status`, {
      headers: { Cookie: cookie, Origin: GOC },
    }) as Response
    await res.body?.cancel()
    expect(res.status).toBe(404)
  })
})
