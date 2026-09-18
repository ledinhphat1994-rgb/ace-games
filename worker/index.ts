import { Hono } from 'hono'
import { taoDanhTinhCampus, TEN_CAMPUS } from './campus/danh-tinh'
import { TEN_GAME_LOBBY } from './games/game-lobby-do'
import { actorKey } from './lib/auth'
import {
  admitCookieClear,
  admitCookieSet,
  readAdmitCookie,
  signAdmitToken,
  verifyAdmitToken,
} from './lib/admission'
import { loi } from './lib/http'
import { xacMinhMatKhau } from './lib/passwords'
import { laGiaoVienDaDuyet } from './lib/scope'
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
import {
  CANONICAL_ACCESS_MODES,
  type DongPhong,
  kiemTraCauHinhMatKhauPhong,
  kiemTraPhamVi,
  xacDinhQuyenModeratorPhong,
} from './lib/room-gate'
import {
  dangKyPublishVoice,
  dangKySubscribeVoice,
  dongTrackVoice,
  forceMuteVoice,
  layVoiceRegistry,
  renegotiateVoiceSession,
  taoVoiceSession,
} from './routes/voice-api'
import { socialApp } from './routes/social'
import {
  kickMemberFromRoom,
  banMemberFromRoom,
  unbanMemberFromRoom,
  listBannedMembers,
  createReport,
  listReports,
  resolveReport,
  listAuditLogs,
} from './routes/moderation-api'

export { CampusDO } from './campus/campus-do'
export { GameLobbyDO } from './games/game-lobby-do'
export { RoomDO } from './room-do'

export type AppEnv = {
  Bindings: Env
  Variables: {
    requestId: string
  }
}

const app = new Hono<AppEnv>()

// ── Global Middleware: Request Correlation ID & Production Security Headers ──
//
// Trust model:
//   internalId  = crypto.randomUUID() — always server-generated, used in logs/audit
//   externalId  = client-supplied x-request-id after strict sanitisation, OR cf-ray,
//                 OR internalId when none is provided.
//
// The value stored in c.Variables.requestId is ALWAYS the internalId so that
// structured logs/audit metadata cannot be polluted by crafted client headers.
// The X-Request-Id response header echoes externalId (sanitised), allowing
// clients to correlate with their own IDs without trusting them internally.

/** Accept only printable ASCII (0x20–0x7E), max 128 chars. Returns null if invalid. */
function sanitizeExternalRequestId(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed.length === 0 || trimmed.length > 128) return null
  // Reject any character outside printable ASCII (block newlines, tabs, Unicode, etc.)
  if (!/^[\x20-\x7E]+$/.test(trimmed)) return null
  return trimmed
}

app.use('*', async (c, next) => {
  // Internal trusted ID — always server-generated
  const internalId = crypto.randomUUID()
  c.set('requestId', internalId)

  // External ID — sanitised or fall back to cf-ray / internalId
  const rawExternal = c.req.header('x-request-id') ?? ''
  const sanitized = rawExternal ? sanitizeExternalRequestId(rawExternal) : null
  const cfRay = c.req.header('cf-ray')?.trim() || null
  const echoId = sanitized ?? cfRay ?? internalId

  await next()
  // WebSocket 101 upgrade responses have immutable headers; skip gracefully.
  try {
    c.res.headers.set('X-Request-Id', echoId)
    c.res.headers.set('X-Content-Type-Options', 'nosniff')
    c.res.headers.set('X-Frame-Options', 'SAMEORIGIN')
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  } catch {
    // Immutable response (e.g. WebSocket upgrade 101) — headers cannot be modified; ignore.
  }
})

// Canonical Study Room key pattern: phong-<positive integer>
const RE_PHONG_ID = /^phong-(\d+)$/

const saiPhuongThuc = () => loi('Phương thức không được hỗ trợ.', 405)
const laHttps = (request: Request) => new URL(request.url).protocol === 'https:'

