// Nhật ký lớp: khen thưởng, nhắc nhở, vi phạm, hỗ trợ.
//   GET    /api/gv/nhat-ky?hocSinhId=&loai=&gioiHan=
//   POST   /api/gv/nhat-ky        { ngay, hocSinhId, loai, noiDung }
//   PATCH  /api/gv/nhat-ky        { id, daXuLy }
//   DELETE /api/gv/nhat-ky?id=
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';

const LOAI_HOP_LE = new Set(['khen', 'nhac_nho', 'vi_pham', 'ho_tro', 'khac']);

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  const q = new URL(request.url).searchParams;
  const dieuKien = [];
  const thamSo = [];

  if (q.get('hocSinhId')) {
    thamSo.push(Number(q.get('hocSinhId')));
    dieuKien.push(`n.hoc_sinh_id = ?${thamSo.length}`);
  }
  if (q.get('loai') && LOAI_HOP_LE.has(q.get('loai'))) {
    thamSo.push(q.get('loai'));
    dieuKien.push(`n.loai = ?${thamSo.length}`);
  }

  const gioiHan = Math.min(Number(q.get('gioiHan')) || 100, 300);
  const where = dieuKien.length ? 'WHERE ' + dieuKien.join(' AND ') : '';

  const { results } = await env.DB.prepare(
    `SELECT n.id, n.ngay, n.loai, n.noi_dung AS noiDung, n.da_xu_ly AS daXuLy,
            n.hoc_sinh_id AS hocSinhId, h.ho_ten AS hoTen
       FROM nhat_ky n LEFT JOIN hoc_sinh h ON h.id = n.hoc_sinh_id
       ${where}
      ORDER BY n.ngay DESC, n.id DESC LIMIT ${gioiHan}`
  ).bind(...thamSo).all();

  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const { ngay, hocSinhId, loai, noiDung } = await docThan(request);

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');
  if (!LOAI_HOP_LE.has(loai)) return loi('Loại ghi chép không hợp lệ.');
  const nd = chuoi(noiDung, 2000);
  if (!nd) return loi('Chưa nhập nội dung.');

  const id = hocSinhId === null || hocSinhId === undefined || hocSinhId === '' ? null : Number(hocSinhId);
  if (id !== null && !Number.isInteger(id)) return loi('Mã học sinh không hợp lệ.');

  const kq = await env.DB.prepare(
    'INSERT INTO nhat_ky (ngay, hoc_sinh_id, loai, noi_dung) VALUES (?1, ?2, ?3, ?4)'
  ).bind(ngay, id, loai, nd).run();

  return json({ ok: true, id: kq.meta.last_row_id });
}, { canGiaoVien: true });

export const onRequestPatch = bocXuLy(async ({ request, env }) => {
  const { id, daXuLy } = await docThan(request);
  if (!Number.isInteger(Number(id))) return loi('Thiếu mã bản ghi.');

  await env.DB.prepare('UPDATE nhat_ky SET da_xu_ly = ?1 WHERE id = ?2')
    .bind(daXuLy ? 1 : 0, Number(id)).run();

  return json({ ok: true });
}, { canGiaoVien: true });

export const onRequestDelete = bocXuLy(async ({ request, env }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã bản ghi.');

  await env.DB.prepare('DELETE FROM nhat_ky WHERE id = ?1').bind(id).run();
  return json({ ok: true });
}, { canGiaoVien: true });
