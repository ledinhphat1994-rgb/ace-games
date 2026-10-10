/**
 * Digital Campus v2 — Product Analytics & Observability Pipeline (M0.1)
 *
 * Guaranteed Invariants:
 * 1. Primary Database Failure Isolation:
 *    All analytics events write to env.ANALYTICS_DB exclusively.
 *    The core application database (env.DB) NEVER receives any analytics writes.
 * 2. Fail-Safe & Non-Blocking:
 *    Writes are deferred via ctx.waitUntil. Ingestion errors log a warning.
 *    Any failure in ANALYTICS_DB does not affect user business operations.
 * 3. Strict Zero-PII Boundary:
 *    Sanitizer accepts ONLY flat bounded primitives (string <= 128, number, boolean, null).
 *    All nested objects, arrays, and forbidden keys (passwords, tokens, cookies, OTPs,
 *    chat text, note content, whiteboard strokes, IPs, etc.) are strictly dropped.
 * 4. Exact Event Taxonomy (25 Authoritative Events):
 *    Aligned across types, engine, documentation, tests, and UI.
 * 5. Active User Semantics:
 *    Strictly intentional meaningful room/social activity.
 *    WebSocket reconnects, ping/pong, and page reloads NEVER count toward DAU/WAU/MAU.
 * 6. Same-User Sequential Funnel:
 *    Unique user progression where Stage N requires completion of Stages 1..N-1.
 * 7. Exact Actor-Level Cohort Retention (D1 & D7):
 *    Cohort based on user's first-ever meaningful activity date T, returned on T+1 / T+7.
 * 8. Raw Event Retention:
 *    Bounded to 60 days with non-blocking cleanup.
 */

export const RAW_ANALYTICS_RETENTION_DAYS = 60

/** Complete list of all 25 authoritative event keys */
export type AnalyticsEventName =
  // Auth (2)
  | 'auth.login_succeeded'
  | 'auth.login_failed'
  // Campus (2)
  | 'campus.session_started'
  | 'campus.session_ended'
  // Room (4)
  | 'room.created'
  | 'room.joined'
  | 'room.left'
  | 'room.admission_failed'
  // Interaction (7)
  | 'chat.message_sent'
  | 'voice.publish_started'
  | 'voice.publish_ended'
  | 'voice.publish_failed'
  | 'notes.updated'
  | 'whiteboard.updated'
  | 'media.playback_started'
  // Social (3)
  | 'friend.request_sent'
  | 'friend.request_accepted'
  | 'notification.opened'
  // Moderation (2)
  | 'report.submitted'
  | 'moderation.action_completed'
  // Games (2)
  | 'game.session_started'
  | 'game.session_completed'
  // Learning Session (7)
  | 'session.goal_set'
  | 'session.task_added'
  | 'session.task_completed'
  | 'session.timer_started'
  | 'session.poll_created'
  | 'session.poll_voted'
  | 'session.ended'
  // Engagement (6)
  | 'engagement.xp_awarded'
  | 'engagement.streak_extended'
  | 'engagement.achievement_unlocked'
  | 'engagement.challenge_progressed'
  | 'engagement.invite_sent'
  | 'engagement.invite_accepted'
  // DO Operations (2)
  | 'do.sfu_close_failed'
  | 'do.revocation_retry'
  // HTTP Telemetry (1)
  | 'http.request'

export const ALL_ANALYTICS_EVENTS: readonly AnalyticsEventName[] = [
  'auth.login_succeeded',
  'auth.login_failed',
  'campus.session_started',
  'campus.session_ended',
  'room.created',
  'room.joined',
  'room.left',
  'room.admission_failed',
  'chat.message_sent',
  'voice.publish_started',
  'voice.publish_ended',
  'voice.publish_failed',
  'notes.updated',
  'whiteboard.updated',
  'media.playback_started',
  'friend.request_sent',
  'friend.request_accepted',
  'notification.opened',
  'report.submitted',
  'moderation.action_completed',
  'game.session_started',
  'game.session_completed',
  'session.goal_set',
  'session.task_added',
  'session.task_completed',
  'session.timer_started',
  'session.poll_created',
  'session.poll_voted',
  'session.ended',
  'engagement.xp_awarded',
  'engagement.streak_extended',
  'engagement.achievement_unlocked',
  'engagement.challenge_progressed',
  'engagement.invite_sent',
  'engagement.invite_accepted',
  'do.sfu_close_failed',
  'do.revocation_retry',
  'http.request',
] as const

