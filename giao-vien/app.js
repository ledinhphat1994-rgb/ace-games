/* Ứng dụng quản lý lớp dành cho giáo viên chủ nhiệm.
   Điều hướng bằng dấu # trên thanh địa chỉ: #/tong-quan, #/diem-danh, ... */
import {
  $, $$, e, datNoiDung, api, homNay, ngayVN, ngayDayDu,
  ganDoiGiaoDien, nhac, khoiLoi, khoiDangTai,
  layNhanTaiKhoan, moBangThemeBg, ganNhacNen, nhanMucDo,
} from '/assets/js/chung.js';
import { moHopThoaiSoanThongBao } from '/assets/js/thong-bao-dialog.js';
import { moHopThoaiThemHoatDong } from '/assets/js/hoat-dong-lop-dialog.js';
import {
  tieuDeTrang, oThongKe, nut, truong, oNhap, oChon, moHopThoai, dongHopThoai,
} from '/assets/js/giao-dien.js';
import { themVaoHangDoi, soChoGui, dongBo, tuDongBoKhiCoMang } from '/assets/js/hang-doi.js';
import {
  trangSoDiem, trangThongKe, trangBaoCao, trangMaCaNhan, trangHinhAnh, trangThuVienAmThanh, trangThuVienVideo, trangNhatKyDangNhap,
} from './trang-hoc-tap.js';
import { trangQuy, trangQuyLichSu } from './trang-quy.js';
import { trangThoiKhoaBieu, trangThoiKhoaBieuLichSu } from './trang-lich.js';

ganDoiGiaoDien($('#doiGiaoDien'));

const nutTheme = $('#nutThemeBg');
if (nutTheme) nutTheme.addEventListener('click', moBangThemeBg);

const KHUNG = $('#noiDung');

// Mỗi tuyến ứng với đúng một "quyenCan" phía máy chủ (functions/api/gv/*.js).
// null = CHỈ giáo viên chủ nhiệm (dữ liệu nhạy cảm: hồ sơ, điểm, thống kê từng em...).
const QUYEN_THEO_TUYEN = {
  'tong-quan': null,
  'diem-danh': 'diem-danh',
  // Học sinh: KHÔNG có quyenCan nào cấp được — trang quản lý hồ sơ học sinh chỉ dành cho giáo
  // viên chủ nhiệm; tài khoản đặc biệt chỉ xem danh sách qua Menu (trang lớp), không qua đây.
  'hoc-sinh': null,
  'so-diem': null,
  'nhat-ky': 'nhat-ky',
  'hoat-dong-lop': ['hoat-dong-lop', 'hinh-anh', 'am-thanh', 'video'],
  'thong-ke': null,
  'thong-bao': 'thong-bao',
  'bao-cao': null,
  'ma-ca-nhan': null,
  'nhat-ky-dang-nhap': null,
  'hinh-anh': 'hinh-anh',
  'thu-vien-am-thanh': 'am-thanh',
  'thu-vien-video': 'video',
  'quy': 'quy',
  'quy-lich-su': 'quy',
  'thoi-khoa-bieu': 'thoi-khoa-bieu',
  'thoi-khoa-bieu-lich-su': 'thoi-khoa-bieu',
  'thoi-khoa-bieu-xem': 'thoi-khoa-bieu',
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

  // Ẩn luôn tiêu đề nhóm nếu không còn mục nào trong nhóm đó (tài khoản đặc biệt chỉ có vài quyền).
  $$('.cot-trai .nhom-dieu-huong').forEach((nhom) => {
    if (!nhom.querySelector('a')) nhom.remove();
  });

  // Cùng một chỗ hiển thị này còn bị khoiDong() ghi thêm "· Đang quản lý: <lớp>" — giữ nguyên
  // phần đó ở đây, không thì tài khoản cán sự sẽ mất dòng tên lớp ngay khi hàm này chạy xong.
  const hieuPhu = document.querySelector('.hieu-phu');
  if (hieuPhu) hieuPhu.textContent = layNhanTaiKhoan(PHIEN) + (PHIEN.tenLop ? ` · Đang quản lý: ${PHIEN.tenLop}` : '');
}

/* ================= Từ điển hiển thị ================= */

const DIEM_DANH = {
  co_mat:          { ten: 'Có mặt',        ky: '✓', lop: 'nhan-tot' },
  tre:             { ten: 'Đi trễ',        ky: 'T', lop: 'nhan-luuy' },
  vang_phep:       { ten: 'Vắng có phép',  ky: 'P', lop: 'nhan' },
  vang_khong_phep: { ten: 'Vắng không phép', ky: '✗', lop: 'nhan-xau' },
};

