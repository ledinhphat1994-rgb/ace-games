// GET /api/whoami — cho frontend biết đang đăng nhập là ai, để hiện đúng menu.
import { bocXuLy, json } from '../_lib/api.js';
import { coQuyenThanhVien } from '../_lib/community.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  // Tên lớp hiện tại — giáo viên có thể chủ nhiệm nhiều lớp bằng nhiều mã khác nhau, hiển thị
  // rõ đang ở đúng lớp nào để tránh nhầm lẫn (dù dữ liệu đã tách biệt tuyệt đối ở tầng máy chủ).
  const lop = await env.DB.prepare('SELECT ten, nam_hoc AS namHoc FROM lop WHERE id = ?1').bind(phien.lopId).first().catch(() => null);

  const coQuyenCongDong = await coQuyenThanhVien(env, phien);
  let laBienTapVien = false;

  if (['student', 'phu'].includes(phien.role) && phien.hocSinhId && phien.lopId) {

    const btv = await env.DB.prepare(
      'SELECT 1 FROM campus_bien_tap_vien WHERE hoc_sinh_id = ?1 AND lop_id = ?2'
    ).bind(phien.hocSinhId, phien.lopId).first().catch(() => null);
    if (btv) laBienTapVien = true;
  }

  return json({
    ok: true,
    accountId: phien.accountId || null,
    username: phien.username || '',
    role: phien.role,
    ten: phien.ten || '',
    vaiTro: phien.vaiTro || '',
    quyen: phien.quyen || [],
    teacherPending: Boolean(phien.teacherPending),
    isVerifiedTeacher: Boolean(phien.role === 'teacher' && !phien.teacherPending),
    isLinkedStudent: Boolean(phien.hocSinhId && phien.lopId),
    hocSinhId: phien.hocSinhId || null,
    lopId: phien.lopId || null,
    phuId: phien.phuId || phien.taiKhoanPhuId || null,
    tenLop: lop?.ten || '',
    namHoc: lop?.namHoc || '',
    toSo: phien.toSo || null,
    chucVu: phien.chucVu || '',
    coQuyenCongDong,
    laBienTapVien,
  });
});
