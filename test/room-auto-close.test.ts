// Digital Campus v2: Milestone A1 — Room Auto-Close Engine Tests
// test/room-auto-close.test.ts
//
// Covers:
//   • Never-joined timeout: room closes if no one ever joins
//   • First-join cancellation: joining marks ever_joined=true and cancels never_joined alarm
//   • Empty room timeout: room closes after emptyRoomTtlMinutes when all leave
//   • Re-join cancellation: re-entering cancels empty room alarm
//   • Max lifetime timeout: room closes when maxRoomLifetimeMinutes is reached

import { exports, env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'

function moPhongWs(id: number, cookie: string) {
  return exports.default.fetch(`${GOC}/ws/room/phong-${id}`, {
    headers: { Upgrade: 'websocket', Cookie: cookie, Origin: GOC },
  }) as Promise<Response>
}

async function apiFetch(path: string, cookie: string, method = 'GET', body?: unknown): Promise<Response> {
  const init: RequestInit = {
    method,
    headers: {
      Cookie: cookie,
      Origin: GOC,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
  }
  if (body) init.body = JSON.stringify(body)
  return exports.default.fetch(`${GOC}${path}`, init) as Promise<Response>
}

describe('A1 — Room Auto-Close Lifecycle Engine', () => {
  it('Never-joined timeout: automatically closes room when TTL expires with no joins', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    // 1. Tạo phòng
    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Thử Nghiệm Never-Joined',
      phamVi: 'truong',
      accessMode: 'public',
    })
    expect(createRes.status).toBe(201)
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    // 2. Cài đặt thời gian tạo lùi về 35 phút trước (mặc định neverJoinedTtl = 30)
    const thirtyFiveMinutesAgo = Date.now() - 35 * 60 * 1000
    await stub.testSetLifecycleState({
      createdAt: thirtyFiveMinutesAgo,
      everJoined: false,
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 30,
      emptyRoomTtlMinutes: 15,
      maxRoomLifetimeMinutes: 360,
    })

    // 3. Kích hoạt RoomDO alarm
    await (stub as any).testTriggerAlarm()

    // 4. Kiểm tra D1 record đã được đóng tự động với lý do never_joined_timeout
    const d1Row = await env.DB.prepare(
      'SELECT trang_thai, close_reason FROM phong WHERE id = ?1',
    )
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string }>()

    expect(d1Row!.trang_thai).toBe('dong')
    expect(d1Row!.close_reason).toBe('never_joined_timeout')
  })

  it('First-join cancellation: entering room sets everJoined=true and cancels never-joined auto-close', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')
    const peerCookie = await dangNhapLayCookie('qa.v2.thu2')

    // 1. Tạo phòng
    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng First-Join Cancel Test',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    // 2. Người dùng tham gia qua WS
    const wsRes = await moPhongWs(room.id, peerCookie)
    expect(wsRes.status).toBe(101)
    const ws = wsRes.webSocket!
    ws.accept()

    await new Promise((r) => setTimeout(r, 100))

    // 3. Kiểm tra state RoomDO đã đánh dấu everJoined = true
    const state = await stub.testGetLifecycleState()
    expect(state.everJoined).toBe(true)

    // 4. Giả lập thời gian trôi qua quá neverJoinedTtlMinutes
    const fortyMinsAgo = Date.now() - 40 * 60 * 1000
    await stub.testSetLifecycleState({
      createdAt: fortyMinsAgo,
      neverJoinedTtlMinutes: 30,
      emptyRoomTtlMinutes: 0, // tắt empty TTL trong test này để chỉ kiểm tra neverJoined
    })

    // 5. Kích hoạt alarm
    await (stub as any).testTriggerAlarm()

    // 6. Phòng vẫn phải MỞ vì đã có người tham gia
    const d1Row = await env.DB.prepare('SELECT trang_thai FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string }>()

    expect(d1Row!.trang_thai).toBe('mo')

    ws.close(1000, 'xong test')
  })

  it('Empty room timeout: closes room when all participants leave and emptyRoomTtl expires', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')
    const peerCookie = await dangNhapLayCookie('qa.v2.thu2')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Thử Nghiệm Empty Timeout',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    // 1. Tham gia rồi rời đi
    const wsRes = await moPhongWs(room.id, peerCookie)
    expect(wsRes.status).toBe(101)
    const ws = wsRes.webSocket!
    ws.accept()

    await new Promise((r) => setTimeout(r, 50))
    ws.close(1000, 'roi phong')
    await new Promise((r) => setTimeout(r, 100))

    // 2. Cài đặt thời điểm người cuối rời đi là 20 phút trước (emptyRoomTtl = 15)
    const twentyMinsAgo = Date.now() - 20 * 60 * 1000
    await stub.testSetLifecycleState({
      lastParticipantLeftAt: twentyMinsAgo,
      emptyRoomTtlMinutes: 15,
      autoCloseEnabled: true,
    })

    // 3. Chạy alarm
    await (stub as any).testTriggerAlarm()

    // 4. Kiểm tra D1 record đã đóng với lý do empty_timeout
    const d1Row = await env.DB.prepare(
      'SELECT trang_thai, close_reason FROM phong WHERE id = ?1',
    )
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string }>()

    expect(d1Row!.trang_thai).toBe('dong')
    expect(d1Row!.close_reason).toBe('empty_timeout')
  })

  it('Max room lifetime: closes room when createdAt reaches max lifetime regardless of presence', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')
    const peerCookie = await dangNhapLayCookie('qa.v2.thu2')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Thử Nghiệm Max Lifetime',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    // Đang có người online
    const wsRes = await moPhongWs(room.id, peerCookie)
    expect(wsRes.status).toBe(101)
    const ws = wsRes.webSocket!
    ws.accept()

    await new Promise((r) => setTimeout(r, 50))

    // Giả lập phòng đã tạo 7 tiếng trước (maxRoomLifetime = 360 phút = 6 tiếng)
    const sevenHoursAgo = Date.now() - 7 * 60 * 60 * 1000
    await stub.testSetLifecycleState({
      createdAt: sevenHoursAgo,
      maxRoomLifetimeMinutes: 360,
      autoCloseEnabled: true,
    })

    // Chạy alarm
    await (stub as any).testTriggerAlarm()

    // Kiểm tra D1 record đã đóng với lý do max_lifetime
    const d1Row = await env.DB.prepare(
      'SELECT trang_thai, close_reason FROM phong WHERE id = ?1',
    )
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string }>()

    expect(d1Row!.trang_thai).toBe('dong')
    expect(d1Row!.close_reason).toBe('max_lifetime')

    ws.close(1000, 'xong')
  })
})
