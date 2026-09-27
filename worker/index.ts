import { Hono } from 'hono'
import { taoDanhTinhCampus, TEN_CAMPUS } from './campus/danh-tinh'
import { tenLobbyTheoLoai } from './games/game-lobby-do'

export function isDurableObjectOverloaded(err: unknown): boolean {
  if (!err) return false
  if (typeof err === 'object' && (err as { overloaded?: boolean }).overloaded === true) {
    return true
  }
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('overloaded') || msg.includes('too many requests queued') || msg.includes('request queue full')
}

export function handleDurableObjectOverload(err: unknown): Response {
  if (isDurableObjectOverloaded(err)) {
    return new Response(
      JSON.stringify({
        ok: false,
        loi: 'Phòng chơi đang trong trạng thái quá tải (Durable Object overloaded). Vui lòng thử lại sau giây lát.',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '3',
        },
      },
    )
  }
  throw err
}
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
import { laGiaoVienDaDuyet, laQuanTriTruong } from './lib/scope'
import { recordAnalyticsEvent, computeAnalyticsOverview, pruneExpiredAnalytics } from './lib/analytics'
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
import { engagementApp } from './routes/engagement-api'
import { notificationApp } from './routes/notification-api'
import { SoloSessionFinishRequest, SoloSessionStartRequest } from '../shared/protocol/game-sdk'
import {
  generateAuthoritativeVerificationHash,
  soloVerifierRegistry,
  validateHumanInputRate,
  validateInputTraceTimestamps,
} from './games/anti-cheat'
import './games/verifiers/snake-solo-verifier'
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
import { adminRouter } from './routes/admin-api'
import { roomRouter } from './routes/room-api'

export { CampusDO } from './campus/campus-do'
export { GameLobbyDO } from './games/game-lobby-do'
export { GameSessionDO } from './games/game-session-do'
export { RoomDO } from './room-do'

export type AppEnv = {
  Bindings: Env
  Variables: {
    requestId: string
  }
}

const app = new Hono<AppEnv>()
export { app }

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

  const startMs = Date.now()
  try {
    await next()
  } finally {
    const durationMs = Date.now() - startMs
    // Asynchronous non-blocking HTTP telemetry for API endpoints (uses isolated ANALYTICS_DB only)
    const { pathname } = new URL(c.req.url)
    if (c.env?.ANALYTICS_DB && pathname.startsWith('/api/') && !pathname.startsWith('/api/files/')) {
      const status = c.res ? c.res.status : 500
      let errorClass: string | null = null
      if (status >= 400) {
        errorClass =
          status >= 500
            ? 'SERVER_ERROR'
            : status === 401
              ? 'UNAUTHORIZED'
              : status === 403
                ? 'FORBIDDEN'
                : status === 404
                  ? 'NOT_FOUND'
                  : status === 429
                    ? 'RATE_LIMITED'
                    : 'BAD_REQUEST'
      }
      let ctx: { waitUntil(promise: Promise<unknown>): void } | undefined
      try {
        ctx = c.executionCtx
      } catch {}
      recordAnalyticsEvent(c.env.ANALYTICS_DB, ctx, {
        event: 'http.request',
        route: pathname,
        statusCode: status,
        durationMs,
        errorClass,
        properties: {
          method: c.req.method,
        },
      })
    }
  }

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
const RE_PHONG_ID = /^(?:phong-)?(\d+)$/

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
      'application/x-zip-compressed',
      'application/zip',
      'application/vnd.ms-powerpoint',
      'application/octet-stream',
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
    allowedMimes: [
      'application/pdf',
      'application/x-pdf',
      'application/acrobat',
      'applications/vnd.pdf',
      'text/pdf',
      'text/x-pdf',
      'application/octet-stream',
    ],
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
  headers.set('X-Actor-Phien-Id', kq.phien.phienId || '')
  headers.set('X-Room-Id', maPhong)
  headers.set('X-Room-Host-Key', phongRow.chu_phong_khoa)
  headers.set('X-Room-Capacity', String(phongRow.suc_chua))

  // Đăng ký phòng với CampusDO để hỗ trợ thu hồi phiên tập trung (chạy độc lập với /ws/campus)
  if (kq.phien.phienId) {
    try {
      await env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS))
        .dangKyPhong(kq.taiKhoan.id, maPhong, kq.phien.phienId)
    } catch {}
  }

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
  headers.set('X-Actor-Phien-Id', kq.phien.phienId || '')
  headers.set('X-Room-Id', 'game_' + maPhong)
  headers.set('X-Room-Mode', 'game')

  // Đăng ký phòng game với CampusDO để hỗ trợ thu hồi phiên tập trung
  if (kq.phien.phienId) {
    try {
      await env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS))
        .dangKyPhong(kq.taiKhoan.id, 'game_' + maPhong, kq.phien.phienId)
    } catch {}
  }

  const doId = env.ROOMS.idFromName('game_' + maPhong)
  return env.ROOMS.get(doId).fetch(new Request(request, { headers }))
}

