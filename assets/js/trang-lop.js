/* Trang lớp — học sinh xem. Toàn bộ dữ liệu lấy từ /api/lop. */
import { $, e, datNoiDung, api, ngayVN, ngayDayDu, tienVN, ganDoiGiaoDien, khoiLoi } from './chung.js';

ganDoiGiaoDien($('#doiGiaoDien'));

/* ---------- Menu điện thoại ---------- */
(function menu() {
  const nut = $('#moMenu');
  const bang = $('#menuDienThoai');
  nut.addEventListener('click', () => {
    bang.hidden = !bang.hidden;
    nut.setAttribute('aria-expanded', String(!bang.hidden));
  });
  bang.addEventListener('click', (ev) => {
    if (ev.target.tagName === 'A') { bang.hidden = true; nut.setAttribute('aria-expanded', 'false'); }
  });
})();

/* ---------- Đánh dấu mục đang xem ---------- */
function ganTheoDoiMuc() {
  const lienKet = [...document.querySelectorAll('.menu a[href^="#"]')];
  const muc = lienKet.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window) || !muc.length) return;

  const doi = new IntersectionObserver((mucVao) => {
    mucVao.forEach((m) => {
      if (!m.isIntersecting) return;
      lienKet.forEach((a) => a.classList.toggle('dang-xem', a.getAttribute('href') === '#' + m.target.id));
    });
  }, { rootMargin: '-70px 0px -68% 0px' });

  muc.forEach((m) => doi.observe(m));
}

/* ---------- Vẽ từng phần ---------- */

function veOSo(thongKe) {
  datNoiDung($('#oSo'), ...thongKe.map((t) => {
    const o = e('div');
    o.append(e('b', null, t.giaTri), e('span', null, t.nhan));
    return o;
  }));
}

function veThongBao(ds) {
  const hop = $('#dsThongBao');
  if (!ds.length) return datNoiDung(hop, e('p', 'trong', 'Chưa có thông báo nào.'));

  datNoiDung(hop, ...ds.map((t) => {
    const bai = e('article', 'tin' + (t.ghim ? ' tin-ghim' : ''));
    const dau = e('div', 'tin-dau');
    if (t.ghim) dau.append(e('span', 'nhan nhan-luuy', 'Quan trọng'));
    if (t.loai) dau.append(e('span', 'nhan nhan-xam', t.loai));
    dau.append(e('span', null, ngayDayDu(t.ngay)));
    bai.append(dau, e('h3', null, t.tieuDe), e('p', null, t.noiDung));
    return bai;
  }));
}

