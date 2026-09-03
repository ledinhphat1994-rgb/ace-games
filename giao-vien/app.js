/* Ứng dụng quản lý lớp 10A7 dành cho giáo viên chủ nhiệm.
   Điều hướng bằng dấu # trên thanh địa chỉ: #/tong-quan, #/diem-danh, ... */
import {
  $, $$, e, datNoiDung, api, homNay, ngayVN, ngayDayDu,
  ganDoiGiaoDien, nhac, khoiLoi, khoiDangTai,
} from '/assets/js/chung.js';

ganDoiGiaoDien($('#doiGiaoDien'));

const KHUNG = $('#noiDung');

/* ================= Từ điển hiển thị ================= */

const DIEM_DANH = {
  co_mat:          { ten: 'Có mặt',        ky: '✓', lop: 'nhan-tot' },
  tre:             { ten: 'Đi trễ',        ky: 'T', lop: 'nhan-luuy' },
  vang_phep:       { ten: 'Vắng có phép',  ky: 'P', lop: 'nhan' },
  vang_khong_phep: { ten: 'Vắng không phép', ky: '✗', lop: 'nhan-xau' },
};

const LOAI_NHAT_KY = {
  khen:     { ten: 'Khen thưởng', lop: 'nhan-tot' },
  nhac_nho: { ten: 'Nhắc nhở',    lop: 'nhan-luuy' },
  vi_pham:  { ten: 'Vi phạm',     lop: 'nhan-xau' },
  ho_tro:   { ten: 'Cần hỗ trợ',  lop: 'nhan-tim' },
  khac:     { ten: 'Khác',        lop: 'nhan-xam' },
};

const TEN_BUOI = { sang: 'Buổi sáng', chieu: 'Buổi chiều', hoat_dong: 'Hoạt động' };

/* ================= Mảnh giao diện dùng lại ================= */

function tieuDeTrang(tieuDe, phu, ...nutPhai) {
  const hop = e('div', 'tieu-de-trang');
  const trai = e('div');
  trai.append(e('h1', null, tieuDe));
  if (phu) trai.append(e('p', null, phu));
  hop.append(trai);
  if (nutPhai.length) hop.append(datNoiDung(e('div', 'phai'), ...nutPhai));
  return hop;
}

function oThongKe(conSo, ten, kieu = '') {
  const o = e('div', 'o-thong-ke ' + kieu);
  o.append(e('div', 'con-so', conSo), e('div', 'ten', ten));
  return o;
}

function nut(chu, kieu, khiBam) {
  const b = e('button', 'nut ' + (kieu || ''), chu);
  b.type = 'button';
  if (khiBam) b.addEventListener('click', khiBam);
  return b;
}

function truong(nhan, oNhap) {
  const hop = e('div');
  const l = e('label', 'nhan-nhap', nhan);
  l.htmlFor = oNhap.id;
  hop.append(l, oNhap);
  return hop;
}

function oNhap(id, kieu = 'text', giaTri = '', gyThich = '') {
  const o = e(kieu === 'textarea' ? 'textarea' : 'input', 'o-nhap');
  o.id = id;
  if (kieu !== 'textarea') o.type = kieu;
  o.value = giaTri ?? '';
  if (gyThich) o.placeholder = gyThich;
  return o;
}

function oChon(id, cacMuc, giaTri) {
  const s = e('select', 'o-nhap');
  s.id = id;
  cacMuc.forEach(([v, t]) => {
    const op = e('option', null, t);
    op.value = v;
    if (v === giaTri) op.selected = true;
    s.append(op);
  });
  return s;
}

/* ---------- Hộp thoại ---------- */
function moHopThoai(tieuDe, noiDung, cacNut) {
  const hop = $('#hopThoai');
  $('#hopThoaiTieuDe').textContent = tieuDe;
  datNoiDung($('#hopThoaiThan'), ...(Array.isArray(noiDung) ? noiDung : [noiDung]));
  datNoiDung($('#hopThoaiChan'), ...cacNut);
  hop.showModal();
  return hop;
}
const dongHopThoai = () => $('#hopThoai').close();

/* ================= Trang: Tổng quan ================= */

