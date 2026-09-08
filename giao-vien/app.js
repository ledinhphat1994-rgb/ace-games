/* Ứng dụng quản lý lớp dành cho giáo viên chủ nhiệm.
   Điều hướng bằng dấu # trên thanh địa chỉ: #/tong-quan, #/diem-danh, ... */
import {
  $, $$, e, datNoiDung, api, homNay, ngayVN, ngayDayDu,
  ganDoiGiaoDien, nhac, khoiLoi, khoiDangTai,
  layNhanTaiKhoan, moBangThemeBg, ganNhacNen, nhanMucDo, giuViTriCuonKhiVe,
} from '/assets/js/chung.js';
import { moHopThoaiSoanThongBao } from '/assets/js/thong-bao-dialog.js';
import { moHopThoaiThemHoatDong } from '/assets/js/hoat-dong-lop-dialog.js';
import {
  tieuDeTrang, oThongKe, nut, truong, oNhap, oChon, moHopThoai, dongHopThoai, trangLichSuKhoiPhucChung, boiNgayVN,
} from '/assets/js/giao-dien.js';
import { themVaoHangDoi, soChoGui, dongBo, tuDongBoKhiCoMang } from '/assets/js/hang-doi.js';
import {
  trangThongKe, trangBaoCao, trangMaCaNhan, trangHinhAnh, trangThuVienAmThanh, trangThuVienVideo, trangNhatKyDangNhap,
  trangHinhAnhThungRac, trangThuVienAmThanhThungRac, trangThuVienVideoThungRac,
} from './trang-hoc-tap.js';
import { trangQuy, trangQuyLichSu } from './trang-quy.js';
import { trangThoiKhoaBieu, trangThoiKhoaBieuLichSu } from './trang-lich.js';
import { trangDiemDanhLichSu } from './trang-diem-danh-lich-su.js';

ganDoiGiaoDien($('#doiGiaoDien'));

const nutTheme = $('#nutThemeBg');
if (nutTheme) nutTheme.addEventListener('click', moBangThemeBg);

const KHUNG = $('#noiDung');

// Mỗi tuyến ứng với đúng một "quyenCan" phía máy chủ (functions/api/gv/*.js).
// null = CHỈ giáo viên chủ nhiệm (dữ liệu nhạy cảm: hồ sơ, điểm, thống kê từng em...).
const QUYEN_THEO_TUYEN = {
  'tong-quan': null,
  'diem-danh': 'diem-danh',
  'diem-danh-lich-su': 'diem-danh',
  // Học sinh: KHÔNG có quyenCan nào cấp được — trang quản lý hồ sơ học sinh chỉ dành cho giáo
  // viên chủ nhiệm; tài khoản đặc biệt chỉ xem danh sách qua Menu (trang lớp), không qua đây.
  'hoc-sinh': null,
  'hoat-dong-lop': ['hoat-dong-lop', 'hinh-anh', 'am-thanh', 'video'],
  'hoat-dong-lop-khoi-phuc': ['hoat-dong-lop', 'hinh-anh', 'am-thanh', 'video'],
  'thong-ke': null,
  'thong-bao': 'thong-bao',
  'thong-bao-khoi-phuc': 'thong-bao',
  'bao-cao': null,
  'ma-ca-nhan': null,
  'nhat-ky-dang-nhap': null,
  'hinh-anh': 'hinh-anh',
  'hinh-anh-thung-rac': 'hinh-anh',
  'thu-vien-am-thanh': 'am-thanh',
  'thu-vien-am-thanh-thung-rac': 'am-thanh',
  'thu-vien-video': 'video',
  'thu-vien-video-thung-rac': 'video',
  'quy': 'quy',
  'quy-lich-su': 'quy',
  'thoi-khoa-bieu': 'thoi-khoa-bieu',
  'thoi-khoa-bieu-lich-su': 'thoi-khoa-bieu',
  'thoi-khoa-bieu-xem': 'thoi-khoa-bieu',
  'thoi-khoa-bieu-khoi-phuc': 'thoi-khoa-bieu',
};

// Phiên đăng nhập hiện tại — nạp một lần khi mở trang, dùng để ẩn bớt menu cho tài khoản đặc biệt.
let PHIEN = { role: 'teacher', ten: '', vaiTro: '', quyen: [] };

function duocVaoTuyen(duong) {
  if (PHIEN.role === 'teacher') return true;
  const khoa = duong.replace(/^\//, '').split('/')[0];
  const can = QUYEN_THEO_TUYEN[khoa];
  if (can === undefined || can === null) return false;
  const cacCan = Array.isArray(can) ? can : [can];
  return cacCan.some((q) => PHIEN.quyen.includes(q));
}

// Mọi mục có thể xuất hiện làm "lối tắt nhanh" ở tab dưới của tài khoản cán sự — theo đúng thứ
// tự ưu tiên hiển thị. Điểm danh/Thủ quỹ đã có sẵn 2 chỗ cố định trong HTML (#tabDuoi); các mục
// còn lại (Thông báo, Hoạt động lớp, Thời khoá biểu, 3 thư viện) KHÔNG có chỗ cố định nào — tài
// khoản chỉ được cấp đúng những quyền đó (không có "diem-danh"/"quy") sẽ chỉ còn mỗi tab "Thêm"
// nếu không bù thêm lối tắt ở đây. Icon lấy y hệt icon dùng ở menu đầy đủ (#menuDayDu) cho nhất quán.
const LOI_TAT_THEO_QUYEN = [
  ['thong-bao', '#/thong-bao', 'Thông báo', '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'],
  ['hoat-dong-lop', '#/hoat-dong-lop', 'Hoạt động', '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'],
  ['thoi-khoa-bieu', '#/thoi-khoa-bieu', 'TKB', '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'],
  ['hinh-anh', '#/hinh-anh', 'Ảnh', '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'],
  ['am-thanh', '#/thu-vien-am-thanh', 'Âm thanh', '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 9l12-2"/>'],
  ['video', '#/thu-vien-video', 'Video', '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>'],
];
const TOI_DA_TAB_CHINH = 4;   // 4 lối tắt + "Thêm" = 5 tab, cùng mật độ với thanh của giáo viên

/** Bù thêm lối tắt cho những quyền KHÔNG có chỗ cố định trong #tabDuoi (xem LOI_TAT_THEO_QUYEN),
    chèn ngay trước tab "Thêm" — để tài khoản chỉ được cấp vd "Thông báo" vẫn có tab riêng thay vì
    chỉ còn mỗi "Thêm" để bấm vào mọi thứ. */
function themLoiTatTabDuoi() {
  const tabDuoi = document.getElementById('tabDuoi');
  if (!tabDuoi) return;
  const nutThem = tabDuoi.querySelector('a[href="#/them"]');
  if (!nutThem) return;

  let soTabChinh = tabDuoi.querySelectorAll('a').length - 1;   // trừ "Thêm"
  for (const [quyen, href, nhan, duongDan] of LOI_TAT_THEO_QUYEN) {
    if (soTabChinh >= TOI_DA_TAB_CHINH) break;
    if (!PHIEN.quyen.includes(quyen)) continue;
    if (tabDuoi.querySelector(`a[href="${href}"]`)) continue;   // đã có sẵn (không nên xảy ra, phòng hờ)

    const a = e('a');
    a.setAttribute('href', href);
    a.innerHTML = `<span class="bieu-tuong"><svg class="bieu-tuong-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">${duongDan}</svg></span>${nhan}`;
    tabDuoi.insertBefore(a, nutThem);
    soTabChinh++;
  }
}

/** Ẩn các mục trong menu (cột trái, tab dưới) mà tài khoản hiện tại không có quyền vào. */
function locMenuTheoQuyen() {
  // "Đổi lớp chủ nhiệm" chỉ có ý nghĩa với giáo viên (người có thể giữ mã của NHIỀU lớp) —
  // tài khoản cán sự chỉ gắn với đúng một lớp nên không cần mục này, dù nút tắt trên thanh
  // đầu trang (khác hẳn mục trong Menu này) vẫn luôn hiện với mọi tài khoản như bình thường.
  if (PHIEN.role !== 'teacher') {
    const mucDoiLop = document.getElementById('mucDoiLop');
    if (mucDoiLop) mucDoiLop.remove();
  }
  if (PHIEN.role === 'teacher') return;
  $$('.cot-trai a, .tab-duoi a, #menuDayDu a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#/')) return;   // bỏ qua "Xem trang lớp", "Đăng xuất"...
    if (href === '#/them') return;         // menu "Thêm" luôn hiện, tự lọc bên trong
    if (!duocVaoTuyen(href.slice(1))) a.remove();
  });
  themLoiTatTabDuoi();

  // Tab "Thêm" ở thanh dưới cũng đổi tên giống tiêu đề trang (xem trangThem) — với tài khoản cán
  // sự đây là toàn bộ khu quản lý của họ, không phải "vài mục thêm" như với giáo viên.
  const nutTabThem = document.querySelector('.tab-duoi a[href="#/them"]');
  if (nutTabThem) {
    // Không lấy text node ĐẦU TIÊN — đó là khoảng trắng/xuống dòng nằm TRƯỚC <span class="bieu-
    // tuong">, không phải chữ "Thêm" (nằm sau, cùng cấp). Lọc đúng node có chữ thật.
    const nutChu = Array.from(nutTabThem.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (nutChu) nutChu.textContent = 'Khu quản lý';
  }

  // Ẩn luôn tiêu đề nhóm nếu không còn mục nào trong nhóm đó (tài khoản đặc biệt chỉ có vài quyền).
  $$('.cot-trai .nhom-dieu-huong').forEach((nhom) => {
    if (!nhom.querySelector('a')) nhom.remove();
  });

  // Chỉ hiện tên + quyền (layNhanTaiKhoan) — bỏ hẳn phần "· Đang quản lý: <lớp>" nối thêm trước
  // đây: tên lớp đã hiện sẵn ở huy hiệu và tiêu đề ngay bên cạnh, nối thêm vào đây chỉ làm dòng
  // phụ đề dài dòng, dễ tràn dòng trên điện thoại. Áp dụng NHƯ NHAU cho mọi loại tài khoản (học
  // sinh thường, học sinh/người ngoài được cấp quyền, giáo viên chủ nhiệm).
  const hieuPhu = document.querySelector('.hieu-phu');
  if (hieuPhu) hieuPhu.textContent = layNhanTaiKhoan(PHIEN);
}

/* ================= Từ điển hiển thị ================= */

const DIEM_DANH = {
  co_mat:          { ten: 'Có mặt',        ky: '✓', lop: 'nhan-tot' },
  tre:             { ten: 'Đi trễ',        ky: 'T', lop: 'nhan-luuy' },
  vang_phep:       { ten: 'Vắng có phép',  ky: 'P', lop: 'nhan' },
  vang_khong_phep: { ten: 'Vắng không phép', ky: '✗', lop: 'nhan-xau' },
};

const TEN_BUOI = { sang: 'Buổi sáng', chieu: 'Buổi chiều', hoat_dong: 'Hoạt động' };

// Nhãn tương đối cho mốc sắp tới — chỉ để quét nhanh độ gấp, không thay ngày tuyệt đối
// (ngày dd/mm/yyyy vẫn luôn hiện cạnh nhãn này).
function nhanTuongDoi(ngay, homNayHienTai) {
  const soNgay = Math.round((new Date(ngay + 'T00:00:00Z') - new Date(homNayHienTai + 'T00:00:00Z')) / 86400000);
  if (soNgay === 0) return { chu: 'Hôm nay', lop: 'nhan-xau' };
  if (soNgay === 1) return { chu: 'Ngày mai', lop: 'nhan-luuy' };
  if (soNgay >= 2 && soNgay <= 7) return { chu: 'Tuần này', lop: 'nhan' };
  if (soNgay >= 8 && soNgay <= 14) return { chu: 'Tuần sau', lop: 'nhan-xam' };
  return null;
}



/* ================= Trang: Tổng quan ================= */

