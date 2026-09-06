// Nhật ký lớp: khen thưởng, nhắc nhở, vi phạm, hỗ trợ.
//   GET    /api/gv/nhat-ky?hocSinhId=&loai=&daXuLy=&gioiHan=
//     daXuLy=0 -> chỉ những việc CHƯA xử lý; daXuLy=1 -> chỉ việc đã xong; bỏ trống -> tất cả
//   POST   /api/gv/nhat-ky        { ngay, hocSinhId, loai, noiDung }
//   PATCH  /api/gv/nhat-ky        { id, daXuLy }
//   DELETE /api/gv/nhat-ky?id=
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';

const LOAI_HOP_LE = new Set(['khen', 'nhac_nho', 'vi_pham', 'ho_tro', 'khac']);

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const q = new URL(request.url).searchParams;
  const dieuKien = ['n.lop_id = ?1'];
  const thamSo = [phien.lopId];

  if (q.get('hocSinhId')) {
    thamSo.push(Number(q.get('hocSinhId')));
    dieuKien.push(`n.hoc_sinh_id = ?${thamSo.length}`);
  }
  if (q.get('loai') && LOAI_HOP_LE.has(q.get('loai'))) {
    thamSo.push(q.get('loai'));
    dieuKien.push(`n.loai = ?${thamSo.length}`);
  }
  if (q.get('daXuLy') === '0' || q.get('daXuLy') === '1') {
    thamSo.push(q.get('daXuLy') === '1' ? 1 : 0);
    dieuKien.push(`n.da_xu_ly = ?${thamSo.length}`);
  }

  const gioiHan = Math.min(Number(q.get('gioiHan')) || 100, 300);
  const where = 'WHERE ' + dieuKien.join(' AND ');

  const { results } = await env.DB.prepare(
    `SELECT n.id, n.ngay, n.loai, n.noi_dung AS noiDung, n.da_xu_ly AS daXuLy,
            n.hoc_sinh_id AS hocSinhId, h.ho_ten AS hoTen
       FROM nhat_ky n LEFT JOIN hoc_sinh h ON h.id = n.hoc_sinh_id
       ${where}
      ORDER BY n.ngay DESC, n.id DESC LIMIT ${gioiHan}`
  ).bind(...thamSo).all();

  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true, quyenCan: 'nhat-ky' });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const { ngay, hocSinhId, loai, noiDung } = await docThan(request);

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');
  if (!LOAI_HOP_LE.has(loai)) return loi('Loại ghi chép không hợp lệ.');
  const nd = chuoi(noiDung, 2000);
  if (!nd) return loi('Chưa nhập nội dung.');

  const id = hocSinhId === null || hocSinhId === undefined || hocSinhId === '' ? null : Number(hocSinhId);
  if (id !== null && !Number.isInteger(id)) return loi('Mã học sinh không hợp lệ.');
  if (id !== null) {
    const hs = await env.DB.prepare('SELECT id FROM hoc_sinh WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).first();
    if (!hs) return loi('Mã học sinh không hợp lệ.');
  }

  const kq = await env.DB.prepare(
    'INSERT INTO nhat_ky (ngay, hoc_sinh_id, loai, noi_dung, lop_id) VALUES (?1, ?2, ?3, ?4, ?5)'
  ).bind(ngay, id, loai, nd, phien.lopId).run();

  return json({ ok: true, id: kq.meta.last_row_id });
}, { canGiaoVien: true, quyenCan: 'nhat-ky' });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const { id, daXuLy } = await docThan(request);
  if (!Number.isInteger(Number(id))) return loi('Thiếu mã bản ghi.');

  const kq = await env.DB.prepare('UPDATE nhat_ky SET da_xu_ly = ?1 WHERE id = ?2 AND lop_id = ?3')
    .bind(daXuLy ? 1 : 0, Number(id), phien.lopId).run();
  if (!kq.meta.changes) return loi('Không tìm thấy bản ghi.', 404);

  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'nhat-ky' });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã bản ghi.');

  const kq = await env.DB.prepare('DELETE FROM nhat_ky WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).run();
  if (!kq.meta.changes) return loi('Không tìm thấy bản ghi.', 404);
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'nhat-ky' });
