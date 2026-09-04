/* Trang lớp — học sinh xem. Toàn bộ dữ liệu lấy từ /api/lop.

   Trang chủ chỉ để năm mục: sĩ số lớp, thông báo, kế hoạch, thời khoá biểu, hình ảnh.
   Danh sách lớp và Thủ quỹ là hai "trang riêng" mở từ menu — cùng một tệp HTML,
   chỉ ẩn/hiện theo địa chỉ #/… nên không cần thêm trang mới và không cần tải lại. */
import { $, e, datNoiDung, api, ngayVN, ngayDayDu, tienVN, ganDoiGiaoDien, khoiLoi, layNhanTaiKhoan } from './chung.js';

ganDoiGiaoDien($('#doiGiaoDien'));

// Hiển thị vai trò tài khoản đăng nhập rõ ràng
api('/api/whoami').then((w) => {
  const hieuPhu = document.querySelector('.hieu-phu');
  if (hieuPhu) hieuPhu.textContent = layNhanTaiKhoan(w);
}).catch(() => {});

/* ---------- Menu ---------- */
(function menu() {
  const nut = $('#moMenu');
  const bang = $('#menuDayDu');
  const dat = (mo) => {
    bang.hidden = !mo;
    nut.setAttribute('aria-expanded', String(mo));
  };

  nut.addEventListener('click', (ev) => { ev.stopPropagation(); dat(bang.hidden); });

  // Chạm vào một mục là đóng menu lại, khỏi phải bấm thêm lần nữa trên điện thoại.
  bang.addEventListener('click', (ev) => { if (ev.target.closest('a')) dat(false); });

  document.addEventListener('click', (ev) => {
    if (!bang.hidden && !bang.contains(ev.target) && !nut.contains(ev.target)) dat(false);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !bang.hidden) { dat(false); nut.focus(); }
  });
})();

/* ---------- Trang riêng mở từ menu ---------- */
const TRANG_PHU = {
  '#/danh-sach': '#trangDanhSach',
  '#/thu-quy': '#trangThuQuy',
};

/* Mỏ neo hợp lệ: #thong-bao, #ke-hoach… (không phải địa chỉ trang riêng #/…) */
function laMoNeo(hash) {
  return /^#[a-z][\w-]*$/i.test(hash);
}

