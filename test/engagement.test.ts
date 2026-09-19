import { env, exports } from 'cloudflare:workers'
import { describe, expect, it, beforeEach } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'
import {
  awardXp,
  updateStudyStreak,
  evaluateAchievements,
  ensureActiveWeeklyChallenge,
  contributeToClassChallenge,
  processLearningSessionSummaryEngagement,
  XP_SESSION_COMPLETE,
} from '../worker/lib/engagement'
import { studyDate } from '../shared/study-date'
import type { SessionSummary } from '../shared/protocol/room'

const goi = (duongDan: string, init?: RequestInit) => exports.default.fetch(`${GOC}${duongDan}`, init)
const layCookie = (res: Response) => (res.headers.get('Set-Cookie') ?? '').split(';')[0]

const dangNhap = (username: string, password = MAT_KHAU) =>
  goi('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

describe('Engagement Layer v1 — Comprehensive Functional & Security Test Suite', () => {
  const db = env.DB

  beforeEach(async () => {
    // Clear engagement tables before tests
    await db.prepare('DELETE FROM xp_ledger').run().catch(() => {})
    await db.prepare('DELETE FROM user_engagement_profile').run().catch(() => {})
    await db.prepare('DELETE FROM achievement_unlocks').run().catch(() => {})
    await db.prepare('DELETE FROM class_challenge_contributions').run().catch(() => {})
    await db.prepare('DELETE FROM class_challenges').run().catch(() => {})
    await db.prepare('DELETE FROM study_invitations').run().catch(() => {})
  })

  // ─────────────────────────────────────────────────────────────
  // 1. XP LEDGER & IDEMPOTENCY INVARIANTS
  // ─────────────────────────────────────────────────────────────
  describe('1. XP Ledger & Idempotent Rewarding', () => {
    it('awards XP on first attempt and updates user engagement profile', async () => {
      const accountId = 1
      const res = await awardXp(db, {
        accountId,
        amount: 20,
        reason: 'session_completed',
        sourceKey: 'session:test-session-1:acc:1',
        timestamp: Date.now(),
      })

      expect(res.awarded).toBe(true)
      expect(res.amountAwarded).toBe(20)
      expect(res.alreadyAwarded).toBe(false)
      expect(res.newTotalXp).toBe(20)

      const profile = await db
        .prepare('SELECT total_xp FROM user_engagement_profile WHERE account_id = ?1')
        .bind(accountId)
        .first<{ total_xp: number }>()

      expect(profile?.total_xp).toBe(20)
    })

    it('idempotency: replaying same sourceKey returns alreadyAwarded and never double-awards', async () => {
      const accountId = 1
      const sourceKey = 'session:replay-test:acc:1'
      const now = Date.now()

      const first = await awardXp(db, {
        accountId,
        amount: 20,
        reason: 'session_completed',
        sourceKey,
        timestamp: now,
      })
      expect(first.awarded).toBe(true)
      expect(first.amountAwarded).toBe(20)

      // Replay
      const second = await awardXp(db, {
        accountId,
        amount: 20,
        reason: 'session_completed',
        sourceKey,
        timestamp: now,
      })
      expect(second.awarded).toBe(false)
      expect(second.amountAwarded).toBe(0)
      expect(second.alreadyAwarded).toBe(true)
      expect(second.newTotalXp).toBe(20)

      // Ledger has exactly 1 entry
      const count = await db
        .prepare('SELECT COUNT(*) as c FROM xp_ledger WHERE source_key = ?1')
        .bind(sourceKey)
        .first<{ c: number }>()
      expect(count?.c).toBe(1)
    })

    it('enforces MAX_DAILY_XP (120 XP) cap strictly and never yields negative XP', async () => {
      const accountId = 2
      const todayTimestamp = Date.now()

      // Award 100 XP (5 sessions of 20 XP)
      for (let i = 1; i <= 5; i++) {
        await awardXp(db, {
          accountId,
          amount: 20,
          reason: 'session_completed',
          sourceKey: `cap-test:session-${i}:acc:2`,
          timestamp: todayTimestamp,
        })
      }

      // 6th session tries 20 XP, but only 20 remaining until 120 cap
      const sixth = await awardXp(db, {
        accountId,
        amount: 20,
        reason: 'session_completed',
        sourceKey: 'cap-test:session-6:acc:2',
        timestamp: todayTimestamp,
      })
      expect(sixth.awarded).toBe(true)
      expect(sixth.amountAwarded).toBe(20)
      expect(sixth.newTotalXp).toBe(120)

      // 7th session tries 20 XP, but already capped at 120
      const seventh = await awardXp(db, {
        accountId,
        amount: 20,
        reason: 'session_completed',
        sourceKey: 'cap-test:session-7:acc:2',
        timestamp: todayTimestamp,
      })
      expect(seventh.awarded).toBe(false)
      expect(seventh.amountAwarded).toBe(0)
      expect(seventh.capped).toBe(true)
      expect(seventh.newTotalXp).toBe(120)
    })

    it('concurrent award race condition is prevented by database unique constraint', async () => {
      const accountId = 3
      const sourceKey = 'race:test:session:1'
      const now = Date.now()

      // Fire 5 awards concurrently with exact same sourceKey
      const promises = Array.from({ length: 5 }).map(() =>
        awardXp(db, {
          accountId,
          amount: 20,
          reason: 'session_completed',
          sourceKey,
          timestamp: now,
        }),
      )

      const results = await Promise.all(promises)
      const awardedList = results.filter((r) => r.awarded)
      expect(awardedList.length).toBe(1)

      const profile = await db
        .prepare('SELECT total_xp FROM user_engagement_profile WHERE account_id = ?1')
        .bind(accountId)
        .first<{ total_xp: number }>()
      expect(profile?.total_xp).toBe(20)
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 2. STUDY STREAK DETERMINISM & BOUNDARIES
  // ─────────────────────────────────────────────────────────────
  describe('2. Study Streak Calculation & Day Boundaries', () => {
    it('10 meaningful study activities on the same day count as exactly 1 streak day', async () => {
      const accountId = 4
      const baseTime = Date.UTC(2026, 8, 19, 3, 0, 0) // 10:00 AM UTC+7

      for (let i = 0; i < 10; i++) {
        const res = await updateStudyStreak(db, accountId, baseTime + i * 60_000)
        expect(res.currentStreak).toBe(1)
      }

      const profile = await db
        .prepare('SELECT current_streak, longest_streak FROM user_engagement_profile WHERE account_id = ?1')
        .bind(accountId)
        .first<{ current_streak: number; longest_streak: number }>()

      expect(profile?.current_streak).toBe(1)
      expect(profile?.longest_streak).toBe(1)
    })

    it('activities across midnight boundary in Asia/Ho_Chi_Minh advance streak to 2', async () => {
      const accountId = 5
      // 2026-09-19 23:55:00 UTC+7 (16:55 UTC)
      const day1 = Date.UTC(2026, 8, 19, 16, 55, 0)
      // 2026-09-20 00:05:00 UTC+7 (17:05 UTC)
      const day2 = Date.UTC(2026, 8, 19, 17, 5, 0)

      const res1 = await updateStudyStreak(db, accountId, day1)
      expect(res1.currentStreak).toBe(1)

      const res2 = await updateStudyStreak(db, accountId, day2)
      expect(res2.currentStreak).toBe(2)
      expect(res2.extended).toBe(true)

      const profile = await db
        .prepare('SELECT current_streak, longest_streak FROM user_engagement_profile WHERE account_id = ?1')
        .bind(accountId)
        .first<{ current_streak: number; longest_streak: number }>()

      expect(profile?.current_streak).toBe(2)
      expect(profile?.longest_streak).toBe(2)
    })

    it('missing a day resets streak back to 1 without negative punishment', async () => {
      const accountId = 6
      const day1 = Date.UTC(2026, 8, 15, 3, 0, 0)
      const day2 = Date.UTC(2026, 8, 16, 3, 0, 0)
      // Skip Sep 17
      const day4 = Date.UTC(2026, 8, 18, 3, 0, 0)

      await updateStudyStreak(db, accountId, day1)
      const r2 = await updateStudyStreak(db, accountId, day2)
      expect(r2.currentStreak).toBe(2)

      const r4 = await updateStudyStreak(db, accountId, day4)
      expect(r4.currentStreak).toBe(1)
      expect(r4.longestStreak).toBe(2)
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 3. ACHIEVEMENTS SYSTEM & SAFE RECALCULATION
  // ─────────────────────────────────────────────────────────────
  describe('3. Achievements / Badges System', () => {
    it('unlocks first_session on first completed session', async () => {
      const accountId = 7
      const now = Date.now()

      // Seed 1 session XP in ledger
      await awardXp(db, {
        accountId,
        amount: 20,
        reason: 'session_completed',
        sourceKey: 'ach:test:1',
        timestamp: now,
      })

      const unlocked = await evaluateAchievements(db, accountId, now)
      expect(unlocked).toContain('first_session')

      // Unlock record exists in DB
      const unlockRow = await db
        .prepare('SELECT achievement_key FROM achievement_unlocks WHERE account_id = ?1 AND achievement_key = ?2')
        .bind(accountId, 'first_session')
        .first<{ achievement_key: string }>()
      expect(unlockRow?.achievement_key).toBe('first_session')

      // Evaluating again is idempotent and returns 0 new unlocks
      const secondEval = await evaluateAchievements(db, accountId, now)
      expect(secondEval.length).toBe(0)
    })

    it('unlocks streak_3 achievement when reaching 3 days streak', async () => {
      const accountId = 8
      const now = Date.now()

      // Seed profile with current_streak = 3
      await db
        .prepare(
          `INSERT INTO user_engagement_profile (account_id, current_streak, longest_streak, last_study_date, total_xp, updated_at)
           VALUES (?1, 3, 3, ?2, 60, ?3)`,
        )
        .bind(accountId, studyDate(now), now)
        .run()

      const unlocked = await evaluateAchievements(db, accountId, now)
      expect(unlocked).toContain('streak_3')
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 4. CLASS CHALLENGES & COLLABORATIVE PROGRESS
  // ─────────────────────────────────────────────────────────────
  describe('4. Class Challenges System', () => {
    it('creates active weekly challenge and advances progress on study session', async () => {
      const lopId = 1
      const now = Date.now()

      const challenge = await ensureActiveWeeklyChallenge(db, lopId, now)
      expect(challenge).toBeDefined()
      expect(challenge?.currentValue).toBe(0)

      // Contribute 1 session
      const res = await contributeToClassChallenge(db, {
        lopId,
        accountId: 1,
        targetType: 'sessions_count',
        sourceKey: 'challenge:session:1:acc:1',
        now,
      })

      expect(res.contributed).toBe(true)
      expect(res.newCurrentValue).toBe(1)

      // Replay with exact same sourceKey does not double increment
      const replay = await contributeToClassChallenge(db, {
        lopId,
        accountId: 1,
        targetType: 'sessions_count',
        sourceKey: 'challenge:session:1:acc:1',
        now,
      })

      expect(replay.contributed).toBe(false)
      expect(replay.alreadyContributed).toBe(true)
      expect(replay.newCurrentValue).toBe(1)
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 5. REST APIS, PRIVACY & AUTHORIZATION
  // ─────────────────────────────────────────────────────────────
  describe('5. REST APIs, RBAC & Privacy Invariants', () => {
    it('GET /api/engagement/me returns authenticated user engagement state', async () => {
      const loginRes = await dangNhap('qa.v2.thu1')
      expect(loginRes.status).toBe(200)
      const cookie = layCookie(loginRes)

      const res = await goi('/api/engagement/me', {
        headers: { Cookie: cookie },
      })
      expect(res.status).toBe(200)
      const data = (await res.json()) as { ok: boolean; profile: any }
      expect(data.ok).toBe(true)
      expect(data.profile).toHaveProperty('currentStreak')
      expect(data.profile).toHaveProperty('totalXp')
      expect(data.profile).toHaveProperty('unlockedAchievementsCount')
    })

    it('GET /api/engagement/leaderboard: Student querying another unauthorized class is rejected with 403', async () => {
      const loginRes = await dangNhap('qa.v2.thu1') // belongs to class 1
      const cookie = layCookie(loginRes)

      // Attempt to access class 999
      const res = await goi('/api/engagement/leaderboard?lopId=999', {
        headers: { Cookie: cookie },
      })
      expect(res.status).toBe(403)
      const data = (await res.json()) as { ok: boolean; loi: string }
      expect(data.ok).toBe(false)
      expect(data.loi).toContain('quyền xem bảng xếp hạng lớp của mình')
    })

    it('GET /api/engagement/friends/activity: Never leaks private room passwords, notes, or whiteboard content', async () => {
      const loginRes = await dangNhap('qa.v2.thu1')
      const cookie = layCookie(loginRes)

      const res = await goi('/api/engagement/friends/activity', {
        headers: { Cookie: cookie },
      })
      expect(res.status).toBe(200)
      const data = (await res.json()) as { ok: boolean; activities: any[] }
      expect(data.ok).toBe(true)

      // Verify privacy guarantee across all returned friend records
      for (const item of data.activities) {
        expect(item).not.toHaveProperty('password')
        expect(item).not.toHaveProperty('notes')
        expect(item).not.toHaveProperty('roomPassword')
        expect(item).not.toHaveProperty('content')
        expect(item).not.toHaveProperty('whiteboard')
        expect(item).toHaveProperty('displayName')
        expect(item).toHaveProperty('status')
      }
    })

    it('POST /api/engagement/invites: Enforces 5-minute cooldown between same sender and recipient', async () => {
      const loginRes = await dangNhap('qa.v2.thu1')
      const cookie = layCookie(loginRes)
      const who1 = ((await (await goi('/api/whoami', { headers: { Cookie: cookie } })).json()) as any)
      const senderId = who1.accountId

      const loginRes2 = await dangNhap('qa.v2.thu2')
      const who2 = ((await (await goi('/api/whoami', { headers: { Cookie: layCookie(loginRes2) } })).json()) as any)
      const recipientId = who2.accountId

      // Ensure friendship exists for test
      const low = Math.min(senderId, recipientId)
      const high = Math.max(senderId, recipientId)
      await db.prepare('INSERT OR IGNORE INTO friendships (account_low_id, account_high_id, created_at) VALUES (?1, ?2, ?3)')
        .bind(low, high, Date.now())
        .run()

      // First invite
      const res1 = await goi('/api/engagement/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ recipientId, roomId: 1, roomTitle: 'Phòng Toán 10' }),
      })
      expect(res1.status).toBe(200)

      // Second immediate invite to same friend -> 429 Cooldown
      const res2 = await goi('/api/engagement/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ recipientId, roomId: 1, roomTitle: 'Phòng Toán 10' }),
      })
      expect(res2.status).toBe(429)
      const data2 = (await res2.json()) as { ok: boolean; loi: string }
      expect(data2.loi).toContain('chờ ít phút')
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 6. LEARNING SESSION INTEGRATION REPLAY SAFETY
  // ─────────────────────────────────────────────────────────────
  describe('6. Learning Session Summary Engagement Processing', () => {
    it('awards session completion XP, streak, and challenge progress idempotently across retries', async () => {
      const sessionId = 'session-integ-test-123'
      const now = Date.now()

      const mockSummary: SessionSummary = {
        sessionId,
        roomId: 1,
        startedAt: now - 1800_000,
        endedAt: now,
        durationSeconds: 1800,
        goal: 'Ôn tập Giải tích chương 1',
        taskCount: 3,
        taskCompletionRates: { 1: 100 },
        pollResults: [],
        activeMembers: ['acc:1'],
      }

      // First run
      await processLearningSessionSummaryEngagement(db, mockSummary, env.ANALYTICS_DB)

      const profile1 = await db
        .prepare('SELECT total_xp, current_streak FROM user_engagement_profile WHERE account_id = 1')
        .first<{ total_xp: number; current_streak: number }>()
      expect(profile1?.total_xp).toBeGreaterThanOrEqual(XP_SESSION_COMPLETE)
      expect(profile1?.current_streak).toBe(1)

      // Replay run with exact same summary (simulating RoomDO retry / outbox replay)
      await processLearningSessionSummaryEngagement(db, mockSummary, env.ANALYTICS_DB)

      const profile2 = await db
        .prepare('SELECT total_xp, current_streak FROM user_engagement_profile WHERE account_id = 1')
        .first<{ total_xp: number; current_streak: number }>()
      expect(profile2?.total_xp).toBe(profile1?.total_xp) // Exactly unchanged on replay!
      expect(profile2?.current_streak).toBe(1)
    })
  })
})
