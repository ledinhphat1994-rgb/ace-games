// Đổi mật khẩu trong trang Hồ sơ: thiết bị đang dùng phải còn đăng nhập (nhận cookie phiên mới), còn mọi bản
// sao của phiên cũ mất hiệu lực. Trước đây chính người vừa đổi bị đăng xuất với thông báo "đăng nhập nơi khác".
import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'

const goi = (path: string, init?: RequestInit) => exports.default.fetch(`${GOC}${path}`, init)
const guiJson = (path: string, body: unknown, cookie?: string) =>
  goi(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  })
const layCookie = (res: Response) => (res.headers.get('Set-Cookie') ?? '').split(';')[0]

async function taoTaiKhoan(): Promise<{ username: string; cookie: string }> {
  const username = `qa.doimk.${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`
  const dk = await guiJson('/api/register', { username, password: MAT_KHAU, tenHienThi: 'Đổi Mật Khẩu' })
  expect(dk.status).toBe(200)
  await dk.body?.cancel()
  const dn = await guiJson('/api/login', { username, password: MAT_KHAU })
  expect(dn.status).toBe(200)
  await dn.body?.cancel()
  return { username, cookie: layCookie(dn) }
}

describe('Đổi mật khẩu giữ phiên của thiết bị hiện tại', () => {
  it('cookie mới dùng tiếp được, cookie cũ và mật khẩu cũ mất hiệu lực', async () => {
    const { username, cookie: cookieCu } = await taoTaiKhoan()

    const res = await guiJson('/api/profile/password', { matKhauCu: MAT_KHAU, matKhauMoi: 'MatKhauMoi@2026' }, cookieCu)
    expect(res.status).toBe(200)
    await res.body?.cancel()
    const cookieMoi = layCookie(res)
    expect(cookieMoi).toMatch(/^c10a7_session=/)
    expect(cookieMoi).not.toBe(cookieCu)

    const whoMoi = await goi('/api/whoami', { headers: { Cookie: cookieMoi } })
    expect(whoMoi.status).toBe(200)
    expect(((await whoMoi.json()) as { username: string }).username).toBe(username)

    const whoCu = await goi('/api/whoami', { headers: { Cookie: cookieCu } })
    expect(whoCu.status).toBe(401)
    await whoCu.body?.cancel()

    const dnCu = await guiJson('/api/login', { username, password: MAT_KHAU })
    expect(dnCu.status).toBe(401)
    await dnCu.body?.cancel()
    const dnMoi = await guiJson('/api/login', { username, password: 'MatKhauMoi@2026' })
    expect(dnMoi.status).toBe(200)
    await dnMoi.body?.cancel()
  })

  it('sai mật khẩu cũ thì không đổi gì và phiên vẫn còn', async () => {
    const { cookie } = await taoTaiKhoan()
    const res = await guiJson('/api/profile/password', { matKhauCu: 'sai-mat-khau', matKhauMoi: 'MatKhauMoi@2026' }, cookie)
    expect(res.status).toBe(400)
    expect(res.headers.get('Set-Cookie')).toBeNull()
    await res.body?.cancel()
    const who = await goi('/api/whoami', { headers: { Cookie: cookie } })
    expect(who.status).toBe(200)
    await who.body?.cancel()
  })
})
