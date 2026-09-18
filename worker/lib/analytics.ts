/**
 * Digital Campus v2 — Product Analytics & Observability Pipeline (M0)
 *
 * Guaranteed Invariants:
 * 1. Strict Privacy & Zero-PII: Strips any sensitive credentials, tokens, OTPs,
 *    passwords, message contents, and raw user-generated text.
 * 2. Fail-Safe & Non-Blocking: Emitted asynchronously via ctx.waitUntil.
 *    Any ingestion errors log a light warning; business operations NEVER fail.
 * 3. Separation of Concerns: Product analytics are distinct from security audit logs.
 */

export interface AnalyticsEventInput {
  event: string
  actorId?: number | null
  sessionId?: string | null
  roomId?: number | null
  route?: string | null
  statusCode?: number | null
  durationMs?: number | null
  errorClass?: string | null
  properties?: Record<string, string | number | boolean | null>
}

export interface AnalyticsOverview {
  window: 'today' | '7d' | '30d'
  generatedAt: number
  activeUsers: {
    dau: number
    wau: number
    mau: number
    newLogins: number
  }
  retention: {
    d1Percent: number
    d7Percent: number
  }
  funnel: {
    loginCount: number
    campusArrivals: number
    roomJoins: number
    meaningfulInteractions: number
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
  /jwt/i,
  /content/i,
  /text/i,
  /snippet/i,
  /body/i,
  /message/i,
  /tin_nhan/i,
  /ip/i,
  /address/i,
]

/**
 * Sanitizes arbitrary properties payload to ensure compliance with Zero-PII rules.
 * Retains only safe primitives (boolean, number, safe short strings) with non-sensitive keys.
 */
export function sanitizeAnalyticsProperties(
  props?: Record<string, string | number | boolean | null>,
): Record<string, string | number | boolean | null> | null {
  if (!props || typeof props !== 'object') return null

  const clean: Record<string, string | number | boolean | null> = {}
  for (const [key, value] of Object.entries(props)) {
    // 1. Enforce key blacklist
    if (FORBIDDEN_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
      continue
    }

    // 2. Enforce primitive types only
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
      // Enforce max string length (128 chars) to avoid storing large text
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
    .replace(/\/api\/social\/[^\/]+/g, (m) => m) // specific social endpoints
    .replace(/\/api\/reports\/[^\/]+/g, '/api/reports/:id')
    .slice(0, 128)
}

/**
 * Asynchronously and non-blockingly records a telemetry/analytics event into D1.
 * NEVER throws; errors are caught and logged as warnings.
 */
export function recordAnalyticsEvent(
  db: D1Database,
  ctx: { waitUntil: (promise: Promise<unknown>) => void } | undefined,
  input: AnalyticsEventInput,
): void {
  const now = Date.now()
  const dateStr = new Date(now).toISOString().split('T')[0]
  const cleanProps = sanitizeAnalyticsProperties(input.properties)
  const propsJson = cleanProps ? JSON.stringify(cleanProps) : null

  const task = db
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
    .run()
    .catch((err: unknown) => {
      // Non-blocking fail-safe: warning only
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[Analytics] Lỗi ghi analytics event (${input.event}):`, msg)
    })

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(task)
  } else {
    // Fire-and-forget fallback
    void task
  }
}

/** Meaningful events that count towards Active User (DAU/WAU/MAU) and funnel conversion */
const MEANINGFUL_EVENTS = [
  'auth.login_succeeded',
  'room.joined',
  'chat.message_sent',
  'notes.updated',
  'whiteboard.updated',
  'voice.publish_started',
  'game.session_started',
]

/**
 * Computes high-level aggregated analytics overview for School Admins.
 */
export async function computeAnalyticsOverview(
  db: D1Database,
  window: 'today' | '7d' | '30d',
): Promise<AnalyticsOverview> {
  const now = Date.now()
  const todayStr = new Date(now).toISOString().split('T')[0]

  const daysBack = window === 'today' ? 0 : window === '7d' ? 7 : 30
  const startDateMs = now - daysBack * 86400000
  const startDateStr = new Date(startDateMs).toISOString().split('T')[0]

  // 1. Active Users (DAU, WAU, MAU)
  const dauResult = await db
    .prepare(
      `SELECT COUNT(DISTINCT actor_id) as count
       FROM analytics_events
       WHERE created_date = ?1
         AND actor_id IS NOT NULL
         AND event IN (${MEANINGFUL_EVENTS.map((e) => `'${e}'`).join(',')})`,
    )
    .bind(todayStr)
    .first<{ count: number }>()
    .catch(() => ({ count: 0 }))

  const wauDateStr = new Date(now - 7 * 86400000).toISOString().split('T')[0]
  const wauResult = await db
    .prepare(
      `SELECT COUNT(DISTINCT actor_id) as count
       FROM analytics_events
       WHERE created_date >= ?1
         AND actor_id IS NOT NULL
         AND event IN (${MEANINGFUL_EVENTS.map((e) => `'${e}'`).join(',')})`,
    )
    .bind(wauDateStr)
    .first<{ count: number }>()
    .catch(() => ({ count: 0 }))

  const mauDateStr = new Date(now - 30 * 86400000).toISOString().split('T')[0]
  const mauResult = await db
    .prepare(
      `SELECT COUNT(DISTINCT actor_id) as count
       FROM analytics_events
       WHERE created_date >= ?1
         AND actor_id IS NOT NULL
         AND event IN (${MEANINGFUL_EVENTS.map((e) => `'${e}'`).join(',')})`,
    )
    .bind(mauDateStr)
    .first<{ count: number }>()
    .catch(() => ({ count: 0 }))

  const newLoginsResult = await db
    .prepare(
      `SELECT COUNT(DISTINCT actor_id) as count
       FROM analytics_events
       WHERE created_date >= ?1
         AND event = 'auth.login_succeeded'`,
    )
    .bind(startDateStr)
    .first<{ count: number }>()
    .catch(() => ({ count: 0 }))

  // 2. Retention (D1 and D7)
  const yesterdayStr = new Date(now - 86400000).toISOString().split('T')[0]
  const d1RetentionResult = await db
    .prepare(
      `SELECT
         COUNT(DISTINCT yesterday.actor_id) as cohortCount,
         COUNT(DISTINCT today.actor_id) as retainedCount
       FROM (
         SELECT DISTINCT actor_id FROM analytics_events
         WHERE created_date = ?1 AND actor_id IS NOT NULL
           AND event IN (${MEANINGFUL_EVENTS.map((e) => `'${e}'`).join(',')})
       ) as yesterday
       LEFT JOIN (
         SELECT DISTINCT actor_id FROM analytics_events
         WHERE created_date = ?2 AND actor_id IS NOT NULL
           AND event IN (${MEANINGFUL_EVENTS.map((e) => `'${e}'`).join(',')})
       ) as today ON yesterday.actor_id = today.actor_id`,
    )
    .bind(yesterdayStr, todayStr)
    .first<{ cohortCount: number; retainedCount: number }>()
    .catch(() => ({ cohortCount: 0, retainedCount: 0 }))

  const day7AgoStr = new Date(now - 7 * 86400000).toISOString().split('T')[0]
  const d7RetentionResult = await db
    .prepare(
      `SELECT
         COUNT(DISTINCT past.actor_id) as cohortCount,
         COUNT(DISTINCT today.actor_id) as retainedCount
       FROM (
         SELECT DISTINCT actor_id FROM analytics_events
         WHERE created_date = ?1 AND actor_id IS NOT NULL
           AND event IN (${MEANINGFUL_EVENTS.map((e) => `'${e}'`).join(',')})
       ) as past
       LEFT JOIN (
         SELECT DISTINCT actor_id FROM analytics_events
         WHERE created_date = ?2 AND actor_id IS NOT NULL
           AND event IN (${MEANINGFUL_EVENTS.map((e) => `'${e}'`).join(',')})
       ) as today ON past.actor_id = today.actor_id`,
    )
    .bind(day7AgoStr, todayStr)
    .first<{ cohortCount: number; retainedCount: number }>()
    .catch(() => ({ cohortCount: 0, retainedCount: 0 }))

  const d1Percent =
    d1RetentionResult && d1RetentionResult.cohortCount > 0
      ? Math.round((d1RetentionResult.retainedCount / d1RetentionResult.cohortCount) * 100)
      : 0

  const d7Percent =
    d7RetentionResult && d7RetentionResult.cohortCount > 0
      ? Math.round((d7RetentionResult.retainedCount / d7RetentionResult.cohortCount) * 100)
      : 0

  // 3. Product Funnel
  const funnelEventsResult = await db
    .prepare(
      `SELECT event, COUNT(*) as count
       FROM analytics_events
       WHERE created_date >= ?1
         AND event IN ('auth.login_succeeded', 'campus.session_started', 'room.joined', 'chat.message_sent', 'voice.publish_started', 'notes.updated', 'whiteboard.updated', 'game.session_started')
       GROUP BY event`,
    )
    .bind(startDateStr)
    .all<{ event: string; count: number }>()
    .catch(() => ({ results: [] }))

  const eventCounts: Record<string, number> = {}
  for (const r of funnelEventsResult.results || []) {
    eventCounts[r.event] = r.count
  }

  const loginCount = eventCounts['auth.login_succeeded'] || 0
  const campusArrivals = eventCounts['campus.session_started'] || 0
  const roomJoins = eventCounts['room.joined'] || 0
  const meaningfulInteractions =
    (eventCounts['chat.message_sent'] || 0) +
    (eventCounts['voice.publish_started'] || 0) +
    (eventCounts['notes.updated'] || 0) +
    (eventCounts['whiteboard.updated'] || 0) +
    (eventCounts['game.session_started'] || 0)

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
  }

  const featureAdoption: Record<string, { eventCount: number; uniqueActors: number }> = {}

  for (const [feature, eventList] of Object.entries(featureGroups)) {
    const res = await db
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
  const durationRes = await db
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
  const httpRes = await db
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
  const latenciesRes = await db
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
  const topErrorsRes = await db
    .prepare(
      `SELECT error_class, COUNT(*) as count
       FROM analytics_events
       WHERE created_date >= ?1
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

  const doRpcRes = await db
    .prepare(
      `SELECT COUNT(*) as count
       FROM analytics_events
       WHERE created_date >= ?1
         AND event = 'do.rpc_failed'`,
    )
    .bind(startDateStr)
    .first<{ count: number }>()
    .catch(() => ({ count: 0 }))

  const revocationRetryRes = await db
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
    activeUsers: {
      dau: dauResult?.count || 0,
      wau: wauResult?.count || 0,
      mau: mauResult?.count || 0,
      newLogins: newLoginsResult?.count || 0,
    },
    retention: {
      d1Percent,
      d7Percent,
    },
    funnel: {
      loginCount,
      campusArrivals,
      roomJoins,
      meaningfulInteractions,
    },
    featureAdoption,
    sessionMetrics: {
      totalRoomJoins: roomJoins,
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
