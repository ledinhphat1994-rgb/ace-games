import { trangThem } from './pages/noi-dung.js';
import { $, $$, api, e, ngayDayDu, ngayVN } from '/assets/js/chung.js';


// Mỗi tuyến ứng với đúng một "quyenCan" phía máy chủ (functions/api/gv/*.js).
// null = CHỈ giáo viên chủ nhiệm (dữ liệu nhạy cảm: hồ sơ, điểm, thống kê từng em...).
export const QUYEN_THEO_TUYEN = {
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
  'reset-du-lieu': null,
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
  'tong-quan': null,
  'campus-quan-tri': null,
  'bang-tin-quan-tri': null,
  'lop-quan-tri': null,
  'kiem-duyet-quan-tri': null,
  'he-thong-quan-tri': null,
  'campus-highlights': null,
  'ho-so-gv': null,
  'phong-campus': null,
  'bao-cao-vi-pham': null,
  'duyet-giao-vien': null,
  'ma-cong-dong': null,
  'bien-tap-vien': null,
};

// Phiên đăng nhập hiện tại — nạp một lần khi mở trang, dùng để ẩn bớt menu cho tài khoản đặc biệt.
export let PHIEN = { role: 'teacher', ten: '', vaiTro: '', quyen: [] };
export function datPhien(p) { PHIEN = p; }

// Phạm vi quản trị đang chọn ở thanh trên (Admin IA v1): null = "Toàn trường", số = lopId cụ thể.
// Lưu sessionStorage để giữ nguyên lựa chọn khi chuyển tab trong Khu quản trị, không cần chọn lại.
export let PHAM_VI_LOP_ID = (() => {
  const v = sessionStorage.getItem('qt-pham-vi-lop-id');
  return v ? Number(v) : null;
})();
export function datPhamVi(lopId) {
  PHAM_VI_LOP_ID = lopId || null;
  if (PHAM_VI_LOP_ID) sessionStorage.setItem('qt-pham-vi-lop-id', String(PHAM_VI_LOP_ID));
  else sessionStorage.removeItem('qt-pham-vi-lop-id');
}
// Nối ?lopId= vào URL API khi đang xem 1 lớp cụ thể (không thêm gì khi đang ở "Toàn trường").
export function apiTheoPhamVi(url) {
  if (!PHAM_VI_LOP_ID) return url;
  return url + (url.includes('?') ? '&' : '?') + 'lopId=' + PHAM_VI_LOP_ID;
}

