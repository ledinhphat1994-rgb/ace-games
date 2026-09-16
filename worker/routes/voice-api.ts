import type { Context } from 'hono'
import { actorKey } from '../lib/auth'
import { loi } from '../lib/http'
import { laGiaoVienDaDuyet, laQuanTriTruong } from '../lib/scope'
import { kiemTraQuyenTruyCapPhong } from '../lib/room-gate'

const CALLS_API_BASE = 'https://rtc.live.cloudflare.com/v1'

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
  try {
    const res = await fetch(url, {
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

async function kiemTraRateLimitVoice(env: Env, roomId: number, accountId: number): Promise<boolean> {
  const key = `rate:voice:${roomId}:${accountId}`
  const count = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10)
  if (count >= 30) return false
  await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 60 })
  return true
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

  if (!(await kiemTraRateLimitVoice(c.env, phongId, gate.taiKhoan.id))) {
    return loi('Bạn đang gửi quá nhiều yêu cầu kết nối thoại. Vui lòng thử lại sau 1 phút.', 429)
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

  const sessionId = sfuRes.data?.sessionId
  const sessionDescription = sfuRes.data?.sessionDescription
  if (!sessionId || !sessionDescription) {
    return loi('Phản hồi từ SFU thiếu sessionId hoặc sessionDescription.', 502)
  }

  const userKey = actorKey(gate.taiKhoan)
  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))
  await (roomStub as any).bindVoiceSession(sessionId, userKey)

  return c.json({
    ok: true,
    sessionId,
    sessionDescription,
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

  if (!(await kiemTraRateLimitVoice(c.env, phongId, gate.taiKhoan.id))) {
    return loi('Thao tác quá thường xuyên. Vui lòng thử lại sau 1 phút.', 429)
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

  if (!body.sessionId || !body.trackName || !body.sessionDescription?.sdp) {
    return loi('Thiếu thông tin publish (sessionId, trackName, sessionDescription).', 400)
  }

  const userKey = actorKey(gate.taiKhoan)
  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))
  const owner = await (roomStub as any).getVoiceSessionOwner(body.sessionId)

  if (!owner || owner !== userKey) {
    return loi('Phiên WebRTC không thuộc quyền sở hữu của bạn.', 403)
  }

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

  await (roomStub as any).registerVoicePublication({
    actorKey: userKey,
    ten: gate.taiKhoan.ten || gate.taiKhoan.username,
    status: 'live',
    sessionId: body.sessionId,
    audioTrackId: body.trackName,
    generation: Number(body.generation) || 1,
  })

  return c.json({
    ok: true,
    sessionDescription: sfuRes.data?.sessionDescription,
    tracks: sfuRes.data?.tracks,
    requiresImmediateRenegotiation: Boolean(sfuRes.data?.requiresImmediateRenegotiation),
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

  if (!(await kiemTraRateLimitVoice(c.env, phongId, gate.taiKhoan.id))) {
    return loi('Thao tác quá thường xuyên. Vui lòng thử lại sau 1 phút.', 429)
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

  if (!body.sessionId || !body.remoteSessionId || !body.remoteTrackName || !body.sessionDescription?.sdp) {
    return loi('Thiếu thông tin subscribe (sessionId, remoteSessionId, remoteTrackName, sessionDescription).', 400)
  }

  const userKey = actorKey(gate.taiKhoan)
  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))
  const owner = await (roomStub as any).getVoiceSessionOwner(body.sessionId)

  if (!owner || owner !== userKey) {
    return loi('Phiên WebRTC không thuộc quyền sở hữu của bạn.', 403)
  }

  // Kiểm tra remote track có nằm trong canonical voice registry của RoomDO hay không
  const registry = (await (roomStub as any).getVoiceRegistry()) as any[]
  const targetTrack = registry.find(
    (p) => p.sessionId === body.remoteSessionId && p.audioTrackId === body.remoteTrackName,
  )
  if (!targetTrack) {
    return loi('Luồng âm thanh từ xa không tồn tại hoặc đã dừng phát.', 404)
  }

  const sfuRes = await callCloudflareRealtime(c.env, `/sessions/${body.sessionId}/tracks/new`, 'POST', {
    sessionDescription: body.sessionDescription,
    tracks: [
      {
        location: 'remote',
        sessionId: body.remoteSessionId,
        trackName: body.remoteTrackName,
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

  return c.json({
    ok: true,
    sessionDescription: sfuRes.data?.sessionDescription,
    tracks: sfuRes.data?.tracks,
    requiresImmediateRenegotiation: Boolean(sfuRes.data?.requiresImmediateRenegotiation),
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

  if (!(await kiemTraRateLimitVoice(c.env, phongId, gate.taiKhoan.id))) {
    return loi('Thao tác quá thường xuyên. Vui lòng thử lại sau 1 phút.', 429)
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

  const userKey = actorKey(gate.taiKhoan)
  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))
  const owner = await (roomStub as any).getVoiceSessionOwner(body.sessionId)

  if (!owner || owner !== userKey) {
    return loi('Phiên WebRTC không thuộc quyền sở hữu của bạn.', 403)
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
    return loi(`Lỗi từ Cloudflare Realtime SFU: ${sfuRes.errorText || 'Không xác định'}`, sfuRes.status as any)
  }

  return c.json({
    ok: true,
    sessionDescription: sfuRes.data?.sessionDescription,
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

  let body: { sessionId?: string; trackName?: string; generation?: number }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu yêu cầu không hợp lệ.', 400)
  }

  if (!body.sessionId || !body.trackName) {
    return loi('Thiếu sessionId hoặc trackName.', 400)
  }

  const userKey = actorKey(gate.taiKhoan)
  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))
  const owner = await (roomStub as any).getVoiceSessionOwner(body.sessionId)

  if (!owner || owner !== userKey) {
    return loi('Phiên WebRTC không thuộc quyền sở hữu của bạn.', 403)
  }

  const sfuRes = await callCloudflareRealtime(c.env, `/sessions/${body.sessionId}/tracks/close`, 'PUT', {
    tracks: [{ trackName: body.trackName }],
  })

  await (roomStub as any).removeVoicePublication(userKey, body.generation)

  return c.json({
    ok: true,
    tracks: sfuRes.data?.tracks,
    requiresImmediateRenegotiation: Boolean(sfuRes.data?.requiresImmediateRenegotiation),
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

  const userKey = actorKey(gate.taiKhoan)
  const isHost = gate.phongRow.chu_phong_khoa === userKey
  const canModerate = isHost || laGiaoVienDaDuyet(gate.taiKhoan) || laQuanTriTruong(gate.taiKhoan)

  if (!canModerate) {
    return loi('Bạn không có quyền tắt micro của thành viên khác.', 403)
  }

  const roomStub = c.env.ROOMS.get(c.env.ROOMS.idFromName(`phong-${phongId}`))
  const targetVoice = await (roomStub as any).getVoiceParticipant(targetActorKey)

  if (targetVoice?.sessionId && targetVoice?.audioTrackId) {
    // Thử đóng track trên SFU nếu có thông tin session
    try {
      await callCloudflareRealtime(c.env, `/sessions/${targetVoice.sessionId}/tracks/close`, 'PUT', {
        tracks: [{ trackName: targetVoice.audioTrackId }],
      })
    } catch (err) {
      console.warn('Không thể đóng track SFU từ xa khi force-mute:', err)
    }
  }

  await (roomStub as any).forceMute(targetActorKey, gate.taiKhoan.ten || gate.taiKhoan.username)

  return c.json({
    ok: true,
    message: 'Đã tắt micro của thành viên.',
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
