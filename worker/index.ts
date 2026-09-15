import { Hono } from 'hono'
import { taoDanhTinhCampus, TEN_CAMPUS } from './campus/danh-tinh'
import { actorKey } from './lib/auth'
import { loi } from './lib/http'
import { kiemTraPhien, layPhien } from './lib/session'
import { cungNguon, HEADER_DANH_TINH, laYeuCauWebSocket, maHoaDanhTinh } from './lib/ws'
import { dangNhap, dangXuat, whoami } from './routes/auth'

export { CampusDO } from './campus/campus-do'
export { RoomDO } from './room-do'

const app = new Hono<{ Bindings: Env }>()

const MA_PHONG = /^[a-z0-9-]{1,64}$/

async function vaoCampus(request: Request, env: Env): Promise<Response> {
  if (!laYeuCauWebSocket(request)) return loi('Cần kết nối WebSocket.', 426)
  if (!cungNguon(request)) return loi('Nguồn kết nối không hợp lệ.', 403)

  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const headers = new Headers(request.headers)
  headers.set(HEADER_DANH_TINH, maHoaDanhTinh(await taoDanhTinhCampus(env, kq.phien, kq.taiKhoan)))
  return env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS)).fetch(new Request(request, { headers }))
}

async function vaoPhong(request: Request, env: Env, maPhong: string, isGame = false): Promise<Response> {
  if (!laYeuCauWebSocket(request)) return loi('Cần kết nối WebSocket.', 426)
  if (!cungNguon(request)) return loi('Nguồn kết nối không hợp lệ.', 403)
  if (!MA_PHONG.test(maPhong)) return loi('Mã phòng không hợp lệ.')

  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const headers = new Headers(request.headers)
  headers.set('X-Actor-Key', actorKey(kq.phien))
  headers.set('X-Actor-Ten', encodeURIComponent(kq.taiKhoan.ten || kq.taiKhoan.username))
  if (isGame) {
    headers.set('X-Room-Mode', 'game')
  }
  const doId = isGame ? env.ROOMS.idFromName('game_' + maPhong) : env.ROOMS.idFromName(maPhong)
  return env.ROOMS.get(doId).fetch(new Request(request, { headers }))
}

async function damBaoBangHighScore(env: Env): Promise<void> {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS game_high_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_type TEXT NOT NULL,
        account_id INTEGER NOT NULL DEFAULT 0,
        player_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `).run()
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_game_high_scores ON game_high_scores(game_type, score DESC)
    `).run()
  } catch (err) {
    console.error('Lỗi đảm bảo bảng game_high_scores:', err)
  }
}

const saiPhuongThuc = () => loi('Phương thức không được hỗ trợ.', 405)

app.post('/api/login', (c) => dangNhap(c.req.raw, c.env, c.executionCtx))
app.get('/api/whoami', (c) => whoami(c.req.raw, c.env))
app.post('/api/logout', (c) => dangXuat(c.req.raw))
// Đường dẫn có thật nhưng sai phương thức phải trả 405, không rơi xuống 404.
app.all('/api/login', saiPhuongThuc)
app.all('/api/whoami', saiPhuongThuc)
app.all('/api/logout', saiPhuongThuc)

app.get('/api/game/highscores', async (c) => {
  const gameType = c.req.query('gameType')
  if (!gameType) return loi('Thiếu gameType.', 400)
  await damBaoBangHighScore(c.env)
  const { results } = await c.env.DB.prepare(
    'SELECT id, game_type as gameType, player_name as playerName, score, created_at as createdAt FROM game_high_scores WHERE game_type = ?1 ORDER BY score DESC LIMIT 10'
  ).bind(gameType).all<{ id: number; gameType: string; playerName: string; score: number; createdAt: number }>()

  return c.json({ ok: true, highscores: results ?? [] })
})

app.post('/api/game/highscore', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  let body: { gameType?: string; score?: number }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }
  const { gameType, score } = body
  if (!gameType || typeof score !== 'number' || score < 0 || !Number.isFinite(score)) {
    return loi('Thông tin điểm không hợp lệ.', 400)
  }
  await damBaoBangHighScore(c.env)
  const ten = kq.taiKhoan.ten || kq.taiKhoan.username
  const now = Date.now()
  await c.env.DB.prepare(
    'INSERT INTO game_high_scores (game_type, account_id, player_name, score, created_at) VALUES (?1, ?2, ?3, ?4, ?5)'
  ).bind(gameType, kq.taiKhoan.id, ten, Math.round(score), now).run()

  return c.json({ ok: true })
})

app.all('/api/game/highscores', saiPhuongThuc)
app.all('/api/game/highscore', saiPhuongThuc)

// ── YouTube search proxy (server-side → no CORS) ────────────────────────────
app.get('/api/yt-search', async (c) => {
  const q = (c.req.query('q') ?? '').trim()
  if (!q || q.length > 200) return c.json([])
  const INSTANCES = [
    'https://inv.nadeko.net',
    'https://invidious.fdn.fr',
    'https://iv.ggtyler.dev',
  ]
  for (const base of INSTANCES) {
    try {
      const res = await fetch(
        `${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&fields=videoId,title,author&page=1`,
        { signal: AbortSignal.timeout(6000) },
      )
      if (res.ok) {
        const data = await res.json() as unknown[]
        return c.json(Array.isArray(data) ? data.slice(0, 9) : [])
      }
    } catch { continue }
  }
  return c.json([])
})
app.all('/api/yt-search', saiPhuongThuc)

app.get('/ws/campus', (c) => vaoCampus(c.req.raw, c.env))
app.get('/ws/room/:maPhong', (c) => vaoPhong(c.req.raw, c.env, c.req.param('maPhong'), false))
app.get('/ws/game/:maPhong', (c) => vaoPhong(c.req.raw, c.env, c.req.param('maPhong'), true))

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
