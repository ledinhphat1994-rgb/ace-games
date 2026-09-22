import { Hono } from 'hono'
import { kiemTraPhien, layPhien } from '../lib/session'
import { laQuanTriTruong, laGiaoVienDaDuyet } from '../lib/scope'
import {
  ACHIEVEMENT_CATALOG,
  ensureActiveWeeklyChallenge,
  getOrCreateEngagementProfile,
  INVITE_COOLDOWN_MS,
  INVITE_EXPIRY_MS,
  MAX_INVITES_PER_HOUR,
} from '../lib/engagement'
import { getStudyWeekDateRange, SCHOOL_TIMEZONE, studyDate, studyWeek } from '../../shared/study-date'
import type {
  ClassLeaderboardItem,
  FriendStudyActivityItem,
  SendStudyInviteInput,
  UserAchievementItem,
} from '../../shared/protocol/engagement'
import { thongBaoCampusDO } from './social'
import { recordAnalyticsEvent } from '../lib/analytics'
import { createNotification } from '../services/notification-service'

export const engagementApp = new Hono<{ Bindings: Env }>()

function loi(message: string, status = 400) {
  return Response.json({ ok: false, loi: message }, { status })
}

// ─── 1. Get My Engagement Profile ─────────────────────────────────────────────
engagementApp.get('/me', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const profile = await getOrCreateEngagementProfile(c.env.DB, kq.taiKhoan.id)
  return c.json({ ok: true, profile })
})

// ─── 2. Class Weekly Leaderboard ──────────────────────────────────────────────
engagementApp.get('/leaderboard', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const myId = kq.taiKhoan.id
  const myLopId = kq.taiKhoan.lopId
  const reqClassIdParam = c.req.query('classId') || c.req.query('lopId')
  const reqClassId = reqClassIdParam ? parseInt(reqClassIdParam, 10) : null

  const isAdmin = laQuanTriTruong(kq.taiKhoan)
  const isTeacher = laGiaoVienDaDuyet(kq.taiKhoan)

  let targetLopId: number | null = null

  if (reqClassId && reqClassId > 0) {
    if (isAdmin || isTeacher) {
      targetLopId = reqClassId
    } else {
      // Students can ONLY view their own class
      if (myLopId !== reqClassId) {
        return loi('Học sinh chỉ có quyền xem bảng xếp hạng lớp của mình.', 403)
      }
      targetLopId = reqClassId
    }
  } else {
    targetLopId = myLopId
  }

  if (!targetLopId) {
    return c.json({ ok: true, items: [], lopTen: null, currentWeek: studyWeek(Date.now(), SCHOOL_TIMEZONE) })
  }

  // Get class name
  const lopRow = await c.env.DB.prepare('SELECT ten FROM lop WHERE id = ?1')
    .bind(targetLopId)
    .first<{ ten: string }>()

  const now = Date.now()
  const currentWk = studyWeek(now, SCHOOL_TIMEZONE)
  const { startDate, endDate } = getStudyWeekDateRange(currentWk)

  const query = `
    SELECT tk.id as accountId,
           tk.ten_hien_thi as displayName,
           tk.avatar,
           COALESCE(SUM(xp.amount), 0) as weeklyXp,
           COALESCE(ep.current_streak, 0) as currentStreak
    FROM tai_khoan_campus tk
    LEFT JOIN xp_ledger xp ON tk.id = xp.account_id AND xp.study_date >= ?1 AND xp.study_date <= ?2
    LEFT JOIN user_engagement_profile ep ON tk.id = ep.account_id
    WHERE tk.lop_id = ?3 AND tk.dang_hoat_dong = 1
    GROUP BY tk.id
    ORDER BY weeklyXp DESC, currentStreak DESC, tk.id ASC
    LIMIT 50
  `

  const rows = await c.env.DB.prepare(query)
    .bind(startDate, endDate, targetLopId)
    .all<{
      accountId: number
      displayName: string
      avatar: string | null
      weeklyXp: number
      currentStreak: number
    }>()

  const items: ClassLeaderboardItem[] = (rows.results || []).map((r, idx) => ({
    rank: idx + 1,
    accountId: r.accountId,
    displayName: r.displayName,
    avatar: r.avatar,
    weeklyXp: r.weeklyXp,
    currentStreak: r.currentStreak,
    isCurrentUser: r.accountId === myId,
  }))

  return c.json({
    ok: true,
    lopTen: lopRow?.ten || null,
    currentWeek: currentWk,
    dateRange: { startDate, endDate },
    items,
  })
})

