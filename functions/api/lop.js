// GET /api/lop — dữ liệu cho trang lớp. Học sinh đã nhập mã đều xem được.
// KHÔNG bao giờ trả về hoàn cảnh gia đình hay điện thoại phụ huynh.
import { bocXuLy, json } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env }) => {
  const db = env.DB;

  const [hocSinh, thongBao, keHoach, tkb, hinhAnh, quyKhoan, quyChi] = await Promise.all([
    db.prepare(
      `SELECT id AS stt, ho_ten AS hoTen, gioi_tinh AS gioiTinh, ngay_sinh AS ngaySinh,
              lop_nghe AS lopNghe, to_hop AS toHop, chuc_vu AS chucVu, to_so AS toSo
         FROM hoc_sinh WHERE dang_hoc = 1 ORDER BY id`
    ).all(),
    db.prepare(
      `SELECT id, ngay, tieu_de AS tieuDe, noi_dung AS noiDung, loai, ghim
         FROM thong_bao WHERE hien = 1 ORDER BY ghim DESC, ngay DESC LIMIT 50`
    ).all(),
    db.prepare(
      `SELECT id, ngay, tieu_de AS tieuDe, mo_ta AS moTa, muc_do AS mucDo, hoan_thanh AS hoanThanh
         FROM ke_hoach ORDER BY ngay`
    ).all(),
    db.prepare('SELECT thu, tiet, mon, phong FROM thoi_khoa_bieu ORDER BY tiet, thu').all(),
    db.prepare('SELECT khoa, chu_thich AS chuThich, ngay FROM hinh_anh ORDER BY ngay DESC, id DESC LIMIT 60').all(),
    // Thủ quỹ: chỉ số liệu TỔNG HỢP, không bao giờ trả về ai đã đóng / ai còn thiếu.
    db.prepare(
      `SELECT k.id, k.ten, k.so_tien_moi_em AS soTienMoiEm, k.dang_mo AS dangMo,
              COALESCE(SUM(d.so_tien), 0) AS tongDaThu
         FROM quy_khoan k LEFT JOIN quy_dong d ON d.khoan_id = k.id
        GROUP BY k.id ORDER BY k.tao_luc DESC`
    ).all(),
    db.prepare('SELECT COALESCE(SUM(so_tien), 0) AS tongChi FROM quy_chi').first(),
  ]);

  const sl = hocSinh.results.length;
  const nam = hocSinh.results.filter((h) => h.gioiTinh === 'Nam').length;
  const nghe = [...new Set(hocSinh.results.map((h) => h.lopNghe).filter((x) => x && x !== 'Chưa xếp'))];

  const tongThuQuy = quyKhoan.results.reduce((a, k) => a + k.tongDaThu, 0);
  const tongChiQuy = quyChi?.tongChi || 0;

  return json({
    ok: true,
    lop: {
      ten: 'Lớp 10A7',
      namHoc: '2026 – 2027',
      truong: 'Trung tâm GDNN – GDTX xã Định Quán, tỉnh Đồng Nai',
      thongKe: [
        { giaTri: String(sl), nhan: 'Học sinh' },
        { giaTri: `${nam} / ${sl - nam}`, nhan: 'Nam / Nữ' },
        { giaTri: String(nghe.length), nhan: 'Lớp nghề' },
        { giaTri: 'A4', nhan: 'Tổ hợp môn' },
      ],
    },
    hocSinh: hocSinh.results,
    thongBao: thongBao.results.map((t) => ({ ...t, ghim: Boolean(t.ghim) })),
    keHoach: keHoach.results.map((k) => ({ ...k, hoanThanh: Boolean(k.hoanThanh) })),
    thoiKhoaBieu: tkb.results,
    hinhAnh: hinhAnh.results,
    thuQuy: {
      tonQuy: tongThuQuy - tongChiQuy,
      tongThu: tongThuQuy,
      tongChi: tongChiQuy,
      khoan: quyKhoan.results.map((k) => ({
        id: k.id, ten: k.ten, soTienMoiEm: k.soTienMoiEm, dangMo: Boolean(k.dangMo),
        tongDaThu: k.tongDaThu, tongCanThu: k.soTienMoiEm * sl,
      })),
    },
  });
});
