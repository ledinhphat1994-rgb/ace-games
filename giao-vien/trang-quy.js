/* Thủ quỹ lớp và trang Phân quyền (tài khoản đặc biệt). */
import { e, datNoiDung, api, homNay, ngayVN, tienVN, nhac, khoiDangTai } from '/assets/js/chung.js';
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
    const hang = e('div', 'hang-hs');
    hang.style.cursor = 'pointer';
    const ten = e('div', 'ten');
    const phanTram = k.tongCanThu ? Math.round((k.tongDaThu / k.tongCanThu) * 100) : 0;
    ten.append(e('b', null, k.ten), e('small', null,
      `${tienVN(k.soTienMoiEm)}/em · đã thu ${tienVN(k.tongDaThu)}/${tienVN(k.tongCanThu)} (${phanTram}%)`));
    hang.append(e('div', 'stt', k.dinhKyId ? '🔁' : '💰'), ten);
    if (!k.dangMo) {
      hang.append(e('span', 'nhan nhan-xam', 'Đã đóng'));
    } else if (phanTram >= 100) {
      hang.append(e('span', 'nhan nhan-tot', '✓ Đã thu đủ'));
    } else {
      hang.append(e('span', 'nhan nhan-chinh', `Thu ${phanTram}%`));
    }
    hang.append(e('span', 'muc-khoan-mui-ten', moRong === k.id ? '▾' : '▸'));
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
      soLieu('Cần thu', tienVN(dk.tongCanThu), 'can', `Mức ${tienVN(dk.soTien)} / em`),
      soLieu('Còn thiếu', tienVN(conThieuKhoan), conThieuKhoan > 0 ? 'luuy' : 'tot', `${dk.danhSach.length - dk.soEmDaDuDinh} em chưa nộp đủ`),
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
      hang.append(e('div', 'ten', e('b', null, x.ten)), e('span', 'nhan nhan-luuy', tienVN(x.soTien)));
      ds.append(hang);
    });
    the.append(ds);
    return the;
  }

  function ve() {
    const khung = e('div');
    // Phân cấp: chính (mở khoản mới) → phụ (thu định kỳ) → ít dùng nhất (lịch sử/khôi phục,
    // chỉ cần khi có sự cố) — không để 3 nút cạnh tranh thị giác ngang nhau.
    khung.append(tieuDeTrang('Thủ quỹ lớp',
      `${d.siSo} học sinh · công thức: Tồn quỹ = Tổng đã thu − Tổng đã chi`,
      nut('🛡️ Lịch sử & khôi phục', 'nut-nhe', () => { location.hash = '#/quy-lich-su'; }),
      nut('🔁 Thu định kỳ', 'nut-vien', () => { location.hash = '#/quy-dinh-ky'; }),
      nut('➕ Mở khoản thu mới', '', () => moKhoanMoi(tai))
    ));

    const day = e('div', 'day-so');
    day.append(
      oThongKe(tienVN(d.tonQuy), 'Tồn quỹ hiện tại', 'tot', '🏦'),
      oThongKe(tienVN(d.tongThu), 'Tổng đã thu', 'thu', '📥'),
      oThongKe(tienVN(d.tongChi), 'Tổng đã chi', 'luuy', '📤'),
      oThongKe(String(d.khoan.filter((k) => k.dangMo).length), 'Khoản đang mở', 'khoan', '📂')
    );
    khung.append(day);

    if (!d.khoan.length && !d.chi.length) {
      const huongDan = e('div', 'the');
      huongDan.style.cssText = 'margin-top:16px;border-color:var(--chinh)';
      huongDan.append(
        e('h3', null, 'Bắt đầu thu quỹ cho lớp'),
        e('p', null, `Lớp có ${d.siSo} học sinh. Chọn một trong hai cách bên dưới — có thể dùng cả hai cùng lúc.`)
      );
      const luoi = e('div', 'luoi luoi-2');
      luoi.style.marginTop = '10px';
      const cachMot = e('div');
      cachMot.append(
        e('h3', null, '① Thu một lần'),
        e('p', 'trong', 'Ví dụ: quỹ lớp học kì, tiền mua đồ dùng chung, tiền quỹ đầu năm.'),
        nut('➕ Mở khoản thu mới', 'nut-vien nut-nho', () => moKhoanMoi(tai))
      );
      const cachHai = e('div');
      cachHai.append(
        e('h3', null, '② Thu định kỳ, tự lặp lại'),
        e('p', 'trong', 'Ví dụ: quỹ lớp 5.000đ/tuần, 20.000đ/tháng. Hệ thống tự tạo từng kỳ khi tới hạn.'),
        nut('🔁 Tạo mẫu định kỳ', 'nut-vien nut-nho', () => { location.hash = '#/quy-dinh-ky'; })
      );
      luoi.append(cachMot, cachHai);
      huongDan.append(luoi);
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
    theKhoan.append(e('h3', null, '💰 Các khoản thu'));
    if (!d.khoan.length) {
      theKhoan.append(e('p', 'trong', 'Chưa có khoản thu nào.'));
    } else {
      const ds = e('div', 'ds-khoan');
      d.khoan.forEach((k) => ds.append(veHangKhoan(k)));
      theKhoan.append(ds);
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

  moHopThoai('Sửa khoản thu', [
    truong('Tên khoản thu', oTen),
    truong('Mức thu mỗi em (đồng)', oSoTien),
    truong('Trạng thái', oDangMo),
    truong('Ghi chú', oGc),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      if (!oTen.value.trim()) return nhac('Tên khoản thu không được để trống', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/quy', {
          method: 'PATCH',
          than: { banGhi: 'khoan', id: khoan.id, ten: oTen.value, soTienMoiEm: Number(oSoTien.value), dangMo: Number(oDangMo.value) === 1, ghiChu: oGc.value },
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
          nut('✎ Đặt mã tuỳ chỉnh', 'nut-vien nut-nho', () => datMaTuyChinhTaiKhoanPhu(tk, ve)),
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
    khung.append(nut('← Về Thủ quỹ', 'nut-nhe nut-nho', () => { if (history.length > 1) history.back(); else location.hash = '#/quy'; }));
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

/* ================= Thu định kỳ ================= */

const CHU_KY_HIEN_THI = { tuan: 'Mỗi tuần', thang: 'Mỗi tháng', nam: 'Mỗi năm' };

export async function trangQuyDinhKy(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const d = await api('/api/gv/quy-dinh-ky');
    const khung = e('div');

    khung.append(nut('← Về Thủ quỹ', 'nut-nhe nut-nho', () => { if (history.length > 1) history.back(); else location.hash = '#/quy'; }));
    khung.append(tieuDeTrang('Thu định kỳ',
      'Ví dụ: quỹ lớp 5.000đ/tuần. Hệ thống tự tạo từng kỳ khi tới hạn, không cần tạo tay mỗi tuần.',
      nut('+ Tạo mẫu thu định kỳ', '', () => taoDinhKy(ve))
    ));

    if (!d.danhSach.length) {
      khung.append(e('div', 'the trong', 'Chưa có khoản thu định kỳ nào.'));
    } else {
      const ds = e('div', 'ds-the');
      d.danhSach.forEach((dk) => {
        const the = e('div', 'the');
        const dau = e('div');
        dau.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;gap:10px';
        dau.append(e('h3', null, dk.ten));
        if (!dk.dangHoatDong) dau.append(e('span', 'nhan nhan-xam', 'Đã dừng'));
        the.append(dau);
        the.append(e('p', null,
          `${CHU_KY_HIEN_THI[dk.chuKy] || dk.chuKy} · ${tienVN(dk.soTienMoiKy)}/em · bắt đầu ${ngayVN(dk.ngayBatDau)} · đã sinh ${dk.soKyDaSinh} kỳ`));

        const hangNut = e('div', 'day-loc');
        if (dk.dangHoatDong) {
          hangNut.append(nut('Dừng', 'nut-vien nut-nho', async () => {
            try {
              await api('/api/gv/quy-dinh-ky', { method: 'PATCH', than: { id: dk.id, dangHoatDong: false } });
              nhac('Đã dừng — các kỳ đã sinh vẫn giữ nguyên', 'tot');
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          }));
        } else {
          hangNut.append(nut('Mở lại', 'nut-vien nut-nho', async () => {
            try {
              await api('/api/gv/quy-dinh-ky', { method: 'PATCH', than: { id: dk.id, dangHoatDong: true } });
              nhac('Đã mở lại', 'tot');
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          }));
        }
        if (dk.soKyDaSinh === 0) {
          hangNut.append(nut('Xoá', 'nut-nhe nut-nho', async () => {
            try {
              await api('/api/gv/quy-dinh-ky?id=' + dk.id, { method: 'DELETE' });
              nhac('Đã xoá', 'tot');
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          }));
        }
        the.append(hangNut);
        ds.append(the);
      });
      khung.append(ds);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

function taoDinhKy(taiLai) {
  const oTen = oNhap('dkTen', 'text', '', 'Ví dụ: Quỹ lớp');
  const oChuKy = oChon('dkChuKy', [['tuan', 'Mỗi tuần'], ['thang', 'Mỗi tháng'], ['nam', 'Mỗi năm']], 'tuan');
  const oSoTien = oNhap('dkSoTien', 'number', '5000');
  const oNgay = oNhap('dkNgay', 'date', homNay());

  moHopThoai('Tạo mẫu thu định kỳ', [
    truong('Tên khoản', oTen),
    truong('Chu kỳ', oChuKy),
    truong('Mức thu mỗi kỳ (đồng/em)', oSoTien),
    truong('Bắt đầu từ ngày', oNgay, 'Hệ thống tự tính kỳ 1, kỳ 2... kể từ ngày này.'),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Tạo', '', async (ev) => {
      if (!oTen.value.trim()) return nhac('Chưa nhập tên khoản', 'xau');
      const soTien = Number(oSoTien.value);
      if (!soTien || soTien <= 0) return nhac('Mức thu không hợp lệ', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/quy-dinh-ky', {
          method: 'POST',
          than: { ten: oTen.value, chuKy: oChuKy.value, soTienMoiKy: soTien, ngayBatDau: oNgay.value },
        });
        dongHopThoai();
        nhac('Đã tạo — các kỳ đến hạn sẽ tự xuất hiện trong Thủ quỹ', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}
