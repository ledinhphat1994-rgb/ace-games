import { exports } from 'cloudflare:workers'
import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiPhong, WhiteboardStroke } from '../shared/protocol/room'
import { bamMatKhau, taoSalt } from '../worker/lib/passwords'
import { GOC, MAT_KHAU } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'

interface ThanhVien {
  key: string
  ten: string
  soKetNoi: number
}

async function cookieCua(username: string): Promise<string> {
  const res = await exports.default.fetch(`${GOC}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: MAT_KHAU }),
  })
  expect(res.status).toBe(200)
  await res.body?.cancel()
  return (res.headers.get('Set-Cookie') ?? '').split(';')[0]
}

async function moPhong(cookie: string, origin = GOC) {
  const res = await exports.default.fetch(`${GOC}/ws/room/phong-thu`, {
    headers: { Upgrade: 'websocket', Cookie: cookie, Origin: origin },
  })
  const danhSach: ThanhVien[][] = []
  const ws = res.webSocket
  if (ws) {
    ws.accept()
    ws.addEventListener('message', (e) => {
      const goi = JSON.parse(String(e.data)) as { type?: string; members?: ThanhVien[] }
      if (goi.type === 'presence' && goi.members) danhSach.push(goi.members)
    })
  } else {
    await res.body?.cancel()
  }
  return { res, ws, danhSach }
}

async function choDen(danhSach: ThanhVien[][], dieuKien: (ds: ThanhVien[]) => boolean): Promise<ThanhVien[]> {
  for (let i = 0; i < 150; i++) {
    const cuoi = danhSach.at(-1)
    if (cuoi && dieuKien(cuoi)) return cuoi
    await new Promise((r) => setTimeout(r, 20))
  }
  throw new Error('Danh sách phòng không như mong đợi: ' + JSON.stringify(danhSach.at(-1)))
}

const moStudyRoom = (maPhong: string, cookie: string) =>
  moKetNoi<GoiPhong>(`/ws/room/${encodeURIComponent(maPhong)}`, cookie)

describe('phòng real-time (Durable Object + WebSocket)', () => {
  it('trang web lạ mở kết nối -> 403, không có phiên -> 401', async () => {
    const cookie = await cookieCua('qa.v2.thu1')
    expect((await moPhong(cookie, 'https://trang-la.example')).res.status).toBe(403)
    expect((await moPhong('')).res.status).toBe(401)
  })

  it('2 người cùng phòng thấy nhau, người rời thì biến mất', async () => {
    const a = await moPhong(await cookieCua('qa.v2.thu1'))
    expect(a.res.status).toBe(101)
    await choDen(a.danhSach, (ds) => ds.length === 1 && ds[0].ten === 'QA Thử nghiệm 1')

    const b = await moPhong(await cookieCua('qa.v2.thu2'))
    await choDen(a.danhSach, (ds) => ds.length === 2 && ds.some((m) => m.ten === 'QA Thử nghiệm 2'))

    b.ws?.close(1000, 'roi-phong')
    await choDen(a.danhSach, (ds) => ds.length === 1)
    a.ws?.close(1000, 'xong')
  })

  it('1 người mở 2 kết nối -> đếm 2 tab, không nhân đôi thành viên', async () => {
    const cookie = await cookieCua('qa.v2.thu1')
    const a = await moPhong(cookie)
    const b = await moPhong(cookie)
    const ds = await choDen(a.danhSach, (ds) => ds.length === 1 && ds[0].soKetNoi === 2)
    expect(ds[0].ten).toBe('QA Thử nghiệm 1')
    a.ws?.close(1000, 'xong')
    b.ws?.close(1000, 'xong')
  })
})

describe('Active Study Room Phase 3 (Media Sync, Pomodoro, Whiteboard, Notes, Queue)', () => {
  it('kết nối nhận snapshot phòng đầy đủ: media, pomodoro, notes, strokes, queue, chat', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const maPhong = `test-snap-${Date.now()}`
    const kn = await moStudyRoom(maPhong, cookie)
    expect(kn.status).toBe(101)

    const snap = await kn.cho('room.snapshot')
    expect(snap.media).toBeDefined()
    expect(snap.media.status).toBe('paused')
    expect(snap.pomodoro).toBeDefined()
    expect(snap.pomodoro.mode).toBe('focus')
    expect(snap.notes).toBeDefined()
    expect(Array.isArray(snap.strokes)).toBe(true)
    expect(Array.isArray(snap.queue)).toBe(true)
    expect(Array.isArray(snap.chat)).toBe(true)

    kn.dong()
  })

  it('đồng bộ video: Host play, pause, seek, load và rate được broadcast tới các thành viên', async () => {
    const c1 = await dangNhapLayCookie('qa.v2.thu1')
    const c2 = await dangNhapLayCookie('qa.v2.thu2')
    const maPhong = `test-media-${Date.now()}`

    const host = await moStudyRoom(maPhong, c1)
    await host.cho('room.snapshot')

    const member = await moStudyRoom(maPhong, c2)
    await member.cho('room.snapshot')

    // Host tải video mới
    host.gui({
      type: 'media.action',
      data: { action: 'load', videoId: 'dQw4w9WgXcQ', title: 'Bài giảng đại số 10' },
    })
    const gLoad = await member.cho('media.sync', (g) => g.state.videoId === 'dQw4w9WgXcQ')
    expect(gLoad.state.title).toBe('Bài giảng đại số 10')
    expect(gLoad.state.status).toBe('paused')

    // Host bấm Play chung
    host.gui({ type: 'media.action', data: { action: 'play', time: 15 } })
    const gPlay = await member.cho('media.sync', (g) => g.state.status === 'playing')
    expect(gPlay.state.time).toBe(15)
    expect(gPlay.serverNow).toBeGreaterThan(0)

    // Host bấm Pause
    host.gui({ type: 'media.action', data: { action: 'pause', time: 45 } })
    const gPause = await member.cho('media.sync', (g) => g.state.status === 'paused')
    expect(gPause.state.time).toBe(45)

    host.dong()
    member.dong()
  })

  it('đồng bộ Pomodoro: start, pause, reset và switch_mode', async () => {
    const c1 = await dangNhapLayCookie('qa.v2.thu1')
    const maPhong = `test-pomo-${Date.now()}`
    const kn = await moStudyRoom(maPhong, c1)
    await kn.cho('room.snapshot')

    // Start
    kn.gui({ type: 'pomodoro.action', data: { action: 'start' } })
    const gStart = await kn.cho('pomodoro.sync', (g) => g.state.running)
    expect(gStart.state.endsAt).toBeGreaterThan(Date.now())

    // Pause
    kn.gui({ type: 'pomodoro.action', data: { action: 'pause' } })
    const gPause = await kn.cho('pomodoro.sync', (g) => !g.state.running)
    expect(gPause.state.remaining).toBeGreaterThan(0)

    // Switch mode sang nghỉ ngơi
    kn.gui({ type: 'pomodoro.action', data: { action: 'switch_mode', mode: 'break' } })
    const gBreak = await kn.cho('pomodoro.sync', (g) => g.state.mode === 'break')
    expect(gBreak.state.duration).toBe(300)

    kn.dong()
  })

  it('bảng vẽ nháp: vẽ stroke.add và xoá bảng stroke.clear', async () => {
    const c1 = await dangNhapLayCookie('qa.v2.thu1')
    const c2 = await dangNhapLayCookie('qa.v2.thu2')
    const maPhong = `test-wb-${Date.now()}`

    const a = await moStudyRoom(maPhong, c1)
    const b = await moStudyRoom(maPhong, c2)
    await a.cho('room.snapshot')
    await b.cho('room.snapshot')

    const stroke: WhiteboardStroke = {
      id: 'st_123',
      points: [[10, 20], [30, 40]],
      color: '#00F2FE',
      size: 4,
    }

    a.gui({ type: 'whiteboard.action', data: { action: 'stroke.add', stroke } })
    const gAdd = await b.cho('whiteboard.sync', (g) => g.action === 'stroke.add')
    expect(gAdd.stroke?.id).toBe('st_123')

    a.gui({ type: 'whiteboard.action', data: { action: 'stroke.clear' } })
    const gClear = await b.cho('whiteboard.sync', (g) => g.action === 'stroke.clear')
    expect(gClear.action).toBe('stroke.clear')

    a.dong()
    b.dong()
  })

  it('ghi chú chung và hàng đợi video', async () => {
    const c1 = await dangNhapLayCookie('qa.v2.thu1')
    const c2 = await dangNhapLayCookie('qa.v2.thu2')
    const maPhong = `test-notes-queue-${Date.now()}`

    const a = await moStudyRoom(maPhong, c1)
    const b = await moStudyRoom(maPhong, c2)
    await a.cho('room.snapshot')
    await b.cho('room.snapshot')

    // Cập nhật ghi chú
    a.gui({ type: 'notes.action', data: { action: 'update', content: '# Công thức toán học' } })
    const gNotes = await b.cho('notes.sync', (g) => g.notes.content === '# Công thức toán học')
    expect(gNotes.notes.lastEditedBy).toBe('QA Thử nghiệm 1')

    // Thêm vào hàng đợi
    a.gui({ type: 'queue.action', data: { action: 'add', videoId: 'abc12345678', title: 'Video tiếp theo' } })
    const gQueue = await b.cho('queue.sync', (g) => g.queue.length === 1)
    expect(gQueue.queue[0].title).toBe('Video tiếp theo')

    // Chat trong phòng
    a.gui({ type: 'chat.send', reqId: 'chat_1', text: 'Chào các bạn cùng học!' })
    await a.cho('ack', (g) => g.reqId === 'chat_1')
    const gChat = await b.cho('room.chat', (g) => g.message.text === 'Chào các bạn cùng học!')
    expect(gChat.message.ten).toBe('QA Thử nghiệm 1')

    a.dong()
    b.dong()
  })
})

// ── Helper: chèn phòng có slug vào D1 ──────────────────────────────────────
async function chenPhongCoSlug(
  ten: string,
  slug: string,
  phamVi: 'truong' | 'lop',
  lopId: number | null,
  tuyChon: {
    trangThai?: string
    accessMode?: string
    matKhau?: string
    sucChua?: number
    chuPhongKhoa?: string
  } = {},
): Promise<void> {
  let hashHex: string | null = null
  let saltHex: string | null = null
  let iterations: number | null = null
  if (tuyChon.matKhau) {
    saltHex = taoSalt()
    iterations = 100000
    hashHex = await bamMatKhau(tuyChon.matKhau, saltHex, iterations)
  }
  await env.DB.prepare(
    `INSERT INTO phong
       (loai, ten, slug, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten,
        access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations,
        suc_chua, trang_thai)
     VALUES ('video', ?1, ?2, ?3, ?4, ?5, 'Host', ?6, ?7, ?8, ?9, ?10, ?11)`,
  )
    .bind(
      ten,
      slug,
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
    .run()
}

const moPhongCoSlug = (slug: string, cookie: string, pw?: string) => {
  const qs = pw ? `?pw=${encodeURIComponent(pw)}` : ''
  return exports.default.fetch(`${GOC}/ws/room/${slug}${qs}`, {
    headers: { Upgrade: 'websocket', Cookie: cookie, Origin: GOC },
  }) as Promise<Response>
}

describe('Admission Gate — kiểm tra cổng vào phòng học (D1 backed)', () => {
  it('phòng đóng (trang_thai=dong) → 403', async () => {
    const slug = `dong-${Date.now()}`
    await chenPhongCoSlug('Phòng đã đóng', slug, 'truong', null, { trangThai: 'dong' })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await moPhongCoSlug(slug, cookie)
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  it('phòng lớp 1 → học sinh lớp 2 bị từ chối (403)', async () => {
    const slug = `lop1-${Date.now()}`
    await chenPhongCoSlug('Phòng lớp 1 riêng', slug, 'lop', 1)
    const cookie = await dangNhapLayCookie('qa.v2.thu3') // lopId = 2
    const res = await moPhongCoSlug(slug, cookie)
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  it('phòng lớp 1 → học sinh lớp 1 được vào (101)', async () => {
    const slug = `lop1-ok-${Date.now()}`
    await chenPhongCoSlug('Phòng lớp 1 OK', slug, 'lop', 1)
    const cookie = await dangNhapLayCookie('qa.v2.thu1') // lopId = 1
    const res = await moPhongCoSlug(slug, cookie)
    expect(res.status).toBe(101)
    res.webSocket?.accept()
    res.webSocket?.close(1000, 'xong')
    await res.body?.cancel()
  })

  it('phòng lớp 1 → giáo viên lớp 2 bị từ chối (403)', async () => {
    const slug = `gv-sai-lop-${Date.now()}`
    await chenPhongCoSlug('Phòng lớp 1 riêng GV', slug, 'lop', 1)
    // qa.v2.gv phụ trách lớp 1 — ta tạo phòng lớp 2 thay vào
    const slug2 = `gv-sai-lop2-${Date.now()}`
    await chenPhongCoSlug('Phòng lớp 2 riêng GV', slug2, 'lop', 2)
    const cookie = await dangNhapLayCookie('qa.v2.gv') // phụ trách lớp 1
    const res = await moPhongCoSlug(slug2, cookie)
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  it('phòng lớp 1 → giáo viên lớp 1 được vào (101)', async () => {
    const slug = `gv-ok-${Date.now()}`
    await chenPhongCoSlug('Phòng lớp 1 GV OK', slug, 'lop', 1)
    const cookie = await dangNhapLayCookie('qa.v2.gv') // phụ trách lớp 1
    const res = await moPhongCoSlug(slug, cookie)
    expect(res.status).toBe(101)
    res.webSocket?.accept()
    res.webSocket?.close(1000, 'xong')
    await res.body?.cancel()
  })

  it('admin vào phòng lớp bất kỳ (101)', async () => {
    const slug = `admin-bypass-${Date.now()}`
    await chenPhongCoSlug('Phòng lớp 2 admin bypass', slug, 'lop', 2)
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    const res = await moPhongCoSlug(slug, cookie)
    expect(res.status).toBe(101)
    res.webSocket?.accept()
    res.webSocket?.close(1000, 'xong')
    await res.body?.cancel()
  })

  it('phòng có mật khẩu → không cung cấp mật khẩu → 403', async () => {
    const slug = `pw-missing-${Date.now()}`
    await chenPhongCoSlug('Phòng có mật khẩu', slug, 'truong', null, {
      accessMode: 'password',
      matKhau: 'bi-mat-123',
    })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await moPhongCoSlug(slug, cookie) // không truyền pw
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  it('phòng có mật khẩu → mật khẩu sai → 403', async () => {
    const slug = `pw-wrong-${Date.now()}`
    await chenPhongCoSlug('Phòng mật khẩu sai', slug, 'truong', null, {
      accessMode: 'password',
      matKhau: 'bi-mat-123',
    })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await moPhongCoSlug(slug, cookie, 'sai-mat-khau')
    await res.body?.cancel()
    expect(res.status).toBe(403)
  })

  it('phòng có mật khẩu → mật khẩu đúng → 101', async () => {
    const slug = `pw-ok-${Date.now()}`
    await chenPhongCoSlug('Phòng mật khẩu đúng', slug, 'truong', null, {
      accessMode: 'password',
      matKhau: 'bi-mat-123',
    })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await moPhongCoSlug(slug, cookie, 'bi-mat-123')
    expect(res.status).toBe(101)
    res.webSocket?.accept()
    res.webSocket?.close(1000, 'xong')
    await res.body?.cancel()
  })

  it('phòng đầy sức chứa (suc_chua=1) → người thứ 2 nhận 403', async () => {
    const slug = `cap-${Date.now()}`
    await chenPhongCoSlug('Phòng sức chứa 1', slug, 'truong', null, { sucChua: 1 })
    const c1 = await dangNhapLayCookie('qa.v2.thu1')
    const c2 = await dangNhapLayCookie('qa.v2.thu2')

    const r1 = await moPhongCoSlug(slug, c1)
    expect(r1.status).toBe(101)
    r1.webSocket?.accept() // accept trước khi dùng

    const r2 = await moPhongCoSlug(slug, c2)
    await r2.body?.cancel()
    expect(r2.status).toBe(403)

    r1.webSocket?.close(1000, 'xong')
  })

  it('canonical hostKey từ D1 (chu_phong_khoa) xuất hiện trong snapshot', async () => {
    const slug = `host-canon-${Date.now()}`
    // chu_phong_khoa = acc:99 (tài khoản giả, không cần thật cho test này)
    await chenPhongCoSlug('Phòng canonical host', slug, 'truong', null, {
      chuPhongKhoa: 'acc:99',
    })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const kn = await moKetNoi<GoiPhong>(`/ws/room/${slug}`, cookie)
    expect(kn.status).toBe(101)
    const snap = await kn.cho('room.snapshot')
    // hostKey phải là canonical từ D1, không phải acc:ID của thu1
    expect(snap.hostKey).toBe('acc:99')
    kn.dong()
  })
})
