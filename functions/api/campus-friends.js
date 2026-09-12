// API Bạn bè Campus (Phase 4C / 4C.1 — Friendship Graph, Unordered Pair Invariant & Block Separation)
import { json, loi } from '../_lib/api.js';
import { kiemTraQuyenSocial, checkRateLimit } from '../_lib/social.js';

export async function onRequestGet({ request, env }) {
  const auth = await kiemTraQuyenSocial(env, request);
  if (!auth.ok) {
    return json({ ok: false, loi: auth.loi, code: auth.code }, auth.status || 401);
  }

  const db = env.DB;
  const myId = Number(auth.accountId);

  try {
    // 1. Danh sách bạn bè đã chấp nhận (status = 'accepted'), loại bỏ mọi cặp đã bị chặn
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
        AND NOT EXISTS (
          SELECT 1 FROM campus_block b
          WHERE (b.blocker_account_id = ?1 AND b.blocked_account_id = tk.id)
             OR (b.blocker_account_id = tk.id AND b.blocked_account_id = ?1)
        )
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
        AND NOT EXISTS (
          SELECT 1 FROM campus_block b
          WHERE (b.blocker_account_id = ?1 AND b.blocked_account_id = tk.id)
             OR (b.blocker_account_id = tk.id AND b.blocked_account_id = ?1)
        )
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
        AND NOT EXISTS (
          SELECT 1 FROM campus_block b
          WHERE (b.blocker_account_id = ?1 AND b.blocked_account_id = tk.id)
             OR (b.blocker_account_id = tk.id AND b.blocked_account_id = ?1)
        )
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

  // --- ACTION: SEARCH (Bảo mật quyền riêng tư & Rate Limiting) ---
  if (action === 'search') {
    // Rate limit: Tối đa 20 lần tìm kiếm / phút / tài khoản
    const allowed = await checkRateLimit(env, `search:${myId}`, 20, 60000);
    if (!allowed) {
      return json({ ok: false, loi: 'Bạn tìm kiếm quá nhanh. Vui lòng thử lại sau 1 phút.', code: 'rate_limited' }, 429);
    }

    const query = String(body.query || '').trim().toLowerCase();
    if (!query) {
      return json({ ok: true, list: [] });
    }

    // Quy tắc bảo mật: Chỉ cho phép username chính xác HOẶC tiền tố username từ 4 ký tự trở lên.
    // Tuyệt đối không quét %query% chuỗi con hay quét tên hiển thị để chống vét danh bạ học sinh.
    const isExactOnly = query.length < 4;

    try {
      let searchQuery = '';
      let params = [];

      if (isExactOnly) {
        searchQuery = `
          SELECT tk.id, tk.ten_dang_nhap AS username, tk.ten_hien_thi AS displayName,
                 tk.vai_tro AS role, l.ten AS classBadge
          FROM tai_khoan_campus tk
          LEFT JOIN lop l ON l.id = tk.lop_id
          WHERE tk.id != ?1
            AND tk.dang_hoat_dong = 1
            AND (tk.hoc_sinh_id IS NOT NULL OR (tk.vai_tro = 'teacher' AND tk.teacher_pending = 0))
            AND LOWER(tk.ten_dang_nhap) = ?2
          LIMIT 10
        `;
        params = [myId, query];
      } else {
        searchQuery = `
          SELECT tk.id, tk.ten_dang_nhap AS username, tk.ten_hien_thi AS displayName,
                 tk.vai_tro AS role, l.ten AS classBadge
          FROM tai_khoan_campus tk
          LEFT JOIN lop l ON l.id = tk.lop_id
          WHERE tk.id != ?1
            AND tk.dang_hoat_dong = 1
            AND (tk.hoc_sinh_id IS NOT NULL OR (tk.vai_tro = 'teacher' AND tk.teacher_pending = 0))
            AND LOWER(tk.ten_dang_nhap) LIKE ?2
          LIMIT 10
        `;
        params = [myId, `${query}%`];
      }

      const { results } = await db.prepare(searchQuery).bind(...params).all();

      // Kiểm tra trạng thái bạn bè / chặn với từng kết quả
      const listWithStatus = await Promise.all((results || []).map(async (u) => {
        // Kiểm tra block
        const isBlocked = await db.prepare(`
          SELECT 1 FROM campus_block
          WHERE (blocker_account_id = ?1 AND blocked_account_id = ?2)
             OR (blocker_account_id = ?2 AND blocked_account_id = ?1)
          LIMIT 1
        `).bind(myId, u.id).first();

        if (isBlocked) {
          return {
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            role: u.role,
            classBadge: u.classBadge || '',
            friendshipStatus: 'blocked',
          };
        }

        const pLow = Math.min(myId, u.id);
        const pHigh = Math.max(myId, u.id);
        const rel = await db.prepare(`
          SELECT id, status, requester_account_id AS reqId
          FROM campus_friendship
          WHERE pair_low = ?1 AND pair_high = ?2
          LIMIT 1
        `).bind(pLow, pHigh).first();

        let friendshipStatus = 'none';
        if (rel) {
          if (rel.status === 'accepted') friendshipStatus = 'friends';
          else if (rel.status === 'pending') {
            friendshipStatus = rel.reqId === myId ? 'sent_pending' : 'received_pending';
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

  // --- ACTION: REQUEST (Gửi lời mời kết bạn — Unordered Pair Invariant & Anti-Spam) ---
  if (action === 'request') {
    // Rate limit: Tối đa 10 lời mời / phút / tài khoản
    const allowed = await checkRateLimit(env, `freq:${myId}`, 10, 60000);
    if (!allowed) {
      return json({ ok: false, loi: 'Bạn gửi lời mời kết bạn quá nhanh. Vui lòng chờ 1 phút.', code: 'rate_limited' }, 429);
    }

    const targetAccountId = Number(body.targetAccountId);
    if (!targetAccountId || isNaN(targetAccountId)) {
      return loi('Thiếu id tài khoản cần kết bạn.', 400);
    }
    if (targetAccountId === myId) {
      return loi('Không thể kết bạn với chính mình.', 400);
    }

    try {
      // 1. Kiểm tra đối phương có tồn tại và hợp lệ không
      const target = await db.prepare(
        "SELECT id, dang_hoat_dong FROM tai_khoan_campus WHERE id = ?1 AND (hoc_sinh_id IS NOT NULL OR vai_tro = 'teacher')"
      ).bind(targetAccountId).first();

      if (!target || !target.dang_hoat_dong) {
        return loi('Tài khoản không tồn tại hoặc không đủ điều kiện kết bạn.', 404);
      }

      // 2. Kiểm tra chặn 2 chiều
      const isBlocked = await db.prepare(`
        SELECT 1 FROM campus_block
        WHERE (blocker_account_id = ?1 AND blocked_account_id = ?2)
           OR (blocker_account_id = ?2 AND blocked_account_id = ?1)
        LIMIT 1
      `).bind(myId, targetAccountId).first();

      if (isBlocked) {
        return json({ ok: false, loi: 'Không thể kết bạn với người dùng này.', code: 'blocked' }, 403);
      }

      // 3. Kiểm tra quan hệ theo cặp không thứ tự (pair_low, pair_high)
      const pairLow = Math.min(myId, targetAccountId);
      const pairHigh = Math.max(myId, targetAccountId);

      const existing = await db.prepare(`
        SELECT id, requester_account_id AS reqId, addressee_account_id AS addId, status
        FROM campus_friendship
        WHERE pair_low = ?1 AND pair_high = ?2
        LIMIT 1
      `).bind(pairLow, pairHigh).first();

      if (existing) {
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
        if (existing.status === 'declined') {
          // Khởi động lại lời mời
          await db.prepare(`
            UPDATE campus_friendship
            SET requester_account_id = ?1, addressee_account_id = ?2, status = 'pending', action_by_account_id = ?1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?3
          `).bind(myId, targetAccountId, existing.id).run();
          return json({ ok: true, status: 'pending', message: 'Đã gửi lời mời kết bạn.' });
        }
      }

      // 4. Thử INSERT hàng mới với pair_low và pair_high
      try {
        await db.prepare(`
          INSERT INTO campus_friendship (requester_account_id, addressee_account_id, pair_low, pair_high, status, action_by_account_id)
          VALUES (?1, ?2, ?3, ?4, 'pending', ?1)
        `).bind(myId, targetAccountId, pairLow, pairHigh).run();

        return json({ ok: true, status: 'pending', message: 'Đã gửi lời mời kết bạn.' });
      } catch (insertError) {
        // Xử lý race condition đồng thời: Nếu cả A và B cùng insert một lúc,
        // UNIQUE(pair_low, pair_high) sẽ ném lỗi cho request thứ 2. Ta giải quyết an toàn:
        if (String(insertError?.message || '').includes('UNIQUE constraint failed')) {
          const fresh = await db.prepare(`
            SELECT id, requester_account_id AS reqId, status
            FROM campus_friendship
            WHERE pair_low = ?1 AND pair_high = ?2
          `).bind(pairLow, pairHigh).first();

          if (fresh && fresh.reqId === targetAccountId) {
            await db.prepare(
              "UPDATE campus_friendship SET status = 'accepted', action_by_account_id = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2"
            ).bind(myId, fresh.id).run();
            return json({ ok: true, status: 'accepted', message: 'Đã trở thành bạn bè!' });
          }
          return json({ ok: true, status: 'pending', message: 'Đã gửi lời mời kết bạn.' });
        }
        throw insertError;
      }
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
        const pairLow = Math.min(myId, fromAccountId);
        const pairHigh = Math.max(myId, fromAccountId);
        req = await db.prepare(
          'SELECT id, requester_account_id, addressee_account_id, status FROM campus_friendship WHERE pair_low = ?1 AND pair_high = ?2'
        ).bind(pairLow, pairHigh).first();
      }

      if (!req) return loi('Không tìm thấy yêu cầu kết bạn.', 404);
      if (req.addressee_account_id !== myId) {
        return loi('Chỉ người nhận lời mời mới có quyền chấp nhận.', 403);
      }
      if (req.status !== 'pending') {
        return loi('Lời mời này không ở trạng thái chờ duyệt.', 400);
      }

      // Kiểm tra xem có bị block không
      const isBlocked = await db.prepare(`
        SELECT 1 FROM campus_block
        WHERE (blocker_account_id = ?1 AND blocked_account_id = ?2)
           OR (blocker_account_id = ?2 AND blocked_account_id = ?1)
        LIMIT 1
      `).bind(myId, req.requester_account_id).first();

      if (isBlocked) {
        return json({ ok: false, loi: 'Không thể chấp nhận vì người dùng đã bị chặn.', code: 'blocked' }, 403);
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
        const pairLow = Math.min(myId, fromAccountId);
        const pairHigh = Math.max(myId, fromAccountId);
        req = await db.prepare(
          'SELECT id, requester_account_id, addressee_account_id, status FROM campus_friendship WHERE pair_low = ?1 AND pair_high = ?2'
        ).bind(pairLow, pairHigh).first();
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

    const pairLow = Math.min(myId, friendAccountId);
    const pairHigh = Math.max(myId, friendAccountId);

    try {
      await db.prepare(`
        DELETE FROM campus_friendship
        WHERE pair_low = ?1 AND pair_high = ?2 AND status = 'accepted'
      `).bind(pairLow, pairHigh).run();

      return json({ ok: true, message: 'Đã hủy kết bạn.' });
    } catch (e) {
      console.error('campus-friends unfriend error:', e);
      return loi('Lỗi khi hủy kết bạn.', 500);
    }
  }

  // --- ACTION: BLOCK (Chặn người dùng — Tách bảng riêng campus_block) ---
  if (action === 'block') {
    const targetAccountId = Number(body.targetAccountId);
    if (!targetAccountId || targetAccountId === myId) {
      return loi('Id tài khoản cần chặn không hợp lệ.', 400);
    }

    const pairLow = Math.min(myId, targetAccountId);
    const pairHigh = Math.max(myId, targetAccountId);

    try {
      // 1. Ghi nhận quan hệ chặn có chiều hướng vào campus_block
      await db.prepare(`
        INSERT OR IGNORE INTO campus_block (blocker_account_id, blocked_account_id)
        VALUES (?1, ?2)
      `).bind(myId, targetAccountId).run();

      // 2. Xóa bỏ hoàn toàn quan hệ bạn bè hoặc lời mời đang chờ giữa 2 người
      await db.prepare(`
        DELETE FROM campus_friendship
        WHERE pair_low = ?1 AND pair_high = ?2
      `).bind(pairLow, pairHigh).run();

      return json({ ok: true, message: 'Đã chặn người dùng thành công.' });
    } catch (e) {
      console.error('campus-friends block error:', e);
      return loi('Lỗi khi chặn người dùng.', 500);
    }
  }

  return loi('Hành động không hợp lệ.', 400);
}
