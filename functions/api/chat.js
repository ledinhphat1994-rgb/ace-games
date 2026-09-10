// API Phòng tán gẫu lớp học (Chat Widget)
// Dùng chung cho cả Học sinh và Giáo viên, phân quyền theo phiên đăng nhập.
import { bocXuLy, docThan, json, loi } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const sauId = Math.max(0, parseInt(url.searchParams.get('sauId') || '0', 10));
  const lopId = phien.lopId || 1;
  const laGiaoVien = phien.role === 'teacher';

  // 1. Đọc cài đặt phòng chat (mặc định: mở, 5 giây giãn cách)
  let caiDat = await env.DB.prepare(
    'SELECT dang_mo AS dangMo, gian_cach_giay AS gianCachGiay, thong_bao_ghim AS thongBaoGhim FROM chat_cai_dat WHERE lop_id = ?1'
  ).bind(lopId).first();

  if (!caiDat) {
    caiDat = { dangMo: 1, gianCachGiay: 5, thongBaoGhim: '' };
  }

  // 2. Kiểm tra học sinh có đang bị cấm chat không
  let biCamChat = false;
  let lyDoCam = '';
  let denLucCam = null;

  if (!laGiaoVien && phien.hocSinhId) {
    const cam = await env.DB.prepare(
      'SELECT ly_do AS lyDo, den_luc AS denLuc FROM chat_cam_hoc_sinh WHERE hoc_sinh_id = ?1 AND lop_id = ?2'
    ).bind(phien.hocSinhId, lopId).first();

    if (cam) {
      if (!cam.denLuc) {
        biCamChat = true;
        lyDoCam = cam.lyDo || 'Vi phạm quy định lớp';
      } else {
        const hetHan = new Date(cam.denLuc).getTime();
        if (hetHan > Date.now()) {
          biCamChat = true;
          lyDoCam = cam.lyDo || 'Vi phạm quy định lớp';
          denLucCam = cam.denLuc;
        } else {
          // Đã hết thời gian cấm -> tự động gỡ
          await env.DB.prepare('DELETE FROM chat_cam_hoc_sinh WHERE hoc_sinh_id = ?1 AND lop_id = ?2')
            .bind(phien.hocSinhId, lopId).run().catch(() => {});
        }
      }
    }
  }

  // 3. Lấy tin nhắn (tối đa 50 tin mới hơn sauId)
  let tinNhan = [];
  if (sauId > 0) {
    const rs = await env.DB.prepare(
      'SELECT id, hoc_sinh_id AS hocSinhId, ten_nguoi_gui AS tenNguoiGui, vai_tro AS vaiTro, noi_dung AS noiDung, da_xoa AS daXoa, tao_luc AS taoLuc FROM chat_tin_nhan WHERE lop_id = ?1 AND id > ?2 ORDER BY id ASC LIMIT 50'
    ).bind(lopId, sauId).all();
    tinNhan = rs.results || [];
  } else {
    // Lần đầu mở khung chat: lấy 35 tin nhắn gần nhất
    const rs = await env.DB.prepare(
      'SELECT id, hoc_sinh_id AS hocSinhId, ten_nguoi_gui AS tenNguoiGui, vai_tro AS vaiTro, noi_dung AS noiDung, da_xoa AS daXoa, tao_luc AS taoLuc FROM (SELECT * FROM chat_tin_nhan WHERE lop_id = ?1 ORDER BY id DESC LIMIT 35) ORDER BY id ASC'
    ).bind(lopId).all();
    tinNhan = rs.results || [];
  }

  // Lấy danh sách ID các tin nhắn đã bị xoá gần đây để client đồng bộ tức thì
  const rsDaXoa = await env.DB.prepare(
    'SELECT id FROM chat_tin_nhan WHERE lop_id = ?1 AND da_xoa = 1 ORDER BY id DESC LIMIT 50'
  ).bind(lopId).all();
  const daXoaIds = (rsDaXoa.results || []).map((r) => r.id);

  // Tin đã xoá sẽ hiển thị nội dung thông báo đã xoá
  const danhSachTin = tinNhan.map((t) => {
    if (t.daXoa) {
      return { ...t, noiDung: '[Tin nhắn đã bị xoá]' };
    }
    return t;
  });

  return json({
    ok: true,
    caiDat,
    biCamChat,
    lyDoCam,
    denLucCam,
    laGiaoVien,
    hocSinhIdHienTai: phien.hocSinhId || null,
    tinNhan: danhSachTin,
    daXoaIds,
  });
}, { canGiaoVien: false });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const lopId = phien.lopId || 1;
  const laGiaoVien = phien.role === 'teacher';
  const than = await docThan(request);
  let noiDung = String(than.noiDung || '').trim();

  if (!noiDung) return loi('Tin nhắn không được để trống.');
  if (noiDung.length > 300) return loi('Tin nhắn tối đa 300 ký tự.');

  // Chặn đường dẫn web để chống phát tán mã độc / link lạ
  if (/https?:\/\/|ftp:\/\/|www\./i.test(noiDung)) {
    return loi('Vì lý do an toàn, không được gửi đường dẫn web (link) trong phòng chat.');
  }

  // 1. Kiểm tra trạng thái mở của phòng chat
  const caiDat = await env.DB.prepare(
    'SELECT dang_mo AS dangMo, gian_cach_giay AS gianCachGiay FROM chat_cai_dat WHERE lop_id = ?1'
  ).bind(lopId).first() || { dangMo: 1, gianCachGiay: 5 };

  if (!laGiaoVien && !caiDat.dangMo) {
    return loi('Giáo viên đang tạm dừng phòng chat của lớp. Vui lòng quay lại sau.');
  }

  // 2. Kiểm tra học sinh có bị cấm chat không
  if (!laGiaoVien && phien.hocSinhId) {
    const cam = await env.DB.prepare(
      'SELECT ly_do AS lyDo, den_luc AS denLuc FROM chat_cam_hoc_sinh WHERE hoc_sinh_id = ?1 AND lop_id = ?2'
    ).bind(phien.hocSinhId, lopId).first();

    if (cam) {
      if (!cam.denLuc || new Date(cam.denLuc).getTime() > Date.now()) {
        return loi(`Bạn đang bị tạm dừng quyền chat: ${cam.lyDo || 'Vi phạm nội quy lớp'}.`);
      }
      // Đã qua thời hạn cấm
      await env.DB.prepare('DELETE FROM chat_cam_hoc_sinh WHERE hoc_sinh_id = ?1 AND lop_id = ?2')
        .bind(phien.hocSinhId, lopId).run().catch(() => {});
    }
  }

  // 3. Kiểm tra Rate Limit (giãn cách gửi tin của học sinh)
  const gianCach = Math.max(1, caiDat.gianCachGiay || 5);
  if (!laGiaoVien && phien.hocSinhId) {
    const tinCuoi = await env.DB.prepare(
      'SELECT tao_luc AS taoLuc FROM chat_tin_nhan WHERE hoc_sinh_id = ?1 AND lop_id = ?2 ORDER BY id DESC LIMIT 1'
    ).bind(phien.hocSinhId, lopId).first();

    if (tinCuoi && tinCuoi.taoLuc) {
      const thoiGianTinCuoi = new Date(tinCuoi.taoLuc + 'Z').getTime();
      const hienTai = Date.now();
      const giayTroiQua = (hienTai - thoiGianTinCuoi) / 1000;
      if (giayTroiQua < gianCach) {
        const conLai = Math.ceil(gianCach - giayTroiQua);
        return loi(`Bạn đang gửi quá nhanh. Vui lòng chờ ${conLai} giây nữa.`, 429);
      }
    }
  }

  // 4. Xác định tên và vai trò người gửi
  let tenNguoiGui = 'Học sinh';
  let vaiTro = 'hoc_sinh';
  let hocSinhId = phien.hocSinhId || null;

  if (laGiaoVien) {
    tenNguoiGui = 'Giáo viên chủ nhiệm';
    vaiTro = 'giao_vien';
    hocSinhId = null;
  } else if (phien.hoTen) {
    tenNguoiGui = phien.hoTen;
    if (phien.chucVu && phien.chucVu !== 'Học sinh') {
      tenNguoiGui += ` (${phien.chucVu})`;
    }
  }

  // 5. Lưu tin nhắn vào DB
  const ketQua = await env.DB.prepare(
    'INSERT INTO chat_tin_nhan (lop_id, hoc_sinh_id, ten_nguoi_gui, vai_tro, noi_dung) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id, hoc_sinh_id AS hocSinhId, ten_nguoi_gui AS tenNguoiGui, vai_tro AS vaiTro, noi_dung AS noiDung, da_xoa AS daXoa, tao_luc AS taoLuc'
  ).bind(lopId, hocSinhId, tenNguoiGui, vaiTro, noiDung).first();

  return json({ ok: true, tinNhan: ketQua });
}, { canGiaoVien: false });
