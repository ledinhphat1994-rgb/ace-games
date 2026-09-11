// API duyệt tài khoản Giáo viên (Teacher Account Approvals)
// Chỉ Giáo viên đã được xác thực (verified Teacher) mới có quyền truy cập endpoint này.
import { bocXuLy, docThan, json, loi } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  if (phien.role !== 'teacher' || phien.teacherPending) {
    return loi('Chỉ giáo viên đã xác thực mới có quyền xem danh sách duyệt.', 403);
  }

  const ds = await env.DB.prepare(
    `SELECT id, ten_dang_nhap AS tenDangNhap, ten_hien_thi AS tenHienThi,
            vai_tro AS vaiTro, teacher_pending AS teacherPending, tao_luc AS taoLuc
       FROM tai_khoan_campus
      WHERE teacher_pending = 1 AND dang_hoat_dong = 1
      ORDER BY tao_luc ASC`
  ).all();

  return json({
    ok: true,
    danhSach: ds.results || [],
    pendingTeachers: ds.results || [],
  });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  if (phien.role !== 'teacher' || phien.teacherPending) {
    return loi('Chỉ giáo viên đã xác thực mới có quyền phê duyệt.', 403);
  }

  const than = await docThan(request);
  const accountId = parseInt(than.accountId, 10);
  const action = String(than.action || '').trim().toLowerCase(); // 'approve' | 'reject'

  if (!accountId || (action !== 'approve' && action !== 'reject')) {
    return loi('Dữ liệu không hợp lệ. Cần accountId và action (approve | reject).', 400);
  }

  const target = await env.DB.prepare(
    'SELECT id, ten_dang_nhap, ten_hien_thi FROM tai_khoan_campus WHERE id = ?1'
  ).bind(accountId).first();

  if (!target) {
    return loi('Không tìm thấy tài khoản cần duyệt.', 404);
  }

  const nguoiDuyetKhoa = `gv:${phien.lopId || 1}:${phien.ten || 'Admin'}`;

  if (action === 'approve') {
    await env.DB.prepare(
      `UPDATE tai_khoan_campus
          SET vai_tro = 'teacher',
              teacher_pending = 0,
              duyet_boi_khoa = ?1,
              duyet_luc = CURRENT_TIMESTAMP,
              cap_nhat_luc = CURRENT_TIMESTAMP
        WHERE id = ?2`
    ).bind(nguoiDuyetKhoa, accountId).run();

    return json({
      ok: true,
      message: `Đã phê duyệt quyền Giáo viên cho tài khoản ${target.ten_dang_nhap} (${target.ten_hien_thi}).`,
      accountId,
      action: 'approved',
    });
  } else {
    // reject: giữ vai trò student và bỏ cờ pending
    await env.DB.prepare(
      `UPDATE tai_khoan_campus
          SET vai_tro = 'student',
              teacher_pending = 0,
              duyet_boi_khoa = ?1,
              duyet_luc = CURRENT_TIMESTAMP,
              cap_nhat_luc = CURRENT_TIMESTAMP
        WHERE id = ?2`
    ).bind(nguoiDuyetKhoa, accountId).run();

    return json({
      ok: true,
      message: `Đã từ chối yêu cầu quyền Giáo viên của tài khoản ${target.ten_dang_nhap}. Tài khoản chuyển về Học sinh.`,
      accountId,
      action: 'rejected',
    });
  }
}, { canGiaoVien: true });
