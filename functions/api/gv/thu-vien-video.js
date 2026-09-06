// Thư viện Video — nhiều video tải lên từ máy/điện thoại (khác video dán link YouTube/Drive,
// vốn không tốn kho lưu trữ nên không thuộc thư viện này).
//   GET    /api/gv/thu-vien-video               -> danh sách + tổng dung lượng
//   POST   /api/gv/thu-vien-video?ten=...        -> tải video mới vào thư viện (thân nhị phân thô)
//   PATCH  /api/gv/thu-vien-video { id, ten }    -> đổi tên hiển thị
//   DELETE /api/gv/thu-vien-video?id=            -> xoá một video
//   DELETE /api/gv/thu-vien-video?ids=1,2,3       -> xoá nhiều video đã chọn
//   DELETE /api/gv/thu-vien-video?tatCa=1         -> xoá sạch cả thư viện
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';
import { themTepVaoThuVien, xoaKhoiThuVien, xoaNhieuKhoiThuVien } from '../../_lib/thu-vien.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, ten, kieu, co_byte AS coByte, tao_luc AS taoLuc FROM video WHERE lop_id = ?1 ORDER BY tao_luc DESC'
  ).bind(phien.lopId).all();
  return json({ ok: true, danhSach: results });
// Cho phép cả tài khoản chỉ có quyền "thong-bao" xem danh sách này — cần để dùng bộ chọn
// "đính kèm từ thư viện" trong hộp thoại soạn Thông báo (chỉ ĐỌC, không thêm/xoá được).
}, { canGiaoVien: true, quyenCan: ['video', 'thong-bao'] });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const kieu = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const duLieu = await request.arrayBuffer();
  const ten = chuoi(new URL(request.url).searchParams.get('ten'), 200) || 'Video chưa đặt tên';

  const { loi: thongBaoLoi, dong } = await themTepVaoThuVien(env, 'video', duLieu, kieu, ten, phien.lopId);
  if (thongBaoLoi) return loi(thongBaoLoi);
  return json({ ok: true, ...dong });
}, { canGiaoVien: true, quyenCan: 'video' });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const id = Number(than.id);
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã video.');
  if (than.ten === undefined) return loi('Không có gì để sửa.');

  const dong = await env.DB.prepare('SELECT id FROM video WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).first();
  if (!dong) return loi('Không tìm thấy video này.', 404);

  await env.DB.prepare('UPDATE video SET ten = ?1 WHERE id = ?2').bind(chuoi(than.ten, 200), id).run();
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'video' });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const q = new URL(request.url).searchParams;

  if (q.get('tatCa') === '1' || q.get('ids')) {
    let ids;
    if (q.get('tatCa') === '1') {
      const { results } = await env.DB.prepare('SELECT id FROM video WHERE lop_id = ?1').bind(phien.lopId).all();
      ids = results.map((r) => r.id);
    } else {
      ids = [...new Set(q.get('ids').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0))];
    }
    const { daXoa } = await xoaNhieuKhoiThuVien(env, 'video', ids, phien.lopId);
    return json({ ok: true, daXoa });
  }

  const id = Number(q.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã video.');

  const loiXoa = await xoaKhoiThuVien(env, 'video', id, phien.lopId);
  if (loiXoa) return loiXoa;
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'video' });
