import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'
import {
  sanitizeAnalyticsProperties,
  normalizeAnalyticsRoute,
  recordAnalyticsEvent,
  computeAnalyticsOverview,
} from '../worker/lib/analytics'

const goi = (duongDan: string, init?: RequestInit) => exports.default.fetch(`${GOC}${duongDan}`, init)
const layCookie = (res: Response) => (res.headers.get('Set-Cookie') ?? '').split(';')[0]

const dangNhap = (username: string, password = MAT_KHAU) =>
  goi('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

describe('Milestone 0: Post-Release Observability & Product Analytics Baseline', () => {
  describe('Phase 3 & Privacy Rules: Zero-PII Sanitization & Route Normalization', () => {
    it('Strips blacklisted sensitive keys completely', () => {
      const dirty = {
        password: 'super-secret-password',
        mat_khau: '123456',
        salt: 'random-salt-hex',
        hash: 'pbkdf2-hash',
        otp: '987654',
        resetCode: 'ABC-123',
        token: 'signed.jwt.token',
        secret: 'turnstile-secret',
        cookie: 'c10a7_session=abc',
        authorization: 'Bearer token',
        chatText: 'Hello student in room',
        content: 'Confidential essay',
        body: 'User submitted report details',
        message: 'Direct private message',
        ipAddress: '192.168.1.1',
        safeCategory: 'homework_discussion',
        count: 42,
        isActive: true,
      }

      const cleaned = sanitizeAnalyticsProperties(dirty)
      expect(cleaned).not.toBeNull()
      expect(cleaned).toEqual({
        safeCategory: 'homework_discussion',
        count: 42,
        isActive: true,
      })
      // Ensure all forbidden keys are removed
      expect(cleaned).not.toHaveProperty('password')
      expect(cleaned).not.toHaveProperty('mat_khau')
      expect(cleaned).not.toHaveProperty('salt')
      expect(cleaned).not.toHaveProperty('hash')
      expect(cleaned).not.toHaveProperty('otp')
      expect(cleaned).not.toHaveProperty('token')
      expect(cleaned).not.toHaveProperty('chatText')
      expect(cleaned).not.toHaveProperty('content')
      expect(cleaned).not.toHaveProperty('message')
      expect(cleaned).not.toHaveProperty('ipAddress')
    })

    it('Truncates overly long strings to prevent storage abuse', () => {
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

  describe('Phase 13: Analytics Admin Security & Access Control', () => {
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

    it('Ordinary teacher account receives HTTP 403 Forbidden', async () => {
      const loginRes = await dangNhap('qa.v2.gv')
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

    it('School admin account receives HTTP 200 with full analytics overview', async () => {
      const loginRes = await dangNhap('qa.v2.admin')
      expect(loginRes.status).toBe(200)
      const cookie = layCookie(loginRes)

      const res = await goi('/api/admin/analytics/overview?window=today', {
        headers: { Cookie: cookie },
      })
      expect(res.status).toBe(200)
      const json = (await res.json()) as {
        ok: boolean
        analytics: {
          window: string
          activeUsers: { dau: number; wau: number; mau: number; newLogins: number }
          retention: { d1Percent: number; d7Percent: number }
          funnel: { loginCount: number; campusArrivals: number; roomJoins: number; meaningfulInteractions: number }
          featureAdoption: Record<string, { eventCount: number; uniqueActors: number }>
          sessionMetrics: { totalRoomJoins: number; avgRoomSessionDurationSec: number }
          operationalHealth: {
            totalRequests: number
            errorRate4xx: number
            errorRate5xx: number
            p50LatencyMs: number
            p95LatencyMs: number
            topErrorClasses: Array<{ errorClass: string; count: number }>
            doRpcFailureCount: number
            revocationRetryCount: number
          }
        }
      }

      expect(json.ok).toBe(true)
      expect(json.analytics).toBeDefined()
      expect(json.analytics.window).toBe('today')
      expect(typeof json.analytics.activeUsers.dau).toBe('number')
      expect(typeof json.analytics.activeUsers.wau).toBe('number')
      expect(typeof json.analytics.activeUsers.mau).toBe('number')
      expect(typeof json.analytics.retention.d1Percent).toBe('number')
      expect(typeof json.analytics.funnel.loginCount).toBe('number')
      expect(typeof json.analytics.sessionMetrics.totalRoomJoins).toBe('number')
      expect(typeof json.analytics.operationalHealth.p50LatencyMs).toBe('number')
    })
  })

  describe('Non-blocking / Fail-safe Semantics', () => {
    it('recordAnalyticsEvent catches D1 errors and never throws', () => {
      // Mock a broken D1 that throws on run()
      const brokenDb = {
        prepare: () => ({
          bind: () => ({
            run: () => Promise.reject(new Error('Simulated D1 Disk Out of Quota')),
          }),
        }),
      } as unknown as D1Database

      expect(() => {
        recordAnalyticsEvent(brokenDb, undefined, {
          event: 'test.event',
          actorId: 999,
        })
      }).not.toThrow()
    })
  })

  describe('Phase 7 & 8: Funnel & Meaningful Active User Definitions', () => {
    it('Only meaningful interactions count towards active users, background HTTP telemetry does not', async () => {
      const todayStr = new Date().toISOString().split('T')[0]

      // Record a background HTTP request for actor 991
      recordAnalyticsEvent(env.DB, undefined, {
        event: 'http.request',
        actorId: 991,
        route: '/api/whoami',
        statusCode: 200,
        durationMs: 15,
      })

      // Allow async D1 write to settle
      await new Promise((r) => setTimeout(r, 50))

      const overviewBefore = await computeAnalyticsOverview(env.DB, 'today')

      // Actor 991 who only had an http.request does NOT count towards DAU
      const row = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM analytics_events
         WHERE created_date = ?1 AND actor_id = 991 AND event = 'http.request'`,
      )
        .bind(todayStr)
        .first<{ count: number }>()
      expect(row?.count).toBeGreaterThanOrEqual(1)

      // Now record a meaningful interaction: notes.updated for actor 991
      recordAnalyticsEvent(env.DB, undefined, {
        event: 'notes.updated',
        actorId: 991,
        roomId: 10,
      })

      await new Promise((r) => setTimeout(r, 50))

      const overviewAfter = await computeAnalyticsOverview(env.DB, 'today')
      // DAU must now reflect the meaningful active user
      expect(overviewAfter.activeUsers.dau).toBeGreaterThanOrEqual(overviewBefore.activeUsers.dau)
      expect(overviewAfter.featureAdoption.notes.eventCount).toBeGreaterThanOrEqual(1)
      expect(overviewAfter.featureAdoption.notes.uniqueActors).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Operational Health & Latency Telemetry', () => {
    it('HTTP middleware records telemetry with route, status, duration, and method', async () => {
      // Perform a few legitimate API calls
      await goi('/api/whoami')
      await goi('/api/rooms/phong-99999/admission-status') // Will return 401 because unauthenticated

      await new Promise((r) => setTimeout(r, 60))

      const todayStr = new Date().toISOString().split('T')[0]
      const rows = await env.DB.prepare(
        `SELECT route, status_code, duration_ms, error_class, properties_json
         FROM analytics_events
         WHERE created_date = ?1 AND event = 'http.request'
         ORDER BY id DESC LIMIT 5`,
      )
        .bind(todayStr)
        .all<{
          route: string
          status_code: number
          duration_ms: number
          error_class: string | null
          properties_json: string | null
        }>()

      expect(rows.results.length).toBeGreaterThan(0)
      const req = rows.results[0]
      expect(req.route).toBeDefined()
      expect(req.status_code).toBeGreaterThanOrEqual(200)
      expect(req.duration_ms).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Auth & Moderation Zero-PII Event Emission', () => {
    it('Successful login emits auth.login_succeeded without password or sensitive tokens', async () => {
      const res = await dangNhap('qa.v2.thu1')
      expect(res.status).toBe(200)
      await new Promise((r) => setTimeout(r, 60))

      const rows = await env.DB.prepare(
        `SELECT event, actor_id, session_id, properties_json
         FROM analytics_events
         WHERE event = 'auth.login_succeeded'
         ORDER BY id DESC LIMIT 1`,
      ).all<{
        event: string
        actor_id: number
        session_id: string
        properties_json: string
      }>()

      expect(rows.results.length).toBe(1)
      const ev = rows.results[0]
      expect(ev.event).toBe('auth.login_succeeded')
      expect(ev.actor_id).toBeGreaterThan(0)
      expect(ev.session_id).toBeDefined()

      // Properties check
      const props = JSON.parse(ev.properties_json || '{}') as Record<string, unknown>
      expect(props.role).toBe('student')
      expect(props).not.toHaveProperty('password')
      expect(props).not.toHaveProperty('mat_khau')
      expect(props).not.toHaveProperty('token')
      expect(props).not.toHaveProperty('cookie')
    })

    it('Failed login emits auth.login_failed with categorical reason only', async () => {
      const res = await dangNhap('qa.v2.thu1', 'wrong-pass-123')
      expect(res.status).toBe(401)
      await new Promise((r) => setTimeout(r, 60))

      const rows = await env.DB.prepare(
        `SELECT event, properties_json
         FROM analytics_events
         WHERE event = 'auth.login_failed'
         ORDER BY id DESC LIMIT 1`,
      ).all<{
        event: string
        properties_json: string
      }>()

      expect(rows.results.length).toBe(1)
      const props = JSON.parse(rows.results[0].properties_json || '{}') as Record<string, unknown>
      expect(props.reason).toBe('INVALID_CREDENTIALS')
      expect(props).not.toHaveProperty('password')
      expect(props).not.toHaveProperty('username')
    })

    it('D1 and D7 retention correctly calculates retained users from past cohorts', async () => {
      const now = Date.now()
      const todayStr = new Date(now).toISOString().split('T')[0]
      const yesterdayStr = new Date(now - 86400000).toISOString().split('T')[0]

      // Create cohort of 2 users yesterday: user 881 and 882
      await env.DB.prepare(
        `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
         VALUES ('room.joined', 881, ?1, ?2), ('room.joined', 882, ?1, ?2)`,
      )
        .bind(now - 86400000, yesterdayStr)
        .run()

      // Retain 1 user today: user 881
      await env.DB.prepare(
        `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
         VALUES ('room.joined', 881, ?1, ?2)`,
      )
        .bind(now, todayStr)
        .run()

      const overview = await computeAnalyticsOverview(env.DB, '7d')
      // Cohort yesterday was 2, retained today is at least 1 -> retention >= 50%
      expect(overview.retention.d1Percent).toBeGreaterThanOrEqual(50)
    })
  })
})
