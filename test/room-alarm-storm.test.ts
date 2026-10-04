// Digital Campus v2: P0 Incident — RoomDO Alarm Storm Invariant Suite
// test/room-alarm-storm.test.ts
//
// Covers all requirements from P0 Incident:
//   1. Deterministic reproduction evidence (already-closed D1 + overdue lifecycle)
//   2. Invariant A: Already-closed D1 reconciliation -> local state closed, alarm cleared
//   3. Invariant B: D1 transient failure -> bounded backoff, no 50ms loop
//   4. Invariant C: Canonical room missing in D1 -> fail-closed terminal local state
//   5. Invariant D: Failed voice revocation retry -> future retry deadline
//   6. Invariant E: Failed session summary sync retry -> future retry deadline
//   7. Invariant F: No obligations -> getAlarm() is null
//   8. Invariant G: Expired Pomodoro/session timer processes once, does not loop
//   9. Invariant H: Consecutive unhandled overdue alarms trigger global safety fuse (exponential backoff)

import { exports, env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'

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

describe('P0 Incident — RoomDO Alarm Storm & Invariant Defense Suite', () => {
  it('1 & Invariant A: Canonical D1 already closed + local open + overdue lifecycle => converges to closed & alarm disappears', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant A',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    // Canonical D1 says room is closed by admin 1 minute ago
    await env.DB.prepare(
      `UPDATE phong
       SET trang_thai = 'dong',
           close_reason = 'admin_closed',
           closed_by = 1,
           closed_at = ?1
       WHERE id = ?2`,
    )
      .bind(now - 60000, room.id)
      .run()

    // RoomDO local lifecycle state is open, with overdue neverJoined deadline (created 10m ago, 5m ttl)
    await stub.testSetLifecycleState(
      {
        createdAt: now - 10 * 60 * 1000,
        neverJoinedTtlMinutes: 5,
        autoCloseEnabled: true,
        everJoined: false,
        isClosed: false,
        maxRoomLifetimeMinutes: 0,
        emptyRoomTtlMinutes: 0,
      },
      `phong-${room.id}`,
    )

    // Trigger alarm
    await stub.testTriggerAlarm()

    const localState = await stub.testGetLifecycleState()
    const scheduledAlarm = await stub.testGetScheduledAlarm()

    // 1. Local state converges to closed with canonical metadata
    expect(localState.isClosed).toBe(true)
    expect(localState.closeReason).toBe('admin_closed')
    expect(localState.closedBy).toBe(1)
    expect(localState.closedAt).toBe(now - 60000)

    // 2. Lifecycle alarm is completely disarmed (null)
    expect(scheduledAlarm).toBeNull()
  })

  it('Invariant B: D1 transient failure during lifecycle claim => no 50ms loop, advances to future backoff retry', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant B',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    await stub.testSetLifecycleState(
      {
        createdAt: now - 10 * 60 * 1000,
        neverJoinedTtlMinutes: 5,
        autoCloseEnabled: true,
        everJoined: false,
        isClosed: false,
      },
      `phong-${room.id}`,
    )

    // Simulate transient failure in D1 claim
    await (stub as any).testSetFailD1LifecycleClaim(true)

    // Trigger alarm
    await stub.testTriggerAlarm()

    const localState = await stub.testGetLifecycleState()
    const scheduledAlarm = await stub.testGetScheduledAlarm()

    // Room remains open but has recorded retry backoff
    expect(localState.isClosed).toBe(false)
    expect(localState.retryAttempts).toBe(1)
    expect(localState.nextRetryAt).toBeGreaterThanOrEqual(now + 900)

    // Scheduled alarm must be in the FUTURE (at least 900ms), NOT a 50ms tight loop!
    expect(scheduledAlarm).not.toBeNull()
    expect(scheduledAlarm! - now).toBeGreaterThanOrEqual(900)

    // Reset hook
    await (stub as any).testSetFailD1LifecycleClaim(false)
  })

  it('Invariant C: Canonical room missing from D1 => fails closed gracefully, no hot loop', async () => {
    // Pick an unallocated room ID (e.g. 999999) that does not exist in D1
    const missingRoomId = 999999
    const doId = env.ROOMS.idFromName(`phong-${missingRoomId}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    await stub.testSetLifecycleState(
      {
        createdAt: now - 10 * 60 * 1000,
        neverJoinedTtlMinutes: 5,
        autoCloseEnabled: true,
        everJoined: false,
        isClosed: false,
      },
      `phong-${missingRoomId}`,
    )

    await stub.testTriggerAlarm()

    const localState = await stub.testGetLifecycleState()
    const scheduledAlarm = await stub.testGetScheduledAlarm()

    // Local state must fail-closed to canonical_not_found
    expect(localState.isClosed).toBe(true)
    expect(localState.closeReason).toBe('canonical_not_found')

    // Alarm is completely deleted
    expect(scheduledAlarm).toBeNull()
  })

  it('Invariant D: Failed voice revocation retry advances into future with backoff, no 50ms spin', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant D',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    // Add pending voice revocation with an overdue nextRetryAt (now - 1000)
    await stub.testAddPendingVoiceRevocation(
      'rev_test_d_fail',
      'user_123',
      'sfu_session_invalid',
      now - 1000,
    )

    // Trigger alarm
    await stub.testTriggerAlarm()

    const scheduledAlarm = await stub.testGetScheduledAlarm()
    expect(scheduledAlarm).not.toBeNull()
    // Must be scheduled at least 900ms in the future (backoff delay), never <= 50ms
    expect(scheduledAlarm! - now).toBeGreaterThanOrEqual(900)
  })

  it('Invariant E: Failed session summary outbox retry advances into future with backoff, no 50ms spin', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant E',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    // Add an invalid pending summary sync that will fail during JSON parsing / delivery
    await stub.testAddPendingSummarySync(
      'sess_invalid_summary_1',
      room.id,
      'INVALID_MALFORMED_JSON',
      now - 1000,
    )

    // Trigger alarm
    await stub.testTriggerAlarm()

    const scheduledAlarm = await stub.testGetScheduledAlarm()
    expect(scheduledAlarm).not.toBeNull()
    // Must advance retry deadline to at least now + 900ms
    expect(scheduledAlarm! - now).toBeGreaterThanOrEqual(900)
  })

  it('Invariant F: No obligations => getAlarm() is strictly null', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant F',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    // Mark room closed with no timers or retries
    await stub.testSetLifecycleState(
      {
        isClosed: true,
        autoCloseEnabled: false,
        createdAt: 0,
      },
      `phong-${room.id}`,
    )

    const scheduledAlarm = await stub.testGetScheduledAlarm()
    expect(scheduledAlarm).toBeNull()
  })

  it('Invariant G: Expired Pomodoro & Session Timer process once and do not repeat in a 50ms loop', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant G',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    // 1. Session timer expired
    await (stub as any).testSetTimer(true, now - 1000, 0)

    // Disable lifecycle obligations for this test
    await stub.testSetLifecycleState({ isClosed: true }, `phong-${room.id}`)

    await stub.testTriggerAlarm()

    const scheduledAlarmAfterTimer = await stub.testGetScheduledAlarm()
    // Expired session timer becomes terminal (running: false) -> alarm deleted
    expect(scheduledAlarmAfterTimer).toBeNull()

    // 2. Pomodoro expired
    await stub.testSetPomodoro({
      running: true,
      endsAt: now - 1000,
      duration: 1500,
      mode: 'focus',
    })

    await stub.testTriggerAlarm()

    const scheduledAlarmAfterPomodoro = await stub.testGetScheduledAlarm()
    // Expired Pomodoro becomes terminal (running: false) -> processes once, alarm is deleted
    expect(scheduledAlarmAfterPomodoro).toBeNull()
  })

  it('Invariant H: Consecutive unhandled overdue alarms trigger the Global Alarm Safety Fuse (exponential backoff)', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant H',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    await stub.testSetLifecycleState(
      {
        createdAt: now - 10 * 60 * 1000,
        neverJoinedTtlMinutes: 5,
        autoCloseEnabled: true,
        everJoined: false,
        isClosed: false,
      },
      `phong-${room.id}`,
    )

    // Force D1 transient failure to simulate an unhandled overdue obligation
    await (stub as any).testSetFailD1LifecycleClaim(true)

    // Call alarm multiple times in sequence to simulate successive wakes
    const delays: number[] = []
    for (let i = 0; i < 4; i++) {
      // Simulate that the alarm woke up at its scheduled nextRetryAt
      await stub.testSetLifecycleState({ nextRetryAt: 0 })
      await stub.testTriggerAlarm()
      const alarm = await stub.testGetScheduledAlarm()
      expect(alarm).not.toBeNull()
      const delta = alarm! - Date.now()
      delays.push(delta)
    }

    // Every single alarm schedule is at least ~1s in the future (safely >= 600ms accounting for RPC latency)
    for (const d of delays) {
      expect(d).toBeGreaterThanOrEqual(600)
      // Never 50ms!
      expect(d).toBeGreaterThan(100)
    }

    // Delays should be monotonically non-decreasing (exponential backoff: ~1s, ~2s, ~4s, ~8s...)
    expect(delays[1]).toBeGreaterThanOrEqual(delays[0])
    expect(delays[2]).toBeGreaterThanOrEqual(delays[1])
    expect(delays[3]).toBeGreaterThanOrEqual(delays[2])

    // Cleanup
    await (stub as any).testSetFailD1LifecycleClaim(false)
  })

  it('Invariant I: OPEN -> claim CLOSING -> local close -> D1 finalize SUCCESS => D1=dong, local=closed, no alarm', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant I',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    await stub.testSetLifecycleState(
      {
        createdAt: now - 10 * 60 * 1000,
        neverJoinedTtlMinutes: 5,
        autoCloseEnabled: true,
        everJoined: false,
        isClosed: false,
      },
      `phong-${room.id}`,
    )

    // Trigger alarm -> claim CLOSING -> local close -> finalize D1
    await stub.testTriggerAlarm()

    // 1. D1 canonical state is terminal 'dong'
    const row = await env.DB.prepare('SELECT trang_thai, close_reason FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string }>()
    expect(row?.trang_thai).toBe('dong')
    expect(row?.close_reason).toBe('never_joined_timeout')

    // 2. Local state is closed and finalize obligation is complete
    const local = await stub.testGetLifecycleState()
    expect(local.isClosed).toBe(true)
    expect(local.finalizePending).toBe(false)
    expect(local.finalizeRetryAttempts).toBe(0)

    // 3. No alarm remaining
    const alarm = await stub.testGetScheduledAlarm()
    expect(alarm).toBeNull()
  })

  it('Invariant J: OPEN -> claim CLOSING -> local close -> D1 finalize FAIL => D1=closing, local closed, finalizePending=true, future retry alarm', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant J',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    await stub.testSetLifecycleState(
      {
        createdAt: now - 10 * 60 * 1000,
        neverJoinedTtlMinutes: 5,
        autoCloseEnabled: true,
        everJoined: false,
        isClosed: false,
      },
      `phong-${room.id}`,
    )

    // Inject failure AFTER claim succeeded (during D1 finalize)
    await (stub as any).testSetFailD1LifecycleFinalize(true)

    // Trigger alarm
    await stub.testTriggerAlarm()

    // 1. D1 state reached CLOSING
    const row = await env.DB.prepare('SELECT trang_thai, close_reason FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string }>()
    expect(row?.trang_thai).toBe('closing')
    expect(row?.close_reason).toBe('never_joined_timeout')

    // 2. Local room is operationally closed, but retains durable finalize pending obligation
    const local = await stub.testGetLifecycleState()
    expect(local.isClosed).toBe(true)
    expect(local.finalizePending).toBe(true)
    expect(local.finalizeRetryAttempts).toBe(1)
    expect(local.finalizeNextRetryAt).toBeGreaterThanOrEqual(now + 900)

    // 3. Alarm exists in the FUTURE, NO 50ms loop!
    const alarm = await stub.testGetScheduledAlarm()
    expect(alarm).not.toBeNull()
    expect(alarm! - now).toBeGreaterThanOrEqual(900)

    // Reset injection
    await (stub as any).testSetFailD1LifecycleFinalize(false)
  })

  it('Invariant K: Retry after J with D1 restored => D1 converges to dong, finalizePending cleared, alarm deleted', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant K',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    await stub.testSetLifecycleState(
      {
        createdAt: now - 10 * 60 * 1000,
        neverJoinedTtlMinutes: 5,
        autoCloseEnabled: true,
        everJoined: false,
        isClosed: false,
      },
      `phong-${room.id}`,
    )

    // 1. First trigger with finalize failure
    await (stub as any).testSetFailD1LifecycleFinalize(true)
    await stub.testTriggerAlarm()

    const localAfterFail = await stub.testGetLifecycleState()
    expect(localAfterFail.finalizePending).toBe(true)
    expect(localAfterFail.finalizeRetryAttempts).toBe(1)

    // 2. Restore D1 (disable failure hook)
    await (stub as any).testSetFailD1LifecycleFinalize(false)

    // Simulate alarm wake at due time
    await stub.testSetLifecycleState({ finalizeNextRetryAt: 0 })
    await stub.testTriggerAlarm()

    // 3. D1 is now converged to terminal 'dong'
    const row = await env.DB.prepare('SELECT trang_thai FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string }>()
    expect(row?.trang_thai).toBe('dong')

    // 4. finalizePending is cleared and alarm is removed
    const localAfterSuccess = await stub.testGetLifecycleState()
    expect(localAfterSuccess.isClosed).toBe(true)
    expect(localAfterSuccess.finalizePending).toBe(false)
    expect(localAfterSuccess.finalizeRetryAttempts).toBe(0)

    const alarm = await stub.testGetScheduledAlarm()
    expect(alarm).toBeNull()
  })

  it('Invariant L: D1 already CLOSING from earlier attempt => original claimant preserved, recovery resumes', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant L',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    // Manually set D1 to 'closing' with an earlier claimant (FIRST COMMITTED CLAIM WINS)
    const originalReason = 'admin_policy_eviction'
    const originalClosedBy = 1
    await env.DB.prepare(
      `UPDATE phong
       SET trang_thai = 'closing',
           close_reason = ?1,
           closed_by = ?2,
           closing_at = ?3
       WHERE id = ?4`,
    )
      .bind(originalReason, originalClosedBy, now - 30000, room.id)
      .run()

    // RoomDO is locally open with overdue lifecycle
    await stub.testSetLifecycleState(
      {
        createdAt: now - 10 * 60 * 1000,
        neverJoinedTtlMinutes: 5,
        autoCloseEnabled: true,
        everJoined: false,
        isClosed: false,
      },
      `phong-${room.id}`,
    )

    // Trigger alarm
    await stub.testTriggerAlarm()

    // D1 converges to 'dong', retaining the original close_reason and closed_by!
    const row = await env.DB.prepare('SELECT trang_thai, close_reason, closed_by FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string; closed_by: number }>()
    expect(row?.trang_thai).toBe('dong')
    expect(row?.close_reason).toBe(originalReason)
    expect(row?.closed_by).toBe(originalClosedBy)

    // Local state adopts original reason
    const local = await stub.testGetLifecycleState()
    expect(local.isClosed).toBe(true)
    expect(local.closeReason).toBe(originalReason)
    expect(local.closedBy).toBe(originalClosedBy)
    expect(local.finalizePending).toBe(false)

    // Alarm removed
    const alarm = await stub.testGetScheduledAlarm()
    expect(alarm).toBeNull()
  })

  it('Invariant M: D1 already DONG + local open => copies canonical metadata, no finalize needed, alarm deleted', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant M',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    const canonicalClosedAt = now - 120000
    await env.DB.prepare(
      `UPDATE phong
       SET trang_thai = 'dong',
           close_reason = 'teacher_manual_close',
           closed_by = 1,
           closed_at = ?1
       WHERE id = ?2`,
    )
      .bind(canonicalClosedAt, room.id)
      .run()

    // RoomDO is locally open with overdue lifecycle
    await stub.testSetLifecycleState(
      {
        createdAt: now - 10 * 60 * 1000,
        neverJoinedTtlMinutes: 5,
        autoCloseEnabled: true,
        everJoined: false,
        isClosed: false,
      },
      `phong-${room.id}`,
    )

    // Trigger alarm
    await stub.testTriggerAlarm()

    // Local state reconciled
    const local = await stub.testGetLifecycleState()
    expect(local.isClosed).toBe(true)
    expect(local.closeReason).toBe('teacher_manual_close')
    expect(local.closedBy).toBe(1)
    expect(local.closedAt).toBe(canonicalClosedAt)
    expect(local.finalizePending).toBe(false)

    // Alarm deleted
    const alarm = await stub.testGetScheduledAlarm()
    expect(alarm).toBeNull()
  })

  it('Invariant N: Object state reload from SQLite preserves finalize retry obligation & durable overdue fuse', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Invariant N',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    await stub.testSetLifecycleState(
      {
        createdAt: now - 10 * 60 * 1000,
        neverJoinedTtlMinutes: 5,
        autoCloseEnabled: true,
        everJoined: false,
        isClosed: false,
      },
      `phong-${room.id}`,
    )

    // Fail finalize
    await (stub as any).testSetFailD1LifecycleFinalize(true)
    await stub.testTriggerAlarm()

    const localBeforeReload = await stub.testGetLifecycleState()
    expect(localBeforeReload.finalizePending).toBe(true)
    expect(localBeforeReload.finalizeRetryAttempts).toBe(1)
    expect(localBeforeReload.finalizeNextRetryAt).toBeGreaterThan(0)

    // Simulate DO cold start / restart / memory eviction: reload completely from SQLite
    await (stub as any).testReloadFromSqlite()

    // State loaded from SQLite must preserve finalize retry obligation
    const localAfterReload = await stub.testGetLifecycleState()
    expect(localAfterReload.finalizePending).toBe(true)
    expect(localAfterReload.finalizeRetryAttempts).toBe(1)
    expect(localAfterReload.finalizeNextRetryAt).toBe(localBeforeReload.finalizeNextRetryAt)

    // Alarm must still be scheduled in the future, proving durability does not rely on in-memory counters
    const alarm = await stub.testGetScheduledAlarm()
    expect(alarm).not.toBeNull()
    expect(alarm! - Date.now()).toBeGreaterThanOrEqual(500)

    // Second retry after wake preserves sequence
    await stub.testSetLifecycleState({ finalizeNextRetryAt: 0 })
    await (stub as any).testReloadFromSqlite()
    await stub.testTriggerAlarm()

    const localAttempt2 = await stub.testGetLifecycleState()
    expect(localAttempt2.finalizeRetryAttempts).toBe(2)

    // Clean up
    await (stub as any).testSetFailD1LifecycleFinalize(false)
  })
})
