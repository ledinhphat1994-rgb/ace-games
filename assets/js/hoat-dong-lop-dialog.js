/* Hộp thoại thêm MỘT mục vào "Hoạt động lớp" — dành cho giáo viên hoặc học sinh được cấp quyền.
   Văn bản / Ảnh / Video / Âm thanh giờ là 4 CÔNG TẮC ĐỘC LẬP — bấm để bật (sáng), bấm lại để
   tắt — có thể bật NHIỀU cái cùng lúc, đăng gộp thành MỘT bài duy nhất (giống hệt cách Thông
   báo đã làm), thay vì buộc chọn đúng một loại như thiết kế cũ. Loại nào tài khoản chưa được
   cấp quyền thư viện tương ứng thì công tắc đó bị khoá (🔒), chỉ bấm được Văn bản. */
import { e, api, datNoiDung, ngayVN, nenAnhThanhBlob, nhac, homNay } from './chung.js';
import { nut, oNhap, oChon, moHopThoai, dongHopThoai, truong } from './giao-dien.js';
import { locHtmlNoiDung } from './html-an-toan.js';

const EMOJI_GOI_Y = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '🥳', '🤩', '👍', '👏', '🙌', '💪',
  '🔥', '⭐', '🌟', '✨', '❤️', '💙', '💚', '💛', '🧡', '💜', '🎉', '🎊',
  '🎈', '🎓', '📚', '✏️', '📝', '🏆', '🥇', '🎯', '📷', '🎵', '🎬', '📢',
];

/** Nút "😊" mở bảng chọn emoji nhỏ — dùng chung cho cả ô Tiêu đề (input thường) lẫn ô Nội dung
    (soạn thảo có định dạng). `khiChon(emoji)` do nơi gọi tự quyết định chèn vào đâu. */
function nutChonEmoji(khiChon) {
  const boc = e('div');
  boc.style.cssText = 'position:relative;display:inline-block;';
  const nutMo = e('button', 'nut-nhe nut-nho', '😊');
  nutMo.type = 'button';
  nutMo.title = 'Chèn emoji';
  const bang = e('div');
  bang.style.cssText = 'position:absolute;z-index:20;top:calc(100% + 4px);left:0;width:226px;'
    + 'max-height:168px;overflow:auto;padding:8px;border-radius:10px;'
    + 'border:1px solid var(--vien-dam, var(--vien));background:var(--nen-noi);box-shadow:var(--bong-2);'
    + 'grid-template-columns:repeat(7, 1fr);gap:2px;display:none;';
  EMOJI_GOI_Y.forEach((kyTu) => {
    const nutE = e('button', 'nut-emoji', kyTu);
    nutE.type = 'button';
    // mousedown + preventDefault: tránh cướp tiêu điểm/con trỏ đang có trong ô soạn thảo trước
    // khi kịp chèn emoji vào đúng chỗ.
    nutE.addEventListener('mousedown', (ev) => ev.preventDefault());
    nutE.addEventListener('click', () => { khiChon(kyTu); dong(); });
    bang.append(nutE);
  });
  let mo = false;
  function dong() { mo = false; bang.style.display = 'none'; document.removeEventListener('mousedown', ngoaiVung); }
  function ngoaiVung(ev) { if (!boc.contains(ev.target)) dong(); }
  nutMo.addEventListener('mousedown', (ev) => { if (mo) return; ev.preventDefault(); });
  nutMo.addEventListener('click', () => {
    mo = !mo;
    bang.style.display = mo ? 'grid' : 'none';
    if (mo) setTimeout(() => document.addEventListener('mousedown', ngoaiVung), 0);
  });
  boc.append(nutMo, bang);
  return boc;
}

/** Chèn văn bản vào đúng vị trí con trỏ của một ô input thường (không phải soạn thảo). */
function chenVaoONhap(input, text) {
  const bd = input.selectionStart ?? input.value.length;
  const kt = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, bd) + text + input.value.slice(kt);
  const viTri = bd + text.length;
  input.focus();
  input.setSelectionRange(viTri, viTri);
}

