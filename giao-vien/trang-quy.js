import { e, datNoiDung, api, homNay, ngayVN, ngayDayDu, tienVN, nhac, khoiDangTai, layThongTinVaiTro, layNhanTaiKhoan, ganTooltipNoi, giuViTriCuonKhiVe } from '/assets/js/chung.js';
import {
  tieuDeTrang, oThongKe, nut, truong, oNhap, oChon, moHopThoai, dongHopThoai,
} from '/assets/js/giao-dien.js';

/* Helper tạo biểu tượng SVG sắc nét, chuẩn vector */
function taoSvgIcon(pathD, w = 14, h = 14) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  return svg;
}

/* Khối nhãn "Mở rộng"/"Thu gọn" + icon tròn to (dùng lại đúng kiểu .nhan-mo-rong/.mui-ten-chi-tiet
   bên trang học sinh) — gộp cả 2 vào 1 khối để không bị justify-content:space-between (mobile)
   tách nhãn ra xa icon. */
function khoiMoRongHang(daMo) {
  const khoi = e('div', 'khoi-mo-rong-hang');
  khoi.append(
    e('span', 'nhan-mo-rong', daMo ? 'Thu gọn' : 'Mở rộng'),
    e('span', 'mui-ten-chi-tiet', daMo ? '▾' : '▸')
  );
  return khoi;
}

const ICON_QUYEN = {
  'diem-danh': '✅',
  quy: '🪙',
  'thong-bao': '📢',
  'thoi-khoa-bieu': '🕒',
  'hinh-anh': '📸',
  'am-thanh': '♪',
  video: '🎬',
  'hoat-dong-lop': '🌿',
  'hoc-sinh': '👥',
};

/* ================= Thủ quỹ — 1 trang, mở rộng tại chỗ, sửa được mọi bản ghi ================= */

