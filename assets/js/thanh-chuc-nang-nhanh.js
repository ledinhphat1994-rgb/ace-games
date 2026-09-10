/**
 * THANH CHỨC NĂNG NHANH ĐÁY MÀN HÌNH (BOTTOM QUICK BAR)
 * Dành cho học sinh trên trang lớp 10A7 (index.html)
 * Hiển thị cố định ở đáy màn hình điện thoại (iOS / Android), chạm 1 lần chuyển ngay tới mục.
 * Nút [⚙ Tuỳ chỉnh] cho phép học sinh tự chọn mục yêu thích hiển thị (tối đa 5 mục).
 * Cài đặt lưu tự động vào localStorage.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'lop10a7_thanh_nhanh_v1';
  const BAR_ID = 'thanhChucNangNhanh';

  // Danh sách các chức năng có thể ghim
  const TAT_CA_CHUC_NANG = [
    { id: 'thong-bao',      icon: '🔔', nhan: 'Thông báo',  href: '#thong-bao' },
    { id: 'thoi-khoa-bieu', icon: '📅', nhan: 'TKB',        href: '#thoi-khoa-bieu' },
    { id: 'diem-danh',      icon: '✅', nhan: 'Điểm danh',  href: '#/diem-danh' },
    { id: 'hinh-anh',       icon: '📸', nhan: 'Hoạt động',  href: '#hinh-anh' },
    { id: 'thu-quy',        icon: '💰', nhan: 'Thủ quỹ',    href: '#/thu-quy' },
    { id: 'danh-sach',      icon: '👥', nhan: 'Học sinh',   href: '#/danh-sach' },
  ];

  // 4 mục mặc định tiện nhất cho học sinh
  const MAC_DINH = ['thong-bao', 'thoi-khoa-bieu', 'diem-danh', 'hinh-anh'];

  function docCaiDat() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const arr = JSON.parse(s);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch {}
    return [...MAC_DINH];
  }

  function luuCaiDat(ids) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch {}
  }

  let _caiDat = docCaiDat();

  function taoNutTab(cf) {
    const a = document.createElement('a');
    a.className = 'thanh-nhanh-nut';
    a.id = `thanhNut_${cf.id}`;
    a.href = cf.href;
    a.setAttribute('aria-label', cf.nhan);
    a.innerHTML = `
      <span class="thanh-nhanh-icon">${cf.icon}</span>
      <span class="thanh-nhanh-chu">${cf.nhan}</span>
    `;

    a.addEventListener('click', (e) => {
      const targetHash = cf.href;
      const curHash = location.hash || '#';

      if (curHash === targetHash) {
        // Đang ở cùng hash rồi: cuộn tới đầu mục
        e.preventDefault();
        if (targetHash.startsWith('#/')) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const el = document.querySelector(targetHash);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // Đổi hash -> kích hoạt dinhTuyen() của trang-lop.js
        location.hash = targetHash;
      }
    });

    return a;
  }

  function capNhatThanhNhanh() {
    const bar = document.getElementById(BAR_ID);
    if (!bar) return;

    bar.innerHTML = '';
    const cf_list = _caiDat
      .map((id) => TAT_CA_CHUC_NANG.find((c) => c.id === id))
      .filter(Boolean);

    cf_list.forEach((cf) => {
      bar.appendChild(taoNutTab(cf));
    });

    // Nút tuỳ chỉnh [⚙ +]
    const btnTuy = document.createElement('button');
    btnTuy.className = 'thanh-nhanh-nut thanh-nhanh-tuy';
    btnTuy.id = 'thanhNhanhTuyChinhBtn';
    btnTuy.type = 'button';
    btnTuy.setAttribute('aria-label', 'Tuỳ chỉnh thanh chức năng nhanh');
    btnTuy.title = 'Tuỳ chỉnh các nút trên thanh';
    btnTuy.innerHTML = `
      <span class="thanh-nhanh-icon">⚙️</span>
      <span class="thanh-nhanh-chu">Tuỳ chỉnh</span>
    `;
    btnTuy.addEventListener('click', moHopTuyChinhThanh);
    bar.appendChild(btnTuy);

    capNhatActive();
  }

  function capNhatActive() {
    const hash = location.hash || '';
    const bar = document.getElementById(BAR_ID);
    if (!bar) return;

    bar.querySelectorAll('.thanh-nhanh-nut').forEach((a) => {
      if (a.id === 'thanhNhanhTuyChinhBtn') return;
      const href = a.getAttribute('href') || '';
      let isActive = false;
      if (href.startsWith('#/')) {
        isActive = (hash === href);
      } else if (href.startsWith('#') && href.length > 1) {
        isActive = (hash === href);
      }
      a.classList.toggle('dang-active', isActive);
    });
  }

  function moHopTuyChinhThanh() {
    const old = document.getElementById('hopTuyChinhThanh');
    if (old) old.remove();

    const hop = document.createElement('div');
    hop.id = 'hopTuyChinhThanh';
    hop.className = 'hop-tuy-chinh-thanh';
    hop.setAttribute('role', 'dialog');
    hop.setAttribute('aria-label', 'Tuỳ chỉnh thanh chức năng nhanh');

    const overlay = document.createElement('div');
    overlay.className = 'hop-tuy-chinh-overlay';
    overlay.addEventListener('click', () => hop.remove());

    const noi = document.createElement('div');
    noi.className = 'hop-tuy-chinh-noi';
    noi.innerHTML = `
      <div class="hop-tuy-chinh-tieu-de">
        <span>⚙️ Tuỳ chỉnh thanh chức năng nhanh</span>
        <button class="hop-tuy-chinh-dong" type="button" aria-label="Đóng">✕</button>
      </div>
      <p style="font-size:12px;color:#64748b;margin:0 0 10px;">Chọn từ 1 đến 5 chức năng bạn muốn hiển thị ở thanh đáy:</p>
      <div class="hop-tuy-chinh-ds" id="hopTuyChinhDs"></div>
      <button class="hop-tuy-chinh-luu" type="button" id="hopTuyChinhLuu">💾 Lưu thay đổi</button>
    `;

    hop.appendChild(overlay);
    hop.appendChild(noi);
    document.body.appendChild(hop);

    noi.querySelector('.hop-tuy-chinh-dong').addEventListener('click', () => hop.remove());

    const ds = noi.querySelector('#hopTuyChinhDs');
    TAT_CA_CHUC_NANG.forEach((cf) => {
      const row = document.createElement('label');
      row.className = 'hop-tuy-chinh-row';
      const checked = _caiDat.includes(cf.id) ? 'checked' : '';
      row.innerHTML = `
        <input type="checkbox" value="${cf.id}" ${checked} class="hop-tuy-chinh-check">
        <span class="hop-tuy-chinh-icon">${cf.icon}</span>
        <span class="hop-tuy-chinh-ten">${cf.nhan}</span>
      `;
      ds.appendChild(row);
    });

    noi.querySelector('#hopTuyChinhLuu').addEventListener('click', () => {
      const checks = noi.querySelectorAll('.hop-tuy-chinh-check:checked');
      const ids = Array.from(checks).map((c) => c.value);
      if (ids.length === 0) {
        alert('Vui lòng chọn ít nhất 1 chức năng.');
        return;
      }
      if (ids.length > 5) {
        alert('Chỉ được chọn tối đa 5 chức năng để thanh hiển thị vừa vặn.');
        return;
      }
      _caiDat = ids;
      luuCaiDat(ids);
      capNhatThanhNhanh();
      hop.remove();
    });

    requestAnimationFrame(() => hop.classList.add('hop-hien'));
  }

  function khoiTao() {
    // Chỉ hiển thị cho học sinh trên trang lớp, không hiện ở /giao-vien/
    if (location.pathname.startsWith('/giao-vien')) return;

    let bar = document.getElementById(BAR_ID);
    if (!bar) {
      bar = document.createElement('nav');
      bar.id = BAR_ID;
      bar.className = 'thanh-chuc-nang-nhanh';
      bar.setAttribute('aria-label', 'Thanh chức năng nhanh');
      document.body.appendChild(bar);
    }

    capNhatThanhNhanh();

    window.addEventListener('hashchange', capNhatActive);
    window.addEventListener('popstate', capNhatActive);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiTao);
  } else {
    khoiTao();
  }
})();
