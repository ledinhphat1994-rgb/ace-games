/**
 * Digital Campus v2 — Server-Authoritative Notification Service
 * worker/services/notification-service.ts
 *
 * Implements persistent, idempotent, server-authoritative notification
 * management with strict recipient isolation in Cloudflare D1.
 */

import type { NotificationItem, NotificationType } from '../../shared/protocol/notification'

export interface CreateNotificationInput {
  recipientId: number
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown> | null
  idempotencyKey?: string | null
  now?: number
}

interface RawNotificationRow {
  id: number
  recipient_id: number
  type: string
  title: string
  body: string
  data_json: string | null
  read_at: number | null
  idempotency_key: string | null
  created_at: number
}

function parseDataJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

function mapRowToItem(row: RawNotificationRow): NotificationItem {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    data: parseDataJson(row.data_json),
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

/**
 * Creates a notification authoritatively in D1.
 * Uses idempotency_key with INSERT OR IGNORE to guarantee replay safety.
 */
export async function createNotification(
  db: D1Database,
  input: CreateNotificationInput,
): Promise<{ id: number; created: boolean } | null> {
  const now = input.now ?? Date.now()
  const dataJson = input.data ? JSON.stringify(input.data) : null
  const key = input.idempotencyKey ?? null

  try {
    const res = await db.prepare(
      `INSERT OR IGNORE INTO notifications
       (recipient_id, type, title, body, data_json, read_at, idempotency_key, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, NULL, ?6, ?7)`,
    )
      .bind(
        input.recipientId,
        input.type,
        input.title.slice(0, 200),
        input.body.slice(0, 1000),
        dataJson,
        key,
        now,
      )
      .run()

    const created = !!(res.meta?.changes && res.meta.changes > 0)

    if (created && res.meta?.last_row_id) {
      return { id: res.meta.last_row_id, created: true }
    }

    // If duplicate event with same idempotency_key was ignored, fetch existing row ID
    if (key) {
      const existing = await db.prepare(
        'SELECT id FROM notifications WHERE idempotency_key = ?1',
      )
        .bind(key)
        .first<{ id: number }>()

      if (existing) {
        return { id: existing.id, created: false }
      }
    }

    return null
  } catch (err) {
    console.error('[notification-service] Lỗi tạo thông báo D1:', err)
    return null
  }
}

export interface ListNotificationsOptions {
  limit?: number
  offset?: number
  unreadOnly?: boolean
}

/**
 * Lists notifications with bounded pagination for the authenticated recipient.
 * Enforces recipient_id isolation.
 */
export async function listNotifications(
  db: D1Database,
  recipientId: number,
  options: ListNotificationsOptions = {},
): Promise<{
  items: NotificationItem[]
  unreadCount: number
  totalCount: number
  hasMore: boolean
}> {
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50)
  const offset = Math.max(Number(options.offset) || 0, 0)
  const unreadOnly = Boolean(options.unreadOnly)

  const whereClause = unreadOnly
    ? 'WHERE recipient_id = ?1 AND read_at IS NULL'
    : 'WHERE recipient_id = ?1'

  // Run queries in parallel for efficiency
  const [rowsResult, countResult, unreadCountResult] = await Promise.all([
    db.prepare(
      `SELECT id, recipient_id, type, title, body, data_json, read_at, idempotency_key, created_at
       FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ?2 OFFSET ?3`,
    )
      .bind(recipientId, limit + 1, offset)
      .all<RawNotificationRow>(),

    db.prepare(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
    )
      .bind(recipientId)
      .first<{ total: number }>(),

    db.prepare(
      'SELECT COUNT(*) as unread FROM notifications WHERE recipient_id = ?1 AND read_at IS NULL',
    )
      .bind(recipientId)
      .first<{ unread: number }>(),
  ])

  const rawRows = rowsResult.results || []
  const hasMore = rawRows.length > limit
  const rows = hasMore ? rawRows.slice(0, limit) : rawRows

  return {
    items: rows.map(mapRowToItem),
    unreadCount: unreadCountResult?.unread || 0,
    totalCount: countResult?.total || 0,
    hasMore,
  }
}

/**
 * Returns unread notification count for badge rendering.
 */
export async function getUnreadNotificationCount(
  db: D1Database,
  recipientId: number,
): Promise<number> {
  const res = await db.prepare(
    'SELECT COUNT(*) as unread FROM notifications WHERE recipient_id = ?1 AND read_at IS NULL',
  )
    .bind(recipientId)
    .first<{ unread: number }>()

  return res?.unread || 0
}

/**
 * Marks a single notification as read, guarded by recipientId.
 */
export async function markNotificationRead(
  db: D1Database,
  recipientId: number,
  notificationId: number,
  now = Date.now(),
): Promise<boolean> {
  const res = await db.prepare(
    `UPDATE notifications
     SET read_at = ?1
     WHERE id = ?2 AND recipient_id = ?3 AND read_at IS NULL`,
  )
    .bind(now, notificationId, recipientId)
    .run()

  return !!(res.meta?.changes && res.meta.changes > 0)
}

/**
 * Marks all unread notifications as read for the recipient.
 */
export async function markAllNotificationsRead(
  db: D1Database,
  recipientId: number,
  now = Date.now(),
): Promise<number> {
  const res = await db.prepare(
    `UPDATE notifications
     SET read_at = ?1
     WHERE recipient_id = ?2 AND read_at IS NULL`,
  )
    .bind(now, recipientId)
    .run()

  return res.meta?.changes || 0
}
