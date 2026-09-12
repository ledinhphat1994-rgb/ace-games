// API Tin nhắn riêng 1-1 Campus (Phase 4C — Private Messaging / DM)
import { json, loi } from '../_lib/api.js';
import { kiemTraQuyenSocial, lamSachNoiDung } from '../_lib/social.js';

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
    // 1. Kiểm tra quan hệ bạn bè hợp lệ (phải là accepted)
    const friendship = await db.prepare(`
      SELECT id, status
      FROM campus_friendship
      WHERE ((requester_account_id = ?1 AND addressee_account_id = ?2)
         OR (requester_account_id = ?2 AND addressee_account_id = ?1))
        AND status = 'accepted'
      LIMIT 1
    `).bind(myId, friendAccountId).first();

    if (!friendship) {
      return json({
        ok: false,
        loi: 'Chỉ có thể xem tin nhắn với bạn bè đã chấp nhận kết nối.',
        code: 'friends_required',
      }, 403);
    }

    // 2. Lấy thông tin cơ bản của bạn bè
    const friendInfo = await db.prepare(`
      SELECT tk.id, tk.ten_dang_nhap AS username, tk.ten_hien_thi AS displayName,
             tk.vai_tro AS role, l.ten AS classBadge
      FROM tai_khoan_campus tk
      LEFT JOIN lop l ON l.id = tk.lop_id
      WHERE tk.id = ?1
    `).bind(friendAccountId).first();

    // 3. Tải tin nhắn
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

  // --- SUB-ACTION: BÁO CÁO VI PHẠM (REPORT) ---
  const url = new URL(request.url);
  if (body.action === 'report' || url.searchParams.get('action') === 'report') {
    const targetAccountId = Number(body.targetAccountId);
    const messageId = body.messageId ? Number(body.messageId) : null;
    const reason = String(body.reason || body.lyDo || '').trim();

    if (!targetAccountId || !reason) {
      return loi('Thiếu thông tin người bị báo cáo hoặc lý do.', 400);
    }

    try {
      await db.prepare(`
        INSERT INTO campus_report (reporter_account_id, target_account_id, message_id, reason)
        VALUES (?1, ?2, ?3, ?4)
      `).bind(myId, targetAccountId, messageId, reason.slice(0, 500)).run();

      return json({ ok: true, message: 'Đã gửi báo cáo cho giáo viên xem xét.' });
    } catch (e) {
      console.error('campus-dm report error:', e);
      return loi('Lỗi khi gửi báo cáo.', 500);
    }
  }

  // --- GỬI TIN NHẮN RIÊNG ---
  const receiverAccountId = Number(body.receiverAccountId || body.toAccountId);
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
    // 1. Kiểm tra quan hệ bạn bè hợp lệ
    const friendship = await db.prepare(`
      SELECT id, status
      FROM campus_friendship
      WHERE ((requester_account_id = ?1 AND addressee_account_id = ?2)
         OR (requester_account_id = ?2 AND addressee_account_id = ?1))
      LIMIT 1
    `).bind(myId, receiverAccountId).first();

    if (!friendship || friendship.status !== 'accepted') {
      return json({
        ok: false,
        loi: 'Chỉ có thể nhắn tin với bạn bè đã chấp nhận kết nối.',
        code: 'friends_required',
      }, 403);
    }

    // 2. Rate limit: 1s giữa các tin nhắn riêng
    const last = await db.prepare(`
      SELECT created_at FROM campus_private_message
      WHERE sender_account_id = ?1
      ORDER BY id DESC LIMIT 1
    `).bind(myId).first();

    if (last && last.created_at) {
      const diffMs = Date.now() - new Date(last.created_at + 'Z').getTime();
      if (!isNaN(diffMs) && diffMs < 1000) {
        return json({ ok: false, loi: 'Bạn gửi tin nhắn quá nhanh. Vui lòng chậm lại 1 giây.', code: 'rate_limited' }, 429);
      }
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
