import { KHUNG } from '../lib.js';
import { api, datNoiDung, e, giuViTriCuonKhiVe, homNay, khoiDangTai, ngayDayDu, ngayVN, nhac } from '/assets/js/chung.js';
import { boiNgayVN, dongHopThoai, moHopThoai, nut, oChon, oNhap, oThongKe, tieuDeTrang, truong } from '/assets/js/giao-dien.js';
import { dongBo, soChoGui, themVaoHangDoi } from '/assets/js/hang-doi.js';


export const DIEM_DANH = {
  co_mat:          { ten: 'Có mặt',        ky: '✓', lop: 'nhan-tot' },
  tre:             { ten: 'Đi trễ',        ky: 'T', lop: 'nhan-luuy' },
  vang_phep:       { ten: 'Vắng có phép',  ky: 'P', lop: 'nhan' },
  vang_khong_phep: { ten: 'Vắng không phép', ky: '✗', lop: 'nhan-xau' },
};

export const TEN_BUOI = { sang: 'Buổi sáng', chieu: 'Buổi chiều', hoat_dong: 'Hoạt động' };

/* ---------- Điểm danh linh động: đánh dấu hàng loạt cho trường hợp đặc biệt (đi bồi dưỡng,
   lao động, hoạt động ngoại khoá…) — chọn lý do có sẵn hoặc gõ riêng, tích những em liên
   quan (hoặc chọn tất cả), bấm MỘT nút là lưu thẳng lên máy chủ ngay — không phải qua bước
   "áp dụng" rồi mới đi tìm nút "Lưu điểm danh" ở chỗ khác như trước, dễ gây hiểu lầm là
   chưa lưu được. ---------- */
export const LY_DO_NHANH = ['Đi học bồi dưỡng', 'Lao động', 'Hoạt động ngoại khoá', 'Việc riêng có phép'];

export function moHopThoaiGhiChuDiemDanh(h, ttHienTai, ldHienTai, onSave) {
  const noiDung = e('div');

  // Thẻ thông tin học sinh
  const thongTin = e('div');
  thongTin.style.cssText = 'padding:10px 14px;background:var(--nen-chim);border-radius:10px;margin-bottom:14px;';
  thongTin.append(
    Object.assign(e('b', null, `${h.id}. ${h.hoTen}`), { style: 'font-size:15.5px;display:block;' }),
    Object.assign(e('small', null, `${h.lopNghe || 'Chưa xếp'} • Trạng thái: ${ttHienTai && DIEM_DANH[ttHienTai] ? DIEM_DANH[ttHienTai].ten : 'Chưa điểm danh'}`), { style: 'color:var(--chu-nhat);font-size:12.5px;' })
  );
  noiDung.append(thongTin);

  // Chọn trạng thái điểm danh kèm theo
  const oTt = oChon('gcTrangThai', [
    ['', '— Giữ nguyên trạng thái —'],
    ...Object.entries(DIEM_DANH).map(([k, v]) => [k, `${v.ky} ${v.ten}`])
  ], ttHienTai || 'vang_phep');
  noiDung.append(truong('Trạng thái điểm danh', oTt, 'Có thể đổi trạng thái cùng lúc ghi lý do'));

  // Ô nhập lý do
  const oLd = oNhap('gcLyDo', 'text', ldHienTai || '', 'Ví dụ: Sốt xuất huyết, gia đình có việc...');
  oLd.style.marginTop = '4px';

  // Hàng chip gợi ý lý do nhanh
  const hangGoiY = e('div', 'day-loc');
  hangGoiY.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 14px;';
  const GOI_Y_LY_DO = [
    'Bị ốm / Sốt',
    'Khám bệnh có phép',
    'Gia đình có việc',
    'Xe hỏng / Đến muộn',
    'Đi thi / Bồi dưỡng HSG',
    'Hoạt động ngoại khoá',
    'Lao động trường',
    'Nghỉ không phép'
  ];
  GOI_Y_LY_DO.forEach((g) => {
    const chip = e('button', 'vien-loc', g);
    chip.type = 'button';
    chip.style.cssText = 'font-size:12px;padding:4px 9px;cursor:pointer;';
    chip.addEventListener('click', () => {
      oLd.value = g;
      oLd.focus();
    });
    hangGoiY.append(chip);
  });

  noiDung.append(
    truong('Lý do / Ghi chú chính xác', oLd, 'Bấm chọn nhanh lý do hoặc tự gõ chi tiết:'),
    hangGoiY
  );

  const cacNut = [
    nut('💾 Lưu ghi chú', 'nut-chinh', () => {
      const val = oLd.value.trim();
      const ttChon = oTt.value;
      onSave(val, ttChon);
      dongHopThoai();
    }),
  ];

  if (ldHienTai) {
    cacNut.push(
      nut('🗑️ Xoá ghi chú', 'nut-vien', () => {
        onSave('', oTt.value);
        dongHopThoai();
      })
    );
  }

  cacNut.push(nut('Đóng', 'nut-nhe', dongHopThoai));

  moHopThoai(`📝 Ghi chú lý do — ${h.hoTen}`, noiDung, cacNut);
  setTimeout(() => oLd.focus(), 80);
}

// Cache lịch sử điểm danh (TẤT CẢ ngày/buổi/loại) theo từng học sinh — dùng chung cho cả tab
// Điểm danh chính lẫn Điểm danh linh động (cùng dữ liệu gốc bảng diem_danh), để bấm tìm ở tab
// này rồi qua tab kia không phải tải lại. Xoá sạch sau mỗi lần lưu điểm danh (searchLuu bên
// dưới) vì lúc đó lịch sử của (các) học sinh vừa lưu đã cũ.
export const lichSuDiemDanhCache = new Map();

