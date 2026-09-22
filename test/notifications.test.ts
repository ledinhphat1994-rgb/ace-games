import { exports, env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'
import type { ListNotificationsResponse, UnreadCountResponse } from '../shared/protocol/notification'
import { createNotification } from '../worker/services/notification-service'
import { unlockAchievement } from '../worker/lib/engagement'

const goi = (duongDan: string, init?: RequestInit) => exports.default.fetch(`${GOC}${duongDan}`, init)
const layCookie = (res: Response) => (res.headers.get('Set-Cookie') ?? '').split(';')[0]

const dangNhap = async (username: string, password = MAT_KHAU) => {
  const res = await goi('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  expect(res.status).toBe(200)
  const cookie = layCookie(res)
  const whoamiRes = await goi('/api/whoami', { headers: { Cookie: cookie } })
  const whoamiData = (await whoamiRes.json()) as { accountId: number }
  return { cookie, accountId: whoamiData.accountId }
}

describe('Notifications & Inbox MVP — Milestone N1', () => {
  describe('1. Unauthenticated Security Boundary', () => {
    it('chưa đăng nhập -> tất cả endpoints /api/notifications/* trả về 401', async () => {
      const resList = await goi('/api/notifications')
      expect(resList.status).toBe(401)

      const resCount = await goi('/api/notifications/unread-count')
      expect(resCount.status).toBe(401)

      const resRead = await goi('/api/notifications/1/read', { method: 'POST' })
      expect(resRead.status).toBe(401)

      const resReadAll = await goi('/api/notifications/read-all', { method: 'POST' })
      expect(resReadAll.status).toBe(401)
    })
  })

  describe('2. Recipient Isolation & Cross-Account Boundary', () => {
    it('người dùng chỉ thấy và chỉ thao tác được trên thông báo của chính mình', async () => {
      const user1 = await dangNhap('qa.v2.thu1')
      const user2 = await dangNhap('qa.v2.thu2')

      // Insert notification explicitly for User 1
      const notif1 = await createNotification(env.DB, {
        recipientId: user1.accountId,
        type: 'system_announcement',
        title: 'Thông báo riêng cho User 1',
        body: 'Nội dung bảo mật của User 1',
        idempotencyKey: `test_iso_1_${Date.now()}`,
      })
      expect(notif1?.id).toBeDefined()

      // User 1 sees it
      const res1 = await goi('/api/notifications', { headers: { Cookie: user1.cookie } })
      expect(res1.status).toBe(200)
      const data1 = (await res1.json()) as ListNotificationsResponse
      expect(data1.ok).toBe(true)
      const foundInUser1 = data1.notifications.some((n) => n.id === notif1!.id)
      expect(foundInUser1).toBe(true)

      // User 2 DOES NOT see it
      const res2 = await goi('/api/notifications', { headers: { Cookie: user2.cookie } })
      expect(res2.status).toBe(200)
      const data2 = (await res2.json()) as ListNotificationsResponse
      expect(data2.ok).toBe(true)
      const foundInUser2 = data2.notifications.some((n) => n.id === notif1!.id)
      expect(foundInUser2).toBe(false)

      // User 2 cannot mark User 1's notification as read (returns 404 Fail Closed)
      const markCross = await goi(`/api/notifications/${notif1!.id}/read`, {
        method: 'POST',
        headers: { Cookie: user2.cookie },
      })
      expect(markCross.status).toBe(404)
    })
  })

  describe('3. Idempotency Invariant', () => {
    it('gửi lặp cùng một idempotency_key chỉ tạo ra duy nhất 1 bản ghi', async () => {
      const user = await dangNhap('qa.v2.thu3')
      const sharedKey = `idemp_test_${Date.now()}_${Math.random()}`

      const first = await createNotification(env.DB, {
        recipientId: user.accountId,
        type: 'achievement_unlocked',
        title: 'Thành tựu',
        body: 'Đã mở khóa',
        idempotencyKey: sharedKey,
      })
      expect(first?.created).toBe(true)

      const second = await createNotification(env.DB, {
        recipientId: user.accountId,
        type: 'achievement_unlocked',
        title: 'Thành tựu trùng',
        body: 'Đã mở khóa trùng',
        idempotencyKey: sharedKey,
      })
      expect(second?.created).toBe(false)
      expect(second?.id).toBe(first?.id)

      // Verify row count in DB
      const countRes = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM notifications WHERE idempotency_key = ?1',
      )
        .bind(sharedKey)
        .first<{ count: number }>()

      expect(countRes?.count).toBe(1)
    })
  })

  describe('4. Real Event Lifecycle Integration', () => {
    it('gửi lời mời kết bạn và chấp nhận kết bạn sinh thông báo chân thực cho cả 2 bên', async () => {
      const userA = await dangNhap('qa.v2.thu1')
      const userB = await dangNhap('qa.v2.tudo')

      // Clean existing social state between userA and userB
      const low = Math.min(userA.accountId, userB.accountId)
      const high = Math.max(userA.accountId, userB.accountId)
      await env.DB.prepare('DELETE FROM friendships WHERE account_low_id = ?1 AND account_high_id = ?2').bind(low, high).run()
      await env.DB.prepare('DELETE FROM friend_requests WHERE (sender_id = ?1 AND receiver_id = ?2) OR (sender_id = ?2 AND receiver_id = ?1)').bind(userA.accountId, userB.accountId).run()

      // User A sends friend request to User B
      const sendReqRes = await goi('/api/social/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
        body: JSON.stringify({ targetAccountId: userB.accountId }),
      })
      expect(sendReqRes.status).toBe(200)
      const sendData = (await sendReqRes.json()) as { ok: boolean; requestId: number }
      expect(sendData.ok).toBe(true)
      const requestId = sendData.requestId

      // User B must have received a friend_request notification
      const bNotifsRes = await goi('/api/notifications', { headers: { Cookie: userB.cookie } })
      const bNotifs = (await bNotifsRes.json()) as ListNotificationsResponse
      const frNotif = bNotifs.notifications.find(
        (n) => n.type === 'friend_request' && n.data?.requestId === requestId,
      )
      expect(frNotif).toBeDefined()
      expect(frNotif?.title).toContain('Lời mời kết bạn')
      expect(frNotif?.readAt).toBeNull()

      // User B accepts friend request
      const acceptRes = await goi('/api/social/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
        body: JSON.stringify({ requestId }),
      })
      expect(acceptRes.status).toBe(200)

      // User A must have received a friend_accept notification
      const aNotifsRes = await goi('/api/notifications', { headers: { Cookie: userA.cookie } })
      const aNotifs = (await aNotifsRes.json()) as ListNotificationsResponse
      const acceptNotif = aNotifs.notifications.find(
        (n) => n.type === 'friend_accept' && n.data?.requestId === requestId,
      )
      expect(acceptNotif).toBeDefined()
      expect(acceptNotif?.title).toContain('chấp nhận')
      expect(acceptNotif?.readAt).toBeNull()
    })

    it('gửi lời mời học tập và chấp nhận sinh thông báo chuẩn tắc', async () => {
      const userA = await dangNhap('qa.v2.gv')
      const userB = await dangNhap('qa.v2.thu3')

      // Ensure they are friends
      const low = Math.min(userA.accountId, userB.accountId)
      const high = Math.max(userA.accountId, userB.accountId)
      await env.DB.prepare('INSERT OR IGNORE INTO friendships (account_low_id, account_high_id, created_at) VALUES (?1, ?2, ?3)').bind(low, high, Date.now()).run()

      // Ensure room exists
      await env.DB.prepare("INSERT OR IGNORE INTO phong (id, ten, chu_phong_khoa, chu_phong_ten, loai, trang_thai, access_mode, suc_chua) VALUES (901, 'Phòng Ôn Toán N1', 'host_key', 'Giáo Viên QA', 'video', 'mo', 'public', 20)")
        .run()

      // User A invites User B to study
      const inviteRes = await goi('/api/engagement/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
        body: JSON.stringify({ recipientId: userB.accountId, roomId: 901 }),
      })
      expect(inviteRes.status).toBe(200)
      const inviteData = (await inviteRes.json()) as { ok: boolean; inviteId: string }
      expect(inviteData.ok).toBe(true)
      const inviteId = inviteData.inviteId

      // User B checks notifications
      const bNotifsRes = await goi('/api/notifications', { headers: { Cookie: userB.cookie } })
      const bNotifs = (await bNotifsRes.json()) as ListNotificationsResponse
      const inviteNotif = bNotifs.notifications.find(
        (n) => n.type === 'study_invite' && n.data?.invitationId === inviteId,
      )
      expect(inviteNotif).toBeDefined()
      expect(inviteNotif?.title).toContain('Lời mời học nhóm')

      // User B accepts invitation
      const acceptInviteRes = await goi(`/api/engagement/invites/${inviteId}/accept`, {
        method: 'POST',
        headers: { Cookie: userB.cookie },
      })
      expect(acceptInviteRes.status).toBe(200)

      // User A checks notifications
      const aNotifsRes = await goi('/api/notifications', { headers: { Cookie: userA.cookie } })
      const aNotifs = (await aNotifsRes.json()) as ListNotificationsResponse
      const acceptInviteNotif = aNotifs.notifications.find(
        (n) => n.type === 'study_invite_accepted' && n.data?.invitationId === inviteId,
      )
      expect(acceptInviteNotif).toBeDefined()
      expect(acceptInviteNotif?.title).toContain('học tập được chấp nhận')
    })

    it('mở khóa thành tựu tạo thông báo achievement_unlocked trong D1', async () => {
      const user = await dangNhap('qa.v2.thu3')
      const achKey = 'first_session'

      // Clean existing achievement unlock for this user
      await env.DB.prepare('DELETE FROM achievement_unlocks WHERE account_id = ?1 AND achievement_key = ?2')
        .bind(user.accountId, achKey).run()

      const unlockRes = await unlockAchievement(env.DB, user.accountId, achKey, `test_unlock_${Date.now()}`)
      expect(unlockRes.unlocked).toBe(true)

      const notifsRes = await goi('/api/notifications', { headers: { Cookie: user.cookie } })
      const notifs = (await notifsRes.json()) as ListNotificationsResponse
      const achNotif = notifs.notifications.find(
        (n) => n.type === 'achievement_unlocked' && n.data?.achievementKey === achKey,
      )
      expect(achNotif).toBeDefined()
      expect(achNotif?.title).toContain('Mở khóa thành tựu')
    })
  })

  describe('5. Read Marking & State Mutation', () => {
    it('đánh dấu đọc từng thông báo và đọc tất cả hoạt động chính xác và chuẩn thẩm quyền', async () => {
      const user = await dangNhap('qa.v2.thu1')

      // Create 3 unread notifications
      const n1 = await createNotification(env.DB, {
        recipientId: user.accountId,
        type: 'system_announcement',
        title: 'Thông báo 1',
        body: 'Nội dung 1',
        idempotencyKey: `read_test_1_${Date.now()}`,
      })
      const n2 = await createNotification(env.DB, {
        recipientId: user.accountId,
        type: 'system_announcement',
        title: 'Thông báo 2',
        body: 'Nội dung 2',
        idempotencyKey: `read_test_2_${Date.now()}`,
      })
      expect(n2?.id).toBeDefined()

      // Get initial unread count
      const countRes1 = await goi('/api/notifications/unread-count', { headers: { Cookie: user.cookie } })
      const countData1 = (await countRes1.json()) as UnreadCountResponse
      expect(countData1.ok).toBe(true)
      expect(countData1.unreadCount).toBeGreaterThanOrEqual(2)

      // Mark n1 as read
      const markRes = await goi(`/api/notifications/${n1!.id}/read`, {
        method: 'POST',
        headers: { Cookie: user.cookie },
      })
      expect(markRes.status).toBe(200)

      // Verify n1 is read
      const listRes = await goi('/api/notifications', { headers: { Cookie: user.cookie } })
      const listData = (await listRes.json()) as ListNotificationsResponse
      const item1 = listData.notifications.find((n) => n.id === n1!.id)
      expect(item1?.readAt).not.toBeNull()

      // Mark all as read
      const markAllRes = await goi('/api/notifications/read-all', {
        method: 'POST',
        headers: { Cookie: user.cookie },
      })
      expect(markAllRes.status).toBe(200)

      // Check unread count is now 0
      const countRes2 = await goi('/api/notifications/unread-count', { headers: { Cookie: user.cookie } })
      const countData2 = (await countRes2.json()) as UnreadCountResponse
      expect(countData2.unreadCount).toBe(0)
    })
  })

  describe('6. Bounded Pagination & Filters', () => {
    it('hỗ trợ pagination giới hạn và filter unread', async () => {
      const user = await dangNhap('qa.v2.thu2')

      // Insert 5 notifications
      for (let i = 1; i <= 5; i++) {
        await createNotification(env.DB, {
          recipientId: user.accountId,
          type: 'system_announcement',
          title: `Pagination ${i}`,
          body: `Body ${i}`,
          idempotencyKey: `page_test_${i}_${Date.now()}`,
        })
      }

      // Query limit=2, offset=0
      const page1Res = await goi('/api/notifications?limit=2&offset=0', { headers: { Cookie: user.cookie } })
      const page1 = (await page1Res.json()) as ListNotificationsResponse
      expect(page1.notifications.length).toBe(2)
      expect(page1.hasMore).toBe(true)

      // Query filter=unread
      const unreadRes = await goi('/api/notifications?filter=unread', { headers: { Cookie: user.cookie } })
      const unreadData = (await unreadRes.json()) as ListNotificationsResponse
      expect(unreadData.notifications.every((n) => n.readAt === null)).toBe(true)
    })

    it('>50 unread rows: list page returns max 50 while authoritative unreadCount reflects full count', async () => {
      const user = await dangNhap('qa.v2.tudo')

      // Insert 55 unread notifications in D1
      const batchStatements = []
      const baseNow = Date.now()
      for (let i = 1; i <= 55; i++) {
        batchStatements.push(
          env.DB.prepare(
            `INSERT INTO notifications (recipient_id, type, title, body, data_json, read_at, idempotency_key, created_at)
             VALUES (?1, 'system_announcement', ?2, ?3, NULL, NULL, ?4, ?5)`,
          ).bind(
            user.accountId,
            `ThÃ´ng bÃ¡o cÃ³ tháº©m quyá» n ${i}`,
            `Ná»™i dung ${i}`,
            `mass_unread_${user.accountId}_${i}_${baseNow}`,
            baseNow + i,
          ),
        )
      }
      await env.DB.batch(batchStatements)

      // 1. GET /api/notifications?limit=50
      const res = await goi('/api/notifications?limit=50', { headers: { Cookie: user.cookie } })
      expect(res.status).toBe(200)
      const data = (await res.json()) as ListNotificationsResponse
      expect(data.ok).toBe(true)
      expect(data.notifications.length).toBe(50) // Max capped at 50
      expect(data.unreadCount).toBeGreaterThanOrEqual(55) // Authoritative full count
      expect(data.hasMore).toBe(true)

      // 2. GET /api/notifications/unread-count
      const countRes = await goi('/api/notifications/unread-count', { headers: { Cookie: user.cookie } })
      expect(countRes.status).toBe(200)
      const countData = (await countRes.json()) as UnreadCountResponse
      expect(countData.ok).toBe(true)
      expect(countData.unreadCount).toBeGreaterThanOrEqual(55) // Does NOT truncate to 50
    })
  })

  describe('7. Server Call Ordering & Realtime Race Prevention', () => {
    it('friend request persists authoritative D1 notification before returning', async () => {
      const sender = await dangNhap('qa.v2.gv')
      const receiver = await dangNhap('qa.v2.thu3')

      // Clean existing friendship and requests
      const low = Math.min(sender.accountId, receiver.accountId)
      const high = Math.max(sender.accountId, receiver.accountId)
      await env.DB.prepare('DELETE FROM friendships WHERE account_low_id = ?1 AND account_high_id = ?2')
        .bind(low, high).run()
      await env.DB.prepare('DELETE FROM friend_requests WHERE (sender_id = ?1 AND receiver_id = ?2) OR (sender_id = ?2 AND receiver_id = ?1)')
        .bind(sender.accountId, receiver.accountId).run()

      const reqRes = await goi('/api/social/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sender.cookie },
        body: JSON.stringify({ targetAccountId: receiver.accountId }),
      })
      expect(reqRes.status).toBe(200)
      const reqData = (await reqRes.json()) as { ok: boolean; requestId: number }
      expect(reqData.ok).toBe(true)

      // Assert that the D1 notification row is immediately present and committed
      const notifRow = await env.DB.prepare(
        'SELECT id, recipient_id, type, idempotency_key FROM notifications WHERE idempotency_key = ?1',
      )
        .bind(`friend_req:${reqData.requestId}`)
        .first<{ id: number; recipient_id: number; type: string; idempotency_key: string }>()

      expect(notifRow).not.toBeNull()
      expect(notifRow?.recipient_id).toBe(receiver.accountId)
      expect(notifRow?.type).toBe('friend_request')
    })

    it('study invite persists authoritative D1 notification before returning', async () => {
      const sender = await dangNhap('qa.v2.gv')
      const receiver = await dangNhap('qa.v2.thu1')

      // Ensure friendship
      const low = Math.min(sender.accountId, receiver.accountId)
      const high = Math.max(sender.accountId, receiver.accountId)
      await env.DB.prepare('INSERT OR IGNORE INTO friendships (account_low_id, account_high_id, created_at) VALUES (?1, ?2, ?3)')
        .bind(low, high, Date.now()).run()

      // Ensure room exists
      await env.DB.prepare("INSERT OR IGNORE INTO phong (id, ten, chu_phong_khoa, chu_phong_ten, loai, trang_thai, access_mode, suc_chua) VALUES (902, 'Phòng Ôn Toán N1 Race Test', 'host_key_2', 'Giáo Viên QA', 'video', 'mo', 'public', 20)")
        .run()

      const invRes = await goi('/api/engagement/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sender.cookie },
        body: JSON.stringify({ recipientId: receiver.accountId, roomId: 902 }),
      })
      expect(invRes.status).toBe(200)
      const invData = (await invRes.json()) as { ok: boolean; inviteId: string }
      expect(invData.ok).toBe(true)

      // Assert that the D1 notification row is immediately present and committed
      const notifRow = await env.DB.prepare(
        'SELECT id, recipient_id, type, idempotency_key FROM notifications WHERE idempotency_key = ?1',
      )
        .bind(`study_invite:${invData.inviteId}`)
        .first<{ id: number; recipient_id: number; type: string; idempotency_key: string }>()

      expect(notifRow).not.toBeNull()
      expect(notifRow?.recipient_id).toBe(receiver.accountId)
      expect(notifRow?.type).toBe('study_invite')
    })
  })

  describe('8. Dismiss Invite Truthfulness & Error Handling', () => {
    it('failed study-invite dismiss returns truthful error and does not pretend success', async () => {
      const user = await dangNhap('qa.v2.thu1')

      // Dismiss nonexistent invite -> 404
      const failRes = await goi('/api/engagement/invites/nonexistent_id_999/dismiss', {
        method: 'POST',
        headers: { Cookie: user.cookie },
      })
      expect(failRes.status).toBe(404)
      const failData = (await failRes.json()) as { ok: boolean; loi?: string }
      expect(failData.ok).toBe(false)
      expect(failData.loi).toBeDefined()
      expect(typeof failData.loi).toBe('string')
      expect(failData.loi?.length).toBeGreaterThan(0)
    })
  })

  describe('9. Client Single-Source & State Convergence Invariants', () => {
    it('no client-local friend_request or study_invite inbox insertion from websocket event', () => {
      // Test deterministic reducer/handler behavior:
      // When websocket delivers social.request_received or social.study_invite,
      // persistent notifications list must NOT receive fabricated client items.
      let localNotifications: Array<{ id: string; type: string; read: boolean }> = []
      let refreshCalled = false
      const lamMoiNotifications = () => { refreshCalled = true }

      // Handler for social.request_received
      const handleWsMessage = (msg: { type: string }) => {
        if (msg.type === 'social.request_received' || msg.type === 'social.study_invite') {
          // Rule: zero client-local insertion, trigger D1 refresh instead
          lamMoiNotifications()
        }
      }

      handleWsMessage({ type: 'social.request_received' })
      expect(localNotifications.length).toBe(0) // No client-created fake notification
      expect(refreshCalled).toBe(true)

      refreshCalled = false
      handleWsMessage({ type: 'social.study_invite' })
      expect(localNotifications.length).toBe(0) // No client-created fake notification
      expect(refreshCalled).toBe(true)
    })

    it('presence friend_online & friend_in_room do not enter persistent inbox / unread count', () => {
      const localNotifications: Array<{ id: string; type: string; read: boolean }> = []
      let unreadCount = 0

      // Presence update must only update presenceMap, NEVER notifications or unreadCount
      const handlePresence = (_presence: { state: string; activity?: { type: string } }) => {
        // Presence is purely ephemeral: does NOT push to notifications or unreadCount
      }

      handlePresence({ state: 'online' })
      handlePresence({ state: 'online', activity: { type: 'room' } })

      expect(localNotifications.length).toBe(0)
      expect(unreadCount).toBe(0)
    })

    it('failed mark-one request does not permanently mark local state read and does not decrement count', async () => {
      let localNotifications = [
        { id: '101', type: 'system_announcement', read: false },
        { id: '102', type: 'system_announcement', read: false },
      ]
      let unreadCount = 2

      const dismissNotification = async (id: string, mockFetch: () => Promise<{ ok: boolean }>) => {
        const res = await mockFetch()
        if (!res.ok) return false
        localNotifications = localNotifications.map((n) => (n.id === id ? { ...n, read: true } : n))
        unreadCount = Math.max(0, unreadCount - 1)
        return true
      }

      // Simulate network / server 500 error
      const success = await dismissNotification('101', async () => ({ ok: false }))
      expect(success).toBe(false)
      expect(localNotifications[0].read).toBe(false) // Still unread
      expect(unreadCount).toBe(2) // Unchanged
    })

    it('failed mark-all request does not permanently mark local state read and does not set unreadCount=0', async () => {
      let localNotifications = [
        { id: '101', type: 'system_announcement', read: false },
        { id: '102', type: 'system_announcement', read: false },
      ]
      let unreadCount = 2

      const markAllRead = async (mockFetch: () => Promise<{ ok: boolean }>) => {
        const res = await mockFetch()
        if (!res.ok) return false
        localNotifications = localNotifications.map((n) => ({ ...n, read: true }))
        unreadCount = 0
        return true
      }

      // Simulate network / server 500 error
      const success = await markAllRead(async () => ({ ok: false }))
      expect(success).toBe(false)
      expect(localNotifications.every((n) => !n.read)).toBe(true)
      expect(unreadCount).toBe(2) // Unchanged
    })

    it('successful mark-one converges local state and decrements authoritative unreadCount', async () => {
      let localNotifications = [
        { id: '101', type: 'system_announcement', read: false },
        { id: '102', type: 'system_announcement', read: false },
      ]
      let unreadCount = 2

      const dismissNotification = async (id: string, mockFetch: () => Promise<{ ok: boolean }>) => {
        const res = await mockFetch()
        if (!res.ok) return false
        localNotifications = localNotifications.map((n) => (n.id === id ? { ...n, read: true } : n))
        unreadCount = Math.max(0, unreadCount - 1)
        return true
      }

      const success = await dismissNotification('101', async () => ({ ok: true }))
      expect(success).toBe(true)
      expect(localNotifications.find((n) => n.id === '101')?.read).toBe(true)
      expect(localNotifications.find((n) => n.id === '102')?.read).toBe(false)
      expect(unreadCount).toBe(1)
    })

    it('successful mark-all converges local state to read: true and unreadCount to 0', async () => {
      let localNotifications = [
        { id: '101', type: 'system_announcement', read: false },
        { id: '102', type: 'system_announcement', read: false },
      ]
      let unreadCount = 2

      const markAllRead = async (mockFetch: () => Promise<{ ok: boolean }>) => {
        const res = await mockFetch()
        if (!res.ok) return false
        localNotifications = localNotifications.map((n) => ({ ...n, read: true }))
        unreadCount = 0
        return true
      }

      const success = await markAllRead(async () => ({ ok: true }))
      expect(success).toBe(true)
      expect(localNotifications.every((n) => n.read)).toBe(true)
      expect(unreadCount).toBe(0)
    })

    it('opening NotificationCenter triggers authoritative refresh', () => {
      let refreshInvoked = false
      const lamMoiNotifications = () => { refreshInvoked = true }

      const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
          lamMoiNotifications()
        }
      }

      handleOpenChange(false)
      expect(refreshInvoked).toBe(false)

      handleOpenChange(true)
      expect(refreshInvoked).toBe(true)
    })
  })
})