async function trangTongQuan() {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api('/api/gv/tong-quan');

  const dd = d.diemDanhHomNay || {};
  const daDiemDanh = Object.values(dd).reduce((a, b) => a + b, 0);

  const khung = e('div');
  khung.append(tieuDeTrang('Tổng quan', ngayDayDu(d.ngay)));

  const day = e('div', 'day-so');
  day.append(
    oThongKe(String(d.siSo), 'Sĩ số lớp'),
    oThongKe(String(dd.co_mat || 0), 'Có mặt hôm nay', 'tot'),
    oThongKe(String((dd.vang_phep || 0) + (dd.vang_khong_phep || 0)), 'Vắng hôm nay', 'luuy'),
    oThongKe(String(dd.vang_khong_phep || 0), 'Vắng không phép', 'xau')
  );
  khung.append(day);

  if (!daDiemDanh) {
    const nhacNho = e('div', 'the');
    nhacNho.style.borderColor = 'var(--luu-y)';
    nhacNho.append(
      e('h3', null, 'Hôm nay chưa điểm danh'),
      e('p', 'trong', 'Bấm nút bên dưới để điểm danh nhanh cho cả lớp.'),
      nut('Điểm danh ngay', '', () => { location.hash = '#/diem-danh'; })
    );
    khung.append(nhacNho);
  }

  const luoi = e('div', 'luoi luoi-2');
  luoi.style.marginTop = '18px';

  // --- Học sinh vắng nhiều ---
  const theVang = e('div', 'the');
  theVang.append(e('h3', null, 'Vắng nhiều trong 30 ngày'));
  if (!d.vangNhieu.length) {
    theVang.append(e('p', 'trong', 'Không có em nào vắng. Rất tốt.'));
  } else {
    const ds = e('div', 'ds-diem-danh');
    d.vangNhieu.forEach((h) => {
      const hang = e('div', 'hang-hs');
      const ten = e('div', 'ten');
      ten.append(e('b', null, h.hoTen));
      hang.append(e('div', 'stt', h.id), ten);
      const nhanHop = e('div', 'canh-phai');
      if (h.vangKhongPhep) nhanHop.append(e('span', 'nhan nhan-xau', `${h.vangKhongPhep} không phép`));
      if (h.vangPhep) nhanHop.append(e('span', 'nhan', `${h.vangPhep} có phép`));
      if (h.tre) nhanHop.append(e('span', 'nhan nhan-luuy', `${h.tre} trễ`));
      hang.append(nhanHop);
      hang.style.cursor = 'pointer';
      hang.addEventListener('click', () => { location.hash = '#/hoc-sinh/' + h.id; });
      ds.append(hang);
    });
    theVang.append(ds);
  }
  luoi.append(theVang);

  // --- Hoàn cảnh cần quan tâm ---
  const theHc = e('div', 'the');
  theHc.append(e('h3', null, 'Hoàn cảnh cần quan tâm'));
  if (!d.hoanCanh.length) {
    theHc.append(e('p', 'trong', 'Chưa ghi nhận trường hợp nào.'));
  } else {
    const ul = e('div', 'ds-diem-danh');
    d.hoanCanh.forEach((h) => {
      const hang = e('div', 'hang-hs');
      const ten = e('div', 'ten');
      ten.append(e('b', null, h.hoTen));
      hang.append(e('div', 'stt', h.id), ten, e('span', 'nhan nhan-luuy', h.hoanCanh));
      ul.append(hang);
    });
    theHc.append(ul);
  }
  luoi.append(theHc);

  // --- Theo dõi đầu năm ---
  const theTd = e('div', 'the');
  theTd.append(e('h3', null, 'Theo dõi đầu năm'));
  const nhomMuc = {};
  d.theoDoi.forEach((t) => {
    nhomMuc[t.muc] = nhomMuc[t.muc] || [];
    nhomMuc[t.muc].push(t);
  });
  const TEN_MUC = { sgk: 'Sách giáo khoa', dong_phuc: 'Đồng phục' };
  Object.entries(nhomMuc).forEach(([muc, ds]) => {
    theTd.append(e('div', 'the-nhan', TEN_MUC[muc] || muc));
    const hop = e('div', 'day-loc');
    hop.style.margin = '6px 0 12px';
    ds.sort((a, b) => b.n - a.n).forEach((t) => {
      const l = /Chưa/.test(t.trangThai) ? 'nhan-xau' : /thiếu/i.test(t.trangThai) ? 'nhan-luuy' : 'nhan-tot';
      hop.append(e('span', 'nhan ' + l, `${t.trangThai}: ${t.n}`));
    });
    theTd.append(hop);
  });
  luoi.append(theTd);

  // --- Sắp tới ---
  const theKh = e('div', 'the');
  theKh.append(e('h3', null, 'Sắp tới'));
  if (!d.keHoachSapToi.length) {
    theKh.append(e('p', 'trong', 'Không có mốc nào sắp tới.'));
  } else {
    d.keHoachSapToi.forEach((k) => {
      const hang = e('div', 'hang-hs');
      const ten = e('div', 'ten');
      ten.append(e('b', null, k.tieuDe), e('small', null, ngayDayDu(k.ngay)));
      hang.append(ten);
      theKh.append(hang);
    });
  }
  luoi.append(theKh);

  khung.append(luoi);

  // --- Nhật ký gần đây ---
  const theNk = e('div');
  theNk.style.marginTop = '18px';
  theNk.append(e('h3', null, 'Nhật ký gần đây'));
  if (!d.nhatKy.length) {
    theNk.append(e('p', 'trong', 'Chưa có ghi chép nào.'));
  } else {
    const ds = e('div', 'ds-nhat-ky');
    d.nhatKy.slice(0, 6).forEach((n) => ds.append(veMucNhatKy(n, null)));
    theNk.append(ds);
  }
  khung.append(theNk);

  datNoiDung(KHUNG, khung);
}

