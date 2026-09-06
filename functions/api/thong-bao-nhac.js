// GET /api/thong-bao-nhac?id=<id thông báo> — phát file âm thanh đính kèm trong MỘT thông báo,
// tra qua thư viện Âm thanh (am_thanh_id).
import { bocXuLy, loi } from '../_lib/api.js';
import { phucVuTepR2 } from '../_lib/media-stream.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  const tb = await env.DB.prepare(
    `SELECT at.khoa, at.kieu
       FROM thong_bao tb LEFT JOIN am_thanh at ON at.id = tb.am_thanh_id
      WHERE tb.id = ?1 AND tb.lop_id = ?2`
  ).bind(id, phien.lopId).first();
  if (!tb) return loi('Không tìm thấy thông báo.', 404);
  if (!tb.khoa) return loi('Thông báo này chưa có tệp âm thanh.', 404);

  return phucVuTepR2(env, tb.khoa, tb.kieu || 'audio/mpeg', request);
}, { canGiaoVien: false });
