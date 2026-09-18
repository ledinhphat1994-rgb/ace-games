/**
 * Auth Security Regression Tests (tests A–Q from spec)
 *
 * Bảo vệ các luồng auth nhạy cảm khỏi regression:
 * - Phân quyền reset-code (giáo viên đang chờ duyệt, học sinh, cross-class)
 * - Bảo vệ target (không reset giáo viên/admin qua API học sinh)
 * - OTP: không lộ plaintext, single-use, 5 lần sai vô hiệu hoá
 * - Sau đổi mật khẩu: phiên cũ → 401, mật khẩu cũ → 401, mật khẩu mới → OK
 * - Tài khoản mới: lop_id vẫn là NULL
 */
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { bamMatKhau, DEFAULT_ITERATIONS, taoSalt } from '../worker/lib/passwords'
import { GOC, MAT_KHAU } from './fixtures'

const app = exports.default
const goi = (path: string, init?: RequestInit) => app.fetch(`${GOC}${path}`, init)
const json = async (res: Response) => (await res.json()) as Record<string, unknown>
const layCookie = (res: Response) => (res.headers.get('Set-Cookie') ?? '').split(';')[0]

const dangNhap = (username: string, password = MAT_KHAU) =>
  goi('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

const whoami = (cookie: string) =>
  goi('/api/whoami', { headers: { Cookie: cookie } })

const resetCode = (cookie: string, hocSinhUsername: string) =>
  goi('/api/admin/reset-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ username: hocSinhUsername }),
  })

const resetPassword = (username: string, otp: string, newPassword: string) =>
  goi('/api/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, maXacNhan: otp, matKhauMoi: newPassword }),
  })

