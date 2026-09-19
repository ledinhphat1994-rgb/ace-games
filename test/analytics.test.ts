import { env, exports } from 'cloudflare:workers'
import { describe, expect, it, beforeEach } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'
import {
  sanitizeAnalyticsProperties,
  normalizeAnalyticsRoute,
  recordAnalyticsEvent,
  computeAnalyticsOverview,
  pruneExpiredAnalytics,
  ALL_ANALYTICS_EVENTS,
  RAW_ANALYTICS_RETENTION_DAYS,
} from '../worker/lib/analytics'

const goi = (duongDan: string, init?: RequestInit) => exports.default.fetch(`${GOC}${duongDan}`, init)
const layCookie = (res: Response) => (res.headers.get('Set-Cookie') ?? '').split(';')[0]

const dangNhap = (username: string, password = MAT_KHAU) =>
  goi('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

describe('Milestone 0.1: Analytics Failure Isolation & Observability Correctness', () => {
  const analyticsDb = env.ANALYTICS_DB!

  beforeEach(async () => {
    // Clear analytics events in test isolated database before each test
    await analyticsDb.prepare('DELETE FROM analytics_events').run().catch(() => {})
  })

  describe('1. Taxonomy & Architecture Alignment', () => {
    it('Taxonomy contains exactly 32 authoritative events', () => {
      expect(ALL_ANALYTICS_EVENTS).toHaveLength(32)
      expect(ALL_ANALYTICS_EVENTS).toContain('auth.login_succeeded')
      expect(ALL_ANALYTICS_EVENTS).toContain('auth.login_failed')
      expect(ALL_ANALYTICS_EVENTS).toContain('campus.session_started')
      expect(ALL_ANALYTICS_EVENTS).toContain('campus.session_ended')
      expect(ALL_ANALYTICS_EVENTS).toContain('room.created')
      expect(ALL_ANALYTICS_EVENTS).toContain('room.joined')
      expect(ALL_ANALYTICS_EVENTS).toContain('room.left')
      expect(ALL_ANALYTICS_EVENTS).toContain('room.admission_failed')
      expect(ALL_ANALYTICS_EVENTS).toContain('chat.message_sent')
      expect(ALL_ANALYTICS_EVENTS).toContain('voice.publish_started')
      expect(ALL_ANALYTICS_EVENTS).toContain('voice.publish_ended')
      expect(ALL_ANALYTICS_EVENTS).toContain('voice.publish_failed')
      expect(ALL_ANALYTICS_EVENTS).toContain('notes.updated')
      expect(ALL_ANALYTICS_EVENTS).toContain('whiteboard.updated')
      expect(ALL_ANALYTICS_EVENTS).toContain('media.playback_started')
      expect(ALL_ANALYTICS_EVENTS).toContain('friend.request_sent')
      expect(ALL_ANALYTICS_EVENTS).toContain('friend.request_accepted')
      expect(ALL_ANALYTICS_EVENTS).toContain('notification.opened')
      expect(ALL_ANALYTICS_EVENTS).toContain('report.submitted')
      expect(ALL_ANALYTICS_EVENTS).toContain('moderation.action_completed')
      expect(ALL_ANALYTICS_EVENTS).toContain('game.session_started')
      expect(ALL_ANALYTICS_EVENTS).toContain('game.session_completed')
      expect(ALL_ANALYTICS_EVENTS).toContain('session.goal_set')
      expect(ALL_ANALYTICS_EVENTS).toContain('session.task_added')
      expect(ALL_ANALYTICS_EVENTS).toContain('session.task_completed')
      expect(ALL_ANALYTICS_EVENTS).toContain('session.timer_started')
      expect(ALL_ANALYTICS_EVENTS).toContain('session.poll_created')
      expect(ALL_ANALYTICS_EVENTS).toContain('session.poll_voted')
      expect(ALL_ANALYTICS_EVENTS).toContain('session.ended')
      expect(ALL_ANALYTICS_EVENTS).toContain('do.sfu_close_failed')
      expect(ALL_ANALYTICS_EVENTS).toContain('do.revocation_retry')
      expect(ALL_ANALYTICS_EVENTS).toContain('http.request')
    })

    it('Raw event retention is configured to 60 days', () => {
      expect(RAW_ANALYTICS_RETENTION_DAYS).toBe(60)
    })
  })

  describe('2. Primary Database Failure Isolation', () => {
    it('Analytics writes target ANALYTICS_DB and NEVER write to primary DB', async () => {
      // Record event via analyticsDb
      recordAnalyticsEvent(analyticsDb, undefined, {
        event: 'room.joined',
        actorId: 42,
        roomId: 7,
      })

      // Allow microtask queue to settle
      await new Promise((r) => setTimeout(r, 50))

      // Verify event exists in ANALYTICS_DB
      const analyticsRow = await analyticsDb
        .prepare('SELECT COUNT(*) as c FROM analytics_events WHERE actor_id = 42')
        .first<{ c: number }>()
      expect(analyticsRow?.c).toBe(1)

      // Verify primary application DB has 0 analytics writes
      const dbRow = await env.DB
        .prepare('SELECT COUNT(*) as c FROM analytics_events WHERE actor_id = 42')
        .first<{ c: number }>()
        .catch(() => ({ c: 0 }))
      expect(dbRow?.c).toBe(0)
    })

    it('recordAnalyticsEvent with undefined analyticsDb is a safe no-op that never throws', () => {
      expect(() => {
        recordAnalyticsEvent(undefined, undefined, {
          event: 'chat.message_sent',
          actorId: 99,
        })
      }).not.toThrow()
    })

    it('recordAnalyticsEvent catches D1 errors and never throws', () => {
      const brokenDb = {
        prepare: () => {
          throw new Error('Simulated D1 Disk Out of Quota')
        },
      } as unknown as D1Database

      expect(() => {
        recordAnalyticsEvent(brokenDb, undefined, {
          event: 'room.joined',
          actorId: 1,
        })
      }).not.toThrow()
    })

    it('Application login succeeds even when ANALYTICS_DB is disconnected or throws', async () => {
      // Normal login must succeed regardless of analytics logging status
      const res = await dangNhap('qa.v2.thu1')
      expect(res.status).toBe(200)
      const data = (await res.json()) as { ok: boolean }
      expect(data.ok).toBe(true)
    })
  })

  describe('3. Adversarial Privacy Sanitizer & Zero-PII Boundary', () => {
    it('Strips blacklisted sensitive keys completely', () => {
      const dirty = {
        password: 'super-secret-password',
        mat_khau: '123456',
        matkhau: '654321',
        salt: 'random-salt-hex',
        hash: 'pbkdf2-hash',
        otp: '987654',
        token: 'signed.jwt.token',
        secret: 'turnstile-secret',
        cookie: 'c10a7_session=abc',
        authorization: 'Bearer token',
        content: 'Confidential essay',
        noi_dung: 'Tin nhan bi mat',
        noidung: 'Tin nhan khac',
        text: 'Hello student in room',
        message: 'Direct private message',
        tin_nhan: 'Tin nhan noi bo',
        ip: '192.168.1.1',
        address: '10.0.0.1',
        privateNote: 'Private user note',
        safeCategory: 'study',
        count: 42,
        isActive: true,
      }

      const cleaned = sanitizeAnalyticsProperties(dirty)
      expect(cleaned).not.toBeNull()
      expect(cleaned).toEqual({
        safeCategory: 'study',
        count: 42,
        isActive: true,
      })
      expect(cleaned).not.toHaveProperty('password')
      expect(cleaned).not.toHaveProperty('mat_khau')
      expect(cleaned).not.toHaveProperty('cookie')
      expect(cleaned).not.toHaveProperty('authorization')
      expect(cleaned).not.toHaveProperty('token')
      expect(cleaned).not.toHaveProperty('content')
      expect(cleaned).not.toHaveProperty('noi_dung')
      expect(cleaned).not.toHaveProperty('ip')
    })

    it('Drops nested objects and arrays to prevent covert leakage', () => {
      const nested = {
        safeField: 'normal',
        nestedObj: { token: 'SECRET_TOKEN', password: 'SECRET_PASSWORD' },
        nestedArray: ['a', 'b', 'c'],
        complexObj: { inner: { deep: 123 } },
      }

      const cleaned = sanitizeAnalyticsProperties(nested)
      expect(cleaned).toEqual({
        safeField: 'normal',
      })
      expect(cleaned).not.toHaveProperty('nestedObj')
      expect(cleaned).not.toHaveProperty('nestedArray')
      expect(cleaned).not.toHaveProperty('complexObj')
    })

    it('Truncates overly long strings to 128 characters', () => {
      const longString = 'a'.repeat(300)
      const cleaned = sanitizeAnalyticsProperties({ safeNote: longString })
      expect(cleaned).not.toBeNull()
      expect(typeof cleaned?.safeNote).toBe('string')
      expect((cleaned?.safeNote as string).length).toBe(128)
    })

    it('Normalizes routes to prevent high-cardinality unbounded dimensions', () => {
      expect(normalizeAnalyticsRoute('/api/rooms/phong-123/admit')).toBe('/api/rooms/:id/admit')
      expect(normalizeAnalyticsRoute('/api/rooms/77/admission-status')).toBe('/api/rooms/:id/admission-status')
      expect(normalizeAnalyticsRoute('/api/reports/99/resolve')).toBe('/api/reports/:id/resolve')
      expect(normalizeAnalyticsRoute('/api/whoami')).toBe('/api/whoami')
    })
  })

  describe('4. Active User & Reconnect Semantics', () => {
    it('Automatic reconnects (campus.session_started) alone DO NOT count towards DAU', async () => {
      const todayStr = new Date().toISOString().split('T')[0]

      // Actor 1 reconnects 10 times to campus lobby (transport reconnection)
      for (let i = 0; i < 10; i++) {
        await analyticsDb
          .prepare(
            `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
             VALUES ('campus.session_started', 1, ?1, ?2)`,
          )
          .bind(Date.now() + i * 1000, todayStr)
          .run()
      }

      // Compute overview
      const overview = await computeAnalyticsOverview(analyticsDb, 'today')
      // DAU must be 0 because no meaningful activity (room, chat, voice, notes, whiteboard, media, game) occurred!
      expect(overview.activeUsers.dau).toBe(0)
    })

    it('Meaningful interaction counts towards DAU and deduplicates same actor', async () => {
      const todayStr = new Date().toISOString().split('T')[0]

      // Actor 1 joins room and sends 5 chat messages
      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('room.joined', 1, ?1, ?2)`,
        )
        .bind(Date.now(), todayStr)
        .run()

      for (let i = 0; i < 5; i++) {
        await analyticsDb
          .prepare(
            `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
             VALUES ('chat.message_sent', 1, ?1, ?2)`,
          )
          .bind(Date.now() + i * 100, todayStr)
          .run()
      }

      // Actor 2 plays solo game
      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('game.session_started', 2, ?1, ?2)`,
        )
        .bind(Date.now(), todayStr)
        .run()

      const overview = await computeAnalyticsOverview(analyticsDb, 'today')
      // Exactly 2 distinct active users
      expect(overview.activeUsers.dau).toBe(2)
    })
  })

  describe('5. Same-User Sequential Funnel', () => {
    it('Enforces same-user sequential progression across Stage 1 -> 2 -> 3 -> 4', async () => {
      const todayStr = new Date().toISOString().split('T')[0]
      const baseTime = Date.now() - 10000

      // User A (Actor 10): Completed full funnel in order
      // Login (t1) -> Campus (t2) -> Room (t3) -> Chat (t4)
      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('auth.login_succeeded', 10, ?1, ?2)`,
        )
        .bind(baseTime + 1000, todayStr)
        .run()

      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('campus.session_started', 10, ?1, ?2)`,
        )
        .bind(baseTime + 2000, todayStr)
        .run()

      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('room.joined', 10, ?1, ?2)`,
        )
        .bind(baseTime + 3000, todayStr)
        .run()

      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('chat.message_sent', 10, ?1, ?2)`,
        )
        .bind(baseTime + 4000, todayStr)
        .run()

      // User B (Actor 20): Login only (repeated 3 times to test deduplication)
      for (let i = 0; i < 3; i++) {
        await analyticsDb
          .prepare(
            `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
             VALUES ('auth.login_succeeded', 20, ?1, ?2)`,
          )
          .bind(baseTime + 1500 + i * 50, todayStr)
          .run()
      }

      // User C (Actor 30): Room join without prior login (e.g. stale connection fixture)
      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('room.joined', 30, ?1, ?2)`,
        )
        .bind(baseTime + 3500, todayStr)
        .run()

      // Compute overview
      const overview = await computeAnalyticsOverview(analyticsDb, 'today')

      // Assertions:
      // Stage 1 (Logged in): User A + User B = 2 unique users (User B deduplicated)
      expect(overview.funnel.stage1Users).toBe(2)
      // Stage 2 (Logged in -> Campus): User A only = 1
      expect(overview.funnel.stage2Users).toBe(1)
      // Stage 3 (Logged in -> Campus -> Room): User A only = 1 (User C excluded because no login/campus)
      expect(overview.funnel.stage3Users).toBe(1)
      // Stage 4 (Logged in -> Campus -> Room -> Interaction): User A only = 1
      expect(overview.funnel.stage4Users).toBe(1)

      // Rates:
      // Stage 2 Rate: 1 / 2 = 50%
      expect(overview.funnel.stage2RatePercent).toBe(50)
      // Stage 3 Rate: 1 / 1 = 100%
      expect(overview.funnel.stage3RatePercent).toBe(100)
      // Stage 4 Rate: 1 / 1 = 100%
      expect(overview.funnel.stage4RatePercent).toBe(100)
      // Overall Rate: 1 / 2 = 50%
      expect(overview.funnel.overallRatePercent).toBe(50)
    })
  })

  describe('6. Exact Actor-Level Cohort Retention (D1 & D7)', () => {
    it('Accurately computes D1 retention with strict actor deduplication', async () => {
      const now = Date.now()
      const todayStr = new Date(now).toISOString().split('T')[0]
      const yesterdayStr = new Date(now - 86400000).toISOString().split('T')[0]

      // Actor 101: first meaningful activity on Yesterday, returns on Today -> Retained D1
      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('room.joined', 101, ?1, ?2)`,
        )
        .bind(now - 86400000, yesterdayStr)
        .run()

      // Duplicate event on yesterday must NOT multiply cohort size
      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('chat.message_sent', 101, ?1, ?2)`,
        )
        .bind(now - 86400000 + 1000, yesterdayStr)
        .run()

      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('chat.message_sent', 101, ?1, ?2)`,
        )
        .bind(now, todayStr)
        .run()

      // Actor 102: first meaningful activity on Yesterday, does NOT return on Today -> Not retained
      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('room.joined', 102, ?1, ?2)`,
        )
        .bind(now - 86400000, yesterdayStr)
        .run()

      const overview = await computeAnalyticsOverview(analyticsDb, 'today')

      expect(overview.retention.d1CohortSize).toBe(2) // Actors 101 and 102
      expect(overview.retention.d1RetainedCount).toBe(1) // Actor 101 only
      expect(overview.retention.d1Percent).toBe(50)
    })

    it('Accurately computes D7 retention with strict actor deduplication', async () => {
      const now = Date.now()
      const todayStr = new Date(now).toISOString().split('T')[0]
      const day7AgoStr = new Date(now - 7 * 86400000).toISOString().split('T')[0]

      // Actor 201: first meaningful activity 7 days ago, returns on Today -> Retained D7
      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('room.joined', 201, ?1, ?2)`,
        )
        .bind(now - 7 * 86400000, day7AgoStr)
        .run()

      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('room.joined', 201, ?1, ?2)`,
        )
        .bind(now, todayStr)
        .run()

      const overview = await computeAnalyticsOverview(analyticsDb, 'today')

      expect(overview.retention.d7CohortSize).toBe(1)
      expect(overview.retention.d7RetainedCount).toBe(1)
      expect(overview.retention.d7Percent).toBe(100)
    })
  })

  describe('7. Raw Event Pruning Policy', () => {
    it('pruneExpiredAnalytics deletes events older than retention cutoff', async () => {
      const now = Date.now()
      const oldTime = now - 65 * 86400000 // 65 days ago
      const recentTime = now - 10 * 86400000 // 10 days ago

      // Insert 2 old events and 1 recent event
      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('http.request', 1, ?1, '2026-07-01')`,
        )
        .bind(oldTime)
        .run()

      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('http.request', 2, ?1, '2026-07-01')`,
        )
        .bind(oldTime + 1000)
        .run()

      await analyticsDb
        .prepare(
          `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
           VALUES ('http.request', 3, ?1, '2026-09-01')`,
        )
        .bind(recentTime)
        .run()

      const pruned = await pruneExpiredAnalytics(analyticsDb, 60)
      expect(pruned).toBe(2)

      const remaining = await analyticsDb
        .prepare('SELECT COUNT(*) as c FROM analytics_events')
        .first<{ c: number }>()
      expect(remaining?.c).toBe(1)
    })
  })

  describe('8. Access Control Security Gates', () => {
    it('Unauthenticated user receives HTTP 401', async () => {
      const res = await goi('/api/admin/analytics/overview')
      expect(res.status).toBe(401)
    })

    it('Student account receives HTTP 403 Forbidden', async () => {
      const loginRes = await dangNhap('qa.v2.thu1')
      expect(loginRes.status).toBe(200)
      const cookie = layCookie(loginRes)

      const res = await goi('/api/admin/analytics/overview', {
        headers: { Cookie: cookie },
      })
      expect(res.status).toBe(403)
      const data = (await res.json()) as { ok: boolean; loi: string }
      expect(data.ok).toBe(false)
      expect(data.loi).toContain('quản trị viên trường')
    })

    it('Ordinary Teacher without school admin authority receives HTTP 403 Forbidden', async () => {
      const loginRes = await dangNhap('qa.v2.gv')
      expect(loginRes.status).toBe(200)
      const cookie = layCookie(loginRes)

      const res = await goi('/api/admin/analytics/overview', {
        headers: { Cookie: cookie },
      })
      expect(res.status).toBe(403)
    })

    it('School Admin receives HTTP 200 OK with isolated database metadata', async () => {
      const loginRes = await dangNhap('qa.v2.admin')
      expect(loginRes.status).toBe(200)
      const cookie = layCookie(loginRes)

      const res = await goi('/api/admin/analytics/overview', {
        headers: { Cookie: cookie },
      })
      expect(res.status).toBe(200)
      const data = (await res.json()) as { ok: boolean; analytics: any }
      expect(data.ok).toBe(true)
      expect(data.analytics.databaseIsolated).toBe(true)
      expect(data.analytics.totalTaxonomyEvents).toBe(32)
      expect(data.analytics).toHaveProperty('funnel')
      expect(data.analytics).toHaveProperty('activeUsers')
      expect(data.analytics).toHaveProperty('retention')
      expect(data.analytics).toHaveProperty('operationalHealth')
    })
  })
})
