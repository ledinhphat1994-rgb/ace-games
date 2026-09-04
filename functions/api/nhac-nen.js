// GET /api/nhac-nen — phát nội dung file nhạc nền đang bật cho trang lớp.
// Học sinh đã vào bằng mã lớp đều nghe được. Người ngoài thì không (middleware chặn từ trước).
import { bocXuLy, loi } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env }) => {
  if (!env.ANH) return loi('Chưa gắn kho lưu trữ.', 500);

  const nhac = await env.DB.prepare('SELECT khoa, kieu FROM nhac_nen WHERE id = 1').first();
  if (!nhac) return loi('Chưa có nhạc nền.', 404);

  const { value } = await env.ANH.getWithMetadata(nhac.khoa, { type: 'arrayBuffer' });
  if (!value) return loi('Không tìm thấy file nhạc.', 404);

  return new Response(value, {
    headers: {
      'Content-Type': nhac.kieu || 'audio/mpeg',
      'Cache-Control': 'private, max-age=604800',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'none',
    },
  });
}, { canGiaoVien: false });
