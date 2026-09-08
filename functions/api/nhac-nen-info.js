// GET /api/nhac-nen-info — chỉ trả tên bài nhạc nền đang bật (nếu có), không trả file nhạc.
// Dùng cho các trang KHÔNG tải toàn bộ dữ liệu lớp qua /api/lop (khu quản lý, trang cá
// nhân...) để biết có nên hiện nút loa trên thanh đầu trang hay không.
import { bocXuLy, json } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const nhac = await env.DB.prepare('SELECT id, ten AS tenBai FROM am_thanh WHERE dang_phat = 1 AND lop_id = ?1 AND da_xoa_luc IS NULL LIMIT 1').bind(phien.lopId).first().catch(() => null);
  return json({ ok: true, nhac: nhac ? { id: nhac.id, tenBai: nhac.tenBai } : null });
}, { canGiaoVien: false });
