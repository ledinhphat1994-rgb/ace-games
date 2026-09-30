import { Hono } from 'hono'
import type {
  BlockedUserItem,
  FriendItem,
  FriendRequestItem,
  HoSoNguoiDung,
  RelationshipStatus,
  SearchResultItem,
  SocialState,
} from '../../shared/protocol/social'
import { kiemTraPhien, layPhien } from '../lib/session'
import { TEN_CAMPUS } from '../campus/danh-tinh'
import { createNotification } from '../services/notification-service'

export const socialApp = new Hono<{ Bindings: Env }>()

function loi(message: string, status = 400) {
  return Response.json({ ok: false, loi: message }, { status })
}

/** Tra cứu trạng thái mạng xã hội của người dùng hiện tại */
socialApp.get('/state', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const myId = kq.taiKhoan.id

  // 1. Bạn bè
  const { results: friendsRaw } = await c.env.DB.prepare(
    `SELECT f.created_at as friendedAt,
            tk.id, tk.ten_dang_nhap as username, tk.ten_hien_thi as displayName,
            tk.avatar, tk.vai_tro as role, l.ten as lopTen
       FROM friendships f
       JOIN tai_khoan_campus tk ON tk.id = (CASE WHEN f.account_low_id = ?1 THEN f.account_high_id ELSE f.account_low_id END)
       LEFT JOIN lop l ON l.id = tk.lop_id
      WHERE f.account_low_id = ?1 OR f.account_high_id = ?1
      ORDER BY f.created_at DESC`,
  )
    .bind(myId)
    .all<{
      friendedAt: number
      id: number
      username: string
      displayName: string
      avatar: string | null
      role: string
      lopTen: string | null
    }>()

  const friends: FriendItem[] = (friendsRaw ?? []).map((r) => ({
    id: r.id,
    username: r.username,
    displayName: r.displayName,
    avatar: r.avatar,
    role: r.role,
    lopTen: r.lopTen,
    friendedAt: r.friendedAt,
  }))

  // 2. Lời mời đến
  const { results: incomingRaw } = await c.env.DB.prepare(
    `SELECT fr.id, fr.created_at as createdAt,
            tk.id as senderId, tk.ten_dang_nhap as username, tk.ten_hien_thi as displayName,
            tk.avatar, tk.vai_tro as role, l.ten as lopTen
       FROM friend_requests fr
       JOIN tai_khoan_campus tk ON tk.id = fr.sender_id
       LEFT JOIN lop l ON l.id = tk.lop_id
      WHERE fr.receiver_id = ?1
      ORDER BY fr.created_at DESC`,
  )
    .bind(myId)
    .all<{
      id: number
      createdAt: number
      senderId: number
      username: string
      displayName: string
      avatar: string | null
      role: string
      lopTen: string | null
    }>()

  const incomingRequests: FriendRequestItem[] = (incomingRaw ?? []).map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    sender: {
      id: r.senderId,
      username: r.username,
      displayName: r.displayName,
      avatar: r.avatar,
      role: r.role,
      lopTen: r.lopTen,
    },
  }))

  // 3. Lời mời đi
  const { results: outgoingRaw } = await c.env.DB.prepare(
    `SELECT fr.id, fr.created_at as createdAt,
            tk.id as receiverId, tk.ten_dang_nhap as username, tk.ten_hien_thi as displayName,
            tk.avatar, tk.vai_tro as role, l.ten as lopTen
       FROM friend_requests fr
       JOIN tai_khoan_campus tk ON tk.id = fr.receiver_id
       LEFT JOIN lop l ON l.id = tk.lop_id
      WHERE fr.sender_id = ?1
      ORDER BY fr.created_at DESC`,
  )
    .bind(myId)
    .all<{
      id: number
      createdAt: number
      receiverId: number
      username: string
      displayName: string
      avatar: string | null
      role: string
      lopTen: string | null
    }>()

  const outgoingRequests: FriendRequestItem[] = (outgoingRaw ?? []).map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    receiver: {
      id: r.receiverId,
      username: r.username,
      displayName: r.displayName,
      avatar: r.avatar,
      role: r.role,
      lopTen: r.lopTen,
    },
  }))

  // 4. Danh sách đã chặn
  const { results: blockedRaw } = await c.env.DB.prepare(
    `SELECT b.id, b.created_at as blockedAt,
            tk.id as accountId, tk.ten_dang_nhap as username, tk.ten_hien_thi as displayName
       FROM blocks b
       JOIN tai_khoan_campus tk ON tk.id = b.blocked_id
      WHERE b.blocker_id = ?1
      ORDER BY b.created_at DESC`,
  )
    .bind(myId)
    .all<{
      id: number
      blockedAt: number
      accountId: number
      username: string
      displayName: string
    }>()

  const blockedUsers: BlockedUserItem[] = (blockedRaw ?? []).map((r) => ({
    id: r.accountId,
    username: r.username,
    displayName: r.displayName,
    blockedAt: r.blockedAt,
  }))

  const state: SocialState = {
    friends,
    incomingRequests,
    outgoingRequests,
    blockedUsers,
  }

  return c.json({ ok: true, state })
})

