// Cùng định dạng token với functions/_lib/auth.js của bản cũ, để cookie đang đăng nhập vẫn dùng
// tiếp được khi chuyển domain sang bản mới.

const enc = new TextEncoder()

export const COOKIE_NAME = 'c10a7_session'
export const SESSION_TTL = 60 * 60 * 24 * 7

export interface Phien {
  accountId?: number
  role?: string | null
  ten?: string | null
  username?: string
  teacherPending?: boolean
  hocSinhId?: number | null
  lopId?: number | null
  phienId?: string
  id?: number
  phuId?: number
  taiKhoanPhuId?: number
  /** ms: phiên được cấp bằng đăng nhập Google (mở cửa sổ đặt mật khẩu không cần mật khẩu cũ). */
  dangNhapGoogleLuc?: number
  exp?: number
}

export function b64urlEncode(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function b64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

export function safeEqual(a: unknown, b: unknown): boolean {
  const x = enc.encode(String(a))
  const y = enc.encode(String(b))
  let diff = x.length ^ y.length
  const n = Math.max(x.length, y.length)
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

export async function createToken(secret: string, payload: Phien, ttlSeconds: number): Promise<string> {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }
  const p = b64urlEncode(enc.encode(JSON.stringify(body)))
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(p)))
  return `${p}.${b64urlEncode(sig)}`
}

export async function verifyToken(secret: string, token: string | null): Promise<Phien | null> {
  if (!token) return null
  const [p, s] = token.split('.')
  if (!p || !s) return null
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), b64urlDecode(s), enc.encode(p))
    if (!ok) return null
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as Phien
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null
    return data
  } catch {
    return null
  }
}

export function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get('Cookie') || ''
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim())
      } catch {
        return null
      }
    }
  }
  return null
}

export function actorKey(phien: Phien | null): string {
  if (!phien) return 'anon'
  if (phien.accountId) return `acc:${phien.accountId}`
  if (phien.role === 'teacher') return phien.id ? `gv:${phien.id}` : 'gv:legacy'
  if (phien.hocSinhId) return `hs:${phien.hocSinhId}`
  if (phien.phuId || phien.taiKhoanPhuId) return `phu:${phien.phuId || phien.taiKhoanPhuId}`
  return 'anon'
}

export function cookiePhien(token: string, https: boolean): string {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly${https ? '; Secure' : ''}; SameSite=Lax; Max-Age=${SESSION_TTL}`
}

export function cookieXoa(https: boolean): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly${https ? '; Secure' : ''}; SameSite=Lax; Max-Age=0`
}
