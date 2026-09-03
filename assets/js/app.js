/* Trang lớp 10A7 – tải nội dung từ các tệp JSON trong thư mục /data.
   Giáo viên chỉ cần sửa tệp JSON là trang tự cập nhật, không phải đụng tới HTML. */

const $ = (sel) => document.querySelector(sel);

/* ---------- Tiện ích ---------- */

// Chèn văn bản an toàn: mọi nội dung từ JSON đều coi là văn bản thuần,
// tránh trường hợp dán nhầm thẻ HTML làm hỏng trang.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

async function loadJSON(path, fallback) {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (err) {
    console.warn('Không tải được', path, err);
    return fallback;
  }
}

function formatDate(gia_tri) {
  if (!gia_tri) return '';
  const s = String(gia_tri).trim();

  // Đã là kiểu Việt Nam "11/07/2011" thì giữ nguyên.
  // (Nếu đưa vào new Date() thì JavaScript hiểu theo kiểu Mỹ và ra sai tháng.)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [ng, th, nam] = s.split('/');
    return `${ng.padStart(2, '0')}/${th.padStart(2, '0')}/${nam}`;
  }

  // Kiểu "2026-09-15" -> "15/09/2026"
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;

  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ---------- Giao diện sáng / tối ---------- */
(function theme() {
  const saved = (() => { try { return localStorage.getItem('c10a7-theme'); } catch { return null; } })();
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  $('#themeToggle').addEventListener('click', () => {
    const now = document.documentElement.getAttribute('data-theme');
    const isDark = now
      ? now === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('c10a7-theme', next); } catch { /* bỏ qua */ }
  });
})();

/* ---------- Menu trên điện thoại ---------- */
(function menu() {
  const btn = $('#menuToggle');
  const nav = $('#nav');
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  const sync = () => { nav.hidden = isMobile(); btn.setAttribute('aria-expanded', String(!nav.hidden)); };
  sync();
  window.addEventListener('resize', sync);

  btn.addEventListener('click', () => {
    nav.hidden = !nav.hidden;
    btn.setAttribute('aria-expanded', String(!nav.hidden));
  });
  nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && isMobile()) { nav.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  });
})();

/* ---------- Đánh dấu mục đang xem ---------- */
(function activeNav() {
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window) || !sections.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-70px 0px -70% 0px' });

  sections.forEach((s) => obs.observe(s));
})();

/* ---------- Thông tin chung ---------- */
async function renderConfig() {
  const cfg = await loadJSON('/data/config.json', {});
  if (cfg.tenLop) {
    $('#heroTitle').textContent = cfg.tenLop;
    $('#footLeft').textContent = `${cfg.tenLop} · Năm học ${cfg.namHoc || '2026 – 2027'}`;
  }
  if (cfg.gioiThieu) $('#heroSub').textContent = cfg.gioiThieu;

  const stats = $('#stats');
  stats.replaceChildren();
  (cfg.thongKe || []).forEach((s) => {
    const box = el('div', 'stat');
    box.append(el('b', null, s.giaTri), el('span', null, s.nhan));
    stats.append(box);
  });
  return cfg;
}

/* ---------- Thông báo ---------- */
async function renderNews() {
  const items = await loadJSON('/data/thong-bao.json', []);
  const box = $('#newsList');
  box.replaceChildren();

  if (!items.length) { box.append(el('p', 'empty', 'Chưa có thông báo nào.')); return; }

  items
    .slice()
    .sort((a, b) => (b.ghim === true) - (a.ghim === true) || String(b.ngay).localeCompare(String(a.ngay)))
    .forEach((n) => {
      const item = el('article', 'news-item' + (n.ghim ? ' pin' : ''));
      const meta = el('div', 'meta');
      if (n.ghim) meta.append(el('span', 'tag warn', 'Quan trọng'), document.createTextNode(' '));
      if (n.loai) meta.append(el('span', 'tag', n.loai), document.createTextNode(' '));
      meta.append(document.createTextNode(formatDate(n.ngay)));
      item.append(meta, el('h3', null, n.tieuDe), el('p', null, n.noiDung));
      box.append(item);
    });
}

