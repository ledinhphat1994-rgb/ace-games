/* Hộp công cụ soạn thảo có định dạng cơ bản (in đậm, in nghiêng, font/cỡ/màu chữ, chèn emoji) —
   dùng chung cho "Hoạt động lớp" VÀ "Thông báo" (cả tiêu đề lẫn nội dung chi tiết), để trải
   nghiệm soạn bài nhất quán ở mọi nơi thay vì mỗi chỗ một kiểu.

   Nội dung thật sự gửi lên máy chủ luôn đi qua locHtmlNoiDung() — chỉ vài thẻ/CSS đã duyệt mới
   lọt qua (xem assets/js/html-an-toan.js), nên dù trình duyệt sinh ra gì thừa thãi cũng an toàn. */
import { e, nhac } from './chung.js';
import { locHtmlNoiDung } from './html-an-toan.js';

const EMOJI_GOI_Y = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '🥳', '🤩', '👍', '👏', '🙌', '💪',
  '🔥', '⭐', '🌟', '✨', '❤️', '💙', '💚', '💛', '🧡', '💜', '🎉', '🎊',
  '🎈', '🎓', '📚', '✏️', '📝', '🏆', '🥇', '🎯', '📷', '🎵', '🎬', '📢',
];

/** Nút emoji TRẦN (không khung/nền) — bấm mở một bảng chọn nhỏ ĐỊNH VỊ THEO MÀN HÌNH (position:
    fixed, gắn thẳng vào <body>), tự thoát khỏi mọi vùng cuộn/hộp thoại nên không bao giờ bị cắt
    hay lệch chỗ. Đây là bảng chọn TẠM THỜI (bấm xong tự đóng ngay) nên không ngại đè lên các lớp
    khác — ưu tiên hiện trọn vẹn, rõ ràng hơn là né tránh. */
export function nutChonEmoji(khiChon) {
  const nutMo = e('button', 'nut-emoji-mo', '😊');
  nutMo.type = 'button';
  nutMo.title = 'Chèn emoji';

  let bang = null;
  function dong() {
    if (!bang) return;
    bang.remove();
    bang = null;
    document.removeEventListener('mousedown', ngoaiVung, true);
    document.removeEventListener('keydown', phimEsc, true);
    window.removeEventListener('scroll', dong, true);
    window.removeEventListener('resize', dong);
  }
  function ngoaiVung(ev) {
    if (bang && !bang.contains(ev.target) && ev.target !== nutMo) dong();
  }
  function phimEsc(ev) { if (ev.key === 'Escape') dong(); }

  function mo() {
    if (bang) { dong(); return; }
    bang = e('div', 'bang-emoji-noi');
    EMOJI_GOI_Y.forEach((ky) => {
      const b = e('button', 'nut-emoji', ky);
      b.type = 'button';
      b.addEventListener('mousedown', (ev) => ev.preventDefault());
      b.addEventListener('click', () => { khiChon(ky); dong(); });
      bang.append(b);
    });
    document.body.append(bang);

    const RONG = 236;
    const CAO_UOC_LUONG = 172;
    const r = nutMo.getBoundingClientRect();
    let trai = r.left;
    if (trai + RONG > window.innerWidth - 8) trai = window.innerWidth - RONG - 8;
    if (trai < 8) trai = 8;
    let tren = r.bottom + 6;
    // Không đủ chỗ phía dưới (nút nằm gần cuối màn hình) — mở NGƯỢC LÊN TRÊN nút thay vì tràn
    // ra ngoài mất kiểm soát.
    if (tren + CAO_UOC_LUONG > window.innerHeight - 8) tren = Math.max(8, r.top - CAO_UOC_LUONG - 6);
    bang.style.cssText = `position:fixed; top:${tren}px; left:${trai}px; width:${RONG}px; z-index:500;`;

    setTimeout(() => {
      document.addEventListener('mousedown', ngoaiVung, true);
      document.addEventListener('keydown', phimEsc, true);
      window.addEventListener('scroll', dong, true);
      window.addEventListener('resize', dong);
    }, 0);
  }

  nutMo.addEventListener('mousedown', (ev) => ev.preventDefault());
  nutMo.addEventListener('click', mo);
  return nutMo;
}