const LOAI_NHAT_KY = {
  khen:     { ten: 'Khen thưởng', lop: 'nhan-tot' },
  nhac_nho: { ten: 'Nhắc nhở',    lop: 'nhan-luuy' },
  vi_pham:  { ten: 'Vi phạm',     lop: 'nhan-xau' },
  ho_tro:   { ten: 'Cần hỗ trợ',  lop: 'nhan-tim' },
  khac:     { ten: 'Khác',        lop: 'nhan-xam' },
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

  // --- Việc hôm nay: lối tắt hành động + việc còn tồn đọng, để không phải chạy qua nhiều trang ---
  const theVh = e('div', 'the');
  theVh.style.cssText = 'margin-top:16px;border-color:var(--chinh)';
  theVh.append(e('h3', null, 'Việc hôm nay'));
  const dayTat = e('div', 'day-loc');
  dayTat.style.margin = '10px 0 4px';
  dayTat.append(
    nut('✎ Ghi vi phạm / khen', 'nut-vien nut-nho', () => themNhatKy(null, trangTongQuan)),
    nut('💰 Ghi thu quỹ', 'nut-vien nut-nho', () => { location.hash = '#/quy'; }),
    nut('◈ Soạn thông báo', 'nut-vien nut-nho', () => soanThongBao(null, trangTongQuan))
  );
  theVh.append(dayTat);

  if (d.viecTonDong && d.viecTonDong.length) {
    const nhanTon = e('div', 'the-nhan', `${d.viecTonDong.length} việc chưa xử lý — cũ nhất trước`);
    nhanTon.style.margin = '14px 0 8px';
    theVh.append(nhanTon);
    const dsTon = e('div', 'ds-nhat-ky');
    d.viecTonDong.slice(0, 6).forEach((n) => {
      const loai = LOAI_NHAT_KY[n.loai] || LOAI_NHAT_KY.khac;
      const m = e('div', 'muc-nhat-ky ' + n.loai);
      const dong = e('div', 'dong-dau');
      dong.append(e('span', 'nhan ' + loai.lop, loai.ten));
      if (n.hoTen) dong.append(e('span', 'nhan nhan-xam', n.hoTen));
      dong.append(e('span', 'ngay', ngayVN(n.ngay)));
      const viec = e('div', 'viec');
      viec.append(nut('✓ Xong', 'nut-nhe nut-nho', async () => {
        try {
          await api('/api/gv/nhat-ky', { method: 'PATCH', than: { id: n.id, daXuLy: true } });
          trangTongQuan();
        } catch (err) { nhac(err.message, 'xau'); }
      }));
      dong.append(viec);
      m.append(dong, e('p', null, n.noiDung));
      dsTon.append(m);
    });
    theVh.append(dsTon);
  } else {
    theVh.append(e('p', 'trong', 'Không có việc nào tồn đọng trong nhật ký lớp.'));
  }
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
      // Khen chỉ hiện như thông tin thêm, KHÔNG phải dấu hiệu làm giảm mức cần chú ý.
      if (h.soKhen) hang.append(e('span', 'nhan nhan-xam', `${h.soKhen} khen`));

      // Hành động ngay tại dòng — không bắt rời Tổng quan để xử lý (Action Proximity).
      const hanhDong = e('div', 'hanh-dong');
      hanhDong.append(
        nut('Ghi nhật ký', 'nut-nhe nut-nho', () => themNhatKy(h.id, trangTongQuan), 'Ghi nhật ký cho ' + h.hoTen),
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

  // --- Nhật ký gần đây ---
  const theNk = e('div');
  theNk.style.marginTop = '18px';
  theNk.append(e('h3', null, 'Nhật ký gần đây'));
  if (!d.nhatKy.length) {
    theNk.append(e('p', 'trong', 'Chưa có ghi chép nào.'));
  } else {
    const ds = e('div', 'ds-nhat-ky');
    d.nhatKy.slice(0, 6).forEach((n) => ds.append(veMucNhatKy(n, null)));
    theNk.append(ds);
  }
  khung.append(theNk);

  datNoiDung(KHUNG, khung);
}

/* ---------- Điểm danh nhanh: đánh dấu hàng loạt cho trường hợp đặc biệt (đi bồi dưỡng,
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

function veTabDiemDanhNhanh(danhSach, thayDoi, lyDoMoi, veLai, luuDiemDanh, trangThaiHienTai, lyDoHienTai) {
  const khung = e('div');

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

  // Thanh áp dụng nhanh cho cả lớp & Xoá tất cả ghi chú — giống hệt Điểm danh chính.
  const theApDungNhanh = e('div', 'the');
  theApDungNhanh.style.cssText = 'padding:12px 14px;margin:12px 0;';
  theApDungNhanh.append(Object.assign(
    e('div', null, '⚡ Áp dụng nhanh cho cả lớp'),
    { style: 'font-size:12.5px;font-weight:700;color:var(--chu-nhat);margin-bottom:8px;' }
  ));
  const dayApDungNhanh = e('div', 'day-loc');
  Object.entries(DIEM_DANH).forEach(([ma, tt2]) => {
    const caLopDangChon = danhSach.length > 0 &&
      danhSach.every((h) => trangThaiHienTai(h.id, h.trangThai) === ma);

    const b = e('button', 'vien-loc', `${tt2.ky} ${tt2.ten}`);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(caLopDangChon));
    b.title = caLopDangChon
      ? `Bỏ chọn tất cả "${tt2.ten}"`
      : `Đặt "${tt2.ten}" cho cả lớp (bấm lại để bỏ chọn tất cả)`;
    b.addEventListener('click', () => {
      danhSach.forEach((h) => thayDoi.set(h.id, caLopDangChon ? null : ma));
      veLai();
    });
    dayApDungNhanh.append(b);
  });

  const soCoGhiChu = danhSach.filter((h) => lyDoHienTai(h.id, h.lyDo)).length;
  const nutXoaGhiChuPhu = e('button', 'vien-loc', `🗑 Xoá tất cả ghi chú${soCoGhiChu ? ` (${soCoGhiChu})` : ''}`);
  nutXoaGhiChuPhu.type = 'button';
  if (soCoGhiChu) { nutXoaGhiChuPhu.style.color = 'var(--xau)'; nutXoaGhiChuPhu.style.borderColor = 'var(--xau)'; }
  nutXoaGhiChuPhu.addEventListener('click', () => {
    if (!soCoGhiChu) return nhac('Hiện không có học sinh nào có ghi chú trong điểm danh phụ.', 'nhe');
    moHopThoai('Xoá tất cả ghi chú điểm danh phụ?', [
      e('p', null, `Bạn có chắc muốn xoá toàn bộ ghi chú của ${soCoGhiChu} học sinh trong điểm danh phụ buổi này?`),
      e('p', 'trong', 'Thao tác này chỉ xoá ghi chú trong điểm danh phụ, hoàn toàn không ảnh hưởng điểm danh chính.')
    ], [
      nut('Huỷ', 'nut-nhe', dongHopThoai),
      nut('Xoá tất cả ghi chú', 'nut-xau', () => {
        danhSach.forEach((h) => { if (lyDoHienTai(h.id, h.lyDo)) lyDoMoi.set(h.id, ''); });
        dongHopThoai();
        nhac('Đã xoá sạch ghi chú điểm danh phụ (hãy bấm "Lưu điểm danh")', 'tot');
        veLai();
      })
    ]);
  });
  dayApDungNhanh.append(nutXoaGhiChuPhu);
  theApDungNhanh.append(dayApDungNhanh);
  khung.append(theApDungNhanh);

  // Chú thích các nút trạng thái — đặt TRƯỚC danh sách (giống Điểm danh chính) để giáo viên
  // hiểu ký hiệu ✓/T/P/✗/📝 ngay khi vừa xem trang, khỏi phải cuộn qua hết cả lớp mới thấy.
  const chuThich = e('div', 'chu-thich');
  [['✓ Có mặt', 'var(--tot)'], ['T Đi trễ', 'var(--luu-y)'],
   ['P Vắng có phép', 'var(--chinh)'], ['✗ Vắng không phép', 'var(--xau)'],
   ['📝 Ghi chú lý do', 'var(--chinh)']]
    .forEach(([chu, mau]) => {
      const s = e('span');
      const i = e('i');
      i.style.background = mau;
      s.append(i, document.createTextNode(chu));
      chuThich.append(s);
    });
  khung.append(chuThich);

  // Danh sách học sinh — CÙNG một kiểu hàng với Điểm danh chính: cột trạng thái riêng cho
  // từng em (✓/T/P/✗), bấm lại để bỏ chọn, cộng nút 📝 ghi chú lý do riêng.
  const ds = e('div', 'ds-diem-danh');
  ds.style.marginTop = '10px';
  danhSach.forEach((h) => {
    const tt = trangThaiHienTai(h.id, h.trangThai);
    const ld = lyDoHienTai(h.id, h.lyDo);
    const hang = e('div', 'hang-hs' + (tt ? '' : ' chua-ghi'));

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
  khung.append(ds);

  // Thanh lưu riêng của Điểm danh phụ — vẫn một nút lưu duy nhất, lưu thẳng toàn bộ
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
  let tabCon = 'ngay';   // 'ngay' = Điểm danh chính | 'nhanh' = Điểm danh phụ

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
    chonBuoi.style.width = 'auto';
    chonBuoi.addEventListener('change', async () => {
      buoi = chonBuoi.value;
      sessionStorage.setItem('dd-buoi', buoi);
      await tai();
    });

    khung.append(tieuDeTrang('Điểm danh', ngayDayDu(ngay)));

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
    hangChon.append(oNgay, chonBuoi);
    khung.append(hangChon);

    const hopTabCon = e('div', 'day-loc');
    hopTabCon.style.margin = '14px 0';
    [['ngay', '📋 Điểm danh chính'], ['nhanh', '⚡ Điểm danh phụ']].forEach(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(tabCon === ma));
      b.addEventListener('click', async () => {
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

      khung.append(veTabDiemDanhNhanh(duLieuPhu.danhSach, thayDoiPhu, lyDoMoiPhu, ve, luuDiemDanhPhu, trangThaiHienTaiPhu, lyDoHienTaiPhu));
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

      // Thanh áp dụng nhanh cho cả lớp & Xoá tất cả ghi chú
      const theApDungNhanh = e('div', 'the');
      theApDungNhanh.style.cssText = 'padding:12px 14px;margin-bottom:12px;';
      theApDungNhanh.append(Object.assign(
        e('div', null, '⚡ Áp dụng nhanh cho cả lớp'),
        { style: 'font-size:12.5px;font-weight:700;color:var(--chu-nhat);margin-bottom:8px;' }
      ));
      const dayApDungNhanh = e('div', 'day-loc');
      Object.entries(DIEM_DANH).forEach(([ma, tt2]) => {
        const caLopDangChon = duLieuChinh.danhSach.length > 0 &&
          duLieuChinh.danhSach.every((h) => trangThaiHienTaiChinh(h.id, h.trangThai) === ma);

        const b = e('button', 'vien-loc', `${tt2.ky} ${tt2.ten}`);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(caLopDangChon));
        b.title = caLopDangChon
          ? `Bỏ chọn tất cả "${tt2.ten}"`
          : `Đặt "${tt2.ten}" cho cả lớp (bấm lại để bỏ chọn tất cả)`;
        b.addEventListener('click', () => {
          if (caLopDangChon) {
            duLieuChinh.danhSach.forEach((h) => thayDoiChinh.set(h.id, null));
          } else {
            duLieuChinh.danhSach.forEach((h) => thayDoiChinh.set(h.id, ma));
          }
          ve();
        });
        dayApDungNhanh.append(b);
      });

      // Nút Xoá tất cả ghi chú của Điểm danh chính
      const soCoGhiChu = duLieuChinh.danhSach.filter((h) => lyDoHienTaiChinh(h.id, h.lyDo)).length;
      const bXoaGc = e('button', 'vien-loc', `🗑 Xoá tất cả ghi chú${soCoGhiChu ? ` (${soCoGhiChu})` : ''}`);
      bXoaGc.type = 'button';
      if (soCoGhiChu) {
        bXoaGc.style.color = 'var(--xau)';
        bXoaGc.style.borderColor = 'var(--xau)';
      }
      bXoaGc.title = 'Xoá toàn bộ ghi chú lý do của cả lớp trong buổi chính này';
      bXoaGc.addEventListener('click', () => {
        if (!soCoGhiChu) return nhac('Hiện không có học sinh nào có ghi chú trong buổi này.', 'nhe');
        moHopThoai('Xoá tất cả ghi chú buổi này?', [
          e('p', null, `Bạn có chắc muốn xoá toàn bộ ghi chú lý do của ${soCoGhiChu} học sinh trong buổi chính này?`),
          e('p', 'trong', 'Trạng thái điểm danh (Có mặt, Vắng, Trễ) vẫn giữ nguyên, chỉ xoá sạch nội dung ghi chú lý do.')
        ], [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá tất cả ghi chú', 'nut-xau', () => {
            duLieuChinh.danhSach.forEach((h) => {
              if (lyDoHienTaiChinh(h.id, h.lyDo)) {
                lyDoMoiChinh.set(h.id, '');
              }
            });
            dongHopThoai();
            nhac('Đã xoá sạch ghi chú của cả lớp (hãy bấm "Lưu điểm danh")', 'tot');
            ve();
          })
        ]);
      });
      dayApDungNhanh.append(bXoaGc);

      theApDungNhanh.append(dayApDungNhanh);
      khung.append(theApDungNhanh);

      // Chú thích các nút trạng thái — đặt TRƯỚC danh sách (không phải sau như trước) để
      // giáo viên hiểu ký hiệu ✓/T/P/✗/📝 nghĩa là gì NGAY khi vừa xem trang, khỏi phải cuộn
      // qua hết cả lớp (có thể vài chục em) mới thấy chú thích nằm ở cuối.
      const chuThich = e('div', 'chu-thich');
      [['✓ Có mặt', 'var(--tot)'], ['T Đi trễ', 'var(--luu-y)'],
       ['P Vắng có phép', 'var(--chinh)'], ['✗ Vắng không phép', 'var(--xau)'],
       ['📝 Ghi chú lý do', 'var(--chinh)']]
        .forEach(([chu, mau]) => {
          const s = e('span');
          const i = e('i');
          i.style.background = mau;
          s.append(i, document.createTextNode(chu));
          chuThich.append(s);
        });
      khung.append(chuThich);

      // Danh sách học sinh
      const ds = e('div', 'ds-diem-danh');
      duLieuChinh.danhSach.forEach((h) => {
        const tt = trangThaiHienTaiChinh(h.id, h.trangThai);
        const ld = lyDoHienTaiChinh(h.id, h.lyDo);
        const hang = e('div', 'hang-hs' + (tt ? '' : ' chua-ghi'));

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
      khung.append(ds);
    }
    khung.append(Object.assign(e('div'), { style: 'height:70px' }));

    // Thanh lưu — CHỈ hiện ở tab Điểm danh chính. Tab Điểm danh phụ đã có nút lưu riêng ngay
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
  ['to-hop', 'Tổ hợp'], ['chuc-vu', 'Chức vụ'], ['to-so', 'Tổ'],
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
      Object.assign(e('h3', null, '👁 Công khai ở "Danh sách lớp" (mọi học sinh xem được)'), { style: 'margin-top:14px' }),
      e('p', 'trong', 'Bỏ tích mục nào thì ẩn cột đó khỏi danh sách lớp công khai (họ tên luôn hiện).'),
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

const LOP_XEP_LOAI_HOC_TAP = { 'Tốt': 'nhan-tot', 'Khá': 'nhan', 'Đạt': 'nhan-luuy', 'Chưa đạt': 'nhan-xau' };

const CAC_TAB_HO_SO = [
  ['chuyen-can', 'Chuyên cần'],
  ['hoc-tap', 'Học tập'],
  ['hanh-kiem', 'Hạnh kiểm'],
  ['phu-huynh', 'Phụ huynh'],
];

async function trangHoSo(id, tabMacDinh) {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api('/api/gv/hoc-sinh?id=' + encodeURIComponent(id));
  const h = d.hocSinh;
  let tab = tabMacDinh || sessionStorage.getItem('hs-tab') || 'chuyen-can';
  if (!CAC_TAB_HO_SO.some(([ma]) => ma === tab)) tab = 'chuyen-can';
  let diemCache = null;   // { 1: {monHoc, hang}, 2: {...} } — nạp khi mở tab Học tập lần đầu

  const khung = e('div');
  // Quay lại ĐÚNG chỗ vừa đến (Tổng quan, Nhật ký...), không phải luôn về Danh sách cố định
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
  const hangNutHs = e('div', 'day-loc');
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
  const hopTab = e('div', 'day-loc');
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
        tab = ma;
        sessionStorage.setItem('hs-tab', ma);
        veThanhTab();
        veNoiDungTab();
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

  // Học tập: đọc lại (không sửa) — Sổ điểm vẫn là nơi duy nhất nhập/sửa điểm.
  // Tái dùng nguyên API /api/gv/so-diem đã có (bảng tổng hợp 37 em), lọc ra đúng 1 em ở trình
  // duyệt — 37 dòng là dữ liệu nhỏ, không cần thêm tham số/API riêng.
  async function veHocTap() {
    const box = e('div');
    box.append(khoiDangTai());
    noiDungTab.replaceChildren(box);

    if (!diemCache) {
      const [hk1, hk2] = await Promise.all([
        api('/api/gv/so-diem?hocKi=1'),
        api('/api/gv/so-diem?hocKi=2'),
      ]);
      diemCache = {
        1: { monHoc: hk1.monHoc, hang: hk1.danhSach.find((x) => x.id === h.id) },
        2: { monHoc: hk2.monHoc, hang: hk2.danhSach.find((x) => x.id === h.id) },
      };
    }
    if (tab !== 'hoc-tap') return;   // giáo viên đã chuyển tab khác trong lúc chờ tải

    const noiDung = e('div');
    [1, 2].forEach((hocKi) => {
      const { monHoc, hang } = diemCache[hocKi] || {};
      const the = e('div', 'the');
      the.style.marginTop = hocKi === 1 ? '0' : '14px';
      the.append(e('h3', null, `Học kì ${hocKi}`));

      if (!hang || (hang.soMonCoDiem === 0 && !hang.renLuyen)) {
        the.append(e('p', 'trong', `Chưa có điểm nào trong học kì ${hocKi}.`));
        noiDung.append(the);
        return;
      }

      if (hang.dtbChung !== null) {
        const tomTat = e('div', 'day-loc');
        tomTat.style.margin = '4px 0 10px';
        tomTat.append(e('span', 'nhan nhan-tim', `ĐTB ${hang.dtbChung}`));
        if (hang.xepLoai) tomTat.append(e('span', 'nhan ' + (LOP_XEP_LOAI_HOC_TAP[hang.xepLoai] || ''), hang.xepLoai));
        if (hang.renLuyen) tomTat.append(e('span', 'nhan nhan-luuy', 'Rèn luyện: ' + hang.renLuyen));
        the.append(tomTat);
      }

      const ds = e('div', 'ds-diem-danh');
      monHoc.forEach((m) => {
        const gt = hang.theoMon[m.ma];
        if (gt === null || gt === '' || gt === undefined) return;
        const hangMon = e('div', 'hang-hs');
        const tenMon = e('div', 'ten');
        tenMon.append(e('b', null, m.ten));
        hangMon.append(tenMon,
          e('span', 'nhan ' + (m.cach_danh_gia === 'nhan_xet' ? (gt === 'D' ? 'nhan-tot' : 'nhan-xau') : ''),
            m.cach_danh_gia === 'nhan_xet' ? (gt === 'D' ? 'Đạt' : 'Chưa đạt') : String(gt)));
        ds.append(hangMon);
      });
      if (!ds.children.length) the.append(e('p', 'trong', 'Chưa có điểm môn nào được nhập.'));
      else the.append(ds);
      if (hang.nhanXetRenLuyen) the.append(Object.assign(e('p', null, 'Nhận xét rèn luyện: ' + hang.nhanXetRenLuyen), { style: 'margin-top:8px;font-size:13px;color:var(--chu-nhat)' }));
      noiDung.append(the);
    });

    noiDungTab.replaceChildren(noiDung);
  }

  function veHanhKiem() {
    const box = e('div');
    const dauNk = e('div', 'tieu-de-trang');
    dauNk.append(e('h2', null, 'Nhật ký của em này'));
    const phaiNk = e('div', 'phai');
    phaiNk.append(nut('+ Thêm ghi chép', 'nut-vien nut-nho', () => themNhatKy(h.id, () => trangHoSo(id, 'hanh-kiem'))));
    dauNk.append(phaiNk);
    box.append(dauNk);

    if (!d.nhatKy.length) {
      box.append(e('p', 'trong', 'Chưa có ghi chép nào.'));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      d.nhatKy.forEach((n) => ds.append(veMucNhatKy({ ...n, hoTen: null }, () => trangHoSo(id, 'hanh-kiem'))));
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
    if (tab === 'hoc-tap') return veHocTap();
    if (tab === 'hanh-kiem') return noiDungTab.replaceChildren(veHanhKiem());
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
  const oSdt = oNhap('sSdt', 'tel', h.dienThoaiPh, 'Điện thoại phụ huynh');
  const oHc = oNhap('sHc', 'text', h.hoanCanh, 'Hộ cận nghèo, GĐ khó khăn…');
  const oGc = oNhap('sGc', 'textarea', h.ghiChu, 'Ghi chú riêng');

  moHopThoai('Sửa hồ sơ — ' + h.hoTen, [
    truong('Họ và tên', oHoTen, 'Sửa lại họ tên nếu có sai sót'),
    truong('Chức vụ', oChuc),
    truong('Tổ', oTo),
    truong('Điện thoại phụ huynh', oSdt),
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
            dienThoaiPh: oSdt.value, hoanCanh: oHc.value, ghiChu: oGc.value,
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

/* ================= Trang: Nhật ký ================= */

function veMucNhatKy(n, taiLai) {
  const loai = LOAI_NHAT_KY[n.loai] || LOAI_NHAT_KY.khac;
  const m = e('div', 'muc-nhat-ky ' + n.loai + (n.daXuLy ? ' da-xong' : ''));

  const dong = e('div', 'dong-dau');
  dong.append(e('span', 'nhan ' + loai.lop, loai.ten));
  if (n.hoTen) dong.append(e('span', 'nhan nhan-xam', n.hoTen));
  dong.append(e('span', 'ngay', ngayVN(n.ngay)));

  if (taiLai) {
    const nguoiLienQuan = n.hoTen || 'cả lớp';
    const viec = e('div', 'viec');
    viec.append(
      nut(n.daXuLy ? '↺' : '✓', 'nut-nhe nut-nho', async () => {
        try {
          await api('/api/gv/nhat-ky', { method: 'PATCH', than: { id: n.id, daXuLy: !n.daXuLy } });
          taiLai();
        } catch (err) { nhac(err.message, 'xau'); }
      }, (n.daXuLy ? 'Đánh dấu chưa xử lý — ' : 'Đánh dấu đã xử lý — ') + nguoiLienQuan),
      nut('✕', 'nut-nhe nut-nho', async () => {
        moHopThoai('Xoá ghi chép?', e('p', null, n.noiDung), [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá', 'nut-xau', async () => {
            try {
              await api('/api/gv/nhat-ky?id=' + n.id, { method: 'DELETE' });
              dongHopThoai();
              nhac('Đã xoá', 'tot');
              taiLai();
            } catch (err) { nhac(err.message, 'xau'); }
          }),
        ]);
      }, 'Xoá ghi chép — ' + nguoiLienQuan)
    );
    dong.append(viec);
  }

  m.append(dong, e('p', null, n.noiDung));
  return m;
}