export async function trangQuy(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());
  // Chỉ giáo viên chủ nhiệm mới tạo được "Thu cố định" (chuỗi nhiều kỳ) — tài khoản thủ quỹ
  // (phu) chỉ tạo được khoản thu LINH HOẠT từng khoản đơn (xem moKhoanMoi bên dưới).
  const phienQuy = await api('/api/whoami').catch(() => ({ role: 'teacher' }));
  const laGiaoVienQuy = phienQuy.role === 'teacher';
  let d = null;                 // tổng quan
  let tabHienTai = 'thu';       // 'thu' | 'chi' — tách biệt hai khu vực thu và chi
  let moRong = null;            // id khoản đang mở rộng (accordion) — chỉ 1 khoản mở cùng lúc
  const chiTiet = {};           // cache: { [khoanId]: dữ liệu chi tiết }
  const locToTheoKhoan = {};    // { [khoanId]: '' | soTo } — lọc tổ đang chọn trong từng khoản
  const khoanDaChon = new Set();   // id các khoản thu đang tích để xoá hàng loạt
  const chiDaChon = new Set();     // id các khoản chi đang tích để xoá hàng loạt
  const nhomMoRong = new Set();    // id các mẫu "Thu cố định" đang mở rộng (xem từng kỳ bên trong)

  /** Gộp danh sách khoản thu: các kỳ cùng một mẫu "Thu cố định" gộp thành MỘT nhóm, khoản
      "Thu linh động" (không thuộc mẫu nào) giữ nguyên từng dòng riêng — tránh liệt kê phẳng hàng
      chục dòng trông rất giống nhau (chỉ khác số kỳ) khiến khó phân biệt/quan sát. */
  function nhomTheoDinhKy(danhSachKhoan) {
    const daGom = new Set();
    const ketQua = [];
    danhSachKhoan.forEach((k) => {
      if (!k.dinhKyId) { ketQua.push({ loai: 'don', khoan: k }); return; }
      if (daGom.has(k.dinhKyId)) return;
      daGom.add(k.dinhKyId);
      const thanhVien = danhSachKhoan.filter((x) => x.dinhKyId === k.dinhKyId);
      ketQua.push({ loai: 'nhom', dinhKyId: k.dinhKyId, thanhVien });
    });
    return ketQua;
  }

  /** Thanh "Đã chọn N ... — Bỏ chọn / Xoá đã chọn", chỉ hiện khi có mục nào đang tích. */
  function veThanhChonXoa(daChon, loai, tenSo, taiLaiFn) {
    if (!daChon.size) return null;
    const thanh = e('div', 'the');
    thanh.style.cssText = 'margin-bottom:10px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-color:var(--xau)';
    thanh.append(e('span', null, `Đã chọn ${daChon.size} ${tenSo}`));
    const hop = e('div', 'day-loc day-loc-deu');
    hop.append(
      nut('Bỏ chọn', 'nut-nhe nut-nho', () => { daChon.clear(); ve(); }),
      nut(`🗑 Xoá ${daChon.size} mục đã chọn`, 'nut-xau nut-nho', () => {
        moHopThoai(`Xoá ${daChon.size} ${tenSo} đã chọn?`, [
          e('p', null, loai === 'khoan'
            ? `Toàn bộ số tiền đã ghi cho từng em trong ${daChon.size} khoản này sẽ mất theo. Không thể hoàn tác.`
            : `${daChon.size} khoản chi đã chọn sẽ bị xoá. Không thể hoàn tác.`),
        ], [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá', 'nut-xau', async (ev) => {
            // "currentTarget" chỉ tồn tại TRONG LÚC sự kiện đang lan truyền — qua khỏi "await" là bị
            // trình duyệt đặt lại thành null, nên phải lưu tham chiếu nút TRƯỚC khi chờ.
            const nutBam = ev.currentTarget;
            nutBam.disabled = true;
            try {
              await api(`/api/gv/quy?loai=${loai}&ids=${[...daChon].join(',')}`, { method: 'DELETE' });
              dongHopThoai();
              nhac('Đã xoá', 'tot');
              daChon.clear();
              if (loai === 'khoan') moRong = null;
              await taiLaiFn();
            } catch (err) {
              nhac(err.message, 'xau');
              nutBam.disabled = false;
            }
          }),
        ]);
      })
    );
    thanh.append(hop);
    return thanh;
  }

  /** Nút xoá SẠCH cả danh mục (thu hoặc chi) — chỉ hiện khi danh sách không rỗng. */
  function nutXoaTatCa(soLuong, loai, tenSo, taiLaiFn) {
    if (!soLuong) return null;
    return nut('🗑 Xoá tất cả', 'nut-nhe nut-nho', () => {
      moHopThoai(`Xoá TẤT CẢ ${tenSo}?`, [
        e('p', null, loai === 'khoan'
          ? `Toàn bộ ${soLuong} khoản thu VÀ toàn bộ số tiền đã ghi cho từng em trong các khoản đó sẽ mất hết. Không thể hoàn tác.`
          : `Toàn bộ ${soLuong} khoản chi sẽ mất hết. Không thể hoàn tác.`),
        e('p', 'trong', 'Nếu chọn nhầm, vào "🛡️ Lịch sử & khôi phục" để khôi phục lại đúng thời điểm trước khi xoá.'),
      ], [
        nut('Huỷ', 'nut-nhe', dongHopThoai),
        nut(`Xoá tất cả ${tenSo}`, 'nut-xau', async (ev) => {
          const nutBam = ev.currentTarget;
          nutBam.disabled = true;
          try {
            await api(`/api/gv/quy?loai=${loai}&tatCa=1`, { method: 'DELETE' });
            dongHopThoai();
            nhac(`Đã xoá tất cả ${tenSo}`, 'tot');
            if (loai === 'khoan') { moRong = null; khoanDaChon.clear(); } else { chiDaChon.clear(); }
            await taiLaiFn();
          } catch (err) {
            nhac(err.message, 'xau');
            nutBam.disabled = false;
          }
        }),
      ]);
    });
  }

  async function tai() {
    d = await api('/api/gv/quy');
    ve();
  }

  async function taiChiTiet(id) {
    chiTiet[id] = await api('/api/gv/quy?khoanId=' + id);
  }

  async function moKhoan(id) {
    // ve() vẽ lại TOÀN BỘ trang — nếu đang mở 1 khoản dài rồi bấm thu gọn, trang co lại đột
    // ngột khiến trình duyệt tự kéo cuộn lên, cảm giác "nhảy về mặc định". Ghim đúng thẻ khoản
    // này đứng yên trên màn hình trong lúc vẽ lại để tránh việc đó.
    await giuViTriCuonKhiVe('khoan-' + id, async () => {
      moRong = moRong === id ? null : id;
      if (moRong && !chiTiet[moRong]) await taiChiTiet(moRong);
      ve();
    });
  }

  async function lamMoiKhoanDangMo() {
    await Promise.all([tai(), moRong ? taiChiTiet(moRong) : Promise.resolve()]);
    ve();
  }

  function veHangKhoan(k) {
    const boc = e('div', 'muc-khoan muc-khoan-thu card-khoan-thu' + (moRong === k.id ? ' dang-mo' : ''));
    boc.id = 'khoan-' + k.id;
    const hang = e('div', 'hang-hs hang-hs-doc hang-khoan-thu');
    hang.style.cursor = 'pointer';

    const dong1 = e('div', 'hang-hs-dong1');
    const khoiTrai = e('div', 'hs-khoi-trai');

    const oChonXoa = e('input');
    oChonXoa.type = 'checkbox';
    oChonXoa.checked = khoanDaChon.has(k.id);
    oChonXoa.setAttribute('aria-label', 'Chọn khoản thu "' + k.ten + '" để xoá hàng loạt');
    oChonXoa.style.cssText = 'width:18px;height:18px;flex:none;cursor:pointer;accent-color:var(--xau)';
    oChonXoa.addEventListener('click', (ev) => ev.stopPropagation());
    oChonXoa.addEventListener('change', () => {
      if (oChonXoa.checked) khoanDaChon.add(k.id); else khoanDaChon.delete(k.id);
      ve();
    });
    khoiTrai.append(oChonXoa);

    khoiTrai.append(e('div', 'stt hs-icon-khoan', k.dinhKyId ? '🔁' : '💰'));

    const thongTin = e('div', 'hs-thong-tin');
    const dongTen = e('div', 'hs-ten-to');
    dongTen.append(e('span', 'hs-ho-ten', k.ten));
    if (!k.dinhKyId) dongTen.append(e('span', 'hs-to-badge badge-nhanh', '⚡ Thu linh động'));
    thongTin.append(dongTen);
    const phanTram = k.tongCanThu ? Math.round((k.tongDaThu / k.tongCanThu) * 100) : 0;
    const dongChiTiet = e('div', 'hs-chi-tiet-dong');
    dongChiTiet.append(e('span', 'pill-muc-thu', `${tienVN(k.soTienMoiEm)}/em`));
    if (k.ngayBatDau && !k.dinhKyId) {
      dongChiTiet.append(
        e('span', 'cham-cach', '·'),
        e('span', 'thoi-gian-thu', `📅 ${ngayVN(k.ngayBatDau)}–${ngayVN(k.ngayKetThuc)}`)
      );
    }
    // "Đã thu X/Y (Z%)" bỏ khỏi đây — lặp với badge trạng thái bên phải (rê chuột vào đó xem
    // đủ chi tiết qua tooltip), để dòng tóm tắt đỡ dài.
    thongTin.append(dongChiTiet);
    khoiTrai.append(thongTin);
    dong1.append(khoiTrai);

    // Badge trạng thái ở góc phải: NGẮN GỌN, rê chuột/chạm mới hiện tooltip đủ số liệu (đã thu
    // bao nhiêu/mục tiêu, còn thiếu, bao nhiêu em đã đủ) — thay cho việc hiện sẵn khối 4 ô số
    // liệu + "Theo tổ" thường trực mỗi khi mở rộng khoản.
    const tongEm = (k.soEmDaDu || 0) + (k.soEmChuaDu || 0);
    const conThieu = Math.max(0, (k.tongCanThu || 0) - (k.tongDaThu || 0));
    const chiTietBadge = `Đã thu ${tienVN(k.tongDaThu)}/${tienVN(k.tongCanThu)} — còn thiếu ${tienVN(conThieu)} · ${k.soEmDaDu || 0}/${tongEm} em đã đủ`;

    let nhanTrangThai;
    if (!k.dangMo) {
      nhanTrangThai = e('span', 'nhan nhan-xam', 'Đã đóng');
    } else if (phanTram >= 100) {
      nhanTrangThai = e('span', 'nhan nhan-tot', '✓ Đã thu đủ');
    } else {
      nhanTrangThai = e('span', 'nhan nhan-chinh', `Thu ${phanTram}%`);
    }
    // Badge trạng thái — RIÊNG một khối nhỏ chỉ bọc đúng cái nhãn này (không gộp chung với
    // nhãn "Mở rộng"/mũi tên bên dưới), để tooltip định vị đúng ngay sát chỗ rê chuột/chạm,
    // không lệch ra xa theo nhãn mở rộng nằm cạnh nó.
    const oBadge = e('div', 'badge-trang-thai-khoan');
    oBadge.tabIndex = 0;
    oBadge.setAttribute('role', 'button');
    oBadge.setAttribute('aria-label', chiTietBadge);
    oBadge.append(nhanTrangThai, e('div', 'tien-do-tooltip', chiTietBadge));
    ganTooltipNoi(oBadge, true);

    // Nhãn "Mở rộng"/"Thu gọn" + icon to hơn (cùng kiểu ".mui-ten-chi-tiet"/".nhan-mo-rong" bên
    // trang học sinh) để dễ nhận ra đây là khối bấm mở rộng được, không chỉ mỗi mũi tên bé.
    // Gộp nhãn+icon vào 1 khối (khoi-mo-rong-hang) để không bị justify-content:space-between
    // (mobile) tách rời nhau.
    const khoiPhai = e('div', 'hs-khoi-phai');
    khoiPhai.append(oBadge, khoiMoRongHang(moRong === k.id));
    dong1.append(khoiPhai);

    // Thanh tiến độ mini trực quan trên card — rê chuột/chạm hiện tooltip đủ số liệu, giống hệt
    // badge trạng thái bên trên (dùng lại đúng chiTietBadge, đỡ phải hiện khối số liệu riêng
    // trong phần chi tiết mở rộng nữa).
    const thanhTienDoNho = e('div', 'thanh-tien-do-khoan-nho');
    thanhTienDoNho.tabIndex = 0;
    thanhTienDoNho.setAttribute('role', 'button');
    thanhTienDoNho.setAttribute('aria-label', chiTietBadge);
    const chay = e('div', 'thanh-tien-do-chay');
    chay.style.width = Math.min(100, Math.max(0, phanTram)) + '%';
    if (phanTram >= 100) chay.classList.add('da-du');
    thanhTienDoNho.append(chay, e('div', 'tien-do-tooltip', chiTietBadge));
    ganTooltipNoi(thanhTienDoNho, false);

    hang.append(dong1, thanhTienDoNho);
    hang.addEventListener('click', () => moKhoan(k.id));
    boc.append(hang);

    if (moRong === k.id) {
      const chiTietBox = e('div', 'muc-khoan-chi-tiet');
      chiTietBox.append(chiTiet[k.id] ? veChiTietKhoan(k.id, chiTiet[k.id]) : khoiDangTai());
      boc.append(chiTietBox);
    }
    return boc;
  }

  /** Một nhóm "Thu cố định" — thẻ tóm tắt cả đợt (tên, số kỳ, tổng đã thu), bấm vào để mở
      rộng xem TỪNG kỳ bên trong (mỗi kỳ vẫn dùng đúng veHangKhoan() như một khoản bình
      thường — có thể tích chọn, bấm mở chi tiết từng em như cũ). */
  function veNhomDinhKy(nhom) {
    const { dinhKyId, thanhVien } = nhom;
    const dauTien = thanhVien[0];
    const dangMo = nhomMoRong.has(dinhKyId);

    const boc = e('div', 'muc-khoan muc-khoan-thu card-khoan-thu nhom-dinh-ky' + (dangMo ? ' dang-mo' : ''));
    boc.id = 'nhom-' + dinhKyId;
    const hang = e('div', 'hang-hs hang-hs-doc hang-khoan-thu');
    hang.style.cursor = 'pointer';

    const dong1 = e('div', 'hang-hs-dong1');
    const khoiTrai = e('div', 'hs-khoi-trai');

    const oChonNhom = e('input');
    oChonNhom.type = 'checkbox';
    const tatCaDaChon = thanhVien.every((k) => khoanDaChon.has(k.id));
    oChonNhom.checked = tatCaDaChon;
    oChonNhom.setAttribute('aria-label', `Chọn cả ${thanhVien.length} kỳ của "${dauTien.dinhKyTen}" để xoá hàng loạt`);
    oChonNhom.style.cssText = 'width:18px;height:18px;flex:none;cursor:pointer;accent-color:var(--xau)';
    oChonNhom.addEventListener('click', (ev) => ev.stopPropagation());
    oChonNhom.addEventListener('change', () => {
      thanhVien.forEach((k) => { if (oChonNhom.checked) khoanDaChon.add(k.id); else khoanDaChon.delete(k.id); });
      ve();
    });
    khoiTrai.append(oChonNhom);

    khoiTrai.append(e('div', 'stt hs-icon-khoan', '🔒'));

    const thongTin = e('div', 'hs-thong-tin');
    const dongTen = e('div', 'hs-ten-to');
    dongTen.append(e('span', 'hs-ho-ten', dauTien.dinhKyTen));
    dongTen.append(e('span', 'hs-to-badge badge-dinh-ky', 'Thu cố định'));
    thongTin.append(dongTen);

    const tongDaThu = thanhVien.reduce((a, k) => a + k.tongDaThu, 0);
    const tongCanThu = thanhVien.reduce((a, k) => a + k.tongCanThu, 0);
    const soKyDaDu = thanhVien.filter((k) => k.tongCanThu > 0 && k.tongDaThu >= k.tongCanThu).length;
    const phanTramNhom = tongCanThu ? Math.round((tongDaThu / tongCanThu) * 100) : 0;

    const dongChiTiet = e('div', 'hs-chi-tiet-dong');
    dongChiTiet.append(
      e('span', 'pill-muc-thu', `${CHU_KY_HIEN_THI[dauTien.dinhKyChuKy] || dauTien.dinhKyChuKy}`),
      e('span', 'cham-cach', '·'),
      e('span', null, `${thanhVien.length}/${dauTien.dinhKySoKy || thanhVien.length} kỳ`),
      e('span', 'cham-cach', '·'),
      e('span', 'so-tien-thu-duoc', `Đã thu ${tienVN(tongDaThu)}/${tienVN(tongCanThu)} (${phanTramNhom}%)`)
    );
    thongTin.append(dongChiTiet);
    khoiTrai.append(thongTin);
    dong1.append(khoiTrai);

    const khoiPhai = e('div', 'hs-khoi-phai');
    khoiPhai.append(e('span', 'nhan ' + (soKyDaDu === thanhVien.length ? 'nhan-tot' : 'nhan-chinh'),
      soKyDaDu === thanhVien.length ? '✓ Mọi kỳ đã đủ' : `${soKyDaDu}/${thanhVien.length} kỳ đã đủ`));
    khoiPhai.append(khoiMoRongHang(dangMo));
    dong1.append(khoiPhai);

    // Thanh tiến độ mini trực quan cho nhóm định kỳ — cũng rê chuột/chạm hiện tooltip số liệu
    // tổng, đồng bộ với khoản đơn lẻ.
    const chiTietNhom = `Đã thu ${tienVN(tongDaThu)}/${tienVN(tongCanThu)} · ${soKyDaDu}/${thanhVien.length} kỳ đã đủ`;
    const thanhTienDoNho = e('div', 'thanh-tien-do-khoan-nho');
    thanhTienDoNho.tabIndex = 0;
    thanhTienDoNho.setAttribute('role', 'button');
    thanhTienDoNho.setAttribute('aria-label', chiTietNhom);
    const chay = e('div', 'thanh-tien-do-chay');
    chay.style.width = Math.min(100, Math.max(0, phanTramNhom)) + '%';
    if (phanTramNhom >= 100) chay.classList.add('da-du');
    thanhTienDoNho.append(chay, e('div', 'tien-do-tooltip', chiTietNhom));
    ganTooltipNoi(thanhTienDoNho, false);

    hang.append(dong1, thanhTienDoNho);
    hang.addEventListener('click', () => {
      giuViTriCuonKhiVe('nhom-' + dinhKyId, () => {
        if (dangMo) nhomMoRong.delete(dinhKyId); else nhomMoRong.add(dinhKyId);
        ve();
      });
    });
    boc.append(hang);

    if (dangMo) {
      const dsKy = e('div', 'nhom-dinh-ky-chi-tiet');
      thanhVien.forEach((k) => dsKy.append(veHangKhoan(k)));
      boc.append(dsKy);
    }
    return boc;
  }

  function veChiTietKhoan(khoanId, dk) {
    const box = e('div');

    // Khoản này là một kỳ do mẫu "Thu cố định" sinh ra — chỉ hiện thông tin, không còn nút
    // dừng/tiếp tục nào nữa vì TOÀN BỘ số kỳ đã được tạo sẵn ngay lúc tạo mẫu (không phải sinh
    // dần như thiết kế cũ). Muốn bỏ kỳ nào thì xoá thẳng khoản đó bằng nút "Xoá khoản" bên dưới.
    if (dk.khoan.dinhKyId) {
      const tb = e('div', 'the trong');
      tb.style.cssText = 'margin-bottom:14px';
      tb.append(e('span', null,
        `🔁 Kỳ ${dk.khoan.kySo}/${dk.khoan.dinhKySoKy} của mẫu thu cố định "${dk.khoan.dinhKyTen}" `
        + `(${CHU_KY_HIEN_THI[dk.khoan.dinhKyChuKy] || dk.khoan.dinhKyChuKy}) — `
        + `${ngayVN(dk.khoan.ngayBatDau)}–${ngayVN(dk.khoan.ngayKetThuc)}.`));
      box.append(tb);
    }

    const hangNut = e('div', 'day-loc day-loc-deu');
    hangNut.style.margin = '2px 0 14px';
    hangNut.append(
      nut('✎ Sửa khoản', 'nut-vien nut-nho', () => suaKhoan(dk.khoan, lamMoiKhoanDangMo)),
      nut('🗑 Xoá khoản', 'nut-nhe nut-nho', () => {
        moHopThoai('Xoá cả khoản thu này?', e('p', null,
          `Toàn bộ số tiền đã ghi cho từng em trong khoản "${dk.khoan.ten}" sẽ mất. Không thể hoàn tác.`), [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá', 'nut-xau', async () => {
            try {
              await api('/api/gv/quy?loai=khoan&id=' + khoanId, { method: 'DELETE' });
              dongHopThoai();
              nhac('Đã xoá khoản thu', 'tot');
              delete chiTiet[khoanId];
              moRong = null;
              await tai();
            } catch (err) { nhac(err.message, 'xau'); }
          }),
        ]);
      })
    );
    box.append(hangNut);

    // Số liệu chi tiết (đã thu/mục tiêu/còn thiếu/em đủ) và thanh tiến độ giờ xem qua tooltip
    // của badge + thanh tiến độ mini ở hàng thu gọn (veHangKhoan) — trùng lặp nên bỏ khỏi đây.

    const dsTheoToUniq = [...new Set(dk.danhSach.map((h) => h.toSo).filter(Boolean))].sort((a, b) => a - b);
    const nhanTung = e('div', 'the-nhan', 'Từng em học sinh');
    nhanTung.style.margin = '16px 0 8px';
    box.append(nhanTung);

    let boLocTrangThai = ''; // '' | 'chua_dong' | 'con_thieu' | 'da_du'

    // Bộ lọc theo tổ nếu có nhiều tổ
    if (dsTheoToUniq.length > 1) {
      const oLoc = oChon('locTo' + khoanId,
        [['', 'Tất cả các tổ'], ...dsTheoToUniq.map((t) => [String(t), 'Tổ ' + t])],
        locToTheoKhoan[khoanId] || '');
      oLoc.style.cssText = 'width:auto;margin-bottom:10px';
      oLoc.addEventListener('change', () => { locToTheoKhoan[khoanId] = oLoc.value; veDsEm(); });
      box.append(oLoc);
    }

    const hopLocTrangThai = e('div', 'loc-trang-thai-quy');
    box.append(hopLocTrangThai);

    const hopDs = e('div', 'ds-diem-danh');
    box.append(hopDs);

    // Tạo 4 nút lọc DUY NHẤT MỘT LẦN — bấm chuyển bộ lọc chỉ đổi class "active" trên đúng các
    // nút có sẵn (không dựng lại toàn bộ nút mỗi lần bấm), tránh giật/nháy màn hình do nút vừa
    // bấm bị xoá khỏi DOM ngay giữa lúc xử lý sự kiện click của chính nó.
    function capNhatNutLoc() {
      const dsGoc = dk.danhSach;
      const soDaDu = dsGoc.filter((h) => h.daDuDinh).length;
      const soConThieu = dsGoc.filter((h) => !h.daDuDinh && h.daDong > 0).length;
      const soChuaDong = dsGoc.filter((h) => !h.daDuDinh && (!h.daDong || h.daDong === 0)).length;

      const capNhatActive = () => {
        cacNutLoc.forEach((b) => b.classList.toggle('active', b.dataset.loc === boLocTrangThai));
      };

      const taoNutLoc = (id, label, so) => {
        const b = e('button', null, `${label} (${so})`);
        b.type = 'button';
        b.dataset.loc = id;
        b.addEventListener('click', () => {
          boLocTrangThai = id;
          capNhatActive();
          veDsEm();
        });
        return b;
      };

      const cacNutLoc = [
        taoNutLoc('', 'Tất cả', dsGoc.length),
        taoNutLoc('chua_dong', '✕ Chưa đóng', soChuaDong),
        taoNutLoc('con_thieu', '⚠️ Còn thiếu', soConThieu),
        taoNutLoc('da_du', '✓ Đã đủ', soDaDu),
      ];
      capNhatActive();
      datNoiDung(hopLocTrangThai, ...cacNutLoc);
    }

    function veDsEm() {
      const locTo = locToTheoKhoan[khoanId] || '';
      const ds = dk.danhSach.filter((h) => {
        if (locTo && String(h.toSo) !== locTo) return false;
        if (boLocTrangThai === 'da_du') return h.daDuDinh;
        if (boLocTrangThai === 'con_thieu') return !h.daDuDinh && h.daDong > 0;
        if (boLocTrangThai === 'chua_dong') return !h.daDuDinh && (!h.daDong || h.daDong === 0);
        return true;
      });

      if (!ds.length) {
        datNoiDung(hopDs, e('p', 'trong', 'Không có học sinh nào phù hợp với bộ lọc.'));
        return;
      }

      datNoiDung(hopDs, ...ds.map((h) => {
        const hang = e('div', 'hang-hs hang-hs-doc the-hs-quy');
        const dong1 = e('div', 'hang-hs-dong1');

        // Khối bên trái: STT tròn + Tên học sinh + Tổ + Chi tiết đóng tiền nổi bật
        const khoiTrai = e('div', 'hs-khoi-trai');
        const sttSo = h.soThuTu || h.hocSinhId;
        const sttEl = e('div', 'stt hs-stt-tron', String(sttSo));
        const thongTin = e('div', 'hs-thong-tin');

        const dongTen = e('div', 'hs-ten-to');
        const hoTenEl = e('span', 'hs-ho-ten', h.hoTen);
        dongTen.append(hoTenEl);
        if (h.toSo) {
          dongTen.append(e('span', 'hs-to-badge', `Tổ ${h.toSo}`));
        }

        const dongTien = e('div', 'hs-chi-tiet-dong');

        // Huy hiệu trạng thái và chi tiết số tiền nổi bật, rõ ràng
        let nhanBadge;
        if (h.daDuDinh) {
          hang.classList.add('quy-da-du');
          nhanBadge = e('span', 'nhan-trang-thai-quy da-du', '✓ ĐÃ ĐỦ');
          const tienDu = e('span', 'tien-nhan-muc da-du');
          tienDu.append('Đã nộp đủ: ', e('strong', null, tienVN(h.daDong)));
          dongTien.append(tienDu);
        } else if (h.daDong > 0) {
          hang.classList.add('quy-con-thieu');
          nhanBadge = e('span', 'nhan-trang-thai-quy con-thieu', `⚠️ THIẾU ${tienVN(h.conThieu)}`);
          const tienDaDong = e('span', 'tien-nhan-muc da-dong');
          tienDaDong.append('Đã đóng: ', e('strong', null, tienVN(h.daDong)));
          const tienThieu = e('span', 'tien-nhan-muc con-thieu');
          tienThieu.append('Còn thiếu: ', e('strong', null, tienVN(h.conThieu)));
          dongTien.append(tienDaDong, e('span', 'cham-cach', '·'), tienThieu);
        } else {
          hang.classList.add('quy-chua-dong');
          nhanBadge = e('span', 'nhan-trang-thai-quy chua-dong', '✕ CHƯA ĐÓNG');
          const tienChua = e('span', 'tien-nhan-muc chua-dong');
          tienChua.append('Chưa nộp · Cần thu: ', e('strong', null, tienVN(h.conThieu)));
          dongTien.append(tienChua);
        }

        thongTin.append(dongTen, dongTien);
        khoiTrai.append(sttEl, thongTin);

        // Khối bên phải: Huy hiệu trạng thái + Nút Ghi thu to dễ chạm trên điện thoại
        const khoiPhai = e('div', 'hs-khoi-phai');
        khoiPhai.append(
          nhanBadge,
          nut('+ Thu tiền', 'nut-chinh nut-ghi-thu-hs', () => ghiKhoanDong(khoanId, h, lamMoiKhoanDangMo, dk.khoan))
        );

        dong1.append(khoiTrai, khoiPhai);
        hang.append(dong1);

        // Lịch sử các lần đóng tiền: khung thẻ rõ ràng, icon thao tác sắc nét
        if (h.lanDong && h.lanDong.length) {
          const khungLan = e('div', 'khung-lan-dong');
          const tieuDeLan = e('div', 'lan-dong-tieu-de');
          tieuDeLan.append(
            taoSvgIcon('M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18', 13, 13),
            document.createTextNode('Lịch sử nộp:')
          );

          const dsThe = e('div', 'ds-the-lan-dong');
          h.lanDong.forEach((ld) => {
            const the = e('div', 'the-lan-dong');
            const tienEl = e('span', 'lan-dong-tien', `+${tienVN(ld.soTien)}`);
            const ngayEl = e('span', 'lan-dong-ngay', ngayVN(ld.ngay));

            const thaoTac = e('div', 'lan-dong-thao-tac');

            const bSua = e('button', 'nut-thao-tac-lan sua');
            bSua.type = 'button';
            bSua.title = 'Sửa lần đóng này';
            bSua.setAttribute('aria-label', `Sửa lần đóng của ${h.hoTen} ngày ${ngayVN(ld.ngay)}`);
            bSua.append(taoSvgIcon('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z', 12, 12));
            bSua.addEventListener('click', () => suaDong(ld, h.hoTen, lamMoiKhoanDangMo));

            // Nút xoá lần đóng: giáo viên và thủ quỹ đều được xoá (API đã ghi checkpoint trước khi xoá).
            // Tài khoản không phải giáo viên chỉ xoá được 'dong', không xoá được 'khoan'/'chi'.
            const bXoa = e('button', 'nut-thao-tac-lan xoa');
            bXoa.type = 'button';
            bXoa.title = 'Xoá lần đóng này';
            bXoa.setAttribute('aria-label', `Xoá lần đóng của ${h.hoTen} ngày ${ngayVN(ld.ngay)}`);
            bXoa.append(taoSvgIcon('M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6', 12, 12));
            bXoa.addEventListener('click', () => {
              moHopThoai('Xoá lần đóng này?', e('p', null, `${h.hoTen} — ${tienVN(ld.soTien)} ngày ${ngayVN(ld.ngay)}`), [
                nut('Huỷ', 'nut-nhe', dongHopThoai),
                nut('Xoá', 'nut-xau', async () => {
                  try {
                    await api('/api/gv/quy?loai=dong&id=' + ld.id, { method: 'DELETE' });
                    dongHopThoai();
                    nhac('Đã xoá lần đóng — hệ thống đã ghi lại dấu vết.', 'tot');
                    await lamMoiKhoanDangMo();
                  } catch (err) { nhac(err.message, 'xau'); }
                }),
              ]);
            });

            thaoTac.append(bSua, bXoa);
            the.append(tienEl, ngayEl, thaoTac);
            dsThe.append(the);
          });

          khungLan.append(tieuDeLan, dsThe);
          hang.append(khungLan);
        }
        return hang;
      }));
    }

    capNhatNutLoc();
    veDsEm();

    return box;
  }

  function veChi() {
    const the = e('div', 'the the-khoan-chi-khung');
    const dauChi = e('div', 'tieu-de-trang tieu-de-chi');
    dauChi.append(e('h2', null, '💸 Danh sách khoản chi'));
    const phaiChi = e('div', 'phai');
    phaiChi.append(nut('➕ Ghi khoản chi', 'nut-cam nut-nho', () => ghiKhoanChi(tai)));
    const nutXoaTatCaChi = nutXoaTatCa(d.chi.length, 'chi', 'khoản chi', tai);
    if (nutXoaTatCaChi) phaiChi.append(nutXoaTatCaChi);
    dauChi.append(phaiChi);
    the.append(dauChi);

    if (!d.chi.length) {
      the.append(e('p', 'trong', 'Chưa có khoản chi nào.'));
      return the;
    }

    const thanhChonChi = veThanhChonXoa(chiDaChon, 'chi', 'khoản chi', tai);
    if (thanhChonChi) the.append(thanhChonChi);

    // Chọn nhanh — cùng kiểu với Khoản thu, cho đối xứng: danh sách chi dài cũng cần cách
    // nhảy thẳng tới đúng khoản thay vì phải kéo dò từng dòng.
    if (d.chi.length > 3) {
      const oChonNhanhChi = oChon('quyChonNhanhChi',
        [['', `— Chọn nhanh trong ${d.chi.length} khoản chi —`], ...d.chi.map((c) =>
          [String(c.id), `${c.noiDung} — -${tienVN(c.soTien)} · ${ngayVN(c.ngay)}`])], '');
      oChonNhanhChi.className = 'o-nhap quy-chon-nhanh';
      oChonNhanhChi.setAttribute('aria-label', 'Chọn nhanh một khoản chi để xem');
      oChonNhanhChi.addEventListener('change', () => {
        const id = Number(oChonNhanhChi.value);
        if (!id) return;
        document.getElementById('chi-' + id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
        oChonNhanhChi.value = '';
      });
      the.append(oChonNhanhChi);
    }

    const ds = e('div', 'ds-diem-danh');
    d.chi.forEach((c) => {
      const hang = e('div', 'hang-hs hang-hs-doc card-item-chi');
      hang.id = 'chi-' + c.id;
      const dong1 = e('div', 'hang-hs-dong1');

      const khoiTrai = e('div', 'hs-khoi-trai');

      const oChonXoaChi = e('input');
      oChonXoaChi.type = 'checkbox';
      oChonXoaChi.checked = chiDaChon.has(c.id);
      oChonXoaChi.setAttribute('aria-label', 'Chọn khoản chi "' + c.noiDung + '" để xoá hàng loạt');
      oChonXoaChi.style.cssText = 'width:18px;height:18px;flex:none;cursor:pointer;accent-color:var(--xau)';
      oChonXoaChi.addEventListener('change', () => {
        if (oChonXoaChi.checked) chiDaChon.add(c.id); else chiDaChon.delete(c.id);
        ve();
      });
      khoiTrai.append(oChonXoaChi);

      const thongTin = e('div', 'hs-thong-tin');

      const dongTen = e('div', 'hs-ten-to');
      dongTen.append(e('span', 'hs-ho-ten chi-ten', c.noiDung));
      const loaiTen = (CAC_LOAI_CHI.find((x) => x[0] === c.loai) || [null, 'Khác'])[1];
      dongTen.append(e('span', 'hs-to-badge badge-loai-chi', loaiTen));

      const dongTien = e('div', 'hs-chi-tiet-dong');
      const tienChi = e('span', 'tien-nhan-muc tien-chi-noi-bat');
      tienChi.append('Đã chi: ', e('strong', null, '-' + tienVN(c.soTien)));
      const ngayChi = e('span', 'lan-dong-ngay', `📅 ${ngayVN(c.ngay)}`);
      dongTien.append(tienChi, e('span', 'cham-cach', '·'), ngayChi);
      if (c.ghiChu) {
        dongTien.append(e('span', 'cham-cach', '·'), e('span', 'ghi-chu-chi', `📝 ${c.ghiChu}`));
      }

      thongTin.append(dongTen, dongTien);
      khoiTrai.append(thongTin);

      const khoiPhai = e('div', 'hs-khoi-phai');
      const bSuaChi = e('button', 'nut-thao-tac-lan sua');
      bSuaChi.type = 'button';
      bSuaChi.title = 'Sửa khoản chi: ' + c.noiDung;
      bSuaChi.setAttribute('aria-label', 'Sửa khoản chi: ' + c.noiDung);
      bSuaChi.append(taoSvgIcon('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z', 13, 13));
      bSuaChi.addEventListener('click', () => suaChi(c, tai));

      const bXoaChi = e('button', 'nut-thao-tac-lan xoa');
      bXoaChi.type = 'button';
      bXoaChi.title = 'Xoá khoản chi: ' + c.noiDung;
      bXoaChi.setAttribute('aria-label', 'Xoá khoản chi: ' + c.noiDung);
      bXoaChi.append(taoSvgIcon('M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6', 13, 13));
      bXoaChi.addEventListener('click', () => {
        moHopThoai('Xoá khoản chi này?', e('p', null, c.noiDung + ' — ' + tienVN(c.soTien)), [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá', 'nut-xau', async () => {
            try {
              await api('/api/gv/quy?loai=chi&id=' + c.id, { method: 'DELETE' });
              dongHopThoai();
              nhac('Đã xoá', 'tot');
              tai();
            } catch (err) { nhac(err.message, 'xau'); }
          }),
        ]);
      });

      khoiPhai.append(bSuaChi, bXoaChi);
      dong1.append(khoiTrai, khoiPhai);
      hang.append(dong1);
      ds.append(hang);
    });
    the.append(ds);
    return the;
  }

  function veChiTheoLoai() {
    if (!d.chiTheoLoai || !d.chiTheoLoai.length) return null;
    const the = e('div', 'the');
    the.style.marginTop = '14px';
    the.append(e('h3', null, '📊 Chi theo từng loại'));
    const ds = e('div', 'ds-diem-danh');
    d.chiTheoLoai.forEach((x) => {
      const hang = e('div', 'hang-hs');
      const ten = e('div', 'ten');
      ten.append(e('b', null, x.ten));
      hang.append(ten, e('span', 'nhan nhan-luuy', tienVN(x.soTien)));
      ds.append(hang);
    });
    the.append(ds);
    return the;
  }

  function ve() {
    const khung = e('div');
    // Chỉ còn 1 lối tắt CHUNG cho cả trang: "🛡️ Lịch sử & khôi phục" — đã gộp cả lịch sử
    // khoản thu, khoản chi và các đợt thu cố định vào chung trang lịch sử này (xem
    // trangQuyLichSu), không còn trang "#/quy-dinh-ky" riêng dễ bị lạc ở cuối danh sách nữa.
    // Nút "Ghi khoản thu" đã dời xuống ngay trong thẻ "Khoản thu" bên dưới, đồng cấp với nút
    // "Ghi khoản chi" trong thẻ "Khoản chi".
    khung.append(tieuDeTrang('Thủ quỹ lớp',
      `${d.siSo} học sinh · công thức: Tồn quỹ = Tổng đã thu − Tổng đã chi`,
      nut('🛡️ Lịch sử & khôi phục', 'nut-vien', () => { location.hash = '#/quy-lich-su'; })
    ));

    // Khoản thu hầu như luôn ở trạng thái "đang mở" trong thực tế dùng (ít khi giáo viên chủ
    // động đóng) nên tỉ lệ mở/tổng không nói lên điều gì — bỏ, chỉ đếm tổng số khoản. Trạng
    // thái đóng/mở của TỪNG khoản vẫn thấy rõ ở nhãn trên mỗi dòng bên dưới.
    const day = e('div', 'day-so');
    day.append(
      oThongKe(tienVN(d.tonQuy), 'Tồn quỹ hiện tại', 'tot', '🏦'),
      oThongKe(tienVN(d.tongThu), 'Tổng đã thu', 'thu', '📥'),
      oThongKe(tienVN(d.tongChi), 'Tổng đã chi', 'luuy', '📤'),
      oThongKe(String(d.khoan.length), 'Số khoản thu', 'khoan', '📂'),
      oThongKe(String(d.chi.length), 'Số lần đã ghi chi', 'luuy', '🧾')
    );
    khung.append(day);

    // Thẻ hướng dẫn "Bắt đầu thu quỹ cho lớp" (chỉ hiện khi rỗng) đã bỏ — trùng lặp với chính
    // 2 thẻ "Khoản thu"/"Khoản chi" bên dưới, mỗi thẻ đã có sẵn nút "+ Ghi..." và dòng "Chưa
    // có... nào" của riêng nó rồi.

    // Thanh chuyển Tab Thu / Chi nổi bật, tách biệt hoàn toàn 2 khu vực
    const thanhTab = e('div', 'tab-chuyen-quy-chinh');
    thanhTab.id = 'quy-thanh-tab';
    const nutTabThu = e('button', 'nut-tab-chuyen tab-thu' + (tabHienTai === 'thu' ? ' dang-chon' : ''));
    nutTabThu.type = 'button';
    nutTabThu.append(
      e('span', 'tab-icon', '💰'),
      e('span', 'tab-chu', 'Khoản thu'),
      e('span', 'tab-badge', String(d.khoan.length))
    );
    nutTabThu.addEventListener('click', () => {
      if (tabHienTai !== 'thu') {
        tabHienTai = 'thu';
        giuViTriCuonKhiVe('quy-thanh-tab', ve);
      }
    });

    const nutTabChi = e('button', 'nut-tab-chuyen tab-chi' + (tabHienTai === 'chi' ? ' dang-chon' : ''));
    nutTabChi.type = 'button';
    nutTabChi.append(
      e('span', 'tab-icon', '💸'),
      e('span', 'tab-chu', 'Khoản chi'),
      e('span', 'tab-badge', String(d.chi.length))
    );
    nutTabChi.addEventListener('click', () => {
      if (tabHienTai !== 'chi') {
        tabHienTai = 'chi';
        giuViTriCuonKhiVe('quy-thanh-tab', ve);
      }
    });

    thanhTab.append(nutTabThu, nutTabChi);
    khung.append(thanhTab);

    // Hiển thị nội dung tương ứng theo tab đã chọn
    if (tabHienTai === 'thu') {
      const theKhoan = e('div', 'the the-khoan-thu-khung');
      const dauKhoan = e('div', 'tieu-de-trang tieu-de-thu');
      dauKhoan.append(e('h2', null, '💰 Danh sách khoản thu'));
      const phaiKhoan = e('div', 'phai');
      phaiKhoan.append(nut('➕ Ghi khoản thu', 'nut-chinh nut-nho', () => moKhoanMoi(tai, 'nhanh', laGiaoVienQuy)));
      const nutXoaTatCaKhoan = nutXoaTatCa(d.khoan.length, 'khoan', 'khoản thu', tai);
      if (nutXoaTatCaKhoan) phaiKhoan.append(nutXoaTatCaKhoan);
      dauKhoan.append(phaiKhoan);
      theKhoan.append(dauKhoan);

      if (!d.khoan.length) {
        theKhoan.append(e('p', 'trong', 'Chưa có khoản thu nào.'));
      } else {
        const thanhChonKhoan = veThanhChonXoa(khoanDaChon, 'khoan', 'khoản thu', tai);
        if (thanhChonKhoan) theKhoan.append(thanhChonKhoan);

        if (d.khoan.length > 3) {
          const oChonNhanh = oChon('quyChonNhanh',
            [['', `— Chọn nhanh trong ${d.khoan.length} khoản thu —`], ...d.khoan.map((k) => {
              const pt = k.tongCanThu ? Math.round((k.tongDaThu / k.tongCanThu) * 100) : 0;
              const trangThai = !k.dangMo ? 'Đã đóng' : pt >= 100 ? 'Đã thu đủ' : `${pt}%, ${k.soEmChuaDu} em chưa đủ`;
              return [String(k.id), `${k.dinhKyId ? '🔁' : '💰'} ${k.ten} — ${trangThai}`];
            })], '');
          oChonNhanh.className = 'o-nhap quy-chon-nhanh';
          oChonNhanh.setAttribute('aria-label', 'Chọn nhanh một khoản thu để xem');
          oChonNhanh.addEventListener('change', async () => {
            const id = Number(oChonNhanh.value);
            if (!id) return;
            const kk = d.khoan.find((x) => x.id === id);
            if (kk?.dinhKyId) nhomMoRong.add(kk.dinhKyId);
            if (moRong !== id) await moKhoan(id); else ve();
            document.getElementById('khoan-' + id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
            oChonNhanh.value = '';
          });
          theKhoan.append(oChonNhanh);
        }

        const ds = e('div', 'ds-khoan');
        nhomTheoDinhKy(d.khoan).forEach((muc) => {
          ds.append(muc.loai === 'nhom' ? veNhomDinhKy(muc) : veHangKhoan(muc.khoan));
        });
        theKhoan.append(ds);
      }
      khung.append(theKhoan);
    } else {
      // TAB KHOẢN CHI — Tách biệt hoàn toàn sang màn hình riêng
      const cotChi = e('div', 'khung-tab-chi');
      cotChi.append(veChi());
      const chiTheoLoai = veChiTheoLoai();
      if (chiTheoLoai) cotChi.append(chiTheoLoai);
      khung.append(cotChi);
    }

    datNoiDung(KHUNG, khung);
  }

  await tai();
}

