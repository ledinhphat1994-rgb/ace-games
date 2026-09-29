// Tự lấy lại mật khẩu không cần quản trị: (1) mã 6 số gửi tới Gmail đã liên kết, (2) đăng nhập Google rồi đặt mật khẩu mới
// không cần mật khẩu cũ trong 15 phút. Phản hồi luôn chung chung để không dò được tài khoản nào tồn tại / có Gmail.
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { b64urlEncode } from '../worker/lib/auth'
import { CUA_SO_DAT_MAT_KHAU_GOOGLE_MS, vuaDangNhapGoogle, yeuCauQuenMatKhau } from '../worker/routes/auth'
import { googleGoiLai } from '../worker/routes/google-auth'
import { GOC, MAT_KHAU } from './fixtures'
import { dangNhapLayCookie } from './ws'
import authModalRaw from '../src/features/auth/AuthModal.tsx?raw'
import profileRaw from '../src/features/hub/ProfilePage.tsx?raw'
import authGateRaw from '../src/app/AuthGate.tsx?raw'

const goi = (path: string, init?: RequestInit) => exports.default.fetch(`${GOC}${path}`, { redirect: 'manual', ...init })
const idTaiKhoan = async (u: string) =>
  (await env.DB.prepare('SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = ?1').bind(u).first<{ id: number }>())!.id

