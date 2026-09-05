// Thư viện Video — nhiều video tải lên từ máy/điện thoại (khác video dán link YouTube/Drive,
// vốn không tốn kho lưu trữ nên không thuộc thư viện này).
//   GET    /api/gv/thu-vien-video               -> danh sách + tổng dung lượng
//   POST   /api/gv/thu-vien-video?ten=...        -> tải video mới vào thư viện (thân nhị phân thô)
//   PATCH  /api/gv/thu-vien-video { id, ten }    -> đổi tên hiển thị
//   DELETE /api/gv/thu-vien-video?id=
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';
import { themTepVaoThuVien, xoaKhoiThuVien } from '../../_lib/thu-vien.js';

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, ten, kieu, co_byte AS coByte, tao_luc AS taoLuc FROM video ORDER BY tao_luc DESC'
  ).all();
  return json({ ok: true, danhSach: results });
// Cho phép cả tài khoản chỉ có quyền "thong-bao" xem danh sách này — cần để dùng bộ chọn
// "đính kèm từ thư viện" trong hộp thoại soạn Thông báo (chỉ ĐỌC, không thêm/xoá được).
}, { canGiaoVien: true, quyenCan: ['video', 'thong-bao'] });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const kieu = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const duLieu = await request.arrayBuffer();
  const ten = chuoi(new URL(request.url).searchParams.get('ten'), 200) || 'Video chưa đặt tên';

  const { loi: thongBaoLoi, dong } = await themTepVaoThuVien(env, 'video', duLieu, kieu, ten);
  if (thongBaoLoi) return loi(thongBaoLoi);
  return json({ ok: true, ...dong });
}, { canGiaoVien: true, quyenCan: 'video' });

export const onRequestPatch = bocXuLy(async ({ request, env }) => {
  const than = await docThan(request);
  const id = Number(than.id);
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã video.');
  if (than.ten === undefined) return loi('Không có gì để sửa.');

  const dong = await env.DB.prepare('SELECT id FROM video WHERE id = ?1').bind(id).first();
  if (!dong) return loi('Không tìm thấy video này.', 404);

  await env.DB.prepare('UPDATE video SET ten = ?1 WHERE id = ?2').bind(chuoi(than.ten, 200), id).run();
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'video' });

export const onRequestDelete = bocXuLy(async ({ request, env }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã video.');

  const loiXoa = await xoaKhoiThuVien(env, 'video', id);
  if (loiXoa) return loiXoa;
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'video' });
