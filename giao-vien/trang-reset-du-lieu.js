/* Reset dữ liệu lớp theo từng mục — CHỈ giáo viên chủ nhiệm (xem functions/api/gv/rieng/
   reset-du-lieu.js). HẦU HẾT các mục được CHỤP LẠI trước khi xoá sạch nên khôi phục lại được —
   khác hẳn "Học sinh/Mã cá nhân/Tài khoản phụ" cố tình KHÔNG đưa vào đây vì xoá xong không cứu
   được (xoá học sinh còn kéo theo mất điểm danh/liên hệ phụ huynh/khoản đóng quỹ của em đó).
   RIÊNG "Tương tác"/"Lịch sử đăng nhập" (xem MUC_KHONG_KHOI_PHUC) là dạng nhật ký, xoá xong cũng
   KHÔNG khôi phục lại được như 2 mục trên — nhưng vẫn cho chọn chung vì không kéo theo hậu quả gì
   khác ngoài mất đúng số liệu đó (không như xoá học sinh).

   Nút "↩ Hoàn tác" chỉ giữ trong bộ nhớ của trang này (không lưu localStorage) — CỐ Ý, vì
   localStorage dùng chung nếu sau này đăng nhập sang lớp khác trên CÙNG trình duyệt sẽ lẫn dữ
   liệu khôi phục giữa 2 lớp. Rời trang/tải lại thì mất nút tắt này, nhưng dữ liệu vẫn khôi phục
   lại được bình thường qua đúng trang "Lịch sử & khôi phục" riêng của từng mục — không mất gì. */
import { e, datNoiDung, api, nhac } from '/assets/js/chung.js';
import { tieuDeTrang, nut, moHopThoai, dongHopThoai } from '/assets/js/giao-dien.js';

const CAC_MUC = [
  ['diem-danh', '✅', 'Điểm danh', 'Toàn bộ bản ghi điểm danh (chính khoá + linh động) của mọi ngày.'],
  ['quy', '🪙', 'Thủ quỹ', 'Toàn bộ khoản thu, khoản đã đóng, khoản chi.'],
  ['thong-bao', '📢', 'Thông báo', 'Toàn bộ thông báo đã đăng lên trang lớp.'],
  ['thoi-khoa-bieu', '🕒', 'Thời khoá biểu', 'Xoá sạch các tiết của phiên bản ĐANG DÙNG (về trống để xếp lại) — không đụng lịch sử các phiên bản khác.'],
  ['hoat-dong-lop', '🌿', 'Hoạt động lớp', 'Toàn bộ bài đăng ảnh/video/âm thanh hoạt động ở trang chủ.'],
  ['hinh-anh', '🖼', 'Thư viện Ảnh', 'Chuyển toàn bộ ảnh (chưa ở thùng rác) vào thùng rác.'],
  ['am-thanh', '♪', 'Thư viện Âm thanh', 'Chuyển toàn bộ bài hát (chưa ở thùng rác) vào thùng rác.'],
  ['video', '🎬', 'Thư viện Video', 'Chuyển toàn bộ video (chưa ở thùng rác) vào thùng rác.'],
  ['theo-doi', '🎒', 'Theo dõi đầu năm', 'Trạng thái sách giáo khoa/đồng phục của mọi học sinh, về lại trạng thái trống.'],
  ['tuong-tac', '📈', 'Tương tác (lượt truy cập)', 'Toàn bộ số liệu lượt truy cập trang lớp. XOÁ VĨNH VIỄN — không khôi phục được.'],
  ['lich-su-dang-nhap', '🔑', 'Lịch sử đăng nhập', 'Toàn bộ nhật ký ai đăng nhập, IP, cảnh báo IP lạ. XOÁ VĨNH VIỄN — không khôi phục được.'],
];