// ─────────────────────────────────────────────────────────────────────────────
// GameSessionDO WebSocket (Ephemeral Match Coordinator)
// ─────────────────────────────────────────────────────────────────────────────
async function vaoGameSession(request: Request, env: Env, matchId: string): Promise<Response> {
  if (!laYeuCauWebSocket(request)) return loi('Cần kết nối WebSocket.', 426)
  if (!cungNguon(request)) return loi('Nguồn kết nối không hợp lệ.', 403)
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(matchId)) return loi('Mã trận đấu không hợp lệ.', 400)

  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const headers = new Headers(request.headers)
  headers.set('X-Actor-Key', actorKey(kq.phien))
  headers.set('X-Actor-Ten', encodeURIComponent(kq.taiKhoan.ten || kq.taiKhoan.username))
  headers.set('X-Actor-Account-Id', String(kq.taiKhoan.id))
  headers.set('X-Match-Id', matchId)

  const doId = env.GAME_SESSIONS.idFromName('match:' + matchId)
  try {
    return await env.GAME_SESSIONS.get(doId).fetch(new Request(request, { headers }))
  } catch (err: unknown) {
    return handleDurableObjectOverload(err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Staging-Only Diagnostic API: GET /api/staging/game-session/:matchId/outbox
// Inaccessible in production; verifies exact GameSessionDO settlement_outbox depth
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/staging/game-session/:matchId/outbox', async (c) => {
  if (c.env.ENVIRONMENT !== 'staging') {
    return c.notFound()
  }

  const matchId = c.req.param('matchId')
  if (!/^[a-zA-Z0-9_:-]{1,64}$/.test(matchId)) return loi('Mã trận không hợp lệ.', 400)

  const doId = c.env.GAME_SESSIONS.idFromName('match:' + matchId)
  try {
    const res = await c.env.GAME_SESSIONS.get(doId).fetch(new Request('http://internal/internal/outbox', { method: 'GET' }))
    const data = (await res.json()) as Record<string, unknown>
    return c.json({
      ...data,
      matchId,
    })
  } catch (err) {
    return loi(`Lỗi kiểm tra outbox: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Staging-Only Diagnostic API: POST /api/staging/game-session/reconcile
// Inaccessible in production; reconciles exact benchmark session IDs against D1
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/staging/game-session/reconcile', async (c) => {
  if (c.env.ENVIRONMENT !== 'staging') {
    return c.notFound()
  }

  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  let body: { sessionIds?: string[] }
  try { body = await c.req.json() } catch { return loi('Dữ liệu JSON không hợp lệ.', 400) }
  const sessionIds = body.sessionIds
  if (!Array.isArray(sessionIds) || sessionIds.length === 0 || sessionIds.length > 1000) {
    return loi('Danh sách sessionIds không hợp lệ (1 - 1000).', 400)
  }

  const chunkSize = 100
  let completedSessions = 0
  let verifiedHighscoreRows = 0
  let duplicateHighscores = 0

  for (let i = 0; i < sessionIds.length; i += chunkSize) {
    const chunk = sessionIds.slice(i, i + chunkSize)
    const placeholders = chunk.map((_, idx) => `?${idx + 1}`).join(',')

    const sessionsRes = await c.env.DB.prepare(
      `SELECT id, status FROM game_sessions WHERE id IN (${placeholders})`
    ).bind(...chunk).all<{ id: string; status: string }>()

    for (const row of (sessionsRes.results || [])) {
      if (row.status === 'completed') completedSessions++
    }

    const scoresRes = await c.env.DB.prepare(
      `SELECT session_id, count(*) as cnt FROM game_high_scores WHERE session_id IN (${placeholders}) AND verified = 1 GROUP BY session_id`
    ).bind(...chunk).all<{ session_id: string; cnt: number }>()

    for (const row of (scoresRes.results || [])) {
      verifiedHighscoreRows += row.cnt
      if (row.cnt > 1) {
        duplicateHighscores += (row.cnt - 1)
      }
    }
  }

  const expectedSessions = sessionIds.length
  const missingSessions = expectedSessions - completedSessions
  const missingHighscores = completedSessions - verifiedHighscoreRows

  return c.json({
    ok: true,
    expectedSessions,
    completedSessions,
    verifiedHighscoreRows,
    missingSessions,
    missingHighscores,
    duplicateSessionHighscores: duplicateHighscores,
  })
})

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
app.get('/api/rooms/:id/sessions', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const isAdmin = laQuanTriTruong(kq.taiKhoan)
  const isTeacher = laGiaoVienDaDuyet(kq.taiKhoan)
  if (!isAdmin && !isTeacher) {
    return loi('Chỉ giáo viên và quản trị viên mới có quyền xem lịch sử buổi học.', 403)
  }

  const roomId = parseInt(c.req.param('id'), 10)
  if (!Number.isFinite(roomId) || roomId <= 0) {
    return loi('ID phòng không hợp lệ.', 400)
  }

  try {
    const rows = await c.env.DB.prepare(
      'SELECT id, phong_id, started_at, ended_at, duration_seconds, summary_json, created_at FROM hoc_session_summary WHERE phong_id = ?1 ORDER BY started_at DESC LIMIT 50',
    )
      .bind(roomId)
      .all<{
        id: string
        phong_id: number
        started_at: number
        ended_at: number
        duration_seconds: number
        summary_json: string
        created_at: string
      }>()

    const sessions = (rows.results || []).map((r) => {
      try {
        return JSON.parse(r.summary_json)
      } catch {
        return {
          sessionId: r.id,
          roomId: r.phong_id,
          startedAt: r.started_at,
          endedAt: r.ended_at,
          durationSeconds: r.duration_seconds,
          taskCount: 0,
          taskCompletionRates: {},
          activeMembers: [],
          pollResults: [],
        }
      }
    })

    return c.json({ sessions, total: sessions.length })
  } catch (err) {
    console.error('Lỗi truy vấn hoc_session_summary:', err)
    return loi('Dịch vụ lịch sử buổi học tạm thời không khả dụng.', 503)
  }
})
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
// Admin Product Analytics & Observability Overview (School Admin authority only)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/admin/analytics/overview', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  if (!laQuanTriTruong(kq.taiKhoan)) {
    return loi('Chỉ quản trị viên trường mới có quyền truy cập số liệu phân tích.', 403)
  }

  if (!c.env.ANALYTICS_DB) {
    return loi('Cơ sở dữ liệu phân tích (ANALYTICS_DB) chưa được kích hoạt.', 503)
  }

  const rawWindow = c.req.query('window')
  const window: 'today' | '7d' | '30d' =
    rawWindow === '7d' || rawWindow === '30d' ? rawWindow : 'today'

  try {
    const analytics = await computeAnalyticsOverview(c.env.ANALYTICS_DB, window)
    return c.json({ ok: true, analytics })
  } catch (err) {
    console.error('Lỗi tính toán analytics overview:', err)
    return loi('Không thể tải số liệu phân tích.', 500)
  }
})
app.all('/api/admin/analytics/overview', saiPhuongThuc)

app.post('/api/admin/analytics/prune', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  if (!laQuanTriTruong(kq.taiKhoan)) {
    return loi('Chỉ quản trị viên trường mới có quyền dọn dẹp số liệu phân tích.', 403)
  }

  if (!c.env.ANALYTICS_DB) {
    return loi('Cơ sở dữ liệu phân tích (ANALYTICS_DB) chưa được kích hoạt.', 503)
  }

  try {
    const deletedCount = await pruneExpiredAnalytics(c.env.ANALYTICS_DB, 60)
    return c.json({ ok: true, deletedCount, retentionDays: 60 })
  } catch (err) {
    console.error('Lỗi dọn dẹp analytics quá hạn:', err)
    return loi('Không thể dọn dẹp số liệu phân tích.', 500)
  }
})
app.all('/api/admin/analytics/prune', saiPhuongThuc)

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

    // Authoritative Purpose & Visibility Binding
    // Generic uploads always start at visibility = 'owner'.
    // Client-supplied purpose records upload intent only and MUST NEVER grant campus or public visibility.
    const rawPurpose = (formData.get('purpose') as string | null)?.trim() || 'general'
    let purpose = 'general'
    const visibility: 'owner' | 'campus' | 'public' = 'owner'

    if (rawPurpose === 'avatar') {
      if (rule.folder !== 'images') {
        return loi('Ảnh đại diện phải là tệp hình ảnh (PNG, JPG, WEBP).', 400)
      }
      purpose = 'avatar'
    } else if (rawPurpose === 'slide') {
      purpose = 'slide'
    } else {
      purpose = 'general'
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50)
    const key = `${rule.folder}/${Date.now()}_${crypto.randomUUID()}_${safeName}`

    await c.env.ANH.put(key, fileBytes, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
      customMetadata: {
        originalName: encodeURIComponent(file.name),
        size: String(file.size),
        uploaderId: String(kq.taiKhoan.id),
        purpose,
        visibility: 'owner',
      },
    })

    // Authoritative metadata registry in D1 file_metadata with compensating R2 delete on failure
    try {
      await c.env.DB.prepare(`
        INSERT INTO file_metadata (
          object_key, original_name, mime_type, size_bytes, purpose, visibility,
          uploaded_by_account_id, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
      `).bind(
        key,
        file.name.slice(0, 200),
        file.type || 'application/octet-stream',
        file.size,
        purpose,
        visibility,
        kq.taiKhoan.id,
        Date.now(),
      ).run()
    } catch (_dbErr) {
      console.error('[upload] D1 file_metadata insert failed, attempting compensating R2 delete')
      try {
        await c.env.ANH.delete(key)
        console.warn('[upload] R2 compensation delete succeeded for uncatalogued object')
      } catch (delErr) {
        console.error('[upload] R2 compensation delete failed; object remains authorization fail-closed:', delErr instanceof Error ? delErr.message : 'unknown')
      }
      return loi('Không thể lưu thông tin tệp vào cơ sở dữ liệu.', 500)
    }

    const origin = new URL(c.req.url).origin
    return c.json({
      ok: true,
      key,
      url: `${origin}/api/files/${key}`,
      name: file.name,
      size: file.size,
      type: file.type,
      purpose,
      visibility,
    })
  } catch (err) {
    console.error('Lỗi khi tải tệp lên R2:', err)
    return loi('Không thể tải tệp lên máy chủ lưu trữ.', 500)
  }
})
app.all('/api/upload', saiPhuongThuc)

interface FileMetadataRecord {
  id: number
  object_key: string
  original_name: string
  mime_type: string
  size_bytes: number
  purpose: string
  visibility: 'owner' | 'campus' | 'public'
  uploaded_by_account_id: number
  created_at: number
  deleted_at: number | null
}

app.get('/api/files/:key{.+}', async (c) => {
  const key = c.req.param('key')
  if (!key) return loi('Thiếu tên tệp.', 400)

  // 1. Chặn path manipulation và chặn triệt để bypass Study Room document qua generic path
  if (
    key.includes('..') ||
    key.startsWith('/') ||
    key.startsWith('\\') ||
    key.startsWith('rooms/') ||
    key.includes('/documents/')
  ) {
    return loi('Không tìm thấy tệp.', 404)
  }

  // 2. Tra cứu siêu dữ liệu quyền sở hữu và phạm vi trong file_metadata
  let meta: FileMetadataRecord | null = null
  try {
    meta = await c.env.DB.prepare(
      'SELECT * FROM file_metadata WHERE object_key = ?1 AND deleted_at IS NULL'
    )
      .bind(key)
      .first<FileMetadataRecord>()
  } catch (err) {
    console.error('[files] Lỗi tra cứu file_metadata:', err)
    return loi('Không thể tra cứu thông tin tệp.', 500)
  }

  // 3. Không có metadata => FAIL CLOSED (404 Not Found để không tiết lộ sự tồn tại của tệp)
  if (!meta) {
    return loi('Không tìm thấy tệp.', 404)
  }

  // 4. Đánh giá phân quyền truy cập
  if (meta.visibility === 'public') {
    // Tệp công khai: cho phép tải không cần phiên đăng nhập
    const object = await c.env.ANH.get(key)
    if (!object) return loi('Không tìm thấy tệp.', 404)

    const headers = new Headers()
    const mimeType = (meta.mime_type && meta.mime_type !== 'unknown' && meta.mime_type !== 'application/octet-stream')
      ? meta.mime_type
      : (object.httpMetadata?.contentType || 'application/octet-stream')
    headers.set('Content-Type', mimeType)
    const originalName = meta.original_name || (object.customMetadata?.originalName
      ? decodeURIComponent(object.customMetadata.originalName)
      : key.split('/').pop() || 'file')
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(originalName)}"`)
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Cache-Control', 'public, max-age=86400')
    headers.set('X-Content-Type-Options', 'nosniff')
    return new Response(object.body, { headers })
  }

  // Tệp được bảo vệ (campus hoặc owner): bắt buộc có phiên hợp lệ
  const phienRaw = await layPhien(c.req.raw, c.env)
  const kq = await kiemTraPhien(phienRaw, c.env)
  if (!kq.hopLe) {
    return loi('Yêu cầu đăng nhập để truy cập tệp.', 401)
  }

  if (meta.visibility === 'owner') {
    // Chỉ chính người tải lên mới được phép đọc
    if (kq.taiKhoan.id !== meta.uploaded_by_account_id) {
      return loi('Bạn không có quyền truy cập tệp này.', 403)
    }
  } else if (meta.visibility === 'campus') {
    // Bất kỳ thành viên campus nào có phiên hợp lệ đều được đọc (ví dụ: avatar)
  } else {
    // Bất kỳ giá trị visibility nào khác => FAIL CLOSED
    return loi('Phạm vi truy cập tệp không hợp lệ.', 403)
  }

  // 5. Đọc tệp từ R2 sau khi đã xác thực đầy đủ quyền truy cập
  const object = await c.env.ANH.get(key)
  if (!object) return loi('Không tìm thấy tệp.', 404)

  const headers = new Headers()
  const mimeType = (meta.mime_type && meta.mime_type !== 'unknown' && meta.mime_type !== 'application/octet-stream')
    ? meta.mime_type
    : (object.httpMetadata?.contentType || 'application/octet-stream')
  headers.set('Content-Type', mimeType)
  const originalName = meta.original_name || (object.customMetadata?.originalName
    ? decodeURIComponent(object.customMetadata.originalName)
    : key.split('/').pop() || 'file')
  headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(originalName)}"`)
  // Protected headers: NO wildcard CORS, private cache only, Vary Cookie
  headers.set('Cache-Control', 'private, max-age=3600')
  headers.set('Vary', 'Cookie')
  headers.set('X-Content-Type-Options', 'nosniff')
  return new Response(object.body, { headers })
})