function suaKhoan(khoan, taiLai) {
  const oTen = oNhap('skTen', 'text', khoan.ten);
  const oSoTien = oNhap('skSoTien', 'number', String(khoan.soTienMoiEm));
  const oDangMo = oChon('skDangMo', [[1, 'Đang mở — vẫn nhận thu'], [0, 'Đã đóng — không thu nữa']], khoan.dangMo ? 1 : 0);
  const oGc = oNhap('skGc', 'textarea', khoan.ghiChu || '', 'Ghi chú (không bắt buộc)');
  const oTuNgay = oNhap('skTuNgay', 'date', khoan.ngayBatDau || '');
  const oDenNgay = oNhap('skDenNgay', 'date', khoan.ngayKetThuc || '');

  moHopThoai('Sửa khoản thu', [
    truong('Tên khoản thu', oTen),
    truong('Mức thu mỗi em (đồng)', oSoTien),
    truong('Trạng thái', oDangMo),
    truong('Từ ngày', oTuNgay, 'Để trống nếu khoản này không gắn khoảng thời gian cụ thể'),
    truong('Đến ngày', oDenNgay),
    truong('Ghi chú', oGc),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      if (!oTen.value.trim()) return nhac('Tên khoản thu không được để trống', 'xau');
      if (oTuNgay.value && oDenNgay.value && oDenNgay.value < oTuNgay.value) {
        return nhac('Ngày kết thúc phải từ ngày bắt đầu trở về sau', 'xau');
      }
      const nutBam = ev.currentTarget;
      nutBam.disabled = true;
      try {
        await api('/api/gv/quy', {
          method: 'PATCH',
          than: {
            banGhi: 'khoan', id: khoan.id, ten: oTen.value, soTienMoiEm: Number(oSoTien.value),
            dangMo: Number(oDangMo.value) === 1, ghiChu: oGc.value,
            ngayBatDau: oTuNgay.value, ngayKetThuc: oDenNgay.value,
          },
        });
        dongHopThoai();
        nhac('Đã lưu', 'tot');
        await taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        nutBam.disabled = false;
      }
    }),
  ]);
}