/* ================= Trang: Điểm danh ================= */

async function trangDiemDanh() {
  datNoiDung(KHUNG, khoiDangTai());

  let ngay = sessionStorage.getItem('dd-ngay') || homNay();
  let buoi = sessionStorage.getItem('dd-buoi') || 'sang';
  let duLieu = null;
  const thayDoi = new Map();   // hocSinhId -> trangThai

  async function tai() {
    duLieu = await api(`/api/gv/diem-danh?ngay=${ngay}&buoi=${buoi}`);
    thayDoi.clear();
    ve();
  }

  function tinhSo() {
    const dem = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
    duLieu.danhSach.forEach((h) => {
      const tt = thayDoi.get(h.id) ?? h.trangThai;
      if (tt && dem[tt] !== undefined) dem[tt]++;
    });
    return dem;
  }

  function ve() {
    const khung = e('div');

    const oNgay = e('input', 'o-nhap');
    oNgay.type = 'date';
    oNgay.value = ngay;
    oNgay.addEventListener('change', async () => {
      ngay = oNgay.value || homNay();
      sessionStorage.setItem('dd-ngay', ngay);
      await tai();
    });

    const chonBuoi = oChon('chonBuoi', Object.entries(TEN_BUOI), buoi);
    chonBuoi.style.width = 'auto';
    chonBuoi.addEventListener('change', async () => {
      buoi = chonBuoi.value;
      sessionStorage.setItem('dd-buoi', buoi);
      await tai();
    });

    khung.append(tieuDeTrang('Điểm danh', ngayDayDu(ngay)));

    const hangChon = e('div', 'chon-ngay');
    hangChon.append(oNgay, chonBuoi,
      nut('Cả lớp có mặt', 'nut-vien nut-nho', () => {
        duLieu.danhSach.forEach((h) => thayDoi.set(h.id, 'co_mat'));
        ve();
      })
    );
    khung.append(hangChon);

    // Thanh tiến độ
    const dem = tinhSo();
    const tong = duLieu.danhSach.length || 1;
    const thanh = e('div', 'thanh-tien-do');
    [['co_mat', 'p-comat'], ['tre', 'p-tre'], ['vang_phep', 'p-phep'], ['vang_khong_phep', 'p-khongphep']]
      .forEach(([k, lop]) => {
        if (!dem[k]) return;
        const i = e('i', lop);
        i.style.width = (dem[k] / tong * 100) + '%';
        thanh.append(i);
      });
    khung.append(thanh);

    const daGhi = Object.values(dem).reduce((a, b) => a + b, 0);
    const day = e('div', 'day-so');
    day.append(
      oThongKe(`${daGhi}/${tong}`, 'Đã điểm danh'),
      oThongKe(String(dem.co_mat), 'Có mặt', 'tot'),
      oThongKe(String(dem.vang_phep + dem.tre), 'Trễ / có phép', 'luuy'),
      oThongKe(String(dem.vang_khong_phep), 'Vắng không phép', 'xau')
    );
    khung.append(day);

    // Danh sách học sinh
    const ds = e('div', 'ds-diem-danh');
    duLieu.danhSach.forEach((h) => {
      const tt = thayDoi.get(h.id) ?? h.trangThai;
      const hang = e('div', 'hang-hs' + (tt ? '' : ' chua-ghi'));

      const ten = e('div', 'ten');
      ten.append(e('b', null, h.hoTen), e('small', null, h.lopNghe || ''));
      hang.append(e('div', 'stt', h.id), ten);

      const nhom = e('div', 'nhom-chon');
      Object.entries(DIEM_DANH).forEach(([ma, tt2]) => {
        const b = e('button', null, tt2.ky);
        b.type = 'button';
        b.dataset.tt = ma;
        b.title = tt2.ten;
        b.setAttribute('aria-label', `${h.hoTen}: ${tt2.ten}`);
        b.setAttribute('aria-pressed', String(tt === ma));
        b.addEventListener('click', () => {
          thayDoi.set(h.id, ma);
          ve();
        });
        nhom.append(b);
      });
      hang.append(nhom);
      ds.append(hang);
    });
    khung.append(ds);

    const chuThich = e('div', 'chu-thich');
    [['✓ Có mặt', 'var(--tot)'], ['T Đi trễ', 'var(--luu-y)'],
     ['P Vắng có phép', 'var(--chinh)'], ['✗ Vắng không phép', 'var(--xau)']]
      .forEach(([chu, mau]) => {
        const s = e('span');
        const i = e('i');
        i.style.background = mau;
        s.append(i, document.createTextNode(chu));
        chuThich.append(s);
      });
    khung.append(chuThich);
    khung.append(Object.assign(e('div'), { style: 'height:70px' }));

    // Thanh lưu
    if (thayDoi.size) {
      const thanhLuu = e('div', 'thanh-luu');
      thanhLuu.append(e('div', 'thong-tin', `${thayDoi.size} thay đổi chưa lưu`));
      thanhLuu.append(
        nut('Bỏ', 'nut-nhe nut-nho', () => { thayDoi.clear(); ve(); }),
        nut('Lưu điểm danh', '', async (ev) => {
          const b = ev.currentTarget;
          b.disabled = true;
          b.textContent = 'Đang lưu…';
          try {
            await api('/api/gv/diem-danh', {
              method: 'POST',
              than: {
                ngay, buoi,
                ghiNhan: [...thayDoi].map(([hocSinhId, trangThai]) => ({ hocSinhId, trangThai })),
              },
            });
            nhac('Đã lưu điểm danh', 'tot');
            await tai();
          } catch (err) {
            nhac(err.message, 'xau');
            b.disabled = false;
            b.textContent = 'Lưu điểm danh';
          }
        })
      );
      khung.append(thanhLuu);
    }

    datNoiDung(KHUNG, khung);
  }

  await tai();
}

