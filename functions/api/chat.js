// API Phòng tán gẫu lớp học (Chat Widget)
// Dùng chung cho cả Học sinh và Giáo viên, phân quyền theo phiên đăng nhập.
import { bocXuLy, docThan, json, loi } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const sauId = Math.max(0, parseInt(url.searchParams.get('sauId') || '0', 10));
  const lopId = phien.lopId || 1;
  const laGiaoVien = phien.role === 'teacher';

  // Lấy tên lớp để hiển thị rõ ràng trên tiêu đề phòng chat
  const lopRow = await env.DB.prepare('SELECT ten FROM lop WHERE id = ?1').bind(lopId).first().catch(() => null);
  const tenLop = lopRow ? lopRow.ten : `Lớp ${lopId}`;

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

  // Xác định tên người dùng hiện tại
  let tenNguoiDungHienTai = 'Học sinh';
  if (laGiaoVien) {
    tenNguoiDungHienTai = 'Giáo viên chủ nhiệm';
  } else if (phien.hocSinhId) {
    const hs = await env.DB.prepare(
      'SELECT ho_ten AS hoTen, chuc_vu AS chucVu FROM hoc_sinh WHERE id = ?1'
    ).bind(phien.hocSinhId).first().catch(() => null);
    if (hs && hs.hoTen) {
      tenNguoiDungHienTai = hs.hoTen;
      if (hs.chucVu && hs.chucVu !== 'Học sinh') {
        tenNguoiDungHienTai += ` (${hs.chucVu})`;
      }
    } else {
      tenNguoiDungHienTai = phien.ten || phien.hoTen || 'Học sinh';
    }
  } else if (phien.ten || phien.hoTen) {
    tenNguoiDungHienTai = phien.ten || phien.hoTen;
    const cv = phien.chucVu || phien.vaiTro;
    if (cv && cv !== 'Học sinh' && cv !== 'student') {
      tenNguoiDungHienTai += ` (${cv})`;
    }
  }

  // Tin đã xoá sẽ hiển thị nội dung thông báo đã xoá, tính sẵn laTinCuaToi
  const danhSachTin = tinNhan.map((t) => {
    let laTinCuaToi = false;
    if (laGiaoVien) {
      laTinCuaToi = (t.vaiTro === 'giao_vien');
    } else if (phien.hocSinhId) {
      laTinCuaToi = (t.hocSinhId === phien.hocSinhId);
    } else if (phien.phuId || phien.role === 'phu') {
      laTinCuaToi = (t.vaiTro === 'phu' || t.tenNguoiGui === tenNguoiDungHienTai);
    }

    return {
      ...t,
      noiDung: t.daXoa ? '[Tin nhắn đã bị xoá]' : t.noiDung,
      laTinCuaToi,
    };
  });

  return json({
    ok: true,
    caiDat,
    biCamChat,
    lyDoCam,
    denLucCam,
    laGiaoVien,
    tenLop,
    lopId,
    hocSinhIdHienTai: phien.hocSinhId || null,
    tenHienTai: tenNguoiDungHienTai,
    vaiTroHienTai: phien.role || (laGiaoVien ? 'teacher' : 'student'),
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
      const isoStr = tinCuoi.taoLuc.replace(' ', 'T') + 'Z';
      const thoiGianTinCuoi = new Date(isoStr).getTime();
      if (!Number.isNaN(thoiGianTinCuoi)) {
        const hienTai = Date.now();
        const giayTroiQua = (hienTai - thoiGianTinCuoi) / 1000;
        if (giayTroiQua < gianCach) {
          const conLai = Math.ceil(gianCach - giayTroiQua);
          return loi(`Bạn đang gửi quá nhanh. Vui lòng chờ ${conLai} giây nữa.`, 429);
        }
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
  } else if (hocSinhId) {
    // Luôn tra cứu họ tên thật của học sinh từ DB theo hocSinhId
    const hs = await env.DB.prepare(
      'SELECT ho_ten AS hoTen, chuc_vu AS chucVu FROM hoc_sinh WHERE id = ?1'
    ).bind(hocSinhId).first().catch(() => null);

    if (hs && hs.hoTen) {
      tenNguoiGui = hs.hoTen;
      if (hs.chucVu && hs.chucVu !== 'Học sinh') {
        tenNguoiGui += ` (${hs.chucVu})`;
      }
    } else {
      tenNguoiGui = phien.ten || phien.hoTen || 'Học sinh';
      const cv = phien.chucVu || phien.vaiTro;
      if (cv && cv !== 'Học sinh' && cv !== 'student') {
        tenNguoiGui += ` (${cv})`;
      }
    }
  } else if (phien.phuId || phien.role === 'phu') {
    tenNguoiGui = phien.ten || 'Quản trị viên';
    vaiTro = 'phu';
    if (phien.vaiTro && phien.vaiTro !== 'Học sinh' && phien.vaiTro !== 'student') {
      tenNguoiGui += ` (${phien.vaiTro})`;
    }
  } else if (phien.ten || phien.hoTen) {
    tenNguoiGui = phien.ten || phien.hoTen;
    const cv = phien.chucVu || phien.vaiTro;
    if (cv && cv !== 'Học sinh' && cv !== 'student') {
      tenNguoiGui += ` (${cv})`;
    }
  }

  // 5. Lưu tin nhắn vào DB
  const ketQua = await env.DB.prepare(
    'INSERT INTO chat_tin_nhan (lop_id, hoc_sinh_id, ten_nguoi_gui, vai_tro, noi_dung) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id, hoc_sinh_id AS hocSinhId, ten_nguoi_gui AS tenNguoiGui, vai_tro AS vaiTro, noi_dung AS noiDung, da_xoa AS daXoa, tao_luc AS taoLuc'
  ).bind(lopId, hocSinhId, tenNguoiGui, vaiTro, noiDung).first();

  return json({ ok: true, tinNhan: { ...ketQua, laTinCuaToi: true } });
}, { canGiaoVien: false });
