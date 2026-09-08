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

/* ---------- Mức độ quan trọng của Thông báo ----------
   Dùng chung cho cả khu quản lý (soạn thông báo) và trang lớp (hiển thị nhãn màu) — một
   thông báo chọn mức nào thì nhãn và màu hiện RA GIỐNG NHAU ở mọi nơi, để học sinh quen
   mắt màu nào là mức nào. Đây cũng là mức độ đã thay thế "mucDo" của Kế hoạch năm học cũ. */
export const MUC_DO_THONG_BAO = [
  ['', 'Bình thường'],
  ['ok', 'Quan trọng'],
  ['warn', 'Rất quan trọng'],
  ['danger', 'Khẩn cấp'],
];
const NHAN_MUC_DO = {
  ok: { ten: 'Quan trọng', lop: 'nhan-tot' },
  warn: { ten: 'Rất quan trọng', lop: 'nhan-luuy' },
  danger: { ten: 'Khẩn cấp', lop: 'nhan-xau' },
};
/** mucDo ('', 'ok', 'warn', 'danger') -> {ten, lop} để gắn nhãn màu, hoặc null nếu bình thường. */
export function nhanMucDo(mucDo) {
  return NHAN_MUC_DO[mucDo] || null;
}

/* ---------- Ảnh: nén nhỏ ngay trên máy trước khi tải lên ----------
   Dùng cho ảnh đính kèm Thông báo — tải thẳng lên bằng thân nhị phân thô (không bọc base64/
   JSON) nên trả về Blob, khác nenAnh() riêng của "Ảnh hoạt động" (trang-hoc-tap.js) vốn trả
   base64 vì API đó nhận JSON. */
const RONG_ANH_TOI_DA = 1600;
const CHAT_LUONG_ANH = 0.82;

export async function nenAnhThanhBlob(tep) {
  const anh = await createImageBitmap(tep);
  const tiLe = Math.min(1, RONG_ANH_TOI_DA / Math.max(anh.width, anh.height));
  const w = Math.round(anh.width * tiLe);
  const h = Math.round(anh.height * tiLe);

  const khung = document.createElement('canvas');
  khung.width = w;
  khung.height = h;
  khung.getContext('2d').drawImage(anh, 0, 0, w, h);
  anh.close();

  const blob = await new Promise((giai) => khung.toBlob(giai, 'image/jpeg', CHAT_LUONG_ANH));
  if (!blob) throw new Error('Không xử lý được ảnh này.');
  return blob;
}

