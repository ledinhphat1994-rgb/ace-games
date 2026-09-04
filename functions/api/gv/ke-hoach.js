// Kế hoạch năm học — mốc sự kiện, lịch kiểm tra, hiện trên trang lớp.
//   GET    /api/gv/ke-hoach
//   POST   /api/gv/ke-hoach   { ngay, tieuDe, moTa, mucDo }
//   PATCH  /api/gv/ke-hoach   { id, ...trường cần sửa }
//   DELETE /api/gv/ke-hoach?id=
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';

const QUYEN = 'ke-hoach';
const MUC_DO_HOP_LE = new Set(['', 'ok', 'warn', 'danger']);

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, ngay, tieu_de AS tieuDe, mo_ta AS moTa, muc_do AS mucDo, hoan_thanh AS hoanThanh, noi_bat AS noiBat
       FROM ke_hoach ORDER BY ngay`
  ).all();
  return json({ ok: true, danhSach: results.map((k) => ({ ...k, hoanThanh: Boolean(k.hoanThanh), noiBat: Boolean(k.noiBat) })) });
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const { ngay, tieuDe, moTa, mucDo, noiBat } = await docThan(request);

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');
  const td = chuoi(tieuDe, 200);
  if (!td) return loi('Chưa nhập tiêu đề.');
  const md = chuoi(mucDo, 20);
  if (!MUC_DO_HOP_LE.has(md)) return loi('Mức độ không hợp lệ.');

  const kq = await env.DB.prepare(
    'INSERT INTO ke_hoach (ngay, tieu_de, mo_ta, muc_do, noi_bat) VALUES (?1, ?2, ?3, ?4, ?5)'
  ).bind(ngay, td, chuoi(moTa, 1000), md, noiBat ? 1 : 0).run();

  return json({ ok: true, id: kq.meta.last_row_id });
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestPatch = bocXuLy(async ({ request, env }) => {
  const than = await docThan(request);
  const id = Number(than.id);
  if (!Number.isInteger(id)) return loi('Thiếu mã kế hoạch.');

  const dat = [];
  const thamSo = [];
  const them = (cot, giaTri) => { thamSo.push(giaTri); dat.push(`${cot} = ?${thamSo.length}`); };

  if (than.ngay !== undefined) {
    if (!ngayHopLe(than.ngay)) return loi('Ngày không hợp lệ.');
    them('ngay', than.ngay);
  }
  if (than.tieuDe !== undefined) {
    const td = chuoi(than.tieuDe, 200);
    if (!td) return loi('Tiêu đề không được để trống.');
    them('tieu_de', td);
  }
  if (than.moTa !== undefined) them('mo_ta', chuoi(than.moTa, 1000));
  if (than.mucDo !== undefined) {
    const md = chuoi(than.mucDo, 20);
    if (!MUC_DO_HOP_LE.has(md)) return loi('Mức độ không hợp lệ.');
    them('muc_do', md);
  }
  if (than.hoanThanh !== undefined) them('hoan_thanh', than.hoanThanh ? 1 : 0);
  if (than.noiBat !== undefined) them('noi_bat', than.noiBat ? 1 : 0);

  if (!dat.length) return loi('Không có gì để cập nhật.');

  thamSo.push(id);
  await env.DB.prepare(`UPDATE ke_hoach SET ${dat.join(', ')} WHERE id = ?${thamSo.length}`).bind(...thamSo).run();
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestDelete = bocXuLy(async ({ request, env }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã kế hoạch.');
  await env.DB.prepare('DELETE FROM ke_hoach WHERE id = ?1').bind(id).run();
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: QUYEN });