/** Tìm kiếm người dùng trong phạm vi campus (tối đa 10 kết quả) */
socialApp.get('/search', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const myId = kq.taiKhoan.id

  const q = (c.req.query('q') ?? '').trim()
  if (!q || q.length < 1) return c.json({ ok: true, results: [] })
  if (q.length > 50) return loi('Từ khoá tìm kiếm tối đa 50 ký tự.', 400)

  const likePattern = `%${q}%`

  const { results: raw } = await c.env.DB.prepare(
    `SELECT tk.id, tk.ten_dang_nhap as username, tk.ten_hien_thi as displayName,
            tk.avatar, tk.vai_tro as role, l.ten as lopTen
       FROM tai_khoan_campus tk
       LEFT JOIN lop l ON l.id = tk.lop_id
      WHERE tk.id != ?1 AND tk.dang_hoat_dong = 1
        AND (tk.ten_dang_nhap LIKE ?2 OR tk.ten_hien_thi LIKE ?2)
        AND tk.id NOT IN (
          SELECT blocked_id FROM blocks WHERE blocker_id = ?1
          UNION
          SELECT blocker_id FROM blocks WHERE blocked_id = ?1
        )
      LIMIT 10`,
  )
    .bind(myId, likePattern)
    .all<{
      id: number
      username: string
      displayName: string
      avatar: string | null
      role: string
      lopTen: string | null
    }>()

  if (!raw || raw.length === 0) {
    return c.json({ ok: true, results: [] })
  }

  // Tra cứu relationshipStatus cho các kết quả
  const ids = raw.map((r) => r.id)
  const placeholders = ids.map(() => '?').join(',')

  const [friendsDb, sentDb, receivedDb] = await Promise.all([
    c.env.DB.prepare(
      `SELECT CASE WHEN account_low_id = ?1 THEN account_high_id ELSE account_low_id END as friendId
         FROM friendships
        WHERE (account_low_id = ?1 OR account_high_id = ?1)
          AND (account_low_id IN (${placeholders}) OR account_high_id IN (${placeholders}))`,
    )
      .bind(myId, ...ids, ...ids)
      .all<{ friendId: number }>(),
    c.env.DB.prepare(
      `SELECT receiver_id as receiverId FROM friend_requests WHERE sender_id = ?1 AND receiver_id IN (${placeholders})`,
    )
      .bind(myId, ...ids)
      .all<{ receiverId: number }>(),
    c.env.DB.prepare(
      `SELECT sender_id as senderId FROM friend_requests WHERE receiver_id = ?1 AND sender_id IN (${placeholders})`,
    )
      .bind(myId, ...ids)
      .all<{ senderId: number }>(),
  ])

  const friendSet = new Set((friendsDb.results ?? []).map((r) => r.friendId))
  const sentSet = new Set((sentDb.results ?? []).map((r) => r.receiverId))
  const receivedSet = new Set((receivedDb.results ?? []).map((r) => r.senderId))

  const results: SearchResultItem[] = raw.map((r) => {
    let status: RelationshipStatus = 'none'
    if (friendSet.has(r.id)) status = 'friend'
    else if (sentSet.has(r.id)) status = 'pending_sent'
    else if (receivedSet.has(r.id)) status = 'pending_received'

    return {
      id: r.id,
      username: r.username,
      displayName: r.displayName,
      avatar: r.avatar,
      role: r.role,
      lopTen: r.lopTen,
      relationshipStatus: status,
    }
  })

  return c.json({ ok: true, results })
})

/**
 * Hồ sơ công khai của một tài khoản đang hoạt động (bấm vào ảnh trong chat / kết quả tìm kiếm).
 * Ẩn với tài khoản hệ thống và với người đã chặn nhau (hai chiều) — trả 404 như thể không tồn tại.
 */
