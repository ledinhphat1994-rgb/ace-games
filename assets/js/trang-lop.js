/* Trang lớp — học sinh xem. Toàn bộ dữ liệu lấy từ /api/lop. */
import { $, e, datNoiDung, api, ngayVN, ngayDayDu, ganDoiGiaoDien, khoiLoi } from './chung.js';

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

async function veHinhAnh() {
  const hop = $('#thuVien');
  let ds = [];
  try {
    const res = await fetch('/data/hinh-anh.json', { cache: 'no-store' });
    if (res.ok) ds = await res.json();
  } catch { /* chưa có ảnh cũng không sao */ }

  if (!ds.length) {
    return datNoiDung(hop, e('p', 'trong',
      'Chưa có hình ảnh. Thêm ảnh vào thư mục assets/img và khai báo trong data/hinh-anh.json.'));
  }

  datNoiDung(hop, ...ds.map((a) => {
    const hinh = e('figure');
    const img = e('img');
    img.src = a.anh;
    img.alt = a.chuThich || 'Ảnh hoạt động lớp 10A7';
    img.loading = 'lazy';
    hinh.append(img);
    if (a.chuThich) hinh.append(e('figcaption', null, a.chuThich));
    return hinh;
  }));
}

/* ---------- Khởi động ---------- */
(async function () {
  try {
    const d = await api('/api/lop');
    $('#tenLop').textContent = d.lop.ten;
    veOSo(d.lop.thongKe);
    veThongBao(d.thongBao);
    veDanhSach(d.hocSinh);
    veThoiKhoaBieu(d.thoiKhoaBieu);
    veKeHoach(d.keHoach);
    ganTheoDoiMuc();
  } catch (err) {
    datNoiDung($('#dsThongBao'), khoiLoi('Không tải được dữ liệu lớp: ' + err.message));
  }
  veHinhAnh();
})();
