import { Hono } from 'hono'
import { actorKey } from './lib/auth'
import { loi } from './lib/http'
import { kiemTraPhien, layPhien } from './lib/session'
import { dangNhap, dangXuat, whoami } from './routes/auth'

export { RoomDO } from './room-do'

const app = new Hono<{ Bindings: Env }>()

const MA_PHONG = /^[a-z0-9-]{1,64}$/

function cungNguon(request: Request): boolean {
  const origin = request.headers.get('Origin')
  if (!origin) return false
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

async function vaoPhong(request: Request, env: Env, maPhong: string): Promise<Response> {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return loi('Cần kết nối WebSocket.', 426)
  // Trình duyệt tự gửi cookie kèm WebSocket, nên phải chặn trang web lạ mở kết nối thay học sinh.
  if (!cungNguon(request)) return loi('Nguồn kết nối không hợp lệ.', 403)
  if (!MA_PHONG.test(maPhong)) return loi('Mã phòng không hợp lệ.')

  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const headers = new Headers(request.headers)
  headers.set('X-Actor-Key', actorKey(kq.phien))
  headers.set('X-Actor-Ten', encodeURIComponent(kq.taiKhoan.ten || kq.taiKhoan.username))
  return env.ROOMS.get(env.ROOMS.idFromName(maPhong)).fetch(new Request(request, { headers }))
}

const saiPhuongThuc = () => loi('Phương thức không được hỗ trợ.', 405)

app.post('/api/login', (c) => dangNhap(c.req.raw, c.env))
app.get('/api/whoami', (c) => whoami(c.req.raw, c.env))
app.post('/api/logout', (c) => dangXuat(c.req.raw))
// Đường dẫn có thật nhưng sai phương thức phải trả 405, không rơi xuống 404.
app.all('/api/login', saiPhuongThuc)
app.all('/api/whoami', saiPhuongThuc)
app.all('/api/logout', saiPhuongThuc)

app.get('/ws/room/:maPhong', (c) => vaoPhong(c.req.raw, c.env, c.req.param('maPhong')))

app.notFound((c) => {
  const { pathname } = new URL(c.req.url)
  if (pathname.startsWith('/api/') || pathname.startsWith('/ws/')) return loi('Không tìm thấy.', 404)
  return c.env.ASSETS.fetch(c.req.raw)
})

app.onError((err, c) => {
  console.error(`Lỗi khi xử lý ${c.req.method} ${new URL(c.req.url).pathname}:`, err)
  return loi('Máy chủ gặp lỗi, vui lòng thử lại.', 500)
})

export default app