socialApp.get('/profile/:id', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const myId = kq.taiKhoan.id

  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) return loi('Mã tài khoản không hợp lệ.', 400)

  const hoSo = await c.env.DB.prepare(
    `SELECT tk.id, tk.ten_hien_thi AS displayName, tk.avatar, tk.vai_tro AS role,
            tk.tieu_de_ho_so AS tieuDeHoSo, l.ten AS lopTen, COALESCE(ep.total_xp, 0) AS totalXp
       FROM tai_khoan_campus tk
       LEFT JOIN lop l ON l.id = tk.lop_id
       LEFT JOIN user_engagement_profile ep ON ep.account_id = tk.id
      WHERE tk.id = ?1 AND tk.dang_hoat_dong = 1 AND tk.ten_dang_nhap != 'system'
        AND NOT EXISTS (
          SELECT 1 FROM blocks b
           WHERE (b.blocker_id = ?2 AND b.blocked_id = tk.id) OR (b.blocker_id = tk.id AND b.blocked_id = ?2)
        )`,
  )
    .bind(id, myId)
    .first<HoSoNguoiDung>()

  if (!hoSo) return loi('Không tìm thấy người dùng.', 404)
  return c.json({ ok: true, profile: hoSo })
})

/** Gửi lời mời kết bạn */
socialApp.post('/request', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const myId = kq.taiKhoan.id

  let body: { targetAccountId?: number }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu yêu cầu không hợp lệ.', 400)
  }

  const targetId = Number(body?.targetAccountId)
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return loi('Mã tài khoản không hợp lệ.', 400)
  }

  // 1. Không tự gửi lời mời cho chính mình
  if (targetId === myId) {
    return loi('Không thể tự gửi lời mời kết bạn cho chính mình.', 400)
  }

  // 2. Kiểm tra tài khoản đích tồn tại
  const target = await c.env.DB.prepare(
    'SELECT id, ten_dang_nhap as username, ten_hien_thi as displayName, avatar, vai_tro as role FROM tai_khoan_campus WHERE id = ?1 AND dang_hoat_dong = 1',
  )
    .bind(targetId)
    .first<{ id: number; username: string; displayName: string; avatar: string | null; role: string }>()

  if (!target) {
    return loi('Người dùng không tồn tại hoặc tài khoản đã bị vô hiệu hoá.', 404)
  }

  // 3. Kiểm tra chặn 2 chiều (block)
  const block = await c.env.DB.prepare(
    'SELECT id FROM blocks WHERE (blocker_id = ?1 AND blocked_id = ?2) OR (blocker_id = ?2 AND blocked_id = ?1)',
  )
    .bind(myId, targetId)
    .first()

  if (block) {
    return loi('Không thể gửi lời mời tới người dùng này.', 403)
  }

  // 4. Kiểm tra đã là bạn bè chưa
  const low = Math.min(myId, targetId)
  const high = Math.max(myId, targetId)
  const daLaBan = await c.env.DB.prepare(
    'SELECT id FROM friendships WHERE account_low_id = ?1 AND account_high_id = ?2',
  )
    .bind(low, high)
    .first()

  if (daLaBan) {
    return c.json({ ok: true, alreadyFriends: true })
  }

  // 5. Kiểm tra Crossed Requests Convergence: Nếu target đã gửi lời mời cho mình trước đó!
  const crossedRequest = await c.env.DB.prepare(
    'SELECT id FROM friend_requests WHERE sender_id = ?1 AND receiver_id = ?2',
  )
    .bind(targetId, myId)
    .first<{ id: number }>()

  const now = Date.now()

  if (crossedRequest) {
    // Tự động hội tụ thành bạn bè ngay lập tức!
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM friend_requests WHERE (sender_id = ?1 AND receiver_id = ?2) OR (sender_id = ?2 AND receiver_id = ?1)').bind(myId, targetId),
      c.env.DB.prepare('INSERT OR IGNORE INTO friendships (account_low_id, account_high_id, created_at) VALUES (?1, ?2, ?3)').bind(low, high, now),
      c.env.DB.prepare(
        "UPDATE notifications SET read_at = ?1 WHERE ((recipient_id = ?2 AND json_extract(data_json, '$.actorId') = ?3) OR (recipient_id = ?3 AND json_extract(data_json, '$.actorId') = ?2)) AND type = 'friend_request' AND read_at IS NULL",
      ).bind(now, myId, targetId),
    ])

    // Báo CampusDO cập nhật bạn bè cho cả hai phía
    await thongBaoCampusDO(c.env, {
      type: 'social.friend_added',
      accountIds: [myId, targetId],
      friendA: {
        id: myId,
        username: kq.taiKhoan.username,
        displayName: kq.taiKhoan.ten || kq.taiKhoan.username,
        avatar: kq.taiKhoan.avatar,
        role: kq.taiKhoan.role,
        lopTen: null,
        friendedAt: now,
      },
      friendB: {
        id: target.id,
        username: target.username,
        displayName: target.displayName,
        avatar: target.avatar,
        role: target.role,
        lopTen: null,
        friendedAt: now,
      },
    })

    return c.json({ ok: true, converged: true, isFriend: true })
  }

  // 6. Ghi nhận lời mời kết bạn mới
  const insertRes = await c.env.DB.prepare(
    'INSERT OR IGNORE INTO friend_requests (sender_id, receiver_id, created_at) VALUES (?1, ?2, ?3) RETURNING id',
  )
    .bind(myId, targetId, now)
    .first<{ id: number }>()

  if (!insertRes?.id) {
    return c.json({ ok: false, loi: 'Đã gửi lời mời trước đó.' }, 409)
  }

  const requestId = insertRes.id

  // 1. Lưu thông báo bền vững có thẩm quyền vào D1 TRƯỚC
  const notif = await createNotification(c.env.DB, {
    recipientId: targetId,
    type: 'friend_request',
    title: 'Lời mời kết bạn mới',
    body: `${kq.taiKhoan.ten || kq.taiKhoan.username} đã gửi cho bạn một lời mời kết bạn.`,
    data: {
      requestId,
      actorId: myId,
      actorName: kq.taiKhoan.ten || kq.taiKhoan.username,
      actorAvatar: kq.taiKhoan.avatar,
    },
    idempotencyKey: `friend_req:${requestId}`,
    now,
  })

  // 2. Báo CampusDO gửi realtime push tới người nhận CHỈ SAU KHI đã lưu D1 thành công
  if (notif) {
    await thongBaoCampusDO(c.env, {
      type: 'social.request_received',
      receiverId: targetId,
      request: {
        id: requestId,
        createdAt: now,
        sender: {
          id: myId,
          username: kq.taiKhoan.username,
          displayName: kq.taiKhoan.ten || kq.taiKhoan.username,
          avatar: kq.taiKhoan.avatar,
          role: kq.taiKhoan.role,
          lopTen: null,
        },
      },
    })
  }

  return c.json({ ok: true, requestId })
})

