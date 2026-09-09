// Reset dữ liệu lớp theo từng mục — CHỈ giáo viên chủ nhiệm. HẦU HẾT các mục được CHỤP LẠI
// (checkpoint/thùng rác) NGAY TRƯỚC khi xoá sạch nên khôi phục lại được — RIÊNG "Tương tác" và
// "Lịch sử đăng nhập" là dạng NHẬT KÝ (loaiKhoiPhuc: 'khong-khoi-phuc'), xoá xong KHÔNG cứu lại
// được, đã cảnh báo rõ ở giao diện trước khi bấm. "ketQua" trả về sau khi reset dùng lại được
// ngay cho hành động "hoanTac" (nút "↩ Hoàn tác" hiện ngay trên giao diện sau khi reset, chỉ áp
// dụng cho các mục khôi phục được trong lần reset đó) — các mục khôi phục được vẫn khôi phục lại
// về sau qua đúng trang "Lịch sử & khôi phục" của từng mục như bình thường, "hoanTac" chỉ là
// đường tắt gộp nhiều mục 1 lần.
//   POST /api/gv/rieng/reset-du-lieu { hanhDong: 'reset', mucs: ['diem-danh','quy',...] }
//        -> xoá sạch các mục đã chọn, trả { ketQua: [...] }.
//   POST /api/gv/rieng/reset-du-lieu { hanhDong: 'hoanTac', ketQua: [...] }
//        -> khôi phục ĐÚNG những gì một lần reset vừa xoá (dùng lại "ketQua" của lần đó).
//
// KHÔNG bao gồm Học sinh/Mã cá nhân/Tài khoản phụ — xoá xong KHÔNG khôi phục được (khác hẳn các
// mục dưới đây), cố tình để ngoài tính năng này.
import { bocXuLy, json, loi, docThan } from '../../../_lib/api.js';
import { chupCheckpoint, khoiPhucCheckpoint } from '../../../_lib/quy-checkpoint.js';
import { chupCheckpointDiemDanh, khoiPhucCheckpointDiemDanh } from '../../../_lib/diem-danh-checkpoint.js';
import { chupCheckpointChung, khoiPhucCheckpointChung } from '../../../_lib/checkpoint-chung.js';
import { xoaNhieuKhoiThuVien, khoiPhucKhoiThuVien } from '../../../_lib/thu-vien.js';

const TEN_MUC = {
  'diem-danh': 'Điểm danh',
  quy: 'Thủ quỹ',
  'thong-bao': 'Thông báo',
  'thoi-khoa-bieu': 'Thời khoá biểu',
  'hoat-dong-lop': 'Hoạt động lớp',
  'hinh-anh': 'Thư viện Ảnh',
  'am-thanh': 'Thư viện Âm thanh',
  video: 'Thư viện Video',
  'theo-doi': 'Theo dõi đầu năm',
  'tuong-tac': 'Tương tác (lượt truy cập)',
  'lich-su-dang-nhap': 'Lịch sử đăng nhập',
};
const BANG_CHECKPOINT_CHUNG = { 'thong-bao': 'thong_bao', 'hoat-dong-lop': 'hoat_dong_lop', 'theo-doi': 'theo_doi' };
// "tuong-tac"/"lich-su-dang-nhap" là 2 mục dạng NHẬT KÝ (ghi lại việc đã xảy ra, không phải
// "nội dung lớp") — xoá xong KHÔNG khôi phục lại được, khác hẳn các mục còn lại (đánh dấu bằng
// loaiKhoiPhuc: 'khong-khoi-phuc' ở nhánh xử lý riêng của từng mục bên dưới, không có bảng
// checkpoint nào cho 2 mục này).
const LOAI_THU_VIEN = { 'hinh-anh': 'anh', 'am-thanh': 'am-thanh', video: 'video' };
const BANG_THU_VIEN = { anh: 'hinh_anh', 'am-thanh': 'am_thanh', video: 'video' };
const CAC_MUC_HOP_LE = new Set(Object.keys(TEN_MUC));