// ── Upload magic-byte signatures ────────────────────────────────────────────
const MAGIC: Record<string, (b: Uint8Array) => boolean> = {
  pdf:  (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46, // %PDF
  png:  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
               b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  jpg:  (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  webp: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
               b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  // PPT: OLE Compound Document signature only — content stream not inspected
  // Limitation: any OLE container can pass. Legacy format; consider removing if stricter is needed.
  ppt:  (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
  // PPTX: Verified via ZIP entry inspection in validatePptx() below (not just PK header)
  pptx: (b) => b[0] === 0x50 && b[1] === 0x4b,  // PK — full ZIP inspection done separately
}

/**
 * PPTX ZIP Inspection:
 * Validates that an uploaded archive is a genuine PowerPoint (.pptx) OOXML package.
 *
 * Security & Integrity guarantees:
 * 1. Read EOCD record backwards from end of file (capped at last 64KB).
 * 2. Walk Central Directory entries:
 *    - Cap entry count <= 500 (anti-DoS).
 *    - Sum declared uncompressed sizes of all entries; reject if > 100 MiB (ZIP bomb protection).
 *    - Locate '[Content_Types].xml' and 'ppt/presentation.xml'.
 *    - Validate offsets and entry boundaries.
 * 3. Safely decompress ONLY the small '[Content_Types].xml' entry:
 *    - Read local file header at offset from Central Directory.
 *    - Supports compression 0 (stored) and 8 (deflated).
 * 4. Verify that the decompressed XML explicitly declares the PowerPoint main presentation content type
 *    ('application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml' for '/ppt/presentation.xml').
 *
 * NOTE for legacy .ppt:
 * Only OLE compound-file container signature is verified; individual streams not parsed.
 */
async function validatePptx(fileBytes: Uint8Array): Promise<{ ok: boolean; reason?: string }> {
  const MAX_EOCD_SCAN = 65536
  const MAX_ENTRIES = 500
  const MAX_TOTAL_UNCOMPRESSED = 100 * 1024 * 1024 // 100 MiB
  const MAX_CONTENT_TYPES_BYTES = 1024 * 1024       // 1 MiB

  if (fileBytes.length < 22) return { ok: false, reason: 'Tệp quá nhỏ.' }

  // 1. Find EOCD signature (PK\x05\x06) scanning backwards from end
  const scanStart = Math.max(0, fileBytes.length - MAX_EOCD_SCAN)
  let eocdOffset = -1
  for (let i = fileBytes.length - 22; i >= scanStart; i--) {
    if (fileBytes[i] === 0x50 && fileBytes[i+1] === 0x4b &&
        fileBytes[i+2] === 0x05 && fileBytes[i+3] === 0x06) {
      eocdOffset = i
      break
    }
  }
  if (eocdOffset < 0) return { ok: false, reason: 'Không tìm thấy EOCD trong ZIP.' }

  const dv = new DataView(fileBytes.buffer, fileBytes.byteOffset, fileBytes.byteLength)
  const entryCount  = dv.getUint16(eocdOffset + 10, true)
  const cdSize      = dv.getUint32(eocdOffset + 12, true)
  const cdOffset    = dv.getUint32(eocdOffset + 16, true)

  if (entryCount > MAX_ENTRIES) return { ok: false, reason: 'ZIP có quá nhiều entry (tối đa 500).' }
  if (cdOffset + cdSize > fileBytes.length) return { ok: false, reason: 'Cấu trúc ZIP không hợp lệ.' }

  // 2. Walk Central Directory
  let hasPresentationXml = false
  let contentTypesHeaderOffset: number | null = null
  let totalUncompressed = 0
  let pos = cdOffset

  for (let i = 0; i < entryCount; i++) {
    if (pos + 46 > cdOffset + cdSize) break
    const sig = dv.getUint32(pos, true)
    if (sig !== 0x02014b50) break // PK\x01\x02

    const uncompSize = dv.getUint32(pos + 24, true)
    const fnLen = dv.getUint16(pos + 28, true)
    const extraLen = dv.getUint16(pos + 30, true)
    const commentLen = dv.getUint16(pos + 32, true)
    const localHeaderOffset = dv.getUint32(pos + 42, true)

    totalUncompressed += uncompSize
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED) {
      return { ok: false, reason: 'Tổng dung lượng giải nén vượt quá giới hạn 100MB.' }
    }

    if (pos + 46 + fnLen > fileBytes.length) break
    const fnBytes = fileBytes.slice(pos + 46, pos + 46 + fnLen)
    const name = new TextDecoder().decode(fnBytes)

    if (name === '[Content_Types].xml') {
      contentTypesHeaderOffset = localHeaderOffset
    } else if (name === 'ppt/presentation.xml') {
      hasPresentationXml = true
    }

    pos += 46 + fnLen + extraLen + commentLen
  }

  if (contentTypesHeaderOffset === null) {
    return { ok: false, reason: 'Không phải file OOXML hợp lệ (thiếu [Content_Types].xml).' }
  }
  if (!hasPresentationXml) {
    return { ok: false, reason: 'Không phải PPTX hợp lệ (thiếu ppt/presentation.xml).' }
  }

  // 3. Read and decompress ONLY [Content_Types].xml from local file header
  if (contentTypesHeaderOffset + 30 > fileBytes.length) {
    return { ok: false, reason: 'Header của [Content_Types].xml bị cắt ngắn.' }
  }
  const locSig = dv.getUint32(contentTypesHeaderOffset, true)
  if (locSig !== 0x04034b50) { // PK\x03\x04
    return { ok: false, reason: 'Chữ ký local header của [Content_Types].xml không hợp lệ.' }
  }

  const compMethod = dv.getUint16(contentTypesHeaderOffset + 8, true)
  const compSize = dv.getUint32(contentTypesHeaderOffset + 18, true)
  const locFnLen = dv.getUint16(contentTypesHeaderOffset + 26, true)
  const locExtraLen = dv.getUint16(contentTypesHeaderOffset + 28, true)
  const dataStart = contentTypesHeaderOffset + 30 + locFnLen + locExtraLen

  if (dataStart + compSize > fileBytes.length) {
    return { ok: false, reason: 'Dữ liệu của [Content_Types].xml bị cắt ngắn.' }
  }

  let xmlText = ''
  if (compMethod === 0) {
    // Stored (uncompressed)
    if (compSize > MAX_CONTENT_TYPES_BYTES) {
      return { ok: false, reason: '[Content_Types].xml vượt quá 1MB.' }
    }
    xmlText = new TextDecoder().decode(fileBytes.slice(dataStart, dataStart + compSize))
  } else if (compMethod === 8) {
    // Deflated
    try {
      const compressedSlice = fileBytes.slice(dataStart, dataStart + compSize)
      const ds = new DecompressionStream('deflate-raw')
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(compressedSlice)
          controller.close()
        },
      }).pipeThrough(ds)

      const reader = stream.getReader()
      const chunks: Uint8Array[] = []
      let bytesRead = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          bytesRead += value.byteLength
          if (bytesRead > MAX_CONTENT_TYPES_BYTES) {
            await reader.cancel()
            return { ok: false, reason: '[Content_Types].xml vượt quá 1MB sau khi giải nén.' }
          }
          chunks.push(value)
        }
      }

      const merged = new Uint8Array(bytesRead)
      let off = 0
      for (const chunk of chunks) {
        merged.set(chunk, off)
        off += chunk.byteLength
      }
      xmlText = new TextDecoder().decode(merged)
    } catch {
      return { ok: false, reason: 'Không thể giải nén [Content_Types].xml.' }
    }
  } else {
    return { ok: false, reason: `Phương thức nén ${compMethod} của [Content_Types].xml không được hỗ trợ.` }
  }

  // 4. Validate PowerPoint presentation MIME / ContentType in [Content_Types].xml
  // Require explicit declaration of PowerPoint main presentation content type for /ppt/presentation.xml
  const pptMainContentTypePattern =
    /<Override\b[^>]*(?:PartName=["']\/ppt\/presentation\.xml["'][^>]*ContentType=["']application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation\.main\+xml["']|ContentType=["']application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation\.main\+xml["'][^>]*PartName=["']\/ppt\/presentation\.xml["'])[^>]*\/?>/i
  if (!pptMainContentTypePattern.test(xmlText)) {
    return {
      ok: false,
      reason:
        '[Content_Types].xml không khai báo kiểu nội dung PowerPoint chính thức (presentationml/presentation.main+xml) cho /ppt/presentation.xml.',
    }
  }

  return { ok: true }
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
    // NOTE: OLE header validates compound-file container only; PowerPoint stream not inspected.
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
  if (phongRow.trang_thai !== 'mo') return loi('Phòng đã đóng hoặc tạm dừng hoạt động.', 403)

  // 2. Phạm vi lớp
  const loiPhamVi = await kiemTraPhamVi(env, kq.taiKhoan, phongRow)
  if (loiPhamVi) return loiPhamVi

  // 3. Kiểm tra ban — FAIL CLOSED: D1 lỗi → 503, không phải "không bị ban"
  try {
    const ban = await env.DB.prepare(
      'SELECT 1 FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2 LIMIT 1',
    )
      .bind(phongRow.id, kq.taiKhoan.id)
      .first<{ 1: number }>()
    if (ban) return loi('Bạn đã bị cấm vào phòng này.', 403)
  } catch (e) {
    // Ban table query failed (schema error, D1 unavailable, etc.)
    // D1 lỗi ≠ không bị ban → DENY admission (fail closed)
    console.error('Admission gate: lỗi kiểm tra ban:', e)
    return loi('Không thể xác minh trạng thái thành viên. Vui lòng thử lại.', 503)
  }

  // 4. Chế độ truy cập phòng (access_mode) — FAIL CLOSED
  if (!CANONICAL_ACCESS_MODES.has(phongRow.access_mode)) {
    return loi('Chế độ truy cập phòng không được hỗ trợ.', 403)
  }

  if (phongRow.access_mode === 'password') {
    if (!kiemTraCauHinhMatKhauPhong(phongRow)) {
      return loi('Cấu hình bảo mật của phòng không hợp lệ. Vui lòng liên hệ quản trị viên.', 503)
    }

    const admitToken = readAdmitCookie(request, phongRow.id)
    const hopLe = await verifyAdmitToken(env.SESSION_SECRET, admitToken, {
      roomId: phongRow.id,
      accountId: kq.taiKhoan.id,
      phienId: kq.phien.phienId!,
    })
    if (!hopLe) {
      return loi(
        'Phòng này yêu cầu mật khẩu. Vui lòng xác thực qua API trước khi kết nối.',
        403,
      )
    }
  }

  // ── Tính canModerate server-side (Scoped canonical helper) ──
  const callerKey = actorKey(kq.phien)
  const modQuyen = await xacDinhQuyenModeratorPhong(env.DB, kq.taiKhoan, phongRow, callerKey)

  // ── Forward headers to RoomDO ──────────────────────────────────────────────
  const headers = new Headers(request.headers)
  headers.set('X-Actor-Key', callerKey)
  headers.set('X-Actor-Ten', encodeURIComponent(kq.taiKhoan.ten || kq.taiKhoan.username))
  headers.set('X-Actor-Role', kq.taiKhoan.role || 'student')
  headers.set('X-Actor-Is-Admin', modQuyen.isAdmin ? '1' : '0')
  headers.set('X-Actor-Is-Teacher', modQuyen.isTeacher ? '1' : '0')
  headers.set('X-Actor-Can-Moderate', modQuyen.canModerate ? '1' : '0')
  headers.set('X-Actor-Authority-Rank', String(modQuyen.authorityRank))
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
// Verifies password → sets signed HttpOnly admission cookie → client connects WS
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
  if (!password) return loi('Thiếu mật khẩu.', 400)

  // Layer 1: Native Workers Rate Limiting edge burst protection (10 attempts / 60s per account + room)
  if (c.env.ADMIT_LIMITER) {
    try {
      const outcome = await c.env.ADMIT_LIMITER.limit({ key: `${phongId}:${kq.taiKhoan.id}` })
      if (!outcome.success) {
        return loi('Bạn đang thử mật khẩu phòng quá nhanh. Vui lòng thử lại sau giây lát.', 429)
      }
    } catch (limiterErr) {
      console.warn('[admit] Lỗi native ADMIT_LIMITER:', limiterErr)
    }
  }

  // Layer 2: Secondary approximate KV counter: 10 lần / 5 phút / tài khoản
  const rlKey = `rate:admit:${phongId}:${kq.taiKhoan.id}`
  if (c.env.RATE_LIMIT) {
    try {
      const tries = parseInt((await c.env.RATE_LIMIT.get(rlKey)) || '0', 10)
      if (Number.isFinite(tries) && tries >= 10) {
        return loi('Bạn đã thử sai quá nhiều lần. Vui lòng thử lại sau 5 phút.', 429)
      }
      try {
        await c.env.RATE_LIMIT.put(rlKey, String(tries + 1), { expirationTtl: 300 })
      } catch (putErr) {
        console.warn(`[admit] Lỗi kv.put rate limit cho key ${rlKey}:`, putErr)
      }
    } catch (getErr) {
      console.warn(`[admit] Lỗi kv.get rate limit cho key ${rlKey}:`, getErr)
    }
  }

  let phongRow: DongPhong | null = null
  try {
    phongRow = await c.env.DB.prepare(
      `SELECT id, trang_thai, pham_vi, lop_id, access_mode, mat_khau_hash, mat_khau_salt,
              mat_khau_iterations, suc_chua, chu_phong_khoa
         FROM phong WHERE id = ?1 AND loai = 'video'`,
    ).bind(phongId).first<DongPhong>()
  } catch { return loi('Không thể xác minh thông tin phòng.', 500) }

  if (!phongRow) return loi('Không tìm thấy phòng học.', 404)
  if (phongRow.trang_thai !== 'mo') return loi('Phòng đã đóng.', 403)

  // Scope check — FAIL CLOSED
  const loiPhamVi = await kiemTraPhamVi(c.env, kq.taiKhoan, phongRow)
  if (loiPhamVi) return loiPhamVi

  if (!CANONICAL_ACCESS_MODES.has(phongRow.access_mode)) {
    return loi('Chế độ truy cập phòng không được hỗ trợ.', 403)
  }
  if (phongRow.access_mode === 'public') {
    return loi('Phòng này không yêu cầu mật khẩu.', 400)
  }
  if (phongRow.access_mode === 'password') {
    if (!kiemTraCauHinhMatKhauPhong(phongRow)) {
      return loi('Cấu hình bảo mật của phòng không hợp lệ. Vui lòng liên hệ quản trị viên.', 503)
    }
  }

  // Ban check — fail closed
  try {
    const ban = await c.env.DB.prepare(
      'SELECT 1 FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2 LIMIT 1',
    ).bind(phongRow.id, kq.taiKhoan.id).first<{ 1: number }>()
    if (ban) return loi('Bạn đã bị cấm vào phòng này.', 403)
  } catch {
    return loi('Không thể xác minh trạng thái thành viên. Vui lòng thử lại.', 503)
  }

  // Verify password
  const hopLe = await xacMinhMatKhau(
    password,
    phongRow.mat_khau_hash,
    phongRow.mat_khau_salt,
    phongRow.mat_khau_iterations,
  )
  if (!hopLe) return loi('Mật khẩu không đúng.', 403)

  // Success: clear rate-limit, issue signed HttpOnly admission cookie
  try {
    await c.env.RATE_LIMIT?.delete(rlKey)
  } catch {
    // Không block admission nếu delete KV gặp lỗi
  }

  if (!c.env.SESSION_SECRET) return loi('Máy chủ chưa được cấu hình bảo mật.', 500)

  const token = await signAdmitToken(c.env.SESSION_SECRET, {
    roomId: phongRow.id,
    accountId: kq.taiKhoan.id,
    phienId: kq.phien.phienId!,
  })

  const cookieHeader = admitCookieSet(phongRow.id, token, laHttps(c.req.raw), '/')
  return c.json(
    { ok: true, roomId: phongRow.id, maPhong: `phong-${phongRow.id}` },
    200,
    { 'Set-Cookie': cookieHeader },
  )
})