/** Chấp nhận lời mời kết bạn */
socialApp.post('/accept', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const myId = kq.taiKhoan.id

  let body: { requestId?: number }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const requestId = Number(body?.requestId)
  if (!Number.isInteger(requestId) || requestId <= 0) return loi('Mã lời mời không hợp lệ.', 400)

  // Kiểm tra lời mời gửi đến mình
  const req = await c.env.DB.prepare(
    `SELECT fr.id, fr.sender_id,
            tk.id as senderId, tk.ten_dang_nhap as username, tk.ten_hien_thi as displayName,
            tk.avatar, tk.vai_tro as role
       FROM friend_requests fr
       JOIN tai_khoan_campus tk ON tk.id = fr.sender_id
      WHERE fr.id = ?1 AND fr.receiver_id = ?2`,
  )
    .bind(requestId, myId)
    .first<{
      id: number
      sender_id: number
      username: string
      displayName: string
      avatar: string | null
      role: string
    }>()

  if (!req) {
    // Kiểm tra xem lời mời này có trong notifications và 2 người đã là bạn bè chưa
    const notif = await c.env.DB.prepare(
      "SELECT id, data_json FROM notifications WHERE recipient_id = ?1 AND type = 'friend_request' AND json_extract(data_json, '$.requestId') = ?2",
    )
      .bind(myId, requestId)
      .first<{ id: number; data_json: string }>()

    if (notif) {
      let actorId: number | undefined
      try {
        actorId = (JSON.parse(notif.data_json || '{}') as { actorId?: number }).actorId
      } catch {}

      if (actorId) {
        const low = Math.min(myId, actorId)
        const high = Math.max(myId, actorId)
        const isFriend = await c.env.DB.prepare(
          'SELECT 1 FROM friendships WHERE account_low_id = ?1 AND account_high_id = ?2',
        )
          .bind(low, high)
          .first()

        if (isFriend) {
          await c.env.DB.prepare('UPDATE notifications SET read_at = ?1 WHERE id = ?2').bind(Date.now(), notif.id).run()
          return c.json({ ok: true, isFriend: true, alreadyFriends: true })
        }
      }
      await c.env.DB.prepare('UPDATE notifications SET read_at = ?1 WHERE id = ?2').bind(Date.now(), notif.id).run()
    }

    return loi('Lời mời không tồn tại hoặc đã được xử lý.', 404)
  }

  const otherId = req.sender_id

  // Kiểm tra block
  const block = await c.env.DB.prepare(
    'SELECT id FROM blocks WHERE (blocker_id = ?1 AND blocked_id = ?2) OR (blocker_id = ?2 AND blocked_id = ?1)',
  )
    .bind(myId, otherId)
    .first()

  if (block) {
    await c.env.DB.prepare('DELETE FROM friend_requests WHERE id = ?1').bind(requestId).run()
    return loi('Không thể kết bạn với người dùng này.', 403)
  }

  const low = Math.min(myId, otherId)
  const high = Math.max(myId, otherId)
  const now = Date.now()

  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM friend_requests WHERE (sender_id = ?1 AND receiver_id = ?2) OR (sender_id = ?2 AND receiver_id = ?1)').bind(myId, otherId),
    c.env.DB.prepare('INSERT OR IGNORE INTO friendships (account_low_id, account_high_id, created_at) VALUES (?1, ?2, ?3)').bind(low, high, now),
  ])

  // Báo CampusDO cập nhật bạn bè cho cả hai
  await thongBaoCampusDO(c.env, {
    type: 'social.friend_added',
    accountIds: [myId, otherId],
    friendA: {
      id: myId,
      username: kq.taiKhoan.username,
      displayName: kq.taiKhoan.ten || kq.taiKhoan.username,
      avatar: kq.taiKhoan.avatar,
      role: kq.taiKhoan.role,
      lopTen: null,
      friendedAt: now,
    },
    friendB: {
      id: otherId,
      username: req.username,
      displayName: req.displayName,
      avatar: req.avatar,
      role: req.role,
      lopTen: null,
      friendedAt: now,
    },
  })

  // Lưu thông báo chấp nhận kết bạn cho người gửi ban đầu (otherId)
  await createNotification(c.env.DB, {
    recipientId: otherId,
    type: 'friend_accept',
    title: 'Lời mời kết bạn được chấp nhận',
    body: `${kq.taiKhoan.ten || kq.taiKhoan.username} đã đồng ý lời mời kết bạn của bạn.`,
    data: {
      requestId,
      actorId: myId,
      actorName: kq.taiKhoan.ten || kq.taiKhoan.username,
      actorAvatar: kq.taiKhoan.avatar,
    },
    idempotencyKey: `friend_accept:${requestId}`,
    now,
  })

  // Đánh dấu đã đọc thông báo lời mời kết bạn của myId
  await c.env.DB.prepare(
    "UPDATE notifications SET read_at = ?1 WHERE recipient_id = ?2 AND type = 'friend_request' AND read_at IS NULL AND (json_extract(data_json, '$.actorId') = ?3 OR json_extract(data_json, '$.requestId') = ?4)",
  )
    .bind(now, myId, otherId, requestId)
    .run()

  return c.json({ ok: true, isFriend: true })
})

