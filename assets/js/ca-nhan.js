import { $, e, datNoiDung, api, ngayVN, ganDoiGiaoDien, layNhanTaiKhoan, ganNhacNen } from './chung.js';
import { oThongKe, tieuDeTrang, nut } from './giao-dien.js';

ganDoiGiaoDien($('#doiGiaoDien'));

api('/api/whoami').then(async (w) => {
  // Ô lô-gô đầu trang (mã lớp viết tắt) — phải luôn hiện đúng lớp đang đăng nhập, giống hệt
  // trang lớp và khu quản lý, để "vùng đầu trang" nhất quán trên mọi trang của web.
  const hieuMaLop = $('#hieuMaLop');
  if (hieuMaLop && w && w.tenLop) hieuMaLop.textContent = w.tenLop.replace(/^Lớp\s*/i, '');
  const hieuPhu = document.querySelector('.hieu-phu');
  if (hieuPhu) hieuPhu.textContent = layNhanTaiKhoan(w);
  const nutDoiLop = $('#nutDoiLop');
  if (nutDoiLop) nutDoiLop.hidden = !(w && w.role === 'teacher');
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

    // Hoạt động & Điểm danh linh động
    if (cc.phu && cc.phu.tong > 0) {
      const thePhu = e('div', 'the');
      thePhu.style.marginTop = '14px';
      thePhu.append(
        e('h3', null, '⚡ Hoạt động & Điểm danh linh động'),
        e('p', 'trong', `Em có ${cc.phu.tong} lượt ghi nhận trong Điểm danh linh động (Có mặt: ${cc.phu.co_mat || 0}, Vắng: ${(cc.phu.vang_phep || 0) + (cc.phu.vang_khong_phep || 0)}, Đi trễ: ${cc.phu.tre || 0}).`)
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