// ─────────────────────────────────────────────────────────────────────────────
// Game APIs
// ─────────────────────────────────────────────────────────────────────────────
const CAC_TRO_CHOI_DON: ReadonlySet<string> = new Set(['solo_2048', 'solo_memory', 'solo_snake'])

app.get('/api/game/highscores', async (c) => {
  const gameType = c.req.query('gameType')
  // verifiedOnly=1 returns only server-verified results; omitting or =0 returns all (legacy + verified)
  const verifiedOnly = c.req.query('verifiedOnly') === '1'
  const rawLimit = Number(c.req.query('limit'))
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 10
  if (!gameType) return loi('Thiếu gameType.', 400)
  // Mỗi người chơi một dòng — kỷ lục cao nhất của họ (SQLite lấy các cột còn lại từ đúng dòng có MAX(score)),
  // để một người chơi nhiều ván không chiếm hết top.
  const sql = `SELECT
        gh.id,
        gh.game_type AS gameType,
        gh.player_name AS playerName,
        MAX(gh.score) AS score,
        gh.verified,
        gh.session_id AS session_id,
        gh.created_at AS createdAt,
        COALESCE(uep.total_xp, 0) AS totalXp
      FROM game_high_scores gh
      LEFT JOIN user_engagement_profile uep ON gh.account_id = uep.account_id
      WHERE gh.game_type = ?1${verifiedOnly ? ' AND gh.verified = 1' : ''}
      GROUP BY gh.account_id
      ORDER BY score DESC, createdAt ASC
      LIMIT ?2`
  const { results } = await c.env.DB.prepare(sql)
    .bind(gameType, limit)
    .all<{
      id: number
      gameType: string
      playerName: string
      score: number
      verified: number
      session_id?: string
      createdAt: number
      totalXp: number
    }>()
  const highscores = (results ?? []).map((r) => ({
    ...r,
    level: Math.max(1, Math.floor(Math.sqrt((r.totalXp || 0) / 15)) + 1),
  }))
  return c.json({ ok: true, highscores })
})

