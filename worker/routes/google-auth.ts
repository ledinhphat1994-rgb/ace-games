// Đăng nhập bằng Google — mức liên kết (Platform Core: Identity & Accounts).
// Google chỉ xác nhận "người này sở hữu Gmail này"; tài khoản, vai trò, lớp, khoá / mở khoá vẫn do hệ thống quản lý.
// - Liên kết: người đang đăng nhập bấm "Liên kết Google" ở Hồ sơ cá nhân → bảng lien_ket_google (1 tài khoản ↔ 1 Google).
// - Đăng nhập: Google đã liên kết → cấp phiên y như đăng nhập mật khẩu (đá thiết bị cũ bằng mã 4001).
//   Google chưa liên kết → không tạo tài khoản mới.
// Chống giả mạo: state + PKCE giữ trong cookie HttpOnly ký HMAC (khoá tách riêng khỏi khoá phiên), sống 10 phút.
// id_token nhận thẳng từ Google qua HTTPS kèm client secret; vẫn kiểm aud / iss / exp.

import type { KetQuaGoogle, TrangThaiGoogle } from '../../shared/protocol/google'
import { b64urlDecode, b64urlEncode, cookiePhien, readCookie, safeEqual } from '../lib/auth'
import { recordAnalyticsEvent } from '../lib/analytics'
import { json, loi } from '../lib/http'
import { kiemTraPhien, layPhien } from '../lib/session'
import { capPhienDangNhap, type DongCapPhien } from './auth'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ISS = ['https://accounts.google.com', 'accounts.google.com']
export const COOKIE_GOOGLE = 'c10a7_google'
const COOKIE_PATH = '/api/auth/google'
const TTL_GIAY = 600
const TRANG_DANG_NHAP = '/learn'
/**
 * Mở link phòng / bàn được chia sẻ khi chưa đăng nhập → đăng nhập Google xong quay về đúng link đó.
 * Chỉ nhận đúng đường dẫn phòng học / bàn trò chơi (không phải link chuyển hướng tuỳ ý).
 */
const MAU_TRANG_DICH = /^\/(room\/phong-\d{1,12}|game\/[a-z0-9-]{1,64})$/
export const laTrangDichHopLe = (duongDan: string | null): duongDan is string =>
  typeof duongDan === 'string' && MAU_TRANG_DICH.test(duongDan)
const TRANG_LIEN_KET = '/me?tab=security'

type CheDo = 'dang_nhap' | 'lien_ket'
type Ctx = { waitUntil(promise: Promise<unknown>): void }

interface VeGoogle {
  state: string
  verifier: string
  cheDo: CheDo
  accountId: number | null
  /** 'khoi_phuc': bấm từ mục Quên mật khẩu — đăng nhập xong đưa thẳng tới chỗ đặt mật khẩu mới. */
  sau?: 'khoi_phuc'
  /** Link phòng / bàn đang mở khi bấm đăng nhập: đăng nhập xong quay về đây. */
  trangDich?: string
  exp: number
}

export interface DanhTinhGoogle {
  sub: string
  email: string | null
}

const enc = new TextEncoder()
const laHttps = (request: Request) => new URL(request.url).protocol === 'https:'
const diaChiGoiLai = (request: Request) => `${new URL(request.url).origin}/api/auth/google/callback`

function chuoiNgauNhien(soByte: number): string {
  return b64urlEncode(crypto.getRandomValues(new Uint8Array(soByte)))
}

