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
  getSystemAccountId,
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

  it('Scenario E1 (Barrier Race): Admin claims first, Timeout resumes -> reason remains admin_closed, actor remains Admin A', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Barrier Race Admin First',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    // 1. Admin A performs OPEN -> CLOSING claim atomically
    const claimRes = await claimRoomCloseD1(env.DB, room.id, 'admin_closed', 8)
    expect(claimRes.ok).toBe(true)
    expect(claimRes.claimed).toBe(true)
    expect(claimRes.persistedReasonCode).toBe('admin_closed')
    expect(claimRes.persistedClosedBy).toBe(8)

    // BARRIER: While Admin A is paused between claim and finalize, system timeout runs
    const timeoutRes = await closeStudyRoomCanonical(
      env,
      room.id,
      { type: 'system', name: 'Hệ thống tự động' },
      'never_joined_timeout',
    )
    expect(timeoutRes.ok).toBe(true)

    // Terminal state inspection
    const d1Row = await env.DB.prepare('SELECT trang_thai, close_reason, closed_by FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string; closed_by: number }>()

    expect(d1Row!.trang_thai).toBe('dong')
    // FIRST COMMITTED CLAIM WINS:
    expect(d1Row!.close_reason).toBe('admin_closed')
    expect(d1Row!.closed_by).toBe(8)
  })

  it('Scenario E2 (Barrier Race): Timeout claims first, Admin resumes -> reason remains never_joined_timeout, actor remains system', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Barrier Race Timeout First',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    // 1. System timeout performs OPEN -> CLOSING claim atomically
    const claimRes = await claimRoomCloseD1(env.DB, room.id, 'never_joined_timeout', null)
    expect(claimRes.ok).toBe(true)
    expect(claimRes.claimed).toBe(true)
    expect(claimRes.persistedReasonCode).toBe('never_joined_timeout')

    // BARRIER: While timeout is paused, Admin A attempts to force close
    const adminRes = await closeStudyRoomCanonical(
      env,
      room.id,
      { type: 'admin', accountId: 8, name: 'Admin Authority' },
      'admin_closed',
      'Cưỡng chế đóng',
    )
    expect(adminRes.ok).toBe(true)

    // Terminal state inspection
    const d1Row = await env.DB.prepare('SELECT trang_thai, close_reason, closed_by FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string; closed_by: number | null }>()

    expect(d1Row!.trang_thai).toBe('dong')
    // FIRST COMMITTED CLAIM WINS: Timeout claim identity is preserved
    expect(d1Row!.close_reason).toBe('never_joined_timeout')
    expect(d1Row!.closed_by).not.toBe(8)
  })

  it('Scenario E3 (Barrier Race): Admin A claims first, Admin B resumes -> closed_by remains Admin A', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Barrier Race Two Admins',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    // Admin A (ID = 8) claims OPEN -> CLOSING
    const claimRes = await claimRoomCloseD1(env.DB, room.id, 'admin_closed', 8)
    expect(claimRes.ok).toBe(true)
    expect(claimRes.claimed).toBe(true)

    // BARRIER: Admin B (ID = 2) executes close on the in-flight CLOSING room
    const adminBRes = await closeStudyRoomCanonical(
      env,
      room.id,
      { type: 'admin', accountId: 2, name: 'Admin B' },
      'admin_closed',
      'Admin B finalizes recovery',
    )
    expect(adminBRes.ok).toBe(true)

    // Terminal state inspection: closed_by MUST remain Admin A (ID = 8)
    const d1Row = await env.DB.prepare('SELECT trang_thai, close_reason, closed_by FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string; closed_by: number }>()

    expect(d1Row!.trang_thai).toBe('dong')
    expect(d1Row!.close_reason).toBe('admin_closed')
    expect(d1Row!.closed_by).toBe(8)
  })

  it('Hardening: getSystemAccountId returns disabled system principal and NEVER falls back to user 1', async () => {
    // 1. Bình thường: Lấy ra ID của tài khoản system
    const systemId = await getSystemAccountId(env.DB)
    expect(systemId).toBeGreaterThan(0)

    // Xác minh tài khoản này trong DB có dang_hoat_dong = 0
    const systemRow = await env.DB.prepare('SELECT id, ten_dang_nhap, dang_hoat_dong FROM tai_khoan_campus WHERE id = ?1')
      .bind(systemId)
      .first<{ id: number; ten_dang_nhap: string; dang_hoat_dong: number }>()

    expect(systemRow!.ten_dang_nhap).toBe('system')
    expect(systemRow!.dang_hoat_dong).toBe(0)

    // 2. Hardening test: Nếu mock database không có system và không insert được -> throw error, KHÔNG fallback về 1
    const brokenDb = {
      ...env.DB,
      prepare: (sql: string) => {
        if (sql.includes('ten_dang_nhap')) {
          return {
            first: async () => null,
            bind: () => ({
              first: async () => null,
              run: async () => ({ success: false, meta: { changes: 0 } }),
            }),
          } as any
        }
        return env.DB.prepare(sql)
      },
    } as unknown as D1Database

    await expect(getSystemAccountId(brokenDb)).rejects.toThrow('SYSTEM_PRINCIPAL_MISSING')
  })
})
