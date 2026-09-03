// Thông báo hiện trên trang lớp — soạn ngay trên web, không phải sửa tệp nữa.
//   GET    /api/gv/thong-bao
//   POST   /api/gv/thong-bao   { ngay, tieuDe, noiDung, loai, ghim }
//   PATCH  /api/gv/thong-bao   { id, ...trường cần sửa }
//   DELETE /api/gv/thong-bao?id=
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, ngay, tieu_de AS tieuDe, noi_dung AS noiDung, loai, ghim, hien
       FROM thong_bao ORDER BY ghim DESC, ngay DESC LIMIT 200`
  ).all();
  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const { ngay, tieuDe, noiDung, loai, ghim } = await docThan(request);

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');
  const td = chuoi(tieuDe, 200);
  const nd = chuoi(noiDung, 5000);
  if (!td) return loi('Chưa nhập tiêu đề.');
  if (!nd) return loi('Chưa nhập nội dung.');

  const kq = await env.DB.prepare(
    'INSERT INTO thong_bao (ngay, tieu_de, noi_dung, loai, ghim) VALUES (?1, ?2, ?3, ?4, ?5)'
  ).bind(ngay, td, nd, chuoi(loai, 50) || 'Chủ nhiệm', ghim ? 1 : 0).run();

  return json({ ok: true, id: kq.meta.last_row_id });
}, { canGiaoVien: true });

export const onRequestPatch = bocXuLy(async ({ request, env }) => {
  const than = await docThan(request);
  const id = Number(than.id);
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  const dat = [];
  const thamSo = [];
  const them = (cot, giaTri) => { thamSo.push(giaTri); dat.push(`${cot} = ?${thamSo.length}`); };

  if (than.tieuDe !== undefined) them('tieu_de', chuoi(than.tieuDe, 200));
  if (than.noiDung !== undefined) them('noi_dung', chuoi(than.noiDung, 5000));
  if (than.loai !== undefined) them('loai', chuoi(than.loai, 50));
  if (than.ngay !== undefined) {
    if (!ngayHopLe(than.ngay)) return loi('Ngày không hợp lệ.');
    them('ngay', than.ngay);
  }
  if (than.ghim !== undefined) them('ghim', than.ghim ? 1 : 0);
  if (than.hien !== undefined) them('hien', than.hien ? 1 : 0);

  if (!dat.length) return loi('Không có gì để cập nhật.');

  thamSo.push(id);
  await env.DB.prepare(`UPDATE thong_bao SET ${dat.join(', ')} WHERE id = ?${thamSo.length}`)
    .bind(...thamSo).run();

  return json({ ok: true });
}, { canGiaoVien: true });

export const onRequestDelete = bocXuLy(async ({ request, env }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  await env.DB.prepare('DELETE FROM thong_bao WHERE id = ?1').bind(id).run();
  return json({ ok: true });
}, { canGiaoVien: true });
