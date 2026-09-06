// Điểm danh — chỉ giáo viên chủ nhiệm.
//   GET  /api/gv/diem-danh?ngay=2026-09-15&buoi=sang   -> danh sách lớp kèm trạng thái đã ghi
//   POST /api/gv/diem-danh   { ngay, buoi, ghiNhan:[{hocSinhId, trangThai, lyDo}] }
//        trangThai = null/rỗng -> XOÁ điểm danh của em đó ngày/buổi này (bấm lại nút đang
//        chọn ở giao diện để "bỏ chọn", quay về trạng thái chưa ghi).
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';

const TRANG_THAI_HOP_LE = new Set(['co_mat', 'vang_phep', 'vang_khong_phep', 'tre']);

function chuanHoaBuoi(buoi, loai) {
  if (!buoi || typeof buoi !== 'string') return null;
  let b = buoi.trim();
  if (loai === 'phu' && !b.endsWith('_phu')) {
    b = `${b}_phu`;
  }
  const goc = b.replace(/_phu$/, '');
  if (!['sang', 'chieu', 'hoat_dong'].includes(goc)) return null;
  return b;
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const ngay = url.searchParams.get('ngay') || new Date().toISOString().slice(0, 10);
  const buoiGoc = url.searchParams.get('buoi') || 'sang';
  const loai = url.searchParams.get('loai') || '';
  const buoi = chuanHoaBuoi(buoiGoc, loai);

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');
  if (!buoi) return loi('Buổi không hợp lệ.');


  const { results } = await env.DB.prepare(
    `SELECT h.id, h.ho_ten AS hoTen, h.gioi_tinh AS gioiTinh, h.lop_nghe AS lopNghe,
            d.trang_thai AS trangThai, d.ly_do AS lyDo
       FROM hoc_sinh h
       LEFT JOIN diem_danh d
         ON d.hoc_sinh_id = h.id AND d.ngay = ?1 AND d.buoi = ?2 AND d.lop_id = ?3
      WHERE h.dang_hoc = 1 AND h.lop_id = ?3
      ORDER BY h.id`
  ).bind(ngay, buoi, phien.lopId).all();

  const daGhi = results.filter((r) => r.trangThai).length;
  return json({ ok: true, ngay, buoi, daGhi, tongSo: results.length, danhSach: results });
}, { canGiaoVien: true, quyenCan: 'diem-danh' });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const { ngay, buoi: buoiGoc = 'sang', loai = '', ghiNhan } = than;
  const buoi = chuanHoaBuoi(buoiGoc, loai);

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');
  if (!buoi) return loi('Buổi không hợp lệ.');

  if (!Array.isArray(ghiNhan) || !ghiNhan.length) return loi('Chưa có dữ liệu điểm danh.');
  if (ghiNhan.length > 200) return loi('Quá nhiều bản ghi trong một lần gửi.');

  // Chỉ chấp nhận học sinh THẬT SỰ thuộc lớp đang đăng nhập — chặn trường hợp id học sinh
  // của lớp khác lỡ lọt vào dữ liệu gửi lên.
  const { results: hsLop } = await env.DB.prepare('SELECT id FROM hoc_sinh WHERE lop_id = ?1').bind(phien.lopId).all();
  const idHopLe = new Set(hsLop.map((h) => h.id));

  const cauLenh = [];
  for (const g of ghiNhan) {
    const id = Number(g.hocSinhId);
    if (!Number.isInteger(id) || id <= 0 || !idHopLe.has(id)) return loi('Mã học sinh không hợp lệ.');

    if (!g.trangThai) {
      // Bỏ chọn — xoá hẳn bản ghi, không phải một "trạng thái rỗng".
      cauLenh.push(
        env.DB.prepare('DELETE FROM diem_danh WHERE ngay = ?1 AND buoi = ?2 AND hoc_sinh_id = ?3')
          .bind(ngay, buoi, id)
      );
      continue;
    }

    if (!TRANG_THAI_HOP_LE.has(g.trangThai)) return loi(`Trạng thái không hợp lệ: ${g.trangThai}`);
    cauLenh.push(
      env.DB.prepare(
        `INSERT INTO diem_danh (ngay, buoi, hoc_sinh_id, trang_thai, ly_do, cap_nhat_luc, lop_id)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), ?6)
         ON CONFLICT(ngay, buoi, hoc_sinh_id)
         DO UPDATE SET trang_thai = excluded.trang_thai,
                       ly_do = excluded.ly_do,
                       cap_nhat_luc = datetime('now')`
      ).bind(ngay, buoi, id, g.trangThai, chuoi(g.lyDo, 300), phien.lopId)
    );
  }

  await env.DB.batch(cauLenh);
  return json({ ok: true, daLuu: cauLenh.length });
}, { canGiaoVien: true, quyenCan: 'diem-danh' });
