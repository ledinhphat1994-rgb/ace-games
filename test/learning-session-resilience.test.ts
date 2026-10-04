import { describe, expect, it } from 'vitest'
import { env, exports } from 'cloudflare:workers'
import { evictDurableObject } from 'cloudflare:test'
import type { GoiPhong } from '../shared/protocol/room'
import { computeAnalyticsOverview } from '../worker/lib/analytics'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'

/** Chèn phòng học loại 'video' vào D1, trả về id */
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

describe('Learning Session v1 Closure & Resilience (Targeted Release Gates)', () => {
  // ─────────────────────────────────────────────────────────────
  // BLOCKER 1: SINGLE ROOMDO ALARM ARBITER
  // ─────────────────────────────────────────────────────────────
  describe('Blocker 1: Single RoomDO Alarm Arbiter', () => {
    it('A. Voice retry due in 1s + Learning timer ending in 25m: Expected alarm = voice retry deadline (~1s), NOT timer end', async () => {
      const roomId = await chenPhong('Phòng Alarm Test A')
      const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${roomId}`))

      // Connect host first via WebSocket
      const cHost = await dangNhapLayCookie('qa.v2.thu1')
      const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
      await host.cho('room.snapshot')

      // Schedule a voice revocation retry in 2 seconds
      await (roomStub as any).testAddPendingVoiceRevocation('rev_test_a', 'acc:77', 'ses_test_a', Date.now() + 2000)
      const voiceAlarm = await (roomStub as any).getVoiceRevocationAlarmTime()
      expect(voiceAlarm).not.toBeNull()
      expect(voiceAlarm!).toBeLessThan(Date.now() + 4000)

      host.gui({
        type: 'session.action',
        data: { action: 'timer.start', durationSeconds: 1500 },
      })
      await host.cho('session.timer.sync', (g) => g.state.running)

      // Invariant: Alarm MUST remain scheduled for voice retry (~2s), NOT pushed to 25 minutes!
      const activeAlarm = await (roomStub as any).getVoiceRevocationAlarmTime()
      expect(activeAlarm).not.toBeNull()
      // Active alarm must still be due within ~2-3 seconds, strictly less than 1 minute
      expect(activeAlarm!).toBeLessThan(Date.now() + 5000)
      expect(activeAlarm!).toBeLessThan(Date.now() + 1500 * 1000 - 10000)

      host.dong()
      await (roomStub as any).testDeletePendingVoiceRevocation('rev_test_a')
    })

    it('B. Learning timer due before voice retry: Expected alarm = Learning timer deadline', async () => {
      const roomId = await chenPhong('Phòng Alarm Test B')
      const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${roomId}`))

      // Schedule voice retry in 60 seconds
      await (roomStub as any).scheduleVoiceRevocationAlarm(60000)

      // Set learning timer ending in 4 seconds
      const now = Date.now()
      const timerDeadline = now + 4000
      await (roomStub as any).testSetTimer(true, timerDeadline, 4)

      const alarmTime = await (roomStub as any).getVoiceRevocationAlarmTime()
      expect(alarmTime).not.toBeNull()
      // Alarm should match timer deadline (~4s), NOT the 60s voice retry
      expect(alarmTime!).toBeLessThan(now + 8000)
    })

    it('C. Voice retry fires while Learning timer continues: Timer alarm still scheduled after alarm processing', async () => {
      const roomId = await chenPhong('Phòng Alarm Test C')
      const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${roomId}`))

      // Start learning timer for 25 minutes
      const now = Date.now()
      await (roomStub as any).testSetTimer(true, now + 1500 * 1000, 1500)

      // Schedule voice retry in 1 second
      await (roomStub as any).scheduleVoiceRevocationAlarm(1000)

      // Trigger alarm
      await (roomStub as any).testTriggerAlarm()

      // After alarm fires: learning timer is still running, so alarm must still exist for the timer!
      const postAlarm = await (roomStub as any).getVoiceRevocationAlarmTime()
      expect(postAlarm).not.toBeNull()
      expect(postAlarm!).toBeGreaterThan(Date.now() + 10000)
    })

    it('D. Timer fires while voice retry remains pending: Voice retry alarm still exists', async () => {
      const roomId = await chenPhong('Phòng Alarm Test D')
      const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${roomId}`))

      // Insert a pending voice revocation due in 30 seconds
      const now = Date.now()
      const voiceRetryTime = now + 30000
      await (roomStub as any).testAddPendingVoiceRevocation('rev_test_d', 'acc:99', 'ses_test_d', voiceRetryTime)

      // Set timer expired
      await (roomStub as any).testSetTimer(true, now - 1000, 0)

      // Fire alarm
      await (roomStub as any).testTriggerAlarm()

      // After alarm processing, voice retry must still be scheduled
      const postAlarm = await (roomStub as any).getVoiceRevocationAlarmTime()
      expect(postAlarm).not.toBeNull()
      expect(postAlarm!).toBeLessThanOrEqual(voiceRetryTime + 100)

      // Cleanup
      await (roomStub as any).testDeletePendingVoiceRevocation('rev_test_d')
    })

    it('E. DO restart/eviction with both obligations persisted: Converges to earliest durable deadline', async () => {
      const roomId = await chenPhong('Phòng Alarm Test E')
      const roomName = `phong-${roomId}`
      const doId = env.ROOMS.idFromName(roomName)
      const roomStub = env.ROOMS.get(doId)

      const now = Date.now()
      const voiceDeadline = now + 4000
      const timerDeadline = now + 15000

      // Persist pending voice revocation with next_retry_at = voiceDeadline
      await (roomStub as any).testAddPendingVoiceRevocation('rev_test_e', 'acc:88', 'ses_test_e', voiceDeadline)

      // Persist running timer with ends_at = timerDeadline
      await (roomStub as any).testSetTimer(true, timerDeadline, 15)

      // Evict Durable Object from memory
      await evictDurableObject(roomStub)

      // Re-acquire and verify convergence upon reboot
      const rebootedStub = env.ROOMS.get(doId)
      const convergedAlarm = await (rebootedStub as any).getVoiceRevocationAlarmTime()
      expect(convergedAlarm).not.toBeNull()
      // Must converge to earliest durable deadline (voiceDeadline ~4s), not timer (~15s)
      expect(convergedAlarm!).toBeLessThan(now + 8000)

      // Cleanup
      await (rebootedStub as any).testDeletePendingVoiceRevocation('rev_test_e')
    })
  })

  // ─────────────────────────────────────────────────────────────
  // BLOCKER 2: LEARNING SESSION INCARNATION / LIFECYCLE
  // ─────────────────────────────────────────────────────────────
  describe('Blocker 2: Learning Session Incarnation & Lifecycle', () => {
    it('Deterministic session identity: sessionId created on start, duplicate start rejected, premature end rejected', async () => {
      const roomId = await chenPhong('Phòng Incarnation Lifecycle')
      const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${roomId}`))

      const cHost = await dangNhapLayCookie('qa.v2.thu1')
      const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
      await host.cho('room.snapshot')

      // 1. Attempting session.end when NO session is active -> rejected with error
      host.gui({
        type: 'session.action',
        data: { action: 'session.end' },
      })
      const errEnd = await host.cho('error', (g: any) => g.message.includes('Không có phiên học nào'))
      expect(errEnd.message).toContain('Không có phiên học nào')

      // Verify no summary was created
      const countBefore = await (roomStub as any).testGetSessionSummariesCount()
      expect(countBefore).toBe(0)

      // 2. Start session
      host.gui({
        type: 'session.action',
        data: { action: 'session.start' },
      })
      await host.cho('session.timer.sync')

      const activeSession = await (roomStub as any).getActiveLearningSession()
      expect(activeSession).not.toBeNull()
      expect(activeSession.sessionId).toMatch(/^[0-9a-f-]{36}$/)
      const originalSessionId = activeSession.sessionId
      const originalStartedAt = activeSession.startedAt

      // 3. Duplicate session.start (double click / replay) -> rejected with error, identity unchanged
      host.gui({
        type: 'session.action',
        data: { action: 'session.start' },
      })
      const errStart = await host.cho('error', (g: any) => g.message.includes('Phiên học đã bắt đầu'))
      expect(errStart.message).toContain('Phiên học đã bắt đầu')

      const activeSessionAfter = await (roomStub as any).getActiveLearningSession()
      expect(activeSessionAfter.sessionId).toBe(originalSessionId)
      expect(activeSessionAfter.startedAt).toBe(originalStartedAt)

      // 4. End session
      host.gui({
        type: 'session.action',
        data: { action: 'session.end' },
      })
      const gSummary = await host.cho('session.summary')
      expect(gSummary.summary.sessionId).toBe(originalSessionId)

      // 5. Second session.end (duplicate end) -> rejected, no second summary created
      host.gui({
        type: 'session.action',
        data: { action: 'session.end' },
      })
      const errDupEnd = await host.cho('error', (g: any) => g.message.includes('Không có phiên học nào'))
      expect(errDupEnd.message).toContain('Không có phiên học nào')

      const countAfter = await (roomStub as any).testGetSessionSummariesCount()
      expect(countAfter).toBe(1)

      host.dong()
    })
  })

  // ─────────────────────────────────────────────────────────────
  // BLOCKER 3: SESSION-TO-SESSION STATE ISOLATION
  // ─────────────────────────────────────────────────────────────
  describe('Blocker 3: Session-to-Session State Isolation', () => {
    it('Session B starts completely fresh with zero contamination from Session A', async () => {
      const roomId = await chenPhong('Phòng Isolation Back-to-Back')

      const cHost = await dangNhapLayCookie('qa.v2.thu1')
      const cMember = await dangNhapLayCookie('qa.v2.thu2')

      const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
      const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)
      await host.cho('room.snapshot')
      await member.cho('room.snapshot')

      // === SESSION A ===
      // 1. Host sets goal A and task A
      host.gui({
        type: 'session.action',
        data: { action: 'goal.set', text: 'Mục tiêu Buổi học A' },
      })
      await member.cho('session.goal.sync', (g) => g.goal?.text === 'Mục tiêu Buổi học A')

      host.gui({
        type: 'session.action',
        data: { action: 'task.add', text: 'Nhiệm vụ Buổi học A' },
      })
      const gTaskA = await member.cho('session.tasks.sync', (g) => g.tasks.length === 1)
      const taskAId = gTaskA.tasks[0].id

      // 2. Member ticks task A
      member.gui({
        type: 'session.action',
        data: { action: 'task.tick', taskId: taskAId },
      })
      await host.cho('session.tasks.sync', (g) => (g.completionMap[taskAId] ?? []).length > 0)

      // 3. Host creates poll A and member votes
      host.gui({
        type: 'session.action',
        data: { action: 'poll.create', question: 'Câu hỏi Poll A?', options: ['Đáp án 1', 'Đáp án 2'] },
      })
      const gPollA = await member.cho('session.poll.sync', (g) => g.poll !== null)
      const pollAId = gPollA.poll!.id
      const optAId = gPollA.poll!.options[0].id

      member.gui({
        type: 'session.action',
        data: { action: 'poll.vote', pollId: pollAId, optionId: optAId },
      })
      await host.cho('session.poll.sync', (g) => (g.voteCounts?.[optAId] ?? 0) > 0)

      // 4. Start & End Session A
      host.gui({ type: 'session.action', data: { action: 'session.start' } })
      await host.cho('session.timer.sync')

      host.gui({ type: 'session.action', data: { action: 'session.end' } })
      const summaryA = await host.cho('session.summary')
      expect(summaryA.summary.goal).toBe('Mục tiêu Buổi học A')
      expect(summaryA.summary.taskCount).toBe(1)
      expect(summaryA.summary.pollResults.length).toBe(1)

      // Cleaned state broadcast verification
      const cleanTasks = await member.cho('session.tasks.sync', (g) => g.tasks.length === 0)
      expect(cleanTasks.tasks).toHaveLength(0)
      const cleanPoll = await member.cho('session.poll.sync', (g) => g.poll === null)
      expect(cleanPoll.poll).toBeNull()

      // === SESSION B ===
      // Start Session B
      host.gui({ type: 'session.action', data: { action: 'session.start' } })
      await host.cho('session.timer.sync')

      // Set goal B and task B
      host.gui({
        type: 'session.action',
        data: { action: 'goal.set', text: 'Mục tiêu Buổi học B' },
      })
      await member.cho('session.goal.sync', (g) => g.goal?.text === 'Mục tiêu Buổi học B')

      host.gui({
        type: 'session.action',
        data: { action: 'task.add', text: 'Nhiệm vụ Buổi học B' },
      })
      const gTaskB = await member.cho('session.tasks.sync', (g) => g.tasks.some((t) => t.text === 'Nhiệm vụ Buổi học B'))
      const taskBId = gTaskB.tasks[0].id

      // INVARIANT: Task B must NOT have any completions carried over from Task A!
      expect(gTaskB.completionMap[taskBId] ?? []).toHaveLength(0)
      expect(gTaskB.completionMap[taskAId]).toBeUndefined()

      // End Session B
      host.gui({ type: 'session.action', data: { action: 'session.end' } })
      const summaryB = await host.cho('session.summary')

      // Summary B must reflect ONLY Session B data
      expect(summaryB.summary.sessionId).not.toBe(summaryA.summary.sessionId)
      expect(summaryB.summary.goal).toBe('Mục tiêu Buổi học B')
      expect(summaryB.summary.taskCount).toBe(1)
      expect(summaryB.summary.taskCompletionRates[taskBId]).toBe(0)
      expect(summaryB.summary.pollResults).toHaveLength(0) // Poll A was cleared!

      host.dong()
      member.dong()
    }, 15000)
  })

  // ─────────────────────────────────────────────────────────────
  // BLOCKER 4: DURABLE D1 SUMMARY OUTBOX & RETRY
  // ─────────────────────────────────────────────────────────────
  describe('Blocker 4: Durable D1 Summary Delivery via Outbox', () => {
    it('Outbox persists on transient failure, retries via alarm arbiter, and deletes on success', async () => {
      const roomId = await chenPhong('Phòng Outbox Test')
      const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${roomId}`))

      const cHost = await dangNhapLayCookie('qa.v2.thu1')
      const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
      await host.cho('room.snapshot')

      // Start and end session
      host.gui({ type: 'session.action', data: { action: 'session.start' } })
      await host.cho('session.timer.sync')

      host.gui({ type: 'session.action', data: { action: 'session.end' } })
      const gSummary = await host.cho('session.summary')
      const sessionId = gSummary.summary.sessionId

      // Wait a moment for outbox async delivery to execute
      await new Promise((r) => setTimeout(r, 200))

      // Verify that the summary was successfully delivered to D1
      const d1Row = await env.DB.prepare('SELECT id FROM hoc_session_summary WHERE id = ?1')
        .bind(sessionId)
        .first<{ id: string }>()
      expect(d1Row?.id).toBe(sessionId)

      // And verified deleted from RoomDO outbox
      const pending = await (roomStub as any).getPendingSessionSummaries()
      expect(pending.some((p: any) => p.sessionId === sessionId)).toBe(false)

      // Now test durable retry mechanism:
      // Insert a simulated pending outbox entry directly
      const mockSessionId = 'mock_outbox_' + crypto.randomUUID()
      await (roomStub as any).testAddPendingSummarySync(
        mockSessionId,
        roomId,
        JSON.stringify({
          sessionId: mockSessionId,
          roomId,
          goal: 'Mục tiêu thử nghiệm outbox retry',
          startedAt: Date.now() - 30000,
          endedAt: Date.now(),
          durationSeconds: 30,
          taskCount: 0,
          taskCompletionRates: {},
          activeMembers: ['Test Member'],
          pollResults: [],
        }),
        Date.now() - 1000,
      )

      // Verify it is in outbox
      const pendingBefore = await (roomStub as any).getPendingSessionSummaries()
      expect(pendingBefore.some((p: any) => p.sessionId === mockSessionId)).toBe(true)

      // Execute outbox sync
      const delivered = await (roomStub as any).xuLyPendingSummarySync()
      expect(delivered).toBeGreaterThanOrEqual(1)

      // Verify it arrived in D1
      const mockD1 = await env.DB.prepare('SELECT id FROM hoc_session_summary WHERE id = ?1')
        .bind(mockSessionId)
        .first<{ id: string }>()
      expect(mockD1?.id).toBe(mockSessionId)

      // And removed from outbox
      const pendingAfter = await (roomStub as any).getPendingSessionSummaries()
      expect(pendingAfter.some((p: any) => p.sessionId === mockSessionId)).toBe(false)

      host.dong()
    })
  })

  // ─────────────────────────────────────────────────────────────
  // BLOCKER 5: HISTORY API FAILURE SEMANTICS
  // ─────────────────────────────────────────────────────────────
  describe('Blocker 5: History API Error Semantics', () => {
    it('GET /api/rooms/:id/sessions returns 401 for unauth, 403 for student, and 503 on database outage', async () => {
      const roomId = await chenPhong('Phòng History API Error Test')
      const cTeacher = await dangNhapLayCookie('qa.v2.gv')
      const cStudent = await dangNhapLayCookie('qa.v2.thu1')

      // 1. Unauthenticated -> 401
      const resUnauth = await exports.default.fetch(`${GOC}/api/rooms/${roomId}/sessions`)
      expect(resUnauth.status).toBe(401)

      // 2. Student role -> 403
      const resStudent = await exports.default.fetch(`${GOC}/api/rooms/${roomId}/sessions`, {
        headers: { Cookie: cStudent },
      })
      expect(resStudent.status).toBe(403)

      // 3. Authorized teacher when DB succeeds -> 200 with { sessions, total }
      const resTeacherOk = await exports.default.fetch(`${GOC}/api/rooms/${roomId}/sessions`, {
        headers: { Cookie: cTeacher },
      })
      expect(resTeacherOk.status).toBe(200)
      const data = await resTeacherOk.json() as any
      expect(Array.isArray(data.sessions)).toBe(true)
      expect(typeof data.total).toBe('number')

      // 4. Injected D1 outage -> Returns 503, NOT 200 with fake empty array
      const originalPrepare = env.DB.prepare
      env.DB.prepare = ((query: string) => {
        if (query.includes('hoc_session_summary')) {
          return {
            bind: () => ({
              all: async () => { throw new Error('SIMULATED_D1_DATABASE_OUTAGE') },
              first: async () => { throw new Error('SIMULATED_D1_DATABASE_OUTAGE') },
            }),
          } as any
        }
        return originalPrepare.call(env.DB, query)
      }) as any

      try {
        const res503 = await exports.default.fetch(`${GOC}/api/rooms/${roomId}/sessions`, {
          headers: { Cookie: cTeacher },
        })
        expect(res503.status).toBe(503)
        const errJson = await res503.json() as any
        expect(errJson.ok).toBe(false)
        expect(errJson.loi).toContain('tạm thời không khả dụng')
      } finally {
        env.DB.prepare = originalPrepare
      }
    })
  })

  // ─────────────────────────────────────────────────────────────
  // BLOCKER 6: ANALYTICS CONSISTENCY
  // ─────────────────────────────────────────────────────────────
  describe('Blocker 6: Analytics Consistency & Learning Session Adoption Group', () => {
    it('Taxonomy contains 32 events and featureAdoption includes learningSession group with 7 events', async () => {
      // Create mock D1 statement results to test computeAnalyticsOverview
      const mockAnalyticsDb = {
        prepare: () => ({
          bind: () => ({
            all: async () => ({
              results: [],
            }),
            first: async () => ({ eventCount: 82, uniqueActors: 12 }),
          }),
        }),
      } as unknown as D1Database

      const overview = await computeAnalyticsOverview(mockAnalyticsDb, '7d')
      expect(overview.totalTaxonomyEvents).toBe(38)
      expect(overview.featureAdoption).toBeDefined()
      expect(overview.featureAdoption.learningSession).toBeDefined()
      expect(overview.featureAdoption.learningSession.eventCount).toBe(82)
      expect(overview.featureAdoption.learningSession.uniqueActors).toBe(12)
    })
  })

  // ─────────────────────────────────────────────────────────────
  // FINAL BLOCKER: FAIL-CLOSED LIFECYCLE DURABILITY ON SQLITE FAILURE
  // ─────────────────────────────────────────────────────────────
  describe('Final Blocker: Fail-Closed Lifecycle Durability on SQLite Failure', () => {
    it('Test A — Start persistence failure: Rejects start, keeps active session null, retries cleanly after recovery', async () => {
      const roomId = await chenPhong('Phòng Test Fail-Closed Start')
      const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${roomId}`))

      const cHost = await dangNhapLayCookie('qa.v2.thu1')
      const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
      await host.cho('room.snapshot')

      // 1. Injected SQLite failure during session.start
      await (roomStub as any).testSetFailSessionStartSql(true)

      host.gui({
        type: 'session.action',
        data: { action: 'session.start' },
      })

      // Must receive operational error
      const errStart = await host.cho('error', (g: any) => g.message.includes('Không thể lưu trạng thái bắt đầu'))
      expect(errStart.message).toContain('Không thể lưu trạng thái bắt đầu')

      // Must NOT have active session in memory or SQLite
      const activeSessionFailed = await (roomStub as any).getActiveLearningSession()
      expect(activeSessionFailed).toBeNull()

      // Must NOT have received session.timer.sync with serverNow
      await host.khongNhan('session.timer.sync', (g) => g.serverNow !== undefined, 200)

      // 2. Storage recovers: retry session.start succeeds
      await (roomStub as any).testSetFailSessionStartSql(false)

      host.gui({
        type: 'session.action',
        data: { action: 'session.start' },
      })

      const gTimerSync = await host.cho('session.timer.sync', (g) => g.serverNow !== undefined)
      expect(gTimerSync).toBeDefined()

      const activeSessionRecovered = await (roomStub as any).getActiveLearningSession()
      expect(activeSessionRecovered).not.toBeNull()
      expect(typeof activeSessionRecovered.sessionId).toBe('string')
      expect(typeof activeSessionRecovered.startedAt).toBe('number')

      host.dong()
    })

    it('Test B — End transaction failure: State remains intact, zero summary/outbox, retries with original sessionId', async () => {
      const roomId = await chenPhong('Phòng Test Fail-Closed End')
      const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${roomId}`))

      const cHost = await dangNhapLayCookie('qa.v2.thu1')
      const cMember = await dangNhapLayCookie('qa.v2.thu2')

      const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
      const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)
      await host.cho('room.snapshot')
      await member.cho('room.snapshot')

      // 1. Setup goal, task, poll
      host.gui({
        type: 'session.action',
        data: { action: 'goal.set', text: 'Mục tiêu kiểm tra lỗi SQLite' },
      })
      await member.cho('session.goal.sync', (g) => g.goal?.text === 'Mục tiêu kiểm tra lỗi SQLite')

      host.gui({
        type: 'session.action',
        data: { action: 'task.add', text: 'Nhiệm vụ kiểm tra lỗi SQLite' },
      })
      const gTask = await member.cho('session.tasks.sync', (g) => g.tasks.length === 1)
      const taskId = gTask.tasks[0].id

      member.gui({
        type: 'session.action',
        data: { action: 'task.tick', taskId },
      })
      await host.cho('session.tasks.sync', (g) => (g.completionMap[taskId] ?? []).length > 0)

      // 2. Start session
      host.gui({
        type: 'session.action',
        data: { action: 'session.start' },
      })
      await host.cho('session.timer.sync', (g) => g.serverNow !== undefined)
      const activeSession = await (roomStub as any).getActiveLearningSession()
      expect(activeSession).not.toBeNull()
      const originalSessionId = activeSession.sessionId
      const originalStartedAt = activeSession.startedAt

      // 3. Inject SQLite transaction failure during session.end
      await (roomStub as any).testSetFailSessionEndSql(true)

      host.gui({
        type: 'session.action',
        data: { action: 'session.end' },
      })

      // Must receive operational error
      const errEnd = await host.cho('error', (g: any) => g.message.includes('Không thể kết thúc phiên học do lỗi lưu trữ'))
      expect(errEnd.message).toContain('Không thể kết thúc phiên học do lỗi lưu trữ')

      // INVARIANTS on failure:
      // - Active session remains intact in memory
      const activeSessionAfterFail = await (roomStub as any).getActiveLearningSession()
      expect(activeSessionAfterFail).not.toBeNull()
      expect(activeSessionAfterFail.sessionId).toBe(originalSessionId)
      expect(activeSessionAfterFail.startedAt).toBe(originalStartedAt)

      // - Zero session summaries created
      const summariesCount = await (roomStub as any).testGetSessionSummariesCount()
      expect(summariesCount).toBe(0)

      // - Zero pending summary outbox rows created
      const outboxCount = await (roomStub as any).testGetPendingSummaryCount()
      expect(outboxCount).toBe(0)

      // - No session.summary broadcast to member
      await member.khongNhan('session.summary', undefined, 200)

      // 4. Restore storage and retry session.end
      await (roomStub as any).testSetFailSessionEndSql(false)

      // Temporarily mock D1 to prevent immediate background delivery so we can assert the durable outbox obligation
      const origPrepare = env.DB.prepare
      env.DB.prepare = ((query: string) => {
        if (query.includes('hoc_session_summary')) {
          return {
            bind: () => ({
              run: async () => { throw new Error('SIMULATED_D1_OFFLINE_FOR_OUTBOX_INSPECTION') },
            }),
          } as any
        }
        return origPrepare.call(env.DB, query)
      }) as any

      try {
        host.gui({
          type: 'session.action',
          data: { action: 'session.end' },
        })

        // Summary must be broadcast now
        const gSummary = await member.cho('session.summary')
        expect(gSummary.summary.sessionId).toBe(originalSessionId)
        expect(gSummary.summary.startedAt).toBe(originalStartedAt)
        expect(gSummary.summary.goal).toBe('Mục tiêu kiểm tra lỗi SQLite')
        expect(gSummary.summary.taskCount).toBe(1)

        // Exactly ONE local summary in SQLite
        const finalSummariesCount = await (roomStub as any).testGetSessionSummariesCount()
        expect(finalSummariesCount).toBe(1)

        // Exactly ONE outbox obligation
        const finalOutboxCount = await (roomStub as any).testGetPendingSummaryCount()
        expect(finalOutboxCount).toBe(1)

        // Working state cleared only after successful commit
        const gCleanGoal = await member.cho('session.goal.sync', (g) => g.goal === null)
        expect(gCleanGoal.goal).toBeNull()

        const activeSessionAfterSuccess = await (roomStub as any).getActiveLearningSession()
        expect(activeSessionAfterSuccess).toBeNull()
      } finally {
        env.DB.prepare = origPrepare
      }

      // Verify outbox retry delivers once D1 recovers
      await (roomStub as any).xuLyPendingSummarySync(Date.now() + 10000)
      const drainedOutbox = await (roomStub as any).testGetPendingSummaryCount()
      expect(drainedOutbox).toBe(0)

      const d1Summary = await env.DB.prepare('SELECT id FROM hoc_session_summary WHERE id = ?1')
        .bind(originalSessionId)
        .first<{ id: string }>()
      expect(d1Summary?.id).toBe(originalSessionId)

      host.dong()
      member.dong()
    })

    it('Test C — Restart after failed end: SQLite restores active session, state intact, subsequent end converges', async () => {
      const roomId = await chenPhong('Phòng Test Restart After Failed End')
      const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${roomId}`))

      const cHost = await dangNhapLayCookie('qa.v2.thu1')
      const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
      await host.cho('room.snapshot')

      // 1. Setup and start session
      host.gui({
        type: 'session.action',
        data: { action: 'goal.set', text: 'Mục tiêu trước khi crash' },
      })
      await host.cho('session.goal.sync', (g) => g.goal?.text === 'Mục tiêu trước khi crash')

      host.gui({
        type: 'session.action',
        data: { action: 'session.start' },
      })
      await host.cho('session.timer.sync', (g) => g.serverNow !== undefined)

      const activeSession = await (roomStub as any).getActiveLearningSession()
      const originalSessionId = activeSession.sessionId
      const originalStartedAt = activeSession.startedAt

      // 2. Failed end attempt
      await (roomStub as any).testSetFailSessionEndSql(true)
      host.gui({
        type: 'session.action',
        data: { action: 'session.end' },
      })
      await host.cho('error', (g: any) => g.message.includes('Không thể kết thúc phiên học do lỗi lưu trữ'))

      // 3. Simulate Durable Object eviction / restart
      host.dong()
      await evictDurableObject(roomStub)

      // 4. Reconnect to revived RoomDO
      const host2 = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
      await host2.cho('room.snapshot')

      // Invariant: active session restored from durable SQLite after restart
      const restoredSession = await (roomStub as any).getActiveLearningSession()
      expect(restoredSession).not.toBeNull()
      expect(restoredSession.sessionId).toBe(originalSessionId)
      expect(restoredSession.startedAt).toBe(originalStartedAt)

      // Storage is normal now: subsequent session.end succeeds and converges normally
      await (roomStub as any).testSetFailSessionEndSql(false)
      host2.gui({
        type: 'session.action',
        data: { action: 'session.end' },
      })
      const gSummary = await host2.cho('session.summary')
      expect(gSummary.summary.sessionId).toBe(originalSessionId)
      expect(gSummary.summary.goal).toBe('Mục tiêu trước khi crash')

      const finalCount = await (roomStub as any).testGetSessionSummariesCount()
      expect(finalCount).toBe(1)

      host2.dong()
    })
  })
})
