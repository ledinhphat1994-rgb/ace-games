import { $, e, datNoiDung, api, ngayVN, ganDoiGiaoDien, layNhanTaiKhoan, ganNhacNen } from './chung.js';
import { oThongKe, tieuDeTrang, nut } from './giao-dien.js';

ganDoiGiaoDien($('#doiGiaoDien'));

api('/api/whoami').then(async (w) => {
  const hieuPhu = document.querySelector('.hieu-phu');
  if (hieuPhu) hieuPhu.textContent = layNhanTaiKhoan(w);
  if (w && (w.role === 'teacher' || w.role === 'phu')) {
    const ql = document.getElementById('mucQuanLy');
    if (ql) ql.hidden = false;
  }
  if (w && (w.hocSinhId || w.ma)) {
    try {
      const d = await api('/api/ca-nhan');
      $('#khungNhapMa').hidden = true;
      veKetQua(d);
    } catch { /* nếu lỗi thì để học sinh tự nhập mã */ }
  }
}).catch(() => {});

// Nút loa nhạc nền — cùng hành vi với trang lớp, để chuyển qua lại giữa các trang không
// thấy thanh đầu trang khác nhau.
api('/api/nhac-nen-info').then((d) => ganNhacNen(d.nhac)).catch(() => {});

const TEN_TRANG_THAI = {
  co_mat: ['Có mặt', 'nhan-tot'],
  tre: ['Đi trễ', 'nhan-luuy'],
  vang_phep: ['Vắng có phép', 'nhan'],
  vang_khong_phep: ['Vắng không phép', 'nhan-xau'],
};

const LOP_XEP_LOAI = { 'Tốt': 'nhan-tot', 'Khá': 'nhan', 'Đạt': 'nhan-luuy', 'Chưa đạt': 'nhan-xau' };

const oMa = $('#oMa');
const nutXem = $('#nutXem');
const loiNhan = $('#loiNhan');

function baoLoi(chu) {
  loiNhan.textContent = chu;
  loiNhan.hidden = false;
}

async function xem() {
  const ma = oMa.value.trim();
  if (!ma) return baoLoi('Em chưa nhập mã cá nhân.');

  loiNhan.hidden = true;
  nutXem.disabled = true;
  nutXem.textContent = 'Đang tra cứu…';

  try {
    const d = await api('/api/ca-nhan', { method: 'POST', than: { ma } });
    $('#khungNhapMa').hidden = true;
    // Nhớ mã trên thiết bị này để trang lớp cũng tự ẩn đúng mục theo quyền xem của em —
    // không phải phiên đăng nhập thật, chỉ là ghi nhớ tiện dùng lại (localStorage riêng máy này).
    try { localStorage.setItem('maCaNhan', ma); } catch { /* trình duyệt chặn thì bỏ qua */ }
    veKetQua(d);
  } catch (err) {
    baoLoi(err.message);
  }

  nutXem.disabled = false;
  nutXem.textContent = 'Xem kết quả';
}

nutXem.addEventListener('click', xem);
oMa.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') xem(); });