/** Hộp soạn thảo có định dạng cơ bản (in đậm, in nghiêng, font/cỡ/màu chữ, chèn emoji) cho phần
    "Nội dung chi tiết" — giống các nút soạn bài trên mạng xã hội. Dùng contenteditable + lệnh
    execCommand cho in đậm/in nghiêng (được hỗ trợ rộng), còn font/cỡ/màu chữ tự bọc <span
    style="..."> quanh vùng đang bôi đen (execCommand không cho chỉnh cỡ chữ theo px). Nội dung
    thật sự gửi lên máy chủ sẽ được lọc lại qua locHtmlNoiDung() — chỉ vài thẻ/CSS được duyệt mới
    lọt qua, nên dù trình duyệt sinh ra gì thừa thãi cũng không đáng ngại. */
function khoiSoanThaoNoiDung(goiY) {
  const oSoan = e('div', 'o-nhap o-soan-thao');
  oSoan.contentEditable = 'true';
  oSoan.setAttribute('data-goi-y', goiY || '');
  oSoan.setAttribute('role', 'textbox');
  oSoan.setAttribute('aria-multiline', 'true');
  oSoan.addEventListener('focus', () => {
    try { document.execCommand('defaultParagraphSeparator', false, 'br'); } catch { /* trình duyệt cũ bỏ qua */ }
  });

  let phamViDaLuu = null;
  function ghiNhoViTriChon() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && oSoan.contains(sel.anchorNode)) {
      phamViDaLuu = sel.getRangeAt(0).cloneRange();
    }
  }
  oSoan.addEventListener('mouseup', ghiNhoViTriChon);
  oSoan.addEventListener('keyup', ghiNhoViTriChon);
  oSoan.addEventListener('focus', ghiNhoViTriChon);
  // 'input' bắt được MỌI thay đổi nội dung (gõ, dán, gõ tiếng Việt qua bộ gõ...) — đáng tin hơn
  // keyup vì vài cách nhập không phát đủ sự kiện bàn phím cho từng ký tự.
  oSoan.addEventListener('input', ghiNhoViTriChon);

  function khoiPhucVaChay(hanhDong) {
    oSoan.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      if (phamViDaLuu) { try { sel.addRange(phamViDaLuu); } catch { /* vùng chọn cũ không còn hợp lệ */ } }
    }
    hanhDong();
    ghiNhoViTriChon();
  }

  function apDungKieuChoVungChon(thuocTinh, giaTri) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      nhac('Bôi đen đoạn chữ cần đổi trước đã nhé.', 'xau');
      return;
    }
    const khoang = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style[thuocTinh] = giaTri;
    let trich;
    try { trich = khoang.extractContents(); } catch { return; }
    span.appendChild(trich);
    khoang.insertNode(span);
    sel.removeAllRanges();
    const r2 = document.createRange();
    r2.selectNodeContents(span);
    sel.addRange(r2);
  }

  const nutDam = e('button', 'nut-soan', 'B');
  nutDam.type = 'button'; nutDam.title = 'In đậm'; nutDam.style.fontWeight = '800';
  nutDam.addEventListener('click', () => khoiPhucVaChay(() => document.execCommand('bold')));

  const nutNghieng = e('button', 'nut-soan', 'I');
  nutNghieng.type = 'button'; nutNghieng.title = 'In nghiêng'; nutNghieng.style.fontStyle = 'italic';
  nutNghieng.addEventListener('click', () => khoiPhucVaChay(() => document.execCommand('italic')));

  const oFont = e('select', 'o-nhap o-soan-nho');
  oFont.title = 'Font chữ';
  [['', 'Aa Font'], ["'Be Vietnam Pro', sans-serif", 'Chữ thường'], ['Georgia, serif', 'Trang trọng'],
    ["'Courier New', monospace", 'Đánh máy'], ["'Comic Sans MS', cursive", 'Viết tay']].forEach(([v, t]) => {
    const op = e('option', null, t); op.value = v; oFont.append(op);
  });
  oFont.addEventListener('change', () => {
    if (oFont.value) khoiPhucVaChay(() => apDungKieuChoVungChon('fontFamily', oFont.value));
    oFont.value = '';
  });

  const oCoChu = e('select', 'o-nhap o-soan-nho');
  oCoChu.title = 'Cỡ chữ';
  [['', 'Cỡ chữ'], ['13px', 'Nhỏ'], ['16px', 'Vừa'], ['20px', 'Lớn'], ['26px', 'Rất lớn']].forEach(([v, t]) => {
    const op = e('option', null, t); op.value = v; oCoChu.append(op);
  });
  oCoChu.addEventListener('change', () => {
    if (oCoChu.value) khoiPhucVaChay(() => apDungKieuChoVungChon('fontSize', oCoChu.value));
    oCoChu.value = '';
  });

  const dayMau = e('div', 'day-mau');
  dayMau.title = 'Màu chữ';
  ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'].forEach((mau) => {
    const nutMau = e('button', 'nut-mau');
    nutMau.type = 'button'; nutMau.title = 'Đổi màu chữ'; nutMau.style.background = mau;
    nutMau.addEventListener('click', () => khoiPhucVaChay(() => apDungKieuChoVungChon('color', mau)));
    dayMau.append(nutMau);
  });

  const nutEmoji = nutChonEmoji((kyTu) => khoiPhucVaChay(() => document.execCommand('insertText', false, kyTu)));

  const thanhCongCu = e('div', 'thanh-soan-thao');
  thanhCongCu.append(nutDam, nutNghieng, oFont, oCoChu, dayMau, nutEmoji);

  const khung = e('div');
  khung.append(thanhCongCu, oSoan);

  return {
    khung,
    oSoan,
    layHtml: () => locHtmlNoiDung(oSoan.innerHTML),
    layVanBanThuong: () => oSoan.textContent.trim(),
  };
}

