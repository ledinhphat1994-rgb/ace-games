// API Quản lý Hồ sơ Hiển thị Giáo viên (Safe Presentation Fields)
import { bocXuLy, json, loi, docThan, chuoi, chuanUrlMedia } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const db = env.DB;
  const tk = await db.prepare(`
    SELECT id, ten_dang_nhap AS tenDangNhap, ten_hien_thi AS tenHienThi,
           avatar, tieu_de_ho_so AS tieuDeHoSo, vai_tro AS vaiTro, lop_id AS lopId
    FROM tai_khoan_campus
    WHERE id = ?1 OR ten_dang_nhap = ?2
    LIMIT 1
  `).bind(phien.accountId || -1, phien.username || '').first().catch(() => null);

  const lop = await db.prepare('SELECT ten, nam_hoc AS namHoc FROM lop WHERE id = ?1').bind(phien.lopId).first().catch(() => null);

  return json({
    ok: true,
    hoSo: {
      id: tk?.id || phien.accountId || null,
      tenDangNhap: tk?.tenDangNhap || phien.username || '',
      tenHienThi: tk?.tenHienThi || phien.ten || 'Giáo viên',
      avatar: tk?.avatar || null,
      tieuDeHoSo: tk?.tieuDeHoSo || 'Giáo viên Chủ nhiệm',
      vaiTro: 'teacher',
      isVerifiedTeacher: Boolean(phien.role === 'teacher' && !phien.teacherPending),
      lopId: phien.lopId || null,
      tenLop: lop?.ten || '',
      namHoc: lop?.namHoc || ''
    }
  });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ env, phien, request }) => {
  const db = env.DB;
  const than = await docThan(request);

  const tenHienThi = chuoi(than.tenHienThi, 60);
  if (!tenHienThi) {
    return loi('Tên hiển thị không được để trống.', 400);
  }

  const rawAvatar = String(than.avatar || '').trim();
  let avatar = null;
  if (rawAvatar) {
    avatar = chuanUrlMedia(rawAvatar) || chuoi(rawAvatar, 300);
  }

  const tieuDeHoSo = chuoi(than.tieuDeHoSo, 100);

  // BẢO MẬT HỆ THỐNG:
  // Tuyệt đối chỉ cập nhật các trường trình bày (presentation fields).
  // Không cho phép chỉnh sửa vai_tro, teacher_pending, lop_id, accountId.
  const daCo = await db.prepare('SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = ?1 OR id = ?2')
    .bind(phien.username || '', phien.accountId || -1).first().catch(() => null);

  if (daCo) {
    await db.prepare(`
      UPDATE tai_khoan_campus
      SET ten_hien_thi = ?1,
          avatar = ?2,
          tieu_de_ho_so = ?3,
          cap_nhat_luc = CURRENT_TIMESTAMP
      WHERE id = ?4
    `).bind(tenHienThi, avatar || null, tieuDeHoSo || null, daCo.id).run();
  } else {
    await db.prepare(`
      INSERT INTO tai_khoan_campus (ten_dang_nhap, mat_khau_hash, salt, ten_hien_thi, vai_tro, teacher_pending, lop_id, avatar, tieu_de_ho_so)
      VALUES (?1, 'LOCAL_AUTH', 'LOCAL_SALT', ?2, 'teacher', 0, ?3, ?4, ?5)
    `).bind(phien.username || 'gv_chu_nhiem', tenHienThi, phien.lopId || 1, avatar || null, tieuDeHoSo || null).run();
  }

  return json({
    ok: true,
    message: 'Đã cập nhật hồ sơ hiển thị giáo viên thành công.',
    hoSo: {
      tenHienThi,
      avatar,
      tieuDeHoSo
    }
  });
}, { canGiaoVien: true });
