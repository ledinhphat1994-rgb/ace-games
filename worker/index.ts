import { Hono } from 'hono'
import { taoDanhTinhCampus, TEN_CAMPUS } from './campus/danh-tinh'
import { TEN_GAME_LOBBY } from './games/game-lobby-do'
import { actorKey } from './lib/auth'
import { loi } from './lib/http'
import { xacMinhMatKhau } from './lib/passwords'
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
  taoMaResetChoHocSinh,
  whoami,
  yeuCauQuenMatKhau,
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

interface DongPhong {
  trang_thai: string
  pham_vi: string
  lop_id: number | null
  access_mode: string
  mat_khau_hash: string | null
  mat_khau_salt: string | null
  mat_khau_iterations: number | null
  suc_chua: number
  chu_phong_khoa: string
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
  headers.set('X-Actor-Role', kq.taiKhoan.role || 'student')
  headers.set('X-Actor-Is-Admin', kq.taiKhoan.laAdminTruong ? '1' : '0')
  headers.set('X-Actor-Is-Teacher', kq.taiKhoan.role === 'teacher' && !kq.taiKhoan.teacherPending ? '1' : '0')
  if (kq.taiKhoan.lopId) {
    headers.set('X-Actor-Lop-Id', String(kq.taiKhoan.lopId))
  }
  if (isGame) {
    headers.set('X-Room-Mode', 'game')
  }

  // ── Admission Gate: D1 lookup (chỉ áp dụng cho phòng học thường, không phải game) ──
  // Phòng không có slug trong D1 (ad-hoc) = không giới hạn (backward compat cho test).
  if (!isGame) {
    let phongRow: DongPhong | null = null
    try {
      phongRow = await env.DB.prepare(
        `SELECT trang_thai, pham_vi, lop_id, access_mode, mat_khau_hash, mat_khau_salt,
                mat_khau_iterations, suc_chua, chu_phong_khoa
           FROM phong WHERE slug = ?1 AND loai = 'video'`,
      )
        .bind(maPhong)
        .first<DongPhong>()
    } catch (e) {
      console.error('Admission gate: lỗi tra cứu phòng D1:', e)
      return loi('Không thể xác minh thông tin phòng.', 500)
    }

    if (phongRow) {
      // 1. Phòng phải đang mở
      if (phongRow.trang_thai !== 'mo') {
        return loi('Phòng đã đóng hoặc tạm dừng hoạt động.', 403)
      }

      // 2. Phạm vi lớp
      if (phongRow.pham_vi === 'lop' && phongRow.lop_id !== null) {
        const laAdmin = kq.taiKhoan.laAdminTruong
        const laGV = kq.taiKhoan.role === 'teacher' && !kq.taiKhoan.teacherPending
        if (!laAdmin) {
          if (laGV) {
            // Giáo viên phải phụ trách lớp đó
            const gvl = await env.DB.prepare(
              'SELECT 1 FROM giao_vien_lop WHERE giao_vien_id = ?1 AND lop_id = ?2 LIMIT 1',
            )
              .bind(kq.taiKhoan.id, phongRow.lop_id)
              .first<{ 1: number }>()
            if (!gvl) {
              return loi('Bạn không phụ trách lớp học này.', 403)
            }
          } else {
            // Học sinh phải thuộc lớp đó
            if (kq.taiKhoan.lopId !== phongRow.lop_id) {
              return loi('Bạn không thuộc lớp học này.', 403)
            }
          }
        }
      }

      // 3. Mật khẩu phòng
      if (phongRow.access_mode === 'password' && phongRow.mat_khau_hash) {
        const matKhau =
          new URL(request.url).searchParams.get('pw') ??
          request.headers.get('X-Room-Password') ??
          ''
        if (!matKhau) {
          return loi('Phòng này yêu cầu mật khẩu.', 403)
        }
        const hopLe = await xacMinhMatKhau(
          matKhau,
          phongRow.mat_khau_hash,
          phongRow.mat_khau_salt,
          phongRow.mat_khau_iterations,
        )
        if (!hopLe) {
          return loi('Mật khẩu phòng không đúng.', 403)
        }
      }

      // Forward metadata cho RoomDO để kiểm tra capacity và lấy canonical hostKey
      headers.set('X-Room-Host-Key', phongRow.chu_phong_khoa)
      headers.set('X-Room-Capacity', String(phongRow.suc_chua))
    }
  }

  const doId = isGame ? env.ROOMS.idFromName('game_' + maPhong) : env.ROOMS.idFromName(maPhong)
  return env.ROOMS.get(doId).fetch(new Request(request, { headers }))
}

const saiPhuongThuc = () => loi('Phương thức không được hỗ trợ.', 405)

