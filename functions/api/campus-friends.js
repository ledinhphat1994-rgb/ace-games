// API Bạn bè Campus (Phase 4C — Friendship Graph)
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
    // 1. Danh sách bạn bè đã chấp nhận (status = 'accepted')
    // Quan hệ 2 chiều: myId có thể là requester hoặc addressee
    const friendsQuery = `
      SELECT
        f.id AS friendshipId,
        CASE WHEN f.requester_account_id = ?1 THEN f.addressee_account_id ELSE f.requester_account_id END AS friendAccountId,
        tk.ten_dang_nhap AS username,
        tk.ten_hien_thi AS displayName,
        tk.vai_tro AS role,
        l.ten AS classBadge
      FROM campus_friendship f
      JOIN tai_khoan_campus tk ON tk.id = (CASE WHEN f.requester_account_id = ?1 THEN f.addressee_account_id ELSE f.requester_account_id END)
      LEFT JOIN lop l ON l.id = tk.lop_id
      WHERE (f.requester_account_id = ?1 OR f.addressee_account_id = ?1)
        AND f.status = 'accepted'
      ORDER BY tk.ten_hien_thi ASC
    `;
    const { results: friendsList } = await db.prepare(friendsQuery).bind(myId).all();

    // 2. Lời mời kết bạn đang chờ tôi duyệt (addressee = myId AND status = 'pending')
    const incomingQuery = `
      SELECT
        f.id AS requestId,
        f.requester_account_id AS fromAccountId,
        f.created_at AS createdAt,
        tk.ten_dang_nhap AS username,
        tk.ten_hien_thi AS displayName,
        tk.vai_tro AS role,
        l.ten AS classBadge
      FROM campus_friendship f
      JOIN tai_khoan_campus tk ON tk.id = f.requester_account_id
      LEFT JOIN lop l ON l.id = tk.lop_id
      WHERE f.addressee_account_id = ?1 AND f.status = 'pending'
      ORDER BY f.id DESC
    `;
    const { results: incomingList } = await db.prepare(incomingQuery).bind(myId).all();

    // 3. Lời mời kết bạn tôi đã gửi đi đang chờ đối phương (requester = myId AND status = 'pending')
    const outgoingQuery = `
      SELECT
        f.id AS requestId,
        f.addressee_account_id AS toAccountId,
        f.created_at AS createdAt,
        tk.ten_dang_nhap AS username,
        tk.ten_hien_thi AS displayName,
        tk.vai_tro AS role,
        l.ten AS classBadge
      FROM campus_friendship f
      JOIN tai_khoan_campus tk ON tk.id = f.addressee_account_id
      LEFT JOIN lop l ON l.id = tk.lop_id
      WHERE f.requester_account_id = ?1 AND f.status = 'pending'
      ORDER BY f.id DESC
    `;
    const { results: outgoingList } = await db.prepare(outgoingQuery).bind(myId).all();

    return json({
      ok: true,
      friends: (friendsList || []).map((f) => ({
        friendshipId: f.friendshipId,
        accountId: f.friendAccountId,
        username: f.username,
        displayName: f.displayName,
        role: f.role,
        classBadge: f.classBadge || '',
      })),
      pendingIncoming: (incomingList || []).map((req) => ({
        requestId: req.requestId,
        fromAccountId: req.fromAccountId,
        username: req.username,
        displayName: req.displayName,
        role: req.role,
        classBadge: req.classBadge || '',
        createdAt: req.createdAt,
      })),
      pendingOutgoing: (outgoingList || []).map((req) => ({
        requestId: req.requestId,
        toAccountId: req.toAccountId,
        username: req.username,
        displayName: req.displayName,
        role: req.role,
        classBadge: req.classBadge || '',
        createdAt: req.createdAt,
      })),
    });
  } catch (e) {
    console.error('campus-friends GET error:', e);
    return loi('Không tải được danh sách bạn bè.', 500);
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

  const action = String(body.action || '').trim();

  // --- ACTION: SEARCH ---
  if (action === 'search') {
    const query = String(body.query || '').trim().toLowerCase();
    if (query.length < 2) {
      return json({ ok: true, list: [] });
    }

    try {
      // Tìm theo username hoặc tên hiển thị, loại trừ chính mình, chỉ tài khoản học sinh đã link hoặc giáo viên
      const searchQuery = `
        SELECT tk.id, tk.ten_dang_nhap AS username, tk.ten_hien_thi AS displayName,
               tk.vai_tro AS role, l.ten AS classBadge
        FROM tai_khoan_campus tk
        LEFT JOIN lop l ON l.id = tk.lop_id
        WHERE tk.id != ?1
          AND tk.dang_hoat_dong = 1
          AND (tk.hoc_sinh_id IS NOT NULL OR (tk.vai_tro = 'teacher' AND tk.teacher_pending = 0))
          AND (LOWER(tk.ten_dang_nhap) LIKE ?2 OR LOWER(tk.ten_hien_thi) LIKE ?2)
        LIMIT 10
      `;
      const { results } = await db.prepare(searchQuery).bind(myId, `%${query}%`).all();

      // Kiểm tra trạng thái bạn bè hiện tại với từng kết quả
      const listWithStatus = await Promise.all((results || []).map(async (u) => {
        const rel = await db.prepare(`
          SELECT id, status, requester_account_id AS reqId
          FROM campus_friendship
          WHERE (requester_account_id = ?1 AND addressee_account_id = ?2)
             OR (requester_account_id = ?2 AND addressee_account_id = ?1)
          LIMIT 1
        `).bind(myId, u.id).first();

        let friendshipStatus = 'none';
        if (rel) {
          if (rel.status === 'accepted') friendshipStatus = 'friends';
          else if (rel.status === 'pending') {
            friendshipStatus = rel.reqId === myId ? 'sent_pending' : 'received_pending';
          } else if (rel.status === 'blocked') {
            friendshipStatus = 'blocked';
          }
        }

        return {
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          classBadge: u.classBadge || '',
          friendshipStatus,
        };
      }));

      return json({ ok: true, list: listWithStatus });
    } catch (e) {
      console.error('campus-friends search error:', e);
      return loi('Không thể tìm kiếm bạn bè.', 500);
    }
  }

  // --- ACTION: REQUEST (Gửi lời mời kết bạn) ---
  if (action === 'request') {
    const targetAccountId = Number(body.targetAccountId);
    if (!targetAccountId || isNaN(targetAccountId)) {
      return loi('Thiếu id tài khoản cần kết bạn.', 400);
    }
    if (targetAccountId === myId) {
      return loi('Không thể kết bạn với chính mình.', 400);
    }

    try {
      // Kiểm tra đối phương có tồn tại và hợp lệ không
      const target = await db.prepare(
        "SELECT id, dang_hoat_dong FROM tai_khoan_campus WHERE id = ?1 AND (hoc_sinh_id IS NOT NULL OR vai_tro = 'teacher')"
      ).bind(targetAccountId).first();

      if (!target || !target.dang_hoat_dong) {
        return loi('Tài khoản không tồn tại hoặc không đủ điều kiện kết bạn.', 404);
      }

      // Kiểm tra quan hệ hiện có
      const existing = await db.prepare(`
        SELECT id, requester_account_id AS reqId, addressee_account_id AS addId, status
        FROM campus_friendship
        WHERE (requester_account_id = ?1 AND addressee_account_id = ?2)
           OR (requester_account_id = ?2 AND addressee_account_id = ?1)
        LIMIT 1
      `).bind(myId, targetAccountId).first();

      if (existing) {
        if (existing.status === 'blocked') {
          return json({ ok: false, loi: 'Không thể kết bạn với người dùng này.', code: 'blocked' }, 403);
        }
        if (existing.status === 'accepted') {
          return loi('Hai bạn đã là bạn bè từ trước.', 400);
        }
        if (existing.status === 'pending') {
          if (existing.reqId === myId) {
            return loi('Bạn đã gửi lời mời kết bạn trước đó rồi.', 400);
          } else {
            // Đối phương đã gửi lời mời cho tôi => Tự động chấp nhận luôn!
            await db.prepare(
              "UPDATE campus_friendship SET status = 'accepted', action_by_account_id = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2"
            ).bind(myId, existing.id).run();
            return json({ ok: true, status: 'accepted', message: 'Đã trở thành bạn bè!' });
          }
        }
      }

      // Tạo lời mời mới
      await db.prepare(`
        INSERT INTO campus_friendship (requester_account_id, addressee_account_id, status, action_by_account_id)
        VALUES (?1, ?2, 'pending', ?1)
      `).bind(myId, targetAccountId).run();

      return json({ ok: true, status: 'pending', message: 'Đã gửi lời mời kết bạn.' });
    } catch (e) {
      console.error('campus-friends request error:', e);
      return loi('Lỗi khi gửi lời mời kết bạn.', 500);
    }
  }

  // --- ACTION: ACCEPT (Chấp nhận lời mời) ---
  if (action === 'accept') {
    const requestId = Number(body.requestId);
    const fromAccountId = Number(body.fromAccountId);

    try {
      let req = null;
      if (requestId) {
        req = await db.prepare('SELECT id, requester_account_id, addressee_account_id, status FROM campus_friendship WHERE id = ?1').bind(requestId).first();
      } else if (fromAccountId) {
        req = await db.prepare(
          'SELECT id, requester_account_id, addressee_account_id, status FROM campus_friendship WHERE requester_account_id = ?1 AND addressee_account_id = ?2'
        ).bind(fromAccountId, myId).first();
      }

      if (!req) return loi('Không tìm thấy yêu cầu kết bạn.', 404);
      if (req.addressee_account_id !== myId) {
        return loi('Chỉ người nhận lời mời mới có quyền chấp nhận.', 403);
      }
      if (req.status !== 'pending') {
        return loi('Lời mời này không ở trạng thái chờ duyệt.', 400);
      }

      await db.prepare(
        "UPDATE campus_friendship SET status = 'accepted', action_by_account_id = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2"
      ).bind(myId, req.id).run();

      return json({ ok: true, status: 'accepted', message: 'Đã chấp nhận kết bạn.' });
    } catch (e) {
      console.error('campus-friends accept error:', e);
      return loi('Lỗi khi chấp nhận kết bạn.', 500);
    }
  }

  // --- ACTION: DECLINE (Từ chối lời mời) ---
  if (action === 'decline') {
    const requestId = Number(body.requestId);
    const fromAccountId = Number(body.fromAccountId);

    try {
      let req = null;
      if (requestId) {
        req = await db.prepare('SELECT id, requester_account_id, addressee_account_id, status FROM campus_friendship WHERE id = ?1').bind(requestId).first();
      } else if (fromAccountId) {
        req = await db.prepare(
          'SELECT id, requester_account_id, addressee_account_id, status FROM campus_friendship WHERE requester_account_id = ?1 AND addressee_account_id = ?2'
        ).bind(fromAccountId, myId).first();
      }

      if (!req) return loi('Không tìm thấy yêu cầu kết bạn.', 404);
      if (req.addressee_account_id !== myId) {
        return loi('Chỉ người nhận lời mời mới có quyền từ chối.', 403);
      }

      await db.prepare('DELETE FROM campus_friendship WHERE id = ?1').bind(req.id).run();
      return json({ ok: true, message: 'Đã từ chối lời mời kết bạn.' });
    } catch (e) {
      console.error('campus-friends decline error:', e);
      return loi('Lỗi khi từ chối kết bạn.', 500);
    }
  }

  // --- ACTION: UNFRIEND (Hủy kết bạn) ---
  if (action === 'unfriend') {
    const friendAccountId = Number(body.friendAccountId);
    if (!friendAccountId) return loi('Thiếu id bạn bè cần hủy kết nối.', 400);

    try {
      await db.prepare(`
        DELETE FROM campus_friendship
        WHERE ((requester_account_id = ?1 AND addressee_account_id = ?2)
           OR (requester_account_id = ?2 AND addressee_account_id = ?1))
          AND status = 'accepted'
      `).bind(myId, friendAccountId).run();

      return json({ ok: true, message: 'Đã hủy kết bạn.' });
    } catch (e) {
      console.error('campus-friends unfriend error:', e);
      return loi('Lỗi khi hủy kết bạn.', 500);
    }
  }

  // --- ACTION: BLOCK (Chặn người dùng) ---
  if (action === 'block') {
    const targetAccountId = Number(body.targetAccountId);
    if (!targetAccountId || targetAccountId === myId) {
      return loi('Id tài khoản cần chặn không hợp lệ.', 400);
    }

    try {
      // Xóa hoặc cập nhật quan hệ thành 'blocked'
      const existing = await db.prepare(`
        SELECT id FROM campus_friendship
        WHERE (requester_account_id = ?1 AND addressee_account_id = ?2)
           OR (requester_account_id = ?2 AND addressee_account_id = ?1)
      `).bind(myId, targetAccountId).first();

      if (existing) {
        await db.prepare(`
          UPDATE campus_friendship
          SET status = 'blocked', requester_account_id = ?1, addressee_account_id = ?2, action_by_account_id = ?1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?3
        `).bind(myId, targetAccountId, existing.id).run();
      } else {
        await db.prepare(`
          INSERT INTO campus_friendship (requester_account_id, addressee_account_id, status, action_by_account_id)
          VALUES (?1, ?2, 'blocked', ?1)
        `).bind(myId, targetAccountId).run();
      }

      return json({ ok: true, message: 'Đã chặn người dùng thành công.' });
    } catch (e) {
      console.error('campus-friends block error:', e);
      return loi('Lỗi khi chặn người dùng.', 500);
    }
  }

  return loi('Hành động không hợp lệ.', 400);
}