async function layDanhSachThuVien(duong) {
  try {
    const d = await api(duong);
    return d.danhSach || [];
  } catch {
    return [];
  }
}

const NGUON = [['thu-vien', '📚 Thư viện'], ['tai-len', '⬆ Tải lên'], ['link', '🔗 Dán link']];

function khoiChonNguon({ oThuVien, oTep, oLink, ghiChuLink }) {
  const khung = e('div');
  const dayNut = e('div', 'day-loc');
  dayNut.style.cssText = 'margin-bottom:10px';
  const oNoiDung = e('div');
  let nguonHienTai = 'thu-vien';

  function ve() {
    datNoiDung(dayNut, ...NGUON.map(([ma, nhan]) => {
      const b = e('button', 'vien-loc', nhan);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(nguonHienTai === ma));
      b.addEventListener('click', () => { nguonHienTai = ma; ve(); });
      return b;
    }));
    const o = nguonHienTai === 'thu-vien' ? oThuVien : nguonHienTai === 'tai-len' ? oTep : oLink;
    const con = [o];
    if (nguonHienTai === 'link' && ghiChuLink) {
      con.push(Object.assign(e('div', 'trong', ghiChuLink), { style: 'margin-top:6px;font-size:12px' }));
    }
    datNoiDung(oNoiDung, ...con);
  }

  khung.append(dayNut, oNoiDung);
  ve();
  return { khung, layNguon: () => nguonHienTai };
}

async function khoiAnh() {
  const dsAnh = await layDanhSachThuVien('/api/gv/anh');
  const oThuVien = oChon('hdChonAnh', [['', '— Chọn một ảnh —'], ...dsAnh.map((a) => [String(a.id), `${a.chuThich || 'Ảnh'} — ${ngayVN(a.ngay)}`])], '');
  const oTep = e('input');
  oTep.type = 'file'; oTep.accept = 'image/jpeg,image/png,image/webp'; oTep.className = 'o-nhap';
  const oLink = oNhap('hdUrlAnh', 'text', '', 'Dán link ảnh (https://...) hoặc link Google Drive');
  const { khung, layNguon } = khoiChonNguon({ oThuVien, oTep, oLink, ghiChuLink: 'Chuột phải ảnh → "Sao chép địa chỉ hình ảnh", hoặc link chia sẻ Google Drive.' });
  return { khung, oTep, oLink, oThuVien, layNguon };
}

