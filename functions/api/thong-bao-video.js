// GET /api/thong-bao-video?id=<id> — phát file video đính kèm trong thông báo.
// Tệp video được lưu trong Cloudflare R2 (env.ANH).
// Học sinh và khách xem web đều xem được.
import { bocXuLy, loi } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  if (!env.ANH) return loi('Chưa gắn kho lưu trữ.', 500);

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  const tb = await env.DB.prepare(
    'SELECT video_khoa AS khoa, video_kieu AS kieu FROM thong_bao WHERE id = ?1'
  ).bind(id).first();
  if (!tb || !tb.khoa) return loi('Thông báo này chưa có video đính kèm.', 404);

  let value, kieuTraVe;
  if (typeof env.ANH.getWithMetadata === 'function') {
    const res = await env.ANH.getWithMetadata(tb.khoa, { type: 'arrayBuffer' });
    if (!res || !res.value) return loi('Không tìm thấy video.', 404);
    value = res.value;
    kieuTraVe = tb.kieu || 'video/mp4';
  } else {
    const obj = await env.ANH.get(tb.khoa);
    if (!obj) return loi('Không tìm thấy video.', 404);
    value = obj.body;
    kieuTraVe = (obj.httpMetadata && obj.httpMetadata.contentType)
      || (obj.customMetadata && obj.customMetadata.kieu)
      || tb.kieu
      || 'video/mp4';
  }

  return new Response(value, {
    headers: {
      'Content-Type': kieuTraVe,
      'Cache-Control': 'private, max-age=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}, { canGiaoVien: false });
