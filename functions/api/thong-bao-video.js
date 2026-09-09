// GET /api/thong-bao-video?id=<id thông báo> — phát file video đính kèm trong thông báo,
// tra qua thư viện Video (video_id).
import { bocXuLy, loi } from '../_lib/api.js';
import { phucVuTepR2 } from '../_lib/media-stream.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien, waitUntil }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  const tb = await env.DB.prepare(
    `SELECT v.khoa, v.kieu
       FROM thong_bao tb LEFT JOIN video v ON v.id = tb.video_id
      WHERE tb.id = ?1 AND tb.lop_id = ?2`
  ).bind(id, phien.lopId).first();
  if (!tb) return loi('Không tìm thấy thông báo.', 404);
  if (!tb.khoa) return loi('Thông báo này chưa có video đính kèm.', 404);

  return phucVuTepR2(env, tb.khoa, tb.kieu || 'video/mp4', request, phien.lopId, waitUntil);
}, { canGiaoVien: false });
