// Quản lý thông tin Tab About của lớp (Văn bản + Hình ảnh + Video + Âm thanh)
//   GET   /api/gv/thong-tin-about  -> Lấy thông tin About hiện tại
//   POST  /api/gv/thong-tin-about  { vanBan, anhId, hinhUrl, videoId, videoUrl, amThanhId, amThanhUrl }
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const row = await env.DB.prepare(
    `SELECT a.van_ban AS vanBan, a.anh_id AS anhId, a.hinh_url AS hinhUrl, ha.khoa AS anhKhoa,
            a.video_id AS videoId, a.video_url AS videoUrl, v.khoa AS videoKhoa,
            a.am_thanh_id AS amThanhId, a.am_thanh_url AS amThanhUrl, at.khoa AS amThanhKhoa,
            a.cap_nhat_luc AS capNhatLuc
       FROM lop_about a
       LEFT JOIN hinh_anh ha ON ha.id = a.anh_id
       LEFT JOIN video v ON v.id = a.video_id
       LEFT JOIN am_thanh at ON at.id = a.am_thanh_id
      WHERE a.lop_id = ?1`
  ).bind(phien.lopId).first();

  return json({ ok: true, about: row || null });
});

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const vanBan = chuoi(than.vanBan, 10000) || null;
  const anhId = Number.isInteger(than.anhId) ? than.anhId : null;
  const hinhUrl = !anhId ? (chuoi(than.hinhUrl, 1000) || null) : null;
  const videoId = Number.isInteger(than.videoId) ? than.videoId : null;
  const videoUrl = !videoId ? (chuoi(than.videoUrl, 1000) || null) : null;
  const amThanhId = Number.isInteger(than.amThanhId) ? than.amThanhId : null;
  const amThanhUrl = !amThanhId ? (chuoi(than.amThanhUrl, 1000) || null) : null;

  await env.DB.prepare(
    `INSERT INTO lop_about (lop_id, van_ban, anh_id, hinh_url, video_id, video_url, am_thanh_id, am_thanh_url, cap_nhat_luc)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'))
     ON CONFLICT(lop_id) DO UPDATE SET
       van_ban = excluded.van_ban,
       anh_id = excluded.anh_id,
       hinh_url = excluded.hinh_url,
       video_id = excluded.video_id,
       video_url = excluded.video_url,
       am_thanh_id = excluded.am_thanh_id,
       am_thanh_url = excluded.am_thanh_url,
       cap_nhat_luc = datetime('now')`
  ).bind(
    phien.lopId,
    vanBan,
    anhId,
    hinhUrl,
    videoId,
    videoUrl,
    amThanhId,
    amThanhUrl
  ).run();

  return json({ ok: true, thongBao: 'Đã cập nhật thông tin Tab About thành công!' });
}, { canGiaoVien: true });