async function trangTongQuan() {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api('/api/gv/tong-quan');

  const dd = d.diemDanhHomNay || {};
  const daDiemDanh = Object.values(dd).reduce((a, b) => a + b, 0);

  const khung = e('div');
  khung.append(tieuDeTrang('Tổng quan', 'Bảng tin hằng ngày — ' + ngayDayDu(d.ngay) + ': việc cần làm, học sinh cần chú ý, không phải trang thống kê.'));

  const day = e('div', 'day-so');
  day.append(
    oThongKe(String(d.siSo), 'Sĩ số lớp'),
    oThongKe(String(dd.co_mat || 0), 'Có mặt hôm nay', 'tot'),
    oThongKe(String((dd.vang_phep || 0) + (dd.vang_khong_phep || 0)), 'Vắng hôm nay', 'luuy'),
    oThongKe(String(dd.vang_khong_phep || 0), 'Vắng không phép', 'xau')
  );
  khung.append(day);

  // --- Việc hôm nay: lối tắt hành động, để không phải chạy qua nhiều trang ---
  const theVh = e('div', 'the');
  theVh.style.cssText = 'margin-top:16px;border-color:var(--chinh)';
  theVh.append(e('h3', null, 'Việc hôm nay'));
  const dayTat = e('div', 'day-loc day-loc-deu');
  dayTat.style.margin = '10px 0 4px';
  dayTat.append(
    nut('💰 Ghi thu quỹ', 'nut-vien nut-nho', () => { location.hash = '#/quy'; }),
    nut('◈ Soạn thông báo', 'nut-vien nut-nho', () => soanThongBao(null, trangTongQuan))
  );
  theVh.append(dayTat);
  khung.append(theVh);

  if (!daDiemDanh) {
    const nhacNho = e('div', 'the');
    nhacNho.style.borderColor = 'var(--luu-y)';
    nhacNho.append(
      e('h3', null, 'Hôm nay chưa điểm danh'),
      e('p', 'trong', 'Bấm nút bên dưới để điểm danh nhanh cho cả lớp.'),
      nut('Điểm danh ngay', '', () => { location.hash = '#/diem-danh'; })
    );
    khung.append(nhacNho);
  } else {
    // Lớp học cả sáng lẫn chiều: tách rõ buổi nào đã điểm danh, buổi nào chưa.
    const theoBuoi = d.diemDanhHomNayTheoBuoi || {};
    const cacBuoiCoDiemDanh = Object.keys(theoBuoi);
    if (cacBuoiCoDiemDanh.length) {
      const theBuoi = e('div', 'the');
      theBuoi.append(e('h3', null, 'Điểm danh hôm nay theo buổi'));
      const day2 = e('div', 'day-loc');
      day2.style.marginTop = '8px';
      [['sang', 'Buổi sáng'], ['chieu', 'Buổi chiều'], ['hoat_dong', 'Hoạt động']].forEach(([ma, ten]) => {
        const tt = theoBuoi[ma];
        if (!tt) return;
        const soVang = (tt.vang_khong_phep || 0) + (tt.vang_phep || 0);
        day2.append(e('span', 'nhan ' + (soVang ? 'nhan-luuy' : 'nhan-tot'),
          `${ten}: ${tt.co_mat || 0} có mặt${soVang ? `, ${soVang} vắng` : ''}`));
      });
      theBuoi.append(day2);
      khung.append(theBuoi);
    }
  }

  const luoi = e('div', 'luoi luoi-2');
  luoi.style.marginTop = '18px';

  // --- Cần chú ý: 2 tín hiệu độc lập (chuyên cần / hạnh kiểm), không cộng trừ thành 1 điểm ẩn.
  // Vắng có phép và khen KHÔNG làm giảm mức cần chú ý của em khác — mỗi dòng luôn có lý do rõ ràng.
  const theVang = e('div', 'the');
  theVang.append(e('h3', null, 'Cần chú ý'), e('p', 'trong', 'Vắng không phép, đi trễ từ 2 lần, hoặc có vi phạm — 30 ngày gần nhất.'));
  const canChuY = d.canChuY || [];
  if (!canChuY.length) {
    theVang.append(e('p', 'trong', 'Không có em nào cần chú ý. Rất tốt.'));
  } else {
    const ds = e('div', 'ds-diem-danh');
    canChuY.forEach((h) => {
      const hang = e('div', 'hang-hs hang-can-chu-y');
      const tenBam = e('button', 'ten-bam ten');
      tenBam.type = 'button';
      tenBam.setAttribute('aria-label', 'Xem hồ sơ: ' + h.hoTen);
      tenBam.append(e('b', null, h.hoTen), e('small', null, h.lyDo));
      tenBam.addEventListener('click', () => { location.hash = '#/hoc-sinh/' + h.id; });
      hang.append(e('div', 'stt', h.id), tenBam);

      // Hành động ngay tại dòng — không bắt rời Tổng quan để xử lý (Action Proximity).
      const hanhDong = e('div', 'hanh-dong');
      hanhDong.append(
        nut('Liên hệ PH', 'nut-nhe nut-nho', () => ghiLienHe(h, trangTongQuan), 'Liên hệ phụ huynh của ' + h.hoTen)
      );
      hang.append(hanhDong);
      ds.append(hang);
    });
    theVang.append(ds);
  }
  luoi.append(theVang);

  // --- Hoàn cảnh cần quan tâm ---
  const theHc = e('div', 'the');
  theHc.append(e('h3', null, 'Hoàn cảnh cần quan tâm'));
  if (!d.hoanCanh.length) {
    theHc.append(e('p', 'trong', 'Chưa ghi nhận trường hợp nào.'));
  } else {
    const ul = e('div', 'ds-diem-danh');
    d.hoanCanh.forEach((h) => {
      // "Hoàn cảnh" là văn bản tự do, có thể dài cả câu — dùng bố cục hang-hs-doc (như Khoản
      // chi/Thủ quỹ) để xuống dòng bình thường thay vì nhét vào 1 nhãn tròn white-space:nowrap,
      // dễ tràn ngang trên điện thoại khi nội dung dài.
      const hang = e('div', 'hang-hs hang-hs-doc');
      const dong1 = e('div', 'hang-hs-dong1');
      const khoiTrai = e('div', 'hs-khoi-trai');
      khoiTrai.append(e('div', 'stt', h.id));
      const thongTin = e('div', 'hs-thong-tin');
      const dongTen = e('div', 'hs-ten-to');
      dongTen.append(e('span', 'hs-ho-ten', h.hoTen));
      thongTin.append(dongTen, e('div', 'hs-chi-tiet-dong', h.hoanCanh));
      khoiTrai.append(thongTin);
      dong1.append(khoiTrai);
      hang.append(dong1);
      ul.append(hang);
    });
    theHc.append(ul);
  }
  luoi.append(theHc);

  // --- Theo dõi đầu năm ---
  const theTd = e('div', 'the');
  theTd.append(e('h3', null, 'Theo dõi đầu năm'));
  const nhomMuc = {};
  d.theoDoi.forEach((t) => {
    nhomMuc[t.muc] = nhomMuc[t.muc] || [];
    nhomMuc[t.muc].push(t);
  });
  const TEN_MUC = { sgk: 'Sách giáo khoa', dong_phuc: 'Đồng phục' };
  Object.entries(nhomMuc).forEach(([muc, ds]) => {
    theTd.append(e('div', 'the-nhan', TEN_MUC[muc] || muc));
    const hop = e('div', 'day-loc');
    hop.style.margin = '6px 0 12px';
    ds.sort((a, b) => b.n - a.n).forEach((t) => {
      const l = /Chưa/.test(t.trangThai) ? 'nhan-xau' : /thiếu/i.test(t.trangThai) ? 'nhan-luuy' : 'nhan-tot';
      hop.append(e('span', 'nhan ' + l, `${t.trangThai}: ${t.n}`));
    });
    theTd.append(hop);
  });
  luoi.append(theTd);

  // --- Sắp tới ---
  const theKh = e('div', 'the');
  theKh.append(e('h3', null, 'Sắp tới'));
  if (!d.keHoachSapToi.length) {
    theKh.append(e('p', 'trong', 'Không có mốc nào sắp tới.'));
  } else {
    d.keHoachSapToi.forEach((k) => {
      const hang = e('div', 'hang-hs');
      const ten = e('div', 'ten');
      ten.append(e('b', null, k.tieuDe), e('small', null, ngayDayDu(k.ngay)));
      hang.append(ten);
      const nhanTd = nhanTuongDoi(k.ngay, d.ngay);
      if (nhanTd) hang.append(e('span', 'nhan ' + nhanTd.lop, nhanTd.chu));
      theKh.append(hang);
    });
  }
  luoi.append(theKh);

  khung.append(luoi);

  datNoiDung(KHUNG, khung);
}

/* ---------- Điểm danh linh động: đánh dấu hàng loạt cho trường hợp đặc biệt (đi bồi dưỡng,
   lao động, hoạt động ngoại khoá…) — chọn lý do có sẵn hoặc gõ riêng, tích những em liên
   quan (hoặc chọn tất cả), bấm MỘT nút là lưu thẳng lên máy chủ ngay — không phải qua bước
   "áp dụng" rồi mới đi tìm nút "Lưu điểm danh" ở chỗ khác như trước, dễ gây hiểu lầm là
   chưa lưu được. ---------- */
const LY_DO_NHANH = ['Đi học bồi dưỡng', 'Lao động', 'Hoạt động ngoại khoá', 'Việc riêng có phép'];

function moHopThoaiGhiChuDiemDanh(h, ttHienTai, ldHienTai, onSave) {
  const noiDung = e('div');

  // Thẻ thông tin học sinh
  const thongTin = e('div');
  thongTin.style.cssText = 'padding:10px 14px;background:var(--nen-chim);border-radius:10px;margin-bottom:14px;';
  thongTin.append(
    Object.assign(e('b', null, `${h.id}. ${h.hoTen}`), { style: 'font-size:15.5px;display:block;' }),
    Object.assign(e('small', null, `${h.lopNghe || 'Chưa xếp'} • Trạng thái: ${ttHienTai && DIEM_DANH[ttHienTai] ? DIEM_DANH[ttHienTai].ten : 'Chưa điểm danh'}`), { style: 'color:var(--chu-nhat);font-size:12.5px;' })
  );
  noiDung.append(thongTin);

  // Chọn trạng thái điểm danh kèm theo
  const oTt = oChon('gcTrangThai', [
    ['', '— Giữ nguyên trạng thái —'],
    ...Object.entries(DIEM_DANH).map(([k, v]) => [k, `${v.ky} ${v.ten}`])
  ], ttHienTai || 'vang_phep');
  noiDung.append(truong('Trạng thái điểm danh', oTt, 'Có thể đổi trạng thái cùng lúc ghi lý do'));

  // Ô nhập lý do
  const oLd = oNhap('gcLyDo', 'text', ldHienTai || '', 'Ví dụ: Sốt xuất huyết, gia đình có việc...');
  oLd.style.marginTop = '4px';

  // Hàng chip gợi ý lý do nhanh
  const hangGoiY = e('div', 'day-loc');
  hangGoiY.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 14px;';
  const GOI_Y_LY_DO = [
    'Bị ốm / Sốt',
    'Khám bệnh có phép',
    'Gia đình có việc',
    'Xe hỏng / Đến muộn',
    'Đi thi / Bồi dưỡng HSG',
    'Hoạt động ngoại khoá',
    'Lao động trường',
    'Nghỉ không phép'
  ];
  GOI_Y_LY_DO.forEach((g) => {
    const chip = e('button', 'vien-loc', g);
    chip.type = 'button';
    chip.style.cssText = 'font-size:12px;padding:4px 9px;cursor:pointer;';
    chip.addEventListener('click', () => {
      oLd.value = g;
      oLd.focus();
    });
    hangGoiY.append(chip);
  });

  noiDung.append(
    truong('Lý do / Ghi chú chính xác', oLd, 'Bấm chọn nhanh lý do hoặc tự gõ chi tiết:'),
    hangGoiY
  );

  const cacNut = [
    nut('💾 Lưu ghi chú', 'nut-chinh', () => {
      const val = oLd.value.trim();
      const ttChon = oTt.value;
      onSave(val, ttChon);
      dongHopThoai();
    }),
  ];

  if (ldHienTai) {
    cacNut.push(
      nut('🗑️ Xoá ghi chú', 'nut-vien', () => {
        onSave('', oTt.value);
        dongHopThoai();
      })
    );
  }

  cacNut.push(nut('Đóng', 'nut-nhe', dongHopThoai));

  moHopThoai(`📝 Ghi chú lý do — ${h.hoTen}`, noiDung, cacNut);
  setTimeout(() => oLd.focus(), 80);
}

// Cache lịch sử điểm danh (TẤT CẢ ngày/buổi/loại) theo từng học sinh — dùng chung cho cả tab
// Điểm danh chính lẫn Điểm danh linh động (cùng dữ liệu gốc bảng diem_danh), để bấm tìm ở tab
// này rồi qua tab kia không phải tải lại. Xoá sạch sau mỗi lần lưu điểm danh (searchLuu bên
// dưới) vì lúc đó lịch sử của (các) học sinh vừa lưu đã cũ.
const lichSuDiemDanhCache = new Map();