/* ================= Trang: Học sinh ================= */

async function trangHocSinh() {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api('/api/gv/hoc-sinh');
  let tim = '';
  let loc = '';

  const BO_LOC = [
    ['', 'Tất cả'],
    ['vang', 'Có vắng'],
    ['hoancanh', 'Hoàn cảnh khó khăn'],
    ['thieusach', 'Chưa đủ sách'],
    ['chuadongphuc', 'Chưa nhận đ/phục'],
  ];

  function hopLe(h) {
    if (loc === 'vang') return h.vangKhongPhep + h.vangPhep > 0;
    if (loc === 'hoancanh') return Boolean(h.hoanCanh);
    if (loc === 'thieusach') return h.theoDoi.sgk && h.theoDoi.sgk.trangThai !== 'Đủ bộ sách';
    if (loc === 'chuadongphuc') return h.theoDoi.dong_phuc && /Chưa/.test(h.theoDoi.dong_phuc.trangThai);
    return true;
  }

  function ve() {
    const khung = e('div');
    khung.append(tieuDeTrang('Học sinh', `${d.danhSach.length} em đang học`));

    const o = oNhap('timHs', 'search', tim, 'Tìm theo họ tên…');
    o.addEventListener('input', (ev) => {
      tim = ev.target.value;
      veDanhSach();
    });
    khung.append(o);

    const hopLoc = e('div', 'day-loc');
    hopLoc.style.margin = '12px 0 16px';
    BO_LOC.forEach(([v, t]) => {
      const b = e('button', 'vien-loc', t);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(loc === v));
      b.addEventListener('click', () => { loc = v; ve(); });
      hopLoc.append(b);
    });
    khung.append(hopLoc);

    const hopDs = e('div', 'ds-the');
    hopDs.id = 'dsTheHs';
    khung.append(hopDs);
    datNoiDung(KHUNG, khung);
    veDanhSach();
  }

  function veDanhSach() {
    const q = tim.trim().toLowerCase();
    const ds = d.danhSach.filter((h) => hopLe(h) && (!q || h.hoTen.toLowerCase().includes(q)));
    const hop = $('#dsTheHs');

    if (!ds.length) return datNoiDung(hop, e('p', 'trong', 'Không có học sinh phù hợp.'));

    datNoiDung(hop, ...ds.map((h) => {
      const b = e('button', 'the-hs');
      b.type = 'button';
      b.append(e('div', 'chu-cai', (h.hoTen.trim().split(/\s+/).pop() || '?')[0].toUpperCase()));

      const noi = e('div', 'noi');
      noi.append(e('b', null, `${h.id}. ${h.hoTen}`));
      const phu = [h.lopNghe, h.chucVu].filter(Boolean).join(' · ');
      noi.append(e('small', null, phu || ngayVN(h.ngaySinh)));
      b.append(noi);

      const phai = e('div', 'canh-phai');
      if (h.vangKhongPhep) phai.append(e('span', 'nhan nhan-xau', `${h.vangKhongPhep}✗`));
      if (h.hoanCanh) phai.append(e('span', 'nhan nhan-luuy', '!'));
      b.append(phai);

      b.addEventListener('click', () => { location.hash = '#/hoc-sinh/' + h.id; });
      return b;
    }));
  }

  ve();
}