function themNhatKy(hocSinhIdMacDinh, taiLai) {
  api('/api/gv/hoc-sinh').then((d) => {
    const oNgay = oNhap('nkNgay', 'date', homNay());
    const oLoai = oChon('nkLoai', Object.entries(LOAI_NHAT_KY).map(([k, v]) => [k, v.ten]), 'nhac_nho');
    const oHs = oChon('nkHs',
      [['', '— Cả lớp —'], ...d.danhSach.map((h) => [String(h.id), `${h.id}. ${h.hoTen}`])],
      hocSinhIdMacDinh ? String(hocSinhIdMacDinh) : '');
    const oNd = oNhap('nkNd', 'textarea', '', 'Nội dung ghi chép…');

    moHopThoai('Thêm ghi chép', [
      truong('Ngày', oNgay),
      truong('Loại', oLoai),
      truong('Học sinh', oHs),
      truong('Nội dung', oNd),
    ], [
      nut('Huỷ', 'nut-nhe', dongHopThoai),
      nut('Lưu', '', async (ev) => {
        if (!oNd.value.trim()) return nhac('Chưa nhập nội dung', 'xau');
        ev.currentTarget.disabled = true;
        try {
          await api('/api/gv/nhat-ky', {
            method: 'POST',
            than: { ngay: oNgay.value, loai: oLoai.value, hocSinhId: oHs.value || null, noiDung: oNd.value },
          });
          dongHopThoai();
          nhac('Đã thêm ghi chép', 'tot');
          taiLai();
        } catch (err) {
          nhac(err.message, 'xau');
          ev.currentTarget.disabled = false;
        }
      }),
    ]);
  }).catch((err) => nhac(err.message, 'xau'));
}

