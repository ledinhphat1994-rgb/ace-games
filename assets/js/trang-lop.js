/* Trang lớp — học sinh xem. Toàn bộ dữ liệu lấy từ /api/lop.

   Trang chủ chỉ để bốn mục: sĩ số lớp, thông báo (đảm nhiệm luôn vai trò của "kế hoạch năm
   học" cũ qua mức độ quan trọng), thời khoá biểu, hình ảnh.
   Danh sách lớp và Thủ quỹ là hai "trang riêng" mở từ menu — cùng một tệp HTML,
   chỉ ẩn/hiện theo địa chỉ #/… nên không cần thêm trang mới và không cần tải lại. */
import { $, e, datNoiDung, api, homNay, ngayVN, ngayDayDu, tienVN, ganDoiGiaoDien, ganMenu, khoiLoi, layNhanTaiKhoan, nhac, ganNhacNen, nhanMucDo, CAC_LOAI_CHI, ganTooltipNoi, giuViTriCuonKhiVe } from './chung.js';
import { nut, moHopThoai, dongHopThoai, boiNgayVN, oThongKe } from './giao-dien.js';
import { moHopThoaiSoanThongBao } from './thong-bao-dialog.js';
import { moHopThoaiBannerLop } from './lop-banner-dialog.js';
import { moHopThoaiThemHoatDong } from './hoat-dong-lop-dialog.js';
import { locHtmlNoiDung } from './html-an-toan.js';

ganDoiGiaoDien($('#doiGiaoDien'));

/* ---------- Menu ---------- */
ganMenu();

/* ---------- Trang riêng mở từ menu ---------- */
const TRANG_PHU = {
  '#/danh-sach': '#trangDanhSach',
  '#/thu-quy': '#trangThuQuy',
  '#/diem-danh': '#trangDiemDanh',
};
// Trang riêng nào ứng với một mục có thể bị giáo viên ẩn riêng cho từng mã (xem CHO_MUC_AN +
// apDungAnMuc bên dưới) — dùng để CHẶN THẬT việc mở lại trang qua địa chỉ trực tiếp/nút Back/
// đánh dấu trang, không chỉ ẩn mục khỏi menu. Trước đây dinhTuyen() không biết gì về anMuc nên
// bấm thẳng vào #/thu-quy hay #/diem-danh vẫn mở lại được dù đã ẩn.
const TRANG_PHU_MUC = { '#/thu-quy': 'quy', '#/diem-danh': 'diem-danh' };
let anMucHienTai = new Set();

/* Mỏ neo hợp lệ: #thong-bao, #thoi-khoa-bieu… (không phải địa chỉ trang riêng #/…) */
function laMoNeo(hash) {
  return /^#[a-z][\w-]*$/i.test(hash);
}

function dinhTuyen() {
  const hash = location.hash;
  let trangCanHien = TRANG_PHU[hash] || null;
  if (trangCanHien && TRANG_PHU_MUC[hash] && anMucHienTai.has(TRANG_PHU_MUC[hash])) {
    trangCanHien = null;
    history.replaceState(null, '', location.pathname + location.search);
  }

  // Ẩn hết rồi mới hiện đúng một trang — không bao giờ để hai trang cùng hiện.
  $('#trangChu').hidden = Boolean(trangCanHien);
  Object.values(TRANG_PHU).forEach((chon) => { $(chon).hidden = chon !== trangCanHien; });

  document.querySelectorAll('.menu-muc').forEach((a) => {
    a.classList.toggle('dang-xem', a.getAttribute('href') === hash);
  });

  if (trangCanHien) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (hash === '#/diem-danh') {
      taiVaVeDiemDanh();
    }
    return;
  }

  // Về trang chủ: nếu địa chỉ là mỏ neo của một mục thì cuộn tới mục đó.
  // behavior: 'instant' — 'smooth' từng bị treo im re (không cuộn) ở một số trình duyệt khi
  // gọi ngay sau lúc vừa đổi hash, cùng lỗi đã gặp ở băng điểm nhấn bên dưới.
  if (laMoNeo(hash)) {
    const muc = document.querySelector(hash);
    if (muc) muc.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
}

window.addEventListener('hashchange', dinhTuyen);

/* ---------- Đánh dấu mục đang xem trên thanh menu ngang ----------
   KHÔNG dùng IntersectionObserver với rootMargin co hẹp nữa — mục "Hình ảnh" khi
   chưa có ảnh (hoặc bất kỳ mục nào thấp hơn vùng quan sát) không bao giờ lọt vào
   dải đang xét, nên bấm vào tab đó vẫn cứ sáng nhầm tab kế bên. Thay bằng cách tính
   trực tiếp theo vị trí cuộn: mục ĐANG XEM là mục thấp nhất mà đỉnh của nó đã vượt
   qua mép dưới thanh menu — luôn đúng bất kể mục đó cao hay thấp, dài hay ngắn. */
function ganTheoDoiMuc() {
  const lienKet = [...document.querySelectorAll('.menu a[href^="#"]')]
    .filter((a) => laMoNeo(a.getAttribute('href')));
  const muc = lienKet
    .map((a) => ({ a, phanTu: document.querySelector(a.getAttribute('href')) }))
    .filter((x) => x.phanTu);
  if (!muc.length) return;

  const thanh = $('.thanh-tren');
  let dangCho = false;

  function capNhat() {
    dangCho = false;
    const nguong = (thanh ? thanh.getBoundingClientRect().bottom : 0) + 4;
    const cuoiTrang = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 2;

    let hienTai = muc[0];
    for (const x of muc) {
      if (x.phanTu.getBoundingClientRect().top <= nguong) hienTai = x;
    }
    if (cuoiTrang) hienTai = muc[muc.length - 1];

    lienKet.forEach((a) => a.classList.toggle('dang-xem', a === hienTai.a));
  }

  function xepLichCapNhat() {
    if (dangCho) return;
    dangCho = true;
    requestAnimationFrame(capNhat);
  }

  window.addEventListener('scroll', xepLichCapNhat, { passive: true });
  window.addEventListener('resize', xepLichCapNhat);
  capNhat();
}

/* ---------- Vẽ từng phần ---------- */

function veOSo(thongKe) {
  datNoiDung($('#oSo'), ...thongKe.map((t) => {
    const o = e('div');
    o.append(e('b', null, t.giaTri), e('span', null, t.nhan));
    return o;
  }));
}