function suaDong(dong, hoTen, taiLai) {
  const oSoTien = oNhap('sdSoTien', 'number', String(dong.soTien));
  const oNgay = oNhap('sdNgay', 'date', dong.ngay);
  const oGc = oNhap('sdGc', 'text', dong.ghiChu || '', 'Ghi chú (không bắt buộc)');

  moHopThoai(`Sửa lần đóng — ${hoTen}`, [
    truong('Số tiền (đồng)', oSoTien),
    truong('Ngày đóng', oNgay),
    truong('Ghi chú', oGc),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      const soTien = Number(oSoTien.value);
      if (!soTien || soTien <= 0) return nhac('Số tiền không hợp lệ', 'xau');
      const nutBam = ev.currentTarget;
      nutBam.disabled = true;
      try {
        await api('/api/gv/quy', {
          method: 'PATCH',
          than: { banGhi: 'dong', id: dong.id, soTien, ngay: oNgay.value, ghiChu: oGc.value },
        });
        dongHopThoai();
        nhac('Đã lưu', 'tot');
        await taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        nutBam.disabled = false;
      }
    }),
  ]);
}

function suaChi(chi, taiLai) {
  const oNoiDung = oNhap('scNoiDung', 'text', chi.noiDung);
  const oSoTien = oNhap('scSoTien', 'number', String(chi.soTien));
  const oNgay = oNhap('scNgay', 'date', chi.ngay);
  const oLoai = oChon('scLoai', CAC_LOAI_CHI, chi.loai || 'khac');
  const oGc = oNhap('scGc', 'text', chi.ghiChu || '', 'Ghi chú (không bắt buộc)');

  moHopThoai('Sửa khoản chi', [
    truong('Nội dung chi', oNoiDung),
    truong('Số tiền (đồng)', oSoTien),
    truong('Ngày chi', oNgay),
    truong('Loại chi', oLoai),
    truong('Ghi chú', oGc),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      if (!oNoiDung.value.trim()) return nhac('Nội dung không được để trống', 'xau');
      const soTien = Number(oSoTien.value);
      if (!soTien || soTien <= 0) return nhac('Số tiền không hợp lệ', 'xau');
      const nutBam = ev.currentTarget;
      nutBam.disabled = true;
      try {
        await api('/api/gv/quy', {
          method: 'PATCH',
          than: { banGhi: 'chi', id: chi.id, noiDung: oNoiDung.value, soTien, ngay: oNgay.value, loai: oLoai.value, ghiChu: oGc.value },
        });
        dongHopThoai();
        nhac('Đã lưu', 'tot');
        await taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        nutBam.disabled = false;
      }
    }),
  ]);
}

// Loại thu chọn ngay khi tạo — gộp chung "khoản thu một lần" và "mẫu thu định kỳ" (trước đây
// là 2 nút, 2 khái niệm tách rời khiến không rõ định kỳ nghĩa là gì) vào MỘT hộp thoại duy
// nhất: chọn định kỳ thì các trường đổi theo và có giải thích lịch sinh kỳ ngay tại chỗ.
const LOAI_CHINH_THU = [['nhanh', '⚡ Thu linh động'], ['co_dinh', '🔒 Thu cố định']];
const CHU_KY_CO_DINH = [['tuan', 'Theo tuần'], ['thang', 'Theo tháng'], ['nam', 'Theo năm']];
const NHAN_CHU_KY = { tuan: 'Tuần', thang: 'Tháng', nam: 'Năm' };
const TOI_DA_SO_KY = 60;   // khớp giới hạn phía máy chủ (functions/api/gv/quy-dinh-ky.js)

function dinhDangNgan(iso) {
  const [, thang, ngay] = iso.split('-');
  return `${ngay}/${thang}`;
}

/** Ngày kết thúc MẶC ĐỊNH gợi ý cho kỳ 1 theo chu kỳ đã chọn — giáo viên vẫn sửa lại được
    thoải mái (vd rút ngắn/kéo dài tuần đầu cho khớp lịch trường thực tế). */
function ngayMacDinhKetThucKy1(chuKy, tuNgayISO) {
  const d = new Date(tuNgayISO + 'T00:00:00Z');
  if (chuKy === 'tuan') { d.setUTCDate(d.getUTCDate() + 6); }
  else if (chuKy === 'thang') { d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(d.getUTCDate() - 1); }
  else { d.setUTCFullYear(d.getUTCFullYear() + 1); d.setUTCDate(d.getUTCDate() - 1); }
  return d.toISOString().slice(0, 10);
}

/** Xem trước lịch các kỳ — PHẢI khớp đúng công thức tinhCacKy() phía máy chủ
    (functions/_lib/quy-dinh-ky.js): kỳ sau nối tiếp ngay sau kỳ trước, đúng bằng độ dài
    thật của kỳ 1. Chỉ để hiển thị trước cho giáo viên yên tâm, máy chủ luôn tự tính lại. */
function tinhCacKyXemTruoc(tuNgayKy1ISO, denNgayKy1ISO, soKy) {
  const bd1 = new Date(tuNgayKy1ISO + 'T00:00:00Z');
  const kt1 = new Date(denNgayKy1ISO + 'T00:00:00Z');
  if (isNaN(bd1) || isNaN(kt1) || kt1 < bd1) return [];
  const doDaiNgay = Math.round((kt1 - bd1) / 86400000) + 1;
  const ds = [];
  for (let k = 1; k <= soKy; k++) {
    const bd = new Date(bd1); bd.setUTCDate(bd.getUTCDate() + (k - 1) * doDaiNgay);
    const kt = new Date(bd); kt.setUTCDate(kt.getUTCDate() + doDaiNgay - 1);
    ds.push({ kySo: k, ngayBatDau: bd.toISOString().slice(0, 10), ngayKetThuc: kt.toISOString().slice(0, 10), doDaiNgay });
  }
  return ds;
}