async function khoiVideo() {
  const dsVideo = await layDanhSachThuVien('/api/gv/thu-vien-video');
  const oThuVien = oChon('hdChonVideo', [['', '— Chọn một video —'], ...dsVideo.map((v) => [String(v.id), v.ten || 'Video chưa đặt tên'])], '');
  const oTep = e('input');
  oTep.type = 'file'; oTep.accept = 'video/mp4,video/webm,video/quicktime,video/*'; oTep.className = 'o-nhap';
  const oLink = oNhap('hdUrlVideo', 'text', '', 'Dán link YouTube, Google Drive, TikTok, Facebook, hoặc .mp4');
  const { khung, layNguon } = khoiChonNguon({ oThuVien, oTep, oLink, ghiChuLink: 'Nhận đủ link YouTube/Drive/TikTok/Facebook/.mp4 — hệ thống tự nhận diện và nhúng phát.' });
  return { khung, oTep, oLink, oThuVien, layNguon };
}

async function khoiAmThanh() {
  const dsNhac = await layDanhSachThuVien('/api/gv/thu-vien-am-thanh');
  const oThuVien = oChon('hdChonNhac', [['', '— Chọn một bài —'], ...dsNhac.map((b) => [String(b.id), b.ten || 'Bài hát chưa đặt tên'])], '');
  const oTep = e('input');
  oTep.type = 'file'; oTep.accept = 'audio/mpeg,.mp3'; oTep.className = 'o-nhap';
  const oLink = oNhap('hdUrlNhac', 'text', '', 'Dán link file nhạc (.mp3) hoặc link chia sẻ Google Drive');
  const { khung, layNguon } = khoiChonNguon({ oThuVien, oTep, oLink, ghiChuLink: 'Dán link tệp .mp3 trực tuyến hoặc link chia sẻ Google Drive.' });
  return { khung, oTep, oLink, oThuVien, layNguon };
}

