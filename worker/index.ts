import { Hono } from 'hono'
import { taoDanhTinhCampus, TEN_CAMPUS } from './campus/danh-tinh'
import { TEN_GAME_LOBBY } from './games/game-lobby-do'
import { actorKey } from './lib/auth'
import { loi } from './lib/http'
import { xacMinhMatKhau } from './lib/passwords'
import { laGiaoVienDaDuyet, laQuanTriTruong } from './lib/scope'
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

// Canonical Study Room key pattern: phong-<positive integer>
const RE_PHONG_ID = /^phong-(\d+)$/

const saiPhuongThuc = () => loi('Phương thức không được hỗ trợ.', 405)

// ── Upload magic-byte signatures ────────────────────────────────────────────
const MAGIC: Record<string, (b: Uint8Array) => boolean> = {
  pdf:  (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46, // %PDF
  png:  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
               b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  jpg:  (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  webp: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
               b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  // PPT (OLE Compound Document)
  ppt:  (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
  // PPTX = ZIP with [Content_Types].xml entry (PK signature)
  pptx: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Campus WebSocket
// ─────────────────────────────────────────────────────────────────────────────
async function vaoCampus(request: Request, env: Env): Promise<Response> {
  if (!laYeuCauWebSocket(request)) return loi('Cần kết nối WebSocket.', 426)
  if (!cungNguon(request)) return loi('Nguồn kết nối không hợp lệ.', 403)

  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const headers = new Headers(request.headers)
  headers.set(HEADER_DANH_TINH, maHoaDanhTinh(await taoDanhTinhCampus(env, kq.phien, kq.taiKhoan)))
  return env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS)).fetch(new Request(request, { headers }))
}

// ─────────────────────────────────────────────────────────────────────────────
// D1 row shape for Study Room gate
// ─────────────────────────────────────────────────────────────────────────────
interface DongPhong {
  id: number
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

// ─────────────────────────────────────────────────────────────────────────────
// Study Room WebSocket — FAIL CLOSED
// ─────────────────────────────────────────────────────────────────────────────
async function vaoPhong(request: Request, env: Env, maPhong: string): Promise<Response> {
  if (!laYeuCauWebSocket(request)) return loi('Cần kết nối WebSocket.', 426)
  if (!cungNguon(request)) return loi('Nguồn kết nối không hợp lệ.', 403)

  // ── Parse canonical Study Room key: phong-<positive integer> ──
  const match = RE_PHONG_ID.exec(maPhong)
  if (!match) return loi('Mã phòng không hợp lệ.', 400)
  const phongId = parseInt(match[1], 10)

  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  // ── D1 Admission Gate — FAIL CLOSED ───────────────────────────────────────
  let phongRow: DongPhong | null = null
  try {
    phongRow = await env.DB.prepare(
      `SELECT id, trang_thai, pham_vi, lop_id, access_mode, mat_khau_hash, mat_khau_salt,
              mat_khau_iterations, suc_chua, chu_phong_khoa
         FROM phong WHERE id = ?1 AND loai = 'video'`,
    )
      .bind(phongId)
      .first<DongPhong>()
  } catch (e) {
    console.error('Admission gate: lỗi tra cứu phòng D1:', e)
    return loi('Không thể xác minh thông tin phòng.', 500)
  }

  // Unknown room → ALWAYS 404, NEVER forward to RoomDO
  if (!phongRow) return loi('Không tìm thấy phòng học.', 404)

  // 1. Phòng phải đang mở
  if (phongRow.trang_thai !== 'mo') {
    return loi('Phòng đã đóng hoặc tạm dừng hoạt động.', 403)
  }

  // Kiểm tra phạm vi lớp
  if (phongRow.pham_vi === 'lop' && phongRow.lop_id !== null) {
    if (!laQuanTriTruong(kq.taiKhoan)) {
      if (laGiaoVienDaDuyet(kq.taiKhoan)) {
        const gvl = await env.DB.prepare(
          'SELECT 1 FROM giao_vien_lop WHERE giao_vien_id = ?1 AND lop_id = ?2 LIMIT 1',
        )
          .bind(kq.taiKhoan.id, phongRow.lop_id)
          .first<{ 1: number }>()
        if (!gvl) return loi('Bạn không phụ trách lớp học này.', 403)
      } else {
        // Học sinh phải thuộc đúng lớp; tài khoản chưa liên kết lớp bị từ chối
        if (!kq.taiKhoan.lopId || kq.taiKhoan.lopId !== phongRow.lop_id) {
          return loi('Bạn không thuộc lớp học này.', 403)
        }
      }
    }
  }

  // 3. Kiểm tra ban
  if (kq.taiKhoan.id) {
    try {
      const ban = await env.DB.prepare(
        `SELECT 1 FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2 LIMIT 1`,
      )
        .bind(phongRow.id, kq.taiKhoan.id)
        .first<{ 1: number }>()
        .catch(() => null) // bảng chưa tồn tại → bỏ qua
      if (ban) return loi('Bạn đã bị cấm vào phòng này.', 403)
    } catch {
      // phong_ban chưa có trong schema — không block
    }
  }

  // 4. Mật khẩu phòng — xác minh qua KV admission grant (KHÔNG chấp nhận ?pw= trong URL WS)
  if (phongRow.access_mode === 'password' && phongRow.mat_khau_hash) {
    const admissionKey = `room_admit:${phongRow.id}:${kq.taiKhoan.id}:${kq.phien.phienId}`
    const granted = await env.RATE_LIMIT.get(admissionKey)
    if (!granted) {
      return loi('Phòng này yêu cầu mật khẩu. Vui lòng xác thực qua API trước khi kết nối.', 403)
    }
  }

  // ── Tính canModerate server-side ──────────────────────────────────────────
  const canModerate = laQuanTriTruong(kq.taiKhoan) || laGiaoVienDaDuyet(kq.taiKhoan)

  // ── Forward headers to RoomDO ──────────────────────────────────────────────
  const headers = new Headers(request.headers)
  headers.set('X-Actor-Key', actorKey(kq.phien))
  headers.set('X-Actor-Ten', encodeURIComponent(kq.taiKhoan.ten || kq.taiKhoan.username))
  headers.set('X-Actor-Role', kq.taiKhoan.role || 'student')
  headers.set('X-Actor-Is-Admin', kq.taiKhoan.laAdminTruong ? '1' : '0')
  headers.set('X-Actor-Is-Teacher', laGiaoVienDaDuyet(kq.taiKhoan) ? '1' : '0')
  headers.set('X-Actor-Can-Moderate', canModerate ? '1' : '0')
  if (kq.taiKhoan.lopId) headers.set('X-Actor-Lop-Id', String(kq.taiKhoan.lopId))
  headers.set('X-Room-Host-Key', phongRow.chu_phong_khoa)
  headers.set('X-Room-Capacity', String(phongRow.suc_chua))

  const doId = env.ROOMS.idFromName(maPhong)
  return env.ROOMS.get(doId).fetch(new Request(request, { headers }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Game Room WebSocket
// ─────────────────────────────────────────────────────────────────────────────
async function vaoPhongGame(request: Request, env: Env, maPhong: string): Promise<Response> {
  if (!laYeuCauWebSocket(request)) return loi('Cần kết nối WebSocket.', 426)
  if (!cungNguon(request)) return loi('Nguồn kết nối không hợp lệ.', 403)
  if (!/^[a-z0-9-]{1,64}$/.test(maPhong)) return loi('Mã phòng không hợp lệ.', 400)

  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const headers = new Headers(request.headers)
  headers.set('X-Actor-Key', actorKey(kq.phien))
  headers.set('X-Actor-Ten', encodeURIComponent(kq.taiKhoan.ten || kq.taiKhoan.username))
  headers.set('X-Actor-Role', kq.taiKhoan.role || 'student')
  headers.set('X-Actor-Is-Admin', kq.taiKhoan.laAdminTruong ? '1' : '0')
  headers.set('X-Actor-Is-Teacher', laGiaoVienDaDuyet(kq.taiKhoan) ? '1' : '0')
  headers.set('X-Actor-Can-Moderate', '0')
  if (kq.taiKhoan.lopId) headers.set('X-Actor-Lop-Id', String(kq.taiKhoan.lopId))
  headers.set('X-Room-Mode', 'game')

  const doId = env.ROOMS.idFromName('game_' + maPhong)
  return env.ROOMS.get(doId).fetch(new Request(request, { headers }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Password Room Admission API: POST /api/rooms/:id/admit
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/rooms/:id/admit', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const idParam = c.req.param('id')
  const phongId = parseInt(idParam || '', 10)
  if (!phongId || phongId <= 0) return loi('ID phòng không hợp lệ.', 400)

  let body: { password?: string }
  try { body = await c.req.json() } catch { return loi('Dữ liệu không hợp lệ.', 400) }
  const password = String(body.password || '').trim()

  const phongRow = await c.env.DB.prepare(
    `SELECT id, trang_thai, pham_vi, lop_id, access_mode, mat_khau_hash, mat_khau_salt,
            mat_khau_iterations, suc_chua, chu_phong_khoa
       FROM phong WHERE id = ?1 AND loai = 'video'`,
  )
    .bind(phongId)
    .first<DongPhong>()
    .catch(() => null)

  if (!phongRow) return loi('Không tìm thấy phòng học.', 404)
  if (phongRow.trang_thai !== 'mo') return loi('Phòng đã đóng.', 403)

  // Scope check (same as WS gate)
  if (phongRow.pham_vi === 'lop' && phongRow.lop_id !== null) {
    if (!laQuanTriTruong(kq.taiKhoan)) {
      if (laGiaoVienDaDuyet(kq.taiKhoan)) {
        const gvl = await c.env.DB.prepare(
          'SELECT 1 FROM giao_vien_lop WHERE giao_vien_id = ?1 AND lop_id = ?2 LIMIT 1',
        ).bind(kq.taiKhoan.id, phongRow.lop_id).first<{ 1: number }>()
        if (!gvl) return loi('Bạn không phụ trách lớp học này.', 403)
      } else {
        if (!kq.taiKhoan.lopId || kq.taiKhoan.lopId !== phongRow.lop_id)
          return loi('Bạn không thuộc lớp học này.', 403)
      }
    }
  }

  if (phongRow.access_mode !== 'password' || !phongRow.mat_khau_hash) {
    return loi('Phòng này không yêu cầu mật khẩu.', 400)
  }

  // Rate-limit password attempts: 10 lần / 5 phút / tài khoản
  const rlKey = `rate:admit:${phongRow.id}:${kq.taiKhoan.id}`
  const tries = parseInt((await c.env.RATE_LIMIT.get(rlKey)) || '0', 10)
  if (tries >= 10) return loi('Bạn đã thử sai quá nhiều lần. Vui lòng thử lại sau 5 phút.', 429)
  await c.env.RATE_LIMIT.put(rlKey, String(tries + 1), { expirationTtl: 300 })

  const hopLe = await xacMinhMatKhau(
    password,
    phongRow.mat_khau_hash,
    phongRow.mat_khau_salt,
    phongRow.mat_khau_iterations,
  )
  if (!hopLe) return loi('Mật khẩu không đúng.', 403)

  // Phát admission grant vào KV — hết hạn sau 5 phút, gắn với phienId
  const admissionKey = `room_admit:${phongRow.id}:${kq.taiKhoan.id}:${kq.phien.phienId}`
  await c.env.RATE_LIMIT.put(admissionKey, '1', { expirationTtl: 300 })

  // Xoá rate-limit sau khi xác thực thành công
  await c.env.RATE_LIMIT.delete(rlKey)

  return c.json({ ok: true, roomId: phongRow.id, maPhong: `phong-${phongRow.id}` })
})
app.all('/api/rooms/:id/admit', saiPhuongThuc)

// ─────────────────────────────────────────────────────────────────────────────
// Auth routes
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/login', (c) => dangNhap(c.req.raw, c.env, c.executionCtx))
app.post('/api/register', (c) => dangKy(c.req.raw, c.env))
app.post('/api/forgot-password/request', (c) => yeuCauQuenMatKhau(c.req.raw, c.env))
app.post('/api/forgot-password', (c) => quenMatKhau(c.req.raw, c.env))
app.post('/api/admin/reset-code', (c) => taoMaResetChoHocSinh(c.req.raw, c.env))
app.get('/api/whoami', (c) => whoami(c.req.raw, c.env))
app.post('/api/logout', (c) => dangXuat(c.req.raw))
app.all('/api/login', saiPhuongThuc)
app.all('/api/register', saiPhuongThuc)
app.all('/api/forgot-password/request', saiPhuongThuc)
app.all('/api/forgot-password', saiPhuongThuc)
app.all('/api/admin/reset-code', saiPhuongThuc)
app.all('/api/whoami', saiPhuongThuc)
app.all('/api/logout', saiPhuongThuc)

// Profile
app.post('/api/profile/avatar', (c) => doiAvatar(c.req.raw, c.env))
app.post('/api/profile/update', (c) => capNhatHoSo(c.req.raw, c.env))
app.post('/api/profile/password', (c) => doiMatKhau(c.req.raw, c.env))
app.all('/api/profile/avatar', saiPhuongThuc)
app.all('/api/profile/update', saiPhuongThuc)
app.all('/api/profile/password', saiPhuongThuc)

// ─────────────────────────────────────────────────────────────────────────────
// R2 File Upload (Auth + Quota + Extension + MIME + Magic Bytes)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/upload', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

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

    // ── Magic-byte / content signature validation ──
    const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const checker = MAGIC[rawExt]
    if (checker && !checker(headerBytes)) {
      return loi('Nội dung tệp không khớp với định dạng khai báo. Tải lên bị từ chối.', 400)
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

    return c.json({ ok: true, key, url: fileUrl, name: file.name, size: file.size, type: file.type })
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
  const originalName = object.customMetadata?.originalName
    ? decodeURIComponent(object.customMetadata.originalName)
    : key.split('/').pop() || 'file'
  headers.set('Content-Disposition', `inline; filename="${originalName}"`)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  headers.set('Cache-Control', 'public, max-age=86400')
  headers.set('X-Content-Type-Options', 'nosniff')

  return new Response(object.body, { headers })
})

// ─────────────────────────────────────────────────────────────────────────────
// Game APIs
// ─────────────────────────────────────────────────────────────────────────────
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
  try { body = await c.req.json() } catch { return loi('Dữ liệu không hợp lệ.', 400) }
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

app.get('/api/game/rooms', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const lobby = c.env.GAME_LOBBY.get(c.env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))
  return c.json({ ok: true, rooms: await lobby.danhSach() })
})
app.all('/api/game/rooms', saiPhuongThuc)

// ─────────────────────────────────────────────────────────────────────────────
// YouTube Search Proxy
// ─────────────────────────────────────────────────────────────────────────────
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
            results.push({ videoId: v.videoId, title: v.title?.runs?.[0]?.text || 'Video YouTube', author: v.ownerText?.runs?.[0]?.text || '' })
            if (results.length >= 9) break
          }
        }
        if (results.length > 0) return c.json(results)
      } catch {}
    }
    const videoMatches = [...html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)]
    const uniqueIds = [...new Set(videoMatches.map((m) => m[1]))].slice(0, 9)
    return c.json(uniqueIds.map((id) => ({ videoId: id, title: `Video YouTube (${id})`, author: 'YouTube' })))
  } catch (err) {
    console.error('Lỗi tìm kiếm YouTube:', err)
    return c.json([])
  }
})
app.all('/api/yt-search', saiPhuongThuc)

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket routes
// ─────────────────────────────────────────────────────────────────────────────
app.get('/ws/campus', (c) => vaoCampus(c.req.raw, c.env))
app.get('/ws/room/:maPhong', (c) => vaoPhong(c.req.raw, c.env, c.req.param('maPhong')))
app.get('/ws/game/:maPhong', (c) => vaoPhongGame(c.req.raw, c.env, c.req.param('maPhong')))

// ─────────────────────────────────────────────────────────────────────────────
// 404 / Error
// ─────────────────────────────────────────────────────────────────────────────
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
