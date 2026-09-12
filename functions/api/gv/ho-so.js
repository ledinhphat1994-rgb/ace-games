// API Quản lý Hồ sơ Hiển thị Giáo viên (Safe Presentation Fields Only)
import { bocXuLy, json, loi, docThan, chuoi, chuanUrlMedia } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const db = env.DB;

  // BẢO MẬT: Bắt buộc tài khoản Campus chính thức — Không chấp nhận session không định danh
  if (!phien.accountId) {
    return json({
      ok: false,
      loi: 'account_link_required',
      message: 'Yêu cầu liên kết tài khoản Campus chính thức trước khi truy cập hồ sơ.'
    }, 409);
  }

  // Tra cứu tài khoản chính xác theo accountId (Canonical Account Lookup)
  const tk = await db.prepare(`
    SELECT id, ten_dang_nhap AS tenDangNhap, ten_hien_thi AS tenHienThi,
           avatar, tieu_de_ho_so AS tieuDeHoSo, vai_tro AS vaiTro,
           teacher_pending AS teacherPending, dang_hoat_dong AS dangHoatDong, lop_id AS lopId
    FROM tai_khoan_campus
    WHERE id = ?1
  `).bind(phien.accountId).first().catch(() => null);

  if (!tk || !tk.dangHoatDong) {
    return loi('Tài khoản không tồn tại hoặc đã bị khoá.', 403);
  }

  // Chặn giáo viên chờ duyệt (teacherPending === 1) hoặc không phải role teacher
  if (tk.vaiTro !== 'teacher' || Number(tk.teacherPending) !== 0) {
    return loi('Chỉ giáo viên đã được phê duyệt xác minh mới có quyền truy cập hồ sơ giáo viên.', 403);
  }

  const lopId = tk.lopId || phien.lopId || 1;
  const lop = await db.prepare('SELECT ten, nam_hoc AS namHoc FROM lop WHERE id = ?1').bind(lopId).first().catch(() => null);

  return json({
    ok: true,
    hoSo: {
      id: tk.id,
      tenDangNhap: tk.tenDangNhap,
      tenHienThi: tk.tenHienThi || phien.ten || 'Giáo viên',
      avatar: tk.avatar || null,
      tieuDeHoSo: tk.tieuDeHoSo || 'Giáo viên Chủ nhiệm',
      vaiTro: 'teacher',
      isVerifiedTeacher: true,
      lopId,
      tenLop: lop?.ten || '',
      namHoc: lop?.namHoc || ''
    }
  });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ env, phien, request }) => {
  const db = env.DB;

  // BẢO MẬT: Bắt buộc tài khoản Campus chính thức
  if (!phien.accountId) {
    return json({
      ok: false,
      loi: 'account_link_required',
      message: 'Yêu cầu liên kết tài khoản Campus chính thức trước khi chỉnh sửa hồ sơ.'
    }, 409);
  }

  // Tra cứu tài khoản chính xác theo accountId
  const tk = await db.prepare(`
    SELECT id, ten_dang_nhap AS tenDangNhap, ten_hien_thi AS tenHienThi,
           vai_tro AS vaiTro, teacher_pending AS teacherPending, dang_hoat_dong AS dangHoatDong
    FROM tai_khoan_campus
    WHERE id = ?1
  `).bind(phien.accountId).first().catch(() => null);

  if (!tk || !tk.dangHoatDong) {
    return loi('Tài khoản không tồn tại hoặc đã bị khoá.', 403);
  }

  // Chặn giáo viên chờ duyệt hoặc tài khoản không mang quyền giáo viên thực tế
  if (tk.vaiTro !== 'teacher' || Number(tk.teacherPending) !== 0) {
    return loi('Chỉ giáo viên đã được phê duyệt xác minh mới có quyền chỉnh sửa hồ sơ giáo viên.', 403);
  }

  const than = await docThan(request);

  const tenHienThi = chuoi(than.tenHienThi, 60);
  if (!tenHienThi) {
    return loi('Tên hiển thị không được để trống.', 400);
  }

  // KIỂM TRA TÍNH HỢP LỆ CỦA URL AVATAR (AVATAR URL SECURITY VALIDATION)
  // Chỉ chấp nhận https:// hoặc link nội bộ /...
  // Tuyệt đối từ chối javascript:, data:, http://, //evil...
  let avatar = null;
  if (than.avatar !== undefined && than.avatar !== null) {
    const rawAvatar = String(than.avatar).trim();
    if (rawAvatar) {
      const normalized = chuanUrlMedia(rawAvatar);
      if (normalized === false) {
        return loi('URL avatar không hợp lệ. Chỉ hỗ trợ liên kết bảo mật HTTPS hoặc đường dẫn nội bộ.', 400);
      }
      avatar = normalized;
    }
  }

  const tieuDeHoSo = chuoi(than.tieuDeHoSo, 100) || null;

  // BẢO MẬT HỆ THỐNG:
  // Chỉ UPDATE các trường trình bày (presentation fields).
  // TUYỆT ĐỐI KHÔNG INSERT để tự provision tài khoản giáo viên mới.
  await db.prepare(`
    UPDATE tai_khoan_campus
    SET ten_hien_thi = ?1,
        avatar = ?2,
        tieu_de_ho_so = ?3,
        cap_nhat_luc = CURRENT_TIMESTAMP
    WHERE id = ?4
  `).bind(tenHienThi, avatar, tieuDeHoSo, tk.id).run();

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
