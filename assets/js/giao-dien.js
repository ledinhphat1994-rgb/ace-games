/* Các mảnh giao diện dùng lại trong khu quản lý. */
import { $, e, datNoiDung } from './chung.js';

export function tieuDeTrang(tieuDe, phu, ...nutPhai) {
  const hop = e('div', 'tieu-de-trang');
  const trai = e('div');
  trai.append(e('h1', null, tieuDe));
  if (phu) trai.append(e('p', null, phu));
  hop.append(trai);
  if (nutPhai.length) hop.append(datNoiDung(e('div', 'phai'), ...nutPhai));
  return hop;
}

export function oThongKe(conSo, ten, kieu = '', bieuTuong = '') {
  const o = e('div', 'o-thong-ke ' + kieu);
  const dau = e('div', 'o-thong-ke-dau');
  dau.append(e('span', 'ten', ten));
  if (bieuTuong) dau.append(e('span', 'o-thong-ke-icon', bieuTuong));
  o.append(dau, e('div', 'con-so', conSo));
  return o;
}

// nhan (không bắt buộc): tên cho trình đọc màn hình — bắt buộc dùng khi "chu" chỉ là
// icon (✎ 🗑 ✓ ✕...), vì khi đó văn bản hiển thị không mô tả được hành động.
export function nut(chu, kieu, khiBam, nhan) {
  const b = e('button', 'nut ' + (kieu || ''), chu);
  b.type = 'button';
  if (khiBam) b.addEventListener('click', khiBam);
  if (nhan) b.setAttribute('aria-label', nhan);
  return b;
}

export function lienKetNut(chu, duongDan, kieu = '') {
  const a = e('a', 'nut ' + kieu, chu);
  a.href = duongDan;
  return a;
}

export function truong(nhan, oNhap, ghiChu) {
  const hop = e('div');
  const l = e('label', 'nhan-nhap', nhan);
  l.htmlFor = oNhap.id;
  hop.append(l, oNhap);
  if (ghiChu) hop.append(Object.assign(e('div', 'trong', ghiChu), { style: 'margin-top:4px;font-size:12.5px' }));
  return hop;
}

export function oNhap(id, kieu = 'text', giaTri = '', goiY = '') {
  const o = e(kieu === 'textarea' ? 'textarea' : 'input', 'o-nhap');
  o.id = id;
  if (kieu !== 'textarea') o.type = kieu;
  o.value = giaTri ?? '';
  if (goiY) o.placeholder = goiY;
  return o;
}

export function oChon(id, cacMuc, giaTri) {
  const s = e('select', 'o-nhap');
  s.id = id;
  cacMuc.forEach(([v, t]) => {
    const op = e('option', null, t);
    op.value = v;
    if (String(v) === String(giaTri)) op.selected = true;
    s.append(op);
  });
  return s;
}

export function moHopThoai(tieuDe, noiDung, cacNut) {
  const hop = $('#hopThoai');
  $('#hopThoaiTieuDe').textContent = tieuDe;
  datNoiDung($('#hopThoaiThan'), ...(Array.isArray(noiDung) ? noiDung : [noiDung]));
  datNoiDung($('#hopThoaiChan'), ...cacNut);
  hop.showModal();
  return hop;
}

export const dongHopThoai = () => $('#hopThoai').close();

/** Nút chọn học kì, dùng ở sổ điểm và báo cáo. */
export function chonHocKi(hienTai, khiDoi) {
  const hop = e('div', 'day-loc');
  [1, 2].forEach((hk) => {
    const b = e('button', 'vien-loc', 'Học kì ' + hk);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(hienTai === hk));
    b.addEventListener('click', () => khiDoi(hk));
    hop.append(b);
  });
  return hop;
}

/**
 * Biểu đồ cột chồng vẽ bằng SVG thuần — không cần tải thư viện nào.
 * @param {Array<{nhan:string, phan:Array<{giaTri:number, mau:string, ten:string}>}>} cot
 */
export function bieuDoCot(cot, { cao = 190 } = {}) {
  const RONG = Math.max(320, cot.length * 56);
  const LE_TRAI = 34, LE_DUOI = 30, LE_TREN = 10;
  const caoVe = cao - LE_DUOI - LE_TREN;
  const dinh = Math.max(1, ...cot.map((c) => c.phan.reduce((a, p) => a + p.giaTri, 0)));

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${RONG} ${cao}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(cao));
  svg.setAttribute('role', 'img');
  svg.style.overflow = 'visible';

  const tao = (ten, thuocTinh) => {
    const n = document.createElementNS('http://www.w3.org/2000/svg', ten);
    Object.entries(thuocTinh).forEach(([k, v]) => n.setAttribute(k, String(v)));
    return n;
  };

  // Đường kẻ ngang và số
  [0, 0.5, 1].forEach((p) => {
    const y = LE_TREN + caoVe * (1 - p);
    svg.append(tao('line', {
      x1: LE_TRAI, x2: RONG, y1: y, y2: y,
      stroke: 'var(--vien)', 'stroke-width': 1,
    }));
    const chu = tao('text', { x: 0, y: y + 4, fill: 'var(--chu-mo)', 'font-size': 11 });
    chu.textContent = String(Math.round(dinh * p));
    svg.append(chu);
  });

  const rongCot = (RONG - LE_TRAI) / Math.max(cot.length, 1);
  cot.forEach((c, i) => {
    const x = LE_TRAI + i * rongCot + rongCot * 0.2;
    const w = rongCot * 0.6;
    let y = LE_TREN + caoVe;

    c.phan.forEach((p) => {
      if (!p.giaTri) return;
      const h = (p.giaTri / dinh) * caoVe;
      y -= h;
      const o = tao('rect', { x, y, width: w, height: h, fill: p.mau, rx: 2 });
      const tip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      tip.textContent = `${c.nhan} — ${p.ten}: ${p.giaTri}`;
      o.append(tip);
      svg.append(o);
    });

    const nhan = tao('text', {
      x: x + w / 2, y: cao - 10, fill: 'var(--chu-nhat)',
      'font-size': 10.5, 'text-anchor': 'middle',
    });
    nhan.textContent = c.nhan;
    svg.append(nhan);
  });

  const boc = e('div', 'cuon-ngang');
  const trong = e('div');
  trong.style.minWidth = RONG + 'px';
  trong.append(svg);
  boc.append(trong);
  return boc;
}

/** Chú thích màu cho biểu đồ. */
export function chuThichMau(cacMuc) {
  const hop = e('div', 'chu-thich');
  cacMuc.forEach(([ten, mau]) => {
    const s = e('span');
    const i = e('i');
    i.style.background = mau;
    s.append(i, document.createTextNode(ten));
    hop.append(s);
  });
  return hop;
}