function moKhoanMoi(taiLai, loaiChinhMacDinh = 'nhanh', duocTaoCoDinh = true) {
  // Tài khoản thủ quỹ (phu) không tạo được "Thu cố định" — bớt hẳn lựa chọn đó khỏi hộp thoại
  // thay vì cho chọn rồi báo lỗi lúc lưu.
  const cacLoaiChoPhep = duocTaoCoDinh ? LOAI_CHINH_THU : LOAI_CHINH_THU.filter(([ma]) => ma !== 'co_dinh');
  const oLoaiChinh = oChon('qLoaiChinh', cacLoaiChoPhep, duocTaoCoDinh ? loaiChinhMacDinh : 'nhanh');
  const oChuKy = oChon('qChuKy', CHU_KY_CO_DINH, 'tuan');
  const oSoKy = oNhap('qSoKy', 'number', '8');
  const oTen = oNhap('qTen', 'text', '', 'Ví dụ: Quỹ lớp học kì 1');
  const oSoTien = oNhap('qSoTien', 'number', '50000');
  const oHk = oChon('qHk', [[1, 'Học kì 1'], [2, 'Học kì 2']], 1);
  const oGc = oNhap('qGc', 'textarea', '', 'Ghi chú (không bắt buộc)');
  const oTuNgay = oNhap('qTuNgay', 'date', homNay());
  const oDenNgay = oNhap('qDenNgay', 'date', ngayMacDinhKetThucKy1('tuan', homNay()));

  const truongLoaiChinh = truong('Loại thu', oLoaiChinh);
  const truongChuKy = truong('Chu kỳ', oChuKy);
  const truongSoKy = truong('Số lượng kỳ sẽ thu', oSoKy, `Tối đa ${TOI_DA_SO_KY} kỳ — sinh sẵn toàn bộ ngay khi tạo.`);
  const truongTen = truong('Tên khoản thu', oTen);
  const truongHk = truong('Học kì', oHk);
  const truongGc = truong('Ghi chú', oGc);
  const truongTuNgay = truong('Từ ngày', oTuNgay);
  const truongDenNgay = truong('Đến ngày', oDenNgay);

  // Xem trước NGAY TRONG ô của chính nó (giống cách truong() tự thêm ghi chú tĩnh) — dùng
  // <div> chứ không phải <p> để khỏi dính margin mặc định của trình duyệt.
  const xemTruocTuNgay = e('div', 'trong');
  xemTruocTuNgay.style.cssText = 'margin-top:6px;font-size:12.5px';
  truongTuNgay.append(xemTruocTuNgay);

  const xemTruocDenNgay = e('div', 'trong');
  xemTruocDenNgay.style.cssText = 'margin-top:6px;font-size:12.5px';
  truongDenNgay.append(xemTruocDenNgay);

  const xemTruocTen = e('div', 'trong');
  xemTruocTen.style.cssText = 'margin-top:6px;font-size:12.5px';
  truongTen.append(xemTruocTen);

  const ghiChuKeHoach = e('p', 'trong');
  ghiChuKeHoach.style.marginTop = '4px';

  // Ngày kết thúc kỳ 1 tự gợi ý theo chu kỳ/ngày bắt đầu — NHƯNG thôi tự động gợi ý ngay khi
  // giáo viên đã tự tay sửa nó, tránh ghi đè mất tuỳ chỉnh (vd rút ngắn tuần đầu cho khớp lịch
  // trường thực tế như yêu cầu).
  let denNgayDaTuyChinh = false;
  oDenNgay.addEventListener('input', () => { denNgayDaTuyChinh = true; capNhatXemTruoc(); });

  function capNhatMacDinhDenNgay() {
    if (oLoaiChinh.value === 'co_dinh' && !denNgayDaTuyChinh && oTuNgay.value) {
      oDenNgay.value = ngayMacDinhKetThucKy1(oChuKy.value, oTuNgay.value);
    }
  }

  function capNhatXemTruoc() {
    xemTruocTuNgay.textContent = oTuNgay.value ? `→ ${ngayDayDu(oTuNgay.value)}` : '';
    xemTruocDenNgay.textContent = oDenNgay.value ? `→ ${ngayDayDu(oDenNgay.value)}` : '';

    if (oLoaiChinh.value !== 'co_dinh') { xemTruocTen.textContent = ''; ghiChuKeHoach.textContent = ''; return; }

    const soKyNhap = Math.max(1, Math.min(TOI_DA_SO_KY, Number(oSoKy.value) || 1));
    const kyDau = tinhCacKyXemTruoc(oTuNgay.value, oDenNgay.value, 1)[0];
    if (!kyDau) {
      xemTruocTen.textContent = '';
      ghiChuKeHoach.textContent = 'Nhập đủ và đúng "Từ ngày"/"Đến ngày" của kỳ 1 để xem trước lịch thu.';
      return;
    }

    const tenGoc = oTen.value.trim() || 'Quỹ lớp';
    const nhan = NHAN_CHU_KY[oChuKy.value];
    xemTruocTen.textContent =
      `→ Kỳ 1 sẽ có tên: "${tenGoc} — ${nhan} 1 (${dinhDangNgan(kyDau.ngayBatDau)}–${dinhDangNgan(kyDau.ngayKetThuc)})"`;

    let dongKeTiep = '';
    if (soKyNhap >= 2) {
      const ky2 = tinhCacKyXemTruoc(oTuNgay.value, oDenNgay.value, 2)[1];
      dongKeTiep = ` Kỳ 2: ${dinhDangNgan(ky2.ngayBatDau)}–${dinhDangNgan(ky2.ngayKetThuc)}`;
      if (soKyNhap > 2) {
        const kyCuoi = tinhCacKyXemTruoc(oTuNgay.value, oDenNgay.value, soKyNhap)[soKyNhap - 1];
        dongKeTiep += `... Kỳ ${soKyNhap} (kỳ cuối): ${dinhDangNgan(kyCuoi.ngayBatDau)}–${dinhDangNgan(kyCuoi.ngayKetThuc)}`;
      }
      dongKeTiep += '.';
    }
    ghiChuKeHoach.textContent =
      `Thu cố định nghĩa là: hệ thống tạo SẴN toàn bộ ${soKyNhap} kỳ NGAY khi bạn bấm "Tạo khoản `
      + `thu" — kỳ sau nối tiếp ngay sau kỳ trước, đúng bằng độ dài của kỳ 1 (${kyDau.doDaiNgay} ngày).`
      + dongKeTiep;
  }

  function capNhatHienThi() {
    const laCoDinh = oLoaiChinh.value === 'co_dinh';
    truongChuKy.hidden = !laCoDinh;
    truongSoKy.hidden = !laCoDinh;
    truongHk.hidden = laCoDinh;
    truongGc.hidden = laCoDinh;
    ghiChuKeHoach.hidden = !laCoDinh;
    truongTuNgay.querySelector('label').textContent = laCoDinh ? 'Kỳ 1 — Từ ngày' : 'Từ ngày';
    truongDenNgay.querySelector('label').textContent = laCoDinh ? 'Kỳ 1 — Đến ngày' : 'Đến ngày';
    oTen.placeholder = laCoDinh ? 'Ví dụ: Quỹ lớp' : 'Ví dụ: Quỹ lớp học kì 1';
    capNhatMacDinhDenNgay();
    capNhatXemTruoc();
  }
  oLoaiChinh.addEventListener('change', capNhatHienThi);
  oChuKy.addEventListener('change', () => { capNhatMacDinhDenNgay(); capNhatXemTruoc(); });
  oTuNgay.addEventListener('input', () => { capNhatMacDinhDenNgay(); capNhatXemTruoc(); });
  oSoKy.addEventListener('input', capNhatXemTruoc);
  oTen.addEventListener('input', capNhatXemTruoc);
  capNhatHienThi();

  moHopThoai('Ghi khoản thu', [
    truongLoaiChinh,
    truongChuKy,
    truongSoKy,
    truongTen,
    truong('Mức thu mỗi em (đồng)', oSoTien),
    truongHk,
    truongTuNgay,
    truongDenNgay,
    ghiChuKeHoach,
    truongGc,
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Tạo khoản thu', '', async (ev) => {
      if (!oTen.value.trim()) return nhac('Chưa nhập tên khoản thu', 'xau');
      const soTien = Number(oSoTien.value);
      if (!soTien || soTien <= 0) return nhac('Mức thu không hợp lệ', 'xau');
      if (!oTuNgay.value || !oDenNgay.value) return nhac('Chưa chọn đủ ngày bắt đầu/kết thúc', 'xau');
      if (oDenNgay.value < oTuNgay.value) return nhac('Ngày kết thúc phải từ ngày bắt đầu trở về sau', 'xau');

      const nutBam = ev.currentTarget;
      nutBam.disabled = true;
      try {
        if (oLoaiChinh.value === 'nhanh') {
          await api('/api/gv/quy', {
            method: 'POST',
            than: {
              hanhDong: 'tao_khoan', ten: oTen.value, soTienMoiEm: soTien, hocKy: Number(oHk.value),
              ghiChu: oGc.value, ngayBatDau: oTuNgay.value, ngayKetThuc: oDenNgay.value,
            },
          });
          nhac('Đã tạo khoản thu', 'tot');
        } else {
          const soKy = Number(oSoKy.value);
          if (!Number.isInteger(soKy) || soKy < 1 || soKy > TOI_DA_SO_KY) {
            throw new Error(`Số lượng kỳ phải là số nguyên từ 1 đến ${TOI_DA_SO_KY}.`);
          }
          const kq = await api('/api/gv/quy-dinh-ky', {
            method: 'POST',
            than: { ten: oTen.value, chuKy: oChuKy.value, soTienMoiKy: soTien, ngayBatDau: oTuNgay.value, ngayKetThuc: oDenNgay.value, soKy },
          });
          nhac(`Đã tạo ${kq.soKySinh} kỳ thu`, 'tot');
        }
        dongHopThoai();
        await taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        nutBam.disabled = false;
      }
    }),
  ]);
}

function ghiKhoanDong(khoanId, hocSinh, taiLai, khoan = null, duLieuCu = null) {
  const oSoTien = oNhap('dSoTien', 'number', duLieuCu?.soTien ?? (hocSinh.conThieu || ''));
  const oNgay = oNhap('dNgay', 'date', duLieuCu?.ngay || homNay());
  const oGc = oNhap('dGc', 'text', duLieuCu?.ghiChu || '', 'Ghi chú (không bắt buộc)');

  moHopThoai(`Ghi thu — ${hocSinh.hoTen}`, [
    truong('Số tiền (đồng)', oSoTien, hocSinh.conThieu ? `Còn thiếu ${tienVN(hocSinh.conThieu)}` : ''),
    truong('Ngày đóng', oNgay),
    truong('Ghi chú', oGc),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Tiếp tục ❯', 'nut-chinh', () => {
      const soTien = Number(oSoTien.value);
      if (!soTien || soTien <= 0) return nhac('Số tiền không hợp lệ', 'xau');
      const ngay = oNgay.value || homNay();
      const ghiChu = oGc.value || '';
      const stt = hocSinh.soThuTu || hocSinh.hocSinhId;

      // Bước xác nhận trước khi duyệt thu
      const hopXn = e('div', 'hop-xac-nhan-quy');
      const bangXn = e('div', 'bang-xac-nhan');
      const hangXn = (nhan, val, kieu = '') => {
        const r = e('div', 'dong-xn');
        r.append(e('span', 'nhan-xn', nhan), e('span', kieu ? 'gt-xn ' + kieu : 'gt-xn', val));
        return r;
      };
      if (khoan) {
        bangXn.append(hangXn(khoan.dinhKyId ? 'Khoản thu (định kỳ)' : 'Khoản thu', khoan.ten, 'chu-dam'));
        if (khoan.dinhKyId) {
          bangXn.append(hangXn('Kỳ thu',
            `Kỳ ${khoan.kySo}/${khoan.dinhKySoKy} · ${CHU_KY_HIEN_THI[khoan.dinhKyChuKy] || khoan.dinhKyChuKy}`));
        } else {
          bangXn.append(hangXn('Loại thu', '⚡ Thu linh động'));
        }
      }
      bangXn.append(
        hangXn('Học sinh', `${hocSinh.hoTen} (STT ${stt}${hocSinh.toSo ? ' · Tổ ' + hocSinh.toSo : ''})`, 'chu-dam'),
        hangXn('Số tiền thu', tienVN(soTien), 'tien-tot-noi-bat'),
        hangXn('Ngày thu', ngayVN(ngay)),
      );
      if (ghiChu) bangXn.append(hangXn('Ghi chú', ghiChu));
      hopXn.append(bangXn, e('p', 'ghi-chu-canh-bao', '⚠️ Vui lòng kiểm tra kỹ số tiền mặt đã nhận trước khi xác nhận lưu vào hệ thống.'));
      moHopThoai('Xác nhận ghi thu tiền', [
        hopXn,
      ], [
        nut('❮ Quay lại sửa', 'nut-nhe', () => ghiKhoanDong(khoanId, hocSinh, taiLai, khoan, { soTien, ngay, ghiChu })),
        nut('✓ Xác nhận ghi thu', 'nut-tot', async (ev) => {
          const nutBam = ev.currentTarget;
          nutBam.disabled = true;
          try {
            await api('/api/gv/quy', {
              method: 'POST',
              than: { hanhDong: 'ghi_dong', khoanId, hocSinhId: hocSinh.hocSinhId, soTien, ngay, ghiChu },
            });
            dongHopThoai();
            nhac(`Đã ghi thu ${tienVN(soTien)} — ${hocSinh.hoTen}`, 'tot');
            taiLai();
          } catch (err) {
            nhac(err.message, 'xau');
            nutBam.disabled = false;
          }
        }),
      ]);
    }),
  ]);
}

const CAC_LOAI_CHI = [
  ['hoat_dong', 'Hoạt động lớp'], ['vpp', 'Văn phòng phẩm'],
  ['khen_thuong', 'Khen thưởng'], ['ho_tro', 'Hỗ trợ học sinh'], ['khac', 'Khác'],
];

