// GET /api/gv/quy-lich-su-thu — lịch sử TỪNG LẦN ghi thu (không gộp theo khoản), mới nhất
// trước. Dùng cho tab "Khoản thu" trong trang Lịch sử & khôi phục — khác "Khoản thu" ở trang
// Thủ quỹ (liệt kê theo khoản, không theo từng lần đóng của từng em).
import { bocXuLy, json } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT d.id, d.ngay, d.so_tien AS soTien, d.ghi_chu AS ghiChu,
            h.ho_ten AS hoTen, k.id AS khoanId, k.ten AS khoanTen
       FROM quy_dong d
       JOIN hoc_sinh h ON h.id = d.hoc_sinh_id
       JOIN quy_khoan k ON k.id = d.khoan_id
      ORDER BY d.ngay DESC, d.id DESC
      LIMIT 300`
  ).all();
  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true, quyenCan: 'quy' });