// Sửa MỘT bản ghi điểm danh cụ thể (ngày/buổi/loại đã biết rõ) — lưu NGAY qua API, không qua
// hàng đợi "Lưu điểm danh" như khi bấm nút trạng thái trực tiếp trên hàng học sinh: đây là sửa
// một bản ghi CŨ tìm thấy khi tra cứu, thao tác đơn lẻ nên lưu ngay cho rõ ràng, đỡ phải nhớ
// thêm bước "Lưu" tổng ở cuối trang. Hiện đủ ngày/buổi/loại để không nhầm đang sửa buổi nào.
function moHopThoaiSuaLichSuDiemDanh(h, banGhi, veLai) {
  const laPhu = banGhi.buoi.endsWith('_phu');
  const buoiGoc = banGhi.buoi.replace(/_phu$/, '');

  const thongTin = e('div');
  thongTin.style.cssText = 'padding:10px 14px;background:var(--nen-chim);border-radius:10px;margin-bottom:14px;';
  thongTin.append(
    Object.assign(e('b', null, h.hoTen), { style: 'font-size:15.5px;display:block;' }),
    Object.assign(e('small', null, `${ngayVN(banGhi.ngay)} · ${TEN_BUOI[buoiGoc] || buoiGoc} · ${laPhu ? 'Điểm danh linh động' : 'Điểm danh chính'}`), { style: 'color:var(--chu-nhat);font-size:12.5px;' })
  );

  const oTt = oChon('suaLsTt', [
    ['', '✕ Chưa điểm danh (xoá bản ghi)'],
    ...Object.entries(DIEM_DANH).map(([k, v]) => [k, `${v.ky} ${v.ten}`]),
  ], banGhi.trangThai || '');

  const oLd = oNhap('suaLsLd', 'text', banGhi.lyDo || '', 'Lý do / ghi chú (không bắt buộc)');

  moHopThoai(`Sửa điểm danh — ${h.hoTen}`, [
    thongTin,
    truong('Trạng thái', oTt),
    truong('Lý do / Ghi chú', oLd),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('💾 Lưu', 'nut-chinh', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/diem-danh', {
          method: 'POST',
          than: {
            ngay: banGhi.ngay, buoi: buoiGoc, loai: laPhu ? 'phu' : 'chinh',
            ghiNhan: [{ hocSinhId: h.id, trangThai: oTt.value || null, lyDo: oLd.value.trim() }],
          },
        });
        dongHopThoai();
        nhac('Đã lưu điểm danh', 'tot');
        lichSuDiemDanhCache.delete(h.id);
        if (veLai) veLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
  setTimeout(() => oLd.focus(), 80);
}

// Khối lịch sử hiện dưới MỖI học sinh khớp tìm kiếm — hiện TẤT CẢ ngày/buổi/loại đã từng điểm
// danh (kể cả đúng buổi đang xem — trước đây loại trừ vì tưởng đã sửa được ở hàng học sinh phía
// trên, nhưng khi đang tìm kiếm thì hàng đó đã bị bỏ hẳn (xem veKhuVucChinh/veKhuVucPhu), nên
// đây giờ là NƠI DUY NHẤT để xem/sửa, không được thiếu buổi nào). Mọi loại (có mặt/trễ/vắng...)
// đều dùng chung đúng một kiểu thẻ — bấm "Sửa" mở popup rõ ngày/buổi/loại thay vì nhảy sang chỗ
// khác như trước.
function veLichSuTimThay(h, veLai) {
  const khoi = e('div', 'lich-su-tim-dd');

  const tieuDe = e('div', 'lich-su-tim-dd-ten');
  tieuDe.append(e('b', null, h.hoTen), e('small', null, h.lopNghe || ''));
  khoi.append(tieuDe);

  if (!lichSuDiemDanhCache.has(h.id)) {
    lichSuDiemDanhCache.set(h.id, 'dang-tai');
    api('/api/gv/diem-danh?hocSinhId=' + h.id).then((d) => {
      lichSuDiemDanhCache.set(h.id, d.lichSu || []);
      veLai();
    }).catch((err) => {
      // KHÔNG cache lỗi thành mảng rỗng — nếu không, một lần lỗi mạng/quyền sẽ hiện nhầm thành
      // "chưa có lịch sử" mãi mãi cho tới khi tải lại trang, dù học sinh thật ra có lịch sử.
      lichSuDiemDanhCache.delete(h.id);
      khoi.replaceChildren(e('p', 'trong', err.message || 'Không tải được lịch sử điểm danh.'));
      veLai();
    });
  }
  const ls = lichSuDiemDanhCache.get(h.id);
  if (ls === 'dang-tai') {
    khoi.append(e('p', 'trong', 'Đang tải lịch sử điểm danh…'));
    return khoi;
  }
  if (!ls || !ls.length) {
    khoi.append(e('p', 'trong', 'Chưa có lịch sử điểm danh nào.'));
    return khoi;
  }
  // Thống kê tổng của em này — TÍNH Y HỆT cách trang Hồ sơ học sinh (#/hoc-sinh/:id) đang làm,
  // để một em luôn ra đúng MỘT con số duy nhất dù xem ở đâu, không phải tự cộng nhẩm từ danh
  // sách bên dưới.
  const dem = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
  ls.forEach((x) => { if (dem[x.trangThai] !== undefined) dem[x.trangThai]++; });
  const daySo = e('div', 'day-so');
  daySo.style.cssText = 'margin-bottom:10px;';
  daySo.append(
    oThongKe(String(dem.co_mat), 'Có mặt', 'tot'),
    oThongKe(String(dem.tre), 'Đi trễ', 'luuy'),
    oThongKe(String(dem.vang_phep), 'Vắng có phép'),
    oThongKe(String(dem.vang_khong_phep), 'Vắng không phép', 'xau')
  );
  khoi.append(daySo);

  // API trả về mới → cũ (ngay DESC) để .slice() lấy đúng 15 lần GẦN ĐÂY NHẤT, sau đó đảo lại
  // thành cũ → mới (từ quá khứ tới hiện tại) khi hiển thị.
  ls.slice(0, 15).reverse().forEach((x) => {
    const laPhu = x.buoi.endsWith('_phu');
    const buoiGoc = x.buoi.replace(/_phu$/, '');
    const tt2 = DIEM_DANH[x.trangThai] || {};
    const the = e('div', 'the-lich-su-dd');
    const dong1 = e('div', 'dong-lich-su-dd-dong1');
    dong1.append(
      e('span', 'nhan ' + (tt2.lop || ''), tt2.ten || x.trangThai),
      nut('Sửa', 'nut-nhe nut-nho', () => moHopThoaiSuaLichSuDiemDanh(h, x, veLai))
    );
    const phanDoan = [ngayVN(x.ngay), TEN_BUOI[buoiGoc] || buoiGoc];
    if (x.lyDo) phanDoan.push(x.lyDo);
    if (laPhu) phanDoan.push('Linh động');
    const dong2 = e('div', 'dong-lich-su-dd-dong2', phanDoan.join(' · '));
    the.append(dong1, dong2);
    khoi.append(the);
  });
  return khoi;
}

function veTabDiemDanhNhanh(danhSach, thayDoi, lyDoMoi, veLai, luuDiemDanh, trangThaiHienTai, lyDoHienTai, timPhuBanDau, datTimPhu, ngay, buoi, nhayDenNgayBuoi) {
  const khung = e('div');
  let timPhu = timPhuBanDau || '';

  const the = e('div', 'the');
  the.append(e('p', 'trong',
    'Dùng cho trường hợp đặc biệt: đi bồi dưỡng, lao động, hoạt động ngoại khoá… '
    + 'Bấm trực tiếp vào cột trạng thái của từng em — giống hệt cách thao tác ở Điểm danh chính, '
    + 'chỉ khác là lưu vào một "sổ" riêng, không ảnh hưởng điểm danh chính.'));

  // Lý do chung: gõ/hoặc chọn nhanh MỘT lần, dùng làm gợi ý điền sẵn khi mở ghi chú cho
  // từng em (📝) — đỡ phải gõ lại nếu nhiều em cùng một lý do, nhưng không ép áp dụng
  // hàng loạt như trước (mỗi em vẫn bấm cột trạng thái của riêng mình).
  const oLyDoChung = oNhap('ddnLyDoChung', 'text', '', 'Ví dụ: Đi học bồi dưỡng học sinh giỏi');
  the.append(truong('Lý do chung (gợi ý sẵn khi ghi chú từng em)', oLyDoChung, 'Chọn nhanh bên dưới hoặc gõ riêng'));

  const hangChip = e('div', 'day-loc');
  hangChip.style.marginTop = '8px';
  LY_DO_NHANH.forEach((c) => {
    const chip = e('button', 'vien-loc', c);
    chip.type = 'button';
    chip.addEventListener('click', () => { oLyDoChung.value = c; oLyDoChung.focus(); });
    hangChip.append(chip);
  });
  the.append(hangChip);
  khung.append(the);

  // Ô tìm kiếm học sinh — cùng cơ chế với Điểm danh chính: chỉ rebuild "khuVucPhu" khi gõ
  // (không gọi veLai() để không mất focus), và "Áp dụng nhanh" chỉ áp lên đúng danh sách tìm
  // thấy. timPhu lưu ở ngoài (trangDiemDanh) qua datTimPhu nên không mất khi bấm nút khác.
  const oTimPhu = oNhap('ddTimPhu', 'search', timPhu, 'Tìm theo tên, tổ/lớp nghề, hoặc STT…');
  oTimPhu.addEventListener('input', (ev) => {
    timPhu = ev.target.value;
    datTimPhu(timPhu);
    veKhuVucPhu();
  });
  khung.append(truong('🔎 Tìm học sinh', oTimPhu));

  const khuVucPhu = e('div');
  khung.append(khuVucPhu);

  const dsLocPhu = () => {
    const q = timPhu.trim().toLowerCase();
    if (!q) return danhSach;
    return danhSach.filter((h) =>
      h.hoTen.toLowerCase().includes(q) ||
      String(h.id).includes(q) ||
      (h.lopNghe || '').toLowerCase().includes(q)
    );
  };

  function veKhuVucPhu() {
    const dsLoc = dsLocPhu();
    const dangLoc = Boolean(timPhu.trim());
    const khungCon = e('div');

    if (dangLoc && !dsLoc.length) {
      khungCon.append(e('p', 'trong', `Không tìm thấy học sinh nào khớp "${timPhu.trim()}".`));
      datNoiDung(khuVucPhu, khungCon);
      return;
    }

    // Thanh áp dụng nhanh cho cả lớp (hoặc đúng danh sách tìm thấy) & Xoá tất cả ghi chú —
    // giống hệt Điểm danh chính.
    const theApDungNhanh = e('div', 'the');
    theApDungNhanh.style.cssText = 'padding:12px 14px;margin:12px 0;';
    theApDungNhanh.append(Object.assign(
      e('div', null, dangLoc ? `⚡ Áp dụng nhanh cho ${dsLoc.length} học sinh tìm thấy` : '⚡ Áp dụng nhanh cho cả lớp'),
      { style: 'font-size:12.5px;font-weight:700;color:var(--chu);margin-bottom:8px;' }
    ));
    const dayApDungNhanh = e('div', 'day-loc day-loc-deu-co-gian');
    Object.entries(DIEM_DANH).forEach(([ma, tt2]) => {
      const caLopDangChon = dsLoc.length > 0 &&
        dsLoc.every((h) => trangThaiHienTai(h.id, h.trangThai) === ma);

      const b = e('button', 'vien-loc', `${tt2.ky} ${tt2.ten}`);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(caLopDangChon));
      b.title = caLopDangChon
        ? `Bỏ chọn tất cả "${tt2.ten}"`
        : `Đặt "${tt2.ten}" cho ${dangLoc ? 'danh sách tìm thấy' : 'cả lớp'} (bấm lại để bỏ chọn tất cả)`;
      b.addEventListener('click', () => {
        dsLoc.forEach((h) => thayDoi.set(h.id, caLopDangChon ? null : ma));
        veLai();
      });
      dayApDungNhanh.append(b);
    });

    const soCoGhiChu = dsLoc.filter((h) => lyDoHienTai(h.id, h.lyDo)).length;
    const nutXoaGhiChuPhu = e('button', 'vien-loc', `🗑 Xoá tất cả ghi chú${soCoGhiChu ? ` (${soCoGhiChu})` : ''}`);
    nutXoaGhiChuPhu.type = 'button';
    if (soCoGhiChu) { nutXoaGhiChuPhu.style.color = 'var(--xau)'; nutXoaGhiChuPhu.style.borderColor = 'var(--xau)'; }
    nutXoaGhiChuPhu.addEventListener('click', () => {
      if (!soCoGhiChu) return nhac('Hiện không có học sinh nào có ghi chú trong điểm danh phụ.', 'nhe');
      moHopThoai('Xoá tất cả ghi chú điểm danh phụ?', [
        e('p', null, `Bạn có chắc muốn xoá toàn bộ ghi chú của ${soCoGhiChu} học sinh${dangLoc ? ' (trong danh sách đang tìm thấy)' : ''} trong điểm danh phụ buổi này?`),
        e('p', 'trong', 'Thao tác này chỉ xoá ghi chú trong điểm danh phụ, hoàn toàn không ảnh hưởng điểm danh chính.')
      ], [
        nut('Huỷ', 'nut-nhe', dongHopThoai),
        nut('Xoá tất cả ghi chú', 'nut-xau', () => {
          dsLoc.forEach((h) => { if (lyDoHienTai(h.id, h.lyDo)) lyDoMoi.set(h.id, ''); });
          dongHopThoai();
          nhac('Đã xoá sạch ghi chú điểm danh phụ (hãy bấm "Lưu điểm danh")', 'tot');
          veLai();
        })
      ]);
    });
    dayApDungNhanh.append(nutXoaGhiChuPhu);
    theApDungNhanh.append(dayApDungNhanh);
    khungCon.append(theApDungNhanh);

    // Chú thích các nút trạng thái — đặt TRƯỚC danh sách (giống Điểm danh chính) để giáo viên
    // hiểu ký hiệu ✓/T/P/✗/📝 ngay khi vừa xem trang, khỏi phải cuộn qua hết cả lớp mới thấy.
    const chuThich = e('div', 'chu-thich');
    [['✓ Có mặt', 'var(--tot)'], ['T Đi trễ', 'var(--luu-y)'],
     ['P Vắng có phép', 'var(--chinh)'], ['✗ Vắng không phép', 'var(--xau)']]
      .forEach(([chu, mau]) => {
        const s = e('span');
        const i = e('i');
        i.style.background = mau;
        s.append(i, document.createTextNode(chu));
        chuThich.append(s);
      });
    khungCon.append(chuThich);

    // Danh sách học sinh (đúng danh sách tìm thấy) — CÙNG một kiểu hàng với Điểm danh chính:
    // cột trạng thái riêng cho từng em (✓/T/P/✗), bấm lại để bỏ chọn, cộng nút 📝 ghi chú riêng.
    const ds = e('div', 'ds-diem-danh');
    ds.style.marginTop = '10px';
    // Đang tìm kiếm với ít kết quả (≤ 8 em) — hiện hẳn TOÀN BỘ lịch sử điểm danh của đúng những
    // em đó thay cho hàng bấm nhanh ✓/T/P/✗ (đằng nào cũng đã có thanh "⚡ Áp dụng nhanh" phía
    // trên lo phần bấm nhanh này rồi — lặp thêm một hàng bấm-nhanh riêng cho từng em là dư thừa,
    // lại khác kiểu thẻ hẳn với chính khối lịch sử ngay bên dưới nó). Giới hạn số em hiện lịch sử
    // (dsLoc nhỏ) để tránh gọi API dồn dập khi gõ từ khoá chung chung khớp cả chục em.
    const dangHienLichSu = dangLoc && dsLoc.length <= 8;
    dsLoc.forEach((h) => {
      const tt = trangThaiHienTai(h.id, h.trangThai);
      const ld = lyDoHienTai(h.id, h.lyDo);
      const hang = e('div', 'hang-hs' + (tt ? '' : ' chua-ghi'));

      if (dangHienLichSu) {
        hang.append(veLichSuTimThay(h, veKhuVucPhu));
        ds.append(hang);
        return;
      }

      const ten = e('div', 'ten');
      ten.append(e('b', null, h.hoTen), e('small', null, h.lopNghe || ''));

      const moGhiChu = () => {
        moHopThoaiGhiChuDiemDanh(h, tt, ld || oLyDoChung.value, (val, ttChon) => {
          lyDoMoi.set(h.id, val);
          if (ttChon) thayDoi.set(h.id, ttChon);
          else if (!thayDoi.has(h.id) && val && !tt) thayDoi.set(h.id, 'vang_phep');
          veLai();
        });
      };

      if (ld) {
        const dongLd = e('div', 'dong-ly-do');
        dongLd.title = `Ghi chú: ${ld} — Bấm để sửa`;
        dongLd.append(e('span', null, '💬'), Object.assign(e('span', 'dong-ly-do-chu', ld)));
        dongLd.addEventListener('click', (ev) => { ev.stopPropagation(); moGhiChu(); });
        ten.append(dongLd);
      }

      hang.append(e('div', 'stt', h.id), ten);

      const nhom = e('div', 'nhom-chon');
      Object.entries(DIEM_DANH).forEach(([ma, tt2]) => {
        const b = e('button', null, tt2.ky);
        b.type = 'button';
        b.dataset.tt = ma;
        b.title = tt2.ten + ' — bấm lại để bỏ chọn';
        b.setAttribute('aria-label', `${h.hoTen}: ${tt2.ten}`);
        b.setAttribute('aria-pressed', String(tt === ma));
        b.addEventListener('click', () => {
          thayDoi.set(h.id, tt === ma ? null : ma);
          veLai();
        });
        nhom.append(b);
      });

      const nutGc = e('button', 'nut-icon-ghi-chu' + (ld ? ' da-co-ghi-chu' : ''));
      nutGc.type = 'button';
      nutGc.textContent = '📝';
      nutGc.title = ld ? `Ghi chú: "${ld}" — Bấm để sửa` : `Thêm ghi chú/lý do cho ${h.hoTen}`;
      nutGc.setAttribute('aria-label', `Ghi chú cho ${h.hoTen}`);
      nutGc.addEventListener('click', (ev) => { ev.stopPropagation(); moGhiChu(); });
      nhom.append(nutGc);

      hang.append(nhom);
      ds.append(hang);
    });
    if (dangLoc && dsLoc.length > 8) {
      khungCon.append(e('p', 'trong', `Có ${dsLoc.length} học sinh khớp — gõ tên cụ thể hơn (còn ≤ 8 kết quả) để xem lịch sử điểm danh từng em.`));
    }
    khungCon.append(ds);

    datNoiDung(khuVucPhu, khungCon);
  }

  veKhuVucPhu();

  // Thanh lưu riêng của Điểm danh linh động — vẫn một nút lưu duy nhất, lưu thẳng toàn bộ
  // thayDoi/lyDoMoi đã đổi (kể cả qua "Áp dụng nhanh" lẫn từng ô 📝).
  const cacIdThayDoi = new Set([...thayDoi.keys(), ...lyDoMoi.keys()]);
  if (cacIdThayDoi.size) {
    const thanhLuu = e('div', 'thanh-luu');
    thanhLuu.append(e('div', 'thong-tin', `${cacIdThayDoi.size} thay đổi chưa lưu`));
    thanhLuu.append(
      nut('Bỏ', 'nut-nhe nut-nho', () => { thayDoi.clear(); lyDoMoi.clear(); veLai(); }),
      nut('Lưu điểm danh', '', (ev) => luuDiemDanh(ev.currentTarget))
    );
    khung.append(thanhLuu);
  }

  return khung;
}

