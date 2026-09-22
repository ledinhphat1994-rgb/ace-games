/**
 * Digital Campus v2 — Milestone N1: Notifications / Inbox API
 * worker/routes/notification-api.ts
 *
 * Exposes authenticated endpoints for reading and managing notifications.
 * Strictly enforces recipient isolation (users can only access their own notifications).
 */

import { Hono } from 'hono'
import { kiemTraPhien, layPhien } from '../lib/session'
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notification-service'

export const notificationApp = new Hono<{ Bindings: Env }>()

function loi(message: string, status = 400) {
  return Response.json({ ok: false, loi: message, error: message }, { status })
}

/**
 * GET /api/notifications
 * List notifications for the authenticated user with pagination and filter.
 */
notificationApp.get('/', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const limitParam = c.req.query('limit')
  const offsetParam = c.req.query('offset')
  const filterParam = c.req.query('filter')

  const limit = limitParam ? parseInt(limitParam, 10) : 20
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0
  const unreadOnly = filterParam === 'unread'

  const res = await listNotifications(c.env.DB, kq.taiKhoan.id, {
    limit,
    offset,
    unreadOnly,
  })

  return c.json({
    ok: true,
    notifications: res.items,
    unreadCount: res.unreadCount,
    totalCount: res.totalCount,
    hasMore: res.hasMore,
  })
})

/**
 * GET /api/notifications/unread-count
 * Fast endpoint for retrieving unread notification count (for badges).
 */
notificationApp.get('/unread-count', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const unreadCount = await getUnreadNotificationCount(c.env.DB, kq.taiKhoan.id)
  return c.json({ ok: true, unreadCount })
})

/**
 * POST /api/notifications/:id/read
 * Marks a specific notification as read.
 * Guarantees ownership: cannot mark or probe another user's notifications.
 */
notificationApp.post('/:id/read', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const rawId = c.req.param('id')
  const notifId = parseInt(rawId, 10)
  if (!Number.isInteger(notifId) || notifId <= 0) {
    return loi('Mã thông báo không hợp lệ.', 400)
  }

  // Verify ownership and existence
  const existing = await c.env.DB.prepare(
    'SELECT id, recipient_id, read_at FROM notifications WHERE id = ?1',
  )
    .bind(notifId)
    .first<{ id: number; recipient_id: number; read_at: number | null }>()

  if (!existing || existing.recipient_id !== kq.taiKhoan.id) {
    return loi('Không tìm thấy thông báo.', 404)
  }

  await markNotificationRead(c.env.DB, kq.taiKhoan.id, notifId)
  return c.json({ ok: true })
})

/**
 * POST /api/notifications/read-all
 * Marks all unread notifications as read for current user.
 */
notificationApp.post('/read-all', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const count = await markAllNotificationsRead(c.env.DB, kq.taiKhoan.id)
  return c.json({ ok: true, count })
})
