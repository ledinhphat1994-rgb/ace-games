// GET /api/thong-bao-video?id=<id thông báo> — phát file video đính kèm trong thông báo.
// Ưu tiên tra qua thư viện Video (video_id); nếu thông báo này còn đính kèm kiểu CŨ (từ
// trước khi có thư viện, video_khoa) thì phát tạm bằng cột đó.
import { bocXuLy, loi } from '../_lib/api.js';
import { phucVuTepR2 } from '../_lib/media-stream.js';

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  const tb = await env.DB.prepare(
    `SELECT v.khoa AS khoaThuVien, v.kieu AS kieuThuVien, tb.video_khoa AS khoaCu, tb.video_kieu AS kieuCu
       FROM thong_bao tb LEFT JOIN video v ON v.id = tb.video_id
      WHERE tb.id = ?1`
  ).bind(id).first();
  if (!tb) return loi('Không tìm thấy thông báo.', 404);

  const khoa = tb.khoaThuVien || tb.khoaCu;
  if (!khoa) return loi('Thông báo này chưa có video đính kèm.', 404);

  return phucVuTepR2(env, khoa, tb.kieuThuVien || tb.kieuCu || 'video/mp4', request);
}, { canGiaoVien: false });