/* ---------- Danh sách lớp ---------- */
async function renderStudents() {
  const list = await loadJSON('/data/hoc-sinh.json', []);
  const body = $('#studentBody');

  const nam = list.filter((s) => s.gioiTinh === 'Nam').length;
  const nu = list.length - nam;
  $('#studentCount').textContent = `Tổng số ${list.length} học sinh · ${nam} nam · ${nu} nữ`;

  let ngheDangChon = '';
  let tuKhoa = '';

  // Nút lọc theo lớp nghề, dựng từ chính dữ liệu nên không phải sửa tay khi đổi.
  const cacNghe = [...new Set(list.map((s) => s.lopNghe).filter(Boolean))].sort();
  const boLoc = $('#ngheFilter');
  boLoc.replaceChildren();

  function veNutLoc() {
    boLoc.replaceChildren();
    [['', `Tất cả (${list.length})`], ...cacNghe.map((n) => [n, `${n} (${list.filter((s) => s.lopNghe === n).length})`])]
      .forEach(([giaTri, nhan]) => {
        const b = el('button', 'chip' + (ngheDangChon === giaTri ? ' active' : ''), nhan);
        b.type = 'button';
        b.addEventListener('click', () => { ngheDangChon = giaTri; veNutLoc(); draw(); });
        boLoc.append(b);
      });
  }

  function draw() {
    const q = tuKhoa.trim().toLowerCase();
    const rows = list.filter((s) => {
      if (ngheDangChon && s.lopNghe !== ngheDangChon) return false;
      if (!q) return true;
      return ['hoTen', 'lopNghe', 'toHop', 'chucVu']
        .some((k) => String(s[k] || '').toLowerCase().includes(q));
    });

    body.replaceChildren();
    if (!rows.length) {
      const tr = el('tr');
      tr.append(Object.assign(el('td', 'empty', 'Không tìm thấy học sinh phù hợp.'), { colSpan: 7 }));
      body.append(tr);
      return;
    }

    rows.forEach((s, i) => {
      const tr = el('tr');
      tr.append(
        el('td', 'num', s.stt ?? i + 1),
        el('td', null, s.hoTen || ''),
        el('td', null, s.gioiTinh || ''),
        el('td', null, formatDate(s.ngaySinh) || s.ngaySinh || '')
      );

      const tdNghe = el('td');
      if (s.lopNghe) tdNghe.append(el('span', 'tag', s.lopNghe));
      tr.append(tdNghe, el('td', null, s.toHop || ''));

      const td = el('td');
      if (s.chucVu) td.append(el('span', 'tag ok', s.chucVu));
      if (s.ghiChu) td.append(document.createTextNode((s.chucVu ? ' ' : '') + s.ghiChu));
      tr.append(td);
      body.append(tr);
    });
  }

  veNutLoc();
  draw();
  $('#studentSearch').addEventListener('input', (e) => { tuKhoa = e.target.value; draw(); });
}

/* ---------- Thời khoá biểu ---------- */
async function renderTimetable() {
  const tkb = await loadJSON('/data/thoi-khoa-bieu.json', {});
  const head = $('#tkbHead');
  const body = $('#tkbBody');
  $('#tkbNote').textContent = tkb.ghiChu || '';

  const days = tkb.thu || [];
  const periods = tkb.tiet || [];

  head.replaceChildren();
  const trh = el('tr');
  trh.append(el('th', null, 'Tiết'));
  days.forEach((d) => trh.append(el('th', null, d)));
  head.append(trh);

  body.replaceChildren();
  if (!periods.length) {
    const tr = el('tr');
    tr.append(Object.assign(el('td', 'empty', 'Chưa cập nhật thời khoá biểu.'), { colSpan: days.length + 1 }));
    body.append(tr);
    return;
  }

  periods.forEach((row) => {
    const tr = el('tr');
    tr.append(el('td', null, row.ten));
    days.forEach((d) => tr.append(el('td', null, (row.mon && row.mon[d]) || '—')));
    body.append(tr);
  });
}

/* ---------- Kế hoạch ---------- */
async function renderPlan() {
  const items = await loadJSON('/data/ke-hoach.json', []);
  const box = $('#planList');
  box.replaceChildren();

  if (!items.length) { box.append(el('div', 'card empty', 'Chưa có kế hoạch nào.')); return; }

  items
    .slice()
    .sort((a, b) => String(a.ngay).localeCompare(String(b.ngay)))
    .forEach((k) => {
      const card = el('div', 'card');
      const head = el('div');
      head.append(el('span', 'tag ' + (k.mucDo || ''), formatDate(k.ngay)));
      card.append(head, el('h3', null, k.tieuDe), el('p', null, k.moTa || ''));
      box.append(card);
    });
}

/* ---------- Hình ảnh ---------- */
async function renderGallery() {
  const items = await loadJSON('/data/hinh-anh.json', []);
  const box = $('#gallery');
  box.replaceChildren();

  if (!items.length) {
    box.append(el('p', 'empty', 'Chưa có hình ảnh. Giáo viên thêm ảnh vào thư mục /assets/img và khai báo trong /data/hinh-anh.json.'));
    return;
  }

  items.forEach((a) => {
    const fig = el('figure');
    const img = el('img');
    img.src = a.anh;
    img.alt = a.chuThich || 'Ảnh hoạt động lớp 10A7';
    img.loading = 'lazy';
    fig.append(img);
    if (a.chuThich) fig.append(el('figcaption', null, a.chuThich));
    box.append(fig);
  });
}

/* ---------- Liên hệ ---------- */
function renderContacts(cfg) {
  const box = $('#contactList');
  box.replaceChildren();
  const items = (cfg && cfg.lienHe) || [];

  if (!items.length) { box.append(el('div', 'card empty', 'Chưa cập nhật thông tin liên hệ.')); return; }

  items.forEach((c) => {
    const card = el('div', 'card');
    card.append(el('h3', null, c.vaiTro || 'Liên hệ'), el('p', null, c.hoTen || ''));
    if (c.dienThoai) {
      const p = el('p');
      const a = el('a', null, c.dienThoai);
      a.href = 'tel:' + String(c.dienThoai).replace(/[^\d+]/g, '');
      p.append(document.createTextNode('Điện thoại: '), a);
      card.append(p);
    }
    if (c.ghiChu) card.append(el('p', 'empty', c.ghiChu));
    box.append(card);
  });
}

/* ---------- Khởi động ---------- */
(async function init() {
  const cfg = await renderConfig();
  renderContacts(cfg);
  await Promise.all([renderNews(), renderStudents(), renderTimetable(), renderPlan(), renderGallery()]);
})();