async function resetMotMuc(env, phien, muc) {
  const db = env.DB;
  const lopId = phien.lopId;
  const hanhDong = `Trước khi: reset toàn bộ ${TEN_MUC[muc]}`;

  if (muc === 'diem-danh') {
    const checkpointId = await chupCheckpointDiemDanh(db, hanhDong, phien);
    await db.prepare('DELETE FROM diem_danh WHERE lop_id = ?1').bind(lopId).run();
    return { muc, loaiKhoiPhuc: 'diem-danh', checkpointId };
  }

  if (muc === 'quy') {
    const checkpointId = await chupCheckpoint(db, hanhDong, phien);
    await db.batch([
      db.prepare('DELETE FROM quy_dong WHERE lop_id = ?1').bind(lopId),
      db.prepare('DELETE FROM quy_khoan WHERE lop_id = ?1').bind(lopId),
      db.prepare('DELETE FROM quy_chi WHERE lop_id = ?1').bind(lopId),
    ]);
    return { muc, loaiKhoiPhuc: 'quy', checkpointId };
  }

  if (BANG_CHECKPOINT_CHUNG[muc]) {
    const checkpointId = await chupCheckpointChung(db, muc, hanhDong, phien);
    await db.prepare(`DELETE FROM ${BANG_CHECKPOINT_CHUNG[muc]} WHERE lop_id = ?1`).bind(lopId).run();
    return { muc, loaiKhoiPhuc: 'checkpoint-chung', tinhNang: muc, checkpointId };
  }

  if (muc === 'thoi-khoa-bieu') {
    // Chỉ xoá TIẾT của phiên bản ĐANG DÙNG (về trống để xếp lại) — GIỮ NGUYÊN lịch sử các phiên
    // bản khác. "Đang dùng" xác định giống hệt công thức ở functions/api/lop.js.
    const checkpointId = await chupCheckpointChung(db, 'thoi-khoa-bieu', hanhDong, phien);
    const homNay = new Date().toISOString().slice(0, 10);
    const pb = await db.prepare(
      `SELECT id FROM tkb_phien_ban WHERE lop_id = ?1
        ORDER BY (CASE WHEN ngay_ket_thuc IS NULL THEN 0 ELSE 1 END),
                 (CASE WHEN ngay_bat_dau <= ?2 THEN 0 ELSE 1 END),
                 ngay_bat_dau DESC, id DESC LIMIT 1`
    ).bind(lopId, homNay).first();
    if (pb) await db.prepare('DELETE FROM tkb_o WHERE lop_id = ?1 AND phien_ban_id = ?2').bind(lopId, pb.id).run();
    return { muc, loaiKhoiPhuc: 'checkpoint-chung', tinhNang: 'thoi-khoa-bieu', checkpointId };
  }

  if (muc === 'tuong-tac') {
    // Dạng nhật ký — không chụp checkpoint, xoá xong không cứu lại được (đã cảnh báo rõ ở giao
    // diện trước khi giáo viên bấm reset).
    await db.batch([
      db.prepare('DELETE FROM luot_truy_cap WHERE lop_id = ?1').bind(lopId),
      db.prepare('DELETE FROM nhat_ky_truy_cap WHERE lop_id = ?1').bind(lopId),
    ]);
    return { muc, loaiKhoiPhuc: 'khong-khoi-phuc' };
  }

  if (muc === 'lich-su-dang-nhap') {
    await db.prepare('DELETE FROM nhat_ky_dang_nhap WHERE lop_id = ?1').bind(lopId).run();
    return { muc, loaiKhoiPhuc: 'khong-khoi-phuc' };
  }

  if (LOAI_THU_VIEN[muc]) {
    const loaiThuVien = LOAI_THU_VIEN[muc];
    const bang = BANG_THU_VIEN[loaiThuVien];
    const { results } = await db.prepare(`SELECT id FROM ${bang} WHERE lop_id = ?1 AND da_xoa_luc IS NULL`).bind(lopId).all();
    const ids = results.map((r) => r.id);
    if (ids.length) await xoaNhieuKhoiThuVien(env, loaiThuVien, ids, lopId, phien, `Reset toàn bộ ${TEN_MUC[muc]}`);
    return { muc, loaiKhoiPhuc: 'thu-vien', loaiThuVien, ids };
  }

  throw new Error('Mục không hợp lệ: ' + muc);
}

async function hoanTacMotMuc(env, phien, kq) {
  const db = env.DB;
  const lopId = phien.lopId;
  // 'khong-khoi-phuc' (Tương tác/Lịch sử đăng nhập) không khớp nhánh nào bên dưới — cố ý không
  // làm gì, giao diện đã không gửi các mục này lên đây (xem trang-reset-du-lieu.js).
  if (kq.loaiKhoiPhuc === 'diem-danh') {
    await khoiPhucCheckpointDiemDanh(db, kq.checkpointId, lopId);
  } else if (kq.loaiKhoiPhuc === 'quy') {
    await khoiPhucCheckpoint(db, kq.checkpointId, lopId);
  } else if (kq.loaiKhoiPhuc === 'checkpoint-chung') {
    await khoiPhucCheckpointChung(db, kq.tinhNang, kq.checkpointId, lopId);
  } else if (kq.loaiKhoiPhuc === 'thu-vien') {
    // Khôi phục thư viện chỉ làm được TỪNG mục một (chưa có hàm khôi phục hàng loạt) — làm lần
    // lượt, 1 mục lỗi (vd đã bị xoá vĩnh viễn sau đó) không chặn các mục còn lại.
    for (const id of kq.ids || []) {
      await khoiPhucKhoiThuVien(env, kq.loaiThuVien, id, lopId).catch(() => {});
    }
  }
}

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const { hanhDong, mucs, ketQua } = await docThan(request);

  if (hanhDong === 'hoanTac') {
    if (!Array.isArray(ketQua) || !ketQua.length) return loi('Không có gì để hoàn tác.');
    for (const kq of ketQua) await hoanTacMotMuc(env, phien, kq);
    return json({ ok: true });
  }

  if (hanhDong === 'reset') {
    const dsMuc = Array.isArray(mucs) ? [...new Set(mucs)].filter((m) => CAC_MUC_HOP_LE.has(m)) : [];
    if (!dsMuc.length) return loi('Chưa chọn mục nào để reset.');
    const ketQuaMoi = [];
    for (const muc of dsMuc) ketQuaMoi.push(await resetMotMuc(env, phien, muc));
    return json({ ok: true, ketQua: ketQuaMoi });
  }

  return loi('Hành động không hợp lệ.');
}, { canGiaoVien: true });