function dinhTuyen() {
  const hash = location.hash;
  const trangCanHien = TRANG_PHU[hash] || null;

  // Ẩn hết rồi mới hiện đúng một trang — không bao giờ để hai trang cùng hiện.
  $('#trangChu').hidden = Boolean(trangCanHien);
  Object.values(TRANG_PHU).forEach((chon) => { $(chon).hidden = chon !== trangCanHien; });

  document.querySelectorAll('.menu-muc').forEach((a) => {
    a.classList.toggle('dang-xem', a.getAttribute('href') === hash);
  });

  if (trangCanHien) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    return;
  }

  // Về trang chủ: nếu địa chỉ là mỏ neo của một mục thì cuộn tới mục đó.
  if (laMoNeo(hash)) {
    const muc = document.querySelector(hash);
    if (muc) muc.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

window.addEventListener('hashchange', dinhTuyen);

/* ---------- Đánh dấu mục đang xem trên thanh menu ngang ---------- */
function ganTheoDoiMuc() {
  const lienKet = [...document.querySelectorAll('.menu a[href^="#"]')]
    .filter((a) => laMoNeo(a.getAttribute('href')));
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
  const tomTat = `${ds.length} học sinh · ${nam} nam · ${ds.length - nam} nữ`;
  $('#soLuongHs').textContent = tomTat;
  $('#menuSoHs').textContent = tomTat;

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

const CAC_BUOI_TKB = [['sang', 'Buổi sáng'], ['chieu', 'Buổi chiều']];

function veThoiKhoaBieu(thoiKhoaBieu) {
  const phienBan = thoiKhoaBieu?.phienBan;
  const o = thoiKhoaBieu?.o || [];
  const cacThu = [2, 3, 4, 5, 6, 7];

  /* Thứ trong JS: 0 là Chủ nhật. Thời khoá biểu đánh số 2..7, nên cộng 1. */
  const thuHomNay = new Date().getDay();
  const soThuTkb = thuHomNay === 0 ? null : thuHomNay + 1;
  const soTietHomNay = soThuTkb ? o.filter((t) => t.thu === soThuTkb).length : 0;

  const dong = [];
  if (o.length) dong.push(soThuTkb ? `Hôm nay có ${soTietHomNay} tiết` : 'Hôm nay Chủ nhật — nghỉ');
  dong.push(phienBan ? `áp dụng từ ${ngayVN(phienBan.ngayBatDau)}` : 'chưa cập nhật thời khoá biểu');
  $('#tkbApDung').textContent = dong.join(' · ');

  if (!o.length) {
    datNoiDung($('#tkbTabBuoi'));
    datNoiDung($('#dauTkb'));
    const tr = e('tr');
    tr.append(Object.assign(e('td', 'trong', 'Chưa cập nhật thời khoá biểu.'), { colSpan: 7 }));
    return datNoiDung($('#thanTkb'), tr);
  }

  const cacBuoiCo = CAC_BUOI_TKB.filter(([ma]) => o.some((x) => x.buoi === ma));
  let buoiDangXem = cacBuoiCo[0]?.[0] || 'sang';

  function veBang() {
    const dau = $('#dauTkb');
    const than = $('#thanTkb');

    const hangDau = e('tr');
    hangDau.append(e('th', null, 'Tiết'), ...cacThu.map((t) => e('th', null, t === 7 ? 'Thứ 7' : 'Thứ ' + t)));
    datNoiDung(dau, hangDau);

    const oBuoi = o.filter((x) => x.buoi === buoiDangXem);
    if (!oBuoi.length) {
      const tr = e('tr');
      tr.append(Object.assign(e('td', 'trong', 'Buổi này không có tiết học.'), { colSpan: 7 }));
      return datNoiDung(than, tr);
    }

    const soTiet = Math.max(...oBuoi.map((t) => t.tiet));
    const bang = {};
    oBuoi.forEach((t) => { bang[`${t.thu}-${t.tiet}`] = t.mon; });

    const hang = [];
    for (let i = 1; i <= soTiet; i++) {
      const tr = e('tr');
      tr.append(Object.assign(e('td', null, 'Tiết ' + i), { style: 'font-weight:700;color:var(--chinh);white-space:nowrap' }));
      cacThu.forEach((t) => tr.append(e('td', null, bang[`${t}-${i}`] || '—')));
      hang.push(tr);
    }
    datNoiDung(than, ...hang);
  }

  const hopTab = $('#tkbTabBuoi');
  if (cacBuoiCo.length > 1) {
    const veTab = () => {
      datNoiDung(hopTab, ...cacBuoiCo.map(([ma, ten]) => {
        const b = e('button', 'vien-loc', ten);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(buoiDangXem === ma));
        b.addEventListener('click', () => { buoiDangXem = ma; veTab(); veBang(); });
        return b;
      }));
    };
    veTab();
  } else {
    datNoiDung(hopTab);
  }

  veBang();
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

/* ---------- Lối tắt "Quản lý" cho giáo viên / tài khoản được cấp quyền ----------
   Trang này ai đăng nhập cũng xem được (kể cả giáo viên), nhưng KHÔNG sửa được gì ở đây —
   đây là trang xem, không phải trang sửa. Với người có quyền, thêm nút bấm là vào thẳng
   đúng trang sửa bên khu quản lý, đỡ phải tự tìm trong menu. */
const MUC_QUAN_LY = [
  ['thong-bao', '#/thong-bao', 'thong-bao'],
  ['ke-hoach', '#/ke-hoach', 'ke-hoach'],
  ['thoi-khoa-bieu', '#/thoi-khoa-bieu', null],
  ['hinh-anh', '#/hinh-anh', 'hinh-anh'],
  ['danh-sach', '#/hoc-sinh', null],
  ['thu-quy', '#/quy', 'quy'],
];

function veLoiTatQuanLy(phien) {
  if (!phien || (phien.role !== 'teacher' && phien.role !== 'phu')) return;

  $('#mucQuanLy').hidden = false;

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

/* ---------- Khởi động ---------- */
(async function () {
  try {
    const [d, phien] = await Promise.all([
      api('/api/lop'),
      api('/api/whoami').catch(() => null),   // học sinh thường sẽ không có whoami đầy đủ quyền, không sao
    ]);
    $('#tenLop').textContent = d.lop.ten;
    veOSo(d.lop.thongKe);
    veThongBao(d.thongBao);
    veKeHoach(d.keHoach);
    veThoiKhoaBieu(d.thoiKhoaBieu);
    veHinhAnh(d.hinhAnh);
    veDanhSach(d.hocSinh);
    veThuQuy(d.thuQuy || { tonQuy: 0, tongThu: 0, tongChi: 0, khoan: [] });
    veLoiTatQuanLy(phien);
    ganTheoDoiMuc();
    dinhTuyen();   // mở đúng trang theo địa chỉ, kể cả khi dán thẳng #/thu-quy vào trình duyệt
  } catch (err) {
    datNoiDung($('#dsThongBao'), khoiLoi('Không tải được dữ liệu lớp: ' + err.message));
  }
})();
