/**
 * Digital Campus v2 — Server-Authoritative Engagement & Rewards Service
 *
 * Manages study streaks, participation XP, auditable XP ledger,
 * achievement unlocking, class challenges, and study invitations.
 *
 * CRITICAL INVARIANTS:
 * 1. Server-authoritative: client claims are never trusted for XP or badges.
 * 2. Idempotent rewarding: unique source_key guarantees replay safety.
 * 3. Daily XP cap: non-exploitative, study-oriented gamification.
 * 4. Privacy: no private room secrets, passwords, or personal notes exposed.
 * 5. Isolation: core engagement tables live strictly in Core D1 (DB), telemetry in ANALYTICS_DB.
 */

import { isConsecutiveDay, SCHOOL_TIMEZONE, studyDate, studyWeek, getStudyWeekDateRange } from '../../shared/study-date'
import type {
  AchievementDefinition,
  ClassChallenge,
  EngagementProfile,
  SessionEngagementFacts,
} from '../../shared/protocol/engagement'
import type { SessionSummary } from '../../shared/protocol/room'
import { recordAnalyticsEvent } from './analytics'

// ─── Configuration Constants ──────────────────────────────────────────────────
export const MAX_DAILY_XP = 120
export const XP_SESSION_COMPLETE = 20
export const XP_TASK_COMPLETE = 5
export const XP_POLL_VOTE = 2
export const XP_CHALLENGE_BONUS = 30
export const INVITE_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes per friend
export const INVITE_EXPIRY_MS = 15 * 60 * 1000 // 15 minutes validity
export const MAX_INVITES_PER_HOUR = 10

// ─── Achievement Catalog (8 Badges) ──────────────────────────────────────────
export const ACHIEVEMENT_CATALOG: readonly AchievementDefinition[] = [
  {
    key: 'first_session',
    title: 'Khởi đầu học tập',
    description: 'Hoàn thành phiên học đầu tiên tại Digital Campus',
    category: 'session',
    icon: 'Sparkles',
    rewardXp: 15,
  },
  {
    key: 'study_together',
    title: 'Bạn đồng hành',
    description: 'Tham gia học tập cùng ít nhất một bạn học khác',
    category: 'social',
    icon: 'Users',
    rewardXp: 15,
  },
  {
    key: 'streak_3',
    title: 'Chăm chỉ 3 ngày',
    description: 'Duy trì chuỗi học tập 3 ngày liên tiếp',
    category: 'streak',
    icon: 'Flame',
    rewardXp: 25,
  },
  {
    key: 'streak_7',
    title: 'Kỷ luật 7 ngày',
    description: 'Duy trì chuỗi học tập 7 ngày liên tiếp',
    category: 'streak',
    icon: 'Zap',
    rewardXp: 50,
  },
  {
    key: 'task_finisher_5',
    title: 'Chuyên gia nhiệm vụ',
    description: 'Tích hoàn thành 5 nhiệm vụ học tập',
    category: 'task',
    icon: 'CheckCircle2',
    rewardXp: 20,
  },
  {
    key: 'poll_voter_3',
    title: 'Ý kiến xây dựng',
    description: 'Tham gia 3 lần bình chọn trong các phiên học',
    category: 'session',
    icon: 'Vote',
    rewardXp: 15,
  },
  {
    key: 'study_regular_5',
    title: 'Học sinh chuyên cần',
    description: 'Hoàn thành 5 phiên học chất lượng',
    category: 'session',
    icon: 'BookOpen',
    rewardXp: 30,
  },
  {
    key: 'challenge_contributor',
    title: 'Vì tập thể',
    description: 'Đóng góp hoàn thành một thử thách chung của lớp',
    category: 'challenge',
    icon: 'Trophy',
    rewardXp: 30,
  },
] as const

// ─── Engagement Profile Helpers ───────────────────────────────────────────────