/** Link YouTube (watch/shorts/live/embed/youtu.be) -> mã video 11 ký tự, hoặc null nếu không nhận ra. */
function idYoutube(url) {
  if (!url) return null;
  const s = String(url).trim();
  let m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts|live|embed)\/)([\w-]{11})/i);
  if (m) return m[1];
  m = s.match(/youtube\.com\/watch\?[^#]*[?&]v=([\w-]{11})/i);
  if (m) return m[1];
  m = s.match(/[?&]v=([\w-]{11})/i);
  if (m) return m[1];
  return null;
}

/** Link Google Drive video -> file ID hoặc null. */
function idGoogleDrive(url) {
  if (!url) return null;
  const m = String(url).trim().match(/drive\.google\.com\/(?:file\/d\/|(?:open|uc)\?id=)([\w-]+)/i);
  return m ? m[1] : null;
}

/** Xử lý link hình ảnh: hỗ trợ cả kho R2, link mạng trực tiếp, và link chia sẻ Google Drive */
function xuLyLinkHinh(khoa) {
  if (!khoa) return '';
  if (/^https?:\/\//i.test(khoa)) {
    const mDrive = khoa.match(/drive\.google\.com\/(?:file\/d\/|(?:open|uc)\?id=)([\w-]+)/i);
    if (mDrive) return 'https://lh3.googleusercontent.com/d/' + mDrive[1];
    return khoa;
  }
  return '/api/anh?khoa=' + encodeURIComponent(khoa);
}

/** Xử lý link âm thanh: hỗ trợ cả kho R2, link mạng trực tiếp, và link chia sẻ Google Drive */
function xuLyLinkNhac(khoa, id) {
  if (!khoa) return '';
  if (/^https?:\/\//i.test(khoa)) {
    const mDrive = khoa.match(/drive\.google\.com\/(?:file\/d\/|(?:open|uc)\?id=)([\w-]+)/i);
    if (mDrive) return 'https://drive.google.com/uc?export=download&id=' + mDrive[1];
    return khoa;
  }
  return '/api/thong-bao-nhac?id=' + encodeURIComponent(id);
}

/** Link video trực tiếp (.mp4, .webm, .mov, .ogg) */
function laVideoTrucTiep(url) {
  return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(String(url || '').trim());
}

/** Hình/nhạc/video đính kèm một thông báo — trả về mảng phần tử để nối vào cuối thẻ tin. */
function veDinhKemTin(t) {
  const ds = [];
  if (t.hinhKhoa) {
    const img = e('img', 'tin-hinh');
    img.src = xuLyLinkHinh(t.hinhKhoa);
    img.alt = t.tieuDe || '';
    img.loading = 'lazy';
    img.onerror = () => { img.style.display = 'none'; };
    ds.push(img);
  }
  if (t.nhacKhoa) {
    const audio = e('audio');
    audio.controls = true;
    audio.preload = 'none';
    audio.src = xuLyLinkNhac(t.nhacKhoa, t.id);
    audio.className = 'tin-nhac';
    ds.push(audio);
  }
  if (t.videoKhoa) {
    const boc = e('div', 'tin-video');
    const vid = e('video');
    vid.controls = true;
    vid.playsInline = true;
    vid.preload = 'metadata';
    vid.src = '/api/thong-bao-video?id=' + encodeURIComponent(t.id);
    boc.append(vid);
    ds.push(boc);
  } else if (t.videoUrl) {
    const maYt = idYoutube(t.videoUrl);
    const maDrive = idGoogleDrive(t.videoUrl);
    if (maYt) {
      const boc = e('div', 'tin-video');
      const khung = e('iframe');
      khung.src = 'https://www.youtube.com/embed/' + maYt;
      khung.title = t.tieuDe || 'Video YouTube';
      khung.loading = 'lazy';
      khung.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      khung.allowFullscreen = true;
      khung.referrerPolicy = 'strict-origin-when-cross-origin';
      khung.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      boc.append(khung);

      const lienKetYt = e('div', 'tin-video-duoi');
      lienKetYt.style.cssText = 'margin-top:6px;font-size:12.5px;display:flex;align-items:center;justify-content:space-between;gap:8px';
      const aYt = e('a', '', '↗ Mở xem trực tiếp trên YouTube');
      aYt.href = 'https://www.youtube.com/watch?v=' + maYt;
      aYt.target = '_blank';
      aYt.rel = 'noopener noreferrer';
      aYt.style.cssText = 'color:var(--mau-chinh);text-decoration:none;font-weight:600';
      lienKetYt.append(e('span', 'nhan nhan-xam', '🎬 YouTube'), aYt);

      ds.push(boc, lienKetYt);
    } else if (maDrive) {
      const boc = e('div', 'tin-video');
      const khung = e('iframe');
      khung.src = 'https://drive.google.com/file/d/' + maDrive + '/preview';
      khung.title = t.tieuDe || 'Video Google Drive';
      khung.loading = 'lazy';
      khung.allow = 'autoplay; fullscreen';
      khung.allowFullscreen = true;
      khung.referrerPolicy = 'strict-origin-when-cross-origin';
      khung.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      boc.append(khung);

      const lienKetGg = e('div', 'tin-video-duoi');
      lienKetGg.style.cssText = 'margin-top:6px;font-size:12.5px;display:flex;align-items:center;justify-content:space-between;gap:8px';
      const aGg = e('a', '', '↗ Mở xem trên Google Drive');
      aGg.href = 'https://drive.google.com/file/d/' + maDrive + '/view';
      aGg.target = '_blank';
      aGg.rel = 'noopener noreferrer';
      aGg.style.cssText = 'color:var(--mau-chinh);text-decoration:none;font-weight:600';
      lienKetGg.append(e('span', 'nhan nhan-xam', '📁 Google Drive'), aGg);

      ds.push(boc, lienKetGg);
    } else if (laVideoTrucTiep(t.videoUrl)) {
      const boc = e('div', 'tin-video');
      const vid = e('video');
      vid.controls = true;
      vid.playsInline = true;
      vid.preload = 'metadata';
      vid.src = t.videoUrl;
      boc.append(vid);
      ds.push(boc);
    } else if (/facebook\.com|fb\.watch/i.test(t.videoUrl)) {
      const boc = e('div', 'tin-video');
      const khung = e('iframe');
      khung.src = 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(t.videoUrl) + '&show_text=0';
      khung.title = t.tieuDe || 'Video Facebook';
      khung.loading = 'lazy';
      khung.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
      khung.allowFullscreen = true;
      khung.referrerPolicy = 'strict-origin-when-cross-origin';
      khung.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      boc.append(khung);
      ds.push(boc);
    } else {
      const a = e('a', 'nut nut-vien nut-nho tin-video-lien-ket', '🎬 Xem video');
      a.href = t.videoUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      ds.push(a);
    }
  }
  return ds;
}

function veThongBao(ds, phien, lamMoi) {
  const hop = $('#dsThongBao');
  if (!ds.length) return datNoiDung(hop, e('p', 'trong', 'Chưa có thông báo nào.'));

  const duocPhep = phien && (phien.role === 'teacher' || (phien.quyen || []).includes('thong-bao'));

  datNoiDung(hop, ...ds.map((t) => {
    const bai = e('article', 'tin' + (t.ghim ? ' tin-ghim' : ''));
    bai.id = 'tin-' + t.id;
    const dau = e('div', 'tin-dau');
    dau.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap';

    const thongTin = e('div');
    thongTin.style.cssText = 'display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap';
    const mucDo = nhanMucDo(t.mucDo);
    if (mucDo) thongTin.append(e('span', 'nhan ' + mucDo.lop, mucDo.ten));
    if (t.ghim) thongTin.append(e('span', 'nhan nhan-xam', '📌 Ghim'));
    if (t.loai) thongTin.append(e('span', 'nhan nhan-xam', t.loai));
    if (duocPhep && t.noiBat) thongTin.append(e('span', 'nhan nhan-noi-bat', '★ Đang ở băng điểm nhấn'));
    thongTin.append(e('span', null, ngayDayDu(t.ngay)));
    dau.append(thongTin);

    if (duocPhep) {
      const thaoTac = e('div', 'thao-tac-tin');
      thaoTac.style.cssText = 'margin-left:auto;display:inline-flex;gap:6px';
      thaoTac.append(
        nut('✏ Sửa', 'nut-nhe nut-nho', () => moHopThoaiSuaThongBao(t, lamMoi)),
        nut('🗑 Xoá', 'nut-nhe nut-nho', () => moHopThoaiXoaThongBao(t, lamMoi))
      );
      dau.append(thaoTac);
    }

    const h3 = e('h3');
    if (t.tieuDeHtml) h3.innerHTML = locHtmlNoiDung(t.tieuDeHtml);
    else h3.textContent = t.tieuDe;
    const pNd = e('p');
    if (t.noiDungHtml) pNd.innerHTML = locHtmlNoiDung(t.noiDungHtml);
    else pNd.textContent = t.noiDung;

    bai.append(dau, h3, pNd, ...veDinhKemTin(t));
    return bai;
  }));
}

function veDanhSach(ds, anMucHs) {
  const than = $('#bangHocSinh');
  const boAn = new Set(anMucHs || []);
  document.querySelectorAll('#trangDanhSach thead [data-cot]').forEach((th) => {
    th.hidden = boAn.has(th.dataset.cot);
  });
  const nam = ds.filter((h) => h.gioiTinh === 'Nam').length;
  const tomTat = `${ds.length} học sinh · ${nam} nam · ${ds.length - nam} nữ`;
  $('#soLuongHs').textContent = tomTat;
  $('#menuSoHs').textContent = tomTat;

  const cacNghe = [...new Set(ds.map((h) => h.lopNghe).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
  let nghe = '';
  let tim = '';

  function veLoc() {
    const hop = $('#locNghe');
    datNoiDung(hop, ...[['', `Tất cả (${ds.length})`],
      ...cacNghe.map((n) => [n, `${n} (${ds.filter((h) => h.lopNghe === n).length})`])]
      .map(([giaTri, nhan]) => {
        const b = e('button', 'vien-loc', nhan);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(nghe === giaTri));
        b.addEventListener('click', () => { nghe = giaTri; veLoc(); ve(); });
        return b;
      }));
  }

  function ve() {
    const q = tim.trim().toLowerCase();
    const hang = ds.filter((h) => {
      if (nghe && h.lopNghe !== nghe) return false;
      if (!q) return true;
      return ['hoTen', 'lopNghe', 'toHop', 'chucVu'].some((k) => String(h[k] || '').toLowerCase().includes(q));
    });

    if (!hang.length) {
      const tr = e('tr');
      tr.append(Object.assign(e('td', 'trong', 'Không tìm thấy học sinh phù hợp.'), { colSpan: 9 }));
      return datNoiDung(than, tr);
    }

    datNoiDung(than, ...hang.map((h) => {
      const tr = e('tr');
      const tdNghe = e('td');
      tdNghe.dataset.cot = 'lop-nghe';
      if (h.lopNghe) tdNghe.append(e('span', 'nhan nhan-xam', h.lopNghe));
      const tdChuc = e('td');
      tdChuc.dataset.cot = 'chuc-vu';
      if (h.chucVu) tdChuc.append(e('span', 'nhan nhan-tot', h.chucVu));

      const tdGt = e('td');
      tdGt.dataset.cot = 'gioi-tinh';
      if (h.gioiTinh) {
        tdGt.append(e('span', 'nhan-gt ' + (h.gioiTinh === 'Nam' ? 'gt-nam' : 'gt-nu'), h.gioiTinh));
      }

      const tdNgaySinh = e('td', null, ngayVN(h.ngaySinh));
      tdNgaySinh.dataset.cot = 'ngay-sinh';
      const tdToHop = e('td', null, h.toHop || '');
      tdToHop.dataset.cot = 'to-hop';

      const tdTo = e('td');
      tdTo.dataset.cot = 'to-so';
      if (h.toSo) {
        tdTo.append(e('span', 'nhan-to', 'Tổ ' + h.toSo));
      }

      // "dienThoaiHs" chỉ có mặt trong dữ liệu khi giáo viên đang BẬT công khai (xem
      // functions/api/lop.js) — server đã xoá hẳn khoá này khỏi phản hồi khi đang ẩn, nên ở đây
      // chỉ cần kiểm tra "có" hay "không", không cần tự ẩn thêm lần nữa.
      const tdDienThoai = e('td', 'trong', h.dienThoaiHs || '');
      tdDienThoai.dataset.cot = 'dien-thoai-hs';

      [tdGt, tdNgaySinh, tdNghe, tdToHop, tdTo, tdChuc, tdDienThoai].forEach((td) => { td.hidden = boAn.has(td.dataset.cot); });

      tr.append(
        e('td', 'so', h.stt),
        e('td', null, h.hoTen),
        tdGt,
        tdNgaySinh,
        tdNghe,
        tdToHop,
        tdTo,
        tdChuc,
        tdDienThoai
      );
      return tr;
    }));
  }

  veLoc();
  ve();
  $('#oTim').addEventListener('input', (ev) => { tim = ev.target.value; ve(); });
}

const CAC_BUOI_TKB = [['sang', 'Buổi sáng'], ['chieu', 'Buổi chiều']];

function veThoiKhoaBieu(thoiKhoaBieu) {
  const phienBan = thoiKhoaBieu?.phienBan;
  const o = thoiKhoaBieu?.o || [];
  const cacThu = [2, 3, 4, 5, 6, 7];

  /* Thứ trong JS: 0 là Chủ nhật. Thời khoá biểu đánh số 2..7, nên cộng 1. */
  const thuHomNay = new Date().getDay();
  const soThuTkb = thuHomNay === 0 ? null : thuHomNay + 1;
  const soTietHomNay = soThuTkb ? o.filter((t) => t.thu === soThuTkb).length : 0;

  // Tên phiên bản (vd "Thời khoá biểu HK1 (từ 07/09/2026)") thường đã ghi sẵn ngày áp dụng —
  // không lặp lại "áp dụng từ ..." nữa kẻo dư thừa, chỉ ghi ngày riêng khi phiên bản CHƯA có tên.
  const dong = [];
  if (phienBan?.ten) dong.push(phienBan.ten);
  else if (phienBan) dong.push(`áp dụng từ ${ngayVN(phienBan.ngayBatDau)}`);
  else dong.push('chưa cập nhật thời khoá biểu');
  if (o.length) dong.push(soThuTkb ? `Hôm nay có ${soTietHomNay} tiết` : 'Hôm nay Chủ nhật — nghỉ');
  $('#tkbApDung').textContent = dong.join(' · ');
  const oGhiChuTkb = $('#tkbGhiChu');
  if (oGhiChuTkb) {
    oGhiChuTkb.textContent = phienBan?.ghiChu ? 'Ghi chú: ' + phienBan.ghiChu : '';
    oGhiChuTkb.hidden = !phienBan?.ghiChu;
  }

  if (!o.length) {
    datNoiDung($('#tkbTabBuoi'));
    datNoiDung($('#dauTkb'));
    const tr = e('tr');
    tr.append(Object.assign(e('td', 'trong', 'Chưa cập nhật thời khoá biểu.'), { colSpan: 7 }));
    return datNoiDung($('#thanTkb'), tr);
  }

  const cacBuoiCo = CAC_BUOI_TKB.filter(([ma]) => o.some((x) => x.buoi === ma));
  let buoiDangXem = cacBuoiCo[0]?.[0] || 'sang';

  function veBang() {
    const dau = $('#dauTkb');
    const than = $('#thanTkb');

    const hangDau = e('tr');
    hangDau.append(e('th', null, 'Tiết'), ...cacThu.map((t) => {
      const laHomNay = t === soThuTkb;
      const th = e('th', laHomNay ? 'cot-hom-nay' : null, t === 7 ? 'Thứ 7' : 'Thứ ' + t);
      if (laHomNay) th.append(e('span', 'nhan-hom-nay', 'Hôm nay'));
      return th;
    }));
    datNoiDung(dau, hangDau);

    const oBuoi = o.filter((x) => x.buoi === buoiDangXem);
    if (!oBuoi.length) {
      const tr = e('tr');
      tr.append(Object.assign(e('td', 'trong', 'Buổi này không có tiết học.'), { colSpan: 7 }));
      return datNoiDung(than, tr);
    }

    const soTiet = Math.max(...oBuoi.map((t) => t.tiet));
    const bang = {};
    oBuoi.forEach((t) => { bang[`${t.thu}-${t.tiet}`] = t.mon; });

    const hang = [];
    for (let i = 1; i <= soTiet; i++) {
      const tr = e('tr');
      tr.append(Object.assign(e('td', null, 'Tiết ' + i), { style: 'font-weight:700;color:var(--chinh);white-space:nowrap' }));
      cacThu.forEach((t) => {
        const laHomNay = t === soThuTkb;
        tr.append(e('td', laHomNay ? 'cot-hom-nay' : null, bang[`${t}-${i}`] || '—'));
      });
      hang.push(tr);
    }
    datNoiDung(than, ...hang);
  }

  const hopTab = $('#tkbTabBuoi');
  if (cacBuoiCo.length > 1) {
    const veTab = () => {
      datNoiDung(hopTab, ...cacBuoiCo.map(([ma, ten]) => {
        const b = e('button', 'vien-loc', ten);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(buoiDangXem === ma));
        b.addEventListener('click', () => { buoiDangXem = ma; veTab(); veBang(); });
        return b;
      }));
    };
    veTab();
  } else if (cacBuoiCo.length === 1) {
    // Chỉ có đúng một buổi thì không cần nút chọn (không có gì để chuyển qua lại), nhưng vẫn
    // phải ghi rõ đó là buổi nào — không thì học sinh nhìn bảng không biết đây là lịch buổi
    // sáng hay buổi chiều của lớp mình. Vẫn tô "sáng" (kiểu như tab đang chọn) dù không bấm
    // được, để nhất quán với kiểu hiển thị khi lớp có 2 buổi.
    const nhan = e('span', 'vien-loc', cacBuoiCo[0][1]);
    nhan.setAttribute('aria-pressed', 'true');
    nhan.style.cursor = 'default';
    datNoiDung(hopTab, nhan);
  } else {
    datNoiDung(hopTab);
  }

  veBang();
}

/* ---------- Quản lý thông báo trực tiếp trên trang chủ ----------
   Dùng chung hộp thoại soạn/sửa với khu quản lý (xem thong-bao-dialog.js) — cùng một tính
   năng thao tác từ hai nơi thì phải giống hệt nhau, không lệch tính năng. */
function moHopThoaiThemThongBao(lamMoi) {
  moHopThoaiSoanThongBao(null, lamMoi);
}

function moHopThoaiSuaThongBao(tb, lamMoi) {
  moHopThoaiSoanThongBao(tb, lamMoi);
}

function moHopThoaiXoaThongBao(tb, lamMoi) {
  moHopThoai('Xoá thông báo', [
    e('p', null, `Bạn có chắc muốn xoá thông báo "${tb.tieuDe}" không? Thao tác này không thể hoàn tác.`),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Xoá thông báo', 'nut-xau', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/thong-bao?id=' + tb.id, { method: 'DELETE' });
        dongHopThoai();
        nhac('Đã xoá thông báo', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

/* ---------- Băng điểm nhấn: tự trôi ngang liên tục, gộp các thông báo được đánh dấu "nổi bật" ----------
   Không thêm dữ liệu mới — chỉ chọn lọc lại từ thông báo đã có sẵn, dựa vào cờ RIÊNG "noiBat"
   (giáo viên tự tích chọn khi soạn/sửa), TÁCH BIỆT với "ghim" (đẩy lên đầu danh sách Thông báo).
   Nhãn và màu của mỗi thẻ lấy theo "mucDo" (mức độ quan trọng) — xem nhanMucDo() trong chung.js,
   dùng chung với nhãn màu hiện ở danh sách Thông báo bên dưới, cho học sinh quen mắt một màu là
   một mức. Ẩn hẳn khối này nếu không có gì đáng nổi bật, không để trống rỗng.

   Cách "tự trôi" khác cuộn thường: danh sách thẻ được LẶP 2 LẦN nối liền nhau, rồi dịch chuyển bằng
   transform mỗi khung hình; khi trôi hết đúng MỘT vòng (nửa tổng chiều rộng) thì cộng lại y hệt bước
   đó — mắt thường không thấy chỗ nối, nên trôi được vô tận dù chỉ có vài thẻ (khác cách cuộn cũ, chỉ
   chạy được khi nội dung dài hơn khung nhìn). Muốn tự tay xem thì kéo chuột/vuốt tay — animation tự
   dừng khi đang kéo và khi rê chuột vào, chạy lại khi thả ra. Bấm vào thẻ (không kéo) sẽ mở đúng
   mục thông báo đó, cuộn tới và tô sáng tạm thời để dễ nhận ra. */
function veDiemNhan(thongBao) {
  const khoi = $('#bangDiemNhan');
  const cuon = $('#dnCuon');
  const track = $('#dnTrack');

  const cacTin = (thongBao || []).filter((t) => t.noiBat).map((t) => {
    const mucDo = nhanMucDo(t.mucDo);
    return {
      nhan: mucDo ? mucDo.ten : 'Thông báo', lop: mucDo ? mucDo.lop : '',
      tieuDe: t.tieuDe, phu: ngayDayDu(t.ngay), href: '#tin-' + t.id,
    };
  }).slice(0, 10);
  if (!cacTin.length) { khoi.hidden = true; return; }
  khoi.hidden = false;

  const moDich = (href) => {
    const dich = document.querySelector(href);
    if (!dich) return;
    // behavior: 'instant' — 'smooth' bị treo im re (bấm vào không cuộn tới đâu cả) trên một số
    // trình duyệt/thiết bị, đúng lỗi người dùng báo "băng điểm nhấn không chạy".
    dich.scrollIntoView({ behavior: 'instant', block: 'center' });
    dich.classList.add('dich-noi-bat');
    setTimeout(() => dich.classList.remove('dich-noi-bat'), 2200);
  };

  const taoThe = (t) => {
    // KHÔNG dùng thẻ <a> — trình duyệt tự khởi động thao tác "kéo link" ngay khi vừa nhấn chuột
    // xuống, chặn mất sự kiện pointermove nên không thể kéo-xem bằng chuột được. Dùng <button> và
    // tự điều hướng bằng JS để vừa kéo được vừa bấm mở được, phân biệt rõ bằng cờ "daKeoThat".
    const a = e('button', 'dn-the');
    a.type = 'button';
    const lopMau = t.lop ? ' dn-nhan-' + t.lop.replace('nhan-', '') : '';
    a.append(e('span', 'dn-nhan' + lopMau, t.nhan), e('h3', null, t.tieuDe), e('p', null, t.phu));
    a.addEventListener('click', () => moDich(t.href));
    return a;
  };
  // Lặp 2 lần để trôi vòng lặp liền mạch — chỉ 1 lần thì sẽ có khoảng trống lộ ra khi dịch tới nửa sau.
  datNoiDung(track, ...cacTin.map(taoThe), ...cacTin.map(taoThe));

  if (khoi.dataset.daGanCuon) return;   // chỉ gắn sự kiện một lần dù dữ liệu tải lại nhiều lần
  khoi.dataset.daGanCuon = '1';

  const giamChuyenDong = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let offset = 0;          // px, luôn <= 0 (trôi sang trái)
  let dangTamDung = false; // rê chuột vào / đang kéo
  let dangKeo = false;
  let xBatDauKeo = 0;
  let offsetBatDauKeo = 0;
  let daKeoThat = false;   // phân biệt "kéo" thật với "bấm" để không chặn nhầm việc bấm vào thẻ

  function motVong() { return track.scrollWidth / 2 || 1; }

  function chay() {
    if (!giamChuyenDong && !dangTamDung && !dangKeo) {
      offset -= 0.6;
      const vong = motVong();
      if (-offset >= vong) offset += vong;
      track.style.transform = `translateX(${offset}px)`;
    }
    requestAnimationFrame(chay);
  }

  function nhichMotThe(chieu) {
    const the = track.querySelector('.dn-the');
    const rong = (the ? the.offsetWidth : 300) + 14;
    offset -= chieu * rong;
    const vong = motVong();
    if (offset > 0) offset -= vong;
    if (-offset >= vong) offset += vong;
    track.style.transition = 'transform .35s ease';
    track.style.transform = `translateX(${offset}px)`;
    setTimeout(() => { track.style.transition = ''; }, 360);
  }

  khoi.addEventListener('mouseenter', () => { dangTamDung = true; });
  khoi.addEventListener('mouseleave', () => { dangTamDung = false; });

  // Kéo bằng chuột/ngón tay để chủ động xem — dùng Pointer Events, gộp chung chuột và cảm ứng.
  // CHỈ setPointerCapture SAU KHI đã xác nhận là kéo thật (vượt ngưỡng 4px) — bắt giữ con trỏ
  // ngay từ pointerdown khiến trình duyệt coi luôn cuon là đích của sự kiện "click" đi kèm ngay
  // sau đó (dù không hề rê chuột), nên bấm thẳng vào thẻ để mở mục không bao giờ hoạt động được.
  cuon.addEventListener('pointerdown', (ev) => {
    dangKeo = true; daKeoThat = false;
    xBatDauKeo = ev.clientX; offsetBatDauKeo = offset;
  });
  cuon.addEventListener('pointermove', (ev) => {
    if (!dangKeo) return;
    const delta = ev.clientX - xBatDauKeo;
    if (!daKeoThat && Math.abs(delta) > 4) {
      daKeoThat = true;
      cuon.classList.add('dang-keo');
      cuon.setPointerCapture(ev.pointerId);
    }
    if (!daKeoThat) return;
    offset = offsetBatDauKeo + delta;
    track.style.transform = `translateX(${offset}px)`;
    ev.preventDefault();
  });
  function ketThucKeo(ev) {
    if (!dangKeo) return;
    dangKeo = false;
    cuon.classList.remove('dang-keo');
    if (ev && cuon.hasPointerCapture(ev.pointerId)) cuon.releasePointerCapture(ev.pointerId);
    const vong = motVong();
    while (offset > 0) offset -= vong;
    while (-offset >= vong) offset += vong;
  }
  cuon.addEventListener('pointerup', ketThucKeo);
  cuon.addEventListener('pointercancel', ketThucKeo);
  // Vừa kéo xong thì chặn đúng 1 lần click kế tiếp, tránh mở nhầm mục khi người dùng chỉ định kéo xem.
  cuon.addEventListener('click', (ev) => {
    if (daKeoThat) { ev.preventDefault(); ev.stopPropagation(); daKeoThat = false; }
  }, true);

  $('#dnTrai').addEventListener('click', () => nhichMotThe(-1));
  $('#dnPhai').addEventListener('click', () => nhichMotThe(1));

  requestAnimationFrame(chay);
}

/* ---------- Thủ quỹ (công khai: tổng quan & chi tiết đóng tiền từng em) ---------- */
function veThuQuy(tq, dsHocSinh = [], phien = null, hocSinhAnMuc = []) {
  // Cùng nguyên tắc như bảng Điểm danh cả lớp: "Lớp nghề" hiện cạnh tên học sinh ở đây (danh
  // sách đã đóng/chưa đóng) phải theo đúng cấu hình "Học sinh > Tuỳ chỉnh hiển thị", không tự
  // hiện riêng một kiểu khác với Danh sách lớp/Điểm danh.
  const hienNgheThuQuy = !(hocSinhAnMuc || []).includes('lop-nghe');
  const oTongQuan = $('#tqTongQuan');
  datNoiDung(oTongQuan,
    (() => { const o = e('div', 'o-thong-ke tot'); o.append(e('div', 'con-so', tienVN(tq.tonQuy)), e('div', 'ten', 'Tồn quỹ hiện tại')); return o; })(),
    (() => { const o = e('div', 'o-thong-ke'); o.append(e('div', 'con-so', tienVN(tq.tongThu)), e('div', 'ten', 'Tổng đã thu')); return o; })(),
    (() => { const o = e('div', 'o-thong-ke luuy'); o.append(e('div', 'con-so', tienVN(tq.tongChi)), e('div', 'ten', 'Tổng đã chi')); return o; })()
  );

  const hop = $('#tqKhoan');
  const dsKhoanGoc = tq.khoan || [];
  const dsChiGoc = tq.chi || [];

  if (!dsKhoanGoc.length && !dsChiGoc.length) {
    return datNoiDung(hop, e('p', 'trong', 'Chưa có dữ liệu thu chi nào.'));
  }

  let tabHienTai = 'thu'; // 'thu' | 'chi'

  // Thanh chuyển tab Thu / Chi
  const thanhTab = e('div', 'tab-chuyen-thu-chi');
  thanhTab.id = 'thu-quy-thanh-tab';
  const nutTabThu = e('button', 'nut-tab-thu-chi tab-thu', `📥 Các khoản thu (${dsKhoanGoc.length})`);
  nutTabThu.type = 'button';
  const nutTabChi = e('button', 'nut-tab-thu-chi tab-chi', `💸 Các khoản chi (${dsChiGoc.length})`);
  nutTabChi.type = 'button';

  thanhTab.append(nutTabThu, nutTabChi);

  const noiDungTab = e('div', 'noi-dung-tab-thu-chi');

  function capNhatTab() {
    nutTabThu.setAttribute('aria-pressed', String(tabHienTai === 'thu'));
    nutTabChi.setAttribute('aria-pressed', String(tabHienTai === 'chi'));
    if (tabHienTai === 'thu') {
      veKhuVucThu();
    } else {
      veKhuVucChi();
    }
  }

  nutTabThu.addEventListener('click', () => {
    if (tabHienTai !== 'thu') {
      giuViTriCuonKhiVe('thu-quy-thanh-tab', () => {
        tabHienTai = 'thu';
        capNhatTab();
      });
    }
  });

  nutTabChi.addEventListener('click', () => {
    if (tabHienTai !== 'chi') {
      giuViTriCuonKhiVe('thu-quy-thanh-tab', () => {
        tabHienTai = 'chi';
        capNhatTab();
      });
    }
  });

  // --- 1. KHU VỰC KHOẢN THU ---
  let locTrangThai = ''; // '' (tất cả) | 'dang_mo' | 'da_du' | 'da_dong'
  let timKhoan = '';
  let khoanDuocChonId = null;

  const soDangMo = dsKhoanGoc.filter((k) => k.dangMo && ((k.tongCanThu ? (k.tongDaThu / k.tongCanThu) * 100 : 0) < 100)).length;
  const soDaDu = dsKhoanGoc.filter((k) => k.tongCanThu && (k.tongDaThu >= k.tongCanThu)).length;
  const soDaDong = dsKhoanGoc.filter((k) => !k.dangMo).length;

  function veKhuVucThu() {
    if (!dsKhoanGoc.length) {
      return datNoiDung(noiDungTab, e('p', 'trong', 'Chưa có khoản thu nào được mở.'));
    }

    const khungBoc = e('div', 'khu-khoan-thu');

    // Thanh công cụ hợp nhất: Bộ lọc viên thuốc bên trái + Nhóm điều khiển bên phải
    const thanhCongCu = e('div', 'thanh-cong-cu-khoan');

    // 1. Bên trái: Bộ lọc dạng viên thuốc (Tất cả / Đang thu / Đã đủ / Đã đóng)
    const dayLoc = e('div', 'day-loc');
    const CAC_MUC_LOC = [
      ['', `Tất cả (${dsKhoanGoc.length})`],
      ['dang_mo', `Đang thu (${soDangMo})`],
      ['da_du', `Đã đủ 100% (${soDaDu})`],
    ];
    if (soDaDong > 0) {
      CAC_MUC_LOC.push(['da_dong', `Đã đóng (${soDaDong})`]);
    }

    // Tạo nút lọc DUY NHẤT MỘT LẦN — bấm chỉ đổi aria-pressed trên đúng các nút có sẵn (không
    // dựng lại từ đầu mỗi lần bấm), tránh giật/mất focus do nút vừa bấm bị xoá khỏi DOM ngay
    // giữa lúc xử lý sự kiện click của chính nó.
    let dsNutLoc = [];
    function capNhatNutLoc() {
      dsNutLoc.forEach((b) => {
        b.setAttribute('aria-pressed', String(locTrangThai === b.dataset.loc && !khoanDuocChonId));
      });
    }
    function veNutLoc() {
      dsNutLoc = CAC_MUC_LOC.map(([giaTri, nhan]) => {
        const b = e('button', 'vien-loc', nhan);
        b.type = 'button';
        b.dataset.loc = giaTri;
        b.addEventListener('click', () => {
          khoanDuocChonId = null;
          dropdown.value = '';
          locTrangThai = giaTri;
          capNhatNutLoc();
          veDanhSachKhoan();
        });
        return b;
      });
      capNhatNutLoc();
      datNoiDung(dayLoc, ...dsNutLoc);
    }
    veNutLoc();
    thanhCongCu.append(dayLoc);

    // 2. Bên phải: Nhóm điều khiển (Dropdown chọn nhanh + Ô tìm kiếm)
    const nhomDieuKhien = e('div', 'nhom-dieu-khien-khoan');

    const dropdown = e('select', 'dropdown-chon-khoan');
    dropdown.setAttribute('aria-label', 'Chọn nhanh khoản thu');
    const optMacDinh = e('option', null, `-- Chọn nhanh khoản thu (${dsKhoanGoc.length}) --`);
    optMacDinh.value = '';
    dropdown.append(optMacDinh);

    dsKhoanGoc.forEach((k) => {
      const laDinhKy = Boolean(k.dinhKyId) || /tuần|tháng|kỳ/i.test(k.ten);
      const kieuThu = laDinhKy ? '[Thu định kỳ]' : '[Thu linh động]';
      const opt = e('option', null, `${kieuThu} ${k.ten}`);
      opt.value = String(k.id);
      dropdown.append(opt);
    });

    const oTim = e('input', 'o-nhap o-tim-khoan');
    oTim.type = 'search';
    oTim.value = timKhoan;
    oTim.placeholder = 'Tìm khoản thu, tuần… hoặc tên học sinh';
    oTim.setAttribute('aria-label', 'Tìm kiếm khoản thu hoặc tên học sinh');

    dropdown.addEventListener('change', (ev) => {
      khoanDuocChonId = ev.target.value ? Number(ev.target.value) : null;
      if (khoanDuocChonId) {
        timKhoan = '';
        oTim.value = '';
      }
      veDanhSachKhoan();
    });

    oTim.addEventListener('input', (ev) => {
      timKhoan = ev.target.value.trim().toLowerCase();
      if (timKhoan) {
        khoanDuocChonId = null;
        dropdown.value = '';
      }
      veDanhSachKhoan();
    });

    nhomDieuKhien.append(dropdown, oTim);
    thanhCongCu.append(nhomDieuKhien);
    khungBoc.append(thanhCongCu);

    const dsTheKhoi = e('div', 'ds-the-khoan');
    khungBoc.append(dsTheKhoi);

    function veDanhSachKhoan() {
      // Tìm theo TÊN KHOẢN vẫn hoạt động như cũ. Nếu không khớp tên khoản nào nhưng khớp tên
      // một học sinh, chuyển sang "chế độ tìm theo học sinh": KHÔNG lọc bớt khoản nào cả (mọi
      // khoản thu đều áp dụng cho mọi em) — thay vào đó hiện đủ mọi khoản (đã đóng, chưa đóng,
      // đóng chưa đủ) và tự mở sẵn phần "Chi tiết đóng tiền" của từng khoản, lọc luôn theo đúng
      // tên vừa gõ, để xem ngay một em đã đóng/chưa đóng/thiếu ở khoản nào trong nháy mắt.
      const timTheoTenKhoan = timKhoan && dsKhoanGoc.some((k) => (k.ten || '').toLowerCase().includes(timKhoan));
      const timTheoTenHs = Boolean(timKhoan) && !timTheoTenKhoan
        && dsHocSinh.some((h) => (h.hoTen || '').toLowerCase().includes(timKhoan));

      let danhSachLoc;
      if (khoanDuocChonId) {
        danhSachLoc = dsKhoanGoc.filter((k) => k.id === khoanDuocChonId);
      } else {
        danhSachLoc = dsKhoanGoc.filter((k) => {
          const phanTram = k.tongCanThu ? Math.round((k.tongDaThu / k.tongCanThu) * 100) : 0;
          if (locTrangThai === 'dang_mo' && (!k.dangMo || phanTram >= 100)) return false;
          if (locTrangThai === 'da_du' && phanTram < 100) return false;
          if (locTrangThai === 'da_dong' && k.dangMo) return false;
          if (timKhoan && !timTheoTenHs) {
            const tenThuong = (k.ten || '').toLowerCase();
            if (!tenThuong.includes(timKhoan)) return false;
          }
          return true;
        });
      }

      const cacPhanTuThe = [];

      if (khoanDuocChonId && danhSachLoc.length > 0) {
        const thanhBao = e('div', 'thanh-loc-dang-chon');
        thanhBao.append(
          e('span', null, `🔍 Đang xem riêng: "${danhSachLoc[0].ten}"`),
          (() => {
            const nutHuy = e('button', 'nut-huy-loc', '✕ Xem tất cả');
            nutHuy.type = 'button';
            nutHuy.addEventListener('click', () => {
              khoanDuocChonId = null;
              dropdown.value = '';
              capNhatNutLoc();
              veDanhSachKhoan();
            });
            return nutHuy;
          })()
        );
        cacPhanTuThe.push(thanhBao);
      }

      if (!danhSachLoc.length) {
        return datNoiDung(dsTheKhoi, e('p', 'trong', 'Không có khoản thu nào phù hợp với bộ lọc.'));
      }

      danhSachLoc.forEach((k) => {
        const phanTram = k.tongCanThu ? Math.round((k.tongDaThu / k.tongCanThu) * 100) : 0;
        const conThieu = Math.max(0, (k.tongCanThu || 0) - (k.tongDaThu || 0));
        const laDinhKy = Boolean(k.dinhKyId) || /tuần|tháng|kỳ/i.test(k.ten);
        const matchTuan = /Tuần\s*(\d+)/i.exec(k.ten);

        // Tính sẵn "phần của bạn" TRƯỚC khi vẽ đầu thẻ — cần biết ngay từ đầu để hiện gọn ở góc
        // phải tiêu đề (badge nhỏ + tooltip), thay vì một dòng riêng chiếm chỗ như trước.
        const dsDongChiTiet = k.dongChiTiet || {};
        const dsHs = dsHocSinh || [];
        const hocSinhHienTaiId = phien?.hocSinhId || null;
        const danhSachHsVoiTrangThai = dsHs.map((hs) => {
          const id = hs.id || hs.stt;
          const sttHienThi = hs.soThuTu || hs.stt || hs.id;
          const thongTin = dsDongChiTiet[hs.id] || dsDongChiTiet[String(hs.id)] || dsDongChiTiet[hs.stt] || dsDongChiTiet[String(hs.stt)] || null;
          const daDong = thongTin ? thongTin.soTien : 0;
          const ngayDong = thongTin ? thongTin.ngay : '';
          const ghiChu = thongTin ? thongTin.ghiChu : '';
          const mucTieu = k.soTienMoiEm || 0;
          let tt = 'chua_dong';
          if (mucTieu > 0 && daDong >= mucTieu) {
            tt = 'da_du';
          } else if (daDong > 0) {
            tt = 'dong_mot_phan';
          }
          return {
            id, sttHienThi, hoTen: hs.hoTen, lopNghe: hs.lopNghe || '',
            daDong, ngayDong, ghiChu, trangThai: tt,
            laChinhMinh: Boolean(hocSinhHienTaiId && hocSinhHienTaiId === id),
          };
        });
        const banGhiCuaMinh = danhSachHsVoiTrangThai.find((x) => x.laChinhMinh);

        // Phân loại trạng thái — không còn badge chữ riêng ("Đang thu · X%"...) nữa, vì đã lặp
        // với % ở thanh tiến độ. Trạng thái giờ chỉ thể hiện qua icon + màu viền trái của thẻ,
        // còn số liệu chính xác (đã chạy bao nhiêu %, còn thiếu bao nhiêu) xem khi RÊ CHUỘT vào
        // thanh tiến độ (tooltip) — xem khối "tien-do-tooltip" bên dưới.
        let lopTrangThai = 'dang-thu';
        let icon = laDinhKy ? '📅' : '💰';

        if (!k.dangMo) {
          lopTrangThai = 'da-dong';
          icon = '📁';
        } else if (phanTram >= 100) {
          lopTrangThai = 'da-du';
          icon = '✅';
        } else if (k.tongDaThu === 0) {
          lopTrangThai = 'chua-thu';
          icon = '⏳';
        }

        const lopPhu = [
          lopTrangThai,
          laDinhKy ? 'loai-dinh-ky' : 'loai-nhanh',
          khoanDuocChonId === k.id ? 'dang-chon' : '',
        ].filter(Boolean).join(' ');

        const the = e('div', 'the-khoan-thu ' + lopPhu);

        // 1. Đầu thẻ — tiêu đề lớn/đậm đứng riêng một hàng, MỌI nhãn (kiểu thu, tuần, lịch thu,
        // số tiền/em, trạng thái) đều là các pill nhỏ/mờ xếp ngay bên dưới — không còn badge to
        // nổi bật tách riêng ở góc phải như trước (kiểu Linear/Vercel: chữ là trọng tâm, nhãn chỉ
        // là ngữ cảnh phụ).
        const dau = e('div', 'the-khoan-dau');
        const trai = e('div', 'the-khoan-trai');
        trai.append(e('div', 'the-khoan-icon', icon));

        const thongTin = e('div', 'the-khoan-thong-tin');

        let tenThuSach = (k.ten || '').trim();
        const soTuan = laDinhKy ? (matchTuan ? matchTuan[1] : (k.kySo || null)) : null;
        tenThuSach = tenThuSach.replace(/\s*\([^)]*\d+[/–-]\d+[^)]*\)/g, '').trim();
        if (soTuan) {
          const reTuan = new RegExp(`\\s*[–\\-—]?\\s*Tuần\\s*${soTuan}\\s*[–\\-—]?\\s*`, 'gi');
          const daBoTuan = tenThuSach.replace(reTuan, ' ').trim();
          if (daBoTuan) tenThuSach = daBoTuan;
        }
        tenThuSach = tenThuSach.replace(/^[–\-—\s:]+|[–\-—\s:]+$/g, '').trim();
        if (!tenThuSach) {
          tenThuSach = (k.ten || '').replace(/\s*\([^)]*\d+[/–-]\d+[^)]*\)/g, '').trim() || k.ten;
        }
        // Tên khoản + "Tuần N" đứng SÁT NHAU trên cùng 1 hàng, to/đậm/nổi bật nhất thẻ — nhìn
        // phát biết ngay đây là khoản thu gì của tuần nào, không phải dò xuống hàng pill bên dưới.
        const dongTieuDe = e('div', 'the-khoan-tieu-de-hang');
        dongTieuDe.append(e('h4', 'the-khoan-ten', tenThuSach));
        if (soTuan) dongTieuDe.append(e('span', 'the-khoan-so-tuan', `Tuần ${soTuan}`));
        thongTin.append(dongTieuDe);

        const nhanHang = e('div', 'the-khoan-nhan-hang');
        nhanHang.append(e('span', 'tag-nhe', laDinhKy ? '🔁 Thu định kỳ' : '⚡ Thu linh động'));

        let lichThu = '';
        if (k.ngayBatDau && k.ngayKetThuc) {
          lichThu = `📅 ${ngayVN(k.ngayBatDau)}–${ngayVN(k.ngayKetThuc)}`;
        } else if (k.ngayBatDau) {
          lichThu = `📅 Từ ${ngayVN(k.ngayBatDau)}`;
        } else {
          const m = /\(([^)]+\d+[/–-]\d+[^)]*)\)/.exec(k.ten);
          if (m) lichThu = `📅 ${m[1]}`;
        }
        if (lichThu) nhanHang.append(e('span', 'tag-nhe', lichThu));
        if (k.soTienMoiEm) nhanHang.append(e('span', 'tag-nhe', `👤 ${tienVN(k.soTienMoiEm)}/em`));
        thongTin.append(nhanHang);

        trai.append(thongTin);
        dau.append(trai);

        // Góc phải đầu thẻ: CHỈ dành cho học sinh đang xem đúng khoản của mình — một badge nhỏ,
        // ngắn gọn ("Bạn: Đã đủ 100%"...), rê chuột/chạm mới hiện tooltip đủ chi tiết (đã nộp bao
        // nhiêu, ngày nào) — thay cho cả một dòng "Phần của bạn" chiếm chỗ như trước.
        if (banGhiCuaMinh) {
          const [chuTrangThai, lopTrangThaiBt] = banGhiCuaMinh.trangThai === 'da_du' ? ['✓ Bạn: Đã đủ 100%', 'nhan-tot']
            : banGhiCuaMinh.trangThai === 'dong_mot_phan' ? ['🙋 Bạn: Đóng 1 phần', 'nhan-luuy']
              : ['🙋 Bạn: Chưa đóng', 'nhan-xau'];
          const chiTietBanThan = banGhiCuaMinh.daDong > 0
            ? `Đã nộp ${tienVN(banGhiCuaMinh.daDong)}` + (banGhiCuaMinh.ngayDong ? ` · ${ngayVN(banGhiCuaMinh.ngayDong)}` : '')
            : k.soTienMoiEm ? `Cần nộp ${tienVN(k.soTienMoiEm)}` : 'Chưa nộp khoản này';

          const goiYBanThan = e('div', 'the-khoan-ban-than');
          goiYBanThan.tabIndex = 0;
          goiYBanThan.setAttribute('role', 'button');
          goiYBanThan.setAttribute('aria-label', chuTrangThai.replace(/^[✓🙋]\s*/u, '') + ' — ' + chiTietBanThan);
          goiYBanThan.append(e('span', 'nhan ' + lopTrangThaiBt, chuTrangThai), e('div', 'tien-do-tooltip', chiTietBanThan));
          ganTooltipNoi(goiYBanThan, true);
          dau.append(goiYBanThan);
        }

        the.append(dau);

        // 2. Widget số liệu + tiến độ: Đã thu — Mục tiêu, rồi thanh tiến độ bên dưới. Không còn
        // hiện sẵn "X% / còn thiếu Y đ" thường trực nữa (lặp với badge + chữ to giữa thẻ) — RÊ
        // CHUỘT (hoặc bấm/focus trên điện thoại) vào thanh tiến độ mới hiện tooltip đúng số đó,
        // gọn hơn nhiều mà vẫn tra được ngay khi cần.
        const ttdTomTat = phanTram >= 100 ? '🎉 Đã hoàn thành chỉ tiêu'
          : k.dangMo ? `còn thiếu ${tienVN(conThieu)} để đủ chỉ tiêu`
            : 'đã khoá sổ';
        const ttdChuThich = `Đã đạt ${phanTram}% — ${ttdTomTat}`;

        const widget = e('div', 'the-khoan-tien-do-widget');
        const ttdHang = e('div', 'ttd-hang');
        const cotDaThu = e('div', 'ttd-cot');
        cotDaThu.append(e('span', 'nhan-cot', 'Đã thu'), e('span', 'ttd-so ttd-so-tot', tienVN(k.tongDaThu)));
        const cotMucTieu = e('div', 'ttd-cot ttd-cot-phai');
        cotMucTieu.append(e('span', 'nhan-cot', 'Mục tiêu'), e('span', 'ttd-so', tienVN(k.tongCanThu)));
        ttdHang.append(cotDaThu, cotMucTieu);
        widget.append(ttdHang);

        // Bọc ngoài KHÔNG cắt tràn (để tooltip trồi lên trên còn thấy được) — riêng nền/thanh
        // chạy mới bo góc + cắt tràn ở khối con bên trong.
        const tienDoKhung = e('div', 'the-khoan-tien-do-khung');
        tienDoKhung.tabIndex = 0;
        tienDoKhung.setAttribute('role', 'button');
        tienDoKhung.setAttribute('aria-label', ttdChuThich);
        const tienDoNen = e('div', 'the-khoan-tien-do-nen');
        const tienDoChay = e('div', 'the-khoan-tien-do-chay');
        tienDoChay.style.width = Math.min(100, Math.max(0, phanTram)) + '%';
        tienDoNen.append(tienDoChay);
        tienDoKhung.append(tienDoNen, e('div', 'tien-do-tooltip', ttdChuThich));
        ganTooltipNoi(tienDoKhung, false);
        widget.append(tienDoKhung);
        the.append(widget);

        // 3. Khối danh sách học sinh đóng tiền chi tiết (dữ liệu đã tính sẵn ở đầu vòng lặp)

        const soEmDaDong = danhSachHsVoiTrangThai.filter((x) => x.trangThai === 'da_du').length;
        const soEmDongMotPhan = danhSachHsVoiTrangThai.filter((x) => x.trangThai === 'dong_mot_phan').length;
        const soEmChuaDong = danhSachHsVoiTrangThai.filter((x) => x.trangThai === 'chua_dong').length;
        const tongSoEmDaNop = soEmDaDong + soEmDongMotPhan;

        // <details>/<summary> chuẩn thay cho nút + div ẩn/hiện tự chế — trình duyệt tự lo
        // toggle/accessibility, thẻ luôn gọn ở trạng thái đóng mặc định.
        const chiTietDongTien = e('details', 'chi-tiet-dong-tien');
        const tomTat = e('summary', 'nut-mo-chi-tiet-dong');
        const spanNhan = e('span', 'tom-tat-dong-tien');
        const spanTieuDe = e('span');
        spanTieuDe.append(document.createTextNode('👥 '), e('b', null, 'Chi tiết đóng tiền'));
        const spanStats = e('span', 'tom-tat-stats');
        const pillDaDong = e('span', 'pill-dong-tien pill-da-dong');
        pillDaDong.append(document.createTextNode('Đã đóng '), e('b', null, `${tongSoEmDaNop}/${dsHs.length}`));
        const pillChuaDong = e('span', 'pill-dong-tien pill-chua-dong');
        pillChuaDong.append(document.createTextNode('Chưa đóng '), e('b', null, String(soEmChuaDong)));
        spanStats.append(pillDaDong, pillChuaDong);
        spanNhan.append(spanTieuDe, spanStats);
        // Nhãn chữ "Mở rộng"/"Thu gọn" đứng cạnh mũi tên — chỉ có icon mũi tên bé xíu thì học
        // sinh dễ không để ý là bấm được vào đây.
        const nhanMoRong = e('span', 'nhan-mo-rong', 'Mở rộng');
        tomTat.append(spanNhan, nhanMoRong, e('span', 'mui-ten-chi-tiet', '▾'));

        const khungChiTiet = e('div', 'khung-chi-tiet-dong');
        // Đang tìm theo tên học sinh ở ô tìm kiếm chính (không khớp tên khoản nào) — tự mở sẵn
        // và lọc luôn theo đúng tên đó, đỡ phải bấm mở rồi gõ lại tên lần nữa cho từng khoản.
        chiTietDongTien.open = timTheoTenHs;
        if (timTheoTenHs) nhanMoRong.textContent = 'Thu gọn';
        // Cặp "Đã đóng x/y" / "Chưa đóng z" ở đây chỉ hữu ích khi ĐANG ĐÓNG (xem nhanh không cần
        // mở) — mở ra rồi thì các nút lọc Tất cả/Đã đóng/Chưa đóng bên dưới đã lặp lại đúng những
        // con số này, ẩn bớt đi cho đỡ trùng.
        spanStats.hidden = timTheoTenHs;

        let locHs = ''; // '' | 'da_dong' | 'chua_dong'
        let timHs = timTheoTenHs ? timKhoan : '';

        function veBangHs() {
          const thanhLocHs = e('div', 'thanh-loc-chi-tiet');
          const dayNutLoc = e('div', 'day-nut-loc');

          const CAC_NUT_LOC_HS = [
            ['', `Tất cả (${danhSachHsVoiTrangThai.length})`],
            ['da_dong', `Đã đóng (${tongSoEmDaNop})`],
            ['chua_dong', `Chưa đóng (${soEmChuaDong})`],
          ];

          CAC_NUT_LOC_HS.forEach(([ma, nhan]) => {
            const b = e('button', 'nut-loc-nhanh', nhan);
            b.type = 'button';
            b.setAttribute('aria-pressed', String(locHs === ma));
            b.addEventListener('click', (ev) => {
              ev.stopPropagation();
              locHs = ma;
              veBangHs();
            });
            dayNutLoc.append(b);
          });

          const oTimHs = e('input', 'o-tim-hs');
          oTimHs.type = 'search';
          oTimHs.value = timHs;
          oTimHs.placeholder = 'Tìm tên học sinh…';
          oTimHs.setAttribute('aria-label', 'Tìm kiếm học sinh');
          oTimHs.addEventListener('input', (ev) => {
            timHs = ev.target.value.trim().toLowerCase();
            veBangHs();
          });

          thanhLocHs.append(dayNutLoc, oTimHs);

          const hsLoc = danhSachHsVoiTrangThai.filter((h) => {
            if (locHs === 'da_dong' && h.trangThai === 'chua_dong') return false;
            if (locHs === 'chua_dong' && h.trangThai !== 'chua_dong') return false;
            if (timHs) {
              const ht = (h.hoTen || '').toLowerCase();
              if (!ht.includes(timHs)) return false;
            }
            return true;
          });

          const hopCuon = e('div', 'bang-dong-tien-cuon');

          // 1. Danh sách dạng Thẻ (tách biệt rõ ràng từng em trên điện thoại)
          const dsTheMobile = e('div', 'ds-card-hs-dong');

          // 2. Dạng Bảng (cho màn hình lớn)
          const bang = e('table', 'bang-dong-tien bang-dong-tien-desktop');
          const thead = e('thead');
          const hangTieuDe = e('tr');
          // Bỏ cột STT (đã dư — tên + số thứ tự trong sổ lớp không cần thêm cột riêng), gộp
          // "Đã đóng" và "Trạng thái" làm một cột để đỡ chiếm ngang.
          hangTieuDe.append(
            e('th', null, 'Họ và tên'),
            e('th', null, 'Đã đóng'),
            e('th', null, 'Ngày đóng'),
            e('th', null, 'Ghi chú')
          );
          thead.append(hangTieuDe);
          bang.append(thead);

          const tbody = e('tbody');
          if (!hsLoc.length) {
            const hangTrong = e('tr');
            const tdTrong = e('td');
            tdTrong.colSpan = 4;
            tdTrong.style.textAlign = 'center';
            tdTrong.style.padding = '20px';
            tdTrong.className = 'trong';
            tdTrong.textContent = 'Không có học sinh nào phù hợp bộ lọc.';
            hangTrong.append(tdTrong);
            tbody.append(hangTrong);

            dsTheMobile.append(e('div', 'trong o-trong-card', 'Không có học sinh nào phù hợp bộ lọc.'));
          } else {
            hsLoc.forEach((h) => {
              const sttChu = String(h.sttHienThi || h.id);

              // Render Card cho Mobile theo bố cục dọc chuẩn:
              //  Hàng 1: STT tròn + Badge trạng thái (ôm sát nhau, không lấn sang tên)
              //  Hàng 2: Tên đầy đủ + Lớp nghề (thoải mái xuống dòng khi dài)
              //  Hàng 3: Đã nộp + Ngày nộp

              const card = e('div', 'card-hs-dong' + (h.laChinhMinh ? ' dong-ban-than' : ''));

              // Hàng 1: STT + Badge
              const cDau = e('div', 'card-hs-dong-dau');
              const sttEl = e('span', 'stt-tron-hs', sttChu);
              let badgeMobile;
              if (h.trangThai === 'da_du') {
                badgeMobile = e('span', 'nhan nhan-tot', '✓ Đã đủ');
              } else if (h.trangThai === 'dong_mot_phan') {
                badgeMobile = e('span', 'nhan nhan-luuy', 'Đóng 1 phần');
              } else {
                badgeMobile = e('span', 'nhan nhan-xau', 'Chưa đóng');
              }
              cDau.append(sttEl, badgeMobile);
              if (h.laChinhMinh) {
                cDau.append(e('span', 'tag-ban', 'Bạn'));
              }

              // Hàng 2: Tên đầy đủ + Lớp nghề (xuống dòng tự nhiên, không cắp ép)
              const cTenWrap = e('div', 'card-hs-dong-ten');
              cTenWrap.append(e('b', 'ten-chu', h.hoTen));
              if (h.lopNghe && hienNgheThuQuy) {
                cTenWrap.append(e('span', 'lop-nghe-nho', `· ${h.lopNghe}`));
              }

              // Hàng 3: Tiền + Ngày
              const cThan = e('div', 'card-hs-dong-than');
              const cTien = e('div', 'card-hs-tien');
              cTien.append(e('span', 'nhan-muc', 'Đã nộp: '));
              if (h.daDong > 0) {
                cTien.append(Object.assign(e('b', null, tienVN(h.daDong)), { style: 'color:var(--tot)' }));
              } else {
                cTien.append(Object.assign(e('span', 'trong', '0 đ')));
              }
              const cNgay = e('span', 'card-hs-ngay', h.ngayDong ? `📅 ${ngayVN(h.ngayDong)}` : 'Chưa nộp');
              cThan.append(cTien, cNgay);
              if (h.ghiChu) {
                cThan.append(e('span', 'card-hs-gc', `📝 ${h.ghiChu}`));
              }

              card.append(cDau, cTenWrap, cThan);
              dsTheMobile.append(card);

              // Render Table row cho Desktop — không còn cột STT riêng
              const tr = e('tr', h.laChinhMinh ? 'dong-ban-than' : '');
              const tdTen = e('td');
              tdTen.append(e('b', null, h.hoTen));
              if (h.lopNghe && hienNgheThuQuy) {
                tdTen.append(Object.assign(e('span', 'lop-nghe-nho', ` · ${h.lopNghe}`), { style: 'font-size:11.5px;color:var(--chu-nhat)' }));
              }
              if (h.laChinhMinh) {
                tdTen.append(e('span', 'tag-ban', 'Bạn'));
              }

              // "Đã đóng" + "Trạng thái" gộp làm 1 cột: số tiền rồi tới nhãn trạng thái ngay cạnh.
              const tdTien = e('td');
              const oDongTien = e('div', 'o-dong-trang-thai');
              if (h.daDong > 0) {
                oDongTien.append(Object.assign(e('b', null, tienVN(h.daDong)), { style: 'color:var(--tot)' }));
              } else {
                oDongTien.append(e('span', 'trong', '0 đ'));
              }
              if (h.trangThai === 'da_du') {
                oDongTien.append(e('span', 'nhan nhan-tot', '✓ Đủ'));
              } else if (h.trangThai === 'dong_mot_phan') {
                oDongTien.append(e('span', 'nhan nhan-luuy', '1 phần'));
              } else {
                oDongTien.append(e('span', 'nhan nhan-xau', 'Chưa đóng'));
              }
              tdTien.append(oDongTien);

              const tdNgay = e('td', 'trong', h.ngayDong ? ngayVN(h.ngayDong) : '—');
              // Ghi chú trống thì để trắng hẳn, không hiện dấu "—" giả vờ có nội dung.
              const tdGhiChu = e('td', 'trong', h.ghiChu || '');

              tr.append(tdTen, tdTien, tdNgay, tdGhiChu);
              tbody.append(tr);
            });
          }

          bang.append(tbody);
          hopCuon.append(dsTheMobile, bang);

          datNoiDung(khungChiTiet, thanhLocHs, hopCuon);
        }

        // <details> tự lo việc mở/đóng — chỉ cần vẽ lại nội dung khi nó MỞ (đóng thì không cần
        // tính bảng, tiết kiệm việc dựng DOM cho những khoản người dùng chưa bấm xem).
        chiTietDongTien.addEventListener('toggle', () => {
          spanStats.hidden = chiTietDongTien.open;
          nhanMoRong.textContent = chiTietDongTien.open ? 'Thu gọn' : 'Mở rộng';
          if (chiTietDongTien.open) veBangHs();
        });
        if (timTheoTenHs) veBangHs();   // tự mở sẵn nên phải tự vẽ nội dung ngay, không đợi bấm

        chiTietDongTien.append(tomTat, khungChiTiet);
        the.append(chiTietDongTien);

        cacPhanTuThe.push(the);
      });

      datNoiDung(dsTheKhoi, ...cacPhanTuThe);
    }

    veDanhSachKhoan();
    datNoiDung(noiDungTab, khungBoc);
  }

  // --- 2. KHU VỰC KHOẢN CHI ---
  let locLoaiChi = ''; // '' (tất cả) | 'hoat_dong' | 'vpp' ...
  let timChi = '';
  let chiDuocChonId = null;

  const MAP_ICON_CHI = {
    hoat_dong: '🎪',
    vpp: '📝',
    khen_thuong: '🎁',
    ho_tro: '🤝',
    khac: '💸',
  };

  function tenLoaiChi(loai) {
    const tim = CAC_LOAI_CHI.find(([k]) => k === loai);
    return tim ? tim[1] : 'Khoản chi';
  }

  function veKhuVucChi() {
    if (!dsChiGoc.length) {
      return datNoiDung(noiDungTab, e('p', 'trong', 'Chưa có khoản chi nào được ghi nhận.'));
    }

    const khungBoc = e('div', 'khu-khoan-chi');

    // Thanh công cụ hợp nhất: Bộ lọc phân loại bên trái + Nhóm điều khiển bên phải
    const thanhCongCu = e('div', 'thanh-cong-cu-khoan');

    // 1. Bên trái: Bộ lọc theo loại chi
    const dayLoc = e('div', 'day-loc');
    const cacMucLoc = [['', `Tất cả (${dsChiGoc.length})`]];
    CAC_LOAI_CHI.forEach(([ma, ten]) => {
      const soLuong = dsChiGoc.filter((c) => c.loai === ma).length;
      if (soLuong > 0) {
        cacMucLoc.push([ma, `${ten} (${soLuong})`]);
      }
    });

    // Tạo nút lọc DUY NHẤT MỘT LẦN — bấm chỉ đổi aria-pressed trên đúng các nút có sẵn (không
    // dựng lại từ đầu mỗi lần bấm), tránh giật/mất focus do nút vừa bấm bị xoá khỏi DOM ngay
    // giữa lúc xử lý sự kiện click của chính nó.
    let dsNutLocChi = [];
    const capNhatNutLocChi = () => {
      dsNutLocChi.forEach((b) => {
        b.setAttribute('aria-pressed', String(locLoaiChi === b.dataset.loc && !chiDuocChonId));
      });
    };
    const veNutLocChi = () => {
      dsNutLocChi = cacMucLoc.map(([giaTri, nhan]) => {
        const b = e('button', 'vien-loc', nhan);
        b.type = 'button';
        b.dataset.loc = giaTri;
        b.addEventListener('click', () => {
          chiDuocChonId = null;
          dropdownChi.value = '';
          locLoaiChi = giaTri;
          capNhatNutLocChi();
          veDanhSachChi();
        });
        return b;
      });
      capNhatNutLocChi();
      datNoiDung(dayLoc, ...dsNutLocChi);
    };
    veNutLocChi();
    thanhCongCu.append(dayLoc);

    // 2. Bên phải: Nhóm điều khiển (Dropdown chọn nhanh + Ô tìm kiếm)
    const nhomDieuKhienChi = e('div', 'nhom-dieu-khien-khoan');

    const dropdownChi = e('select', 'dropdown-chon-khoan');
    dropdownChi.setAttribute('aria-label', 'Chọn nhanh khoản chi');
    const optMacDinhChi = e('option', null, `-- Chọn nhanh khoản chi (${dsChiGoc.length}) --`);
    optMacDinhChi.value = '';
    dropdownChi.append(optMacDinhChi);

    dsChiGoc.forEach((c) => {
      const opt = e('option', null, `[${tenLoaiChi(c.loai)}] ${c.noiDung} · -${tienVN(c.soTien)}`);
      opt.value = String(c.id);
      dropdownChi.append(opt);
    });

    const oTim = e('input', 'o-nhap o-tim-khoan');
    oTim.type = 'search';
    oTim.value = timChi;
    oTim.placeholder = 'Tìm khoản chi, nội dung…';
    oTim.setAttribute('aria-label', 'Tìm kiếm khoản chi');

    dropdownChi.addEventListener('change', (ev) => {
      chiDuocChonId = ev.target.value ? Number(ev.target.value) : null;
      if (chiDuocChonId) {
        timChi = '';
        oTim.value = '';
      }
      veDanhSachChi();
    });

    oTim.addEventListener('input', (ev) => {
      timChi = ev.target.value.trim().toLowerCase();
      if (timChi) {
        chiDuocChonId = null;
        dropdownChi.value = '';
      }
      veDanhSachChi();
    });

    nhomDieuKhienChi.append(dropdownChi, oTim);
    thanhCongCu.append(nhomDieuKhienChi);
    khungBoc.append(thanhCongCu);

    const dsTheKhoi = e('div', 'ds-the-khoan');
    khungBoc.append(dsTheKhoi);

    function veDanhSachChi() {
      let danhSachLoc;
      if (chiDuocChonId) {
        danhSachLoc = dsChiGoc.filter((c) => c.id === chiDuocChonId);
      } else {
        danhSachLoc = dsChiGoc.filter((c) => {
          if (locLoaiChi && c.loai !== locLoaiChi) return false;
          if (timChi) {
            const nd = (c.noiDung || '').toLowerCase();
            const gc = (c.ghiChu || '').toLowerCase();
            if (!nd.includes(timChi) && !gc.includes(timChi)) return false;
          }
          return true;
        });
      }

      const cacPhanTuThe = [];

      if (chiDuocChonId && danhSachLoc.length > 0) {
        const thanhBao = e('div', 'thanh-loc-dang-chon');
        thanhBao.append(
          e('span', null, `🔍 Đang xem riêng: "${danhSachLoc[0].noiDung}"`),
          (() => {
            const nutHuy = e('button', 'nut-huy-loc', '✕ Xem tất cả');
            nutHuy.type = 'button';
            nutHuy.addEventListener('click', () => {
              chiDuocChonId = null;
              dropdownChi.value = '';
              if (cacMucLoc.length > 1) capNhatNutLocChi();
              veDanhSachChi();
            });
            return nutHuy;
          })()
        );
        cacPhanTuThe.push(thanhBao);
      }

      if (!danhSachLoc.length) {
        return datNoiDung(dsTheKhoi, e('p', 'trong', 'Chưa có khoản chi nào phù hợp.'));
      }

      danhSachLoc.forEach((c) => {
        const the = e('div', 'the-khoan-chi ' + (chiDuocChonId === c.id ? 'dang-chon' : ''));
        const dau = e('div', 'the-khoan-dau');
        const trai = e('div', 'the-khoan-trai');
        const icon = MAP_ICON_CHI[c.loai] || '💸';
        trai.append(e('div', 'the-khoan-icon', icon));

        const thongTin = e('div', 'the-khoan-thong-tin');
        const dongTen = e('div', 'the-khoan-ten-hang');

        // Dòng đầu: kiểu chi (loại chi), tên chi (không ghi thời gian)
        dongTen.append(e('span', 'badge-kieu-chi', `🏷️ ${tenLoaiChi(c.loai)}`));

        let noiDungSach = (c.noiDung || '').trim();
        noiDungSach = noiDungSach.replace(/\s*\([^)]*\d+[/–-]\d+[^)]*\)/g, '').trim();
        noiDungSach = noiDungSach.replace(/^[–\-—\s:]+|[–\-—\s:]+$/g, '').trim();
        if (!noiDungSach) noiDungSach = c.noiDung;

        dongTen.append(e('h4', 'the-khoan-ten', noiDungSach));
        thongTin.append(dongTen);

        // Dòng 2: lịch chi, số tiền chi
        const chipDay = e('div', 'the-khoan-chip-day');
        if (c.ngay) {
          chipDay.append(e('span', 'the-khoan-chip', `📅 ${ngayVN(c.ngay)}`));
        }
        if (c.soTien) {
          chipDay.append(e('span', 'the-khoan-chip chip-tien-chi', `💸 ${tienVN(c.soTien)}`));
        }
        thongTin.append(chipDay);
        trai.append(thongTin);

        const phai = e('div', 'the-khoan-phai');
        phai.append(e('div', 'gia-tri-tien-chi', `-${tienVN(c.soTien)}`));
        dau.append(trai, phai);
        the.append(dau);

        if (c.ghiChu) {
          the.append(e('div', 'the-khoan-chi-ghi-chu', `📝 ${c.ghiChu}`));
        }

        cacPhanTuThe.push(the);
      });

      datNoiDung(dsTheKhoi, ...cacPhanTuThe);
    }

    veDanhSachChi();
    datNoiDung(noiDungTab, khungBoc);
  }

  capNhatTab();
  datNoiDung(hop, thanhTab, noiDungTab);
}