/* ================= Trang: Điểm danh ================= */

async function trangDiemDanh() {
  datNoiDung(KHUNG, khoiDangTai());

  let ngay = sessionStorage.getItem('dd-ngay') || homNay();
  let buoi = sessionStorage.getItem('dd-buoi') || 'sang';
  let tabCon = 'ngay';   // 'ngay' = Điểm danh chính | 'nhanh' = Điểm danh linh động
  let timChinh = '';     // ô tìm kiếm học sinh ở Điểm danh chính
  let timPhu = '';       // ô tìm kiếm học sinh ở Điểm danh linh động

  let duLieuChinh = null;
  const thayDoiChinh = new Map();
  const lyDoMoiChinh = new Map();

  let duLieuPhu = null;
  const thayDoiPhu = new Map();
  const lyDoMoiPhu = new Map();

  function trangThaiHienTaiChinh(id, trangThaiCu) {
    return thayDoiChinh.has(id) ? thayDoiChinh.get(id) : trangThaiCu;
  }
  function lyDoHienTaiChinh(id, lyDoCu) {
    return lyDoMoiChinh.has(id) ? lyDoMoiChinh.get(id) : (lyDoCu || '');
  }

  function trangThaiHienTaiPhu(id, trangThaiCu) {
    return thayDoiPhu.has(id) ? thayDoiPhu.get(id) : trangThaiCu;
  }
  function lyDoHienTaiPhu(id, lyDoCu) {
    return lyDoMoiPhu.has(id) ? lyDoMoiPhu.get(id) : (lyDoCu || '');
  }

  async function taiChinh() {
    duLieuChinh = await api(`/api/gv/diem-danh?ngay=${ngay}&buoi=${buoi}&loai=chinh`);
    thayDoiChinh.clear();
    lyDoMoiChinh.clear();
  }

  async function taiPhu() {
    duLieuPhu = await api(`/api/gv/diem-danh?ngay=${ngay}&buoi=${buoi}&loai=phu`);
    thayDoiPhu.clear();
    lyDoMoiPhu.clear();
  }

  async function tai() {
    if (tabCon === 'nhanh') {
      await taiPhu();
    } else {
      await taiChinh();
    }
    ve();
  }

  // Bấm "Sửa" trên một dòng lịch sử tìm thấy (veLichSuTimThay) — nhảy thẳng ngày/buổi/tab của
  // đúng bản ghi đó rồi tải lại, thay vì bắt giáo viên tự dò lại ngày/buổi bằng tay. Giữ nguyên
  // từ khoá đang tìm khi đổi tab (chinh <-> phu) để vẫn thấy đúng em đó ngay khi trang tải xong.
  function nhayDenNgayBuoi(ngayMoi, buoiMoi, laPhu, tuKhoaTim) {
    ngay = ngayMoi;
    buoi = buoiMoi;
    tabCon = laPhu ? 'nhanh' : 'ngay';
    sessionStorage.setItem('dd-ngay', ngay);
    sessionStorage.setItem('dd-buoi', buoi);
    if (laPhu) timPhu = tuKhoaTim; else timChinh = tuKhoaTim;
    datNoiDung(KHUNG, khoiDangTai());
    tai();
  }

  function tinhSo() {
    const dem = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
    if (!duLieuChinh) return dem;
    duLieuChinh.danhSach.forEach((h) => {
      const tt = trangThaiHienTaiChinh(h.id, h.trangThai);
      if (tt && dem[tt] !== undefined) dem[tt]++;
    });
    return dem;
  }

  function tinhSoPhu() {
    const dem = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
    if (!duLieuPhu) return dem;
    duLieuPhu.danhSach.forEach((h) => {
      const tt = trangThaiHienTaiPhu(h.id, h.trangThai);
      if (tt && dem[tt] !== undefined) dem[tt]++;
    });
    return dem;
  }

  async function luuDiemDanhChinh(nutBam) {
    const cacId = new Set([...thayDoiChinh.keys(), ...lyDoMoiChinh.keys()]);
    const ghiNhan = [...cacId].map((hocSinhId) => {
      const h = duLieuChinh.danhSach.find((x) => x.id === hocSinhId);
      const trangThai = trangThaiHienTaiChinh(hocSinhId, h?.trangThai);
      const lyDo = lyDoHienTaiChinh(hocSinhId, h?.lyDo);
      return { hocSinhId, trangThai, lyDo };
    });

    if (nutBam) { nutBam.disabled = true; nutBam.textContent = 'Đang lưu…'; }
    try {
      await api('/api/gv/diem-danh', { method: 'POST', than: { ngay, buoi, loai: 'chinh', ghiNhan } });
      nhac('Đã lưu điểm danh chính', 'tot');
      cacId.forEach((id) => lichSuDiemDanhCache.delete(id));
      await taiChinh();
      ve();
    } catch (err) {
      if (err.ngoaiTuyen) {
        themVaoHangDoi({ ngay, buoi, loai: 'chinh', ghiNhan });
        thayDoiChinh.clear();
        lyDoMoiChinh.clear();
        nhac('Đang mất mạng — đã lưu tạm trong máy, sẽ tự gửi khi có mạng.', 'xau');
        ve();
        return;
      }
      nhac(err.message, 'xau');
      if (nutBam) { nutBam.disabled = false; nutBam.textContent = 'Lưu điểm danh'; }
    }
  }

  async function luuDiemDanhPhu(nutBam) {
    const cacId = new Set([...thayDoiPhu.keys(), ...lyDoMoiPhu.keys()]);
    const ghiNhan = [...cacId].map((hocSinhId) => {
      const h = duLieuPhu.danhSach.find((x) => x.id === hocSinhId);
      const trangThai = trangThaiHienTaiPhu(hocSinhId, h?.trangThai);
      const lyDo = lyDoHienTaiPhu(hocSinhId, h?.lyDo);
      return { hocSinhId, trangThai, lyDo };
    });

    if (nutBam) { nutBam.disabled = true; nutBam.textContent = 'Đang lưu…'; }
    try {
      await api('/api/gv/diem-danh', { method: 'POST', than: { ngay, buoi, loai: 'phu', ghiNhan } });
      nhac('Đã lưu điểm danh phụ', 'tot');
      cacId.forEach((id) => lichSuDiemDanhCache.delete(id));
      await taiPhu();
      ve();
    } catch (err) {
      if (err.ngoaiTuyen) {
        themVaoHangDoi({ ngay, buoi, loai: 'phu', ghiNhan });
        thayDoiPhu.clear();
        lyDoMoiPhu.clear();
        nhac('Đang mất mạng — đã lưu tạm trong máy, sẽ tự gửi khi có mạng.', 'xau');
        ve();
        return;
      }
      nhac(err.message, 'xau');
      if (nutBam) { nutBam.disabled = false; nutBam.textContent = 'Lưu điểm danh'; }
    }
  }

  function ve() {
    const khung = e('div');

    const oNgay = e('input', 'o-nhap');
    oNgay.type = 'date';
    oNgay.value = ngay;
    oNgay.addEventListener('change', async () => {
      ngay = oNgay.value || homNay();
      sessionStorage.setItem('dd-ngay', ngay);
      await tai();
    });

    const chonBuoi = oChon('chonBuoi', Object.entries(TEN_BUOI), buoi);
    chonBuoi.addEventListener('change', async () => {
      buoi = chonBuoi.value;
      sessionStorage.setItem('dd-buoi', buoi);
      await tai();
    });

    khung.append(tieuDeTrang('Điểm danh', ngayDayDu(ngay),
      nut('🛡️ Lịch sử & khôi phục', 'nut-vien', () => { location.hash = '#/diem-danh-lich-su'; })
    ));

    const cho = soChoGui();
    if (cho) {
      const dai = e('div', 'canh-bao');
      dai.append(document.createTextNode(`${cho} lần điểm danh đang chờ gửi lên (lúc đó máy mất mạng). `));
      dai.append(nut('Gửi ngay', 'nut-nho', async (ev) => {
        ev.currentTarget.disabled = true;
        const kq = await dongBo();
        nhac(kq.conLai ? `Đã gửi ${kq.daGui}, còn ${kq.conLai} chờ tiếp` : 'Đã gửi hết', kq.conLai ? 'xau' : 'tot');
        await tai();
      }));
      khung.append(dai);
    }

    const hangChon = e('div', 'chon-ngay');
    hangChon.append(boiNgayVN(oNgay), chonBuoi);
    khung.append(hangChon);

    const hopTabCon = e('div', 'day-loc day-loc-deu');
    hopTabCon.id = 'diem-danh-tab-con';
    hopTabCon.style.margin = '14px 0';
    [['ngay', '📋 Điểm danh chính'], ['nhanh', '⚡ Điểm danh linh động']].forEach(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(tabCon === ma));
      b.addEventListener('click', async () => {
        await giuViTriCuonKhiVe('diem-danh-tab-con', async () => {
          tabCon = ma;
          if (tabCon === 'nhanh' && !duLieuPhu) {
            datNoiDung(KHUNG, khoiDangTai());
            await taiPhu();
          } else if (tabCon === 'ngay' && !duLieuChinh) {
            datNoiDung(KHUNG, khoiDangTai());
            await taiChinh();
          }
          ve();
        });
      });
      hopTabCon.append(b);
    });
    khung.append(hopTabCon);

    if (tabCon === 'nhanh') {
      if (!duLieuPhu) {
        taiPhu().then(ve);
        return datNoiDung(KHUNG, khoiDangTai());
      }
      // Thanh tiến độ & thống kê — cùng kiểu với Điểm danh chính, tính riêng trên dữ liệu phụ.
      const demPhu = tinhSoPhu();
      const tongPhu = duLieuPhu.danhSach.length || 1;
      const thanhPhu = e('div', 'thanh-tien-do');
      [['co_mat', 'p-comat'], ['tre', 'p-tre'], ['vang_phep', 'p-phep'], ['vang_khong_phep', 'p-khongphep']]
        .forEach(([k, lop]) => {
          if (!demPhu[k]) return;
          const i = e('i', lop);
          i.style.width = (demPhu[k] / tongPhu * 100) + '%';
          thanhPhu.append(i);
        });
      khung.append(thanhPhu);

      const daGhiPhu = Object.values(demPhu).reduce((a, b) => a + b, 0);
      const dayPhu = e('div', 'day-so');
      dayPhu.append(
        oThongKe(`${daGhiPhu}/${tongPhu}`, 'Đã điểm danh', 'chinh'),
        oThongKe(String(demPhu.co_mat), 'Có mặt', 'tot'),
        oThongKe(String(demPhu.tre), 'Đi trễ', 'luuy'),
        oThongKe(String(demPhu.vang_phep), 'Vắng có phép', 'thu'),
        oThongKe(String(demPhu.vang_khong_phep), 'Vắng không phép', 'xau')
      );
      khung.append(dayPhu);

      khung.append(veTabDiemDanhNhanh(duLieuPhu.danhSach, thayDoiPhu, lyDoMoiPhu, ve, luuDiemDanhPhu, trangThaiHienTaiPhu, lyDoHienTaiPhu, timPhu, (v) => { timPhu = v; }, ngay, buoi, nhayDenNgayBuoi));
    } else {
      if (!duLieuChinh) {
        taiChinh().then(ve);
        return datNoiDung(KHUNG, khoiDangTai());
      }
      // Thanh tiến độ
      const dem = tinhSo();
      const tong = duLieuChinh.danhSach.length || 1;
      const thanh = e('div', 'thanh-tien-do');
      [['co_mat', 'p-comat'], ['tre', 'p-tre'], ['vang_phep', 'p-phep'], ['vang_khong_phep', 'p-khongphep']]
        .forEach(([k, lop]) => {
          if (!dem[k]) return;
          const i = e('i', lop);
          i.style.width = (dem[k] / tong * 100) + '%';
          thanh.append(i);
        });
      khung.append(thanh);

      const daGhi = Object.values(dem).reduce((a, b) => a + b, 0);
      const day = e('div', 'day-so');
      day.append(
        oThongKe(`${daGhi}/${tong}`, 'Đã điểm danh', 'chinh'),
        oThongKe(String(dem.co_mat), 'Có mặt', 'tot'),
        oThongKe(String(dem.tre), 'Đi trễ', 'luuy'),
        oThongKe(String(dem.vang_phep), 'Vắng có phép', 'thu'),
        oThongKe(String(dem.vang_khong_phep), 'Vắng không phép', 'xau')
      );
      khung.append(day);

      // Ô tìm kiếm học sinh — lọc TRỰC TIẾP danh sách bên dưới, và "Áp dụng nhanh" cũng chỉ áp
      // dụng lên đúng danh sách đang tìm thấy (không áp lên cả lớp khi đang lọc), để giáo viên
      // gõ tên một nhóm nhỏ rồi bấm trạng thái là điểm danh nhanh đúng nhóm đó. Chỉ rebuild
      // "khuVucChinh" (không rebuild cả trang) mỗi khi gõ, để ô tìm kiếm không mất focus.
      const oTimChinh = oNhap('ddTimChinh', 'search', timChinh, 'Tìm theo tên, tổ/lớp nghề, hoặc STT…');
      oTimChinh.addEventListener('input', (ev) => {
        timChinh = ev.target.value;
        veKhuVucChinh();
      });
      khung.append(truong('🔎 Tìm học sinh', oTimChinh));

      const khuVucChinh = e('div');
      khuVucChinh.id = 'dd-khu-vuc-chinh';
      khung.append(khuVucChinh);

      const dsLocChinh = () => {
        const q = timChinh.trim().toLowerCase();
        if (!q) return duLieuChinh.danhSach;
        return duLieuChinh.danhSach.filter((h) =>
          h.hoTen.toLowerCase().includes(q) ||
          String(h.id).includes(q) ||
          (h.lopNghe || '').toLowerCase().includes(q)
        );
      };

      function veKhuVucChinh() {
        const dsLoc = dsLocChinh();
        const dangLoc = Boolean(timChinh.trim());
        const khungCon = e('div');

        if (dangLoc && !dsLoc.length) {
          khungCon.append(e('p', 'trong', `Không tìm thấy học sinh nào khớp "${timChinh.trim()}".`));
          datNoiDung(khuVucChinh, khungCon);
          return;
        }

        // Thanh áp dụng nhanh cho cả lớp (hoặc đúng danh sách đang tìm thấy) & Xoá tất cả ghi chú
        const theApDungNhanh = e('div', 'the');
        theApDungNhanh.style.cssText = 'padding:12px 14px;margin-bottom:12px;';
        theApDungNhanh.append(Object.assign(
          e('div', null, dangLoc ? `⚡ Áp dụng nhanh cho ${dsLoc.length} học sinh tìm thấy` : '⚡ Áp dụng nhanh cho cả lớp'),
          { style: 'font-size:12.5px;font-weight:700;color:var(--chu);margin-bottom:8px;' }
        ));
        const dayApDungNhanh = e('div', 'day-loc day-loc-deu-co-gian');
        Object.entries(DIEM_DANH).forEach(([ma, tt2]) => {
          const caLopDangChon = dsLoc.length > 0 &&
            dsLoc.every((h) => trangThaiHienTaiChinh(h.id, h.trangThai) === ma);

          const b = e('button', 'vien-loc', `${tt2.ky} ${tt2.ten}`);
          b.type = 'button';
          b.setAttribute('aria-pressed', String(caLopDangChon));
          b.title = caLopDangChon
            ? `Bỏ chọn tất cả "${tt2.ten}"`
            : `Đặt "${tt2.ten}" cho ${dangLoc ? 'danh sách tìm thấy' : 'cả lớp'} (bấm lại để bỏ chọn tất cả)`;
          b.addEventListener('click', () => {
            if (caLopDangChon) {
              dsLoc.forEach((h) => thayDoiChinh.set(h.id, null));
            } else {
              dsLoc.forEach((h) => thayDoiChinh.set(h.id, ma));
            }
            ve();
          });
          dayApDungNhanh.append(b);
        });

        // Nút Xoá tất cả ghi chú (của cả lớp, hoặc đúng danh sách đang tìm thấy)
        const soCoGhiChu = dsLoc.filter((h) => lyDoHienTaiChinh(h.id, h.lyDo)).length;
        const bXoaGc = e('button', 'vien-loc', `🗑 Xoá tất cả ghi chú${soCoGhiChu ? ` (${soCoGhiChu})` : ''}`);
        bXoaGc.type = 'button';
        if (soCoGhiChu) {
          bXoaGc.style.color = 'var(--xau)';
          bXoaGc.style.borderColor = 'var(--xau)';
        }
        bXoaGc.title = `Xoá toàn bộ ghi chú lý do của ${dangLoc ? 'danh sách tìm thấy' : 'cả lớp'} trong buổi chính này`;
        bXoaGc.addEventListener('click', () => {
          if (!soCoGhiChu) return nhac('Hiện không có học sinh nào có ghi chú trong buổi này.', 'nhe');
          moHopThoai('Xoá tất cả ghi chú buổi này?', [
            e('p', null, `Bạn có chắc muốn xoá toàn bộ ghi chú lý do của ${soCoGhiChu} học sinh${dangLoc ? ' (trong danh sách đang tìm thấy)' : ''} trong buổi chính này?`),
            e('p', 'trong', 'Trạng thái điểm danh (Có mặt, Vắng, Trễ) vẫn giữ nguyên, chỉ xoá sạch nội dung ghi chú lý do.')
          ], [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá tất cả ghi chú', 'nut-xau', () => {
              dsLoc.forEach((h) => {
                if (lyDoHienTaiChinh(h.id, h.lyDo)) {
                  lyDoMoiChinh.set(h.id, '');
                }
              });
              dongHopThoai();
              nhac('Đã xoá sạch ghi chú (hãy bấm "Lưu điểm danh")', 'tot');
              ve();
            })
          ]);
        });
        dayApDungNhanh.append(bXoaGc);

        theApDungNhanh.append(dayApDungNhanh);
        khungCon.append(theApDungNhanh);

        // Chú thích các nút trạng thái — đặt TRƯỚC danh sách (không phải sau như trước) để
        // giáo viên hiểu ký hiệu ✓/T/P/✗/📝 nghĩa là gì NGAY khi vừa xem trang, khỏi phải cuộn
        // qua hết cả lớp (có thể vài chục em) mới thấy chú thích nằm ở cuối.
        const chuThich = e('div', 'chu-thich');
        [['✓ Có mặt', 'var(--tot)'], ['T Đi trễ', 'var(--luu-y)'],
         ['P Vắng có phép', 'var(--chinh)'], ['✗ Vắng không phép', 'var(--xau)']]
          .forEach(([chu, mau]) => {
            const s = e('span');
            const i = e('i');
            i.style.background = mau;
            s.append(i, document.createTextNode(chu));
            chuThich.append(s);
          });
        khungCon.append(chuThich);

        // Danh sách học sinh (đúng danh sách đang tìm thấy — cả lớp nếu không lọc gì)
        const ds = e('div', 'ds-diem-danh');
        // Đang tìm kiếm với ít kết quả (≤ 8 em) — hiện hẳn TOÀN BỘ lịch sử điểm danh của đúng
        // những em đó thay cho hàng bấm nhanh ✓/T/P/✗ (đằng nào cũng đã có thanh "⚡ Áp dụng
        // nhanh" phía trên lo phần bấm nhanh này rồi — lặp thêm một hàng bấm-nhanh riêng cho
        // từng em là dư thừa, lại khác kiểu thẻ hẳn với chính khối lịch sử ngay bên dưới nó).
        const dangHienLichSu = dangLoc && dsLoc.length <= 8;
        dsLoc.forEach((h) => {
          const tt = trangThaiHienTaiChinh(h.id, h.trangThai);
          const ld = lyDoHienTaiChinh(h.id, h.lyDo);
          const hang = e('div', 'hang-hs' + (tt ? '' : ' chua-ghi'));

          if (dangHienLichSu) {
            hang.append(veLichSuTimThay(h, veKhuVucChinh));
            ds.append(hang);
            return;
          }

          const ten = e('div', 'ten');
          ten.append(e('b', null, h.hoTen), e('small', null, h.lopNghe || ''));

          if (ld) {
            const dongLd = e('div', 'dong-ly-do');
            dongLd.title = `Ghi chú: ${ld} — Bấm để sửa`;
            dongLd.append(e('span', null, '💬'), Object.assign(e('span', 'dong-ly-do-chu', ld)));
            dongLd.addEventListener('click', (ev) => {
              ev.stopPropagation();
              moHopThoaiGhiChuDiemDanh(h, tt, ld, (val, ttChon) => {
                lyDoMoiChinh.set(h.id, val);
                if (ttChon) thayDoiChinh.set(h.id, ttChon);
                else if (!thayDoiChinh.has(h.id) && val && !tt) thayDoiChinh.set(h.id, 'vang_phep');
                ve();
              });
            });
            ten.append(dongLd);
          }

          hang.append(e('div', 'stt', h.id), ten);

          const nhom = e('div', 'nhom-chon');
          Object.entries(DIEM_DANH).forEach(([ma, tt2]) => {
            const b = e('button', null, tt2.ky);
            b.type = 'button';
            b.dataset.tt = ma;
            b.title = tt2.ten + ' — bấm lại để bỏ chọn';
            b.setAttribute('aria-label', `${h.hoTen}: ${tt2.ten}`);
            b.setAttribute('aria-pressed', String(tt === ma));
            b.addEventListener('click', () => {
              thayDoiChinh.set(h.id, tt === ma ? null : ma);
              ve();
            });
            nhom.append(b);
          });

          // Nút thứ 5: Ghi chú lý do cho từng học sinh
          const nutGc = e('button', 'nut-icon-ghi-chu' + (ld ? ' da-co-ghi-chu' : ''));
          nutGc.type = 'button';
          nutGc.textContent = '📝';
          nutGc.title = ld ? `Ghi chú: "${ld}" — Bấm để sửa` : `Thêm ghi chú/lý do cho ${h.hoTen}`;
          nutGc.setAttribute('aria-label', `Ghi chú cho ${h.hoTen}`);
          nutGc.addEventListener('click', (ev) => {
            ev.stopPropagation();
            moHopThoaiGhiChuDiemDanh(h, tt, ld, (val, ttChon) => {
              lyDoMoiChinh.set(h.id, val);
              if (ttChon) thayDoiChinh.set(h.id, ttChon);
              else if (!thayDoiChinh.has(h.id) && val && !tt) thayDoiChinh.set(h.id, 'vang_phep');
              ve();
            });
          });
          nhom.append(nutGc);

          hang.append(nhom);
          ds.append(hang);
        });
        if (dangLoc && dsLoc.length > 8) {
          khungCon.append(e('p', 'trong', `Có ${dsLoc.length} học sinh khớp — gõ tên cụ thể hơn (còn ≤ 8 kết quả) để xem lịch sử điểm danh từng em.`));
        }
        khungCon.append(ds);

        datNoiDung(khuVucChinh, khungCon);
      }

      veKhuVucChinh();
    }
    khung.append(Object.assign(e('div'), { style: 'height:70px' }));

    // Thanh lưu — CHỈ hiện ở tab Điểm danh chính. Tab Điểm danh linh động đã có nút lưu riêng ngay
    // trong thẻ của nó (lưu thẳng toàn bộ thayDoiPhu, lyDoMoiPhu),
    // nên không hiện thêm thanh này nữa — tránh 2 nút "Lưu điểm danh" cùng lúc gây rối.
    const cacIdThayDoi = new Set([...thayDoiChinh.keys(), ...lyDoMoiChinh.keys()]);
    if (cacIdThayDoi.size && tabCon !== 'nhanh') {
      const thanhLuu = e('div', 'thanh-luu');
      thanhLuu.append(e('div', 'thong-tin', `${cacIdThayDoi.size} thay đổi chưa lưu`));
      thanhLuu.append(
        nut('Bỏ', 'nut-nhe nut-nho', () => { thayDoiChinh.clear(); lyDoMoiChinh.clear(); ve(); }),
        nut('Lưu điểm danh', '', (ev) => luuDiemDanhChinh(ev.currentTarget))
      );
      khung.append(thanhLuu);
    }

    datNoiDung(KHUNG, khung);
  }

  await tai();
}

