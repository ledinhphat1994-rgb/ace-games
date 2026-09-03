// Mẫu thu định kỳ — ví dụ "Quỹ lớp 5.000đ/tuần". Hệ thống tự sinh từng kỳ (từng tuần/tháng)
// thành một khoản thu (quy_khoan) riêng khi tới hạn — xem hàm sinhKyConThieu() dùng chung
// với functions/api/gv/quy.js.
//   GET    /api/gv/quy-dinh-ky
//   POST   /api/gv/quy-dinh-ky   { ten, chuKy, soTienMoiKy, ngayBatDau }
//   PATCH  /api/gv/quy-dinh-ky   { id, dangHoatDong }
//   DELETE /api/gv/quy-dinh-ky?id=     (chỉ xoá được khi chưa sinh kỳ nào)
import { bocXuLy, json, loi, docThan, ngayHopLe } from '../../_lib/api.js';

const QUYEN = 'quy';

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT dk.id, dk.ten, dk.chu_ky AS chuKy, dk.so_tien_moi_ky AS soTienMoiKy,
            dk.ngay_bat_dau AS ngayBatDau, dk.dang_hoat_dong AS dangHoatDong,
            COUNT(k.id) AS soKyDaSinh
       FROM quy_dinh_ky dk LEFT JOIN quy_khoan k ON k.dinh_ky_id = dk.id
      GROUP BY dk.id ORDER BY dk.tao_luc DESC`
  ).all();
  return json({ ok: true, danhSach: results.map((r) => ({ ...r, dangHoatDong: Boolean(r.dangHoatDong) })) });
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const { ten, chuKy, soTienMoiKy, ngayBatDau } = await docThan(request);

  const tenSach = String(ten || '').trim().slice(0, 200);
  if (!tenSach) return loi('Chưa nhập tên khoản thu định kỳ.');
  if (!['tuan', 'thang', 'nam'].includes(chuKy)) return loi('Chu kỳ phải là tuần, tháng hoặc năm.');
  const soTien = Number(soTienMoiKy);
  if (!Number.isInteger(soTien) || soTien <= 0 || soTien > 10_000_000) return loi('Mức thu mỗi kỳ không hợp lệ.');
  if (!ngayHopLe(ngayBatDau)) return loi('Ngày bắt đầu không hợp lệ.');

  const kq = await env.DB.prepare(
    'INSERT INTO quy_dinh_ky (ten, chu_ky, so_tien_moi_ky, ngay_bat_dau) VALUES (?1, ?2, ?3, ?4)'
  ).bind(tenSach, chuKy, soTien, ngayBatDau).run();

  return json({ ok: true, id: kq.meta.last_row_id });
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestPatch = bocXuLy(async ({ request, env }) => {
  const { id, dangHoatDong } = await docThan(request);
  if (!Number.isInteger(Number(id))) return loi('Thiếu mã khoản định kỳ.');

  await env.DB.prepare('UPDATE quy_dinh_ky SET dang_hoat_dong = ?1 WHERE id = ?2')
    .bind(dangHoatDong ? 1 : 0, Number(id)).run();
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestDelete = bocXuLy(async ({ request, env }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã khoản định kỳ.');

  const daSinh = await env.DB.prepare('SELECT COUNT(*) AS n FROM quy_khoan WHERE dinh_ky_id = ?1').bind(id).first();
  if (daSinh?.n > 0) {
    return loi('Khoản này đã sinh ra kỳ thu rồi, không xoá được nữa — bấm "Dừng" thay vì xoá.');
  }

  await env.DB.prepare('DELETE FROM quy_dinh_ky WHERE id = ?1').bind(id).run();
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: QUYEN });
