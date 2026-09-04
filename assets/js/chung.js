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

/* ---------- Giao diện sáng / tối & Chủ đề hình nền ---------- */

export const DANH_SACH_THEME = [
  {
    id: 'cosmic',
    ten: '🌌 Vũ trụ xanh sâu',
    moTa: 'Nền đêm sâu thẳm, ánh lam ngọc huyền ảo (Mặc định).',
    mau: ['#070b14', '#38bdf8', '#6366f1'],
    dark: true,
  },
  {
    id: 'nebula',
    ten: '🔮 Tinh vân tím lam',
    moTa: 'Ánh tím neon rực rỡ và xanh biển sâu hiện đại.',
    mau: ['#0a0614', '#c084fc', '#e879f9'],
    dark: true,
  },
  {
    id: 'emerald',
    ten: '🌲 Ngọc lục bảo sang',
    moTa: 'Nền ngọc bích quý phái, dịu mắt, tăng độ tập trung.',
    mau: ['#04100c', '#34d399', '#2dd4bf'],
    dark: true,
  },
  {
    id: 'amber',
    ten: '🌅 Hoàng hôn hoàng kim',
    moTa: 'Ánh vàng hổ phách ấm áp & hồng ngọc rực rỡ.',
    mau: ['#100b06', '#f59e0b', '#f43f5e'],
    dark: true,
  },
  {
    id: 'cyber',
    ten: '⚡ Xám than công nghệ',
    moTa: 'Tối giản, tương phản cao, công nghệ sắc nét.',
    mau: ['#0b0f14', '#38bdf8', '#94a3b8'],
    dark: true,
  },
  {
    id: 'light',
    ten: '☀️ Học đường tươi sáng',
    moTa: 'Giao diện nền sáng thanh lịch, rõ ràng, dễ nhìn ban ngày.',
    mau: ['#f8fafc', '#0284c7', '#ffffff'],
    dark: false,
  },
];

export function apDungThemeBg(id) {
  const t = DANH_SACH_THEME.find((x) => x.id === id) || DANH_SACH_THEME[0];
  document.documentElement.setAttribute('data-bg-theme', t.id);
  document.documentElement.setAttribute('data-theme', t.dark ? 'dark' : 'light');
  try {
    localStorage.setItem('c10a7-bg-theme', t.id);
    localStorage.setItem('c10a7-giao-dien', t.dark ? 'dark' : 'light');
  } catch {}
}

export function khoiTaoThemeBg() {
  const luu = (() => { try { return localStorage.getItem('c10a7-bg-theme'); } catch { return null; } })();
  if (luu) apDungThemeBg(luu);
}

export function ganDoiGiaoDien(nut) {
  khoiTaoThemeBg();
  const luu = (() => { try { return localStorage.getItem('c10a7-giao-dien'); } catch { return null; } })();
  if (luu && !document.documentElement.getAttribute('data-bg-theme')) {
    document.documentElement.setAttribute('data-theme', luu);
  }
  if (!nut) return;

  nut.addEventListener('click', () => {
    const hienTai = document.documentElement.getAttribute('data-theme');
    const dangToi = hienTai
      ? hienTai === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const moi = dangToi ? 'light' : 'dark';
    if (moi === 'light') {
      apDungThemeBg('light');
    } else {
      apDungThemeBg('cosmic');
    }
    nhac(moi === 'light' ? 'Đã chuyển sang giao diện sáng' : 'Đã chuyển sang giao diện tối', 'tot');
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
