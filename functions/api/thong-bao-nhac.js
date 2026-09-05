// GET /api/thong-bao-nhac?id=<id thông báo> — phát file âm thanh đính kèm trong MỘT thông báo.
// Ưu tiên tra qua thư viện Âm thanh (am_thanh_id); nếu thông báo này còn đính kèm kiểu CŨ
// (từ trước khi có thư viện, nhac_khoa) thì phát tạm bằng cột đó.
import { bocXuLy, loi } from '../_lib/api.js';
import { phucVuTepR2 } from '../_lib/media-stream.js';

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  const tb = await env.DB.prepare(
    `SELECT at.khoa AS khoaThuVien, at.kieu AS kieuThuVien, tb.nhac_khoa AS khoaCu, tb.nhac_kieu AS kieuCu
       FROM thong_bao tb LEFT JOIN am_thanh at ON at.id = tb.am_thanh_id
      WHERE tb.id = ?1`
  ).bind(id).first();
  if (!tb) return loi('Không tìm thấy thông báo.', 404);

  const khoa = tb.khoaThuVien || tb.khoaCu;
  if (!khoa) return loi('Thông báo này chưa có tệp âm thanh.', 404);

  return phucVuTepR2(env, khoa, tb.kieuThuVien || tb.kieuCu || 'audio/mpeg', request);
}, { canGiaoVien: false });
