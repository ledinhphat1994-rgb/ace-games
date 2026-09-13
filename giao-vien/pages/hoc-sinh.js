import { KHUNG, PHAM_VI_LOP_ID, PHIEN, apiTheoPhamVi } from '../lib.js';
import { DIEM_DANH, TEN_BUOI } from './diem-danh.js';
import { $, api, datNoiDung, e, giuViTriCuonKhiVe, homNay, khoiDangTai, ngayVN, nhac } from '/assets/js/chung.js';
import { dongHopThoai, moHopThoai, nut, oChon, oNhap, oThongKe, tieuDeTrang, truong } from '/assets/js/giao-dien.js';


export function themHocSinh(taiLai) {
  const oHoTen = oNhap('thHoTen', 'text', '', 'Họ và tên đầy đủ');
  const oGioiTinh = oChon('thGioiTinh', [['Nam', 'Nam'], ['Nữ', 'Nữ']], 'Nam');
  const oNgaySinh = oNhap('thNgaySinh', 'date', '');
  const oLopNghe = oNhap('thLopNghe', 'text', '', 'Ví dụ: CNTT, Công nghệ ô tô…');
  const oToHop = oNhap('thToHop', 'text', '', 'Ví dụ: A4');
  const oTo = oNhap('thTo', 'number', '', 'Số tổ');
  oTo.min = '1';
  oTo.step = '1';

  moHopThoai('Thêm học sinh mới', [
    truong('Họ và tên', oHoTen),
    truong('Giới tính', oGioiTinh),
    truong('Ngày sinh', oNgaySinh),
    truong('Lớp nghề', oLopNghe),
    truong('Tổ hợp', oToHop),
    truong('Tổ', oTo),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Thêm', '', async (ev) => {
      if (!oHoTen.value.trim()) return nhac('Chưa nhập họ tên', 'xau');
      if (oTo.value && Number(oTo.value) < 1) return nhac('Số tổ phải từ 1 trở lên.', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/rieng/hoc-sinh', {
          method: 'POST',
          than: {
            hoTen: oHoTen.value, gioiTinh: oGioiTinh.value, ngaySinh: oNgaySinh.value || null,
            lopNghe: oLopNghe.value, toHop: oToHop.value, toSo: oTo.value,
            lopId: PHAM_VI_LOP_ID || undefined,
          },
        });
        dongHopThoai();
        nhac('Đã thêm học sinh mới', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

export function xoaHocSinh(h, taiLai) {
  moHopThoai(`Xoá học sinh — ${h.hoTen}`, [
    e('p', null, `Bạn có chắc chắn muốn xoá học sinh "${h.hoTen}" (STT ${h.soThuTu || h.id}) khỏi danh sách lớp không?`),
    Object.assign(e('p'), {
      textContent: '⚠️ CẢNH BÁO: Toàn bộ dữ liệu điểm danh, điểm số, nhật ký và thông tin của học sinh này sẽ bị xoá vĩnh viễn khỏi hệ thống.',
      style: 'margin-top:8px;padding:10px;border-radius:8px;background:var(--xau-nen);border:1px solid var(--xau);color:var(--xau);font-size:13.5px;font-weight:600;'
    })
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Xoá vĩnh viễn', 'nut-xau', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        await api(apiTheoPhamVi('/api/gv/rieng/hoc-sinh?id=' + h.id), { method: 'DELETE' });
        dongHopThoai();
        nhac(`Đã xoá học sinh ${h.hoTen}`, 'tot');
        if (taiLai) taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

export const CAC_MUC_CONG_KHAI = [
  ['gioi-tinh', 'Giới tính'], ['ngay-sinh', 'Ngày sinh'], ['lop-nghe', 'Lớp nghề'],
  ['to-hop', 'Tổ hợp'], ['chuc-vu', 'Chức vụ'], ['to-so', 'Tổ'], ['dien-thoai-hs', 'Điện thoại học sinh'],
];

export function moCauHinhHienThiHocSinh() {
  api('/api/gv/rieng/cau-hinh-hoc-sinh').then((cfg) => {
    const boCongKhaiAn = new Set(cfg.congKhaiAn);

    const taoTich = (ma, nhan, daChon) => {
      const o = e('input'); o.type = 'checkbox'; o.checked = daChon;
      const l = e('label');
      l.style.cssText = 'display:flex;gap:9px;align-items:center;font-size:14px;font-weight:600;padding:5px 0';
      l.append(o, document.createTextNode(nhan));
      return [o, l];
    };

    const dsCongKhai = CAC_MUC_CONG_KHAI.map(([ma, nhan]) => [ma, ...taoTich(ma, nhan, !boCongKhaiAn.has(ma))]);

    moHopThoai('⚙ Tuỳ chỉnh hiển thị thông tin học sinh', [
      e('p', 'trong', 'Quyết định thông tin nào học sinh xem được — áp dụng cho mọi mã trong lớp.'),
      Object.assign(e('h3', null, '👁 Công khai giữa học sinh trong lớp (mọi học sinh xem được)'), { style: 'margin-top:14px' }),
      e('p', 'trong', 'Bỏ tích mục nào thì ẩn cột đó khỏi mọi nơi học sinh xem thông tin của nhau — "Danh sách lớp", bảng "Điểm danh" cả lớp và danh sách đóng quỹ ở "Thủ quỹ" (họ tên luôn hiện).'),
      ...dsCongKhai.map(([, , nhanO]) => nhanO),
    ], [
      nut('Huỷ', 'nut-nhe', dongHopThoai),
      nut('Lưu', '', async (ev) => {
        ev.currentTarget.disabled = true;
        try {
          const congKhaiAn = dsCongKhai.filter(([, o]) => !o.checked).map(([ma]) => ma);
          await api('/api/gv/rieng/cau-hinh-hoc-sinh', { method: 'PATCH', than: { congKhaiAn } });
          dongHopThoai();
          nhac('Đã lưu cấu hình hiển thị', 'tot');
        } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
      }),
    ]);
  }).catch((err) => nhac(err.message, 'xau'));
}

export async function trangHocSinh() {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api(apiTheoPhamVi('/api/gv/rieng/hoc-sinh'));
  let tim = '';

  function ve() {
    const khung = e('div');
    const cacNutPhai = [nut('+ Thêm học sinh', 'nut-vien nut-nho', () => themHocSinh(() => trangHocSinh()))];
    if (PHIEN.role === 'teacher') {
      cacNutPhai.unshift(nut('⚙ Tuỳ chỉnh hiển thị', 'nut-vien nut-nho', moCauHinhHienThiHocSinh));
    }
    khung.append(tieuDeTrang('Học sinh', `${d.danhSach.length} em đang học`, ...cacNutPhai));

    const o = oNhap('timHs', 'search', tim, 'Tìm theo họ tên…');
    o.addEventListener('input', (ev) => {
      tim = ev.target.value;
      veDanhSach();
    });
    khung.append(o);

    const hopDs = e('div', 'ds-the');
    hopDs.id = 'dsTheHs';
    hopDs.style.marginTop = '16px';
    khung.append(hopDs);
    datNoiDung(KHUNG, khung);
    veDanhSach();
  }

  function veDanhSach() {
    const q = tim.trim().toLowerCase();
    const ds = d.danhSach.filter((h) => !q || h.hoTen.toLowerCase().includes(q));
    const hop = $('#dsTheHs');

    if (!ds.length) return datNoiDung(hop, e('p', 'trong', 'Không có học sinh phù hợp.'));

    datNoiDung(hop, ...ds.map((h) => {
      const the = e('div', 'the-hs');
      the.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;';

      const khoiTrai = e('div');
      khoiTrai.style.cssText = 'display:flex;align-items:center;gap:12px;min-width:0;flex:1;cursor:pointer;';
      khoiTrai.append(e('div', 'chu-cai', (h.hoTen.trim().split(/\s+/).pop() || '?')[0].toUpperCase()));

      const noi = e('div', 'noi');
      const stt = h.soThuTu || h.id;
      noi.append(e('b', null, `${stt}. ${h.hoTen}`));
      // Luôn hiện ngày sinh — lopNghe/chucVu hiện bên phải thành nhãn riêng, không đè lên ngày sinh
      noi.append(e('small', null, ngayVN(h.ngaySinh) || ''));
      khoiTrai.append(noi);

      khoiTrai.addEventListener('click', () => { location.hash = '#/hoc-sinh/' + h.id; });

      const phai = e('div', 'canh-phai');
      phai.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end';

      // Nhãn bên phải: lớp nghề → chức vụ → tổ
      if (h.lopNghe) phai.append(e('span', 'nhan nhan-xam', h.lopNghe));
      if (h.chucVu) phai.append(e('span', 'nhan nhan-tot', h.chucVu));
      if (h.toSo) phai.append(e('span', 'nhan nhan-xam', 'Tổ ' + h.toSo));

      const nutXoa = e('button', 'nut-xoa-anh nut-nho', '🗑 Xoá');
      nutXoa.type = 'button';
      nutXoa.title = `Xoá học sinh ${h.hoTen}`;
      nutXoa.setAttribute('aria-label', `Xoá học sinh ${h.hoTen}`);
      nutXoa.style.cssText = 'font-size:12.5px;padding:3px 9px;min-height:30px;';
      nutXoa.addEventListener('click', (ev) => {
        ev.stopPropagation();
        xoaHocSinh(h, () => trangHocSinh());
      });

      phai.append(nutXoa);
      the.append(khoiTrai, phai);
      return the;
    }));
  }

  ve();
}

export const CAC_TAB_HO_SO = [
  ['chuyen-can', 'Chuyên cần'],
  ['phu-huynh', 'Phụ huynh'],
];

export async function trangHoSo(id, tabMacDinh) {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api(apiTheoPhamVi('/api/gv/rieng/hoc-sinh?id=' + encodeURIComponent(id)));
  const h = d.hocSinh;
  let tab = tabMacDinh || sessionStorage.getItem('hs-tab') || 'chuyen-can';
  if (!CAC_TAB_HO_SO.some(([ma]) => ma === tab)) tab = 'chuyen-can';

  const khung = e('div');
  // Quay lại ĐÚNG chỗ vừa đến (Tổng quan, Danh sách...), không phải luôn về Danh sách cố định
  // — nếu không, bấm nút Back thật của trình duyệt sau đó sẽ nhảy lung tung.
  const quayLai = nut('← Quay lại', 'nut-vien nut-nho', () => {
    if (history.length > 1) history.back(); else location.hash = '#/hoc-sinh';
  });
  khung.append(quayLai);
  // Liên hệ PH đặt ngay ở đầu trang (không phải kéo xuống tab Phụ huynh) — đúng lúc hay cần nhất
  // là ngay sau khi xem xong tình hình một em, kể cả trên điện thoại.
  khung.append(tieuDeTrang(h.hoTen, [h.lopNghe, 'Tổ hợp ' + (h.toHop || '—'), ngayVN(h.ngaySinh)].filter(Boolean).join(' · '),
    nut('📞 Liên hệ PH', 'nut-vien nut-nho', () => ghiLienHe(h, () => trangHoSo(id, 'phu-huynh')))
  ));

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
    ['Điện thoại học sinh', h.dienThoaiHs || '—'],
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
  const hangNutHs = e('div', 'day-loc day-loc-deu');
  hangNutHs.style.marginTop = '12px';
  hangNutHs.append(
    nut('Sửa hồ sơ', 'nut-vien nut-nho', () => suaHoSo(h)),
    nut('Đánh dấu đã nghỉ/chuyển trường', 'nut-nhe nut-nho', () => {
      moHopThoai('Đánh dấu đã nghỉ/chuyển trường?', e('p', null,
        `${h.hoTen} sẽ không còn hiện trong danh sách lớp và điểm danh, nhưng dữ liệu cũ vẫn được giữ lại.`), [
        nut('Huỷ', 'nut-nhe', dongHopThoai),
        nut('Xác nhận', 'nut-xau', async () => {
          try {
            await api('/api/gv/rieng/hoc-sinh', { method: 'PATCH', than: { id: h.id, dangHoc: false, lopId: PHAM_VI_LOP_ID || undefined } });
            dongHopThoai();
            nhac('Đã đánh dấu nghỉ/chuyển trường', 'tot');
            location.hash = '#/hoc-sinh';
          } catch (err) { nhac(err.message, 'xau'); }
        }),
      ]);
    }),
    nut('🗑 Xoá học sinh', 'nut-xau nut-nho', () => xoaHocSinh(h, () => { location.hash = '#/hoc-sinh'; }))
  );
  theHs.append(hangNutHs);
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

  // --- 4 tab: Chuyên cần / Học tập / Hạnh kiểm / Phụ huynh — cùng dữ liệu đã có, tổ chức lại
  // cách xem, không phải 4 trang riêng và không thêm tab Timeline. ---
  const hopTab = e('div', 'day-loc day-loc-deu');
  hopTab.id = 'ho-so-tab';
  hopTab.style.margin = '18px 0 14px';
  khung.append(hopTab);
  const noiDungTab = e('div');
  khung.append(noiDungTab);

  function veThanhTab() {
    datNoiDung(hopTab, ...CAC_TAB_HO_SO.map(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(tab === ma));
      b.addEventListener('click', () => {
        giuViTriCuonKhiVe('ho-so-tab', () => {
          tab = ma;
          sessionStorage.setItem('hs-tab', ma);
          veThanhTab();
          veNoiDungTab();
        });
      });
      return b;
    }));
  }

  function veChuyenCan() {
    const box = e('div');
    if (!d.diemDanh.length) {
      box.append(e('p', 'trong', 'Chưa có buổi nào được điểm danh.'));
      return box;
    }
    const lich = e('div', 'lich-nho');
    d.diemDanh.slice().reverse().forEach((x) => {
      const i = e('i', x.trangThai);
      i.title = `${ngayVN(x.ngay)} — ${(DIEM_DANH[x.trangThai] || {}).ten || x.trangThai}`;
      lich.append(i);
    });
    box.append(lich);

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
      box.append(ds);
    }
    return box;
  }

  async function vePhuHuynh() {
    const box = e('div');
    box.append(khoiDangTai());
    noiDungTab.replaceChildren(box);

    const dsLh = await api('/api/gv/rieng/lien-he?hocSinhId=' + h.id);
    if (tab !== 'phu-huynh') return;

    const noiDung = e('div');
    const dauLh = e('div', 'tieu-de-trang');
    dauLh.append(e('h2', null, 'Liên hệ phụ huynh'));
    const phaiLh = e('div', 'phai');
    phaiLh.append(nut('+ Ghi lần liên hệ', 'nut-vien nut-nho', () => ghiLienHe(h, () => trangHoSo(id, 'phu-huynh'))));
    dauLh.append(phaiLh);
    noiDung.append(dauLh);

    if (!dsLh.danhSach.length) {
      noiDung.append(e('p', 'trong', 'Chưa có lần liên hệ nào được ghi lại.'));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      dsLh.danhSach.forEach((lh) => ds.append(veMucLienHe(lh, () => trangHoSo(id, 'phu-huynh'))));
      noiDung.append(ds);
    }
    noiDungTab.replaceChildren(noiDung);
  }

  function veNoiDungTab() {
    if (tab === 'chuyen-can') return noiDungTab.replaceChildren(veChuyenCan());
    if (tab === 'phu-huynh') return vePhuHuynh();
  }

  veThanhTab();
  veNoiDungTab();

  datNoiDung(KHUNG, khung);
}

/* ================= Liên hệ phụ huynh ================= */

export const HINH_THUC_LIEN_HE = {
  goi_dien: 'Gọi điện', gap_truc_tiep: 'Gặp trực tiếp', nhan_tin: 'Nhắn tin', khac: 'Khác',
};

export function veMucLienHe(lh, taiLai) {
  const m = e('div', 'muc-nhat-ky khac');
  const dong = e('div', 'dong-dau');
  dong.append(
    e('span', 'nhan nhan-tim', HINH_THUC_LIEN_HE[lh.hinhThuc] || lh.hinhThuc),
    e('span', 'ngay', ngayVN(lh.ngay))
  );
  const viec = e('div', 'viec');
  viec.append(
    nut('✎', 'nut-nhe nut-nho', () => suaLienHe(lh, taiLai), `Sửa lần liên hệ ngày ${ngayVN(lh.ngay)}`),
    nut('✕', 'nut-nhe nut-nho', () => {
      moHopThoai('Xoá lần liên hệ này?', e('p', null, lh.noiDung), [
        nut('Huỷ', 'nut-nhe', dongHopThoai),
        nut('Xoá', 'nut-xau', async () => {
          try {
            await api('/api/gv/rieng/lien-he?id=' + lh.id, { method: 'DELETE' });
            dongHopThoai();
            nhac('Đã xoá', 'tot');
            taiLai();
          } catch (err) { nhac(err.message, 'xau'); }
        }),
      ]);
    }, `Xoá lần liên hệ ngày ${ngayVN(lh.ngay)}`)
  );
  dong.append(viec);
  m.append(dong, e('p', null, lh.noiDung));
  if (lh.ketQua) m.append(Object.assign(e('p', null, 'Kết quả: ' + lh.ketQua), { style: 'color:var(--chu-nhat);font-size:13px' }));
  return m;
}

export function ghiLienHe(hocSinh, taiLai) {
  const oNgay = oNhap('lhNgay', 'date', homNay());
  const oHinhThuc = oChon('lhHinhThuc', Object.entries(HINH_THUC_LIEN_HE), 'goi_dien');
  const oNoiDung = oNhap('lhNoiDung', 'textarea', '', 'Đã trao đổi gì với phụ huynh…');
  const oKetQua = oNhap('lhKetQua', 'text', '', 'Kết quả (không bắt buộc)');

  moHopThoai(`Ghi lần liên hệ — ${hocSinh.hoTen}`, [
    truong('Ngày', oNgay),
    truong('Hình thức', oHinhThuc),
    truong('Nội dung đã trao đổi', oNoiDung),
    truong('Kết quả', oKetQua),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      if (!oNoiDung.value.trim()) return nhac('Chưa nhập nội dung đã trao đổi', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/rieng/lien-he', {
          method: 'POST',
          than: { hocSinhId: hocSinh.id, ngay: oNgay.value, hinhThuc: oHinhThuc.value, noiDung: oNoiDung.value, ketQua: oKetQua.value },
        });
        dongHopThoai();
        nhac('Đã lưu', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

export function suaLienHe(lh, taiLai) {
  const oNgay = oNhap('slhNgay', 'date', lh.ngay);
  const oHinhThuc = oChon('slhHinhThuc', Object.entries(HINH_THUC_LIEN_HE), lh.hinhThuc);
  const oNoiDung = oNhap('slhNoiDung', 'textarea', lh.noiDung);
  const oKetQua = oNhap('slhKetQua', 'text', lh.ketQua || '', 'Kết quả (không bắt buộc)');

  moHopThoai('Sửa lần liên hệ', [
    truong('Ngày', oNgay),
    truong('Hình thức', oHinhThuc),
    truong('Nội dung đã trao đổi', oNoiDung),
    truong('Kết quả', oKetQua),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      if (!oNoiDung.value.trim()) return nhac('Nội dung không được để trống', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/rieng/lien-he', {
          method: 'PATCH',
          than: { id: lh.id, ngay: oNgay.value, hinhThuc: oHinhThuc.value, noiDung: oNoiDung.value, ketQua: oKetQua.value },
        });
        dongHopThoai();
        nhac('Đã lưu', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

export function suaHoSo(h) {
  const oHoTen = oNhap('sHoTen', 'text', h.hoTen, 'Họ và tên học sinh');
  const oChuc = oNhap('sChuc', 'text', h.chucVu, 'Lớp trưởng, tổ trưởng…');
  const oTo = oNhap('sTo', 'number', h.toSo ?? '', 'Số tổ');
  oTo.min = '1';
  oTo.step = '1';
  const oSdtHs = oNhap('sSdtHs', 'tel', h.dienThoaiHs, 'Điện thoại học sinh');
  const oSdt = oNhap('sSdt', 'tel', h.dienThoaiPh, 'Điện thoại phụ huynh');
  const oHc = oNhap('sHc', 'text', h.hoanCanh, 'Hộ cận nghèo, GĐ khó khăn…');
  const oGc = oNhap('sGc', 'textarea', h.ghiChu, 'Ghi chú riêng');

  moHopThoai('Sửa hồ sơ — ' + h.hoTen, [
    truong('Họ và tên', oHoTen, 'Sửa lại họ tên nếu có sai sót'),
    truong('Chức vụ', oChuc),
    truong('Tổ', oTo),
    truong('Điện thoại học sinh', oSdtHs, 'Có thể hiện cho học sinh trong lớp xem của nhau — bật ở "⚙ Tuỳ chỉnh hiển thị".'),
    truong('Điện thoại phụ huynh', oSdt, 'Luôn chỉ giáo viên chủ nhiệm xem được.'),
    truong('Hoàn cảnh', oHc),
    truong('Ghi chú', oGc),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      if (oTo.value && Number(oTo.value) < 1) return nhac('Số tổ phải từ 1 trở lên.', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/rieng/hoc-sinh', {
          method: 'PATCH',
          than: {
            id: h.id, hoTen: oHoTen.value.trim(), chucVu: oChuc.value, toSo: oTo.value,
            dienThoaiHs: oSdtHs.value, dienThoaiPh: oSdt.value, hoanCanh: oHc.value, ghiChu: oGc.value,
            lopId: PHAM_VI_LOP_ID || undefined,
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

/* ================= Trang: Thông báo ================= */
