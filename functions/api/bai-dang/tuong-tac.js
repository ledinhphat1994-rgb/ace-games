// API Tương tác Bài đăng (Cảm xúc & Bình luận theo chuẩn Twitter / X Communities)
// Hỗ trợ mọi học sinh và giáo viên trong lớp
import { bocXuLy, docThan, json, loi } from '../../_lib/api.js';

function bamChuoiThanhSo(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function layThongTinNguoiDung(phien, thietBiId = '') {
  let nguoiDungId = 100001;
  let nguoiDungTen = 'Thành viên lớp';
  let vaiTro = 'hoc_sinh';

  if (phien) {
    if (phien.role === 'teacher') {
      nguoiDungId = 999999;
      nguoiDungTen = phien.ten || 'Giáo viên chủ nhiệm';
      vaiTro = 'giao_vien';
    } else if (phien.hocSinhId) {
      nguoiDungId = phien.hocSinhId;
      nguoiDungTen = phien.ten || 'Học sinh';
      vaiTro = phien.chucVu ? 'can_bo' : (phien.role === 'phu' ? 'can_bo' : 'hoc_sinh');
    } else if (phien.role === 'phu') {
      nguoiDungId = 800000 + (phien.phuId || phien.taiKhoanPhuId || 1);
      nguoiDungTen = phien.ten || 'Cán bộ lớp';
      vaiTro = 'can_bo';
    } else if (phien.ten) {
      nguoiDungTen = phien.ten;
    }
  }

  // Nếu không có học sinh id trong phiên nhưng có mã thiết bị riêng biệt:
  // ánh xạ thành một id người dùng duy nhất (dải 500000..699999) để không bao giờ bị ghi đè lẫn nhau.
  // BẢO MẬT: trộn thietBiId với phienId lấy từ cookie ký HMAC phía máy chủ — client không
  // thể tự đặt phienId nên không giả mạo được danh tính thiết bị của phiên người khác
  // (trước đây chỉ băm thietBiId do client gửi → đoán được là mạo danh được).
  if (nguoiDungId === 100001 && thietBiId) {
    nguoiDungId = 500000 + (bamChuoiThanhSo(`${thietBiId}::${phien?.phienId || 'khach'}`) % 200000);
  }

  return { nguoiDungId, nguoiDungTen, vaiTro };
}

import { coQuyenThanhVien } from '../../_lib/community.js';

async function baiThuocLop(db, id, lopId) {
  return Boolean(await db.prepare(`
    SELECT id FROM hoat_dong_lop WHERE id = ?1 AND lop_id = ?2
    UNION ALL SELECT id FROM thong_bao WHERE id = ?1 AND lop_id = ?2 AND hien = 1 AND trang_thai = 'xuat_ban'
    LIMIT 1
  `).bind(id, lopId).first());
}

// GET: Lấy danh sách bình luận và thống kê cảm xúc cho bài đăng
export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  if (!(await coQuyenThanhVien(env, phien))) {
    return json({ ok: false, error: 'community_membership_required', message: 'Cần mã truy cập từ Giáo viên để tham gia Bảng Tin.' }, 403);
  }

  const url = new URL(request.url);
  const baiDangId = parseInt(url.searchParams.get('baiDangId') || '0', 10);
  const lopId = phien.lopId || 1;
  const thietBiId = url.searchParams.get('thietBiId') || '';
  const { nguoiDungId } = layThongTinNguoiDung(phien, thietBiId);

  if (baiDangId <= 0) {
    // Tăng lượt xem nếu có request ghi nhận
    const tangXemId = parseInt(url.searchParams.get('tangXem') || '0', 10);
    if (tangXemId > 0) {
      await Promise.all([
        env.DB.prepare(
          'UPDATE hoat_dong_lop SET luot_xem = luot_xem + 1 WHERE id = ?1 AND lop_id = ?2'
        ).bind(tangXemId, lopId).run().catch(() => {}),
        env.DB.prepare(
          'UPDATE thong_bao SET luot_xem = luot_xem + 1 WHERE id = ?1 AND lop_id = ?2'
        ).bind(tangXemId, lopId).run().catch(() => {})
      ]);
      return json({ ok: true });
    }
    return loi('Thiếu mã bài đăng.');
  }

  // Lấy danh sách cảm xúc
  const camXucRows = await env.DB.prepare(
    'SELECT nguoi_dung_id, nguoi_dung_ten, loai_cam_xuc FROM bai_dang_cam_xuc WHERE bai_dang_id = ?1 AND lop_id = ?2'
  ).bind(baiDangId, lopId).all();

  const cacLoai = { thich: 0, tim: 0, haha: 0, wow: 0, buon: 0, phan_no: 0 };
  let daChon = null;

  (camXucRows.results || []).forEach((row) => {
    if (cacLoai[row.loai_cam_xuc] !== undefined) {
      cacLoai[row.loai_cam_xuc]++;
    }
    if (row.nguoi_dung_id === nguoiDungId) {
      daChon = row.loai_cam_xuc;
    }
  });

  const tongCamXuc = (camXucRows.results || []).length;

  // Lấy danh sách bình luận (có tra_loi_id phân cấp cha-con)
  const binhLuanRows = await env.DB.prepare(
    `SELECT id, tra_loi_id AS traLoiId, nguoi_dung_id AS nguoiDungId, nguoi_dung_ten AS nguoiDungTen,
            vai_tro AS vaiTro, noi_dung AS noiDung, tao_luc AS taoLuc
       FROM bai_dang_binh_luan
      WHERE bai_dang_id = ?1 AND lop_id = ?2
      ORDER BY id ASC`
  ).bind(baiDangId, lopId).all();

  return json({
    ok: true,
    baiDangId,
    camXuc: {
      tong: tongCamXuc,
      cacLoai,
      daChon,
    },
    binhLuan: binhLuanRows.results || [],
  });
});