// Check admission status for room (canonicalized to match vaoPhong 1:1)
app.get('/api/rooms/:id/admission-status', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const idParam = c.req.param('id')
  const phongId = parseInt(idParam || '', 10)
  if (!phongId || phongId <= 0) return loi('ID phòng không hợp lệ.', 400)

  let phongRow: DongPhong | null = null
  try {
    phongRow = await c.env.DB.prepare(
      `SELECT id, trang_thai, pham_vi, lop_id, access_mode, mat_khau_hash, mat_khau_salt,
              mat_khau_iterations, suc_chua, chu_phong_khoa
         FROM phong WHERE id = ?1 AND loai = 'video'`,
    ).bind(phongId).first<DongPhong>()
  } catch (e) {
    console.error('Admission status: lỗi truy vấn phòng:', e)
    return loi('Không thể xác minh thông tin phòng.', 500)
  }

  // Unknown room → ALWAYS 404
  if (!phongRow) return loi('Không tìm thấy phòng học.', 404)

  // 1. Phòng phải đang mở
  if (phongRow.trang_thai !== 'mo') {
    return loi('Phòng đã đóng hoặc tạm dừng hoạt động.', 403)
  }

  // 2. Phạm vi lớp (scope check)
  const loiPhamVi = await kiemTraPhamVi(c.env, kq.taiKhoan, phongRow)
  if (loiPhamVi) return loiPhamVi

  // 3. Kiểm tra ban — FAIL CLOSED: D1 lỗi → 503
  try {
    const ban = await c.env.DB.prepare(
      'SELECT 1 FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2 LIMIT 1',
    ).bind(phongRow.id, kq.taiKhoan.id).first<{ 1: number }>()
    if (ban) return loi('Bạn đã bị cấm vào phòng này.', 403)
  } catch (e) {
    console.error('Admission status: lỗi kiểm tra ban:', e)
    return loi('Không thể xác minh trạng thái thành viên. Vui lòng thử lại.', 503)
  }

  // 3.5. Kiểm tra kick cooldown từ RoomDO SQLite (durable cooldown, fail-closed)
  try {
    const doId = c.env.ROOMS.idFromName(`phong-${phongRow.id}`)
    const roomStub = c.env.ROOMS.get(doId)
    const cdRes = await roomStub.fetch(
      `http://internal/internal/moderation/cooldown?actorKey=${encodeURIComponent(actorKey(kq.phien))}`,
    )
    if (!cdRes.ok) {
      console.error('Admission status: lỗi phản hồi kiểm tra cooldown từ RoomDO:', cdRes.status)
      return loi('Không thể xác minh trạng thái kết nối phòng. Vui lòng thử lại sau.', 503)
    }
    const cdJson = (await cdRes.json().catch(() => null)) as {
      ok?: boolean
      active?: boolean
      remainingMs?: number
    } | null
    if (!cdJson || cdJson.ok !== true || typeof cdJson.active !== 'boolean') {
      console.error('Admission status: dữ liệu cooldown từ RoomDO không hợp lệ:', cdJson)
      return loi('Không thể xác minh trạng thái kết nối phòng. Vui lòng thử lại sau.', 503)
    }
    if (cdJson.active) {
      const phut = Math.ceil((cdJson.remainingMs || 300000) / 60000)
      return loi(`Bạn vừa bị mời ra khỏi phòng. Vui lòng thử lại sau ${phut} phút.`, 403)
    }
  } catch (err) {
    console.error('Admission status: lỗi RPC kiểm tra kick cooldown từ RoomDO:', err)
    return loi('Không thể xác minh trạng thái kết nối phòng. Vui lòng thử lại sau.', 503)
  }

  // 4. Chế độ truy cập phòng (access_mode) — FAIL CLOSED
  if (!CANONICAL_ACCESS_MODES.has(phongRow.access_mode)) {
    return loi('Chế độ truy cập phòng không được hỗ trợ.', 403)
  }

  // 5. Password room
  if (phongRow.access_mode === 'password') {
    if (!kiemTraCauHinhMatKhauPhong(phongRow)) {
      return loi('Cấu hình bảo mật của phòng không hợp lệ. Vui lòng liên hệ quản trị viên.', 503)
    }

    const token = readAdmitCookie(c.req.raw, phongRow.id)
    if (!token || !c.env.SESSION_SECRET) {
      return c.json({ accessMode: 'password', admitted: false, reason: 'admission_required' }, 200)
    }

    const isValid = await verifyAdmitToken(c.env.SESSION_SECRET, token, {
      roomId: phongRow.id,
      accountId: kq.taiKhoan.id,
      phienId: kq.phien.phienId!,
    })

    if (!isValid) {
      return c.json({ accessMode: 'password', admitted: false, reason: 'admission_required' }, 200)
    }

    return c.json({ accessMode: 'password', admitted: true }, 200)
  }

  // 6. Public room (all checks passed)
  return c.json({ accessMode: 'public', admitted: true }, 200)
})

