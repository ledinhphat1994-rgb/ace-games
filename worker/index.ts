import { Hono } from 'hono'
import { taoDanhTinhCampus, TEN_CAMPUS } from './campus/danh-tinh'
import { TEN_GAME_LOBBY } from './games/game-lobby-do'
import { actorKey } from './lib/auth'
import { loi } from './lib/http'
import { kiemTraPhien, layPhien } from './lib/session'
import { cungNguon, HEADER_DANH_TINH, laYeuCauWebSocket, maHoaDanhTinh } from './lib/ws'
import {
  capNhatHoSo,
  dangKy,
  dangNhap,
  dangXuat,
  doiAvatar,
  doiMatKhau,
  quenMatKhau,
  whoami,
} from './routes/auth'

export { CampusDO } from './campus/campus-do'
export { GameLobbyDO } from './games/game-lobby-do'
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
app.post('/api/register', (c) => dangKy(c.req.raw, c.env))
app.post('/api/forgot-password', (c) => quenMatKhau(c.req.raw, c.env))
app.get('/api/whoami', (c) => whoami(c.req.raw, c.env))
app.post('/api/logout', (c) => dangXuat(c.req.raw))

// Quản lý thông tin tài khoản & avatar
app.post('/api/profile/avatar', (c) => doiAvatar(c.req.raw, c.env))
app.post('/api/profile/update', (c) => capNhatHoSo(c.req.raw, c.env))
app.post('/api/profile/password', (c) => doiMatKhau(c.req.raw, c.env))

// Đường dẫn có thật nhưng sai phương thức phải trả 405, không rơi xuống 404.
app.all('/api/login', saiPhuongThuc)
app.all('/api/register', saiPhuongThuc)
app.all('/api/forgot-password', saiPhuongThuc)
app.all('/api/whoami', saiPhuongThuc)
app.all('/api/logout', saiPhuongThuc)
app.all('/api/profile/avatar', saiPhuongThuc)
app.all('/api/profile/update', saiPhuongThuc)
app.all('/api/profile/password', saiPhuongThuc)

// ── R2 File Upload & Public Serving (cho slide PPTX, PDF, ảnh) ─────────────
app.post('/api/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    if (!file) return loi('Vui lòng chọn tệp để tải lên.', 400)

    // Giới hạn kích thước 50MB
    if (file.size > 50 * 1024 * 1024) {
      return loi('Kích thước tệp vượt quá giới hạn cho phép (tối đa 50MB).', 400)
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `slides/${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${safeName}`

    await c.env.ANH.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
      customMetadata: {
        originalName: encodeURIComponent(file.name),
        size: String(file.size),
      },
    })

    const origin = new URL(c.req.url).origin
    const fileUrl = `${origin}/api/files/${key}`

    return c.json({
      ok: true,
      key,
      url: fileUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (err) {
    console.error('Lỗi khi tải tệp lên R2:', err)
    return loi('Không thể tải tệp lên máy chủ lưu trữ.', 500)
  }
})
app.all('/api/upload', saiPhuongThuc)

app.get('/api/files/:key{.+}', async (c) => {
  const key = c.req.param('key')
  if (!key) return loi('Thiếu tên tệp.', 400)

  const object = await c.env.ANH.get(key)
  if (!object) return loi('Không tìm thấy tệp.', 404)

  const headers = new Headers()
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
  const originalName = object.customMetadata?.originalName ? decodeURIComponent(object.customMetadata.originalName) : key.split('/').pop() || 'file'
  headers.set('Content-Disposition', `inline; filename="${originalName}"`)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  headers.set('Cache-Control', 'public, max-age=86400')

  return new Response(object.body, { headers })
})

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

// Danh sách bàn đối kháng đang mở (Real-time Active Tables Feed của Đấu Trường Game).
app.get('/api/game/rooms', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const lobby = c.env.GAME_LOBBY.get(c.env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))
  return c.json({ ok: true, rooms: await lobby.danhSach() })
})
app.all('/api/game/rooms', saiPhuongThuc)

// ── YouTube search proxy (Server-side Scraper → Real YouTube Results, No CORS) ──
app.get('/api/yt-search', async (c) => {
  const q = (c.req.query('q') ?? '').trim()
  if (!q || q.length > 200) return c.json([])
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'vi,en;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return c.json([])
    const html = await res.text()
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/)
    if (match) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = JSON.parse(match[1]) as any
        const contents =
          data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || []
        const results: { videoId: string; title: string; author: string }[] = []
        for (const item of contents) {
          const v = item?.videoRenderer
          if (v && typeof v.videoId === 'string') {
            results.push({
              videoId: v.videoId,
              title: v.title?.runs?.[0]?.text || 'Video YouTube',
              author: v.ownerText?.runs?.[0]?.text || '',
            })
            if (results.length >= 9) break
          }
        }
        if (results.length > 0) return c.json(results)
      } catch {}
    }

    // Fallback: extract unique video IDs directly from HTML links
    const videoMatches = [...html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)]
    const uniqueIds = [...new Set(videoMatches.map((m) => m[1]))].slice(0, 9)
    return c.json(
      uniqueIds.map((id) => ({
        videoId: id,
        title: `Video YouTube (${id})`,
        author: 'YouTube',
      }))
    )
  } catch (err) {
    console.error('Lỗi tìm kiếm YouTube:', err)
    return c.json([])
  }
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
