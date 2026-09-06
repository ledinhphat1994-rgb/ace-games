// Hồ sơ học sinh — bản đầy đủ, chỉ giáo viên chủ nhiệm xem được (không tài khoản đặc biệt nào
// khác được cấp quyền vào đây — xem "⚙ Tuỳ chỉnh hiển thị" ở trang-lop cho phần công khai).
//   GET    /api/gv/hoc-sinh            -> cả lớp
//   GET    /api/gv/hoc-sinh?id=5       -> hồ sơ một em kèm lịch sử điểm danh và nhật ký —
//          LUÔN chỉ giáo viên chủ nhiệm (có cả nhật ký vi phạm, không phải thứ nên lộ cho bạn học).
//   POST   /api/gv/hoc-sinh            { hoTen, gioiTinh, ngaySinh, lopNghe, toHop, toSo }
//          -> thêm học sinh mới (nhập học/chuyển đến giữa năm), id tự tăng tiếp theo sổ lớp
//   PATCH  /api/gv/hoc-sinh            { id, chucVu, toSo, dienThoaiPh, hoanCanh, ghiChu, dangHoc }
//          -> dangHoc: false = đánh dấu đã nghỉ/chuyển trường (không xoá dữ liệu)
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const id = Number(new URL(request.url).searchParams.get('id'));

  if (Number.isInteger(id) && id > 0) {
    if (phien.role !== 'teacher') {
      return loi('Chỉ giáo viên chủ nhiệm mới xem được hồ sơ chi tiết từng em.', 403);
    }
    const [hs, diemDanh, nhatKy, theoDoi] = await Promise.all([
      db.prepare(
        `SELECT id, ho_ten AS hoTen, gioi_tinh AS gioiTinh, ngay_sinh AS ngaySinh,
                lop_nghe AS lopNghe, to_hop AS toHop, chuc_vu AS chucVu, to_so AS toSo,
                dien_thoai_ph AS dienThoaiPh, hoan_canh AS hoanCanh, ghi_chu AS ghiChu
           FROM hoc_sinh WHERE id = ?1 AND lop_id = ?2`
      ).bind(id, phien.lopId).first(),
      db.prepare(
        `SELECT ngay, buoi, trang_thai AS trangThai, ly_do AS lyDo
           FROM diem_danh WHERE hoc_sinh_id = ?1 AND lop_id = ?2 ORDER BY ngay DESC LIMIT 60`
      ).bind(id, phien.lopId).all(),
      db.prepare(
        `SELECT id, ngay, loai, noi_dung AS noiDung, da_xu_ly AS daXuLy
           FROM nhat_ky WHERE hoc_sinh_id = ?1 AND lop_id = ?2 ORDER BY ngay DESC LIMIT 50`
      ).bind(id, phien.lopId).all(),
      db.prepare('SELECT muc, trang_thai AS trangThai, ghi_chu AS ghiChu FROM theo_doi WHERE hoc_sinh_id = ?1 AND lop_id = ?2')
        .bind(id, phien.lopId).all(),
    ]);

    if (!hs) return loi('Không tìm thấy học sinh.', 404);
    return json({
      ok: true,
      hocSinh: hs,
      diemDanh: diemDanh.results,
      nhatKy: nhatKy.results,
      theoDoi: theoDoi.results,
    });
  }

  const { results } = await db.prepare(
    `SELECT h.id, h.so_thu_tu AS soThuTu, h.ho_ten AS hoTen, h.gioi_tinh AS gioiTinh, h.ngay_sinh AS ngaySinh,
            h.lop_nghe AS lopNghe, h.to_hop AS toHop, h.chuc_vu AS chucVu, h.to_so AS toSo,
            h.dien_thoai_ph AS dienThoaiPh, h.hoan_canh AS hoanCanh, h.ghi_chu AS ghiChu,
            COALESCE(SUM(CASE WHEN d.trang_thai = 'vang_khong_phep' THEN 1 END), 0) AS vangKhongPhep,
            COALESCE(SUM(CASE WHEN d.trang_thai = 'vang_phep' THEN 1 END), 0) AS vangPhep,
            COALESCE(SUM(CASE WHEN d.trang_thai = 'tre' THEN 1 END), 0) AS tre
       FROM hoc_sinh h LEFT JOIN diem_danh d ON d.hoc_sinh_id = h.id AND d.lop_id = h.lop_id
      WHERE h.dang_hoc = 1 AND h.lop_id = ?1
      GROUP BY h.id ORDER BY h.so_thu_tu, h.id`
  ).bind(phien.lopId).all();

  const { results: td } = await db.prepare(
    'SELECT hoc_sinh_id AS hocSinhId, muc, trang_thai AS trangThai, ghi_chu AS ghiChu FROM theo_doi WHERE lop_id = ?1'
  ).bind(phien.lopId).all();

  const theoId = {};
  td.forEach((x) => {
    theoId[x.hocSinhId] = theoId[x.hocSinhId] || {};
    theoId[x.hocSinhId][x.muc] = { trangThai: x.trangThai, ghiChu: x.ghiChu };
  });

  // Hàm này giờ chỉ giáo viên chủ nhiệm gọi tới được (canGiaoVien không có quyenCan), nên
  // không cần lọc bớt trường nào nữa — trước đây có lọc riêng cho cán sự được cấp quyền
  // "Học sinh", nhưng quyền đó đã bỏ (xem functions/api/gv/tai-khoan-phu.js).
  const danhSach = results.map((h) => ({ ...h, theoDoi: theoId[h.id] || {} }));

  return json({ ok: true, danhSach });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const hoTen = chuoi(than.hoTen, 100);
  if (!hoTen) return loi('Chưa nhập họ tên.');

  const gioiTinh = chuoi(than.gioiTinh, 10);
  const ngaySinh = /^\d{4}-\d{2}-\d{2}$/.test(than.ngaySinh) ? than.ngaySinh : null;
  const lopNghe = chuoi(than.lopNghe, 60);
  const toHop = chuoi(than.toHop, 20);
  const toSo = than.toSo === '' || than.toSo == null ? null : Number(than.toSo);
  if (toSo !== null && (!Number.isInteger(toSo) || toSo < 1)) return loi('Số tổ phải là số nguyên dương (từ 1 trở lên).');

  // id là khoá thay thế DUY NHẤT TOÀN HỆ THỐNG (không riêng theo lớp) để không bao giờ đụng
  // hàng giữa các lớp; so_thu_tu mới là "số thứ tự trong sổ lớp" thật sự, tính riêng từng lớp.
  const [maxId, maxStt] = await Promise.all([
    env.DB.prepare('SELECT COALESCE(MAX(id), 0) AS n FROM hoc_sinh').first(),
    env.DB.prepare('SELECT COALESCE(MAX(so_thu_tu), 0) AS n FROM hoc_sinh WHERE lop_id = ?1').bind(phien.lopId).first(),
  ]);
  const id = (maxId?.n || 0) + 1;
  const soThuTu = (maxStt?.n || 0) + 1;

  await env.DB.prepare(
    `INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, lop_nghe, to_hop, to_so, dang_hoc)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1)`
  ).bind(id, phien.lopId, soThuTu, hoTen, gioiTinh, ngaySinh, lopNghe, toHop, toSo).run();

  return json({ ok: true, id });
}, { canGiaoVien: true });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const id = Number(than.id);
  if (!Number.isInteger(id)) return loi('Thiếu mã học sinh.');

  const dat = [];
  const thamSo = [];
  const them = (cot, giaTri) => { thamSo.push(giaTri); dat.push(`${cot} = ?${thamSo.length}`); };

  if (than.chucVu !== undefined) them('chuc_vu', chuoi(than.chucVu, 60));
  if (than.ghiChu !== undefined) them('ghi_chu', chuoi(than.ghiChu, 500));
  if (than.hoanCanh !== undefined) them('hoan_canh', chuoi(than.hoanCanh, 120));
  if (than.dienThoaiPh !== undefined) them('dien_thoai_ph', chuoi(than.dienThoaiPh, 30));
  if (than.hoTen !== undefined) {
    const t = chuoi(than.hoTen, 100);
    if (!t) return loi('Họ tên không được để trống.');
    them('ho_ten', t);
  }
  if (than.toSo !== undefined) {
    const t = than.toSo === '' || than.toSo === null ? null : Number(than.toSo);
    if (t !== null && (!Number.isInteger(t) || t < 1)) return loi('Số tổ phải là số nguyên dương (từ 1 trở lên).');
    them('to_so', t);
  }
  if (than.dangHoc !== undefined) them('dang_hoc', than.dangHoc ? 1 : 0);

  if (!dat.length) return loi('Không có gì để cập nhật.');

  thamSo.push(id, phien.lopId);
  const kq = await env.DB.prepare(`UPDATE hoc_sinh SET ${dat.join(', ')} WHERE id = ?${thamSo.length - 1} AND lop_id = ?${thamSo.length}`)
    .bind(...thamSo).run();
  if (!kq.meta.changes) return loi('Không tìm thấy học sinh.', 404);

  return json({ ok: true });
}, { canGiaoVien: true });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã học sinh.');

  const hs = await env.DB.prepare('SELECT id FROM hoc_sinh WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).first();
  if (!hs) return loi('Không tìm thấy học sinh.', 404);

  // Xoá học sinh và toàn bộ dữ liệu phụ thuộc
  await env.DB.batch([
    env.DB.prepare('DELETE FROM diem_danh WHERE hoc_sinh_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM nhat_ky WHERE hoc_sinh_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM theo_doi WHERE hoc_sinh_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM lien_he_phu_huynh WHERE hoc_sinh_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM quy_dong WHERE hoc_sinh_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM diem WHERE hoc_sinh_id = ?1').bind(id),
    env.DB.prepare('UPDATE tai_khoan_phu SET hoc_sinh_id = NULL WHERE hoc_sinh_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM hoc_sinh WHERE id = ?1').bind(id),
  ]);

  return json({ ok: true });
}, { canGiaoVien: true });