// 2 mục dạng nhật ký — xoá xong KHÔNG khôi phục lại được, khớp đúng MUC_KHONG_KHOI_PHUC ở
// functions/api/gv/rieng/reset-du-lieu.js (giữ 2 nơi đồng bộ nếu sau này thêm/bớt).
const MUC_KHONG_KHOI_PHUC = new Set(['tuong-tac', 'lich-su-dang-nhap']);

function tenMuc(ma) {
  const timThay = CAC_MUC.find((m) => m[0] === ma);
  return timThay ? timThay[2] : ma;
}

export async function trangResetDuLieu(KHUNG) {
  const khung = e('div');
  khung.append(tieuDeTrang('Reset dữ liệu lớp',
    'Xoá sạch từng mục theo lựa chọn — hầu hết các mục được CHỤP LẠI trước khi xoá nên khôi phục lại được (riêng Tương tác/Lịch sử đăng nhập thì không). Không bao gồm Học sinh/Mã cá nhân/Tài khoản phụ (xoá xong không cứu được).'));

  const canhBao = e('div', 'the');
  canhBao.style.borderColor = 'var(--xau)';
  canhBao.append(
    e('h3', null, '⚠ Đọc kỹ trước khi dùng'),
    e('p', null, 'Đây là thao tác XOÁ HÀNG LOẠT — chỉ dùng khi thật sự muốn dọn sạch để bắt đầu lại (vd sang học kỳ/năm học mới). Hầu hết các mục xoá xong đều khôi phục lại được qua đúng trang "Lịch sử & khôi phục" của mục đó — riêng "Tương tác" và "Lịch sử đăng nhập" là dạng nhật ký, xoá xong không cứu lại được. Vẫn nên chắc chắn trước khi bấm.'),
  );
  khung.append(canhBao);

  const oDsMuc = e('div', 'the');
  oDsMuc.style.marginTop = '14px';

  const oChonTatCa = e('label');
  oChonTatCa.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:700;margin-bottom:12px;cursor:pointer';
  const cbTatCa = e('input');
  cbTatCa.type = 'checkbox';
  cbTatCa.style.cssText = 'width:18px;height:18px;cursor:pointer';
  oChonTatCa.append(cbTatCa, document.createTextNode('Chọn tất cả'));

  const luoiChon = e('div', 'day-loc-deu-co-gian');
  luoiChon.style.setProperty('--the-nho-nhat', '220px');

  const dsHopKiemTra = CAC_MUC.map(([ma, icon, ten, moTa]) => {
    const nhan = e('label');
    nhan.style.cssText = 'display:flex;align-items:flex-start;gap:10px;padding:10px;border:1px solid var(--vien);border-radius:var(--r-nho);cursor:pointer;background:var(--nen-chim)';
    const cb = e('input');
    cb.type = 'checkbox';
    cb.dataset.muc = ma;
    cb.style.cssText = 'width:18px;height:18px;cursor:pointer;flex:none;margin-top:2px';
    const tieuDeMuc = e('div', null, `${icon} ${ten}`);
    tieuDeMuc.style.fontWeight = '700';
    const noiDung = e('div');
    noiDung.append(tieuDeMuc, e('div', 'trong', moTa));
    nhan.append(cb, noiDung);
    luoiChon.append(nhan);
    return cb;
  });

  cbTatCa.addEventListener('change', () => {
    dsHopKiemTra.forEach((cb) => { cb.checked = cbTatCa.checked; });
  });
  dsHopKiemTra.forEach((cb) => cb.addEventListener('change', () => {
    cbTatCa.checked = dsHopKiemTra.every((c) => c.checked);
  }));

  oDsMuc.append(oChonTatCa, luoiChon);

  const oKetQua = e('div');

  const nutReset = nut('🗑 Reset các mục đã chọn', 'nut-xau', () => {
    const dsChon = dsHopKiemTra.filter((cb) => cb.checked).map((cb) => cb.dataset.muc);
    if (!dsChon.length) return nhac('Chưa chọn mục nào.', 'xau');
    xacNhanReset(dsChon, oKetQua);
  });
  nutReset.style.marginTop = '14px';
  oDsMuc.append(nutReset);
  khung.append(oDsMuc);
  khung.append(oKetQua);

  datNoiDung(KHUNG, khung);
}