/* ---------- Xem ảnh phóng to (lightbox): điều hướng ảnh trước/sau, phím tắt, đóng bằng nền/Esc ---------- */
let dsAnhDangXem = [];
let chiSoAnhDangXem = -1;

function khoiHopXemAnh() {
  let hop = $('#hopXemAnh');
  if (hop) return hop;

  hop = e('div', 'hop-xem-anh');
  hop.id = 'hopXemAnh';
  hop.hidden = true;
  hop.setAttribute('role', 'dialog');
  hop.setAttribute('aria-modal', 'true');
  hop.setAttribute('aria-label', 'Xem ảnh phóng to');

  const nutDong = e('button', 'hxa-nut hxa-dong', '✕');
  nutDong.type = 'button';
  nutDong.setAttribute('aria-label', 'Đóng');

  const nutTruoc = e('button', 'hxa-nut hxa-truoc', '‹');
  nutTruoc.type = 'button';
  nutTruoc.setAttribute('aria-label', 'Ảnh trước');

  const nutSau = e('button', 'hxa-nut hxa-sau', '›');
  nutSau.type = 'button';
  nutSau.setAttribute('aria-label', 'Ảnh sau');

  const img = e('img', 'hxa-anh');
  const chuThich = e('div', 'hxa-chu-thich');
  const dem = e('div', 'hxa-dem');

  const khungAnh = e('div', 'hxa-khung');
  khungAnh.append(img, nutTruoc, nutSau);

  const noiDung = e('div', 'hxa-noi-dung');
  noiDung.append(khungAnh, chuThich, dem, nutDong);
  hop.append(noiDung);
  document.body.append(hop);

  function dong() { hop.hidden = true; chiSoAnhDangXem = -1; }
  function ve() {
    const a = dsAnhDangXem[chiSoAnhDangXem];
    if (!a) return dong();
    img.src = a.src;
    img.alt = a.chuThich || 'Ảnh hoạt động của lớp';
    chuThich.textContent = a.chuThich || '';
    chuThich.hidden = !a.chuThich;
    dem.textContent = `${chiSoAnhDangXem + 1} / ${dsAnhDangXem.length}`;
    nutTruoc.hidden = nutSau.hidden = dsAnhDangXem.length < 2;
  }
  function lui(chieu) {
    if (!dsAnhDangXem.length) return;
    chiSoAnhDangXem = (chiSoAnhDangXem + chieu + dsAnhDangXem.length) % dsAnhDangXem.length;
    ve();
  }

  nutDong.addEventListener('click', dong);
  hop.addEventListener('click', (ev) => { if (ev.target === hop) dong(); });
  nutTruoc.addEventListener('click', () => lui(-1));
  nutSau.addEventListener('click', () => lui(1));
  document.addEventListener('keydown', (ev) => {
    if (hop.hidden) return;
    if (ev.key === 'Escape') dong();
    else if (ev.key === 'ArrowLeft') lui(-1);
    else if (ev.key === 'ArrowRight') lui(1);
  });

  hop.moTai = (ds, chiSo) => {
    dsAnhDangXem = ds; chiSoAnhDangXem = chiSo;
    hop.hidden = false;
    ve();
  };
  return hop;
}