function ghiKhoanChi(taiLai, duLieuCu = null) {
  const oNoiDung = oNhap('cNoiDung', 'text', duLieuCu?.noiDung || '', 'Ví dụ: Mua hoa 20/11');
  const oSoTien = oNhap('cSoTien', 'number', duLieuCu?.soTien || '');
  const oNgay = oNhap('cNgay', 'date', duLieuCu?.ngay || homNay());
  const oLoai = oChon('cLoai', CAC_LOAI_CHI, duLieuCu?.loai || 'hoat_dong');
  const oGc = oNhap('cGc', 'text', duLieuCu?.ghiChu || '', 'Ghi chú (không bắt buộc)');

  moHopThoai('Ghi khoản chi', [
    truong('Nội dung chi', oNoiDung),
    truong('Số tiền (đồng)', oSoTien),
    truong('Ngày chi', oNgay),
    truong('Loại chi', oLoai),
    truong('Ghi chú', oGc),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Tiếp tục ❯', 'nut-cam', () => {
      const noiDung = oNoiDung.value.trim();
      if (!noiDung) return nhac('Chưa nhập nội dung chi', 'xau');
      const soTien = Number(oSoTien.value);
      if (!soTien || soTien <= 0) return nhac('Số tiền không hợp lệ', 'xau');
      const ngay = oNgay.value || homNay();
      const loai = oLoai.value;
      const ghiChu = oGc.value || '';
      const loaiTen = (CAC_LOAI_CHI.find((x) => x[0] === loai) || [null, 'Khác'])[1];

      // Bước xác nhận trước khi duyệt chi
      moHopThoai('Xác nhận duyệt khoản chi', [
        e('div', 'hop-xac-nhan-quy',
          (() => {
            const box = e('div', 'bang-xac-nhan');
            const hang = (nhan, val, kieu = '') => {
              const r = e('div', 'dong-xn');
              r.append(e('span', 'nhan-xn', nhan), e('span', 'gt-xn ' + kieu, val));
              return r;
            };
            box.append(
              hang('Nội dung chi', noiDung, 'chu-dam'),
              hang('Số tiền chi', `-${tienVN(soTien)}`, 'tien-xau-noi-bat'),
              hang('Phân loại', loaiTen),
              hang('Ngày chi', ngayVN(ngay)),
            );
            if (ghiChu) box.append(hang('Ghi chú', ghiChu));
            return box;
          })(),
          e('p', 'ghi-chu-canh-bao canh-bao-do', '⚠️ Khoản tiền này sẽ được trừ trực tiếp vào tồn quỹ lớp sau khi duyệt.')
        ),
      ], [
        nut('❮ Quay lại sửa', 'nut-nhe', () => ghiKhoanChi(taiLai, { noiDung, soTien, ngay, loai, ghiChu })),
        nut('💸 Xác nhận duyệt chi', 'nut-xau', async (ev) => {
          const nutBam = ev.currentTarget;
          nutBam.disabled = true;
          try {
            await api('/api/gv/quy', {
              method: 'POST',
              than: { hanhDong: 'ghi_chi', noiDung, soTien, ngay, loai, ghiChu },
            });
            dongHopThoai();
            nhac(`Đã ghi nhận khoản chi -${tienVN(soTien)}`, 'tot');
            taiLai();
          } catch (err) {
            nhac(err.message, 'xau');
            nutBam.disabled = false;
          }
        }),
      ]);
    }),
  ]);
}

/* ================= Phân quyền (tài khoản đặc biệt) ================= */

/* Dùng chung cho tab "Mã cá nhân" (giao-vien/trang-hoc-tap.js) — hiển thị các tài khoản
   đặc biệt KHÔNG gắn với mã cá nhân của một học sinh cụ thể (vd: quản trị viên ngoài lớp).
   Đường quyền chính bây giờ là gắn quyền quản lý thẳng vào mã cá nhân của học sinh — mục
   này chỉ còn dùng cho trường hợp hiếm cần một tài khoản không phải học sinh. */