export const CAC_LOAI_CHI = [
  ['hoat_dong', 'Hoạt động lớp'],
  ['vpp', 'Văn phòng phẩm'],
  ['khen_thuong', 'Khen thưởng'],
  ['ho_tro', 'Hỗ trợ học sinh'],
  ['khac', 'Khác'],
];

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
  } catch (_err) {
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

async function docTraLoi(res, _duongDan) {
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
  // Xoá ảnh nền tùy chỉnh (nếu đang dùng) khi chuyển sang theme thông thường
  document.documentElement.style.removeProperty('--nen-anh-tuy-chon');
  document.documentElement.removeAttribute('data-bg-custom');
  document.documentElement.setAttribute('data-bg-theme', t.id);
  document.documentElement.setAttribute('data-theme', t.dark ? 'dark' : 'light');
  try {
    localStorage.setItem('c10a7-bg-theme', t.id);
    localStorage.setItem('c10a7-giao-dien', t.dark ? 'dark' : 'light');
    localStorage.removeItem('c10a7-bg-custom-url');
  } catch {}
}

/** Đặt một ảnh (qua URL) làm hình nền toàn web — lưu vào localStorage để khôi phục khi tải lại.
    Truyền url = null/'' để xoá ảnh nền tùy chỉnh và quay về theme hiện tại. */
export function apDungNenAnhTuyChon(url) {
  if (!url) {
    // Xoá ảnh tùy chỉnh — khôi phục theme đã lưu
    document.documentElement.style.removeProperty('--nen-anh-tuy-chon');
    document.documentElement.removeAttribute('data-bg-custom');
    try {
      localStorage.removeItem('c10a7-bg-custom-url');
      const luuTheme = localStorage.getItem('c10a7-bg-theme');
      if (luuTheme) apDungThemeBg(luuTheme);
    } catch {}
    return;
  }
  // Giữ nguyên data-bg-theme (theme màu chữ) nhưng phủ background bằng ảnh
  document.documentElement.style.setProperty('--nen-anh-tuy-chon', `url(${JSON.stringify(url)})`);
  document.documentElement.setAttribute('data-bg-custom', '1');
  try {
    localStorage.setItem('c10a7-bg-custom-url', url);
  } catch {}
}

/** URL ảnh nền tùy chỉnh đang dùng trên MÁY NÀY (rỗng nếu không dùng) — để nơi khác (vd nút
    "🖼 Nền" trong Thư viện Ảnh) biết ảnh nào đang là nền hiện tại mà tô đậm/đổi thành nút xoá. */
export function layNenAnhTuyChonUrl() {
  try { return localStorage.getItem('c10a7-bg-custom-url') || ''; } catch { return ''; }
}

export function khoiTaoThemeBg() {
  // Ưu tiên: ảnh tùy chỉnh > theme thông thường
  const luuAnh = (() => { try { return localStorage.getItem('c10a7-bg-custom-url'); } catch { return null; } })();
  if (luuAnh) {
    const luuTheme = (() => { try { return localStorage.getItem('c10a7-bg-theme'); } catch { return null; } })();
    if (luuTheme) {
      const t = DANH_SACH_THEME.find((x) => x.id === luuTheme) || DANH_SACH_THEME[0];
      document.documentElement.setAttribute('data-bg-theme', t.id);
      document.documentElement.setAttribute('data-theme', t.dark ? 'dark' : 'light');
    }
    apDungNenAnhTuyChon(luuAnh);
    return;
  }
  const luu = (() => { try { return localStorage.getItem('c10a7-bg-theme'); } catch { return null; } })();
  if (luu) apDungThemeBg(luu);
}

/* ---------- Định danh tài khoản & icon độc quyền theo vai trò ---------- */

export function layThongTinVaiTro(vaiTro = '') {
  const vt = String(vaiTro || '').toLowerCase().trim();
  const laThemeSang = typeof document !== 'undefined' &&
    (document.documentElement.getAttribute('data-theme') === 'light' || document.documentElement.getAttribute('data-bg-theme') === 'light');

  if (vt.includes('thu quy') || vt.includes('thủ quỹ') || vt === 'quy') {
    return {
      bieuTuong: '🪙',
      tenGoi: 'Thủ quỹ',
      lopMau: 'vai-tro-thu-quy',
      mauNen: laThemeSang ? '#d1fae5' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.35))',
      mauVien: laThemeSang ? '#059669' : '#10b981',
      mauChu: laThemeSang ? '#065f46' : '#34d399',
    };
  }
  if (vt.includes('lop truong') || vt.includes('lớp trưởng')) {
    return {
      bieuTuong: '👑',
      tenGoi: 'Lớp trưởng',
      lopMau: 'vai-tro-lop-truong',
      mauNen: laThemeSang ? '#fef3c7' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.35))',
      mauVien: laThemeSang ? '#d97706' : '#f59e0b',
      mauChu: laThemeSang ? '#92400e' : '#fbbf24',
    };
  }
  if (vt.includes('bi thu') || vt.includes('bí thư')) {
    return {
      bieuTuong: '⚡',
      tenGoi: 'Bí thư',
      lopMau: 'vai-tro-bi-thu',
      mauNen: laThemeSang ? '#ffe4e6' : 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(251, 113, 133, 0.35))',
      mauVien: laThemeSang ? '#f43f5e' : '#f43f5e',
      mauChu: laThemeSang ? '#9f1239' : '#fb7185',
    };
  }
  if (vt.includes('to truong') || vt.includes('tổ trưởng')) {
    return {
      bieuTuong: '📋',
      tenGoi: 'Tổ trưởng',
      lopMau: 'vai-tro-to-truong',
      mauNen: laThemeSang ? '#e0f2fe' : 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(56, 189, 248, 0.35))',
      mauVien: laThemeSang ? '#0284c7' : '#0ea5e9',
      mauChu: laThemeSang ? '#075985' : '#38bdf8',
    };
  }
  if (vt.includes('admin') || vt.includes('quan tri') || vt.includes('quản trị') || vt.includes('quan ly') || vt.includes('quản lý')) {
    return {
      bieuTuong: '🛡️',
      // "Quản lý" chứ không phải "Quản trị viên" — trang đã có sẵn tiêu đề "Quản lý lớp" ngay
      // cạnh đó, dùng thêm một từ "quản trị" khác nghĩa dễ gây rối, tưởng như 2 vai trò khác nhau.
      tenGoi: 'Quản lý',
      lopMau: 'vai-tro-admin',
      mauNen: laThemeSang ? '#e0e7ff' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.35))',
      mauVien: laThemeSang ? '#6366f1' : '#6366f1',
      mauChu: laThemeSang ? '#3730a3' : '#818cf8',
    };
  }
  return {
    bieuTuong: '🎖️',
    tenGoi: vaiTro || 'Ban cán sự',
    lopMau: 'vai-tro-can-su',
    mauNen: laThemeSang ? '#ede9fe' : 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(192, 132, 252, 0.35))',
    mauVien: laThemeSang ? '#7c3aed' : '#a855f7',
    mauChu: laThemeSang ? '#5b21b6' : '#c084fc',
  };
}

