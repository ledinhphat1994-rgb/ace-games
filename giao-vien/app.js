/* Ứng dụng quản lý lớp dành cho giáo viên chủ nhiệm.
   Điều hướng bằng dấu # trên thanh địa chỉ: #/diem-danh, #/hoc-sinh, ... */
import {
  $, $$, e, datNoiDung, api, homNay, ngayVN, ngayDayDu,
  ganDoiGiaoDien, nhac, khoiLoi, khoiDangTai,
  layNhanTaiKhoan, layCacDongTaiKhoan, moBangThemeBg, ganNhacNen, nhanMucDo, giuViTriCuonKhiVe,
  batDauTheoDoiPhien,
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
import { trangResetDuLieu } from './trang-reset-du-lieu.js';

ganDoiGiaoDien($('#doiGiaoDien'));

const nutTheme = $('#nutThemeBg');
if (nutTheme) nutTheme.addEventListener('click', moBangThemeBg);

const KHUNG = $('#noiDung');

// Mỗi tuyến ứng với đúng một "quyenCan" phía máy chủ (functions/api/gv/*.js).
// null = CHỈ giáo viên chủ nhiệm (dữ liệu nhạy cảm: hồ sơ, điểm, thống kê từng em...).
const QUYEN_THEO_TUYEN = {
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
let PHIEN = { role: 'teacher', ten: '', vaiTro: '', quyen: [] };

// Phạm vi quản trị đang chọn ở thanh trên (Admin IA v1): null = "Toàn trường", số = lopId cụ thể.
// Lưu sessionStorage để giữ nguyên lựa chọn khi chuyển tab trong Khu quản trị, không cần chọn lại.
let PHAM_VI_LOP_ID = (() => {
  const v = sessionStorage.getItem('qt-pham-vi-lop-id');
  return v ? Number(v) : null;
})();
function datPhamVi(lopId) {
  PHAM_VI_LOP_ID = lopId || null;
  if (PHAM_VI_LOP_ID) sessionStorage.setItem('qt-pham-vi-lop-id', String(PHAM_VI_LOP_ID));
  else sessionStorage.removeItem('qt-pham-vi-lop-id');
}
// Nối ?lopId= vào URL API khi đang xem 1 lớp cụ thể (không thêm gì khi đang ở "Toàn trường").
function apiTheoPhamVi(url) {
  if (!PHAM_VI_LOP_ID) return url;
  return url + (url.includes('?') ? '&' : '?') + 'lopId=' + PHAM_VI_LOP_ID;
}

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

const DIEM_DANH = {
  co_mat:          { ten: 'Có mặt',        ky: '✓', lop: 'nhan-tot' },
  tre:             { ten: 'Đi trễ',        ky: 'T', lop: 'nhan-luuy' },
  vang_phep:       { ten: 'Vắng có phép',  ky: 'P', lop: 'nhan' },
  vang_khong_phep: { ten: 'Vắng không phép', ky: '✗', lop: 'nhan-xau' },
};

const TEN_BUOI = { sang: 'Buổi sáng', chieu: 'Buổi chiều', hoat_dong: 'Hoạt động' };

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

      hang.append(e('div', 'stt', h.soThuTu ?? h.id), ten);

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

          hang.append(e('div', 'stt', h.soThuTu ?? h.id), ten);

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
        await api('/api/gv/rieng/hoc-sinh', {
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
        await api('/api/gv/rieng/hoc-sinh?id=' + h.id, { method: 'DELETE' });
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
  api('/api/gv/rieng/cau-hinh-hoc-sinh').then((cfg) => {
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
          await api('/api/gv/rieng/cau-hinh-hoc-sinh', { method: 'PATCH', than: { congKhaiAn } });
          dongHopThoai();
          nhac('Đã lưu cấu hình hiển thị', 'tot');
        } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
      }),
    ]);
  }).catch((err) => nhac(err.message, 'xau'));
}