async function trangNhatKy() {
  datNoiDung(KHUNG, khoiDangTai());
  let loai = '';
  let chiChuaXuLy = false;

  async function ve() {
    const q = new URLSearchParams();
    if (loai) q.set('loai', loai);
    if (chiChuaXuLy) q.set('daXuLy', '0');
    const d = await api('/api/gv/nhat-ky' + (q.toString() ? '?' + q.toString() : ''));
    const khung = e('div');

    const dau = e('div', 'tieu-de-trang');
    const trai = e('div');
    trai.append(e('h1', null, 'Nhật ký lớp'), e('p', null, 'Khen thưởng, nhắc nhở, vi phạm, hỗ trợ.'));
    const phai = e('div', 'phai');
    phai.append(nut('+ Thêm ghi chép', '', () => themNhatKy(null, ve)));
    dau.append(trai, phai);
    khung.append(dau);

    const hopLoc = e('div', 'day-loc');
    hopLoc.style.marginBottom = '10px';
    [['', 'Tất cả'], ...Object.entries(LOAI_NHAT_KY).map(([k, v]) => [k, v.ten])].forEach(([v, t]) => {
      const b = e('button', 'vien-loc', t);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(loai === v));
      b.addEventListener('click', () => { loai = v; ve(); });
      hopLoc.append(b);
    });
    khung.append(hopLoc);

    // Lọc theo trạng thái xử lý — phối hợp được với bộ lọc loại ở trên (cả hai cùng áp dụng).
    const hopLocXl = e('div', 'day-loc');
    hopLocXl.style.marginBottom = '16px';
    const bChuaXl = e('button', 'vien-loc', 'Chưa xử lý');
    bChuaXl.type = 'button';
    bChuaXl.setAttribute('aria-pressed', String(chiChuaXuLy));
    bChuaXl.addEventListener('click', () => { chiChuaXuLy = !chiChuaXuLy; ve(); });
    hopLocXl.append(bChuaXl);
    khung.append(hopLocXl);

    if (!d.danhSach.length) {
      khung.append(e('p', 'trong', chiChuaXuLy ? 'Không còn ghi chép nào chưa xử lý.' : 'Chưa có ghi chép nào.'));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      d.danhSach.forEach((n) => ds.append(veMucNhatKy(n, ve)));
      khung.append(ds);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
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
    phai.append(nut('+ Soạn thông báo', '', () => soanThongBao(null, ve)));
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
  ['#/thong-ke', '📈', 'Thống kê chuyên cần', 'Biểu đồ theo tuần và cảnh báo em có nguy cơ.'],
  ['#/thong-bao', '◈', 'Thông báo', 'Soạn và đăng thông báo lên trang lớp.'],
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
  const tieuDePhu = PHIEN.role === 'teacher'
    ? 'Các công cụ khác của lớp'
    : layNhanTaiKhoan(PHIEN);
  khung.append(tieuDeTrang('Thêm', tieuDePhu));

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
    a.append(noi, e('div', 'canh-phai', '›'));
    ds.append(a);
  });
  khung.append(ds);

  datNoiDung(KHUNG, khung);
}