function moXemAnh(ds, chiSo) {
  khoiHopXemAnh().moTai(ds, chiSo);
}

function xuLyLinkAmThanhHoatDong(item) {
  if (item.amThanhKhoa) return '/api/thu-vien-tep?loai=am-thanh&id=' + encodeURIComponent(item.amThanhId);
  return xuLyLinkNhac(item.amThanhUrl, item.id);
}

/** Tạo khối nhúng THẬT SỰ cho video ngoài (YouTube/Drive/Facebook/TikTok) — chỉ gọi khi người
    xem đã bấm play, KHÔNG tạo sẵn lúc vẽ trang. Mỗi iframe nhúng (nhất là YouTube) tự kéo theo
    cả trình phát nặng của bên đó — nhiều bài có video trên cùng trang chủ cùng lúc là nguyên
    nhân chính gây giật/lag, dù đã có loading="lazy". */
function taoKhungVideoNgoai(url, maYt, maDrive) {
  if (maYt) {
    const khung = e('iframe');
    khung.src = 'https://www.youtube.com/embed/' + maYt + '?autoplay=1';
    khung.allowFullscreen = true;
    khung.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    return khung;
  }
  if (maDrive) {
    const khung = e('iframe');
    khung.src = 'https://drive.google.com/file/d/' + maDrive + '/preview';
    khung.allowFullscreen = true; khung.allow = 'autoplay; fullscreen';
    return khung;
  }
  const khung = e('iframe');
  khung.src = 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url) + '&show_text=0&autoplay=true';
  khung.allowFullscreen = true;
  return khung;
}

