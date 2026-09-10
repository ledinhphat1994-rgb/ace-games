// Tải MỘT FILE MỚI làm banner lớp (ảnh hoặc video nền đầu trang) — tự động trở thành một mục
// trong đúng thư viện tương ứng (xem functions/_lib/thu-vien.js) rồi gán luôn làm banner, giống
// hệt cách làm của Thông báo (xem functions/api/gv/thong-bao-tep.js). Đây là 1 trong 3 cách gán
// banner (còn lại: chọn mục có sẵn trong thư viện, hoặc dán link ngoài — xử lý trực tiếp ở
// functions/api/gv/lop-banner.js, không qua endpoint này).
//   POST /api/gv/lop-banner-tep?loai=hinh|video   (thân là DỮ LIỆU NHỊ PHÂN THÔ)
import { bocXuLy, json, loi } from '../../_lib/api.js';
import { themTepVaoThuVien } from '../../_lib/thu-vien.js';

const LOAI_THU_VIEN = { hinh: 'anh', video: 'video' };

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const loaiTep = url.searchParams.get('loai');
  if (!LOAI_THU_VIEN[loaiTep]) return loi('Loại tệp không hợp lệ.');

  const kieu = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const duLieu = await request.arrayBuffer();

  const { loi: thongBaoLoi, dong } = await themTepVaoThuVien(env, LOAI_THU_VIEN[loaiTep], duLieu, kieu, 'Banner lớp', phien.lopId, phien);
  if (thongBaoLoi) return loi(thongBaoLoi);

  const cauLenh = loaiTep === 'hinh'
    ? 'UPDATE lop SET banner_anh_id = ?1, banner_hinh_url = NULL, banner_video_id = NULL, banner_video_url = NULL WHERE id = ?2'
    : 'UPDATE lop SET banner_video_id = ?1, banner_video_url = NULL, banner_anh_id = NULL, banner_hinh_url = NULL WHERE id = ?2';
  await env.DB.prepare(cauLenh).bind(dong.id, phien.lopId).run();

  return json({ ok: true, id: dong.id, khoa: dong.khoa, kieu: dong.kieu, coByte: dong.coByte });
}, { canGiaoVien: true });