// Sửa MỘT bản ghi điểm danh cụ thể (ngày/buổi/loại đã biết rõ) — lưu NGAY qua API, không qua
// hàng đợi "Lưu điểm danh" như khi bấm nút trạng thái trực tiếp trên hàng học sinh: đây là sửa
// một bản ghi CŨ tìm thấy khi tra cứu, thao tác đơn lẻ nên lưu ngay cho rõ ràng, đỡ phải nhớ
// thêm bước "Lưu" tổng ở cuối trang. Hiện đủ ngày/buổi/loại để không nhầm đang sửa buổi nào.
export function moHopThoaiSuaLichSuDiemDanh(h, banGhi, veLai) {
  const laPhu = banGhi.buoi.endsWith('_phu');
  const buoiGoc = banGhi.buoi.replace(/_phu$/, '');

  const thongTin = e('div');
  thongTin.style.cssText = 'padding:10px 14px;background:var(--nen-chim);border-radius:10px;margin-bottom:14px;';
  thongTin.append(
    Object.assign(e('b', null, h.hoTen), { style: 'font-size:15.5px;display:block;' }),
    Object.assign(e('small', null, `${ngayVN(banGhi.ngay)} · ${TEN_BUOI[buoiGoc] || buoiGoc} · ${laPhu ? 'Điểm danh linh động' : 'Điểm danh chính'}`), { style: 'color:var(--chu-nhat);font-size:12.5px;' })
  );

  const oTt = oChon('suaLsTt', [
    ['', '✕ Chưa điểm danh (xoá bản ghi)'],
    ...Object.entries(DIEM_DANH).map(([k, v]) => [k, `${v.ky} ${v.ten}`]),
  ], banGhi.trangThai || '');

  const oLd = oNhap('suaLsLd', 'text', banGhi.lyDo || '', 'Lý do / ghi chú (không bắt buộc)');

  moHopThoai(`Sửa điểm danh — ${h.hoTen}`, [
    thongTin,
    truong('Trạng thái', oTt),
    truong('Lý do / Ghi chú', oLd),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('💾 Lưu', 'nut-chinh', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/diem-danh', {
          method: 'POST',
          than: {
            ngay: banGhi.ngay, buoi: buoiGoc, loai: laPhu ? 'phu' : 'chinh',
            ghiNhan: [{ hocSinhId: h.id, trangThai: oTt.value || null, lyDo: oLd.value.trim() }],
          },
        });
        dongHopThoai();
        nhac('Đã lưu điểm danh', 'tot');
        lichSuDiemDanhCache.delete(h.id);
        if (veLai) veLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
  setTimeout(() => oLd.focus(), 80);
}

// Khối lịch sử hiện dưới MỖI học sinh khớp tìm kiếm — hiện TẤT CẢ ngày/buổi/loại đã từng điểm
// danh (kể cả đúng buổi đang xem — trước đây loại trừ vì tưởng đã sửa được ở hàng học sinh phía
// trên, nhưng khi đang tìm kiếm thì hàng đó đã bị bỏ hẳn (xem veKhuVucChinh/veKhuVucPhu), nên
// đây giờ là NƠI DUY NHẤT để xem/sửa, không được thiếu buổi nào). Mọi loại (có mặt/trễ/vắng...)
// đều dùng chung đúng một kiểu thẻ — bấm "Sửa" mở popup rõ ngày/buổi/loại thay vì nhảy sang chỗ
// khác như trước.
export function veLichSuTimThay(h, veLai) {
  const khoi = e('div', 'lich-su-tim-dd');

  const tieuDe = e('div', 'lich-su-tim-dd-ten');
  tieuDe.append(e('b', null, h.hoTen), e('small', null, h.lopNghe || ''));
  khoi.append(tieuDe);

  if (!lichSuDiemDanhCache.has(h.id)) {
    lichSuDiemDanhCache.set(h.id, 'dang-tai');
    api('/api/gv/diem-danh?hocSinhId=' + h.id).then((d) => {
      lichSuDiemDanhCache.set(h.id, d.lichSu || []);
      veLai();
    }).catch((err) => {
      // KHÔNG cache lỗi thành mảng rỗng — nếu không, một lần lỗi mạng/quyền sẽ hiện nhầm thành
      // "chưa có lịch sử" mãi mãi cho tới khi tải lại trang, dù học sinh thật ra có lịch sử.
      lichSuDiemDanhCache.delete(h.id);
      khoi.replaceChildren(e('p', 'trong', err.message || 'Không tải được lịch sử điểm danh.'));
      veLai();
    });
  }
  const ls = lichSuDiemDanhCache.get(h.id);
  if (ls === 'dang-tai') {
    khoi.append(e('p', 'trong', 'Đang tải lịch sử điểm danh…'));
    return khoi;
  }
  if (!ls || !ls.length) {
    khoi.append(e('p', 'trong', 'Chưa có lịch sử điểm danh nào.'));
    return khoi;
  }
  // Thống kê tổng của em này — TÍNH Y HỆT cách trang Hồ sơ học sinh (#/hoc-sinh/:id) đang làm,
  // để một em luôn ra đúng MỘT con số duy nhất dù xem ở đâu, không phải tự cộng nhẩm từ danh
  // sách bên dưới.
  const dem = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
  ls.forEach((x) => { if (dem[x.trangThai] !== undefined) dem[x.trangThai]++; });
  const daySo = e('div', 'day-so');
  daySo.style.cssText = 'margin-bottom:10px;';
  daySo.append(
    oThongKe(String(dem.co_mat), 'Có mặt', 'tot'),
    oThongKe(String(dem.tre), 'Đi trễ', 'luuy'),
    oThongKe(String(dem.vang_phep), 'Vắng có phép'),
    oThongKe(String(dem.vang_khong_phep), 'Vắng không phép', 'xau')
  );
  khoi.append(daySo);

  // API trả về mới → cũ (ngay DESC) để .slice() lấy đúng 15 lần GẦN ĐÂY NHẤT, sau đó đảo lại
  // thành cũ → mới (từ quá khứ tới hiện tại) khi hiển thị.
  ls.slice(0, 15).reverse().forEach((x) => {
    const laPhu = x.buoi.endsWith('_phu');
    const buoiGoc = x.buoi.replace(/_phu$/, '');
    const tt2 = DIEM_DANH[x.trangThai] || {};
    const the = e('div', 'the-lich-su-dd');
    const dong1 = e('div', 'dong-lich-su-dd-dong1');
    dong1.append(
      e('span', 'nhan ' + (tt2.lop || ''), tt2.ten || x.trangThai),
      nut('Sửa', 'nut-nhe nut-nho', () => moHopThoaiSuaLichSuDiemDanh(h, x, veLai))
    );
    const phanDoan = [ngayVN(x.ngay), TEN_BUOI[buoiGoc] || buoiGoc];
    if (x.lyDo) phanDoan.push(x.lyDo);
    if (laPhu) phanDoan.push('Linh động');
    const dong2 = e('div', 'dong-lich-su-dd-dong2', phanDoan.join(' · '));
    the.append(dong1, dong2);
    khoi.append(the);
  });
  return khoi;
}

export function veTabDiemDanhNhanh(danhSach, thayDoi, lyDoMoi, veLai, luuDiemDanh, trangThaiHienTai, lyDoHienTai, timPhuBanDau, datTimPhu, ngay, buoi, nhayDenNgayBuoi) {
  const khung = e('div');
  let timPhu = timPhuBanDau || '';

  const the = e('div', 'the');
  the.append(e('p', 'trong',
    'Dùng cho trường hợp đặc biệt: đi bồi dưỡng, lao động, hoạt động ngoại khoá… '
    + 'Bấm trực tiếp vào cột trạng thái của từng em — giống hệt cách thao tác ở Điểm danh chính, '
    + 'chỉ khác là lưu vào một "sổ" riêng, không ảnh hưởng điểm danh chính.'));

  // Lý do chung: gõ/hoặc chọn nhanh MỘT lần, dùng làm gợi ý điền sẵn khi mở ghi chú cho
  // từng em (📝) — đỡ phải gõ lại nếu nhiều em cùng một lý do, nhưng không ép áp dụng
  // hàng loạt như trước (mỗi em vẫn bấm cột trạng thái của riêng mình).
  const oLyDoChung = oNhap('ddnLyDoChung', 'text', '', 'Ví dụ: Đi học bồi dưỡng học sinh giỏi');
  the.append(truong('Lý do chung (gợi ý sẵn khi ghi chú từng em)', oLyDoChung, 'Chọn nhanh bên dưới hoặc gõ riêng'));

  const hangChip = e('div', 'day-loc');
  hangChip.style.marginTop = '8px';
  LY_DO_NHANH.forEach((c) => {
    const chip = e('button', 'vien-loc', c);
    chip.type = 'button';
    chip.addEventListener('click', () => { oLyDoChung.value = c; oLyDoChung.focus(); });
    hangChip.append(chip);
  });
  the.append(hangChip);
  khung.append(the);

  // Ô tìm kiếm học sinh — cùng cơ chế với Điểm danh chính: chỉ rebuild "khuVucPhu" khi gõ
  // (không gọi veLai() để không mất focus), và "Áp dụng nhanh" chỉ áp lên đúng danh sách tìm
  // thấy. timPhu lưu ở ngoài (trangDiemDanh) qua datTimPhu nên không mất khi bấm nút khác.
  const oTimPhu = oNhap('ddTimPhu', 'search', timPhu, 'Tìm theo tên, tổ/lớp nghề, hoặc STT…');
  oTimPhu.addEventListener('input', (ev) => {
    timPhu = ev.target.value;
    datTimPhu(timPhu);
    veKhuVucPhu();
  });
  khung.append(truong('🔎 Tìm học sinh', oTimPhu));

  const khuVucPhu = e('div');
  khung.append(khuVucPhu);

  const dsLocPhu = () => {
    const q = timPhu.trim().toLowerCase();
    if (!q) return danhSach;
    return danhSach.filter((h) =>
      h.hoTen.toLowerCase().includes(q) ||
      String(h.id).includes(q) ||
      (h.lopNghe || '').toLowerCase().includes(q)
    );
  };

  function veKhuVucPhu() {
    const dsLoc = dsLocPhu();
    const dangLoc = Boolean(timPhu.trim());
    const khungCon = e('div');

    if (dangLoc && !dsLoc.length) {
      khungCon.append(e('p', 'trong', `Không tìm thấy học sinh nào khớp "${timPhu.trim()}".`));
      datNoiDung(khuVucPhu, khungCon);
      return;
    }

    // Thanh áp dụng nhanh cho cả lớp (hoặc đúng danh sách tìm thấy) & Xoá tất cả ghi chú —
    // giống hệt Điểm danh chính.
    const theApDungNhanh = e('div', 'the');
    theApDungNhanh.style.cssText = 'padding:12px 14px;margin:12px 0;';
    theApDungNhanh.append(Object.assign(
      e('div', null, dangLoc ? `⚡ Áp dụng nhanh cho ${dsLoc.length} học sinh tìm thấy` : '⚡ Áp dụng nhanh cho cả lớp'),
      { style: 'font-size:12.5px;font-weight:700;color:var(--chu);margin-bottom:8px;' }
    ));
    const dayApDungNhanh = e('div', 'day-loc day-loc-deu-co-gian');
    Object.entries(DIEM_DANH).forEach(([ma, tt2]) => {
      const caLopDangChon = dsLoc.length > 0 &&
        dsLoc.every((h) => trangThaiHienTai(h.id, h.trangThai) === ma);

      const b = e('button', 'vien-loc', `${tt2.ky} ${tt2.ten}`);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(caLopDangChon));
      b.title = caLopDangChon
        ? `Bỏ chọn tất cả "${tt2.ten}"`
        : `Đặt "${tt2.ten}" cho ${dangLoc ? 'danh sách tìm thấy' : 'cả lớp'} (bấm lại để bỏ chọn tất cả)`;
      b.addEventListener('click', () => {
        dsLoc.forEach((h) => thayDoi.set(h.id, caLopDangChon ? null : ma));
        veLai();
      });
      dayApDungNhanh.append(b);
    });

    const soCoGhiChu = dsLoc.filter((h) => lyDoHienTai(h.id, h.lyDo)).length;
    const nutXoaGhiChuPhu = e('button', 'vien-loc', `🗑 Xoá tất cả ghi chú${soCoGhiChu ? ` (${soCoGhiChu})` : ''}`);
    nutXoaGhiChuPhu.type = 'button';
    if (soCoGhiChu) { nutXoaGhiChuPhu.style.color = 'var(--xau)'; nutXoaGhiChuPhu.style.borderColor = 'var(--xau)'; }
    nutXoaGhiChuPhu.addEventListener('click', () => {
      if (!soCoGhiChu) return nhac('Hiện không có học sinh nào có ghi chú trong điểm danh phụ.', 'nhe');
      moHopThoai('Xoá tất cả ghi chú điểm danh phụ?', [
        e('p', null, `Bạn có chắc muốn xoá toàn bộ ghi chú của ${soCoGhiChu} học sinh${dangLoc ? ' (trong danh sách đang tìm thấy)' : ''} trong điểm danh phụ buổi này?`),
        e('p', 'trong', 'Thao tác này chỉ xoá ghi chú trong điểm danh phụ, hoàn toàn không ảnh hưởng điểm danh chính.')
      ], [
        nut('Huỷ', 'nut-nhe', dongHopThoai),
        nut('Xoá tất cả ghi chú', 'nut-xau', () => {
          dsLoc.forEach((h) => { if (lyDoHienTai(h.id, h.lyDo)) lyDoMoi.set(h.id, ''); });
          dongHopThoai();
          nhac('Đã xoá sạch ghi chú điểm danh phụ (hãy bấm "Lưu điểm danh")', 'tot');
          veLai();
        })
      ]);
    });
    dayApDungNhanh.append(nutXoaGhiChuPhu);
    theApDungNhanh.append(dayApDungNhanh);
    khungCon.append(theApDungNhanh);

    // Chú thích các nút trạng thái — đặt TRƯỚC danh sách (giống Điểm danh chính) để giáo viên
    // hiểu ký hiệu ✓/T/P/✗/📝 ngay khi vừa xem trang, khỏi phải cuộn qua hết cả lớp mới thấy.
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
    khungCon.append(chuThich);

    // Danh sách học sinh (đúng danh sách tìm thấy) — CÙNG một kiểu hàng với Điểm danh chính:
    // cột trạng thái riêng cho từng em (✓/T/P/✗), bấm lại để bỏ chọn, cộng nút 📝 ghi chú riêng.
    const ds = e('div', 'ds-diem-danh');
    ds.style.marginTop = '10px';
    // Đang tìm kiếm với ít kết quả (≤ 8 em) — hiện hẳn TOÀN BỘ lịch sử điểm danh của đúng những
    // em đó thay cho hàng bấm nhanh ✓/T/P/✗ (đằng nào cũng đã có thanh "⚡ Áp dụng nhanh" phía
    // trên lo phần bấm nhanh này rồi — lặp thêm một hàng bấm-nhanh riêng cho từng em là dư thừa,
    // lại khác kiểu thẻ hẳn với chính khối lịch sử ngay bên dưới nó). Giới hạn số em hiện lịch sử
    // (dsLoc nhỏ) để tránh gọi API dồn dập khi gõ từ khoá chung chung khớp cả chục em.
    const dangHienLichSu = dangLoc && dsLoc.length <= 8;
    dsLoc.forEach((h) => {
      const tt = trangThaiHienTai(h.id, h.trangThai);
      const ld = lyDoHienTai(h.id, h.lyDo);
      const hang = e('div', 'hang-hs' + (tt ? '' : ' chua-ghi'));

      if (dangHienLichSu) {
        hang.append(veLichSuTimThay(h, veKhuVucPhu));
        ds.append(hang);
        return;
      }

      const ten = e('div', 'ten');
      ten.append(e('b', null, h.hoTen), e('small', null, h.lopNghe || ''));

      const moGhiChu = () => {
        moHopThoaiGhiChuDiemDanh(h, tt, ld || oLyDoChung.value, (val, ttChon) => {
          lyDoMoi.set(h.id, val);
          if (ttChon) thayDoi.set(h.id, ttChon);
          else if (!thayDoi.has(h.id) && val && !tt) thayDoi.set(h.id, 'vang_phep');
          veLai();
        });
      };

      if (ld) {
        const dongLd = e('div', 'dong-ly-do');
        dongLd.title = `Ghi chú: ${ld} — Bấm để sửa`;
        dongLd.append(e('span', null, '💬'), Object.assign(e('span', 'dong-ly-do-chu', ld)));
        dongLd.addEventListener('click', (ev) => { ev.stopPropagation(); moGhiChu(); });
        ten.append(dongLd);
      }

      hang.append(e('div', 'stt', h.soThuTu ?? h.id), ten);

      const nhom = e('div', 'nhom-chon');
      Object.entries(DIEM_DANH).forEach(([ma, tt2]) => {
        const b = e('button', null, tt2.ky);
        b.type = 'button';
        b.dataset.tt = ma;
        b.title = tt2.ten + ' — bấm lại để bỏ chọn';
        b.setAttribute('aria-label', `${h.hoTen}: ${tt2.ten}`);
        b.setAttribute('aria-pressed', String(tt === ma));
        b.addEventListener('click', () => {
          thayDoi.set(h.id, tt === ma ? null : ma);
          veLai();
        });
        nhom.append(b);
      });

      const nutGc = e('button', 'nut-icon-ghi-chu' + (ld ? ' da-co-ghi-chu' : ''));
      nutGc.type = 'button';
      nutGc.textContent = '📝';
      nutGc.title = ld ? `Ghi chú: "${ld}" — Bấm để sửa` : `Thêm ghi chú/lý do cho ${h.hoTen}`;
      nutGc.setAttribute('aria-label', `Ghi chú cho ${h.hoTen}`);
      nutGc.addEventListener('click', (ev) => { ev.stopPropagation(); moGhiChu(); });
      nhom.append(nutGc);

      hang.append(nhom);
      ds.append(hang);
    });
    if (dangLoc && dsLoc.length > 8) {
      khungCon.append(e('p', 'trong', `Có ${dsLoc.length} học sinh khớp — gõ tên cụ thể hơn (còn ≤ 8 kết quả) để xem lịch sử điểm danh từng em.`));
    }
    khungCon.append(ds);

    datNoiDung(khuVucPhu, khungCon);
  }

  veKhuVucPhu();

  // Thanh lưu riêng của Điểm danh linh động — vẫn một nút lưu duy nhất, lưu thẳng toàn bộ
  // thayDoi/lyDoMoi đã đổi (kể cả qua "Áp dụng nhanh" lẫn từng ô 📝).
  const cacIdThayDoi = new Set([...thayDoi.keys(), ...lyDoMoi.keys()]);
  if (cacIdThayDoi.size) {
    const thanhLuu = e('div', 'thanh-luu');
    thanhLuu.append(e('div', 'thong-tin', `${cacIdThayDoi.size} thay đổi chưa lưu`));
    thanhLuu.append(
      nut('Bỏ', 'nut-nhe nut-nho', () => { thayDoi.clear(); lyDoMoi.clear(); veLai(); }),
      nut('Lưu điểm danh', '', (ev) => luuDiemDanh(ev.currentTarget))
    );
    khung.append(thanhLuu);
  }

  return khung;
}