// Invalidate admission cookie (logout from password room)
app.post('/api/rooms/:id/admit/revoke', async (c) => {
  const idParam = c.req.param('id')
  const phongId = parseInt(idParam || '', 10)
  if (!phongId) return loi('ID phòng không hợp lệ.', 400)
  const cookieClear = admitCookieClear(phongId, laHttps(c.req.raw), '/')
  return c.json({ ok: true }, 200, { 'Set-Cookie': cookieClear })
})

app.all('/api/rooms/:id/admit', saiPhuongThuc)
app.all('/api/rooms/:id/admit/revoke', saiPhuongThuc)
app.all('/api/rooms/:id/admission-status', saiPhuongThuc)

// ── Authenticated Real Voice API ──
app.post('/api/rooms/:id/voice/session', taoVoiceSession)
app.post('/api/rooms/:id/voice/publish', dangKyPublishVoice)
app.post('/api/rooms/:id/voice/subscribe', dangKySubscribeVoice)
app.post('/api/rooms/:id/voice/renegotiate', renegotiateVoiceSession)
app.post('/api/rooms/:id/voice/close-track', dongTrackVoice)
app.post('/api/rooms/:id/voice/force-mute', forceMuteVoice)
app.get('/api/rooms/:id/voice/registry', layVoiceRegistry)
app.all('/api/rooms/:id/voice/*', saiPhuongThuc)

