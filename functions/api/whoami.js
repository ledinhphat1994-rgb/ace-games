// GET /api/whoami — cho frontend biết đang đăng nhập là ai, để hiện đúng menu.
import { bocXuLy, json } from '../_lib/api.js';
import { coQuyenThanhVien } from '../_lib/community.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const isVerifiedTeacher = Boolean(phien.role === 'teacher' && !phien.teacherPending);
  const isLinkedStudent = Boolean(phien.hocSinhId && phien.lopId);
  const lop = (phien.lopId && (isVerifiedTeacher || isLinkedStudent))
    ? await env.DB.prepare('SELECT ten, nam_hoc AS namHoc FROM lop WHERE id = ?1').bind(phien.lopId).first().catch(() => null)
    : null;

  const coQuyenCongDong = await coQuyenThanhVien(env, phien);
  let laBienTapVien = false;

  if (['student', 'phu'].includes(phien.role) && phien.hocSinhId && phien.lopId) {

    const btv = await env.DB.prepare(
      'SELECT 1 FROM campus_bien_tap_vien WHERE hoc_sinh_id = ?1 AND lop_id = ?2'
    ).bind(phien.hocSinhId, phien.lopId).first().catch(() => null);
    if (btv) laBienTapVien = true;
  }

  let avatar = null;
  let tieuDeHoSo = null;
  let ten = phien.ten || '';
  if (phien.accountId || phien.username) {
    try {
      const tk = await env.DB.prepare(
        'SELECT ten_hien_thi AS tenHienThi, avatar, tieu_de_ho_so AS tieuDeHoSo FROM tai_khoan_campus WHERE id = ?1 OR ten_dang_nhap = ?2 LIMIT 1'
      ).bind(phien.accountId || -1, phien.username || '').first();
      if (tk) {
        if (tk.tenHienThi) ten = tk.tenHienThi;
        avatar = tk.avatar || null;
        tieuDeHoSo = tk.tieuDeHoSo || null;
      }
    } catch {}
  }

  return json({
    ok: true,
    avatar,
    tieuDeHoSo,
    accountId: phien.accountId || null,
    username: phien.username || '',
    role: phien.role,
    ten,
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
