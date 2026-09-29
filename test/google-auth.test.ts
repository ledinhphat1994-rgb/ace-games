// Đăng nhập bằng Google — mức liên kết: chỉ Google đã liên kết mới đăng nhập được, không tạo tài khoản mới;
// state + PKCE ràng buộc vào cookie ký HMAC; cấp phiên y như đăng nhập mật khẩu (1 tài khoản 1 thiết bị).
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { b64urlEncode } from '../worker/lib/auth'
import { docIdToken, googleGoiLai } from '../worker/routes/google-auth'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'
import authModalRaw from '../src/features/auth/AuthModal.tsx?raw'
import profileRaw from '../src/features/hub/ProfilePage.tsx?raw'

const CLIENT_ID = env.GOOGLE_CLIENT_ID as string
const goi = (path: string, init?: RequestInit) => exports.default.fetch(`${GOC}${path}`, { redirect: 'manual', ...init })
const enc = new TextEncoder()

function taoIdToken(claims: Record<string, unknown>): string {
  const phan = (o: unknown) => b64urlEncode(enc.encode(JSON.stringify(o)))
  return `${phan({ alg: 'RS256', typ: 'JWT' })}.${phan(claims)}.chu-ky-khong-kiem`
}

const claimHopLe = (sub: string, email = `${sub}@gmail.com`) => ({
  iss: 'https://accounts.google.com',
  aud: CLIENT_ID,
  sub,
  email,
  email_verified: true,
  exp: Math.floor(Date.now() / 1000) + 600,
})

/** Máy chủ token giả: ghi lại body gửi đi, trả id_token cho sub cho trước. */
function googleGia(sub: string) {
  const daGui: URLSearchParams[] = []
  const fetcher = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    daGui.push(new URLSearchParams(String(init?.body ?? '')))
    return Response.json({ id_token: taoIdToken(claimHopLe(sub)) })
  }) as unknown as typeof fetch
  return { fetcher, daGui }
}

const cookieTu = (res: Response, ten: string) =>
  res.headers
    .getSetCookie()
    .find((c) => c.startsWith(`${ten}=`))
    ?.split(';')[0] ?? null

/** Bắt đầu luồng → trả cookie vé + state Google nhận được. */
async function batDau(cheDo: 'dang_nhap' | 'lien_ket', cookiePhien?: string) {
  const res = await goi(`/api/auth/google/start${cheDo === 'lien_ket' ? '?che_do=lien_ket' : ''}`, {
    headers: cookiePhien ? { Cookie: cookiePhien } : {},
  })
  expect(res.status).toBe(302)
  const dich = new URL(res.headers.get('Location')!)
  return { res, dich, ve: cookieTu(res, 'c10a7_google')!, state: dich.searchParams.get('state')! }
}

async function goiLai(cookies: string[], state: string, fetcher: typeof fetch, code = 'ma-uy-quyen') {
  const req = new Request(`${GOC}/api/auth/google/callback?code=${code}&state=${state}`, {
    headers: { Cookie: cookies.join('; ') },
  })
  return googleGoiLai(req, env, undefined, fetcher)
}

const idTaiKhoan = async (username: string) =>
  (await env.DB.prepare('SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = ?1').bind(username).first<{ id: number }>())!.id