export async function veKhoiTaiKhoanPhu(khung) {
  async function ve() {
    const d = await api('/api/gv/tai-khoan-phu');
    datNoiDung(khung);

    if (!d.danhSach.length) {
      khung.append(e('div', 'the trong', 'Chưa cấp tài khoản đặc biệt nào. Mọi việc hiện chỉ giáo viên chủ nhiệm thao tác được.'));
    } else {
      const ds = e('div', 'ds-the');
      const ICON_QUYEN = {
        'quy': '🪙',
        'thong-bao': '📢',
        'diem-danh': '✅',
        'hinh-anh': '📸',
        'am-thanh': '♪',
        'video': '🎬',
      };

      d.danhSach.forEach((tk) => {
        const the = e('div', 'the the-tk-phu');
        const info = layThongTinVaiTro(tk.vaiTro);

        const dau2 = e('div', 'the-tk-dau');
        dau2.style.cssText = 'display:flex;align-items:flex-start;gap:12px;justify-content:space-between;flex-wrap:wrap';

        const khoiTrai = e('div');
        khoiTrai.style.cssText = 'display:flex;align-items:center;gap:12px;min-width:0';

        const avatar = e('div', ['the-tk-avatar', info.lopMau].filter(Boolean).join(' '));
        avatar.style.cssText = `width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:20px;background:${info.mauNen};border:1.5px solid ${info.mauVien};flex:none;`;
        avatar.textContent = info.bieuTuong;

        const dongTen = e('div');
        dongTen.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap';
        dongTen.append(
          Object.assign(e('h3', null, tk.ten), { style: 'margin:0;font-size:16px;font-weight:700;' }),
          Object.assign(e('span', ['nhan', info.lopMau].filter(Boolean).join(' '), `${info.bieuTuong} ${info.tenGoi}`), {
            style: `background:${info.mauNen};border-color:${info.mauVien};color:${info.mauChu};font-weight:700;font-size:11.5px;padding:2px 8px;border-radius:6px;`
          }),
          e('span', tk.dangHoatDong ? 'nhan nhan-tot' : 'nhan nhan-xam', tk.dangHoatDong ? '✓ Hoạt động' : '🔒 Đã khoá')
        );
        khoiTrai.append(avatar, dongTen);

        // Mã đăng nhập đặt ngay cạnh tên/badge — bỏ dòng "Hiển thị khi đăng nhập" riêng vì
        // trùng lặp với tên + huy hiệu vai trò vừa hiện ở trên, không cần lặp lại lần nữa.
        const maChu = e('code', null, tk.ma);
        maChu.style.cssText = 'font-size:14.5px;font-weight:800;letter-spacing:1px;padding:3px 8px;border-radius:6px;color:var(--chinh);background:var(--nen-chim);border:1px solid var(--vien);flex:none;';

        dau2.append(khoiTrai, maChu);
        the.append(dau2);

        // ".day-loc-deu-co-gian" thay vì ".day-loc" tự vẽ tay — trước đây hàng thẻ quyền xuống
        // dòng kiểu "còn thừa mấy ô cuối" (vd hàng 2 chỉ có 2 thẻ, để trống rất nhiều bên phải),
        // giờ mỗi hàng xuống dòng tự lấp đầy hết chiều ngang, đúng quy tắc thiết kế thẻ đã chốt.
        const oQuyen = e('div', 'day-loc day-loc-deu-co-gian');
        oQuyen.style.cssText = 'margin-top:10px;';
        oQuyen.style.setProperty('--the-nho-nhat', '110px');
        tk.quyen.forEach((q) => {
          const timThay = d.cacQuyen.find((x) => x[0] === q);
          if (!timThay) return; // mục đã bỏ khỏi hệ thống — không hiện thẻ vô nghĩa
          const ten = timThay[1].split(' — ')[0];
          const icon = ICON_QUYEN[q] || '⭐';
          const chip = e('span', 'nhan nhan-xam');
          chip.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:2px 8px;font-weight:600;border-radius:7px;';
          chip.append(e('span', null, icon), document.createTextNode(ten));
          oQuyen.append(chip);
        });
        the.append(oQuyen);

        // ".day-loc-deu-co-gian" — cùng lý do như hàng thẻ quyền ở trên: 5 nút dễ xuống dòng
        // 3+2 hay 2+3 tuỳ bề rộng màn hình, cần tự lấp đầy từng hàng thay vì để trống. Đồng thời
        // đưa TẤT CẢ 5 nút về CÙNG kiểu viền (".nut-vien") thay vì trộn 2 nút có viền rõ với 3
        // nút gần như không viền (".nut-nhe" — viền trong suốt) trong cùng một hàng, trông như 2
        // kiểu nút khác hẳn nhau dù cùng một hàng thao tác. "Xoá hẳn" đổi riêng sang màu đỏ cảnh
        // báo (".nut-xoa-anh") vì là thao tác không thể hoàn tác, cần nổi bật hơn 4 nút còn lại.
        const nutHang = e('div', 'day-loc day-loc-deu-co-gian');
        nutHang.style.cssText = 'margin-top:12px;';
        nutHang.style.setProperty('--the-nho-nhat', '128px');
        nutHang.append(
          nut('✏ Sửa tài khoản', 'nut-vien nut-nho', () => suaTaiKhoan(tk, d.cacQuyen, ve)),
          nut('✎ Đặt mã tuỳ chỉnh', 'nut-vien nut-nho', () => datMaTuyChinhTaiKhoanPhu(tk, ve)),
          nut('🎲 Cấp lại mã', 'nut-vien nut-nho', () => {
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
          nut(tk.dangHoatDong ? '🔒 Khoá lại' : '🔓 Mở lại', 'nut-vien nut-nho', async () => {
            try {
              await api('/api/gv/tai-khoan-phu', { method: 'PATCH', than: { id: tk.id, dangHoatDong: !tk.dangHoatDong } });
              nhac(tk.dangHoatDong ? 'Đã khoá tài khoản' : 'Đã mở lại tài khoản', 'tot');
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          }),
          nut('🗑 Xoá hẳn', 'nut-xoa-anh nut-nho', () => {
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

    khung.append(Object.assign(
      nut('+ Tạo tài khoản đặc biệt (không gắn học sinh)', 'nut-nhe nut-nho', () => taoTaiKhoan(d.cacQuyen, ve)),
      { style: 'margin-top:12px' }
    ));
  }

  await ve();
}

function suaTaiKhoan(tk, cacQuyen, taiLai) {
  // Chỉ đổi 'admin' (giá trị cũ, kỹ thuật) thành tiếng Việt — KHÔNG tự điền "Quản trị viên"
  // khi để trống, vì nếu giáo viên chủ ý xoá trắng vai trò rồi lỡ bấm Lưu ngay, giá trị gợi ý
  // này sẽ bị lưu đè lên đúng cái họ vừa xoá.
  const vaiTroKhoiDau = tk.vaiTro === 'admin' ? 'Quản trị viên' : (tk.vaiTro || '');

  const oTen = oNhap('tkSuaTen', 'text', tk.ten, 'Ví dụ: Lê Đình Phát, Nguyễn Văn A...');
  const oVaiTro = oNhap('tkSuaVaiTro', 'text', vaiTroKhoiDau, 'Để trống nếu không cần vai trò cụ thể. Ví dụ: Quản trị viên, Lớp trưởng, Thủ quỹ, Bí thư…');

  const dayGoiY = e('div', 'day-loc');
  dayGoiY.style.cssText = 'margin-top:6px;gap:6px;flex-wrap:wrap;display:flex;align-items:center';
  dayGoiY.append(Object.assign(e('span', 'trong', 'Chọn nhanh:'), { style: 'font-size:12px;color:var(--chu-nhat)' }));

  const CAC_VAI_TRO = [
    ['🛡️ Quản trị viên', 'Quản trị viên'],
    ['👑 Lớp trưởng', 'Lớp trưởng'],
    ['🪙 Thủ quỹ', 'Thủ quỹ'],
    ['⚡ Bí thư', 'Bí thư'],
    ['📋 Tổ trưởng', 'Tổ trưởng'],
  ];
  CAC_VAI_TRO.forEach(([nhan, val]) => {
    const b = e('button', 'nut-nhe nut-nho', nhan);
    b.type = 'button';
    b.style.cssText = 'font-size:12px;padding:2px 8px;border-radius:6px;cursor:pointer;';
    b.addEventListener('click', () => {
      oVaiTro.value = val;
      capNhatXemTruoc();
    });
    dayGoiY.append(b);
  });

  const hopVaiTro = e('div');
  hopVaiTro.append(oVaiTro, dayGoiY);

  const hopXemTruoc = e('div');
  hopXemTruoc.style.cssText = 'padding:10px 12px;border-radius:9px;background:var(--nen-chim);border:1px solid var(--vien);margin-top:8px;font-size:13px;display:flex;flex-direction:column;gap:5px';

  function capNhatXemTruoc() {
    const t = oTen.value.trim() || '(Chưa nhập tên)';
    const vt = oVaiTro.value.trim() || '(Chưa đặt vai trò)';
    const inf = layThongTinVaiTro(vt);
    const textDangNhap = layNhanTaiKhoan({ role: 'phu', vaiTro: vt, ten: t });

    datNoiDung(hopXemTruoc,
      Object.assign(e('div', null, '👀 Vị trí hiển thị trên trang web:'), { style: 'font-weight:700;color:var(--chu);font-size:13px;' }),
      (() => {
        const d1 = e('div');
        d1.append(
          document.createTextNode('1. Trên thẻ phân quyền: '),
          Object.assign(e('b', null, t), { style: 'color:var(--chu)' }),
          document.createTextNode(' kèm huy hiệu '),
          Object.assign(e('span', ['nhan', inf.lopMau].filter(Boolean).join(' '), `${inf.bieuTuong} ${inf.tenGoi}`), {
            style: `background:${inf.mauNen};border-color:${inf.mauVien};color:${inf.mauChu};font-weight:700;font-size:11.5px;padding:1px 6px;border-radius:5px;`
          })
        );
        return d1;
      })(),
      (() => {
        const d2 = e('div');
        d2.append(
          document.createTextNode('2. Góc trên trang web khi đăng nhập: '),
          Object.assign(e('b', null, textDangNhap), { style: 'color:var(--chinh)' })
        );
        return d2;
      })()
    );
  }

  oTen.addEventListener('input', capNhatXemTruoc);
  oVaiTro.addEventListener('input', capNhatXemTruoc);
  const hopQuyen = e('div');
  hopQuyen.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:6px';
  const hopChon = [];

  const ghiChuMedia = e('div');
  ghiChuMedia.style.cssText = 'padding:9px 12px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.25);border-radius:8px;font-size:12.5px;color:var(--chu);line-height:1.5;margin-bottom:4px;';
  datNoiDung(ghiChuMedia,
    Object.assign(e('b', null, '💡 Quy tắc Media: '), { style: 'color:var(--chinh)' }),
    document.createTextNode('Cấp quyền '),
    e('i', null, 'Thông báo'),
    document.createTextNode(' hoặc '),
    e('i', null, 'Hoạt động lớp'),
    document.createTextNode(' nếu không cấp kèm '),
    e('i', null, 'Thư viện Ảnh / Âm thanh / Video'),
    document.createTextNode(' thì tài khoản '),
    e('b', null, 'chỉ được ghi nội dung văn bản (text)'),
    document.createTextNode('; các mục tải/chọn media sẽ bị khoá.')
  );
  hopQuyen.append(ghiChuMedia);

  cacQuyen.forEach(([ma, moTa]) => {
    const nhan = e('label');
    nhan.style.cssText = 'display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13.5px;padding:8px 10px;border-radius:8px;background:var(--nen-chim);border:1px solid var(--vien);transition:all 0.15s;';
    nhan.addEventListener('mouseenter', () => { nhan.style.borderColor = 'var(--chinh)'; });
    nhan.addEventListener('mouseleave', () => { nhan.style.borderColor = 'var(--vien)'; });

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = ma;
    cb.checked = (tk.quyen || []).includes(ma);
    cb.style.cssText = 'margin-top:2px;cursor:pointer;flex-shrink:0;width:16px;height:16px;accent-color:var(--chinh);';
    hopChon.push(cb);

    const phanTach = moTa.split(' — ');
    const icon = ICON_QUYEN[ma] || '🔑';
    const chu = e('div');
    chu.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
    const dongTd = e('div');
    dongTd.style.cssText = 'font-weight:700;color:var(--chu);display:flex;align-items:center;gap:6px;';
    dongTd.append(e('span', null, icon), document.createTextNode(phanTach[0]));
    chu.append(dongTd, Object.assign(e('div', 'trong', phanTach[1] || ''), { style: 'font-size:12px;line-height:1.35;color:var(--chu-nhat);' }));

    nhan.append(cb, chu);
    hopQuyen.append(nhan);
  });

  moHopThoai(`Sửa tài khoản — ${tk.ten}`, [
    truong('Họ và tên', oTen, 'Tên người dùng (học sinh hoặc cán sự lớp).'),
    truong('Vai trò hiển thị', hopVaiTro, 'Hiển thị trên hệ thống (Quản trị viên, Lớp trưởng, Thủ quỹ, Bí thư...).'),
    hopXemTruoc,
    Object.assign(e('p', 'trong', 'ℹ️ Tài khoản này KHÔNG nằm trong danh sách học sinh — chỉ làm được đúng những việc được tích dưới đây, không xem/sửa được gì khác. (Nếu muốn cấp quyền quản lý cho một học sinh sẵn có trong lớp, dùng nút "⚙ Quản lý" ở trang Học sinh thay vì tạo tài khoản riêng ở đây.)'), { style: 'margin-top:4px' }),
    truong('Phân quyền thao tác', hopQuyen, 'Chọn những việc tài khoản này được phép làm.'),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu thay đổi', '', async (ev) => {
      const tenMoi = oTen.value.trim();
      if (!tenMoi) return nhac('Tên không được để trống', 'xau');
      const quyenMoi = hopChon.filter((c) => c.checked).map((c) => c.value);
      if (!quyenMoi.length) return nhac('Phải chọn ít nhất một quyền', 'xau');

      const nutBam = ev.currentTarget;
      nutBam.disabled = true;
      try {
        await api('/api/gv/tai-khoan-phu', {
          method: 'PATCH',
          than: {
            id: tk.id,
            ten: tenMoi,
            vaiTro: oVaiTro.value.trim(),
            quyen: quyenMoi,
          },
        });
        dongHopThoai();
        nhac('Đã cập nhật tài khoản thành công', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        nutBam.disabled = false;
      }
    }),
  ]);
}

function datMaTuyChinhTaiKhoanPhu(tk, taiLai) {
  const oMa = oNhap('tkMaTuyChinh', 'text', tk.ma, 'Chữ hoa, chữ thường, số, ký tự đặc biệt — 3–32 ký tự');

  moHopThoai(`Đặt mã tuỳ chỉnh — ${tk.ten}`, [
    truong('Mã đăng nhập', oMa, 'Có thể đặt bất kỳ mã nào dễ nhớ, không giới hạn kiểu ký tự (trừ khoảng trắng).'),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      if (!oMa.value.trim()) return nhac('Chưa nhập mã', 'xau');
      const nutBam = ev.currentTarget;
      nutBam.disabled = true;
      try {
        const kq = await api('/api/gv/tai-khoan-phu', { method: 'PATCH', than: { id: tk.id, maTuyChinh: oMa.value } });
        dongHopThoai();
        nhac('Đã đặt mã: ' + kq.ma, 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        nutBam.disabled = false;
      }
    }),
  ]);
}

function taoTaiKhoan(cacQuyen, taiLai) {
  const oTen = oNhap('tkTen', 'text', '', 'Họ tên người được cấp quyền');
  const oVaiTro = oNhap('tkVaiTro', 'text', '', 'Ví dụ: Thủ quỹ, Lớp trưởng…');
  const oMa = oNhap('tkMa', 'text', '', 'Để trống = tự sinh mã ngẫu nhiên');

  const hopQuyen = e('div');
  hopQuyen.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:6px';
  const quyenDaChon = new Set();

  const ghiChuMedia = e('div');
  ghiChuMedia.style.cssText = 'padding:9px 12px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.25);border-radius:8px;font-size:12.5px;color:var(--chu);line-height:1.5;margin-bottom:4px;';
  datNoiDung(ghiChuMedia,
    Object.assign(e('b', null, '💡 Quy tắc Media: '), { style: 'color:var(--chinh)' }),
    document.createTextNode('Cấp quyền '),
    e('i', null, 'Thông báo'),
    document.createTextNode(' hoặc '),
    e('i', null, 'Hoạt động lớp'),
    document.createTextNode(' nếu không cấp kèm '),
    e('i', null, 'Thư viện Ảnh / Âm thanh / Video'),
    document.createTextNode(' thì tài khoản '),
    e('b', null, 'chỉ được ghi nội dung văn bản (text)'),
    document.createTextNode('; các mục tải/chọn media sẽ bị khoá.')
  );
  hopQuyen.append(ghiChuMedia);

  cacQuyen.forEach(([ma, moTa]) => {
    const nhan = e('label');
    nhan.style.cssText = 'display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13.5px;padding:8px 10px;border-radius:8px;background:var(--nen-chim);border:1px solid var(--vien);transition:all 0.15s;';
    nhan.addEventListener('mouseenter', () => { nhan.style.borderColor = 'var(--chinh)'; });
    nhan.addEventListener('mouseleave', () => { nhan.style.borderColor = 'var(--vien)'; });

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.style.cssText = 'margin-top:2px;cursor:pointer;flex-shrink:0;width:16px;height:16px;accent-color:var(--chinh)';
    cb.addEventListener('change', () => { cb.checked ? quyenDaChon.add(ma) : quyenDaChon.delete(ma); });

    const phanTach = moTa.split(' — ');
    const icon = ICON_QUYEN[ma] || '🔑';
    const chu = e('div');
    chu.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
    const dongTd = e('div');
    dongTd.style.cssText = 'font-weight:700;color:var(--chu);display:flex;align-items:center;gap:6px;';
    dongTd.append(e('span', null, icon), document.createTextNode(phanTach[0]));
    chu.append(dongTd, Object.assign(e('div', 'trong', phanTach[1] || ''), { style: 'font-size:12px;line-height:1.35;color:var(--chu-nhat);' }));

    nhan.append(cb, chu);
    hopQuyen.append(nhan);
  });

  moHopThoai('Cấp tài khoản mới', [
    Object.assign(e('p', 'trong', 'ℹ️ Dùng khi người được cấp quyền KHÔNG nằm trong danh sách học sinh (phụ huynh, người ngoài lớp…). Nếu là một học sinh sẵn có trong lớp, dùng nút "⚙ Quản lý" ở trang Học sinh thay vì tạo tài khoản riêng ở đây.'), { style: 'margin-bottom:2px' }),
    truong('Họ và tên', oTen),
    truong('Vai trò (chỉ để hiển thị)', oVaiTro),
    truong('Mã đăng nhập (không bắt buộc)', oMa),
    Object.assign(e('div', 'nhan-nhap', 'Được phép làm những việc sau'), { style: 'margin-top:6px' }),
    hopQuyen,
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Cấp tài khoản', '', async (ev) => {
      if (!oTen.value.trim()) return nhac('Chưa nhập tên', 'xau');
      if (!quyenDaChon.size) return nhac('Chọn ít nhất một việc được phép làm', 'xau');
      const nutBam = ev.currentTarget;
      nutBam.disabled = true;
      try {
        const kq = await api('/api/gv/tai-khoan-phu', {
          method: 'POST',
          than: { ten: oTen.value, vaiTro: oVaiTro.value, quyen: [...quyenDaChon], ma: oMa.value || undefined },
        });
        dongHopThoai();
        nhac(`Đã cấp tài khoản. Mã: ${kq.ma}`, 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        nutBam.disabled = false;
      }
    }),
  ]);
}

/* ================= Lịch sử Thủ quỹ (khôi phục + khoản thu + khoản chi + thu cố định) =================
   Gộp cả 4 loại lịch sử vào MỘT trang có tab, thay vì tách rời "Lịch sử & khôi phục" và
   "Thu cố định" như trước (mục thu cố định từng nằm cuối danh sách Khoản thu, rất dễ bị bỏ
   sót) — giờ "🛡️ Lịch sử & khôi phục" ở đầu trang Thủ quỹ là NƠI DUY NHẤT để xem mọi lịch sử. */

/** D1 lưu giờ UTC — cộng 7 tiếng để hiện đúng giờ Việt Nam. */
export function taoLucVN(taoLuc) {
  const d = new Date(taoLuc.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return taoLuc;
  d.setHours(d.getHours() + 7);
  const gio = String(d.getHours()).padStart(2, '0');
  const phut = String(d.getMinutes()).padStart(2, '0');
  return `${gio}:${phut} ${ngayVN(d.toISOString().slice(0, 10))}`;
}

/** Như taoLucVN() nhưng viết ĐẦY ĐỦ "Ngày... tháng... năm..." theo đúng văn phong Việt Nam
    (không chỉ gạch chéo dd/mm/yyyy dễ lẫn với kiểu Mỹ) — dùng cho những chỗ liệt kê theo ngày
    là chính (vd Lịch sử Điểm danh). */
export function taoLucVNNgayTruoc(taoLuc) {
  const d = new Date(taoLuc.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return taoLuc;
  d.setHours(d.getHours() + 7);
  const gio = String(d.getHours()).padStart(2, '0');
  const phut = String(d.getMinutes()).padStart(2, '0');
  const ngay = String(d.getDate()).padStart(2, '0');
  const thang = String(d.getMonth() + 1).padStart(2, '0');
  return `Ngày ${ngay} tháng ${thang} năm ${d.getFullYear()} lúc ${gio}:${phut}`;
}

const CHU_KY_HIEN_THI = { tuan: 'Theo tuần', thang: 'Theo tháng', nam: 'Theo năm' };

export async function trangQuyLichSu(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());
  let tab = 'khoi_phuc';   // 'khoi_phuc' | 'thu' | 'chi' | 'co_dinh'

  // Tra MỘT LẦN cho cả trang. "laGiaoVien" giờ CHỈ còn dùng để ẩn/hiện các thao tác của riêng
  // tab "🛡️ Khôi phục" (xem/khôi phục/xoá điểm khôi phục) — thứ duy nhất vẫn mãi mãi chỉ giáo
  // viên chủ nhiệm mới đụng tới được (bocXuLy() phía máy chủ tự chặn cứng, xem
  // functions/api/gv/quy-checkpoint.js). Xoá khoản thu/khoản chi/lần đóng ở 2 tab còn lại thì
  // tài khoản thủ quỹ (phu + quyền "quy") làm được BÌNH THƯỜNG như giáo viên — ai vào được
  // trang này cũng đã đủ quyền "quy" nên không cần điều kiện riêng cho các nút xoá đó nữa.
  const phienD = await api('/api/whoami').catch(() => ({ role: '' }));
  const laGiaoVien = phienD.role === 'teacher';

  /** Tab "🛡️ Khôi phục" — nội dung y hệt trang cũ, chỉ bỏ phần tiêu đề/nút Về Thủ quỹ (giờ
      nằm ở khung chung của cả trang lịch sử). */
  async function veTabKhoiPhuc() {
    const d = await api('/api/gv/quy-checkpoint');
    const khung = e('div');

    // Tài khoản không phải giáo viên (vd Thủ quỹ) chỉ xem được danh sách này, không có nút
    // Khôi phục/Xoá nào cả — đã đủ tự giải thích, không cần thêm ghi chú nhắc lại.
    if (laGiaoVien) {
      const the = e('div', 'the');
      the.style.borderColor = 'var(--chinh)';
      the.append(
        e('h3', null, 'Nếu tài khoản bị lộ hoặc dữ liệu sai'),
        e('p', null, 'Chọn đúng thời điểm trước khi sự cố xảy ra, bấm "Khôi phục về đây". Toàn bộ khoản thu, khoản đã đóng và khoản chi sẽ trở về đúng như lúc đó. Bản thân việc khôi phục cũng được lưu lại một điểm mới, nên nếu chọn nhầm vẫn quay lại được.')
      );
      khung.append(the);
    }

    if (!d.danhSach.length) {
      khung.append(e('p', 'trong', 'Chưa có điểm khôi phục nào — sẽ tự xuất hiện khi có thao tác đầu tiên trên Thủ quỹ.'));
      return khung;
    }

    if (laGiaoVien) {
      const nutXoaTatCaCp = e('div');
      nutXoaTatCaCp.style.cssText = 'margin-bottom:10px;text-align:right';
      nutXoaTatCaCp.append(nut('🗑 Xoá tất cả điểm khôi phục', 'nut-nhe nut-nho', () => {
        moHopThoai('Xoá TOÀN BỘ lịch sử khôi phục?', [
          e('p', null, `Toàn bộ ${d.danhSach.length} điểm khôi phục sẽ mất vĩnh viễn.`),
          e('p', 'trong', 'Đây là lưới an toàn duy nhất nếu tài khoản bị lộ hay ghi nhầm số liệu — xoá xong sẽ KHÔNG còn cách nào quay lại các thời điểm cũ nữa. Chỉ xoá khi chắc chắn không cần nữa.'),
        ], [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá tất cả', 'nut-xau', async (ev) => {
            const nutBam = ev.currentTarget;
            nutBam.disabled = true;
            try {
              await api('/api/gv/quy-checkpoint?tatCa=1', { method: 'DELETE' });
              dongHopThoai();
              nhac('Đã xoá toàn bộ lịch sử khôi phục', 'tot');
              ve();
            } catch (err) {
              nhac(err.message, 'xau');
              nutBam.disabled = false;
            }
          }),
        ]);
      }));
      khung.append(nutXoaTatCaCp);
    }

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
              const nutBam = ev.currentTarget;
              nutBam.disabled = true;
              try {
                await api('/api/gv/quy-checkpoint', { method: 'POST', than: { id: cp.id } });
                dongHopThoai();
                nhac('Đã khôi phục Thủ quỹ', 'tot');
                ve();
              } catch (err) {
                nhac(err.message, 'xau');
                nutBam.disabled = false;
              }
            }),
          ]);
        }));
        viec.append(nut('🗑 Xoá', 'nut-nho nut-nhe', () => {
          moHopThoai('Xoá điểm khôi phục này?', [
            e('p', null, cp.hanhDong),
            e('p', 'trong', 'Chỉ xoá dòng lịch sử này — không ảnh hưởng số liệu thu chi hiện tại. Không thể hoàn tác.'),
          ], [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá', 'nut-xau', async (ev) => {
              const nutBam = ev.currentTarget;
              nutBam.disabled = true;
              try {
                await api('/api/gv/quy-checkpoint?id=' + cp.id, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá điểm khôi phục', 'tot');
                ve();
              } catch (err) {
                nhac(err.message, 'xau');
                nutBam.disabled = false;
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
    return khung;
  }

  /** Tab "💰 Khoản thu" — liệt kê theo MỤC LỚN (từng khoản thu), bấm vào một khoản mới hiện
      chi tiết ai đã đóng — không liệt kê phẳng từng lần đóng ngay từ đầu (khi khoản có hàng
      chục em, danh sách phẳng dài và khó tìm đúng khoản đang cần xem). */
  async function veTabLichSuThu() {
    const d = await api('/api/gv/quy');
    const khung = e('div');
    if (!d.khoan.length) { khung.append(e('p', 'trong', 'Chưa có khoản thu nào.')); return khung; }

    {
      const hangNut = e('div');
      hangNut.style.cssText = 'margin-bottom:10px;text-align:right';
      hangNut.append(nut('🗑 Xoá tất cả khoản thu', 'nut-nhe nut-nho', () => {
        moHopThoai('Xoá TOÀN BỘ khoản thu?', [
          e('p', null, `Toàn bộ ${d.khoan.length} khoản thu VÀ số tiền đã ghi cho từng em trong các khoản đó sẽ mất hết.`),
          e('p', 'trong', 'Nếu chọn nhầm, vào tab "🛡️ Khôi phục" để khôi phục lại đúng thời điểm trước khi xoá.'),
        ], [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá tất cả', 'nut-xau', async (ev) => {
            const nutBam = ev.currentTarget;
            nutBam.disabled = true;
            try {
              await api('/api/gv/quy?loai=khoan&tatCa=1', { method: 'DELETE' });
              dongHopThoai();
              nhac('Đã xoá toàn bộ khoản thu', 'tot');
              ve();
            } catch (err) {
              nhac(err.message, 'xau');
              nutBam.disabled = false;
            }
          }),
        ]);
      }));
      khung.append(hangNut);
    }

    const chiTiet = {};
    let moRongId = null;
    const ds = e('div', 'ds-khoan');
    khung.append(ds);

    function veChiTietAiDong(dk) {
      const daNop = dk.danhSach.filter((h) => h.daDong > 0);
      if (!daNop.length) return e('div', 'muc-khoan-chi-tiet trong', 'Chưa có ai đóng khoản này.');
      const box = e('div', 'muc-khoan-chi-tiet');
      const dsHs = e('div', 'ds-diem-danh');
      daNop.forEach((h) => {
        const hang = e('div', 'hang-hs');
        hang.append(e('div', 'ten', h.hoTen), e('span', 'nhan ' + (h.daDuDinh ? 'nhan-tot' : 'nhan-luuy'), '+' + tienVN(h.daDong)));
        dsHs.append(hang);
      });
      box.append(dsHs);
      return box;
    }

    function veHang(k) {
      const boc = e('div', 'muc-khoan');
      boc.id = 'ls-khoan-' + k.id;
      const hang = e('div', 'hang-hs hang-hs-doc');
      hang.style.cursor = 'pointer';
      const dong1 = e('div', 'hang-hs-dong1');
      const khoiTrai = e('div', 'hs-khoi-trai');
      khoiTrai.append(e('div', 'stt', k.dinhKyId ? '🔁' : '💰'));
      const thongTin = e('div', 'hs-thong-tin');
      const dongTen = e('div', 'hs-ten-to');
      dongTen.append(e('span', 'hs-ho-ten', k.ten), e('span', 'hs-to-badge', k.dinhKyId ? 'Thu cố định' : 'Thu linh động'));
      thongTin.append(dongTen);
      const pt = k.tongCanThu ? Math.round((k.tongDaThu / k.tongCanThu) * 100) : 0;
      thongTin.append(e('div', 'hs-chi-tiet-dong', `Đã thu ${tienVN(k.tongDaThu)}/${tienVN(k.tongCanThu)} (${pt}%)`));
      khoiTrai.append(thongTin);
      dong1.append(khoiTrai);
      const khoiPhai = e('div', 'hs-khoi-phai');
      {
        const bXoa = e('button', 'nut-thao-tac-lan xoa');
        bXoa.type = 'button';
        bXoa.title = 'Xoá khoản thu: ' + k.ten;
        bXoa.setAttribute('aria-label', 'Xoá khoản thu: ' + k.ten);
        bXoa.append(taoSvgIcon('M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6', 13, 13));
        bXoa.addEventListener('click', (ev) => {
          ev.stopPropagation();
          moHopThoai('Xoá khoản thu này?', e('p', null,
            `Toàn bộ số tiền đã ghi cho từng em trong khoản "${k.ten}" sẽ mất. Không thể hoàn tác.`), [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá', 'nut-xau', async () => {
              try {
                await api('/api/gv/quy?loai=khoan&id=' + k.id, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá khoản thu', 'tot');
                ve();
              } catch (err) { nhac(err.message, 'xau'); }
            }),
          ]);
        });
        khoiPhai.append(bXoa);
      }
      khoiPhai.append(khoiMoRongHang(moRongId === k.id));
      dong1.append(khoiPhai);
      hang.append(dong1);
      hang.addEventListener('click', async () => {
        await giuViTriCuonKhiVe('ls-khoan-' + k.id, async () => {
          moRongId = moRongId === k.id ? null : k.id;
          if (moRongId && !chiTiet[moRongId]) chiTiet[moRongId] = await api('/api/gv/quy?khoanId=' + moRongId);
          veLai();
        });
      });
      boc.append(hang);
      if (moRongId === k.id) boc.append(chiTiet[k.id] ? veChiTietAiDong(chiTiet[k.id]) : khoiDangTai());
      return boc;
    }

    function veLai() {
      ds.replaceChildren();
      d.khoan.forEach((k) => ds.append(veHang(k)));
    }
    veLai();
    return khung;
  }

  /** Tab "💸 Khoản chi" — lịch sử toàn bộ khoản chi, mới nhất trước (dùng lại đúng dữ liệu
      d.chi từ /api/gv/quy, đã sắp theo ngày giảm dần sẵn). */
  async function veTabLichSuChi() {
    const d = await api('/api/gv/quy');
    const khung = e('div');
    if (!d.chi.length) { khung.append(e('p', 'trong', 'Chưa có khoản chi nào.')); return khung; }

    {
      const hangNut = e('div');
      hangNut.style.cssText = 'margin-bottom:10px;text-align:right';
      hangNut.append(nut('🗑 Xoá tất cả khoản chi', 'nut-nhe nut-nho', () => {
        moHopThoai('Xoá TOÀN BỘ khoản chi?', [
          e('p', null, `Toàn bộ ${d.chi.length} khoản chi sẽ mất hết.`),
          e('p', 'trong', 'Nếu chọn nhầm, vào tab "🛡️ Khôi phục" để khôi phục lại đúng thời điểm trước khi xoá.'),
        ], [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá tất cả', 'nut-xau', async (ev) => {
            const nutBam = ev.currentTarget;
            nutBam.disabled = true;
            try {
              await api('/api/gv/quy?loai=chi&tatCa=1', { method: 'DELETE' });
              dongHopThoai();
              nhac('Đã xoá toàn bộ khoản chi', 'tot');
              ve();
            } catch (err) {
              nhac(err.message, 'xau');
              nutBam.disabled = false;
            }
          }),
        ]);
      }));
      khung.append(hangNut);
    }

    const ds = e('div', 'ds-nhat-ky');
    khung.append(ds);
    d.chi.forEach((c) => {
      const loaiTen = (CAC_LOAI_CHI.find((x) => x[0] === c.loai) || [null, 'Khác'])[1];
      const m = e('div', 'muc-nhat-ky khac');
      const dong = e('div', 'dong-dau');
      dong.append(
        e('span', 'ngay', ngayVN(c.ngay)),
        e('span', 'nhan nhan-xam', loaiTen),
        e('span', 'nhan nhan-luuy', '-' + tienVN(c.soTien))
      );
      {
        const viec = e('div', 'viec');
        viec.append(nut('🗑 Xoá', 'nut-nho nut-nhe', () => {
          moHopThoai('Xoá khoản chi này?', e('p', null, c.noiDung + ' — ' + tienVN(c.soTien)), [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá', 'nut-xau', async () => {
              try {
                await api('/api/gv/quy?loai=chi&id=' + c.id, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá khoản chi', 'tot');
                ve();
              } catch (err) { nhac(err.message, 'xau'); }
            }),
          ]);
        }));
        dong.append(viec);
      }
      m.append(dong, Object.assign(e('h3', null, c.noiDung), { style: 'margin:4px 0' }));
      if (c.ghiChu) m.append(e('p', null, c.ghiChu));
      ds.append(m);
    });
    return khung;
  }

  const TABS = [
    ['khoi_phuc', '🛡️ Khôi phục'],
    ['thu', '💰 Khoản thu'],
    ['chi', '💸 Khoản chi'],
  ];

  async function ve() {
    datNoiDung(KHUNG, khoiDangTai());
    const khung = e('div');

    // Đi thẳng bằng hash — nút này luôn về đúng một chỗ cố định (trang Thủ quỹ), nên không cần
    // history.back() (rủi ro tải lại cả trang, mất tiếng nhạc nền, nếu mục trước đó trong lịch
    // sử duyệt là một trang khác hẳn — vd trang lớp mở bằng link "⚙ Quản lý").
    const nutVeQuy = nut('← Về Thủ quỹ', 'nut-nhe nut-nho', () => { location.hash = '#/quy'; });
    const cardVeQuy = e('div');
    cardVeQuy.style.cssText = 'display:inline-flex;align-items:center;padding:2px 4px 2px 0;margin-bottom:10px;border-radius:10px;background:var(--nen-chim);border:1px solid var(--vien);';
    cardVeQuy.append(nutVeQuy);
    khung.append(cardVeQuy);
    khung.append(tieuDeTrang('Lịch sử Thủ quỹ',
      'Toàn bộ lịch sử ghi thu, ghi chi, các đợt thu cố định và điểm khôi phục — tất cả ở một chỗ.'));

    const hopTab = e('div', 'day-loc day-loc-deu');
    hopTab.id = 'quy-lich-su-tab';
    hopTab.style.margin = '4px 0 16px';
    hopTab.style.setProperty('--the-nho-nhat', '95px');
    TABS.forEach(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(tab === ma));
      b.addEventListener('click', () => {
        tab = ma;
        giuViTriCuonKhiVe('quy-lich-su-tab', ve);
      });
      hopTab.append(b);
    });
    khung.append(hopTab);

    if (tab === 'khoi_phuc') khung.append(await veTabKhoiPhuc());
    else if (tab === 'thu') khung.append(await veTabLichSuThu());
    else khung.append(await veTabLichSuChi());

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