// Chỉ ghi tên, tổ, chức vụ (nếu có) — KHÔNG ghi tên trường/trung tâm ở đây (đã hiện sẵn ở chỗ
// khác trên trang, nhắc lại là thừa và làm dòng này quá dài).
function toChucVu(phien) {
  const phu = [];
  if (phien.toSo) phu.push(`Tổ ${phien.toSo}`);
  if (phien.chucVu) phu.push(phien.chucVu);
  return phu;
}

export function layNhanTaiKhoan(phien = {}) {
  const role = phien.role || '';
  if (role === 'teacher') return '👩‍🏫 Giáo viên chủ nhiệm';
  if (role === 'student') {
    const ten = (phien.ten || '').trim();
    const phu = toChucVu(phien);
    const nhan = [ten || 'Học sinh thường', ...phu].join(' · ');
    return `🎓 ${nhan}`;
  }

  let vt = (phien.vaiTro || '').trim();
  const info = layThongTinVaiTro(vt);
  vt = info.tenGoi;

  const t = (phien.ten || '').trim();
  const toSoNhan = phien.toSo ? ` · Tổ ${phien.toSo}` : '';
  if (vt) {
    if (!t || t.toLowerCase() === vt.toLowerCase() || t.toLowerCase() === 'admin') {
      return `${info.bieuTuong} ${vt}${toSoNhan}`;
    }
    // Tên TRƯỚC, chức danh SAU (giống hệt thứ tự đã dùng ở nhánh học sinh phía trên) — chỉ đúng
    // MỘT họ tên và MỘT chức danh, không lồng ngoặc đơn nữa.
    return `${info.bieuTuong} ${t} · ${vt}${toSoNhan}`;
  }
  if (t) return `${t}${toSoNhan}`;
  return 'Tài khoản đặc biệt';
}

/** Giống layNhanTaiKhoan() nhưng trả về MẢNG các dòng riêng thay vì nối chung bằng "·" — dùng
    cho những chỗ chật hẹp cần xuống dòng RÕ RÀNG (vd huy hiệu đầu trang khu quản lý) thay vì
    nhồi tên + chức danh vào một dòng dài, dễ vỡ chữ giữa dòng trên điện thoại. */
