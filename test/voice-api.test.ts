import { exports, env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiPhong } from '../shared/protocol/room'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'

/** Helper chèn phòng video vào D1 */
async function taoPhongTest(ten: string): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', NULL, 'acc:1', 'Chủ phòng', 'public', 20, 'mo')
     RETURNING id`,
  )
    .bind(ten)
    .first<{ id: number }>()
  if (!res) throw new Error('Không tạo được phòng')
  return res.id
}

describe('Authenticated Real Voice API & RoomDO Control Plane', () => {
  it('1. Từ chối yêu cầu voice session khi chưa đăng nhập (401)', async () => {
    const phongId = await taoPhongTest('Phòng Voice 401')
    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })
    expect(res.status).toBe(401)
  })

  it('2. Từ chối yêu cầu voice session với phòng không tồn tại (404)', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await exports.default.fetch(`${GOC}/api/rooms/999999/voice/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })
    expect(res.status).toBe(404)
  })

  it('3. Trả về BLOCKED_EXTERNAL_REALTIME_CREDENTIALS khi chưa cấu hình Realtime secret (503)', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice No Secret')

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })

    expect(res.status).toBe(503)
    const json = (await res.json()) as any
    expect(json.ok).toBe(false)
    expect(json.code).toBe('BLOCKED_EXTERNAL_REALTIME_CREDENTIALS')
  })

  it('4. RoomDO Voice Registry: đăng ký, cập nhật trạng thái, force-mute và dọn dẹp khi disconnect', async () => {
    const cookieHs1 = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice DO Test')

    // Kết nối WebSocket cho hs1
    const wsHs1 = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieHs1)
    expect(wsHs1.status).toBe(101)

    // Nhận snapshot
    const snap1 = await wsHs1.cho('room.snapshot')
    expect(Array.isArray(snap1.voiceRegistry)).toBe(true)
    expect(snap1.voiceRegistry?.length).toBe(0)

    // Gửi yêu cầu bind session và publish track thông qua RoomDO internal RPC/DO
    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    const hs1ActorKey = 'acc:1' // qa.v2.thu1 có id = 1

    await roomStub.bindVoiceSession('sess_hs1_123', hs1ActorKey)
    expect(await roomStub.getVoiceSessionOwner('sess_hs1_123')).toBe(hs1ActorKey)

    // Publish track âm thanh cho hs1
    const pubRes = await roomStub.registerVoicePublication({
      actorKey: hs1ActorKey,
      ten: 'QA Thử nghiệm 1',
      status: 'live',
      sessionId: 'sess_hs1_123',
      audioTrackId: 'audio_track_abc',
      generation: 1,
    })
    expect(pubRes.ok).toBe(true)
    expect(pubRes.participant?.status).toBe('live')

    // hs1 WebSocket phải nhận được voice.updated và presence mic = true
    const goiUpdate = await wsHs1.cho('voice.updated')
    expect(goiUpdate.participant.actorKey).toBe(hs1ActorKey)
    expect(goiUpdate.participant.status).toBe('live')

    const goiPresence = await wsHs1.cho(
      'presence',
      (g) => g.members.some((m) => m.key === hs1ActorKey && m.mic === true),
    )
    const hs1Member = goiPresence.members.find((m) => m.key === hs1ActorKey)
    expect(hs1Member?.mic).toBe(true)

    // Registry lúc này có 1 track
    const registry = await roomStub.getVoiceRegistry()
    expect(registry.length).toBe(1)
    expect(registry[0].actorKey).toBe(hs1ActorKey)

    // Stale generation bị từ chối
    const stalePub = await roomStub.registerVoicePublication({
      actorKey: hs1ActorKey,
      ten: 'QA Thử nghiệm 1',
      status: 'live',
      sessionId: 'sess_hs1_old',
      audioTrackId: 'audio_track_old',
      generation: 0, // Nhỏ hơn 1
    })
    expect(stalePub.ok).toBe(false)
    expect(stalePub.reason).toBe('stale_generation')

    // Force-mute bởi Giáo viên (Teacher / Host)
    const muteOk = await roomStub.forceMute(hs1ActorKey, 'Giáo Viên 1')
    expect(muteOk).toBe(true)

    const goiMute = await wsHs1.cho('voice.force_muted')
    expect(goiMute.targetKey).toBe(hs1ActorKey)
    expect(goiMute.by).toBe('Giáo Viên 1')

    // Khi hs1 ngắt kết nối WebSocket hoàn toàn -> track trong registry được dọn dẹp
    wsHs1.dong()
    await new Promise((r) => setTimeout(r, 60))
    const registrySauDong = await roomStub.getVoiceRegistry()
    expect(registrySauDong.length).toBe(0)
  })

  it('5. API force-mute: từ chối khi học sinh cố tắt mic của người khác (403)', async () => {
    const cookieHs2 = await dangNhapLayCookie('qa.v2.thu2')
    const phongId = await taoPhongTest('Phòng Force Mute Test')

    // hs2 cố tình gọi force-mute lên hs1 (acc:1)
    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/force-mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHs2 },
      body: JSON.stringify({
        targetActorKey: 'acc:1',
      }),
    })

    expect(res.status).toBe(403)
  })

  it('6. GET /api/rooms/:id/voice/registry trả về danh sách track âm thanh', async () => {
    const cookieHs1 = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice Registry API')

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.registerVoicePublication({
      actorKey: 'acc:1',
      ten: 'QA Thử nghiệm 1',
      status: 'live',
      sessionId: 'sess_1',
      audioTrackId: 'track_1',
      generation: 1,
    })

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/registry`, {
      headers: { Cookie: cookieHs1 },
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.ok).toBe(true)
    expect(Array.isArray(json.registry)).toBe(true)
    expect(json.registry.length).toBe(1)
    expect(json.registry[0].audioTrackId).toBe('track_1')
  })

  it('7. Giáo viên gọi force-mute thành công và người bị tắt nhận broadcast (200)', async () => {
    const cookieHs1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookieGv = await dangNhapLayCookie('qa.v2.gv')
    const phongId = await taoPhongTest('Phòng Voice GV Force Mute')

    const wsHs1 = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieHs1)
    await wsHs1.cho('room.snapshot')

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.registerVoicePublication({
      actorKey: 'acc:1',
      ten: 'QA Thử nghiệm 1',
      status: 'live',
      sessionId: 'sess_1',
      audioTrackId: 'track_1',
      generation: 1,
    })

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/force-mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetActorKey: 'acc:1' }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.ok).toBe(true)

    const goiMute = await wsHs1.cho('voice.force_muted')
    expect(goiMute.targetKey).toBe('acc:1')
    wsHs1.dong()
  })
})
