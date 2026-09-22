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
  })
})