/** "Mặt nạ" nhẹ thay cho iframe — hiện ảnh nền (poster) + nút play, đợi người xem bấm mới thật
    sự nhúng trình phát của YouTube/Drive/Facebook/TikTok. Nhẹ hơn RẤT nhiều so với nhúng sẵn cả
    trang, vì trang chủ có thể có nhiều bài video hiển thị cùng lúc. */
function veMatNaVideo(url, maYt, maDrive) {
  const boc = e('div', 'video-mat-na');
  boc.setAttribute('role', 'button');
  boc.tabIndex = 0;
  boc.title = 'Nhấn để xem video';
  if (maYt) {
    const anhNen = e('img');
    anhNen.src = 'https://img.youtube.com/vi/' + maYt + '/hqdefault.jpg';
    anhNen.loading = 'lazy'; anhNen.decoding = 'async'; anhNen.alt = '';
    // Thử lấy maxresdefault nếu có để ảnh nét căng trên điện thoại
    const thuNet = new Image();
    thuNet.onload = () => {
      if (thuNet.naturalWidth > 120) anhNen.src = 'https://img.youtube.com/vi/' + maYt + '/maxresdefault.jpg';
    };
    thuNet.src = 'https://img.youtube.com/vi/' + maYt + '/maxresdefault.jpg';
    boc.append(anhNen);
  }
  const nutPlay = Object.assign(e('span', 'video-mat-na-nut', '▶'), { 'aria-hidden': 'true' });
  boc.append(nutPlay);
  function moThat() {
    boc.classList.add('dang-chuyen');
    nutPlay.textContent = '';
    nutPlay.append(e('span', 'quay quay-trang'));
    const iframe = taoKhungVideoNgoai(url, maYt, maDrive);
    boc.replaceWith(iframe);
  }
  boc.addEventListener('click', moThat);
  boc.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); moThat(); } });
  return boc;
}

