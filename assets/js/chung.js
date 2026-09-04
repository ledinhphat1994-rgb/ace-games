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

/* ---------- Định danh tài khoản rõ ràng, chuẩn tiếng Việt ---------- */

export function layNhanTaiKhoan(phien = {}) {
  const role = phien.role || '';
  if (role === 'teacher') return 'Tài khoản: Giáo viên chủ nhiệm';
  if (role === 'student') return 'Tài khoản: Học sinh thường';

  let vt = (phien.vaiTro || '').trim();
  const vtLower = vt.toLowerCase();
  if (vtLower === 'admin' || vtLower === 'quản trị' || vtLower === 'quan tri') vt = 'Quản trị viên';
  else if (vtLower === 'thu_quy' || vtLower === 'thu quy') vt = 'Thủ quỹ';
  else if (vtLower === 'lop_truong' || vtLower === 'lop truong') vt = 'Lớp trưởng';
  else if (vtLower === 'bi_thu' || vtLower === 'bi thu') vt = 'Bí thư';
  else if (vtLower === 'to_truong' || vtLower === 'to truong') vt = 'Tổ trưởng';
  else if (vt) vt = vt.charAt(0).toUpperCase() + vt.slice(1);

  const t = (phien.ten || '').trim();
  if (vt) {
    if (!t || t.toLowerCase() === vtLower || t.toLowerCase() === 'admin') {
      return `Tài khoản: ${vt}`;
    }
    return `Tài khoản: ${vt} (${t})`;
  }
  if (t) return `Tài khoản: ${t}`;
  return 'Lớp 10A7 · 2026 – 2027';
}

/* ---------- Bảng tùy chỉnh hình nền & chủ đề dùng chung cho toàn bộ trang ---------- */

export function moBangThemeBg() {
  let hop = document.getElementById('hopThoaiTheme');
  if (!hop) {
    hop = document.createElement('dialog');
    hop.id = 'hopThoaiTheme';
    hop.className = 'hop-thoai hop-thoai-theme';
    hop.addEventListener('click', (ev) => {
      const rect = hop.getBoundingClientRect();
      const inDialog = (
        rect.top <= ev.clientY && ev.clientY <= rect.top + rect.height &&
        rect.left <= ev.clientX && ev.clientX <= rect.left + rect.width
      );
      if (!inDialog) hop.close();
    });
    document.body.appendChild(hop);
  }

  const hienTai = document.documentElement.getAttribute('data-bg-theme') || 'cosmic';
  const luoi = e('div', 'luoi-theme-bg');

  DANH_SACH_THEME.forEach((t) => {
    const the = e('div', 'the-theme-bg' + (hienTai === t.id ? ' active' : ''));
    the.tabIndex = 0;

    const hangMau = e('div', 'the-theme-mau');
    t.mau.forEach((m) => {
      const cham = e('span', 'the-theme-cham');
      cham.style.background = m;
      hangMau.append(cham);
    });

    the.append(
      hangMau,
      e('div', 'the-theme-ten', t.ten),
      e('div', 'the-theme-mo-ta', t.moTa)
    );

    the.addEventListener('click', () => {
      apDungThemeBg(t.id);
      hop.close();
      nhac(`Đã chọn giao diện: ${t.ten}`, 'tot');
    });

    luoi.append(the);
  });

  const tieuDe = e('div', 'hop-thoai-dau');
  tieuDe.append(
    e('h3', null, '🎨 Tùy chỉnh hình nền & chủ đề'),
    Object.assign(e('p', null, 'Chọn phong cách hiển thị và màu nền bạn yêu thích:'), { style: 'margin-top:4px;font-size:13px;color:var(--chu-nhat)' })
  );

  const than = e('div', 'hop-thoai-than');
  than.append(luoi);

  const chan = e('div', 'hop-thoai-chan');
  const nutDong = e('button', 'nut nut-nhe', 'Đóng');
  nutDong.type = 'button';
  nutDong.addEventListener('click', () => hop.close());
  chan.append(nutDong);

  datNoiDung(hop, tieuDe, than, chan);
  hop.showModal();
}

export function ganDoiGiaoDien(nut) {
  khoiTaoThemeBg();
  const luu = (() => { try { return localStorage.getItem('c10a7-giao-dien'); } catch { return null; } })();
  if (luu && !document.documentElement.getAttribute('data-bg-theme')) {
    document.documentElement.setAttribute('data-theme', luu);
  }
  if (nut && !nut.dataset.boundThemeToggle) {
    nut.dataset.boundThemeToggle = '1';
    nut.addEventListener('click', () => {
      const hienTai = document.documentElement.getAttribute('data-theme');
      const dangToi = hienTai
        ? hienTai === 'dark'
        : matchMedia('(prefers-color-scheme: dark)').matches;
      const moi = dangToi ? 'light' : 'dark';
      if (moi === 'light') {
        apDungThemeBg('light');
      } else {
        const luuTheme = (() => { try { return localStorage.getItem('c10a7-bg-theme'); } catch { return null; } })();
        apDungThemeBg(luuTheme && luuTheme !== 'light' ? luuTheme : 'cosmic');
      }
      nhac(moi === 'light' ? 'Đã chuyển sang giao diện sáng' : 'Đã chuyển sang giao diện tối', 'tot');
    });
  }

  // Tự động gắn sự kiện nút mở bảng chọn theme nền nếu có trên trang
  const nutTheme = document.getElementById('nutThemeBg');
  if (nutTheme && !nutTheme.dataset.boundThemeBg) {
    nutTheme.dataset.boundThemeBg = '1';
    nutTheme.addEventListener('click', moBangThemeBg);
  }
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
