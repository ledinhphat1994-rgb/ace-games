/* Trang lớp — học sinh xem. Toàn bộ dữ liệu lấy từ /api/lop.

   Trang chủ chỉ để năm mục: sĩ số lớp, thông báo, kế hoạch, thời khoá biểu, hình ảnh.
   Danh sách lớp và Thủ quỹ là hai "trang riêng" mở từ menu — cùng một tệp HTML,
   chỉ ẩn/hiện theo địa chỉ #/… nên không cần thêm trang mới và không cần tải lại. */
import { $, e, datNoiDung, api, homNay, ngayVN, ngayDayDu, tienVN, ganDoiGiaoDien, khoiLoi, layNhanTaiKhoan, nhac } from './chung.js';
import { nut, truong, oNhap, oChon, moHopThoai, dongHopThoai } from './giao-dien.js';

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

function veThongBao(ds, phien, lamMoi) {
  const hop = $('#dsThongBao');
  if (!ds.length) return datNoiDung(hop, e('p', 'trong', 'Chưa có thông báo nào.'));

  const duocPhep = phien && (phien.role === 'teacher' || (phien.quyen || []).includes('thong-bao'));

  datNoiDung(hop, ...ds.map((t) => {
    const bai = e('article', 'tin' + (t.ghim ? ' tin-ghim' : ''));
    const dau = e('div', 'tin-dau');
    dau.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap';

    const thongTin = e('div');
    thongTin.style.cssText = 'display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap';
    if (t.ghim) thongTin.append(e('span', 'nhan nhan-luuy', 'Quan trọng'));
    if (t.loai) thongTin.append(e('span', 'nhan nhan-xam', t.loai));
    thongTin.append(e('span', null, ngayDayDu(t.ngay)));
    dau.append(thongTin);

    if (duocPhep) {
      const thaoTac = e('div', 'thao-tac-tin');
      thaoTac.style.cssText = 'margin-left:auto;display:inline-flex;gap:6px';
      thaoTac.append(
        nut('✏ Sửa', 'nut-nhe nut-nho', () => moHopThoaiSuaThongBao(t, lamMoi)),
        nut('🗑 Xoá', 'nut-nhe nut-nho', () => moHopThoaiXoaThongBao(t, lamMoi))
      );
      dau.append(thaoTac);
    }

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

/* ---------- Quản lý thông báo trực tiếp trên trang chủ ---------- */
function moHopThoaiThemThongBao(lamMoi) {
  soanThongBaoModal(null, lamMoi);
}

function moHopThoaiSuaThongBao(tb, lamMoi) {
  soanThongBaoModal(tb, lamMoi);
}

function soanThongBaoModal(tb, lamMoi) {
  const oNgay = oNhap('tbNgay', 'date', tb ? tb.ngay : homNay());
  const oTd = oNhap('tbTd', 'text', tb ? tb.tieuDe : '', 'Ví dụ: Họp phụ huynh đầu năm');
  const oNd = oNhap('tbNd', 'textarea', tb ? tb.noiDung : '', 'Nội dung chi tiết…');
  const oLoai = oChon('tbLoai',
    [['Chủ nhiệm', 'Chủ nhiệm'], ['Nhà trường', 'Nhà trường'], ['Học tập', 'Học tập'], ['Hoạt động', 'Hoạt động']],
    tb ? tb.loai : 'Chủ nhiệm');

  const oGhim = e('input');
  oGhim.type = 'checkbox';
  oGhim.id = 'tbGhim';
  oGhim.checked = Boolean(tb && tb.ghim);
  const hangGhim = e('label');
  hangGhim.style.cssText = 'display:flex;gap:9px;align-items:center;font-size:14px;font-weight:600';
  hangGhim.append(oGhim, document.createTextNode('Ghim lên đầu trang lớp'));

  moHopThoai(tb ? 'Sửa thông báo' : 'Thêm thông báo mới', [
    truong('Ngày', oNgay),
    truong('Tiêu đề', oTd),
    truong('Phân loại', oLoai),
    truong('Nội dung', oNd),
    hangGhim,
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut(tb ? 'Lưu thay đổi' : 'Đăng thông báo', '', async (ev) => {
      if (!oTd.value.trim() || !oNd.value.trim()) return nhac('Cần nhập cả tiêu đề và nội dung', 'xau');
      ev.currentTarget.disabled = true;
      try {
        const than = {
          ngay: oNgay.value, tieuDe: oTd.value, noiDung: oNd.value,
          loai: oLoai.value, ghim: oGhim.checked,
        };
        if (tb) await api('/api/gv/thong-bao', { method: 'PATCH', than: { id: tb.id, ...than } });
        else await api('/api/gv/thong-bao', { method: 'POST', than });
        dongHopThoai();
        nhac(tb ? 'Đã cập nhật thông báo' : 'Đã đăng thông báo mới', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

function moHopThoaiXoaThongBao(tb, lamMoi) {
  moHopThoai('Xoá thông báo', [
    e('p', null, `Bạn có chắc muốn xoá thông báo "${tb.tieuDe}" không? Thao tác này không thể hoàn tác.`),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Xoá thông báo', 'nut-xau', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/thong-bao?id=' + tb.id, { method: 'DELETE' });
        dongHopThoai();
        nhac('Đã xoá thông báo', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

/* ---------- Băng điểm nhấn: tự cuộn ngang, gộp thông báo đã ghim + mốc quan trọng sắp tới ----------
   Không thêm dữ liệu mới — chỉ chọn lọc lại từ thông báo (ghim) và kế hoạch (mức độ cần chú ý/quan
   trọng, chưa qua ngày) đã có sẵn. Ẩn hẳn khối này nếu không có gì đáng nổi bật, không để trống rỗng. */
function veDiemNhan(thongBao, keHoach) {
  const khoi = $('#bangDiemNhan');
  const cuon = $('#dnCuon');
  const homNayStr = homNay();

  const tin = (thongBao || []).filter((t) => t.ghim).map((t) => ({
    nhan: 'Thông báo', tieuDe: t.tieuDe, phu: ngayDayDu(t.ngay), href: '#thong-bao',
  }));
  const ke = (keHoach || [])
    .filter((k) => !k.hoanThanh && k.ngay >= homNayStr && (k.mucDo === 'danger' || k.mucDo === 'warn'))
    .sort((a, b) => a.ngay.localeCompare(b.ngay))
    .map((k) => ({ nhan: k.mucDo === 'danger' ? 'Quan trọng' : 'Sắp tới', tieuDe: k.tieuDe, phu: ngayDayDu(k.ngay), href: '#ke-hoach' }));

  const cacTin = [...tin, ...ke].slice(0, 10);
  if (!cacTin.length) { khoi.hidden = true; return; }
  khoi.hidden = false;

  datNoiDung(cuon, ...cacTin.map((t) => {
    const a = e('a', 'dn-the');
    a.href = t.href;
    a.append(
      e('span', 'dn-nhan', t.nhan),
      e('h3', null, t.tieuDe),
      e('p', null, t.phu)
    );
    return a;
  }));

  // Tự cuộn — dừng khi người dùng đưa chuột/chạm vào, và bỏ hẳn nếu máy đặt giảm chuyển động.
  if (khoi.dataset.daGanCuon) return;   // chỉ gắn sự kiện cuộn một lần dù dữ liệu tải lại nhiều lần
  khoi.dataset.daGanCuon = '1';

  const giamChuyenDong = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let henGio = null;

  function cuonMotThe(chieu) {
    const the = cuon.querySelector('.dn-the');
    const rong = (the ? the.offsetWidth : 300) + 14;
    if (chieu > 0 && cuon.scrollLeft + cuon.clientWidth >= cuon.scrollWidth - 4) {
      cuon.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      cuon.scrollBy({ left: chieu * rong, behavior: 'smooth' });
    }
  }

  function batTuDong() {
    if (giamChuyenDong || henGio) return;
    henGio = setInterval(() => cuonMotThe(1), 4500);
  }
  function tatTuDong() {
    if (henGio) { clearInterval(henGio); henGio = null; }
  }

  khoi.addEventListener('mouseenter', tatTuDong);
  khoi.addEventListener('mouseleave', batTuDong);
  khoi.addEventListener('touchstart', tatTuDong, { passive: true });
  $('#dnTrai').addEventListener('click', () => { tatTuDong(); cuonMotThe(-1); });
  $('#dnPhai').addEventListener('click', () => { tatTuDong(); cuonMotThe(1); });

  batTuDong();
}

/* ---------- Kế hoạch năm học & quản lý trực tiếp ---------- */
const MUC_DO_KH = [['', 'Bình thường'], ['ok', 'Tốt / lễ hội'], ['warn', 'Cần chú ý'], ['danger', 'Quan trọng']];

function moHopThoaiThemKeHoach(lamMoi) {
  soanKeHoachModal(null, lamMoi);
}

function moHopThoaiSuaKeHoach(k, lamMoi) {
  soanKeHoachModal(k, lamMoi);
}

function soanKeHoachModal(k, lamMoi) {
  const oNgay = oNhap('khNgay', 'date', k ? k.ngay : homNay());
  const oTieuDe = oNhap('khTieuDe', 'text', k ? k.tieuDe : '', 'Ví dụ: Khai giảng năm học mới');
  const oMoTa = oNhap('khMoTa', 'textarea', k ? k.moTa : '', 'Mô tả chi tiết (không bắt buộc)');
  const oMucDo = oChon('khMucDo', MUC_DO_KH, k ? (k.mucDo || '') : '');

  const oHoanThanh = e('input');
  oHoanThanh.type = 'checkbox';
  oHoanThanh.id = 'khHoanThanh';
  oHoanThanh.checked = Boolean(k && k.hoanThanh);
  const hangHoanThanh = e('label');
  hangHoanThanh.style.cssText = 'display:flex;gap:9px;align-items:center;font-size:14px;font-weight:600';
  hangHoanThanh.append(oHoanThanh, document.createTextNode('Đánh dấu đã hoàn thành'));

  moHopThoai(k ? 'Sửa mốc kế hoạch' : 'Thêm mốc kế hoạch mới', [
    truong('Ngày', oNgay),
    truong('Tiêu đề', oTieuDe),
    truong('Mức độ', oMucDo),
    truong('Mô tả', oMoTa),
    hangHoanThanh,
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut(k ? 'Lưu thay đổi' : 'Thêm kế hoạch', '', async (ev) => {
      if (!oTieuDe.value.trim()) return nhac('Chưa nhập tiêu đề', 'xau');
      ev.currentTarget.disabled = true;
      try {
        const than = {
          ngay: oNgay.value,
          tieuDe: oTieuDe.value,
          moTa: oMoTa.value,
          mucDo: oMucDo.value,
          hoanThanh: oHoanThanh.checked,
        };
        if (k) await api('/api/gv/ke-hoach', { method: 'PATCH', than: { id: k.id, ...than } });
        else await api('/api/gv/ke-hoach', { method: 'POST', than });
        dongHopThoai();
        nhac(k ? 'Đã lưu kế hoạch' : 'Đã thêm mốc kế hoạch', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

function moHopThoaiXoaKeHoach(k, lamMoi) {
  moHopThoai('Xoá mốc kế hoạch', [
    e('p', null, `Bạn có chắc muốn xoá mốc kế hoạch "${k.tieuDe}" không? Thao tác này không thể hoàn tác.`),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Xoá kế hoạch', 'nut-xau', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/ke-hoach?id=' + k.id, { method: 'DELETE' });
        dongHopThoai();
        nhac('Đã xoá mốc kế hoạch', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

function veKeHoach(ds, phien, lamMoi) {
  const hop = $('#dsKeHoach');
  if (!ds.length) return datNoiDung(hop, e('div', 'the trong', 'Chưa có kế hoạch nào.'));

  const duocPhep = phien && (phien.role === 'teacher' || (phien.quyen || []).includes('ke-hoach'));
  const mau = { ok: 'nhan-tot', warn: 'nhan-luuy', danger: 'nhan-xau' };

  datNoiDung(hop, ...ds.map((k) => {
    const the = e('div', 'the');
    const dau = e('div');
    dau.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px';

    const thongTin = e('div');
    thongTin.style.cssText = 'display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap';
    thongTin.append(e('span', 'nhan ' + (mau[k.mucDo] || 'nhan-xam'), ngayVN(k.ngay)));
    if (k.hoanThanh) thongTin.append(e('span', 'nhan nhan-tot', '✓ Đã xong'));
    dau.append(thongTin);

    if (duocPhep) {
      const thaoTac = e('div', 'thao-tac-tin');
      thaoTac.style.cssText = 'margin-left:auto;display:inline-flex;gap:6px';
      thaoTac.append(
        nut('✏ Sửa', 'nut-nhe nut-nho', () => moHopThoaiSuaKeHoach(k, lamMoi)),
        nut('🗑 Xoá', 'nut-nhe nut-nho', () => moHopThoaiXoaKeHoach(k, lamMoi))
      );
      dau.append(thaoTac);
    }

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
   Trang này ai đăng nhập cũng xem được (kể cả giáo viên). Với người có quyền,
   thêm nút thao tác trực tiếp (Thêm thông báo, Thêm kế hoạch) và lối tắt vào khu quản lý. */
const MUC_QUAN_LY = [
  ['thong-bao', '#/thong-bao', 'thong-bao'],
  ['ke-hoach', '#/ke-hoach', 'ke-hoach'],
  ['thoi-khoa-bieu', '#/thoi-khoa-bieu', null],
  ['hinh-anh', '#/hinh-anh', 'hinh-anh'],
  ['danh-sach', '#/hoc-sinh', null],
  ['thu-quy', '#/quy', 'quy'],
];

function veLoiTatQuanLy(phien, lamMoi) {
  if (!phien || (phien.role !== 'teacher' && phien.role !== 'phu')) return;

  $('#mucQuanLy').hidden = false;

  MUC_QUAN_LY.forEach(([idMuc, duong, quyenCan]) => {
    const duocPhep = phien.role === 'teacher' || (quyenCan && (phien.quyen || []).includes(quyenCan));
    if (!duocPhep) return;

    const dauMuc = document.querySelector(`#${idMuc} .dau-muc`);
    if (!dauMuc) return;

    let vungThaoTac = dauMuc.querySelector('.khu-thao-tac-muc');
    if (!vungThaoTac) {
      vungThaoTac = e('div', 'khu-thao-tac-muc');
      vungThaoTac.style.cssText = 'margin-left:auto;display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap';
      dauMuc.append(vungThaoTac);
    } else {
      datNoiDung(vungThaoTac);
    }

    if (idMuc === 'thong-bao') {
      vungThaoTac.append(nut('+ Thêm thông báo', 'nut-chinh nut-nho', () => moHopThoaiThemThongBao(lamMoi)));
    } else if (idMuc === 'ke-hoach') {
      vungThaoTac.append(nut('+ Thêm kế hoạch', 'nut-chinh nut-nho', () => moHopThoaiThemKeHoach(lamMoi)));
    }

    const a = e('a', 'nut nut-vien nut-nho', '⚙ Quản lý');
    a.href = '/giao-vien/' + duong;
    vungThaoTac.append(a);
  });
}

/* ---------- Khởi động & làm mới dữ liệu ---------- */
let thongTinPhien = null;

async function taiDuLieu() {
  try {
    const [d, phien] = await Promise.all([
      api('/api/lop'),
      thongTinPhien ? Promise.resolve(thongTinPhien) : api('/api/whoami').catch(() => null),
    ]);
    thongTinPhien = phien;

    $('#tenLop').textContent = d.lop.ten;
    veOSo(d.lop.thongKe);
    veDiemNhan(d.thongBao, d.keHoach);
    veThongBao(d.thongBao, phien, taiDuLieu);
    veKeHoach(d.keHoach, phien, taiDuLieu);
    veThoiKhoaBieu(d.thoiKhoaBieu);
    veHinhAnh(d.hinhAnh);
    veDanhSach(d.hocSinh);
    veThuQuy(d.thuQuy || { tonQuy: 0, tongThu: 0, tongChi: 0, khoan: [] });
    veLoiTatQuanLy(phien, taiDuLieu);
  } catch (err) {
    datNoiDung($('#dsThongBao'), khoiLoi('Không tải được dữ liệu lớp: ' + err.message));
  }
}

(async function () {
  await taiDuLieu();
  ganTheoDoiMuc();
  dinhTuyen();
})();
