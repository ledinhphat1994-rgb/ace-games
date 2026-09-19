import type { Context } from 'hono'
import { z } from 'zod'
import { actorKey } from '../lib/auth'
import { loi } from '../lib/http'
import { laGiaoVienDaDuyet, laQuanTriTruong } from '../lib/scope'
import { kiemTraQuyenTruyCapPhong } from '../lib/room-gate'
import { recordAnalyticsEvent } from '../lib/analytics'

const CALLS_API_BASE = 'https://rtc.live.cloudflare.com/v1'

// ── Strict Cloudflare Connection API Response Schemas ──

export const CloudflareNewSessionResponseSchema = z.object({
  sessionId: z.string().min(1),
  sessionDescription: z.object({
    type: z.enum(['offer', 'answer']),
    sdp: z.string().min(1),
  }),
})

export const CloudflareTrackMetadataSchema = z.object({
  location: z.enum(['local', 'remote']).optional(),
  mid: z.string().optional(),
  trackName: z.string().min(1).optional(),
  sessionId: z.string().optional(),
  status: z.string().optional(),
  error: z.string().optional(),
})

export const CloudflareNewTracksResponseSchema = z.object({
  sessionDescription: z.object({
    type: z.enum(['offer', 'answer']),
    sdp: z.string().min(1),
  }).optional(),
  tracks: z.array(CloudflareTrackMetadataSchema).min(1),
  requiresImmediateRenegotiation: z.boolean().optional(),
})

export const CloudflareRenegotiateResponseSchema = z.object({
  sessionDescription: z.object({
    type: z.enum(['offer', 'answer']),
    sdp: z.string().min(1),
  }).optional(),
})

export const CloudflareCloseTracksResponseSchema = z.object({
  sessionDescription: z.object({
    type: z.enum(['offer', 'answer']),
    sdp: z.string().min(1),
  }).optional(),
  tracks: z.array(CloudflareTrackMetadataSchema).optional(),
  requiresImmediateRenegotiation: z.boolean().optional(),
})

// ── Test Hook for Realtime Fetch Mocking ──

export type CloudflareRealtimeFetchFn = (url: string, init?: RequestInit) => Promise<Response>

let realtimeFetchMock: CloudflareRealtimeFetchFn | null = null

export function setCloudflareRealtimeFetchForTesting(mock: CloudflareRealtimeFetchFn | null): void {
  realtimeFetchMock = mock
}