/** Từ chối lời mời kết bạn */
socialApp.post('/reject', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const myId = kq.taiKhoan.id

  let body: { requestId?: number }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const requestId = Number(body?.requestId)
  if (!Number.isInteger(requestId) || requestId <= 0) return loi('Mã lời mời không hợp lệ.', 400)

  const delRes = await c.env.DB.prepare(
    'DELETE FROM friend_requests WHERE id = ?1 AND receiver_id = ?2 RETURNING sender_id',
  )
    .bind(requestId, myId)
    .first<{ sender_id: number }>()

  // Đánh dấu đã đọc cho thông báo nếu có
  await c.env.DB.prepare(
    "UPDATE notifications SET read_at = ?1 WHERE recipient_id = ?2 AND type = 'friend_request' AND read_at IS NULL AND json_extract(data_json, '$.requestId') = ?3",
  )
    .bind(Date.now(), myId, requestId)
    .run()

  if (!delRes) {
    return loi('Lời mời không tồn tại hoặc đã được xử lý.', 404)
  }

  await thongBaoCampusDO(c.env, {
    type: 'social.request_resolved',
    accountIds: [myId, delRes.sender_id],
    requestId,
  })

  return c.json({ ok: true })
})

/** Hủy lời mời kết bạn đã gửi đi */
socialApp.post('/cancel', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const myId = kq.taiKhoan.id

  let body: { requestId?: number }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const requestId = Number(body?.requestId)
  if (!Number.isInteger(requestId) || requestId <= 0) return loi('Mã lời mời không hợp lệ.', 400)

  const delRes = await c.env.DB.prepare(
    'DELETE FROM friend_requests WHERE id = ?1 AND sender_id = ?2 RETURNING receiver_id',
  )
    .bind(requestId, myId)
    .first<{ receiver_id: number }>()

  if (delRes?.receiver_id) {
    await c.env.DB.prepare(
      "DELETE FROM notifications WHERE recipient_id = ?1 AND type = 'friend_request' AND json_extract(data_json, '$.requestId') = ?2",
    )
      .bind(delRes.receiver_id, requestId)
      .run()
  }

  if (!delRes) {
    return loi('Lời mời không tồn tại hoặc đã được xử lý.', 404)
  }

  await thongBaoCampusDO(c.env, {
    type: 'social.request_resolved',
    accountIds: [myId, delRes.receiver_id],
    requestId,
  })

  return c.json({ ok: true })
})

