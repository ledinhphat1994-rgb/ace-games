import { env, exports } from 'cloudflare:workers'
import { evictDurableObject } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'
import { moKetNoi } from './ws'
import { setCloudflareRealtimeFetchForTesting } from '../worker/routes/voice-api'
import { CampusDO } from '../worker/campus/campus-do'
import { TEN_CAMPUS } from '../worker/campus/danh-tinh'
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

  // ── 6. Adversarial Tier-2 Fail-Closed Session Validation under RPC & D1 Failure ──
  it('6. Tier-2 Fail-Closed: Stale socket mutation rejected & socket closed 4001 when proactive RPC failed', async () => {
    // 1. Học sinh đăng nhập
    const studentRes = await dangNhap('qa.v2.thu3', MAT_KHAU)
    expect(studentRes.status).toBe(200)
    const studentCookie = layCookie(studentRes)
    await studentRes.body?.cancel()

    // 2. Mở kết nối Room WebSocket
    const phongId = await chenPhong('Phòng Test Stale Mutation', 'acc:3')
    const roomConn = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, studentCookie)
    expect(roomConn.status).toBe(101)
    await roomConn.cho('room.snapshot')

    // 3. Giả lập: Mật khẩu được đổi và marker thiet_bi mới được ghi bền vững vào D1,
    // nhưng proactive RPC CampusDO -> RoomDO bị đứt (hoặc chưa chạy).
    const markerMoi = `dev_adversarial_${Date.now()}`
    await env.DB.prepare('UPDATE tai_khoan_campus SET thiet_bi = ?1 WHERE ten_dang_nhap = ?2')
      .bind(markerMoi, 'qa.v2.thu3')
      .run()

    // 4. Socket cũ lập tức gửi lệnh thay đổi trạng thái (state mutation: room.chat)
    roomConn.gui({ type: 'room.chat', content: 'Tin nhắn độc hại từ stale socket' })

    // 5. Kết quả bắt buộc: Lệnh không được thi hành, socket bị đóng với mã 4001
    const closeEvt = await roomConn.choDong(2000)
    expect(closeEvt.code).toBe(4001)

    // 6. Kiểm tra trạng thái thực tế của RoomDO: KHÔNG có tin nhắn nào được lưu!
    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    const chatHistory = await (roomStub as any).layChat()
    const foundAdversarial = chatHistory.some((m: any) => m.text === 'Tin nhắn độc hại từ stale socket')
    expect(foundAdversarial).toBe(false)

    // ── Kịch bản 2: Khi tra cứu D1 xác thực phiên gặp row không hợp lệ (null/deleted marker) ──
    // Đăng nhập lại để có phiên hợp lệ
    const reLoginRes = await dangNhap('qa.v2.thu3', MAT_KHAU)
    const newCookie = layCookie(reLoginRes)
    await reLoginRes.body?.cancel()

    const roomConn2 = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, newCookie)
    expect(roomConn2.status).toBe(101)
    await roomConn2.cho('room.snapshot')

    // Cố ý set thiet_bi = NULL trong D1 (mô phỏng tài khoản bị thu hồi toàn diện trong D1)
    await env.DB.prepare('UPDATE tai_khoan_campus SET thiet_bi = NULL WHERE ten_dang_nhap = ?1')
      .bind('qa.v2.thu3')
      .run()

    roomConn2.gui({ type: 'room.chat', content: 'Tin nhắn khi session marker bị null' })
    const closeEvt2 = await roomConn2.choDong(2000)
    expect(closeEvt2.code).toBe(4001)

    const chatHistory2 = await (roomStub as any).layChat()
    expect(chatHistory2.some((m: any) => m.text === 'Tin nhắn khi session marker bị null')).toBe(false)
  })

  // ── 7. Durable Voice Revocation with Injected SFU Failure & Restart Durability ──
  it('7. Durable Voice Revocation: Failed SFU close retains durable metadata, survives DO restart, and clears on retry', async () => {
    ;(env as any).CLOUDFLARE_REALTIME_APP_ID = 'test-app-id'
    ;(env as any).CLOUDFLARE_REALTIME_APP_SECRET = 'test-secret'

    const studentRes = await dangNhap('qa.v2.thu1', MAT_KHAU)
    const studentCookie = layCookie(studentRes)
    await studentRes.body?.cancel()

    const phongId = await chenPhong('Phòng Test Voice Retry Durability', 'acc:1')
    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))

    // Kết nối WS
    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, studentCookie)
    await ws.cho('room.snapshot')

    // Thiết lập session và publication
    await (roomStub as any).bindVoiceSession('sess_fail_retry_1', 'acc:1', 1)
    await (roomStub as any).registerVoicePublication({
      actorKey: 'acc:1',
      ten: 'QA Thử nghiệm 1',
      audioTrackId: 'track_fail_1',
      mid: 'mid_0',
      sessionId: 'sess_fail_retry_1',
      generation: 1,
      status: 'live',
    })

    expect(await (roomStub as any).getVoiceParticipant('acc:1')).not.toBeNull()

    // Cài đặt mock SFU: Lần đóng đầu tiên trả về HTTP 502 / lỗi mạng
    let sfuCloseAttempts = 0
    setCloudflareRealtimeFetchForTesting(async (url) => {
      if (url.includes('/tracks/close')) {
        sfuCloseAttempts++
        if (sfuCloseAttempts === 1) {
          return new Response(JSON.stringify({ error: 'SFU Gateway Timeout' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })

    try {
      // Gọi thu hồi voice cho actor
      await (roomStub as any).revokeVoiceForActor('acc:1')

      // 1. Quyền hạn địa phương (local authority) biến mất NGAY LẬP TỨC
      expect(await (roomStub as any).getVoiceParticipant('acc:1')).toBeNull()

      // 2. Metadata thu hồi từ xa được lưu BỀN VỮNG trong SQLite do lần 1 thất bại
      let pendingList = await (roomStub as any).getPendingVoiceRevocations()
      expect(pendingList.length).toBe(1)
      expect(pendingList[0].actorKey).toBe('acc:1')
      expect(pendingList[0].sessionId).toBe('sess_fail_retry_1')
      expect(pendingList[0].mid).toBe('mid_0')

      // 3. Giả lập RoomDO bị evict / restart
      await evictDurableObject(roomStub)

      // Sau khi restart, metadata pending vẫn còn nguyên trong SQLite
      const reloadedStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
      pendingList = await (reloadedStub as any).getPendingVoiceRevocations()
      expect(pendingList.length).toBe(1)
      expect(pendingList[0].actorKey).toBe('acc:1')

      // 4. Thực hiện retry (lần 2 SFU trả về 200)
      const cleared = await (reloadedStub as any).retryPendingVoiceRevocations()
      expect(cleared).toBe(1)

      // 5. Metadata pending đã được dọn sạch sau khi retry thành công
      const emptyPending = await (reloadedStub as any).getPendingVoiceRevocations()
      expect(emptyPending.length).toBe(0)
    } finally {
      setCloudflareRealtimeFetchForTesting(null)
      delete (env as any).CLOUDFLARE_REALTIME_APP_ID
      delete (env as any).CLOUDFLARE_REALTIME_APP_SECRET
      ws.dong()
    }
  })

  // ── 8. Injected Thrown Exception on SFU close: retains pending row & alarm, survives DO restart, clears on recovery ──
  it('8. Thrown Network Exception on SFU close: retains durable metadata, schedules alarm, survives DO restart, and clears on 200 OK', async () => {
    ;(env as any).CLOUDFLARE_REALTIME_APP_ID = 'test-app-id'
    ;(env as any).CLOUDFLARE_REALTIME_APP_SECRET = 'test-secret'

    const studentRes = await dangNhap('qa.v2.thu1', MAT_KHAU)
    const studentCookie = layCookie(studentRes)
    await studentRes.body?.cancel()

    const phongId = await chenPhong('Phòng Test Thrown Exception Durability', 'acc:1')
    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))

    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, studentCookie)
    await ws.cho('room.snapshot')

    await (roomStub as any).bindVoiceSession('sess_throw_test_1', 'acc:1', 1)
    await (roomStub as any).registerVoicePublication({
      actorKey: 'acc:1',
      ten: 'QA Thử nghiệm 1',
      audioTrackId: 'track_throw_1',
      mid: 'mid_throw_0',
      sessionId: 'sess_throw_test_1',
      generation: 1,
      status: 'live',
    })

    expect(await (roomStub as any).getVoiceParticipant('acc:1')).not.toBeNull()

    // Cài đặt mock SFU: Ném ngoại lệ mạng (thrown network failure)
    let sfuCalls = 0
    setCloudflareRealtimeFetchForTesting(async (url) => {
      if (url.includes('/tracks/close')) {
        sfuCalls++
        if (sfuCalls === 1) {
          throw new Error('INJECTED_NETWORK_FAILURE')
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })

    try {
      await (roomStub as any).revokeVoiceForActor('acc:1')

      // 1. Local authority bị thu hồi ngay lập tức
      expect(await (roomStub as any).getVoiceParticipant('acc:1')).toBeNull()

      // 2. Pending metadata tồn tại và lưu thông tin ngoại lệ mạng
      let pendingList = await (roomStub as any).getPendingVoiceRevocations()
      expect(pendingList.length).toBe(1)
      expect(pendingList[0].actorKey).toBe('acc:1')
      expect(pendingList[0].sessionId).toBe('sess_throw_test_1')
      expect(pendingList[0].errorText).toContain('INJECTED_NETWORK_FAILURE')

      // 3. Alarm ĐÃ ĐƯỢC LÊN LỊCH chủ động (Fix PRV8.1 gap: thrown exception must schedule alarm)
      const alarmTime = await (roomStub as any).getVoiceRevocationAlarmTime()
      expect(alarmTime).not.toBeNull()
      expect(alarmTime!).toBeGreaterThan(Date.now() - 100)

      // 4. DO restart / eviction
      await evictDurableObject(roomStub)

      const reloadedStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
      pendingList = await (reloadedStub as any).getPendingVoiceRevocations()
      expect(pendingList.length).toBe(1)
      expect(pendingList[0].actorKey).toBe('acc:1')

      // 5. Retry thành công khi SFU hồi phục (trả về 200)
      const cleared = await (reloadedStub as any).retryPendingVoiceRevocations()
      expect(cleared).toBe(1)

      // 6. Pending row chỉ bị xóa sau khi xác nhận authoritative 200 OK
      const emptyPending = await (reloadedStub as any).getPendingVoiceRevocations()
      expect(emptyPending.length).toBe(0)
    } finally {
      setCloudflareRealtimeFetchForTesting(null)
      delete (env as any).CLOUDFLARE_REALTIME_APP_ID
      delete (env as any).CLOUDFLARE_REALTIME_APP_SECRET
      ws.dong()
    }
  })

  // ── 9. Retry-Exhaustion Beyond 5 Attempts: Metadata retained, capped backoff, stale cannot republish ──
  it('9. Retry-Exhaustion (>5 failures): Metadata retained, alarm scheduled with capped backoff, stale session blocked, clears on recovery', async () => {
    ;(env as any).CLOUDFLARE_REALTIME_APP_ID = 'test-app-id'
    ;(env as any).CLOUDFLARE_REALTIME_APP_SECRET = 'test-secret'

    const studentRes = await dangNhap('qa.v2.thu1', MAT_KHAU)
    const studentCookie = layCookie(studentRes)
    await studentRes.body?.cancel()

    const phongId = await chenPhong('Phòng Test Retry Exhaustion', 'acc:1')
    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))

    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, studentCookie)
    await ws.cho('room.snapshot')

    await (roomStub as any).bindVoiceSession('sess_exhaust_test_1', 'acc:1', 1)
    await (roomStub as any).registerVoicePublication({
      actorKey: 'acc:1',
      ten: 'QA Thử nghiệm 1',
      audioTrackId: 'track_exhaust_1',
      mid: 'mid_exhaust_0',
      sessionId: 'sess_exhaust_test_1',
      generation: 1,
      status: 'live',
    })

    // Mock SFU: 6 lần gọi đầu tiên đều thất bại (HTTP 502 / throw)
    let sfuAttempts = 0
    setCloudflareRealtimeFetchForTesting(async (url) => {
      if (url.includes('/tracks/close')) {
        sfuAttempts++
        if (sfuAttempts <= 6) {
          if (sfuAttempts % 2 === 0) {
            throw new Error(`INJECTED_SFU_FAIL_${sfuAttempts}`)
          }
          return new Response(JSON.stringify({ error: `Transient failure ${sfuAttempts}` }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })

    try {
      // 1. Initial revoke -> attempt 1 fails
      await (roomStub as any).revokeVoiceForActor('acc:1')

      // 2. Chạy tiếp 5 lần retry thủ công mô phỏng 5 lần alarm tiếp nối
      for (let i = 2; i <= 6; i++) {
        await (roomStub as any).retryPendingVoiceRevocations()
      }

      // Xác nhận đã qua 6 lần thất bại
      expect(sfuAttempts).toBe(6)

      // 3. INVARIANT CHECK: pending_voice_revocations KHÔNG ĐƯỢC BỊ XÓA khi attempts >= 5!
      const pendingList = await (roomStub as any).getPendingVoiceRevocations()
      expect(pendingList.length).toBe(1)
      expect(pendingList[0].actorKey).toBe('acc:1')
      expect(pendingList[0].attempts).toBeGreaterThanOrEqual(6)

      // 4. Alarm vẫn được lên lịch theo capped backoff (<= 60s)
      const alarmTime = await (roomStub as any).getVoiceRevocationAlarmTime()
      expect(alarmTime).not.toBeNull()
      expect(alarmTime!).toBeGreaterThan(Date.now() - 100)

      // 5. Stale session KHÔNG thể đăng ký lại voice publication
      const stalePubRes = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
        body: JSON.stringify({
          sessionId: 'sess_exhaust_test_1',
          trackName: 'mic_stale_repub',
          mid: 'mid_stale_repub',
          generation: 1,
          sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
        }),
      })
      // Stale publication bị chặn (401/403/502)
      expect(stalePubRes.ok).toBe(false)
      expect([401, 403, 502]).toContain(stalePubRes.status)

      // 6. Cho phép SFU hồi phục (lần thứ 7 trả về 200 OK)
      const cleared = await (roomStub as any).retryPendingVoiceRevocations()
      expect(cleared).toBe(1)

      // Metadata pending đã được dọn sạch hoàn toàn sau khi thành công
      const clearedList = await (roomStub as any).getPendingVoiceRevocations()
      expect(clearedList.length).toBe(0)
    } finally {
      setCloudflareRealtimeFetchForTesting(null)
      delete (env as any).CLOUDFLARE_REALTIME_APP_ID
      delete (env as any).CLOUDFLARE_REALTIME_APP_SECRET
      ws.dong()
    }
  })

  // ── 10. Passive Stale Socket Test: Broadcast interception window & eviction via CampusDO alarm ──
  it('10. Passive Stale Socket: Passive socket evicted 4001 via CampusDO alarm retry after initial RoomDO RPC outage', async () => {
    // 1. User B (qa.v2.thu3) đăng nhập phiên 1
    const userBRes = await dangNhap('qa.v2.thu3', MAT_KHAU)
    expect(userBRes.status).toBe(200)
    const userBCookie = layCookie(userBRes)
    await userBRes.body?.cancel()

    const stu3 = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu3'").first<{ id: number }>()
    const accountId3 = stu3!.id

    const phongId = await chenPhong('Phòng Test Passive Socket Eviction', `acc:${accountId3}`)

    // User B vào phòng bằng WebSocket và NHẬN snapshot, KHÔNG gửi bất kỳ lệnh nào (passive socket)
    const wsB = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, userBCookie)
    expect(wsB.status).toBe(101)
    await wsB.cho('room.snapshot')

    // 2. Kích hoạt lỗi giả lập RPC từ CampusDO tới RoomDO
    CampusDO.setSimulateRoomRpcFailure(true)

    // 3. User B đăng nhập thiết bị mới (phiên 2) -> kích hoạt dangNhapMoi trong CampusDO
    const userBNewRes = await dangNhap('qa.v2.thu3', MAT_KHAU)
    expect(userBNewRes.status).toBe(200)
    await userBNewRes.body?.cancel()

    const campusStub = env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS))

    // 4. Xác nhận RPC ban đầu thất bại -> CampusDO lưu bền vững vào pending_room_revocations và schedule alarm
    const pendingRooms = await (campusStub as any).getPendingRoomRevocations()
    expect(pendingRooms.some((r: any) => r.accountId === accountId3 && r.roomName === `phong-${phongId}`)).toBe(true)

    const campusAlarmTime = await (campusStub as any).getRoomRevocationAlarmTime()
    expect(campusAlarmTime).not.toBeNull()

    // 5. User A (qa.v2.thu1) vào phòng gửi tin nhắn broadcast
    const userARes = await dangNhap('qa.v2.thu1', MAT_KHAU)
    expect(userARes.status).toBe(200)
    const userACookie = layCookie(userARes)
    await userARes.body?.cancel()

    const wsA = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, userACookie)
    await wsA.cho('room.snapshot')

    wsA.gui({ type: 'chat.send', reqId: 'req_chat_1', text: 'Tin nhắn gửi khi RoomDO RPC tạm đứt' })

    // Socket B nhận tin broadcast trong khi chưa bị revoke
    const chatNhan = await wsB.cho('room.chat')
    expect(chatNhan.message.text).toBe('Tin nhắn gửi khi RoomDO RPC tạm đứt')

    // 6. Khôi phục kết nối RPC giữa CampusDO và RoomDO
    CampusDO.setSimulateRoomRpcFailure(false)

    // 7. Kích hoạt retry / alarm của CampusDO (không cần bất kỳ thao tác nào từ socket B)
    const cleared = await (campusStub as any).retryPendingRoomRevocations()
    expect(cleared).toBeGreaterThanOrEqual(1)

    // 8. Socket B bị đóng bởi server với mã 4001 (da_dang_nhap_noi_khac)
    const closeEvt = await wsB.choDong(2000)
    expect(closeEvt.code).toBe(4001)

    // 9. User A gửi tiếp tin nhắn thứ 2 -> Socket B KHÔNG THỂ nhận được nữa
    wsA.gui({ type: 'chat.send', reqId: 'req_chat_2', text: 'Tin nhắn sau khi socket B đã bị thu hồi' })
    await wsB.khongNhan('room.chat')

    // 10. CampusDO pending_room_revocations đã được dọn sạch hoàn toàn
    const remainingPending = await (campusStub as any).getPendingRoomRevocations()
    expect(remainingPending.some((r: any) => r.accountId === accountId3 && r.roomName === `phong-${phongId}`)).toBe(false)

    wsA.dong()
  })

  // ── 11. CampusDO Restart Durability for Room Revocation ──
  it('11. CampusDO Restart Durability: Pending room revocations survive DO restart and clear when RoomDO recovers', async () => {
    // 1. User qa.v2.tudo đăng nhập và vào phòng
    const userRes = await dangNhap('qa.v2.tudo', MAT_KHAU)
    expect(userRes.status).toBe(200)
    const userCookie = layCookie(userRes)
    await userRes.body?.cancel()

    const stuRow = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.tudo'").first<{ id: number }>()
    const accountId = stuRow!.id

    const phongId = await chenPhong('Phòng Test CampusDO Restart', `acc:${accountId}`)
    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, userCookie)
    expect(ws.status).toBe(101)
    await ws.cho('room.snapshot')

    // 2. Giả lập RPC tới RoomDO thất bại
    CampusDO.setSimulateRoomRpcFailure(true)

    // 3. Đăng nhập mới kích hoạt dangNhapMoi
    const newRes = await dangNhap('qa.v2.tudo', MAT_KHAU)
    expect(newRes.status).toBe(200)
    await newRes.body?.cancel()

    const campusStub = env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS))

    // Kiểm tra pending trong SQLite CampusDO
    let pendingList = await (campusStub as any).getPendingRoomRevocations()
    expect(pendingList.some((r: any) => r.accountId === accountId && r.roomName === `phong-${phongId}`)).toBe(true)

    // 4. Giả lập CampusDO bị evict / restart
    await evictDurableObject(campusStub)

    // 5. Sau khi restart: pending record vẫn còn nguyên trong SQLite của CampusDO!
    const reloadedCampus = env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS))
    pendingList = await (reloadedCampus as any).getPendingRoomRevocations()
    expect(pendingList.some((r: any) => r.accountId === accountId && r.roomName === `phong-${phongId}`)).toBe(true)

    // 6. Alarm vẫn được duy trì trên CampusDO
    const alarmTime = await (reloadedCampus as any).getRoomRevocationAlarmTime()
    expect(alarmTime).not.toBeNull()

    // 7. Khôi phục RoomDO RPC và kích hoạt retry
    CampusDO.setSimulateRoomRpcFailure(false)
    const cleared = await (reloadedCampus as any).retryPendingRoomRevocations()
    expect(cleared).toBeGreaterThanOrEqual(1)

    // 8. Pending records đã được dọn sạch hoàn toàn
    const emptyPending = await (reloadedCampus as any).getPendingRoomRevocations()
    expect(emptyPending.some((r: any) => r.accountId === accountId && r.roomName === `phong-${phongId}`)).toBe(false)

    // 9. Socket cũ của qa.v2.tudo đã bị đóng 4001
    const closeEvt = await ws.choDong(2000)
    expect(closeEvt.code).toBe(4001)
  })

  // ── 12. Voice Multi-Generation Retention & Reverse-Order Close ──
  it('12. Voice Multi-Generation: Retains multiple pending incarnations for same actor, survives restart, closes out-of-order', async () => {
    ;(env as any).CLOUDFLARE_REALTIME_APP_ID = 'test-app-id'
    ;(env as any).CLOUDFLARE_REALTIME_APP_SECRET = 'test-secret'

    const studentRes = await dangNhap('qa.v2.thu1', MAT_KHAU)
    const studentCookie = layCookie(studentRes)
    await studentRes.body?.cancel()

    const phongId = await chenPhong('Phòng Test Multi-Generation Voice', 'acc:1')
    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))

    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, studentCookie)
    await ws.cho('room.snapshot')

    // Track SFU calls and simulate persistent failures initially
    let sfuCanSucceed = false
    const closedTracks: string[] = []
    setCloudflareRealtimeFetchForTesting(async (url, init) => {
      if (url.includes('/tracks/close')) {
        const body = JSON.parse((init?.body as string) || '{}')
        const trackIdentifier = body.tracks?.[0]?.mid || body.tracks?.[0]?.trackName
        if (!sfuCanSucceed) {
          return new Response(JSON.stringify({ error: 'SFU temporary outage' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        closedTracks.push(trackIdentifier)
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })

    try {
      // 1. Generation A (Session A, Track A) publishes
      await (roomStub as any).bindVoiceSession('sess_gen_A', 'acc:1', 1)
      await (roomStub as any).registerVoicePublication({
        actorKey: 'acc:1',
        ten: 'QA Thử nghiệm 1',
        audioTrackId: 'track_A',
        mid: 'mid_A',
        sessionId: 'sess_gen_A',
        generation: 1,
        status: 'live',
      })

      // Revoke Generation A -> fails remotely
      await (roomStub as any).revokeVoiceForActor('acc:1')

      let pendingList = await (roomStub as any).getPendingVoiceRevocations()
      expect(pendingList.length).toBe(1)
      expect(pendingList[0].actorKey).toBe('acc:1')
      expect(pendingList[0].sessionId).toBe('sess_gen_A')
      expect(pendingList[0].mid).toBe('mid_A')
      expect(pendingList[0].generation).toBe(1)

      // 2. Generation B (Session B, Track B) publishes for same actor
      await (roomStub as any).bindVoiceSession('sess_gen_B', 'acc:1', 2)
      await (roomStub as any).registerVoicePublication({
        actorKey: 'acc:1',
        ten: 'QA Thử nghiệm 1',
        audioTrackId: 'track_B',
        mid: 'mid_B',
        sessionId: 'sess_gen_B',
        generation: 2,
        status: 'live',
      })

      // Revoke Generation B -> also fails remotely
      await (roomStub as any).revokeVoiceForActor('acc:1')

      // INVARIANT CHECK: Both pending obligations MUST coexist simultaneously!
      // Revoking B must NOT overwrite A!
      pendingList = await (roomStub as any).getPendingVoiceRevocations()
      expect(pendingList.length).toBe(2)
      const rowA = pendingList.find((r: any) => r.sessionId === 'sess_gen_A')
      const rowB = pendingList.find((r: any) => r.sessionId === 'sess_gen_B')
      expect(rowA).toBeDefined()
      expect(rowB).toBeDefined()
      expect(rowA.revocationId).not.toBe(rowB.revocationId)
      expect(rowA.mid).toBe('mid_A')
      expect(rowB.mid).toBe('mid_B')

      // 3. Evict / Restart RoomDO: Both pending obligations survive DO reboot!
      await evictDurableObject(roomStub)
      const reloadedStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
      const restartedPending = await (reloadedStub as any).getPendingVoiceRevocations()
      expect(restartedPending.length).toBe(2)

      // 4. Recover SFU
      sfuCanSucceed = true

      // 5. Process retries in REVERSE ORDER (B first, then A)
      const reloadedB = restartedPending.find((r: any) => r.sessionId === 'sess_gen_B')!
      const reloadedA = restartedPending.find((r: any) => r.sessionId === 'sess_gen_A')!

      // Retry B first
      const okB = await (reloadedStub as any).retrySingleVoiceRevocation(reloadedB)
      expect(okB).toBe(true)

      // B is cleared, but A REMAINS untouched!
      const intermediatePending = await (reloadedStub as any).getPendingVoiceRevocations()
      expect(intermediatePending.length).toBe(1)
      expect(intermediatePending[0].sessionId).toBe('sess_gen_A')
      expect(intermediatePending[0].revocationId).toBe(reloadedA.revocationId)

      // Now retry A
      const okA = await (reloadedStub as any).retrySingleVoiceRevocation(reloadedA)
      expect(okA).toBe(true)

      // Pending table is now completely empty
      const finalPending = await (reloadedStub as any).getPendingVoiceRevocations()
      expect(finalPending.length).toBe(0)

      // Both tracks were closed remotely on SFU in reverse order
      expect(closedTracks).toEqual(['mid_B', 'mid_A'])

      // 6. Stale generation A cannot republish
      const stalePubRes = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
        body: JSON.stringify({
          sessionId: 'sess_gen_A',
          trackName: 'track_A_stale',
          mid: 'mid_A_stale',
          generation: 1,
          sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
        }),
      })
      expect(stalePubRes.ok).toBe(false)
    } finally {
      setCloudflareRealtimeFetchForTesting(null)
      delete (env as any).CLOUDFLARE_REALTIME_APP_ID
      delete (env as any).CLOUDFLARE_REALTIME_APP_SECRET
      ws.dong()
    }
  })

  // ── 13. Rapid S1 -> S2 -> S3 Room Session Replacement & Dangerous Out-of-Order Retry ──
  it('13. Rapid Session Replacement (S1 -> S2 -> S3): Reconciles to current D1 truth, preserves newest, closes stale', async () => {
    // 1. User qa.v2.thu3 (Account ID 4) logs in with S1 and joins room
    const resS1 = await dangNhap('qa.v2.thu3', MAT_KHAU)
    expect(resS1.status).toBe(200)
    const cookieS1 = layCookie(resS1)
    await resS1.body?.cancel()

    const stuRow = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu3'").first<{ id: number }>()
    const accountId = stuRow!.id

    const phongId = await chenPhong('Phòng Test ABA S1 S2 S3', `acc:${accountId}`)

    const wsS1 = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieS1)
    expect(wsS1.status).toBe(101)
    await wsS1.cho('room.snapshot')

    // 2. Inject RoomDO RPC failure to accumulate pending obligations
    CampusDO.setSimulateRoomRpcFailure(true)

    // 3. User logs in with S2 (RPC fails -> pending obligation recorded)
    const resS2 = await dangNhap('qa.v2.thu3', MAT_KHAU)
    expect(resS2.status).toBe(200)
    await resS2.body?.cancel()

    // 4. User logs in with S3 (RPC fails -> pending obligation collapses/updates)
    const resS3 = await dangNhap('qa.v2.thu3', MAT_KHAU)
    expect(resS3.status).toBe(200)
    const cookieS3 = layCookie(resS3)
    await resS3.body?.cancel()

    // Connect WebSocket wsS3 into the room with valid session S3
    const wsS3 = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieS3)
    expect(wsS3.status).toBe(101)
    await wsS3.cho('room.snapshot')

    const campusStub = env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS))
    const pendingRooms = await (campusStub as any).getPendingRoomRevocations()
    // Invariant: Exactly ONE collapsed reconciliation obligation per (account, room)
    const accountPending = pendingRooms.filter((r: any) => r.accountId === accountId && r.roomName === `phong-${phongId}`)
    expect(accountPending.length).toBe(1)

    // 5. Recover RoomDO RPC
    CampusDO.setSimulateRoomRpcFailure(false)

    // 6. Deliberately trigger reconciliation (re-running twice to prove idempotency)
    const cleared1 = await (campusStub as any).retryPendingRoomRevocations()
    expect(cleared1).toBeGreaterThanOrEqual(1)

    // Second call simulates duplicate alarm delivery
    const cleared2 = await (campusStub as any).retryPendingRoomRevocations()
    expect(cleared2).toBe(0) // Already cleared, no-op

    // 7. INVARIANT: S1 MUST BE CLOSED 4001, S3 MUST REMAIN OPEN!
    const closeS1 = await wsS1.choDong(2000)
    expect(closeS1.code).toBe(4001)

    // wsS3 remains open and functional
    // User qa.v2.thu1 sends a broadcast message in the room
    const userARes = await dangNhap('qa.v2.thu1', MAT_KHAU)
    const userACookie = layCookie(userARes)
    await userARes.body?.cancel()

    const wsA = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, userACookie)
    await wsA.cho('room.snapshot')

    wsA.gui({ type: 'chat.send', reqId: 'req_aba_chat', text: 'Xin chao S3!' })

    // S3 receives broadcast
    const chatS3 = await wsS3.cho('room.chat')
    expect(chatS3.message.text).toBe('Xin chao S3!')

    // S1 cannot receive
    await wsS1.khongNhan('room.chat')

    // Clean up
    wsA.dong()
    wsS3.dong()
  })

  // ── 14. CampusDO Multi-Generation Transitions During Outage, Restart Durability & Idempotency ──
  it('14. Multi-Generation Transitions (S1->S2->S3->S4): Collapses obligations, survives restart, converges idempotently', async () => {
    // 1. User qa.v2.tudo logs in S1 and enters room
    const resS1 = await dangNhap('qa.v2.tudo', MAT_KHAU)
    const cookieS1 = layCookie(resS1)
    await resS1.body?.cancel()

    const stuRow = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.tudo'").first<{ id: number }>()
    const accountId = stuRow!.id

    const phongId = await chenPhong('Phòng Test S1-S4 Durability', `acc:${accountId}`)
    const wsS1 = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieS1)
    await wsS1.cho('room.snapshot')

    // 2. Break RoomDO RPC
    CampusDO.setSimulateRoomRpcFailure(true)

    // Rapid successive logins S2 -> S3 -> S4
    await (await dangNhap('qa.v2.tudo', MAT_KHAU)).body?.cancel()
    await (await dangNhap('qa.v2.tudo', MAT_KHAU)).body?.cancel()
    const resS4 = await dangNhap('qa.v2.tudo', MAT_KHAU)
    const cookieS4 = layCookie(resS4)
    await resS4.body?.cancel()

    const campusStub = env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS))
    let pendingList = await (campusStub as any).getPendingRoomRevocations()
    const rows = pendingList.filter((r: any) => r.accountId === accountId && r.roomName === `phong-${phongId}`)
    expect(rows.length).toBe(1)
    expect(rows[0].attempts).toBeGreaterThanOrEqual(3)

    // 3. Evict CampusDO during multi-generation outage
    await evictDurableObject(campusStub)

    // 4. Reload CampusDO
    const reloadedCampus = env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS))
    pendingList = await (reloadedCampus as any).getPendingRoomRevocations()
    const reloadedRows = pendingList.filter((r: any) => r.accountId === accountId && r.roomName === `phong-${phongId}`)
    expect(reloadedRows.length).toBe(1)

    // 5. Connect S4 socket into the room
    const wsS4 = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieS4)
    await wsS4.cho('room.snapshot')

    // 6. Recover RPC
    CampusDO.setSimulateRoomRpcFailure(false)

    // 7. Alarm / retry triggers
    const cleared = await (reloadedCampus as any).retryPendingRoomRevocations()
    expect(cleared).toBeGreaterThanOrEqual(1)

    // 8. Invariant: S1 closed with 4001, S4 remains open!
    const closeEvt = await wsS1.choDong(2000)
    expect(closeEvt.code).toBe(4001)

    // wsS4 remains open and can interact
    wsS4.gui({ type: 'chat.send', reqId: 'chat_s4', text: 'S4 is alive and active' })
    const chatMsg = await wsS4.cho('room.chat')
    expect(chatMsg.message.text).toBe('S4 is alive and active')

    // Duplicate retry call is completely idempotent
    const clearedAgain = await (reloadedCampus as any).retryPendingRoomRevocations()
    expect(clearedAgain).toBe(0)

    wsS4.dong()
  })
})