export function layCacDongTaiKhoan(phien = {}) {
  const role = phien.role || '';
  if (role === 'teacher') return ['👩‍🏫 Giáo viên chủ nhiệm'];
  if (role === 'student') {
    const ten = (phien.ten || '').trim();
    const phu = toChucVu(phien);
    return [`🎓 ${ten || 'Học sinh thường'}`, ...phu];
  }

  let vt = (phien.vaiTro || '').trim();
  const info = layThongTinVaiTro(vt);
  vt = info.tenGoi;

  const t = (phien.ten || '').trim();
  const toSoNhan = phien.toSo ? `Tổ ${phien.toSo}` : '';
  if (vt) {
    if (!t || t.toLowerCase() === vt.toLowerCase() || t.toLowerCase() === 'admin') {
      return [`${info.bieuTuong} ${vt}`, toSoNhan].filter(Boolean);
    }
    return [`${info.bieuTuong} ${t}`, [vt, toSoNhan].filter(Boolean).join(' · ')];
  }
  if (t) return [t, toSoNhan].filter(Boolean);
  return ['Tài khoản đặc biệt'];
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

  const dangDungAnh = document.documentElement.hasAttribute('data-bg-custom');
  const hienTai = document.documentElement.getAttribute('data-bg-theme') || 'cosmic';
  const luoi = e('div', 'luoi-theme-bg');

  // Thẻ "Đang dùng ảnh tùy chỉnh" — hiện ở đầu nếu đang dùng
  if (dangDungAnh) {
    const theAnh = e('div', 'the-theme-bg active');
    theAnh.style.cssText = 'border-color:var(--chinh);background:var(--nen-chim)';
    const xemTruoc = e('div', 'the-theme-mau');
    xemTruoc.style.cssText = 'height:40px;border-radius:6px;overflow:hidden;background:var(--nen-anh-tuy-chon,#333) center/cover;margin-bottom:6px';
    theAnh.append(
      xemTruoc,
      e('div', 'the-theme-ten', '📸 Ảnh tùy chỉnh'),
      e('div', 'the-theme-mo-ta', 'Đang dùng ảnh từ thư viện làm nền web.')
    );
    theAnh.addEventListener('click', () => {
      apDungNenAnhTuyChon(null);
      hop.close();
      nhac('Đã xoá ảnh nền, dùng lại theme màu', 'tot');
    });
    luoi.append(theAnh);
  }

  DANH_SACH_THEME.forEach((t) => {
    const the = e('div', 'the-theme-bg' + (!dangDungAnh && hienTai === t.id ? ' active' : ''));
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
    Object.assign(e('p', null, dangDungAnh
      ? 'Đang dùng ảnh tùy chỉnh. Bấm vào ảnh để xoá, hoặc chọn một theme màu bên dưới.'
      : 'Chọn phong cách hiển thị và màu nền bạn yêu thích:'), { style: 'margin-top:4px;font-size:13px;color:var(--chu-nhat)' })
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

  // Tự động gắn sự kiện nút mở menu đầy đủ nếu có trên trang
  ganMenu();
}

/* ---------- Menu đầy đủ: dùng chung cho mọi trang có thanh đầu ---------- */
export function ganMenu(nut = document.getElementById('moMenu'), bang = document.getElementById('menuDayDu')) {
  if (!nut || !bang) return;
  if (nut.dataset.boundMenu) return;
  nut.dataset.boundMenu = '1';
  let scrollYLuu = 0;

  // Chiều cao thanh đầu KHÔNG còn cố định (dòng phụ đề tài khoản dài giờ xuống dòng thay vì cắt
  // "…", xem style.css) — phải đo thật chiều cao hiện tại mỗi lần mở, không dùng sẵn --cao-thanh
  // nữa, không thì bảng menu đè lên phần thanh đầu đã cao thêm. ".menu-day" nằm LỒNG BÊN TRONG
  // ".thanh-tren" (position:sticky) nên "top" tính theo chính chiều cao thanh đầu (offsetHeight),
  // không phải toạ độ theo khung nhìn (getBoundingClientRect) — thanh-tren là khung chứa của nó.
  function dinhViTriMenu() {
    const thanh = nut.closest('.thanh-tren');
    const caoThanh = thanh ? thanh.offsetHeight : 60;
    bang.style.top = caoThanh + 'px';
    bang.style.maxHeight = `calc(100dvh - ${caoThanh}px)`;
  }

  const dat = (mo) => {
    bang.hidden = !mo;
    nut.setAttribute('aria-expanded', String(mo));
    if (mo) dinhViTriMenu();
    // Khoá cuộn trang NỀN khi menu đang mở — không thì trên điện thoại, kéo bên trong menu có
    // thể "chuyền" (scroll chaining) sang cuộn cả trang phía dưới, khiến trang nền vẫn di
    // chuyển/chạm được dù đang che bởi menu. Dùng position:fixed (không chỉ overflow:hidden) vì
    // đây là cách duy nhất chặn được cuộn nền chắc chắn trên iOS Safari.
    if (mo) {
      scrollYLuu = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYLuu}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollYLuu);
    }
  };
  nut.addEventListener('click', (ev) => { ev.stopPropagation(); dat(bang.hidden); });
  bang.addEventListener('click', (ev) => { if (ev.target.closest('a')) dat(false); });
  document.addEventListener('click', (ev) => {
    if (!bang.hidden && !bang.contains(ev.target) && !nut.contains(ev.target)) dat(false);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !bang.hidden) { dat(false); nut.focus(); }
  });
  addEventListener('resize', () => { if (!bang.hidden) dinhViTriMenu(); });
}

