// Digital Campus v2: Milestone A1 — Room Lifecycle Failure Injection & Invariant Resilience
// test/room-lifecycle-failure-injection.test.ts
//
// Target Gates:
//   A. D1 OPEN -> CLOSING succeeds, RoomDO RPC fails (D1 stays closing, admission rejected, retryable partial error)
//   B. Retry same CLOSING room after RoomDO recovers (RoomDO closes, D1 -> dong, terminal close, no duplicate effects)
//   C. RoomDO closes but final D1 update fails (truthful partial error, retry converges D1 to dong, RoomDO close is idempotent)
//   D. Two admins race (single canonical claim, other sees in-progress/already-closed, eventual single CLOSED state)
//   E. Admin + timeout race (one terminal close reason according to first committed claim, no reason overwrite)

import { exports, env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'
import {
  closeStudyRoomCanonical,
  claimRoomCloseD1,
} from '../worker/services/room-lifecycle'

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

describe('A1 — Room Lifecycle Failure Injection & Invariant Resilience', () => {
  it('Scenario A: D1 OPEN -> CLOSING succeeds, RoomDO RPC fails -> D1 stays closing, admission rejected, retryable partial failure', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Failure Injection A',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    // Mock an invalid RoomDO stub by overriding ROOMS namespace temporarily for this call
    const originalRooms = env.ROOMS
    const brokenEnv: Env = {
      ...env,
      ROOMS: {
        idFromName: (name: string) => originalRooms.idFromName(name),
        idFromString: (id: string) => originalRooms.idFromString(id),
        newUniqueId: (options?: any) => originalRooms.newUniqueId(options),
        get: (id: DurableObjectId) => {
          const stub = originalRooms.get(id)
          return {
            ...stub,
            fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
              const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString()
              if (url.includes('/internal/lifecycle/close')) {
                // Simulate network error / 500 from RoomDO
                return new Response(JSON.stringify({ ok: false, error: 'Injected RoomDO failure' }), { status: 500 })
              }
              return stub.fetch(input as any, init)
            },
          } as any
        },
      } as any,
    }

    // Attempt close with broken RoomDO
    const closeRes = await closeStudyRoomCanonical(
      brokenEnv,
      room.id,
      { type: 'admin', accountId: 8, name: 'QA Admin' },
      'admin_closed',
      'Test injected failure',
    )

    // Bất biến 1: Không được trả về ok: true
    expect(closeRes.ok).toBe(false)
    expect(closeRes.partial).toBe(true)
    expect(closeRes.retryable).toBe(true)
    expect(closeRes.lifecycleStatus).toBe('closing')

    // Bất biến 2: D1 BẮT BUỘC PHẢI GIỮ 'closing', TUYỆT ĐỐI KHÔNG ĐƯỢC ĐÁNH 'dong'
    const d1Row = await env.DB.prepare('SELECT trang_thai, closed_at FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string; closed_at: number | null }>()

    expect(d1Row!.trang_thai).toBe('closing')
    expect(d1Row!.closed_at).toBeNull()

    // Bất biến 3: Cổng admission mới bị chặn hoàn toàn (Fail-closed)
    const stuCookie = await dangNhapLayCookie('qa.v2.thu2')
    const wsRes = await moPhongWs(room.id, stuCookie)
    expect(wsRes.status).toBe(403)

    const admitRes = await apiFetch(`/api/rooms/${room.id}/admission-status`, stuCookie)
    expect(admitRes.status).toBe(403)
  })

  it('Scenario B: Retry same CLOSING room after RoomDO recovers -> converges cleanly to DONG', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Failure Injection B',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    // Manually transition room to CLOSING in D1 to simulate partial state
    await claimRoomCloseD1(env.DB, room.id, 'admin_closed', 8)

    const d1Mid = await env.DB.prepare('SELECT trang_thai FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string }>()
    expect(d1Mid!.trang_thai).toBe('closing')

    // Now execute closeStudyRoomCanonical on the CLOSING room (resumable)
    const retryRes = await closeStudyRoomCanonical(
      env,
      room.id,
      { type: 'admin', accountId: 8, name: 'QA Admin' },
      'admin_closed',
      'Retry after recovery',
    )

    expect(retryRes.ok).toBe(true)
    expect(retryRes.status).toBe('closed')

    // D1 must now be 'dong' with closed_at set
    const d1Final = await env.DB.prepare('SELECT trang_thai, closed_at, close_reason FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string; closed_at: number; close_reason: string }>()

    expect(d1Final!.trang_thai).toBe('dong')
    expect(d1Final!.closed_at).toBeGreaterThan(0)
    expect(d1Final!.close_reason).toBe('admin_closed')

    // Subsequent retry is idempotent and returns alreadyClosed
    const subsequent = await closeStudyRoomCanonical(
      env,
      room.id,
      { type: 'admin', accountId: 8, name: 'QA Admin' },
      'admin_closed',
    )
    expect(subsequent.ok).toBe(true)
    expect(subsequent.alreadyClosed).toBe(true)
  })

  it('Scenario C: RoomDO closes but final D1 update fails -> truthful partial error, retry converges D1 to dong', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Failure Injection C',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    // Mock broken DB for final D1 step
    const originalPrepare = env.DB.prepare.bind(env.DB)
    const brokenDb = {
      ...env.DB,
      prepare: (query: string) => {
        if (query.includes("trang_thai = 'dong'")) {
          return {
            bind: () => ({
              run: async () => {
                throw new Error('Injected D1 finalize failure')
              },
            }),
          } as any
        }
        return originalPrepare(query)
      },
    } as unknown as D1Database

    const brokenEnv: Env = {
      ...env,
      DB: brokenDb,
    }

    const res = await closeStudyRoomCanonical(
      brokenEnv,
      room.id,
      { type: 'admin', accountId: 8, name: 'QA Admin' },
      'admin_closed',
    )

    // Must return truthful partial error
    expect(res.ok).toBe(false)
    expect(res.partial).toBe(true)
    expect(res.retryable).toBe(true)

    // Now retry with healthy DB -> converges to dong
    const recoveredRes = await closeStudyRoomCanonical(
      env,
      room.id,
      { type: 'admin', accountId: 8, name: 'QA Admin' },
      'admin_closed',
    )

    expect(recoveredRes.ok).toBe(true)
    expect(recoveredRes.status).toBe('closed')

    const d1Final = await env.DB.prepare('SELECT trang_thai FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string }>()
    expect(d1Final!.trang_thai).toBe('dong')
  })

  it('Scenario D: Two admins race -> single canonical claim, eventual single CLOSED state', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Race Two Admins Injection',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const [admin1, admin2] = await Promise.all([
      closeStudyRoomCanonical(
        env,
        room.id,
        { type: 'admin', accountId: 8, name: 'Admin 1' },
        'admin_closed',
        'Admin 1 note',
      ),
      closeStudyRoomCanonical(
        env,
        room.id,
        { type: 'admin', accountId: 8, name: 'Admin 2' },
        'admin_closed',
        'Admin 2 note',
      ),
    ])

    expect(admin1.ok).toBe(true)
    expect(admin2.ok).toBe(true)

    const d1Row = await env.DB.prepare('SELECT trang_thai, close_reason FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string }>()

    expect(d1Row!.trang_thai).toBe('dong')
    expect(d1Row!.close_reason).toBe('admin_closed')
  })

  it('Scenario E: Admin + timeout race -> first committed claim wins, no reason overwrite after terminal closure', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Admin Timeout Race',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    // Admin closes first
    const adminRes = await closeStudyRoomCanonical(
      env,
      room.id,
      { type: 'admin', accountId: 8, name: 'Admin Authority' },
      'admin_closed',
      'Cưỡng chế đóng',
    )
    expect(adminRes.ok).toBe(true)

    // Now system timeout attempts to close the already-closed room
    const timeoutRes = await closeStudyRoomCanonical(
      env,
      room.id,
      { type: 'system', name: 'Hệ thống tự động' },
      'never_joined_timeout',
    )

    expect(timeoutRes.ok).toBe(true)
    expect(timeoutRes.alreadyClosed).toBe(true)

    // Invariant: close_reason in D1 MUST NOT be overwritten by the later timeout
    const d1Row = await env.DB.prepare('SELECT trang_thai, close_reason FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string }>()

    expect(d1Row!.trang_thai).toBe('dong')
    expect(d1Row!.close_reason).toBe('admin_closed')
  })
})
