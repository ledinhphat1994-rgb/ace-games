// Thông tin lớp học (Tên lớp, Niên khoá, Trường, Giới thiệu / Bio)
//   GET   /api/gv/thong-tin-lop  -> đọc thông tin lớp hiện tại
//   POST  /api/gv/thong-tin-lop  { ten, namHoc, truong, gioiThieu } -> cập nhật thông tin
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const row = await env.DB.prepare(
    `SELECT id, ten, nam_hoc AS namHoc, truong, gioi_thieu AS gioiThieu FROM lop WHERE id = ?1`
  ).bind(phien.lopId).first();
  return json({ ok: true, lop: row || {} });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const ten = chuoi(than.ten, 50);
  const namHoc = chuoi(than.namHoc, 30);
  const truong = chuoi(than.truong, 150);
  const gioiThieu = chuoi(than.gioiThieu, 500);

  if (!ten) return loi('Tên lớp không được để trống.');

  await env.DB.prepare(
    `UPDATE lop SET ten = ?1, nam_hoc = ?2, truong = ?3, gioi_thieu = ?4 WHERE id = ?5`
  ).bind(
    ten,
    namHoc || '2026 – 2027',
    truong || 'Trung tâm GDNN - GDTX Huyện Định Quán',
    gioiThieu || null,
    phien.lopId
  ).run();

  return json({ ok: true, thongBao: 'Đã cập nhật thông tin lớp thành công!' });
}, { canGiaoVien: true });
