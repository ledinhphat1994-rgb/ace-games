// GET /api/diem-danh?ngay=YYYY-MM-DD&buoi=sang&loai=chinh
// Xem tình hình điểm danh lớp theo ngày (chính/phụ) và chuyên cần của học sinh đang đăng nhập.
import { bocXuLy, json, loi, ngayHopLe } from '../_lib/api.js';

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

  const loai = url.searchParams.get('loai') === 'phu' ? 'phu' : 'chinh';
  const lopId = phien.lopId;

  // Danh sách các ngày đã có điểm danh trong dữ liệu (theo loại chính hoặc phụ)
  const cauLenhCacNgay = loai === 'phu'
    ? "SELECT DISTINCT ngay FROM diem_danh WHERE buoi LIKE '%_phu' AND lop_id = ?1 ORDER BY ngay DESC LIMIT 45"
    : "SELECT DISTINCT ngay FROM diem_danh WHERE buoi NOT LIKE '%_phu' AND lop_id = ?1 ORDER BY ngay DESC LIMIT 45";
  const cacNgay = await db.prepare(cauLenhCacNgay).bind(lopId).all();
  const dsNgay = cacNgay.results.map((r) => r.ngay);

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const homNayVN = now.toISOString().slice(0, 10);
  const ngay = url.searchParams.get('ngay') || homNayVN;
  const buoiGoc = (url.searchParams.get('buoi') || 'sang').replace(/_phu$/, '');

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');

  const buoi = chuanHoaBuoi(buoiGoc, loai);
  if (!buoi) return loi('Buổi không hợp lệ.');

  // Các buổi có dữ liệu của ngày này theo loại đang xem
  const cauLenhCacBuoi = loai === 'phu'
    ? "SELECT DISTINCT buoi FROM diem_danh WHERE ngay = ?1 AND buoi LIKE '%_phu' AND lop_id = ?2"
    : "SELECT DISTINCT buoi FROM diem_danh WHERE ngay = ?1 AND buoi NOT LIKE '%_phu' AND lop_id = ?2";
  const cacBuoiNgay = await db.prepare(cauLenhCacBuoi).bind(ngay, lopId).all();
  const dsBuoiTrongNgay = cacBuoiNgay.results.map((r) => r.buoi.replace(/_phu$/, ''));

  const { results: danhSach } = await db.prepare(
    `SELECT h.id, h.ho_ten AS hoTen, h.gioi_tinh AS gioiTinh, h.lop_nghe AS lopNghe,
            d.trang_thai AS trangThai, d.ly_do AS lyDo
       FROM hoc_sinh h
       LEFT JOIN diem_danh d
         ON d.hoc_sinh_id = h.id AND d.ngay = ?1 AND d.buoi = ?2 AND d.lop_id = ?3
      WHERE h.dang_hoc = 1 AND h.lop_id = ?3
      ORDER BY h.id`
  ).bind(ngay, buoi, lopId).all();

  const demNgay = { coMat: 0, vangPhep: 0, vangKhongPhep: 0, tre: 0, chuaGhi: 0 };
  danhSach.forEach((r) => {
    if (r.trangThai === 'co_mat') demNgay.coMat++;
    else if (r.trangThai === 'vang_phep') demNgay.vangPhep++;
    else if (r.trangThai === 'vang_khong_phep') demNgay.vangKhongPhep++;
    else if (r.trangThai === 'tre') demNgay.tre++;
    else demNgay.chuaGhi++;
  });
  const daGhi = demNgay.coMat + demNgay.vangPhep + demNgay.vangKhongPhep + demNgay.tre;

  // Chuyên cần cá nhân nếu người dùng đang đăng nhập bằng mã học sinh
  let caNhan = null;
  if (hocSinhIdPhien) {
    const hs = await db.prepare('SELECT id, ho_ten AS hoTen, chuc_vu AS chucVu, lop_nghe AS lopNghe FROM hoc_sinh WHERE id = ?1').bind(hocSinhIdPhien).first();
    const diemDanhHs = await db.prepare(
      `SELECT ngay, buoi, trang_thai AS trangThai, ly_do AS lyDo
         FROM diem_danh WHERE hoc_sinh_id = ?1 ORDER BY ngay DESC, buoi DESC LIMIT 120`
    ).bind(hocSinhIdPhien).all();

    // Tách riêng dữ liệu chính khoá và dữ liệu phụ
    const dsChinh = diemDanhHs.results.filter((x) => !x.buoi.endsWith('_phu'));
    const dsPhu = diemDanhHs.results.filter((x) => x.buoi.endsWith('_phu')).map((x) => ({
      ...x,
      buoiGoc: x.buoi.replace(/_phu$/, ''),
    }));

    const demChinh = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
    dsChinh.forEach((d) => { if (demChinh[d.trangThai] !== undefined) demChinh[d.trangThai]++; });
    const tongChinh = dsChinh.length;
    const tiLeChinh = tongChinh ? Math.round((demChinh.co_mat / tongChinh) * 100) : null;
    const lichSuVangChinh = dsChinh.filter((x) => x.trangThai !== 'co_mat');

    const demPhu = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
    dsPhu.forEach((d) => { if (demPhu[d.trangThai] !== undefined) demPhu[d.trangThai]++; });
    const tongPhu = dsPhu.length;
    const tiLePhu = tongPhu ? Math.round((demPhu.co_mat / tongPhu) * 100) : null;
    const lichSuVangPhu = dsPhu.filter((x) => x.trangThai !== 'co_mat');

    caNhan = {
      hocSinhId: hocSinhIdPhien,
      hoTen: hs?.hoTen || '',
      chucVu: hs?.chucVu || '',
      lopNghe: hs?.lopNghe || '',
      // Dữ liệu chính khoá
      chinh: {
        tong: tongChinh,
        tiLe: tiLeChinh,
        ...demChinh,
        lichSuVang: lichSuVangChinh,
      },
      // Dữ liệu hoạt động / điểm danh phụ
      phu: {
        tong: tongPhu,
        tiLe: tiLePhu,
        ...demPhu,
        danhSach: dsPhu,
        lichSuVang: lichSuVangPhu,
      },
      // Mặc định tương thích ngược cho dữ liệu chính khoá
      tong: tongChinh,
      tiLe: tiLeChinh,
      ...demChinh,
      lichSuVang: lichSuVangChinh,
    };
  }

  return json({
    ok: true,
    an: false,
    ngay,
    buoi: buoiGoc,
    loai,
    dsNgay,
    dsBuoiTrongNgay,
    thongKeNgay: { ...demNgay, daGhi, tongSo: danhSach.length },
    danhSach,
    caNhan,
  });
});
