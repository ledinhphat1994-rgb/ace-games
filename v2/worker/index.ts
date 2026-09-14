import { actorKey } from './lib/auth'
import { loi } from './lib/http'
import { kiemTraPhien, layPhien } from './lib/session'
import { dangNhap, dangXuat, whoami } from './routes/auth'

export { RoomDO } from './room-do'

type XuLy = (request: Request, env: Env) => Promise<Response> | Response

const TUYEN: Record<string, Partial<Record<string, XuLy>>> = {
  '/api/login': { POST: dangNhap },
  '/api/whoami': { GET: whoami },
  '/api/logout': { POST: (request) => dangXuat(request) },
}

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

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)

    const tuyen = TUYEN[pathname]
    if (tuyen) {
      const xuLy = tuyen[request.method]
      return xuLy ? xuLy(request, env) : loi('Phương thức không được hỗ trợ.', 405)
    }

    const phong = pathname.match(/^\/ws\/room\/([^/]+)$/)
    if (phong) return vaoPhong(request, env, phong[1])

    if (pathname.startsWith('/api/') || pathname.startsWith('/ws/')) return loi('Không tìm thấy.', 404)
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