// ─── 3. Achievements Catalog & Unlocks ────────────────────────────────────────
engagementApp.get('/achievements', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const accountId = kq.taiKhoan.id
  const unlocks = await c.env.DB.prepare(
    'SELECT achievement_key, unlocked_at FROM achievement_unlocks WHERE account_id = ?1',
  )
    .bind(accountId)
    .all<{ achievement_key: string; unlocked_at: number }>()

  const unlockMap = new Map((unlocks.results || []).map((u) => [u.achievement_key, u.unlocked_at]))

  const achievements: UserAchievementItem[] = ACHIEVEMENT_CATALOG.map((a) => {
    const unlockedAt = unlockMap.get(a.key) || null
    return {
      ...a,
      unlocked: unlockedAt !== null,
      unlockedAt,
    }
  })

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  return c.json({
    ok: true,
    achievements,
    items: achievements,
    unlockedCount,
    totalCount: achievements.length,
  })
})

// ─── 4. Friend Study Activity ─────────────────────────────────────────────────
engagementApp.get('/friends/activity', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const myId = kq.taiKhoan.id
  const today = studyDate(Date.now(), SCHOOL_TIMEZONE)

  // Query accepted friends and their engagement profile
  const friendsQuery = `
    SELECT tk.id as friendId,
           tk.ten_hien_thi as displayName,
           tk.avatar,
           COALESCE(ep.current_streak, 0) as currentStreak,
           ep.last_study_date as lastStudyDate
    FROM friendships f
    JOIN tai_khoan_campus tk ON tk.id = (CASE WHEN f.account_low_id = ?1 THEN f.account_high_id ELSE f.account_low_id END)
    LEFT JOIN user_engagement_profile ep ON ep.account_id = tk.id
    WHERE (f.account_low_id = ?1 OR f.account_high_id = ?1)
      AND tk.dang_hoat_dong = 1
      AND tk.id NOT IN (
        SELECT blocked_id FROM blocks WHERE blocker_id = ?1
        UNION
        SELECT blocker_id FROM blocks WHERE blocked_id = ?1
      )
  `

  const rows = await c.env.DB.prepare(friendsQuery)
    .bind(myId)
    .all<{
      friendId: number
      displayName: string
      avatar: string | null
      currentStreak: number
      lastStudyDate: string | null
    }>()

  const activities: FriendStudyActivityItem[] = (rows.results || []).map((r) => {
    let status: FriendStudyActivityItem['status'] = 'active_streak'
    let detail = `Chuỗi ${r.currentStreak} ngày`

    if (r.lastStudyDate === today) {
      status = 'studied_recently'
      detail = 'Đã hoàn thành buổi học hôm nay'
    } else if (r.currentStreak === 0) {
      detail = 'Chưa bắt đầu chuỗi'
    }

    return {
      friendId: r.friendId,
      displayName: r.displayName,
      avatar: r.avatar,
      status,
      currentStreak: r.currentStreak,
      lastStudyDate: r.lastStudyDate,
      activityDetail: detail,
    }
  })

  const activeFriendsCount = activities.filter((a) => a.lastStudyDate === today || a.currentStreak > 0).length

  return c.json({ ok: true, activities, friends: activities, activeFriendsCount })
})

// ─── 5. Class Challenges ──────────────────────────────────────────────────────
engagementApp.get('/challenges', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const myLopId = kq.taiKhoan.lopId
  if (!myLopId) {
    return c.json({ ok: true, challenge: null, message: 'Chưa tham gia lớp học' })
  }

  const now = Date.now()
  const challenge = await ensureActiveWeeklyChallenge(c.env.DB, myLopId, now)
  if (!challenge) {
    return c.json({ ok: true, challenge: null })
  }

  // Count unique contributors and check if current user contributed
  const stats = await c.env.DB.prepare(
    `SELECT COUNT(DISTINCT account_id) as participantCount,
            SUM(CASE WHEN account_id = ?1 THEN 1 ELSE 0 END) as myContribs
     FROM class_challenge_contributions
     WHERE challenge_id = ?2`,
  )
    .bind(kq.taiKhoan.id, challenge.id)
    .first<{ participantCount: number; myContribs: number }>()

  challenge.participantCount = stats?.participantCount || 0
  challenge.hasContributed = (stats?.myContribs || 0) > 0

  return c.json({ ok: true, challenge })
})