app.post('/api/login', (c) => dangNhap(c.req.raw, c.env, c.executionCtx))
app.post('/api/register', (c) => dangKy(c.req.raw, c.env))
app.post('/api/forgot-password/request', (c) => yeuCauQuenMatKhau(c.req.raw, c.env))
app.post('/api/forgot-password', (c) => quenMatKhau(c.req.raw, c.env))
app.post('/api/admin/reset-code', (c) => taoMaResetChoHocSinh(c.req.raw, c.env))
app.get('/api/whoami', (c) => whoami(c.req.raw, c.env))
app.post('/api/logout', (c) => dangXuat(c.req.raw))

// Quản lý thông tin tài khoản & avatar
app.post('/api/profile/avatar', (c) => doiAvatar(c.req.raw, c.env))
app.post('/api/profile/update', (c) => capNhatHoSo(c.req.raw, c.env))
app.post('/api/profile/password', (c) => doiMatKhau(c.req.raw, c.env))

// Đường dẫn có thật nhưng sai phương thức phải trả 405, không rơi xuống 404.
app.all('/api/login', saiPhuongThuc)
app.all('/api/register', saiPhuongThuc)
app.all('/api/forgot-password/request', saiPhuongThuc)
app.all('/api/forgot-password', saiPhuongThuc)
app.all('/api/admin/reset-code', saiPhuongThuc)
app.all('/api/whoami', saiPhuongThuc)
app.all('/api/logout', saiPhuongThuc)
app.all('/api/profile/avatar', saiPhuongThuc)
app.all('/api/profile/update', saiPhuongThuc)
app.all('/api/profile/password', saiPhuongThuc)

// ── R2 File Upload & Public Serving (Bảo vệ bởi Auth, Quota & Extension Allowlist) ─────────────
const ALLOWED_UPLOAD_EXTS: Record<string, { maxBytes: number; folder: string; allowedMimes: string[] }> = {
  pptx: {
    maxBytes: 30 * 1024 * 1024,
    folder: 'slides',
    allowedMimes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/octet-stream',
      'application/zip',
    ],
  },
  ppt: {
    maxBytes: 30 * 1024 * 1024,
    folder: 'slides',
    allowedMimes: ['application/vnd.ms-powerpoint', 'application/octet-stream'],
  },
  pdf: {
    maxBytes: 30 * 1024 * 1024,
    folder: 'slides',
    allowedMimes: ['application/pdf', 'application/octet-stream'],
  },
  png: {
    maxBytes: 5 * 1024 * 1024,
    folder: 'images',
    allowedMimes: ['image/png'],
  },
  jpg: {
    maxBytes: 5 * 1024 * 1024,
    folder: 'images',
    allowedMimes: ['image/jpeg', 'image/pjpeg'],
  },
  jpeg: {
    maxBytes: 5 * 1024 * 1024,
    folder: 'images',
    allowedMimes: ['image/jpeg', 'image/pjpeg'],
  },
  webp: {
    maxBytes: 5 * 1024 * 1024,
    folder: 'images',
    allowedMimes: ['image/webp'],
  },
}

app.post('/api/upload', async (c) => {
  // P0 Security: Yêu cầu phiên đăng nhập hợp lệ
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  // P0 Security: Rate-limit upload (tối đa 20 lượt tải / 10 phút mỗi tài khoản)
  const rateKey = `rate:upload:${kq.taiKhoan.id}`
  const count = parseInt((await c.env.RATE_LIMIT.get(rateKey)) || '0', 10)
  if (count >= 20) {
    return loi('Bạn đã tải lên quá nhiều tệp trong thời gian ngắn. Vui lòng đợi 10 phút.', 429)
  }
  await c.env.RATE_LIMIT.put(rateKey, String(count + 1), { expirationTtl: 600 })

  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    if (!file) return loi('Vui lòng chọn tệp để tải lên.', 400)

    const rawExt = file.name.includes('.') ? file.name.toLowerCase().split('.').pop() || '' : ''
    const rule = ALLOWED_UPLOAD_EXTS[rawExt]
    if (!rule) {
      return loi('Định dạng tệp không được hỗ trợ. Chỉ chấp nhận .pptx, .ppt, .pdf, .png, .jpg, .jpeg, .webp.', 400)
    }

    if (file.size > rule.maxBytes) {
      return loi(`Kích thước tệp vượt quá giới hạn (${Math.round(rule.maxBytes / (1024 * 1024))}MB).`, 400)
    }

    if (file.type && !rule.allowedMimes.includes(file.type)) {
      return loi('Kiểu tệp (MIME type) không khớp với định dạng cho phép.', 400)
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50)
    const key = `${rule.folder}/${Date.now()}_${crypto.randomUUID()}_${safeName}`

    await c.env.ANH.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
      customMetadata: {
        originalName: encodeURIComponent(file.name),
        size: String(file.size),
        uploaderId: String(kq.taiKhoan.id),
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
