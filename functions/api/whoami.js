// GET /api/whoami — cho frontend biết đang đăng nhập là ai, để hiện đúng menu.
import { bocXuLy, json } from '../_lib/api.js';
import { coQuyenThanhVien } from '../_lib/community.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  let avatar = null;
  let tieuDeHoSo = null;
  let ten = phien.ten || '';
  let currentHocSinhId = phien.hocSinhId || null;
  let currentLopId = phien.lopId || null;
  let currentRole = phien.role;
  let currentTeacherPending = Boolean(phien.teacherPending);
  let isSchoolAdmin = false;
  let isAccountActive = true;

  if (phien.accountId || phien.username) {
    try {
      const tk = await env.DB.prepare(
        `SELECT id, ten_dang_nhap AS tenDangNhap, ten_hien_thi AS tenHienThi,
                vai_tro AS vaiTro, teacher_pending AS teacherPending, dang_hoat_dong AS dangHoatDong,
                hoc_sinh_id AS hocSinhId, lop_id AS lopId, avatar, tieu_de_ho_so AS tieuDeHoSo,
                la_admin_truong AS laAdminTruong
         FROM tai_khoan_campus
         WHERE id = ?1 OR ten_dang_nhap = ?2 LIMIT 1`
      ).bind(phien.accountId || -1, phien.username || '').first();
      if (tk) {
        if (tk.tenHienThi) ten = tk.tenHienThi;
        avatar = tk.avatar || null;
        tieuDeHoSo = tk.tieuDeHoSo || null;
        currentRole = tk.vaiTro || currentRole;
        currentTeacherPending = Boolean(tk.teacherPending);
        // Trạng thái chuẩn xác từ CSDL: nếu huỷ liên kết lớp thì lập tức mất quyền, không duy trì theo cookie cũ
        currentHocSinhId = tk.hocSinhId || null;
        currentLopId = tk.lopId || null;
        isAccountActive = Boolean(tk.dangHoatDong === 1 || tk.dangHoatDong === true);
        isSchoolAdmin = Boolean(tk.laAdminTruong === 1 || tk.vaiTro === 'admin' || tk.vaiTro === 'school_admin');
      }
    } catch {}
  }

  const isVerifiedTeacher = Boolean(isSchoolAdmin || (currentRole === 'teacher' && !currentTeacherPending));
  const isLinkedStudent = Boolean(currentHocSinhId && currentLopId);
  const lop = (currentLopId && (isVerifiedTeacher || isLinkedStudent))
    ? await env.DB.prepare('SELECT ten, nam_hoc AS namHoc FROM lop WHERE id = ?1').bind(currentLopId).first().catch(() => null)
    : null;

  const coQuyenCongDong = await coQuyenThanhVien(env, phien);
  let laBienTapVien = false;

  if (['student', 'phu'].includes(currentRole) && currentHocSinhId && currentLopId) {
    const btv = await env.DB.prepare(
      'SELECT 1 FROM campus_bien_tap_vien WHERE hoc_sinh_id = ?1 AND lop_id = ?2'
    ).bind(currentHocSinhId, currentLopId).first().catch(() => null);
    if (btv) laBienTapVien = true;
  }

  return json({
    ok: true,
    avatar,
    tieuDeHoSo,
    accountId: phien.accountId || null,
    username: phien.username || '',
    role: currentRole,
    ten,
    vaiTro: phien.vaiTro || '',
    quyen: phien.quyen || [],
    teacherPending: currentTeacherPending,
    isVerifiedTeacher,
    isSchoolAdmin,
    isLinkedStudent,
    isActive: isAccountActive,
    hocSinhId: currentHocSinhId,
    lopId: currentLopId,
    phuId: phien.phuId || phien.taiKhoanPhuId || null,
    tenLop: lop?.ten || '',
    namHoc: lop?.namHoc || '',
    toSo: phien.toSo || null,
    chucVu: phien.chucVu || '',
    coQuyenCongDong,
    laBienTapVien,
  });
});
