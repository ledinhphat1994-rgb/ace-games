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
  'cai-dat': null,
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
// tự ưu tiên hiển thị (Điểm danh/Thủ quỹ đặt trước vì là 2 quyền phổ biến nhất hay cấp riêng lẻ).
// .cot-trai/.tab-duoi gốc giờ CHỈ còn 3 mục Tổng quan/Người dùng/Campus (đều giáo-viên-only) —
// không mục nào cố định cho cán sự nữa, nên MỌI quyền ở đây đều cần lối tắt riêng, nếu không tài
// khoản chỉ được cấp đúng 1-2 quyền này sẽ chẳng còn cách nào bấm sang mục khác ngoài "Thêm"/
// "Khu quản lý" (xem damBaoMucThem). Icon lấy y hệt icon dùng ở menu đầy đủ (#menuDayDu) cho nhất quán.
export const LOI_TAT_THEO_QUYEN = [
  ['diem-danh', '#/diem-danh', 'Điểm danh', '<rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>'],
  ['quy', '#/quy', 'Thủ quỹ', '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>'],
  ['thong-bao', '#/thong-bao', 'Thông báo', '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'],
  ['thoi-khoa-bieu', '#/thoi-khoa-bieu', 'TKB', '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'],
  ['hinh-anh', '#/hinh-anh', 'Ảnh', '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'],
  ['am-thanh', '#/thu-vien-am-thanh', 'Âm thanh', '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 9l12-2"/>'],
  ['video', '#/thu-vien-video', 'Video', '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>'],
];
export const TOI_DA_TAB_CHINH = 4;   // tối đa 4 lối tắt trước "Thêm" — vừa đủ 5 tab trong lưới 7 cột của .tab-duoi

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

// .cot-trai/.tab-duoi gốc (xem giao-vien/index.html) chỉ hard-code đúng 3 mục Tổng quan/Người
// dùng/Campus, cả 3 đều quyenCan=null (giáo-viên-only) — với tài khoản cán sự, vòng lọc bên dưới
// sẽ xoá sạch cả 3, để lại thanh điều hướng HOÀN TOÀN TRỐNG nếu không bù lại một lối vào "#/them"
// (trang tổng hợp mọi quyền được cấp — xem pages/noi-dung.js:trangThem). Giáo viên không gọi tới
// hàm này (return sớm ở locMenuTheoQuyen) nên 2 thanh của giáo viên không bị thêm mục này.
function damBaoMucThem() {
  [$('.cot-trai .nhom-dieu-huong'), $('#tabDuoi')].forEach((boc) => {
    if (!boc || boc.querySelector('a[href="#/them"]')) return;
    const a = e('a');
    a.href = '#/them';
    a.append(e('span', 'bieu-tuong', '⋯'), document.createTextNode('Thêm'));
    boc.append(a);
  });
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
  if (PHIEN.role === 'teacher') return;
  damBaoMucThem();
  $$('.cot-trai a, .tab-duoi a, #menuDayDu a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#/')) return;   // bỏ qua "Xem trang lớp", "Đăng xuất"...
    if (href === '#/them') return;         // menu "Thêm" luôn hiện, tự lọc bên trong
    if (!duocVaoTuyen(href.slice(1))) a.remove();
  });
  themLoiTatTabDuoi();

  // Mục "Thêm" (cả cột trái lẫn tab dưới) cũng đổi tên giống tiêu đề trang (xem trangThem) — với
  // tài khoản cán sự đây là toàn bộ khu quản lý của họ, không phải "vài mục thêm" như với giáo viên.
  $$('.tab-duoi a[href="#/them"], .cot-trai a[href="#/them"]').forEach((nutThem) => {
    // Không lấy text node ĐẦU TIÊN — đó là khoảng trắng/xuống dòng nằm TRƯỚC <span class="bieu-
    // tuong">, không phải chữ "Thêm" (nằm sau, cùng cấp). Lọc đúng node có chữ thật.
    const nutChu = Array.from(nutThem.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (nutChu) nutChu.textContent = 'Khu quản lý';
  });

  // Ẩn luôn tiêu đề nhóm nếu không còn mục nào trong nhóm đó (tài khoản đặc biệt chỉ có vài quyền).
  $$('.cot-trai .nhom-dieu-huong').forEach((nhom) => {
    if (!nhom.querySelector('a')) nhom.remove();
  });

  // Đã ghi ".hieu-phu" một lần duy nhất ở khoiDong() (chạy TRƯỚC hàm này, cho MỌI vai trò) —
  // không ghi lại ở đây nữa để khỏi trùng logic 2 nơi cùng tranh nhau ghi vào đúng một chỗ.
}

/* ================= Từ điển hiển thị ================= */

export const KHUNG = $('#noiDung');

