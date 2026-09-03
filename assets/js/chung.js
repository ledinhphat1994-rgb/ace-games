/* Tiện ích dùng chung cho cả trang lớp và khu quản lý. */

export const $ = (chon, goc = document) => goc.querySelector(chon);
export const $$ = (chon, goc = document) => [...goc.querySelectorAll(chon)];

/** Tạo phần tử. Nội dung luôn được đưa vào dạng văn bản thuần nên không sợ hỏng trang. */
export function e(the, lop, chu) {
  const n = document.createElement(the);
  if (lop) n.className = lop;
  if (chu !== undefined && chu !== null) n.textContent = String(chu);
  return n;
}

/** Xoá sạch rồi thêm các phần tử con. */
export function datNoiDung(nut, ...con) {
  nut.replaceChildren(...con.filter(Boolean));
  return nut;
}

/* ---------- Ngày tháng ---------- */

export function homNay() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** "2011-07-11" -> "11/07/2011" */
export function ngayVN(v) {
  if (!v) return '';
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const m2 = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) return `${m2[1].padStart(2, '0')}/${m2[2].padStart(2, '0')}/${m2[3]}`;
  return String(v);
}

const THU = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

/** "2026-09-15" -> "Thứ ba, 15/09/2026" */
export function ngayDayDu(v) {
  if (!v) return '';
  const d = new Date(v + 'T00:00:00');
  if (isNaN(d)) return ngayVN(v);
  return `${THU[d.getDay()]}, ${ngayVN(v)}`;
}

/* ---------- Tiền tệ ---------- */

/** 1500000 -> "1.500.000 đ" */
export function tienVN(so) {
  const n = Number(so) || 0;
  return n.toLocaleString('vi-VN') + ' đ';
}

/* ---------- Gọi API ---------- */

export async function api(duongDan, tuyChon = {}) {
  let res;
  try {
    res = await goi(duongDan, tuyChon);
  } catch (err) {
    // Không nối được máy chủ (mất mạng, sóng yếu) — khác hẳn với việc máy chủ từ chối.
    const loiMang = new Error('Không kết nối được máy chủ.');
    loiMang.ngoaiTuyen = true;
    throw loiMang;
  }
  return docTraLoi(res, duongDan);
}

function goi(duongDan, tuyChon) {
  return fetch(duongDan, {
    headers: { 'Content-Type': 'application/json' },
    ...tuyChon,
    body: tuyChon.than ? JSON.stringify(tuyChon.than) : tuyChon.body,
  });
}

async function docTraLoi(res, duongDan) {
  if (res.status === 401) {
    location.href = '/login.html?next=' + encodeURIComponent(location.pathname + location.hash);
    throw new Error('Phiên đăng nhập đã hết hạn.');
  }

  let duLieu = null;
  try { duLieu = await res.json(); } catch { /* không phải JSON */ }

  if (!res.ok || (duLieu && duLieu.ok === false)) {
    throw new Error((duLieu && duLieu.loi) || `Lỗi ${res.status}`);
  }
  return duLieu;
}

/* ---------- Giao diện sáng / tối ---------- */

export function ganDoiGiaoDien(nut) {
  const luu = (() => { try { return localStorage.getItem('c10a7-giao-dien'); } catch { return null; } })();
  if (luu) document.documentElement.setAttribute('data-theme', luu);
  if (!nut) return;

  nut.addEventListener('click', () => {
    const hienTai = document.documentElement.getAttribute('data-theme');
    const dangToi = hienTai
      ? hienTai === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const moi = dangToi ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', moi);
    try { localStorage.setItem('c10a7-giao-dien', moi); } catch { /* bỏ qua */ }
  });
}

/* ---------- Thông báo nổi ---------- */

let khay;
export function nhac(loiNhan, kieu = '') {
  if (!khay) {
    khay = e('div', 'khay-thong-bao');
    document.body.append(khay);
  }
  const banh = e('div', 'banh-mi ' + kieu, loiNhan);
  khay.append(banh);
  setTimeout(() => banh.remove(), 3200);
}

/* ---------- Khối báo lỗi ---------- */

export function khoiLoi(thongDiep) {
  return e('div', 'bao-loi', thongDiep);
}

export function khoiDangTai(chu = 'Đang tải…') {
  const d = e('div', 'dang-tai');
  d.append(e('span', 'quay'), document.createTextNode(chu));
  return d;
}
