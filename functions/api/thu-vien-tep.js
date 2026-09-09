// GET /api/thu-vien-tep?loai=am-thanh|video&id=<id> — phát một mục TRONG THƯ VIỆN theo id
// (dùng để nghe/xem thử khi chọn từ thư viện lúc soạn Thông báo, hoặc phát trực tiếp mục đó).
// Ảnh không cần endpoint riêng — đã có sẵn /api/anh?khoa=.
import { bocXuLy, loi } from '../_lib/api.js';
import { cauHinhThuVien } from '../_lib/thu-vien.js';
import { phucVuTepR2 } from '../_lib/media-stream.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien, waitUntil }) => {
  const q = new URL(request.url).searchParams;
  const loaiThuVien = q.get('loai');
  const id = Number(q.get('id'));
  if (loaiThuVien !== 'am-thanh' && loaiThuVien !== 'video') return loi('Loại thư viện không hợp lệ.');
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã mục trong thư viện.');

  const cauHinh = cauHinhThuVien(loaiThuVien);
  const dong = await env.DB.prepare(`SELECT khoa, kieu FROM ${cauHinh.bang} WHERE id = ?1 AND lop_id = ?2`).bind(id, phien.lopId).first();
  if (!dong) return loi('Không tìm thấy mục này.', 404);

  return phucVuTepR2(env, dong.khoa, cauHinh.kieuMacDinh, request, phien.lopId, waitUntil);
}, { canGiaoVien: false });
