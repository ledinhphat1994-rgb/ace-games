// API Quản lý mốc đã đọc & đếm số tin nhắn chưa đọc (Phase 4F - Social Notifications)
// Tính toán chính xác unread cho 3 kênh: Campus, Lớp, DM từng bạn bè và Lời mời kết bạn.
import { json, loi } from '../_lib/api.js';
import { kiemTraQuyenSocial } from '../_lib/social.js';

export async function onRequestGet({ request, env }) {
  const auth = await kiemTraQuyenSocial(env, request);
  if (!auth.ok) {
    return json({ ok: false, loi: auth.loi, code: auth.code }, auth.status || 401);
  }

  const db = env.DB;
  const myId = Number(auth.accountId);

  try {
    // 1. Lấy tất cả mốc đã đọc của tài khoản này
    const readRows = await db.prepare(`
      SELECT channel_type AS channelType, channel_key AS channelKey, last_read_message_id AS lastReadId
      FROM chat_read_state
      WHERE account_id = ?1
    `).bind(myId).all();

    const readMap = new Map();
    (readRows.results || []).forEach((r) => {
      readMap.set(`${r.channelType}:${r.channelKey}`, Number(r.lastReadId || 0));
    });

    // 2. Unread Campus Chat (Tin nhắn do người khác gửi và id > lastReadId)
    const campusLastRead = readMap.get('campus:campus') || 0;
    const campusUnreadRow = await db.prepare(`
      SELECT COUNT(id) AS unreadCount
      FROM campus_chat_message
      WHERE deleted_at IS NULL AND sender_account_id != ?1 AND id > ?2
    `).bind(myId, campusLastRead).first();
    const campusUnread = Number(campusUnreadRow?.unreadCount || 0);

    // 3. Unread Class Chat (Nếu có liên kết lớp)
    let classUnread = 0;
    if (auth.lopId) {
      const classKey = `class:lop:${auth.lopId}`;
      const classLastRead = readMap.get(classKey) || 0;
      const classUnreadRow = await db.prepare(`
        SELECT COUNT(id) AS unreadCount
        FROM chat_tin_nhan
        WHERE (da_xoa IS NULL OR da_xoa = 0)
          AND lop_id = ?1
          AND id > ?2
          AND (
            (?3 > 0 AND (hoc_sinh_id IS NULL OR hoc_sinh_id != ?3))
            OR (?4 = 'teacher' AND vai_tro != 'giao_vien')
          )
      `).bind(auth.lopId, classLastRead, auth.hocSinhId || 0, auth.role).first().catch(() => ({ unreadCount: 0 }));
      classUnread = Number(classUnreadRow?.unreadCount || 0);
    }

    // 4. Lấy danh sách bạn bè đã accepted
    const friendRows = await db.prepare(`
      SELECT CASE WHEN requester_account_id = ?1 THEN addressee_account_id ELSE requester_account_id END AS friendAccountId
      FROM campus_friendship
      WHERE (requester_account_id = ?1 OR addressee_account_id = ?1) AND status = 'accepted'
    `).bind(myId).all();

    const friendsList = (friendRows.results || []).map((f) => Number(f.friendAccountId));

    // 5. Unread DM cho từng bạn bè
    const dms = {};
    let totalDms = 0;

    for (const friendId of friendsList) {
      const dmKey = `dm:peer:${friendId}`;
      const dmLastRead = readMap.get(dmKey) || 0;
      const unreadRow = await db.prepare(`
        SELECT COUNT(id) AS unreadCount
        FROM campus_private_message
        WHERE sender_account_id = ?1 AND receiver_account_id = ?2
          AND retracted_at IS NULL AND id > ?3
      `).bind(friendId, myId, dmLastRead).first();

      const count = Number(unreadRow?.unreadCount || 0);
      if (count > 0) {
        dms[friendId] = count;
        totalDms += count;
      }
    }

    // 6. Lời mời kết bạn đang chờ duyệt
    const pendingReqRow = await db.prepare(`
      SELECT COUNT(id) AS pendingCount
      FROM campus_friendship
      WHERE addressee_account_id = ?1 AND status = 'pending'
    `).bind(myId).first();
    const pendingFriendRequests = Number(pendingReqRow?.pendingCount || 0);

    return json({
      ok: true,
      campus: campusUnread,
      class: classUnread,
      dms,
      totalDms,
      pendingFriendRequests,
      totalMe: totalDms + pendingFriendRequests
    });
  } catch (err) {
    console.error('chat-read-state GET error:', err);
    return loi('Lỗi khi tải thông báo tin nhắn.', 500);
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await kiemTraQuyenSocial(env, request);
  if (!auth.ok) {
    return json({ ok: false, loi: auth.loi, code: auth.code }, auth.status || 401);
  }

  const db = env.DB;
  const myId = Number(auth.accountId);

  let body;
  try {
    body = await request.json();
  } catch {
    return loi('Dữ liệu yêu cầu không hợp lệ.', 400);
  }

  const channelType = String(body.channelType || '').trim();
  const channelKey = String(body.channelKey || '').trim();
  const lastReadId = parseInt(body.lastReadId || '0', 10);

  if (!['campus', 'class', 'dm'].includes(channelType) || !channelKey || !(lastReadId >= 0)) {
    return loi('Thông tin kênh hoặc mốc đọc không hợp lệ.', 400);
  }

  try {
    await db.prepare(`
      INSERT INTO chat_read_state (account_id, channel_type, channel_key, last_read_message_id, updated_at)
      VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
      ON CONFLICT(account_id, channel_type, channel_key) DO UPDATE SET
        last_read_message_id = MAX(last_read_message_id, excluded.last_read_message_id),
        updated_at = CURRENT_TIMESTAMP
    `).bind(myId, channelType, channelKey, lastReadId).run();

    return json({ ok: true });
  } catch (err) {
    console.error('chat-read-state POST error:', err);
    return loi('Lỗi khi cập nhật trạng thái đã đọc.', 500);
  }
}