async function trangHocSinh() {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api('/api/gv/rieng/hoc-sinh');
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
  const d = await api('/api/gv/rieng/hoc-sinh?id=' + encodeURIComponent(id));
  const h = d.hocSinh;
  let tab = tabMacDinh || sessionStorage.getItem('hs-tab') || 'chuyen-can';
  if (!CAC_TAB_HO_SO.some(([ma]) => ma === tab)) tab = 'chuyen-can';

  const khung = e('div');
  // Quay lại ĐÚNG chỗ vừa đến (Tổng quan, Danh sách...), không phải luôn về Danh sách cố định
  // — nếu không, bấm nút Back thật của trình duyệt sau đó sẽ nhảy lung tung.
  const quayLai = nut('← Quay lại', 'nut-vien nut-nho', () => {
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
            await api('/api/gv/rieng/hoc-sinh', { method: 'PATCH', than: { id: h.id, dangHoc: false } });
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

    const dsLh = await api('/api/gv/rieng/lien-he?hocSinhId=' + h.id);
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
            await api('/api/gv/rieng/lien-he?id=' + lh.id, { method: 'DELETE' });
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
        await api('/api/gv/rieng/lien-he', {
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
        await api('/api/gv/rieng/lien-he', {
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
        await api('/api/gv/rieng/hoc-sinh', {
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
  ['#/thoi-khoa-bieu', '▦', 'Thời khoá biểu', 'Sửa thời khoá biểu hiện trên trang lớp.'],
  ['#/bao-cao', '⬇', 'Báo cáo & xuất dữ liệu', 'Tải tệp CSV mở bằng Excel để nộp trường.'],
  ['#/quy', '💰', 'Thủ quỹ', 'Ghi thu, ghi chi, xem tồn quỹ.'],
  ['#/hinh-anh', '🖼', 'Thư viện Ảnh', 'Đăng ảnh của lớp, tự nén nhỏ trước khi tải lên.'],
  ['#/thu-vien-am-thanh', '♪', 'Thư viện Âm thanh', 'Tải bài hát, đặt bài nào phát làm nhạc nền trang chủ.'],
  ['#/thu-vien-video', '🎬', 'Thư viện Video', 'Tải video từ máy/điện thoại lên, dùng lại khi soạn thông báo.'],
  ['#/ma-ca-nhan', '🔑', 'Mã cá nhân & phân quyền', 'Cấp mã, cấp quyền quản lý cho lớp trưởng, thủ quỹ...'],
  ['#/reset-du-lieu', '↻', 'Reset dữ liệu lớp', 'Xoá sạch từng mục theo lựa chọn, hầu hết khôi phục lại được ngay.'],
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

/* ================= Khu Quản Trị: Tiêu Điểm, Hồ Sơ & Phòng Campus ================= */

async function trangCampusHighlights() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách Tiêu điểm Campus...'));
  try {
    const data = await api('/api/campus-highlights');
    const isCurated = Boolean(data.isCurated);
    const items = isCurated && Array.isArray(data.highlights) && data.highlights.length > 0 ? [...data.highlights] : [];

    const khung = e('div');
    khung.append(tieuDeTrang('✨ Biên Tập Tiêu Điểm Campus (Highlights)', 'Điều phối các thẻ nội dung nổi bật xuất hiện trên cột trái Digital Campus cho toàn trường. Dữ liệu lưu trữ máy chủ (Server-authoritative).'));

    // Status banner
    const banner = e('div');
    banner.style.cssText = 'padding: 10px 16px; border-radius: 12px; margin-bottom: 20px; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: space-between; gap: 12px;';
    if (isCurated) {
      banner.style.background = 'rgba(0, 242, 254, 0.1)';
      banner.style.border = '1px solid rgba(0, 242, 254, 0.3)';
      banner.style.color = '#00F2FE';
      banner.textContent = '⚡ Đang hiển thị bản Curation do Giáo viên xuất bản.';
    } else {
      banner.style.background = 'rgba(168, 85, 247, 0.1)';
      banner.style.border = '1px solid rgba(168, 85, 247, 0.3)';
      banner.style.color = '#C084FC';
      banner.textContent = '🤖 Đang dùng nguồn tự động từ dữ liệu hoạt động thực tế của trường.';
    }
    khung.append(banner);

    // Live preview container
    const vungPreview = e('div', 'the');
    vungPreview.style.cssText = 'background: #0B0E14; border: 1px solid rgba(0,242,254,0.3); border-radius: 16px; padding: 18px; margin-bottom: 24px;';

    const previewHeader = e('div');
    previewHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;';
    previewHeader.innerHTML = '<span style="font-size: 13px; font-weight: 800; color: #00F2FE;">👁️ Xem trước Live (Giao diện cột trái Campus)</span><span style="font-size: 11px; color: var(--chu-nhat);">Tự động cập nhật khi chỉnh sửa</span>';
    vungPreview.append(previewHeader);

    const danhSachThePreview = e('div');
    danhSachThePreview.id = 'preview-highlights-list';
    danhSachThePreview.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;';
    vungPreview.append(danhSachThePreview);

    function vePreview() {
      danhSachThePreview.innerHTML = '';
      if (items.length === 0) {
        const trong = e('div');
        trong.id = 'preview-empty-text';
        trong.style.cssText = 'grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--chu-nhat); font-size: 13px; font-style: italic;';
        trong.textContent = 'Chưa có tiêu điểm nào. Bấm "+ Thêm Spotlight" hoặc "Dùng nguồn tự động" để khởi tạo.';
        danhSachThePreview.append(trong);
        return;
      }
      items.forEach((it) => {
        const the = e('div');
        the.style.cssText = 'background: #151A23; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px; display: flex; align-items: center; gap: 12px;';
        the.innerHTML = `
          <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(0,242,254,0.15); border: 1px solid rgba(0,242,254,0.3); display: flex; align-items: center; justify-content: center; font-size: 18px; shrink: 0;">${it.icon || it.bieuTuong || '⭐'}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
              <span style="font-size: 9px; font-weight: 900; padding: 1px 6px; border-radius: 9999px; background: rgba(0,242,254,0.2); color: #00F2FE; text-transform: uppercase;">${it.badge || 'NỔI BẬT'}</span>
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${it.title || it.tieuDe || 'Chưa có tiêu đề'}</div>
            <div style="font-size: 11px; color: var(--chu-nhat); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${it.subtitle || it.sub || it.chiTiet || 'Mô tả'}</div>
          </div>
        `;
        danhSachThePreview.append(the);
      });
    }

    vePreview();
    khung.append(vungPreview);

    // Editor container
    const vungEditor = e('div', 'the');
    vungEditor.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px;';

    const editorHeader = e('div');
    editorHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;';
    const tieuDeEditor = e('h3');
    tieuDeEditor.style.cssText = 'font-size: 15px; font-weight: 800; color: #fff; margin: 0;';
    tieuDeEditor.id = 'editor-highlights-title';
    tieuDeEditor.textContent = `Danh sách tiêu điểm (${items.length}/4)`;
    editorHeader.append(tieuDeEditor);

    const nutThem = nut('+ Thêm Spotlight', 'nut-phu', () => {
      if (items.length >= 4) {
        nhac('Tối đa 4 tiêu điểm nổi bật.', 'canh-bao');
        return;
      }
      items.push({
        id: 'spotlight-' + Date.now(),
        badge: 'SPOTLIGHT',
        category: 'Hoạt động',
        title: '',
        subtitle: '',
        icon: '✨',
        actionType: 'spotlight',
        loai: 'spotlight',
        sourceType: 'manual',
        audience: 'school'
      });
      veFormVaPreview();
    });
    nutThem.id = 'btn-them-spotlight';
    editorHeader.append(nutThem);
    vungEditor.append(editorHeader);

    const danhSachForm = e('div');
    danhSachForm.id = 'danh-sach-form-highlights';
    danhSachForm.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

    function veFormVaPreview() {
      tieuDeEditor.textContent = `Danh sách tiêu điểm (${items.length}/4)`;
      danhSachForm.innerHTML = '';

      if (items.length === 0) {
        const emptyBox = e('div');
        emptyBox.id = 'empty-highlights-state';
        emptyBox.style.cssText = 'padding: 32px; text-align: center; background: #0B0E14; border: 1px dashed rgba(255,255,255,0.15); border-radius: 14px;';
        emptyBox.innerHTML = `
          <div style="font-size: 32px; margin-bottom: 8px;">✨</div>
          <p style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 4px;">Chưa có tiêu điểm</p>
          <p style="font-size: 12px; color: var(--chu-nhat); margin-bottom: 16px;">Bấm nút "+ Thêm Spotlight" để tự biên soạn hoặc dùng nguồn dữ liệu tự động từ hệ thống.</p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button type="button" class="nut nut-chinh" id="btn-empty-them-spotlight">+ Thêm Spotlight</button>
            <button type="button" class="nut nut-phu" id="btn-empty-dung-tu-dong">🔄 Dùng nguồn tự động</button>
          </div>
        `;
        const bThem = emptyBox.querySelector('#btn-empty-them-spotlight');
        if (bThem) bThem.onclick = () => nutThem.click();
        const bTuDong = emptyBox.querySelector('#btn-empty-dung-tu-dong');
        if (bTuDong) bTuDong.onclick = () => nutReset.click();
        danhSachForm.append(emptyBox);
        vePreview();
        return;
      }

      items.forEach((it, idx) => {
        const hang = e('div');
        hang.className = 'item-highlight-card';
        hang.style.cssText = 'background: #151A23; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px;';

        const hangTieuDe = e('div');
        hangTieuDe.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;';
        hangTieuDe.innerHTML = `
          <span style="font-size: 12px; font-weight: 800; color: #8B5CF6;">#${idx + 1} • ${it.sourceType === 'manual' ? 'Teacher Spotlight' : 'Tiêu điểm hoạt động'}</span>
        `;
        const nutXoa = nut('Xóa', 'nut-phu', () => {
          items.splice(idx, 1);
          veFormVaPreview();
        });
        nutXoa.style.padding = '4px 10px';
        nutXoa.style.fontSize = '11px';
        hangTieuDe.append(nutXoa);
        hang.append(hangTieuDe);

        const luoi = e('div');
        luoi.style.cssText = 'display: grid; grid-template-columns: 80px 130px 1fr 1fr; gap: 10px;';

        const nhapIcon = oNhap(`icon_${idx}`, 'text', it.icon || it.bieuTuong || '⭐', 'Icon');
        nhapIcon.style.textAlign = 'center';
        nhapIcon.oninput = (ev) => { it.icon = ev.target.value; it.bieuTuong = ev.target.value; vePreview(); };

        const nhapBadge = oNhap(`badge_${idx}`, 'text', it.badge || '', 'Huy hiệu');
        nhapBadge.oninput = (ev) => { it.badge = ev.target.value; vePreview(); };

        const nhapTitle = oNhap(`title_${idx}`, 'text', it.title || it.tieuDe || '', 'Tiêu đề ngắn');
        nhapTitle.oninput = (ev) => { it.title = ev.target.value; it.tieuDe = ev.target.value; vePreview(); };

        const nhapSubtitle = oNhap(`sub_${idx}`, 'text', it.subtitle || it.sub || it.chiTiet || '', 'Mô tả ngắn');
        nhapSubtitle.oninput = (ev) => { it.subtitle = ev.target.value; it.sub = ev.target.value; it.chiTiet = ev.target.value; vePreview(); };

        luoi.append(
          truong('Icon', nhapIcon),
          truong('Badge', nhapBadge),
          truong('Tiêu đề', nhapTitle),
          truong('Mô tả', nhapSubtitle)
        );

        hang.append(luoi);
        danhSachForm.append(hang);
      });

      vePreview();
    }

    veFormVaPreview();
    vungEditor.append(danhSachForm);

    // Actions
    const hangNut = e('div');
    hangNut.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-top: 20px; flex-wrap: wrap;';

    const nutLuu = nut('🚀 Lưu & Xuất bản Server', 'nut-chinh', async () => {
      if (items.length === 0) {
        nhac('Vui lòng thêm tối thiểu 1 tiêu điểm trước khi xuất bản.', 'canh-bao');
        return;
      }
      nutLuu.disabled = true;
      nutLuu.textContent = 'Đang xuất bản...';
      try {
        const kq = await api('/api/campus-highlights', {
          method: 'POST',
          body: JSON.stringify({ action: 'publish', items })
        });
        if (kq.ok) {
          nhac('Đã xuất bản Tiêu điểm Campus thành công lên Server (Nguyên tử)!', 'tot');
          await trangCampusHighlights();
        } else {
          nhac('Không thể lưu: ' + (kq.message || kq.error || kq.loi), 'xau');
        }
      } catch (err) {
        nhac('Lỗi xuất bản: ' + err.message, 'xau');
      } finally {
        nutLuu.disabled = false;
        nutLuu.textContent = '🚀 Lưu & Xuất bản Server';
      }
    });

    const nutReset = nut('🔄 Dùng nguồn tự động (Khôi phục gốc)', 'nut-phu', async () => {
      if (!confirm('Khôi phục danh sách Tiêu điểm về mặc định tự động từ dữ liệu hoạt động thực tế?')) return;
      nutReset.disabled = true;
      nutReset.textContent = 'Đang khôi phục...';
      try {
        const kq = await api('/api/campus-highlights', {
          method: 'POST',
          body: JSON.stringify({ action: 'reset' })
        });
        if (kq.ok) {
          nhac('Đã chuyển sang nguồn dữ liệu tự động thời gian thực!', 'tot');
          await trangCampusHighlights();
        } else {
          nhac('Lỗi khôi phục: ' + (kq.message || kq.error || kq.loi), 'xau');
        }
      } catch (err) {
        nhac('Lỗi: ' + err.message, 'xau');
      } finally {
        nutReset.disabled = false;
        nutReset.textContent = '🔄 Dùng nguồn tự động (Khôi phục gốc)';
      }
    });

    hangNut.append(nutLuu, nutReset);
    vungEditor.append(hangNut);
    khung.append(vungEditor);

    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Không thể tải trang Tiêu điểm Campus: ' + err.message));
  }
}

async function trangHoSoGiaoVien() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải thông tin hồ sơ giáo viên...'));
  try {
    const res = await api('/api/gv/ho-so');
    const hoSo = res.hoSo || {};

    const khung = e('div');
    khung.append(tieuDeTrang('👤 Hồ Sơ Giáo Viên', 'Tùy chỉnh thông tin hiển thị của giáo viên trên Campus, Bảng tin lớp và Khu quản trị. (Các quyền hệ thống và vai trò chính thức được bảo vệ máy chủ).'));

    const the = e('div', 'the');
    the.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; max-width: 680px;';

    // Preview
    const previewBox = e('div');
    previewBox.style.cssText = 'display: flex; align-items: center; gap: 16px; padding: 16px; background: #0B0E14; border: 1px solid rgba(0,242,254,0.25); border-radius: 14px; margin-bottom: 24px;';

    const previewAvatar = e('img');
    previewAvatar.src = hoSo.avatar || '/assets/hinh-anh/anh-lop-default.svg';
    previewAvatar.style.cssText = 'width: 56px; height: 56px; border-radius: 14px; object-fit: cover; border: 2px solid #00F2FE;';

    const previewInfo = e('div');
    previewInfo.style.cssText = 'flex: 1; min-width: 0;';
    const previewName = e('div', null, hoSo.tenHienThi || hoSo.tenDangNhap || 'Giáo viên');
    previewName.style.cssText = 'font-size: 15px; font-weight: 800; color: #fff;';
    const previewRole = e('div', null, 'Giáo Viên Chủ Nhiệm • ' + (hoSo.tenLop || 'Lớp 10A7'));
    previewRole.style.cssText = 'font-size: 11px; color: #8B5CF6; font-weight: 700; margin-top: 2px;';
    const previewTitle = e('div', null, hoSo.tieuDeHoSo || 'Chưa đặt tiêu đề giới thiệu');
    previewTitle.style.cssText = 'font-size: 11px; color: var(--chu-nhat); margin-top: 2px;';
    previewInfo.append(previewName, previewRole, previewTitle);

    previewBox.append(previewAvatar, previewInfo);
    the.append(previewBox);

    // Form inputs
    const oTen = oNhap('gv_ten_hien_thi', 'text', hoSo.tenHienThi || '', 'Ví dụ: Thầy Lê Đình Phát');
    oTen.oninput = (e) => { previewName.textContent = e.target.value.trim() || 'Giáo viên'; };

    const oAvatar = oNhap('gv_avatar', 'text', hoSo.avatar || '', 'URL ảnh đại diện hoặc /assets/...');
    oAvatar.oninput = (e) => { previewAvatar.src = e.target.value.trim() || '/assets/hinh-anh/anh-lop-default.svg'; };

    const oTieuDe = oNhap('gv_tieu_de', 'text', hoSo.tieuDeHoSo || '', 'Ví dụ: Giáo viên Chủ nhiệm Lớp 10A7 · Cố vấn học tập');
    oTieuDe.oninput = (e) => { previewTitle.textContent = e.target.value.trim() || 'Chưa đặt tiêu đề giới thiệu'; };

    the.append(
      truong('Tên hiển thị công khai', oTen, 'Tên xuất hiện trên bài đăng thông báo, phản hồi và danh sách thành viên'),
      truong('Ảnh đại diện (Avatar)', oAvatar, 'Đường dẫn ảnh đại diện an toàn (HTTPS hoặc nội bộ)'),
      truong('Tiêu đề / Lời giới thiệu ngắn', oTieuDe, 'Dòng giới thiệu chức danh hoặc thông điệp ngắn gọn')
    );

    // Security Info (Read-only)
    const securityBox = e('div');
    securityBox.style.cssText = 'margin-top: 18px; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; font-size: 11px; color: var(--chu-nhat);';
    securityBox.innerHTML = `
      <div style="font-weight: 700; color: var(--chu); margin-bottom: 4px;">🔒 Thông tin định danh bảo mật (Bất biến)</div>
      <div>Tài khoản: <b>${hoSo.tenDangNhap || '—'}</b> | Vai trò hệ thống: <b style="color:#00F2FE;">${hoSo.vaiTro || 'teacher'}</b> | Lớp quản lý: <b>${hoSo.tenLop || 'Lớp 10A7'}</b></div>
      <div style="font-size: 10px; margin-top: 4px; color: var(--chu-nhat);">Quyền quản trị và phân bổ lớp chỉ có thể thay đổi qua quy trình điều phối máy chủ.</div>
    `;
    the.append(securityBox);

    // Action button
    const nutLuu = nut('💾 Lưu thông tin hồ sơ', 'nut-chinh', async () => {
      nutLuu.disabled = true;
      nutLuu.textContent = 'Đang lưu...';
      try {
        const kq = await api('/api/gv/ho-so', {
          method: 'POST',
          body: JSON.stringify({
            tenHienThi: oTen.value.trim(),
            avatar: oAvatar.value.trim(),
            tieuDeHoSo: oTieuDe.value.trim()
          })
        });
        if (kq.ok) {
          nhac('Đã cập nhật hồ sơ giáo viên thành công!', 'tot');
          await trangHoSoGiaoVien();
        } else {
          nhac('Không thể lưu hồ sơ: ' + (kq.message || kq.error), 'xau');
        }
      } catch (err) {
        nhac('Lỗi lưu hồ sơ: ' + err.message, 'xau');
      } finally {
        nutLuu.disabled = false;
        nutLuu.textContent = '💾 Lưu thông tin hồ sơ';
      }
    });
    nutLuu.style.marginTop = '20px';
    the.append(nutLuu);

    khung.append(the);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi khi tải hồ sơ: ' + err.message));
  }
}

async function trangPhongCampus() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách phòng hoạt động Campus...'));
  try {
    const res = await api('/api/phong?phamVi=truong');
    const dsPhong = Array.isArray(res.phong) ? res.phong : [];

    const khung = e('div');
    khung.append(tieuDeTrang('🏛️ Sảnh Phòng Campus Đang Hoạt Động', 'Giám sát và quản lý các phòng xem chung, phòng học tập, lofi đang mở trong trường.'));

    const the = e('div', 'the');
    the.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px;';

    if (dsPhong.length === 0) {
      the.innerHTML = '<p style="text-align: center; color: var(--chu-nhat); padding: 32px 0;">Hiện chưa có phòng cộng đồng nào đang mở.</p>';
    } else {
      const bang = e('table', 'khung-bang');
      bang.innerHTML = `
        <thead>
          <tr>
            <th>Tên phòng</th>
            <th>Loại phòng</th>
            <th>Người tạo</th>
            <th>Thành viên</th>
            <th>Trạng thái</th>
            <th style="text-align: right;">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${dsPhong.map(p => `
            <tr>
              <td><b>${p.ten || p.title || 'Phòng không tên'}</b></td>
              <td><span class="nhan" style="background: rgba(0,242,254,0.15); color: #00F2FE;">${p.loai || 'hoat-dong'}</span></td>
              <td>${p.nguoiTaoTen || p.nguoiTao || '—'}</td>
              <td><b>${p.soNguoi || 0}</b> trực tuyến</td>
              <td><span class="nhan-tot">Đang mở</span></td>
              <td style="text-align: right;">
                <button type="button" class="nut nut-phu nut-nho" data-phong-id="${p.id}" data-action="dong">Đóng phòng</button>
                <a href="/?phong=${p.id}" target="_blank" class="nut nut-vien nut-nho" style="margin-left: 6px;">Vào xem</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      `;

      bang.querySelectorAll('button[data-action="dong"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const pId = btn.getAttribute('data-phong-id');
          if (!confirm('Đóng phòng hoạt động này?')) return;
          try {
            const kq = await api('/api/phong', {
              method: 'POST',
              body: JSON.stringify({ hanhDong: 'dong', phongId: pId })
            });
            if (kq.ok) {
              nhac('Đã đóng phòng hoạt động!', 'tot');
              await trangPhongCampus();
            } else {
              nhac('Lỗi: ' + (kq.message || kq.error), 'xau');
            }
          } catch (err) {
            nhac('Lỗi: ' + err.message, 'xau');
          }
        });
      });

      the.append(bang);
    }

    khung.append(the);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi tải phòng Campus: ' + err.message));
  }
}



/* ================= Khu Quản Trị: Tổng Quan, Báo Cáo, Duyệt Giáo Viên, Mã & Ban Biên Tập ================= */

function taoOThongKe(tieuDe, so, moTa, mauSo = '#00F2FE') {
  const o = e('div');
  o.style.cssText = 'padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);';
  const d1 = e('div', null, tieuDe);
  d1.style.cssText = 'font-size: 11px; color: var(--chu-nhat);';
  const d2 = e('div', null, String(so));
  d2.style.cssText = 'font-size: 20px; font-weight: 900; color: ' + mauSo + '; margin-top: 2px;';
  const d3 = e('div', null, moTa);
  d3.style.cssText = 'font-size: 10px; color: var(--chu-nhat); margin-top: 2px;';
  o.append(d1, d2, d3);
  return o;
}

// Định dạng "HH:MM ngày DD/MM" từ chuỗi datetime('now') của D1 (UTC) sang giờ Việt Nam (UTC+7) —
// dùng riêng cho Nhật ký quản trị, không đụng tới ngayVN/ngayDayDu (định dạng cho ngày dạng YYYY-MM-DD).
function gioNgayVN(taoLucUtc) {
  const d = new Date(taoLucUtc.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return taoLucUtc;
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const hh = String(vn.getUTCHours()).padStart(2, '0');
  const mm = String(vn.getUTCMinutes()).padStart(2, '0');
  const dd = String(vn.getUTCDate()).padStart(2, '0');
  const mo = String(vn.getUTCMonth() + 1).padStart(2, '0');
  return `${hh}:${mm} ${dd}/${mo}`;
}

const NHAN_HANH_DONG_QT = {
  duyet_giao_vien: { icon: '✅', nhan: 'Duyệt giáo viên' },
  tu_choi_giao_vien: { icon: '⛔', nhan: 'Từ chối giáo viên' },
  khoa_tai_khoan: { icon: '🔒', nhan: 'Khoá tài khoản' },
  mo_khoa_tai_khoan: { icon: '🔓', nhan: 'Mở khoá tài khoản' },
};

async function trangTongQuan() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải dữ liệu điều hành trường học...'));
  try {
    const [resPhong, resGame, resBaoCao, resGv, resLopChuY, resNhatKy] = await Promise.allSettled([
      api('/api/phong?phamVi=truong'),
      api('/api/game?action=danh_sach'),
      api('/api/gv/bao-cao?status=pending'),
      api('/api/gv/duyet-giao-vien'),
      api(apiTheoPhamVi('/api/gv/lop-can-chu-y')),
      api(apiTheoPhamVi('/api/gv/nhat-ky-quan-tri?limit=6')),
    ]);

    const dsPhong = resPhong.status === 'fulfilled' && Array.isArray(resPhong.value?.phong) ? resPhong.value.phong : [];
    const dsGame = resGame.status === 'fulfilled' && Array.isArray(resGame.value?.danhSach) ? resGame.value.danhSach : [];
    const pendingReports = resBaoCao.status === 'fulfilled' && Array.isArray(resBaoCao.value?.reports) ? resBaoCao.value.reports : [];
    const pendingTeachers = resGv.status === 'fulfilled' && Array.isArray(resGv.value?.pendingTeachers) ? resGv.value.pendingTeachers : [];
    const dsLop = resLopChuY.status === 'fulfilled' && Array.isArray(resLopChuY.value?.danhSach) ? resLopChuY.value.danhSach : [];
    const dsNhatKy = resNhatKy.status === 'fulfilled' && Array.isArray(resNhatKy.value?.danhSach) ? resNhatKy.value.danhSach : [];
    const dsLopChuaDiemDanh = dsLop.filter((l) => l.chuaDiemDanhHomNay);

    const activeCaro = dsGame.filter((b) => b.trangThai === 'dang_choi').length;
    const waitingCaro = dsGame.filter((b) => b.trangThai === 'cho_nguoi').length;
    const totalCaro = activeCaro + waitingCaro;
    const totalOnline = dsPhong.reduce((s, p) => s + (p.soNguoi || 0), 0) + (activeCaro * 2) + waitingCaro;

    const khung = e('div');
    khung.append(tieuDeTrang(
      '📊 Tổng Quan Quản Trị Campus',
      PHAM_VI_LOP_ID
        ? `Đang xem phạm vi: ${dsLop.find((l) => l.lopId === PHAM_VI_LOP_ID)?.ten || 'lớp đã chọn'}. Đổi "Phạm vi" ở thanh trên để xem lớp khác hoặc toàn trường.`
        : 'Việc cần xử lý và tình trạng vận hành toàn trường hôm nay.'
    ));

    // ---------- Việc cần xử lý ----------
    const dongViec = (mau, icon, chu, href) => {
      const a = e('a', 'hang-viec');
      a.href = href;
      a.style.setProperty('--mau-qt', mau);
      a.append(
        e('span', 'hang-viec-icon', icon),
        e('span', 'hang-viec-chu', chu),
        e('span', 'hang-viec-nut', 'Xem →')
      );
      return a;
    };
    const dsViec = [];
    if (pendingReports.length > 0) dsViec.push(dongViec('#F43F5E', '🔴', `${pendingReports.length} báo cáo vi phạm đang chờ xử lý`, '#/bao-cao-vi-pham'));
    if (pendingTeachers.length > 0) dsViec.push(dongViec('#F59E0B', '🟠', `${pendingTeachers.length} hồ sơ giáo viên đang chờ duyệt`, '#/duyet-giao-vien'));
    dsLopChuaDiemDanh.forEach((l) => dsViec.push(dongViec('#FBBF24', '🟡', `${l.ten} chưa điểm danh hôm nay`, '#/diem-danh')));

    const khoiViec = e('div', 'the');
    khoiViec.style.cssText = 'margin-top: 18px; padding: 18px;';
    khoiViec.append(Object.assign(e('h3', null, `⚡ Việc cần xử lý${dsViec.length ? ' — ' + dsViec.length : ''}`), {
      style: 'font-size: 13px; font-weight: 800; color: var(--chu); margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.04em;'
    }));
    if (dsViec.length === 0) {
      khoiViec.append(Object.assign(e('p', null, '✓ Không có việc gì cần xử lý — mọi thứ đang vận hành bình thường.'), {
        style: 'color: var(--chu-nhat); font-size: 13px; margin: 0;'
      }));
    } else {
      const dsViecBoc = e('div');
      dsViecBoc.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
      dsViecBoc.append(...dsViec);
      khoiViec.append(dsViecBoc);
    }
    khung.append(khoiViec);

    // ---------- Tình trạng hôm nay (1 dòng gọn) ----------
    const dongSo = (...capSo) => {
      const dong = e('div', 'the-qt-so');
      dong.style.cssText = 'border-top: none; padding-top: 0; font-size: 13px;';
      capSo.forEach(([so, nhan], i) => {
        if (i > 0) dong.append(e('span', null, '  ·  '));
        dong.append(e('b', null, String(so)), e('span', null, ' ' + nhan));
      });
      return dong;
    };
    const theTinhTrang = e('div', 'the');
    theTinhTrang.style.cssText = 'margin-top: 14px; padding: 14px 18px;';
    theTinhTrang.style.setProperty('--mau-qt', '#38BDF8');
    theTinhTrang.append(dongSo(
      [totalOnline, 'đang hoạt động'], [dsPhong.length, 'phòng mở'], [totalCaro, 'bàn Caro'], [dsLop.length, PHIEN.isSchoolAdmin && !PHAM_VI_LOP_ID ? 'lớp toàn trường' : 'lớp trong phạm vi']
    ));
    khung.append(theTinhTrang);

    // ---------- Hoạt động gần đây (Nhật ký quản trị) ----------
    const theHoatDong = e('div', 'the');
    theHoatDong.style.cssText = 'margin-top: 14px; padding: 18px;';
    theHoatDong.append(Object.assign(e('h3', null, '🕘 Hoạt động gần đây'), {
      style: 'font-size: 13px; font-weight: 800; color: var(--chu); margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.04em;'
    }));
    if (dsNhatKy.length === 0) {
      theHoatDong.append(Object.assign(e('p', null, 'Chưa có hoạt động quản trị nào được ghi nhận.'), {
        style: 'color: var(--chu-nhat); font-size: 13px; margin: 0;'
      }));
    } else {
      const dsHoatDongBoc = e('div');
      dsHoatDongBoc.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';
      dsNhatKy.forEach((n) => {
        const mau = NHAN_HANH_DONG_QT[n.hanhDong] || { icon: '•', nhan: n.hanhDong };
        const dong = e('div');
        dong.style.cssText = 'display: flex; align-items: flex-start; gap: 10px; font-size: 12.5px;';
        dong.append(
          Object.assign(e('span', null, mau.icon), { style: 'flex: none;' }),
          datNoiDung(e('div'),
            Object.assign(e('p', null, n.chiTiet || mau.nhan), { style: 'margin: 0; color: var(--chu);' }),
            Object.assign(e('p', null, `${n.tacNhanTen || 'Hệ thống'} · ${gioNgayVN(n.taoLuc)}`), { style: 'margin: 2px 0 0; color: var(--chu-mo, var(--chu-nhat)); font-size: 11px;' })
          )
        );
        dsHoatDongBoc.append(dong);
      });
      theHoatDong.append(dsHoatDongBoc);
    }
    khung.append(theHoatDong);

    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi khi tải tổng quan quản trị: ' + err.message));
  }
}

/* ================= Người dùng (Admin IA v1, Phase 2) =================
   Gộp hoc_sinh + tai_khoan_campus thành 1 danh sách — xem functions/api/gv/nguoi-dung.js
   để biết đúng định nghĩa 4 "loai": giao-vien / hoc-sinh / tai-khoan-campus / hoc-sinh-chua-lien-ket. */

const NHAN_LOAI_NGUOI = {
  'giao-vien': 'Giáo viên', 'hoc-sinh': 'Học sinh', 'tai-khoan-campus': 'Tài khoản Campus',
  'hoc-sinh-chua-lien-ket': 'Học sinh (chưa đăng nhập)',
};
const NHAN_TRANG_THAI_NGUOI = {
  'binh-thuong': { nhan: 'Hoạt động', mau: '#34D399' },
  'cho-xac-minh': { nhan: 'Chờ xác minh', mau: '#F59E0B' },
  'bi-khoa': { nhan: 'Bị khoá', mau: '#F43F5E' },
  'chua-dang-nhap': { nhan: 'Chưa đăng nhập', mau: '#94A3B8' },
  'da-nghi-hoc': { nhan: 'Đã nghỉ học', mau: '#64748B' },
};

function nhanTrangThaiNguoi(trangThai) {
  const tt = NHAN_TRANG_THAI_NGUOI[trangThai] || { nhan: trangThai, mau: '#94A3B8' };
  const s = e('span', 'nhan-tt', tt.nhan);
  s.style.setProperty('--mau-tt', tt.mau);
  return s;
}

// ---------- Menu "⋯" hành động dùng chung (chỉ 1 menu mở tại 1 thời điểm) ----------
let _menuHdDangMo = null;
function dongMenuHanhDongDangMo() {
  if (_menuHdDangMo) { _menuHdDangMo.remove(); _menuHdDangMo = null; }
}
document.addEventListener('click', dongMenuHanhDongDangMo);

function taoNutMenuHanhDong(dsHanhDong) {
  const boc = e('div', 'o-menu-hd');
  const nutMo = e('button', 'nut-menu-hd', '⋯');
  nutMo.type = 'button';
  nutMo.setAttribute('aria-label', 'Hành động khác');
  nutMo.onclick = (ev) => {
    ev.stopPropagation();
    const dangMoChinhNo = _menuHdDangMo && boc.contains(_menuHdDangMo);
    dongMenuHanhDongDangMo();
    if (dangMoChinhNo) return;
    const bang = e('div', 'bang-menu-hd');
    dsHanhDong.forEach(({ nhan, onClick, nguyHiem }) => {
      const muc = e('button', 'muc-menu-hd' + (nguyHiem ? ' nguy-hiem' : ''), nhan);
      muc.type = 'button';
      muc.onclick = (ev2) => { ev2.stopPropagation(); dongMenuHanhDongDangMo(); onClick(); };
      bang.append(muc);
    });
    boc.append(bang);
    _menuHdDangMo = bang;
  };
  boc.append(nutMo);
  return boc;
}

// ---------- Drawer chi tiết trượt từ phải (khác .hop-thoai modal giữa màn hình) ----------
function _thoatDrawerKhiEsc(ev) { if (ev.key === 'Escape') dongDrawerChiTiet(); }
function dongDrawerChiTiet() {
  $$('.man-drawer-qt').forEach((m) => m.remove());
  document.removeEventListener('keydown', _thoatDrawerKhiEsc);
}
function moDrawerChiTiet(tieuDe, noiDungEl) {
  dongDrawerChiTiet();
  const man = e('div', 'man-drawer-qt');
  man.onclick = dongDrawerChiTiet;
  const drawer = e('div', 'drawer-qt');
  drawer.onclick = (ev) => ev.stopPropagation();
  const dau = e('div', 'drawer-qt-dau');
  const nutDong = e('button', 'nut-tron', '✕');
  nutDong.type = 'button';
  nutDong.setAttribute('aria-label', 'Đóng');
  nutDong.onclick = dongDrawerChiTiet;
  dau.append(Object.assign(e('b', null, tieuDe), { style: 'font-size: 14px;' }), nutDong);
  const than = e('div', 'drawer-qt-than');
  than.append(noiDungEl);
  drawer.append(dau, than);
  man.append(drawer);
  document.body.append(man);
  document.addEventListener('keydown', _thoatDrawerKhiEsc);
}
function dongDrawerDong(nhan, giaTri) {
  const d = e('div', 'drawer-qt-dong');
  d.append(e('span', null, nhan), e('span', null, giaTri == null || giaTri === '' ? '—' : String(giaTri)));
  return d;
}

async function thucHienKhoaMoTaiKhoan(id, ten, hanhDong, veLai) {
  if (hanhDong === 'khoa' && !confirm(`Khoá tài khoản "${ten}"? Người này sẽ không đăng nhập được cho tới khi được mở khoá lại.`)) return;
  try {
    await api('/api/gv/nguoi-dung', { method: 'POST', than: { id, hanhDong } });
    nhac(hanhDong === 'khoa' ? 'Đã khoá tài khoản.' : 'Đã mở khoá tài khoản.', 'tot');
    dongDrawerChiTiet();
    if (veLai) veLai();
  } catch (err) {
    nhac('Không thực hiện được: ' + err.message, 'loi');
  }
}

async function moChiTietNguoiDung(id, veLai) {
  let d;
  try {
    d = await api('/api/gv/nguoi-dung?id=' + encodeURIComponent(id));
  } catch (err) {
    nhac('Không tải được chi tiết: ' + err.message, 'loi');
    return;
  }
  const nd = d.chiTiet;
  const than = e('div');
  than.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

  const nhomChinh = e('div');
  nhomChinh.append(e('p', 'drawer-qt-nhom-nhan', 'Thông tin'));
  nhomChinh.append(dongDrawerDong('Loại', NHAN_LOAI_NGUOI[nd.loai] || nd.loai));
  const dongTt = e('div', 'drawer-qt-dong');
  dongTt.append(e('span', null, 'Trạng thái'), nhanTrangThaiNguoi(nd.trangThai));
  nhomChinh.append(dongTt);
  nhomChinh.append(dongDrawerDong('Lớp', nd.lopTen));
  Object.entries(nd.thongTin || {}).forEach(([k, v]) => nhomChinh.append(dongDrawerDong(k, v)));
  than.append(nhomChinh);

  if (nd.id.startsWith('tk:') && nd.loai !== 'giao-vien' && !nd.taiKhoan?.laAdminTruong) {
    const dangKhoa = nd.trangThai === 'bi-khoa';
    const nutKhoa = e('button', dangKhoa ? 'nut nut-chinh nut-nho' : 'nut nut-vien nut-nho', dangKhoa ? '🔓 Mở khoá tài khoản' : '🔒 Khoá tài khoản');
    nutKhoa.type = 'button';
    nutKhoa.style.cssText = 'width: 100%;';
    nutKhoa.onclick = () => thucHienKhoaMoTaiKhoan(nd.id, nd.ten, dangKhoa ? 'mo_khoa' : 'khoa', veLai);
    than.append(nutKhoa);
  }

  if ((nd.hoatDongGanDay || []).length > 0) {
    const nhomHd = e('div');
    nhomHd.append(e('p', 'drawer-qt-nhom-nhan', 'Hoạt động gần đây'));
    nd.hoatDongGanDay.forEach((h) => {
      const dong = e('div');
      dong.style.cssText = 'padding: 7px 0; border-bottom: 1px solid var(--vien); font-size: 12.5px;';
      dong.append(
        Object.assign(e('p', null, h.chiTiet || h.hanhDong), { style: 'margin: 0; color: var(--chu);' }),
        Object.assign(e('p', null, `${h.tacNhanTen || ''} · ${gioNgayVN(h.taoLuc)}`), { style: 'margin: 2px 0 0; color: var(--chu-mo, var(--chu-nhat)); font-size: 11px;' })
      );
      nhomHd.append(dong);
    });
    than.append(nhomHd);
  }

  moDrawerChiTiet(nd.ten, than);
}

async function trangNguoiDung() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách người dùng...'));

  let loaiLoc = 'tat-ca';
  let tuKhoa = '';
  let henTimKiem = null;

  const BO_LOC = [
    { id: 'tat-ca', nhan: 'Tất cả' },
    { id: 'hoc-sinh', nhan: 'Học sinh' },
    { id: 'giao-vien', nhan: 'Giáo viên' },
    { id: 'tai-khoan-campus', nhan: 'Tài khoản Campus' },
    { id: 'cho-xac-minh', nhan: 'Chờ xác minh' },
    { id: 'bi-khoa', nhan: 'Bị khoá' },
  ];

  function ve(danhSach) {
    const khung = e('div');
    khung.append(tieuDeTrang('👤 Người Dùng', 'Học sinh, giáo viên và tài khoản Campus trong phạm vi quản trị.'));

    const thanhLoc = e('div');
    thanhLoc.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;';
    BO_LOC.forEach((f) => {
      thanhLoc.append(nut(f.nhan, f.id === loaiLoc ? 'nut-chinh nut-nho' : 'nut-vien nut-nho', () => {
        loaiLoc = f.id;
        taiVaVe();
      }));
    });
    khung.append(thanhLoc);

    const oTim = oNhap('ndTim', 'search', tuKhoa, 'Tìm theo họ tên hoặc tên đăng nhập…');
    oTim.style.cssText = 'width: 100%; max-width: 360px; margin-bottom: 14px; display: block;';
    oTim.addEventListener('input', () => {
      tuKhoa = oTim.value;
      clearTimeout(henTimKiem);
      henTimKiem = setTimeout(taiVaVe, 350);
    });
    khung.append(oTim);

    if (danhSach.length === 0) {
      const rong = e('div', 'the', 'Không tìm thấy người dùng nào khớp bộ lọc hiện tại.');
      rong.style.cssText = 'padding: 28px; text-align:center; color: var(--chu-nhat); font-size: 13px;';
      khung.append(rong);
      datNoiDung(KHUNG, khung);
      return;
    }

    const bocBang = e('div', 'bang-qt-boc');
    const bang = e('table', 'bang-qt');
    const trHead = e('tr');
    ['Họ tên', 'Loại', 'Lớp', 'Trạng thái', 'Hoạt động cuối', ''].forEach((c) => trHead.append(e('th', null, c)));
    const thead = e('thead');
    thead.append(trHead);
    const tbody = e('tbody');

    danhSach.forEach((nd) => {
      const tr = e('tr');
      tr.append(
        e('td', null, nd.ten),
        e('td', null, NHAN_LOAI_NGUOI[nd.loai] || nd.loai),
        e('td', null, nd.lopTen || '—')
      );
      const tdTt = e('td');
      tdTt.append(nhanTrangThaiNguoi(nd.trangThai));
      tr.append(tdTt);
      tr.append(e('td', null, nd.hoatDongCuoi ? gioNgayVN(nd.hoatDongCuoi) : '—'));

      const tdHd = e('td');
      const dsHanhDong = [{ nhan: 'Xem chi tiết', onClick: () => moChiTietNguoiDung(nd.id, taiVaVe) }];
      if (nd.id.startsWith('tk:') && nd.loai !== 'giao-vien') {
        dsHanhDong.push(nd.trangThai === 'bi-khoa'
          ? { nhan: 'Mở khoá tài khoản', onClick: () => thucHienKhoaMoTaiKhoan(nd.id, nd.ten, 'mo_khoa', taiVaVe) }
          : { nhan: 'Khoá tài khoản', onClick: () => thucHienKhoaMoTaiKhoan(nd.id, nd.ten, 'khoa', taiVaVe), nguyHiem: true });
      }
      tdHd.append(taoNutMenuHanhDong(dsHanhDong));
      tr.append(tdHd);
      tr.onclick = () => moChiTietNguoiDung(nd.id, taiVaVe);
      tbody.append(tr);
    });

    bang.append(thead, tbody);
    bocBang.append(bang);
    khung.append(bocBang);
    datNoiDung(KHUNG, khung);
  }

  async function taiVaVe() {
    datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách người dùng...'));
    try {
      const qs = new URLSearchParams();
      if (loaiLoc !== 'tat-ca') qs.set('loai', loaiLoc);
      if (tuKhoa.trim()) qs.set('q', tuKhoa.trim());
      const d = await api(apiTheoPhamVi('/api/gv/nguoi-dung?' + qs.toString()));
      ve(d.danhSach || []);
    } catch (err) {
      datNoiDung(KHUNG, khoiLoi('Không tải được danh sách người dùng: ' + err.message));
    }
  }

  await taiVaVe();
}

async function trangCampus() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải dữ liệu hoạt động Campus...'));
  try {
    const [resPhong, resGame, resHl] = await Promise.allSettled([
      api('/api/phong?phamVi=truong'),
      api('/api/game?action=danh_sach'),
      api('/api/campus-highlights')
    ]);
    const dsPhong = resPhong.status === 'fulfilled' && Array.isArray(resPhong.value?.phong) ? resPhong.value.phong : [];
    const dsGame = resGame.status === 'fulfilled' && Array.isArray(resGame.value?.danhSach) ? resGame.value.danhSach : [];
    const dsHl = resHl.status === 'fulfilled' && Array.isArray(resHl.value?.highlights) ? resHl.value.highlights : [];
    const dsYt = dsPhong.filter(p => p.loai === 'video');

    const khung = e('div');
    khung.append(tieuDeTrang(
      '🏛️ Quản Trị Hoạt Động Campus',
      'Giám sát phòng trực tuyến, không gian học tập YouTube, đấu trường Game Caro và Tiêu điểm trường học.'
    ));

    // Nav Subtabs (Hoạt động, YouTube, Game, Tiêu điểm)
    const subtabs = e('div');
    subtabs.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;';
    const taoNutSubtab = (nhan, href, laChinh = false) => {
      const a = e('a', laChinh ? 'nut nut-chinh nut-nho' : 'nut nut-vien nut-nho', nhan);
      a.href = href;
      a.style.cssText = 'border-radius: 12px; font-weight: 700;';
      return a;
    };
    subtabs.append(
      taoNutSubtab('🏠 Giám sát phòng', '#/phong-campus', true),
      taoNutSubtab('✨ Tiêu điểm Campus', '#/campus-highlights')
    );
    khung.append(subtabs);

    // Cards Grid
    const luoi = e('div');
    luoi.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;';

    // Helper to build room item
    const taoMucPhong = (p) => {
      const item = e('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: var(--nen); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--vien);';
      const trai = e('div');
      const ten = Object.assign(e('div', null, p.ten || 'Phòng học'), { style: 'color: var(--chu); font-size: 12px; font-weight: 700;' });
      const phu = Object.assign(e('div', null, 'Chủ phòng: ' + (p.chuPhongTen || 'Học sinh') + ' · ' + (p.soNguoi || 0) + ' người'), { style: 'color: var(--chu-mo, var(--chu-nhat)); font-size: 10px;' });
      trai.append(ten, phu);

      const aGiamSat = e('a', 'nut nut-phu nut-nho', 'Giám sát');
      aGiamSat.href = '#/phong-campus';
      aGiamSat.style.cssText = 'font-size: 10px;';
      item.append(trai, aGiamSat);
      return item;
    };

    // Đầu thẻ dùng chung: icon trong khối glow màu + tiêu đề + huy hiệu số — cùng ngôn ngữ
    // hình ảnh với .the-qt ở Tổng quan, thay vì mảng màu phẳng #121620 lạc tông trước đây.
    const dauThe = (icon, ten, mau, huyHieu) => {
      const dau = e('div');
      dau.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 10px;';
      const trai = e('div');
      trai.style.cssText = 'display: flex; align-items: center; gap: 10px;';
      trai.append(
        Object.assign(e('span', 'the-qt-icon', icon), { style: `width: 38px; height: 38px; font-size: 18px; --mau-qt: ${mau};` }),
        Object.assign(e('b', null, ten), { style: 'color: var(--chu); font-size: 15px;' })
      );
      dau.append(trai, Object.assign(e('span', null, huyHieu), {
        style: `background: color-mix(in srgb, ${mau} 16%, transparent); color: ${mau}; padding: 2px 9px; border-radius: 10px; font-size: 11px; font-weight: 700; white-space: nowrap;`
      }));
      return dau;
    };

    // 1. Card YouTube
    const cardYt = e('div', 'the');
    cardYt.style.cssText = 'border-color: color-mix(in srgb, #EF4444 30%, var(--vien)); padding: 20px;';
    const moTaYt = Object.assign(e('p', null, 'Phòng chiếu video học tập và thảo luận nhóm đang trực tuyến.'), { style: 'color: var(--chu-nhat); font-size: 12px; margin-bottom: 14px;' });
    const dsYtDiv = e('div');
    dsYtDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
    if (dsYt.length === 0) {
      dsYtDiv.append(Object.assign(e('div', null, 'Chưa có phòng YouTube nào đang mở.'), { style: 'color: var(--chu-mo, var(--chu-nhat)); font-size: 12px; text-align: center; padding: 12px;' }));
    } else {
      dsYt.forEach(p => dsYtDiv.append(taoMucPhong(p)));
    }
    cardYt.append(dauThe('▶️', 'Học Tập / YouTube Study', '#EF4444', dsYt.length + ' phòng'), moTaYt, dsYtDiv);

    // 2. Card Game Caro
    const cardGame = e('div', 'the');
    cardGame.style.cssText = 'border-color: color-mix(in srgb, #F59E0B 30%, var(--vien)); padding: 20px;';
    const activeCaro = dsGame.filter(b => b.trangThai === 'dang_choi').length;
    const waitingCaro = dsGame.filter(b => b.trangThai === 'cho_nguoi').length;

    const moTaGame = Object.assign(e('p', null, 'Trận đấu cờ Caro 15x15 thời gian thực giữa học sinh.'), { style: 'color: var(--chu-nhat); font-size: 12px; margin-bottom: 14px;' });
    const luoiGameStats = e('div');
    luoiGameStats.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;';
    const oStat1 = e('div');
    oStat1.style.cssText = 'background: var(--nen); padding: 10px; border-radius: 10px; text-align: center;';
    oStat1.append(Object.assign(e('div', null, String(activeCaro)), { style: 'color: #F59E0B; font-size: 18px; font-weight: 900;' }), Object.assign(e('div', null, 'Đang thi đấu'), { style: 'color: var(--chu-mo, var(--chu-nhat)); font-size: 11px;' }));

    const oStat2 = e('div');
    oStat2.style.cssText = 'background: var(--nen); padding: 10px; border-radius: 10px; text-align: center;';
    oStat2.append(Object.assign(e('div', null, String(waitingCaro)), { style: 'color: #10B981; font-size: 18px; font-weight: 900;' }), Object.assign(e('div', null, 'Đang chờ đối thủ'), { style: 'color: var(--chu-mo, var(--chu-nhat)); font-size: 11px;' }));
    luoiGameStats.append(oStat1, oStat2);

    const linkCampusGame = e('a', 'nut nut-vien nut-nho', 'Xem trực tiếp trên Campus →');
    linkCampusGame.href = '/';
    linkCampusGame.target = '_blank';
    linkCampusGame.style.cssText = 'width: 100%; text-align: center; display: block;';
    cardGame.append(dauThe('🎮', 'Đấu Trường Caro', '#F59E0B', (activeCaro + waitingCaro) + ' bàn'), moTaGame, luoiGameStats, linkCampusGame);

    // 3. Card Tiêu Điểm Campus
    const cardHl = e('div', 'the');
    cardHl.style.cssText = 'border-color: color-mix(in srgb, #00F2FE 30%, var(--vien)); padding: 20px;';
    const moTaHl = Object.assign(e('p', null, 'Điều phối nội dung nổi bật xuất hiện tại cột trái Digital Campus.'), { style: 'color: var(--chu-nhat); font-size: 12px; margin-bottom: 14px;' });
    const dsHlDiv = e('div');
    dsHlDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
    if (dsHl.length === 0) {
      dsHlDiv.append(Object.assign(e('div', null, 'Chưa có thẻ tiêu điểm nào.'), { style: 'color: var(--chu-mo, var(--chu-nhat)); font-size: 12px; text-align: center; padding: 12px;' }));
    } else {
      dsHl.slice(0, 4).forEach(h => {
        const row = e('div');
        row.style.cssText = 'display: flex; align-items: center; gap: 8px; background: var(--nen); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--vien);';
        row.append(
          Object.assign(e('span', null, h.icon || '⭐'), { style: 'font-size: 16px;' }),
          Object.assign(e('span', null, h.title || h.tieuDe || 'Tiêu điểm'), { style: 'color: var(--chu); font-size: 12px; font-weight: 700; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' })
        );
        dsHlDiv.append(row);
      });
    }
    const linkBienTapHl = e('a', 'nut nut-chinh nut-nho', 'Chỉnh sửa Tiêu điểm →');
    linkBienTapHl.href = '#/campus-highlights';
    linkBienTapHl.style.cssText = 'width: 100%; text-align: center; display: block; margin-top: 12px;';
    cardHl.append(dauThe('✨', 'Tiêu Điểm Campus', '#00F2FE', dsHl.length + '/4 thẻ'), moTaHl, dsHlDiv, linkBienTapHl);

    luoi.append(cardYt, cardGame, cardHl);
    khung.append(luoi);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi khi tải quản trị Campus: ' + err.message));
  }
}

async function trangBangTin() {
  const khung = e('div');
  khung.append(tieuDeTrang(
    '📢 Quản Trị Bảng Tin & Truyền Thông',
    'Soạn thảo thông báo trường học, tin tức bảng tin lớp, phân quyền ban biên tập và quản lý thư viện media.'
  ));

  const subtabs = e('div');
  subtabs.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;';
  const taoNut = (nhan, href, laChinh = false) => {
    const a = e('a', laChinh ? 'nut nut-chinh nut-nho' : 'nut nut-vien nut-nho', nhan);
    a.href = href;
    a.style.cssText = 'border-radius: 12px; font-weight: 700;';
    return a;
  };
  subtabs.append(
    taoNut('📢 Thông báo', '#/thong-bao', true),
    taoNut('✍️ Ban biên tập', '#/bien-tap-vien'),
    taoNut('🖼️ Thư viện Ảnh', '#/hinh-anh'),
    taoNut('🎵 Thư viện Âm thanh', '#/thu-vien-am-thanh'),
    taoNut('🎬 Thư viện Video', '#/thu-vien-video')
  );
  khung.append(subtabs);

  // Directly load announcements
  const vungNoiDung = e('div');
  khung.append(vungNoiDung);
  datNoiDung(KHUNG, khung);
  await trangThongBao();
}

async function trangLopThanhVien() {
  const khung = e('div');
  khung.append(tieuDeTrang(
    '👥 Quản Trị Lớp Học & Thành Viên',
    'Danh sách học sinh, sổ chuyên cần điểm danh, thủ quỹ lớp, thời khóa biểu và mã truy cập cộng đồng.'
  ));

  const subtabs = e('div');
  subtabs.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;';
  const taoNut = (nhan, href, laChinh = false) => {
    const a = e('a', laChinh ? 'nut nut-chinh nut-nho' : 'nut nut-vien nut-nho', nhan);
    a.href = href;
    a.style.cssText = 'border-radius: 12px; font-weight: 700;';
    return a;
  };
  subtabs.append(
    taoNut('👥 Học sinh', '#/hoc-sinh', true),
    taoNut('📋 Điểm danh', '#/diem-danh'),
    taoNut('💰 Thủ quỹ lớp', '#/quy'),
    taoNut('📅 Thời khóa biểu', '#/thoi-khoa-bieu'),
    taoNut('🔑 Mã cộng đồng', '#/ma-cong-dong'),
    taoNut('🔐 Cán sự lớp', '#/ma-ca-nhan')
  );
  khung.append(subtabs);

  datNoiDung(KHUNG, khung);
  await trangHocSinh();
}

async function trangKiemDuyet() {
  const khung = e('div');
  khung.append(tieuDeTrang(
    '🛡️ Trung Tâm Kiểm Duyệt & An Toàn',
    'Xử lý báo cáo vi phạm nội dung Campus / Tin nhắn riêng và phê duyệt tài khoản giáo viên đăng ký.'
  ));

  const subtabs = e('div');
  subtabs.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;';
  const taoNut = (nhan, href, laChinh = false) => {
    const a = e('a', laChinh ? 'nut nut-chinh nut-nho' : 'nut nut-vien nut-nho', nhan);
    a.href = href;
    a.style.cssText = 'border-radius: 12px; font-weight: 700;';
    return a;
  };
  subtabs.append(
    taoNut('🚩 Báo cáo vi phạm', '#/bao-cao-vi-pham', true),
    taoNut('🛡️ Duyệt giáo viên', '#/duyet-giao-vien')
  );
  khung.append(subtabs);

  datNoiDung(KHUNG, khung);
  await trangBaoCaoViPham('all');
}

async function trangHeThong() {
  const khung = e('div');
  khung.append(tieuDeTrang(
    '⚙️ Quản Trị Hệ Thống',
    'Cập nhật hồ sơ cá nhân giáo viên, xuất file báo cáo tổng hợp, kiểm tra nhật ký đăng nhập và reset dữ liệu.'
  ));

  const subtabs = e('div');
  subtabs.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;';
  const taoNut = (nhan, href, laChinh = false) => {
    const a = e('a', laChinh ? 'nut nut-chinh nut-nho' : 'nut nut-vien nut-nho', nhan);
    a.href = href;
    a.style.cssText = 'border-radius: 12px; font-weight: 700;';
    return a;
  };
  subtabs.append(
    taoNut('👤 Hồ sơ giáo viên', '#/ho-so-gv', true),
    taoNut('📑 Báo cáo & Xuất file', '#/bao-cao'),
    taoNut('📋 Nhật ký đăng nhập', '#/nhat-ky-dang-nhap'),
    taoNut('⚠️ Reset dữ liệu', '#/reset-du-lieu')
  );
  khung.append(subtabs);

  datNoiDung(KHUNG, khung);
  await trangHoSoGiaoVien();
}


async function trangBaoCaoViPham(trangThaiLoc = 'all') {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách báo cáo vi phạm...'));
  try {
    const url = trangThaiLoc === 'all' ? '/api/gv/bao-cao' : ('/api/gv/bao-cao?status=' + trangThaiLoc);
    const res = await api(url);
    const reports = Array.isArray(res.reports) ? res.reports : [];

    const khung = e('div');
    khung.append(tieuDeTrang(
      '🚩 Hàng Đợi Kiểm Duyệt Báo Cáo Vi Phạm',
      'Xem xét và xử lý các báo cáo vi phạm tin nhắn, hành vi từ học sinh trên Campus.'
    ));

    const thanhLoc = e('div');
    thanhLoc.style.cssText = 'display: flex; gap: 8px; margin: 16px 0; flex-wrap: wrap;';
    [
      { id: 'all', label: 'Tất cả' },
      { id: 'pending', label: 'Đang chờ' },
      { id: 'resolved', label: 'Đã xử lý' },
      { id: 'dismissed', label: 'Đã bỏ qua' }
    ].forEach((f) => {
      const b = nut(f.label, f.id === trangThaiLoc ? 'nut-chinh nut-nho' : 'nut-vien nut-nho', () => {
        trangBaoCaoViPham(f.id);
      });
      thanhLoc.append(b);
    });
    khung.append(thanhLoc);

    const the = e('div', 'the');
    the.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px;';

    if (reports.length === 0) {
      the.append(Object.assign(e('p', null, 'Không có báo cáo nào trong mục này.'), {
        style: 'text-align: center; color: var(--chu-nhat); padding: 32px 0;'
      }));
    } else {
      const danhSach = e('div');
      danhSach.style.cssText = 'display: flex; flex-direction: column; gap: 14px;';

      reports.forEach((r) => {
        const item = e('div');
        item.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px;';

        const headerDong = e('div');
        headerDong.style.cssText = 'display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;';

        const cotTrai = e('div');
        cotTrai.style.cssText = 'font-size: 13px;';
        const bReporter = e('b', null, r.reporterName || 'Học sinh');
        bReporter.style.color = '#FFFFFF';
        const spanDaBaoCao = e('span', null, ' đã báo cáo ');
        spanDaBaoCao.style.color = 'var(--chu-nhat)';
        const bTarget = e('b', null, r.targetName || 'Thành viên');
        bTarget.style.color = '#FFB800';
        cotTrai.append(bReporter, ' (@' + (r.reporterUsername || '') + ')', spanDaBaoCao, bTarget, ' (@' + (r.targetUsername || '') + ')');

        const cotPhai = e('div');
        cotPhai.style.cssText = 'display: flex; align-items: center; gap: 8px;';
        const nhanTrangThai = e(
          'span',
          r.status === 'resolved' ? 'nhan-tot' : r.status === 'dismissed' ? 'nhan-xam' : 'nhan-canh-bao',
          r.status === 'resolved' ? 'Đã xử lý' : r.status === 'dismissed' ? 'Đã bỏ qua' : 'Đang chờ'
        );
        const spanTime = e('span', null, r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '');
        spanTime.style.cssText = 'font-size: 11px; color: var(--chu-nhat);';
        cotPhai.append(nhanTrangThai, spanTime);

        headerDong.append(cotTrai, cotPhai);
        item.append(headerDong);

        const lyDoBox = e('div');
        lyDoBox.style.cssText = 'font-size: 12px; color: var(--chu); background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);';
        lyDoBox.append(Object.assign(e('b', null, 'Lý do báo cáo: '), { style: 'color: var(--chu-nhat);' }), r.reason || '—');
        item.append(lyDoBox);

        if (r.reportedMessageContent) {
          const msgBox = e('div');
          msgBox.style.cssText = 'font-size: 12px; color: #FDE68A; background: rgba(245,158,11,0.08); padding: 10px; border-radius: 8px; border: 1px solid rgba(245,158,11,0.2);';
          msgBox.append(Object.assign(e('b', null, 'Nội dung tin nhắn bị báo cáo: '), { style: 'display: block; margin-bottom: 2px;' }), '"' + r.reportedMessageContent + '"');
          item.append(msgBox);
        }

        if (r.status === 'pending') {
          const nutDong = e('div');
          nutDong.style.cssText = 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;';

          const nutBoQua = nut('Bỏ qua', 'nut-vien nut-nho', async () => {
            try {
              const resAct = await api('/api/gv/bao-cao', {
                method: 'POST',
                body: JSON.stringify({ reportId: r.id, action: 'dismiss' })
              });
              if (resAct.ok) {
                nhac('Đã bỏ qua báo cáo', 'tot');
                await trangBaoCaoViPham(trangThaiLoc);
              } else {
                nhac('Lỗi: ' + (resAct.loi || resAct.error), 'xau');
              }
            } catch (err) {
              nhac('Lỗi: ' + err.message, 'xau');
            }
          });

          const nutXuLy = nut('Xử lý vi phạm', 'nut-chinh nut-nho', async () => {
            try {
              const resAct = await api('/api/gv/bao-cao', {
                method: 'POST',
                body: JSON.stringify({ reportId: r.id, action: 'resolve' })
              });
              if (resAct.ok) {
                nhac('Đã đánh dấu xử lý vi phạm', 'tot');
                await trangBaoCaoViPham(trangThaiLoc);
              } else {
                nhac('Lỗi: ' + (resAct.loi || resAct.error), 'xau');
              }
            } catch (err) {
              nhac('Lỗi: ' + err.message, 'xau');
            }
          });

          nutDong.append(nutBoQua, nutXuLy);
          item.append(nutDong);
        }

        danhSach.append(item);
      });

      the.append(danhSach);
    }

    khung.append(the);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi tải báo cáo vi phạm: ' + err.message));
  }
}

async function trangDuyetGiaoVien() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách giáo viên chờ duyệt...'));
  try {
    const res = await api('/api/gv/duyet-giao-vien');
    const pendingTeachers = Array.isArray(res.pendingTeachers) ? res.pendingTeachers : [];

    const khung = e('div');
    khung.append(tieuDeTrang(
      '🛡️ Phê Duyệt Tài Khoản Giáo Viên',
      'Xem xét và phê duyệt các yêu cầu cấp quyền giáo viên từ tài khoản Campus.'
    ));

    const the = e('div', 'the');
    the.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px;';

    if (pendingTeachers.length === 0) {
      the.append(Object.assign(e('p', null, 'Không có tài khoản giáo viên nào đang chờ phê duyệt.'), {
        style: 'text-align: center; color: var(--chu-nhat); padding: 32px 0;'
      }));
    } else {
      const bang = e('table', 'khung-bang');
      const thead = e('thead');
      const trHead = e('tr');
      trHead.append(
        e('th', null, 'Họ và tên'),
        e('th', null, 'Tên đăng nhập'),
        e('th', null, 'Thời gian đăng ký'),
        Object.assign(e('th', null, 'Thao tác'), { style: 'text-align: right;' })
      );
      thead.append(trHead);
      bang.append(thead);

      const tbody = e('tbody');
      pendingTeachers.forEach((t) => {
        const tr = e('tr');
        const tdTen = e('td');
        tdTen.append(e('b', null, t.tenHienThi || '—'));

        const tdAcc = e('td');
        const codeAcc = e('span', null, '@' + (t.tenDangNhap || ''));
        codeAcc.style.cssText = 'color: #00F2FE; font-family: monospace;';
        tdAcc.append(codeAcc);

        const tdTime = e('td', null, t.taoLuc ? new Date(t.taoLuc).toLocaleString('vi-VN') : '—');

        const tdAct = e('td');
        tdAct.style.cssText = 'text-align: right;';

        const btnApprove = nut('✓ Phê duyệt', 'nut-chinh nut-nho', async () => {
          if (!confirm('Phê duyệt tài khoản giáo viên ' + t.tenHienThi + '?')) return;
          try {
            const resAct = await api('/api/gv/duyet-giao-vien', {
              method: 'POST',
              body: JSON.stringify({ accountId: t.id, action: 'approve' })
            });
            if (resAct.ok) {
              nhac('Đã phê duyệt tài khoản giáo viên!', 'tot');
              await trangDuyetGiaoVien();
            } else {
              nhac('Lỗi: ' + (resAct.loi || resAct.error), 'xau');
            }
          } catch (err) {
            nhac('Lỗi: ' + err.message, 'xau');
          }
        });

        const btnReject = nut('✕ Từ chối', 'nut-phu nut-nho', async () => {
          if (!confirm('Từ chối tài khoản giáo viên ' + t.tenHienThi + '?')) return;
          try {
            const resAct = await api('/api/gv/duyet-giao-vien', {
              method: 'POST',
              body: JSON.stringify({ accountId: t.id, action: 'reject' })
            });
            if (resAct.ok) {
              nhac('Đã từ chối tài khoản', 'tot');
              await trangDuyetGiaoVien();
            } else {
              nhac('Lỗi: ' + (resAct.loi || resAct.error), 'xau');
            }
          } catch (err) {
            nhac('Lỗi: ' + err.message, 'xau');
          }
        });
        btnReject.style.marginLeft = '6px';

        tdAct.append(btnApprove, btnReject);
        tr.append(tdTen, tdAcc, tdTime, tdAct);
        tbody.append(tr);
      });

      bang.append(tbody);
      the.append(bang);
    }

    khung.append(the);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi duyệt giáo viên: ' + err.message));
  }
}

async function trangMaCongDong() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách mã truy cập cộng đồng...'));
  try {
    const res = await api('/api/gv/ma-cong-dong');
    const danhSachMa = Array.isArray(res.danhSachMa) ? res.danhSachMa : [];

    const khung = e('div');
    khung.append(tieuDeTrang(
      '🔑 Quản Lý Mã Truy Cập Bảng Tin Cộng Đồng',
      'Cấp mã mời và giám sát học sinh tham gia Bảng tin cộng đồng của lớp.'
    ));

    const thanhTacVu = e('div');
    thanhTacVu.style.cssText = 'display: flex; justify-content: flex-end; margin-bottom: 16px;';
    const nutTaoMa = nut('+ Tạo mã mời mới', 'nut-chinh', async () => {
      const tenGoi = prompt('Nhập ghi chú cho mã mời (ví dụ: Mã tuần 1, Mã tổ 1...):', 'Mã mời học sinh');
      if (!tenGoi) return;
      try {
        const resTao = await api('/api/gv/ma-cong-dong', {
          method: 'POST',
          body: JSON.stringify({ hanhDong: 'tao_ma_nhanh', tenGoi })
        });
        if (resTao.ok) {
          alert('Mã mời mới tạo thành công: ' + (resTao.maHienThi || resTao.ma));
          await trangMaCongDong();
        } else {
          nhac('Lỗi: ' + (resTao.loi || resTao.error), 'xau');
        }
      } catch (err) {
        nhac('Lỗi: ' + err.message, 'xau');
      }
    });
    thanhTacVu.append(nutTaoMa);
    khung.append(thanhTacVu);

    const the = e('div', 'the');
    the.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px;';

    if (danhSachMa.length === 0) {
      the.append(Object.assign(e('p', null, 'Chưa có mã truy cập nào được tạo. Bấm "+ Tạo mã mời mới" phía trên.'), {
        style: 'text-align: center; color: var(--chu-nhat); padding: 32px 0;'
      }));
    } else {
      const bang = e('table', 'khung-bang');
      const thead = e('thead');
      const trHead = e('tr');
      trHead.append(
        e('th', null, 'Ghi chú'),
        e('th', null, 'Mã hiển thị'),
        e('th', null, 'Học sinh sử dụng'),
        e('th', null, 'Thời gian dùng'),
        e('th', null, 'Trạng thái')
      );
      thead.append(trHead);
      bang.append(thead);

      const tbody = e('tbody');
      danhSachMa.forEach((m) => {
        const tr = e('tr');
        const tdGhiChu = e('td');
        tdGhiChu.append(e('b', null, m.tenGoi || 'Mã mời'));

        const tdMa = e('td');
        const codeElem = e('code', null, m.maHienThi || '••••••••');
        codeElem.style.cssText = 'color: #00F2FE; font-weight: 700;';
        tdMa.append(codeElem);

        const tdHs = e('td');
        if (m.daDungBoiHocSinhTen || m.hocSinhTen) {
          tdHs.textContent = m.daDungBoiHocSinhTen || m.hocSinhTen;
        } else {
          const spanChuaDung = e('span', null, 'Chưa dùng');
          spanChuaDung.style.color = 'var(--chu-nhat)';
          tdHs.append(spanChuaDung);
        }

        const tdTime = e('td', null, m.daDungLuc ? new Date(m.daDungLuc).toLocaleString('vi-VN') : '—');
        const tdTrangThai = e('td');
        tdTrangThai.append(e('span', m.dangHoatDong ? 'nhan-tot' : 'nhan-xam', m.dangHoatDong ? 'Hoạt động' : 'Hết hạn'));

        tr.append(tdGhiChu, tdMa, tdHs, tdTime, tdTrangThai);
        tbody.append(tr);
      });

      bang.append(tbody);
      the.append(bang);
    }

    khung.append(the);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi tải mã cộng đồng: ' + err.message));
  }
}

async function trangBienTapVien() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách Ban biên tập...'));
  try {
    const [resBtv, resHs] = await Promise.all([
      api('/api/gv/bien-tap-vien'),
      api('/api/gv/hoc-sinh')
    ]);
    const btvList = Array.isArray(resBtv.bienTapVien) ? resBtv.bienTapVien : [];
    const dsHs = Array.isArray(resHs.danhSach) ? resHs.danhSach : [];

    const khung = e('div');
    khung.append(tieuDeTrang(
      '✍️ Quản Lý Ban Biên Tập Học Sinh',
      'Phân quyền cho các học sinh cán sự được phép đăng và duyệt bài trên Bảng tin Campus.'
    ));

    const the = e('div', 'the');
    the.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px;';

    const btvMap = new Map(btvList.map((b) => [b.hocSinhId, b.duocPhepDang]));

    const bang = e('table', 'khung-bang');
    const thead = e('thead');
    const trHead = e('tr');
    trHead.append(
      e('th', null, 'STT'),
      e('th', null, 'Họ và tên'),
      e('th', null, 'Quyền biên tập'),
      Object.assign(e('th', null, 'Thao tác'), { style: 'text-align: right;' })
    );
    thead.append(trHead);
    bang.append(thead);

    const tbody = e('tbody');
    dsHs.forEach((h) => {
      const laBtv = btvMap.get(h.id) === 1;
      const tr = e('tr');
      tr.append(
        e('td', null, String(h.soThuTu || '—')),
        Object.assign(e('td'), { children: [e('b', null, h.hoTen || '')] }),
        Object.assign(e('td'), { children: [e('span', laBtv ? 'nhan-tot' : 'nhan-xam', laBtv ? '✓ Biên tập viên' : 'Học sinh thường')] })
      );
      const tdAct = e('td');
      tdAct.style.cssText = 'text-align: right;';
      const btnToggle = nut(laBtv ? 'Hủy quyền' : 'Cấp quyền BTV', (laBtv ? 'nut-phu' : 'nut-chinh') + ' nut-nho', async () => {
        try {
          const resCap = await api('/api/gv/bien-tap-vien', {
            method: 'POST',
            body: JSON.stringify({ hocSinhId: h.id, duocPhepDang: laBtv ? 0 : 1 })
          });
          if (resCap.ok) {
            nhac(laBtv ? 'Đã hủy quyền biên tập viên' : 'Đã cấp quyền biên tập viên!', 'tot');
            await trangBienTapVien();
          } else {
            nhac('Lỗi: ' + (resCap.loi || resCap.error), 'xau');
          }
        } catch (err) {
          nhac('Lỗi: ' + err.message, 'xau');
        }
      });
      tdAct.append(btnToggle);
      tr.append(tdAct);
      tbody.append(tr);
    });

    bang.append(tbody);
    the.append(bang);
    khung.append(the);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi tải ban biên tập: ' + err.message));
  }
}

/* ================= Điều hướng ================= */

const TRANG = {
  '/tong-quan': trangTongQuan,
  '/nguoi-dung': trangNguoiDung,
  '/campus-quan-tri': trangCampus,
  '/bang-tin-quan-tri': trangBangTin,
  '/lop-quan-tri': trangLopThanhVien,
  '/kiem-duyet-quan-tri': trangKiemDuyet,
  '/he-thong-quan-tri': trangHeThong,
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
  '/reset-du-lieu': () => trangResetDuLieu(KHUNG),
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
  '/campus-highlights': trangCampusHighlights,
  '/ho-so-gv': trangHoSoGiaoVien,
  '/phong-campus': trangPhongCampus,
  '/bao-cao-vi-pham': () => trangBaoCaoViPham('all'),
  '/duyet-giao-vien': trangDuyetGiaoVien,
  '/ma-cong-dong': trangMaCongDong,
  '/bien-tap-vien': trangBienTapVien,
  '/them': trangThem,
};

function danhDauMenu(duong) {
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
    PHIEN = { role: d.role, ten: d.ten || '', vaiTro: d.vaiTro || '', quyen: d.quyen || [], tenLop: d.tenLop || '', namHoc: d.namHoc || '', isSchoolAdmin: Boolean(d.isSchoolAdmin || d.laAdminTruong) };
  } catch {
    // Không lấy được thì coi như giáo viên (an toàn hơn là ẩn hết) — API vẫn tự kiểm tra thật ở máy chủ.
  }

  // Chỉ hiện tên + quyền — tên lớp đang quản lý đã hiện sẵn ở huy hiệu ngay cạnh đó (mã lớp +
  // năm học), không nhắc lại bằng chữ "Lớp ..." riêng nữa (trước đây có dòng chữ này, thừa vì
  // đã có huy hiệu, lại dễ đọc thành lặp từ nếu chức danh tài khoản cũng chứa chữ "Quản lý").
  // Tên và chức danh xuống 2 DÒNG RIÊNG (bỏ dấu "·" nối giữa) — trước đây nhồi chung 1 dòng dài
  // "Tên · Chức danh", trên điện thoại hẹp dễ vỡ chữ giữa dòng, phải tách hẳn cho rõ ràng. Icon
  // tách ra một cột RIÊNG (không nhồi vào đầu dòng 1) để dòng 1 và dòng 2 luôn căn thẳng lề trái.
  const hieuPhu = document.querySelector('.hieu-phu');
  if (hieuPhu) {
    hieuPhu.textContent = PHIEN.isSchoolAdmin ? 'Quản trị viên trường' : (PHIEN.ten || 'Giáo viên');
  }

  // Nạp phạm vi quản trị thật (Admin IA v1) — dùng /api/gv/lop-can-chu-y vì nó vốn đã trả đúng
  // danh sách lớp trong phạm vi tài khoản (School Admin: tất cả; GVCN: đúng các lớp mình phụ
  // trách qua giao_vien_lop, hỗ trợ kiêm nhiệm nhiều lớp) — không cần gọi thêm API nào khác.
  const scopeSelect = document.getElementById('adminScopeSelect');
  if (scopeSelect) {
    let dsLopPhamVi = [];
    try {
      const res = await api('/api/gv/lop-can-chu-y');
      dsLopPhamVi = Array.isArray(res?.danhSach) ? res.danhSach : [];
    } catch { /* giữ mảng rỗng, coi như 1 lớp mặc định bên dưới */ }

    scopeSelect.textContent = '';
    if (PHIEN.isSchoolAdmin || dsLopPhamVi.length > 1) {
      if (PHIEN.isSchoolAdmin) {
        const optAll = document.createElement('option');
        optAll.value = 'all';
        optAll.textContent = 'Toàn trường';
        optAll.style.cssText = 'background: #151A23; color: #FFFFFF;';
        scopeSelect.appendChild(optAll);
      }
      for (const l of dsLopPhamVi) {
        const opt = document.createElement('option');
        opt.value = String(l.lopId);
        opt.textContent = l.ten || ('Lớp ' + l.lopId);
        opt.style.cssText = 'background: #151A23; color: #FFFFFF;';
        scopeSelect.appendChild(opt);
      }
      // Nếu phạm vi đã lưu trước đó (sessionStorage) không còn hợp lệ với danh sách lớp hiện tại
      // (vd tài khoản GVCN không có tuỳ chọn "Toàn trường") thì lùi về lựa chọn đầu tiên có thật,
      // đồng thời cập nhật lại PHAM_VI_LOP_ID cho khớp — tránh lệch giữa ô chọn và dữ liệu tải về.
      const cacGiaTriHople = Array.from(scopeSelect.options).map((o) => o.value);
      const muon = PHAM_VI_LOP_ID ? String(PHAM_VI_LOP_ID) : 'all';
      const giaTriCuoi = cacGiaTriHople.includes(muon) ? muon : cacGiaTriHople[0];
      scopeSelect.value = giaTriCuoi;
      datPhamVi(giaTriCuoi === 'all' ? null : Number(giaTriCuoi));
      scopeSelect.disabled = false;
      scopeSelect.onchange = () => {
        datPhamVi(scopeSelect.value === 'all' ? null : Number(scopeSelect.value));
        dieuHuong();
      };
    } else {
      const opt = document.createElement('option');
      opt.value = 'lop';
      opt.textContent = (dsLopPhamVi[0] && dsLopPhamVi[0].ten) || PHIEN.tenLop || 'Lớp';
      opt.style.cssText = 'background: #151A23; color: #FFFFFF;';
      scopeSelect.appendChild(opt);
      scopeSelect.disabled = true;
      datPhamVi(null);
    }
  }
  if (PHIEN.tenLop) {
    document.title = `Quản lý ${PHIEN.tenLop}`;
    const hieuMaLop = document.querySelector('#hieuMaLop');
    if (hieuMaLop) hieuMaLop.textContent = PHIEN.tenLop.replace(/^Lớp\s*/i, '');
  }
  // Badge năm học ghim ở góc huy hiệu lớp — viết tắt "26–27" cho gọn, giống hệt cách trang lớp
  // công khai đang làm (xem apDungThuongHieuLop trong assets/js/trang-lop.js).
  if (PHIEN.namHoc) {
    const hieuNamHoc = document.querySelector('#hieuNamHoc');
    if (hieuNamHoc) {
      const m = PHIEN.namHoc.match(/(\d{4})\s*[–-]\s*(\d{4})/);
      hieuNamHoc.textContent = m ? `${m[1].slice(2)}–${m[2].slice(2)}` : PHIEN.namHoc;
    }
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
    if (location.hash.startsWith('#/diem-danh')) dieuHuong();
  });

  batDauTheoDoiPhien();
})();
