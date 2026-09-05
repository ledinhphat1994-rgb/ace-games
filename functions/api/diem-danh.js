// GET /api/diem-danh?ngay=YYYY-MM-DD&buoi=sang
// Xem tình hình điểm danh lớp theo ngày và chuyên cần của học sinh đang đăng nhập.
import { bocXuLy, json, loi, ngayHopLe } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const url = new URL(request.url);

  // Kiểm tra quyền ẩn mục của học sinh (nếu đăng nhập)
  let anMuc = [];
  const hocSinhIdPhien = phien?.hocSinhId || null;
  if (hocSinhIdPhien) {
    const m = await db.prepare('SELECT an_muc AS anMuc FROM ma_ca_nhan WHERE hoc_sinh_id = ?1').bind(hocSinhIdPhien).first();
    if (m && m.anMuc) anMuc = m.anMuc.split(',');
  }

  if (anMuc.includes('diem-danh')) {
    return json({ ok: true, an: true });
  }

  // Danh sách các ngày đã có điểm danh trong dữ liệu
  const cacNgay = await db.prepare(
    'SELECT DISTINCT ngay FROM diem_danh ORDER BY ngay DESC LIMIT 45'
  ).all();
  const dsNgay = cacNgay.results.map((r) => r.ngay);

  const ngayMoiNhat = dsNgay[0] || new Date().toISOString().slice(0, 10);
  const ngay = url.searchParams.get('ngay') || ngayMoiNhat;
  let buoi = url.searchParams.get('buoi') || 'sang';

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');

  // Các buổi có dữ liệu của ngày này
  const cacBuoiNgay = await db.prepare(
    'SELECT DISTINCT buoi FROM diem_danh WHERE ngay = ?1'
  ).bind(ngay).all();
  const dsBuoiTrongNgay = cacBuoiNgay.results.map((r) => r.buoi);
  if (!url.searchParams.has('buoi') && dsBuoiTrongNgay.length > 0 && !dsBuoiTrongNgay.includes(buoi)) {
    buoi = dsBuoiTrongNgay[0];
  }

  const { results: danhSach } = await db.prepare(
    `SELECT h.id, h.ho_ten AS hoTen, h.gioi_tinh AS gioiTinh, h.lop_nghe AS lopNghe,
            d.trang_thai AS trangThai, d.ly_do AS lyDo
       FROM hoc_sinh h
       LEFT JOIN diem_danh d
         ON d.hoc_sinh_id = h.id AND d.ngay = ?1 AND d.buoi = ?2
      WHERE h.dang_hoc = 1
      ORDER BY h.id`
  ).bind(ngay, buoi).all();

  const demNgay = { coMat: 0, vangPhep: 0, vangKhongPhep: 0, tre: 0, chuaGhi: 0 };
  danhSach.forEach((r) => {
    if (r.trangThai === 'co_mat') demNgay.coMat++;
    else if (r.trangThai === 'vang_phep') demNgay.vangPhep++;
    else if (r.trangThai === 'vang_khong_phep') demNgay.vangKhongPhep++;
    else if (r.trangThai === 'tre') demNgay.tre++;
    else demNgay.chuaGhi++;
  });

  // Chuyên cần cá nhân nếu người dùng đang đăng nhập bằng mã học sinh
  let caNhan = null;
  if (hocSinhIdPhien) {
    const hs = await db.prepare('SELECT id, ho_ten AS hoTen, chuc_vu AS chucVu, lop_nghe AS lopNghe FROM hoc_sinh WHERE id = ?1').bind(hocSinhIdPhien).first();
    const diemDanhHs = await db.prepare(
      `SELECT ngay, buoi, trang_thai AS trangThai, ly_do AS lyDo
         FROM diem_danh WHERE hoc_sinh_id = ?1 ORDER BY ngay DESC LIMIT 90`
    ).bind(hocSinhIdPhien).all();

    const demHs = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
    diemDanhHs.results.forEach((d) => { if (demHs[d.trangThai] !== undefined) demHs[d.trangThai]++; });
    const tong = diemDanhHs.results.length;
    const tiLe = tong ? Math.round((demHs.co_mat / tong) * 100) : null;
    const lichSuVang = diemDanhHs.results.filter((x) => x.trangThai !== 'co_mat');

    caNhan = {
      hocSinhId: hocSinhIdPhien,
      hoTen: hs?.hoTen || '',
      chucVu: hs?.chucVu || '',
      lopNghe: hs?.lopNghe || '',
      tong,
      tiLe,
      ...demHs,
      lichSuVang,
    };
  }

  return json({
    ok: true,
    an: false,
    ngay,
    buoi,
    dsNgay,
    dsBuoiTrongNgay,
    thongKeNgay: { ...demNgay, tongSo: danhSach.length },
    danhSach,
    caNhan,
  });
});