async function lienKet(username: string, sub: string, email: string) {
  await env.DB.prepare('INSERT INTO lien_ket_google (account_id, google_sub, email, created_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(await idTaiKhoan(username), sub, email, Date.now())
    .run()
}

/** Binding EMAIL giả: ghi lại thư thay vì gửi thật. */
function hopThuGia() {
  const thu: EmailMessageBuilder[] = []
  const sender = {
    send: async (m: EmailMessageBuilder) => {
      thu.push(m)
      return { messageId: `thu-${thu.length}` }
    },
  } as unknown as SendEmail
  return { thu, sender }
}

let soIp = 0
async function yeuCau(username: string, sender: SendEmail) {
  const req = new Request(`${GOC}/api/forgot-password/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': `10.9.0.${++soIp}` },
    body: JSON.stringify({ username }),
  })
  const res = await yeuCauQuenMatKhau(req, { ...env, EMAIL: sender })
  expect(res.status).toBe(200)
  return ((await res.json()) as { message: string }).message
}

const maTrongThu = (m: EmailMessageBuilder) => /mã khôi phục mật khẩu của bạn là: (\d{6})/i.exec(m.text ?? '')?.[1]

describe('Mã khôi phục gửi qua Gmail đã liên kết', () => {
  it('gửi mã tới Gmail; mã đặt được mật khẩu mới; mã không nằm ở tiêu đề; tên được thoát HTML', async () => {
    await env.DB.prepare("UPDATE tai_khoan_campus SET ten_hien_thi = 'An <b>' WHERE ten_dang_nhap = 'qa.v2.thu2'").run()
    await lienKet('qa.v2.thu2', 'sub-email-2', 'thu2@gmail.com')
    const { thu, sender } = hopThuGia()

    await yeuCau('qa.v2.thu2', sender)
    expect(thu).toHaveLength(1)
    expect(thu[0].to).toBe('thu2@gmail.com')
    expect(thu[0].from).toMatchObject({ email: 'no-reply@gdtxdinhquan.com' })
    const code = maTrongThu(thu[0])!
    expect(code).toMatch(/^\d{6}$/)
    expect(thu[0].subject).not.toContain(code)
    expect(thu[0].html).toContain('An &lt;b&gt;')
    expect(thu[0].html).not.toContain('An <b>')

    const datLai = await goi('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'qa.v2.thu2', maXacNhan: code, matKhauMoi: 'MoiQuaEmail@1' }),
    })
    expect(datLai.status).toBe(200)
    await datLai.body?.cancel()
    const dn = await goi('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'qa.v2.thu2', password: 'MoiQuaEmail@1' }),
    })
    expect(dn.status).toBe(200)
    await dn.body?.cancel()
  })

  it('phản hồi giống hệt nhau dù tài khoản có Gmail, chưa liên kết, bị khoá hay không tồn tại; chỉ tài khoản đủ điều kiện nhận thư', async () => {
    await lienKet('qa.v2.khoa', 'sub-email-khoa', 'khoa@gmail.com')
    await lienKet('qa.v2.thu3', 'sub-email-3', 'thu3@gmail.com')
    const { thu, sender } = hopThuGia()
    const cacPhanHoi = [
      await yeuCau('qa.v2.thu3', sender),
      await yeuCau('qa.v2.tudo', sender),
      await yeuCau('qa.v2.khoa', sender),
      await yeuCau('khong.ton.tai', sender),
    ]
    expect(new Set(cacPhanHoi).size).toBe(1)
    expect(thu.map((m) => m.to)).toEqual(['thu3@gmail.com'])
  })

  it('chống dội thư: cách nhau ít nhất 1 phút, tối đa 3 thư/giờ cho mỗi tài khoản', async () => {
    await lienKet('qa.v2.gv', 'sub-email-gv', 'gv@gmail.com')
    const id = await idTaiKhoan('qa.v2.gv')
    const { thu, sender } = hopThuGia()
    const lui2Phut = () =>
      env.DB.prepare('UPDATE password_reset_tokens SET created_at = created_at - 120000 WHERE account_id = ?1').bind(id).run()

    await yeuCau('qa.v2.gv', sender)
    await yeuCau('qa.v2.gv', sender) // ngay sau đó: bỏ qua
    expect(thu).toHaveLength(1)
    await lui2Phut()
    await yeuCau('qa.v2.gv', sender)
    await lui2Phut()
    await yeuCau('qa.v2.gv', sender)
    await lui2Phut()
    await yeuCau('qa.v2.gv', sender) // thư thứ 4 trong 1 giờ: bỏ qua
    expect(thu).toHaveLength(3)
  })
})

// ── Đăng nhập Google rồi đặt mật khẩu mới không cần mật khẩu cũ ──
const enc = new TextEncoder()
const idToken = (sub: string) => {
  const phan = (o: unknown) => b64urlEncode(enc.encode(JSON.stringify(o)))
  const claims = { iss: 'https://accounts.google.com', aud: env.GOOGLE_CLIENT_ID, sub, exp: Math.floor(Date.now() / 1000) + 600 }
  return `${phan({ alg: 'RS256' })}.${phan(claims)}.x`
}
const googleGia = (sub: string) => (async () => Response.json({ id_token: idToken(sub) })) as unknown as typeof fetch
const cookieTu = (res: Response, ten: string) =>
  res.headers
    .getSetCookie()
    .find((c) => c.startsWith(`${ten}=`))
    ?.split(';')[0] ?? null

describe('Đặt mật khẩu mới sau khi đăng nhập Google', () => {
  it('bấm từ Quên mật khẩu → vào thẳng tab Mật khẩu; đặt được mật khẩu mới không cần mật khẩu cũ; đặt xong thì cửa sổ đóng', async () => {
    await lienKet('qa.v2.thu1', 'sub-khoi-phuc-1', 'thu1@gmail.com')
    const batDau = await goi('/api/auth/google/start?sau=khoi_phuc')
    const state = new URL(batDau.headers.get('Location')!).searchParams.get('state')!
    const ve = cookieTu(batDau, 'c10a7_google')!
    const res = await googleGoiLai(
      new Request(`${GOC}/api/auth/google/callback?code=abc&state=${state}`, { headers: { Cookie: ve } }),
      env,
      undefined,
      googleGia('sub-khoi-phuc-1'),
    )
    expect(res.headers.get('Location')).toBe('/me?tab=security&google=khoi_phuc')
    const phien = cookieTu(res, 'c10a7_session')!

    const who = await goi('/api/whoami', { headers: { Cookie: phien } })
    expect(await who.json()).toMatchObject({ username: 'qa.v2.thu1', datMatKhauKhongCanCu: true })

    const dat = await goi('/api/profile/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: phien },
      body: JSON.stringify({ matKhauMoi: 'MoiQuaGoogle@1' }),
    })
    expect(dat.status).toBe(200)
    await dat.body?.cancel()
    const phienMoi = cookieTu(dat, 'c10a7_session')!
    const who2 = await goi('/api/whoami', { headers: { Cookie: phienMoi } })
    expect(await who2.json()).toMatchObject({ datMatKhauKhongCanCu: false })

    // Cửa sổ đã đóng: lần sau phải có mật khẩu hiện tại.
    const lan2 = await goi('/api/profile/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: phienMoi },
      body: JSON.stringify({ matKhauMoi: 'KhacNua@2' }),
    })
    expect(lan2.status).toBe(400)
    await lan2.body?.cancel()

    const dn = await goi('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'qa.v2.thu1', password: 'MoiQuaGoogle@1' }),
    })
    expect(dn.status).toBe(200)
    await dn.body?.cancel()
  })

  it('đăng nhập bằng mật khẩu thì vẫn phải nhập mật khẩu hiện tại; cửa sổ Google chỉ 15 phút', async () => {
    const phien = await dangNhapLayCookie('qa.v2.tudo')
    const res = await goi('/api/profile/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: phien },
      body: JSON.stringify({ matKhauMoi: 'KhongDuoc@1' }),
    })
    expect(res.status).toBe(400)
    await res.body?.cancel()
    const dn = await goi('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'qa.v2.tudo', password: MAT_KHAU }),
    })
    expect(dn.status).toBe(200)
    await dn.body?.cancel()

    const luc = 1_000_000
    expect(vuaDangNhapGoogle({ dangNhapGoogleLuc: luc }, luc + CUA_SO_DAT_MAT_KHAU_GOOGLE_MS - 1)).toBe(true)
    expect(vuaDangNhapGoogle({ dangNhapGoogleLuc: luc }, luc + CUA_SO_DAT_MAT_KHAU_GOOGLE_MS)).toBe(false)
    expect(vuaDangNhapGoogle({}, luc)).toBe(false)
  })
})

describe('Giao diện', () => {
  it('Quên mật khẩu có nút Google; Hồ sơ ẩn ô mật khẩu cũ khi vừa đăng nhập Google; nhắc liên kết Gmail', () => {
    expect(authModalRaw).toContain('href="/api/auth/google/start?sau=khoi_phuc"')
    expect(profileRaw).toContain('{!khongCanMatKhauCu && (')
    expect(authGateRaw).toContain("id: 'nhac-lien-ket-google'")
    expect(authGateRaw).toContain("pathname.startsWith('/room')")
  })
})