/** Khối video của một hoạt động — tách riêng vì logic nhận diện nguồn (thư viện/YouTube/Drive/
    Facebook/TikTok/link .mp4 trực tiếp) khá dài, dùng lại được cho cả thẻ chỉ có video lẫn thẻ
    gộp nhiều loại. */
function veKhoiVideoHoatDong(item) {
  if (item.videoKhoa) {
    const vid = e('video');
    vid.controls = true; vid.playsInline = true; vid.preload = 'metadata';
    vid.src = '/api/thu-vien-tep?loai=video&id=' + encodeURIComponent(item.videoId);
    return vid;
  }
  const url = item.videoUrl;
  const maYt = idYoutube(url);
  const maDrive = idGoogleDrive(url);
  if (maYt || maDrive || /facebook\.com|fb\.watch|tiktok\.com/i.test(url || '')) {
    return veMatNaVideo(url, maYt, maDrive);
  }
  if (laVideoTrucTiep(url)) {
    const vid = e('video');
    vid.controls = true; vid.playsInline = true; vid.preload = 'metadata'; vid.src = url;
    return vid;
  }
  const a = e('a', 'nut nut-vien nut-nho', '🎬 Xem video');
  a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  return a;
}

/** Một thẻ "Hoạt động lớp" giờ có thể gộp NHIỀU loại nội dung cùng lúc (văn bản + ảnh + video +
    âm thanh) — vẽ TỪNG khối tương ứng với đúng những gì bài đó thực sự có, thay vì chỉ vẽ một
    loại duy nhất theo "item.loai" như thiết kế cũ. */
function veTheHoatDong(item, duocXoaHoatDong, lamMoi) {
  const the = e('article', 'the the-vien-day hoat-dong-the');
  const coAnh = Boolean(item.anhKhoa || item.hinhUrl);
  const coVideo = Boolean(item.videoUrl);
  const coAmThanh = Boolean(item.amThanhKhoa || item.amThanhUrl);

  let tieuDe = (item.tieuDe || '').trim();
  let noiDung = item.chuThich || '';
  if (!tieuDe && noiDung) {
    const dongDong = noiDung.split('\n\n');
    if (dongDong.length > 1 && dongDong[0].length < 150) {
      tieuDe = dongDong[0];
      noiDung = dongDong.slice(1).join('\n\n');
    }
  }

  const nhanLoai = [tieuDe || noiDung ? '📝' : '', coAnh ? '🖼' : '', coVideo ? '🎬' : '', coAmThanh ? '🎵' : '']
    .filter(Boolean).join(' ') || '📎';

  // Hàng đầu: bên trái là nhãn loại hoạt động, bên phải là cụm ngày tháng + nút xoá (nằm cùng flexbox, không bao giờ đè nhau)
  const dongDau = e('div', 'hoat-dong-dong-dau');
  dongDau.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;';

  const nhanTrai = Object.assign(e('span', 'nhan nhan-chinh', nhanLoai + ' Hoạt động lớp'), {
    style: 'font-weight:700;font-size:11.5px;flex-shrink:0;'
  });

  const cumPhai = e('div', 'hoat-dong-cum-phai');
  cumPhai.style.cssText = 'display:inline-flex;align-items:center;gap:8px;margin-left:auto;flex-shrink:0;';
  cumPhai.append(e('span', 'trong hoat-dong-ngay', ngayVN(item.ngay)));

  if (duocXoaHoatDong) {
    const nutXoa = e('button', 'nut-xoa-hoat-dong-inline', '🗑');
    nutXoa.type = 'button';
    nutXoa.title = 'Gỡ khỏi Hoạt động lớp';
    nutXoa.setAttribute('aria-label', 'Gỡ mục này khỏi Hoạt động lớp');
    nutXoa.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      if (!confirm('Gỡ mục này khỏi Hoạt động lớp?')) return;
      try {
        await api('/api/gv/hoat-dong-lop?id=' + item.id, { method: 'DELETE' });
        nhac('Đã gỡ khỏi Hoạt động lớp', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) { nhac(err.message, 'xau'); }
    });
    cumPhai.append(nutXoa);
  }

  dongDau.append(nhanTrai, cumPhai);
  the.append(dongDau);

  // Giống bài đăng trên mạng xã hội (X, Facebook): PHẦN VIẾT (tiêu đề + nội dung) luôn ở trên
  // cùng, media (ảnh/video/âm thanh) xếp bên dưới — không xen giữa nội dung như thiết kế cũ.
  if (item.tieuDeHtml || tieuDe) {
    const h4 = e('h4');
    h4.style.cssText = 'margin:0;font-size:19px;font-weight:800;color:var(--chu);line-height:1.35;';
    if (item.tieuDeHtml) h4.innerHTML = locHtmlNoiDung(item.tieuDeHtml);
    else h4.textContent = tieuDe;
    the.append(h4);
  }

  if (item.noiDungHtml || noiDung) {
    const pNd = e('p');
    pNd.style.cssText = 'margin:0;font-size:15.5px;color:var(--chu);white-space:pre-wrap;line-height:1.6;';
    if (item.noiDungHtml) {
      // Đã lọc an toàn ở máy chủ trước khi lưu — lọc lại lần nữa ở đây cho chắc (phòng khi dữ
      // liệu cũ/khác nguồn chưa qua lọc), CHỈ cho phép b/i/u/span[style đã duyệt]/br.
      pNd.innerHTML = locHtmlNoiDung(item.noiDungHtml);
    } else {
      pNd.textContent = noiDung;
    }
    the.append(pNd);
  }

  if (coAnh) {
    const hinh = e('figure');
    hinh.style.cssText = 'margin:0;cursor:zoom-in;';
    const img = e('img');
    img.src = xuLyLinkHinh(item.anhKhoa || item.hinhUrl);
    img.alt = tieuDe || noiDung || 'Hoạt động của lớp';
    img.loading = 'lazy';
    img.decoding = 'async';
    hinh.append(img);
    hinh.addEventListener('click', () => moXemAnh([{ src: img.src, chuThich: noiDung }], 0));
    the.append(hinh);
  }

  if (coVideo) the.append(veKhoiVideoHoatDong(item));

  if (coAmThanh) {
    const audio = e('audio');
    audio.controls = true; audio.preload = 'none';
    audio.src = xuLyLinkAmThanhHoatDong(item);
    the.append(audio);
    if (!noiDung && item.amThanhTen) the.append(e('p', 'hoat-dong-chu-thich', item.amThanhTen));
  }

  return the;
}

function veHoatDongLop(ds, phien, lamMoi) {
  const than = $('#hinh-anh .than-khoi');
  const hop = $('#thuVien');
  const dsDay = ds || [];

  let oTim = $('#thuVienTim');
  if (!oTim && than) {
    oTim = e('input', 'o-nhap');
    oTim.id = 'thuVienTim';
    oTim.type = 'search';
    oTim.placeholder = 'Tìm theo chú thích…';
    oTim.setAttribute('aria-label', 'Tìm theo chú thích');
    oTim.style.marginBottom = '14px';
    than.insertBefore(oTim, hop);
    oTim.addEventListener('input', () => veLoc());
  }
  if (oTim) oTim.hidden = dsDay.length < 6;

  function veLoc() {
    if (!dsDay.length) {
      return datNoiDung(hop, e('p', 'trong',
        'Chưa có hoạt động nào. Giáo viên chủ nhiệm sẽ đăng bài viết, ảnh, video hoặc âm thanh hoạt động của lớp tại đây.'));
    }

    const q = (oTim?.value || '').trim().toLowerCase();
    const dsHien = q ? dsDay.filter((a) => (a.chuThich || '').toLowerCase().includes(q)) : dsDay;

    if (!dsHien.length) {
      return datNoiDung(hop, e('p', 'trong', 'Không tìm thấy hoạt động nào khớp với "' + q + '".'));
    }

    // Xoá được nếu là giáo viên, HOẶC tài khoản đặc biệt có ít nhất 1 trong các quyền liên
    // quan tới Hoạt động lớp — được cấp quyền đăng thì cũng gỡ được bài mình/lớp đã đăng,
    // khớp đúng quyền máy chủ đã cho phép (xem functions/api/gv/hoat-dong-lop.js).
    const duocXoaHoatDong = Boolean(phien && (phien.role === 'teacher'
      || ['hoat-dong-lop', 'hinh-anh', 'am-thanh', 'video'].some((q) => (phien.quyen || []).includes(q))));
    datNoiDung(hop, ...dsHien.map((item) => veTheHoatDong(item, duocXoaHoatDong, lamMoi)));
  }

  veLoc();
}

/* ---------- Lối tắt "Quản lý" cho giáo viên / tài khoản được cấp quyền ----------
   Trang này ai đăng nhập cũng xem được (kể cả giáo viên). Với người có quyền,
   thêm nút thao tác trực tiếp (Thêm thông báo) và lối tắt vào khu quản lý. */
const MUC_QUAN_LY = [
  ['thong-bao', '#/thong-bao', 'thong-bao'],
  ['thoi-khoa-bieu', '#/thoi-khoa-bieu', null],
  ['hinh-anh', '#/hoat-dong-lop', ['hoat-dong-lop', 'hinh-anh', 'am-thanh', 'video']],
  ['danh-sach', '#/hoc-sinh', null],
  ['thu-quy', '#/quy', 'quy'],
];

function veLoiTatQuanLy(phien, lamMoi) {
  if (!phien || (phien.role !== 'teacher' && phien.role !== 'phu')) return;

  $('#mucQuanLy').hidden = false;

  MUC_QUAN_LY.forEach(([idMuc, duong, quyenCan]) => {
    const cacQuyenCan = Array.isArray(quyenCan) ? quyenCan : (quyenCan ? [quyenCan] : []);
    const duocPhep = phien.role === 'teacher' || cacQuyenCan.some((q) => (phien.quyen || []).includes(q));
    if (!duocPhep) return;

    const dauMuc = document.querySelector(`#${idMuc} .dau-muc`);
    if (!dauMuc) return;

    let vungThaoTac = dauMuc.querySelector('.khu-thao-tac-muc');
    if (!vungThaoTac) {
      vungThaoTac = e('div', 'khu-thao-tac-muc');
      vungThaoTac.style.cssText = 'margin-left:auto;display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap';
      dauMuc.append(vungThaoTac);
    } else {
      datNoiDung(vungThaoTac);
    }

    if (idMuc === 'thong-bao') {
      vungThaoTac.append(nut('+ Thêm thông báo', 'nut-chinh nut-nho', () => moHopThoaiThemThongBao(lamMoi)));
    }
    if (idMuc === 'hinh-anh') {
      vungThaoTac.append(nut('+ Thêm hoạt động', 'nut-chinh nut-nho', () => moHopThoaiThemHoatDong(lamMoi)));
    }

    if (duong) {
      const a = e('a', 'nut nut-vien nut-nho', '⚙ Quản lý');
      a.href = '/giao-vien/' + duong;
      vungThaoTac.append(a);
    }
  });
}

/* ================= Trang Điểm danh & Chuyên cần ================= */
let duLieuDiemDanh = null;
let buoiDiemDanhHienTai = 'sang';
let loaiDiemDanhHienTai = 'chinh';
let ngayDiemDanhHienTai = '';

// Lịch sử điểm danh MỌI ngày/buổi/loại của một học sinh — hiện khi tìm kiếm trong bảng điểm
// danh (không chỉ đúng ngày/buổi đang xem, xem thêm giải thích ở veLichSuHangBang bên dưới).
const NHAN_TRANG_THAI_DD = {
  co_mat: { ten: '✅ Có mặt', lop: 'nhan-tot' },
  vang_phep: { ten: '📋 Vắng có phép', lop: 'nhan' },
  vang_khong_phep: { ten: '⚠️ Vắng không phép', lop: 'nhan-xau' },
  tre: { ten: '⏱️ Đi trễ', lop: 'nhan-luuy' },
};
const TEN_BUOI_DD = { sang: 'Sáng', chieu: 'Chiều', hoat_dong: 'Hoạt động' };
const lichSuDiemDanhCacheBang = new Map();

// Dòng lịch sử hiện dưới MỖI học sinh khớp tìm kiếm trong bảng điểm danh (đúng cơ chế đã dùng ở
// khu quản lý giáo viên: hiện TẤT CẢ ngày/buổi/loại đã từng điểm danh, KHÔNG lặp lại đúng bản ghi
// của ngày/buổi/loại đang xem — bản ghi đó đã hiện sẵn ở chính hàng này rồi. Sắp xếp cũ → mới.
// "Sửa" ở đây điều hướng SANG hẳn trang Điểm danh của khu quản lý (trang này chỉ xem, không sửa
// tại chỗ) — ghi sẵn ngày/buổi vào sessionStorage để trang đó tự mở đúng chỗ.
function veLichSuHangBang(h, veLai) {
  const td = e('td');
  td.colSpan = 5;
  const khoi = e('div', 'lich-su-tim-dd');
  td.append(khoi);
  if (!lichSuDiemDanhCacheBang.has(h.id)) {
    lichSuDiemDanhCacheBang.set(h.id, 'dang-tai');
    api('/api/gv/diem-danh?hocSinhId=' + h.id).then((d2) => {
      lichSuDiemDanhCacheBang.set(h.id, d2.lichSu || []);
      veLai();
    }).catch((err) => {
      lichSuDiemDanhCacheBang.delete(h.id);
      khoi.replaceChildren(e('p', 'trong', err.message || 'Không tải được lịch sử điểm danh.'));
      veLai();
    });
  }
  const ls = lichSuDiemDanhCacheBang.get(h.id);
  if (ls === 'dang-tai') {
    khoi.append(e('p', 'trong', 'Đang tải lịch sử điểm danh…'));
    return td;
  }
  if (ls && ls.length) {
    // Thống kê tổng của em này — TÍNH Y HỆT trang Hồ sơ học sinh bên khu quản lý, để luôn ra
    // đúng MỘT con số duy nhất dù xem ở đâu, đồng bộ với các nơi khác đã có kiểu thống kê này.
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
  }
  const dsKhac = (ls || []).filter((x) => {
    const laPhuBanGhi = x.buoi.endsWith('_phu');
    const buoiGocBanGhi = x.buoi.replace(/_phu$/, '');
    return !(x.ngay === ngayDiemDanhHienTai && buoiGocBanGhi === buoiDiemDanhHienTai && laPhuBanGhi === (loaiDiemDanhHienTai === 'phu'));
  });
  if (!dsKhac.length) {
    khoi.append(e('p', 'trong', 'Chưa có lịch sử điểm danh nào khác.'));
    return td;
  }
  dsKhac.slice(0, 15).reverse().forEach((x) => {
    const laPhu = x.buoi.endsWith('_phu');
    const buoiGoc = x.buoi.replace(/_phu$/, '');
    const tt2 = NHAN_TRANG_THAI_DD[x.trangThai] || {};
    const the = e('div', 'the-lich-su-dd');
    const dong1 = e('div', 'dong-lich-su-dd-dong1');
    dong1.append(
      e('span', 'nhan ' + (tt2.lop || ''), tt2.ten || x.trangThai),
      nut('Sửa', 'nut-nhe nut-nho', () => {
        sessionStorage.setItem('dd-ngay', x.ngay);
        sessionStorage.setItem('dd-buoi', buoiGoc);
        location.href = '/giao-vien/#/diem-danh';
      })
    );
    const phanDoan = [ngayVN(x.ngay), TEN_BUOI_DD[buoiGoc] || buoiGoc];
    if (x.lyDo) phanDoan.push(x.lyDo);
    if (laPhu) phanDoan.push('Linh động');
    const dong2 = e('div', 'dong-lich-su-dd-dong2', phanDoan.join(' · '));
    the.append(dong1, dong2);
    khoi.append(the);
  });
  return td;
}