// POST: Thả / Đổi / Gỡ cảm xúc cho bài đăng
export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  if (!(await coQuyenThanhVien(env, phien))) {
    return json({ ok: false, error: 'community_membership_required', message: 'Cần mã truy cập từ Giáo viên để tham gia Bảng Tin.' }, 403);
  }

  const body = await docThan(request);
  const baiDangId = parseInt(body.baiDangId || '0', 10);
  const loaiCamXuc = String(body.loaiCamXuc || '').trim();
  const thietBiId = String(body.thietBiId || '').trim();
  const lopId = phien.lopId || 1;
  const { nguoiDungId, nguoiDungTen } = layThongTinNguoiDung(phien, thietBiId);

  if (baiDangId <= 0) return loi('Mã bài đăng không hợp lệ.');
  if (!(await baiThuocLop(env.DB, baiDangId, phien.lopId))) return loi('Không tìm thấy bài đăng.', 404);

  const loaiHopLe = ['thich', 'tim', 'haha', 'wow', 'buon', 'phan_no'];

  // Nếu loaiCamXuc rỗng hoặc 'none' -> Gỡ cảm xúc
  if (!loaiCamXuc || loaiCamXuc === 'none' || !loaiHopLe.includes(loaiCamXuc)) {
    await env.DB.prepare(
      'DELETE FROM bai_dang_cam_xuc WHERE bai_dang_id = ?1 AND nguoi_dung_id = ?2 AND lop_id = ?3'
    ).bind(baiDangId, nguoiDungId, lopId).run();
  } else {
    // Thả mới hoặc đổi loại cảm xúc
    await env.DB.prepare(
      `INSERT INTO bai_dang_cam_xuc (lop_id, bai_dang_id, nguoi_dung_id, nguoi_dung_ten, loai_cam_xuc, tao_luc)
       VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)
       ON CONFLICT(bai_dang_id, nguoi_dung_id)
       DO UPDATE SET loai_cam_xuc = excluded.loai_cam_xuc, tao_luc = CURRENT_TIMESTAMP
       WHERE bai_dang_cam_xuc.lop_id = excluded.lop_id`
    ).bind(lopId, baiDangId, nguoiDungId, nguoiDungTen, loaiCamXuc).run();
  }

  // Đếm lại tổng cảm xúc và trả về kết quả mới nhất
  const demRows = await env.DB.prepare(
    'SELECT loai_cam_xuc, nguoi_dung_id FROM bai_dang_cam_xuc WHERE bai_dang_id = ?1 AND lop_id = ?2'
  ).bind(baiDangId, lopId).all();

  const cacLoai = { thich: 0, tim: 0, haha: 0, wow: 0, buon: 0, phan_no: 0 };
  let daChon = null;

  (demRows.results || []).forEach((r) => {
    if (cacLoai[r.loai_cam_xuc] !== undefined) cacLoai[r.loai_cam_xuc]++;
    if (r.nguoi_dung_id === nguoiDungId) daChon = r.loai_cam_xuc;
  });

  return json({
    ok: true,
    baiDangId,
    camXuc: {
      tong: (demRows.results || []).length,
      cacLoai,
      daChon,
    },
  });
});