function veDanhSach(ds) {
  const than = $('#bangHocSinh');
  const nam = ds.filter((h) => h.gioiTinh === 'Nam').length;
  $('#soLuongHs').textContent = `${ds.length} học sinh · ${nam} nam · ${ds.length - nam} nữ`;

  const cacNghe = [...new Set(ds.map((h) => h.lopNghe).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
  let nghe = '';
  let tim = '';

  function veLoc() {
    const hop = $('#locNghe');
    datNoiDung(hop, ...[['', `Tất cả (${ds.length})`],
      ...cacNghe.map((n) => [n, `${n} (${ds.filter((h) => h.lopNghe === n).length})`])]
      .map(([giaTri, nhan]) => {
        const b = e('button', 'vien-loc', nhan);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(nghe === giaTri));
        b.addEventListener('click', () => { nghe = giaTri; veLoc(); ve(); });
        return b;
      }));
  }

  function ve() {
    const q = tim.trim().toLowerCase();
    const hang = ds.filter((h) => {
      if (nghe && h.lopNghe !== nghe) return false;
      if (!q) return true;
      return ['hoTen', 'lopNghe', 'toHop', 'chucVu'].some((k) => String(h[k] || '').toLowerCase().includes(q));
    });

    if (!hang.length) {
      const tr = e('tr');
      tr.append(Object.assign(e('td', 'trong', 'Không tìm thấy học sinh phù hợp.'), { colSpan: 7 }));
      return datNoiDung(than, tr);
    }

    datNoiDung(than, ...hang.map((h) => {
      const tr = e('tr');
      const tdNghe = e('td');
      if (h.lopNghe) tdNghe.append(e('span', 'nhan nhan-xam', h.lopNghe));
      const tdChuc = e('td');
      if (h.chucVu) tdChuc.append(e('span', 'nhan nhan-tot', h.chucVu));

      tr.append(
        e('td', 'so', h.stt),
        e('td', null, h.hoTen),
        e('td', null, h.gioiTinh || ''),
        e('td', null, ngayVN(h.ngaySinh)),
        tdNghe,
        e('td', null, h.toHop || ''),
        tdChuc
      );
      return tr;
    }));
  }

  veLoc();
  ve();
  $('#oTim').addEventListener('input', (ev) => { tim = ev.target.value; ve(); });
}

function veThoiKhoaBieu(tiet) {
  const dau = $('#dauTkb');
  const than = $('#thanTkb');
  const cacThu = [2, 3, 4, 5, 6, 7];

  const hangDau = e('tr');
  hangDau.append(e('th', null, 'Tiết'), ...cacThu.map((t) => e('th', null, t === 7 ? 'Thứ 7' : 'Thứ ' + t)));
  datNoiDung(dau, hangDau);

  if (!tiet.length) {
    const tr = e('tr');
    tr.append(Object.assign(e('td', 'trong', 'Chưa cập nhật thời khoá biểu.'), { colSpan: 7 }));
    return datNoiDung(than, tr);
  }

  const soTiet = Math.max(...tiet.map((t) => t.tiet));
  const bang = {};
  tiet.forEach((t) => { bang[`${t.thu}-${t.tiet}`] = t.mon; });

  const hang = [];
  for (let i = 1; i <= soTiet; i++) {
    const tr = e('tr');
    tr.append(Object.assign(e('td', null, 'Tiết ' + i), { style: 'font-weight:700;color:var(--chinh);white-space:nowrap' }));
    cacThu.forEach((t) => tr.append(e('td', null, bang[`${t}-${i}`] || '—')));
    hang.push(tr);
  }
  datNoiDung(than, ...hang);
}

function veKeHoach(ds) {
  const hop = $('#dsKeHoach');
  if (!ds.length) return datNoiDung(hop, e('div', 'the trong', 'Chưa có kế hoạch nào.'));

  const mau = { ok: 'nhan-tot', warn: 'nhan-luuy', danger: 'nhan-xau' };
  datNoiDung(hop, ...ds.map((k) => {
    const the = e('div', 'the');
    const dau = e('div');
    dau.append(e('span', 'nhan ' + (mau[k.mucDo] || 'nhan-xam'), ngayVN(k.ngay)));
    if (k.hoanThanh) dau.append(document.createTextNode(' '), e('span', 'nhan nhan-tot', 'Đã xong'));
    the.append(dau, e('h3', null, k.tieuDe));
    if (k.moTa) the.append(e('p', null, k.moTa));
    return the;
  }));
}

/* ---------- Tóm tắt trang chủ ---------- */
function veTomTat(d) {
  const hop = $('#dsTomTat');
  const nam = d.hocSinh.filter((h) => h.gioiTinh === 'Nam').length;
  const tinMoi = (d.thongBao || [])[0];
  const moc = (d.keHoach || []).find((k) => !k.hoanThanh);
  const khoanDangMo = (d.thuQuy?.khoan || []).filter((k) => k.dangMo);

  const homNayIso = new Date().toISOString().slice(0, 10);
  const thuHomNay = new Date().getDay(); // 0=CN..6=T7 -> quy đổi sang 2..7 dùng ở TKB
  const soThuTkb = thuHomNay === 0 ? null : thuHomNay + 1;
  const soTietHomNay = soThuTkb ? d.thoiKhoaBieu.filter((t) => t.thu === soThuTkb).length : 0;

  const mucTom = [
    ['#thong-bao', '◈', 'Thông báo', tinMoi ? tinMoi.tieuDe : 'Chưa có thông báo', tinMoi ? ngayVN(tinMoi.ngay) : ''],
    ['#danh-sach', '☰', 'Danh sách lớp', `${d.hocSinh.length} học sinh`, `${nam} nam · ${d.hocSinh.length - nam} nữ`],
    ['#thoi-khoa-bieu', '▦', 'Thời khoá biểu', soThuTkb ? `Hôm nay ${soTietHomNay} tiết` : 'Chủ nhật — nghỉ', 'Xem cả tuần'],
    ['#ke-hoach', '✎', 'Kế hoạch', moc ? moc.tieuDe : 'Không có mốc sắp tới', moc ? ngayVN(moc.ngay) : ''],
    ['#thu-quy', '💰', 'Thủ quỹ', tienVN(d.thuQuy?.tonQuy || 0), khoanDangMo.length ? `${khoanDangMo.length} khoản đang thu` : 'Chưa có khoản thu nào'],
    ['#hinh-anh', '🖼', 'Hình ảnh', `${(d.hinhAnh || []).length} ảnh`, 'Hoạt động của lớp'],
  ];

  datNoiDung(hop, ...mucTom.map(([duong, icon, ten, giaTri, phu]) => {
    const a = e('a', 'the-tom-tat');
    a.href = duong;
    const dong = e('div', 'dong-icon');
    dong.append(e('span', 'icon', icon), e('h3', null, ten), Object.assign(e('span', 'mui-ten', '›'), { style: 'margin-left:auto' }));
    a.append(dong, e('div', 'gia-tri', giaTri));
    if (phu) a.append(e('div', 'phu', phu));
    return a;
  }));
}

/* ---------- Thủ quỹ (công khai: chỉ số liệu tổng hợp) ---------- */
function veThuQuy(tq) {
  const oTongQuan = $('#tqTongQuan');
  datNoiDung(oTongQuan,
    (() => { const o = e('div', 'o-thong-ke tot'); o.append(e('div', 'con-so', tienVN(tq.tonQuy)), e('div', 'ten', 'Tồn quỹ hiện tại')); return o; })(),
    (() => { const o = e('div', 'o-thong-ke'); o.append(e('div', 'con-so', tienVN(tq.tongThu)), e('div', 'ten', 'Tổng đã thu')); return o; })(),
    (() => { const o = e('div', 'o-thong-ke luuy'); o.append(e('div', 'con-so', tienVN(tq.tongChi)), e('div', 'ten', 'Tổng đã chi')); return o; })()
  );

  const hop = $('#tqKhoan');
  if (!tq.khoan.length) {
    return datNoiDung(hop, e('p', 'trong', 'Chưa có khoản thu nào được mở.'));
  }

  datNoiDung(hop, e('h3', null, 'Các khoản thu'), ...tq.khoan.map((k) => {
    const dong = e('div');
    dong.style.cssText = 'padding:10px 0;border-bottom:1px solid var(--vien)';
    const dau = e('div');
    dau.style.cssText = 'display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap';
    dau.append(
      e('b', null, k.ten + (k.dangMo ? '' : ' (đã đóng)')),
      e('span', null, `${tienVN(k.tongDaThu)} / ${tienVN(k.tongCanThu)}`)
    );
    dong.append(dau);
    const thanh = e('div', 'thanh-tien-do');
    const i = e('i', 'p-comat');
    i.style.width = Math.min(100, k.tongCanThu ? Math.round((k.tongDaThu / k.tongCanThu) * 100) : 0) + '%';
    thanh.append(i);
    dong.append(thanh);
    return dong;
  }));
}

function veHinhAnh(ds) {
  const hop = $('#thuVien');
  if (!ds || !ds.length) {
    return datNoiDung(hop, e('p', 'trong',
      'Chưa có hình ảnh nào. Giáo viên chủ nhiệm sẽ đăng ảnh hoạt động của lớp tại đây.'));
  }

  datNoiDung(hop, ...ds.map((a) => {
    const hinh = e('figure');
    const img = e('img');
    img.src = '/api/anh?khoa=' + encodeURIComponent(a.khoa);
    img.alt = a.chuThich || 'Ảnh hoạt động lớp 10A7';
    img.loading = 'lazy';
    img.decoding = 'async';
    hinh.append(img);
    if (a.chuThich) hinh.append(e('figcaption', null, a.chuThich));
    return hinh;
  }));
}

/* ---------- Khởi động ---------- */
/* ---------- Lối tắt "Quản lý" cho giáo viên / tài khoản được cấp quyền ----------
   Trang này ai đăng nhập cũng xem được (kể cả giáo viên), nhưng KHÔNG sửa được gì ở đây —
   đây là trang xem, không phải trang sửa. Với người có quyền, thêm nút bấm là vào thẳng
   đúng trang sửa bên khu quản lý, đỡ phải tự tìm trong menu. */
const MUC_QUAN_LY = [
  ['thong-bao', '#/thong-bao', 'thong-bao'],
  ['danh-sach', '#/hoc-sinh', null],
  ['thoi-khoa-bieu', '#/thoi-khoa-bieu', null],
  ['ke-hoach', '#/ke-hoach', 'ke-hoach'],
  ['thu-quy', '#/quy', 'quy'],
  ['hinh-anh', '#/hinh-anh', 'hinh-anh'],
];

function veLoiTatQuanLy(phien) {
  if (!phien || (phien.role !== 'teacher' && phien.role !== 'phu')) return;

  MUC_QUAN_LY.forEach(([idMuc, duong, quyenCan]) => {
    const duocPhep = phien.role === 'teacher' || (quyenCan && (phien.quyen || []).includes(quyenCan));
    if (!duocPhep) return;

    const dauMuc = document.querySelector(`#${idMuc} .dau-muc`);
    if (!dauMuc) return;

    const a = e('a', 'nut nut-vien nut-nho', '⚙ Quản lý');
    a.href = '/giao-vien/' + duong;
    a.style.marginLeft = 'auto';
    dauMuc.append(a);
  });
}

(async function () {
  try {
    const [d, phien] = await Promise.all([
      api('/api/lop'),
      api('/api/whoami').catch(() => null),   // học sinh thường sẽ không có whoami đầy đủ quyền, không sao
    ]);
    $('#tenLop').textContent = d.lop.ten;
    veOSo(d.lop.thongKe);
    veThongBao(d.thongBao);
    veDanhSach(d.hocSinh);
    veThoiKhoaBieu(d.thoiKhoaBieu);
    veKeHoach(d.keHoach);
    veHinhAnh(d.hinhAnh);
    veThuQuy(d.thuQuy || { tonQuy: 0, tongThu: 0, tongChi: 0, khoan: [] });
    veTomTat(d);
    veLoiTatQuanLy(phien);
    ganTheoDoiMuc();
  } catch (err) {
    datNoiDung($('#dsThongBao'), khoiLoi('Không tải được dữ liệu lớp: ' + err.message));
  }
})();