export async function getOrCreateEngagementProfile(
  db: D1Database,
  accountId: number,
  now = Date.now(),
): Promise<EngagementProfile> {
  const existing = await db
    .prepare(
      `SELECT account_id, current_streak, longest_streak, last_study_date, total_xp, updated_at
       FROM user_engagement_profile
       WHERE account_id = ?1`,
    )
    .bind(accountId)
    .first<{
      account_id: number
      current_streak: number
      longest_streak: number
      last_study_date: string | null
      total_xp: number
      updated_at: number
    }>()

  const today = studyDate(now, SCHOOL_TIMEZONE)

  // Calculate today's XP from ledger
  const todayXpRow = await db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as todayXp
       FROM xp_ledger
       WHERE account_id = ?1 AND study_date = ?2`,
    )
    .bind(accountId, today)
    .first<{ todayXp: number }>()

  const todayXp = todayXpRow?.todayXp || 0

  // Count unlocked achievements
  const achCountRow = await db
    .prepare(
      `SELECT COUNT(*) as count
       FROM achievement_unlocks
       WHERE account_id = ?1`,
    )
    .bind(accountId)
    .first<{ count: number }>()

  const unlockedCount = achCountRow?.count || 0

  if (existing) {
    return {
      accountId: existing.account_id,
      currentStreak: existing.current_streak,
      longestStreak: existing.longest_streak,
      lastStudyDate: existing.last_study_date,
      totalXp: existing.total_xp,
      todayXp,
      unlockedAchievementsCount: unlockedCount,
      updatedAt: existing.updated_at,
    }
  }

  // Create initial profile
  await db
    .prepare(
      `INSERT OR IGNORE INTO user_engagement_profile
       (account_id, current_streak, longest_streak, last_study_date, total_xp, updated_at)
       VALUES (?1, 0, 0, NULL, 0, ?2)`,
    )
    .bind(accountId, now)
    .run()

  return {
    accountId,
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    totalXp: 0,
    todayXp: 0,
    unlockedAchievementsCount: 0,
    updatedAt: now,
  }
}

/**
 * Reconciles profile total_xp directly from authoritative sum of xp_ledger.
 */
export async function reconcileProfileXpFromLedger(
  db: D1Database,
  accountId: number,
  now = Date.now(),
): Promise<number> {
  const res = await db
    .prepare(
      `UPDATE user_engagement_profile
       SET total_xp = (SELECT COALESCE(SUM(amount), 0) FROM xp_ledger WHERE account_id = ?1),
           updated_at = ?2
       WHERE account_id = ?1
       RETURNING total_xp`,
    )
    .bind(accountId, now)
    .first<{ total_xp: number }>()

  return res?.total_xp ?? 0
}

// ─── Idempotent XP Awarding ───────────────────────────────────────────────────

export interface AwardXpParams {
  accountId: number
  amount: number
  reason: string
  sourceKey: string
  studyDateStr?: string
  timestamp?: number
}

export interface AwardXpResult {
  awarded: boolean
  amount: number
  amountAwarded: number
  alreadyAwarded: boolean
  capped?: boolean
  newTotalXp: number
  reason?: string
}

export async function awardXp(db: D1Database, params: AwardXpParams): Promise<AwardXpResult> {
  const ts = params.timestamp || Date.now()
  const dateStr = params.studyDateStr || studyDate(ts, SCHOOL_TIMEZONE)

  if (params.amount <= 0) {
    const profile = await getOrCreateEngagementProfile(db, params.accountId, ts)
    return {
      awarded: false,
      amount: 0,
      amountAwarded: 0,
      alreadyAwarded: false,
      newTotalXp: profile.totalXp,
      reason: 'amount_must_be_positive',
    }
  }

  // Ensure profile row exists
  await getOrCreateEngagementProfile(db, params.accountId, ts)

  // Check if this reward source key was already processed (Idempotency Guard)
  const existingReward = await db
    .prepare(`SELECT amount FROM xp_ledger WHERE source_key = ?1`)
    .bind(params.sourceKey)
    .first<{ amount: number }>()

  if (existingReward) {
    await reconcileProfileXpFromLedger(db, params.accountId, ts)
    const profile = await getOrCreateEngagementProfile(db, params.accountId, ts)
    return {
      awarded: false,
      amount: 0,
      amountAwarded: 0,
      alreadyAwarded: true,
      newTotalXp: profile.totalXp,
      reason: 'duplicate_source_key',
    }
  }

  // Atomic conditional insertion + profile update via D1 ACID batch transaction.
  // Calculates remaining daily quota within SQLite write serialization so concurrent
  // requests with distinct source keys cannot exceed MAX_DAILY_XP (120).
  const insertStmt = db
    .prepare(
      `INSERT INTO xp_ledger (account_id, amount, reason, source_key, study_date, created_at)
       SELECT
         ?1,
         MIN(?2, MAX(0, ?3 - COALESCE((SELECT SUM(amount) FROM xp_ledger WHERE account_id = ?1 AND study_date = ?4), 0))),
         ?5,
         ?6,
         ?4,
         ?7
       WHERE (SELECT COALESCE(SUM(amount), 0) FROM xp_ledger WHERE account_id = ?1 AND study_date = ?4) < ?3
         AND MIN(?2, MAX(0, ?3 - COALESCE((SELECT SUM(amount) FROM xp_ledger WHERE account_id = ?1 AND study_date = ?4), 0))) > 0`,
    )
    .bind(params.accountId, params.amount, MAX_DAILY_XP, dateStr, params.reason, params.sourceKey, ts)

  const updateProfileStmt = db
    .prepare(
      `UPDATE user_engagement_profile
       SET total_xp = (SELECT COALESCE(SUM(amount), 0) FROM xp_ledger WHERE account_id = ?1),
           updated_at = ?2
       WHERE account_id = ?1`,
    )
    .bind(params.accountId, ts)

  try {
    const batchRes = await db.batch([insertStmt, updateProfileStmt])
    const insertRes = batchRes[0]

    if (!insertRes.meta?.changes || insertRes.meta.changes === 0) {
      const profile = await getOrCreateEngagementProfile(db, params.accountId, ts)
      return {
        awarded: false,
        amount: 0,
        amountAwarded: 0,
        alreadyAwarded: false,
        capped: true,
        newTotalXp: profile.totalXp,
        reason: 'daily_cap_reached',
      }
    }

    const insertedRow = await db
      .prepare(`SELECT amount FROM xp_ledger WHERE source_key = ?1`)
      .bind(params.sourceKey)
      .first<{ amount: number }>()

    const amountAwarded = insertedRow?.amount ?? 0
    const profile = await getOrCreateEngagementProfile(db, params.accountId, ts)

    return {
      awarded: true,
      amount: amountAwarded,
      amountAwarded,
      alreadyAwarded: false,
      capped: amountAwarded < params.amount,
      newTotalXp: profile.totalXp,
    }
  } catch (err: any) {
    if (String(err?.message || '').includes('UNIQUE constraint')) {
      await reconcileProfileXpFromLedger(db, params.accountId, ts)
      const profile = await getOrCreateEngagementProfile(db, params.accountId, ts)
      return {
        awarded: false,
        amount: 0,
        amountAwarded: 0,
        alreadyAwarded: true,
        newTotalXp: profile.totalXp,
        reason: 'duplicate_source_key',
      }
    }
    throw err
  }
}

// ─── Study Streak Update ──────────────────────────────────────────────────────

export interface UpdateStreakResult {
  currentStreak: number
  longestStreak: number
  extended: boolean
  reset: boolean
  alreadyRecordedToday: boolean
}

/**
 * Idempotently records a verified study activity day for the given account.
 * Only meaningful study activity should qualify.
 */
export async function recordStudyActivityDay(
  db: D1Database,
  accountId: number,
  dateStr: string,
  sourceKey: string,
  now = Date.now(),
): Promise<boolean> {
  const res = await db
    .prepare(
      `INSERT OR IGNORE INTO study_activity_days (account_id, study_date, source_key, created_at)
       VALUES (?1, ?2, ?3, ?4)`,
    )
    .bind(accountId, dateStr, sourceKey, now)
    .run()

  return !!(res.meta?.changes && res.meta.changes > 0)
}

/**
 * Deterministically reconciles streak metrics (current_streak, longest_streak, last_study_date)
 * from authoritative unique study days, independent of processing order.
 */
export async function reconcileStudyStreak(
  db: D1Database,
  accountId: number,
  now = Date.now(),
): Promise<{ currentStreak: number; longestStreak: number; lastStudyDate: string | null }> {
  await getOrCreateEngagementProfile(db, accountId, now)

  const rows = await db
    .prepare(
      `SELECT study_date
       FROM study_activity_days
       WHERE account_id = ?1
       ORDER BY study_date ASC`,
    )
    .bind(accountId)
    .all<{ study_date: string }>()

  const dates = (rows.results || []).map((r) => r.study_date)
  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastStudyDate: null }
  }

  let longestStreak = 0
  let streak = 0
  let prevDate: string | null = null

  for (const d of dates) {
    if (prevDate === null) {
      streak = 1
    } else if (isConsecutiveDay(prevDate, d)) {
      streak += 1
    } else {
      streak = 1
    }
    if (streak > longestStreak) {
      longestStreak = streak
    }
    prevDate = d
  }

  const currentStreak = streak
  const lastStudyDate = dates[dates.length - 1]

  await db
    .prepare(
      `UPDATE user_engagement_profile
       SET current_streak = ?1, longest_streak = ?2, last_study_date = ?3, updated_at = ?4
       WHERE account_id = ?5`,
    )
    .bind(currentStreak, longestStreak, lastStudyDate, now, accountId)
    .run()

  return { currentStreak, longestStreak, lastStudyDate }
}

export async function updateStudyStreak(
  db: D1Database,
  accountId: number,
  timestamp = Date.now(),
  sourceKey?: string,
  studyDateStr?: string,
): Promise<UpdateStreakResult> {
  const today = studyDateStr || studyDate(timestamp, SCHOOL_TIMEZONE)
  const sKey = sourceKey || `session_study_day:${today}:acc:${accountId}`

  const initialProfile = await getOrCreateEngagementProfile(db, accountId, timestamp)
  const isNewDay = await recordStudyActivityDay(db, accountId, today, sKey, timestamp)
  const reconciled = await reconcileStudyStreak(db, accountId, timestamp)

  return {
    currentStreak: reconciled.currentStreak,
    longestStreak: reconciled.longestStreak,
    extended: isNewDay && reconciled.currentStreak > initialProfile.currentStreak,
    reset: isNewDay && reconciled.currentStreak === 1 && initialProfile.currentStreak > 1,
    alreadyRecordedToday: !isNewDay,
  }
}

// ─── Centralized Achievement Unlocking ───────────────────────────────────────

export interface UnlockAchievementResult {
  unlocked: boolean
  alreadyUnlocked: boolean
  rewardResult?: AwardXpResult
}

export async function unlockAchievement(
  db: D1Database,
  accountId: number,
  key: string,
  sourceKey: string,
  now = Date.now(),
): Promise<UnlockAchievementResult> {
  const achDef = ACHIEVEMENT_CATALOG.find((a) => a.key === key)
  if (!achDef) {
    return { unlocked: false, alreadyUnlocked: false }
  }

  // 1. Idempotently insert unlock record
  const res = await db
    .prepare(
      `INSERT OR IGNORE INTO achievement_unlocks (account_id, achievement_key, source_key, unlocked_at)
       VALUES (?1, ?2, ?3, ?4)`,
    )
    .bind(accountId, key, sourceKey, now)
    .run()

  const newlyInserted = !!(res.meta?.changes && res.meta.changes > 0)

  // 2. Authoritative reward delivery (strictly respecting MAX_DAILY_XP)
  // Even if unlock row previously existed from a failed run, awardXp with unique
  // ach_reward source key delivers missing reward idempotently.
  let rewardResult: AwardXpResult | undefined
  if (achDef.rewardXp > 0) {
    rewardResult = await awardXp(db, {
      accountId,
      amount: achDef.rewardXp,
      reason: `achievement_${key}`,
      sourceKey: `ach_reward:${key}:acc:${accountId}`,
      timestamp: now,
    })
  }

  return {
    unlocked: newlyInserted,
    alreadyUnlocked: !newlyInserted,
    rewardResult,
  }
}

// ─── Achievement Evaluation ───────────────────────────────────────────────────

export async function evaluateAchievements(
  db: D1Database,
  accountId: number,
  now = Date.now(),
): Promise<string[]> {
  const profile = await getOrCreateEngagementProfile(db, accountId, now)

  // Fetch all existing unlocks
  const unlockedRows = await db
    .prepare(`SELECT achievement_key, source_key FROM achievement_unlocks WHERE account_id = ?1`)
    .bind(accountId)
    .all<{ achievement_key: string; source_key: string }>()

  const unlockedSet = new Set((unlockedRows.results || []).map((r) => r.achievement_key))
  const newlyUnlocked: string[] = []

  // Check which achievements already have their reward recorded in xp_ledger
  const existingLedgerKeys = await db
    .prepare(`SELECT source_key FROM xp_ledger WHERE account_id = ?1 AND source_key LIKE 'ach_reward:%'`)
    .bind(accountId)
    .all<{ source_key: string }>()
  const existingRewardSet = new Set((existingLedgerKeys.results || []).map((r) => r.source_key))

  // Invariant: Ensure any unlocked achievement with missing reward is reconciled.
  // Never skip reward reconciliation merely because badge was already unlocked!
  for (const row of unlockedRows.results || []) {
    const achDef = ACHIEVEMENT_CATALOG.find((a) => a.key === row.achievement_key)
    const expectedRewardKey = `ach_reward:${row.achievement_key}:acc:${accountId}`
    if (achDef && achDef.rewardXp > 0 && !existingRewardSet.has(expectedRewardKey)) {
      await unlockAchievement(db, accountId, row.achievement_key, row.source_key, now)
      existingRewardSet.add(expectedRewardKey)
    }
  }

  const checkAndUnlock = async (key: string, sourceKey: string) => {
    const expectedRewardKey = `ach_reward:${key}:acc:${accountId}`
    const needsUnlock = !unlockedSet.has(key)
    const needsReward = !existingRewardSet.has(expectedRewardKey)

    if (needsUnlock || needsReward) {
      const res = await unlockAchievement(db, accountId, key, sourceKey, now)
      if (res.unlocked) {
        unlockedSet.add(key)
        newlyUnlocked.push(key)
      }
      existingRewardSet.add(expectedRewardKey)
    }
  }

  // 1. Session Counts
  const sessionCountRow = await db
    .prepare(`SELECT COUNT(*) as cnt FROM xp_ledger WHERE account_id = ?1 AND reason = 'session_completed'`)
    .bind(accountId)
    .first<{ cnt: number }>()

  const sessionCount = sessionCountRow?.cnt || 0
  if (sessionCount >= 1) await checkAndUnlock('first_session', `session_count:1:acc:${accountId}`)
  if (sessionCount >= 5) await checkAndUnlock('study_regular_5', `session_count:5:acc:${accountId}`)

  // 2. Streaks
  if (profile.currentStreak >= 3) await checkAndUnlock('streak_3', `streak:3:acc:${accountId}`)
  if (profile.currentStreak >= 7) await checkAndUnlock('streak_7', `streak:7:acc:${accountId}`)

  // 3. Task Completions (authoritative from ledger)
  const taskCountRow = await db
    .prepare(`SELECT COUNT(*) as cnt FROM xp_ledger WHERE account_id = ?1 AND reason = 'task_completed'`)
    .bind(accountId)
    .first<{ cnt: number }>()

  if ((taskCountRow?.cnt || 0) >= 5) await checkAndUnlock('task_finisher_5', `task_count:5:acc:${accountId}`)

  // 4. Poll Votes (authoritative from ledger)
  const pollCountRow = await db
    .prepare(`SELECT COUNT(*) as cnt FROM xp_ledger WHERE account_id = ?1 AND reason = 'poll_voted'`)
    .bind(accountId)
    .first<{ cnt: number }>()

  if ((pollCountRow?.cnt || 0) >= 3) await checkAndUnlock('poll_voter_3', `poll_count:3:acc:${accountId}`)

  // 5. Challenge Contributions
  const contribCountRow = await db
    .prepare(`SELECT COUNT(*) as cnt FROM class_challenge_contributions WHERE account_id = ?1`)
    .bind(accountId)
    .first<{ cnt: number }>()

  if ((contribCountRow?.cnt || 0) >= 1) await checkAndUnlock('challenge_contributor', `challenge_contrib:1:acc:${accountId}`)

  return newlyUnlocked
}

// ─── Class Challenges ─────────────────────────────────────────────────────────

export async function ensureActiveWeeklyChallenge(
  db: D1Database,
  lopId: number,
  now = Date.now(),
): Promise<ClassChallenge | null> {
  const currentWk = studyWeek(now, SCHOOL_TIMEZONE)
  const { startDate, endDate } = getStudyWeekDateRange(currentWk)

  // Find existing active or completed challenge for this week
  const existing = await db
    .prepare(
      `SELECT id, lop_id, title, description, target_type, target_value, current_value, reward_xp, start_date, end_date, status
       FROM class_challenges
       WHERE lop_id = ?1 AND id LIKE ?2`,
    )
    .bind(lopId, `ch_lop${lopId}_${currentWk}%`)
    .first<{
      id: string
      lop_id: number
      title: string
      description: string
      target_type: 'sessions_count' | 'tasks_count'
      target_value: number
      current_value: number
      reward_xp: number
      start_date: string
      end_date: string
      status: 'active' | 'completed' | 'expired'
    }>()

  if (existing) {
    return {
      id: existing.id,
      lopId: existing.lop_id,
      title: existing.title,
      description: existing.description,
      targetType: existing.target_type,
      targetValue: existing.target_value,
      currentValue: existing.current_value,
      rewardXp: existing.reward_xp,
      startDate: existing.start_date,
      endDate: existing.end_date,
      status: existing.status,
    }
  }

  // Create default weekly challenge for class spanning canonical Monday -> Sunday
  const challengeId = `ch_lop${lopId}_${currentWk}`
  const title = `Thử thách học tập Tuần ${currentWk.split('-W')[1]}`
  const description = `Cùng lớp hoàn thành 20 phiên học tập chất lượng trong tuần này`
  const targetType = 'sessions_count'
  const targetValue = 20
  const rewardXp = 30

  await db
    .prepare(
      `INSERT OR IGNORE INTO class_challenges
       (id, lop_id, title, description, target_type, target_value, current_value, reward_xp, start_date, end_date, status, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7, ?8, ?9, 'active', ?10)`,
    )
    .bind(challengeId, lopId, title, description, targetType, targetValue, rewardXp, startDate, endDate, now)
    .run()

  return {
    id: challengeId,
    lopId,
    title,
    description,
    targetType,
    targetValue,
    currentValue: 0,
    rewardXp,
    startDate,
    endDate,
    status: 'active',
  }
}

export interface ContributeChallengeParams {
  lopId: number
  accountId: number
  targetType: 'sessions_count' | 'tasks_count'
  sourceKey: string
  now?: number
}

/**
 * Authoritatively reconciles completion bonus rewards for all contributors of a completed challenge.
 * Safe and idempotent to retry: uses stable key `challenge_bonus:<challengeId>:acc:<accountId>`.
 * Does NOT swallow D1 failures.
 */
export async function reconcileChallengeCompletionRewards(
  db: D1Database,
  challengeId: string,
  rewardXp: number,
  now = Date.now(),
): Promise<void> {
  const contributors = await db
    .prepare(`SELECT DISTINCT account_id FROM class_challenge_contributions WHERE challenge_id = ?1`)
    .bind(challengeId)
    .all<{ account_id: number }>()

  for (const c of contributors.results || []) {
    await awardXp(db, {
      accountId: c.account_id,
      amount: rewardXp,
      reason: 'challenge_completed_bonus',
      sourceKey: `challenge_bonus:${challengeId}:acc:${c.account_id}`,
      timestamp: now,
    })
  }
}

/**
 * Authoritatively reconciles class challenge progress from the sum of contribution rows.
 * If target is met, marks completed and reconciles completion bonus rewards for all contributors.
 */
export async function reconcileChallengeProgress(
  db: D1Database,
  challengeId: string,
  now = Date.now(),
): Promise<{ currentValue: number; targetValue: number; rewardXp: number; completed: boolean }> {
  // Authoritative update of current_value from contributions aggregate
  const updateRes = await db
    .prepare(
      `UPDATE class_challenges
       SET current_value = (
         SELECT COALESCE(SUM(contribution_value), 0)
         FROM class_challenge_contributions
         WHERE challenge_id = ?1
       )
       WHERE id = ?1
       RETURNING current_value, target_value, reward_xp, status`,
    )
    .bind(challengeId)
    .first<{ current_value: number; target_value: number; reward_xp: number; status: string }>()

  if (!updateRes) {
    throw new Error(`[reconcileChallengeProgress] Challenge not found: id=${challengeId}`)
  }

  const currentValue = updateRes.current_value
  const targetValue = updateRes.target_value
  const rewardXp = updateRes.reward_xp
  const wasAlreadyCompleted = updateRes.status === 'completed'

  let completed = wasAlreadyCompleted

  if (currentValue >= targetValue) {
    if (!wasAlreadyCompleted) {
      await db
        .prepare(`UPDATE class_challenges SET status = 'completed' WHERE id = ?1 AND status = 'active'`)
        .bind(challengeId)
        .run()
      completed = true
    }
    // Reconcile completion rewards for all contributors idempotently
    await reconcileChallengeCompletionRewards(db, challengeId, rewardXp, now)
  }

  return { currentValue, targetValue, rewardXp, completed }
}

export async function contributeToClassChallenge(
  db: D1Database,
  params: ContributeChallengeParams,
): Promise<{
  contributed: boolean
  completed: boolean
  alreadyContributed?: boolean
  challengeId?: string
  newCurrentValue?: number
}> {
  const ts = params.now || Date.now()
  const challenge = await ensureActiveWeeklyChallenge(db, params.lopId, ts)
  if (!challenge || challenge.targetType !== params.targetType) {
    return { contributed: false, completed: false, alreadyContributed: false }
  }

  // If challenge is already completed, reconcile any missing contributor rewards and return
  if (challenge.status === 'completed') {
    await reconcileChallengeCompletionRewards(db, challenge.id, challenge.rewardXp, ts)
    return {
      contributed: false,
      completed: true,
      alreadyContributed: false,
      challengeId: challenge.id,
      newCurrentValue: challenge.currentValue,
    }
  }

  // 1. Authoritative insert or ignore contribution record
  const insertContribRes = await db
    .prepare(
      `INSERT OR IGNORE INTO class_challenge_contributions (challenge_id, account_id, source_key, contribution_value, created_at)
       VALUES (?1, ?2, ?3, 1, ?4)`,
    )
    .bind(challenge.id, params.accountId, params.sourceKey, ts)
    .run()

  const isNewContribution = !!(insertContribRes.meta?.changes && insertContribRes.meta.changes > 0)

  // 2. Reconcile progress and completion rewards
  const progress = await reconcileChallengeProgress(db, challenge.id, ts)

  return {
    contributed: isNewContribution,
    completed: progress.completed,
    alreadyContributed: !isNewContribution,
    challengeId: challenge.id,
    newCurrentValue: progress.currentValue,
  }
}

// ─── Authoritative Learning Session Summary Processor ─────────────────────────

export async function processLearningSessionSummaryEngagement(
  db: D1Database,
  summary: SessionSummary,
  analyticsDb?: D1Database,
  ctx?: { waitUntil: (promise: Promise<unknown>) => void },
  facts?: SessionEngagementFacts,
): Promise<void> {
  const now = summary.endedAt || Date.now()

  // Extract account IDs from activeMembers ("acc:123" or "123") + facts.participantAccountIds
  const participantAccountIds = new Set<number>()
  for (const m of summary.activeMembers || []) {
    const rawId = m.startsWith('acc:') ? m.slice(4) : m
    const idNum = parseInt(rawId, 10)
    if (Number.isFinite(idNum) && idNum > 0) {
      participantAccountIds.add(idNum)
    }
  }
  for (const accId of facts?.participantAccountIds || []) {
    if (Number.isFinite(accId) && accId > 0) {
      participantAccountIds.add(accId)
    }
  }

  const isMultiParticipant = participantAccountIds.size >= 2
  const processingFailures: Array<{ accountId: number; error: any }> = []

  // 1. Process per-participant rewards (Streak, Session XP, study_together, Challenge, Achievements)
  for (const accountId of participantAccountIds) {
    try {
      // 1.1. Update Study Streak
      const streakRes = await updateStudyStreak(db, accountId, now)

      // 1.2. Award Session Completion XP (+20 XP)
      const sessionSourceKey = `session:${summary.sessionId}:acc:${accountId}`
      const xpRes = await awardXp(db, {
        accountId,
        amount: XP_SESSION_COMPLETE,
        reason: 'session_completed',
        sourceKey: sessionSourceKey,
        timestamp: now,
      })

      // 1.3. Multi-participant: centralized unlock 'study_together' (+15 XP)
      if (isMultiParticipant) {
        await unlockAchievement(
          db,
          accountId,
          'study_together',
          `study_together:session:${summary.sessionId}:acc:${accountId}`,
          now,
        )
      }

      // 1.4. Query student's class (lop_id) for class challenges
      const studentClass = await db
        .prepare(`SELECT lop_id FROM tai_khoan_campus WHERE id = ?1`)
        .bind(accountId)
        .first<{ lop_id: number | null }>()

      if (studentClass?.lop_id) {
        await contributeToClassChallenge(db, {
          lopId: studentClass.lop_id,
          accountId,
          targetType: 'sessions_count',
          sourceKey: `challenge_session:${summary.sessionId}:acc:${accountId}`,
          now,
        })
      }

      // 1.5. Evaluate achievements
      const newlyUnlocked = await evaluateAchievements(db, accountId, now)

      // 1.6. Telemetry (non-blocking)
      if (analyticsDb) {
        if (xpRes.awarded) {
          recordAnalyticsEvent(analyticsDb, ctx, {
            event: 'engagement.xp_awarded',
            actorId: accountId,
            sessionId: summary.sessionId,
            roomId: summary.roomId,
          })
        }
        if (streakRes.extended) {
          recordAnalyticsEvent(analyticsDb, ctx, {
            event: 'engagement.streak_extended',
            actorId: accountId,
            sessionId: summary.sessionId,
          })
        }
        for (const _achKey of newlyUnlocked) {
          recordAnalyticsEvent(analyticsDb, ctx, {
            event: 'engagement.achievement_unlocked',
            actorId: accountId,
            sessionId: summary.sessionId,
          })
        }
      }
    } catch (err) {
      console.error(`[processLearningSessionSummaryEngagement] Participant error for accountId=${accountId}:`, err)
      processingFailures.push({ accountId, error: err })
    }
  }

  // 2. Authoritative Task Completions (+5 XP each)
  const evaluatedTaskAccounts = new Set<number>()
  for (const tc of facts?.taskCompletions || []) {
    if (!Number.isFinite(tc.accountId) || tc.accountId <= 0 || !tc.taskId) continue
    try {
      await awardXp(db, {
        accountId: tc.accountId,
        amount: XP_TASK_COMPLETE,
        reason: 'task_completed',
        sourceKey: `task:${summary.sessionId}:${tc.taskId}:acc:${tc.accountId}`,
        timestamp: now,
      })
      evaluatedTaskAccounts.add(tc.accountId)
    } catch (taskErr) {
      console.error(`[processLearningSessionSummaryEngagement] Task award error for accountId=${tc.accountId}:`, taskErr)
      processingFailures.push({ accountId: tc.accountId, error: taskErr })
    }
  }
  for (const accId of evaluatedTaskAccounts) {
    try {
      await evaluateAchievements(db, accId, now)
    } catch (evalErr) {
      console.error(`[processLearningSessionSummaryEngagement] Task eval error for accountId=${accId}:`, evalErr)
      processingFailures.push({ accountId: accId, error: evalErr })
    }
  }

  // 3. Authoritative Poll Votes (+2 XP each, unique per poll/account)
  const evaluatedPollAccounts = new Set<number>()
  for (const pv of facts?.pollVotes || []) {
    if (!Number.isFinite(pv.accountId) || pv.accountId <= 0 || !pv.pollId) continue
    try {
      await awardXp(db, {
        accountId: pv.accountId,
        amount: XP_POLL_VOTE,
        reason: 'poll_voted',
        sourceKey: `poll:${summary.sessionId}:${pv.pollId}:acc:${pv.accountId}`,
        timestamp: now,
      })
      evaluatedPollAccounts.add(pv.accountId)
    } catch (pollErr) {
      console.error(`[processLearningSessionSummaryEngagement] Poll award error for accountId=${pv.accountId}:`, pollErr)
      processingFailures.push({ accountId: pv.accountId, error: pollErr })
    }
  }
  for (const accId of evaluatedPollAccounts) {
    try {
      await evaluateAchievements(db, accId, now)
    } catch (evalErr) {
      console.error(`[processLearningSessionSummaryEngagement] Poll eval error for accountId=${accId}:`, evalErr)
      processingFailures.push({ accountId: accId, error: evalErr })
    }
  }

  // If any participant or fact processing failed, throw retryable error so RoomDO retains outbox
  if (processingFailures.length > 0) {
    throw new Error(
      `[processLearningSessionSummaryEngagement] Incomplete engagement delivery for session=${summary.sessionId}: ${processingFailures.length} operations failed. (Accounts: ${processingFailures.map((f) => f.accountId).join(', ')})`,
    )
  }
}