// ─── 6. Send Study Invitation ─────────────────────────────────────────────────
engagementApp.post('/invites', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const myId = kq.taiKhoan.id
  let body: SendStudyInviteInput
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu yêu cầu không hợp lệ.', 400)
  }

  const recipientId = Number(body.recipientId)
  const roomId = Number(body.roomId)

  if (!Number.isInteger(recipientId) || recipientId <= 0) return loi('Mã người nhận không hợp lệ.', 400)
  if (!Number.isInteger(roomId) || roomId <= 0) return loi('Mã phòng không hợp lệ.', 400)
  if (recipientId === myId) return loi('Bạn không thể tự gửi lời mời học tập cho chính mình.', 400)

  // Verify room existence and derive authoritative roomTitle server-side
  const roomRow = await c.env.DB.prepare('SELECT id, ten FROM phong WHERE id = ?1')
    .bind(roomId)
    .first<{ id: number; ten: string }>()

  if (!roomRow) {
    return loi('Phòng học không tồn tại.', 404)
  }

  const roomTitle = (roomRow.ten || 'Phòng học nhóm').trim().slice(0, 100)

  // 1. Verify Friendship & Blocks
  const low = Math.min(myId, recipientId)
  const high = Math.max(myId, recipientId)

  const [friendRow, blockRow] = await Promise.all([
    c.env.DB.prepare('SELECT id FROM friendships WHERE account_low_id = ?1 AND account_high_id = ?2')
      .bind(low, high)
      .first<{ id: number }>(),
    c.env.DB.prepare(
      'SELECT id FROM blocks WHERE (blocker_id = ?1 AND blocked_id = ?2) OR (blocker_id = ?2 AND blocked_id = ?1)',
    )
      .bind(myId, recipientId)
      .first<{ id: number }>(),
  ])

  if (!friendRow) return loi('Chỉ có thể mời bạn bè đã kết nối vào phòng học tập.', 403)
  if (blockRow) return loi('Không thể gửi lời mời cho người dùng này.', 403)

  const now = Date.now()

  // 2. Cooldown check: max 1 pending invite per friend every 5 minutes
  const recentInvite = await c.env.DB.prepare(
    `SELECT id FROM study_invitations
     WHERE sender_id = ?1 AND recipient_id = ?2 AND created_at > ?3 AND status = 'pending'`,
  )
    .bind(myId, recipientId, now - INVITE_COOLDOWN_MS)
    .first<{ id: string }>()

  if (recentInvite) {
    return loi('Bạn vừa gửi lời mời học tập cho bạn này. Vui lòng chờ ít phút trước khi mời lại.', 429)
  }

  // 3. Hourly Cap: max 10 invites per hour
  const hourlyCountRow = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM study_invitations WHERE sender_id = ?1 AND created_at > ?2',
  )
    .bind(myId, now - 60 * 60 * 1000)
    .first<{ cnt: number }>()

  if ((hourlyCountRow?.cnt || 0) >= MAX_INVITES_PER_HOUR) {
    return loi('Bạn đã gửi quá nhiều lời mời trong giờ qua. Hãy tập trung học tập nhé!', 429)
  }

  // 4. Insert Invitation
  const inviteId = crypto.randomUUID()
  const expiresAt = now + INVITE_EXPIRY_MS

  await c.env.DB.prepare(
    `INSERT INTO study_invitations
     (id, sender_id, recipient_id, room_id, room_title, status, created_at, expires_at)
     VALUES (?1, ?2, ?3, ?4, ?5, 'pending', ?6, ?7)`,
  )
    .bind(inviteId, myId, recipientId, roomId, roomTitle, now, expiresAt)
    .run()

  const senderName = kq.taiKhoan.ten || kq.taiKhoan.username

  // 5. Ghi nhận thông báo có thẩm quyền vào D1 cho người nhận TRƯỚC
  const notif = await createNotification(c.env.DB, {
    recipientId,
    type: 'study_invite',
    title: 'Lời mời học nhóm',
    body: `${senderName} đã mời bạn tham gia phòng học "${roomTitle}".`,
    data: {
      invitationId: inviteId,
      roomId,
      roomTitle,
      actorId: myId,
      actorName: senderName,
      actorAvatar: kq.taiKhoan.avatar || null,
      expiresAt,
    },
    idempotencyKey: `study_invite:${inviteId}`,
    now,
  })

  // 6. Realtime Notification push qua CampusDO CHỈ SAU KHI đã lưu D1 thành công
  if (notif) {
    await thongBaoCampusDO(c.env, {
      type: 'social.study_invite' as any,
      receiverId: recipientId,
      invitation: {
        id: inviteId,
        senderId: myId,
        senderName,
        senderAvatar: kq.taiKhoan.avatar || null,
        roomId,
        roomTitle,
        expiresAt,
      },
    })
  }

  // 7. Analytics Telemetry
  if (c.env.ANALYTICS_DB) {
    recordAnalyticsEvent(c.env.ANALYTICS_DB, c.executionCtx, {
      event: 'engagement.invite_sent',
      actorId: myId,
      roomId,
    })
  }

  return c.json({ ok: true, inviteId, message: 'Đã gửi lời mời học tập thành công!' })
})