/* ================= Trang: Điểm danh ================= */

export async function trangDiemDanh() {
  datNoiDung(KHUNG, khoiDangTai());

  let ngay = sessionStorage.getItem('dd-ngay') || homNay();
  let buoi = sessionStorage.getItem('dd-buoi') || 'sang';
  let tabCon = 'ngay';   // 'ngay' = Điểm danh chính | 'nhanh' = Điểm danh linh động
  let timChinh = '';     // ô tìm kiếm học sinh ở Điểm danh chính
  let timPhu = '';       // ô tìm kiếm học sinh ở Điểm danh linh động

  let duLieuChinh = null;
  const thayDoiChinh = new Map();
  const lyDoMoiChinh = new Map();

  let duLieuPhu = null;
  const thayDoiPhu = new Map();
  const lyDoMoiPhu = new Map();

  function trangThaiHienTaiChinh(id, trangThaiCu) {
    return thayDoiChinh.has(id) ? thayDoiChinh.get(id) : trangThaiCu;
  }
  function lyDoHienTaiChinh(id, lyDoCu) {
    return lyDoMoiChinh.has(id) ? lyDoMoiChinh.get(id) : (lyDoCu || '');
  }

  function trangThaiHienTaiPhu(id, trangThaiCu) {
    return thayDoiPhu.has(id) ? thayDoiPhu.get(id) : trangThaiCu;
  }
  function lyDoHienTaiPhu(id, lyDoCu) {
    return lyDoMoiPhu.has(id) ? lyDoMoiPhu.get(id) : (lyDoCu || '');
  }

  async function taiChinh() {
    duLieuChinh = await api(`/api/gv/diem-danh?ngay=${ngay}&buoi=${buoi}&loai=chinh`);
    thayDoiChinh.clear();
    lyDoMoiChinh.clear();
  }

  async function taiPhu() {
    duLieuPhu = await api(`/api/gv/diem-danh?ngay=${ngay}&buoi=${buoi}&loai=phu`);
    thayDoiPhu.clear();
    lyDoMoiPhu.clear();
  }

  async function tai() {
    if (tabCon === 'nhanh') {
      await taiPhu();
    } else {
      await taiChinh();
    }
    ve();
  }

  // Bấm "Sửa" trên một dòng lịch sử tìm thấy (veLichSuTimThay) — nhảy thẳng ngày/buổi/tab của
  // đúng bản ghi đó rồi tải lại, thay vì bắt giáo viên tự dò lại ngày/buổi bằng tay. Giữ nguyên
  // từ khoá đang tìm khi đổi tab (chinh <-> phu) để vẫn thấy đúng em đó ngay khi trang tải xong.
  function nhayDenNgayBuoi(ngayMoi, buoiMoi, laPhu, tuKhoaTim) {
    ngay = ngayMoi;
    buoi = buoiMoi;
    tabCon = laPhu ? 'nhanh' : 'ngay';
    sessionStorage.setItem('dd-ngay', ngay);
    sessionStorage.setItem('dd-buoi', buoi);
    if (laPhu) timPhu = tuKhoaTim; else timChinh = tuKhoaTim;
    datNoiDung(KHUNG, khoiDangTai());
    tai();
  }

  function tinhSo() {
    const dem = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
    if (!duLieuChinh) return dem;
    duLieuChinh.danhSach.forEach((h) => {
      const tt = trangThaiHienTaiChinh(h.id, h.trangThai);
      if (tt && dem[tt] !== undefined) dem[tt]++;
    });
    return dem;
  }

  function tinhSoPhu() {
    const dem = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
    if (!duLieuPhu) return dem;
    duLieuPhu.danhSach.forEach((h) => {
      const tt = trangThaiHienTaiPhu(h.id, h.trangThai);
      if (tt && dem[tt] !== undefined) dem[tt]++;
    });
    return dem;
  }

  async function luuDiemDanhChinh(nutBam) {
    const cacId = new Set([...thayDoiChinh.keys(), ...lyDoMoiChinh.keys()]);
    const ghiNhan = [...cacId].map((hocSinhId) => {
      const h = duLieuChinh.danhSach.find((x) => x.id === hocSinhId);
      const trangThai = trangThaiHienTaiChinh(hocSinhId, h?.trangThai);
      const lyDo = lyDoHienTaiChinh(hocSinhId, h?.lyDo);
      return { hocSinhId, trangThai, lyDo };
    });

    if (nutBam) { nutBam.disabled = true; nutBam.textContent = 'Đang lưu…'; }
    try {
      await api('/api/gv/diem-danh', { method: 'POST', than: { ngay, buoi, loai: 'chinh', ghiNhan } });
      nhac('Đã lưu điểm danh chính', 'tot');
      cacId.forEach((id) => lichSuDiemDanhCache.delete(id));
      await taiChinh();
      ve();
    } catch (err) {
      if (err.ngoaiTuyen) {
        themVaoHangDoi({ ngay, buoi, loai: 'chinh', ghiNhan });
        thayDoiChinh.clear();
        lyDoMoiChinh.clear();
        nhac('Đang mất mạng — đã lưu tạm trong máy, sẽ tự gửi khi có mạng.', 'xau');
        ve();
        return;
      }
      nhac(err.message, 'xau');
      if (nutBam) { nutBam.disabled = false; nutBam.textContent = 'Lưu điểm danh'; }
    }
  }

  async function luuDiemDanhPhu(nutBam) {
    const cacId = new Set([...thayDoiPhu.keys(), ...lyDoMoiPhu.keys()]);
    const ghiNhan = [...cacId].map((hocSinhId) => {
      const h = duLieuPhu.danhSach.find((x) => x.id === hocSinhId);
      const trangThai = trangThaiHienTaiPhu(hocSinhId, h?.trangThai);
      const lyDo = lyDoHienTaiPhu(hocSinhId, h?.lyDo);
      return { hocSinhId, trangThai, lyDo };
    });

    if (nutBam) { nutBam.disabled = true; nutBam.textContent = 'Đang lưu…'; }
    try {
      await api('/api/gv/diem-danh', { method: 'POST', than: { ngay, buoi, loai: 'phu', ghiNhan } });
      nhac('Đã lưu điểm danh phụ', 'tot');
      cacId.forEach((id) => lichSuDiemDanhCache.delete(id));
      await taiPhu();
      ve();
    } catch (err) {
      if (err.ngoaiTuyen) {
        themVaoHangDoi({ ngay, buoi, loai: 'phu', ghiNhan });
        thayDoiPhu.clear();
        lyDoMoiPhu.clear();
        nhac('Đang mất mạng — đã lưu tạm trong máy, sẽ tự gửi khi có mạng.', 'xau');
        ve();
        return;
      }
      nhac(err.message, 'xau');
      if (nutBam) { nutBam.disabled = false; nutBam.textContent = 'Lưu điểm danh'; }
    }
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
    chonBuoi.addEventListener('change', async () => {
      buoi = chonBuoi.value;
      sessionStorage.setItem('dd-buoi', buoi);
      await tai();
    });

    khung.append(tieuDeTrang('Điểm danh', ngayDayDu(ngay),
      nut('🛡️ Lịch sử & khôi phục', 'nut-vien', () => { location.hash = '#/diem-danh-lich-su'; })
    ));

    const cho = soChoGui();
    if (cho) {
      const dai = e('div', 'canh-bao');
      dai.append(document.createTextNode(`${cho} lần điểm danh đang chờ gửi lên (lúc đó máy mất mạng). `));
      dai.append(nut('Gửi ngay', 'nut-nho', async (ev) => {
        ev.currentTarget.disabled = true;
        const kq = await dongBo();
        nhac(kq.conLai ? `Đã gửi ${kq.daGui}, còn ${kq.conLai} chờ tiếp` : 'Đã gửi hết', kq.conLai ? 'xau' : 'tot');
        await tai();
      }));
      khung.append(dai);
    }

    const hangChon = e('div', 'chon-ngay');
    hangChon.append(boiNgayVN(oNgay), chonBuoi);
    khung.append(hangChon);

    const hopTabCon = e('div', 'day-loc day-loc-deu');
    hopTabCon.id = 'diem-danh-tab-con';
    hopTabCon.style.margin = '14px 0';
    [['ngay', '📋 Điểm danh chính'], ['nhanh', '⚡ Điểm danh linh động']].forEach(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(tabCon === ma));
      b.addEventListener('click', async () => {
        await giuViTriCuonKhiVe('diem-danh-tab-con', async () => {
          tabCon = ma;
          if (tabCon === 'nhanh' && !duLieuPhu) {
            datNoiDung(KHUNG, khoiDangTai());
            await taiPhu();
          } else if (tabCon === 'ngay' && !duLieuChinh) {
            datNoiDung(KHUNG, khoiDangTai());
            await taiChinh();
          }
          ve();
        });
      });
      hopTabCon.append(b);
    });
    khung.append(hopTabCon);

    if (tabCon === 'nhanh') {
      if (!duLieuPhu) {
        taiPhu().then(ve);
        return datNoiDung(KHUNG, khoiDangTai());
      }
      // Thanh tiến độ & thống kê — cùng kiểu với Điểm danh chính, tính riêng trên dữ liệu phụ.
      const demPhu = tinhSoPhu();
      const tongPhu = duLieuPhu.danhSach.length || 1;
      const thanhPhu = e('div', 'thanh-tien-do');
      [['co_mat', 'p-comat'], ['tre', 'p-tre'], ['vang_phep', 'p-phep'], ['vang_khong_phep', 'p-khongphep']]
        .forEach(([k, lop]) => {
          if (!demPhu[k]) return;
          const i = e('i', lop);
          i.style.width = (demPhu[k] / tongPhu * 100) + '%';
          thanhPhu.append(i);
        });
      khung.append(thanhPhu);

      const daGhiPhu = Object.values(demPhu).reduce((a, b) => a + b, 0);
      const dayPhu = e('div', 'day-so');
      dayPhu.append(
        oThongKe(`${daGhiPhu}/${tongPhu}`, 'Đã điểm danh', 'chinh'),
        oThongKe(String(demPhu.co_mat), 'Có mặt', 'tot'),
        oThongKe(String(demPhu.tre), 'Đi trễ', 'luuy'),
        oThongKe(String(demPhu.vang_phep), 'Vắng có phép', 'thu'),
        oThongKe(String(demPhu.vang_khong_phep), 'Vắng không phép', 'xau')
      );
      khung.append(dayPhu);

      khung.append(veTabDiemDanhNhanh(duLieuPhu.danhSach, thayDoiPhu, lyDoMoiPhu, ve, luuDiemDanhPhu, trangThaiHienTaiPhu, lyDoHienTaiPhu, timPhu, (v) => { timPhu = v; }, ngay, buoi, nhayDenNgayBuoi));
    } else {
      if (!duLieuChinh) {
        taiChinh().then(ve);
        return datNoiDung(KHUNG, khoiDangTai());
      }
      // Thanh tiến độ
      const dem = tinhSo();
      const tong = duLieuChinh.danhSach.length || 1;
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
        oThongKe(`${daGhi}/${tong}`, 'Đã điểm danh', 'chinh'),
        oThongKe(String(dem.co_mat), 'Có mặt', 'tot'),
        oThongKe(String(dem.tre), 'Đi trễ', 'luuy'),
        oThongKe(String(dem.vang_phep), 'Vắng có phép', 'thu'),
        oThongKe(String(dem.vang_khong_phep), 'Vắng không phép', 'xau')
      );
      khung.append(day);

      // Ô tìm kiếm học sinh — lọc TRỰC TIẾP danh sách bên dưới, và "Áp dụng nhanh" cũng chỉ áp
      // dụng lên đúng danh sách đang tìm thấy (không áp lên cả lớp khi đang lọc), để giáo viên
      // gõ tên một nhóm nhỏ rồi bấm trạng thái là điểm danh nhanh đúng nhóm đó. Chỉ rebuild
      // "khuVucChinh" (không rebuild cả trang) mỗi khi gõ, để ô tìm kiếm không mất focus.
      const oTimChinh = oNhap('ddTimChinh', 'search', timChinh, 'Tìm theo tên, tổ/lớp nghề, hoặc STT…');
      oTimChinh.addEventListener('input', (ev) => {
        timChinh = ev.target.value;
        veKhuVucChinh();
      });
      khung.append(truong('🔎 Tìm học sinh', oTimChinh));

      const khuVucChinh = e('div');
      khuVucChinh.id = 'dd-khu-vuc-chinh';
      khung.append(khuVucChinh);

      const dsLocChinh = () => {
        const q = timChinh.trim().toLowerCase();
        if (!q) return duLieuChinh.danhSach;
        return duLieuChinh.danhSach.filter((h) =>
          h.hoTen.toLowerCase().includes(q) ||
          String(h.id).includes(q) ||
          (h.lopNghe || '').toLowerCase().includes(q)
        );
      };

      function veKhuVucChinh() {
        const dsLoc = dsLocChinh();
        const dangLoc = Boolean(timChinh.trim());
        const khungCon = e('div');

        if (dangLoc && !dsLoc.length) {
          khungCon.append(e('p', 'trong', `Không tìm thấy học sinh nào khớp "${timChinh.trim()}".`));
          datNoiDung(khuVucChinh, khungCon);
          return;
        }

        // Thanh áp dụng nhanh cho cả lớp (hoặc đúng danh sách đang tìm thấy) & Xoá tất cả ghi chú
        const theApDungNhanh = e('div', 'the');
        theApDungNhanh.style.cssText = 'padding:12px 14px;margin-bottom:12px;';
        theApDungNhanh.append(Object.assign(
          e('div', null, dangLoc ? `⚡ Áp dụng nhanh cho ${dsLoc.length} học sinh tìm thấy` : '⚡ Áp dụng nhanh cho cả lớp'),
          { style: 'font-size:12.5px;font-weight:700;color:var(--chu);margin-bottom:8px;' }
        ));
        const dayApDungNhanh = e('div', 'day-loc day-loc-deu-co-gian');
        Object.entries(DIEM_DANH).forEach(([ma, tt2]) => {
          const caLopDangChon = dsLoc.length > 0 &&
            dsLoc.every((h) => trangThaiHienTaiChinh(h.id, h.trangThai) === ma);

          const b = e('button', 'vien-loc', `${tt2.ky} ${tt2.ten}`);
          b.type = 'button';
          b.setAttribute('aria-pressed', String(caLopDangChon));
          b.title = caLopDangChon
            ? `Bỏ chọn tất cả "${tt2.ten}"`
            : `Đặt "${tt2.ten}" cho ${dangLoc ? 'danh sách tìm thấy' : 'cả lớp'} (bấm lại để bỏ chọn tất cả)`;
          b.addEventListener('click', () => {
            if (caLopDangChon) {
              dsLoc.forEach((h) => thayDoiChinh.set(h.id, null));
            } else {
              dsLoc.forEach((h) => thayDoiChinh.set(h.id, ma));
            }
            ve();
          });
          dayApDungNhanh.append(b);
        });

        // Nút Xoá tất cả ghi chú (của cả lớp, hoặc đúng danh sách đang tìm thấy)
        const soCoGhiChu = dsLoc.filter((h) => lyDoHienTaiChinh(h.id, h.lyDo)).length;
        const bXoaGc = e('button', 'vien-loc', `🗑 Xoá tất cả ghi chú${soCoGhiChu ? ` (${soCoGhiChu})` : ''}`);
        bXoaGc.type = 'button';
        if (soCoGhiChu) {
          bXoaGc.style.color = 'var(--xau)';
          bXoaGc.style.borderColor = 'var(--xau)';
        }
        bXoaGc.title = `Xoá toàn bộ ghi chú lý do của ${dangLoc ? 'danh sách tìm thấy' : 'cả lớp'} trong buổi chính này`;
        bXoaGc.addEventListener('click', () => {
          if (!soCoGhiChu) return nhac('Hiện không có học sinh nào có ghi chú trong buổi này.', 'nhe');
          moHopThoai('Xoá tất cả ghi chú buổi này?', [
            e('p', null, `Bạn có chắc muốn xoá toàn bộ ghi chú lý do của ${soCoGhiChu} học sinh${dangLoc ? ' (trong danh sách đang tìm thấy)' : ''} trong buổi chính này?`),
            e('p', 'trong', 'Trạng thái điểm danh (Có mặt, Vắng, Trễ) vẫn giữ nguyên, chỉ xoá sạch nội dung ghi chú lý do.')
          ], [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá tất cả ghi chú', 'nut-xau', () => {
              dsLoc.forEach((h) => {
                if (lyDoHienTaiChinh(h.id, h.lyDo)) {
                  lyDoMoiChinh.set(h.id, '');
                }
              });
              dongHopThoai();
              nhac('Đã xoá sạch ghi chú (hãy bấm "Lưu điểm danh")', 'tot');
              ve();
            })
          ]);
        });
        dayApDungNhanh.append(bXoaGc);

        theApDungNhanh.append(dayApDungNhanh);
        khungCon.append(theApDungNhanh);

        // Chú thích các nút trạng thái — đặt TRƯỚC danh sách (không phải sau như trước) để
        // giáo viên hiểu ký hiệu ✓/T/P/✗/📝 nghĩa là gì NGAY khi vừa xem trang, khỏi phải cuộn
        // qua hết cả lớp (có thể vài chục em) mới thấy chú thích nằm ở cuối.
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
        khungCon.append(chuThich);

        // Danh sách học sinh (đúng danh sách đang tìm thấy — cả lớp nếu không lọc gì)
        const ds = e('div', 'ds-diem-danh');
        // Đang tìm kiếm với ít kết quả (≤ 8 em) — hiện hẳn TOÀN BỘ lịch sử điểm danh của đúng
        // những em đó thay cho hàng bấm nhanh ✓/T/P/✗ (đằng nào cũng đã có thanh "⚡ Áp dụng
        // nhanh" phía trên lo phần bấm nhanh này rồi — lặp thêm một hàng bấm-nhanh riêng cho
        // từng em là dư thừa, lại khác kiểu thẻ hẳn với chính khối lịch sử ngay bên dưới nó).
        const dangHienLichSu = dangLoc && dsLoc.length <= 8;
        dsLoc.forEach((h) => {
          const tt = trangThaiHienTaiChinh(h.id, h.trangThai);
          const ld = lyDoHienTaiChinh(h.id, h.lyDo);
          const hang = e('div', 'hang-hs' + (tt ? '' : ' chua-ghi'));

          if (dangHienLichSu) {
            hang.append(veLichSuTimThay(h, veKhuVucChinh));
            ds.append(hang);
            return;
          }

          const ten = e('div', 'ten');
          ten.append(e('b', null, h.hoTen), e('small', null, h.lopNghe || ''));

          if (ld) {
            const dongLd = e('div', 'dong-ly-do');
            dongLd.title = `Ghi chú: ${ld} — Bấm để sửa`;
            dongLd.append(e('span', null, '💬'), Object.assign(e('span', 'dong-ly-do-chu', ld)));
            dongLd.addEventListener('click', (ev) => {
              ev.stopPropagation();
              moHopThoaiGhiChuDiemDanh(h, tt, ld, (val, ttChon) => {
                lyDoMoiChinh.set(h.id, val);
                if (ttChon) thayDoiChinh.set(h.id, ttChon);
                else if (!thayDoiChinh.has(h.id) && val && !tt) thayDoiChinh.set(h.id, 'vang_phep');
                ve();
              });
            });
            ten.append(dongLd);
          }

          hang.append(e('div', 'stt', h.soThuTu ?? h.id), ten);

          const nhom = e('div', 'nhom-chon');
          Object.entries(DIEM_DANH).forEach(([ma, tt2]) => {
            const b = e('button', null, tt2.ky);
            b.type = 'button';
            b.dataset.tt = ma;
            b.title = tt2.ten + ' — bấm lại để bỏ chọn';
            b.setAttribute('aria-label', `${h.hoTen}: ${tt2.ten}`);
            b.setAttribute('aria-pressed', String(tt === ma));
            b.addEventListener('click', () => {
              thayDoiChinh.set(h.id, tt === ma ? null : ma);
              ve();
            });
            nhom.append(b);
          });

          // Nút thứ 5: Ghi chú lý do cho từng học sinh
          const nutGc = e('button', 'nut-icon-ghi-chu' + (ld ? ' da-co-ghi-chu' : ''));
          nutGc.type = 'button';
          nutGc.textContent = '📝';
          nutGc.title = ld ? `Ghi chú: "${ld}" — Bấm để sửa` : `Thêm ghi chú/lý do cho ${h.hoTen}`;
          nutGc.setAttribute('aria-label', `Ghi chú cho ${h.hoTen}`);
          nutGc.addEventListener('click', (ev) => {
            ev.stopPropagation();
            moHopThoaiGhiChuDiemDanh(h, tt, ld, (val, ttChon) => {
              lyDoMoiChinh.set(h.id, val);
              if (ttChon) thayDoiChinh.set(h.id, ttChon);
              else if (!thayDoiChinh.has(h.id) && val && !tt) thayDoiChinh.set(h.id, 'vang_phep');
              ve();
            });
          });
          nhom.append(nutGc);

          hang.append(nhom);
          ds.append(hang);
        });
        if (dangLoc && dsLoc.length > 8) {
          khungCon.append(e('p', 'trong', `Có ${dsLoc.length} học sinh khớp — gõ tên cụ thể hơn (còn ≤ 8 kết quả) để xem lịch sử điểm danh từng em.`));
        }
        khungCon.append(ds);

        datNoiDung(khuVucChinh, khungCon);
      }

      veKhuVucChinh();
    }
    khung.append(Object.assign(e('div'), { style: 'height:70px' }));

    // Thanh lưu — CHỈ hiện ở tab Điểm danh chính. Tab Điểm danh linh động đã có nút lưu riêng ngay
    // trong thẻ của nó (lưu thẳng toàn bộ thayDoiPhu, lyDoMoiPhu),
    // nên không hiện thêm thanh này nữa — tránh 2 nút "Lưu điểm danh" cùng lúc gây rối.
    const cacIdThayDoi = new Set([...thayDoiChinh.keys(), ...lyDoMoiChinh.keys()]);
    if (cacIdThayDoi.size && tabCon !== 'nhanh') {
      const thanhLuu = e('div', 'thanh-luu');
      thanhLuu.append(e('div', 'thong-tin', `${cacIdThayDoi.size} thay đổi chưa lưu`));
      thanhLuu.append(
        nut('Bỏ', 'nut-nhe nut-nho', () => { thayDoiChinh.clear(); lyDoMoiChinh.clear(); ve(); }),
        nut('Lưu điểm danh', '', (ev) => luuDiemDanhChinh(ev.currentTarget))
      );
      khung.append(thanhLuu);
    }

    datNoiDung(KHUNG, khung);
  }

  await tai();
}

/* ================= Trang: Học sinh ================= */
