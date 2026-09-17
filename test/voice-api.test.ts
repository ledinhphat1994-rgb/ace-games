import { exports, env } from 'cloudflare:workers'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import type { GoiPhong } from '../shared/protocol/room'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'
import { setCloudflareRealtimeFetchForTesting } from '../worker/routes/voice-api'

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

describe('Authenticated Real Voice API & RoomDO Control Plane — Invariant Suite', () => {
  beforeEach(() => {
    ;(env as any).CLOUDFLARE_REALTIME_APP_ID = 'test-cf-app-id'
    ;(env as any).CLOUDFLARE_REALTIME_APP_SECRET = 'test-cf-secret-xyz'
  })

  afterEach(() => {
    setCloudflareRealtimeFetchForTesting(null)
    delete (env as any).CLOUDFLARE_REALTIME_APP_ID
    delete (env as any).CLOUDFLARE_REALTIME_APP_SECRET
  })

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

  it('3. Invariant 1: Từ chối khởi tạo voice session khi chưa có kết nối WebSocket vào phòng (403)', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice Not Connected')

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })

    expect(res.status).toBe(403)
    const json = (await res.json()) as any
    expect(json.loi).toContain('kết nối trực tiếp trong phòng')
  })

  it('4. Trả về BLOCKED_EXTERNAL_REALTIME_CREDENTIALS khi đã vào phòng nhưng chưa cấu hình secret (503)', async () => {
    delete (env as any).CLOUDFLARE_REALTIME_APP_ID
    delete (env as any).CLOUDFLARE_REALTIME_APP_SECRET

    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice No Secret')

    // Kết nối WS vào phòng trước
    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookie)
    await ws.cho('room.snapshot')

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
    ws.dong()
  })

  it('5. Invariant 2 & 7: Khởi tạo session thành công với mocked SFU trả về generation do server cấp', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice Mock SFU Success')

    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookie)
    await ws.cho('room.snapshot')

    setCloudflareRealtimeFetchForTesting(async (url) => {
      expect(url).toContain('/sessions/new')
      return new Response(
        JSON.stringify({
          sessionId: 'sfu_sess_101',
          sessionDescription: { type: 'answer', sdp: 'v=0\r\nsdp_answer_sfu' },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionDescription: { type: 'offer', sdp: 'v=0\r\nsdp_offer_client' },
      }),
    })

    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.ok).toBe(true)
    expect(json.sessionId).toBe('sfu_sess_101')
    expect(json.generation).toBe(1)
    expect(json.sessionDescription.sdp).toBe('v=0\r\nsdp_answer_sfu')

    // Invariant 18: Không chứa secrets
    expect(JSON.stringify(json)).not.toContain('test-cf-secret')

    ws.dong()
  })

  it('6. Invariant 7: Phản hồi Cloudflare session creation bị malformed -> trả về 502', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice Malformed Session')

    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookie)
    await ws.cho('room.snapshot')

    setCloudflareRealtimeFetchForTesting(async () => {
      return new Response(JSON.stringify({ malformed: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })

    expect(res.status).toBe(502)
    ws.dong()
  })

  it('7. Invariant 1: Actor rời phòng -> session trước đó không được phép publish (403)', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice Actor Leaves')

    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookie)
    await ws.cho('room.snapshot')

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.bindVoiceSession('sess_hs1_leave', 'acc:1', 1)

    // Actor đóng kết nối WS và rời phòng
    ws.dong()
    await new Promise((r) => setTimeout(r, 60))

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionId: 'sess_hs1_leave',
        trackName: 'mic_track_1',
        mid: '0',
        generation: 1,
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })

    expect(res.status).toBe(403)
  })

  it('8. Invariant 3: Foreign actor không thể dùng session của người khác (403)', async () => {
    const cookieHs1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookieHs2 = await dangNhapLayCookie('qa.v2.thu2')
    const phongId = await taoPhongTest('Phòng Voice Foreign Session')

    const wsHs1 = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieHs1)
    const wsHs2 = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieHs2)
    await wsHs1.cho('room.snapshot')
    await wsHs2.cho('room.snapshot')

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.bindVoiceSession('sess_hs1_owned', 'acc:1', 1)

    // hs2 cố tình dùng session của hs1
    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHs2 },
      body: JSON.stringify({
        sessionId: 'sess_hs1_owned',
        trackName: 'mic_track_steal',
        mid: '0',
        generation: 1,
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })

    expect(res.status).toBe(403)
    wsHs1.dong()
    wsHs2.dong()
  })

  it('9. Invariant 2: Client gửi generation giả mạo hoặc sai lệch -> bị từ chối 409', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice Forged Gen')

    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookie)
    await ws.cho('room.snapshot')

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.bindVoiceSession('sess_valid', 'acc:1', 1)

    // Client cố tình gửi generation = 999999999
    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionId: 'sess_valid',
        trackName: 'mic_track_1',
        mid: '0',
        generation: 999999999,
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })

    expect(res.status).toBe(409)
    // Server generation không bị nhảy số
    expect(await roomStub.getVoiceGeneration('acc:1')).toBe(1)
    ws.dong()
  })

  it('10. Invariant 4 & 6: Cloudflare publish thất bại -> không đăng ký canonical live publication', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice CF Publish Fail')

    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookie)
    await ws.cho('room.snapshot')

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.bindVoiceSession('sess_pub_fail', 'acc:1', 1)

    setCloudflareRealtimeFetchForTesting(async () => {
      return new Response(JSON.stringify({ error: 'SFU tracks full' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionId: 'sess_pub_fail',
        trackName: 'mic_track_err',
        mid: '0',
        generation: 1,
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })

    expect(res.status).toBe(500)
    // Canonical publication không được lưu
    const registry = await roomStub.getVoiceRegistry()
    expect(registry.length).toBe(0)
    ws.dong()
  })

  it('11. Invariant 4, 5 & 10: Cloudflare publish thành công -> đăng ký canonical publication với canonical metadata', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice CF Publish Success')

    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookie)
    await ws.cho('room.snapshot')

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.bindVoiceSession('sess_pub_ok', 'acc:1', 1)

    setCloudflareRealtimeFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          sessionDescription: { type: 'answer', sdp: 'v=0\r\nsdp_answer_track' },
          tracks: [{ location: 'local', trackName: 'cf_canonical_track_99', mid: '0' }],
          requiresImmediateRenegotiation: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionId: 'sess_pub_ok',
        trackName: 'proposed_track_1',
        mid: '0',
        generation: 1,
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })

    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.ok).toBe(true)
    expect(json.canonicalTrackName).toBe('cf_canonical_track_99')

    // RoomDO đã lưu canonical metadata từ SFU
    const registry = await roomStub.getVoiceRegistry()
    expect(registry.length).toBe(1)
    expect(registry[0].audioTrackId).toBe('cf_canonical_track_99')
    expect(registry[0].status).toBe('live')

    ws.dong()
  })

  it('12. Invariant 6: Close-track thất bại trên Cloudflare -> trả về 502 và mediaCleanupConfirmed: false', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice Close Fail')

    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookie)
    await ws.cho('room.snapshot')

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.bindVoiceSession('sess_close_fail', 'acc:1', 1)
    await roomStub.registerVoicePublication({
      actorKey: 'acc:1',
      ten: 'QA Thử nghiệm 1',
      status: 'live',
      sessionId: 'sess_close_fail',
      audioTrackId: 'track_live',
      generation: 1,
    })

    setCloudflareRealtimeFetchForTesting(async () => {
      return new Response('Upstream timeout', { status: 504 })
    })

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/close-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionId: 'sess_close_fail',
        trackName: 'track_live',
        generation: 1,
      }),
    })

    expect(res.status).toBe(504)
    const json = (await res.json()) as any
    expect(json.ok).toBe(false)
    expect(json.mediaCleanupConfirmed).toBe(false)

    ws.dong()
  })

  it('13. Invariant 6: Close-track thành công trên Cloudflare -> dọn dẹp publication và trả về mediaCleanupConfirmed: true', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice Close Success')

    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookie)
    await ws.cho('room.snapshot')

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.bindVoiceSession('sess_close_ok', 'acc:1', 1)
    await roomStub.registerVoicePublication({
      actorKey: 'acc:1',
      ten: 'QA Thử nghiệm 1',
      status: 'live',
      sessionId: 'sess_close_ok',
      audioTrackId: 'track_live_ok',
      generation: 1,
    })

    setCloudflareRealtimeFetchForTesting(async () => {
      return new Response(JSON.stringify({ tracks: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/close-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionId: 'sess_close_ok',
        trackName: 'track_live_ok',
        generation: 1,
      }),
    })

    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.ok).toBe(true)
    expect(json.mediaCleanupConfirmed).toBe(true)

    // Publication đã được xóa khỏi registry
    const reg = await roomStub.getVoiceRegistry()
    expect(reg.length).toBe(0)

    ws.dong()
  })

  it('14. Invariant 1 & 6: Force-mute: yêu cầu cả giáo viên và mục tiêu đều kết nối, fail-closed khi SFU lỗi', async () => {
    const cookieHs1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookieGv = await dangNhapLayCookie('qa.v2.gv')
    const phongId = await taoPhongTest('Phòng Voice Force Mute Guard')

    const wsHs1 = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieHs1)
    const wsGv = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieGv)
    await wsHs1.cho('room.snapshot')
    await wsGv.cho('room.snapshot')

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.bindVoiceSession('sess_hs1_fm', 'acc:1', 1)
    await roomStub.registerVoicePublication({
      actorKey: 'acc:1',
      ten: 'QA Thử nghiệm 1',
      status: 'live',
      sessionId: 'sess_hs1_fm',
      audioTrackId: 'track_hs1_fm',
      generation: 1,
    })

    // SFU báo lỗi khi đóng track
    setCloudflareRealtimeFetchForTesting(async () => {
      return new Response('SFU network drop', { status: 502 })
    })

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/force-mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetActorKey: 'acc:1' }),
    })

    expect(res.status).toBe(502)

    // Canonical publication của hs1 vẫn giữ nguyên live (không bị chuyển trạng thái giả)
    const pub = await roomStub.getVoiceParticipant('acc:1')
    expect(pub?.status).toBe('live')

    wsHs1.dong()
    wsGv.dong()
  })

  it('15. Invariant 12: Force-mute thành công và generation safety chặn race condition khi republish', async () => {
    const cookieHs1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookieGv = await dangNhapLayCookie('qa.v2.gv')
    const phongId = await taoPhongTest('Phòng Voice Force Mute Race')

    const wsHs1 = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieHs1)
    const wsGv = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieGv)
    await wsHs1.cho('room.snapshot')
    await wsGv.cho('room.snapshot')

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.bindVoiceSession('sess_hs1_fm2', 'acc:1', 1)
    await roomStub.registerVoicePublication({
      actorKey: 'acc:1',
      ten: 'QA Thử nghiệm 1',
      status: 'live',
      sessionId: 'sess_hs1_fm2',
      audioTrackId: 'track_hs1_fm2',
      generation: 1,
    })

    setCloudflareRealtimeFetchForTesting(async () => {
      return new Response(JSON.stringify({ tracks: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/force-mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieGv },
      body: JSON.stringify({ targetActorKey: 'acc:1' }),
    })

    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.ok).toBe(true)

    // WebSocket của hs1 nhận được packet voice.force_muted
    const goiMute = await wsHs1.cho('voice.force_muted')
    expect(goiMute.targetKey).toBe('acc:1')

    // Trạng thái trong RoomDO chuyển thành muted
    const pub = await roomStub.getVoiceParticipant('acc:1')
    expect(pub?.status).toBe('muted')

    // Thử gọi force-mute với generation cũ = 1 khi target đã republish lên generation 2
    await roomStub.bindVoiceSession('sess_hs1_gen2', 'acc:1', 2)
    await roomStub.registerVoicePublication({
      actorKey: 'acc:1',
      ten: 'QA Thử nghiệm 1',
      status: 'live',
      sessionId: 'sess_hs1_gen2',
      audioTrackId: 'track_hs1_gen2',
      generation: 2,
    })

    // Gọi forceMute trực tiếp với expectedGeneration = 1 -> bị từ chối
    const raceMute = await roomStub.forceMute('acc:1', 'Giáo viên', 1)
    expect(raceMute).toBe(false)
    // Publication generation 2 vẫn live
    expect((await roomStub.getVoiceParticipant('acc:1'))?.status).toBe('live')

    wsHs1.dong()
    wsGv.dong()
  })

  it('16. Invariant 9: SQLite persistence và dọn dẹp publication mồ côi (orphaned) khi khởi tạo lại DO', async () => {
    const phongId = await taoPhongTest('Phòng Voice Reconcile')
    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))

    // Nạp session và publication thủ công
    await roomStub.bindVoiceSession('sess_orphan', 'acc:99', 1)
    await roomStub.registerVoicePublication({
      actorKey: 'acc:99',
      ten: 'User Mồ Côi',
      status: 'live',
      sessionId: 'sess_orphan',
      audioTrackId: 'track_orphan',
      generation: 1,
    })

    // Vì acc:99 không có WebSocket nào kết nối trong phòng, khi DO nạp lại hoặc đối soát
    // thì publication mồ côi không được phép xuất hiện trong registry sống
    expect(await roomStub.hasConnectedActor('acc:99')).toBe(false)
    const session = await roomStub.getVoiceSession('sess_orphan')
    expect(session).not.toBeNull()
    expect(session?.actorKey).toBe('acc:99')
    expect(session?.generation).toBe(1)
  })

  it('17. Invariant 3: Session từ phòng khác (phòng A) không thể dùng để publish ở phòng B (403)', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongA = await taoPhongTest('Phòng Voice Room A')
    const phongB = await taoPhongTest('Phòng Voice Room B')

    const wsA = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongA}`, cookie)
    const wsB = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongB}`, cookie)
    await wsA.cho('room.snapshot')
    await wsB.cho('room.snapshot')

    const roomStubA = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongA}`))
    // Bind session ở phòng A
    await roomStubA.bindVoiceSession('sess_phong_a', 'acc:1', 1)

    // Cố publish ở phòng B dùng session của phòng A
    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongB}/voice/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionId: 'sess_phong_a',
        trackName: 'mic_track_1',
        mid: '0',
        generation: 1,
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })

    expect(res.status).toBe(403)
    const json = (await res.json()) as any
    expect(json.loi).toContain('không thuộc quyền sở hữu của bạn trong phòng này')

    wsA.dong()
    wsB.dong()
  })

  it('18. Invariant 7: Cloudflare publish trả về metadata malformed -> 502, không đăng ký canonical live state', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const phongId = await taoPhongTest('Phòng Voice Malformed Tracks')

    const ws = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookie)
    await ws.cho('room.snapshot')

    const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`))
    await roomStub.bindVoiceSession('sess_malformed_meta', 'acc:1', 1)

    setCloudflareRealtimeFetchForTesting(async () => {
      // Phản hồi không có tracks array hợp lệ
      return new Response(JSON.stringify({ tracks: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/voice/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionId: 'sess_malformed_meta',
        trackName: 'mic_track_1',
        mid: '0',
        generation: 1,
        sessionDescription: { type: 'offer', sdp: 'v=0\r\no=...' },
      }),
    })

    expect(res.status).toBe(502)
    const registry = await roomStub.getVoiceRegistry()
    expect(registry.length).toBe(0)

    ws.dong()
  })
})
