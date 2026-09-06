// GET /api/lop — dữ liệu cho trang lớp. Học sinh đã nhập mã đều xem được.
// KHÔNG bao giờ trả về hoàn cảnh gia đình hay điện thoại phụ huynh.
//
// ?ma=<mã cá nhân> (tuỳ chọn): trang lớp tự gửi kèm mã cá nhân đã lưu trên máy (nếu em đã
// từng tra cứu) để nhận về "anMuc" — các mục giáo viên đã ẩn riêng cho em, dùng để tự ẩn bớt
// tiền quỹ/thông báo/thời khoá biểu ở giao diện. Không phải xác thực — chỉ là gợi ý hiển thị,
// dữ liệu vẫn công khai như nhau cho mọi mã lớp giống hệt trước đây.
import { bocXuLy, json } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, request, waitUntil, phien }) => {
  const db = env.DB;
  const lopId = phien.lopId;

  const homNay = new Date().toISOString().slice(0, 10);
  const ma = new URL(request.url).searchParams.get('ma');
  // Đăng nhập bằng mã cá nhân thật (phiên có hocSinhId) là nguồn đáng tin cậy nhất để biết
  // "đây là em nào" — ?ma= chỉ còn là phương án dự phòng cho trang cũ dùng localStorage.
  const hocSinhIdPhien = phien.hocSinhId || null;

  // Ghi lại lượt tải trang — không chặn phản hồi (waitUntil), lỗi cũng bỏ qua vì đây chỉ là
  // số liệu tham khảo cho tab Tương tác. Ghi cả bảng tổng theo ngày (nhanh cho biểu đồ) lẫn
  // chi tiết từng lượt kèm mã (nếu có) để biết ai truy cập, lúc nào, bao nhiêu lần.
  const ghiLuot = (async () => {
    let hocSinhId = hocSinhIdPhien;
    if (!hocSinhId && ma) {
      const m = await db.prepare('SELECT hoc_sinh_id AS id FROM ma_ca_nhan WHERE ma = ?1 AND lop_id = ?2').bind(ma, lopId).first();
      hocSinhId = m?.id ?? null;
    }
    await db.batch([
      db.prepare(
        `INSERT INTO luot_truy_cap (lop_id, ngay, luot) VALUES (?1, ?2, 1)
         ON CONFLICT(lop_id, ngay) DO UPDATE SET luot = luot + 1`
      ).bind(lopId, homNay),
      db.prepare('INSERT INTO nhat_ky_truy_cap (ma, hoc_sinh_id, lop_id) VALUES (?1, ?2, ?3)').bind(ma || null, hocSinhId, lopId),
    ]);
  })().catch(() => {});
  if (waitUntil) waitUntil(ghiLuot);

  const [lopRow, hocSinh, thongBao, phienBanTkb, hoatDongLop, quyKhoan, quyChi, quyDong] = await Promise.all([
    db.prepare(
      `SELECT l.ten, l.nam_hoc AS namHoc, l.truong, l.gioi_thieu AS gioiThieu,
              l.hs_cong_khai_an AS hsCongKhaiAn,
              ha.khoa AS bannerHinhKhoa, l.banner_hinh_url AS bannerHinhUrl,
              l.banner_video_id AS bannerVideoId, l.banner_video_url AS bannerVideoUrl
         FROM lop l
         LEFT JOIN hinh_anh ha ON ha.id = l.banner_anh_id
        WHERE l.id = ?1`
    ).bind(lopId).first(),
    db.prepare(
      `SELECT id AS stt, ho_ten AS hoTen, gioi_tinh AS gioiTinh, ngay_sinh AS ngaySinh,
              lop_nghe AS lopNghe, to_hop AS toHop, chuc_vu AS chucVu, to_so AS toSo
         FROM hoc_sinh WHERE dang_hoc = 1 AND lop_id = ?1 ORDER BY id`
    ).bind(lopId).all(),
    // hinhKhoa/nhacKhoa: ưu tiên mục trong thư viện (anh_id/am_thanh_id) nếu có, kế đến link
    // ngoài dán riêng (hinh_url/nhac_url).
    db.prepare(
      `SELECT tb.id, tb.ngay, tb.tieu_de AS tieuDe, tb.noi_dung AS noiDung, tb.loai, tb.ghim,
              tb.noi_bat AS noiBat, tb.muc_do AS mucDo,
              COALESCE(ha.khoa, tb.hinh_url) AS hinhKhoa, ha.kieu AS hinhKieu,
              COALESCE(at.khoa, tb.nhac_url) AS nhacKhoa, at.kieu AS nhacKieu,
              tb.video_url AS videoUrl, v.khoa AS videoKhoa, v.kieu AS videoKieu
         FROM thong_bao tb
         LEFT JOIN hinh_anh ha ON ha.id = tb.anh_id
         LEFT JOIN am_thanh at ON at.id = tb.am_thanh_id
         LEFT JOIN video v ON v.id = tb.video_id
        WHERE tb.hien = 1 AND tb.lop_id = ?1 ORDER BY tb.ghim DESC, tb.ngay DESC LIMIT 50`
    ).bind(lopId).all(),
    db.prepare(
      `SELECT id, ten, ngay_bat_dau AS ngayBatDau FROM tkb_phien_ban
        WHERE lop_id = ?1
        ORDER BY (CASE WHEN ngay_ket_thuc IS NULL THEN 0 ELSE 1 END),
                 (CASE WHEN ngay_bat_dau <= ?2 THEN 0 ELSE 1 END),
                 ngay_bat_dau DESC, id DESC LIMIT 1`
    ).bind(lopId, homNay).first(),
    // "Hoạt động lớp" — CHỈ những mục giáo viên/cán sự đã chọn đăng công khai, không phải mọi
    // ảnh trong thư viện Ảnh (thư viện còn dùng chung cho Banner, Thông báo... không nên tự lộ
    // hết ra trang chủ).
    db.prepare(
      `SELECT hd.id, hd.loai, hd.chu_thich AS chuThich, hd.ngay, hd.url,
              hd.video_id AS videoId, hd.am_thanh_id AS amThanhId,
              ha.khoa AS anhKhoa, v.khoa AS videoKhoa, at.khoa AS amThanhKhoa, at.ten AS amThanhTen
         FROM hoat_dong_lop hd
         LEFT JOIN hinh_anh ha ON ha.id = hd.anh_id
         LEFT JOIN video v ON v.id = hd.video_id
         LEFT JOIN am_thanh at ON at.id = hd.am_thanh_id
        WHERE hd.lop_id = ?1 ORDER BY hd.ngay DESC, hd.id DESC LIMIT 60`
    ).bind(lopId).all(),
    // Thủ quỹ: tổng hợp và chi tiết đóng tiền của từng học sinh theo khoản
    db.prepare(
      `SELECT k.id, k.ten, k.so_tien_moi_em AS soTienMoiEm, k.dang_mo AS dangMo,
              k.dinh_ky_id AS dinhKyId, k.ky_so AS kySo, k.ngay_bat_dau AS ngayBatDau, k.ngay_ket_thuc AS ngayKetThuc,
              COALESCE(SUM(d.so_tien), 0) AS tongDaThu
         FROM quy_khoan k LEFT JOIN quy_dong d ON d.khoan_id = k.id
        WHERE k.lop_id = ?1
        GROUP BY k.id ORDER BY k.tao_luc DESC`
    ).bind(lopId).all(),
    db.prepare('SELECT id, ngay, noi_dung AS noiDung, so_tien AS soTien, loai, ghi_chu AS ghiChu FROM quy_chi WHERE lop_id = ?1 ORDER BY ngay DESC, id DESC').bind(lopId).all(),
    db.prepare(
      `SELECT d.khoan_id AS khoanId, d.hoc_sinh_id AS hocSinhId,
              SUM(d.so_tien) AS tongTien, MAX(d.ngay) AS ngayDong, MAX(d.ghi_chu) AS ghiChu
         FROM quy_dong d
        WHERE d.lop_id = ?1
        GROUP BY d.khoan_id, d.hoc_sinh_id`
    ).bind(lopId).all(),
  ]);

  const nhacNen = await db.prepare('SELECT ten AS tenBai FROM am_thanh WHERE dang_phat = 1 AND lop_id = ?1 LIMIT 1').bind(lopId).first().catch(() => null);

  let anMuc = [];
  if (hocSinhIdPhien) {
    const m = await db.prepare('SELECT an_muc AS anMuc FROM ma_ca_nhan WHERE hoc_sinh_id = ?1').bind(hocSinhIdPhien).first();
    if (m && m.anMuc) anMuc = m.anMuc.split(',');
  } else if (ma) {
    const m = await db.prepare('SELECT an_muc AS anMuc FROM ma_ca_nhan WHERE ma = ?1 AND lop_id = ?2').bind(ma, lopId).first();
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
  const tongChiQuy = quyChi.results.reduce((a, c) => a + c.soTien, 0);

  const dongTheoKhoan = {};
  (quyDong?.results || []).forEach((r) => {
    dongTheoKhoan[r.khoanId] = dongTheoKhoan[r.khoanId] || {};
    dongTheoKhoan[r.khoanId][r.hocSinhId] = {
      soTien: r.tongTien,
      ngay: r.ngayDong,
      ghiChu: r.ghiChu || '',
    };
  });

  const hocSinhAnMuc = (lopRow?.hsCongKhaiAn || '').split(',').filter(Boolean);

  return json({
    ok: true,
    anMuc,
    hocSinhAnMuc,
    lop: {
      ten: lopRow?.ten || 'Lớp học',
      namHoc: lopRow?.namHoc || '',
      truong: lopRow?.truong || '',
      gioiThieu: lopRow?.gioiThieu || '',
      bannerHinhKhoa: lopRow?.bannerHinhKhoa || null,
      bannerHinhUrl: lopRow?.bannerHinhUrl || null,
      bannerVideoId: lopRow?.bannerVideoId || null,
      bannerVideoUrl: lopRow?.bannerVideoUrl || null,
      thongKe: [
        { giaTri: String(sl), nhan: 'Học sinh' },
        { giaTri: `${nam} / ${sl - nam}`, nhan: 'Nam / Nữ' },
        { giaTri: String(nghe.length), nhan: 'Lớp nghề' },
        { giaTri: 'A4', nhan: 'Tổ hợp môn' },
      ],
    },
    hocSinh: hocSinh.results,
    thongBao: thongBao.results.map((t) => ({ ...t, ghim: Boolean(t.ghim), noiBat: Boolean(t.noiBat) })),
    thoiKhoaBieu: {
      phienBan: phienBanTkb ? { id: phienBanTkb.id, ten: phienBanTkb.ten, ngayBatDau: phienBanTkb.ngayBatDau } : null,
      o: oTkb,
    },
    hoatDongLop: hoatDongLop.results,
    nhacNen: nhacNen ? { tenBai: nhacNen.tenBai } : null,
    thuQuy: {
      tonQuy: tongThuQuy - tongChiQuy,
      tongThu: tongThuQuy,
      tongChi: tongChiQuy,
      khoan: quyKhoan.results.map((k) => ({
        id: k.id, ten: k.ten, soTienMoiEm: k.soTienMoiEm, dangMo: Boolean(k.dangMo),
        dinhKyId: k.dinhKyId, kySo: k.kySo, ngayBatDau: k.ngayBatDau, ngayKetThuc: k.ngayKetThuc,
        tongDaThu: k.tongDaThu, tongCanThu: k.soTienMoiEm * sl,
        dongChiTiet: dongTheoKhoan[k.id] || {},
      })),
      chi: quyChi.results.map((c) => ({
        id: c.id, ngay: c.ngay, noiDung: c.noiDung, soTien: c.soTien,
        loai: c.loai || 'khac', ghiChu: c.ghiChu || '',
      })),
    },
  });
});
