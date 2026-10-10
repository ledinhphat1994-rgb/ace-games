import { env, exports } from 'cloudflare:workers'
import { describe, expect, it, beforeEach } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'

const goi = (duongDan: string, init?: RequestInit) => exports.default.fetch(`${GOC}${duongDan}`, init)
const layCookie = (res: Response) => (res.headers.get('Set-Cookie') ?? '').split(';')[0]

const dangNhap = (username: string, password = MAT_KHAU) =>
  goi('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

describe('Daily Check-in Feature', () => {
  const db = env.DB

  beforeEach(async () => {
    await db.prepare('DELETE FROM xp_ledger').run().catch(() => {})
    await db.prepare('DELETE FROM user_engagement_profile').run().catch(() => {})
    await db.prepare('DELETE FROM achievement_unlocks').run().catch(() => {})
    await db.prepare('DELETE FROM study_activity_days').run().catch(() => {})
    await db.prepare('DELETE FROM notifications').run().catch(() => {})
  })

  it('1. GET /api/engagement/checkin rejects unauthenticated request with 401', async () => {
    const res = await goi('/api/engagement/checkin')
    expect(res.status).toBe(401)
  })

  it('2. GET /api/engagement/checkin returns status with canCheckIn = true for student', async () => {
    const loginRes = await dangNhap('qa.v2.thu1')
    expect(loginRes.status).toBe(200)
    const cookie = layCookie(loginRes)

    const res = await goi('/api/engagement/checkin', {
      headers: { Cookie: cookie },
    })
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.ok).toBe(true)
    expect(data.canCheckIn).toBe(true)
    expect(data.currentStreak).toBe(0)
    expect(data.cycleDay).toBe(1)
    expect(data.rewardXp).toBe(15)
    expect(Array.isArray(data.rewards)).toBe(true)
  })

  it('3. POST /api/engagement/checkin claims reward, awards XP, and increments streak', async () => {
    const loginRes = await dangNhap('qa.v2.thu1')
    const cookie = layCookie(loginRes)

    const claimRes = await goi('/api/engagement/checkin', {
      method: 'POST',
      headers: { Cookie: cookie },
    })
    expect(claimRes.status).toBe(200)
    const claimData = (await claimRes.json()) as any
    expect(claimData.ok).toBe(true)
    expect(claimData.rewardXp).toBe(15)
    expect(claimData.currentStreak).toBe(1)
    expect(claimData.totalXp).toBeGreaterThanOrEqual(15)

    // Verify xp_ledger record
    const ledgerRow = await db
      .prepare("SELECT amount, reason FROM xp_ledger WHERE reason = 'Điểm danh hằng ngày'")
      .first<{ amount: number; reason: string }>()
    expect(ledgerRow).toBeDefined()
    expect(ledgerRow?.amount).toBe(15)

    // Verify notification was generated
    const notifRow = await db
      .prepare("SELECT title FROM notifications WHERE title = 'Điểm danh hằng ngày'")
      .first<{ title: string }>()
    expect(notifRow).toBeDefined()

    // Subsequent GET /checkin shows canCheckIn = false
    const statusRes = await goi('/api/engagement/checkin', {
      headers: { Cookie: cookie },
    })
    expect(statusRes.status).toBe(200)
    const statusData = (await statusRes.json()) as any
    expect(statusData.canCheckIn).toBe(false)
    expect(statusData.claimedAt).toBeGreaterThan(0)
  })

  it('4. POST /api/engagement/checkin idempotently rejects duplicate claim on same day', async () => {
    const loginRes = await dangNhap('qa.v2.thu1')
    const cookie = layCookie(loginRes)

    // First claim succeeds
    const firstRes = await goi('/api/engagement/checkin', {
      method: 'POST',
      headers: { Cookie: cookie },
    })
    expect(firstRes.status).toBe(200)

    // Second claim fails
    const secondRes = await goi('/api/engagement/checkin', {
      method: 'POST',
      headers: { Cookie: cookie },
    })
    expect(secondRes.status).toBe(400)
    const secondData = (await secondRes.json()) as any
    expect(secondData.ok).toBe(false)
    expect(secondData.alreadyClaimed).toBe(true)
  })
})
