/**
 * Admission credential — signed HttpOnly cookie for password-protected Study Rooms.
 *
 * Design:
 *  POST /api/rooms/:id/admit  →  verify password  →  set-cookie admit_<roomId>
 *  /ws/room/phong-<id>        →  read + verify cookie statelessly (no KV read)
 *
 * Payload is bound to: roomId + accountId + phienId + expiresAt
 * Signed with SESSION_SECRET via HMAC-SHA-256.
 * KV is used only for rate limiting, NOT as the authoritative credential store.
 */

const enc = new TextEncoder()

export const ADMIT_COOKIE_TTL = 300 // giây (5 phút)

export function admitCookieName(roomId: number): string {
  return `room_admit_${roomId}`
}

interface AdmitPayload {
  roomId: number
  accountId: number
  phienId: string
  exp: number
}

function b64u(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64u(str: string): Uint8Array {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

/** Tạo giá trị cookie đã ký cho admission. */
export async function signAdmitToken(
  secret: string,
  payload: Omit<AdmitPayload, 'exp'>,
): Promise<string> {
  const full: AdmitPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + ADMIT_COOKIE_TTL }
  const p = b64u(enc.encode(JSON.stringify(full)))
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(p)))
  return `${p}.${b64u(sig)}`
}

/** Xác minh admission token. Trả null nếu không hợp lệ, hết hạn, hoặc không khớp. */
export async function verifyAdmitToken(
  secret: string,
  token: string | null,
  expected: { roomId: number; accountId: number; phienId: string },
): Promise<boolean> {
  if (!token) return false
  const dot = token.lastIndexOf('.')
  if (dot < 0) return false
  const p = token.slice(0, dot)
  const s = token.slice(dot + 1)
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64u(s), enc.encode(p))
    if (!ok) return false
    const data = JSON.parse(new TextDecoder().decode(fromB64u(p))) as AdmitPayload
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return false
    if (data.roomId !== expected.roomId) return false
    if (data.accountId !== expected.accountId) return false
    if (data.phienId !== expected.phienId) return false
    return true
  } catch {
    return false
  }
}

/** Tạo Set-Cookie header cho admission cookie. */
export function admitCookieSet(
  roomId: number,
  token: string,
  isHttps: boolean,
): string {
  const name = admitCookieName(roomId)
  const secure = isHttps ? '; Secure' : ''
  // SameSite=Lax: WS upgrade từ same-origin vẫn gửi cookie được.
  // Path=/ws/room/phong-<id> giới hạn cookie đúng endpoint.
  return `${name}=${encodeURIComponent(token)}; Path=/ws/room/phong-${roomId}; HttpOnly${secure}; SameSite=Lax; Max-Age=${ADMIT_COOKIE_TTL}`
}

/** Tạo Set-Cookie xóa admission cookie. */
export function admitCookieClear(roomId: number, isHttps: boolean): string {
  const name = admitCookieName(roomId)
  const secure = isHttps ? '; Secure' : ''
  return `${name}=; Path=/ws/room/phong-${roomId}; HttpOnly${secure}; SameSite=Lax; Max-Age=0`
}

/** Đọc admission cookie từ request headers. */
export function readAdmitCookie(request: Request, roomId: number): string | null {
  const name = admitCookieName(roomId)
  const raw = request.headers.get('Cookie') || ''
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    if (part.slice(0, i).trim() === name) {
      try { return decodeURIComponent(part.slice(i + 1).trim()) } catch { return null }
    }
  }
  return null
}
