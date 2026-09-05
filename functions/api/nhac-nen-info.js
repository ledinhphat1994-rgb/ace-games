// GET /api/nhac-nen-info — chỉ trả tên bài nhạc nền đang bật (nếu có), không trả file nhạc.
// Dùng cho các trang KHÔNG tải toàn bộ dữ liệu lớp qua /api/lop (khu quản lý, trang cá
// nhân...) để biết có nên hiện nút loa trên thanh đầu trang hay không.
import { bocXuLy, json } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env }) => {
  const nhac = await env.DB.prepare('SELECT ten AS tenBai FROM am_thanh WHERE dang_phat = 1 LIMIT 1').first().catch(() => null);
  return json({ ok: true, nhac: nhac ? { tenBai: nhac.tenBai } : null });
}, { canGiaoVien: false });
