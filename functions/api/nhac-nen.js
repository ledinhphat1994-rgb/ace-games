// GET /api/nhac-nen — phát bài nhạc ĐANG ĐƯỢC ĐẶT làm nhạc nền trang chủ (dang_phat=1 trong
// thư viện Âm thanh — xem functions/api/gv/thu-vien-am-thanh.js).
import { bocXuLy, loi } from '../_lib/api.js';
import { phucVuTepR2 } from '../_lib/media-stream.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const bai = await env.DB.prepare('SELECT khoa, kieu FROM am_thanh WHERE dang_phat = 1 AND lop_id = ?1 LIMIT 1').bind(phien.lopId).first();
  if (!bai) return loi('Chưa có nhạc nền.', 404);
  return phucVuTepR2(env, bai.khoa, 'audio/mpeg', request);
}, { canGiaoVien: false });
