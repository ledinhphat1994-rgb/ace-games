import { e, datNoiDung, api, homNay, ngayVN, ngayDayDu, tienVN, nhac, khoiDangTai, layThongTinVaiTro, layNhanTaiKhoan } from '/assets/js/chung.js';
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

/* ================= Thủ quỹ — 1 trang, mở rộng tại chỗ, sửa được mọi bản ghi ================= */

export async function trangQuy(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());
  let d = null;                 // tổng quan
  let moRong = null;            // id khoản đang mở rộng (accordion) — chỉ 1 khoản mở cùng lúc
  const chiTiet = {};           // cache: { [khoanId]: dữ liệu chi tiết }
  const locToTheoKhoan = {};    // { [khoanId]: '' | soTo } — lọc tổ đang chọn trong từng khoản

  async function tai() {
    d = await api('/api/gv/quy');
    ve();
  }

  async function taiChiTiet(id) {
    chiTiet[id] = await api('/api/gv/quy?khoanId=' + id);
  }

  async function moKhoan(id) {
    moRong = moRong === id ? null : id;
    if (moRong && !chiTiet[moRong]) await taiChiTiet(moRong);
    ve();
  }

  async function lamMoiKhoanDangMo() {
    await Promise.all([tai(), moRong ? taiChiTiet(moRong) : Promise.resolve()]);
    ve();
  }

  function veHangKhoan(k) {
    const boc = e('div', 'muc-khoan');
    boc.id = 'khoan-' + k.id;
    // Dùng chung bố cục hang-hs-doc/hang-hs-dong1 với "Khoản chi" (xem veChi bên dưới) — trên
    // màn hẹp, tên khoản + số liệu xuống MỘT dòng riêng thay vì bị nhãn/mũi tên chen ngang giữa
    // chừng như kiểu .hang-hs cũ (đây là chỗ gây rối trên điện thoại khi có nhiều khoản thu).
    const hang = e('div', 'hang-hs hang-hs-doc');
    hang.style.cursor = 'pointer';

    const dong1 = e('div', 'hang-hs-dong1');
    const khoiTrai = e('div', 'hs-khoi-trai');
    khoiTrai.append(e('div', 'stt', k.dinhKyId ? '🔁' : '💰'));

    const thongTin = e('div', 'hs-thong-tin');
    const dongTen = e('div', 'hs-ten-to');
    dongTen.append(e('span', 'hs-ho-ten', k.ten));
    thongTin.append(dongTen);
    const phanTram = k.tongCanThu ? Math.round((k.tongDaThu / k.tongCanThu) * 100) : 0;
    const dongChiTiet = e('div', 'hs-chi-tiet-dong');
    dongChiTiet.append(e('span', null, `${tienVN(k.soTienMoiEm)}/em`));
    // Khoản "Thu nhanh" không có khoảng ngày gắn sẵn trong tên (khác kỳ định kỳ, tên đã có
    // sẵn "— Tuần N (dd/mm–dd/mm)") nên hiện thêm ở đây cho rõ khoảng thời gian thu.
    if (k.ngayBatDau && !k.dinhKyId) {
      dongChiTiet.append(
        e('span', 'cham-cach', '·'),
        e('span', null, `${ngayVN(k.ngayBatDau)}–${ngayVN(k.ngayKetThuc)}`)
      );
    }
    dongChiTiet.append(
      e('span', 'cham-cach', '·'),
      e('span', null, `Đã thu ${tienVN(k.tongDaThu)}/${tienVN(k.tongCanThu)} (${phanTram}%)`)
    );
    thongTin.append(dongChiTiet);
    khoiTrai.append(thongTin);
    dong1.append(khoiTrai);

    const khoiPhai = e('div', 'hs-khoi-phai');
    if (!k.dangMo) {
      khoiPhai.append(e('span', 'nhan nhan-xam', 'Đã đóng'));
    } else if (phanTram >= 100) {
      khoiPhai.append(e('span', 'nhan nhan-tot', '✓ Đã thu đủ'));
    } else {
      khoiPhai.append(e('span', 'nhan nhan-chinh', `Thu ${phanTram}% · ${k.soEmChuaDu} em chưa đủ`));
    }
    khoiPhai.append(e('span', 'muc-khoan-mui-ten', moRong === k.id ? '▾' : '▸'));
    dong1.append(khoiPhai);

    hang.append(dong1);
    hang.addEventListener('click', () => moKhoan(k.id));
    boc.append(hang);

    if (moRong === k.id) {
      const chiTietBox = e('div', 'muc-khoan-chi-tiet');
      chiTietBox.append(chiTiet[k.id] ? veChiTietKhoan(k.id, chiTiet[k.id]) : khoiDangTai());
      boc.append(chiTietBox);
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
    } else if (dk.khoan.ngayBatDau) {
      const tb = e('div', 'the trong');
      tb.style.cssText = 'margin-bottom:14px';
      tb.append(e('span', null, `⚡ Thu nhanh — khoảng thời gian thu: ${ngayVN(dk.khoan.ngayBatDau)}–${ngayVN(dk.khoan.ngayKetThuc)}.`));
      box.append(tb);
    }

    const hangNut = e('div', 'day-loc');
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

    // Dải số liệu THU CHI NỔI BẬT với thẻ riêng & số to rõ (tự thích ứng, không bao giờ bị cắt chữ)
    const phanTram = dk.tongCanThu ? Math.round((dk.tongDaThu / dk.tongCanThu) * 100) : 0;
    const conThieuKhoan = Math.max(0, (dk.tongCanThu || 0) - (dk.tongDaThu || 0));

    const soLieu = (nhan, giaTri, kieu, phu = null) => {
      const the = e('div', 'the-so-lieu');
      the.append(
        e('div', 'nhan-so-lieu', nhan),
        e('div', 'gt-so-lieu' + (kieu ? ' ' + kieu : ''), giaTri)
      );
      if (phu) {
        the.append(e('div', 'phu-so-lieu', phu));
      }
      return the;
    };
    const day = e('div', 'chuoi-so-lieu');
    day.append(
      soLieu('Đã thu', tienVN(dk.tongDaThu), 'tot', `Đạt ${phanTram}% chỉ tiêu`),
      soLieu('Chỉ tiêu thu (tổng cả lớp)', tienVN(dk.tongCanThu), 'can', `Mức ${tienVN(dk.khoan?.soTienMoiEm)} / em × ${dk.danhSach.length} em`),
      soLieu('Còn thiếu (để đủ chỉ tiêu)', tienVN(conThieuKhoan), conThieuKhoan > 0 ? 'luuy' : 'tot', `${dk.danhSach.length - dk.soEmDaDuDinh} em chưa nộp đủ`),
      soLieu('Tiến độ thu', `${dk.soEmDaDuDinh}/${dk.danhSach.length} em đủ`, dk.soEmDaDuDinh === dk.danhSach.length ? 'tot' : 'luuy', `Hoàn thành ${phanTram}% tổng quỹ`)
    );
    box.append(day);

    // Thanh tiến độ trực quan
    const thanhTienDo = e('div', 'thanh-tien-do-khoan');
    const chay = e('div', 'thanh-tien-do-khoan-chay');
    chay.style.width = Math.min(100, Math.max(0, phanTram)) + '%';
    thanhTienDo.append(chay);
    box.append(thanhTienDo);

    if (dk.theoTo && dk.theoTo.length > 1) {
      const nhanNhomTo = e('div', 'the-nhan', 'Theo tổ');
      nhanNhomTo.style.margin = '14px 0 6px';
      box.append(nhanNhomTo);
      const dayTo = e('div', 'day-loc');
      dk.theoTo.forEach((t) => {
        dayTo.append(e('span', 'nhan ' + (t.soEmDuDinh === t.soEm ? 'nhan-tot' : 'nhan-luuy'),
          `${t.toSo ? 'Tổ ' + t.toSo : 'Chưa xếp tổ'}: ${t.soEmDuDinh}/${t.soEm} đủ`));
      });
      box.append(dayTo);
    }

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

    function capNhatNutLoc() {
      const dsGoc = dk.danhSach;
      const soDaDu = dsGoc.filter((h) => h.daDuDinh).length;
      const soConThieu = dsGoc.filter((h) => !h.daDuDinh && h.daDong > 0).length;
      const soChuaDong = dsGoc.filter((h) => !h.daDuDinh && (!h.daDong || h.daDong === 0)).length;

      const taoNutLoc = (id, label, so) => {
        const b = e('button', null, `${label} (${so})`);
        if (boLocTrangThai === id) b.classList.add('active');
        b.addEventListener('click', () => {
          boLocTrangThai = id;
          capNhatNutLoc();
          veDsEm();
        });
        return b;
      };

      datNoiDung(hopLocTrangThai,
        taoNutLoc('', 'Tất cả', dsGoc.length),
        taoNutLoc('chua_dong', '✕ Chưa đóng', soChuaDong),
        taoNutLoc('con_thieu', '⚠️ Còn thiếu', soConThieu),
        taoNutLoc('da_du', '✓ Đã đủ', soDaDu)
      );
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
        const hang = e('div', 'hang-hs hang-hs-doc');
        const dong1 = e('div', 'hang-hs-dong1');

        // Khối bên trái: STT + Tên học sinh + Tổ + Chi tiết đóng tiền nổi bật
        const khoiTrai = e('div', 'hs-khoi-trai');
        const sttEl = e('div', 'stt', h.hocSinhId);
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
          tienChua.append('Chưa nộp · Mức thu: ', e('strong', null, tienVN(h.conThieu)));
          dongTien.append(tienChua);
        }

        thongTin.append(dongTen, dongTien);
        khoiTrai.append(sttEl, thongTin);

        // Khối bên phải: Huy hiệu trạng thái + Nút Ghi thu
        const khoiPhai = e('div', 'hs-khoi-phai');
        khoiPhai.append(
          nhanBadge,
          nut('+ Ghi thu', 'nut-vien nut-nho', () => ghiKhoanDong(khoanId, h, lamMoiKhoanDangMo))
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
                    nhac('Đã xoá', 'tot');
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
    const the = e('div', 'the');
    const dauChi = e('div', 'tieu-de-trang');
    dauChi.append(e('h2', null, '💸 Khoản chi'));
    const phaiChi = e('div', 'phai');
    phaiChi.append(nut('➕ Ghi khoản chi', 'nut-vien nut-nho', () => ghiKhoanChi(tai)));
    dauChi.append(phaiChi);
    the.append(dauChi);

    if (!d.chi.length) {
      the.append(e('p', 'trong', 'Chưa có khoản chi nào.'));
      return the;
    }

    const ds = e('div', 'ds-diem-danh');
    d.chi.forEach((c) => {
      const hang = e('div', 'hang-hs hang-hs-doc');
      const dong1 = e('div', 'hang-hs-dong1');

      const khoiTrai = e('div', 'hs-khoi-trai');
      const thongTin = e('div', 'hs-thong-tin');

      const dongTen = e('div', 'hs-ten-to');
      dongTen.append(e('span', 'hs-ho-ten', c.noiDung));
      const loaiTen = (CAC_LOAI_CHI.find((x) => x[0] === c.loai) || [null, 'Khác'])[1];
      dongTen.append(e('span', 'hs-to-badge', loaiTen));

      const dongTien = e('div', 'hs-chi-tiet-dong');
      const tienChi = e('span', 'tien-nhan-muc chua-dong');
      tienChi.append('Đã chi: ', e('strong', null, '-' + tienVN(c.soTien)));
      const ngayChi = e('span', 'lan-dong-ngay', `Ngày chi: ${ngayVN(c.ngay)}`);
      dongTien.append(tienChi, e('span', 'cham-cach', '·'), ngayChi);

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
    // Chỉ còn 1 lối tắt CHUNG cho cả trang (xem lịch sử) — nút "Ghi khoản thu" đã dời xuống
    // ngay trong thẻ "Khoản thu" bên dưới, đồng cấp với nút "Ghi khoản chi" trong thẻ "Khoản
    // chi" (cùng cách đặt tên, cùng bố cục). Bỏ luôn nút "Các mẫu thu định kỳ" ở đây — mọi kỳ
    // của một mẫu thu cố định giờ sinh sẵn ngay lúc tạo nên không còn thao tác "dừng/tiếp tục"
    // để quản lý riêng; trang "#/quy-dinh-ky" vẫn còn, chỉ để xem lại lịch sử các đợt đã tạo.
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

    if (!d.khoan.length && !d.chi.length) {
      const huongDan = e('div', 'the');
      huongDan.style.cssText = 'margin-top:16px;border-color:var(--chinh)';
      huongDan.append(
        e('h3', null, 'Bắt đầu thu quỹ cho lớp'),
        e('p', null, `Lớp có ${d.siSo} học sinh. Bấm "Ghi khoản thu" bên dưới — trong hộp thoại có thể chọn thu nhanh (vd: quỹ đầu năm, tiền mua đồ dùng chung — 1 lần, có khoảng thời gian rõ ràng) hoặc thu cố định tự lặp lại theo tuần/tháng/năm (vd: quỹ lớp 5.000đ/tuần).`),
        nut('➕ Ghi khoản thu', 'nut-vien nut-nho', () => moKhoanMoi(tai))
      );
      const a = e('a', null, '☰ Xem danh sách lớp');
      a.href = '#/hoc-sinh';
      a.style.cssText = 'display:inline-block;margin-top:12px;font-size:13.5px';
      huongDan.append(a);
      khung.append(huongDan);
    }

    // Bố cục 2 cột trên màn hình đủ rộng: khoản thu bên trái (rộng hơn — nhiều dữ liệu hơn),
    // khoản chi bên phải; xếp dọc 1 cột khi màn hẹp thay vì ép 2 cột chật.
    const luoiChinh = e('div', 'luoi luoi-quy');
    luoiChinh.style.marginTop = '16px';

    const theKhoan = e('div', 'the');
    // Cùng bố cục "tiêu-de-trang" (h2 + nút ở phải) với thẻ Khoản chi bên dưới, cùng cách đặt
    // tên "Khoản thu"/"Khoản chi" và "Ghi khoản thu"/"Ghi khoản chi" — hai thẻ giờ đồng bộ cả
    // bố cục lẫn cách gọi tên, không còn lệch nhau như trước (Các khoản thu/Khoản chi,
    // Thêm khoản thu/Ghi khoản chi).
    const dauKhoan = e('div', 'tieu-de-trang');
    dauKhoan.append(e('h2', null, '💰 Khoản thu'));
    const phaiKhoan = e('div', 'phai');
    phaiKhoan.append(nut('➕ Ghi khoản thu', 'nut-vien nut-nho', () => moKhoanMoi(tai)));
    dauKhoan.append(phaiKhoan);
    theKhoan.append(dauKhoan);
    if (!d.khoan.length) {
      theKhoan.append(e('p', 'trong', 'Chưa có khoản thu nào.'));
    } else {
      // Chọn nhanh — chỉ hiện trên màn hẹp (xem CSS .quy-chon-nhanh), nơi danh sách xếp
      // một cột nên nhiều khoản là phải kéo dài; chọn ở đây mở thẳng đúng khoản, khỏi dò.
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
          if (moRong !== id) await moKhoan(id);
          document.getElementById('khoan-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          oChonNhanh.value = '';
        });
        theKhoan.append(oChonNhanh);
      }

      const ds = e('div', 'ds-khoan');
      d.khoan.forEach((k) => ds.append(veHangKhoan(k)));
      theKhoan.append(ds);

      // Lối vào duy nhất còn lại tới trang quản lý mẫu định kỳ — chỉ cần cho trường hợp hiếm:
      // xoá một mẫu vừa tạo nhầm mà ngày bắt đầu còn ở tương lai nên chưa sinh kỳ nào (dừng/mở
      // lại một mẫu đã có kỳ thì làm ngay trong chi tiết kỳ đó, xem veChiTietKhoan ở trên).
      const lienKetDinhKy = e('a', null, '🔁 Xem tất cả các mẫu thu định kỳ');
      lienKetDinhKy.href = '#/quy-dinh-ky';
      lienKetDinhKy.style.cssText = 'display:inline-block;margin-top:12px;font-size:13px;color:var(--chu-nhat)';
      theKhoan.append(lienKetDinhKy);
    }
    luoiChinh.append(theKhoan);

    const cotPhai = e('div');
    cotPhai.append(veChi());
    const chiTheoLoai = veChiTheoLoai();
    if (chiTheoLoai) cotPhai.append(chiTheoLoai);
    luoiChinh.append(cotPhai);

    khung.append(luoiChinh);
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
      ev.currentTarget.disabled = true;
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
        ev.currentTarget.disabled = false;
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
      ev.currentTarget.disabled = true;
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
        ev.currentTarget.disabled = false;
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
      ev.currentTarget.disabled = true;
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
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

// Loại thu chọn ngay khi tạo — gộp chung "khoản thu một lần" và "mẫu thu định kỳ" (trước đây
// là 2 nút, 2 khái niệm tách rời khiến không rõ định kỳ nghĩa là gì) vào MỘT hộp thoại duy
// nhất: chọn định kỳ thì các trường đổi theo và có giải thích lịch sinh kỳ ngay tại chỗ.
const LOAI_CHINH_THU = [['nhanh', '⚡ Thu nhanh'], ['co_dinh', '🔒 Thu cố định']];
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

function moKhoanMoi(taiLai, loaiChinhMacDinh = 'nhanh') {
  const oLoaiChinh = oChon('qLoaiChinh', LOAI_CHINH_THU, loaiChinhMacDinh);
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

      ev.currentTarget.disabled = true;
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

const CAC_LOAI_CHI = [
  ['hoat_dong', 'Hoạt động lớp'], ['vpp', 'Văn phòng phẩm'],
  ['khen_thuong', 'Khen thưởng'], ['ho_tro', 'Hỗ trợ học sinh'], ['khac', 'Khác'],
];

function ghiKhoanChi(taiLai) {
  const oNoiDung = oNhap('cNoiDung', 'text', '', 'Ví dụ: Mua hoa 20/11');
  const oSoTien = oNhap('cSoTien', 'number', '');
  const oNgay = oNhap('cNgay', 'date', homNay());
  const oLoai = oChon('cLoai', CAC_LOAI_CHI, 'hoat_dong');
  const oGc = oNhap('cGc', 'text', '', 'Ghi chú (không bắt buộc)');

  moHopThoai('Ghi khoản chi', [
    truong('Nội dung chi', oNoiDung),
    truong('Số tiền (đồng)', oSoTien),
    truong('Ngày chi', oNgay),
    truong('Loại chi', oLoai),
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
          than: { hanhDong: 'ghi_chi', noiDung: oNoiDung.value, soTien, ngay: oNgay.value, loai: oLoai.value, ghiChu: oGc.value },
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
        'nhat-ky': '📖',
        'diem-danh': '✅',
        'hinh-anh': '📸',
      };

      d.danhSach.forEach((tk) => {
        const the = e('div', 'the the-tk-phu');
        const info = layThongTinVaiTro(tk.vaiTro);

        const dau2 = e('div', 'the-tk-dau');
        dau2.style.cssText = 'display:flex;align-items:center;gap:14px;justify-content:space-between;flex-wrap:wrap';

        const khoiTrai = e('div');
        khoiTrai.style.cssText = 'display:flex;align-items:center;gap:12px;min-width:0';

        const avatar = e('div', 'the-tk-avatar');
        avatar.style.cssText = `width:46px;height:46px;border-radius:13px;display:grid;place-items:center;font-size:22px;background:${info.mauNen};border:1.5px solid ${info.mauVien};box-shadow:0 4px 14px -3px ${info.mauVien};flex:none;`;
        avatar.textContent = info.bieuTuong;

        const thongTin = e('div');
        thongTin.style.cssText = 'min-width:0;display:flex;flex-direction:column;gap:3px';

        const dongTen = e('div');
        dongTen.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap';
        dongTen.append(
          Object.assign(e('h3', null, tk.ten), { style: 'margin:0;font-size:16.5px;font-weight:700;' }),
          Object.assign(e('span', 'nhan', `${info.bieuTuong} ${info.tenGoi}`), {
            style: `background:${info.mauNen};border-color:${info.mauVien};color:${info.mauChu};font-weight:700;font-size:12px;padding:2px 9px;border-radius:6px;`
          })
        );

        const nhanDangNhap = layNhanTaiKhoan({ role: 'phu', vaiTro: tk.vaiTro, ten: tk.ten });
        const dongDangNhap = e('div');
        dongDangNhap.style.cssText = 'font-size:12.5px;color:var(--chu-nhat);display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:2px';
        dongDangNhap.append(
          document.createTextNode('Hiển thị khi đăng nhập: '),
          Object.assign(e('span', null, nhanDangNhap), {
            style: 'color:var(--chinh);font-weight:600;'
          })
        );

        thongTin.append(dongTen, dongDangNhap);
        khoiTrai.append(avatar, thongTin);

        const khoiPhai = e('div');
        khoiPhai.style.cssText = 'display:flex;align-items:center;gap:8px';
        if (!tk.dangHoatDong) {
          khoiPhai.append(e('span', 'nhan nhan-xam', '🔒 Đã khoá'));
        } else {
          khoiPhai.append(e('span', 'nhan nhan-tot', '✓ Đang hoạt động'));
        }

        dau2.append(khoiTrai, khoiPhai);
        the.append(dau2);

        const oQuyen = e('div', 'day-loc');
        oQuyen.style.cssText = 'margin-top:12px;gap:6px;flex-wrap:wrap;';
        tk.quyen.forEach((q) => {
          const ten = (d.cacQuyen.find((x) => x[0] === q) || [q, q])[1].split(' — ')[0];
          const icon = ICON_QUYEN[q] || '⭐';
          const chip = e('span', 'nhan nhan-tim');
          chip.style.cssText = 'display:inline-flex;align-items:center;gap:5px;font-size:12.5px;padding:3px 10px;font-weight:600;border-radius:8px;';
          chip.append(e('span', null, icon), document.createTextNode(ten));
          oQuyen.append(chip);
        });
        the.append(oQuyen);

        const maHop = e('p');
        maHop.style.cssText = 'margin-top:12px;font-size:14px;color:var(--chu-nhat);display:flex;align-items:center;gap:8px;flex-wrap:wrap;';
        const maChu = e('code', null, tk.ma);
        maChu.style.cssText = 'font-size:16px;font-weight:800;letter-spacing:1.5px;padding:3px 8px;border-radius:6px;color:var(--chinh);background:var(--nen-chim);border:1px solid var(--vien);';
        maHop.append(document.createTextNode('Mã đăng nhập: '), maChu);
        the.append(maHop);

        const nutHang = e('div', 'day-loc');
        nutHang.style.cssText = 'margin-top:12px;gap:8px;flex-wrap:wrap;';
        nutHang.append(
          nut('✏ Sửa tài khoản', 'nut-vien nut-nho', () => suaTaiKhoan(tk, d.cacQuyen, ve)),
          nut('✎ Đặt mã tuỳ chỉnh', 'nut-vien nut-nho', () => datMaTuyChinhTaiKhoanPhu(tk, ve)),
          nut('🎲 Cấp lại mã', 'nut-nhe nut-nho', () => {
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
          nut(tk.dangHoatDong ? '🔒 Khoá lại' : '🔓 Mở lại', 'nut-nhe nut-nho', async () => {
            try {
              await api('/api/gv/tai-khoan-phu', { method: 'PATCH', than: { id: tk.id, dangHoatDong: !tk.dangHoatDong } });
              nhac(tk.dangHoatDong ? 'Đã khoá tài khoản' : 'Đã mở lại tài khoản', 'tot');
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          }),
          nut('🗑 Xoá hẳn', 'nut-nhe nut-nho', () => {
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
          Object.assign(e('span', 'nhan', `${inf.bieuTuong} ${inf.tenGoi}`), {
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
  capNhatXemTruoc();

  const hopQuyen = e('div');
  hopQuyen.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:6px';
  const hopChon = [];

  cacQuyen.forEach(([ma, moTa]) => {
    const nhan = e('label');
    nhan.style.cssText = 'display:flex;align-items:flex-start;gap:8px;cursor:pointer;font-size:14px';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = ma;
    cb.checked = (tk.quyen || []).includes(ma);
    hopChon.push(cb);
    const phanTach = moTa.split(' — ');
    const chu = e('div');
    chu.append(e('b', null, phanTach[0]), Object.assign(e('div', 'trong', phanTach[1] || ''), { style: 'font-size:12px' }));
    nhan.append(cb, chu);
    hopQuyen.append(nhan);
  });

  moHopThoai(`Sửa tài khoản — ${tk.ten}`, [
    truong('Họ và tên', oTen, 'Tên người dùng (học sinh hoặc cán sự lớp).'),
    truong('Vai trò hiển thị', hopVaiTro, 'Hiển thị trên hệ thống (Quản trị viên, Lớp trưởng, Thủ quỹ, Bí thư...).'),
    hopXemTruoc,
    truong('Phân quyền thao tác', hopQuyen, 'Chọn những việc tài khoản này được phép làm.'),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu thay đổi', '', async (ev) => {
      const tenMoi = oTen.value.trim();
      if (!tenMoi) return nhac('Tên không được để trống', 'xau');
      const quyenMoi = hopChon.filter((c) => c.checked).map((c) => c.value);
      if (!quyenMoi.length) return nhac('Phải chọn ít nhất một quyền', 'xau');

      ev.currentTarget.disabled = true;
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
        ev.currentTarget.disabled = false;
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
      ev.currentTarget.disabled = true;
      try {
        const kq = await api('/api/gv/tai-khoan-phu', { method: 'PATCH', than: { id: tk.id, maTuyChinh: oMa.value } });
        dongHopThoai();
        nhac('Đã đặt mã: ' + kq.ma, 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

function taoTaiKhoan(cacQuyen, taiLai) {
  const oTen = oNhap('tkTen', 'text', '', 'Họ tên người được cấp quyền');
  const oVaiTro = oNhap('tkVaiTro', 'text', '', 'Ví dụ: Thủ quỹ, Lớp trưởng…');
  const oMa = oNhap('tkMa', 'text', '', 'Để trống = tự sinh mã ngẫu nhiên');

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
    truong('Mã đăng nhập (không bắt buộc)', oMa),
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
          than: { ten: oTen.value, vaiTro: oVaiTro.value, quyen: [...quyenDaChon], ma: oMa.value || undefined },
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
    // Đi thẳng bằng hash — nút này luôn về đúng một chỗ cố định (trang Thủ quỹ), nên không cần
    // history.back() (rủi ro tải lại cả trang, mất tiếng nhạc nền, nếu mục trước đó trong lịch
    // sử duyệt là một trang khác hẳn — vd trang lớp mở bằng link "⚙ Quản lý").
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

/* ================= Thu cố định (lịch sử các đợt) ================= */
// Tạo mẫu mới giờ dùng chung hộp thoại moKhoanMoi(taiLai, 'co_dinh') ở trên — không còn hộp
// thoại riêng nữa, tránh 2 nơi tạo cùng một thứ mà giao diện khác nhau. Trang này giờ CHỈ để
// xem lại lịch sử — mọi kỳ đã sinh sẵn hết ngay lúc tạo (xem functions/api/gv/quy-dinh-ky.js)
// nên không còn thao tác "dừng/tiếp tục" nào để quản lý riêng ở đây nữa; muốn bỏ một kỳ cụ thể
// thì xoá đúng khoản đó trong "Khoản thu" ở trang Thủ quỹ.

const CHU_KY_HIEN_THI = { tuan: 'Theo tuần', thang: 'Theo tháng', nam: 'Theo năm' };

export async function trangQuyDinhKy(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const d = await api('/api/gv/quy-dinh-ky');
    const khung = e('div');

    // Đi thẳng bằng hash — nút này luôn về đúng một chỗ cố định (trang Thủ quỹ), nên không cần
    // history.back() (rủi ro tải lại cả trang, mất tiếng nhạc nền, nếu mục trước đó trong lịch
    // sử duyệt là một trang khác hẳn — vd trang lớp mở bằng link "⚙ Quản lý").
    khung.append(nut('← Về Thủ quỹ', 'nut-nhe nut-nho', () => { location.hash = '#/quy'; }));
    khung.append(tieuDeTrang('Thu cố định — lịch sử các đợt',
      'Mỗi đợt là một chuỗi khoản thu tự sinh nối tiếp nhau, đã tạo sẵn toàn bộ ngay từ đầu.',
      nut('+ Ghi khoản thu', '', () => moKhoanMoi(ve, 'co_dinh'))
    ));

    if (!d.danhSach.length) {
      khung.append(e('div', 'the trong', 'Chưa có đợt thu cố định nào.'));
    } else {
      const ds = e('div', 'ds-the');
      d.danhSach.forEach((dk) => {
        const the = e('div', 'the');
        the.append(e('h3', null, dk.ten));
        the.append(e('p', null,
          `${CHU_KY_HIEN_THI[dk.chuKy] || dk.chuKy} · ${tienVN(dk.soTienMoiKy)}/em/kỳ · ${dk.soKy} kỳ · `
          + `kỳ 1: ${ngayVN(dk.ngayBatDau)}–${ngayVN(dk.ngayKetThuc)}`));
        ds.append(the);
      });
      khung.append(ds);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