async function lienKetSan(username: string, sub: string) {
  await env.DB.prepare('INSERT INTO lien_ket_google (account_id, google_sub, email, created_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(await idTaiKhoan(username), sub, `${sub}@gmail.com`, Date.now())
    .run()
}

describe('docIdToken — chỉ nhận token phát cho đúng ứng dụng', () => {
  it('nhận token hợp lệ; email chỉ lấy khi Google đã xác minh', () => {
    expect(docIdToken(taoIdToken(claimHopLe('s1')), CLIENT_ID)).toEqual({ sub: 's1', email: 's1@gmail.com' })
    expect(docIdToken(taoIdToken({ ...claimHopLe('s1'), email_verified: false }), CLIENT_ID)).toEqual({ sub: 's1', email: null })
  })

  it('từ chối sai aud / sai iss / hết hạn / thiếu sub / sai định dạng', () => {
    expect(docIdToken(taoIdToken({ ...claimHopLe('s1'), aud: 'ung-dung-khac' }), CLIENT_ID)).toBeNull()
    expect(docIdToken(taoIdToken({ ...claimHopLe('s1'), iss: 'https://gia-mao.example' }), CLIENT_ID)).toBeNull()
    expect(docIdToken(taoIdToken({ ...claimHopLe('s1'), exp: Math.floor(Date.now() / 1000) - 1 }), CLIENT_ID)).toBeNull()
    expect(docIdToken(taoIdToken({ ...claimHopLe('s1'), sub: '' }), CLIENT_ID)).toBeNull()
    expect(docIdToken('khong-phai-jwt', CLIENT_ID)).toBeNull()
  })
})

describe('Bắt đầu đăng nhập Google', () => {
  it('chuyển sang Google kèm Client ID, PKCE S256, state; vé nằm trong cookie HttpOnly riêng đường dẫn', async () => {
    const { res, dich, state } = await batDau('dang_nhap')
    expect(dich.origin + dich.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(dich.searchParams.get('client_id')).toBe(CLIENT_ID)
    expect(dich.searchParams.get('redirect_uri')).toBe(`${GOC}/api/auth/google/callback`)
    expect(dich.searchParams.get('scope')).toBe('openid email profile')
    expect(dich.searchParams.get('code_challenge_method')).toBe('S256')
    expect(dich.searchParams.get('code_challenge')).toBeTruthy()
    expect(state.length).toBeGreaterThanOrEqual(40)
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith('c10a7_google='))!
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Path=/api/auth/google')
    expect(cookie).toContain('SameSite=Lax')
  })

  it('liên kết khi chưa đăng nhập → quay về báo cần đăng nhập, không sang Google', async () => {
    const res = await goi('/api/auth/google/start?che_do=lien_ket')
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('/learn?google=can_dang_nhap')
  })
})

describe('Google gọi lại — chống giả mạo', () => {
  it('không có vé / state sai / người dùng huỷ → không đổi mã, không cấp phiên', async () => {
    const { fetcher, daGui } = googleGia('sub-gia-mao')
    const khongVe = await goiLai([], 'bat-ky', fetcher)
    expect(khongVe.headers.get('Location')).toBe('/learn?google=loi')

    const { ve } = await batDau('dang_nhap')
    const saiState = await goiLai([ve], 'state-cua-ke-gian', fetcher)
    expect(saiState.headers.get('Location')).toBe('/learn?google=loi')
    expect(cookieTu(saiState, 'c10a7_session')).toBeNull()

    const huy = await googleGoiLai(
      new Request(`${GOC}/api/auth/google/callback?error=access_denied&state=x`, { headers: { Cookie: ve } }),
      env,
      undefined,
      fetcher,
    )
    expect(huy.headers.get('Location')).toBe('/learn?google=da_huy')
    expect(daGui).toHaveLength(0)
  })

  it('vé bị sửa (chữ ký sai) → từ chối', async () => {
    const { ve, state } = await batDau('dang_nhap')
    const [p, s] = ve.slice('c10a7_google='.length).split('.')
    const suaP = p.slice(0, -2) + (p.endsWith('AA') ? 'BB' : 'AA')
    const res = await goiLai([`c10a7_google=${suaP}.${s}`], state, googleGia('x').fetcher)
    expect(res.headers.get('Location')).toBe('/learn?google=loi')
  })
})

describe('Đăng nhập bằng Google đã liên kết', () => {
  it('cấp phiên y như đăng nhập mật khẩu, gửi đúng PKCE verifier + client secret, đá phiên cũ', async () => {
    await lienKetSan('qa.v2.thu2', 'sub-thu-2')
    const phienCu = await dangNhapLayCookie('qa.v2.thu2')

    const { ve, state } = await batDau('dang_nhap')
    const { fetcher, daGui } = googleGia('sub-thu-2')
    const res = await goiLai([ve], state, fetcher)
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('/learn?google=ok')
    expect(daGui).toHaveLength(1)
    expect(daGui[0].get('client_secret')).toBe(env.GOOGLE_CLIENT_SECRET)
    expect(daGui[0].get('code_verifier')?.length).toBeGreaterThanOrEqual(43)
    expect(daGui[0].get('redirect_uri')).toBe(`${GOC}/api/auth/google/callback`)
    // Vé dùng một lần: bị xoá khi quay về.
    expect(res.headers.getSetCookie().some((c) => c.startsWith('c10a7_google=;') && c.includes('Max-Age=0'))).toBe(true)

    const phienMoi = cookieTu(res, 'c10a7_session')!
    const who = await goi('/api/whoami', { headers: { Cookie: phienMoi } })
    expect(who.status).toBe(200)
    expect(((await who.json()) as { username: string }).username).toBe('qa.v2.thu2')

    const cu = await goi('/api/whoami', { headers: { Cookie: phienCu } })
    expect(cu.status).toBe(401)
    await cu.body?.cancel()
  })

  it('Gmail chưa liên kết → không tạo tài khoản, không cấp phiên', async () => {
    const truoc = await env.DB.prepare('SELECT COUNT(*) AS n FROM tai_khoan_campus').first<{ n: number }>()
    const { ve, state } = await batDau('dang_nhap')
    const res = await goiLai([ve], state, googleGia('sub-nguoi-la').fetcher)
    expect(res.headers.get('Location')).toBe('/learn?google=chua_lien_ket')
    expect(cookieTu(res, 'c10a7_session')).toBeNull()
    const sau = await env.DB.prepare('SELECT COUNT(*) AS n FROM tai_khoan_campus').first<{ n: number }>()
    expect(sau?.n).toBe(truoc?.n)
  })

  it('tài khoản bị khoá → từ chối dù Google đã liên kết', async () => {
    await lienKetSan('qa.v2.khoa', 'sub-khoa')
    const { ve, state } = await batDau('dang_nhap')
    const res = await goiLai([ve], state, googleGia('sub-khoa').fetcher)
    expect(res.headers.get('Location')).toBe('/learn?google=bi_khoa')
    expect(cookieTu(res, 'c10a7_session')).toBeNull()
  })
})

describe('Liên kết / gỡ liên kết Google', () => {
  it('người đang đăng nhập liên kết được; Gmail đó không gắn thêm tài khoản khác; gỡ xong hết đăng nhập bằng Google', async () => {
    const phien1 = await dangNhapLayCookie('qa.v2.thu1')
    const { ve, state } = await batDau('lien_ket', phien1)
    const res = await goiLai([ve, phien1], state, googleGia('sub-thu-1').fetcher)
    expect(res.headers.get('Location')).toBe('/me?tab=security&google=da_lien_ket')

    const tt = await goi('/api/auth/google/status', { headers: { Cookie: phien1 } })
    expect(await tt.json()).toMatchObject({ ok: true, sanSang: true, lienKet: true, email: 'sub-thu-1@gmail.com' })

    // Tài khoản khác cố liên kết cùng Gmail.
    const phien3 = await dangNhapLayCookie('qa.v2.thu3')
    const lan2 = await batDau('lien_ket', phien3)
    const trung = await goiLai([lan2.ve, phien3], lan2.state, googleGia('sub-thu-1').fetcher)
    expect(trung.headers.get('Location')).toBe('/me?tab=security&google=da_lien_ket_khac')

    const go = await goi('/api/auth/google/unlink', { method: 'POST', headers: { Cookie: phien1 } })
    expect(go.status).toBe(200)
    await go.body?.cancel()
    const dn = await batDau('dang_nhap')
    const sauGo = await goiLai([dn.ve], dn.state, googleGia('sub-thu-1').fetcher)
    expect(sauGo.headers.get('Location')).toBe('/learn?google=chua_lien_ket')
  })

  it('quay về bằng phiên của tài khoản khác với lúc bấm liên kết → từ chối', async () => {
    const phienA = await dangNhapLayCookie('qa.v2.tudo')
    const { ve, state } = await batDau('lien_ket', phienA)
    const phienB = await dangNhapLayCookie('qa.v2.gv')
    const res = await goiLai([ve, phienB], state, googleGia('sub-tron').fetcher)
    expect(res.headers.get('Location')).toBe('/me?tab=security&google=can_dang_nhap')
    const dong = await env.DB.prepare('SELECT 1 FROM lien_ket_google WHERE google_sub = ?1').bind('sub-tron').first()
    expect(dong).toBeNull()
  })

  it('trạng thái / gỡ liên kết cần đăng nhập', async () => {
    const tt = await goi('/api/auth/google/status')
    expect(tt.status).toBe(401)
    await tt.body?.cancel()
    const go = await goi('/api/auth/google/unlink', { method: 'POST' })
    expect(go.status).toBe(401)
    await go.body?.cancel()
  })
})

describe('Giao diện', () => {
  it('nút Đăng nhập bằng Google ở form đăng nhập; form đăng ký không còn chọn vai trò; hồ sơ có mục liên kết', () => {
    expect(authModalRaw).toContain('href="/api/auth/google/start"')
    expect(authModalRaw).not.toContain('dkVaiTro')
    expect(authModalRaw).not.toContain('dk-teacher-code')
    expect(profileRaw).toContain('/api/auth/google/start?che_do=lien_ket')
    expect(profileRaw).toContain('<LienKetGoogle />')
  })
})
