// API Tin nhắn riêng 1-1 Campus (Phase 4C / 4C.1 — Private Messaging / DM Hardening)
import { json, loi } from '../_lib/api.js';
import { kiemTraQuyenSocial, lamSachNoiDung, checkRateLimit } from '../_lib/social.js';

export async function onRequestGet({ request, env }) {
  const auth = await kiemTraQuyenSocial(env, request);
  if (!auth.ok) {
    return json({ ok: false, loi: auth.loi, code: auth.code }, auth.status || 401);
  }

  const db = env.DB;
  const myId = Number(auth.accountId);
  const url = new URL(request.url);
  const friendAccountId = Number(url.searchParams.get('friendAccountId') || url.searchParams.get('friendId'));
  const sauId = parseInt(url.searchParams.get('sauId') || '0', 10);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1), 100);

  if (!friendAccountId || friendAccountId === myId) {
    return loi('Thiếu id bạn bè trò chuyện.', 400);
  }

  try {
    // 1. Kiểm tra chặn 2 chiều
    const isBlocked = await db.prepare(`
      SELECT 1 FROM campus_block
      WHERE (blocker_account_id = ?1 AND blocked_account_id = ?2)
         OR (blocker_account_id = ?2 AND blocked_account_id = ?1)
      LIMIT 1
    `).bind(myId, friendAccountId).first();

    if (isBlocked) {
      return json({ ok: false, loi: 'Không thể xem cuộc trò chuyện vì người dùng đã bị chặn.', code: 'blocked' }, 403);
    }

    // 2. Kiểm tra quan hệ bạn bè hợp lệ (pair_low, pair_high và status = 'accepted')
    const pairLow = Math.min(myId, friendAccountId);
    const pairHigh = Math.max(myId, friendAccountId);

    const friendship = await db.prepare(`
      SELECT id, status
      FROM campus_friendship
      WHERE pair_low = ?1 AND pair_high = ?2 AND status = 'accepted'
      LIMIT 1
    `).bind(pairLow, pairHigh).first();

    if (!friendship) {
      return json({
        ok: false,
        loi: 'Chỉ có thể xem tin nhắn với bạn bè đã chấp nhận kết nối.',
        code: 'friends_required',
      }, 403);
    }

    // 3. Lấy thông tin cơ bản của bạn bè
    const friendInfo = await db.prepare(`
      SELECT tk.id, tk.ten_dang_nhap AS username, tk.ten_hien_thi AS displayName,
             tk.vai_tro AS role,
             CASE WHEN tk.hoc_sinh_id IS NOT NULL AND tk.lop_id IS NOT NULL THEN l.ten ELSE '' END AS classBadge
      FROM tai_khoan_campus tk
      LEFT JOIN lop l ON l.id = tk.lop_id
      WHERE tk.id = ?1
    `).bind(friendAccountId).first();

    // 4. Tải tin nhắn
    let query = '';
    let params = [];
    if (sauId > 0) {
      query = `
        SELECT id, sender_account_id AS senderId, receiver_account_id AS receiverId,
               content, created_at AS createdAt
        FROM campus_private_message
        WHERE ((sender_account_id = ?1 AND receiver_account_id = ?2)
           OR (sender_account_id = ?2 AND receiver_account_id = ?1))
          AND retracted_at IS NULL
          AND id > ?3
        ORDER BY id ASC
        LIMIT ?4
      `;
      params = [myId, friendAccountId, sauId, limit];
    } else {
      query = `
        SELECT id, sender_account_id AS senderId, receiver_account_id AS receiverId,
               content, created_at AS createdAt
        FROM campus_private_message
        WHERE ((sender_account_id = ?1 AND receiver_account_id = ?2)
           OR (sender_account_id = ?2 AND receiver_account_id = ?1))
          AND retracted_at IS NULL
        ORDER BY id DESC
        LIMIT ?3
      `;
      params = [myId, friendAccountId, limit];
    }

    const { results } = await db.prepare(query).bind(...params).all();
    const list = sauId > 0 ? (results || []) : (results || []).reverse();

    return json({
      ok: true,
      friend: friendInfo ? {
        id: friendInfo.id,
        username: friendInfo.username,
        displayName: friendInfo.displayName,
        role: friendInfo.role,
        classBadge: friendInfo.classBadge || '',
      } : null,
      messages: list.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        isMe: Number(m.senderId) === myId,
      })),
    });
  } catch (e) {
    console.error('campus-dm GET error:', e);
    return loi('Không tải được tin nhắn riêng.', 500);
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

  // --- SUB-ACTION: BÁO CÁO VI PHẠM (REPORT VALIDATION & RATE LIMIT) ---
  const url = new URL(request.url);
  if (body.action === 'report' || url.searchParams.get('action') === 'report') {
    const targetAccountId = Number(body.targetAccountId);
    const messageId = body.messageId ? Number(body.messageId) : null;
    const reason = String(body.reason || body.lyDo || '').trim();

    if (!targetAccountId || !reason) {
      return loi('Thiếu thông tin người bị báo cáo hoặc lý do.', 400);
    }
    if (targetAccountId === myId) {
      return loi('Không thể tự báo cáo chính mình.', 400);
    }

    try {
      // 1. Kiểm tra đối tượng bị báo cáo có tồn tại không
      const targetAcc = await db.prepare(
        'SELECT id, dang_hoat_dong FROM tai_khoan_campus WHERE id = ?1'
      ).bind(targetAccountId).first();

      if (!targetAcc) {
        return loi('Tài khoản bị báo cáo không tồn tại.', 404);
      }

      // 2. Nếu có đính kèm messageId, phải xác thực quyền sở hữu và bối cảnh tin nhắn
      if (messageId) {
        const msg = await db.prepare(`
          SELECT id, sender_account_id AS senderId, receiver_account_id AS receiverId, content
          FROM campus_private_message
          WHERE id = ?1
        `).bind(messageId).first();

        if (!msg) {
          return loi('Không tìm thấy tin nhắn cần báo cáo.', 404);
        }

        const isParticipant = Number(msg.senderId) === myId || Number(msg.receiverId) === myId;
        if (!isParticipant) {
          return loi('Bạn không thuộc cuộc trò chuyện của tin nhắn này.', 403);
        }

        // Đối tượng bị báo cáo PHẢI là người gửi của tin nhắn này
        if (Number(msg.senderId) !== targetAccountId || Number(msg.receiverId) !== myId) {
          return loi('Tin nhắn báo cáo không khớp với người bị báo cáo.', 403);
        }
      }

      // Rate limit: Tối đa 10 báo cáo / 5 phút / tài khoản
      const allowedReport = await checkRateLimit(env, `report:${myId}`, 10, 300000);
      if (!allowedReport) {
        return json({ ok: false, loi: 'Bạn gửi báo cáo quá nhiều lần. Vui lòng chờ 5 phút.', code: 'rate_limited' }, 429);
      }

      await db.prepare(`
        INSERT INTO campus_report (reporter_account_id, target_account_id, message_id, reason, status)
        VALUES (?1, ?2, ?3, ?4, 'pending')
      `).bind(myId, targetAccountId, messageId, reason.slice(0, 500)).run();

      return json({ ok: true, message: 'Đã gửi báo cáo cho giáo viên xem xét.' });
    } catch (e) {
      console.error('campus-dm report error:', e);
      return loi('Lỗi khi gửi báo cáo.', 500);
    }
  }

  // --- GỬI TIN NHẮN RIÊNG (DM SENDING) ---
  const receiverAccountId = Number(body.receiverAccountId || body.toAccountId || body.recipientAccountId);
  if (!receiverAccountId || receiverAccountId === myId) {
    return loi('Người nhận tin nhắn không hợp lệ.', 400);
  }

  const rawContent = String(body.noiDung || body.content || '').trim();
  if (!rawContent || rawContent.length < 1) {
    return loi('Nội dung tin nhắn không được để trống.', 400);
  }
  if (rawContent.length > 500) {
    return loi('Nội dung tin nhắn tối đa 500 ký tự.', 400);
  }

  try {
    // 1. Kiểm tra chặn 2 chiều (Block check phải được ưu tiên hàng đầu)
    const isBlocked = await db.prepare(`
      SELECT 1 FROM campus_block
      WHERE (blocker_account_id = ?1 AND blocked_account_id = ?2)
         OR (blocker_account_id = ?2 AND blocked_account_id = ?1)
      LIMIT 1
    `).bind(myId, receiverAccountId).first();

    if (isBlocked) {
      return json({ ok: false, loi: 'Không thể gửi tin nhắn vì người dùng đã bị chặn.', code: 'blocked' }, 403);
    }

    // 2. Kiểm tra quan hệ bạn bè hợp lệ theo unordered pair
    const pairLow = Math.min(myId, receiverAccountId);
    const pairHigh = Math.max(myId, receiverAccountId);

    const friendship = await db.prepare(`
      SELECT id, status
      FROM campus_friendship
      WHERE pair_low = ?1 AND pair_high = ?2 AND status = 'accepted'
      LIMIT 1
    `).bind(pairLow, pairHigh).first();

    if (!friendship) {
      return json({
        ok: false,
        loi: 'Chỉ có thể nhắn tin với bạn bè đã chấp nhận kết nối.',
        code: 'friends_required',
      }, 403);
    }

    // 3. Rate limit: Tối thiểu 1 giây giữa các lần gửi DM (chống burst)
    const allowed = await checkRateLimit(env, `dm:${myId}`, 1, 1000);
    if (!allowed) {
      return json({ ok: false, loi: 'Bạn gửi tin nhắn quá nhanh. Vui lòng chậm lại 1 giây.', code: 'rate_limited' }, 429);
    }

    const cleanContent = lamSachNoiDung(rawContent);

    const res = await db.prepare(`
      INSERT INTO campus_private_message (sender_account_id, receiver_account_id, content)
      VALUES (?1, ?2, ?3)
    `).bind(myId, receiverAccountId, cleanContent).run();

    const newId = res.meta?.last_row_id;

    return json({
      ok: true,
      message: {
        id: newId,
        content: cleanContent,
        createdAt: new Date().toISOString(),
        isMe: true,
      },
    });
  } catch (e) {
    console.error('campus-dm POST error:', e);
    return loi('Không thể gửi tin nhắn riêng.', 500);
  }
}
