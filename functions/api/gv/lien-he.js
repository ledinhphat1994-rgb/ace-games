// Nhật ký liên hệ phụ huynh — chỉ giáo viên chủ nhiệm xem/ghi (dữ liệu nhạy cảm).
//   GET    /api/gv/lien-he?hocSinhId=5   -> lịch sử liên hệ của một em
//   POST   /api/gv/lien-he   { hocSinhId, ngay, hinhThuc, noiDung, ketQua }
//   PATCH  /api/gv/lien-he   { id, ngay, hinhThuc, noiDung, ketQua }
//   DELETE /api/gv/lien-he?id=
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';

const HINH_THUC = new Set(['goi_dien', 'gap_truc_tiep', 'nhan_tin', 'khac']);

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const hocSinhId = Number(new URL(request.url).searchParams.get('hocSinhId'));
  if (!Number.isInteger(hocSinhId) || hocSinhId <= 0) return loi('Thiếu mã học sinh.');

  const { results } = await env.DB.prepare(
    `SELECT id, ngay, hinh_thuc AS hinhThuc, noi_dung AS noiDung, ket_qua AS ketQua
       FROM lien_he_phu_huynh WHERE hoc_sinh_id = ?1 AND lop_id = ?2 ORDER BY ngay DESC, id DESC`
  ).bind(hocSinhId, phien.lopId).all();

  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const hocSinhId = Number(than.hocSinhId);
  if (!Number.isInteger(hocSinhId) || hocSinhId <= 0) return loi('Thiếu mã học sinh.');

  const hs = await env.DB.prepare('SELECT id FROM hoc_sinh WHERE id = ?1 AND lop_id = ?2').bind(hocSinhId, phien.lopId).first();
  if (!hs) return loi('Thiếu mã học sinh.');

  const noiDung = chuoi(than.noiDung, 500);
  if (!noiDung) return loi('Chưa nhập nội dung đã trao đổi.');

  const ngay = ngayHopLe(than.ngay) ? than.ngay : new Date().toISOString().slice(0, 10);
  const hinhThuc = HINH_THUC.has(than.hinhThuc) ? than.hinhThuc : 'goi_dien';

  const kq = await env.DB.prepare(
    `INSERT INTO lien_he_phu_huynh (hoc_sinh_id, ngay, hinh_thuc, noi_dung, ket_qua, lop_id)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
  ).bind(hocSinhId, ngay, hinhThuc, noiDung, chuoi(than.ketQua, 300), phien.lopId).run();

  return json({ ok: true, id: kq.meta.last_row_id });
}, { canGiaoVien: true });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const id = Number(than.id);
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã bản ghi.');

  const hang = await env.DB.prepare('SELECT * FROM lien_he_phu_huynh WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).first();
  if (!hang) return loi('Không tìm thấy bản ghi này.', 404);

  const noiDung = than.noiDung !== undefined ? chuoi(than.noiDung, 500) : hang.noi_dung;
  if (!noiDung) return loi('Nội dung không được để trống.');
  const ngay = than.ngay !== undefined ? (ngayHopLe(than.ngay) ? than.ngay : hang.ngay) : hang.ngay;
  const hinhThuc = than.hinhThuc !== undefined ? (HINH_THUC.has(than.hinhThuc) ? than.hinhThuc : hang.hinh_thuc) : hang.hinh_thuc;
  const ketQua = than.ketQua !== undefined ? chuoi(than.ketQua, 300) : hang.ket_qua;

  await env.DB.prepare(
    'UPDATE lien_he_phu_huynh SET ngay = ?1, hinh_thuc = ?2, noi_dung = ?3, ket_qua = ?4 WHERE id = ?5'
  ).bind(ngay, hinhThuc, noiDung, ketQua, id).run();

  return json({ ok: true });
}, { canGiaoVien: true });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã bản ghi.');

  const kq = await env.DB.prepare('DELETE FROM lien_he_phu_huynh WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).run();
  if (!kq.meta.changes) return loi('Không tìm thấy bản ghi.', 404);
  return json({ ok: true });
}, { canGiaoVien: true });