/**
 * Meaningful events that count towards Active User (DAU/WAU/MAU) and Cohort Retention.
 * Excludes transport/presence noise (campus.session_started, WebSocket reconnects, pings, http.request).
 */
export const MEANINGFUL_EVENTS = [
  'room.joined',
  'chat.message_sent',
  'voice.publish_started',
  'notes.updated',
  'whiteboard.updated',
  'media.playback_started',
  'game.session_started',
  'game.session_completed',
  'session.task_completed',
  'session.poll_voted',
  'session.ended',
  'friend.request_sent',
  'friend.request_accepted',
  'report.submitted',
  'moderation.action_completed',
  'engagement.xp_awarded',
  'engagement.achievement_unlocked',
  'engagement.challenge_progressed',
] as const

export interface AnalyticsEventInput {
  event: AnalyticsEventName | (string & {})
  actorId?: number | null
  sessionId?: string | null
  roomId?: number | null
  route?: string | null
  statusCode?: number | null
  durationMs?: number | null
  errorClass?: string | null
  properties?: Record<string, unknown>
}

export interface AnalyticsOverview {
  window: 'today' | '7d' | '30d'
  generatedAt: number
  databaseIsolated: boolean
  totalTaxonomyEvents: number
  activeUsers: {
    dau: number
    wau: number
    mau: number
    newLogins: number
  }
  retention: {
    d1Percent: number
    d7Percent: number
    d1CohortSize: number
    d1RetainedCount: number
    d7CohortSize: number
    d7RetainedCount: number
  }
  funnel: {
    stage1Users: number // Distinct users who logged in
    stage2Users: number // Logged in AND entered Campus
    stage3Users: number // Logged in AND entered Campus AND joined Room
    stage4Users: number // Logged in AND entered Campus AND joined Room AND performed meaningful interaction
    stage2RatePercent: number // Stage 2 / Stage 1
    stage3RatePercent: number // Stage 3 / Stage 2
    stage4RatePercent: number // Stage 4 / Stage 3
    overallRatePercent: number // Stage 4 / Stage 1
  }
  featureAdoption: Record<
    string,
    {
      eventCount: number
      uniqueActors: number
    }
  >
  sessionMetrics: {
    totalRoomJoins: number
    avgRoomSessionDurationSec: number
  }
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

/** Blacklisted key patterns that must NEVER be recorded in product analytics */
const FORBIDDEN_KEY_PATTERNS = [
  /password/i,
  /mat_khau/i,
  /matkhau/i,
  /hash/i,
  /salt/i,
  /otp/i,
  /code/i,
  /token/i,
  /secret/i,
  /cookie/i,
  /auth/i,
  /authorization/i,
  /credential/i,
  /jwt/i,
  /content/i,
  /text/i,
  /noi_dung/i,
  /noidung/i,
  /snippet/i,
  /body/i,
  /message/i,
  /tin_nhan/i,
  /ip/i,
  /address/i,
  /private/i,
]

/**
 * Sanitizes arbitrary properties payload to ensure compliance with Zero-PII rules.
 * Retains only bounded flat primitives (boolean, finite number, safe short strings <= 128, null).
 * ALL nested objects, arrays, and forbidden keys are dropped.
 */
export function sanitizeAnalyticsProperties(
  props?: Record<string, unknown>,
): Record<string, string | number | boolean | null> | null {
  if (!props || typeof props !== 'object' || Array.isArray(props)) return null

  const clean: Record<string, string | number | boolean | null> = {}
  for (const [key, value] of Object.entries(props)) {
    // 1. Enforce key blacklist
    if (FORBIDDEN_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
      continue
    }

    // 2. Reject any nested structures (objects, arrays) completely
    if (value !== null && typeof value === 'object') {
      continue
    }

    // 3. Enforce primitive types only
    if (typeof value === 'boolean') {
      clean[key] = value
      continue
    }

    if (typeof value === 'number') {
      clean[key] = Number.isFinite(value) ? value : null
      continue
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      clean[key] = trimmed.length > 128 ? trimmed.slice(0, 128) : trimmed
      continue
    }

    if (value === null) {
      clean[key] = null
    }
  }

  return Object.keys(clean).length > 0 ? clean : null
}

/**
 * Normalizes an HTTP route to bound dimension cardinality (e.g. /api/rooms/7/admit -> /api/rooms/:id/admit)
 */
export function normalizeAnalyticsRoute(pathname: string): string {
  return pathname
    .replace(/\/api\/rooms\/[^\/]+/g, '/api/rooms/:id')
    .replace(/\/room\/[^\/]+/g, '/room/:id')
    .replace(/\/api\/social\/[^\/]+/g, (m) => m)
    .replace(/\/api\/reports\/[^\/]+/g, '/api/reports/:id')
    .slice(0, 128)
}

const CREATE_ANALYTICS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS analytics_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  event           TEXT NOT NULL,
  actor_id        INTEGER,
  session_id      TEXT,
  room_id         INTEGER,
  route           TEXT,
  status_code     INTEGER,
  duration_ms     INTEGER,
  error_class     TEXT,
  properties_json TEXT,
  created_at      INTEGER NOT NULL,
  created_date    TEXT NOT NULL
)`

const CREATE_ANALYTICS_INDEX_SQLS = [
  'CREATE INDEX IF NOT EXISTS idx_analytics_date_event ON analytics_events(created_date, event)',
  'CREATE INDEX IF NOT EXISTS idx_analytics_actor_date ON analytics_events(actor_id, created_date)',
  'CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_analytics_room_event ON analytics_events(room_id, event)',
  'CREATE INDEX IF NOT EXISTS idx_analytics_route_status ON analytics_events(route, status_code)',
]

const schemaEnsuredDbs = new WeakSet<D1Database>()
let schemaInitPromise: Promise<void> | null = null

export async function ensureAnalyticsSchema(analyticsDb: D1Database): Promise<void> {
  if (schemaEnsuredDbs.has(analyticsDb)) return
  if (schemaInitPromise) {
    await schemaInitPromise
    return
  }

  schemaInitPromise = (async () => {
    try {
      await analyticsDb.prepare(CREATE_ANALYTICS_TABLE_SQL).run()
      for (const idxSql of CREATE_ANALYTICS_INDEX_SQLS) {
        await analyticsDb.prepare(idxSql).run().catch(() => {})
      }
      schemaEnsuredDbs.add(analyticsDb)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn('[Analytics] Lỗi khởi tạo schema analytics_events:', msg)
    } finally {
      schemaInitPromise = null
    }
  })()

  await schemaInitPromise
}

/**
 * Asynchronously and non-blockingly records a telemetry/analytics event into the isolated ANALYTICS_DB.
 *
 * Invariants:
 * - Writes ONLY to analyticsDb. If analyticsDb is missing/undefined, returns immediately.
 * - NEVER touches or falls back to primary application DB (env.DB).
 * - NEVER throws; errors are caught and logged as light warnings.
 */
export function recordAnalyticsEvent(
  analyticsDb: D1Database | undefined,
  ctx: { waitUntil: (promise: Promise<unknown>) => void } | undefined,
  input: AnalyticsEventInput,
): void {
  if (!analyticsDb) return

  const now = Date.now()
  const dateStr = new Date(now).toISOString().split('T')[0]
  const cleanProps = sanitizeAnalyticsProperties(input.properties)
  const propsJson = cleanProps ? JSON.stringify(cleanProps) : null

  try {
    const stmt = analyticsDb
      .prepare(
        `INSERT INTO analytics_events (
          event, actor_id, session_id, room_id, route, status_code, duration_ms, error_class, properties_json, created_at, created_date
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
      )
      .bind(
        input.event.slice(0, 64),
        input.actorId ?? null,
        input.sessionId ? String(input.sessionId).slice(0, 64) : null,
        input.roomId ?? null,
        input.route ? normalizeAnalyticsRoute(input.route) : null,
        input.statusCode ?? null,
        typeof input.durationMs === 'number' && Number.isFinite(input.durationMs)
          ? Math.max(0, Math.round(input.durationMs))
          : null,
        input.errorClass ? String(input.errorClass).slice(0, 64) : null,
        propsJson,
        now,
        dateStr,
      )

    const task = stmt
      .run()
      .catch(async (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('no such table: analytics_events')) {
          await ensureAnalyticsSchema(analyticsDb)
          try {
            await stmt.run()
            return
          } catch (retryErr: unknown) {
            const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr)
            console.warn(`[Analytics] Lỗi ghi analytics event (${input.event}) sau khi tạo bảng:`, retryMsg)
            return
          }
        }
        // Non-blocking fail-safe: warning only
        console.warn(`[Analytics] Lỗi ghi analytics event (${input.event}):`, msg)
      })

    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(task)
    } else {
      void task
    }
  } catch (syncErr: unknown) {
    const msg = syncErr instanceof Error ? syncErr.message : String(syncErr)
    console.warn(`[Analytics] Ngoại lệ đồng bộ khi ghi analytics event (${input.event}):`, msg)
  }
}