async function trangHoSo(id) {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api('/api/gv/hoc-sinh?id=' + encodeURIComponent(id));
  const h = d.hocSinh;

  const khung = e('div');
  const quayLai = nut('← Danh sách', 'nut-nhe nut-nho', () => { location.hash = '#/hoc-sinh'; });
  khung.append(quayLai);
  khung.append(tieuDeTrang(h.hoTen, [h.lopNghe, 'Tổ hợp ' + (h.toHop || '—'), ngayVN(h.ngaySinh)].filter(Boolean).join(' · ')));

  const dem = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
  d.diemDanh.forEach((x) => { if (dem[x.trangThai] !== undefined) dem[x.trangThai]++; });

  const day = e('div', 'day-so');
  day.append(
    oThongKe(String(dem.co_mat), 'Buổi có mặt', 'tot'),
    oThongKe(String(dem.tre), 'Đi trễ', 'luuy'),
    oThongKe(String(dem.vang_phep), 'Vắng có phép'),
    oThongKe(String(dem.vang_khong_phep), 'Vắng không phép', 'xau')
  );
  khung.append(day);

  const luoi = e('div', 'luoi luoi-2');

  // Hồ sơ + sửa
  const theHs = e('div', 'the');
  theHs.append(e('h3', null, 'Hồ sơ'));
  const bang = [
    ['Chức vụ', h.chucVu || '—'],
    ['Tổ', h.toSo ? 'Tổ ' + h.toSo : '—'],
    ['Điện thoại phụ huynh', h.dienThoaiPh || '—'],
    ['Hoàn cảnh', h.hoanCanh || '—'],
    ['Ghi chú', h.ghiChu || '—'],
  ];
  bang.forEach(([k, v]) => {
    const hang = e('div');
    hang.style.cssText = 'display:flex;gap:10px;padding:5px 0;font-size:14px;border-bottom:1px solid var(--vien)';
    hang.append(Object.assign(e('span', null, k), { style: 'color:var(--chu-nhat);min-width:150px' }), e('span', null, v));
    theHs.append(hang);
  });
  theHs.append(Object.assign(nut('Sửa hồ sơ', 'nut-vien nut-nho', () => suaHoSo(h)), { style: 'margin-top:12px' }));
  luoi.append(theHs);

  // Theo dõi
  const theTd = e('div', 'the');
  theTd.append(e('h3', null, 'Theo dõi đầu năm'));
  if (!d.theoDoi.length) theTd.append(e('p', 'trong', 'Chưa có dữ liệu.'));
  const TEN_MUC = { sgk: 'Sách giáo khoa', dong_phuc: 'Đồng phục' };
  d.theoDoi.forEach((t) => {
    const hang = e('div');
    hang.style.cssText = 'display:flex;gap:10px;align-items:center;padding:6px 0';
    const l = /Chưa/.test(t.trangThai) ? 'nhan-xau' : /thiếu/i.test(t.trangThai) ? 'nhan-luuy' : 'nhan-tot';
    hang.append(
      Object.assign(e('span', null, TEN_MUC[t.muc] || t.muc), { style: 'color:var(--chu-nhat);min-width:150px;font-size:14px' }),
      e('span', 'nhan ' + l, t.trangThai)
    );
    if (t.ghiChu) hang.append(e('span', 'trong', t.ghiChu));
    theTd.append(hang);
  });
  luoi.append(theTd);
  khung.append(luoi);

  // Lịch sử điểm danh
  const theLs = e('div', 'the');
  theLs.style.marginTop = '14px';
  theLs.append(e('h3', null, 'Lịch sử điểm danh'));
  if (!d.diemDanh.length) {
    theLs.append(e('p', 'trong', 'Chưa có buổi nào được điểm danh.'));
  } else {
    const lich = e('div', 'lich-nho');
    d.diemDanh.slice().reverse().forEach((x) => {
      const i = e('i', x.trangThai);
      i.title = `${ngayVN(x.ngay)} — ${(DIEM_DANH[x.trangThai] || {}).ten || x.trangThai}`;
      lich.append(i);
    });
    theLs.append(lich);

    const vang = d.diemDanh.filter((x) => x.trangThai !== 'co_mat');
    if (vang.length) {
      const ds = e('div', 'ds-nhat-ky');
      ds.style.marginTop = '12px';
      vang.slice(0, 12).forEach((x) => {
        const m = e('div', 'muc-nhat-ky ' + (x.trangThai === 'vang_khong_phep' ? 'vi_pham' : 'nhac_nho'));
        const dong = e('div', 'dong-dau');
        dong.append(
          e('span', 'nhan ' + (DIEM_DANH[x.trangThai] || {}).lop, (DIEM_DANH[x.trangThai] || {}).ten || x.trangThai),
          e('span', 'ngay', `${ngayVN(x.ngay)} · ${TEN_BUOI[x.buoi] || x.buoi}`)
        );
        m.append(dong);
        if (x.lyDo) m.append(e('p', null, x.lyDo));
        ds.append(m);
      });
      theLs.append(ds);
    }
  }
  khung.append(theLs);

  // Nhật ký riêng
  const theNk = e('div');
  theNk.style.marginTop = '18px';
  const dauNk = e('div', 'tieu-de-trang');
  dauNk.append(e('h2', null, 'Nhật ký của em này'));
  const phaiNk = e('div', 'phai');
  phaiNk.append(nut('+ Thêm ghi chép', 'nut-vien nut-nho', () => themNhatKy(h.id, () => trangHoSo(id))));
  dauNk.append(phaiNk);
  theNk.append(dauNk);

  if (!d.nhatKy.length) {
    theNk.append(e('p', 'trong', 'Chưa có ghi chép nào.'));
  } else {
    const ds = e('div', 'ds-nhat-ky');
    d.nhatKy.forEach((n) => ds.append(veMucNhatKy({ ...n, hoTen: null }, () => trangHoSo(id))));
    theNk.append(ds);
  }
  khung.append(theNk);

  datNoiDung(KHUNG, khung);
}