/* ================= Trang: Hoạt động lớp ================= */

const ICON_LOAI_HOAT_DONG = { anh: '🖼', video: '🎬', 'am-thanh': '🎵', text: '📝' };

async function trangHoatDongLop(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const d = await api('/api/gv/hoat-dong-lop');
    const khung = e('div');
    khung.append(tieuDeTrang('Hoạt động lớp', `${d.danhSach.length} mục đang hiện ở trang chủ`,
      nut('+ Thêm hoạt động', '', () => moHopThoaiThemHoatDong(ve))
    ));

    if (!d.danhSach.length) {
      khung.append(e('p', 'trong', 'Chưa có mục nào — bấm "+ Thêm hoạt động" để đăng bài viết, ảnh, video hoặc âm thanh lên trang chủ.'));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      d.danhSach.forEach((item) => {
        const m = e('div', 'muc-nhat-ky');
        const dong = e('div', 'dong-dau');
        const nhanTen = item.loai === 'video' ? (item.videoTen || 'Video')
          : item.loai === 'am-thanh' ? (item.amThanhTen || 'Âm thanh')
          : item.loai === 'text' ? 'Tin hoạt động / Bài viết'
          : (item.chuThich || 'Ảnh');
        dong.append(
          e('span', 'nhan nhan-xam', `${ICON_LOAI_HOAT_DONG[item.loai] || '📎'} ${nhanTen}`),
          e('span', 'ngay', ngayVN(item.ngay))
        );
        if (PHIEN.role === 'teacher') {
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
        if (item.chuThich && item.loai !== 'anh') {
          const pNd = e('p', null, item.chuThich);
          if (item.loai === 'text') {
            pNd.style.cssText = 'white-space:pre-wrap;margin-top:6px;line-height:1.5;color:var(--chu);';
          }
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
  '/hoc-sinh': trangHocSinh,
  '/so-diem': () => trangSoDiem(KHUNG),
  '/nhat-ky': trangNhatKy,
  '/hoat-dong-lop': () => trangHoatDongLop(KHUNG),
  '/thong-bao': trangThongBao,
  '/thong-ke': () => trangThongKe(KHUNG),
  '/bao-cao': () => trangBaoCao(KHUNG),
  '/ma-ca-nhan': () => trangMaCaNhan(KHUNG),
  '/nhat-ky-dang-nhap': () => trangNhatKyDangNhap(KHUNG),
  '/hinh-anh': () => trangHinhAnh(KHUNG),
  '/thu-vien-am-thanh': () => trangThuVienAmThanh(KHUNG),
  '/thu-vien-video': () => trangThuVienVideo(KHUNG),
  '/quy': () => trangQuy(KHUNG),
  '/quy-lich-su': () => trangQuyLichSu(KHUNG),
  '/thoi-khoa-bieu': () => trangThoiKhoaBieu(KHUNG),
  '/thoi-khoa-bieu-lich-su': () => trangThoiKhoaBieuLichSu(KHUNG),
  '/them': trangThem,
};

function danhDauMenu(duong) {
  $$('.cot-trai a, .tab-duoi a').forEach((a) => {
    const trongMucThem = ['/thong-ke', '/thong-bao', '/bao-cao', '/ma-ca-nhan', '/hinh-anh', '/thu-vien-am-thanh', '/thu-vien-video', '/hoat-dong-lop', '/quy', '/quy-lich-su', '/thoi-khoa-bieu'].includes(duong);
    const khop = a.getAttribute('href') === '#' + duong
      || (duong.startsWith('/hoc-sinh') && a.getAttribute('href') === '#/hoc-sinh')
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

  // Ghi rõ "Đang quản lý: <tên lớp>" — cùng một người có thể chủ nhiệm nhiều lớp bằng nhiều mã
  // khác nhau, cần tín hiệu nhìn thấy ngay để tránh tự nhầm lẫn đang thao tác nhầm lớp (dữ liệu
  // đã được máy chủ tách biệt tuyệt đối, đây chỉ là hiển thị cho rõ ràng).
  const hieuPhu = document.querySelector('.hieu-phu');
  if (hieuPhu) {
    hieuPhu.textContent = layNhanTaiKhoan(PHIEN) + (PHIEN.tenLop ? ` · Đang quản lý: ${PHIEN.tenLop}` : '');
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