export async function callCloudflareRealtime(
  env: Env,
  endpoint: string,
  method: 'POST' | 'PUT',
  body: unknown,
): Promise<{ ok: boolean; status: number; data?: any; errorText?: string }> {
  const appId = (env as any).CLOUDFLARE_REALTIME_APP_ID as string | undefined
  const appSecret = (env as any).CLOUDFLARE_REALTIME_APP_SECRET as string | undefined

  if (!appId || !appSecret) {
    return {
      ok: false,
      status: 503,
      errorText: 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS',
    }
  }

  const url = `${CALLS_API_BASE}/apps/${appId}${endpoint}`
  const fetcher = realtimeFetchMock || fetch
  try {
    const res = await fetcher(url, {
      method,
      headers: {
        'Authorization': `Bearer ${appSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let data: any = null
    try {
      data = JSON.parse(text)
    } catch {}

    if (!res.ok) {
      return { ok: false, status: res.status, errorText: text, data }
    }
    return { ok: true, status: res.status, data }
  } catch (err: any) {
    return { ok: false, status: 502, errorText: err?.message || 'Lỗi kết nối tới Cloudflare Realtime SFU' }
  }
}

async function kiemTraRateLimitVoice(
  env: Env,
  type: 'session' | 'media',
  roomId: number,
  accountId: number,
): Promise<boolean> {
  if (!env.RATE_LIMIT) return true
  const max = type === 'session' ? 20 : 120
  const key = `rate:voice:${type}:${roomId}:${accountId}`
  try {
    const count = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10)
    if (Number.isFinite(count) && count >= max) return false
    try {
      await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 60 })
    } catch (putErr) {
      console.warn(`[voice-ratelimit] Lỗi kv.put cho key ${key}:`, putErr)
      // Fail-open: không làm sập phiên WebRTC khi KV gặp lỗi write burst
    }
    return true
  } catch (getErr) {
    console.warn(`[voice-ratelimit] Lỗi kv.get cho key ${key}:`, getErr)
    return true // Fail-open: cho phép tiếp tục nếu KV tạm thời không sẵn sàng
  }
}

function parsePhongId(c: Context<{ Bindings: Env }>): number | null {
  const idParam = c.req.param('id')
  const phongId = parseInt(idParam || '', 10)
  if (!phongId || phongId <= 0) return null
  return phongId
}

/**
 * POST /api/rooms/:id/voice/session
 * Khởi tạo phiên WebRTC mới với Cloudflare Realtime SFU
 */
export async function taoVoiceSession(c: Context<{ Bindings: Env }>): Promise<Response> {
  const phongId = parsePhongId(c)
  if (!phongId) return loi('ID phòng không hợp lệ.', 400)

  const gate = await kiemTraQuyenTruyCapPhong(c.req.raw, c.env, phongId)
  if (!gate.ok) return gate.response

  if (!(await kiemTraRateLimitVoice(c.env, 'session', phongId, gate.taiKhoan.id))) {
    return loi('Bạn đang gửi quá nhiều yêu cầu khởi tạo phiên thoại. Vui lòng thử lại sau 1 phút.', 429)
  }

  const userKey = actorKey(gate.phien)
  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))

  // Invariant 1: Bắt buộc có kết nối WebSocket sống trong phòng
  const isConnected = await (roomStub as any).hasConnectedActor(userKey)
  if (!isConnected) {
    return loi('Bạn cần có kết nối trực tiếp trong phòng để sử dụng tính năng thoại.', 403)
  }

  let body: { sessionDescription?: { type?: string; sdp?: string } }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu yêu cầu không hợp lệ.', 400)
  }

  if (body?.sessionDescription?.type !== 'offer' || !body?.sessionDescription?.sdp) {
    return loi('Thiếu SessionDescription SDP offer hợp lệ.', 400)
  }

  const sfuRes = await callCloudflareRealtime(c.env, '/sessions/new', 'POST', {
    sessionDescription: body.sessionDescription,
  })

  if (!sfuRes.ok) {
    if (sfuRes.errorText === 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS') {
      return c.json(
        {
          ok: false,
          code: 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS',
          message: 'Cloudflare Realtime credentials are not configured on server.',
        },
        503,
      )
    }
    return loi(`Lỗi từ Cloudflare Realtime SFU: ${sfuRes.errorText || 'Không xác định'}`, sfuRes.status as any)
  }

  // Invariant 7: Validate response against schema
  const parsed = CloudflareNewSessionResponseSchema.safeParse(sfuRes.data)
  if (!parsed.success) {
    return loi('Phản hồi từ SFU không đúng cấu trúc (thiếu sessionId hoặc sessionDescription).', 502)
  }

  const { sessionId, sessionDescription } = parsed.data

  // Invariant 2: Server owns generation
  const generation = await (roomStub as any).issueVoiceGeneration(userKey)

  // Invariant 3: Session ownership includes room + actor + generation
  await (roomStub as any).bindVoiceSession(sessionId, userKey, generation)

  return c.json({
    ok: true,
    sessionId,
    sessionDescription,
    generation,
  })
}

/**
 * POST /api/rooms/:id/voice/publish
 * Đăng ký phát track micro địa phương vào SFU session
 */
export async function dangKyPublishVoice(c: Context<{ Bindings: Env }>): Promise<Response> {
  const phongId = parsePhongId(c)
  if (!phongId) return loi('ID phòng không hợp lệ.', 400)

  const gate = await kiemTraQuyenTruyCapPhong(c.req.raw, c.env, phongId)
  if (!gate.ok) return gate.response

  if (!(await kiemTraRateLimitVoice(c.env, 'media', phongId, gate.taiKhoan.id))) {
    return loi('Thao tác quá thường xuyên. Vui lòng thử lại sau 1 phút.', 429)
  }

  const userKey = actorKey(gate.phien)
  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))

  // Invariant 1: Bắt buộc có kết nối WebSocket sống trong phòng
  const isConnected = await (roomStub as any).hasConnectedActor(userKey)
  if (!isConnected) {
    return loi('Bạn cần có kết nối trực tiếp trong phòng để sử dụng tính năng thoại.', 403)
  }

  let body: {
    sessionId?: string
    trackName?: string
    mid?: string
    generation?: number
    sessionDescription?: { type?: string; sdp?: string }
  }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu yêu cầu không hợp lệ.', 400)
  }

  if (!body.sessionId || !body.trackName || !body.mid || !body.sessionDescription?.sdp) {
    return loi('Thiếu thông tin publish (sessionId, trackName, mid, sessionDescription).', 400)
  }

  // Invariant 5: MID must be distinct from trackName
  if (body.mid === body.trackName) {
    return loi('Giá trị transceiver mid không hợp lệ (trùng với trackName).', 400)
  }

  // Invariant 3: Validate session ownership
  const session = await (roomStub as any).getVoiceSession(body.sessionId)
  if (!session || session.actorKey !== userKey) {
    return loi('Phiên WebRTC không thuộc quyền sở hữu của bạn trong phòng này.', 403)
  }

  // Invariant 2: Client cannot forge generation
  if (body.generation !== undefined && Number(body.generation) !== session.generation) {
    return loi('Generation không hợp lệ hoặc đã cũ.', 409)
  }

  // Invariant 4: Call Cloudflare first
  const sfuRes = await callCloudflareRealtime(c.env, `/sessions/${body.sessionId}/tracks/new`, 'POST', {
    sessionDescription: body.sessionDescription,
    tracks: [
      {
        location: 'local',
        trackName: body.trackName,
        mid: body.mid,
      },
    ],
  })

  if (!sfuRes.ok) {
    if (sfuRes.errorText === 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS') {
      return c.json(
        {
          ok: false,
          code: 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS',
          message: 'Cloudflare Realtime credentials are not configured on server.',
        },
        503,
      )
    }
    return loi(`Lỗi từ Cloudflare Realtime SFU: ${sfuRes.errorText || 'Không xác định'}`, sfuRes.status as any)
  }

  // Invariant 7: Validate response against schema
  const parsed = CloudflareNewTracksResponseSchema.safeParse(sfuRes.data)
  if (!parsed.success) {
    return loi('Phản hồi từ SFU không đúng cấu trúc tracks.', 502)
  }

  // Invariant 5: Extract canonical track metadata from confirmed SFU response
  const acceptedTrack = parsed.data.tracks[0]
  if (!acceptedTrack) {
    return loi('Phản hồi từ SFU thiếu thông tin track được chấp nhận.', 502)
  }
  const canonicalTrackName = acceptedTrack.trackName || body.trackName
  const canonicalMid = acceptedTrack.mid || body.mid

  // Invariant 4 & 10: Register canonical publication in RoomDO
  const regRes = await (roomStub as any).registerVoicePublication({
    actorKey: userKey,
    ten: gate.taiKhoan.ten || gate.taiKhoan.username,
    status: 'live',
    sessionId: body.sessionId,
    audioTrackId: canonicalTrackName,
    mid: canonicalMid,
    generation: session.generation,
  })

  if (!regRes.ok) {
    recordAnalyticsEvent(c.env.ANALYTICS_DB, c.executionCtx, {
      event: 'voice.publish_failed',
      actorId: gate.taiKhoan.id,
      roomId: phongId,
      properties: {
        reason: regRes.reason || 'REG_ERROR',
      },
    })
    return loi(`Không thể đăng ký canonical publication: ${regRes.reason || 'lỗi server'}`, 409)
  }

  recordAnalyticsEvent(c.env.ANALYTICS_DB, c.executionCtx, {
    event: 'voice.publish_started',
    actorId: gate.taiKhoan.id,
    roomId: phongId,
    sessionId: body.sessionId,
    properties: {
      mid: canonicalMid,
    },
  })

  return c.json({
    ok: true,
    sessionDescription: parsed.data.sessionDescription,
    tracks: parsed.data.tracks,
    canonicalTrackName,
    generation: session.generation,
    requiresImmediateRenegotiation: Boolean(parsed.data.requiresImmediateRenegotiation),
  })
}

/**
 * POST /api/rooms/:id/voice/subscribe
 * Đăng ký nhận luồng audio từ xa của thành viên khác trong phòng
 */
export async function dangKySubscribeVoice(c: Context<{ Bindings: Env }>): Promise<Response> {
  const phongId = parsePhongId(c)
  if (!phongId) return loi('ID phòng không hợp lệ.', 400)

  const gate = await kiemTraQuyenTruyCapPhong(c.req.raw, c.env, phongId)
  if (!gate.ok) return gate.response

  if (!(await kiemTraRateLimitVoice(c.env, 'media', phongId, gate.taiKhoan.id))) {
    return loi('Thao tác quá thường xuyên. Vui lòng thử lại sau 1 phút.', 429)
  }

  const userKey = actorKey(gate.phien)
  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))

  // Invariant 1: Bắt buộc có kết nối WebSocket sống trong phòng
  const isConnected = await (roomStub as any).hasConnectedActor(userKey)
  if (!isConnected) {
    return loi('Bạn cần có kết nối trực tiếp trong phòng để sử dụng tính năng thoại.', 403)
  }

  let body: {
    sessionId?: string
    remoteSessionId?: string
    remoteTrackName?: string
    sessionDescription?: { type?: string; sdp?: string }
  }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu yêu cầu không hợp lệ.', 400)
  }

  if (!body.sessionId || !body.remoteSessionId || !body.remoteTrackName) {
    return loi('Thiếu thông tin subscribe (sessionId, remoteSessionId, remoteTrackName).', 400)
  }

  // Invariant 3: Validate session ownership
  const isSessionOwner = await (roomStub as any).verifyVoiceSession(body.sessionId, userKey)
  if (!isSessionOwner) {
    return loi('Phiên WebRTC không thuộc quyền sở hữu của bạn trong phòng này.', 403)
  }

  // Kiểm tra remote track có nằm trong canonical voice registry của RoomDO hay không
  const registry = (await (roomStub as any).getVoiceRegistry()) as any[]
  const targetTrack = registry.find(
    (p) => p.sessionId === body.remoteSessionId && p.audioTrackId === body.remoteTrackName,
  )
  if (!targetTrack) {
    return loi('Luồng âm thanh từ xa không tồn tại hoặc đã dừng phát.', 404)
  }

  const sfuPayload: any = {
    tracks: [
      {
        location: 'remote',
        sessionId: body.remoteSessionId,
        trackName: body.remoteTrackName,
      },
    ],
  }
  if (body.sessionDescription?.sdp) {
    sfuPayload.sessionDescription = body.sessionDescription
  }

  const sfuRes = await callCloudflareRealtime(c.env, `/sessions/${body.sessionId}/tracks/new`, 'POST', sfuPayload)

  if (!sfuRes.ok) {
    if (sfuRes.errorText === 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS') {
      return c.json(
        {
          ok: false,
          code: 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS',
          message: 'Cloudflare Realtime credentials are not configured on server.',
        },
        503,
      )
    }
    return loi(`Lỗi từ Cloudflare Realtime SFU: ${sfuRes.errorText || 'Không xác định'}`, sfuRes.status as any)
  }

  // Invariant 7: Validate response against schema
  const parsed = CloudflareNewTracksResponseSchema.safeParse(sfuRes.data)
  if (!parsed.success) {
    return loi('Phản hồi từ SFU không đúng cấu trúc tracks.', 502)
  }

  return c.json({
    ok: true,
    sessionDescription: parsed.data.sessionDescription,
    tracks: parsed.data.tracks,
    requiresImmediateRenegotiation: Boolean(parsed.data.requiresImmediateRenegotiation),
  })
}

/**
 * POST /api/rooms/:id/voice/renegotiate
 * Tái đàm phán WebRTC session với Cloudflare SFU
 */
export async function renegotiateVoiceSession(c: Context<{ Bindings: Env }>): Promise<Response> {
  const phongId = parsePhongId(c)
  if (!phongId) return loi('ID phòng không hợp lệ.', 400)

  const gate = await kiemTraQuyenTruyCapPhong(c.req.raw, c.env, phongId)
  if (!gate.ok) return gate.response

  if (!(await kiemTraRateLimitVoice(c.env, 'media', phongId, gate.taiKhoan.id))) {
    return loi('Thao tác quá thường xuyên. Vui lòng thử lại sau 1 phút.', 429)
  }

  const userKey = actorKey(gate.phien)
  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))

  // Invariant 1: Bắt buộc có kết nối WebSocket sống trong phòng
  const isConnected = await (roomStub as any).hasConnectedActor(userKey)
  if (!isConnected) {
    return loi('Bạn cần có kết nối trực tiếp trong phòng để sử dụng tính năng thoại.', 403)
  }

  let body: { sessionId?: string; sessionDescription?: { type?: string; sdp?: string } }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu yêu cầu không hợp lệ.', 400)
  }

  if (!body.sessionId || !body.sessionDescription?.sdp) {
    return loi('Thiếu sessionId hoặc sessionDescription.', 400)
  }

  // Invariant 3: Validate session ownership
  const isSessionOwner = await (roomStub as any).verifyVoiceSession(body.sessionId, userKey)
  if (!isSessionOwner) {
    return loi('Phiên WebRTC không thuộc quyền sở hữu của bạn trong phòng này.', 403)
  }

  const sfuRes = await callCloudflareRealtime(c.env, `/sessions/${body.sessionId}/renegotiate`, 'PUT', {
    sessionDescription: body.sessionDescription,
  })

  if (!sfuRes.ok) {
    if (sfuRes.errorText === 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS') {
      return c.json(
        {
          ok: false,
          code: 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS',
          message: 'Cloudflare Realtime credentials are not configured on server.',
        },
        503,
      )
    }
    return loi(`Lỗi tái đàm phán từ Cloudflare Realtime SFU: ${sfuRes.errorText || 'Không xác định'}`, sfuRes.status as any)
  }

  // Invariant 7: Validate response against schema
  const parsed = CloudflareRenegotiateResponseSchema.safeParse(sfuRes.data)
  if (!parsed.success) {
    return loi('Phản hồi từ SFU không đúng cấu trúc renegotiate.', 502)
  }

  return c.json({
    ok: true,
    sessionDescription: parsed.data.sessionDescription,
  })
}

/**
 * POST /api/rooms/:id/voice/close-track
 * Đóng track phát cá nhân
 */
export async function dongTrackVoice(c: Context<{ Bindings: Env }>): Promise<Response> {
  const phongId = parsePhongId(c)
  if (!phongId) return loi('ID phòng không hợp lệ.', 400)

  const gate = await kiemTraQuyenTruyCapPhong(c.req.raw, c.env, phongId)
  if (!gate.ok) return gate.response

  const userKey = actorKey(gate.phien)
  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))

  // Invariant 1: Bắt buộc có kết nối WebSocket sống trong phòng
  const isConnected = await (roomStub as any).hasConnectedActor(userKey)
  if (!isConnected) {
    return loi('Bạn cần có kết nối trực tiếp trong phòng để sử dụng tính năng thoại.', 403)
  }

  let body: { sessionId?: string; trackName?: string; generation?: number }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu yêu cầu không hợp lệ.', 400)
  }

  // Invariant 4: Require sessionId, trackName, and positive integer generation
  if (
    !body.sessionId ||
    !body.trackName ||
    typeof body.generation !== 'number' ||
    !Number.isInteger(body.generation) ||
    body.generation <= 0
  ) {
    return loi('Thiếu hoặc sai định dạng sessionId, trackName hoặc generation.', 400)
  }

  // Invariant 3: Validate session ownership
  const isSessionOwner = await (roomStub as any).verifyVoiceSession(body.sessionId, userKey)
  if (!isSessionOwner) {
    return loi('Phiên WebRTC không thuộc quyền sở hữu của bạn trong phòng này.', 403)
  }

  // Invariant 4: Exact match against current canonical publication before touching Cloudflare
  const existing = await (roomStub as any).getVoiceParticipant(userKey)
  if (
    !existing ||
    existing.actorKey !== userKey ||
    existing.sessionId !== body.sessionId ||
    existing.audioTrackId !== body.trackName ||
    existing.generation !== body.generation
  ) {
    return loi('Thông tin track hoặc generation không khớp với ấn phẩm hiện tại.', 409)
  }

  // Invariant 5: Server owns the MID — use ONLY existing.mid from canonical RoomDO/SQLite state
  const sfuPayloadTracks: Array<{ trackName: string } | { mid: string }> = existing.mid
    ? [{ mid: existing.mid }]
    : [{ trackName: existing.audioTrackId }]

  const sfuRes = await callCloudflareRealtime(c.env, `/sessions/${body.sessionId}/tracks/close`, 'PUT', {
    tracks: sfuPayloadTracks,
    force: true,
  })

  // Invariant 7: Tighten already-closed semantics. Real staging case was HTTP 410.
  // Only explicitly understood terminal upstream status codes (404/410) are treated as terminal media teardown.
  const isAlreadyClosed = sfuRes.status === 404 || sfuRes.status === 410

  // Invariant 6: Fix upstream error semantics. No false-success on unexpected failures!
  if (!sfuRes.ok && !isAlreadyClosed) {
    return c.json(
      {
        ok: false,
        mediaCleanupConfirmed: false,
        error: sfuRes.errorText || 'Lỗi đóng track từ Cloudflare SFU',
      },
      sfuRes.status >= 400 && sfuRes.status < 600 ? (sfuRes.status as any) : 502,
    )
  }

  // Invariant 8: Close result must match canonical mutation with exact CAS
  const removed = await (roomStub as any).removeVoicePublicationExact({
    actorKey: userKey,
    sessionId: body.sessionId,
    audioTrackId: body.trackName,
    generation: body.generation,
    mid: existing.mid ?? null,
  })
  if (!removed) {
    return loi('Ấn phẩm thoại đã bị thay đổi hoặc không còn tồn tại.', 409)
  }

  recordAnalyticsEvent(c.env.ANALYTICS_DB, c.executionCtx, {
    event: 'voice.publish_ended',
    actorId: gate.taiKhoan.id,
    roomId: phongId,
    sessionId: body.sessionId,
  })

  const parsed = !isAlreadyClosed ? CloudflareCloseTracksResponseSchema.safeParse(sfuRes.data) : null

  return c.json({
    ok: true,
    mediaCleanupConfirmed: true,
    tracks: parsed?.success ? parsed.data.tracks : [],
    requiresImmediateRenegotiation: Boolean(parsed?.success ? parsed.data.requiresImmediateRenegotiation : false),
  })
}

/**
 * POST /api/rooms/:id/voice/force-mute
 * Người điều hành (Host / Moderator) cưỡng chế tắt micro của thành viên
 */
export async function forceMuteVoice(c: Context<{ Bindings: Env }>): Promise<Response> {
  const phongId = parsePhongId(c)
  if (!phongId) return loi('ID phòng không hợp lệ.', 400)

  const gate = await kiemTraQuyenTruyCapPhong(c.req.raw, c.env, phongId)
  if (!gate.ok) return gate.response

  const userKey = actorKey(gate.phien)
  const isHost = gate.phongRow.chu_phong_khoa === userKey
  const canModerate = isHost || laGiaoVienDaDuyet(gate.taiKhoan) || laQuanTriTruong(gate.taiKhoan)

  if (!canModerate) {
    return loi('Bạn không có quyền tắt micro của thành viên khác.', 403)
  }

  let body: { targetActorKey?: string }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu yêu cầu không hợp lệ.', 400)
  }

  const targetActorKey = String(body.targetActorKey || '').trim()
  if (!targetActorKey) {
    return loi('Thiếu targetActorKey.', 400)
  }

  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))

  // Invariant 1: Cả người điều hành và target đều phải có kết nối sống trong phòng
  const moderatorConnected = await (roomStub as any).hasConnectedActor(userKey)
  if (!moderatorConnected) {
    return loi('Bạn cần có kết nối trực tiếp trong phòng để điều hành thoại.', 403)
  }

  const targetConnected = await (roomStub as any).hasConnectedActor(targetActorKey)
  if (!targetConnected) {
    return loi('Thành viên mục tiêu không có kết nối trực tiếp trong phòng.', 403)
  }

  const targetVoice = await (roomStub as any).getVoiceParticipant(targetActorKey)
  if (!targetVoice || !targetVoice.sessionId || !targetVoice.audioTrackId) {
    return loi('Thành viên không có luồng âm thanh đang phát.', 404)
  }

  // Exact CAS capture: Record all identity fields before calling upstream close
  const targetGen = targetVoice.generation
  const targetSessionId = targetVoice.sessionId
  const targetTrackName = targetVoice.audioTrackId
  const targetMid = targetVoice.mid ?? null

  // Invariant 6: Upstream confirmation check — send only { mid } when known (correct Cloudflare format)
  const sfuPayloadTracks: Array<{ trackName: string } | { mid: string }> = targetMid
    ? [{ mid: targetMid }]
    : [{ trackName: targetTrackName }]
  const sfuRes = await callCloudflareRealtime(c.env, `/sessions/${targetSessionId}/tracks/close`, 'PUT', {
    tracks: sfuPayloadTracks,
    force: true,
  })

  const isAlreadyClosed = sfuRes.status === 404 || sfuRes.status === 410
  if (!sfuRes.ok && !isAlreadyClosed) {
    return loi(`Lỗi từ Cloudflare Realtime SFU khi cưỡng chế tắt micro: ${sfuRes.errorText || 'Không xác định'}`, sfuRes.status as any)
  }

  // Invariant 16: Ensure target publication has not changed while SFU call was in flight (Exact CAS)
  const forceMuted = await (roomStub as any).forceMute({
    targetActorKey,
    byActorName: gate.taiKhoan.ten || gate.taiKhoan.username,
    sessionId: targetSessionId,
    trackName: targetTrackName,
    generation: targetGen,
    mid: targetMid,
  })
  if (!forceMuted) {
    return loi('Ấn phẩm thoại của thành viên đã bị thay đổi hoặc đã đóng trong lúc xử lý.', 409)
  }

  return c.json({
    ok: true,
    message: 'Đã tắt micro của thành viên.',
    targetKey: targetActorKey,
    generation: targetGen,
  })
}

/**
 * GET /api/rooms/:id/voice/registry
 * Lấy danh bạ âm thanh hiện tại của phòng
 */
export async function layVoiceRegistry(c: Context<{ Bindings: Env }>): Promise<Response> {
  const phongId = parsePhongId(c)
  if (!phongId) return loi('ID phòng không hợp lệ.', 400)

  const gate = await kiemTraQuyenTruyCapPhong(c.req.raw, c.env, phongId)
  if (!gate.ok) return gate.response

  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))
  const registry = await (roomStub as any).getVoiceRegistry()

  return c.json({
    ok: true,
    registry,
  })
}
