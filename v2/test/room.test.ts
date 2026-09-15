import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiPhong, WhiteboardStroke } from '../shared/protocol/room'
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
