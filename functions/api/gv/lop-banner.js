// Ảnh/video nền cho khối giới thiệu đầu trang lớp (banner) — CHỈ giáo viên chủ nhiệm sửa được.
//   GET   /api/gv/lop-banner    -> banner hiện tại (đã tra sẵn khoá/kiểu để xem trước)
//   PATCH /api/gv/lop-banner { anhId, hinhUrl } hoặc { videoId, videoUrl } -> đặt banner mới,
//         chỉ ĐÚNG MỘT TRONG HAI (ảnh HOẶC video) tại một thời điểm — đặt loại nào thì loại
//         kia tự xoá. Gửi rỗng cả 2 (không anhId/hinhUrl/videoId/videoUrl nào) để XOÁ HẲN
//         banner, quay về nền mặc định.
import { bocXuLy, json, loi, docThan } from '../../_lib/api.js';

// Kiểm tra id thư viện (ảnh/video) đính kèm THẬT SỰ thuộc lớp đang đăng nhập — chặn trường hợp
// gán nhầm/cố ý một mục thư viện của lớp khác làm banner công khai của lớp này.
async function xacThucThuVien(db, lopId, bang, id) {
  if (!Number.isInteger(id)) return true;
  const hang = await db.prepare(`SELECT id FROM ${bang} WHERE id = ?1 AND lop_id = ?2`).bind(id, lopId).first();
  return Boolean(hang);
}

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const row = await env.DB.prepare(
    `SELECT l.banner_anh_id AS bannerAnhId, ha.khoa AS bannerHinhKhoa, ha.kieu AS bannerHinhKieu,
            l.banner_hinh_url AS bannerHinhUrl,
            l.banner_video_id AS bannerVideoId, v.ten AS bannerVideoTen,
            l.banner_video_url AS bannerVideoUrl
       FROM lop l
       LEFT JOIN hinh_anh ha ON ha.id = l.banner_anh_id
       LEFT JOIN video v ON v.id = l.banner_video_id
      WHERE l.id = ?1`
  ).bind(phien.lopId).first();
  return json({ ok: true, banner: row || {} });
}, { canGiaoVien: true, quyenCan: ['hinh-anh', 'video'] });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const anhId = Number.isInteger(than.anhId) ? than.anhId : null;
  const hinhUrl = typeof than.hinhUrl === 'string' ? than.hinhUrl.trim() : '';
  const videoId = Number.isInteger(than.videoId) ? than.videoId : null;
  const videoUrl = typeof than.videoUrl === 'string' ? than.videoUrl.trim() : '';

  if (!(await xacThucThuVien(env.DB, phien.lopId, 'hinh_anh', anhId))) return loi('Ảnh không hợp lệ.');
  if (!(await xacThucThuVien(env.DB, phien.lopId, 'video', videoId))) return loi('Video không hợp lệ.');

  const datAnh = Boolean(anhId || hinhUrl);
  const datVideo = !datAnh && Boolean(videoId || videoUrl);

  await env.DB.prepare(
    `UPDATE lop SET banner_anh_id = ?1, banner_hinh_url = ?2, banner_video_id = ?3, banner_video_url = ?4 WHERE id = ?5`
  ).bind(
    datAnh ? anhId : null,
    datAnh ? (hinhUrl || null) : null,
    datVideo ? videoId : null,
    datVideo ? (videoUrl || null) : null,
    phien.lopId
  ).run();

  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: ['hinh-anh', 'video'] });