/* ---------- Nhạc nền: dùng chung cho MỌI trang có thanh đầu (trang lớp, khu quản lý, trang
   cá nhân...) — cùng một nút loa, cùng hành vi, để chuyển qua lại giữa các trang không thấy
   khác nhau. Trang nào gọi ganNhacNen(nhacNen) với nhacNen lấy được (từ /api/lop hoặc
   /api/nhac-nen-info) thì có ngay nút loa + hộp chỉnh âm lượng, không cần viết lại. ---------- */
export function ganNhacNen(nhacNen) {
  const nut = $('#nutNhac');
  if (!nut) return;   // trang không có thanh đầu kiểu này (vd: login.html) — bỏ qua
  if (!nhacNen) { nut.hidden = true; return; }
  nut.hidden = false;
  nut.title = 'Nhạc nền: ' + (nhacNen.tenBai || 'Đang phát');

  const audio = $('#nhacNenAudio');
  audio.src = '/api/nhac-nen';

  if (nut.dataset.daGan) return;   // chỉ gắn sự kiện 1 lần dù dữ liệu tải lại nhiều lần
  nut.dataset.daGan = '1';

  // Hộp chỉnh âm lượng hiện khi rê chuột vào nút loa (hoặc chạm/focus trên di động) —
  // CSS điều khiển hiện/ẩn qua ":hover"/":focus-within", xem .nhac-am-luong trong style.css.
  let amLuongBanDau = 70;
  try { amLuongBanDau = Number(localStorage.getItem('nhacNenAmLuong')) || 70; } catch { /* bỏ qua */ }
  audio.volume = amLuongBanDau / 100;

  const oAmLuong = e('input', 'nhac-am-luong-truot');
  oAmLuong.type = 'range';
  oAmLuong.min = '0';
  oAmLuong.max = '100';
  oAmLuong.value = String(amLuongBanDau);
  oAmLuong.setAttribute('aria-label', 'Âm lượng nhạc nền');
  oAmLuong.addEventListener('input', () => {
    audio.volume = Number(oAmLuong.value) / 100;
    try { localStorage.setItem('nhacNenAmLuong', oAmLuong.value); } catch { /* bỏ qua */ }
  });
  const hopAmLuong = e('div', 'nhac-am-luong');
  hopAmLuong.append(oAmLuong);
  nut.insertAdjacentElement('afterend', hopAmLuong);

  // Căn hộp âm lượng đúng dưới nút loa — tính bằng offsetLeft thay vì trông cậy nút loa
  // là con đầu tiên của .thanh-phai (nút "Trang chủ" nay đứng trước nó), và tính lại khi
  // đổi cỡ màn hình vì cỡ nút icon trên thanh đầu có đổi theo khổ máy.
  const dinhViAmLuong = () => { hopAmLuong.style.left = nut.offsetLeft + 'px'; };
  dinhViAmLuong();
  addEventListener('resize', dinhViAmLuong);

  const dat = (dangPhat) => {
    nut.setAttribute('aria-pressed', String(dangPhat));
    nut.setAttribute('aria-label', dangPhat ? 'Tắt nhạc nền' : 'Bật nhạc nền');
    try { localStorage.setItem('nhacNenBat', dangPhat ? '1' : '0'); } catch { /* riêng tư trình duyệt chặn cũng không sao */ }
  };

  nut.addEventListener('click', async () => {
    if (audio.paused) {
      try { await audio.play(); dat(true); } catch { nhac('Trình duyệt chặn phát nhạc tự động, thử bấm lại.', 'xau'); }
    } else {
      audio.pause();
      dat(false);
    }
  });

  // Từng bật ở lần trước thì thử phát lại luôn — nếu trình duyệt vẫn chặn (chưa có thao tác nào
  // trong phiên này) thì coi như tắt, người dùng tự bấm lại.
  let tungBat = false;
  try { tungBat = localStorage.getItem('nhacNenBat') === '1'; } catch { /* bỏ qua */ }
  if (tungBat) audio.play().then(() => dat(true)).catch(() => dat(false));
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

/* ---------- Tooltip nổi (.tien-do-tooltip) ---------- */

/** Gắn tooltip nổi cho một phần tử kích hoạt (chứa sẵn 1 con ".tien-do-tooltip").
    Định vị bằng "fixed" + toạ độ đo thực tế lúc rê chuột/focus — nhờ vậy tooltip
    luôn nổi TRÊN CÙNG, thoát khỏi mọi overflow:hidden của thẻ cha (khác với
    position:absolute vốn bị cắt bởi thẻ cha có overflow:hidden dùng để bo góc).
    Tự lật xuống dưới nếu phía trên không đủ chỗ (thẻ nằm sát mép trên màn hình).
    Mũi tên (::before/::after) cũng được tính lại theo đúng tâm của phần tử kích hoạt
    (biến CSS --mui-ten-x) — không còn cố định ở giữa hộp tooltip, để luôn chỉ sát vào
    đúng chỗ vừa rê/chạm dù hộp tooltip lệch hẳn về một phía. */
export function ganTooltipNoi(kichHoat, canPhai = false) {
  const tip = kichHoat.querySelector('.tien-do-tooltip');
  if (!tip) return;
  const dat = () => {
    const r = kichHoat.getBoundingClientRect();
    const caoTip = tip.offsetHeight || 34;
    const oDuoi = r.top - caoTip - 8 < 4;
    tip.classList.toggle('o-duoi', oDuoi);
    tip.style.top = (oDuoi ? r.bottom + 8 : r.top - caoTip - 8) + 'px';
    if (canPhai) {
      const rongTip = tip.offsetWidth || 160;
      // Kẹp để mép trái tooltip không tràn ra ngoài màn hình bên trái — badge neo phải có thể
      // nằm khá lệch trái trên thẻ hẹp, trong khi tooltip lại dài hơn hẳn badge.
      const phai = Math.min(Math.max(4, window.innerWidth - r.right), window.innerWidth - rongTip - 4);
      tip.style.right = phai + 'px';
      tip.style.left = 'auto';
    } else {
      const rongTip = tip.offsetWidth || 160;
      const trai = Math.max(4, Math.min(r.left + r.width / 2 - rongTip / 2, window.innerWidth - rongTip - 4));
      tip.style.left = trai + 'px';
      tip.style.right = 'auto';
    }
    const hopTip = tip.getBoundingClientRect();
    const giuaKichHoat = r.left + r.width / 2 - hopTip.left;
    tip.style.setProperty('--mui-ten-x', Math.max(12, Math.min(giuaKichHoat, hopTip.width - 12)) + 'px');
  };
  kichHoat.addEventListener('mouseenter', dat);
  kichHoat.addEventListener('focus', dat);
}

/* ---------- Giữ vị trí cuộn khi vẽ lại (mở rộng/thu gọn, chuyển tab con...) ---------- */

/** Nhiều màn hình vẽ lại TOÀN BỘ nội dung (thay hẳn cây DOM) mỗi khi đổi trạng thái — mở
    rộng/thu gọn 1 thẻ, chuyển tab con... Nếu nội dung sau khi vẽ lại NGẮN hơn trước (thu gọn 1
    khối dài, hoặc tab mới ít nội dung hơn), trình duyệt tự kéo thanh cuộn về vừa với chiều cao
    mới — cảm giác như màn hình "nhảy" về vị trí khác hẳn chỗ đang xem, dù không có dòng lệnh nào
    chủ động cuộn cả.

    Hàm này ghim một phần tử mốc (tìm theo id, phải còn tồn tại y nguyên id sau khi vẽ lại) đứng
    yên tại đúng vị trí trên màn hình trước và sau khi `capNhat` chạy xong — bất kể nội dung xung
    quanh co giãn thế nào. Dùng cho mọi thao tác "vẫn đang xem chỗ này, chỉ đổi trạng thái tại
    chỗ" (bấm mở rộng/thu gọn ngay tại thẻ đó, chuyển tab con mà thanh tab vẫn ở nguyên chỗ). */
export async function giuViTriCuonKhiVe(idMoc, capNhat) {
  const truoc = idMoc ? document.getElementById(idMoc) : null;
  const yTruoc = truoc ? truoc.getBoundingClientRect().top : null;
  await capNhat();
  if (yTruoc === null) return;
  const sau = document.getElementById(idMoc);
  if (!sau) return;
  const ySau = sau.getBoundingClientRect().top;
  if (ySau !== yTruoc) {
    window.scrollTo({ top: window.scrollY + (ySau - yTruoc), behavior: 'instant' });
  }
}