function suaHoSo(h) {
  const oChuc = oNhap('sChuc', 'text', h.chucVu, 'Lớp trưởng, tổ trưởng…');
  const oTo = oNhap('sTo', 'number', h.toSo ?? '', 'Số tổ');
  const oSdt = oNhap('sSdt', 'tel', h.dienThoaiPh, 'Điện thoại phụ huynh');
  const oHc = oNhap('sHc', 'text', h.hoanCanh, 'Hộ cận nghèo, GĐ khó khăn…');
  const oGc = oNhap('sGc', 'textarea', h.ghiChu, 'Ghi chú riêng');

  moHopThoai('Sửa hồ sơ — ' + h.hoTen, [
    truong('Chức vụ', oChuc),
    truong('Tổ', oTo),
    truong('Điện thoại phụ huynh', oSdt),
    truong('Hoàn cảnh', oHc),
    truong('Ghi chú', oGc),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/hoc-sinh', {
          method: 'PATCH',
          than: {
            id: h.id, chucVu: oChuc.value, toSo: oTo.value,
            dienThoaiPh: oSdt.value, hoanCanh: oHc.value, ghiChu: oGc.value,
          },
        });
        dongHopThoai();
        nhac('Đã lưu hồ sơ', 'tot');
        trangHoSo(h.id);
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

/* ================= Trang: Nhật ký ================= */

function veMucNhatKy(n, taiLai) {
  const loai = LOAI_NHAT_KY[n.loai] || LOAI_NHAT_KY.khac;
  const m = e('div', 'muc-nhat-ky ' + n.loai + (n.daXuLy ? ' da-xong' : ''));

  const dong = e('div', 'dong-dau');
  dong.append(e('span', 'nhan ' + loai.lop, loai.ten));
  if (n.hoTen) dong.append(e('span', 'nhan nhan-xam', n.hoTen));
  dong.append(e('span', 'ngay', ngayVN(n.ngay)));

  if (taiLai) {
    const viec = e('div', 'viec');
    viec.append(
      nut(n.daXuLy ? '↺' : '✓', 'nut-nhe nut-nho', async () => {
        try {
          await api('/api/gv/nhat-ky', { method: 'PATCH', than: { id: n.id, daXuLy: !n.daXuLy } });
          taiLai();
        } catch (err) { nhac(err.message, 'xau'); }
      }),
      nut('✕', 'nut-nhe nut-nho', async () => {
        moHopThoai('Xoá ghi chép?', e('p', null, n.noiDung), [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá', 'nut-xau', async () => {
            try {
              await api('/api/gv/nhat-ky?id=' + n.id, { method: 'DELETE' });
              dongHopThoai();
              nhac('Đã xoá', 'tot');
              taiLai();
            } catch (err) { nhac(err.message, 'xau'); }
          }),
        ]);
      })
    );
    dong.append(viec);
  }

  m.append(dong, e('p', null, n.noiDung));
  return m;
}

