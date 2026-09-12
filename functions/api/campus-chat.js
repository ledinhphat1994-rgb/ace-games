// API Campus Chat — Trò chuyện toàn trường (Phase 4C / 4C.1)
import { json, loi } from '../_lib/api.js';
import { kiemTraQuyenSocial, lamSachNoiDung, checkRateLimit } from '../_lib/social.js';

export async function onRequestGet({ request, env }) {
  const auth = await kiemTraQuyenSocial(env, request);
  if (!auth.ok) {
    return json({ ok: false, loi: auth.loi, code: auth.code }, auth.status || 401);
  }

  const db = env.DB;
  const url = new URL(request.url);
  const sauId = parseInt(url.searchParams.get('sauId') || '0', 10);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1), 100);

  try {
    let query = '';
    let params = [];

    if (sauId > 0) {
      query = `
        SELECT m.id, m.sender_account_id AS senderAccountId, m.display_name AS senderName,
               m.role, m.content, m.created_at AS createdAt,
               l.ten AS classBadge
        FROM campus_chat_message m
        LEFT JOIN lop l ON l.id = m.lop_id
        WHERE m.deleted_at IS NULL AND m.id > ?1
        ORDER BY m.id ASC
        LIMIT ?2
      `;
      params = [sauId, limit];
    } else {
      query = `
        SELECT m.id, m.sender_account_id AS senderAccountId, m.display_name AS senderName,
               m.role, m.content, m.created_at AS createdAt,
               l.ten AS classBadge
        FROM campus_chat_message m
        LEFT JOIN lop l ON l.id = m.lop_id
        WHERE m.deleted_at IS NULL
        ORDER BY m.id DESC
        LIMIT ?1
      `;
      params = [limit];
    }

    const { results } = await db.prepare(query).bind(...params).all();
    const list = sauId > 0 ? (results || []) : (results || []).reverse();

    const formatted = list.map((msg) => ({
      id: msg.id,
      senderName: msg.senderName,
      role: msg.role,
      classBadge: msg.classBadge || '',
      content: msg.content,
      createdAt: msg.createdAt,
      isMe: Number(msg.senderAccountId) === Number(auth.accountId),
    }));

    return json({ ok: true, messages: formatted });
  } catch (e) {
    console.error('campus-chat GET error:', e);
    return loi('Không tải được tin nhắn Campus Chat.', 500);
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await kiemTraQuyenSocial(env, request);
  if (!auth.ok) {
    return json({ ok: false, loi: auth.loi, code: auth.code }, auth.status || 401);
  }

  const db = env.DB;
  let body;
  try {
    body = await request.json();
  } catch {
    return loi('Dữ liệu yêu cầu không hợp lệ.', 400);
  }

  const rawContent = String(body.noiDung || body.content || '').trim();
  if (!rawContent || rawContent.length < 1) {
    return loi('Nội dung tin nhắn không được để trống.', 400);
  }
  if (rawContent.length > 500) {
    return loi('Nội dung tin nhắn tối đa 500 ký tự.', 400);
  }

  // Rate limit: Tối thiểu 2 giây giữa các lần gửi (chống burst đồng thời và spam lặp lại)
  const allowed = await checkRateLimit(env, `chat:${auth.accountId}`, 1, 2000);
  if (!allowed) {
    return json({ ok: false, loi: 'Bạn gửi tin nhắn quá nhanh. Vui lòng chờ 2 giây.', code: 'rate_limited' }, 429);
  }

  const cleanContent = lamSachNoiDung(rawContent);

  try {
    const res = await db.prepare(
      `INSERT INTO campus_chat_message (sender_account_id, display_name, role, lop_id, content)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    ).bind(auth.accountId, auth.displayName, auth.role, auth.lopId, cleanContent).run();

    const newId = res.meta?.last_row_id;

    return json({
      ok: true,
      message: {
        id: newId,
        senderName: auth.displayName,
        role: auth.role,
        classBadge: auth.classBadge || '',
        content: cleanContent,
        createdAt: new Date().toISOString(),
        isMe: true,
      },
    });
  } catch (e) {
    console.error('campus-chat POST error:', e);
    return loi('Không thể gửi tin nhắn Campus Chat.', 500);
  }
}

export async function onRequestDelete({ request, env }) {
  const auth = await kiemTraQuyenSocial(env, request);
  if (!auth.ok) {
    return json({ ok: false, loi: auth.loi, code: auth.code }, auth.status || 401);
  }

  const db = env.DB;
  const url = new URL(request.url);
  const id = parseInt(url.searchParams.get('id') || '0', 10);
  if (!id) return loi('Thiếu id tin nhắn.', 400);

  try {
    const msg = await db.prepare(
      'SELECT id, sender_account_id, created_at FROM campus_chat_message WHERE id = ?1 AND deleted_at IS NULL'
    ).bind(id).first();

    if (!msg) {
      return loi('Tin nhắn không tồn tại hoặc đã bị xóa.', 404);
    }

    const isSender = Number(msg.sender_account_id) === Number(auth.accountId);
    const isTeacher = auth.isVerifiedTeacher;

    if (!isTeacher && !isSender) {
      return loi('Bạn không có quyền xóa tin nhắn này.', 403);
    }

    // Nếu là người gửi (học sinh), chỉ cho thu hồi trong vòng 15 phút
    if (!isTeacher && isSender) {
      const diffMin = (Date.now() - new Date(msg.created_at + 'Z').getTime()) / 60000;
      if (!isNaN(diffMin) && diffMin > 15) {
        return loi('Chỉ có thể thu hồi tin nhắn trong vòng 15 phút sau khi gửi.', 400);
      }
    }

    await db.prepare('UPDATE campus_chat_message SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?1').bind(id).run();

    return json({ ok: true, message: 'Đã xóa tin nhắn thành công.' });
  } catch (e) {
    console.error('campus-chat DELETE error:', e);
    return loi('Không thể xóa tin nhắn.', 500);
  }
}