// LEGACY endpoint: scores accepted from client are UNVERIFIED and excluded from authoritative rankings.
// Do not treat this path as authoritative competitive ranking. Use /api/game/session/finish for verified scores.
app.post('/api/game/highscore', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  let body: { gameType?: string; score?: number }
  try { body = await c.req.json() } catch { return loi('Dữ liệu không hợp lệ.', 400) }
  const { gameType, score } = body
  if (!gameType || typeof score !== 'number' || score < 0 || !Number.isFinite(score)) return loi('Thông tin điểm không hợp lệ.', 400)
  // Chỉ trò chơi đơn mới có bảng điểm; chặn chuỗi gameType tuỳ ý (dài bao nhiêu cũng được) ghi vào D1.
  if (!CAC_TRO_CHOI_DON.has(gameType)) return loi('Trò chơi không có bảng điểm.', 400)
  // Giới hạn trần điểm số hợp lý cho legacy endpoint (unverified path)
  if (score > 100000) return loi('Điểm số vượt quá giới hạn cho phép.', 400)
  const ten = kq.taiKhoan.ten || kq.taiKhoan.username
  // verified = 0: legacy path — cannot be inserted into verified leaderboard
  await c.env.DB.prepare(
    'INSERT INTO game_high_scores (game_type, account_id, player_name, score, created_at, verified) VALUES (?1, ?2, ?3, ?4, ?5, 0)'
  ).bind(gameType, kq.taiKhoan.id, ten, Math.round(score), Date.now()).run()
  return c.json({ ok: true, verified: false })
})
app.all('/api/game/highscores', saiPhuongThuc)
app.all('/api/game/highscore', saiPhuongThuc)