export async function moHopThoaiThemHoatDong(lamMoi) {
  // Lấy thông tin phiên để phân quyền từng công tắc media
  const phien = await api('/api/whoami').catch(() => ({ role: 'teacher', quyen: [] }));
  const laGiaoVien = phien.role === 'teacher';
  const quyen = phien.quyen || [];
  const coQuyenAnh = laGiaoVien || quyen.includes('hinh-anh');
  const coQuyenVideo = laGiaoVien || quyen.includes('video');
  const coQuyenAmThanh = laGiaoVien || quyen.includes('am-thanh');

  const oNgay = oNhap('hdNgay', 'date', homNay());

  // Khối Văn bản — tiêu đề/nội dung dùng chung cho CẢ bài (kể cả khi có kèm media, đây là chú
  // thích chung của bài đó, không phải chú thích riêng từng loại nữa).
  const oTieuDe = oNhap('hdTieuDe', 'text', '', 'Ví dụ: Lao động vệ sinh khuôn viên lớp, Thi văn nghệ 20/11...');
  const hangTieuDe = e('div');
  hangTieuDe.style.cssText = 'display:flex;gap:6px;align-items:flex-start;';
  hangTieuDe.append(oTieuDe, nutChonEmoji((kyTu) => chenVaoONhap(oTieuDe, kyTu)));

  const oNoiDung = khoiSoanThaoNoiDung('Ghi lại diễn biến, thành tích hoặc chi tiết hoạt động...');

  const khungText = e('div');
  khungText.append(truong('Tiêu đề / Chủ đề', hangTieuDe), truong('Nội dung chi tiết', oNoiDung.khung));

  const [ketQuaAnh, ketQuaVideo, ketQuaNhac] = await Promise.all([
    coQuyenAnh ? khoiAnh() : null,
    coQuyenVideo ? khoiVideo() : null,
    coQuyenAmThanh ? khoiAmThanh() : null,
  ]);

  // 4 công tắc độc lập — Set các loại đang BẬT. Mặc định bật sẵn "Văn bản" (ai cũng có quyền).
  const dangBat = new Set(['text']);
  const CAC_LOAI = [
    ['text', 'Văn bản / Bài viết', true, null, khungText],
    ['anh', 'Ảnh', coQuyenAnh, 'Thư viện Ảnh', ketQuaAnh?.khung],
    ['video', 'Video', coQuyenVideo, 'Thư viện Video', ketQuaVideo?.khung],
    ['am-thanh', 'Âm thanh', coQuyenAmThanh, 'Thư viện Âm thanh', ketQuaNhac?.khung],
  ];
  const ICON_LOAI = { text: '📝', anh: '🖼', video: '🎬', 'am-thanh': '🎵' };

  const dayCongTac = e('div', 'day-loc');
  dayCongTac.style.cssText = 'margin-bottom:12px;display:flex;gap:6px;flex-wrap:wrap;';
  const khungNoiDung = e('div');
  khungNoiDung.style.cssText = 'display:flex;flex-direction:column;gap:14px;';

  function veCongTac() {
    datNoiDung(dayCongTac, ...CAC_LOAI.map(([ma, nhan, choPhep, tenQuyen]) => {
      const dangBatMa = dangBat.has(ma);
      // Icon đặt trong khung màu riêng từng loại (kiểu Facebook: ảnh xanh lá, video đỏ...) cho
      // dễ nhận diện nhanh và bắt mắt hơn emoji trơn.
      const b = e('button', 'vien-loc cong-tac-loai');
      b.append(
        e('span', 'icon-loai icon-loai-' + ma, choPhep ? ICON_LOAI[ma] : '🔒'),
        e('span', null, nhan),
      );
      b.type = 'button';
      b.setAttribute('aria-pressed', String(dangBatMa));
      if (!choPhep) {
        b.style.opacity = '0.55';
        b.title = `Cần quyền ${tenQuyen}`;
      }
      b.addEventListener('click', () => {
        if (!choPhep) {
          return nhac(`Tài khoản chưa được cấp quyền ${tenQuyen}. Nhờ giáo viên chủ nhiệm cấp thêm quyền để dùng mục này.`, 'xau');
        }
        if (dangBatMa) dangBat.delete(ma); else dangBat.add(ma);
        veCongTac();
        veNoiDung();
      });
      return b;
    }));
  }

  function veNoiDung() {
    const khoiHien = CAC_LOAI.filter(([ma]) => dangBat.has(ma)).map(([, , , , khung]) => khung).filter(Boolean);
    if (!khoiHien.length) {
      datNoiDung(khungNoiDung, e('p', 'trong', 'Bật ít nhất một công tắc ở trên (Văn bản, Ảnh, Video hoặc Âm thanh) để bắt đầu.'));
      return;
    }
    datNoiDung(khungNoiDung, ...khoiHien);
  }

  veCongTac();
  veNoiDung();

  moHopThoai('Thêm hoạt động lớp', [
    e('p', 'trong', '💡 Bấm để bật/tắt từng mục — có thể bật nhiều mục cùng lúc, đăng gộp thành một bài duy nhất.'),
    dayCongTac,
    khungNoiDung,
    truong('Ngày diễn ra', oNgay),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Đăng lên trang chủ', '', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        const than = { ngay: oNgay.value || homNay() };

        if (dangBat.has('text')) {
          than.tieuDe = oTieuDe.value.trim();
          // Gửi cả hai: bản văn bản thuần (tìm kiếm/hiển thị dự phòng) và bản HTML đã lọc (in
          // đậm/nghiêng/font/cỡ/màu chữ) — máy chủ lọc lại lần nữa trước khi lưu. Chỉ gửi bản
          // HTML khi thực sự có chữ, tránh lưu rác kiểu chỉ có "<br>".
          than.noiDung = oNoiDung.layVanBanThuong();
          if (than.noiDung) than.noiDungHtml = oNoiDung.layHtml();
        }

        // Với mỗi loại media đang BẬT: chỉ đính kèm nếu THỰC SỰ đã chọn/điền gì đó ở đúng
        // nguồn đang xem — bật công tắc chỉ để xem thử rồi bỏ trống thì ÂM THẦM bỏ qua loại
        // đó, không chặn đăng cả bài (trước đây bắt buộc phải điền đủ MỌI công tắc đang bật,
        // dù người dùng chỉ định thật sự dùng 1-2 loại, khiến không đăng được gì cả).
        if (dangBat.has('anh') && ketQuaAnh) {
          const { oTep, oLink, oThuVien, layNguon } = ketQuaAnh;
          const nguon = layNguon();
          const tep = oTep.files[0];
          if (nguon === 'tai-len' && tep) {
            const blob = await nenAnhThanhBlob(tep);
            const kq = await api('/api/gv/hoat-dong-lop-tep?loai=anh', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
            than.anhId = kq.id;
          } else if (nguon === 'thu-vien' && oThuVien.value) {
            than.anhId = Number(oThuVien.value);
          } else if (nguon === 'link' && oLink.value.trim()) {
            than.hinhUrl = oLink.value.trim();
          }
        }

        if (dangBat.has('video') && ketQuaVideo) {
          const { oTep, oLink, oThuVien, layNguon } = ketQuaVideo;
          const nguon = layNguon();
          const tep = oTep.files[0];
          if (nguon === 'tai-len' && tep && tep.size > 50_000_000) { ev.currentTarget.disabled = false; return nhac('File video vượt quá 50 MB, vui lòng chọn file nhỏ hơn hoặc dùng link.', 'xau'); }
          if (nguon === 'tai-len' && tep) {
            const duLieu = await tep.arrayBuffer();
            const kq = await api('/api/gv/hoat-dong-lop-tep?loai=video', { method: 'POST', headers: { 'Content-Type': tep.type || 'video/mp4' }, body: duLieu });
            than.videoId = kq.id;
          } else if (nguon === 'thu-vien' && oThuVien.value) {
            than.videoId = Number(oThuVien.value);
          } else if (nguon === 'link' && oLink.value.trim()) {
            than.videoUrl = oLink.value.trim();
          }
        }

        if (dangBat.has('am-thanh') && ketQuaNhac) {
          const { oTep, oLink, oThuVien, layNguon } = ketQuaNhac;
          const nguon = layNguon();
          const tep = oTep.files[0];
          if (nguon === 'tai-len' && tep && tep.size > 12_000_000) { ev.currentTarget.disabled = false; return nhac('File nhạc vượt quá 12 MB, vui lòng chọn file nhỏ hơn hoặc dùng link.', 'xau'); }
          if (nguon === 'tai-len' && tep) {
            const duLieu = await tep.arrayBuffer();
            const kq = await api('/api/gv/hoat-dong-lop-tep?loai=am-thanh', { method: 'POST', headers: { 'Content-Type': tep.type || 'audio/mpeg' }, body: duLieu });
            than.amThanhId = kq.id;
          } else if (nguon === 'thu-vien' && oThuVien.value) {
            than.amThanhId = Number(oThuVien.value);
          } else if (nguon === 'link' && oLink.value.trim()) {
            than.amThanhUrl = oLink.value.trim();
          }
        }

        if (!than.tieuDe && !than.noiDung && !than.anhId && !than.hinhUrl && !than.videoId && !than.videoUrl && !than.amThanhId && !than.amThanhUrl) {
          ev.currentTarget.disabled = false;
          return nhac('Bật ít nhất một mục và nhập/chọn nội dung cho mục đó.', 'xau');
        }

        await api('/api/gv/hoat-dong-lop', { method: 'POST', than });

        dongHopThoai();
        nhac('Đã đăng vào Hoạt động lớp', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}
