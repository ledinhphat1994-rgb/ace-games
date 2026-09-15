/**
 * Signed Admission Credential Security Tests
 *
 * Kiểm thử toàn diện module worker/lib/admission.ts:
 * 1. Token hợp lệ -> xác minh thành công (true)
 * 2. Signature bị chỉnh sửa (tampered) -> từ chối (false)
 * 3. Payload bị chỉnh sửa (tampered) -> từ chối (false)
 * 4. Sai roomId -> từ chối (false)
 * 5. Sai accountId -> từ chối (false)
 * 6. Sai phienId (phiên mới đăng nhập thiết bị khác) -> từ chối (false)
 * 7. Token đã hết hạn (expired) -> từ chối (false)
 * 8. Định dạng Cookie header: HttpOnly, Path=/ws/room/phong-<id>, Max-Age=300, SameSite=Lax
 * 9. Cờ Secure trong môi trường HTTPS (true) và non-HTTPS (false)
 * 10. Đọc cookie đúng tên từ header request
 */
import { describe, expect, it } from 'vitest'
import {
  ADMIT_COOKIE_TTL,
  admitCookieClear,
  admitCookieName,
  admitCookieSet,
  readAdmitCookie,
  signAdmitToken,
  verifyAdmitToken,
} from '../worker/lib/admission'

const SECRET = 'test-admission-secret-key-2026-campus'

describe('Signed Admission Credential Security', () => {
  const baseExpected = {
    roomId: 101,
    accountId: 42,
    phienId: 'sess_abc123xyz',
  }

  // 1. Token hợp lệ → xác minh thành công
  it('1. token hợp lệ được ký đúng secret → verify trả về true', async () => {
    const token = await signAdmitToken(SECRET, baseExpected)
    const ok = await verifyAdmitToken(SECRET, token, baseExpected)
    expect(ok).toBe(true)
  })

  // 2. Chữ ký bị can thiệp (tampered signature) → từ chối
  it('2. chữ ký HMAC bị sửa đổi (tampered signature) → từ chối', async () => {
    const token = await signAdmitToken(SECRET, baseExpected)
    const parts = token.split('.')
    const badSig = parts[1].slice(0, -4) + 'AAAA'
    const tampered = `${parts[0]}.${badSig}`

    const ok = await verifyAdmitToken(SECRET, tampered, baseExpected)
    expect(ok).toBe(false)
  })

  // 3. Payload bị can thiệp (tampered payload) → từ chối
  it('3. payload bị sửa đổi (tampered payload) → từ chối', async () => {
    const token = await signAdmitToken(SECRET, baseExpected)
    const parts = token.split('.')
    // Đổi 1 ký tự trong base64 payload
    const badPayload = (parts[0][0] === 'e' ? 'f' : 'e') + parts[0].slice(1)
    const tampered = `${badPayload}.${parts[1]}`

    const ok = await verifyAdmitToken(SECRET, tampered, baseExpected)
    expect(ok).toBe(false)
  })

  // 4. Sai phòng (wrong room) → từ chối
  it('4. token cấp cho phòng A dùng vào phòng B → từ chối', async () => {
    const token = await signAdmitToken(SECRET, { ...baseExpected, roomId: 101 })
    const ok = await verifyAdmitToken(SECRET, token, { ...baseExpected, roomId: 999 })
    expect(ok).toBe(false)
  })

  // 5. Sai tài khoản (wrong account) → từ chối
  it('5. token cấp cho user A dùng cho user B → từ chối', async () => {
    const token = await signAdmitToken(SECRET, { ...baseExpected, accountId: 42 })
    const ok = await verifyAdmitToken(SECRET, token, { ...baseExpected, accountId: 84 })
    expect(ok).toBe(false)
  })

  // 6. Sai phienId / phiên đăng nhập mới → từ chối
  it('6. token gắn với phiên cũ, đăng nhập phiên mới → từ chối', async () => {
    const token = await signAdmitToken(SECRET, { ...baseExpected, phienId: 'old_session_1' })
    const ok = await verifyAdmitToken(SECRET, token, { ...baseExpected, phienId: 'new_session_2' })
    expect(ok).toBe(false)
  })

  // 7. Token hết hạn (expired) → từ chối (không dùng sleep, chế tạo payload exp quá khứ)
  it('7. token đã hết hạn (exp quá khứ) → từ chối', async () => {
    const enc = new TextEncoder()
    const pastExp = Math.floor(Date.now() / 1000) - 10 // hết hạn 10 giây trước
    const payload = { ...baseExpected, exp: pastExp }

    // Helper b64u
    const b64u = (bytes: Uint8Array) =>
      btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const p = b64u(enc.encode(JSON.stringify(payload)))
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const sigBytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(p)))
    const expiredToken = `${p}.${b64u(sigBytes)}`

    const ok = await verifyAdmitToken(SECRET, expiredToken, baseExpected)
    expect(ok).toBe(false)
  })

  // 8. Định dạng Cookie attributes
  it('8. admitCookieSet có đủ HttpOnly, Path chuẩn, Max-Age, SameSite=Lax', () => {
    const cookieHeader = admitCookieSet(101, 'sample-token', false)
    const name = admitCookieName(101)

    expect(name).toBe('room_admit_101')
    expect(cookieHeader).toContain('room_admit_101=sample-token')
    expect(cookieHeader).toContain('Path=/ws/room/phong-101')
    expect(cookieHeader).toContain('HttpOnly')
    expect(cookieHeader).toContain('SameSite=Lax')
    expect(cookieHeader).toContain(`Max-Age=${ADMIT_COOKIE_TTL}`)
    expect(cookieHeader).not.toContain('Secure')
  })

  // 9. Cờ Secure trong môi trường HTTPS
  it('9. admitCookieSet có cờ Secure khi isHttps = true', () => {
    const cookieHeader = admitCookieSet(101, 'sample-token', true)
    expect(cookieHeader).toContain('; Secure')
  })

  // 10. admitCookieClear xóa cookie với Max-Age=0
  it('10. admitCookieClear xóa cookie với Max-Age=0', () => {
    const clearHeader = admitCookieClear(101, true)
    expect(clearHeader).toContain('room_admit_101=;')
    expect(clearHeader).toContain('Max-Age=0')
    expect(clearHeader).toContain('; Secure')
  })

  // 11. Đọc cookie từ request header
  it('11. readAdmitCookie trích xuất đúng token từ Cookie header', () => {
    const token = 'my.signed.token'
    const req = new Request('https://campus.test/ws/room/phong-101', {
      headers: {
        Cookie: `other_cookie=123; room_admit_101=${encodeURIComponent(token)}; another=abc`,
      },
    })
    const read = readAdmitCookie(req, 101)
    expect(read).toBe(token)

    // Phòng khác không đọc được
    const readOther = readAdmitCookie(req, 999)
    expect(readOther).toBeNull()
  })
})