/** Chèn văn bản vào đúng vị trí con trỏ của một ô input thường (không phải soạn thảo). */
export function chenVaoONhap(input, text) {
  const bd = input.selectionStart ?? input.value.length;
  const kt = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, bd) + text + input.value.slice(kt);
  const viTri = bd + text.length;
  input.focus();
  input.setSelectionRange(viTri, viTri);
}

/** Hộp soạn thảo có định dạng cơ bản. `nhieuDong: false` cho các ô một dòng như Tiêu đề (chặn
    phím Enter, dán nhiều dòng chỉ lấy dòng đầu). */
export function khoiSoanThaoDinhDang({ nhieuDong = true, goiY = '' } = {}) {
  const oSoan = e('div', 'o-nhap o-soan-thao' + (nhieuDong ? '' : ' o-soan-mot-dong'));
  oSoan.contentEditable = 'true';
  oSoan.setAttribute('data-goi-y', goiY || '');
  oSoan.setAttribute('role', 'textbox');
  if (nhieuDong) oSoan.setAttribute('aria-multiline', 'true');

  oSoan.addEventListener('focus', () => {
    try { document.execCommand('defaultParagraphSeparator', false, 'br'); } catch { /* trình duyệt cũ bỏ qua */ }
  });

  if (!nhieuDong) {
    oSoan.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') ev.preventDefault(); });
    oSoan.addEventListener('paste', (ev) => {
      const dl = ev.clipboardData || window.clipboardData;
      if (!dl) return;
      ev.preventDefault();
      const dongDau = dl.getData('text/plain').split(/\r?\n/)[0] || '';
      document.execCommand('insertText', false, dongDau);
    });
  }

  // ---- Theo dõi vùng bôi đen: bấm nút công cụ (mất tiêu điểm khỏi ô soạn) không được làm mất
  // vùng đang chọn — ghi nhớ lại vị trí mỗi khi có thay đổi/di chuyển con trỏ THẬT trong ô, rồi
  // khôi phục đúng vị trí đó trước khi thực thi lệnh định dạng.
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

  // mousedown + preventDefault trên MỌI nút công cụ: giữ nguyên vùng bôi đen đang hiện (màu
  // xanh) trên màn hình khi bấm, không bị "nhảy mất" rồi lại khôi phục ngầm — mượt hơn hẳn.
  function nutCongCu(chu, tieuDe, khiBam, kieuChu) {
    const b = e('button', 'nut-soan', chu);
    b.type = 'button';
    b.title = tieuDe;
    if (kieuChu) b.style.cssText = kieuChu;
    b.addEventListener('mousedown', (ev) => ev.preventDefault());
    b.addEventListener('click', khiBam);
    return b;
  }

  const nutDam = nutCongCu('B', 'In đậm', () => khoiPhucVaChay(() => document.execCommand('bold')), 'font-weight:800;');
  const nutNghieng = nutCongCu('I', 'In nghiêng', () => khoiPhucVaChay(() => document.execCommand('italic')), 'font-style:italic;');

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
    nutMau.addEventListener('mousedown', (ev) => ev.preventDefault());
    nutMau.addEventListener('click', () => khoiPhucVaChay(() => apDungKieuChoVungChon('color', mau)));
    dayMau.append(nutMau);
  });

  const nutEmoji = nutChonEmoji((ky) => khoiPhucVaChay(() => document.execCommand('insertText', false, ky)));

  const thanhCongCu = e('div', 'thanh-soan-thao');
  thanhCongCu.append(nutDam, nutNghieng, oFont, oCoChu, dayMau, nutEmoji);

  const khung = e('div');
  khung.append(thanhCongCu, oSoan);

  return {
    khung,
    oSoan,
    layHtml: () => locHtmlNoiDung(oSoan.innerHTML, nhieuDong ? 4000 : 300),
    layVanBanThuong: () => oSoan.textContent.trim(),
    dat(html) { oSoan.innerHTML = locHtmlNoiDung(html || '', nhieuDong ? 4000 : 300); },
  };
}