function xacNhanReset(dsMuc, oKetQua) {
  const mucKhongKhoiPhuc = dsMuc.filter((m) => MUC_KHONG_KHOI_PHUC.has(m));
  const noiDung = [
    e('p', null, `Sẽ xoá sạch: ${dsMuc.map(tenMuc).join(', ')}.`),
    e('p', 'trong', 'Các mục còn lại có thể khôi phục lại ngay sau khi xoá, hoặc khôi phục lại sau qua trang "Lịch sử & khôi phục" của từng mục.'),
  ];
  if (mucKhongKhoiPhuc.length) {
    const canhBao = e('p', null, `⚠ Riêng ${mucKhongKhoiPhuc.map(tenMuc).join(', ')}: xoá xong KHÔNG khôi phục lại được (dạng nhật ký).`);
    canhBao.style.color = 'var(--xau)';
    canhBao.style.fontWeight = '700';
    noiDung.push(canhBao);
  }
  moHopThoai('Xác nhận reset dữ liệu?', noiDung, [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Reset ngay', 'nut-xau', async (ev) => {
      const nutBam = ev.currentTarget;
      nutBam.disabled = true;
      try {
        const kq = await api('/api/gv/rieng/reset-du-lieu', { method: 'POST', than: { hanhDong: 'reset', mucs: dsMuc } });
        dongHopThoai();
        nhac('Đã reset xong.', 'tot');
        veKetQua(kq.ketQua, oKetQua);
      } catch (err) {
        nhac(err.message, 'xau');
        nutBam.disabled = false;
      }
    }),
  ]);
}

function veKetQua(ketQua, oKetQua) {
  const coKhoiPhuc = ketQua.filter((k) => k.loaiKhoiPhuc !== 'khong-khoi-phuc');
  const khongKhoiPhuc = ketQua.filter((k) => k.loaiKhoiPhuc === 'khong-khoi-phuc');

  const the = e('div', 'the');
  the.style.cssText = 'margin-top:14px;border-color:var(--tot)';
  the.append(
    e('h3', null, '✓ Đã reset xong'),
    e('p', null, `Đã xoá: ${ketQua.map((k) => tenMuc(k.muc)).join(', ')}.`),
  );
  if (khongKhoiPhuc.length) {
    the.append(e('p', 'trong', `⚠ ${khongKhoiPhuc.map((k) => tenMuc(k.muc)).join(', ')} đã xoá vĩnh viễn, không có gì để hoàn tác.`));
  }
  if (coKhoiPhuc.length) {
    the.append(e('p', 'trong', 'Nút "Hoàn tác" dưới đây chỉ dùng được khi còn đứng ở trang này (rời trang là mất) — sau đó vẫn khôi phục lại được bình thường qua trang "Lịch sử & khôi phục" riêng của từng mục.'));
    const nutHoanTac = nut(`↩ Hoàn tác ${coKhoiPhuc.map((k) => tenMuc(k.muc)).join(', ')}`, 'nut-vien', async (ev) => {
      const nutBam = ev.currentTarget;
      nutBam.disabled = true;
      const nhanGoc = nutBam.textContent;
      nutBam.textContent = 'Đang hoàn tác…';
      try {
        await api('/api/gv/rieng/reset-du-lieu', { method: 'POST', than: { hanhDong: 'hoanTac', ketQua: coKhoiPhuc } });
        datNoiDung(the, e('h3', null, '✓ Đã hoàn tác — dữ liệu trở lại như trước khi reset.'));
        nhac('Đã hoàn tác.', 'tot');
      } catch (err) {
        nhac(err.message, 'xau');
        nutBam.disabled = false;
        nutBam.textContent = nhanGoc;
      }
    });
    the.append(nutHoanTac);
  }
  datNoiDung(oKetQua, the);
}