/* ================= Trang: Học sinh ================= */

function themHocSinh(taiLai) {
  const oHoTen = oNhap('thHoTen', 'text', '', 'Họ và tên đầy đủ');
  const oGioiTinh = oChon('thGioiTinh', [['Nam', 'Nam'], ['Nữ', 'Nữ']], 'Nam');
  const oNgaySinh = oNhap('thNgaySinh', 'date', '');
  const oLopNghe = oNhap('thLopNghe', 'text', '', 'Ví dụ: CNTT, Công nghệ ô tô…');
  const oToHop = oNhap('thToHop', 'text', '', 'Ví dụ: A4');
  const oTo = oNhap('thTo', 'number', '', 'Số tổ');
  oTo.min = '1';
  oTo.step = '1';

  moHopThoai('Thêm học sinh mới', [
    truong('Họ và tên', oHoTen),
    truong('Giới tính', oGioiTinh),
    truong('Ngày sinh', oNgaySinh),
    truong('Lớp nghề', oLopNghe),
    truong('Tổ hợp', oToHop),
    truong('Tổ', oTo),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Thêm', '', async (ev) => {
      if (!oHoTen.value.trim()) return nhac('Chưa nhập họ tên', 'xau');
      if (oTo.value && Number(oTo.value) < 1) return nhac('Số tổ phải từ 1 trở lên.', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/hoc-sinh', {
          method: 'POST',
          than: {
            hoTen: oHoTen.value, gioiTinh: oGioiTinh.value, ngaySinh: oNgaySinh.value || null,
            lopNghe: oLopNghe.value, toHop: oToHop.value, toSo: oTo.value,
          },
        });
        dongHopThoai();
        nhac('Đã thêm học sinh mới', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

function xoaHocSinh(h, taiLai) {
  moHopThoai(`Xoá học sinh — ${h.hoTen}`, [
    e('p', null, `Bạn có chắc chắn muốn xoá học sinh "${h.hoTen}" (STT ${h.soThuTu || h.id}) khỏi danh sách lớp không?`),
    Object.assign(e('p'), {
      textContent: '⚠️ CẢNH BÁO: Toàn bộ dữ liệu điểm danh, điểm số, nhật ký và thông tin của học sinh này sẽ bị xoá vĩnh viễn khỏi hệ thống.',
      style: 'margin-top:8px;padding:10px;border-radius:8px;background:var(--xau-nen);border:1px solid var(--xau);color:var(--xau);font-size:13.5px;font-weight:600;'
    })
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Xoá vĩnh viễn', 'nut-xau', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/hoc-sinh?id=' + h.id, { method: 'DELETE' });
        dongHopThoai();
        nhac(`Đã xoá học sinh ${h.hoTen}`, 'tot');
        if (taiLai) taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

const CAC_MUC_CONG_KHAI = [
  ['gioi-tinh', 'Giới tính'], ['ngay-sinh', 'Ngày sinh'], ['lop-nghe', 'Lớp nghề'],
  ['to-hop', 'Tổ hợp'], ['chuc-vu', 'Chức vụ'], ['to-so', 'Tổ'], ['dien-thoai-hs', 'Điện thoại học sinh'],
];

function moCauHinhHienThiHocSinh() {
  api('/api/gv/cau-hinh-hoc-sinh').then((cfg) => {
    const boCongKhaiAn = new Set(cfg.congKhaiAn);

    const taoTich = (ma, nhan, daChon) => {
      const o = e('input'); o.type = 'checkbox'; o.checked = daChon;
      const l = e('label');
      l.style.cssText = 'display:flex;gap:9px;align-items:center;font-size:14px;font-weight:600;padding:5px 0';
      l.append(o, document.createTextNode(nhan));
      return [o, l];
    };

    const dsCongKhai = CAC_MUC_CONG_KHAI.map(([ma, nhan]) => [ma, ...taoTich(ma, nhan, !boCongKhaiAn.has(ma))]);

    moHopThoai('⚙ Tuỳ chỉnh hiển thị thông tin học sinh', [
      e('p', 'trong', 'Quyết định thông tin nào học sinh xem được — áp dụng cho mọi mã trong lớp.'),
      Object.assign(e('h3', null, '👁 Công khai giữa học sinh trong lớp (mọi học sinh xem được)'), { style: 'margin-top:14px' }),
      e('p', 'trong', 'Bỏ tích mục nào thì ẩn cột đó khỏi mọi nơi học sinh xem thông tin của nhau — "Danh sách lớp", bảng "Điểm danh" cả lớp và danh sách đóng quỹ ở "Thủ quỹ" (họ tên luôn hiện).'),
      ...dsCongKhai.map(([, , nhanO]) => nhanO),
    ], [
      nut('Huỷ', 'nut-nhe', dongHopThoai),
      nut('Lưu', '', async (ev) => {
        ev.currentTarget.disabled = true;
        try {
          const congKhaiAn = dsCongKhai.filter(([, o]) => !o.checked).map(([ma]) => ma);
          await api('/api/gv/cau-hinh-hoc-sinh', { method: 'PATCH', than: { congKhaiAn } });
          dongHopThoai();
          nhac('Đã lưu cấu hình hiển thị', 'tot');
        } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
      }),
    ]);
  }).catch((err) => nhac(err.message, 'xau'));
}

async function trangHocSinh() {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api('/api/gv/hoc-sinh');
  let tim = '';

  function ve() {
    const khung = e('div');
    const cacNutPhai = [nut('+ Thêm học sinh', 'nut-vien nut-nho', () => themHocSinh(() => trangHocSinh()))];
    if (PHIEN.role === 'teacher') {
      cacNutPhai.unshift(nut('⚙ Tuỳ chỉnh hiển thị', 'nut-vien nut-nho', moCauHinhHienThiHocSinh));
    }
    khung.append(tieuDeTrang('Học sinh', `${d.danhSach.length} em đang học`, ...cacNutPhai));

    const o = oNhap('timHs', 'search', tim, 'Tìm theo họ tên…');
    o.addEventListener('input', (ev) => {
      tim = ev.target.value;
      veDanhSach();
    });
    khung.append(o);

    const hopDs = e('div', 'ds-the');
    hopDs.id = 'dsTheHs';
    hopDs.style.marginTop = '16px';
    khung.append(hopDs);
    datNoiDung(KHUNG, khung);
    veDanhSach();
  }

  function veDanhSach() {
    const q = tim.trim().toLowerCase();
    const ds = d.danhSach.filter((h) => !q || h.hoTen.toLowerCase().includes(q));
    const hop = $('#dsTheHs');

    if (!ds.length) return datNoiDung(hop, e('p', 'trong', 'Không có học sinh phù hợp.'));

    datNoiDung(hop, ...ds.map((h) => {
      const the = e('div', 'the-hs');
      the.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;';

      const khoiTrai = e('div');
      khoiTrai.style.cssText = 'display:flex;align-items:center;gap:12px;min-width:0;flex:1;cursor:pointer;';
      khoiTrai.append(e('div', 'chu-cai', (h.hoTen.trim().split(/\s+/).pop() || '?')[0].toUpperCase()));

      const noi = e('div', 'noi');
      const stt = h.soThuTu || h.id;
      noi.append(e('b', null, `${stt}. ${h.hoTen}`));
      // Luôn hiện ngày sinh — lopNghe/chucVu hiện bên phải thành nhãn riêng, không đè lên ngày sinh
      noi.append(e('small', null, ngayVN(h.ngaySinh) || ''));
      khoiTrai.append(noi);

      khoiTrai.addEventListener('click', () => { location.hash = '#/hoc-sinh/' + h.id; });

      const phai = e('div', 'canh-phai');
      phai.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end';

      // Nhãn bên phải: lớp nghề → chức vụ → tổ
      if (h.lopNghe) phai.append(e('span', 'nhan nhan-xam', h.lopNghe));
      if (h.chucVu) phai.append(e('span', 'nhan nhan-tot', h.chucVu));
      if (h.toSo) phai.append(e('span', 'nhan nhan-xam', 'Tổ ' + h.toSo));

      const nutXoa = e('button', 'nut-xoa-anh nut-nho', '🗑 Xoá');
      nutXoa.type = 'button';
      nutXoa.title = `Xoá học sinh ${h.hoTen}`;
      nutXoa.setAttribute('aria-label', `Xoá học sinh ${h.hoTen}`);
      nutXoa.style.cssText = 'font-size:12.5px;padding:3px 9px;min-height:30px;';
      nutXoa.addEventListener('click', (ev) => {
        ev.stopPropagation();
        xoaHocSinh(h, () => trangHocSinh());
      });

      phai.append(nutXoa);
      the.append(khoiTrai, phai);
      return the;
    }));
  }

  ve();
}

const CAC_TAB_HO_SO = [
  ['chuyen-can', 'Chuyên cần'],
  ['phu-huynh', 'Phụ huynh'],
];

async function trangHoSo(id, tabMacDinh) {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api('/api/gv/hoc-sinh?id=' + encodeURIComponent(id));
  const h = d.hocSinh;
  let tab = tabMacDinh || sessionStorage.getItem('hs-tab') || 'chuyen-can';
  if (!CAC_TAB_HO_SO.some(([ma]) => ma === tab)) tab = 'chuyen-can';

  const khung = e('div');
  // Quay lại ĐÚNG chỗ vừa đến (Tổng quan, Danh sách...), không phải luôn về Danh sách cố định
  // — nếu không, bấm nút Back thật của trình duyệt sau đó sẽ nhảy lung tung.
  const quayLai = nut('← Quay lại', 'nut-nhe nut-nho', () => {
    if (history.length > 1) history.back(); else location.hash = '#/hoc-sinh';
  });
  khung.append(quayLai);
  // Liên hệ PH đặt ngay ở đầu trang (không phải kéo xuống tab Phụ huynh) — đúng lúc hay cần nhất
  // là ngay sau khi xem xong tình hình một em, kể cả trên điện thoại.
  khung.append(tieuDeTrang(h.hoTen, [h.lopNghe, 'Tổ hợp ' + (h.toHop || '—'), ngayVN(h.ngaySinh)].filter(Boolean).join(' · '),
    nut('📞 Liên hệ PH', 'nut-vien nut-nho', () => ghiLienHe(h, () => trangHoSo(id, 'phu-huynh')))
  ));

  const dem = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
  d.diemDanh.forEach((x) => { if (dem[x.trangThai] !== undefined) dem[x.trangThai]++; });

  const day = e('div', 'day-so');
  day.append(
    oThongKe(String(dem.co_mat), 'Buổi có mặt', 'tot'),
    oThongKe(String(dem.tre), 'Đi trễ', 'luuy'),
    oThongKe(String(dem.vang_phep), 'Vắng có phép'),
    oThongKe(String(dem.vang_khong_phep), 'Vắng không phép', 'xau')
  );
  khung.append(day);

  const luoi = e('div', 'luoi luoi-2');

  // Hồ sơ + sửa
  const theHs = e('div', 'the');
  theHs.append(e('h3', null, 'Hồ sơ'));
  const bang = [
    ['Chức vụ', h.chucVu || '—'],
    ['Tổ', h.toSo ? 'Tổ ' + h.toSo : '—'],
    ['Điện thoại học sinh', h.dienThoaiHs || '—'],
    ['Điện thoại phụ huynh', h.dienThoaiPh || '—'],
    ['Hoàn cảnh', h.hoanCanh || '—'],
    ['Ghi chú', h.ghiChu || '—'],
  ];
  bang.forEach(([k, v]) => {
    const hang = e('div');
    hang.style.cssText = 'display:flex;gap:10px;padding:5px 0;font-size:14px;border-bottom:1px solid var(--vien)';
    hang.append(Object.assign(e('span', null, k), { style: 'color:var(--chu-nhat);min-width:150px' }), e('span', null, v));
    theHs.append(hang);
  });
  const hangNutHs = e('div', 'day-loc day-loc-deu');
  hangNutHs.style.marginTop = '12px';
  hangNutHs.append(
    nut('Sửa hồ sơ', 'nut-vien nut-nho', () => suaHoSo(h)),
    nut('Đánh dấu đã nghỉ/chuyển trường', 'nut-nhe nut-nho', () => {
      moHopThoai('Đánh dấu đã nghỉ/chuyển trường?', e('p', null,
        `${h.hoTen} sẽ không còn hiện trong danh sách lớp và điểm danh, nhưng dữ liệu cũ vẫn được giữ lại.`), [
        nut('Huỷ', 'nut-nhe', dongHopThoai),
        nut('Xác nhận', 'nut-xau', async () => {
          try {
            await api('/api/gv/hoc-sinh', { method: 'PATCH', than: { id: h.id, dangHoc: false } });
            dongHopThoai();
            nhac('Đã đánh dấu nghỉ/chuyển trường', 'tot');
            location.hash = '#/hoc-sinh';
          } catch (err) { nhac(err.message, 'xau'); }
        }),
      ]);
    }),
    nut('🗑 Xoá học sinh', 'nut-xau nut-nho', () => xoaHocSinh(h, () => { location.hash = '#/hoc-sinh'; }))
  );
  theHs.append(hangNutHs);
  luoi.append(theHs);

  // Theo dõi
  const theTd = e('div', 'the');
  theTd.append(e('h3', null, 'Theo dõi đầu năm'));
  if (!d.theoDoi.length) theTd.append(e('p', 'trong', 'Chưa có dữ liệu.'));
  const TEN_MUC = { sgk: 'Sách giáo khoa', dong_phuc: 'Đồng phục' };
  d.theoDoi.forEach((t) => {
    const hang = e('div');
    hang.style.cssText = 'display:flex;gap:10px;align-items:center;padding:6px 0';
    const l = /Chưa/.test(t.trangThai) ? 'nhan-xau' : /thiếu/i.test(t.trangThai) ? 'nhan-luuy' : 'nhan-tot';
    hang.append(
      Object.assign(e('span', null, TEN_MUC[t.muc] || t.muc), { style: 'color:var(--chu-nhat);min-width:150px;font-size:14px' }),
      e('span', 'nhan ' + l, t.trangThai)
    );
    if (t.ghiChu) hang.append(e('span', 'trong', t.ghiChu));
    theTd.append(hang);
  });
  luoi.append(theTd);
  khung.append(luoi);

  // --- 4 tab: Chuyên cần / Học tập / Hạnh kiểm / Phụ huynh — cùng dữ liệu đã có, tổ chức lại
  // cách xem, không phải 4 trang riêng và không thêm tab Timeline. ---
  const hopTab = e('div', 'day-loc day-loc-deu');
  hopTab.id = 'ho-so-tab';
  hopTab.style.margin = '18px 0 14px';
  khung.append(hopTab);
  const noiDungTab = e('div');
  khung.append(noiDungTab);

  function veThanhTab() {
    datNoiDung(hopTab, ...CAC_TAB_HO_SO.map(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(tab === ma));
      b.addEventListener('click', () => {
        giuViTriCuonKhiVe('ho-so-tab', () => {
          tab = ma;
          sessionStorage.setItem('hs-tab', ma);
          veThanhTab();
          veNoiDungTab();
        });
      });
      return b;
    }));
  }

  function veChuyenCan() {
    const box = e('div');
    if (!d.diemDanh.length) {
      box.append(e('p', 'trong', 'Chưa có buổi nào được điểm danh.'));
      return box;
    }
    const lich = e('div', 'lich-nho');
    d.diemDanh.slice().reverse().forEach((x) => {
      const i = e('i', x.trangThai);
      i.title = `${ngayVN(x.ngay)} — ${(DIEM_DANH[x.trangThai] || {}).ten || x.trangThai}`;
      lich.append(i);
    });
    box.append(lich);

    const vang = d.diemDanh.filter((x) => x.trangThai !== 'co_mat');
    if (vang.length) {
      const ds = e('div', 'ds-nhat-ky');
      ds.style.marginTop = '12px';
      vang.slice(0, 12).forEach((x) => {
        const m = e('div', 'muc-nhat-ky ' + (x.trangThai === 'vang_khong_phep' ? 'vi_pham' : 'nhac_nho'));
        const dong = e('div', 'dong-dau');
        dong.append(
          e('span', 'nhan ' + (DIEM_DANH[x.trangThai] || {}).lop, (DIEM_DANH[x.trangThai] || {}).ten || x.trangThai),
          e('span', 'ngay', `${ngayVN(x.ngay)} · ${TEN_BUOI[x.buoi] || x.buoi}`)
        );
        m.append(dong);
        if (x.lyDo) m.append(e('p', null, x.lyDo));
        ds.append(m);
      });
      box.append(ds);
    }
    return box;
  }

  async function vePhuHuynh() {
    const box = e('div');
    box.append(khoiDangTai());
    noiDungTab.replaceChildren(box);

    const dsLh = await api('/api/gv/lien-he?hocSinhId=' + h.id);
    if (tab !== 'phu-huynh') return;

    const noiDung = e('div');
    const dauLh = e('div', 'tieu-de-trang');
    dauLh.append(e('h2', null, 'Liên hệ phụ huynh'));
    const phaiLh = e('div', 'phai');
    phaiLh.append(nut('+ Ghi lần liên hệ', 'nut-vien nut-nho', () => ghiLienHe(h, () => trangHoSo(id, 'phu-huynh'))));
    dauLh.append(phaiLh);
    noiDung.append(dauLh);

    if (!dsLh.danhSach.length) {
      noiDung.append(e('p', 'trong', 'Chưa có lần liên hệ nào được ghi lại.'));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      dsLh.danhSach.forEach((lh) => ds.append(veMucLienHe(lh, () => trangHoSo(id, 'phu-huynh'))));
      noiDung.append(ds);
    }
    noiDungTab.replaceChildren(noiDung);
  }

  function veNoiDungTab() {
    if (tab === 'chuyen-can') return noiDungTab.replaceChildren(veChuyenCan());
    if (tab === 'phu-huynh') return vePhuHuynh();
  }

  veThanhTab();
  veNoiDungTab();

  datNoiDung(KHUNG, khung);
}

/* ================= Liên hệ phụ huynh ================= */

const HINH_THUC_LIEN_HE = {
  goi_dien: 'Gọi điện', gap_truc_tiep: 'Gặp trực tiếp', nhan_tin: 'Nhắn tin', khac: 'Khác',
};

function veMucLienHe(lh, taiLai) {
  const m = e('div', 'muc-nhat-ky khac');
  const dong = e('div', 'dong-dau');
  dong.append(
    e('span', 'nhan nhan-tim', HINH_THUC_LIEN_HE[lh.hinhThuc] || lh.hinhThuc),
    e('span', 'ngay', ngayVN(lh.ngay))
  );
  const viec = e('div', 'viec');
  viec.append(
    nut('✎', 'nut-nhe nut-nho', () => suaLienHe(lh, taiLai), `Sửa lần liên hệ ngày ${ngayVN(lh.ngay)}`),
    nut('✕', 'nut-nhe nut-nho', () => {
      moHopThoai('Xoá lần liên hệ này?', e('p', null, lh.noiDung), [
        nut('Huỷ', 'nut-nhe', dongHopThoai),
        nut('Xoá', 'nut-xau', async () => {
          try {
            await api('/api/gv/lien-he?id=' + lh.id, { method: 'DELETE' });
            dongHopThoai();
            nhac('Đã xoá', 'tot');
            taiLai();
          } catch (err) { nhac(err.message, 'xau'); }
        }),
      ]);
    }, `Xoá lần liên hệ ngày ${ngayVN(lh.ngay)}`)
  );
  dong.append(viec);
  m.append(dong, e('p', null, lh.noiDung));
  if (lh.ketQua) m.append(Object.assign(e('p', null, 'Kết quả: ' + lh.ketQua), { style: 'color:var(--chu-nhat);font-size:13px' }));
  return m;
}

function ghiLienHe(hocSinh, taiLai) {
  const oNgay = oNhap('lhNgay', 'date', homNay());
  const oHinhThuc = oChon('lhHinhThuc', Object.entries(HINH_THUC_LIEN_HE), 'goi_dien');
  const oNoiDung = oNhap('lhNoiDung', 'textarea', '', 'Đã trao đổi gì với phụ huynh…');
  const oKetQua = oNhap('lhKetQua', 'text', '', 'Kết quả (không bắt buộc)');

  moHopThoai(`Ghi lần liên hệ — ${hocSinh.hoTen}`, [
    truong('Ngày', oNgay),
    truong('Hình thức', oHinhThuc),
    truong('Nội dung đã trao đổi', oNoiDung),
    truong('Kết quả', oKetQua),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      if (!oNoiDung.value.trim()) return nhac('Chưa nhập nội dung đã trao đổi', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/lien-he', {
          method: 'POST',
          than: { hocSinhId: hocSinh.id, ngay: oNgay.value, hinhThuc: oHinhThuc.value, noiDung: oNoiDung.value, ketQua: oKetQua.value },
        });
        dongHopThoai();
        nhac('Đã lưu', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

function suaLienHe(lh, taiLai) {
  const oNgay = oNhap('slhNgay', 'date', lh.ngay);
  const oHinhThuc = oChon('slhHinhThuc', Object.entries(HINH_THUC_LIEN_HE), lh.hinhThuc);
  const oNoiDung = oNhap('slhNoiDung', 'textarea', lh.noiDung);
  const oKetQua = oNhap('slhKetQua', 'text', lh.ketQua || '', 'Kết quả (không bắt buộc)');

  moHopThoai('Sửa lần liên hệ', [
    truong('Ngày', oNgay),
    truong('Hình thức', oHinhThuc),
    truong('Nội dung đã trao đổi', oNoiDung),
    truong('Kết quả', oKetQua),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      if (!oNoiDung.value.trim()) return nhac('Nội dung không được để trống', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/lien-he', {
          method: 'PATCH',
          than: { id: lh.id, ngay: oNgay.value, hinhThuc: oHinhThuc.value, noiDung: oNoiDung.value, ketQua: oKetQua.value },
        });
        dongHopThoai();
        nhac('Đã lưu', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

function suaHoSo(h) {
  const oHoTen = oNhap('sHoTen', 'text', h.hoTen, 'Họ và tên học sinh');
  const oChuc = oNhap('sChuc', 'text', h.chucVu, 'Lớp trưởng, tổ trưởng…');
  const oTo = oNhap('sTo', 'number', h.toSo ?? '', 'Số tổ');
  oTo.min = '1';
  oTo.step = '1';
  const oSdtHs = oNhap('sSdtHs', 'tel', h.dienThoaiHs, 'Điện thoại học sinh');
  const oSdt = oNhap('sSdt', 'tel', h.dienThoaiPh, 'Điện thoại phụ huynh');
  const oHc = oNhap('sHc', 'text', h.hoanCanh, 'Hộ cận nghèo, GĐ khó khăn…');
  const oGc = oNhap('sGc', 'textarea', h.ghiChu, 'Ghi chú riêng');

  moHopThoai('Sửa hồ sơ — ' + h.hoTen, [
    truong('Họ và tên', oHoTen, 'Sửa lại họ tên nếu có sai sót'),
    truong('Chức vụ', oChuc),
    truong('Tổ', oTo),
    truong('Điện thoại học sinh', oSdtHs, 'Có thể hiện cho học sinh trong lớp xem của nhau — bật ở "⚙ Tuỳ chỉnh hiển thị".'),
    truong('Điện thoại phụ huynh', oSdt, 'Luôn chỉ giáo viên chủ nhiệm xem được.'),
    truong('Hoàn cảnh', oHc),
    truong('Ghi chú', oGc),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      if (oTo.value && Number(oTo.value) < 1) return nhac('Số tổ phải từ 1 trở lên.', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/hoc-sinh', {
          method: 'PATCH',
          than: {
            id: h.id, hoTen: oHoTen.value.trim(), chucVu: oChuc.value, toSo: oTo.value,
            dienThoaiHs: oSdtHs.value, dienThoaiPh: oSdt.value, hoanCanh: oHc.value, ghiChu: oGc.value,
          },
        });
        dongHopThoai();
        nhac('Đã lưu hồ sơ', 'tot');
        trangHoSo(h.id);
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

/* ================= Trang: Thông báo ================= */

async function trangThongBao() {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const d = await api('/api/gv/thong-bao');
    const khung = e('div');

    const dau = e('div', 'tieu-de-trang');
    const trai = e('div');
    trai.append(e('h1', null, 'Thông báo'), e('p', null, 'Đăng lên trang lớp, cả lớp xem được ngay.'));
    const phai = e('div', 'phai');
    phai.append(
      nut('🛡️ Lịch sử & khôi phục', 'nut-vien nut-nho', () => { location.hash = '#/thong-bao-khoi-phuc'; }),
      nut('+ Soạn thông báo', '', () => soanThongBao(null, ve))
    );
    dau.append(trai, phai);
    khung.append(dau);

    if (!d.danhSach.length) {
      khung.append(e('p', 'trong', 'Chưa có thông báo nào.'));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      d.danhSach.forEach((t) => {
        const m = e('div', 'muc-nhat-ky ' + (t.ghim ? 'nhac_nho' : 'khac') + (t.hien ? '' : ' da-xong'));
        const dong = e('div', 'dong-dau');
        const mucDo = nhanMucDo(t.mucDo);
        if (mucDo) dong.append(e('span', 'nhan ' + mucDo.lop, mucDo.ten));
        if (t.ghim) dong.append(e('span', 'nhan nhan-xam', '📌 Ghim'));
        if (!t.hien) dong.append(e('span', 'nhan nhan-xam', 'Đang ẩn'));
        if (t.hinhKhoa) dong.append(e('span', 'nhan nhan-xam', '🖼 Ảnh'));
        if (t.nhacKhoa) dong.append(e('span', 'nhan nhan-xam', '🎵 Nhạc'));
        if (t.videoKhoa || t.videoUrl) dong.append(e('span', 'nhan nhan-xam', '🎬 Video'));
        dong.append(e('span', 'nhan nhan-xam', t.loai || 'Chủ nhiệm'), e('span', 'ngay', ngayVN(t.ngay)));

        const viec = e('div', 'viec');
        viec.append(
          nut('✎', 'nut-nhe nut-nho', () => soanThongBao(t, ve), 'Sửa thông báo: ' + t.tieuDe),
          nut(t.hien ? '🙈' : '👁', 'nut-nhe nut-nho', async () => {
            try {
              await api('/api/gv/thong-bao', { method: 'PATCH', than: { id: t.id, hien: !t.hien } });
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          }, (t.hien ? 'Ẩn thông báo: ' : 'Hiện thông báo: ') + t.tieuDe),
          nut('✕', 'nut-nhe nut-nho', () => {
            moHopThoai('Xoá thông báo?', e('p', null, t.tieuDe), [
              nut('Huỷ', 'nut-nhe', dongHopThoai),
              nut('Xoá', 'nut-xau', async () => {
                try {
                  await api('/api/gv/thong-bao?id=' + t.id, { method: 'DELETE' });
                  dongHopThoai();
                  nhac('Đã xoá', 'tot');
                  ve();
                } catch (err) { nhac(err.message, 'xau'); }
              }),
            ]);
          }, 'Xoá thông báo: ' + t.tieuDe)
        );
        dong.append(viec);

        m.append(dong, Object.assign(e('h3', null, t.tieuDe), { style: 'margin:4px 0' }), e('p', null, t.noiDung));
        ds.append(m);
      });
      khung.append(ds);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

function soanThongBao(tb, taiLai) {
  moHopThoaiSoanThongBao(tb, taiLai);
}

/* ================= Trang: Thêm (menu phụ trên điện thoại) ================= */

const MUC_THEM = [
  ['#/diem-danh', '✅', 'Điểm danh', 'Điểm danh chính khoá và linh động, xem/sửa lịch sử.'],
  ['#/thong-ke', '📈', 'Thống kê chuyên cần', 'Biểu đồ theo tuần và cảnh báo em có nguy cơ.'],
  ['#/thong-bao', '◈', 'Thông báo', 'Soạn và đăng thông báo lên trang lớp.'],
  ['#/hoat-dong-lop', '🌿', 'Hoạt động lớp', 'Đăng ảnh, video, âm thanh hoạt động lên trang chủ.'],
  ['#/thoi-khoa-bieu', '▦', 'Thời khoá biểu', 'Sửa thời khoá biểu hiện trên trang lớp.'],
  ['#/bao-cao', '⬇', 'Báo cáo & xuất dữ liệu', 'Tải tệp CSV mở bằng Excel để nộp trường.'],
  ['#/quy', '💰', 'Thủ quỹ', 'Ghi thu, ghi chi, xem tồn quỹ.'],
  ['#/hinh-anh', '🖼', 'Thư viện Ảnh', 'Đăng ảnh của lớp, tự nén nhỏ trước khi tải lên.'],
  ['#/thu-vien-am-thanh', '♪', 'Thư viện Âm thanh', 'Tải bài hát, đặt bài nào phát làm nhạc nền trang chủ.'],
  ['#/thu-vien-video', '🎬', 'Thư viện Video', 'Tải video từ máy/điện thoại lên, dùng lại khi soạn thông báo.'],
  ['#/ma-ca-nhan', '🔑', 'Mã cá nhân & phân quyền', 'Cấp mã, cấp quyền quản lý cho lớp trưởng, thủ quỹ...'],
  ['/', '🏠', 'Trang chủ', 'Xem trang mà học sinh nhìn thấy.'],
  ['/api/logout', '⏻', 'Đăng xuất', 'Thoát khỏi khu quản lý trên thiết bị này.'],
];

function trangThem() {
  const mucDuocPhep = MUC_THEM.filter(([duong]) => {
    if (!duong.startsWith('#/')) return true;   // "Xem trang lớp", "Đăng xuất" — luôn hiện
    return duocVaoTuyen(duong.slice(1));
  });

  // Trên màn hình rộng, cột trái đã liệt kê sẵn đúng các mục quản lý mà tài khoản này được
  // cấp quyền (xem locMenuTheoQuyen) — lặp lại y hệt bằng thẻ ở đây là thừa. Vào thẳng mục
  // đầu tiên được phép luôn, khỏi phải qua một trang "Thêm" chỉ để bấm tiếp. Trên điện
  // thoại thì cột trái ẩn đi (dùng tab dưới) nên trang Thêm vẫn là lối vào duy nhất — giữ
  // nguyên như cũ.
  if (PHIEN.role !== 'teacher' && matchMedia('(min-width: 900px)').matches) {
    const mucQuanLy = mucDuocPhep.filter(([duong]) => duong.startsWith('#/'));
    if (mucQuanLy.length) {
      location.hash = mucQuanLy[0][0].slice(1);
      return;
    }
  }

  const khung = e('div');
  // Với giáo viên, đây đúng là "còn vài công cụ khác" (đã có sẵn rất nhiều trang chính khác) —
  // nhưng với tài khoản cán sự, đây LÀ toàn bộ khu quản lý của họ (không có trang nào khác ngoài
  // các mục được cấp quyền liệt kê ở đây), gọi là "Thêm" dễ hiểu lầm thành vài mục lặt vặt.
  const tieuDePhu = PHIEN.role === 'teacher'
    ? 'Các công cụ khác của lớp'
    : layNhanTaiKhoan(PHIEN);
  khung.append(tieuDeTrang(PHIEN.role === 'teacher' ? 'Thêm' : 'Khu quản lý', tieuDePhu));

  if (!mucDuocPhep.length) {
    khung.append(e('div', 'the trong', 'Tài khoản này chưa được cấp quyền làm việc nào. Liên hệ giáo viên chủ nhiệm.'));
  }

  const ds = e('div', 'ds-the');
  mucDuocPhep.forEach(([duong, bieuTuong, ten, moTa]) => {
    const a = e('a', 'the-hs');
    a.href = duong;
    a.style.textDecoration = 'none';
    a.append(e('div', 'chu-cai', bieuTuong));
    const noi = e('div', 'noi');
    noi.append(e('b', null, ten), e('small', null, moTa));
    a.append(noi, e('div', 'canh-phai canh-phai-mui-ten', '›'));
    ds.append(a);
  });
  khung.append(ds);

  datNoiDung(KHUNG, khung);
}

/* ================= Trang: Hoạt động lớp ================= */

// Một mục giờ có thể gộp NHIỀU loại nội dung cùng lúc (văn bản + ảnh + video + âm thanh) —
// đọc trực tiếp từ các cột dữ liệu thực tế của mục đó, không còn dựa vào "item.loai" (cột này
// giờ chỉ mang tính mô tả, gộp các loại cách nhau bằng dấu phẩy).
function nhanCacLoaiHoatDong(item) {
  const cac = [];
  if (item.tieuDe || item.chuThich) cac.push('📝 Văn bản');
  if (item.anhId || item.hinhUrl) cac.push('🖼 Ảnh');
  if (item.videoId || item.videoUrl) cac.push(`🎬 ${item.videoTen || 'Video'}`);
  if (item.amThanhId || item.amThanhUrl) cac.push(`🎵 ${item.amThanhTen || 'Âm thanh'}`);
  return cac.length ? cac.join(' · ') : '📎 (trống)';
}

async function trangHoatDongLop(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const d = await api('/api/gv/hoat-dong-lop');
    const khung = e('div');
    khung.append(tieuDeTrang('Hoạt động lớp', `${d.danhSach.length} mục đang hiện ở trang chủ`,
      nut('🛡️ Lịch sử & khôi phục', 'nut-vien nut-nho', () => { location.hash = '#/hoat-dong-lop-khoi-phuc'; }),
      nut('+ Thêm hoạt động', '', () => moHopThoaiThemHoatDong(ve))
    ));

    if (!d.danhSach.length) {
      khung.append(e('p', 'trong', 'Chưa có mục nào — bấm "+ Thêm hoạt động" để đăng bài viết, ảnh, video hoặc âm thanh lên trang chủ.'));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      d.danhSach.forEach((item) => {
        const m = e('div', 'muc-nhat-ky');
        const dong = e('div', 'dong-dau');
        dong.append(
          e('span', 'nhan nhan-xam', nhanCacLoaiHoatDong(item)),
          e('span', 'ngay', ngayVN(item.ngay))
        );
        // Xoá được nếu là giáo viên, hoặc tài khoản đặc biệt có ít nhất 1 trong các quyền liên
        // quan tới Hoạt động lớp — khớp đúng quyền máy chủ đã cho phép.
        const duocXoaHoatDong = PHIEN.role === 'teacher'
          || ['hoat-dong-lop', 'hinh-anh', 'am-thanh', 'video'].some((q) => (PHIEN.quyen || []).includes(q));
        if (duocXoaHoatDong) {
          const thaoTac = e('div');
          thaoTac.style.cssText = 'margin-left:auto;display:inline-flex';
          const nutXoa = nut('🗑 Gỡ', 'nut-nhe nut-nho', async () => {
            if (!confirm('Gỡ mục này khỏi trang chủ?')) return;
            try {
              await api('/api/gv/hoat-dong-lop?id=' + item.id, { method: 'DELETE' });
              nhac('Đã gỡ', 'tot');
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          });
          dong.append(nutXoa);
        }
        m.append(dong);
        if (item.tieuDe) {
          m.append(Object.assign(e('b', null, item.tieuDe), { style: 'display:block;margin-top:6px;' }));
        }
        if (item.chuThich) {
          const pNd = e('p', null, item.chuThich);
          pNd.style.cssText = 'white-space:pre-wrap;margin-top:4px;line-height:1.5;color:var(--chu);';
          m.append(pNd);
        }
        ds.append(m);
      });
      khung.append(ds);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

/* ================= Điều hướng ================= */

const TRANG = {
  '/tong-quan': trangTongQuan,
  '/diem-danh': trangDiemDanh,
  '/diem-danh-lich-su': () => trangDiemDanhLichSu(KHUNG),
  '/hoc-sinh': trangHocSinh,
  '/hoat-dong-lop': () => trangHoatDongLop(KHUNG),
  '/hoat-dong-lop-khoi-phuc': () => trangLichSuKhoiPhucChung(KHUNG, { muc: 'hoat-dong-lop', tieuDe: 'Hoạt động lớp', veTrangTruoc: '#/hoat-dong-lop' }),
  '/thong-bao': trangThongBao,
  '/thong-bao-khoi-phuc': () => trangLichSuKhoiPhucChung(KHUNG, { muc: 'thong-bao', tieuDe: 'Thông báo', veTrangTruoc: '#/thong-bao' }),
  '/thong-ke': () => trangThongKe(KHUNG),
  '/bao-cao': () => trangBaoCao(KHUNG),
  '/ma-ca-nhan': () => trangMaCaNhan(KHUNG),
  '/nhat-ky-dang-nhap': () => trangNhatKyDangNhap(KHUNG),
  '/hinh-anh': () => trangHinhAnh(KHUNG),
  '/hinh-anh-thung-rac': () => trangHinhAnhThungRac(KHUNG),
  '/thu-vien-am-thanh': () => trangThuVienAmThanh(KHUNG),
  '/thu-vien-am-thanh-thung-rac': () => trangThuVienAmThanhThungRac(KHUNG),
  '/thu-vien-video': () => trangThuVienVideo(KHUNG),
  '/thu-vien-video-thung-rac': () => trangThuVienVideoThungRac(KHUNG),
  '/quy': () => trangQuy(KHUNG),
  '/quy-lich-su': () => trangQuyLichSu(KHUNG),
  '/thoi-khoa-bieu': () => trangThoiKhoaBieu(KHUNG),
  '/thoi-khoa-bieu-lich-su': () => trangThoiKhoaBieuLichSu(KHUNG),
  '/thoi-khoa-bieu-khoi-phuc': () => trangLichSuKhoiPhucChung(KHUNG, { muc: 'thoi-khoa-bieu', tieuDe: 'Thời khoá biểu', veTrangTruoc: '#/thoi-khoa-bieu' }),
  '/them': trangThem,
};

function danhDauMenu(duong) {
  $$('.cot-trai a, .tab-duoi a').forEach((a) => {
    const trongMucThem = ['/thong-ke', '/thong-bao', '/bao-cao', '/ma-ca-nhan', '/hinh-anh', '/thu-vien-am-thanh', '/thu-vien-video', '/hoat-dong-lop', '/thoi-khoa-bieu'].includes(duong);
    const khop = a.getAttribute('href') === '#' + duong
      || (duong.startsWith('/hoc-sinh') && a.getAttribute('href') === '#/hoc-sinh')
      || (duong === '/diem-danh-lich-su' && a.getAttribute('href') === '#/diem-danh')
      || (duong === '/quy-lich-su' && a.getAttribute('href') === '#/quy')
      || (duong === '/thong-bao-khoi-phuc' && a.getAttribute('href') === '#/thong-bao')
      || (duong === '/hoat-dong-lop-khoi-phuc' && a.getAttribute('href') === '#/hoat-dong-lop')
      || (duong === '/thoi-khoa-bieu-khoi-phuc' && a.getAttribute('href') === '#/thoi-khoa-bieu')
      || (duong === '/hinh-anh-thung-rac' && a.getAttribute('href') === '#/hinh-anh')
      || (duong === '/thu-vien-am-thanh-thung-rac' && a.getAttribute('href') === '#/thu-vien-am-thanh')
      || (duong === '/thu-vien-video-thung-rac' && a.getAttribute('href') === '#/thu-vien-video')
      || (trongMucThem && a.dataset.nhom === 'them');
    if (khop) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

async function dieuHuong() {
  const duong = location.hash.replace(/^#/, '') || (PHIEN.role === 'teacher' ? '/tong-quan' : '/them');
  danhDauMenu(duong);
  window.scrollTo(0, 0);

  if (!duocVaoTuyen(duong) && duong !== '/them') {
    datNoiDung(KHUNG, khoiLoi(
      'Tài khoản này không có quyền vào mục này. Vào "Thêm" để xem các việc bạn được phép làm.'
    ));
    return;
  }

  try {
    const hoSo = duong.match(/^\/hoc-sinh\/(\d+)$/);
    if (hoSo) return await trangHoSo(Number(hoSo[1]));

    const xemTkb = duong.match(/^\/thoi-khoa-bieu-xem\/(\d+)$/);
    if (xemTkb) return await trangThoiKhoaBieu(KHUNG, Number(xemTkb[1]));

    const xuLy = TRANG[duong] || (PHIEN.role === 'teacher' ? trangTongQuan : trangThem);
    await xuLy();
  } catch (err) {
    console.error(err);
    datNoiDung(KHUNG, khoiLoi('Không tải được trang: ' + err.message));
  }
}

(async function khoiDong() {
  try {
    const d = await api('/api/whoami');
    PHIEN = { role: d.role, ten: d.ten || '', vaiTro: d.vaiTro || '', quyen: d.quyen || [], tenLop: d.tenLop || '' };
  } catch {
    // Không lấy được thì coi như giáo viên (an toàn hơn là ẩn hết) — API vẫn tự kiểm tra thật ở máy chủ.
  }

  // Chỉ hiện tên + quyền — tên lớp đang quản lý đã hiện sẵn ở huy hiệu/tiêu đề ngay cạnh đó
  // (xem thêm giải thích ở hàm cập nhật .hieu-phu phía trên), không nhắc lại ở đây nữa.
  const hieuPhu = document.querySelector('.hieu-phu');
  if (hieuPhu) {
    hieuPhu.textContent = layNhanTaiKhoan(PHIEN);
  }
  if (PHIEN.tenLop) {
    document.title = `Quản lý ${PHIEN.tenLop}`;
    const hieuMaLop = document.querySelector('#hieuMaLop');
    if (hieuMaLop) hieuMaLop.textContent = PHIEN.tenLop.replace(/^Lớp\s*/i, '');
  }

  // "Đổi lớp chủ nhiệm" — chỉ giáo viên chủ nhiệm mới có (người có thể giữ mã của nhiều lớp);
  // tài khoản cán sự chỉ gắn với đúng một lớp nên nút này không có ý nghĩa gì với họ.
  const nutDoiLop = document.querySelector('#nutDoiLop');
  if (nutDoiLop) nutDoiLop.hidden = PHIEN.role !== 'teacher';

  locMenuTheoQuyen();
  addEventListener('hashchange', dieuHuong);
  dieuHuong();

  // Nút loa nhạc nền — cùng hành vi với trang lớp, để chuyển qua lại giữa khu quản lý và
  // trang lớp không thấy thanh đầu trang khác nhau.
  api('/api/nhac-nen-info').then((d) => ganNhacNen(d.nhac)).catch(() => {});

  // Có mạng trở lại thì tự gửi những lần điểm danh còn nằm chờ trong máy.
  tuDongBoKhiCoMang((kq) => {
    nhac(`Đã gửi ${kq.daGui} lần điểm danh lưu tạm lúc mất mạng`, 'tot');
    if (location.hash.startsWith('#/diem-danh') || location.hash.startsWith('#/tong-quan')) dieuHuong();
  });
})();
