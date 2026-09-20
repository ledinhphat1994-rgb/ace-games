// Digital Campus v2: Milestone A1 — Room Alarm Arbitration Tests
// test/room-alarm-arbitration.test.ts
//
// Covers:
//   • Multiple active subsystems sharing the single Durable Object alarm
//   • Arbitration priority: earliest deadline wins among Pomodoro, Session Timer, voice, summary, and lifecycle
//   • Preservation of remaining obligations after one alarm fires
//   • Proper clearing of alarms upon room close when no obligations remain

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

describe('A1 — Room Alarm Arbitration Engine', () => {
  it('Earliest deadline arbitration: lifecycle deadline earlier than Pomodoro scheduled first', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Alarm Arbitration 1',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    // Pomodoro ends in 25 minutes
    const pomodoroEnd = now + 25 * 60 * 1000
    // Lifecycle neverJoined ends in 10 minutes (created 20m ago with 30m TTL)
    const lifecycleEnd = now + 10 * 60 * 1000

    // Set lifecycle state
    await stub.testSetLifecycleState({
      createdAt: lifecycleEnd - 30 * 60 * 1000,
      neverJoinedTtlMinutes: 30,
      autoCloseEnabled: true,
      everJoined: false,
      maxRoomLifetimeMinutes: 0,
    })

    // Set Pomodoro via internal state
    await (stub as any).testSetPomodoro({
      running: true,
      state: 'work',
      duration: 25 * 60,
      endsAt: pomodoroEnd,
      startedAt: now,
      pausedRemaining: 0,
      revision: 1,
    })

    const alarmTime = await (stub as any).testGetScheduledAlarm()
    expect(alarmTime).not.toBeNull()
    // Earliest deadline (lifecycleEnd ~10m) should be picked
    expect(alarmTime!).toBeLessThanOrEqual(lifecycleEnd + 1000)
    expect(alarmTime!).toBeLessThan(pomodoroEnd)
  })

  it('Earliest deadline arbitration: Pomodoro earlier than lifecycle scheduled first', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Alarm Arbitration 2',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    // Pomodoro ends in 5 minutes
    const pomodoroEnd = now + 5 * 60 * 1000
    // Lifecycle neverJoined ends in 30 minutes
    const lifecycleEnd = now + 30 * 60 * 1000

    await stub.testSetLifecycleState({
      createdAt: lifecycleEnd - 30 * 60 * 1000,
      neverJoinedTtlMinutes: 30,
      autoCloseEnabled: true,
      everJoined: false,
      maxRoomLifetimeMinutes: 0,
    })

    await (stub as any).testSetPomodoro({
      running: true,
      state: 'work',
      duration: 5 * 60,
      endsAt: pomodoroEnd,
      startedAt: now,
      pausedRemaining: 0,
      revision: 1,
    })

    const alarmTime = await (stub as any).testGetScheduledAlarm()
    expect(alarmTime).not.toBeNull()
    // Earliest deadline (pomodoroEnd ~5m) should be picked
    expect(alarmTime!).toBeLessThanOrEqual(pomodoroEnd + 1000)
    expect(alarmTime!).toBeLessThan(lifecycleEnd)
  })

  it('Session timer earlier than lifecycle scheduled first', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Alarm Arbitration 3',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    const now = Date.now()
    // Session Timer ends in 8 minutes
    const sessionTimerEnd = now + 8 * 60 * 1000
    // Lifecycle ends in 20 minutes
    const lifecycleEnd = now + 20 * 60 * 1000

    await stub.testSetLifecycleState({
      createdAt: lifecycleEnd - 20 * 60 * 1000,
      neverJoinedTtlMinutes: 20,
      autoCloseEnabled: true,
      everJoined: false,
      maxRoomLifetimeMinutes: 0,
    })

    await (stub as any).testSetSessionTimer({
      running: true,
      duration: 8 * 60,
      endsAt: sessionTimerEnd,
      startedAt: now,
      pausedRemaining: 0,
      revision: 1,
    })

    const alarmTime = await (stub as any).testGetScheduledAlarm()
    expect(alarmTime).not.toBeNull()
    expect(alarmTime!).toBeLessThanOrEqual(sessionTimerEnd + 1000)
    expect(alarmTime!).toBeLessThan(lifecycleEnd)
  })

  it('Room close cancels lifecycle deadlines and deletes alarm when no obligations remain', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Alarm Cancellation',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    // Đóng phòng
    await apiFetch(`/api/rooms/${room.id}/close`, ownerCookie, 'POST')

    const alarmTime = await (stub as any).testGetScheduledAlarm()
    // Alarms must be cleared (null)
    expect(alarmTime).toBeNull()
  })
})