async function taiVaVeDiemDanh(ngay = '', buoi = '', loai = '') {
  const hopCaNhan = $('#ddCaNhan');
  const hopLop = $('#ddLopKhoi');
  if (!hopCaNhan || !hopLop) return;

  if (loai) loaiDiemDanhHienTai = loai;
  if (buoi) buoiDiemDanhHienTai = buoi;
  if (ngay) ngayDiemDanhHienTai = ngay;

  // Thanh tab chuyển đổi giữa Điểm danh chính và Điểm danh linh động
  let hopTabLoai = $('#ddTabLoai');
  if (!hopTabLoai) {
    hopTabLoai = e('div', 'day-loc day-loc-deu');
    hopTabLoai.id = 'ddTabLoai';
    hopTabLoai.style.cssText = 'margin: 14px 0 20px 0;';
    const khuDd = $('#khuDiemDanh');
    if (khuDd) {
      const dauMuc = khuDd.querySelector('.dau-muc');
      if (dauMuc) dauMuc.after(hopTabLoai);
      else khuDd.prepend(hopTabLoai);
    }
  }

  if (hopTabLoai) {
    datNoiDung(hopTabLoai,
      ...[['chinh', '📋 Điểm danh chính'], ['phu', '⚡ Điểm danh linh động']].map(([maL, tenL]) => {
        const b = e('button', 'vien-loc', tenL);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(loaiDiemDanhHienTai === maL));
        b.addEventListener('click', async () => {
          if (loaiDiemDanhHienTai !== maL) {
            // Chuyển tab không được làm màn hình nhảy vị trí — ghim thanh tab đứng yên trong
            // lúc vẽ lại (xem giuViTriCuonKhiVe trong chung.js).
            await giuViTriCuonKhiVe('ddTabLoai', () => taiVaVeDiemDanh(ngayDiemDanhHienTai || '', buoiDiemDanhHienTai || '', maL));
          }
        });
        return b;
      })
    );
  }

  const coSanNoiDung = Boolean(hopLop.firstElementChild && !hopLop.querySelector('.trong'));
  const chieuCaoCu = hopLop.offsetHeight;
  if (coSanNoiDung && chieuCaoCu > 80) {
    hopLop.style.minHeight = chieuCaoCu + 'px';
    hopLop.style.opacity = '0.5';
    hopLop.style.pointerEvents = 'none';
  } else {
    datNoiDung(hopLop, e('p', 'trong', 'Đang tải dữ liệu điểm danh…'));
  }

  try {
    let url = '/api/diem-danh';
    const params = [];
    if (ngayDiemDanhHienTai) params.push('ngay=' + encodeURIComponent(ngayDiemDanhHienTai));
    if (buoiDiemDanhHienTai) params.push('buoi=' + encodeURIComponent(buoiDiemDanhHienTai));
    if (loaiDiemDanhHienTai) params.push('loai=' + encodeURIComponent(loaiDiemDanhHienTai));
    if (params.length) url += '?' + params.join('&');

    duLieuDiemDanh = await api(url);
    buoiDiemDanhHienTai = duLieuDiemDanh.buoi || buoiDiemDanhHienTai;
    ngayDiemDanhHienTai = duLieuDiemDanh.ngay || ngayDiemDanhHienTai;
    loaiDiemDanhHienTai = duLieuDiemDanh.loai || loaiDiemDanhHienTai;
  } catch (err) {
    hopLop.style.opacity = '';
    hopLop.style.pointerEvents = '';
    hopLop.style.minHeight = '';
    datNoiDung(hopLop, khoiLoi('Không tải được dữ liệu điểm danh: ' + err.message));
    return;
  }

  const d = duLieuDiemDanh;
  if (d.an) {
    datNoiDung(hopCaNhan, '');
    datNoiDung(hopLop, e('p', 'trong', '🔒 Mục Điểm danh đã được giáo viên ẩn đối với tài khoản của em.'));
    return;
  }

  const isPhu = loaiDiemDanhHienTai === 'phu';

  // 1. Chuyên cần cá nhân nếu người dùng là học sinh
  if (d.caNhan) {
    const cn = d.caNhan;
    const cnData = isPhu ? (cn.phu || {}) : (cn.chinh || cn);
    const theCn = e('div', 'the-chuyen-can-ca-nhan');
    if (isPhu) theCn.classList.add('the-chuyen-can-phu');

    const tieuDe = e('div', 'tieu-de-ca-nhan');
    tieuDe.append(
      e('h3', null, (isPhu ? '⚡ Điểm danh linh động & Hoạt động: ' : '🎓 Chuyên cần chính khoá: ') + cn.hoTen),
      e('span', 'nhan ' + (isPhu ? 'nhan-luuy' : 'nhan-tot'), (cn.lopNghe || 'Chưa xếp') + (cn.chucVu ? ' · ' + cn.chucVu : ''))
    );
    theCn.append(tieuDe);

    const luoi = e('div', 'luoi-thong-ke-chuyen-can');
    const tiLe = cnData.tiLe !== null && cnData.tiLe !== undefined ? cnData.tiLe + '%' : '—';
    const lopTiLe = (cnData.tiLe || 0) >= 90 ? 'mau-tot' : (cnData.tiLe || 0) >= 75 ? 'mau-luuy' : 'mau-xau';

    // Toàn bộ danh sách buổi của học sinh
    const tatCaBuoi = (isPhu ? (cn.phu?.danhSach || cnData.danhSach) : cnData.danhSach)
      || cnData.lichSuVang || [];

    // Vùng 1: Component <details>/<summary> hiển thị danh sách chi tiết (không có thanh đỏ dài)
    const chiTietVang = e('details', 'chi-tiet-dong-tien');
    const tomTatVang = e('summary', 'nut-mo-chi-tiet-dong');

    const spanNhanVang = e('span', 'tom-tat-chuyen-can');
    const tieuDeSpan = e('span', 'tieu-de-muc');
    const pillSoBuoi = e('span', 'pill-chuyen-can');
    spanNhanVang.append(tieuDeSpan, pillSoBuoi);

    const nhanMoRongVang = e('span', 'nhan-mo-rong', 'Mở rộng');
    tomTatVang.append(spanNhanVang, nhanMoRongVang, e('span', 'mui-ten-chi-tiet', '▾'));

    const khungVang = e('div', 'khung-chi-tiet-dong');
    const dsVang = e('div', 'ds-diem-danh');
    khungVang.append(dsVang);
    chiTietVang.append(tomTatVang, khungVang);

    chiTietVang.addEventListener('toggle', () => {
      nhanMoRongVang.textContent = chiTietVang.open ? 'Thu gọn' : 'Mở rộng';
    });

    // Mảng lưu tham chiếu 5 ô thống kê để quản lý hiệu ứng SÁNG LÊN
    const dsOCanNhan = [];

    function capNhatVung1(kieu, tuDongMo = true) {
      // 1. Cập nhật trạng thái sáng lên cho ô được chọn
      dsOCanNhan.forEach(({ o, kieu: k }) => {
        const dangChon = k === kieu;
        o.classList.toggle('dang-chon', dangChon);
        o.setAttribute('aria-pressed', String(dangChon));
      });

      // 2. Lọc danh sách buổi theo kiểu
      let dsLoc = [];
      let tieuDeText = '';
      let pillClass = 'pill-chuyen-can';
      let soBuoiText = '0 buổi';
      let thongBaoRong = '';

      if (kieu === 'tat_ca') {
        dsLoc = tatCaBuoi;
        tieuDeText = isPhu ? '⚡ Tất cả buổi điểm danh phụ' : '📋 Tất cả buổi điểm danh';
        pillClass += ' pill-chinh';
        soBuoiText = `${dsLoc.length} buổi`;
        thongBaoRong = isPhu ? 'Em chưa có buổi điểm danh phụ nào.' : 'Em chưa có lượt điểm danh nào được ghi nhận.';
      } else if (kieu === 'co_mat') {
        dsLoc = tatCaBuoi.filter((x) => x.trangThai === 'co_mat');
        const soLuong = cnData.co_mat || dsLoc.length;
        tieuDeText = isPhu ? '✅ Các buổi đã tham gia' : '✅ Các buổi có mặt';
        pillClass += ' pill-co-mat';
        soBuoiText = `${soLuong} buổi`;
        thongBaoRong = `Chưa có buổi ${isPhu ? 'tham gia' : 'có mặt'} nào được ghi nhận.`;
      } else if (kieu === 'vang_phep') {
        dsLoc = tatCaBuoi.filter((x) => x.trangThai === 'vang_phep');
        const soLuong = cnData.vang_phep || dsLoc.length;
        tieuDeText = '📝 Các buổi vắng có phép';
        pillClass += ' pill-vang-phep';
        soBuoiText = `${soLuong} buổi`;
        thongBaoRong = '🎉 Tuyệt vời! Em không có buổi vắng có phép nào.';
      } else if (kieu === 'vang_khong_phep') {
        dsLoc = tatCaBuoi.filter((x) => x.trangThai === 'vang_khong_phep');
        const soLuong = cnData.vang_khong_phep || dsLoc.length;
        tieuDeText = '❌ Các buổi vắng không phép';
        pillClass += ' pill-vang-khong-phep';
        soBuoiText = `${soLuong} buổi`;
        thongBaoRong = '🎉 Rất tốt! Em không có buổi vắng không phép nào.';
      } else if (kieu === 'tre') {
        dsLoc = tatCaBuoi.filter((x) => x.trangThai === 'tre');
        const soLuong = cnData.tre || dsLoc.length;
        tieuDeText = '⏱️ Các buổi đi trễ';
        pillClass += ' pill-tre';
        soBuoiText = `${soLuong} buổi`;
        thongBaoRong = '🎉 Xuất sắc! Em không có buổi nào đi trễ.';
      }

      // Cập nhật tiêu đề và pill badge Vùng 1
      tieuDeSpan.textContent = tieuDeText;
      pillSoBuoi.className = pillClass;
      pillSoBuoi.textContent = soBuoiText;

      // 3. Vẽ danh sách vào Vùng 1
      datNoiDung(dsVang, '');
      if (!dsLoc.length) {
        dsVang.append(e('p', 'trong', thongBaoRong));
      } else {
        dsLoc.forEach((x) => {
          const hang = e('div', 'hang-hs');
          const ten = e('div', 'ten');
          const tenBuoi = (x.buoiGoc || x.buoi) === 'sang' ? 'Sáng' : (x.buoiGoc || x.buoi) === 'chieu' ? 'Chiều' : 'Hoạt động';
          ten.append(e('b', null, ngayVN(x.ngay) + ` (${tenBuoi})`));
          if (x.lyDo) ten.append(e('small', null, x.lyDo));
          let nhanTt = 'Có mặt';
          let lopTt = 'nhan-tot';
          if (x.trangThai === 'vang_phep') { nhanTt = 'Vắng phép'; lopTt = 'nhan'; }
          else if (x.trangThai === 'vang_khong_phep') { nhanTt = 'Không phép'; lopTt = 'nhan-xau'; }
          else if (x.trangThai === 'tre') { nhanTt = 'Đi trễ'; lopTt = 'nhan-luuy'; }
          hang.append(ten, e('span', 'nhan ' + lopTt, nhanTt));
          dsVang.append(hang);
        });
      }

      // 4. Tự động mở rộng Vùng 1 nếu được yêu cầu
      if (tuDongMo) {
        chiTietVang.open = true;
        nhanMoRongVang.textContent = 'Thu gọn';
      }
    }

    const taoO = (kieu, so, nhan, lopMau = '') => {
      const o = e('div', 'o-chuyen-can ' + lopMau);
      o.setAttribute('role', 'button');
      o.setAttribute('tabindex', '0');
      o.setAttribute('title', 'Bấm để lọc chi tiết ' + nhan);
      o.append(e('div', 'so', String(so)), e('div', 'nhan-so', nhan));
      o.addEventListener('click', () => capNhatVung1(kieu, true));
      o.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          capNhatVung1(kieu, true);
        }
      });
      dsOCanNhan.push({ o, kieu });
      return o;
    };

    luoi.append(
      taoO('tat_ca', tiLe, isPhu ? 'Tỉ lệ tham gia' : 'Tỉ lệ chuyên cần', lopTiLe),
      taoO('co_mat', cnData.co_mat || 0, isPhu ? 'Buổi tham gia' : 'Buổi có mặt', 'mau-tot'),
      taoO('vang_phep', cnData.vang_phep || 0, 'Vắng có phép'),
      taoO('vang_khong_phep', cnData.vang_khong_phep || 0, 'Vắng không phép', (cnData.vang_khong_phep || 0) > 0 ? 'mau-xau' : ''),
      taoO('tre', cnData.tre || 0, 'Đi trễ', (cnData.tre || 0) > 0 ? 'mau-luuy' : '')
    );
    theCn.append(luoi);

    // Xác định bộ lọc khởi đầu: ưu tiên chọn loại đang có số liệu cần chú ý
    const kieuMacDinh = (cnData.vang_khong_phep || 0) > 0 ? 'vang_khong_phep'
      : (cnData.vang_phep || 0) > 0 ? 'vang_phep'
      : (cnData.tre || 0) > 0 ? 'tre'
      : 'tat_ca';

    capNhatVung1(kieuMacDinh, false);
    theCn.append(chiTietVang);

    datNoiDung(hopCaNhan, theCn);
  } else {
    datNoiDung(hopCaNhan, '');
  }

  // Học sinh bình thường chỉ cần biết CHUYÊN CẦN CỦA CHÍNH MÌNH (đã vẽ ở khối trên) — không cần
  // xem cả bảng điểm danh của toàn lớp (vắng/lý do của bạn khác cũng là thông tin riêng tư của
  // người ta). Toàn bộ danh sách cả lớp theo ngày CHỈ dành cho giáo viên, hoặc tài khoản đặc biệt
  // (phu) được cấp đúng quyền "diem-danh" (vd lớp trưởng hỗ trợ điểm danh).
  const coQuyenXemCaLop = Boolean(thongTinPhien && (thongTinPhien.role === 'teacher'
    || (thongTinPhien.role === 'phu' && (thongTinPhien.quyen || []).includes('diem-danh'))));
  if (!coQuyenXemCaLop) {
    // Không có quyền xem cả lớp — chuyên cần của chính em (nếu có) đã hiện đủ ở khối trên
    // (hopCaNhan). Ẩn hẳn khung này, không để lại khối rỗng/thông báo thừa: em không có quyền
    // này thì không có gì để xem thêm ở đây cả.
    hopLop.hidden = true;
    datNoiDung(hopLop, '');
    return;
  }

  // 2. Điểm danh cả lớp theo ngày
  const khungLop = e('div', 'khung-diem-danh-lop');

  // Điều khiển: Chọn ngày + Chọn buổi
  const thanhNgay = e('div', 'thanh-dieu-khien-ngay-dd');
  const nhomNgay = e('div', 'nhom-ngay-buoi');

  const nhanNgay = e('label');
  nhanNgay.append(e('b', null, 'Ngày: '));
  nhomNgay.append(nhanNgay);

  const oChonNgay = e('input', 'o-chon-ngay-dd');
  oChonNgay.type = 'date';
  oChonNgay.value = d.ngay;

  // Ngày hiện tại thì khung lịch sẽ sáng lên, ngày khác thì bình thường
  if (d.ngay === homNay()) {
    oChonNgay.classList.add('la-hom-nay');
    oChonNgay.title = 'Hôm nay (ngày hiện tại)';
  } else {
    oChonNgay.classList.remove('la-hom-nay');
    oChonNgay.title = ngayDayDu(d.ngay);
  }

  oChonNgay.addEventListener('change', (ev) => {
    if (ev.target.value) {
      taiVaVeDiemDanh(ev.target.value, buoiDiemDanhHienTai, loaiDiemDanhHienTai);
    }
  });
  nhomNgay.append(boiNgayVN(oChonNgay));

  // Buổi
  const nhomBuoi = e('div', 'nhom-buoi-dd day-loc day-loc-deu');
  const CAC_BUOI = [['sang', 'Sáng'], ['chieu', 'Chiều'], ['hoat_dong', 'Hoạt động']];
  CAC_BUOI.forEach(([maB, tenB]) => {
    const nutB = e('button', 'vien-loc', tenB);
    nutB.type = 'button';
    nutB.setAttribute('aria-pressed', String(d.buoi === maB));
    nutB.addEventListener('click', () => {
      if (d.buoi !== maB) {
        taiVaVeDiemDanh(d.ngay, maB, loaiDiemDanhHienTai);
      }
    });
    nhomBuoi.append(nutB);
  });

  thanhNgay.append(nhomNgay, nhomBuoi);
  khungLop.append(thanhNgay);

  // Thống kê sĩ số ngày
  const tk = d.thongKeNgay || {};
  const thanhThongKe = e('div', 'thong-ke-si-so-ngay');
  thanhThongKe.append(
    e('span', 'chip-si-so', `👥 Sĩ số: ${tk.tongSo || 37}`),
    e('span', 'chip-si-so chip-tot', `✅ Có mặt: ${tk.coMat || 0}`),
    e('span', 'chip-si-so chip-phep', `📋 Vắng có phép: ${tk.vangPhep || 0}`),
    e('span', 'chip-si-so chip-khong-phep', `⚠️ Vắng không phép: ${tk.vangKhongPhep || 0}`),
    e('span', 'chip-si-so chip-tre', `⏱️ Đi trễ: ${tk.tre || 0}`)
  );
  khungLop.append(thanhThongKe);

  // Thanh công cụ lọc & tìm kiếm
  let locDd = ''; // '' | 'vang_tre' | 'co_mat'
  let timHsDd = '';

  const thanhLoc = e('div', 'thanh-cong-cu-khoan');
  const dayLocDd = e('div', 'day-loc day-loc-deu');
  // Chữ ngắn hơn hẳn hàng "Áp dụng nhanh" (vốn có nút dài "🗑 Xoá tất cả ghi chú" cần 108px) —
  // để mặc định sẽ ép 3 thẻ ngắn này xuống còn 2 cột dù 3 cột vẫn thừa chỗ, để lại khoảng trống.
  dayLocDd.style.setProperty('--the-nho-nhat', '85px');
  const soVangTre = (tk.vangPhep || 0) + (tk.vangKhongPhep || 0) + (tk.tre || 0);

  const CAC_MUC_LOC_DD = [
    ['', `Tất cả (${d.danhSach?.length || 0})`],
    ['vang_tre', `Vắng / Đi trễ (${soVangTre})`],
    ['co_mat', `Có mặt (${tk.coMat || 0})`],
  ];

  function veNutLocDd() {
    datNoiDung(dayLocDd, ...CAC_MUC_LOC_DD.map(([giaTri, nhan]) => {
      const b = e('button', 'vien-loc', nhan);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(locDd === giaTri));
      b.addEventListener('click', () => {
        if (locDd === giaTri) return;
        locDd = giaTri;
        veNutLocDd();
        const hopBang = khungLop.querySelector('.bang-diem-danh-cuon');
        const caoTruoc = hopBang ? hopBang.offsetHeight : 0;
        if (hopBang && caoTruoc > 80) hopBang.style.minHeight = caoTruoc + 'px';
        veBangDiemDanh();
        if (hopBang) {
          setTimeout(() => { hopBang.style.minHeight = ''; }, 120);
        }
      });
      return b;
    }));
  }
  veNutLocDd();
  thanhLoc.append(dayLocDd);

  const nhomDieuKhienDd = e('div', 'nhom-dieu-khien-khoan');
  const oTimHsDd = e('input', 'o-nhap o-tim-khoan');
  oTimHsDd.type = 'search';
  oTimHsDd.placeholder = 'Tìm học sinh…';
  oTimHsDd.addEventListener('input', (ev) => {
    timHsDd = ev.target.value.trim().toLowerCase();
    veBangDiemDanh();
  });
  nhomDieuKhienDd.append(oTimHsDd);
  thanhLoc.append(nhomDieuKhienDd);
  khungLop.append(thanhLoc);

  // Bảng điểm danh
  const hopBang = e('div', 'bang-diem-danh-cuon');
  khungLop.append(hopBang);

  function veBangDiemDanh() {
    const dsHs = (d.danhSach || []).filter((h) => {
      if (locDd === 'vang_tre' && (h.trangThai === 'co_mat' || !h.trangThai)) return false;
      if (locDd === 'co_mat' && h.trangThai !== 'co_mat') return false;
      if (timHsDd) {
        const ht = (h.hoTen || '').toLowerCase();
        if (!ht.includes(timHsDd)) return false;
      }
      return true;
    });

    // Cột "Lớp nghề" theo đúng cấu hình "Học sinh > Tuỳ chỉnh hiển thị" (hocSinhAnMuc) — cùng
    // nguồn cấu hình dùng ở Danh sách lớp (xem veDanhSach), tránh chỗ ẩn chỗ không.
    const hienNghe = !(d.hocSinhAnMuc || []).includes('lop-nghe');

    const bang = e('table', 'bang-diem-danh');
    const thead = e('thead');
    const trHd = e('tr');
    // Giữ nguyên vị trí cột (ẩn bằng "hidden" thay vì bỏ hẳn khỏi mảng) — các quy tắc CSS
    // nth-child cho cột Trạng thái/Ghi chú tính theo VỊ TRÍ, bỏ hẳn cột sẽ làm chúng trúng
    // nhầm cột khi ẩn Lớp nghề.
    const thNghe = e('th', null, 'Lớp nghề');
    thNghe.hidden = !hienNghe;
    trHd.append(
      e('th', null, 'STT'),
      e('th', null, 'Họ và tên'),
      thNghe,
      e('th', null, 'Trạng thái'),
      e('th', null, 'Ghi chú / Lý do')
    );
    thead.append(trHd);
    bang.append(thead);

    const tbody = e('tbody');
    if (!dsHs.length) {
      const trTr = e('tr');
      const tdTr = e('td');
      tdTr.colSpan = 5;
      tdTr.style.textAlign = 'center';
      tdTr.style.padding = '24px';
      tdTr.className = 'trong';
      tdTr.textContent = 'Không có học sinh nào phù hợp.';
      trTr.append(tdTr);
      tbody.append(trTr);
    } else {
      const hocSinhHienTaiId = d.caNhan?.hocSinhId || null;
      dsHs.forEach((h) => {
        const laChinhMinh = Boolean(hocSinhHienTaiId && hocSinhHienTaiId === h.id);
        const tr = e('tr', laChinhMinh ? 'dong-ban-than' : '');

        const tdStt = e('td', null, String(h.id));
        const tdTen = e('td');
        tdTen.append(e('b', null, h.hoTen));
        if (laChinhMinh) tdTen.append(e('span', 'tag-ban', 'Bạn'));

        const tdNghe = e('td', 'trong', h.lopNghe || '—');
        tdNghe.hidden = !hienNghe;

        const tdTrangThai = e('td');
        if (h.trangThai === 'co_mat') {
          tdTrangThai.append(e('span', 'nhan nhan-tot', '✅ Có mặt'));
        } else if (h.trangThai === 'vang_phep') {
          tdTrangThai.append(e('span', 'nhan', '📋 Vắng có phép'));
        } else if (h.trangThai === 'vang_khong_phep') {
          tdTrangThai.append(e('span', 'nhan nhan-xau', '⚠️ Vắng không phép'));
        } else if (h.trangThai === 'tre') {
          tdTrangThai.append(e('span', 'nhan nhan-luuy', '⏱️ Đi trễ'));
        } else {
          tdTrangThai.append(e('span', 'nhan nhan-xam', '— Chưa ghi'));
        }

        const tdLyDo = e('td', 'trong', h.lyDo || '—');

        tr.append(tdStt, tdTen, tdNghe, tdTrangThai, tdLyDo);
        tbody.append(tr);

        // Đang tìm kiếm (không phải xem cả lớp) — hiện thêm TOÀN BỘ lịch sử điểm danh của đúng
        // em này. Giới hạn số em hiện lịch sử (dsHs nhỏ) để tránh gọi API dồn dập khi gõ từ khoá
        // chung chung khớp cả chục em.
        if (timHsDd && dsHs.length <= 8) {
          const trLs = e('tr', 'dong-lich-su-bang');
          trLs.append(veLichSuHangBang(h, veBangDiemDanh));
          tbody.append(trLs);
        }
      });
    }

    bang.append(tbody);
    datNoiDung(hopBang, bang);
  }

  veBangDiemDanh();
  hopLop.hidden = false;
  hopLop.style.opacity = '';
  hopLop.style.pointerEvents = '';
  datNoiDung(hopLop, khungLop);
  requestAnimationFrame(() => {
    hopLop.style.minHeight = '';
  });
}

