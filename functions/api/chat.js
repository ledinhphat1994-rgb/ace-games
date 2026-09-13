// API Phòng tán gẫu lớp học (Chat Widget)
// Dùng chung cho cả Học sinh và Giáo viên, phân quyền theo phiên đăng nhập.
import { bocXuLy, docThan, json, loi } from '../_lib/api.js';
import { ghiNhanHoatDong } from './gamification.js';
import { requireVerifiedClassMembership, checkRateLimit } from '../_lib/social.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const sauId = Math.max(0, parseInt(url.searchParams.get('sauId') || '0', 10));
  const reqLopId = parseInt(url.searchParams.get('lopId') || '', 10);

  // Xác thực quyền thành viên lớp học — TUYỆT ĐỐI KHÔNG fallback lopId || 1
  const classAuth = await requireVerifiedClassMembership(env, phien || request, reqLopId > 0 ? reqLopId : null);
  if (!classAuth.ok) {
    return json({ ok: false, loi: classAuth.loi, code: classAuth.code }, classAuth.status || 403);
  }

  const lopId = classAuth.lopId;
  const tenLop = classAuth.tenLop;
  const laGiaoVien = classAuth.isVerifiedTeacher;

  // Danh sách các lớp học được phép quản lý:
  // - School Admin: nhận tất cả các lớp đang hoạt động
  // - GVCN thông thường: CHỈ nhận lớp được phân công phụ trách
  let cacLop = [];
  if (laGiaoVien && env.DB) {
    if (classAuth.isSchoolAdmin) {
      const rsLop = await env.DB.prepare('SELECT id, ten FROM lop WHERE dang_hoat_dong = 1 ORDER BY id ASC').all().catch(() => ({ results: [] }));
      cacLop = (rsLop.results || []).map((l) => ({ id: l.id, ten: l.ten }));
    } else if (classAuth.lopId) {
      const rsLop = await env.DB.prepare('SELECT id, ten FROM lop WHERE id = ?1 AND dang_hoat_dong = 1').bind(classAuth.lopId).all().catch(() => ({ results: [] }));
      cacLop = (rsLop.results || []).map((l) => ({ id: l.id, ten: l.ten }));
    }
  }

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

  if (!laGiaoVien && classAuth.hocSinhId) {
    const cam = await env.DB.prepare(
      'SELECT ly_do AS lyDo, den_luc AS denLuc FROM chat_cam_hoc_sinh WHERE hoc_sinh_id = ?1 AND lop_id = ?2'
    ).bind(classAuth.hocSinhId, lopId).first();

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
            .bind(classAuth.hocSinhId, lopId).run().catch(() => {});
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
  } else if (classAuth.hocSinhId) {
    const hs = await env.DB.prepare(
      'SELECT ho_ten AS hoTen, chuc_vu AS chucVu FROM hoc_sinh WHERE id = ?1'
    ).bind(classAuth.hocSinhId).first().catch(() => null);
    if (hs && hs.hoTen) {
      tenNguoiDungHienTai = hs.hoTen;
      if (hs.chucVu && hs.chucVu !== 'Học sinh') {
        tenNguoiDungHienTai += ` (${hs.chucVu})`;
      }
    } else {
      tenNguoiDungHienTai = classAuth.displayName || 'Học sinh';
    }
  } else if (classAuth.displayName) {
    tenNguoiDungHienTai = classAuth.displayName;
  }

  // Tin đã xoá sẽ hiển thị nội dung thông báo đã xoá, tính sẵn laTinCuaToi
  // Giáo viên luôn thấy nội dung gốc dù học sinh đã thu hồi (kèm nhãn [Thu hồi])
  const danhSachTin = tinNhan.map((t) => {
    let laTinCuaToi = false;
    if (laGiaoVien) {
      laTinCuaToi = (t.vaiTro === 'giao_vien');
    } else if (classAuth.hocSinhId) {
      laTinCuaToi = (t.hocSinhId === classAuth.hocSinhId);
    } else if (phien.phuId || phien.role === 'phu') {
      laTinCuaToi = (t.vaiTro === 'phu' || t.tenNguoiGui === tenNguoiDungHienTai);
    }

    let noiDungHienThi;
    if (t.daXoa) {
      noiDungHienThi = laGiaoVien
        ? `[Thu hồi] ${t.noiDung}`
        : '[Tin nhắn đã bị xoá]';
    } else {
      noiDungHienThi = t.noiDung;
    }

    return {
      ...t,
      noiDung: noiDungHienThi,
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
    cacLop,
    hocSinhIdHienTai: classAuth.hocSinhId || null,
    tenHienTai: tenNguoiDungHienTai,
    vaiTroHienTai: classAuth.role || (laGiaoVien ? 'teacher' : 'student'),
    tinNhan: danhSachTin,
    daXoaIds,
  });
}, { canGiaoVien: false });

