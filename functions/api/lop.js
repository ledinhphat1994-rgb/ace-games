// GET /api/lop — dữ liệu cho trang lớp. Học sinh đã nhập mã đều xem được.
// KHÔNG bao giờ trả về hoàn cảnh gia đình hay điện thoại phụ huynh.
// Phiên đăng nhập (cookie ký HMAC) là nguồn DUY NHẤT để biết "đây là em nào" — không còn
// chấp nhận ?ma=<mã cá nhân> trên URL (mã bí mật không được phép lọt vào URL/log truy cập).
import { bocXuLy, json, ngayVNHomNay } from '../_lib/api.js';
import { coQuyenThanhVien } from '../_lib/community.js';

export const onRequestGet = bocXuLy(async ({ env, waitUntil, phien }) => {
  const db = env.DB;
  const lopId = phien.lopId;

  const homNay = ngayVNHomNay();
  const hocSinhIdPhien = phien.hocSinhId || null;

  // Bảo vệ máy chủ cho Bảng Tin Cộng Đồng: Học sinh bắt buộc phải có quyền thành viên
  if (!(await coQuyenThanhVien(env, phien))) {
      return json({
        ok: false,
        error: 'community_membership_required',
        canMaCongDong: true,
        message: 'Bạn cần mã truy cập do Giáo viên cấp để tham gia Bảng Tin Cộng Đồng và xem dữ liệu lớp học.'
      }, 403);
  }

  // Ghi lại lượt tải trang — không chặn phản hồi (waitUntil), lỗi cũng bỏ qua vì đây chỉ là
  // số liệu tham khảo cho tab Tương tác. Ghi cả bảng tổng theo ngày (nhanh cho biểu đồ) lẫn
  // chi tiết từng lượt kèm hoc_sinh_id từ phiên đăng nhập (nếu có) để biết ai truy cập.
  const ghiLuot = (async () => {
    await db.batch([
      db.prepare(
        `INSERT INTO luot_truy_cap (lop_id, ngay, luot) VALUES (?1, ?2, 1)
         ON CONFLICT(lop_id, ngay) DO UPDATE SET luot = luot + 1`
      ).bind(lopId, homNay),
      db.prepare('INSERT INTO nhat_ky_truy_cap (ma, hoc_sinh_id, lop_id) VALUES (?1, ?2, ?3)').bind(null, hocSinhIdPhien, lopId),
    ]);
  })().catch(() => {});
  if (waitUntil) waitUntil(ghiLuot);

  // "nhacNen" và "anMucRow" hoàn toàn độc lập với 8 câu bên dưới (và với nhau) — trước đây bị
  // await TUẦN TỰ sau khối Promise.all này, thành 2 round-trip D1 thừa nối đuôi nhau trên đường
  // găng của route đông người dùng nhất (mọi học sinh vào trang chủ đều gọi). Gộp chung vào một
  // Promise.all để chạy song song, giảm độ trễ cảm nhận được khi nhiều học sinh cùng tải trang.
  const [lopRow, hocSinh, thongBao, phienBanTkb, hoatDongLop, quyKhoan, quyChi, quyDong, nhacNenRow, anMucRow, aboutRow] = await Promise.all([
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
      `SELECT id, COALESCE(so_thu_tu, id) AS stt, COALESCE(so_thu_tu, id) AS soThuTu,
              ho_ten AS hoTen, gioi_tinh AS gioiTinh, ngay_sinh AS ngaySinh,
              lop_nghe AS lopNghe, to_hop AS toHop, chuc_vu AS chucVu, to_so AS toSo,
              dien_thoai_hs AS dienThoaiHs
         FROM hoc_sinh WHERE dang_hoc = 1 AND lop_id = ?1 ORDER BY so_thu_tu, id`
    ).bind(lopId).all(),
    // hinhKhoa/nhacKhoa: ưu tiên mục trong thư viện (anh_id/am_thanh_id) nếu có, kế đến link
    // ngoài dán riêng (hinh_url/nhac_url).
    db.prepare(
      `SELECT tb.id, tb.ngay, COALESCE(tb.tao_luc, tb.ngay) AS taoLuc,
              COALESCE(tb.luot_xem, 0) AS luotXem,
              tb.tieu_de AS tieuDe, tb.tieu_de_html AS tieuDeHtml,
              tb.noi_dung AS noiDung, tb.noi_dung_html AS noiDungHtml, tb.loai, tb.ghim,
              tb.noi_bat AS noiBat, tb.muc_do AS mucDo,
              COALESCE(ha.khoa, tb.hinh_url) AS hinhKhoa, ha.kieu AS hinhKieu,
              COALESCE(at.khoa, tb.nhac_url) AS nhacKhoa, at.kieu AS nhacKieu,
              tb.video_url AS videoUrl, v.khoa AS videoKhoa, v.kieu AS videoKieu,
              (SELECT COUNT(*) FROM bai_dang_cam_xuc WHERE bai_dang_id = tb.id AND lop_id = ?1) AS tongCamXuc,
              (SELECT COUNT(*) FROM bai_dang_binh_luan WHERE bai_dang_id = tb.id AND lop_id = ?1) AS tongBinhLuan,
              (SELECT GROUP_CONCAT(DISTINCT loai_cam_xuc) FROM bai_dang_cam_xuc WHERE bai_dang_id = tb.id AND lop_id = ?1) AS cacLoaiCamXuc,
              (SELECT loai_cam_xuc FROM bai_dang_cam_xuc WHERE bai_dang_id = tb.id AND lop_id = ?1 AND nguoi_dung_id = ?2) AS camXucCuaToi
         FROM thong_bao tb
         LEFT JOIN hinh_anh ha ON ha.id = tb.anh_id
         LEFT JOIN am_thanh at ON at.id = tb.am_thanh_id
         LEFT JOIN video v ON v.id = tb.video_id
        WHERE tb.hien = 1 AND tb.trang_thai = 'xuat_ban' AND tb.lop_id = ?1 ORDER BY tb.ghim DESC, tb.ngay DESC LIMIT 50`
    ).bind(lopId, (phien.role === 'teacher' ? 999999 : (phien.hocSinhId || (phien.role === 'phu' ? 800000 + (phien.phuId || 1) : 100001)))).all(),
    db.prepare(
      `SELECT id, ten, ngay_bat_dau AS ngayBatDau, ghi_chu AS ghiChu FROM tkb_phien_ban
        WHERE lop_id = ?1
        ORDER BY (CASE WHEN ngay_ket_thuc IS NULL THEN 0 ELSE 1 END),
                 (CASE WHEN ngay_bat_dau <= ?2 THEN 0 ELSE 1 END),
                 ngay_bat_dau DESC, id DESC LIMIT 1`
    ).bind(lopId, homNay).first(),
    // "Hoạt động lớp" — bài đăng công khai trang chủ kèm tương tác cảm xúc & bình luận
    db.prepare(
      `SELECT hd.id, hd.loai, hd.tieu_de AS tieuDe, hd.tieu_de_html AS tieuDeHtml,
              hd.chu_thich AS chuThich, hd.noi_dung_html AS noiDungHtml, hd.ngay,
              COALESCE(hd.tao_luc, hd.ngay) AS taoLuc,
              COALESCE(hd.luot_xem, 0) AS luotXem,
              hd.anh_id AS anhId, hd.hinh_url AS hinhUrl, ha.khoa AS anhKhoa,
              hd.video_id AS videoId, hd.video_url AS videoUrl, v.khoa AS videoKhoa, v.ten AS videoTen,
              hd.am_thanh_id AS amThanhId, hd.am_thanh_url AS amThanhUrl, at.khoa AS amThanhKhoa, at.ten AS amThanhTen,
              (SELECT COUNT(*) FROM bai_dang_cam_xuc WHERE bai_dang_id = hd.id AND lop_id = ?1) AS tongCamXuc,
              (SELECT COUNT(*) FROM bai_dang_binh_luan WHERE bai_dang_id = hd.id AND lop_id = ?1) AS tongBinhLuan,
              (SELECT GROUP_CONCAT(DISTINCT loai_cam_xuc) FROM bai_dang_cam_xuc WHERE bai_dang_id = hd.id AND lop_id = ?1) AS cacLoaiCamXuc,
              (SELECT loai_cam_xuc FROM bai_dang_cam_xuc WHERE bai_dang_id = hd.id AND lop_id = ?1 AND nguoi_dung_id = ?2) AS camXucCuaToi
         FROM hoat_dong_lop hd
         LEFT JOIN hinh_anh ha ON ha.id = hd.anh_id
         LEFT JOIN video v ON v.id = hd.video_id
         LEFT JOIN am_thanh at ON at.id = hd.am_thanh_id
        WHERE hd.lop_id = ?1 ORDER BY hd.ngay DESC, hd.id DESC LIMIT 60`
    ).bind(lopId, (phien.role === 'teacher' ? 999999 : (phien.hocSinhId || (phien.role === 'phu' ? 800000 + (phien.phuId || 1) : 100001)))).all(),
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
         JOIN quy_khoan k ON k.id = d.khoan_id
        WHERE k.lop_id = ?1
        GROUP BY d.khoan_id, d.hoc_sinh_id`
    ).bind(lopId).all(),
    db.prepare('SELECT id, ten AS tenBai FROM am_thanh WHERE dang_phat = 1 AND lop_id = ?1 AND da_xoa_luc IS NULL LIMIT 1').bind(lopId).first().catch(() => null),
    hocSinhIdPhien
      ? db.prepare('SELECT an_muc AS anMuc FROM ma_ca_nhan WHERE hoc_sinh_id = ?1').bind(hocSinhIdPhien).first()
      : null,
    db.prepare(
      `SELECT a.van_ban AS vanBan, a.anh_id AS anhId, a.hinh_url AS hinhUrl, ha.khoa AS anhKhoa,
              a.video_id AS videoId, a.video_url AS videoUrl, v.khoa AS videoKhoa,
              a.am_thanh_id AS amThanhId, a.am_thanh_url AS amThanhUrl, at.khoa AS amThanhKhoa,
              a.cap_nhat_luc AS capNhatLuc
         FROM lop_about a
         LEFT JOIN hinh_anh ha ON ha.id = a.anh_id
         LEFT JOIN video v ON v.id = a.video_id
         LEFT JOIN am_thanh at ON at.id = a.am_thanh_id
        WHERE a.lop_id = ?1`
    ).bind(lopId).first().catch(() => null),
  ]);

  const nhacNen = nhacNenRow;
  const about = aboutRow;
  const anMuc = anMucRow && anMucRow.anMuc ? anMucRow.anMuc.split(',') : [];

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

  // Điện thoại HỌC SINH (khác điện thoại phụ huynh — luôn không bao giờ trả về, xem đầu file)
  // là số thật của một em, nhạy cảm hơn hẳn các trường như lớp nghề/giới tính — không chỉ ẩn ở
  // giao diện theo hocSinhAnMuc mà XOÁ HẲN khỏi phản hồi khi giáo viên đang để ẩn, để không lộ
  // qua network dù có ai đó tự đọc thẳng dữ liệu API.
  if (hocSinhAnMuc.includes('dien-thoai-hs')) {
    hocSinh.results.forEach((h) => { delete h.dienThoaiHs; });
  }

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
      ],
    },
    about: about || null,
    hocSinh: hocSinh.results,
    thongBao: thongBao.results.map((t) => ({ ...t, ghim: Boolean(t.ghim), noiBat: Boolean(t.noiBat) })),
    thoiKhoaBieu: {
      phienBan: phienBanTkb ? { id: phienBanTkb.id, ten: phienBanTkb.ten, ngayBatDau: phienBanTkb.ngayBatDau, ghiChu: phienBanTkb.ghiChu || '' } : null,
      o: oTkb,
    },
    hoatDongLop: hoatDongLop.results,
    nhacNen: nhacNen ? { id: nhacNen.id, tenBai: nhacNen.tenBai } : null,
    thuQuy: {
      tonQuy: tongThuQuy - tongChiQuy,
      tongThu: tongThuQuy,
      tongChi: tongChiQuy,
      khoan: quyKhoan.results
        .slice()
        .sort((a, b) => {
          const soThuTu = (k) => {
            if (Number.isFinite(k.kySo) && k.kySo > 0) return k.kySo;
            const m = /(?:tuần|tháng|kỳ|ky)\s*(\d+)/i.exec(k.ten || '');
            return m ? Number(m[1]) : Infinity;
          };
          const soA = soThuTu(a);
          const soB = soThuTu(b);
          if (soA !== soB) return soA - soB;
          return (a.id || 0) - (b.id || 0);
        })
        .map((k) => ({
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
