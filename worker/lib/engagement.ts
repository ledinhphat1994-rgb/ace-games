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

import { isConsecutiveDay, SCHOOL_TIMEZONE, studyDate, studyWeek } from '../../shared/study-date'
import type {
  AchievementDefinition,
  ClassChallenge,
  EngagementProfile,
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

// ─── Idempotent XP Awarding ───────────────────────────────────────────────────

export interface AwardXpParams {
  accountId: number
  amount: number
  reason: string
  sourceKey: string
  studyDateStr?: string
  timestamp?: number
  bypassDailyCap?: boolean
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

  // Check if this reward source key was already processed (Idempotency Guard)
  const existingReward = await db
    .prepare(`SELECT amount FROM xp_ledger WHERE source_key = ?1`)
    .bind(params.sourceKey)
    .first<{ amount: number }>()

  if (existingReward) {
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

  // Check daily cap
  let effectiveAmount = params.amount
  if (!params.bypassDailyCap) {
    const todayXpRow = await db
      .prepare(`SELECT COALESCE(SUM(amount), 0) as todayXp FROM xp_ledger WHERE account_id = ?1 AND study_date = ?2`)
      .bind(params.accountId, dateStr)
      .first<{ todayXp: number }>()

    const currentDailyXp = todayXpRow?.todayXp || 0
    const remainingQuota = Math.max(0, MAX_DAILY_XP - currentDailyXp)

    if (remainingQuota <= 0) {
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
    effectiveAmount = Math.min(params.amount, remainingQuota)
  }

  // Ensure profile exists
  await getOrCreateEngagementProfile(db, params.accountId, ts)

  // Insert into ledger (atomically enforcing source_key uniqueness)
  try {
    await db
      .prepare(
        `INSERT INTO xp_ledger (account_id, amount, reason, source_key, study_date, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
      )
      .bind(params.accountId, effectiveAmount, params.reason, params.sourceKey, dateStr, ts)
      .run()

    // Update aggregate total_xp
    const updateRes = await db
      .prepare(
        `UPDATE user_engagement_profile
         SET total_xp = total_xp + ?1, updated_at = ?2
         WHERE account_id = ?3
         RETURNING total_xp`,
      )
      .bind(effectiveAmount, ts, params.accountId)
      .first<{ total_xp: number }>()

    return {
      awarded: true,
      amount: effectiveAmount,
      amountAwarded: effectiveAmount,
      alreadyAwarded: false,
      newTotalXp: updateRes?.total_xp ?? effectiveAmount,
    }
  } catch (err: any) {
    if (String(err?.message || '').includes('UNIQUE constraint')) {
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

export async function updateStudyStreak(
  db: D1Database,
  accountId: number,
  timestamp = Date.now(),
): Promise<UpdateStreakResult> {
  const today = studyDate(timestamp, SCHOOL_TIMEZONE)
  const profile = await getOrCreateEngagementProfile(db, accountId, timestamp)

  if (profile.lastStudyDate === today) {
    return {
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      extended: false,
      reset: false,
      alreadyRecordedToday: true,
    }
  }

  let newStreak = 1
  let extended = false
  let reset = false

  if (profile.lastStudyDate && isConsecutiveDay(profile.lastStudyDate, today)) {
    newStreak = profile.currentStreak + 1
    extended = true
  } else {
    // Either first study day or missed day -> reset to 1
    newStreak = 1
    reset = profile.currentStreak > 0
  }

  const newLongest = Math.max(profile.longestStreak, newStreak)

  await db
    .prepare(
      `UPDATE user_engagement_profile
       SET current_streak = ?1, longest_streak = ?2, last_study_date = ?3, updated_at = ?4
       WHERE account_id = ?5`,
    )
    .bind(newStreak, newLongest, today, timestamp, accountId)
    .run()

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    extended,
    reset,
    alreadyRecordedToday: false,
  }
}

// ─── Achievement Evaluation ───────────────────────────────────────────────────

export async function evaluateAchievements(
  db: D1Database,
  accountId: number,
  now = Date.now(),
): Promise<string[]> {
  const profile = await getOrCreateEngagementProfile(db, accountId, now)

  // Get already unlocked achievements
  const unlockedRows = await db
    .prepare(`SELECT achievement_key FROM achievement_unlocks WHERE account_id = ?1`)
    .bind(accountId)
    .all<{ achievement_key: string }>()

  const unlockedSet = new Set((unlockedRows.results || []).map((r) => r.achievement_key))
  const newlyUnlocked: string[] = []

  // Helper unlock function
  const tryUnlock = async (key: string, sourceKey: string) => {
    if (unlockedSet.has(key)) return
    try {
      const res = await db
        .prepare(
          `INSERT OR IGNORE INTO achievement_unlocks (account_id, achievement_key, source_key, unlocked_at)
           VALUES (?1, ?2, ?3, ?4)`,
        )
        .bind(accountId, key, sourceKey, now)
        .run()

      if (res.meta?.changes && res.meta.changes > 0) {
        unlockedSet.add(key)
        newlyUnlocked.push(key)

        // Award bonus XP for achievement unlock
        const achDef = ACHIEVEMENT_CATALOG.find((a) => a.key === key)
        if (achDef && achDef.rewardXp > 0) {
          await awardXp(db, {
            accountId,
            amount: achDef.rewardXp,
            reason: `achievement_${key}`,
            sourceKey: `ach_reward:${key}:acc:${accountId}`,
            timestamp: now,
            bypassDailyCap: true, // Achievement rewards are bonus and exempt from daily cap
          })
        }
      }
    } catch {
      // ignore concurrent unlock
    }
  }

  // 1. Session Counts
  const sessionCountRow = await db
    .prepare(`SELECT COUNT(*) as cnt FROM xp_ledger WHERE account_id = ?1 AND reason = 'session_completed'`)
    .bind(accountId)
    .first<{ cnt: number }>()

  const sessionCount = sessionCountRow?.cnt || 0
  if (sessionCount >= 1) await tryUnlock('first_session', `session_count:1:acc:${accountId}`)
  if (sessionCount >= 5) await tryUnlock('study_regular_5', `session_count:5:acc:${accountId}`)

  // 2. Streaks
  if (profile.currentStreak >= 3) await tryUnlock('streak_3', `streak:3:acc:${accountId}`)
  if (profile.currentStreak >= 7) await tryUnlock('streak_7', `streak:7:acc:${accountId}`)

  // 3. Task Completions
  const taskCountRow = await db
    .prepare(`SELECT COUNT(*) as cnt FROM xp_ledger WHERE account_id = ?1 AND reason = 'task_completed'`)
    .bind(accountId)
    .first<{ cnt: number }>()

  if ((taskCountRow?.cnt || 0) >= 5) await tryUnlock('task_finisher_5', `task_count:5:acc:${accountId}`)

  // 4. Poll Votes
  const pollCountRow = await db
    .prepare(`SELECT COUNT(*) as cnt FROM xp_ledger WHERE account_id = ?1 AND reason = 'poll_voted'`)
    .bind(accountId)
    .first<{ cnt: number }>()

  if ((pollCountRow?.cnt || 0) >= 3) await tryUnlock('poll_voter_3', `poll_count:3:acc:${accountId}`)

  // 5. Challenge Contributions
  const contribCountRow = await db
    .prepare(`SELECT COUNT(*) as cnt FROM class_challenge_contributions WHERE account_id = ?1`)
    .bind(accountId)
    .first<{ cnt: number }>()

  if ((contribCountRow?.cnt || 0) >= 1) await tryUnlock('challenge_contributor', `challenge_contrib:1:acc:${accountId}`)

  return newlyUnlocked
}

// ─── Class Challenges ─────────────────────────────────────────────────────────

export async function ensureActiveWeeklyChallenge(
  db: D1Database,
  lopId: number,
  now = Date.now(),
): Promise<ClassChallenge | null> {
  const currentWk = studyWeek(now, SCHOOL_TIMEZONE)
  const today = studyDate(now, SCHOOL_TIMEZONE)

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

  // Create default weekly challenge for class
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
    .bind(challengeId, lopId, title, description, targetType, targetValue, rewardXp, today, today, now)
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
    startDate: today,
    endDate: today,
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
  if (!challenge || challenge.status !== 'active' || challenge.targetType !== params.targetType) {
    return { contributed: false, completed: false, alreadyContributed: false }
  }

  try {
    // 1. Idempotent contribution record
    await db
      .prepare(
        `INSERT INTO class_challenge_contributions (challenge_id, account_id, source_key, contribution_value, created_at)
         VALUES (?1, ?2, ?3, 1, ?4)`,
      )
      .bind(challenge.id, params.accountId, params.sourceKey, ts)
      .run()

    // 2. Increment challenge current_value
    const updateRes = await db
      .prepare(
        `UPDATE class_challenges
         SET current_value = current_value + 1
         WHERE id = ?1
         RETURNING current_value, target_value, reward_xp`,
      )
      .bind(challenge.id)
      .first<{ current_value: number; target_value: number; reward_xp: number }>()

    let completed = false
    if (updateRes && updateRes.current_value >= updateRes.target_value) {
      await db
        .prepare(`UPDATE class_challenges SET status = 'completed' WHERE id = ?1 AND status = 'active'`)
        .bind(challenge.id)
        .run()

      completed = true

      // Bonus XP to all contributors
      const contributors = await db
        .prepare(`SELECT DISTINCT account_id FROM class_challenge_contributions WHERE challenge_id = ?1`)
        .bind(challenge.id)
        .all<{ account_id: number }>()

      for (const c of contributors.results || []) {
        await awardXp(db, {
          accountId: c.account_id,
          amount: updateRes.reward_xp,
          reason: 'challenge_completed_bonus',
          sourceKey: `challenge_bonus:${challenge.id}:acc:${c.account_id}`,
          timestamp: ts,
          bypassDailyCap: true,
        })
      }
    }

    return {
      contributed: true,
      completed,
      alreadyContributed: false,
      challengeId: challenge.id,
      newCurrentValue: updateRes?.current_value ?? 1,
    }
  } catch (err: any) {
    if (String(err?.message || '').includes('UNIQUE constraint')) {
      return {
        contributed: false,
        completed: false,
        alreadyContributed: true,
        challengeId: challenge.id,
        newCurrentValue: challenge.currentValue,
      }
    }
    return { contributed: false, completed: false }
  }
}

// ─── Authoritative Learning Session Summary Processor ─────────────────────────

export async function processLearningSessionSummaryEngagement(
  db: D1Database,
  summary: SessionSummary,
  analyticsDb?: D1Database,
  ctx?: { waitUntil: (promise: Promise<unknown>) => void },
): Promise<void> {
  const now = summary.endedAt || Date.now()

  // Extract account IDs from activeMembers (format "acc:123" or "123")
  const participantAccountIds = new Set<number>()
  for (const m of summary.activeMembers || []) {
    const rawId = m.startsWith('acc:') ? m.slice(4) : m
    const idNum = parseInt(rawId, 10)
    if (Number.isFinite(idNum) && idNum > 0) {
      participantAccountIds.add(idNum)
    }
  }

  const isMultiParticipant = participantAccountIds.size >= 2

  for (const accountId of participantAccountIds) {
    try {
      // 1. Update Study Streak
      const streakRes = await updateStudyStreak(db, accountId, now)

      // 2. Award Session Completion XP (+20 XP)
      const sessionSourceKey = `session:${summary.sessionId}:acc:${accountId}`
      const xpRes = await awardXp(db, {
        accountId,
        amount: XP_SESSION_COMPLETE,
        reason: 'session_completed',
        sourceKey: sessionSourceKey,
        timestamp: now,
      })

      // 3. If multi-participant session, try unlock 'study_together' achievement
      if (isMultiParticipant) {
        try {
          await db
            .prepare(
              `INSERT OR IGNORE INTO achievement_unlocks (account_id, achievement_key, source_key, unlocked_at)
               VALUES (?1, 'study_together', ?2, ?3)`,
            )
            .bind(accountId, `study_together:session:${summary.sessionId}:acc:${accountId}`, now)
            .run()
        } catch {}
      }

      // 4. Query student's class (lop_id) for class challenges
      const studentClass = await db
        .prepare(`SELECT lop_id FROM tai_khoan_campus WHERE id = ?1`)
        .bind(accountId)
        .first<{ lop_id: number | null }>()

      if (studentClass?.lop_id) {
        // Contribute to class session challenge
        await contributeToClassChallenge(db, {
          lopId: studentClass.lop_id,
          accountId,
          targetType: 'sessions_count',
          sourceKey: `challenge_session:${summary.sessionId}:acc:${accountId}`,
          now,
        })
      }

      // 5. Evaluate achievements
      const newlyUnlocked = await evaluateAchievements(db, accountId, now)

      // 6. Record analytics events (non-blocking)
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
      console.error(`[processLearningSessionSummaryEngagement] Lỗi xử lý cho accountId=${accountId}:`, err)
    }
  }
}
