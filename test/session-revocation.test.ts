import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'
import { moKetNoi } from './ws'
import type { GoiCampus } from '../shared/protocol/campus'
import type { GoiPhong } from '../shared/protocol/room'
import type { GoiGame } from '../shared/protocol/game'

const goi = (path: string, init?: RequestInit) => exports.default.fetch(`${GOC}${path}`, init)
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

let ipCounter = 300
const resetPassword = (username: string, otp: string, newPassword: string) =>
  goi('/api/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': `198.51.100.${ipCounter++}`,
    },
    body: JSON.stringify({ username, maXacNhan: otp, matKhauMoi: newPassword }),
  })

async function chenPhong(ten: string, chuPhongKhoa = 'acc:1'): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong
       (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten,
        access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', NULL, ?2, 'Host', 'public', 20, 'mo')
     RETURNING id`,
  )
    .bind(ten, chuPhongKhoa)
    .first<{ id: number }>()
  if (!res) throw new Error('Không chèn được phòng vào D1')
  return res.id
}

describe('PRV7 — Transactional Reset Commit & Global Session Revocation Suite', () => {

  // ── 1. D1 Batch Transactional Rollback Fault Injection ──
  it('1. D1 Batch Rollback: Injected failure on token consume aborts entire transaction, leaving password unchanged and token active', async () => {
    const adminRes = await dangNhap('qa.v2.admin')
    const adminCookie = layCookie(adminRes)
    await adminRes.body?.cancel()

    // Cấp mã khôi phục cho qa.v2.thu1
    const codeRes = await resetCode(adminCookie, 'qa.v2.thu1')
    const codeData = await json(codeRes)
    const validOtp = codeData.code as string
    expect(validOtp).toBeTruthy()

    // Cài đặt SQLite Trigger cưỡng chế lỗi ABORT trên statement thứ 2 (UPDATE password_reset_tokens)
    // Sử dụng prepare().run() để không bị tách câu lệnh bởi dấu chấm phẩy bên trong trigger
    await env.DB.prepare(`
      CREATE TRIGGER test_abort_consume
      BEFORE UPDATE ON password_reset_tokens
      WHEN NEW.status = 'consumed'
      BEGIN
        SELECT RAISE(ABORT, 'injected_consume_failure');
      END;
    `).run()

    try {
      // Thực hiện đặt lại mật khẩu với mã hợp lệ
      const resetAttemptRes = await resetPassword('qa.v2.thu1', validOtp, 'NewPassword#ShouldFail_2026')
      // Phải trả về lỗi 500 do transaction batch bị abort
      expect(resetAttemptRes.status).toBe(500)

      // Kiểm tra CSDL D1:
      // A. password_reset_tokens KHÔNG được chuyển thành 'consumed', vẫn là 'active'
      const tokenRow = await env.DB.prepare(
        'SELECT status, attempts FROM password_reset_tokens WHERE username = ?1 AND status = ?2',
      )
        .bind('qa.v2.thu1', 'active')
        .first<{ status: string; attempts: number }>()
      expect(tokenRow).toBeTruthy()
      expect(tokenRow!.status).toBe('active')

      // B. Mật khẩu của tài khoản VẪN LÀ MẬT KHẨU CŨ (Rollback thành công)
      const oldLoginRes = await dangNhap('qa.v2.thu1', MAT_KHAU)
      expect(oldLoginRes.status).toBe(200)
      await oldLoginRes.body?.cancel()

      // C. Mật khẩu mới KHÔNG được chấp nhận
      const newLoginRes = await dangNhap('qa.v2.thu1', 'NewPassword#ShouldFail_2026')
      expect(newLoginRes.status).toBe(401)
      await newLoginRes.body?.cancel()
    } finally {
      // Dọn dẹp trigger kiểm thử
      await env.DB.prepare('DROP TRIGGER IF EXISTS test_abort_consume;').run()
    }

    // Sau khi gỡ trigger, thực hiện lại với OTP đó -> phải thành công hoàn toàn
    const successRes = await resetPassword('qa.v2.thu1', validOtp, 'NewPassword#Success_2026')
    expect(successRes.status).toBe(200)

    // Xác nhận mật khẩu mới đã có hiệu lực
    const verifyNewLogin = await dangNhap('qa.v2.thu1', 'NewPassword#Success_2026')
    expect(verifyNewLogin.status).toBe(200)
    await verifyNewLogin.body?.cancel()

    // Khôi phục lại mật khẩu gốc
    const restoreCodeRes = await resetCode(adminCookie, 'qa.v2.thu1')
    const restoreCodeData = await json(restoreCodeRes)
    await resetPassword('qa.v2.thu1', restoreCodeData.code as string, MAT_KHAU)
  })

  // ── 2. Global WebSocket Session Revocation (Campus + Study Room + Game Room) ──
  it('2. Global Session Revocation: Password reset closes old Campus and Room WebSockets with 4001 and rejects stale commands', async () => {
    const adminRes = await dangNhap('qa.v2.admin')
    const adminCookie = layCookie(adminRes)
    await adminRes.body?.cancel()

    // 1. Học sinh qa.v2.thu2 đăng nhập
    const studentRes = await dangNhap('qa.v2.thu2', MAT_KHAU)
    expect(studentRes.status).toBe(200)
    const studentCookie = layCookie(studentRes)
    await studentRes.body?.cancel()

    // 2. Mở kết nối Campus WebSocket
    const campusConn = await moKetNoi<GoiCampus>('/ws/campus', studentCookie)
    expect(campusConn.status).toBe(101)
    await campusConn.cho('snapshot')

    // 3. Tạo phòng và mở kết nối Study Room WebSocket
    const phongId = await chenPhong('Phòng Học Test 2', 'acc:2')
    const roomConn = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, studentCookie)
    expect(roomConn.status).toBe(101)
    await roomConn.cho('room.snapshot')

    // 4. Mở kết nối Game Room WebSocket (caro-test)
    const gameConn = await moKetNoi<GoiGame>('/ws/game/caro-test', studentCookie)
    expect(gameConn.status).toBe(101)
    await gameConn.cho('game.snapshot')

    // 5. Cấp mã và đổi mật khẩu cho qa.v2.thu2
    const codeRes = await resetCode(adminCookie, 'qa.v2.thu2')
    const codeData = await json(codeRes)
    const resetRes = await resetPassword('qa.v2.thu2', codeData.code as string, 'Prv7#BrandNewPass_2026')
    expect(resetRes.status).toBe(200)

    // 6. Kiểm tra HTTP Session: Cookie cũ trả về 401
    const whoamiOld = await whoami(studentCookie)
    expect(whoamiOld.status).toBe(401)
    const whoamiBody = await json(whoamiOld)
    expect(whoamiBody.biDangXuat).toBe(true)

    // 7. Chờ hoặc xác nhận các WebSocket bị đóng bởi server với mã 4001 (da_dang_nhap_noi_khac)
    const campusClose = await campusConn.choDong(2000)
    expect(campusClose.code).toBe(4001)

    // Thử gửi lệnh từ socket phòng cũ (nếu socket đã đóng lập tức thì bắt lỗi send after close)
    try {
      roomConn.gui({ type: 'room.chat', content: 'Stale message after reset' })
    } catch (e) {
      expect(e).toBeDefined()
    }
    const roomClose = await roomConn.choDong(2000)
    expect(roomClose.code).toBe(4001)

    // Game room socket cũng bị thu hồi bởi server với mã 4001
    try {
      gameConn.gui({ type: 'game.init', gameType: 'caro_15' })
    } catch (e) {
      expect(e).toBeDefined()
    }
    const gameClose = await gameConn.choDong(2000)
    expect(gameClose.code).toBe(4001)

    // 8. Đăng nhập lại với mật khẩu mới -> thành công
    const reLogin = await dangNhap('qa.v2.thu2', 'Prv7#BrandNewPass_2026')
    expect(reLogin.status).toBe(200)
    const newCookie = layCookie(reLogin)
    await reLogin.body?.cancel()

    // Kết nối mới với mật khẩu mới hoạt động bình thường
    const newRoomConn = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, newCookie)
    expect(newRoomConn.status).toBe(101)
    await newRoomConn.cho('room.snapshot')
    newRoomConn.dong()

    // Dọn dẹp & khôi phục mật khẩu gốc
    const restoreCodeRes = await resetCode(adminCookie, 'qa.v2.thu2')
    const restoreCodeData = await json(restoreCodeRes)
    await resetPassword('qa.v2.thu2', restoreCodeData.code as string, MAT_KHAU)
  })

  // ── 3. Session Revocation When Campus Socket Is Absent (Direct Room Connection) ──
  it('3. Direct Room Connection without Campus Socket: Password reset still server-revokes Room socket', async () => {
    const adminRes = await dangNhap('qa.v2.admin')
    const adminCookie = layCookie(adminRes)
    await adminRes.body?.cancel()

    // Học sinh qa.v2.tudo đăng nhập
    const studentRes = await dangNhap('qa.v2.tudo', MAT_KHAU)
    expect(studentRes.status).toBe(200)
    const studentCookie = layCookie(studentRes)
    await studentRes.body?.cancel()

    // Kết nối TRỰC TIẾP vào phòng học (KHÔNG kết nối /ws/campus)
    const phongId = await chenPhong('Phòng Học Test 3', 'acc:3')
    const directRoomConn = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, studentCookie)
    expect(directRoomConn.status).toBe(101)
    await directRoomConn.cho('room.snapshot')

    // Đổi mật khẩu qa.v2.tudo
    const codeRes = await resetCode(adminCookie, 'qa.v2.tudo')
    const codeData = await json(codeRes)
    const resetRes = await resetPassword('qa.v2.tudo', codeData.code as string, 'Prv7#DirectRoomPass_2026')
    expect(resetRes.status).toBe(200)

    // Thử gửi lệnh từ socket cũ -> Phải bị đóng bởi server với mã 4001
    try {
      directRoomConn.gui({ type: 'room.chat', content: 'Unauthorized direct room chat' })
    } catch (e) {
      expect(e).toBeDefined()
    }
    const closeEvt = await directRoomConn.choDong(2000)
    expect(closeEvt.code).toBe(4001)

    // Thử gọi whoami với cookie cũ -> 401
    const whoamiRes = await whoami(studentCookie)
    expect(whoamiRes.status).toBe(401)

    // Khôi phục mật khẩu qa.v2.tudo
    const restoreCodeRes = await resetCode(adminCookie, 'qa.v2.tudo')
    const restoreCodeData = await json(restoreCodeRes)
    await resetPassword('qa.v2.tudo', restoreCodeData.code as string, MAT_KHAU)
  })

  // ── 4. Multi-Room WebSocket Revocation ──
  it('4. Multi-Room: Sockets across multiple rooms are all revoked on password reset', async () => {
    const adminRes = await dangNhap('qa.v2.admin')
    const adminCookie = layCookie(adminRes)
    await adminRes.body?.cancel()

    const studentRes = await dangNhap('qa.v2.thu3', MAT_KHAU)
    expect(studentRes.status).toBe(200)
    const studentCookie = layCookie(studentRes)
    await studentRes.body?.cancel()

    // Mở kết nối ở phong 1 và phong 2
    const p1 = await chenPhong('Phòng Multi 1', 'acc:2')
    const p2 = await chenPhong('Phòng Multi 2', 'acc:2')
    const room1Conn = await moKetNoi<GoiPhong>(`/ws/room/phong-${p1}`, studentCookie)
    expect(room1Conn.status).toBe(101)
    await room1Conn.cho('room.snapshot')

    const room2Conn = await moKetNoi<GoiPhong>(`/ws/room/phong-${p2}`, studentCookie)
    expect(room2Conn.status).toBe(101)
    await room2Conn.cho('room.snapshot')

    // Đổi mật khẩu
    const codeRes = await resetCode(adminCookie, 'qa.v2.thu3')
    const codeData = await json(codeRes)
    const resetRes = await resetPassword('qa.v2.thu3', codeData.code as string, 'Prv7#MultiRoomPass_2026')
    expect(resetRes.status).toBe(200)

    // Cả 2 socket đều bị vô hiệu hoá và đóng với 4001
    try {
      room1Conn.gui({ type: 'room.chat', content: 'Room 1 test' })
    } catch (e) {
      expect(e).toBeDefined()
    }
    const close1 = await room1Conn.choDong(2000)
    expect(close1.code).toBe(4001)

    try {
      room2Conn.gui({ type: 'room.chat', content: 'Room 2 test' })
    } catch (e) {
      expect(e).toBeDefined()
    }
    const close2 = await room2Conn.choDong(2000)
    expect(close2.code).toBe(4001)

    // Khôi phục mật khẩu
    const restoreCodeRes = await resetCode(adminCookie, 'qa.v2.thu3')
    const restoreCodeData = await json(restoreCodeRes)
    await resetPassword('qa.v2.thu3', restoreCodeData.code as string, MAT_KHAU)
  })

  // ── 5. Voice Revocation on Password Reset ──
  it('5. Voice Revocation: Active voice publication is revoked and removed from registry on password reset', async () => {
    const adminRes = await dangNhap('qa.v2.admin')
    const adminCookie = layCookie(adminRes)
    await adminRes.body?.cancel()

    // 1. Học sinh qa.v2.thu1 đăng nhập
    const studentRes = await dangNhap('qa.v2.thu1', MAT_KHAU)
    expect(studentRes.status).toBe(200)
    const studentCookie = layCookie(studentRes)
    await studentRes.body?.cancel()

    // 2. Tạo phòng và kết nối WS
    const phongId = await chenPhong('Phòng Học Voice Revoke', 'acc:1')
    const roomConn = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, studentCookie)
    expect(roomConn.status).toBe(101)
    await roomConn.cho('room.snapshot')

    // 3. Đăng ký Voice publication trong RoomDO
    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.bindVoiceSession('sess_voice_prv7', 'acc:1', 1)
    const pubResult = await roomStub.registerVoicePublication({
      actorKey: 'acc:1',
      ten: 'QA Thử nghiệm 1',
      audioTrackId: 'track_voice_prv7',
      sessionId: 'sess_voice_prv7',
      generation: 1,
      status: 'live',
    })
    expect(pubResult.ok).toBe(true)
    expect(await roomStub.getVoiceParticipant('acc:1')).not.toBeNull()

    // 4. Admin cấp mã và học sinh reset mật khẩu
    const codeRes = await resetCode(adminCookie, 'qa.v2.thu1')
    const codeData = await json(codeRes)
    const resetRes = await resetPassword('qa.v2.thu1', codeData.code as string, 'Prv7#VoiceRevokePass_2026')
    expect(resetRes.status).toBe(200)

    // 5. Xác nhận WebSocket bị đóng bởi server với mã 4001
    const closeEvt = await roomConn.choDong(2000)
    expect(closeEvt.code).toBe(4001)

    // 6. Xác nhận Voice publication trong registry đã bị xóa sạch (revoked)
    expect(await roomStub.getVoiceParticipant('acc:1')).toBeNull()

    // 7. Thử gọi publish voice bằng session cũ -> Bị từ chối 401
    const stalePublishRes = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        sessionId: 'sess_voice_prv7',
        trackName: 'mic_track_stale',
        generation: 1,
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })
    expect(stalePublishRes.status).toBe(401)

    // 8. Khôi phục mật khẩu qa.v2.thu1
    const restoreCodeRes = await resetCode(adminCookie, 'qa.v2.thu1')
    const restoreCodeData = await json(restoreCodeRes)
    await resetPassword('qa.v2.thu1', restoreCodeData.code as string, MAT_KHAU)
  })
})