// ─── 7. Accept Study Invitation ───────────────────────────────────────────────
engagementApp.post('/invites/:id/accept', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const inviteId = c.req.param('id')
  const myId = kq.taiKhoan.id
  const now = Date.now()

  const invite = await c.env.DB.prepare(
    'SELECT id, sender_id, recipient_id, room_id, room_title, status, expires_at FROM study_invitations WHERE id = ?1',
  )
    .bind(inviteId)
    .first<{ id: string; sender_id: number; recipient_id: number; room_id: number; room_title: string; status: string; expires_at: number }>()

  if (!invite) return loi('Lời mời không tồn tại.', 404)
  if (invite.recipient_id !== myId) return loi('Bạn không có quyền thực hiện lời mời này.', 403)
  if (invite.status !== 'pending') return loi('Lời mời đã được xử lý hoặc hủy.', 400)
  if (invite.expires_at < now) {
    await c.env.DB.prepare("UPDATE study_invitations SET status = 'expired' WHERE id = ?1").bind(inviteId).run()
    return loi('Lời mời học tập này đã hết hạn.', 410)
  }

  await c.env.DB.prepare("UPDATE study_invitations SET status = 'accepted' WHERE id = ?1").bind(inviteId).run()

  // Thông báo tới người đã gửi lời mời (sender_id)
  await createNotification(c.env.DB, {
    recipientId: invite.sender_id,
    type: 'study_invite_accepted',
    title: 'Lời mời học tập được chấp nhận',
    body: `${kq.taiKhoan.ten || kq.taiKhoan.username} đã chấp nhận lời mời tham gia "${invite.room_title || 'phòng học'}".`,
    data: {
      invitationId: inviteId,
      roomId: invite.room_id,
      roomTitle: invite.room_title,
      actorId: myId,
      actorName: kq.taiKhoan.ten || kq.taiKhoan.username,
      actorAvatar: kq.taiKhoan.avatar || null,
    },
    idempotencyKey: `study_invite_acc:${inviteId}`,
    now,
  })

  if (c.env.ANALYTICS_DB) {
    recordAnalyticsEvent(c.env.ANALYTICS_DB, c.executionCtx, {
      event: 'engagement.invite_accepted',
      actorId: myId,
      roomId: invite.room_id,
    })
  }

  return c.json({ ok: true, roomId: invite.room_id })
})

// ─── 8. Dismiss Study Invitation ──────────────────────────────────────────────
engagementApp.post('/invites/:id/dismiss', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  const inviteId = c.req.param('id')
  const myId = kq.taiKhoan.id

  const invite = await c.env.DB.prepare('SELECT id, recipient_id FROM study_invitations WHERE id = ?1')
    .bind(inviteId)
    .first<{ id: string; recipient_id: number }>()

  if (!invite) return loi('Lời mời không tồn tại.', 404)
  if (invite.recipient_id !== myId) return loi('Bạn không có quyền thực hiện lời mời này.', 403)

  await c.env.DB.prepare("UPDATE study_invitations SET status = 'dismissed' WHERE id = ?1").bind(inviteId).run()

  return c.json({ ok: true })
})
