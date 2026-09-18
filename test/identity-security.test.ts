import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
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

let ipCounter = 10
const resetPassword = (username: string, otp: string, newPassword: string, ip?: string) =>
  goi('/api/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': ip || `198.51.100.${ipCounter++}`,
    },
    body: JSON.stringify({ username, maXacNhan: otp, matKhauMoi: newPassword }),
  })

describe('PRV6 — Identity Recovery & Authentication Security Closure', () => {
  // ── 1. Invariant A: Concurrent Wrong OTP Submissions & 5-Attempt Lockout ──
  it('Invariant A: 10 concurrent wrong OTP submissions -> atomic lockout at 5 attempts, zero lost increments', async () => {
    const adminRes = await dangNhap('qa.v2.admin')
    const adminCookie = layCookie(adminRes)
    await adminRes.body?.cancel()

    // Cấp mã cho qa.v2.thu1
    const codeRes = await resetCode(adminCookie, 'qa.v2.thu1')
    const codeBody = await json(codeRes)
    const validOtp = codeBody.code as string
    expect(validOtp.length).toBe(6)

    // Bắn 10 request đồng thời với OTP sai
    const wrongCodes = ['000001', '000002', '000003', '000004', '000005', '000006', '000007', '000008', '000009', '000010']
    const responses = await Promise.all(
      wrongCodes.map((badCode) => resetPassword('qa.v2.thu1', badCode, 'NewPass!2026')),
    )

    // Đếm status codes
    const statuses = responses.map((r) => r.status)
    const count400 = statuses.filter((s) => s === 400).length
    const count429 = statuses.filter((s) => s === 429).length

    // Tổng số request phải là 10
    expect(count400 + count429).toBe(10)
    // Phải có ít nhất các request bị chặn 429 khi chạm ngưỡng 5
    expect(count429).toBeGreaterThanOrEqual(5)

    // Kiểm tra CSDL D1: token phải có status = 'locked' và attempts >= 5
    const tokenRow = await env.DB.prepare(
      'SELECT attempts, max_attempts, status FROM password_reset_tokens WHERE username = ?1 ORDER BY id DESC LIMIT 1',
    )
      .bind('qa.v2.thu1')
      .first<{ attempts: number; max_attempts: number; status: string }>()

    expect(tokenRow).toBeTruthy()
    expect(tokenRow!.status).toBe('locked')
    expect(tokenRow!.attempts).toBeGreaterThanOrEqual(5)

    // Gửi tiếp với OTP ĐÚNG -> Bắt buộc phải bị từ chối vì token đã bị khóa
    const tryValidAfterLock = await resetPassword('qa.v2.thu1', validOtp, 'NewPass!2026')
    expect(tryValidAfterLock.status).toBeGreaterThanOrEqual(400)

    // Dọn dẹp & khôi phục mật khẩu
    const restoreRes = await resetCode(adminCookie, 'qa.v2.thu1')
    const restoreBody = await json(restoreRes)
    await resetPassword('qa.v2.thu1', restoreBody.code as string, MAT_KHAU)
  })

  // ── 2. Invariant B: Concurrent Valid OTP Submissions (Strict Single-Use) ──
  it('Invariant B: Concurrent valid OTP submissions -> exactly 1 succeeds, 1 fails (atomic single-use)', async () => {
    const adminRes = await dangNhap('qa.v2.admin')
    const adminCookie = layCookie(adminRes)
    await adminRes.body?.cancel()

    // Cấp mã cho qa.v2.thu2
    const codeRes = await resetCode(adminCookie, 'qa.v2.thu2')
    const codeBody = await json(codeRes)
    const validOtp = codeBody.code as string

    // Bắn 2 request ĐỒNG THỜI với CÙNG MÃ ĐÚNG nhưng mật khẩu khác nhau
    const passA = 'WinningPassA!2026'
    const passB = 'LosingPassB!2026'
    const [resA, resB] = await Promise.all([
      resetPassword('qa.v2.thu2', validOtp, passA),
      resetPassword('qa.v2.thu2', validOtp, passB),
    ])

    const statuses = [resA.status, resB.status]
    // Đúng 1 request thành công 200 và 1 request thất bại 400
    expect(statuses).toContain(200)
    expect(statuses).toContain(400)

    // Kiểm tra trong CSDL D1: token phải có status = 'consumed' và consumed_at != null
    const tokenRow = await env.DB.prepare(
      'SELECT status, consumed_at FROM password_reset_tokens WHERE username = ?1 ORDER BY id DESC LIMIT 1',
    )
      .bind('qa.v2.thu2')
      .first<{ status: string; consumed_at: number | null }>()

    expect(tokenRow).toBeTruthy()
    expect(tokenRow!.status).toBe('consumed')
    expect(tokenRow!.consumed_at).toBeTruthy()

    // Thử lại lần thứ 3 với cùng OTP -> phải thất bại 400
    const resThird = await resetPassword('qa.v2.thu2', validOtp, 'ThirdPass!2026')
    expect(resThird.status).toBe(400)

    // Khôi phục mật khẩu gốc cho qa.v2.thu2
    const restoreRes = await resetCode(adminCookie, 'qa.v2.thu2')
    const restoreBody = await json(restoreRes)
    await resetPassword('qa.v2.thu2', restoreBody.code as string, MAT_KHAU)
  })

  // ── 3. ABA Protection: Superceded Token Invalidation ──
  it('ABA Protection: Issuing Token B revokes Token A; delayed Token A cannot mutate Token B', async () => {
    const adminRes = await dangNhap('qa.v2.admin')
    const adminCookie = layCookie(adminRes)
    await adminRes.body?.cancel()

    // 1. Cấp Token A
    const resA = await resetCode(adminCookie, 'qa.v2.thu3')
    const bodyA = await json(resA)
    const otpA = bodyA.code as string

    // 2. Cấp Token B (ghi đè / phát hành lại)
    const resB = await resetCode(adminCookie, 'qa.v2.thu3')
    const bodyB = await json(resB)
    const otpB = bodyB.code as string

    expect(otpA).not.toBe(otpB)

    // Kiểm tra CSDL: Token A phải ở status = 'revoked', Token B ở status = 'active'
    const tokens = await env.DB.prepare(
      'SELECT token_id, status, attempts FROM password_reset_tokens WHERE username = ?1 ORDER BY id ASC',
    )
      .bind('qa.v2.thu3')
      .all<{ token_id: string; status: string; attempts: number }>()

    expect(tokens.results.length).toBeGreaterThanOrEqual(2)
    const tokenA = tokens.results[tokens.results.length - 2]
    const tokenB = tokens.results[tokens.results.length - 1]

    expect(tokenA.status).toBe('revoked')
    expect(tokenB.status).toBe('active')
    expect(tokenB.attempts).toBe(0)

    // 3. Request trễ dùng Token A gửi lên -> BẮT BUỘC PHẢI THẤT BẠI
    const tryA = await resetPassword('qa.v2.thu3', otpA, 'HackedPass!2026')
    expect(tryA.status).toBe(400)

    // 4. Token B vẫn giữ nguyên vẹn: status = 'active' và attempts vẫn là 0
    const tokenBAfter = await env.DB.prepare(
      'SELECT status, attempts FROM password_reset_tokens WHERE token_id = ?1',
    )
      .bind(tokenB.token_id)
      .first<{ status: string; attempts: number }>()

    expect(tokenBAfter!.status).toBe('active')
    expect(tokenBAfter!.attempts).toBe(0)

    // 5. Token B hợp lệ phải reset thành công
    const tryB = await resetPassword('qa.v2.thu3', otpB, MAT_KHAU)
    expect(tryB.status).toBe(200)
  })

  // ── 4. Scope Checks for Token Creation ──
  it('Scope Checks: Teacher and Student boundary enforcement on reset-code', async () => {
    // 4.1. Pending teacher -> 403
    const pendingRes = await dangNhap('qa.v2.gv_pending')
    const pendingCookie = layCookie(pendingRes)
    const resPending = await resetCode(pendingCookie, 'qa.v2.thu1')
    expect(resPending.status).toBe(403)

    // 4.2. Student -> 403
    const stuRes = await dangNhap('qa.v2.thu1')
    const stuCookie = layCookie(stuRes)
    const resStu = await resetCode(stuCookie, 'qa.v2.thu2')
    expect(resStu.status).toBe(403)

    // 4.3. Teacher lớp 1 reset học sinh lớp 2 (ngoài phạm vi phụ trách) -> 403
    const gvRes = await dangNhap('qa.v2.gv')
    const gvCookie = layCookie(gvRes)
    const resOutOfScope = await resetCode(gvCookie, 'qa.v2.thu3') // thu3 thuộc lớp 2
    expect(resOutOfScope.status).toBe(403)

    // 4.4. Teacher reset Teacher -> 403
    const resTeacherOnTeacher = await resetCode(gvCookie, 'qa.v2.gv_pending')
    expect(resTeacherOnTeacher.status).toBe(403)

    // 4.5. Teacher reset School Admin -> 403
    const resTeacherOnAdmin = await resetCode(gvCookie, 'qa.v2.admin')
    expect(resTeacherOnAdmin.status).toBe(403)
  })

  // ── 5. Native Login Burst Limiter Threshold (LOGIN_LIMITER) ──
  it('LOGIN_LIMITER: Triggers HTTP 429 at threshold 10 rapid attempts', async () => {
    const attempts = []
    for (let i = 0; i < 11; i++) {
      attempts.push(
        goi('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '198.51.100.42' },
          body: JSON.stringify({ username: 'qa.v2.login_flood', password: 'wrongpassword' }),
        }),
      )
    }
    const results = await Promise.all(attempts)
    const statuses = results.map((r) => r.status)

    // Các request đầu trả về 401 (hoặc 400 nếu user không tồn tại), request thứ 11 trả về 429
    expect(statuses).toContain(429)
    const res429 = results.find((r) => r.status === 429)
    const body429 = await json(res429!)
    expect(body429.error || body429.loi).toContain('quá nhanh')
  })

  // ── 6. Native Room Admission Burst Limiter Threshold (ADMIT_LIMITER) ──
  it('ADMIT_LIMITER: Triggers HTTP 429 at threshold 10 rapid attempts on room admission', async () => {
    // Đăng nhập học sinh
    const stuRes = await dangNhap('qa.v2.thu1')
    const cookie = layCookie(stuRes)

    // Tạo phòng có mật khẩu trong D1
    const createRoomRes = await env.DB.prepare(`
      INSERT INTO phong (ten, loai, trang_thai, access_mode, mat_khau_hash, mat_khau_salt, suc_chua, chu_phong_khoa, chu_phong_ten, pham_vi, cap_nhat_luc)
      VALUES ('Phòng Test Burst Limit', 'video', 'mo', 'password', 'somehash', 'somesalt', 10, 'chu-phong', 'Chủ phòng', 'truong', CURRENT_TIMESTAMP)
    `).run()
    const roomId = createRoomRes.meta.last_row_id

    // Gửi 11 request liên tiếp thử mật khẩu
    const attempts = []
    for (let i = 0; i < 11; i++) {
      attempts.push(
        goi(`/api/rooms/${roomId}/admit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: cookie },
          body: JSON.stringify({ password: 'wrongroompassword' }),
        }),
      )
    }
    const results = await Promise.all(attempts)
    const statuses = results.map((r) => r.status)

    // Phải kích hoạt HTTP 429 từ native ADMIT_LIMITER
    expect(statuses).toContain(429)
    const res429 = results.find((r) => r.status === 429)
    const body429 = await json(res429!)
    expect(body429.error || body429.loi).toContain('quá nhanh')
  })

  // ── 7. Full Session Revocation After Password Reset ──
  it('Session Revocation: Old HTTP cookie invalidated, old password fails, new password succeeds', async () => {
    const adminRes = await dangNhap('qa.v2.admin')
    const adminCookie = layCookie(adminRes)
    await adminRes.body?.cancel()

    // 1. Học sinh đăng nhập, nhận cookie hợp lệ
    const stuLoginRes = await dangNhap('qa.v2.thu1')
    expect(stuLoginRes.status).toBe(200)
    const oldStudentCookie = layCookie(stuLoginRes)

    // 2. Xác thực phiên cũ đang hoạt động tốt
    const whoamiBefore = await whoami(oldStudentCookie)
    expect(whoamiBefore.status).toBe(200)

    // 3. Admin cấp mã khôi phục cho học sinh
    const codeRes = await resetCode(adminCookie, 'qa.v2.thu1')
    const codeBody = await json(codeRes)
    const otp = codeBody.code as string

    // 4. Học sinh đặt lại mật khẩu mới (dùng IP riêng để tránh đụng limit IP thử nghiệm từ Test 1)
    const NEW_PASSWORD = 'BrandNewPassword!2026'
    const resetRes = await goi('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '198.51.100.99' },
      body: JSON.stringify({ username: 'qa.v2.thu1', maXacNhan: otp, matKhauMoi: NEW_PASSWORD }),
    })
    expect(resetRes.status).toBe(200)

    // 5. Phiên cũ (oldStudentCookie) BẮT BUỘC PHẢI BỊ VÔ HIỆU HOÁ (HTTP 401, biDaRa: true)
    const whoamiAfter = await whoami(oldStudentCookie)
    expect(whoamiAfter.status).toBe(401)
    const whoamiBody = await json(whoamiAfter)
    expect(whoamiBody.biDangXuat).toBe(true)

    // 6. Mật khẩu CŨ đăng nhập phải THẤT BẠI (401)
    const oldLoginTry = await dangNhap('qa.v2.thu1', MAT_KHAU)
    expect(oldLoginTry.status).toBe(401)

    // 7. Mật khẩu MỚI đăng nhập phải THÀNH CÔNG (200)
    const newLoginTry = await dangNhap('qa.v2.thu1', NEW_PASSWORD)
    expect(newLoginTry.status).toBe(200)

    // Khôi phục lại mật khẩu mặc định MAT_KHAU để các file test khác dùng bình thường
    const cleanupCode = await resetCode(adminCookie, 'qa.v2.thu1')
    const cleanupBody = await json(cleanupCode)
    await resetPassword('qa.v2.thu1', cleanupBody.code as string, MAT_KHAU)
  })
})
