// Điểm danh — chỉ giáo viên chủ nhiệm.
//   GET  /api/gv/diem-danh?ngay=2026-09-15&buoi=sang   -> danh sách lớp kèm trạng thái đã ghi
//   POST /api/gv/diem-danh   { ngay, buoi, ghiNhan:[{hocSinhId, trangThai, lyDo}] }
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';

const BUOI_HOP_LE = new Set(['sang', 'chieu', 'hoat_dong']);
const TRANG_THAI_HOP_LE = new Set(['co_mat', 'vang_phep', 'vang_khong_phep', 'tre']);

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  const url = new URL(request.url);
  const ngay = url.searchParams.get('ngay') || new Date().toISOString().slice(0, 10);
  const buoi = url.searchParams.get('buoi') || 'sang';

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');
  if (!BUOI_HOP_LE.has(buoi)) return loi('Buổi không hợp lệ.');

  const { results } = await env.DB.prepare(
    `SELECT h.id, h.ho_ten AS hoTen, h.gioi_tinh AS gioiTinh, h.lop_nghe AS lopNghe,
            d.trang_thai AS trangThai, d.ly_do AS lyDo
       FROM hoc_sinh h
       LEFT JOIN diem_danh d
         ON d.hoc_sinh_id = h.id AND d.ngay = ?1 AND d.buoi = ?2
      WHERE h.dang_hoc = 1
      ORDER BY h.id`
  ).bind(ngay, buoi).all();

  const daGhi = results.filter((r) => r.trangThai).length;
  return json({ ok: true, ngay, buoi, daGhi, tongSo: results.length, danhSach: results });
}, { canGiaoVien: true, quyenCan: 'diem-danh' });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const than = await docThan(request);
  const { ngay, buoi = 'sang', ghiNhan } = than;

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');
  if (!BUOI_HOP_LE.has(buoi)) return loi('Buổi không hợp lệ.');
  if (!Array.isArray(ghiNhan) || !ghiNhan.length) return loi('Chưa có dữ liệu điểm danh.');
  if (ghiNhan.length > 200) return loi('Quá nhiều bản ghi trong một lần gửi.');

  const cauLenh = [];
  for (const g of ghiNhan) {
    const id = Number(g.hocSinhId);
    if (!Number.isInteger(id) || id <= 0) return loi('Mã học sinh không hợp lệ.');
    if (!TRANG_THAI_HOP_LE.has(g.trangThai)) return loi(`Trạng thái không hợp lệ: ${g.trangThai}`);
    cauLenh.push(
      env.DB.prepare(
        `INSERT INTO diem_danh (ngay, buoi, hoc_sinh_id, trang_thai, ly_do, cap_nhat_luc)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))
         ON CONFLICT(ngay, buoi, hoc_sinh_id)
         DO UPDATE SET trang_thai = excluded.trang_thai,
                       ly_do = excluded.ly_do,
                       cap_nhat_luc = datetime('now')`
      ).bind(ngay, buoi, id, g.trangThai, chuoi(g.lyDo, 300))
    );
  }

  await env.DB.batch(cauLenh);
  return json({ ok: true, daLuu: cauLenh.length });
}, { canGiaoVien: true, quyenCan: 'diem-danh' });
