// Ảnh hoạt động của lớp.
//   GET    /api/gv/anh          -> danh sách ảnh (kèm dung lượng đã dùng)
//   POST   /api/gv/anh          { tenTep, kieu, duLieu (base64), chuThich, ngay }
//   PATCH  /api/gv/anh          { id, chuThich }
//   DELETE /api/gv/anh?id=
//
// Ảnh đã được nén nhỏ ngay trên máy giáo viên trước khi gửi lên, nên mỗi tấm
// chỉ khoảng 100–300 KB. Nội dung ảnh lưu trong Cloudflare KV, phần mô tả lưu trong D1.
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';

const KIEU_CHO_PHEP = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TOI_DA_BYTE = 1_500_000;   // 1,5 MB mỗi ảnh sau khi nén

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, khoa, chu_thich AS chuThich, ngay, kieu, co_byte AS coByte FROM hinh_anh ORDER BY ngay DESC, id DESC'
  ).all();

  const tongByte = results.reduce((a, r) => a + r.coByte, 0);
  return json({ ok: true, danhSach: results, soAnh: results.length, tongByte });
}, { canGiaoVien: true, quyenCan: 'hinh-anh' });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  if (!env.ANH) return loi('Chưa gắn kho ảnh vào project.', 500);

  const { kieu, duLieu, chuThich, ngay } = await docThan(request);

  if (!KIEU_CHO_PHEP.has(kieu)) return loi('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
  if (typeof duLieu !== 'string' || !duLieu) return loi('Không có dữ liệu ảnh.');
  if (ngay && !ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');

  let byte;
  try {
    const nhiPhan = atob(duLieu);
    byte = new Uint8Array(nhiPhan.length);
    for (let i = 0; i < nhiPhan.length; i++) byte[i] = nhiPhan.charCodeAt(i);
  } catch {
    return loi('Dữ liệu ảnh không đọc được.');
  }

  if (byte.length > TOI_DA_BYTE) {
    return loi(`Ảnh còn ${Math.round(byte.length / 1024)} KB, vượt mức cho phép. Hãy chọn ảnh nhỏ hơn.`);
  }

  const khoa = 'anh-' + Date.now().toString(36) + '-' + crypto.randomUUID().slice(0, 8);
  await env.ANH.put(khoa, byte, { metadata: { kieu } });

  const kq = await env.DB.prepare(
    'INSERT INTO hinh_anh (khoa, chu_thich, ngay, kieu, co_byte) VALUES (?1, ?2, ?3, ?4, ?5)'
  ).bind(khoa, chuoi(chuThich, 300), ngay || new Date().toISOString().slice(0, 10), kieu, byte.length).run();

  return json({ ok: true, id: kq.meta.last_row_id, khoa, coByte: byte.length });
}, { canGiaoVien: true, quyenCan: 'hinh-anh' });

export const onRequestPatch = bocXuLy(async ({ request, env }) => {
  const { id, chuThich } = await docThan(request);
  if (!Number.isInteger(Number(id))) return loi('Thiếu mã ảnh.');

  await env.DB.prepare('UPDATE hinh_anh SET chu_thich = ?1 WHERE id = ?2')
    .bind(chuoi(chuThich, 300), Number(id)).run();
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'hinh-anh' });

export const onRequestDelete = bocXuLy(async ({ request, env }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã ảnh.');

  const anh = await env.DB.prepare('SELECT khoa FROM hinh_anh WHERE id = ?1').bind(id).first();
  if (!anh) return loi('Không tìm thấy ảnh.', 404);

  await env.ANH.delete(anh.khoa);
  await env.DB.prepare('DELETE FROM hinh_anh WHERE id = ?1').bind(id).run();
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'hinh-anh' });