// Tự điền mã nếu vào từ liên kết chia sẻ (ví dụ ?ma=... hoặc #...)
try {
  const maTuUrl = new URLSearchParams(location.search).get('ma')
    || (location.hash ? decodeURIComponent(location.hash.replace(/^#/, '')) : '');
  if (maTuUrl) {
    oMa.value = maTuUrl;
    xem();
  }
} catch {
  // Bỏ qua nếu mã trong URL bị sai mã hoá
}

function veKetQua(d) {
  const h = d.hocSinh;
  const hieuPhu = document.querySelector('.hieu-phu');
  if (hieuPhu) hieuPhu.textContent = `Học sinh: ${h.hoTen}`;
  const khung = $('#khungKetQua');
  khung.hidden = false;

  const noi = e('div');
  noi.append(tieuDeTrang(h.hoTen,
    [h.lopNghe, h.chucVu, 'Sinh ngày ' + ngayVN(h.ngaySinh)].filter(Boolean).join(' · ')));

  const anMuc = d.anMuc || [];
  const ghiChuAn = (chu) => Object.assign(
    e('p', 'trong', '🔒 ' + chu + ' — giáo viên chủ nhiệm đã ẩn mục này với tài khoản của em.'),
    { style: 'margin-top:14px' }
  );

  /* ---------- Chuyên cần ---------- */
  const cc = d.chuyenCan;
  if (!cc) {
    noi.append(ghiChuAn('Chuyên cần / điểm danh'));
  } else {
    const tiLe = cc.tong ? Math.round((cc.co_mat / cc.tong) * 100) : null;

    const day = e('div', 'day-so');
    day.append(
      oThongKe(tiLe === null ? '—' : tiLe + '%', 'Tỉ lệ chuyên cần', tiLe >= 90 ? 'tot' : tiLe >= 75 ? 'luuy' : 'xau'),
      oThongKe(String(cc.co_mat), 'Buổi có mặt', 'tot'),
      oThongKe(String(cc.vang_phep), 'Vắng có phép'),
      oThongKe(String(cc.vang_khong_phep), 'Vắng không phép', cc.vang_khong_phep > 0 ? 'xau' : ''),
      oThongKe(String(cc.tre || 0), 'Đi trễ', (cc.tre || 0) > 0 ? 'luuy' : '')
    );
    noi.append(day);

    if (cc.vang_khong_phep >= 5) {
      const canh = e('div', 'the');
      canh.style.borderColor = 'var(--xau)';
      canh.append(e('h3', null, 'Em cần chú ý chuyên cần'),
        e('p', null, `Em đã vắng không phép ${cc.vang_khong_phep} buổi. `
          + 'Hãy gặp giáo viên chủ nhiệm để trao đổi sớm.'));
      noi.append(canh);
    }

    // Hoạt động & Điểm danh phụ
    if (cc.phu && cc.phu.tong > 0) {
      const thePhu = e('div', 'the');
      thePhu.style.marginTop = '14px';
      thePhu.append(
        e('h3', null, '⚡ Hoạt động & Điểm danh phụ'),
        e('p', 'trong', `Em có ${cc.phu.tong} lượt ghi nhận trong Điểm danh phụ (Có mặt: ${cc.phu.co_mat || 0}, Vắng: ${(cc.phu.vang_phep || 0) + (cc.phu.vang_khong_phep || 0)}, Đi trễ: ${cc.phu.tre || 0}).`)
      );
      if (cc.phu.chiTiet && cc.phu.chiTiet.length) {
        const dsPhu = e('div', 'ds-diem-danh');
        dsPhu.style.marginTop = '10px';
        cc.phu.chiTiet.forEach((x) => {
          const tenBuoi = x.buoiGoc === 'sang' ? 'Sáng' : x.buoiGoc === 'chieu' ? 'Chiều' : 'Hoạt động';
          const hang = e('div', 'hang-hs hang-hs-su-kien ' + (x.trangThai === 'tre' ? 'su-kien-tre' : x.trangThai === 'vang_khong_phep' ? 'su-kien-khong-phep' : x.trangThai === 'vang_phep' ? 'su-kien-phep' : ''));
          const icon = x.trangThai === 'co_mat' ? '✅' : x.trangThai === 'tre' ? '⏱️' : x.trangThai === 'vang_khong_phep' ? '⚠️' : '📋';
          const iconEl = e('div', 'su-kien-icon', icon);
          const ten = e('div', 'ten');
          ten.append(e('b', null, `${ngayVN(x.ngay)} (${tenBuoi})`));
          if (x.lyDo) ten.append(e('small', null, x.lyDo));
          const [tenTt, lop] = TEN_TRANG_THAI[x.trangThai] || ['—', 'nhan-xam'];
          hang.append(iconEl, ten, e('span', 'nhan ' + lop, tenTt));
          dsPhu.append(hang);
        });
        thePhu.append(dsPhu);
      }
      noi.append(thePhu);
    }
  }

  /* ---------- Sổ điểm ---------- */
  if (anMuc.includes('thong-ke')) noi.append(ghiChuAn('Sổ điểm / thống kê học tập'));
  d.soDiem.forEach((hk) => {
    const coGi = hk.mon.some((m) => m.dtb !== null || m.nhanXet);
    if (!coGi) return;

    const the = e('div', 'the');
    the.style.marginTop = '14px';
    const dau = e('div', 'dong-dau');
    dau.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap';
    dau.append(e('h3', null, 'Học kì ' + hk.hocKi));
    if (hk.xepLoai) dau.append(e('span', 'nhan ' + LOP_XEP_LOAI[hk.xepLoai], 'Học lực: ' + hk.xepLoai));
    if (hk.renLuyen) dau.append(e('span', 'nhan ' + (LOP_XEP_LOAI[hk.renLuyen] || 'nhan-xam'), 'Rèn luyện: ' + hk.renLuyen));
    if (hk.tbChung !== null) dau.append(e('span', 'nhan nhan-xam', 'TB chung: ' + hk.tbChung));
    the.append(dau);

    const boc = e('div', 'cuon-ngang');
    const bang = e('table');
    const thead = e('thead');
    const hd = e('tr');
    hd.append(e('th', null, 'Môn học'), e('th', null, 'Thường xuyên'),
      e('th', null, 'Giữa kì'), e('th', null, 'Cuối kì'), e('th', null, 'ĐTB'));
    thead.append(hd);

    const tbody = e('tbody');
    hk.mon.forEach((m) => {
      const tr = e('tr');
      if (m.cachDanhGia === 'diem') {
        const tx = m.tx.filter((v) => v !== null);
        tr.append(
          e('td', null, m.ten),
          e('td', null, tx.length ? tx.join(', ') : '—'),
          e('td', null, m.gk ?? '—'),
          e('td', null, m.ck ?? '—')
        );
        const tdDtb = e('td', null, m.dtb ?? '—');
        tdDtb.style.fontWeight = '700';
        if (typeof m.dtb === 'number') {
          if (m.dtb < 5) tdDtb.className = 'diem-kem';
          else if (m.dtb >= 8) tdDtb.className = 'diem-gioi';
        }
        tr.append(tdDtb);
      } else {
        const td = e('td');
        td.colSpan = 4;
        td.textContent = m.nhanXet === 'D' ? 'Đạt' : m.nhanXet === 'CD' ? 'Chưa đạt' : '—';
        tr.append(e('td', null, m.ten), td);
      }
      tbody.append(tr);
    });

    bang.append(thead, tbody);
    boc.append(bang);
    the.append(boc);

    if (hk.nhanXetRenLuyen) {
      the.append(Object.assign(e('p', null, 'Nhận xét: ' + hk.nhanXetRenLuyen), { style: 'margin-top:10px' }));
    }
    noi.append(the);
  });

  /* ---------- Khen thưởng & nhắc nhở ---------- */
  if (d.nhatKy.length) {
    const the = e('div');
    the.style.marginTop = '18px';
    the.append(e('h3', null, 'Khen thưởng và nhắc nhở'));
    const ds = e('div', 'ds-nhat-ky');
    d.nhatKy.forEach((n) => {
      const m = e('div', 'muc-nhat-ky ' + n.loai);
      const dong = e('div', 'dong-dau');
      dong.append(
        e('span', 'nhan ' + (n.loai === 'khen' ? 'nhan-tot' : 'nhan-luuy'),
          n.loai === 'khen' ? 'Khen thưởng' : 'Nhắc nhở'),
        e('span', 'ngay', ngayVN(n.ngay))
      );
      m.append(dong, e('p', null, n.noiDung));
      ds.append(m);
    });
    the.append(ds);
    noi.append(the);
  }

  /* ---------- Lịch sử vắng ---------- */
  const vang = cc ? cc.chiTiet.filter((x) => x.trangThai !== 'co_mat') : [];
  if (vang.length) {
    const the = e('div', 'the');
    the.style.marginTop = '14px';
    the.append(e('h3', null, 'Những buổi em vắng hoặc đi trễ chính khoá'));
    const ds = e('div', 'ds-diem-danh');
    vang.slice(0, 20).forEach((x) => {
      const lopSuKien = x.trangThai === 'tre' ? 'su-kien-tre'
        : x.trangThai === 'vang_khong_phep' ? 'su-kien-khong-phep' : 'su-kien-phep';
      const icon = x.trangThai === 'tre' ? '⏱️' : x.trangThai === 'vang_khong_phep' ? '⚠️' : '📋';

      const hang = e('div', 'hang-hs hang-hs-su-kien ' + lopSuKien);
      const iconEl = e('div', 'su-kien-icon', icon);
      const ten = e('div', 'ten');
      const tenBuoi = x.buoi === 'sang' ? 'Sáng' : x.buoi === 'chieu' ? 'Chiều' : 'Hoạt động';
      ten.append(e('b', null, `${ngayVN(x.ngay)} (${tenBuoi})`));
      if (x.lyDo) ten.append(e('small', null, x.lyDo));
      const [tenTt, lop] = TEN_TRANG_THAI[x.trangThai] || ['—', 'nhan-xam'];
      hang.append(iconEl, ten, e('span', 'nhan ' + lop, tenTt));
      ds.append(hang);
    });
    the.append(ds);
    noi.append(the);
  }

  const hopCuoi = e('div');
  hopCuoi.style.marginTop = '18px';
  hopCuoi.append(nut('Tra cứu mã khác', 'nut-vien', () => location.reload()));
  noi.append(hopCuoi);

  datNoiDung(khung, noi);
}
