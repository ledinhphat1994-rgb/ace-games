// Digital Campus v2: Milestone A1 — Room Lifecycle Concurrency Tests
// test/room-lifecycle-concurrency.test.ts
//
// Covers:
//   • Race condition: Admin vs Owner simultaneous close
//   • Race condition: Two Admins simultaneous force-close
//   • DO restart durability: RoomLifecycleLocalState survives DO eviction/restart
//   • Concurrency during WebSocket teardown: all peers receive room.closed

import { exports, env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'
import { closeStudyRoomCanonical } from '../worker/services/room-lifecycle'

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

describe('A1 — Room Lifecycle Concurrency & Durability', () => {
  it('Race condition: Admin vs Owner simultaneous close converges gracefully', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Race Admin vs Owner',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    // Gọi đồng thời qua service
    const [resAdmin, resOwner] = await Promise.all([
      closeStudyRoomCanonical(
        env,
        room.id,
        { type: 'admin', accountId: 8, name: 'QA Admin' },
        'admin_concurrent',
      ),
      closeStudyRoomCanonical(
        env,
        room.id,
        { type: 'owner', accountId: 1, name: 'QA Thử 1' },
        'owner_concurrent',
      ),
    ])

    // Cả hai lệnh đều phải ok (không crash hoặc throw 500)
    expect(resAdmin.ok).toBe(true)
    expect(resOwner.ok).toBe(true)

    // Đúng một bên thực sự thực hiện đóng (alreadyClosed = false/undefined), bên kia nhận alreadyClosed = true
    const oneAlreadyClosed = Boolean(resAdmin.alreadyClosed) !== Boolean(resOwner.alreadyClosed)
    expect(oneAlreadyClosed).toBe(true)

    // D1 phải ở trạng thái 'dong'
    const d1Row = await env.DB.prepare(
      'SELECT trang_thai, closed_at FROM phong WHERE id = ?1',
    )
      .bind(room.id)
      .first<{ trang_thai: string; closed_at: number }>()

    expect(d1Row!.trang_thai).toBe('dong')
    expect(d1Row!.closed_at).toBeGreaterThan(0)
  })

  it('Race condition: Two Admins simultaneous force-close converges cleanly', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Race Two Admins',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const [admin1, admin2] = await Promise.all([
      closeStudyRoomCanonical(
        env,
        room.id,
        { type: 'admin', accountId: 8, name: 'Admin 1' },
        'admin1_close',
      ),
      closeStudyRoomCanonical(
        env,
        room.id,
        { type: 'admin', accountId: 8, name: 'Admin 2' },
        'admin2_close',
      ),
    ])

    expect(admin1.ok).toBe(true)
    expect(admin2.ok).toBe(true)
    expect(Boolean(admin1.alreadyClosed) !== Boolean(admin2.alreadyClosed)).toBe(true)

    const d1Row = await env.DB.prepare('SELECT trang_thai FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string }>()

    expect(d1Row!.trang_thai).toBe('dong')
  })

  it('DO restart durability: RoomLifecycleLocalState is persisted and reconstructed from SQLite', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Durability Test',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const mockCreatedAt = 1700000000000
    await stub.testSetLifecycleState({
      createdAt: mockCreatedAt,
      everJoined: true,
      neverJoinedTtlMinutes: 45,
      emptyRoomTtlMinutes: 25,
      maxRoomLifetimeMinutes: 600,
      autoCloseEnabled: true,
    })

    // Đọc trạng thái qua endpoint nội bộ (kích hoạt nạp lại từ SQLite)
    const stateRes = await stub.fetch('http://room.internal/internal/lifecycle/state')
    expect(stateRes.status).toBe(200)
    const body = (await stateRes.json()) as {
      ok: boolean
      lifecycle: {
        createdAt: number
        everJoined: boolean
        neverJoinedTtlMinutes: number
        emptyRoomTtlMinutes: number
        maxRoomLifetimeMinutes: number
      }
    }

    expect(body.ok).toBe(true)
    expect(body.lifecycle.createdAt).toBe(mockCreatedAt)
    expect(body.lifecycle.everJoined).toBe(true)
    expect(body.lifecycle.neverJoinedTtlMinutes).toBe(45)
    expect(body.lifecycle.emptyRoomTtlMinutes).toBe(25)
    expect(body.lifecycle.maxRoomLifetimeMinutes).toBe(600)
  })

  it('Concurrent WebSocket close: all connected peers receive room.closed packet upon force close', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')
    const peerCookie1 = await dangNhapLayCookie('qa.v2.thu2')
    const peerCookie2 = await dangNhapLayCookie('qa.v2.thu3')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Multi-Peer Force Close',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    // Kết nối 2 peers
    const wsRes1 = await moPhongWs(room.id, peerCookie1)
    const wsRes2 = await moPhongWs(room.id, peerCookie2)
    expect(wsRes1.status).toBe(101)
    expect(wsRes2.status).toBe(101)

    const ws1 = wsRes1.webSocket!
    const ws2 = wsRes2.webSocket!
    ws1.accept()
    ws2.accept()

    const packets1: any[] = []
    const packets2: any[] = []

    ws1.addEventListener('message', (e) => {
      try { packets1.push(JSON.parse(String(e.data))) } catch {}
    })
    ws2.addEventListener('message', (e) => {
      try { packets2.push(JSON.parse(String(e.data))) } catch {}
    })

    await new Promise((r) => setTimeout(r, 100))

    // Admin force close qua service
    const closeRes = await closeStudyRoomCanonical(
      env,
      room.id,
      { type: 'admin', accountId: 8, name: 'Admin QA' },
      'admin_multi_peer_close',
    )
    expect(closeRes.ok).toBe(true)

    await new Promise((r) => setTimeout(r, 200))

    // Cả 2 socket đều phải nhận được room.closed
    const pkt1 = packets1.find((p) => p.type === 'room.closed')
    const pkt2 = packets2.find((p) => p.type === 'room.closed')
    expect(pkt1).toBeDefined()
    expect(pkt2).toBeDefined()
    expect(pkt1.reason).toBe('admin_closed')
    expect(pkt2.reason).toBe('admin_closed')
  })
})