function themNhatKy(hocSinhIdMacDinh, taiLai) {
  api('/api/gv/hoc-sinh').then((d) => {
    const oNgay = oNhap('nkNgay', 'date', homNay());
    const oLoai = oChon('nkLoai', Object.entries(LOAI_NHAT_KY).map(([k, v]) => [k, v.ten]), 'nhac_nho');
    const oHs = oChon('nkHs',
      [['', '— Cả lớp —'], ...d.danhSach.map((h) => [String(h.id), `${h.id}. ${h.hoTen}`])],
      hocSinhIdMacDinh ? String(hocSinhIdMacDinh) : '');
    const oNd = oNhap('nkNd', 'textarea', '', 'Nội dung ghi chép…');

    moHopThoai('Thêm ghi chép', [
      truong('Ngày', oNgay),
      truong('Loại', oLoai),
      truong('Học sinh', oHs),
      truong('Nội dung', oNd),
    ], [
      nut('Huỷ', 'nut-nhe', dongHopThoai),
      nut('Lưu', '', async (ev) => {
        if (!oNd.value.trim()) return nhac('Chưa nhập nội dung', 'xau');
        ev.currentTarget.disabled = true;
        try {
          await api('/api/gv/nhat-ky', {
            method: 'POST',
            than: { ngay: oNgay.value, loai: oLoai.value, hocSinhId: oHs.value || null, noiDung: oNd.value },
          });
          dongHopThoai();
          nhac('Đã thêm ghi chép', 'tot');
          taiLai();
        } catch (err) {
          nhac(err.message, 'xau');
          ev.currentTarget.disabled = false;
        }
      }),
    ]);
  }).catch((err) => nhac(err.message, 'xau'));
}