// Thu hồi tin nhắn: học sinh chỉ được thu hồi tin của chính mình trong lớp; giáo viên dùng API riêng
export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const tinId = Number(than.tinId);

  if (!tinId) return loi('Thiếu mã tin nhắn.');

  const classAuth = await requireVerifiedClassMembership(env, phien || request, null);
  if (!classAuth.ok) {
    return json({ ok: false, loi: classAuth.loi, code: classAuth.code }, classAuth.status || 403);
  }

  const laGiaoVien = classAuth.isVerifiedTeacher;

  // Lấy thông tin tin nhắn cần thu hồi
  const tin = await env.DB.prepare(
    'SELECT id, lop_id AS lopId, hoc_sinh_id AS hocSinhId, da_xoa AS daXoa FROM chat_tin_nhan WHERE id = ?1'
  ).bind(tinId).first();

  if (!tin) return loi('Tin nhắn không tồn tại.');
  if (tin.daXoa) return loi('Tin nhắn này đã được thu hồi rồi.');

  // Học sinh chỉ được thu hồi tin của chính mình trong lớp mình
  if (!laGiaoVien) {
    if (!classAuth.hocSinhId || tin.hocSinhId !== classAuth.hocSinhId || tin.lopId !== classAuth.lopId) {
      return loi('Bạn không có quyền thu hồi tin nhắn này.', 403);
    }
  }

  await env.DB.prepare('UPDATE chat_tin_nhan SET da_xoa = 1 WHERE id = ?1')
    .bind(tinId).run();

  return json({ ok: true, tinId });
}, { canGiaoVien: false });

export const onRequestPost = bocXuLy(async ({ request, env, phien, waitUntil }) => {
  const than = await docThan(request);
  const reqLopId = parseInt(than.lopId || '', 10);

  // Xác thực quyền thành viên lớp học — TUYỆT ĐỐI KHÔNG fallback lopId || 1
  const classAuth = await requireVerifiedClassMembership(env, phien || request, reqLopId > 0 ? reqLopId : null);
  if (!classAuth.ok) {
    return json({ ok: false, loi: classAuth.loi, code: classAuth.code }, classAuth.status || 403);
  }

  const lopId = classAuth.lopId;
  const laGiaoVien = classAuth.isVerifiedTeacher;
  const noiDung = String(than.noiDung || '').trim();

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
  if (!laGiaoVien && classAuth.hocSinhId) {
    const cam = await env.DB.prepare(
      'SELECT ly_do AS lyDo, den_luc AS denLuc FROM chat_cam_hoc_sinh WHERE hoc_sinh_id = ?1 AND lop_id = ?2'
    ).bind(classAuth.hocSinhId, lopId).first();

    if (cam) {
      if (!cam.denLuc || new Date(cam.denLuc).getTime() > Date.now()) {
        return loi(`Bạn đang bị tạm dừng quyền chat: ${cam.lyDo || 'Vi phạm nội quy lớp'}.`);
      }
      // Đã qua thời hạn cấm
      await env.DB.prepare('DELETE FROM chat_cam_hoc_sinh WHERE hoc_sinh_id = ?1 AND lop_id = ?2')
        .bind(classAuth.hocSinhId, lopId).run().catch(() => {});
    }
  }

  // 3. Kiểm tra Rate Limit (giãn cách gửi tin của học sinh) — qua checkRateLimit (KV) thay vì tự
  // SELECT tin gần nhất rồi so sánh giờ trong JS, đỡ 1 lượt đọc D1 mỗi tin nhắn (giống mẫu
  // campus-chat.js/campus-dm.js đang dùng). gianCach đọc từ cấu hình TỪNG LỚP (chat_cai_dat) nên
  // truyền windowMs ĐỘNG — không hard-code như phong-chat.js (khoảng cách cố định).
  const gianCach = Math.max(1, caiDat.gianCachGiay || 5);
  if (!laGiaoVien && classAuth.hocSinhId) {
    const duocGui = await checkRateLimit(env, `chat:${classAuth.hocSinhId}-${lopId}`, 1, gianCach * 1000);
    if (!duocGui) {
      return loi('Bạn đang gửi quá nhanh. Vui lòng chờ một chút rồi gửi lại.', 429);
    }
  }

  // 4. Xác định tên và vai trò người gửi
  let tenNguoiGui = 'Học sinh';
  let vaiTro = 'hoc_sinh';
  let hocSinhId = classAuth.hocSinhId || null;

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
      tenNguoiGui = classAuth.displayName || 'Học sinh';
    }
  } else if (classAuth.displayName) {
    tenNguoiGui = classAuth.displayName;
  }

  // 5. Lưu tin nhắn vào DB
  const ketQua = await env.DB.prepare(
    'INSERT INTO chat_tin_nhan (lop_id, hoc_sinh_id, ten_nguoi_gui, vai_tro, noi_dung) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id, hoc_sinh_id AS hocSinhId, ten_nguoi_gui AS tenNguoiGui, vai_tro AS vaiTro, noi_dung AS noiDung, da_xoa AS daXoa, tao_luc AS taoLuc'
  ).bind(lopId, hocSinhId, tenNguoiGui, vaiTro, noiDung).first();

  // Ghi điểm hoạt động THẬT cho học sinh vừa gửi tin thành công — chạy nền, lỗi
  // gamification không được làm hỏng phản hồi chat.
  if (hocSinhId) {
    const ghi = ghiNhanHoatDong(env, {
      hocSinhId, lopId,
      loaiHoatDong: 'chat',
      moTa: 'Gửi tin nhắn trong phòng chat lớp',
    }).catch(() => {});
    if (waitUntil) waitUntil(ghi);
  }

  return json({ ok: true, tinNhan: { ...ketQua, laTinCuaToi: true } });
}, { canGiaoVien: false });
