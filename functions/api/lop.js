// GET /api/lop — dữ liệu cho trang lớp. Học sinh đã nhập mã đều xem được.
// KHÔNG bao giờ trả về hoàn cảnh gia đình hay điện thoại phụ huynh.
//
// ?ma=<mã cá nhân> (tuỳ chọn): trang lớp tự gửi kèm mã cá nhân đã lưu trên máy (nếu em đã
// từng tra cứu) để nhận về "anMuc" — các mục giáo viên đã ẩn riêng cho em, dùng để tự ẩn bớt
// tiền quỹ/thông báo/thời khoá biểu ở giao diện. Không phải xác thực — chỉ là gợi ý hiển thị,
// dữ liệu vẫn công khai như nhau cho mọi mã lớp giống hệt trước đây.
import { bocXuLy, json } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, request, waitUntil }) => {
  const db = env.DB;

  const homNay = new Date().toISOString().slice(0, 10);
  const ma = new URL(request.url).searchParams.get('ma');

  // Đếm lượt tải trang — không chặn phản hồi (waitUntil), lỗi cũng bỏ qua vì đây chỉ là
  // số liệu tham khảo cho tab Tương tác, không phải dữ liệu bắt buộc phải chính xác tuyệt đối.
  const demLuot = db.prepare(
    `INSERT INTO luot_truy_cap (ngay, luot) VALUES (?1, 1)
     ON CONFLICT(ngay) DO UPDATE SET luot = luot + 1`
  ).bind(homNay).run().catch(() => {});
  if (waitUntil) waitUntil(demLuot);

  const [hocSinh, thongBao, keHoach, phienBanTkb, hinhAnh, quyKhoan, quyChi] = await Promise.all([
    db.prepare(
      `SELECT id AS stt, ho_ten AS hoTen, gioi_tinh AS gioiTinh, ngay_sinh AS ngaySinh,
              lop_nghe AS lopNghe, to_hop AS toHop, chuc_vu AS chucVu, to_so AS toSo
         FROM hoc_sinh WHERE dang_hoc = 1 ORDER BY id`
    ).all(),
    db.prepare(
      `SELECT id, ngay, tieu_de AS tieuDe, noi_dung AS noiDung, loai, ghim, noi_bat AS noiBat
         FROM thong_bao WHERE hien = 1 ORDER BY ghim DESC, ngay DESC LIMIT 50`
    ).all(),
    db.prepare(
      `SELECT id, ngay, tieu_de AS tieuDe, mo_ta AS moTa, muc_do AS mucDo, hoan_thanh AS hoanThanh, noi_bat AS noiBat
         FROM ke_hoach ORDER BY ngay`
    ).all(),
    db.prepare(
      `SELECT id, ten, ngay_bat_dau AS ngayBatDau FROM tkb_phien_ban
        WHERE ngay_bat_dau <= ?1 ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1`
    ).bind(homNay).first(),
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

  const nhacNen = await db.prepare('SELECT ten_bai AS tenBai FROM nhac_nen WHERE id = 1').first().catch(() => null);

  let anMuc = [];
  if (ma) {
    const m = await db.prepare('SELECT an_muc AS anMuc FROM ma_ca_nhan WHERE ma = ?1').bind(ma).first();
    if (m && m.anMuc) anMuc = m.anMuc.split(',');
  }

  const oTkb = phienBanTkb
    ? (await db.prepare('SELECT buoi, thu, tiet, mon, phong FROM tkb_o WHERE phien_ban_id = ?1 ORDER BY buoi, tiet, thu')
        .bind(phienBanTkb.id).all()).results
    : [];

  const sl = hocSinh.results.length;
  const nam = hocSinh.results.filter((h) => h.gioiTinh === 'Nam').length;
  const nghe = [...new Set(hocSinh.results.map((h) => h.lopNghe).filter((x) => x && x !== 'Chưa xếp'))];

  const tongThuQuy = quyKhoan.results.reduce((a, k) => a + k.tongDaThu, 0);
  const tongChiQuy = quyChi?.tongChi || 0;

  return json({
    ok: true,
    anMuc,
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
    thongBao: thongBao.results.map((t) => ({ ...t, ghim: Boolean(t.ghim), noiBat: Boolean(t.noiBat) })),
    keHoach: keHoach.results.map((k) => ({ ...k, hoanThanh: Boolean(k.hoanThanh), noiBat: Boolean(k.noiBat) })),
    thoiKhoaBieu: {
      phienBan: phienBanTkb ? { id: phienBanTkb.id, ten: phienBanTkb.ten, ngayBatDau: phienBanTkb.ngayBatDau } : null,
      o: oTkb,
    },
    hinhAnh: hinhAnh.results,
    nhacNen: nhacNen ? { tenBai: nhacNen.tenBai } : null,
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