async function trangNhatKy() {
  datNoiDung(KHUNG, khoiDangTai());
  let loai = '';

  async function ve() {
    const d = await api('/api/gv/nhat-ky' + (loai ? '?loai=' + loai : ''));
    const khung = e('div');

    const dau = e('div', 'tieu-de-trang');
    const trai = e('div');
    trai.append(e('h1', null, 'Nhật ký lớp'), e('p', null, 'Khen thưởng, nhắc nhở, vi phạm, hỗ trợ.'));
    const phai = e('div', 'phai');
    phai.append(nut('+ Thêm ghi chép', '', () => themNhatKy(null, ve)));
    dau.append(trai, phai);
    khung.append(dau);

    const hopLoc = e('div', 'day-loc');
    hopLoc.style.marginBottom = '16px';
    [['', 'Tất cả'], ...Object.entries(LOAI_NHAT_KY).map(([k, v]) => [k, v.ten])].forEach(([v, t]) => {
      const b = e('button', 'vien-loc', t);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(loai === v));
      b.addEventListener('click', () => { loai = v; ve(); });
      hopLoc.append(b);
    });
    khung.append(hopLoc);

    if (!d.danhSach.length) {
      khung.append(e('p', 'trong', 'Chưa có ghi chép nào.'));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      d.danhSach.forEach((n) => ds.append(veMucNhatKy(n, ve)));
      khung.append(ds);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

/* ================= Trang: Thông báo ================= */

async function trangThongBao() {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const d = await api('/api/gv/thong-bao');
    const khung = e('div');

    const dau = e('div', 'tieu-de-trang');
    const trai = e('div');
    trai.append(e('h1', null, 'Thông báo'), e('p', null, 'Đăng lên trang lớp, cả lớp xem được ngay.'));
    const phai = e('div', 'phai');
    phai.append(nut('+ Soạn thông báo', '', () => soanThongBao(null, ve)));
    dau.append(trai, phai);
    khung.append(dau);

    if (!d.danhSach.length) {
      khung.append(e('p', 'trong', 'Chưa có thông báo nào.'));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      d.danhSach.forEach((t) => {
        const m = e('div', 'muc-nhat-ky ' + (t.ghim ? 'nhac_nho' : 'khac') + (t.hien ? '' : ' da-xong'));
        const dong = e('div', 'dong-dau');
        if (t.ghim) dong.append(e('span', 'nhan nhan-luuy', 'Ghim'));
        if (!t.hien) dong.append(e('span', 'nhan nhan-xam', 'Đang ẩn'));
        dong.append(e('span', 'nhan nhan-xam', t.loai || 'Chủ nhiệm'), e('span', 'ngay', ngayVN(t.ngay)));

        const viec = e('div', 'viec');
        viec.append(
          nut('✎', 'nut-nhe nut-nho', () => soanThongBao(t, ve)),
          nut(t.hien ? '🙈' : '👁', 'nut-nhe nut-nho', async () => {
            try {
              await api('/api/gv/thong-bao', { method: 'PATCH', than: { id: t.id, hien: !t.hien } });
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          }),
          nut('✕', 'nut-nhe nut-nho', () => {
            moHopThoai('Xoá thông báo?', e('p', null, t.tieuDe), [
              nut('Huỷ', 'nut-nhe', dongHopThoai),
              nut('Xoá', 'nut-xau', async () => {
                try {
                  await api('/api/gv/thong-bao?id=' + t.id, { method: 'DELETE' });
                  dongHopThoai();
                  nhac('Đã xoá', 'tot');
                  ve();
                } catch (err) { nhac(err.message, 'xau'); }
              }),
            ]);
          })
        );
        dong.append(viec);

        m.append(dong, Object.assign(e('h3', null, t.tieuDe), { style: 'margin:4px 0' }), e('p', null, t.noiDung));
        ds.append(m);
      });
      khung.append(ds);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

function soanThongBao(tb, taiLai) {
  const oNgay = oNhap('tbNgay', 'date', tb ? tb.ngay : homNay());
  const oTd = oNhap('tbTd', 'text', tb ? tb.tieuDe : '', 'Ví dụ: Họp phụ huynh đầu năm');
  const oNd = oNhap('tbNd', 'textarea', tb ? tb.noiDung : '', 'Nội dung chi tiết…');
  const oLoai = oChon('tbLoai',
    [['Chủ nhiệm', 'Chủ nhiệm'], ['Nhà trường', 'Nhà trường'], ['Học tập', 'Học tập'], ['Hoạt động', 'Hoạt động']],
    tb ? tb.loai : 'Chủ nhiệm');

  const oGhim = e('input');
  oGhim.type = 'checkbox';
  oGhim.id = 'tbGhim';
  oGhim.checked = Boolean(tb && tb.ghim);
  const hangGhim = e('label');
  hangGhim.style.cssText = 'display:flex;gap:9px;align-items:center;font-size:14.5px;font-weight:600';
  hangGhim.append(oGhim, document.createTextNode('Ghim lên đầu trang lớp'));

  moHopThoai(tb ? 'Sửa thông báo' : 'Soạn thông báo', [
    truong('Ngày', oNgay),
    truong('Tiêu đề', oTd),
    truong('Loại', oLoai),
    truong('Nội dung', oNd),
    hangGhim,
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut(tb ? 'Lưu' : 'Đăng', '', async (ev) => {
      if (!oTd.value.trim() || !oNd.value.trim()) return nhac('Cần nhập cả tiêu đề và nội dung', 'xau');
      ev.currentTarget.disabled = true;
      try {
        const than = {
          ngay: oNgay.value, tieuDe: oTd.value, noiDung: oNd.value,
          loai: oLoai.value, ghim: oGhim.checked,
        };
        if (tb) await api('/api/gv/thong-bao', { method: 'PATCH', than: { id: tb.id, ...than } });
        else await api('/api/gv/thong-bao', { method: 'POST', than });
        dongHopThoai();
        nhac(tb ? 'Đã lưu' : 'Đã đăng thông báo', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

/* ================= Điều hướng ================= */

const TRANG = {
  '/tong-quan': trangTongQuan,
  '/diem-danh': trangDiemDanh,
  '/hoc-sinh': trangHocSinh,
  '/nhat-ky': trangNhatKy,
  '/thong-bao': trangThongBao,
};

function danhDauMenu(duong) {
  $$('.cot-trai a, .tab-duoi a').forEach((a) => {
    const khop = a.getAttribute('href') === '#' + duong
      || (duong.startsWith('/hoc-sinh') && a.getAttribute('href') === '#/hoc-sinh');
    if (khop) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

async function dieuHuong() {
  const duong = location.hash.replace(/^#/, '') || '/tong-quan';
  danhDauMenu(duong);
  window.scrollTo(0, 0);

  try {
    const hoSo = duong.match(/^\/hoc-sinh\/(\d+)$/);
    if (hoSo) return await trangHoSo(Number(hoSo[1]));

    const xuLy = TRANG[duong] || trangTongQuan;
    await xuLy();
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Không tải được trang: ' + err.message));
  }
}

addEventListener('hashchange', dieuHuong);
dieuHuong();
