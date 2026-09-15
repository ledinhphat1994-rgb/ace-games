import { describe, expect, it } from 'vitest'
import { actorKey, cookiePhien, COOKIE_NAME, createToken, readCookie, verifyToken } from '../worker/lib/auth'
import { bamMatKhau, xacMinhMatKhau } from '../worker/lib/passwords'

// Vector sinh bằng code cũ functions/_lib/passwords.js + auth.js. Test này hỏng nghĩa là tài khoản và phiên của web cũ không dùng được ở v2.
const CU = {
  matKhau: 'MatKhau#Thử123',
  salt: '0f1e2d3c4b5a69788796a5b4c3d2e1f0',
  hash100000: '49a63047e03b6353b70299fa13a2df70ee930a28d2ebd5ac405e9d8a792688dc',
  hash120000: 'e5b024fc31d15833e4b5c73492566ea5941992158d5ac8248ba505019db97a49',
  secret: 'bi-mat-chi-dung-trong-test-khong-phai-that',
  token:
    'eyJhY2NvdW50SWQiOjcsInJvbGUiOiJzdHVkZW50IiwidGVuIjoiTmd1eeG7hW4gVsSDbiDDgSIsInVzZXJuYW1lIjoibnZhIiwidGVhY2hlclBlbmRpbmciOmZhbHNlLCJob2NTaW5oSWQiOm51bGwsImxvcElkIjoxLCJwaGllbklkIjoiMTExMTExMTEtMjIyMi00MzMzLTg0NDQtNTU1NTU1NTU1NTU1IiwiZXhwIjoyNDIwMTU3Njc3fQ.HQ-ckQFE6v14oREn5IdmjEfx61VdAhxnmMDdFEuNMHo',
}

describe('mật khẩu tương thích bản cũ', () => {
  it('băm ra đúng hash như bản cũ', async () => {
    expect(await bamMatKhau(CU.matKhau, CU.salt, 100000)).toBe(CU.hash100000)
  })

  it('xác minh hash bản cũ theo số vòng riêng từng tài khoản', async () => {
    expect(await xacMinhMatKhau(CU.matKhau, CU.hash100000, CU.salt, 100000)).toBe(true)
    expect(await xacMinhMatKhau(CU.matKhau, CU.hash120000, CU.salt, 120000)).toBe(true)
    expect(await xacMinhMatKhau(CU.matKhau, CU.hash120000, CU.salt, 100000)).toBe(false)
  })

  it('từ chối sai mật khẩu, thiếu dữ liệu, iterations null', async () => {
    expect(await xacMinhMatKhau(CU.matKhau + 'x', CU.hash100000, CU.salt, 100000)).toBe(false)
    expect(await xacMinhMatKhau(CU.matKhau, null, CU.salt, 100000)).toBe(false)
    expect(await xacMinhMatKhau(CU.matKhau, CU.hash100000, null, 100000)).toBe(false)
    expect(await xacMinhMatKhau(CU.matKhau, CU.hash100000, CU.salt, null)).toBe(false)
  })

  it('iterations bỏ trống thì dùng mặc định 100000 như bản cũ', async () => {
    expect(await xacMinhMatKhau(CU.matKhau, CU.hash100000, CU.salt)).toBe(true)
  })
})

describe('token phiên tương thích bản cũ', () => {
  it('đọc được token do bản cũ ký, giữ nguyên dấu tiếng Việt', async () => {
    expect(await verifyToken(CU.secret, CU.token)).toMatchObject({
      accountId: 7,
      ten: 'Nguyễn Văn Á',
      phienId: '11111111-2222-4333-8444-555555555555',
    })
  })

  it('từ chối token bị sửa, sai secret, hết hạn', async () => {
    const gia = (CU.token[0] === 'A' ? 'B' : 'A') + CU.token.slice(1)
    expect(await verifyToken(CU.secret, gia)).toBeNull()
    expect(await verifyToken(CU.secret + 'x', CU.token)).toBeNull()
    expect(await verifyToken(CU.secret, await createToken(CU.secret, { accountId: 1 }, -10))).toBeNull()
  })

  it('cookie đặt ra đọc lại được đúng token, đúng thuộc tính', async () => {
    const token = await createToken(CU.secret, { accountId: 3 }, 3600)
    const cookie = cookiePhien(token, true)
    const req = new Request('https://example.com/', { headers: { Cookie: `khac=1; ${cookie.split(';')[0]}` } })
    expect(readCookie(req, COOKIE_NAME)).toBe(token)
    expect(cookie).toMatch(/; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800$/)
  })

  it('actorKey theo đúng quy tắc bản cũ', () => {
    expect(actorKey(null)).toBe('anon')
    expect(actorKey({ accountId: 3 })).toBe('acc:3')
    expect(actorKey({ role: 'teacher', id: 5 })).toBe('gv:5')
    expect(actorKey({ role: 'teacher' })).toBe('gv:legacy')
    expect(actorKey({ hocSinhId: 9 })).toBe('hs:9')
    expect(actorKey({ phuId: 2 })).toBe('phu:2')
  })
})
