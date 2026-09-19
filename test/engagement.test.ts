import { env, exports } from 'cloudflare:workers'
import { describe, expect, it, beforeEach } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'
import {
  awardXp,
  updateStudyStreak,
  reconcileStudyStreak,
  recordStudyActivityDay,
  evaluateAchievements,
  unlockAchievement,
  ensureActiveWeeklyChallenge,
  contributeToClassChallenge,
  reconcileChallengeCompletionRewards,
  reconcileChallengeProgress,
  processLearningSessionSummaryEngagement,
  reconcileProfileXpFromLedger,
  MAX_DAILY_XP,
  XP_SESSION_COMPLETE,
} from '../worker/lib/engagement'
import { SCHOOL_TIMEZONE, studyDate, studyWeek } from '../shared/study-date'
import type { SessionSummary } from '../shared/protocol/room'
import type { SessionEngagementFacts } from '../shared/protocol/engagement'

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
    await db.prepare('DELETE FROM study_activity_days').run().catch(() => {})

    // Ensure valid room 1 exists in D1
    await db
      .prepare(
        `INSERT OR IGNORE INTO phong
         (id, loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai)
         VALUES (1, 'video', 'Phòng Toán 10', 'truong', NULL, 'acc:1', 'Host', 'public', 20, 'mo')`,
      )
      .run()
      .catch(() => {})

    // Ensure dedicated test accounts exist in tai_khoan_campus for foreign key constraints
    for (const id of [101, 102, 103, 104, 105, 106, 107, 201, 202, 210, 211, 301, 302, 303, 304, 305]) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO tai_khoan_campus
           (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, lop_id, dang_hoat_dong)
           VALUES (?1, ?2, ?3, 'dummy_hash', 'dummy_salt', 100000, 'student', 1, 1)`,
        )
        .bind(id, `test_acc_${id}`, `Test User ${id}`)
        .run()
        .catch(() => {})
    }
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

    it('strict daily cap: seed at 110 XP, fire 3 concurrent +20 XP distinct sources -> final XP strictly 120', async () => {
      const accountId = 101
      const now = Date.now()

      // Seed profile & ledger to 110 XP
      await awardXp(db, {
        accountId,
        amount: 110,
        reason: 'seed_progress',
        sourceKey: `seed:${accountId}`,
        timestamp: now,
      })

      // Fire 3 concurrent awards with distinct source keys
      const [resA, resB, resC] = await Promise.all([
        awardXp(db, { accountId, amount: 20, reason: 'concurrent_A', sourceKey: `conc:A:${accountId}`, timestamp: now }),
        awardXp(db, { accountId, amount: 20, reason: 'concurrent_B', sourceKey: `conc:B:${accountId}`, timestamp: now }),
        awardXp(db, { accountId, amount: 20, reason: 'concurrent_C', sourceKey: `conc:C:${accountId}`, timestamp: now }),
      ])

      const today = studyDate(now, SCHOOL_TIMEZONE)
      const ledgerSumRow = await db
        .prepare('SELECT SUM(amount) as total FROM xp_ledger WHERE account_id = ?1 AND study_date = ?2')
        .bind(accountId, today)
        .first<{ total: number }>()

      // STRICT INVARIANT: Total daily XP must NEVER exceed MAX_DAILY_XP (120)
      expect(ledgerSumRow?.total).toBe(MAX_DAILY_XP)
      expect(ledgerSumRow?.total).toBe(120)

      const profile = await db
        .prepare('SELECT total_xp FROM user_engagement_profile WHERE account_id = ?1')
        .bind(accountId)
        .first<{ total_xp: number }>()
      expect(profile?.total_xp).toBe(120)

      // Total awarded across the 3 concurrent requests must equal exactly 10 (the remaining quota)
      const totalAwarded = resA.amountAwarded + resB.amountAwarded + resC.amountAwarded
      expect(totalAwarded).toBe(10)
    })

    it('achievement and challenge bonus cannot bypass daily cap when cap is reached', async () => {
      const accountId = 102
      const now = Date.now()

      // Fill daily quota to 120 XP
      await awardXp(db, {
        accountId,
        amount: MAX_DAILY_XP,
        reason: 'fill_cap',
        sourceKey: `cap:full:${accountId}`,
        timestamp: now,
      })

      // Try unlock first_session achievement (catalog reward: 15 XP)
      const achRes = await unlockAchievement(db, accountId, 'first_session', `ach_test:${accountId}`, now)
      expect(achRes.unlocked).toBe(true)
      expect(achRes.rewardResult?.awarded).toBe(false)
      expect(achRes.rewardResult?.amountAwarded).toBe(0)
      expect(achRes.rewardResult?.capped).toBe(true)

      // Verify ledger sum remains strictly capped at 120
      const today = studyDate(now, SCHOOL_TIMEZONE)
      const sum = await db
        .prepare('SELECT SUM(amount) as s FROM xp_ledger WHERE account_id = ?1 AND study_date = ?2')
        .bind(accountId, today)
        .first<{ s: number }>()
      expect(sum?.s).toBe(MAX_DAILY_XP)
    })

    it('reconciles profile total_xp deterministically to SUM(xp_ledger.amount) after injected divergence', async () => {
      const accountId = 103
      const now = Date.now()

      await awardXp(db, {
        accountId,
        amount: 35,
        reason: 'test_ledger_source',
        sourceKey: `reconcile:1:${accountId}`,
        timestamp: now,
      })

      // Manually corrupt profile total_xp to simulate desync/injected failure
      await db
        .prepare('UPDATE user_engagement_profile SET total_xp = 9999 WHERE account_id = ?1')
        .bind(accountId)
        .run()

      const reconciledXp = await reconcileProfileXpFromLedger(db, accountId, now)
      expect(reconciledXp).toBe(35)

      const profile = await db
        .prepare('SELECT total_xp FROM user_engagement_profile WHERE account_id = ?1')
        .bind(accountId)
        .first<{ total_xp: number }>()
      expect(profile?.total_xp).toBe(35)
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

    it('deterministic streak: chronological Sep 19 -> Sep 20 -> Sep 21 yields streak 3', async () => {
      const accountId = 301
      const t1 = Date.UTC(2026, 8, 19, 3, 0, 0)
      const t2 = Date.UTC(2026, 8, 20, 3, 0, 0)
      const t3 = Date.UTC(2026, 8, 21, 3, 0, 0)

      await updateStudyStreak(db, accountId, t1)
      await updateStudyStreak(db, accountId, t2)
      const r3 = await updateStudyStreak(db, accountId, t3)

      expect(r3.currentStreak).toBe(3)
      expect(r3.longestStreak).toBe(3)

      const profile = await db
        .prepare('SELECT current_streak, longest_streak, last_study_date FROM user_engagement_profile WHERE account_id = ?1')
        .bind(accountId)
        .first<{ current_streak: number; longest_streak: number; last_study_date: string }>()

      expect(profile?.current_streak).toBe(3)
      expect(profile?.longest_streak).toBe(3)
      expect(profile?.last_study_date).toBe('2026-09-21')
    })

    it('deterministic streak: out-of-order delivery (Sep 20, Sep 19, Sep 21) converges to streak 3', async () => {
      const accountId = 302
      const tSep20 = Date.UTC(2026, 8, 20, 3, 0, 0)
      const tSep19 = Date.UTC(2026, 8, 19, 3, 0, 0)
      const tSep21 = Date.UTC(2026, 8, 21, 3, 0, 0)

      // Arrives out of order: Sep 20 first, then delayed Sep 19, then Sep 21
      await updateStudyStreak(db, accountId, tSep20)
      await updateStudyStreak(db, accountId, tSep19)
      const finalRes = await updateStudyStreak(db, accountId, tSep21)

      expect(finalRes.currentStreak).toBe(3)
      expect(finalRes.longestStreak).toBe(3)

      const profile = await db
        .prepare('SELECT current_streak, longest_streak, last_study_date FROM user_engagement_profile WHERE account_id = ?1')
        .bind(accountId)
        .first<{ current_streak: number; longest_streak: number; last_study_date: string }>()

      expect(profile?.current_streak).toBe(3)
      expect(profile?.longest_streak).toBe(3)
      expect(profile?.last_study_date).toBe('2026-09-21')
    })

    it('deterministic streak: delayed old retry does not regress current streak or last_study_date', async () => {
      const accountId = 303
      const tSep19 = Date.UTC(2026, 8, 19, 3, 0, 0)
      const tSep20 = Date.UTC(2026, 8, 20, 3, 0, 0)
      const tSep21 = Date.UTC(2026, 8, 21, 3, 0, 0)

      // Current state reaches Sep 21 with streak 3
      await updateStudyStreak(db, accountId, tSep19)
      await updateStudyStreak(db, accountId, tSep20)
      await updateStudyStreak(db, accountId, tSep21)

      // Outbox retries an old Sep 19 event
      const retryOld = await updateStudyStreak(db, accountId, tSep19)

      expect(retryOld.currentStreak).toBe(3)
      expect(retryOld.longestStreak).toBe(3)
      expect(retryOld.alreadyRecordedToday).toBe(true)

      const profile = await db
        .prepare('SELECT current_streak, longest_streak, last_study_date FROM user_engagement_profile WHERE account_id = ?1')
        .bind(accountId)
        .first<{ current_streak: number; longest_streak: number; last_study_date: string }>()

      expect(profile?.current_streak).toBe(3)
      expect(profile?.longest_streak).toBe(3)
      expect(profile?.last_study_date).toBe('2026-09-21')
    })

    it('deterministic streak: duplicate sessions on same study day count as exactly one study day', async () => {
      const accountId = 304
      const t1 = Date.UTC(2026, 8, 19, 2, 0, 0)
      const t2 = Date.UTC(2026, 8, 19, 4, 0, 0)
      const t3 = Date.UTC(2026, 8, 19, 8, 0, 0)

      await updateStudyStreak(db, accountId, t1, 'session:1')
      await updateStudyStreak(db, accountId, t2, 'session:2')
      await updateStudyStreak(db, accountId, t3, 'session:3')

      const count = await db
        .prepare('SELECT COUNT(*) as c FROM study_activity_days WHERE account_id = ?1')
        .bind(accountId)
        .first<{ c: number }>()

      expect(count?.c).toBe(1)

      const profile = await db
        .prepare('SELECT current_streak, longest_streak FROM user_engagement_profile WHERE account_id = ?1')
        .bind(accountId)
        .first<{ current_streak: number; longest_streak: number }>()

      expect(profile?.current_streak).toBe(1)
      expect(profile?.longest_streak).toBe(1)
    })

    it('deterministic streak: gap day (Sep 19, Sep 20, Sep 22) yields current streak 1, longest streak 2', async () => {
      const accountId = 305
      const tSep19 = Date.UTC(2026, 8, 19, 3, 0, 0)
      const tSep20 = Date.UTC(2026, 8, 20, 3, 0, 0)
      const tSep22 = Date.UTC(2026, 8, 22, 3, 0, 0) // Sep 21 missed!

      await updateStudyStreak(db, accountId, tSep19)
      await updateStudyStreak(db, accountId, tSep20)
      const r3 = await updateStudyStreak(db, accountId, tSep22)

      expect(r3.currentStreak).toBe(1)
      expect(r3.longestStreak).toBe(2)

      const profile = await db
        .prepare('SELECT current_streak, longest_streak, last_study_date FROM user_engagement_profile WHERE account_id = ?1')
        .bind(accountId)
        .first<{ current_streak: number; longest_streak: number; last_study_date: string }>()

      expect(profile?.current_streak).toBe(1)
      expect(profile?.longest_streak).toBe(2)
      expect(profile?.last_study_date).toBe('2026-09-22')
    })

    it('directly tests recordStudyActivityDay and reconcileStudyStreak helpers', async () => {
      const accountId = 301
      const isNew = await recordStudyActivityDay(db, accountId, '2026-09-19', 'test_key', Date.now())
      expect(typeof isNew).toBe('boolean')
      const streak = await reconcileStudyStreak(db, accountId, Date.now())
      expect(streak.currentStreak).toBeGreaterThanOrEqual(1)
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

    it('study_together unlocks on multi-participant session and awards +15 XP consistently', async () => {
      const accountId1 = 104
      const accountId2 = 105
      const now = Date.now()
      const sessionId = 'session-multi-participant-test'

      const mockSummary: SessionSummary = {
        sessionId,
        roomId: 1,
        startedAt: now - 1800_000,
        endedAt: now,
        durationSeconds: 1800,
        goal: 'Học nhóm đa người',
        taskCount: 1,
        taskCompletionRates: {},
        pollResults: [],
        activeMembers: [`acc:${accountId1}`, `acc:${accountId2}`],
      }

      await processLearningSessionSummaryEngagement(db, mockSummary)

      // Verify study_together unlocked for both
      const unlock1 = await db
        .prepare('SELECT achievement_key FROM achievement_unlocks WHERE account_id = ?1 AND achievement_key = ?2')
        .bind(accountId1, 'study_together')
        .first<{ achievement_key: string }>()
      expect(unlock1?.achievement_key).toBe('study_together')

      // Verify study_together reward +15 XP was recorded in ledger
      const reward1 = await db
        .prepare('SELECT amount FROM xp_ledger WHERE account_id = ?1 AND reason = ?2')
        .bind(accountId1, 'achievement_study_together')
        .first<{ amount: number }>()
      expect(reward1?.amount).toBe(15)

      // Total XP for accountId1: 20 (session) + 15 (first_session) + 30 (challenge_contributor) + 15 (study_together) = 80 XP
      const profile = await db
        .prepare('SELECT total_xp FROM user_engagement_profile WHERE account_id = ?1')
        .bind(accountId1)
        .first<{ total_xp: number }>()
      expect(profile?.total_xp).toBe(80)

      // Replay does not duplicate study_together badge or reward
      await processLearningSessionSummaryEngagement(db, mockSummary)

      const rewardCount = await db
        .prepare('SELECT COUNT(*) as cnt FROM xp_ledger WHERE account_id = ?1 AND reason = ?2')
        .bind(accountId1, 'achievement_study_together')
        .first<{ cnt: number }>()
      expect(rewardCount?.cnt).toBe(1)
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

    it('class challenge reconciles current_value from authoritative contributions even after prior failure/desync', async () => {
      const lopId = 1
      const now = Date.now()
      const challenge = await ensureActiveWeeklyChallenge(db, lopId, now)
      expect(challenge).toBeDefined()

      // Seed 2 contributions directly
      await db
        .prepare(
          `INSERT INTO class_challenge_contributions (challenge_id, account_id, source_key, contribution_value, created_at)
           VALUES (?1, 1, 'src-desync-1', 1, ?2), (?1, 2, 'src-desync-2', 1, ?2)`,
        )
        .bind(challenge!.id, now)
        .run()

      // Artificially desync challenge counter to 0 (simulating interrupted write)
      await db.prepare('UPDATE class_challenges SET current_value = 0 WHERE id = ?1').bind(challenge!.id).run()

      // Contribute via normal flow (even with already-contributed source key)
      const res = await contributeToClassChallenge(db, {
        lopId,
        accountId: 1,
        targetType: 'sessions_count',
        sourceKey: 'src-desync-1',
        now,
      })

      // Counter is repaired to 2 based on authoritative aggregate
      expect(res.newCurrentValue).toBe(2)

      const chRow = await db.prepare('SELECT current_value FROM class_challenges WHERE id = ?1').bind(challenge!.id).first<{ current_value: number }>()
      expect(chRow?.current_value).toBe(2)
    })

    it('weekly challenge canonical Monday -> Sunday date range (Wednesday-created represents full week)', async () => {
      // 2026-09-16 is a Wednesday (ISO week 2026-W38: Monday 2026-09-14 -> Sunday 2026-09-20)
      const wednesdayTs = Date.UTC(2026, 8, 16, 10, 0, 0)
      const challenge = await ensureActiveWeeklyChallenge(db, 2, wednesdayTs)

      expect(challenge).toBeDefined()
      expect(challenge?.startDate).toBe('2026-09-14') // Monday
      expect(challenge?.endDate).toBe('2026-09-20') // Sunday
    })

    it('directly tests reconcileChallengeProgress and reconcileChallengeCompletionRewards', async () => {
      const lopId = 1
      const now = Date.now()
      const challenge = await ensureActiveWeeklyChallenge(db, lopId, now)
      expect(challenge).toBeDefined()
      if (challenge) {
        const progress = await reconcileChallengeProgress(db, challenge.id, now)
        expect(progress.currentValue).toBeDefined()
        await reconcileChallengeCompletionRewards(db, challenge.id, 30, now)
      }
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

    it('POST /api/engagement/invites: Rejects invite for nonexistent room with 404', async () => {
      const loginRes = await dangNhap('qa.v2.thu1')
      const cookie = layCookie(loginRes)

      const res = await goi('/api/engagement/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ recipientId: 2, roomId: 999999, roomTitle: 'Tên Phòng Giả' }),
      })
      expect(res.status).toBe(404)
      const data = (await res.json()) as { ok: boolean; loi: string }
      expect(data.loi).toContain('không tồn tại')
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

    it('awards authoritative task completions (+5 XP) and unlocks task_finisher_5 after 5 completions', async () => {
      const accountId = 106
      const now = Date.now()

      const facts: SessionEngagementFacts = {
        participantAccountIds: [accountId],
        taskCompletions: [
          { taskId: 'task-1', accountId },
          { taskId: 'task-2', accountId },
          { taskId: 'task-3', accountId },
          { taskId: 'task-4', accountId },
          { taskId: 'task-5', accountId },
        ],
      }

      const mockSummary: SessionSummary = {
        sessionId: 'session-tasks-test',
        roomId: 1,
        startedAt: now - 1800_000,
        endedAt: now,
        durationSeconds: 1800,
        goal: 'Hoàn thành 5 tasks',
        taskCount: 5,
        taskCompletionRates: {},
        pollResults: [],
        activeMembers: [`acc:${accountId}`],
      }

      await processLearningSessionSummaryEngagement(db, mockSummary, undefined, undefined, facts)

      // Ledger has 5 task_completed rows of 5 XP each
      const taskRows = await db
        .prepare("SELECT COUNT(*) as c, SUM(amount) as s FROM xp_ledger WHERE account_id = ?1 AND reason = 'task_completed'")
        .bind(accountId)
        .first<{ c: number; s: number }>()
      expect(taskRows?.c).toBe(5)
      expect(taskRows?.s).toBe(25) // 5 * 5 XP

      // task_finisher_5 achievement is unlocked!
      const ach = await db
        .prepare("SELECT achievement_key FROM achievement_unlocks WHERE account_id = ?1 AND achievement_key = 'task_finisher_5'")
        .bind(accountId)
        .first<{ achievement_key: string }>()
      expect(ach?.achievement_key).toBe('task_finisher_5')

      // Replaying the session does not duplicate task XP
      await processLearningSessionSummaryEngagement(db, mockSummary, undefined, undefined, facts)
      const taskRowsAfter = await db
        .prepare("SELECT COUNT(*) as c FROM xp_ledger WHERE account_id = ?1 AND reason = 'task_completed'")
        .bind(accountId)
        .first<{ c: number }>()
      expect(taskRowsAfter?.c).toBe(5)
    })

    it('awards authoritative poll participation (+2 XP) and unlocks poll_voter_3 after 3 votes', async () => {
      const accountId = 107
      const now = Date.now()

      const facts: SessionEngagementFacts = {
        participantAccountIds: [accountId],
        pollVotes: [
          { pollId: 'poll-1', accountId },
          { pollId: 'poll-2', accountId },
          { pollId: 'poll-3', accountId },
        ],
      }

      const mockSummary: SessionSummary = {
        sessionId: 'session-polls-test',
        roomId: 1,
        startedAt: now - 1800_000,
        endedAt: now,
        durationSeconds: 1800,
        goal: 'Bình chọn 3 polls',
        taskCount: 0,
        taskCompletionRates: {},
        pollResults: [],
        activeMembers: [`acc:${accountId}`],
      }

      await processLearningSessionSummaryEngagement(db, mockSummary, undefined, undefined, facts)

      const pollRows = await db
        .prepare("SELECT COUNT(*) as c, SUM(amount) as s FROM xp_ledger WHERE account_id = ?1 AND reason = 'poll_voted'")
        .bind(accountId)
        .first<{ c: number; s: number }>()
      expect(pollRows?.c).toBe(3)
      expect(pollRows?.s).toBe(6) // 3 * 2 XP

      // poll_voter_3 achievement is unlocked!
      const ach = await db
        .prepare("SELECT achievement_key FROM achievement_unlocks WHERE account_id = ?1 AND achievement_key = 'poll_voter_3'")
        .bind(accountId)
        .first<{ achievement_key: string }>()
      expect(ach?.achievement_key).toBe('poll_voter_3')
    })

    it('RoomDO outbox: retains outbox row when engagement fails, completes without duplicate on retry', async () => {
      const roomId = 1
      const roomStub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${roomId}`))
      const mockSessionId = 'outbox-retention-test-' + crypto.randomUUID()
      const now = Date.now()
      const failingAccountId = 999901

      const summaryObj = {
        sessionId: mockSessionId,
        roomId,
        goal: 'Thử nghiệm outbox retention',
        startedAt: now - 30000,
        endedAt: now,
        durationSeconds: 30,
        taskCount: 0,
        taskCompletionRates: {},
        activeMembers: [`acc:${failingAccountId}`], // Non-existent account causes engagement D1 failure
        pollResults: [],
      }

      // 1. Add outbox row directly to RoomDO SQLite
      await (roomStub as any).testAddPendingSummarySync(
        mockSessionId,
        roomId,
        JSON.stringify(summaryObj),
        now,
      )

      const pendingBefore = await (roomStub as any).getPendingSessionSummaries()
      expect(pendingBefore.some((p: any) => p.sessionId === mockSessionId)).toBe(true)

      // 2. Execute outbox sync during failure: summary persists in D1, but engagement fails
      const deliveredFail = await (roomStub as any).xuLyPendingSummarySync(now)
      expect(deliveredFail).toBe(0) // Failed -> delivered is 0

      // D1 summary row was already written
      const d1Summary = await env.DB.prepare('SELECT id FROM hoc_session_summary WHERE id = ?1')
        .bind(mockSessionId)
        .first<{ id: string }>()
      expect(d1Summary?.id).toBe(mockSessionId)

      // CRITICAL INVARIANT: Outbox row REMAINS because engagement was incomplete!
      const pendingDuringFailure = await (roomStub as any).getPendingSessionSummaries()
      expect(pendingDuringFailure.some((p: any) => p.sessionId === mockSessionId)).toBe(true)

      // 3. Recovery: Account is registered
      await env.DB.prepare(
        `INSERT OR IGNORE INTO tai_khoan_campus
         (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, lop_id, dang_hoat_dong)
         VALUES (?1, 'recovered_user', 'Recovered User', 'hash', 'salt', 100000, 'student', 1, 1)`,
      ).bind(failingAccountId).run()

      // Reset nextRetryAt so retry executes immediately
      await (roomStub as any).testAddPendingSummarySync(
        mockSessionId,
        roomId,
        JSON.stringify(summaryObj),
        now - 1000,
      )

      // 4. Retry outbox sync after recovery
      const deliveredRetry = await (roomStub as any).xuLyPendingSummarySync(now + 1000)
      expect(deliveredRetry).toBe(1)

      // Summary in D1 is STILL exactly one row (idempotent INSERT OR IGNORE)
      const summaryCount = await env.DB.prepare('SELECT COUNT(*) as c FROM hoc_session_summary WHERE id = ?1')
        .bind(mockSessionId)
        .first<{ c: number }>()
      expect(summaryCount?.c).toBe(1)

      // Engagement XP awarded exactly once (20 session + 15 first_session + 30 challenge_contributor = 65 XP)
      const profile = await env.DB.prepare('SELECT total_xp FROM user_engagement_profile WHERE account_id = ?1')
        .bind(failingAccountId)
        .first<{ total_xp: number }>()
      expect(profile?.total_xp).toBe(65)

      // Outbox row is deleted after full convergence!
      const pendingAfter = await (roomStub as any).getPendingSessionSummaries()
      expect(pendingAfter.some((p: any) => p.sessionId === mockSessionId)).toBe(false)
    })

    it('partial participant failure retains outbox, retry converges without double-awarding successful participant', async () => {
      const studentA = 210 // valid
      const studentB = 999902 // initially non-existent
      const sessionId = 'partial-fail-test-' + crypto.randomUUID()
      const now = Date.now()

      const summary: SessionSummary = {
        sessionId,
        roomId: 1,
        startedAt: now - 1800_000,
        endedAt: now,
        durationSeconds: 1800,
        goal: 'Test partial failure',
        taskCount: 0,
        taskCompletionRates: {},
        pollResults: [],
        activeMembers: [`acc:${studentA}`, `acc:${studentB}`],
      }

      // First run: Student A succeeds, Student B fails -> throws incomplete error
      await expect(processLearningSessionSummaryEngagement(db, summary)).rejects.toThrow('Incomplete engagement delivery')

      // Student A's XP was already committed to D1
      const xpA1 = await db
        .prepare('SELECT total_xp FROM user_engagement_profile WHERE account_id = ?1')
        .bind(studentA)
        .first<{ total_xp: number }>()
      expect(xpA1?.total_xp).toBeGreaterThanOrEqual(20)

      // Recovery: Register student B
      await env.DB.prepare(
        `INSERT OR IGNORE INTO tai_khoan_campus
         (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, lop_id, dang_hoat_dong)
         VALUES (?1, 'student_b', 'Student B', 'hash', 'salt', 100000, 'student', 1, 1)`,
      ).bind(studentB).run()

      // Retry run: Should succeed completely without throwing
      await processLearningSessionSummaryEngagement(db, summary)

      // Student A must NOT be double-awarded (idempotent source keys!)
      const xpA2 = await db
        .prepare('SELECT total_xp FROM user_engagement_profile WHERE account_id = ?1')
        .bind(studentA)
        .first<{ total_xp: number }>()
      expect(xpA2?.total_xp).toBe(xpA1?.total_xp)

      // Student B completed and received XP
      const xpB = await db
        .prepare('SELECT total_xp FROM user_engagement_profile WHERE account_id = ?1')
        .bind(studentB)
        .first<{ total_xp: number }>()
      expect(xpB?.total_xp).toBeGreaterThanOrEqual(20)
    })

    it('Issue 1: Achievement unlock persists on transient reward failure, retry recovers reward with exactly one badge and one reward row', async () => {
      const accountId = 201
      const now = Date.now()

      // Seed 1 existing session in xp_ledger so first_session qualifies
      await db
        .prepare(`INSERT INTO xp_ledger (account_id, amount, reason, source_key, study_date, created_at) VALUES (?1, 20, 'session_completed', ?2, ?3, ?4)`)
        .bind(accountId, 'seed_session_1', studyDate(now), now)
        .run()

      // Step 1: Simulate achievement_unlocks row already exists (inserted previously),
      // but its reward in xp_ledger is missing (e.g. transient failure during awardXp)
      await db
        .prepare(`INSERT INTO achievement_unlocks (account_id, achievement_key, source_key, unlocked_at) VALUES (?1, ?2, ?3, ?4)`)
        .bind(accountId, 'first_session', `session_count:1:acc:${accountId}`, now)
        .run()

      // Verify badge row exists, but reward row in xp_ledger does NOT exist yet
      const badgeBefore = await db.prepare('SELECT COUNT(*) as c FROM achievement_unlocks WHERE account_id = ?1 AND achievement_key = ?2')
        .bind(accountId, 'first_session').first<{ c: number }>()
      expect(badgeBefore?.c).toBe(1)

      const rewardBefore = await db.prepare('SELECT COUNT(*) as c FROM xp_ledger WHERE account_id = ?1 AND source_key = ?2')
        .bind(accountId, `ach_reward:first_session:acc:${accountId}`).first<{ c: number }>()
      expect(rewardBefore?.c).toBe(0)

      // Step 2 & 3: Evaluate achievements
      // evaluateAchievements MUST NOT skip the unlocked badge! It must reconcile the missing reward.
      await evaluateAchievements(db, accountId, now)

      // Step 4, 5, 6: Verify badge row remains exactly 1 row (no duplicate)
      const badgeAfter = await db.prepare('SELECT COUNT(*) as c FROM achievement_unlocks WHERE account_id = ?1 AND achievement_key = ?2')
        .bind(accountId, 'first_session').first<{ c: number }>()
      expect(badgeAfter?.c).toBe(1)

      // Reward is now delivered exactly once
      const rewardAfter = await db.prepare('SELECT COUNT(*) as c, amount FROM xp_ledger WHERE account_id = ?1 AND source_key = ?2')
        .bind(accountId, `ach_reward:first_session:acc:${accountId}`).first<{ c: number; amount: number }>()
      expect(rewardAfter?.c).toBe(1)
      expect(rewardAfter?.amount).toBe(15)

      // Subsequent evaluations remain idempotent
      await evaluateAchievements(db, accountId, now)
      const rewardIdempotent = await db.prepare('SELECT COUNT(*) as c FROM xp_ledger WHERE account_id = ?1 AND source_key = ?2')
        .bind(accountId, `ach_reward:first_session:acc:${accountId}`).first<{ c: number }>()
      expect(rewardIdempotent?.c).toBe(1)
    })

    it('Issue 2: Challenge at boundary completes, partial contributor bonus failure retains outbox, retry resolves missing bonus without duplicating', async () => {
      const studentA = 201
      const studentB = 202
      const lopId = 1
      const now = Date.now()
      const currentWk = studyWeek(now, SCHOOL_TIMEZONE)
      const challengeId = `ch_lop${lopId}_${currentWk}`

      // Create challenge with target_value = 2, currently at 1
      await ensureActiveWeeklyChallenge(db, lopId, now)
      await db.prepare('UPDATE class_challenges SET current_value = 1, target_value = 2 WHERE id = ?1')
        .bind(challengeId).run()

      // Seed prior contribution for student A
      await db.prepare('INSERT INTO class_challenge_contributions (challenge_id, account_id, source_key, contribution_value, created_at) VALUES (?1, ?2, ?3, 1, ?4)')
        .bind(challengeId, studentA, `contrib:${challengeId}:${studentA}`, now - 1000).run()

      // Now student B contributes, reaching target (1 + 1 = 2)
      const result = await contributeToClassChallenge(db, {
        lopId,
        accountId: studentB,
        targetType: 'sessions_count',
        sourceKey: `contrib:${challengeId}:${studentB}`,
        now,
      })

      expect(result.completed).toBe(true)
      expect(result.newCurrentValue).toBe(2)

      // Challenge is marked completed in DB
      const chRow = await db.prepare('SELECT status, current_value FROM class_challenges WHERE id = ?1')
        .bind(challengeId).first<{ status: string; current_value: number }>()
      expect(chRow?.status).toBe('completed')
      expect(chRow?.current_value).toBe(2)

      // Both student A and B have bonus in xp_ledger
      const bonusA = await db.prepare('SELECT amount FROM xp_ledger WHERE account_id = ?1 AND source_key = ?2')
        .bind(studentA, `challenge_bonus:${challengeId}:acc:${studentA}`).first<{ amount: number }>()
      expect(bonusA?.amount).toBe(30)

      const bonusB = await db.prepare('SELECT amount FROM xp_ledger WHERE account_id = ?1 AND source_key = ?2')
        .bind(studentB, `challenge_bonus:${challengeId}:acc:${studentB}`).first<{ amount: number }>()
      expect(bonusB?.amount).toBe(30)

      // Now simulate retry on already-completed challenge where student B had failed and its bonus was missing:
      // Delete student B's bonus to simulate failure
      await db.prepare('DELETE FROM xp_ledger WHERE account_id = ?1 AND source_key = ?2')
        .bind(studentB, `challenge_bonus:${challengeId}:acc:${studentB}`).run()

      // Retry contributeToClassChallenge on already-completed challenge
      const retryResult = await contributeToClassChallenge(db, {
        lopId,
        accountId: studentB,
        targetType: 'sessions_count',
        sourceKey: `contrib:${challengeId}:${studentB}:retry`,
        now: now + 5000,
      })

      expect(retryResult.completed).toBe(true)

      // Student A was NOT duplicated (still exactly 1 record)
      const countA = await db.prepare('SELECT COUNT(*) as c FROM xp_ledger WHERE account_id = ?1 AND source_key = ?2')
        .bind(studentA, `challenge_bonus:${challengeId}:acc:${studentA}`).first<{ c: number }>()
      expect(countA?.c).toBe(1)

      // Student B's missing bonus was recovered!
      const recoveredB = await db.prepare('SELECT COUNT(*) as c, amount FROM xp_ledger WHERE account_id = ?1 AND source_key = ?2')
        .bind(studentB, `challenge_bonus:${challengeId}:acc:${studentB}`).first<{ c: number; amount: number }>()
      expect(recoveredB?.c).toBe(1)
      expect(recoveredB?.amount).toBe(30)
    })
  })
})