/* ---------- Khởi động & làm mới dữ liệu ---------- */
let thongTinPhien = null;

// Mục nào giáo viên đã ẩn riêng cho mã cá nhân đang dùng trên máy này (nếu có) — chỉ để ẩn
// bớt giao diện, không phải kiểm soát truy cập thật (mã lớp vẫn xem được dữ liệu như cũ).
const CHO_MUC_AN = {
  quy: '#thu-quy', 'thong-bao': '#thong-bao', 'thoi-khoa-bieu': '#thoi-khoa-bieu', 'diem-danh': '#trangDiemDanh',
};

// Website giờ phục vụ được nhiều lớp — mọi chỗ HTML tĩnh còn ghi cứng "10A7"/tên trường đều
// được ghi đè lại đúng theo lớp của phiên đang đăng nhập, để học sinh/giáo viên lớp khác không
// thấy nhầm thương hiệu của lớp 10A7.
function apDungThuongHieuLop(lop, phien) {
  if (!lop) return;
  const ten = lop.ten || 'Lớp học';
  const tenNgan = ten.replace(/^Lớp\s*/i, '');
  const truong = lop.truong || '';
  const namHoc = lop.namHoc || '';

  document.title = namHoc ? `${ten} · Năm học ${namHoc}` : ten;
  const hieuMaLop = $('#hieuMaLop'); if (hieuMaLop) hieuMaLop.textContent = tenNgan;
  // Badge năm học gắn ở góc huy hiệu lớp — viết tắt "26–27" cho gọn (thay vì "Năm học 2026 –
  // 2027" đầy đủ, quá dài cho một cái nhãn nhỏ ở góc icon), vẫn tự nhận diện đúng 2 năm dù sau
  // này đổi định dạng namHoc khác đi.
  const hieuNamHoc = $('#hieuNamHoc');
  if (hieuNamHoc) {
    const m = namHoc.match(/(\d{4})\s*[–-]\s*(\d{4})/);
    hieuNamHoc.textContent = m ? `${m[1].slice(2)}–${m[2].slice(2)}` : namHoc;
  }
  const hieuTenLop = $('#hieuTenLop'); if (hieuTenLop) hieuTenLop.textContent = ten;
  // Dòng phụ dưới tên lớp: hiện tài khoản đang đăng nhập (tên · tổ · chức vụ nếu có) — KHÔNG
  // lặp lại tên trường ở đây (đã hiện đủ ở đoạn giới thiệu bên dưới, nhắc lại là thừa).
  // Lưu ý: trước đây có 2 đoạn mã khác nhau cùng tranh nhau ghi vào đúng một chỗ này (một đoạn
  // ghi tài khoản, một đoạn ghi tên trường), ai chạy xong sau thì đoạn kia bị mất — chỉ còn
  // ĐÚNG MỘT nơi ghi vào đây để tránh lặp lại lỗi đó.
  const hieuTruong = $('#hieuTruong');
  if (hieuTruong) hieuTruong.textContent = phien ? layNhanTaiKhoan(phien) : (truong || 'Hệ thống lớp học');
  // "Đổi lớp chủ nhiệm" chỉ giáo viên chủ nhiệm mới có — tài khoản học sinh (dù thường hay
  // được cấp quyền) chỉ gắn với đúng một lớp nên nút này không có ý nghĩa gì với các em.
  const nutDoiLop = $('#nutDoiLop');
  if (nutDoiLop) nutDoiLop.hidden = !(phien && phien.role === 'teacher');
  const gioiThieuHinhAnh = $('#gioiThieuHinhAnh');
  if (gioiThieuHinhAnh) gioiThieuHinhAnh.textContent = 'Khoảnh khắc & kỷ niệm sinh hoạt của lớp.';

  veBannerLop(lop);
  const nutSuaBanner = $('#moDauNutSua');
  if (nutSuaBanner) {
    nutSuaBanner.hidden = !(phien && phien.role === 'teacher');
    if (!nutSuaBanner.dataset.daGan) {
      nutSuaBanner.dataset.daGan = '1';
      nutSuaBanner.addEventListener('click', () => moHopThoaiBannerLop(taiDuLieu));
    }
  }
}

/** Ảnh/video nền tuỳ chỉnh đầu trang lớp — ĐÚNG MỘT TRONG HAI (ưu tiên video nếu lỡ có cả
    hai, dù backend đã đảm bảo không xảy ra). Không có gì thì giữ nguyên nền màu mặc định. */
function veBannerLop(lop) {
  const oVideo = $('#moDauVideo');
  const oAnh = $('#moDauAnh');
  if (!oVideo || !oAnh) return;

  if (lop.bannerVideoId || lop.bannerVideoUrl) {
    oAnh.hidden = true;
    oAnh.removeAttribute('src');
    const src = lop.bannerVideoId ? '/api/thu-vien-tep?loai=video&id=' + lop.bannerVideoId : lop.bannerVideoUrl;
    if (oVideo.dataset.src !== src) {
      oVideo.dataset.src = src;
      oVideo.src = src;
    }
    oVideo.hidden = false;
  } else if (lop.bannerHinhKhoa || lop.bannerHinhUrl) {
    oVideo.hidden = true;
    oVideo.removeAttribute('src');
    oVideo.removeAttribute('data-src');
    oAnh.src = xuLyLinkHinh(lop.bannerHinhKhoa || lop.bannerHinhUrl);
    oAnh.hidden = false;
  } else {
    oVideo.hidden = true;
    oVideo.removeAttribute('src');
    oVideo.removeAttribute('data-src');
    oAnh.hidden = true;
    oAnh.removeAttribute('src');
  }
}

function apDungAnMuc(anMuc) {
  const bo = new Set(anMuc || []);
  anMucHienTai = bo;
  Object.entries(CHO_MUC_AN).forEach(([muc, chonLoc]) => {
    const khoi = document.querySelector(chonLoc);
    if (khoi) khoi.hidden = bo.has(muc);
  });
  // Gỡ luôn khỏi menu — mục nào bị ẩn thì không còn hiện trong danh sách "Menu" nữa,
  // không chỉ ẩn khối nội dung trên trang chủ.
  document.querySelectorAll('.menu-muc[data-muc]').forEach((a) => {
    a.hidden = bo.has(a.dataset.muc);
  });
}

async function taiDuLieu() {
  try {
    let maCaNhan = '';
    try { maCaNhan = localStorage.getItem('maCaNhan') || ''; } catch { /* bỏ qua */ }

    const [d, phien] = await Promise.all([
      api('/api/lop' + (maCaNhan ? '?ma=' + encodeURIComponent(maCaNhan) : '')),
      thongTinPhien ? Promise.resolve(thongTinPhien) : api('/api/whoami').catch(() => null),
    ]);
    thongTinPhien = phien;

    apDungThuongHieuLop(d.lop, phien);
    // Tài khoản KHÔNG gắn với một học sinh cụ thể (giáo viên chủ nhiệm, hoặc tài khoản phụ dạng
    // quản trị không ứng với em nào trong lớp) không có "chuyên cần cá nhân"/"đã đóng quỹ của
    // em" nào để xem ở trang này — chức năng Điểm danh/Thủ quỹ ĐẦY ĐỦ, mạnh hơn hẳn đã có sẵn
    // trong khu quản lý (⚙ Quản lý), lặp lại ở đây chỉ thừa và dễ nhầm tưởng phải làm ở cả hai
    // chỗ. Ẩn hẳn 2 mục này (nội dung lẫn mục trong Menu) CHỈ cho các tài khoản này — học sinh
    // thường và tài khoản phụ có gắn học sinh (vd lớp trưởng) vẫn thấy như cũ.
    const khongPhaiHocSinh = Boolean(phien) && phien.role !== 'student' && !phien.hocSinhId;
    const anMuc = khongPhaiHocSinh ? [...new Set([...(d.anMuc || []), 'diem-danh', 'quy'])] : (d.anMuc || []);
    apDungAnMuc(anMuc);
    const thongBaoHien = anMuc.includes('thong-bao') ? [] : d.thongBao;
    veOSo(d.lop.thongKe);
    veDiemNhan(thongBaoHien);
    veThongBao(thongBaoHien, phien, taiDuLieu);
    veThoiKhoaBieu(d.thoiKhoaBieu);
    veHoatDongLop(d.hoatDongLop, phien, taiDuLieu);
    veDanhSach(d.hocSinh, d.hocSinhAnMuc);
    veThuQuy(d.thuQuy || { tonQuy: 0, tongThu: 0, tongChi: 0, khoan: [] }, d.hocSinh, phien, d.hocSinhAnMuc);
    veLoiTatQuanLy(phien, taiDuLieu);
    ganNhacNen(d.nhacNen);
  } catch (err) {
    datNoiDung($('#dsThongBao'), khoiLoi('Không tải được dữ liệu lớp: ' + err.message));
  }
}

(async function () {
  await taiDuLieu();
  ganTheoDoiMuc();
  dinhTuyen();
})();