/** Hủy kết bạn */
socialApp.post('/unfriend', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const myId = kq.taiKhoan.id

  let body: { friendAccountId?: number }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const friendId = Number(body?.friendAccountId)
  if (!Number.isInteger(friendId) || friendId <= 0) return loi('Mã bạn bè không hợp lệ.', 400)

  const low = Math.min(myId, friendId)
  const high = Math.max(myId, friendId)

  const delRes = await c.env.DB.prepare(
    'DELETE FROM friendships WHERE account_low_id = ?1 AND account_high_id = ?2 RETURNING id',
  )
    .bind(low, high)
    .first()

  if (!delRes) {
    return loi('Quan hệ bạn bè không tồn tại.', 404)
  }

  await thongBaoCampusDO(c.env, {
    type: 'social.friend_removed',
    accountIds: [myId, friendId],
    userA: myId,
    userB: friendId,
  })

  return c.json({ ok: true })
})

/** Chặn người dùng */
socialApp.post('/block', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const myId = kq.taiKhoan.id

  let body: { targetAccountId?: number }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const targetId = Number(body?.targetAccountId)
  if (!Number.isInteger(targetId) || targetId <= 0 || targetId === myId) {
    return loi('Mã tài khoản không hợp lệ.', 400)
  }

  const low = Math.min(myId, targetId)
  const high = Math.max(myId, targetId)
  const now = Date.now()

  // Transaction: Xoá bạn bè (nếu có), xoá lời mời 2 chiều (nếu có), ghi nhận block
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM friendships WHERE account_low_id = ?1 AND account_high_id = ?2').bind(low, high),
    c.env.DB.prepare('DELETE FROM friend_requests WHERE (sender_id = ?1 AND receiver_id = ?2) OR (sender_id = ?2 AND receiver_id = ?1)').bind(myId, targetId),
    c.env.DB.prepare('INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?1, ?2, ?3)').bind(myId, targetId, now),
  ])

  // Báo CampusDO triệt tiêu presence và giao tiếp 2 chiều
  await thongBaoCampusDO(c.env, {
    type: 'social.blocked',
    blockerId: myId,
    blockedId: targetId,
  })

  return c.json({ ok: true, isBlocked: true })
})

/** Bỏ chặn người dùng */
socialApp.post('/unblock', async (c) => {
  const kq = await kiemTraPhien(await layPhien(c.req.raw, c.env), c.env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  const myId = kq.taiKhoan.id

  let body: { targetAccountId?: number }
  try {
    body = await c.req.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const targetId = Number(body?.targetAccountId)
  if (!Number.isInteger(targetId) || targetId <= 0) return loi('Mã tài khoản không hợp lệ.', 400)

  await c.env.DB.prepare('DELETE FROM blocks WHERE blocker_id = ?1 AND blocked_id = ?2')
    .bind(myId, targetId)
    .run()

  await thongBaoCampusDO(c.env, {
    type: 'social.unblocked',
    blockerId: myId,
    blockedId: targetId,
  })

  return c.json({ ok: true })
})

export async function thongBaoCampusDO(env: Env, payload: any): Promise<void> {
  try {
    const campus = env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS)) as any
    if (typeof campus.thongBaoSocial === 'function') {
      await campus.thongBaoSocial(payload)
    }
  } catch (e) {
    console.error('Không thông báo được CampusDO về sự kiện social:', e)
  }
}
