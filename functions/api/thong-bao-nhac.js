// GET /api/thong-bao-nhac?id=<id> — phát file âm thanh đính kèm trong MỘT thông báo cụ thể.
// Khác /api/nhac-nen (nhạc nền chung của cả trang) — đây là tệp riêng gắn theo từng tin.
// Học sinh đã đăng nhập vào lớp đều nghe được. Người ngoài thì không (cần phiên hợp lệ).
import { bocXuLy, loi } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  if (!env.ANH) return loi('Chưa gắn kho lưu trữ.', 500);

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  const tb = await env.DB.prepare(
    'SELECT nhac_khoa AS khoa, nhac_kieu AS kieu FROM thong_bao WHERE id = ?1'
  ).bind(id).first();
  if (!tb || !tb.khoa) return loi('Thông báo này chưa có tệp âm thanh.', 404);

  const { value } = await env.ANH.getWithMetadata(tb.khoa, { type: 'arrayBuffer' });
  if (!value) return loi('Không tìm thấy file âm thanh.', 404);

  return new Response(value, {
    headers: {
      'Content-Type': tb.kieu || 'audio/mpeg',
      'Cache-Control': 'private, max-age=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}, { canGiaoVien: false });
