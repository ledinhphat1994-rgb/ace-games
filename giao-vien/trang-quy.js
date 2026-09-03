/* Thủ quỹ lớp và trang Phân quyền (tài khoản đặc biệt). */
import { $, e, datNoiDung, api, homNay, ngayVN, tienVN, nhac, khoiDangTai } from '/assets/js/chung.js';
import {
  tieuDeTrang, oThongKe, nut, truong, oNhap, oChon, moHopThoai, dongHopThoai,
} from '/assets/js/giao-dien.js';

/* ================= Thủ quỹ ================= */

export async function trangQuy(KHUNG, khoanDangXem) {
  datNoiDung(KHUNG, khoiDangTai());
  let khoanId = khoanDangXem || null;

  async function ve() {
    if (khoanId) return veChiTietKhoan();
    const d = await api('/api/gv/quy');
    veTongQuan(d);
  }

  function veTongQuan(d) {
    const khung = e('div');
    khung.append(tieuDeTrang('Thủ quỹ lớp',
      `${d.siSo} học sinh · công thức: Tồn quỹ = Tổng đã thu − Tổng đã chi`,
      nut('🛡 Lịch sử & khôi phục', 'nut-vien', () => { location.hash = '#/quy-lich-su'; }),
      nut('+ Mở khoản thu mới', '', () => moKhoanMoi(ve))
    ));

    const day = e('div', 'day-so');
    day.append(
      oThongKe(tienVN(d.tonQuy), 'Tồn quỹ hiện tại', 'tot'),
      oThongKe(tienVN(d.tongThu), 'Tổng đã thu'),
      oThongKe(tienVN(d.tongChi), 'Tổng đã chi', 'luuy'),
      oThongKe(String(d.khoan.filter((k) => k.dangMo).length), 'Khoản đang mở')
    );
    khung.append(day);

    const theKhoan = e('div', 'the');
    theKhoan.style.marginTop = '16px';
    theKhoan.append(e('h3', null, 'Các khoản thu'));
    if (!d.khoan.length) {
      theKhoan.append(e('p', 'trong', 'Chưa có khoản thu nào. Bấm "Mở khoản thu mới" ở trên để bắt đầu.'));
    } else {
      const ds = e('div', 'ds-diem-danh');
      d.khoan.forEach((k) => {
        const hang = e('div', 'hang-hs');
        hang.style.cursor = 'pointer';
        const ten = e('div', 'ten');
        ten.append(e('b', null, k.ten), e('small', null,
          `${tienVN(k.soTienMoiEm)}/em · Học kì ${k.hocKy || 1} · đã thu ${tienVN(k.tongDaThu)}/${tienVN(k.tongCanThu)}`));
        hang.append(e('div', 'stt', '💰'), ten);
        if (!k.dangMo) hang.append(e('span', 'nhan nhan-xam', 'Đã đóng'));
        hang.addEventListener('click', () => { khoanId = k.id; ve(); });
        ds.append(hang);
      });
      theKhoan.append(ds);
    }
    khung.append(theKhoan);

    const theChi = e('div', 'the');
    theChi.style.marginTop = '14px';
    const dauChi = e('div', 'tieu-de-trang');
    dauChi.append(e('h2', null, 'Khoản chi'));
    const phaiChi = e('div', 'phai');
    phaiChi.append(nut('+ Ghi khoản chi', 'nut-vien nut-nho', () => ghiKhoanChi(ve)));
    dauChi.append(phaiChi);
    theChi.append(dauChi);

    if (!d.chi.length) {
      theChi.append(e('p', 'trong', 'Chưa có khoản chi nào.'));
    } else {
      const boc = e('div', 'cuon-ngang');
      const bang = e('table');
      const dau = e('thead');
      const hd = e('tr');
      hd.append(e('th', null, 'Ngày'), e('th', null, 'Nội dung'), e('th', null, 'Số tiền'), e('th', null, ''));
      dau.append(hd);
      const than = e('tbody');
      d.chi.forEach((c) => {
        const tr = e('tr');
        tr.append(e('td', null, ngayVN(c.ngay)), e('td', null, c.noiDung), e('td', null, tienVN(c.soTien)));
        const tdNut = e('td');
        tdNut.append(nut('✕', 'nut-nhe nut-nho', () => {
          moHopThoai('Xoá khoản chi này?', e('p', null, c.noiDung + ' — ' + tienVN(c.soTien)), [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá', 'nut-xau', async () => {
              try {
                await api('/api/gv/quy?loai=chi&id=' + c.id, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá', 'tot');
                ve();
              } catch (err) { nhac(err.message, 'xau'); }
            }),
          ]);
        }));
        tr.append(tdNut);
        than.append(tr);
      });
      bang.append(dau, than);
      boc.append(bang);
      theChi.append(boc);
    }
    khung.append(theChi);

    datNoiDung(KHUNG, khung);
  }

  async function veChiTietKhoan() {
    const d = await api('/api/gv/quy?khoanId=' + khoanId);
    const khung = e('div');
    khung.append(nut('← Tất cả các khoản', 'nut-nhe nut-nho', () => { khoanId = null; ve(); }));
    khung.append(tieuDeTrang(d.khoan.ten,
      `${tienVN(d.khoan.soTienMoiEm)}/em · Học kì ${d.khoan.hocKy || 1}`,
      nut('✕ Xoá khoản này', 'nut-vien nut-nho', () => {
        moHopThoai('Xoá cả khoản thu này?', e('p', null,
          'Toàn bộ số tiền đã ghi cho từng em trong khoản "' + d.khoan.ten + '" sẽ mất. Không thể hoàn tác.'), [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá', 'nut-xau', async () => {
            try {
              await api('/api/gv/quy?loai=khoan&id=' + khoanId, { method: 'DELETE' });
              dongHopThoai();
              nhac('Đã xoá khoản thu', 'tot');
              khoanId = null;
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          }),
        ]);
      })
    ));

    const day = e('div', 'day-so');
    day.append(
      oThongKe(tienVN(d.tongDaThu), 'Đã thu', 'tot'),
      oThongKe(tienVN(d.tongCanThu), 'Cần thu'),
      oThongKe(`${d.soEmDaDuDinh}/${d.danhSach.length}`, 'Em đã đóng đủ', d.soEmDaDuDinh === d.danhSach.length ? 'tot' : 'luuy')
    );
    khung.append(day);

    const the = e('div', 'the');
    the.style.marginTop = '16px';
    const ds = e('div', 'ds-diem-danh');
    d.danhSach.forEach((h) => {
      const hang = e('div', 'hang-hs');
      const ten = e('div', 'ten');
      ten.append(e('b', null, h.hoTen), e('small', null,
        h.daDuDinh ? `Đã đóng đủ ${tienVN(h.daDong)}` : `Đã đóng ${tienVN(h.daDong)} · còn thiếu ${tienVN(h.conThieu)}`));
      hang.append(e('div', 'stt', h.hocSinhId), ten);
      if (h.daDuDinh) hang.append(e('span', 'nhan nhan-tot', 'Đủ'));
      hang.append(nut('+ Ghi thu', 'nut-vien nut-nho', () => ghiKhoanDong(khoanId, h, ve)));
      ds.append(hang);
    });
    the.append(ds);
    khung.append(the);

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

