// GET /api/nhac-nen-info — chỉ trả tên bài nhạc nền đang bật (nếu có), không trả file nhạc.
// Dùng cho các trang KHÔNG tải toàn bộ dữ liệu lớp qua /api/lop (khu quản lý, trang cá
// nhân...) để biết có nên hiện nút loa trên thanh đầu trang hay không.
import { bocXuLy, json } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env }) => {
  const nhac = await env.DB.prepare('SELECT ten_bai AS tenBai FROM nhac_nen WHERE id = 1').first().catch(() => null);
  return json({ ok: true, nhac: nhac ? { tenBai: nhac.tenBai } : null });
}, { canGiaoVien: false });