// Khoá riêng cho vé Google: vé không bao giờ hợp lệ như một token phiên dù cùng SESSION_SECRET.
function khoaVe(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(`google-oauth:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

async function kyVe(secret: string, ve: VeGoogle): Promise<string> {
  const p = b64urlEncode(enc.encode(JSON.stringify(ve)))
  const chuKy = new Uint8Array(await crypto.subtle.sign('HMAC', await khoaVe(secret), enc.encode(p)))
  return `${p}.${b64urlEncode(chuKy)}`
}

async function docVe(request: Request, secret: string): Promise<VeGoogle | null> {
  const [p, s] = (readCookie(request, COOKIE_GOOGLE) ?? '').split('.')
  if (!p || !s) return null
  try {
    if (!(await crypto.subtle.verify('HMAC', await khoaVe(secret), b64urlDecode(s), enc.encode(p)))) return null
    const ve = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as VeGoogle
    if (typeof ve.state !== 'string' || typeof ve.verifier !== 'string') return null
    if (ve.cheDo !== 'dang_nhap' && ve.cheDo !== 'lien_ket') return null
    if (typeof ve.exp !== 'number' || ve.exp < Math.floor(Date.now() / 1000)) return null
    return ve
  } catch {
    return null
  }
}

const cookieVe = (giaTri: string, https: boolean) =>
  `${COOKIE_GOOGLE}=${encodeURIComponent(giaTri)}; Path=${COOKIE_PATH}; HttpOnly${https ? '; Secure' : ''}; SameSite=Lax; Max-Age=${TTL_GIAY}`
const cookieXoaVe = (https: boolean) =>
  `${COOKIE_GOOGLE}=; Path=${COOKIE_PATH}; HttpOnly${https ? '; Secure' : ''}; SameSite=Lax; Max-Age=0`

/** Kết thúc luồng: xoá vé, (tuỳ chọn) đặt cookie phiên, quay về trang kèm ?google=<kết quả>. */
function veTrang(request: Request, duongDan: string, ketQua: KetQuaGoogle, cookieThem?: string): Response {
  const dich = new URL(duongDan, request.url)
  dich.searchParams.set('google', ketQua)
  const headers = new Headers({ Location: `${dich.pathname}${dich.search}`, 'Cache-Control': 'no-store' })
  headers.append('Set-Cookie', cookieXoaVe(laHttps(request)))
  if (cookieThem) headers.append('Set-Cookie', cookieThem)
  return new Response(null, { status: 302, headers })
}

const daCauHinh = (env: Env): env is Env & { GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string } =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.SESSION_SECRET)

/** Đọc id_token nhận trực tiếp từ Google; chỉ nhận token phát cho đúng Client ID và còn hạn. */
export function docIdToken(idToken: string, clientId: string, bayGio = Date.now()): DanhTinhGoogle | null {
  const phan = idToken.split('.')
  if (phan.length !== 3) return null
  let c: Record<string, unknown>
  try {
    c = JSON.parse(new TextDecoder().decode(b64urlDecode(phan[1]))) as Record<string, unknown>
  } catch {
    return null
  }
  if (!GOOGLE_ISS.includes(String(c.iss))) return null
  if (c.aud !== clientId) return null
  if (typeof c.exp !== 'number' || c.exp * 1000 <= bayGio) return null
  if (typeof c.sub !== 'string' || !c.sub || c.sub.length > 255) return null
  const daXacMinh = c.email_verified === true || c.email_verified === 'true'
  const email = typeof c.email === 'string' && daXacMinh ? c.email.slice(0, 320) : null
  return { sub: c.sub, email }
}

/** Đổi mã uỷ quyền lấy id_token (kèm client secret + PKCE verifier). */
export async function layDanhTinhGoogle(
  env: Env & { GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string },
  code: string,
  verifier: string,
  redirectUri: string,
  fetcher: typeof fetch = fetch,
): Promise<DanhTinhGoogle | null> {
  let res: Response
  try {
    res = await fetcher(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }).toString(),
    })
  } catch (e) {
    console.warn('[google] Không gọi được máy chủ token của Google:', e)
    return null
  }
  if (!res.ok) {
    console.warn(`[google] Đổi mã uỷ quyền thất bại (HTTP ${res.status})`)
    await res.body?.cancel()
    return null
  }
  const body = (await res.json().catch(() => null)) as { id_token?: unknown } | null
  if (typeof body?.id_token !== 'string') return null
  return docIdToken(body.id_token, env.GOOGLE_CLIENT_ID)
}

/** GET /api/auth/google/start?che_do=dang_nhap|lien_ket — chuyển sang trang chọn tài khoản của Google. */
export async function batDauGoogle(request: Request, env: Env): Promise<Response> {
  const thamSo = new URL(request.url).searchParams
  const cheDo: CheDo = thamSo.get('che_do') === 'lien_ket' ? 'lien_ket' : 'dang_nhap'
  const sau = cheDo === 'dang_nhap' && thamSo.get('sau') === 'khoi_phuc' ? 'khoi_phuc' : undefined
  const toi = thamSo.get('toi')
  const trangDich = cheDo === 'dang_nhap' && laTrangDichHopLe(toi) ? toi : undefined
  const trangVe = cheDo === 'lien_ket' ? TRANG_LIEN_KET : (trangDich ?? TRANG_DANG_NHAP)
  if (!daCauHinh(env)) return veTrang(request, trangVe, 'chua_cau_hinh')

  let accountId: number | null = null
  if (cheDo === 'lien_ket') {
    const kq = await kiemTraPhien(await layPhien(request, env), env)
    if (!kq.hopLe) return veTrang(request, TRANG_DANG_NHAP, 'can_dang_nhap')
    accountId = kq.taiKhoan.id
  }

  const state = chuoiNgauNhien(32)
  const verifier = chuoiNgauNhien(48)
  const challenge = b64urlEncode(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(verifier))))
  const ve = await kyVe(env.SESSION_SECRET, {
    state,
    verifier,
    cheDo,
    accountId,
    ...(sau ? { sau } : {}),
    ...(trangDich ? { trangDich } : {}),
    exp: Math.floor(Date.now() / 1000) + TTL_GIAY,
  })

  const dich = new URL(GOOGLE_AUTH_URL)
  dich.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: diaChiGoiLai(request),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString()

  return new Response(null, {
    status: 302,
    headers: { Location: dich.toString(), 'Set-Cookie': cookieVe(ve, laHttps(request)), 'Cache-Control': 'no-store' },
  })
}

/** GET /api/auth/google/callback — Google chuyển về sau khi người dùng chọn tài khoản. */
export async function googleGoiLai(request: Request, env: Env, ctx?: Ctx, fetcher: typeof fetch = fetch): Promise<Response> {
  if (!daCauHinh(env)) return veTrang(request, TRANG_DANG_NHAP, 'chua_cau_hinh')
  const ve = await docVe(request, env.SESSION_SECRET)
  if (!ve) return veTrang(request, TRANG_DANG_NHAP, 'loi')
  const trangVe =
    ve.cheDo === 'lien_ket' ? TRANG_LIEN_KET : laTrangDichHopLe(ve.trangDich ?? null) ? ve.trangDich! : TRANG_DANG_NHAP

  const url = new URL(request.url)
  if (url.searchParams.get('error')) return veTrang(request, trangVe, 'da_huy')
  const state = url.searchParams.get('state') ?? ''
  const code = url.searchParams.get('code') ?? ''
  if (!code || !state || !safeEqual(state, ve.state)) return veTrang(request, trangVe, 'loi')

  const danhTinh = await layDanhTinhGoogle(env, code, ve.verifier, diaChiGoiLai(request), fetcher)
  if (!danhTinh) return veTrang(request, trangVe, 'loi')

  return ve.cheDo === 'lien_ket'
    ? lienKet(request, env, ve, danhTinh)
    : dangNhapGoogle(request, env, danhTinh, ctx, ve.sau === 'khoi_phuc', trangVe)
}

async function lienKet(request: Request, env: Env, ve: VeGoogle, dt: DanhTinhGoogle): Promise<Response> {
  // Phiên lúc quay về phải còn hợp lệ và đúng tài khoản đã bấm "Liên kết Google".
  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe || kq.taiKhoan.id !== ve.accountId) return veTrang(request, TRANG_LIEN_KET, 'can_dang_nhap')
  const accountId = kq.taiKhoan.id

  try {
    const daCo = await env.DB.prepare('SELECT account_id FROM lien_ket_google WHERE google_sub = ?1')
      .bind(dt.sub)
      .first<{ account_id: number }>()
    if (daCo && daCo.account_id !== accountId) return veTrang(request, TRANG_LIEN_KET, 'da_lien_ket_khac')
    await env.DB.prepare(
      `INSERT INTO lien_ket_google (account_id, google_sub, email, created_at) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(account_id) DO UPDATE SET google_sub = excluded.google_sub, email = excluded.email, created_at = excluded.created_at`,
    )
      .bind(accountId, dt.sub, dt.email, Date.now())
      .run()
  } catch (e) {
    // Hai lượt liên kết cùng Google chạy song song: lượt thua chạm UNIQUE(google_sub).
    if (String(e).includes('UNIQUE')) return veTrang(request, TRANG_LIEN_KET, 'da_lien_ket_khac')
    console.error('[google] Lỗi lưu liên kết:', e)
    return veTrang(request, TRANG_LIEN_KET, 'loi')
  }
  return veTrang(request, TRANG_LIEN_KET, 'da_lien_ket')
}

async function dangNhapGoogle(
  request: Request,
  env: Env,
  dt: DanhTinhGoogle,
  ctx?: Ctx,
  khoiPhuc = false,
  trangVe: string = TRANG_DANG_NHAP,
): Promise<Response> {
  let user: (DongCapPhien & { dang_hoat_dong: number | null }) | null
  try {
    user = await env.DB.prepare(
      `SELECT tk.id, tk.ten_dang_nhap, tk.ten_hien_thi, tk.vai_tro, tk.teacher_pending, tk.hoc_sinh_id, tk.lop_id,
              tk.dang_hoat_dong
         FROM lien_ket_google g JOIN tai_khoan_campus tk ON tk.id = g.account_id
        WHERE g.google_sub = ?1`,
    )
      .bind(dt.sub)
      .first()
  } catch (e) {
    console.error('[google] Lỗi tra cứu liên kết:', e)
    return veTrang(request, trangVe, 'loi')
  }

  if (!user || !user.dang_hoat_dong) {
    recordAnalyticsEvent(env.ANALYTICS_DB, ctx, {
      event: 'auth.login_failed',
      properties: { reason: !user ? 'GOOGLE_NOT_LINKED' : 'ACCOUNT_INACTIVE', method: 'google' },
    })
    return veTrang(request, trangVe, !user ? 'chua_lien_ket' : 'bi_khoa')
  }

  // Gmail có thể đổi phía Google: cập nhật để quản trị thấy đúng địa chỉ hiện tại.
  if (dt.email) {
    await env.DB.prepare('UPDATE lien_ket_google SET email = ?1 WHERE google_sub = ?2')
      .bind(dt.email, dt.sub)
      .run()
      .catch(() => {})
  }

  const { token, phienId } = await capPhienDangNhap(env, user, ctx, { quaGoogle: true })
  recordAnalyticsEvent(env.ANALYTICS_DB, ctx, {
    event: 'auth.login_succeeded',
    actorId: user.id,
    sessionId: phienId,
    properties: { role: user.vai_tro, isLinked: Boolean(user.hoc_sinh_id && user.lop_id), method: 'google' },
  })
  // Từ mục Quên mật khẩu: đưa thẳng tới tab Mật khẩu để đặt mật khẩu mới (không cần mật khẩu cũ trong 15 phút).
  return khoiPhuc
    ? veTrang(request, TRANG_LIEN_KET, 'khoi_phuc', cookiePhien(token, laHttps(request)))
    : veTrang(request, trangVe, 'ok', cookiePhien(token, laHttps(request)))
}

/** GET /api/auth/google/status */
export async function trangThaiGoogle(request: Request, env: Env): Promise<Response> {
  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  let dong: { email: string | null } | null
  try {
    dong = await env.DB.prepare('SELECT email FROM lien_ket_google WHERE account_id = ?1')
      .bind(kq.taiKhoan.id)
      .first<{ email: string | null }>()
  } catch (e) {
    console.error('[google] Lỗi đọc liên kết:', e)
    return loi('Không đọc được trạng thái liên kết Google.', 500)
  }
  const kqTraVe: TrangThaiGoogle = { ok: true, sanSang: daCauHinh(env), lienKet: Boolean(dong), email: dong?.email ?? null }
  return json(kqTraVe)
}

/** POST /api/auth/google/unlink — gỡ liên kết; tài khoản vẫn đăng nhập bằng mật khẩu như cũ. */
export async function goLienKetGoogle(request: Request, env: Env): Promise<Response> {
  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  try {
    await env.DB.prepare('DELETE FROM lien_ket_google WHERE account_id = ?1').bind(kq.taiKhoan.id).run()
  } catch (e) {
    console.error('[google] Lỗi gỡ liên kết:', e)
    return loi('Không gỡ được liên kết Google.', 500)
  }
  return json({ ok: true })
}