// route (bỏ dấu "/" đầu, đã cắt phần con của route động) -> href mục cha trên .cot-trai/.tab-duoi/
// #menuDayDu — dùng để đánh dấu "đang xem" đúng mục cha cho các trang KHÔNG có mặt trực tiếp trên
// cả 3 thanh điều hướng (vd Điểm danh chỉ vào được qua thẻ "Lớp phụ trách" ở Tổng quan, không có
// mục riêng nào trong điều hướng chính — xem renderThanhDieuHuongLop cho điều hướng cấp con).
const CHA_CUA_TUYEN = {
  'tong-quan': '#/tong-quan',
  'lop-quan-tri': '#/tong-quan',
  'hoc-sinh': '#/tong-quan',
  'diem-danh': '#/tong-quan',
  'diem-danh-lich-su': '#/tong-quan',
  quy: '#/tong-quan',
  'quy-lich-su': '#/tong-quan',
  'thoi-khoa-bieu': '#/tong-quan',
  'thoi-khoa-bieu-lich-su': '#/tong-quan',
  'thoi-khoa-bieu-khoi-phuc': '#/tong-quan',
  'thoi-khoa-bieu-xem': '#/tong-quan',
  'ma-cong-dong': '#/tong-quan',
  'ma-ca-nhan': '#/tong-quan',
  'thong-ke': '#/tong-quan',
  'nguoi-dung': '#/nguoi-dung',
  'bao-cao-vi-pham': '#/nguoi-dung',
  'duyet-giao-vien': '#/nguoi-dung',
  'campus-quan-tri': '#/campus-quan-tri',
  'phong-campus': '#/campus-quan-tri',
  'campus-highlights': '#/campus-quan-tri',
  'bang-tin-quan-tri': '#/campus-quan-tri',
  'thong-bao': '#/campus-quan-tri',
  'thong-bao-khoi-phuc': '#/campus-quan-tri',
  'bien-tap-vien': '#/campus-quan-tri',
  'hinh-anh': '#/campus-quan-tri',
  'hinh-anh-thung-rac': '#/campus-quan-tri',
  'thu-vien-am-thanh': '#/campus-quan-tri',
  'thu-vien-am-thanh-thung-rac': '#/campus-quan-tri',
  'thu-vien-video': '#/campus-quan-tri',
  'thu-vien-video-thung-rac': '#/campus-quan-tri',
  'cai-dat': '#/cai-dat',
  'ho-so-gv': '#/cai-dat',
  'bao-cao': '#/cai-dat',
  'nhat-ky-dang-nhap': '#/cai-dat',
  'reset-du-lieu': '#/cai-dat',
  them: '#/them',
};

export function danhDauMenu(duong) {
  const duongThuc = duong || '/tong-quan';
  const khoa = duongThuc.replace(/^\//, '').replace(/\/.*$/, '');
  const hrefTrucTiep = '#' + duongThuc;
  const hrefCha = CHA_CUA_TUYEN[khoa] || null;
  // Khớp TRỰC TIẾP (vd "#/tong-quan", hoặc lối tắt riêng đã chèn cho cán sự — xem
  // themLoiTatTabDuoi) được ưu tiên ngang với khớp qua mục cha — một trang có thể xuất hiện dưới
  // cả 2 dạng tuỳ tài khoản (giáo viên thấy nhóm cha, cán sự thấy đúng lối tắt của mình).
  $$('.cot-trai a, .tab-duoi a, #menuDayDu a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href && (href === hrefTrucTiep || href === hrefCha)) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

// Dải pill điều hướng ngang dùng chung cho các trang lá của domain "Lớp học" (Học sinh/Điểm danh/
// Quỹ/TKB/Mã cộng đồng/Cán sự) — các trang này không còn subtab cha ổn định nào (hub ở
// #/lop-quan-tri chỉ là điểm vào, không bọc quanh chúng), nên mỗi trang tự vẽ dải này ở đầu để
// vẫn nhảy ngang được sang trang khác trong cùng domain mà không phải quay lại hub trước.
const CAC_MUC_LOP = [
  ['#/hoc-sinh', '👥 Học sinh'],
  ['#/diem-danh', '📋 Điểm danh'],
  ['#/quy', '💰 Thủ quỹ'],
  ['#/thoi-khoa-bieu', '📅 TKB'],
  ['#/ma-cong-dong', '🔑 Mã cộng đồng'],
  ['#/ma-ca-nhan', '🔐 Cán sự lớp'],
];
// Điểm danh/Thủ quỹ/TKB (khác hẳn Học sinh) chưa theo layPhamViQuanTri ở máy chủ — luôn thao tác
// đúng lớp chủ nhiệm của PHIÊN ĐĂNG NHẬP (phien.lopId), bất kể "Phạm vi" đang chọn ở thanh trên
// (xem functions/api/gv/diem-danh.js, quy.js, thoi-khoa-bieu.js — dùng thẳng phien.lopId, không
// nhận ?lopId=). Tài khoản 1 lớp bị khoá cứng PHAM_VI_LOP_ID=null (xem app.js:khoiDong) nên chỉ
// School Admin/GVCN kiêm nhiệm mới có thể đặt khác null — cảnh báo dưới đây vì vậy chỉ có thể
// xuất hiện với 2 loại tài khoản đó, không làm phiền số đông tài khoản 1 lớp.
export function canhBaoPhamViKhongApDung(khung) {
  if (!PHAM_VI_LOP_ID) return;
  const canhBao = e('div');
  canhBao.style.cssText = 'margin-bottom: 16px; padding: 10px 14px; border-radius: 12px; background: color-mix(in srgb, #F59E0B 12%, transparent); border: 1px solid color-mix(in srgb, #F59E0B 35%, transparent); color: #F59E0B; font-size: 12.5px; font-weight: 600;';
  canhBao.textContent = '⚠️ Trang này luôn thao tác trên lớp chủ nhiệm của tài khoản đang đăng nhập, chưa theo đúng "Phạm vi" đang chọn ở thanh trên.';
  khung.append(canhBao);
}

export function renderThanhDieuHuongLop(khung, hrefDangXem) {
  const thanh = e('div');
  thanh.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;';
  const veHub = e('a', 'nut nut-nhe nut-nho', '← Lớp học');
  veHub.href = '#/lop-quan-tri';
  veHub.style.cssText = 'border-radius: 12px; font-weight: 700;';
  thanh.append(veHub);
  CAC_MUC_LOP.forEach(([href, nhan]) => {
    const a = e('a', href === hrefDangXem ? 'nut nut-chinh nut-nho' : 'nut nut-vien nut-nho', nhan);
    a.href = href;
    a.style.cssText = 'border-radius: 12px; font-weight: 700;';
    thanh.append(a);
  });
  khung.append(thanh);
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
