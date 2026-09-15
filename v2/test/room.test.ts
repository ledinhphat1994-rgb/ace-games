import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'

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