// ── Moderation & Safety API ──
app.post('/api/rooms/:id/kick', kickMemberFromRoom)
app.post('/api/rooms/:id/ban', banMemberFromRoom)
app.post('/api/rooms/:id/unban', unbanMemberFromRoom)
app.get('/api/rooms/:id/banned-members', listBannedMembers)
app.post('/api/reports', createReport)
app.get('/api/reports', listReports)
app.post('/api/reports/:id/resolve', resolveReport)
app.get('/api/moderation/audit-logs', listAuditLogs)

// ─────────────────────────────────────────────────────────────────────────────
// Auth routes
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/login', (c) => {
  let ctx: { waitUntil(promise: Promise<unknown>): void } | undefined
  try { ctx = c.executionCtx } catch {}
  return dangNhap(c.req.raw, c.env, ctx)
})
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
// R2 File Upload (Auth + Quota + Extension + MIME + Magic Bytes + PPTX ZIP inspect)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/upload', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  // 1. Edge burst anti-abuse limiter (Workers Rate Limiting binding): 10 uploads / 60s per actor
  if (c.env.UPLOAD_LIMITER) {
    try {
      const rlRes = await c.env.UPLOAD_LIMITER.limit({ key: `up:${kq.taiKhoan.id}` })
      if (!rlRes.success) {
        return loi('Bạn đã tải lên quá nhiều tệp trong thời gian ngắn. Vui lòng đợi 1 phút.', 429)
      }
    } catch (rlErr) {
      console.warn(`[upload] Lỗi UPLOAD_LIMITER cho actor ${kq.taiKhoan.id}:`, rlErr)
      // Fail-open for edge limiter error
    }
  }

  // 2. Long-window user quota: 20 uploads / 10 phút (600s) với fail-open KV handling
  if (c.env.RATE_LIMIT) {
    const rateKey = `rate:upload:${kq.taiKhoan.id}`
    try {
      const count = parseInt((await c.env.RATE_LIMIT.get(rateKey)) || '0', 10)
      if (Number.isFinite(count) && count >= 20) {
        return loi('Bạn đã tải lên quá nhiều tệp trong thời gian ngắn. Vui lòng đợi 10 phút.', 429)
      }
      try {
        await c.env.RATE_LIMIT.put(rateKey, String(count + 1), { expirationTtl: 600 })
      } catch (putErr) {
        console.warn(`[upload] Lỗi kv.put rate limit cho key ${rateKey}:`, putErr)
        // Fail-open: không crash 500 khi KV đụng ngưỡng 1 write/s hoặc lỗi mạng
      }
    } catch (getErr) {
      console.warn(`[upload] Lỗi kv.get rate limit cho key ${rateKey}:`, getErr)
      // Fail-open: tiếp tục cho phép upload hợp lệ nếu KV tạm thời không sẵn sàng
    }
  }

  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    if (!file) return loi('Vui lòng chọn tệp để tải lên.', 400)

    const rawExt = file.name.includes('.') ? file.name.toLowerCase().split('.').pop() || '' : ''
    const rule = ALLOWED_UPLOAD_EXTS[rawExt]
    if (!rule) return loi('Định dạng tệp không được hỗ trợ.', 400)
    if (file.size > rule.maxBytes) return loi(`Kích thước tệp vượt quá giới hạn (${Math.round(rule.maxBytes / (1024 * 1024))}MB).`, 400)
    if (file.type && !rule.allowedMimes.includes(file.type)) return loi('Kiểu tệp (MIME type) không khớp.', 400)

    // Load full bytes for both magic check and PPTX ZIP inspection
    const fileBuffer = await file.arrayBuffer()
    const fileBytes = new Uint8Array(fileBuffer)

    // Magic byte validation
    const checker = MAGIC[rawExt]
    if (checker && !checker(fileBytes)) return loi('Nội dung tệp không khớp với định dạng khai báo. Tải lên bị từ chối.', 400)

    // PPTX: deep ZIP inspection (not just PK header)
    if (rawExt === 'pptx') {
      const pptxCheck = await validatePptx(fileBytes)
      if (!pptxCheck.ok) return loi(`Tệp PPTX không hợp lệ: ${pptxCheck.reason}`, 400)
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50)
    const key = `${rule.folder}/${Date.now()}_${crypto.randomUUID()}_${safeName}`

    await c.env.ANH.put(key, fileBytes, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
      customMetadata: {
        originalName: encodeURIComponent(file.name),
        size: String(file.size),
        uploaderId: String(kq.taiKhoan.id),
      },
    })

    const origin = new URL(c.req.url).origin
    return c.json({ ok: true, key, url: `${origin}/api/files/${key}`, name: file.name, size: file.size, type: file.type })
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
  if (!gameType || typeof score !== 'number' || score < 0 || !Number.isFinite(score)) return loi('Thông tin điểm không hợp lệ.', 400)
  const ten = kq.taiKhoan.ten || kq.taiKhoan.username
  await c.env.DB.prepare(
    'INSERT INTO game_high_scores (game_type, account_id, player_name, score, created_at) VALUES (?1, ?2, ?3, ?4, ?5)'
  ).bind(gameType, kq.taiKhoan.id, ten, Math.round(score), Date.now()).run()
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
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept-Language': 'vi,en;q=0.9' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return c.json([])
    const html = await res.text()
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/)
    if (match) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = JSON.parse(match[1]) as any
        const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || []
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
    const ids = [...new Set([...html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)].map((m) => m[1]))].slice(0, 9)
    return c.json(ids.map((id) => ({ videoId: id, title: `Video YouTube (${id})`, author: 'YouTube' })))
  } catch { return c.json([]) }
})
app.all('/api/yt-search', saiPhuongThuc)

// ─────────────────────────────────────────────────────────────────────────────
// Social Graph & Presence APIs
// ─────────────────────────────────────────────────────────────────────────────
app.route('/api/social', socialApp)

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
  const reqId = c.get('requestId') || 'no-req-id'
  console.error(`[${reqId}] Lỗi khi xử lý ${c.req.method} ${new URL(c.req.url).pathname}:`, err)
  return loi('Máy chủ gặp lỗi, vui lòng thử lại.', 500)
})

export default app