describe('Auth Security Regression', () => {
  // ── A: Giáo viên đang chờ duyệt → reset-code 403 ──
  it('A: giáo viên pending → reset-code 403', async () => {
    // qa.v2.gv_pending là giáo viên có teacherPending = true trong fixture
    const res1 = await dangNhap('qa.v2.gv_pending')
    expect(res1.status).toBe(200)
    const cookie = layCookie(res1)
    await res1.body?.cancel()

    const res = await resetCode(cookie, 'qa.v2.thu1')
    expect(res.status).toBe(403)
  })

  // ── B: Học sinh → reset-code 403 ──
  it('B: học sinh không thể gọi reset-code', async () => {
    const res1 = await dangNhap('qa.v2.thu1')
    const cookie = layCookie(res1)
    await res1.body?.cancel()

    const res = await resetCode(cookie, 'qa.v2.thu2')
    expect(res.status).toBe(403)
  })

  // ── C: GVCN lớp A → học sinh lớp A → cho phép ──
  it('C: GVCN lớp 1 → học sinh lớp 1 → reset-code thành công', async () => {
    const res1 = await dangNhap('qa.v2.gv')
    const cookie = layCookie(res1)
    await res1.body?.cancel()

    const res = await resetCode(cookie, 'qa.v2.thu1')
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.ok).toBe(true)
    // OTP là chuỗi 6 chữ số
    expect(typeof body.code).toBe('string')
    expect((body.code as string).length).toBe(6)
  })

  // ── D: GVCN lớp A → học sinh lớp B → bị từ chối ──
  it('D: GVCN lớp 1 → học sinh lớp 2 → 403', async () => {
    const res1 = await dangNhap('qa.v2.gv')
    const cookie = layCookie(res1)
    await res1.body?.cancel()

    const res = await resetCode(cookie, 'qa.v2.thu3')
    expect(res.status).toBe(403)
  })

  // ── E: Teacher là target → reset bị từ chối ──
  it('E: không thể reset mật khẩu giáo viên qua reset-code', async () => {
    const res1 = await dangNhap('qa.v2.admin')
    const cookie = layCookie(res1)
    await res1.body?.cancel()

    const res = await resetCode(cookie, 'qa.v2.gv')
    expect(res.status).toBe(403)
  })

  // ── F: School Admin là target → reset bị từ chối ──
  it('F: không thể reset mật khẩu admin qua reset-code', async () => {
    const res1 = await dangNhap('qa.v2.admin')
    const cookie = layCookie(res1)
    await res1.body?.cancel()

    const res = await resetCode(cookie, 'qa.v2.admin')
    expect(res.status).toBe(403)
  })

  // ── G: School Admin → học sinh → được phép ──
  it('G: admin trường → học sinh → reset-code thành công', async () => {
    const res1 = await dangNhap('qa.v2.admin')
    const cookie = layCookie(res1)
    await res1.body?.cancel()

    const res = await resetCode(cookie, 'qa.v2.thu2')
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.ok).toBe(true)
    expect(typeof body.code).toBe('string')
    expect((body.code as string).length).toBe(6)
  })

  // ── H: OTP không chứa plaintext trong DB / KV ──
  it('H: OTP record trong DB / KV không chứa plaintext OTP', async () => {
    const res1 = await dangNhap('qa.v2.admin')
    const cookie = layCookie(res1)
    await res1.body?.cancel()

    const res = await resetCode(cookie, 'qa.v2.thu1')
    const body = await json(res)
    expect(res.status).toBe(200)

    // API trả về mã 6 số để admin đọc cho học sinh
    const plainOtp = body.code as string
    expect(plainOtp.length).toBe(6)

    // Record lưu trữ trong CSDL tuyệt đối không chứa plaintext OTP (phải băm HMAC)
    const tokenRow = await env.DB.prepare('SELECT code_digest FROM password_reset_tokens WHERE username = ?1 AND status = ?2')
      .bind('qa.v2.thu1', 'active').first<{ code_digest: string }>()
    expect(tokenRow).toBeTruthy()
    expect(tokenRow!.code_digest).not.toContain(plainOtp)

    // Dùng OTP hợp lệ để reset → phải thành công (chứng minh OTP băm đúng)
    const NEW_PW = 'TestNewPw!2026'
    const resReset = await resetPassword('qa.v2.thu1', plainOtp, NEW_PW)
    expect(resReset.status).toBe(200)

    // Khôi phục mật khẩu về MAT_KHAU
    const res2 = await dangNhap('qa.v2.admin')
    const c2 = layCookie(res2)
    await res2.body?.cancel()
    const resCode2 = await resetCode(c2, 'qa.v2.thu1')
    const b2 = await json(resCode2)
    const otp2 = b2.code as string
    await resetPassword('qa.v2.thu1', otp2, MAT_KHAU)
  })

  // ── I: OTP single-use ──
  it('I: OTP chỉ dùng được 1 lần — lần 2 → 400/401', async () => {
    const res1 = await dangNhap('qa.v2.admin')
    const cookie = layCookie(res1)
    await res1.body?.cancel()

    const resCode = await resetCode(cookie, 'qa.v2.thu2')
    const body = await json(resCode)
    const otp = body.code as string

    // Lần 1 — thành công
    const NEW_PW = 'TestSingleUse!2026'
    const resFirst = await resetPassword('qa.v2.thu2', otp, NEW_PW)
    expect(resFirst.status).toBe(200)

    // Lần 2 — cùng OTP → phải thất bại
    const resSecond = await resetPassword('qa.v2.thu2', otp, 'AnothPw!2026')
    expect(resSecond.status).toBeGreaterThanOrEqual(400)

    // Khôi phục
    const res2 = await dangNhap('qa.v2.admin')
    const c2 = layCookie(res2)
    await res2.body?.cancel()
    const resCode2 = await resetCode(c2, 'qa.v2.thu2')
    const b2 = await json(resCode2)
    await resetPassword('qa.v2.thu2', b2.code as string, MAT_KHAU)
  })

  // ── J: Wrong attempt KHÔNG extend absolute expiry ──
  it('J: nhập sai OTP không extend thời hạn tuyệt đối', async () => {
    const res1 = await dangNhap('qa.v2.admin')
    const cookie = layCookie(res1)
    await res1.body?.cancel()

    const resCode = await resetCode(cookie, 'qa.v2.thu1')
    const body = await json(resCode)
    const otp = body.code as string

    // Đọc record ban đầu từ CSDL D1
    const tokenBefore = await env.DB.prepare('SELECT attempts, expires_at FROM password_reset_tokens WHERE username = ?1 AND status = ?2')
      .bind('qa.v2.thu1', 'active').first<{ attempts: number; expires_at: number }>()
    expect(tokenBefore).toBeTruthy()

    // Nhập sai 1 lần với OTP sai và mật khẩu đúng độ dài
    const resBad = await resetPassword('qa.v2.thu1', '999999', MAT_KHAU)
    expect(resBad.status).toBeGreaterThanOrEqual(400)

    // Đọc lại record từ CSDL D1: expires_at tuyệt đối không đổi; attempts tăng 1
    const tokenAfter = await env.DB.prepare('SELECT attempts, expires_at FROM password_reset_tokens WHERE username = ?1 AND status = ?2')
      .bind('qa.v2.thu1', 'active').first<{ attempts: number; expires_at: number }>()
    expect(tokenAfter).toBeTruthy()
    expect(tokenAfter!.attempts).toBe(1)
    expect(tokenAfter!.expires_at).toBe(tokenBefore!.expires_at)

    // OTP đúng vẫn phải dùng được (sai 1 lần chưa hết hạn)
    const resGood = await resetPassword('qa.v2.thu1', otp, MAT_KHAU)
    expect(resGood.status).toBe(200)
  })

  // ── K: 5 lần sai → OTP vô hiệu hoá ──
  it('K: 5 lần sai OTP → OTP bị vô hiệu hoá', async () => {
    const res1 = await dangNhap('qa.v2.admin')
    const cookie = layCookie(res1)
    await res1.body?.cancel()

    const resCode = await resetCode(cookie, 'qa.v2.tudo')
    const body = await json(resCode)
    const otp = body.code as string

    // Sai 5 lần
    for (let i = 0; i < 5; i++) {
      await resetPassword('qa.v2.tudo', '99999' + i, MAT_KHAU)
    }

    // Lần đúng bây giờ phải thất bại (OTP đã bị khoá)
    const resOk = await resetPassword('qa.v2.tudo', otp, MAT_KHAU)
    expect(resOk.status).toBeGreaterThanOrEqual(400)

    // Khôi phục qua admin issue mới
    const res2 = await dangNhap('qa.v2.admin')
    const c2 = layCookie(res2)
    await res2.body?.cancel()
    const resCode2 = await resetCode(c2, 'qa.v2.tudo')
    const b2 = await json(resCode2)
    await resetPassword('qa.v2.tudo', b2.code as string, MAT_KHAU)
  })

  // ── L+M+N+O+P: Toàn bộ lifecycle đổi mật khẩu ──
  it('L-P: đổi mật khẩu → phiên cũ 401 → mật khẩu cũ thất bại → mật khẩu mới OK', async () => {
    // L: đăng nhập, lấy phiên cũ
    const resOld = await dangNhap('qa.v2.thu1')
    const oldCookie = layCookie(resOld)
    await resOld.body?.cancel()

    // Phiên cũ đang hợp lệ
    expect((await whoami(oldCookie)).status).toBe(200)

    // M: lấy OTP → reset password
    const resAdmin = await dangNhap('qa.v2.admin')
    const adminCookie = layCookie(resAdmin)
    await resAdmin.body?.cancel()

    const resCode = await resetCode(adminCookie, 'qa.v2.thu1')
    const { code: otp } = await json(resCode)

    const NEW_PW = 'NewSecure@2026Test'
    const resReset = await resetPassword('qa.v2.thu1', otp as string, NEW_PW)
    expect(resReset.status).toBe(200)

    // N: phiên cũ → 401 (session invalidated after password change)
    const resOldCheck = await whoami(oldCookie)
    expect(resOldCheck.status).toBe(401)

    // O: mật khẩu cũ → đăng nhập thất bại
    const resOldPw = await dangNhap('qa.v2.thu1', MAT_KHAU)
    expect(resOldPw.status).toBe(401)

    // P: mật khẩu mới → đăng nhập thành công
    const resNewPw = await dangNhap('qa.v2.thu1', NEW_PW)
    expect(resNewPw.status).toBe(200)
    await resNewPw.body?.cancel()

    // Khôi phục
    const resAdmin2 = await dangNhap('qa.v2.admin')
    const ac2 = layCookie(resAdmin2)
    await resAdmin2.body?.cancel()
    const rc2 = await resetCode(ac2, 'qa.v2.thu1')
    const b2 = await json(rc2)
    await resetPassword('qa.v2.thu1', b2.code as string, MAT_KHAU)
  })

  // ── Q: Tài khoản mới Campus → lop_id là NULL ──
  it('Q: tài khoản mới tạo qua /api/register → lop_id = null', async () => {
    const randUser = `qa.new.${Date.now().toString(36)}`
    const res = await goi('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: randUser,
        password: MAT_KHAU,
        tenHienThi: 'QA New Account Test',
      }),
    })
    // Đăng ký thành công
    expect(res.status).toBe(200)

    // 1. Kiểm tra trực tiếp bảng D1: lop_id BẮT BUỘC là NULL
    const d1Row = await env.DB.prepare('SELECT lop_id FROM tai_khoan_campus WHERE ten_dang_nhap = ?1')
      .bind(randUser)
      .first<{ lop_id: number | null }>()
    expect(d1Row).not.toBeNull()
    expect(d1Row!.lop_id).toBeNull()

    // 2. Đăng nhập và kiểm tra whoami: lopId BẮT BUỘC là null
    const logRes = await dangNhap(randUser)
    expect(logRes.status).toBe(200)
    const cookie = layCookie(logRes)
    await logRes.body?.cancel()

    const whoRes = await whoami(cookie)
    expect(whoRes.status).toBe(200)
    const whoBody = await json(whoRes)
    expect(whoBody.lopId).toBeNull()
  })

  // ── R: Opportunistic password upgrade (iterations < 100k → nâng cấp 100k) ──
  it('R: tài khoản cũ có iterations < 100k → đăng nhập thành công và được tự động nâng cấp lên 100k', async () => {
    const userLow = `qa.low.${Date.now().toString(36)}`
    const oldSalt = taoSalt()
    const oldIters = 50000
    const oldHash = await bamMatKhau(MAT_KHAU, oldSalt, oldIters)

    await env.DB.prepare(
      `INSERT INTO tai_khoan_campus
         (ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, lop_id, la_admin_truong, dang_hoat_dong)
       VALUES (?1, 'Low Iter User', ?2, ?3, ?4, 'student', 0, NULL, 0, 1)`,
    )
      .bind(userLow, oldHash, oldSalt, oldIters)
      .run()

    // 1. Đăng nhập thành công với mật khẩu thật
    const logRes = await dangNhap(userLow, MAT_KHAU)
    expect(logRes.status).toBe(200)
    await logRes.body?.cancel()

    // 2. Kiểm tra bản ghi D1: iterations đã được nâng cấp lên DEFAULT_ITERATIONS (100000), salt/hash đã đổi mới
    const row = await env.DB.prepare('SELECT mat_khau_hash, salt, iterations FROM tai_khoan_campus WHERE ten_dang_nhap = ?1')
      .bind(userLow)
      .first<{ mat_khau_hash: string; salt: string; iterations: number }>()

    expect(row).not.toBeNull()
    expect(row!.iterations).toBe(DEFAULT_ITERATIONS)
    expect(row!.salt).not.toBe(oldSalt)
    expect(row!.mat_khau_hash).not.toBe(oldHash)

    // 3. Đăng nhập lại tiếp tục thành công với hash mới 100k
    const logRes2 = await dangNhap(userLow, MAT_KHAU)
    expect(logRes2.status).toBe(200)
    await logRes2.body?.cancel()
  })

  // ── S: Tài khoản có work factor cao hơn (>= 100k) KHÔNG bị hạ cấp ──
  it('S: tài khoản có iterations >= 100k (ví dụ 120k) KHÔNG bị hạ cấp khi đăng nhập', async () => {
    const userHigh = `qa.high.${Date.now().toString(36)}`
    const highSalt = taoSalt()
    const highIters = 120000
    const highHash = await bamMatKhau(MAT_KHAU, highSalt, highIters)

    await env.DB.prepare(
      `INSERT INTO tai_khoan_campus
         (ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, lop_id, la_admin_truong, dang_hoat_dong)
       VALUES (?1, 'High Iter User', ?2, ?3, ?4, 'student', 0, NULL, 0, 1)`,
    )
      .bind(userHigh, highHash, highSalt, highIters)
      .run()

    const logRes = await dangNhap(userHigh, MAT_KHAU)
    expect(logRes.status).toBe(200)
    await logRes.body?.cancel()

    const row = await env.DB.prepare('SELECT mat_khau_hash, salt, iterations FROM tai_khoan_campus WHERE ten_dang_nhap = ?1')
      .bind(userHigh)
      .first<{ mat_khau_hash: string; salt: string; iterations: number }>()

    expect(row).not.toBeNull()
    expect(row!.iterations).toBe(120000)
    expect(row!.salt).toBe(highSalt)
    expect(row!.mat_khau_hash).toBe(highHash)
  })

  // ── T: Tài khoản mới tạo qua /api/register sử dụng đúng DEFAULT_ITERATIONS = 100k ──
  it('T: tài khoản mới tạo qua /api/register sử dụng đúng DEFAULT_ITERATIONS (100k)', async () => {
    const newUser = `qa.reg.${Date.now().toString(36)}`
    const regRes = await goi('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: newUser,
        password: MAT_KHAU,
        tenHienThi: 'Reg User Test',
      }),
    })
    expect(regRes.status).toBe(200)

    const row = await env.DB.prepare('SELECT iterations FROM tai_khoan_campus WHERE ten_dang_nhap = ?1')
      .bind(newUser)
      .first<{ iterations: number }>()
    expect(row).not.toBeNull()
    expect(row!.iterations).toBe(DEFAULT_ITERATIONS)
  })
})