export function duocVaoTuyen(duong) {
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
export const LOI_TAT_THEO_QUYEN = [
  ['thong-bao', '#/thong-bao', 'Thông báo', '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'],
  ['thoi-khoa-bieu', '#/thoi-khoa-bieu', 'TKB', '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'],
  ['hinh-anh', '#/hinh-anh', 'Ảnh', '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'],
  ['am-thanh', '#/thu-vien-am-thanh', 'Âm thanh', '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 9l12-2"/>'],
  ['video', '#/thu-vien-video', 'Video', '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>'],
];
export const TOI_DA_TAB_CHINH = 4;   // 4 lối tắt + "Thêm" = 5 tab, cùng mật độ với thanh của giáo viên

/** Bù thêm lối tắt cho những quyền KHÔNG có chỗ cố định trong #tabDuoi (xem LOI_TAT_THEO_QUYEN),
    chèn ngay trước tab "Thêm" — để tài khoản chỉ được cấp vd "Thông báo" vẫn có tab riêng thay vì
    chỉ còn mỗi "Thêm" để bấm vào mọi thứ. */
export function themLoiTatTabDuoi() {
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
export function locMenuTheoQuyen() {
  // "Đổi lớp chủ nhiệm" chỉ có ý nghĩa với giáo viên (người có thể giữ mã của NHIỀU lớp) —
  // tài khoản cán sự chỉ gắn với đúng một lớp nên không cần mục này, dù nút tắt trên thanh
  // đầu trang (khác hẳn mục trong Menu này) vẫn luôn hiện với mọi tài khoản như bình thường.
  if (PHIEN.role !== 'teacher') {
    const mucDoiLop = document.getElementById('mucDoiLop');
    if (mucDoiLop) mucDoiLop.remove();
  }
  if (!PHIEN.isSchoolAdmin && PHIEN.role !== 'teacher') {
    const menuDuyet = document.getElementById('menuDuyetGiaoVien');
    if (menuDuyet) menuDuyet.remove();
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

  // Đã ghi ".hieu-phu" một lần duy nhất ở khoiDong() (chạy TRƯỚC hàm này, cho MỌI vai trò) —
  // không ghi lại ở đây nữa để khỏi trùng logic 2 nơi cùng tranh nhau ghi vào đúng một chỗ.
}

/* ================= Từ điển hiển thị ================= */

export const KHUNG = $('#noiDung');

export function danhDauMenu(duong) {
  $$('.cot-trai a, .tab-duoi a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    let khop = false;
    if (href === '#/tong-quan' && (duong === '/tong-quan' || !duong || duong === '')) khop = true;
    else if (href === '#/nguoi-dung' && duong === '/nguoi-dung') khop = true;
    else if (href === '#/campus-quan-tri' && (duong === '/campus-quan-tri' || duong === '/phong-campus' || duong === '/campus-highlights')) khop = true;
    else if (href === '#/bang-tin-quan-tri' && (duong === '/bang-tin-quan-tri' || duong === '/thong-bao' || duong === '/thong-bao-khoi-phuc' || duong === '/bien-tap-vien' || duong === '/hinh-anh' || duong === '/hinh-anh-thung-rac' || duong === '/thu-vien-am-thanh' || duong === '/thu-vien-am-thanh-thung-rac' || duong === '/thu-vien-video' || duong === '/thu-vien-video-thung-rac')) khop = true;
    else if (href === '#/lop-quan-tri' && (duong === '/lop-quan-tri' || duong === '/hoc-sinh' || duong.startsWith('/hoc-sinh/') || duong === '/diem-danh' || duong === '/diem-danh-lich-su' || duong === '/quy' || duong === '/quy-lich-su' || duong === '/thoi-khoa-bieu' || duong === '/thoi-khoa-bieu-lich-su' || duong === '/thoi-khoa-bieu-khoi-phuc' || duong.startsWith('/thoi-khoa-bieu-xem') || duong === '/ma-cong-dong' || duong === '/ma-ca-nhan')) khop = true;
    else if (href === '#/kiem-duyet-quan-tri' && (duong === '/kiem-duyet-quan-tri' || duong === '/bao-cao-vi-pham' || duong === '/duyet-giao-vien')) khop = true;
    else if (href === '#/he-thong-quan-tri' && (duong === '/he-thong-quan-tri' || duong === '/ho-so-gv' || duong === '/bao-cao' || duong === '/nhat-ky-dang-nhap' || duong === '/reset-du-lieu' || duong === '/thong-ke')) khop = true;
    else if (href === '#' + duong) khop = true;

    if (khop) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

// Định dạng "HH:MM ngày DD/MM" từ chuỗi datetime('now') của D1 (UTC) sang giờ Việt Nam (UTC+7) —
// dùng riêng cho Nhật ký quản trị, không đụng tới ngayVN/ngayDayDu (định dạng cho ngày dạng YYYY-MM-DD).
export function gioNgayVN(taoLucUtc) {
  const d = new Date(taoLucUtc.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return taoLucUtc;
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const hh = String(vn.getUTCHours()).padStart(2, '0');
  const mm = String(vn.getUTCMinutes()).padStart(2, '0');
  const dd = String(vn.getUTCDate()).padStart(2, '0');
  const mo = String(vn.getUTCMonth() + 1).padStart(2, '0');
  return `${hh}:${mm} ${dd}/${mo}`;
}