// PUT: Thêm bình luận mới hoặc phản hồi (reply) cho bình luận khác
export const onRequestPut = bocXuLy(async ({ request, env, phien }) => {
  if (!(await coQuyenThanhVien(env, phien))) {
    return json({ ok: false, error: 'community_membership_required', message: 'Cần mã truy cập từ Giáo viên để tham gia Bảng Tin.' }, 403);
  }

  const body = await docThan(request);
  const baiDangId = parseInt(body.baiDangId || '0', 10);
  const traLoiId = body.traLoiId ? parseInt(body.traLoiId, 10) : null;
  const noiDung = String(body.noiDung || '').trim();
  const thietBiId = String(body.thietBiId || '').trim();
  const lopId = phien.lopId || 1;
  const { nguoiDungId, nguoiDungTen, vaiTro } = layThongTinNguoiDung(phien, thietBiId);

  if (baiDangId <= 0) return loi('Mã bài đăng không hợp lệ.');
  if (!(await baiThuocLop(env.DB, baiDangId, phien.lopId))) return loi('Không tìm thấy bài đăng.', 404);
  if (traLoiId && !(await env.DB.prepare(
    'SELECT id FROM bai_dang_binh_luan WHERE id = ?1 AND bai_dang_id = ?2 AND lop_id = ?3'
  ).bind(traLoiId, baiDangId, phien.lopId).first())) return loi('Không tìm thấy bình luận gốc.', 404);
  if (!noiDung) return loi('Vui lòng nhập nội dung bình luận.');
  if (noiDung.length > 1000) return loi('Bình luận quá dài (tối đa 1000 ký tự).');

  // Chống spam bình luận: mỗi người chỉ được gửi 1 bình luận mỗi 10 giây.
  const vuaBinhLuan = await env.DB.prepare(
    `SELECT id FROM bai_dang_binh_luan
      WHERE nguoi_dung_id = ?1 AND lop_id = ?2 AND tao_luc > datetime('now', '-10 seconds')
      LIMIT 1`
  ).bind(nguoiDungId, lopId).first();
  if (vuaBinhLuan) return loi('Bạn vừa bình luận xong — chờ vài giây rồi gửi tiếp.', 429);

  const kq = await env.DB.prepare(
    `INSERT INTO bai_dang_binh_luan (lop_id, bai_dang_id, tra_loi_id, nguoi_dung_id, nguoi_dung_ten, vai_tro, noi_dung, tao_luc)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)`
  ).bind(lopId, baiDangId, traLoiId, nguoiDungId, nguoiDungTen, vaiTro, noiDung).run();

  const idMoi = kq.meta?.last_row_id;

  return json({
    ok: true,
    binhLuan: {
      id: idMoi,
      baiDangId,
      traLoiId,
      nguoiDungId,
      nguoiDungTen,
      vaiTro,
      noiDung,
      taoLuc: new Date().toISOString(),
    },
  });
});

// DELETE: Xoá bình luận (người viết hoặc giáo viên / tài khoản có quyền)
export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  if (!(await coQuyenThanhVien(env, phien))) {
    return json({ ok: false, error: 'community_membership_required', message: 'Cần mã truy cập từ Giáo viên để tham gia Bảng Tin.' }, 403);
  }

  const url = new URL(request.url);
  const id = parseInt(url.searchParams.get('id') || '0', 10);
  const thietBiId = url.searchParams.get('thietBiId') || '';
  const lopId = phien.lopId || 1;
  const { nguoiDungId } = layThongTinNguoiDung(phien, thietBiId);

  if (id <= 0) return loi('Mã bình luận không hợp lệ.');

  const bl = await env.DB.prepare(
    'SELECT * FROM bai_dang_binh_luan WHERE id = ?1 AND lop_id = ?2'
  ).bind(id, lopId).first();

  if (!bl) return loi('Bình luận không tồn tại hoặc đã bị xoá.', 404);

  const laGiaoVien = phien.role === 'teacher';
  const coQuyenQuanLy = (phien.quyen || []).some((q) => ['hoat-dong-lop', 'hinh-anh'].includes(q));
  const laTacGia = bl.nguoi_dung_id === nguoiDungId;

  if (!laGiaoVien && !coQuyenQuanLy && !laTacGia) {
    return loi('Em chỉ có thể xoá bình luận của chính mình.', 403);
  }

  // Xoá bình luận này và tất cả bình luận con trả lời nó
  await env.DB.prepare(
    'DELETE FROM bai_dang_binh_luan WHERE (id = ?1 OR tra_loi_id = ?1) AND lop_id = ?2'
  ).bind(id, lopId).run();

  return json({ ok: true, id });
});
