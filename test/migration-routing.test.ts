import { exports } from 'cloudflare:workers'
import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'

describe('Milestone M0.1.1: Migration Routing & Retention Maintenance Suite', () => {
  it('1. Migration Routing Invariant: migrations/ contains ZERO analytics files', () => {
    const files = (env as any).CORE_MIGRATION_FILES as string[]
    expect(Array.isArray(files)).toBe(true)
    const analyticsFiles = files.filter((f) => f.toLowerCase().includes('analytics'))
    expect(analyticsFiles).toEqual([])
  })

  it('2. Migration Routing Invariant: analytics-migrations/ contains dedicated analytics schema', () => {
    const files = (env as any).ANALYTICS_MIGRATION_FILES as string[]
    expect(Array.isArray(files)).toBe(true)
    expect(files).toContain('0001_product_analytics_and_observability.sql')
  })

  it('3. Database Isolation Invariant: env.DB has NO analytics_events table', async () => {
    const tableInCore = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='analytics_events'",
    ).first<{ name: string }>()
    expect(tableInCore).toBeNull()
  })

  it('4. Database Isolation Invariant: env.ANALYTICS_DB contains analytics_events table', async () => {
    expect(env.ANALYTICS_DB).toBeDefined()
    const tableInAnalytics = await env.ANALYTICS_DB!.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='analytics_events'",
    ).first<{ name: string }>()
    expect(tableInAnalytics).toBeDefined()
    expect(tableInAnalytics?.name).toBe('analytics_events')
  })

  it('5. Retention Pruning API: RBAC Enforcement (401 unauth, 403 student/teacher, 200 admin)', async () => {
    // 5.1. Unauthenticated -> 401
    const unauthRes = await exports.default.fetch(`${GOC}/api/admin/analytics/prune`, {
      method: 'POST',
    })
    expect(unauthRes.status).toBe(401)

    // Helper login
    const login = async (username: string) => {
      const res = await exports.default.fetch(`${GOC}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: MAT_KHAU }),
      })
      const cookie = (res.headers.get('Set-Cookie') ?? '').split(';')[0]
      return cookie
    }

    // 5.2. Student -> 403
    const studentCookie = await login('qa.v2.thu1')
    const studentRes = await exports.default.fetch(`${GOC}/api/admin/analytics/prune`, {
      method: 'POST',
      headers: { Cookie: studentCookie },
    })
    expect(studentRes.status).toBe(403)

    // 5.3. Ordinary Teacher -> 403
    const teacherCookie = await login('qa.v2.gv')
    const teacherRes = await exports.default.fetch(`${GOC}/api/admin/analytics/prune`, {
      method: 'POST',
      headers: { Cookie: teacherCookie },
    })
    expect(teacherRes.status).toBe(403)

    // 5.4. School Admin -> 200 OK
    const adminCookie = await login('qa.v2.admin')
    const adminRes = await exports.default.fetch(`${GOC}/api/admin/analytics/prune`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
    })
    expect(adminRes.status).toBe(200)
    const json = (await adminRes.json()) as { ok: boolean; deletedCount: number; retentionDays: number }
    expect(json.ok).toBe(true)
    expect(typeof json.deletedCount).toBe('number')
    expect(json.retentionDays).toBe(60)
  })

  it('6. Retention Pruning Execution: Deletes expired (>60d) and preserves fresh (<60d)', async () => {
    const now = Date.now()
    const eightyDaysAgo = now - 80 * 86400 * 1000
    const tenDaysAgo = now - 10 * 86400 * 1000

    // Seed expired event
    await env.ANALYTICS_DB!.prepare(
      `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
       VALUES ('room.joined', 991, ?1, '2026-06-01')`,
    ).bind(eightyDaysAgo).run()

    // Seed fresh event
    await env.ANALYTICS_DB!.prepare(
      `INSERT INTO analytics_events (event, actor_id, created_at, created_date)
       VALUES ('chat.message_sent', 992, ?1, '2026-09-09')`,
    ).bind(tenDaysAgo).run()

    // Execute admin prune API
    const adminRes = await exports.default.fetch(`${GOC}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'qa.v2.admin', password: MAT_KHAU }),
    })
    const adminCookie = (adminRes.headers.get('Set-Cookie') ?? '').split(';')[0]

    const pruneRes = await exports.default.fetch(`${GOC}/api/admin/analytics/prune`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
    })
    expect(pruneRes.status).toBe(200)
    const result = (await pruneRes.json()) as { ok: boolean; deletedCount: number }
    expect(result.deletedCount).toBeGreaterThanOrEqual(1)

    // Verify expired event is deleted
    const expiredRecord = await env.ANALYTICS_DB!.prepare(
      'SELECT id FROM analytics_events WHERE actor_id = 991',
    ).first()
    expect(expiredRecord).toBeNull()

    // Verify fresh event is preserved
    const freshRecord = await env.ANALYTICS_DB!.prepare(
      'SELECT id FROM analytics_events WHERE actor_id = 992',
    ).first()
    expect(freshRecord).not.toBeNull()
  })
})
