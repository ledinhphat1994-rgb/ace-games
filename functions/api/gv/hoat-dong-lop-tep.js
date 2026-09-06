// Tải MỘT FILE MỚI để đăng ngay vào "Hoạt động lớp" — tự động trở thành một mục trong đúng
// thư viện tương ứng (xem functions/_lib/thu-vien.js) rồi thêm luôn vào danh sách công khai,
// giống hệt cách làm của Banner/Thông báo. Đây là 1 trong 3 cách thêm mục (còn lại: chọn mục
// có sẵn trong thư viện, hoặc dán link ngoài — xử lý trực tiếp ở functions/api/gv/hoat-dong-lop.js).
//   POST /api/gv/hoat-dong-lop-tep?loai=anh|video|am-thanh   (thân là DỮ LIỆU NHỊ PHÂN THÔ)
import { bocXuLy, json, loi } from '../../_lib/api.js';
import { themTepVaoThuVien } from '../../_lib/thu-vien.js';

const LOAI_THU_VIEN = { anh: 'anh', video: 'video', 'am-thanh': 'am-thanh' };

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const loaiTep = url.searchParams.get('loai');
  if (!LOAI_THU_VIEN[loaiTep]) return loi('Loại tệp không hợp lệ.');

  const QUYEN_THEO_LOAI = { anh: 'hinh-anh', video: 'video', 'am-thanh': 'am-thanh' };
  if (phien.role === 'phu') {
    const quyenCanLoai = QUYEN_THEO_LOAI[loaiTep];
    if (!quyenCanLoai || !(phien.quyen || []).includes(quyenCanLoai)) {
      return loi('Tài khoản chưa được cấp quyền Thư viện tương ứng để tải tệp này. Bạn chỉ được đăng nội dung văn bản thông thường.', 403);
    }
  }

  const kieu = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const duLieu = await request.arrayBuffer();

  const { loi: loiThuVien, dong } = await themTepVaoThuVien(env, LOAI_THU_VIEN[loaiTep], duLieu, kieu, 'Hoạt động lớp', phien.lopId);
  if (loiThuVien) return loi(loiThuVien);

  const cot = loaiTep === 'anh' ? 'anh_id' : loaiTep === 'video' ? 'video_id' : 'am_thanh_id';
  const kq = await env.DB.prepare(
    `INSERT INTO hoat_dong_lop (lop_id, loai, ${cot}, ngay) VALUES (?1, ?2, ?3, ?4)`
  ).bind(phien.lopId, loaiTep, dong.id, new Date().toISOString().slice(0, 10)).run();

  return json({ ok: true, id: kq.meta.last_row_id, khoa: dong.khoa, kieu: dong.kieu });
}, { canGiaoVien: true, quyenCan: ['hoat-dong-lop', 'hinh-anh', 'am-thanh', 'video'] });
