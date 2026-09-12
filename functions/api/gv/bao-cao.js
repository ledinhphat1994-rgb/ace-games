// API Quản lý Báo cáo Vi phạm dành cho Giáo viên (Phase 4C.1 — Moderation Queue)
import { bocXuLy, docThan, json, loi } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, phien, request }) => {
  if (phien.role !== 'teacher' || phien.teacherPending) {
    return loi('Chỉ giáo viên đã xác thực mới có quyền xem danh sách báo cáo vi phạm.', 403);
  }

  const url = new URL(request.url);
  const statusFilter = String(url.searchParams.get('status') || 'all').trim().toLowerCase();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1), 100);

  let query = `
    SELECT
      r.id,
      r.reporter_account_id AS reporterAccountId,
      tk_rep.ten_hien_thi AS reporterName,
      tk_rep.ten_dang_nhap AS reporterUsername,
      r.target_account_id AS targetAccountId,
      tk_tgt.ten_hien_thi AS targetName,
      tk_tgt.ten_dang_nhap AS targetUsername,
      r.message_id AS messageId,
      m.content AS reportedMessageContent,
      r.reason,
      r.status,
      r.action_note AS actionNote,
      r.resolved_at AS resolvedAt,
      r.created_at AS createdAt
    FROM campus_report r
    LEFT JOIN tai_khoan_campus tk_rep ON tk_rep.id = r.reporter_account_id
    LEFT JOIN tai_khoan_campus tk_tgt ON tk_tgt.id = r.target_account_id
    LEFT JOIN campus_private_message m ON m.id = r.message_id
  `;

  let params;
  if (statusFilter !== 'all') {
    query += ` WHERE r.status = ?1 ORDER BY r.id DESC LIMIT ?2`;
    params = [statusFilter, limit];
  } else {
    query += ` ORDER BY r.id DESC LIMIT ?1`;
    params = [limit];
  }

  const { results } = await env.DB.prepare(query).bind(...params).all();

  // Đếm số lượng báo cáo đang chờ (pending)
  const pendingCountRes = await env.DB.prepare("SELECT COUNT(*) AS c FROM campus_report WHERE status = 'pending'").first();
  const pendingCount = Number(pendingCountRes?.c) || 0;

  return json({
    ok: true,
    reports: (results || []).map((r) => ({
      id: r.id,
      reporterAccountId: r.reporterAccountId,
      reporterName: r.reporterName || 'Học sinh',
      reporterUsername: r.reporterUsername || '',
      targetAccountId: r.targetAccountId,
      targetName: r.targetName || 'Người dùng',
      targetUsername: r.targetUsername || '',
      messageId: r.messageId || null,
      reportedMessageContent: r.reportedMessageContent || null,
      reason: r.reason,
      status: r.status,
      actionNote: r.actionNote || '',
      resolvedAt: r.resolvedAt || null,
      createdAt: r.createdAt,
    })),
    pendingCount,
  });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  if (phien.role !== 'teacher' || phien.teacherPending) {
    return loi('Chỉ giáo viên đã xác thực mới có quyền xử lý báo cáo vi phạm.', 403);
  }

  const than = await docThan(request);
  const reportId = parseInt(than.reportId, 10);
  const action = String(than.action || '').trim().toLowerCase(); // 'resolve' | 'dismiss'
  const actionNote = String(than.actionNote || than.ghiChu || '').trim();

  if (!reportId || (action !== 'resolve' && action !== 'dismiss')) {
    return loi('Dữ liệu không hợp lệ. Cần reportId và action (resolve | dismiss).', 400);
  }

  const targetReport = await env.DB.prepare('SELECT id, status FROM campus_report WHERE id = ?1').bind(reportId).first();
  if (!targetReport) {
    return loi('Không tìm thấy báo cáo cần xử lý.', 404);
  }

  const newStatus = action === 'resolve' ? 'resolved' : 'dismissed';
  const resolvedBy = phien.accountId ? Number(phien.accountId) : null;

  await env.DB.prepare(`
    UPDATE campus_report
    SET status = ?1, action_note = ?2, resolved_by_account_id = ?3, resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?4
  `).bind(newStatus, actionNote.slice(0, 500), resolvedBy, reportId).run();

  return json({
    ok: true,
    message: action === 'resolve' ? 'Đã đánh dấu báo cáo là Đã xử lý.' : 'Đã bỏ qua báo cáo.',
    status: newStatus,
  });
}, { canGiaoVien: true });
