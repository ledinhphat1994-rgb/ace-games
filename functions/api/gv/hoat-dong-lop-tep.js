// Tải MỘT FILE MỚI vào đúng thư viện (Ảnh/Video/Âm thanh) để dùng ngay khi đăng Hoạt động lớp —
// CHỈ thêm vào thư viện rồi trả về id/khoá, KHÔNG tự tạo mục Hoạt động lớp ở đây nữa. Từ khi
// một hoạt động có thể gộp nhiều loại media CÙNG LÚC (văn bản + ảnh + video + âm thanh), việc
// tạo mục hoạt động chỉ làm ở đúng MỘT chỗ — POST /api/gv/hoat-dong-lop — sau khi trang đã gom
// đủ id/link của mọi loại đang bật.
//   POST /api/gv/hoat-dong-lop-tep?loai=anh|video|am-thanh   (thân là DỮ LIỆU NHỊ PHÂN THÔ)
import { bocXuLy, json, loi } from '../../_lib/api.js';
import { themTepVaoThuVien } from '../../_lib/thu-vien.js';

const LOAI_THU_VIEN = { anh: 'anh', video: 'video', 'am-thanh': 'am-thanh' };
const QUYEN_THEO_LOAI = { anh: 'hinh-anh', video: 'video', 'am-thanh': 'am-thanh' };

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const loaiTep = url.searchParams.get('loai');
  if (!LOAI_THU_VIEN[loaiTep]) return loi('Loại tệp không hợp lệ.');

  // Tải file mới bắt buộc đúng quyền thư viện của loại đó — không dùng chung với quyền
  // "hoat-dong-lop" (quyền đó chỉ đủ để đăng văn bản, xem functions/api/gv/hoat-dong-lop.js).
  if (phien.role === 'phu' && !(phien.quyen || []).includes(QUYEN_THEO_LOAI[loaiTep])) {
    return loi('Tài khoản chưa được cấp quyền Thư viện tương ứng để tải tệp này.', 403);
  }

  const kieu = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const duLieu = await request.arrayBuffer();

  const { loi: loiThuVien, dong } = await themTepVaoThuVien(env, LOAI_THU_VIEN[loaiTep], duLieu, kieu, 'Hoạt động lớp', phien.lopId, phien);
  if (loiThuVien) return loi(loiThuVien);

  return json({ ok: true, id: dong.id, khoa: dong.khoa, kieu: dong.kieu });
}, { canGiaoVien: true, quyenCan: ['hoat-dong-lop', 'hinh-anh', 'am-thanh', 'video'] });