/**
 * Prunes raw events older than maxAgeDays to prevent unbounded D1 growth.
 * Non-blocking, fails safe.
 */
export async function pruneExpiredAnalytics(
  analyticsDb: D1Database | undefined,
  maxAgeDays = RAW_ANALYTICS_RETENTION_DAYS,
): Promise<number> {
  if (!analyticsDb) return 0
  const cutoffMs = Date.now() - maxAgeDays * 86400000
  try {
    const res = await analyticsDb
      .prepare('DELETE FROM analytics_events WHERE created_at < ?1')
      .bind(cutoffMs)
      .run()
    return res.meta?.changes ?? 0
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('no such table: analytics_events')) {
      await ensureAnalyticsSchema(analyticsDb)
      return 0
    }
    console.warn('[Analytics] Lỗi dọn dẹp analytics cũ:', err)
    return 0
  }
}

/**
 * Computes high-level aggregated analytics overview for School Admins from the isolated ANALYTICS_DB.
 */
export async function computeAnalyticsOverview(
  analyticsDb: D1Database,
  window: 'today' | '7d' | '30d',
): Promise<AnalyticsOverview> {
  await ensureAnalyticsSchema(analyticsDb)
  const now = Date.now()
  const todayStr = new Date(now).toISOString().split('T')[0]

  const daysBack = window === 'today' ? 0 : window === '7d' ? 7 : 30
  const startDateMs = now - daysBack * 86400000
  const startDateStr = new Date(startDateMs).toISOString().split('T')[0]

  const meaningfulSqlList = MEANINGFUL_EVENTS.map((e) => `'${e}'`).join(',')

  // 1. Active Users (Strict Meaningful Interaction Only — Reconnects & pings excluded)
  const dauResult = await analyticsDb
    .prepare(
      `SELECT COUNT(DISTINCT actor_id) as count
       FROM analytics_events
       WHERE created_date = ?1
         AND actor_id IS NOT NULL
         AND event IN (${meaningfulSqlList})`,
    )
    .bind(todayStr)
    .first<{ count: number }>()
    .catch(() => ({ count: 0 }))

  const wauDateStr = new Date(now - 7 * 86400000).toISOString().split('T')[0]
  const wauResult = await analyticsDb
    .prepare(
      `SELECT COUNT(DISTINCT actor_id) as count
       FROM analytics_events
       WHERE created_date >= ?1
         AND actor_id IS NOT NULL
         AND event IN (${meaningfulSqlList})`,
    )
    .bind(wauDateStr)
    .first<{ count: number }>()
    .catch(() => ({ count: 0 }))

  const mauDateStr = new Date(now - 30 * 86400000).toISOString().split('T')[0]
  const mauResult = await analyticsDb
    .prepare(
      `SELECT COUNT(DISTINCT actor_id) as count
       FROM analytics_events
       WHERE created_date >= ?1
         AND actor_id IS NOT NULL
         AND event IN (${meaningfulSqlList})`,
    )
    .bind(mauDateStr)
    .first<{ count: number }>()
    .catch(() => ({ count: 0 }))

  const newLoginsResult = await analyticsDb
    .prepare(
      `SELECT COUNT(DISTINCT actor_id) as count
       FROM analytics_events
       WHERE created_date >= ?1
         AND event = 'auth.login_succeeded'`,
    )
    .bind(startDateStr)
    .first<{ count: number }>()
    .catch(() => ({ count: 0 }))

  // 2. Retention (D1 and D7) — Exact First-Meaningful-Activity Date Cohorts
  // Cohort T: Users whose first-ever meaningful activity date was T.
  // Retained: Users in cohort T who had meaningful activity on T+1 (for D1) or T+7 (for D7).
  const yesterdayStr = new Date(now - 86400000).toISOString().split('T')[0]
  const d1RetentionResult = await analyticsDb
    .prepare(
      `WITH first_seen AS (
         SELECT actor_id, MIN(created_date) as first_date
         FROM analytics_events
         WHERE actor_id IS NOT NULL
           AND event IN (${meaningfulSqlList})
         GROUP BY actor_id
         HAVING MIN(created_date) = ?1
       ),
       retained AS (
         SELECT DISTINCT a.actor_id
         FROM analytics_events a
         JOIN first_seen f ON a.actor_id = f.actor_id
         WHERE a.created_date = ?2
           AND a.event IN (${meaningfulSqlList})
       )
       SELECT
         (SELECT COUNT(*) FROM first_seen) as cohortCount,
         (SELECT COUNT(*) FROM retained) as retainedCount`,
    )
    .bind(yesterdayStr, todayStr)
    .first<{ cohortCount: number; retainedCount: number }>()
    .catch(() => ({ cohortCount: 0, retainedCount: 0 }))

  const day7AgoStr = new Date(now - 7 * 86400000).toISOString().split('T')[0]
  const d7RetentionResult = await analyticsDb
    .prepare(
      `WITH first_seen AS (
         SELECT actor_id, MIN(created_date) as first_date
         FROM analytics_events
         WHERE actor_id IS NOT NULL
           AND event IN (${meaningfulSqlList})
         GROUP BY actor_id
         HAVING MIN(created_date) = ?1
       ),
       retained AS (
         SELECT DISTINCT a.actor_id
         FROM analytics_events a
         JOIN first_seen f ON a.actor_id = f.actor_id
         WHERE a.created_date = ?2
           AND a.event IN (${meaningfulSqlList})
       )
       SELECT
         (SELECT COUNT(*) FROM first_seen) as cohortCount,
         (SELECT COUNT(*) FROM retained) as retainedCount`,
    )
    .bind(day7AgoStr, todayStr)
    .first<{ cohortCount: number; retainedCount: number }>()
    .catch(() => ({ cohortCount: 0, retainedCount: 0 }))

  const d1CohortSize = d1RetentionResult?.cohortCount || 0
  const d1RetainedCount = d1RetentionResult?.retainedCount || 0
  const d1Percent = d1CohortSize > 0 ? Math.round((d1RetainedCount / d1CohortSize) * 100) : 0

  const d7CohortSize = d7RetentionResult?.cohortCount || 0
  const d7RetainedCount = d7RetentionResult?.retainedCount || 0
  const d7Percent = d7CohortSize > 0 ? Math.round((d7RetainedCount / d7CohortSize) * 100) : 0

  // 3. Same-User Sequential Product Funnel
  // Stage 1: Logged in (Unique Actors)
  // Stage 2: Logged in -> Entered Campus (same actor, created_at >= login)
  // Stage 3: Logged in -> Entered Campus -> Joined Room (same actor, created_at >= campus)
  // Stage 4: Logged in -> Entered Campus -> Joined Room -> Meaningful interaction (same actor, created_at >= room)
  const funnelResult = await analyticsDb
    .prepare(
      `WITH
       logins AS (
         SELECT actor_id, MIN(created_at) AS t1
         FROM analytics_events
         WHERE created_date >= ?1
           AND event = 'auth.login_succeeded'
           AND actor_id IS NOT NULL
         GROUP BY actor_id
       ),
       campus AS (
         SELECT a.actor_id, MIN(a.created_at) AS t2
         FROM analytics_events a
         JOIN logins l ON a.actor_id = l.actor_id AND a.created_at >= l.t1
         WHERE a.created_date >= ?1
           AND a.event = 'campus.session_started'
         GROUP BY a.actor_id
       ),
       rooms AS (
         SELECT a.actor_id, MIN(a.created_at) AS t3
         FROM analytics_events a
         JOIN campus c ON a.actor_id = c.actor_id AND a.created_at >= c.t2
         WHERE a.created_date >= ?1
           AND a.event = 'room.joined'
         GROUP BY a.actor_id
       ),
       meaningful AS (
         SELECT DISTINCT a.actor_id
         FROM analytics_events a
         JOIN rooms r ON a.actor_id = r.actor_id AND a.created_at >= r.t3
         WHERE a.created_date >= ?1
           AND a.event IN (${meaningfulSqlList})
       )
       SELECT
         (SELECT COUNT(*) FROM logins) AS stage1_users,
         (SELECT COUNT(*) FROM campus) AS stage2_users,
         (SELECT COUNT(*) FROM rooms) AS stage3_users,
         (SELECT COUNT(*) FROM meaningful) AS stage4_users`,
    )
    .bind(startDateStr)
    .first<{
      stage1_users: number
      stage2_users: number
      stage3_users: number
      stage4_users: number
    }>()
    .catch(() => ({
      stage1_users: 0,
      stage2_users: 0,
      stage3_users: 0,
      stage4_users: 0,
    }))

  const stage1Users = funnelResult?.stage1_users || 0
  const stage2Users = funnelResult?.stage2_users || 0
  const stage3Users = funnelResult?.stage3_users || 0
  const stage4Users = funnelResult?.stage4_users || 0

  const stage2RatePercent = stage1Users > 0 ? Math.round((stage2Users / stage1Users) * 100) : 0
  const stage3RatePercent = stage2Users > 0 ? Math.round((stage3Users / stage2Users) * 100) : 0
  const stage4RatePercent = stage3Users > 0 ? Math.round((stage4Users / stage3Users) * 100) : 0
  const overallRatePercent = stage1Users > 0 ? Math.round((stage4Users / stage1Users) * 100) : 0

  // 4. Feature Adoption Breakdown
  const featureGroups: Record<string, string[]> = {
    room: ['room.joined'],
    voice: ['voice.publish_started'],
    chat: ['chat.message_sent'],
    notes: ['notes.updated'],
    whiteboard: ['whiteboard.updated'],
    media: ['media.playback_started'],
    friends: ['friend.request_sent', 'friend.request_accepted'],
    moderation: ['report.submitted', 'moderation.action_completed'],
    games: ['game.session_started'],
    learningSession: [
      'session.goal_set',
      'session.task_added',
      'session.task_completed',
      'session.timer_started',
      'session.poll_created',
      'session.poll_voted',
      'session.ended',
    ],
    engagement: [
      'engagement.xp_awarded',
      'engagement.streak_extended',
      'engagement.achievement_unlocked',
      'engagement.challenge_progressed',
      'engagement.invite_sent',
      'engagement.invite_accepted',
    ],
  }

  const featureAdoption: Record<string, { eventCount: number; uniqueActors: number }> = {}

  for (const [feature, eventList] of Object.entries(featureGroups)) {
    const res = await analyticsDb
      .prepare(
        `SELECT COUNT(*) as eventCount, COUNT(DISTINCT actor_id) as uniqueActors
         FROM analytics_events
         WHERE created_date >= ?1
           AND event IN (${eventList.map((e) => `'${e}'`).join(',')})`,
      )
      .bind(startDateStr)
      .first<{ eventCount: number; uniqueActors: number }>()
      .catch(() => ({ eventCount: 0, uniqueActors: 0 }))

    featureAdoption[feature] = {
      eventCount: res?.eventCount || 0,
      uniqueActors: res?.uniqueActors || 0,
    }
  }

  // 5. Session Metrics
  const durationRes = await analyticsDb
    .prepare(
      `SELECT AVG(duration_ms) as avgDuration
       FROM analytics_events
       WHERE created_date >= ?1
         AND event = 'room.left'
         AND duration_ms > 0
         AND duration_ms < 86400000`,
    )
    .bind(startDateStr)
    .first<{ avgDuration: number | null }>()
    .catch(() => ({ avgDuration: null }))

  const avgRoomSessionDurationSec = durationRes?.avgDuration
    ? Math.round(durationRes.avgDuration / 1000)
    : 0

  // 6. Operational Health (HTTP requests, errors, latency, DO issues)
  const httpRes = await analyticsDb
    .prepare(
      `SELECT
         COUNT(*) as totalRequests,
         SUM(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 ELSE 0 END) as count4xx,
         SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as count5xx
       FROM analytics_events
       WHERE created_date >= ?1
         AND event = 'http.request'`,
    )
    .bind(startDateStr)
    .first<{ totalRequests: number; count4xx: number; count5xx: number }>()
    .catch(() => ({ totalRequests: 0, count4xx: 0, count5xx: 0 }))

  const totalReqs = httpRes?.totalRequests || 0
  const err4xx = httpRes?.count4xx || 0
  const err5xx = httpRes?.count5xx || 0

  // Approximate p50 and p95 latencies
  const latenciesRes = await analyticsDb
    .prepare(
      `SELECT duration_ms
       FROM analytics_events
       WHERE created_date >= ?1
         AND event = 'http.request'
         AND duration_ms IS NOT NULL
       ORDER BY duration_ms ASC
       LIMIT 1000`,
    )
    .bind(startDateStr)
    .all<{ duration_ms: number }>()
    .catch(() => ({ results: [] }))

  const latencies = (latenciesRes.results || []).map((r) => r.duration_ms)
  let p50LatencyMs = 0
  let p95LatencyMs = 0
  if (latencies.length > 0) {
    const p50Idx = Math.floor(latencies.length * 0.5)
    const p95Idx = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))
    p50LatencyMs = latencies[p50Idx] || 0
    p95LatencyMs = latencies[p95Idx] || 0
  }

  // Top error classes
  const topErrorsRes = await analyticsDb
    .prepare(
      `SELECT error_class, COUNT(*) as count
       FROM analytics_events
       WHERE created_date >= ?1
         AND event = 'http.request'
         AND error_class IS NOT NULL
       GROUP BY error_class
       ORDER BY count DESC
       LIMIT 5`,
    )
    .bind(startDateStr)
    .all<{ error_class: string; count: number }>()
    .catch(() => ({ results: [] }))

  const topErrorClasses = (topErrorsRes.results || []).map((r) => ({
    errorClass: r.error_class,
    count: r.count,
  }))

  const doRpcRes = await analyticsDb
    .prepare(
      `SELECT COUNT(*) as count
       FROM analytics_events
       WHERE created_date >= ?1
         AND event = 'do.sfu_close_failed'`,
    )
    .bind(startDateStr)
    .first<{ count: number }>()
    .catch(() => ({ count: 0 }))

  const revocationRetryRes = await analyticsDb
    .prepare(
      `SELECT COUNT(*) as count
       FROM analytics_events
       WHERE created_date >= ?1
         AND event = 'do.revocation_retry'`,
    )
    .bind(startDateStr)
    .first<{ count: number }>()
    .catch(() => ({ count: 0 }))

  return {
    window,
    generatedAt: now,
    databaseIsolated: true,
    totalTaxonomyEvents: ALL_ANALYTICS_EVENTS.length,
    activeUsers: {
      dau: dauResult?.count || 0,
      wau: wauResult?.count || 0,
      mau: mauResult?.count || 0,
      newLogins: newLoginsResult?.count || 0,
    },
    retention: {
      d1Percent,
      d7Percent,
      d1CohortSize,
      d1RetainedCount,
      d7CohortSize,
      d7RetainedCount,
    },
    funnel: {
      stage1Users,
      stage2Users,
      stage3Users,
      stage4Users,
      stage2RatePercent,
      stage3RatePercent,
      stage4RatePercent,
      overallRatePercent,
    },
    featureAdoption,
    sessionMetrics: {
      totalRoomJoins: stage3Users,
      avgRoomSessionDurationSec,
    },
    operationalHealth: {
      totalRequests: totalReqs,
      errorRate4xx: totalReqs > 0 ? Number(((err4xx / totalReqs) * 100).toFixed(2)) : 0,
      errorRate5xx: totalReqs > 0 ? Number(((err5xx / totalReqs) * 100).toFixed(2)) : 0,
      p50LatencyMs,
      p95LatencyMs,
      topErrorClasses,
      doRpcFailureCount: doRpcRes?.count || 0,
      revocationRetryCount: revocationRetryRes?.count || 0,
    },
  }
}
