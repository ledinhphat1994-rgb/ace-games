// Hồ sơ học sinh — bản đầy đủ, chỉ giáo viên chủ nhiệm xem được.
//   GET   /api/gv/hoc-sinh            -> cả lớp kèm hoàn cảnh, SĐT phụ huynh, thống kê vắng
//   GET   /api/gv/hoc-sinh?id=5       -> hồ sơ một em kèm lịch sử điểm danh và nhật ký
//   PATCH /api/gv/hoc-sinh            { id, chucVu, toSo, dienThoaiPh, hoanCanh, ghiChu }
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const id = Number(new URL(request.url).searchParams.get('id'));

  if (Number.isInteger(id) && id > 0) {
    const [hs, diemDanh, nhatKy, theoDoi] = await Promise.all([
      db.prepare(
        `SELECT id, ho_ten AS hoTen, gioi_tinh AS gioiTinh, ngay_sinh AS ngaySinh,
                lop_nghe AS lopNghe, to_hop AS toHop, chuc_vu AS chucVu, to_so AS toSo,
                dien_thoai_ph AS dienThoaiPh, hoan_canh AS hoanCanh, ghi_chu AS ghiChu
           FROM hoc_sinh WHERE id = ?1`
      ).bind(id).first(),
      db.prepare(
        `SELECT ngay, buoi, trang_thai AS trangThai, ly_do AS lyDo
           FROM diem_danh WHERE hoc_sinh_id = ?1 ORDER BY ngay DESC LIMIT 60`
      ).bind(id).all(),
      db.prepare(
        `SELECT id, ngay, loai, noi_dung AS noiDung, da_xu_ly AS daXuLy
           FROM nhat_ky WHERE hoc_sinh_id = ?1 ORDER BY ngay DESC LIMIT 50`
      ).bind(id).all(),
      db.prepare('SELECT muc, trang_thai AS trangThai, ghi_chu AS ghiChu FROM theo_doi WHERE hoc_sinh_id = ?1')
        .bind(id).all(),
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
    `SELECT h.id, h.ho_ten AS hoTen, h.gioi_tinh AS gioiTinh, h.ngay_sinh AS ngaySinh,
            h.lop_nghe AS lopNghe, h.to_hop AS toHop, h.chuc_vu AS chucVu, h.to_so AS toSo,
            h.dien_thoai_ph AS dienThoaiPh, h.hoan_canh AS hoanCanh, h.ghi_chu AS ghiChu,
            COALESCE(SUM(CASE WHEN d.trang_thai = 'vang_khong_phep' THEN 1 END), 0) AS vangKhongPhep,
            COALESCE(SUM(CASE WHEN d.trang_thai = 'vang_phep' THEN 1 END), 0) AS vangPhep,
            COALESCE(SUM(CASE WHEN d.trang_thai = 'tre' THEN 1 END), 0) AS tre
       FROM hoc_sinh h LEFT JOIN diem_danh d ON d.hoc_sinh_id = h.id
      WHERE h.dang_hoc = 1
      GROUP BY h.id ORDER BY h.id`
  ).all();

  const { results: td } = await db.prepare(
    'SELECT hoc_sinh_id AS hocSinhId, muc, trang_thai AS trangThai, ghi_chu AS ghiChu FROM theo_doi'
  ).all();

  const theoId = {};
  td.forEach((x) => {
    theoId[x.hocSinhId] = theoId[x.hocSinhId] || {};
    theoId[x.hocSinhId][x.muc] = { trangThai: x.trangThai, ghiChu: x.ghiChu };
  });

  return json({
    ok: true,
    danhSach: results.map((h) => ({ ...h, theoDoi: theoId[h.id] || {} })),
  });
}, { canGiaoVien: true });

export const onRequestPatch = bocXuLy(async ({ request, env }) => {
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
    if (t !== null && !Number.isInteger(t)) return loi('Số tổ không hợp lệ.');
    them('to_so', t);
  }
  if (than.dangHoc !== undefined) them('dang_hoc', than.dangHoc ? 1 : 0);

  if (!dat.length) return loi('Không có gì để cập nhật.');

  thamSo.push(id);
  await env.DB.prepare(`UPDATE hoc_sinh SET ${dat.join(', ')} WHERE id = ?${thamSo.length}`)
    .bind(...thamSo).run();

  return json({ ok: true });
}, { canGiaoVien: true });
