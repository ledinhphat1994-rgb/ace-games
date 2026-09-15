import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'

interface PhanHoi {
  ok: boolean
  loi?: string
  lyDo?: string
  ten?: string
  role?: string
  accountId?: number
  actorKey?: string
  user?: { username: string }
}

const goi = (duongDan: string, init?: RequestInit) => exports.default.fetch(`${GOC}${duongDan}`, init)
const docJson = async (res: Response) => (await res.json()) as PhanHoi
const layCookie = (res: Response) => (res.headers.get('Set-Cookie') ?? '').split(';')[0]

const dangNhap = (username: string, password = MAT_KHAU) =>
  goi('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

const whoami = (cookie?: string) => goi('/api/whoami', { headers: cookie ? { Cookie: cookie } : {} })

describe('API đăng nhập', () => {
  it('chưa đăng nhập -> whoami 401', async () => {
    const res = await whoami()
    expect(res.status).toBe(401)
    expect((await docJson(res)).lyDo).toBe('chua_dang_nhap')
  })

  it('sai mật khẩu hoặc tài khoản bị khoá -> 401, không cấp cookie', async () => {
    for (const res of [await dangNhap('qa.v2.thu1', 'sai-mat-khau'), await dangNhap('qa.v2.khoa')]) {
      expect(res.status).toBe(401)
      expect(res.headers.get('Set-Cookie')).toBeNull()
      expect((await docJson(res)).loi).toBe('Tên đăng nhập hoặc mật khẩu không chính xác.')
    }
  })

  it('đăng nhập đúng (chữ hoa + khoảng trắng như bản cũ) -> cookie chuẩn, whoami đúng người', async () => {
    const res = await dangNhap('QA.v2.Thu1 ')
    expect(res.status).toBe(200)
    expect(res.headers.get('Set-Cookie')).toMatch(/^c10a7_session=.+; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800$/)
    expect((await docJson(res)).user?.username).toBe('qa.v2.thu1')

    const nd = await docJson(await whoami(layCookie(res)))
    expect(nd).toMatchObject({ ok: true, ten: 'QA Thử nghiệm 1', role: 'student' })
    expect(nd.actorKey).toBe(`acc:${nd.accountId}`)
  })

  it('đăng nhập ở thiết bị khác -> phiên cũ bị đá ra, phiên mới dùng được', async () => {
    const resCu = await dangNhap('qa.v2.thu2')
    const cu = layCookie(resCu)
    await resCu.body?.cancel()
    const resMoi = await dangNhap('qa.v2.thu2')
    const moi = layCookie(resMoi)
    await resMoi.body?.cancel()

    const kiemCu = await whoami(cu)
    expect(kiemCu.status).toBe(401)
    expect(kiemCu.headers.get('Set-Cookie')).toMatch(/Max-Age=0/)
    expect((await docJson(kiemCu)).lyDo).toBe('da_dang_nhap_noi_khac')

    const kiemMoi = await whoami(moi)
    expect(kiemMoi.status).toBe(200)
    await kiemMoi.body?.cancel()
  })

  it('đăng xuất -> xoá cookie', async () => {
    const res = await goi('/api/logout', { method: 'POST' })
    expect(res.status).toBe(200)
    expect(res.headers.get('Set-Cookie')).toMatch(/Max-Age=0/)
    await res.body?.cancel()
  })

  it('sai phương thức -> 405, đường dẫn API lạ -> 404', async () => {
    const r405 = await goi('/api/login')
    const r404 = await goi('/api/khong-co')
    expect(r405.status).toBe(405)
    expect(r404.status).toBe(404)
    await r405.body?.cancel()
    await r404.body?.cancel()
  })

  it('sai quá 8 lần cùng 1 tên đăng nhập -> lần thứ 9 bị chặn 429', async () => {
    for (let i = 0; i < 8; i++) {
      const res = await dangNhap('qa.v2.khong-ton-tai', 'sai')
      expect(res.status).toBe(401)
      await res.body?.cancel()
    }
    const biChan = await dangNhap('qa.v2.khong-ton-tai', 'sai')
    expect(biChan.status).toBe(429)
    await biChan.body?.cancel()
  })
})