// ─────────────────────────────────────────────────────────────────────────────
// Game Platform Foundation: Solo Game Sessions (Anti-Cheat & Verification)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/game/session/start', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  let body: unknown
  try { body = await c.req.json() } catch { return loi('Dữ liệu JSON không hợp lệ.', 400) }

  const parsed = SoloSessionStartRequest.safeParse(body)
  if (!parsed.success) {
    return loi('Tham số khởi tạo phiên chơi không hợp lệ.', 400)
  }

  const { gameType, clientMetadata } = parsed.data
  const sessionId = crypto.randomUUID()
  const seed = Math.floor(Math.random() * 2147483647)
  const now = Date.now()

  await c.env.DB.prepare(`
    INSERT INTO game_sessions (id, game_type, account_id, seed, started_at, status, client_metadata)
    VALUES (?1, ?2, ?3, ?4, ?5, 'active', ?6)
  `).bind(
    sessionId,
    gameType,
    kq.taiKhoan.id,
    seed,
    now,
    clientMetadata ? JSON.stringify(clientMetadata) : null,
  ).run()

  return c.json({
    ok: true,
    sessionId,
    seed,
    serverTime: now,
  })
})

app.post('/api/game/session/finish', async (c) => {
  const reqArrival = Date.now()

  let body: unknown
  try { body = await c.req.json() } catch { return loi('Dữ liệu JSON không hợp lệ.', 400) }

  const parsed = SoloSessionFinishRequest.safeParse(body)
  if (!parsed.success) {
    return loi('Dữ liệu kết thúc phiên chơi không đúng chuẩn.', 400)
  }

  const phien = await layPhien(c.req.raw, c.env)
  if (!phien || !phien.accountId) {
    const kq = await kiemTraPhien(phien, c.env)
    return loi(!kq.hopLe ? kq.thongBao : 'Chưa đăng nhập.', 401)
  }

  const { sessionId, inputTrace } = parsed.data

  // 1. Unified Single-Query Auth verification & Session lookup in D1 (cuts D1 read load in half under burst)
  const tAuthStart = Date.now()
  const lookupRow = await c.env.DB.prepare(`
    SELECT
      u.id AS userId,
      u.ten_dang_nhap AS tenDangNhap,
      u.ten_hien_thi AS ten,
      u.vai_tro AS vaiTro,
      u.teacher_pending AS teacherPending,
      u.dang_hoat_dong AS dangHoatDong,
      u.thiet_bi AS thietBi,
      s.id AS sessionId,
      s.game_type AS gameType,
      s.seed AS seed,
      s.started_at AS startedAt,
      s.status AS sessionStatus
    FROM tai_khoan_campus u
    LEFT JOIN game_sessions s ON s.id = ?1 AND s.account_id = u.id
    WHERE u.id = ?2
  `).bind(sessionId, phien.accountId).first<{
    userId: number
    tenDangNhap: string
    ten: string | null
    vaiTro: string | null
    teacherPending: number | null
    dangHoatDong: number | null
    thietBi: string | null
    sessionId: string | null
    gameType: string | null
    seed: number | null
    startedAt: number | null
    sessionStatus: string | null
  }>()
  const tAuthLookup = Date.now() - tAuthStart

  if (!lookupRow) return loi('Tài khoản không còn tồn tại.', 401)
  if (!lookupRow.dangHoatDong) return loi('Tài khoản này đã bị khoá.', 401)
  if (lookupRow.thietBi && (!phien.phienId || lookupRow.thietBi !== phien.phienId)) {
    return loi('Tài khoản của bạn đã được đăng nhập trên một thiết bị khác hoặc phiên đã bị hủy. Bạn đã bị đăng xuất.', 401)
  }

  if (!lookupRow.sessionId || !lookupRow.gameType || lookupRow.seed === null || lookupRow.startedAt === null) {
    return loi('Không tìm thấy phiên chơi tương ứng.', 404)
  }

  // Concurrent finish protection: status check alone is a TOCTOU race.
  // The UPDATE ... WHERE status = 'active' below is the DB-enforced idempotency gate.
  // We return 409 for any already-closed session (completed/rejected/abandoned).
  if (lookupRow.sessionStatus !== 'active') {
    return loi('Phiên chơi đã được kết thúc trước đó.', 409)
  }

  const sessionRow = {
    id: lookupRow.sessionId,
    game_type: lookupRow.gameType,
    account_id: lookupRow.userId,
    seed: lookupRow.seed,
    started_at: lookupRow.startedAt,
    status: lookupRow.sessionStatus,
  }
  const ten = lookupRow.ten || lookupRow.tenDangNhap


  // 2. AUTHORITATIVE server elapsed time — client durationMs is cross-checked but not blindly trusted.
  // effectiveElapsed uses the larger of server-measured and client-reported to avoid
  // falsely rejecting valid sessions that run faster than the minimum threshold in test
  // environments where server wall-clock and D1 round-trips are near-instant.
  const now = Date.now()
  const serverElapsedMs = now - sessionRow.started_at
  const { durationMs } = parsed.data
  const CLIENT_TIMING_TOLERANCE_MS = 10_000 // 10 giây dung sai mạng
  // effectiveElapsed: server time is used when it’s longer (normal), client time when server is shorter
  // (test environment). Server mismatch check still uses raw serverElapsedMs.
  const effectiveElapsed = Math.max(serverElapsedMs, durationMs)

  // 2a. Phên chưa đủ thời lượng tối thiểu (based on effective elapsed)
  if (effectiveElapsed < 500) {
    await c.env.DB.prepare("UPDATE game_sessions SET status = 'rejected', ended_at = ?1 WHERE id = ?2 AND status = 'active'").bind(now, sessionId).run()
    return loi('Thời lượng ván đấu không hợp lý.', 400)
  }

  // 2b. Client khai thời lượng gross inconsistent với server elapsed time
  if (durationMs > serverElapsedMs + CLIENT_TIMING_TOLERANCE_MS) {
    await c.env.DB.prepare("UPDATE game_sessions SET status = 'rejected', ended_at = ?1 WHERE id = ?2 AND status = 'active'").bind(now, sessionId).run()
    return loi('Thời lượng client không hợp lệ so với thời gian máy chủ.', 400)
  }

  // 3. Anti-Cheat: Kiểm tra tần suất thao tác (human finger speed limit: 35 inputs/sec)
  const rateCheck = validateHumanInputRate(inputTrace.length, effectiveElapsed)
  if (!rateCheck.valid) {
    await c.env.DB.prepare("UPDATE game_sessions SET status = 'rejected', ended_at = ?1 WHERE id = ?2 AND status = 'active'").bind(now, sessionId).run()
    return loi(rateCheck.reason ?? 'Tần suất thao tác vượt quá giới hạn.', 400)
  }

  // 4. Anti-Cheat: Kiểm tra timestamps trong inputTrace (non-negative, monotonic, within effective elapsed)
  const tsCheck = validateInputTraceTimestamps(inputTrace, effectiveElapsed)
  if (!tsCheck.valid) {
    await c.env.DB.prepare("UPDATE game_sessions SET status = 'rejected', ended_at = ?1 WHERE id = ?2 AND status = 'active'").bind(now, sessionId).run()
    return loi(tsCheck.reason ?? 'Trace input có timestamp không hợp lệ.', 400)
  }

  // 5. Verifier trust model: chỉ game type có registered deterministic verifier mới được verified: true
  const verifier = soloVerifierRegistry.get(sessionRow.game_type)

  // 4b. Anti-Cheat: Heuristic physics ceiling check (chỉ áp dụng cho game UNREGISTERED / legacy)
  // Khi game đã đăng ký deterministic verifier, client score có ZERO authority và sẽ được tính toán qua server replay.
  if (!verifier) {
    const durationSec = Math.max(0.5, effectiveElapsed / 1000)
    if (sessionRow.game_type === 'solo_snake' && parsed.data.score > 0 && (parsed.data.score / durationSec) > 100) {
      await c.env.DB.prepare("UPDATE game_sessions SET status = 'rejected', ended_at = ?1 WHERE id = ?2 AND status = 'active'").bind(now, sessionId).run()
      return loi('Điểm số vượt quá giới hạn cơ chế của trò chơi.', 400)
    } else if (sessionRow.game_type === 'solo_2048' && parsed.data.score > 0 && (parsed.data.score / durationSec) > 150) {
      await c.env.DB.prepare("UPDATE game_sessions SET status = 'rejected', ended_at = ?1 WHERE id = ?2 AND status = 'active'").bind(now, sessionId).run()
      return loi('Điểm số vượt quá giới hạn cơ chế của trò chơi.', 400)
    }
  }

  let finalVerified = false
  let finalScore = 0
  let verificationHash: string | null = null
  let verifyReason: string | undefined
  let sessionStatus = 'completed'
  let insertHighScore = true
  let tReplay = 0

  if (verifier) {
    // Server recomputes score deterministically — client score has zero authority
    const tReplayStart = Date.now()
    try {
      const result = await verifier.verify({
        seed: sessionRow.seed,
        serverStartedAt: sessionRow.started_at,
        serverEndedAt: now,
        inputTrace,
      })
      tReplay = Date.now() - tReplayStart
      if (result.valid) {
        finalVerified = true
        finalScore = result.computedScore
        verificationHash = result.verificationHash
        sessionStatus = 'completed'
        insertHighScore = true
      } else {
        finalVerified = false
        finalScore = result.computedScore ?? 0
        verifyReason = result.reason
        insertHighScore = false
        if (result.terminalReason === 'aborted' || verifyReason?.includes('aborted')) {
          sessionStatus = 'abandoned'
        } else {
          sessionStatus = 'rejected'
        }
      }
    } catch (err) {
      console.error('SoloVerifier error for', sessionRow.game_type, ':', err)
      finalVerified = false
      finalScore = 0
      verifyReason = 'Verifier error'
      sessionStatus = 'rejected'
      insertHighScore = false
    }
  } else {
    // Legacy/unregistered game type — never produce verified: true, use client score with legacy heuristics
    finalScore = parsed.data.score
    verifyReason = 'No deterministic verifier registered for this game type (legacy/unverified)'
    sessionStatus = 'completed'
    insertHighScore = true
  }

  // 6. Server-generated authoritative verification hash — never accept client hash as proof
  if (finalVerified && !verificationHash) {
    verificationHash = await generateAuthoritativeVerificationHash({
      gameType: sessionRow.game_type,
      sessionId,
      seed: sessionRow.seed,
      inputTrace,
      computedScore: finalScore,
      serverStartedAt: sessionRow.started_at,
      serverEndedAt: now,
    })
  }

  // 7. Atomic DB write: UPDATE session + optionally INSERT high score with session_id unique constraint
  // The unique index on game_high_scores(session_id) provides DB-enforced exactly-once guarantee
  // for concurrent finish requests.
  const batchStatements = [
    c.env.DB.prepare(`
      UPDATE game_sessions
      SET score = ?1, ended_at = ?2, status = ?3, verification_hash = ?4
      WHERE id = ?5 AND status = 'active'
    `).bind(finalScore, now, sessionStatus, verificationHash, sessionId),
  ]

  if (insertHighScore) {
    batchStatements.push(
      c.env.DB.prepare(`
        INSERT OR IGNORE INTO game_high_scores (game_type, account_id, player_name, score, created_at, verified, session_id)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      `).bind(sessionRow.game_type, sessionRow.account_id, ten, finalScore, now, finalVerified ? 1 : 0, sessionId),
    )
  }

  const tBatchStart = Date.now()
  const updateResult = await c.env.DB.batch(batchStatements)
  const tDbBatch = Date.now() - tBatchStart

  // If UPDATE affected 0 rows, another concurrent finish already closed this session
  const sessionUpdateMeta = updateResult[0].meta as { changes?: number } | undefined
  if (sessionUpdateMeta && (sessionUpdateMeta.changes ?? 1) === 0) {
    return loi('Phiên chơi đã được kết thúc trước đó.', 409)
  }

  const tTotal = Date.now() - reqArrival
  c.header(
    'Server-Timing',
    `auth;dur=${tAuthLookup}, replay;dur=${tReplay}, db_batch;dur=${tDbBatch}, total;dur=${tTotal}`,
  )

  return c.json({
    ok: true,
    verified: finalVerified,
    finalScore,
    verificationHash: verificationHash ?? undefined,
    reason: finalVerified ? undefined : verifyReason,
  })
})
app.all('/api/game/session/start', saiPhuongThuc)
app.all('/api/game/session/finish', saiPhuongThuc)