function moKhoanMoi(taiLai) {
  const oTen = oNhap('qTen', 'text', '', 'Ví dụ: Quỹ lớp học kì 1');
  const oSoTien = oNhap('qSoTien', 'number', '50000');
  const oHk = oChon('qHk', [[1, 'Học kì 1'], [2, 'Học kì 2']], 1);
  const oGc = oNhap('qGc', 'textarea', '', 'Ghi chú (không bắt buộc)');

  moHopThoai('Mở khoản thu mới', [
    truong('Tên khoản thu', oTen),
    truong('Mức thu mỗi em (đồng)', oSoTien),
    truong('Học kì', oHk),
    truong('Ghi chú', oGc),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Tạo khoản thu', '', async (ev) => {
      if (!oTen.value.trim()) return nhac('Chưa nhập tên khoản thu', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/quy', {
          method: 'POST',
          than: { hanhDong: 'tao_khoan', ten: oTen.value, soTienMoiEm: Number(oSoTien.value), hocKy: Number(oHk.value), ghiChu: oGc.value },
        });
        dongHopThoai();
        nhac('Đã tạo khoản thu', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

function ghiKhoanDong(khoanId, hocSinh, taiLai) {
  const oSoTien = oNhap('dSoTien', 'number', hocSinh.conThieu || '');
  const oNgay = oNhap('dNgay', 'date', homNay());
  const oGc = oNhap('dGc', 'text', '', 'Ghi chú (không bắt buộc)');

  moHopThoai(`Ghi thu — ${hocSinh.hoTen}`, [
    truong('Số tiền (đồng)', oSoTien, hocSinh.conThieu ? `Còn thiếu ${tienVN(hocSinh.conThieu)}` : ''),
    truong('Ngày đóng', oNgay),
    truong('Ghi chú', oGc),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Ghi nhận', '', async (ev) => {
      const soTien = Number(oSoTien.value);
      if (!soTien || soTien <= 0) return nhac('Số tiền không hợp lệ', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/quy', {
          method: 'POST',
          than: { hanhDong: 'ghi_dong', khoanId, hocSinhId: hocSinh.hocSinhId, soTien, ngay: oNgay.value, ghiChu: oGc.value },
        });
        dongHopThoai();
        nhac('Đã ghi nhận', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

function ghiKhoanChi(taiLai) {
  const oNoiDung = oNhap('cNoiDung', 'text', '', 'Ví dụ: Mua hoa 20/11');
  const oSoTien = oNhap('cSoTien', 'number', '');
  const oNgay = oNhap('cNgay', 'date', homNay());
  const oGc = oNhap('cGc', 'text', '', 'Ghi chú (không bắt buộc)');

  moHopThoai('Ghi khoản chi', [
    truong('Nội dung chi', oNoiDung),
    truong('Số tiền (đồng)', oSoTien),
    truong('Ngày chi', oNgay),
    truong('Ghi chú', oGc),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Ghi nhận', '', async (ev) => {
      if (!oNoiDung.value.trim()) return nhac('Chưa nhập nội dung chi', 'xau');
      const soTien = Number(oSoTien.value);
      if (!soTien || soTien <= 0) return nhac('Số tiền không hợp lệ', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/quy', {
          method: 'POST',
          than: { hanhDong: 'ghi_chi', noiDung: oNoiDung.value, soTien, ngay: oNgay.value, ghiChu: oGc.value },
        });
        dongHopThoai();
        nhac('Đã ghi khoản chi', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

/* ================= Phân quyền (tài khoản đặc biệt) ================= */

export async function trangPhanQuyen(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const d = await api('/api/gv/tai-khoan-phu');
    const khung = e('div');

    const dau = e('div', 'tieu-de-trang');
    const trai = e('div');
    trai.append(e('h1', null, 'Phân quyền'),
      e('p', null, 'Cấp mã riêng cho lớp trưởng, thủ quỹ... chỉ được làm đúng việc được giao.'));
    const phai = e('div', 'phai');
    phai.append(nut('+ Cấp tài khoản mới', '', () => taoTaiKhoan(d.cacQuyen, ve)));
    dau.append(trai, phai);
    khung.append(dau);

    if (!d.danhSach.length) {
      khung.append(e('div', 'the trong', 'Chưa cấp tài khoản đặc biệt nào. Mọi việc hiện chỉ giáo viên chủ nhiệm thao tác được.'));
    } else {
      const ds = e('div', 'ds-the');
      d.danhSach.forEach((tk) => {
        const the = e('div', 'the');
        const dau2 = e('div');
        dau2.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;gap:10px';
        const trai2 = e('div');
        trai2.append(e('h3', null, tk.ten + (tk.vaiTro ? ' — ' + tk.vaiTro : '')));
        if (!tk.dangHoatDong) trai2.append(e('span', 'nhan nhan-xam', 'Đã khoá'));
        dau2.append(trai2);
        the.append(dau2);

        const oQuyen = e('div', 'day-loc');
        oQuyen.style.marginTop = '8px';
        tk.quyen.forEach((q) => {
          const ten = (d.cacQuyen.find((x) => x[0] === q) || [q, q])[1].split(' — ')[0];
          oQuyen.append(e('span', 'nhan nhan-tim', ten));
        });
        the.append(oQuyen);

        const maHop = e('p');
        maHop.style.cssText = 'margin-top:10px;font-size:15px';
        const maChu = e('code', null, tk.ma);
        maChu.style.cssText = 'font-size:16px;font-weight:700;letter-spacing:1px';
        maHop.append(document.createTextNode('Mã: '), maChu);
        the.append(maHop);

        const nutHang = e('div', 'day-loc');
        nutHang.style.marginTop = '10px';
        nutHang.append(
          nut(tk.dangHoatDong ? 'Khoá lại' : 'Mở lại', 'nut-vien nut-nho', async () => {
            try {
              await api('/api/gv/tai-khoan-phu', { method: 'PATCH', than: { id: tk.id, dangHoatDong: !tk.dangHoatDong } });
              nhac(tk.dangHoatDong ? 'Đã khoá tài khoản' : 'Đã mở lại tài khoản', 'tot');
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          }),
          nut('Cấp lại mã', 'nut-vien nut-nho', () => {
            moHopThoai('Cấp lại mã mới?', e('p', null,
              'Mã cũ "' + tk.ma + '" sẽ không dùng được nữa. Dùng khi nghi ngờ mã bị lộ.'), [
              nut('Huỷ', 'nut-nhe', dongHopThoai),
              nut('Cấp lại', '', async () => {
                try {
                  const kq = await api('/api/gv/tai-khoan-phu', { method: 'PATCH', than: { id: tk.id, capLaiMa: true } });
                  dongHopThoai();
                  nhac('Mã mới: ' + kq.ma, 'tot');
                  ve();
                } catch (err) { nhac(err.message, 'xau'); }
              }),
            ]);
          }),
          nut('Xoá hẳn', 'nut-nhe nut-nho', () => {
            moHopThoai('Xoá hẳn tài khoản này?', e('p', null, tk.ten + ' sẽ không đăng nhập được nữa.'), [
              nut('Huỷ', 'nut-nhe', dongHopThoai),
              nut('Xoá', 'nut-xau', async () => {
                try {
                  await api('/api/gv/tai-khoan-phu?id=' + tk.id, { method: 'DELETE' });
                  dongHopThoai();
                  nhac('Đã xoá', 'tot');
                  ve();
                } catch (err) { nhac(err.message, 'xau'); }
              }),
            ]);
          })
        );
        the.append(nutHang);
        ds.append(the);
      });
      khung.append(ds);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

function taoTaiKhoan(cacQuyen, taiLai) {
  const oTen = oNhap('tkTen', 'text', '', 'Họ tên người được cấp quyền');
  const oVaiTro = oNhap('tkVaiTro', 'text', '', 'Ví dụ: Thủ quỹ, Lớp trưởng…');

  const hopQuyen = e('div');
  const quyenDaChon = new Set();
  cacQuyen.forEach(([ma, moTa]) => {
    const nhan = e('label');
    nhan.style.cssText = 'display:flex;gap:9px;align-items:flex-start;padding:8px 0;font-size:14.5px;cursor:pointer';
    const cb = e('input');
    cb.type = 'checkbox';
    cb.style.marginTop = '3px';
    cb.addEventListener('change', () => { cb.checked ? quyenDaChon.add(ma) : quyenDaChon.delete(ma); });
    const phanTach = moTa.split(' — ');
    const tieuDe = phanTach[0];
    const moTaChiTiet = phanTach[1] || '';
    const chu = e('div');
    chu.append(e('div', null, tieuDe), Object.assign(e('div', 'trong', moTaChiTiet), { style: 'font-size:12.5px' }));
    nhan.append(cb, chu);
    hopQuyen.append(nhan);
  });

  moHopThoai('Cấp tài khoản mới', [
    truong('Họ và tên', oTen),
    truong('Vai trò (chỉ để hiển thị)', oVaiTro),
    Object.assign(e('div', 'nhan-nhap', 'Được phép làm những việc sau'), { style: 'margin-top:6px' }),
    hopQuyen,
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Cấp tài khoản', '', async (ev) => {
      if (!oTen.value.trim()) return nhac('Chưa nhập tên', 'xau');
      if (!quyenDaChon.size) return nhac('Chọn ít nhất một việc được phép làm', 'xau');
      ev.currentTarget.disabled = true;
      try {
        const kq = await api('/api/gv/tai-khoan-phu', {
          method: 'POST',
          than: { ten: oTen.value, vaiTro: oVaiTro.value, quyen: [...quyenDaChon] },
        });
        dongHopThoai();
        nhac(`Đã cấp tài khoản. Mã: ${kq.ma}`, 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

/* ================= Lịch sử & khôi phục Thủ quỹ ================= */

/** D1 lưu giờ UTC — cộng 7 tiếng để hiện đúng giờ Việt Nam. */
function taoLucVN(taoLuc) {
  const d = new Date(taoLuc.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return taoLuc;
  d.setHours(d.getHours() + 7);
  const gio = String(d.getHours()).padStart(2, '0');
  const phut = String(d.getMinutes()).padStart(2, '0');
  return `${gio}:${phut} ${ngayVN(d.toISOString().slice(0, 10))}`;
}

export async function trangQuyLichSu(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const [d, phienD] = await Promise.all([
      api('/api/gv/quy-checkpoint'),
      api('/api/whoami').catch(() => ({ role: '' })),
    ]);
    const laGiaoVien = phienD.role === 'teacher';

    const khung = e('div');
    khung.append(nut('← Về Thủ quỹ', 'nut-nhe nut-nho', () => { location.hash = '#/quy'; }));
    khung.append(tieuDeTrang('Lịch sử & khôi phục Thủ quỹ',
      'Mỗi lần ghi thu, ghi chi hoặc xoá đều tự động lưu một điểm khôi phục ngay trước đó.'));

    const the = e('div', 'the');
    the.style.borderColor = 'var(--chinh)';
    the.append(
      e('h3', null, laGiaoVien ? 'Nếu tài khoản bị lộ hoặc dữ liệu sai' : 'Chỉ giáo viên chủ nhiệm mới khôi phục được'),
      e('p', null, laGiaoVien
        ? 'Chọn đúng thời điểm trước khi sự cố xảy ra, bấm "Khôi phục về đây". Toàn bộ khoản thu, khoản đã đóng và khoản chi sẽ trở về đúng như lúc đó. Bản thân việc khôi phục cũng được lưu lại một điểm mới, nên nếu chọn nhầm vẫn quay lại được.'
        : 'Tài khoản đặc biệt (kể cả Thủ quỹ) chỉ xem được lịch sử này, không tự khôi phục được — tránh trường hợp một mã bị lộ rồi tự xoá dấu vết.')
    );
    khung.append(the);

    if (!d.danhSach.length) {
      khung.append(e('p', 'trong', 'Chưa có điểm khôi phục nào — sẽ tự xuất hiện khi có thao tác đầu tiên trên Thủ quỹ.'));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      d.danhSach.forEach((cp) => {
        const m = e('div', 'muc-nhat-ky khac');
        const dong = e('div', 'dong-dau');
        dong.append(e('span', 'ngay', taoLucVN(cp.taoLuc)), e('span', 'nhan nhan-xam', cp.nguoiThucHien));
        if (laGiaoVien) {
          const viec = e('div', 'viec');
          viec.append(nut('Khôi phục về đây', 'nut-nho nut-xau', () => {
            moHopThoai('Khôi phục Thủ quỹ về điểm này?', [
              e('p', null, cp.hanhDong),
              Object.assign(e('p', null, `Lúc: ${taoLucVN(cp.taoLuc)}`), { style: 'color:var(--chu-nhat)' }),
              e('p', null, 'Mọi thay đổi về khoản thu, khoản đã đóng, khoản chi sau thời điểm này sẽ mất. Chắc chắn chứ?'),
            ], [
              nut('Huỷ', 'nut-nhe', dongHopThoai),
              nut('Khôi phục ngay', 'nut-xau', async (ev) => {
                ev.currentTarget.disabled = true;
                try {
                  await api('/api/gv/quy-checkpoint', { method: 'POST', than: { id: cp.id } });
                  dongHopThoai();
                  nhac('Đã khôi phục Thủ quỹ', 'tot');
                  ve();
                } catch (err) {
                  nhac(err.message, 'xau');
                  ev.currentTarget.disabled = false;
                }
              }),
            ]);
          }));
          dong.append(viec);
        }
        m.append(dong, e('p', null, cp.hanhDong));
        ds.append(m);
      });
      khung.append(ds);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}