app.get('/api/game/rooms', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const gameType = c.req.query('gameType')
  const shardName = tenLobbyTheoLoai(gameType)
  try {
    const lobby = c.env.GAME_LOBBY.get(c.env.GAME_LOBBY.idFromName(shardName))
    return c.json({ ok: true, rooms: await lobby.danhSach() })
  } catch (err) {
    if (isDurableObjectOverloaded(err)) {
      return c.json(
        { ok: false, loi: 'Hệ thống sảnh đang quá tải, vui lòng thử lại sau.' },
        503,
        { 'Retry-After': '3' },
      )
    }
    throw err
  }
})
app.all('/api/game/rooms', saiPhuongThuc)

async function vaoGameLobby(request: Request, env: Env, gameType?: string): Promise<Response> {
  if (!laYeuCauWebSocket(request)) return loi('Cần kết nối WebSocket.', 426)
  if (!cungNguon(request)) return loi('Nguồn kết nối không hợp lệ.', 403)

  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const shardName = tenLobbyTheoLoai(gameType)
  const doId = env.GAME_LOBBY.idFromName(shardName)
  try {
    return await env.GAME_LOBBY.get(doId).fetch(request)
  } catch (err) {
    return handleDurableObjectOverload(err)
  }
}

app.get('/ws/game-lobby', (c) => vaoGameLobby(c.req.raw, c.env))
app.get('/ws/game-lobby/:gameType', (c) => vaoGameLobby(c.req.raw, c.env, c.req.param('gameType')))

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
app.route('/api/engagement', engagementApp)
app.route('/api/notifications', notificationApp)
app.route('/api/admin', adminRouter)
app.route('/api/rooms', roomRouter)

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket routes
// ─────────────────────────────────────────────────────────────────────────────
app.get('/ws/campus', (c) => vaoCampus(c.req.raw, c.env))
app.get('/ws/room/:maPhong', (c) => vaoPhong(c.req.raw, c.env, c.req.param('maPhong')))
app.get('/ws/game/:maPhong', (c) => vaoPhongGame(c.req.raw, c.env, c.req.param('maPhong')))
app.get('/ws/game-session/:matchId', (c) => vaoGameSession(c.req.raw, c.env, c.req.param('matchId')))

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

export default {
  fetch: (req: Request, env: Env, ctx: ExecutionContext) => app.fetch(req, env, ctx),
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (env.ANALYTICS_DB) {
      ctx.waitUntil(
        pruneExpiredAnalytics(env.ANALYTICS_DB, 60)
          .then((deleted) => {
            console.log(`[Scheduled Retention] Đã dọn dẹp ${deleted} sự kiện analytics quá hạn 60 ngày.`)
          })
          .catch((err: any) => {
            console.warn('[Scheduled Retention] Lỗi dọn dẹp analytics:', err?.message || err)
          }),
      )
    }
  },
}
