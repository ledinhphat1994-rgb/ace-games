/* Trang lớp — học sinh xem. Toàn bộ dữ liệu lấy từ /api/lop.

   Trang chủ chỉ để bốn mục: sĩ số lớp, thông báo (đảm nhiệm luôn vai trò của "kế hoạch năm
   học" cũ qua mức độ quan trọng), thời khoá biểu, hình ảnh.
   Danh sách lớp và Thủ quỹ là hai "trang riêng" mở từ menu — cùng một tệp HTML,
   chỉ ẩn/hiện theo địa chỉ #/… nên không cần thêm trang mới và không cần tải lại. */
import { $, e, datNoiDung, api, homNay, ngayVN, ngayDayDu, tienVN, ganDoiGiaoDien, ganMenu, khoiLoi, layCacDongTaiKhoan, nhac, ganNhacNen, nhanMucDo, CAC_LOAI_CHI, ganTooltipNoi, giuViTriCuonKhiVe, khopTuKhoa, batDauTheoDoiPhien, nenAnhThanhBlob } from './chung.js';
import { nut, moHopThoai, dongHopThoai, boiNgayVN, oThongKe, truong, oNhap } from './giao-dien.js';
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
    if (hash === '#thoi-khoa-bieu') {
      window.commChuyenTab?.('about');
    } else if (hash === '#hinh-anh') {
      window.commChuyenTab?.('media');
    } else if (hash === '#thong-bao') {
      window.commChuyenTab?.('top');
    }
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
    // Ngưỡng nằm sát ngay mép thanh menu (chỉ +4px) khiến mục chỉ được tính "đang xem" khi đã
    // cuộn gần hết cả mục đó lên khỏi màn hình — trong khi mắt người đọc đã thấy rõ tiêu đề/nội
    // dung mục MỚI chiếm phần lớn màn hình từ lâu rồi, tạo cảm giác "đứng yên không nhảy màu".
    // Đẩy ngưỡng xuống khoảng 1/3 chiều cao màn hình để mục sáng lên đúng lúc mắt người dùng
    // thật sự đang nhìn vào nó, không phải đợi tới khi nó gần cuộn hết ra khỏi màn hình.
    const nguong = (thanh ? thanh.getBoundingClientRect().bottom : 0) + Math.max(80, window.innerHeight * 0.3);
    const cuoiTrang = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 2;

    let hienTai = muc[0];
    for (const x of muc) {
      if (x.phanTu.getBoundingClientRect().top <= nguong) hienTai = x;
    }
    // Cuộn hết trang mà mục CUỐI (vd "Hoạt động lớp" khi chưa có bài đăng nào, rất ngắn) vẫn
    // không tự thắng theo luật trên — vì đỉnh của nó không bao giờ chạm nổi ngưỡng khi trang
    // không đủ dài để cuộn tới đó. Trước đây hễ chạm đáy trang là ép nhảy thẳng sang mục cuối,
    // kể cả khi mục ĐANG thắng (vd "Thời khoá biểu") còn chiếm gần hết màn hình dưới thanh tab —
    // đúng lỗi "nhảy cóc bỏ qua mục giữa". Giờ chỉ ép chuyển khi mục đang thắng đã cuộn qua HẲN
    // (đáy của nó cũng vượt ngưỡng rồi), nghĩa là không còn gì của mục đó để xem nữa.
    if (cuoiTrang && hienTai !== muc[muc.length - 1]) {
      const daCuonQuaHan = hienTai.phanTu.getBoundingClientRect().bottom <= nguong;
      if (daCuonQuaHan) hienTai = muc[muc.length - 1];
    }

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
  const oSo = $('#oSo');
  if (!oSo || !Array.isArray(thongKe)) return;
  datNoiDung(oSo, ...thongKe.map((t) => {
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
  if (!$('#tkbApDung') && !$('#dauTkb')) return;
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
  const soThuTuTuKhoan = (k) => {
    if (Number.isFinite(k.kySo) && k.kySo > 0) return k.kySo;
    const m = /(?:tuần|tháng|kỳ|ky)\s*(\d+)/i.exec(k.ten || '');
    return m ? Number(m[1]) : Infinity;
  };
  const dsKhoanGoc = (tq.khoan || []).slice().sort((a, b) => {
    const soA = soThuTuTuKhoan(a);
    const soB = soThuTuTuKhoan(b);
    if (soA !== soB) return soA - soB;
    return (a.id || 0) - (b.id || 0);
  });
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
      dayLoc.classList.add('co-bon-muc');
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
      const timTheoTenKhoan = timKhoan && dsKhoanGoc.some((k) => khopTuKhoa(k.ten, timKhoan) || (k.dinhKyTen && khopTuKhoa(k.dinhKyTen, timKhoan)));
      const timTheoTenHs = Boolean(timKhoan) && !timTheoTenKhoan
        && dsHocSinh.some((h) => khopTuKhoa(h.hoTen, timKhoan));

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
            if (!khopTuKhoa(k.ten, timKhoan) && (!k.dinhKyTen || !khopTuKhoa(k.dinhKyTen, timKhoan))) return false;
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

      // Sắp xếp tăng dần: Tuần 1 → 2 → … → 35 lên đầu.
      // Trích số thứ tự từ tên khoản (Tuần X, Tháng X, Kỳ X…); khoản không có số thì xếp sau
      // cùng theo id tăng dần để giữ thứ tự tạo ban đầu.
      const soThuTuTuTen = (ten) => {
        const m = /(?:tuần|tháng|kỳ|ky)\s*(\d+)/i.exec(ten || '');
        return m ? Number(m[1]) : Infinity;
      };
      danhSachLoc = [...danhSachLoc].sort((a, b) => {
        const soA = soThuTuTuTen(a.ten);
        const soB = soThuTuTuTen(b.ten);
        if (soA !== soB) return soA - soB;        // tăng dần theo số tuần/tháng/kỳ
        return (a.id || 0) - (b.id || 0);          // fallback: id tăng dần
      });

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
        trai.append(e('h4', 'the-khoan-ten', tenThuSach));
        dau.append(trai);

        // Góc phải đầu thẻ: CHỈ dành cho học sinh đang xem đúng khoản của mình
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

        // VÙNG 2: Tuần X + ngày trên cùng 1 dòng, không có icon lịch
        const vung2 = e('div', 'the-khoan-vung2');

        // Hàng đầu vùng 2: Tuần X và 14/09–17/09 cùng 1 dòng
        let chuoiNgayNgan = '';
        if (k.ngayBatDau && k.ngayKetThuc) {
          const dinhDangNgayNgan = (iso) => {
            const p = (iso || '').split('-');
            return p.length >= 3 ? `${p[2]}/${p[1]}` : iso;
          };
          chuoiNgayNgan = `${dinhDangNgayNgan(k.ngayBatDau)}–${dinhDangNgayNgan(k.ngayKetThuc)}`;
        } else if (k.ngayBatDau) {
          const p = k.ngayBatDau.split('-');
          chuoiNgayNgan = `Từ ${p.length >= 3 ? p[2] + '/' + p[1] : k.ngayBatDau}`;
        } else {
          const m = /\(([^)]+\d+[/–-]\d+[^)]*)\)/.exec(k.ten);
          if (m) {
            chuoiNgayNgan = m[1].replace(/\/\d{4}/g, '').replace(/[()]/g, '').trim();
          }
        }

        if (soTuan || chuoiNgayNgan) {
          const hangTuanNgay = e('div', 'the-khoan-hang-tuan-ngay');
          if (soTuan) {
            hangTuanNgay.append(e('span', 'the-khoan-so-tuan', `Tuần ${soTuan}`));
          }
          if (chuoiNgayNgan) {
            hangTuanNgay.append(e('span', 'the-khoan-dong-ngay', chuoiNgayNgan));
          }
          vung2.append(hangTuanNgay);
        }

        const nhanHang = e('div', 'the-khoan-nhan-hang');
        nhanHang.append(e('span', 'tag-nhe', laDinhKy ? '🔁 Thu định kỳ' : '⚡ Thu linh động'));
        if (k.soTienMoiEm) {
          nhanHang.append(e('span', 'tag-nhe', `👤 ${tienVN(k.soTienMoiEm)}/em`));
        }
        vung2.append(nhanHang);
        the.append(vung2);

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
            if (timHs && !khopTuKhoa(h.hoTen, timHs)) return false;
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

              // Render Card cho Mobile:
              //  Hàng 1: [STT] [Tên] (trái) <-----------------> [Badge trạng thái] (sát bên phải)
              //  Dưới tên 1 hàng: Tag "Bạn" (nếu là chính mình)
              //  Hàng tiếp theo: Tiền đã nộp + Ngày

              const card = e('div', 'card-hs-dong' + (h.laChinhMinh ? ' dong-ban-than' : ''));

              // Hàng 1: STT + Tên (trái) <--------> Badge trạng thái (phải) — Căn đều chính giữa
              const cDau = e('div', 'card-hs-dong-dau');
              const cNhomTrai = e('div', 'card-hs-nhom-ten');
              const sttEl = e('span', 'stt-tron-hs', sttChu);
              const cTenHang = e('div', 'card-hs-ten-hang');
              cTenHang.append(e('b', 'ten-chu', h.hoTen));
              if (h.lopNghe && hienNgheThuQuy) {
                cTenHang.append(e('span', 'lop-nghe-nho', `· ${h.lopNghe}`));
              }
              cNhomTrai.append(sttEl, cTenHang);
              cDau.append(cNhomTrai);

              // Vùng 1: Badge trạng thái → sát bên phải cùng hàng với tên học sinh
              let badgeMobile;
              if (h.trangThai === 'da_du') {
                badgeMobile = e('span', 'nhan nhan-tot', '✓ Đã đủ');
              } else if (h.trangThai === 'dong_mot_phan') {
                badgeMobile = e('span', 'nhan nhan-luuy', 'Đóng thiếu');
              } else {
                badgeMobile = e('span', 'nhan nhan-xau', 'Chưa đóng');
              }
              cDau.append(badgeMobile);
              card.append(cDau);

              // Tag Bạn: nằm dưới tên học sinh 1 hàng (nếu là chính mình)
              if (h.laChinhMinh) {
                const cDongBan = e('div', 'card-hs-dong-ban');
                cDongBan.append(e('span', 'tag-ban', 'Bạn'));
                card.append(cDongBan);
              }

              // Hàng 2: Tiền đã nộp (xóa ngày nộp theo yêu cầu người dùng)
              const cThan = e('div', 'card-hs-dong-than');
              const cTien = e('div', 'card-hs-tien');
              cTien.append(e('span', 'nhan-muc', 'Đã nộp: '));
              if (h.daDong > 0) {
                cTien.append(Object.assign(e('b', null, tienVN(h.daDong)), { style: 'color:var(--tot)' }));
              } else {
                cTien.append(Object.assign(e('span', 'trong', '0 đ')));
              }
              cThan.append(cTien);
              if (h.ghiChu) {
                cThan.append(e('span', 'card-hs-gc', `📝 ${h.ghiChu}`));
              }

              card.append(cThan);
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

/* =========================================================================
   HỆ THỐNG GIAO DIỆN CỘNG ĐỒNG TWITTER / X COMMUNITIES (LỚP 10A7)
   Theo Hình 2 (Communities Feed) & Hình 1 (Post Composer)
   ========================================================================= */

function layThietBiId() {
  let id = '';
  try {
    id = localStorage.getItem('lop10a7_thiet_bi_id') || '';
    if (!id) {
      id = 'tb_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem('lop10a7_thiet_bi_id', id);
    }
  } catch {
    id = 'tb_guest';
  }
  return id;
}

function thoiGianTuongDoi(ngayStr) {
  if (!ngayStr) return 'vừa xong';
  let iso = String(ngayStr).trim();
  // Nếu là format SQLite: 'YYYY-MM-DD HH:MM:SS'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(iso)) {
    iso = iso.replace(' ', 'T') + 'Z';
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    // Chỉ có ngày (không có giờ)
    const homNay = new Date().toISOString().slice(0, 10);
    if (iso === homNay) return 'Hôm nay';
    return ngayVN(iso);
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return ngayStr;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return 'vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return ngayVN(iso.slice(0, 10));
}

function dinhDangHashtag(str) {
  if (!str) return '';
  return str.replace(/#([\w\u00C0-\u1EF9]+)/g, '<span class="tpc-hashtag">#$1</span>');
}

const BIEU_TUONG_CAM_XUC = {
  thich: { icon: '👍', ten: 'Thích', mau: '#1d9bf0' },
  tim: { icon: '❤️', ten: 'Yêu thích', mau: '#f91880' },
  haha: { icon: '😂', ten: 'Haha', mau: '#f59e0b' },
  wow: { icon: '😮', ten: 'Wow', mau: '#10b981' },
  buon: { icon: '😢', ten: 'Buồn', mau: '#6366f1' },
  phan_no: { icon: '😡', ten: 'Phẫn nộ', mau: '#ef4444' },
};

function formatSoLuong(num) {
  const n = parseInt(num, 10);
  if (!n || isNaN(n)) return '';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function taoCumIconCamXuc(cacLoaiArray, camXucCuaToi, tongCamXuc) {
  const cum = e('span', 'tpc-react-cluster');
  const dsLoai = Array.isArray(cacLoaiArray) ? [...new Set(cacLoaiArray.filter(Boolean))] : [];
  if (!dsLoai.length && camXucCuaToi) dsLoai.push(camXucCuaToi);

  if (dsLoai.length > 0) {
    dsLoai.slice(0, 3).forEach((k) => {
      if (BIEU_TUONG_CAM_XUC[k]) {
        cum.append(e('span', 'tpc-mini-icon', BIEU_TUONG_CAM_XUC[k].icon));
      }
    });
  } else {
    // Chưa có cảm xúc nào: dùng icon ❤️ mờ thể hiện "thả cảm xúc"
    cum.append(e('span', 'tpc-mini-icon tpc-mini-icon-empty', '🤍'));
  }

  const countSpan = e('span', 'tpc-count', tongCamXuc ? formatSoLuong(tongCamXuc) : '');
  return [cum, countSpan];
}

/** Hộp thoại chỉnh sửa một bài Hoạt động lớp */
function moHopThoaiSuaHoatDongLop(item, lamMoi) {
  const oTieuDe = oNhap('editHdLopTieuDe', 'text', item.tieuDe || '', 'Tiêu đề bài viết (tuỳ chọn)…');
  const oNoiDung = oNhap('editHdLopNoiDung', 'textarea', item.noiDung || item.chuThich || '', 'Nội dung bài viết…');
  oNoiDung.rows = 4;

  const oHinh = oNhap('editHdLopHinh', 'url', item.hinhUrl || '', 'https://… (Link ảnh JPG/PNG/WebP)');
  const oVideo = oNhap('editHdLopVideo', 'url', item.videoUrl || '', 'https://… (Link video YouTube / trực tiếp)');
  const oAmThanh = oNhap('editHdLopAmThanh', 'url', item.amThanhUrl || '', 'https://… (Link âm thanh MP3/M4A/WAV)');

  moHopThoai('Chỉnh sửa bài viết', [
    truong('Tiêu đề bài viết', oTieuDe),
    truong('Nội dung', oNoiDung),
    truong('Link hình ảnh', oHinh),
    truong('Link video', oVideo),
    truong('Link âm thanh', oAmThanh),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu bài viết', 'nut-chinh', async (ev) => {
      const btn = ev.currentTarget;
      const tieuDe = oTieuDe.value.trim();
      const noiDung = oNoiDung.value.trim();
      const hinhUrl = oHinh.value.trim();
      const videoUrl = oVideo.value.trim();
      const amThanhUrl = oAmThanh.value.trim();

      if (!noiDung && !tieuDe && !hinhUrl && !videoUrl && !amThanhUrl) {
        return nhac('Bài viết phải có ít nhất nội dung hoặc liên kết đính kèm.', 'xau');
      }

      btn.disabled = true;
      btn.textContent = 'Đang lưu…';
      try {
        await api('/api/gv/hoat-dong-lop', {
          method: 'PUT',
          than: {
            id: item.id,
            tieuDe,
            noiDung,
            hinhUrl: hinhUrl || null,
            videoUrl: videoUrl || null,
            amThanhUrl: amThanhUrl || null,
          },
        });
        dongHopThoai();
        nhac('Đã cập nhật bài viết thành công!', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Lưu bài viết';
        nhac(err.message, 'xau');
      }
    }),
  ]);
}

/** Vẽ 1 Thẻ Bài Đăng Chuẩn X / Twitter Communities (Hình 2) */
function veTheTwitterPost(item, phien, lamMoi) {
  const card = e('article', 'twitter-post-card');
  card.id = 'post-' + item.id;
  card.dataset.id = item.id;

  const laThongBao = Boolean(item.mucDo !== undefined || (item.tieuDe !== undefined && !item.anhId && !item.hinhUrl && !item.videoUrl && item.noiDung));
  const laGiaoVien = Boolean(phien && phien.role === 'teacher');
  const coQuyenQuanLy = Boolean(phien && (laGiaoVien || (phien.quyen || []).some((q) => ['hoat-dong-lop', 'hinh-anh', 'video', 'dang-bai', 'thong-bao'].includes(q))));

  // Avatar tác giả
  const avatarCol = e('div', 'tpc-avatar-col');
  const avatarImg = e('img', 'tpc-avatar-img');
  avatarImg.alt = 'Avatar';
  if (laThongBao || item.loai === 'thong_bao') {
    avatarImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="%231d9bf0"/><text x="50%" y="54%" font-size="22" text-anchor="middle" fill="%23fff" font-family="sans-serif" dy=".3em">👨‍🏫</text></svg>';
  } else {
    avatarImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="%238b5cf6"/><text x="50%" y="54%" font-size="22" text-anchor="middle" fill="%23fff" font-family="sans-serif" dy=".3em">🎓</text></svg>';
  }
  avatarCol.append(avatarImg);

  // Cột nội dung
  const contentCol = e('div', 'tpc-content-col');

  // Pinned Badge nếu có ghim
  if (item.ghim) {
    const pinBadge = e('div', 'tpc-pinned-badge');
    pinBadge.innerHTML = `<svg viewBox="0 0 24 24"><path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z"/></svg> Pinned by Community mods (GVCN & Ban Cán Sự)`;
    contentCol.append(pinBadge);
  }

  // Header tác giả: Tên + Tích xanh + Thời gian (ĐÃ XÓA VÙNG 3: authorHandle @...)
  const header = e('div', 'tpc-header');
  const authorInfo = e('div', 'tpc-author-info');

  const authorName = e('span', 'tpc-author-name', (laThongBao || item.loai === 'thong_bao') ? 'Thầy Lê Đình Phát (GVCN)' : 'Ban Cán Sự 10A7');
  const verifiedBadge = e('span', 'tpc-verified-badge');
  verifiedBadge.title = 'Tài khoản xác thực lớp 10A7';
  verifiedBadge.innerHTML = `<svg viewBox="0 0 24 24"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238 1.273 1.273 2.643 2.148 4.223 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.28 4.46l-4.24-4.24 1.41-1.41 2.83 2.83 6.36-6.36 1.41 1.41-7.77 7.77z"/></svg>`;
  const dot = e('span', 'tpc-dot', '·');
  // Giờ đăng chính xác: ưu tiên taoLuc, fallback ngay
  const timeText = e('span', 'tpc-time', thoiGianTuongDoi(item.taoLuc || item.ngay));

  // VÙNG 3: Đã xoá authorHandle (@lop10a7_official / @gvcn_10a7)
  authorInfo.append(authorName, verifiedBadge, dot, timeText);
  header.append(authorInfo);

  // VÙNG 2: Thêm nút Sửa (Edit) và Xoá (Delete)
  if (coQuyenQuanLy) {
    const actionsTop = e('div', 'tpc-actions-top');

    // Nút Sửa
    const btnEdit = e('button', 'tpc-post-edit-btn', '✏ Sửa');
    btnEdit.type = 'button';
    btnEdit.title = 'Chỉnh sửa bài viết';
    btnEdit.addEventListener('click', () => {
      if (laThongBao || item.loai === 'thong_bao') {
        moHopThoaiSuaThongBao(item, lamMoi);
      } else {
        moHopThoaiSuaHoatDongLop(item, lamMoi);
      }
    });

    // Nút Xoá
    const btnDelete = e('button', 'tpc-post-del-btn', '🗑 Xoá');
    btnDelete.type = 'button';
    btnDelete.title = 'Xoá bài viết';
    btnDelete.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc chắn muốn xoá bài viết này không? Thao tác này không thể hoàn tác.')) return;
      btnDelete.disabled = true;
      try {
        const endpoint = (laThongBao || item.loai === 'thong_bao')
          ? '/api/gv/thong-bao?id=' + item.id
          : '/api/gv/hoat-dong-lop?id=' + item.id;
        await api(endpoint, { method: 'DELETE' });
        nhac('Đã xoá bài viết thành công!', 'tot');
        card.remove();
        if (lamMoi) await lamMoi();
      } catch (err) {
        btnDelete.disabled = false;
        nhac(err.message, 'xau');
      }
    });

    actionsTop.append(btnEdit, btnDelete);
    header.append(actionsTop);
  }

  contentCol.append(header);


  // Tiêu đề bài viết
  const tieuDe = (item.tieuDe || '').trim();
  if (item.tieuDeHtml || tieuDe) {
    const h4 = e('h4', 'tpc-post-title');
    if (item.tieuDeHtml) h4.innerHTML = locHtmlNoiDung(item.tieuDeHtml);
    else h4.textContent = tieuDe;
    contentCol.append(h4);
  }

  // Nội dung bài viết kèm hashtag highlight
  const noiDung = item.noiDung || item.chuThich || '';
  if (item.noiDungHtml || noiDung) {
    const pBody = e('p', 'tpc-post-body');
    if (item.noiDungHtml) {
      pBody.innerHTML = dinhDangHashtag(locHtmlNoiDung(item.noiDungHtml));
    } else {
      pBody.innerHTML = dinhDangHashtag(noiDung.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    }
    contentCol.append(pBody);
  }

  // Media đính kèm (Ảnh / Video / Âm thanh)
  const coAnh = Boolean(item.anhKhoa || item.hinhUrl);
  const coVideo = Boolean(item.videoUrl || item.videoKhoa);
  const coAmThanh = Boolean(item.amThanhKhoa || item.amThanhUrl);

  if (coAnh || coVideo || coAmThanh) {
    const mediaBox = e('div', 'tpc-media-box');
    if (coAnh) {
      const srcAnh = xuLyLinkHinh(item.anhKhoa || item.hinhUrl);
      const img = e('img', 'tpc-media-img');
      img.src = srcAnh;
      img.alt = tieuDe || 'Ảnh hoạt động lớp';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('click', () => moXemAnh([{ src: srcAnh, chuThich: noiDung }], 0));
      mediaBox.append(img);
    }
    if (coVideo) {
      mediaBox.append(veKhoiVideoHoatDong(item));
    }
    if (coAmThanh) {
      const audio = e('audio');
      audio.controls = true;
      audio.preload = 'none';
      audio.src = xuLyLinkAmThanhHoatDong(item);
      mediaBox.append(audio);
    }
    contentCol.append(mediaBox);
  }

  // Action Bar chuẩn Twitter — ĐÃ XÓA REPOST, BOOKMARK, CHIA SẺ
  const actionBar = e('div', 'tpc-action-bar');

  // 1. Comment Button
  const btnComment = e('button', 'tpc-action-btn tpc-btn-comment');
  btnComment.type = 'button';
  btnComment.title = 'Bình luận / Trả lời';
  btnComment.innerHTML = `<svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-1.602.88 1.012 2.64c.267.7-.22 1.46-.968 1.46-.279 0-.54-.09-.76-.26l-3.92-3.08h-2.06c-4.421 0-8.006-3.58-8.006-8zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.32 2.688 6 6.005 6h2.52l.4.31 2.5 1.96-.64-1.68-.31-.8 1.02-.56c2.05-1.13 3.32-3.29 3.32-5.63 0-3.38-2.75-6.13-6.13-6.13H9.756z"/></svg><span class="tpc-count">${item.tongBinhLuan ? formatSoLuong(item.tongBinhLuan) : ''}</span>`;

  // 2. Reaction Wrapper + Floating Emoji Picker
  const reactWrapper = e('div', 'tpc-reaction-wrapper');
  const btnLike = e('button', 'tpc-action-btn tpc-btn-like' + (item.camXucCuaToi ? ' da-chon ' + item.camXucCuaToi : ''));
  btnLike.type = 'button';
  btnLike.title = 'Bày tỏ cảm xúc';

  const cacLoaiInit = item.cacLoaiCamXuc ? item.cacLoaiCamXuc.split(',').filter(Boolean) : [];
  datNoiDung(btnLike, ...taoCumIconCamXuc(cacLoaiInit, item.camXucCuaToi, item.tongCamXuc));

  // Floating Reactions Bar (👍 ❤️ 😂 😮 😢 😡)
  const floatBar = e('div', 'tpc-floating-reactions');
  Object.keys(BIEU_TUONG_CAM_XUC).forEach((loai) => {
    const opt = BIEU_TUONG_CAM_XUC[loai];
    const rBtn = e('button', 'tpc-react-item', opt.icon);
    rBtn.type = 'button';
    rBtn.title = opt.ten;
    rBtn.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      reactWrapper.classList.remove('mo-khay');
      try {
        const thietBiId = layThietBiId();
        const kq = await api('/api/bai-dang/tuong-tac', {
          method: 'POST',
          body: { baiDangId: item.id, loaiCamXuc: loai, thietBiId }
        });
        if (kq.ok && kq.camXuc) {
          const cx = kq.camXuc;
          const daChon = cx.daChon;
          btnLike.className = 'tpc-action-btn tpc-btn-like' + (daChon ? ' da-chon ' + daChon : '');
          const cacLoaiDaCo = Object.keys(cx.cacLoai || {}).filter(k => cx.cacLoai[k] > 0);
          datNoiDung(btnLike, ...taoCumIconCamXuc(cacLoaiDaCo, daChon, cx.tong));
        }
      } catch (err) { nhac(err.message, 'xau'); }
    });
    floatBar.append(rBtn);
  });

  // Chạm để bật/tắt khay cảm xúc
  btnLike.addEventListener('click', (ev) => {
    ev.stopPropagation();
    reactWrapper.classList.toggle('mo-khay');
  });

  reactWrapper.append(btnLike, floatBar);

  // 3. Views Button — Số liệu người xem chính xác, không dùng công thức nhân ảo
  const btnViews = e('div', 'tpc-action-btn tpc-btn-views');
  const soLuotXem = item.luotXem || 0;
  btnViews.title = `${soLuotXem} lượt xem`;
  btnViews.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg><span class="tpc-count">${soLuotXem ? formatSoLuong(soLuotXem) : '0'}</span>`;

  // Ghi nhận lượt xem thực tế 1 lần mỗi phiên
  const xemKey = 'xem_post_' + item.id;
  try {
    if (!sessionStorage.getItem(xemKey)) {
      sessionStorage.setItem(xemKey, '1');
      api('/api/bai-dang/tuong-tac?tangXem=' + item.id).catch(() => {});
    }
  } catch {}

  actionBar.append(btnComment, reactWrapper, btnViews);
  contentCol.append(actionBar);

  // 4. Comments Drawer (Khay Bình Luận hỗ trợ phân cấp Reply cha - con)
  const commentDrawer = e('div', 'tpc-comments-drawer');
  commentDrawer.hidden = true;
  const commentsList = e('div', 'tpc-comments-list');
  const commentForm = e('div', 'tpc-comment-form');
  const commentInput = e('input', 'tpc-comment-input');
  commentInput.placeholder = 'Viết bình luận của em… (cho tất cả học sinh)';
  const commentSendBtn = e('button', 'tpc-comment-send', 'Gửi');
  commentSendBtn.type = 'button';

  commentForm.append(commentInput, commentSendBtn);
  commentDrawer.append(commentsList, commentForm);
  contentCol.append(commentDrawer);

  let daTaiBinhLuan = false;
  async function napBinhLuan() {
    try {
      const thietBiId = layThietBiId();
      const kq = await api('/api/bai-dang/tuong-tac?baiDangId=' + item.id + '&thietBiId=' + encodeURIComponent(thietBiId));
      if (kq.ok && kq.binhLuan) {
        daTaiBinhLuan = true;
        const allComments = kq.binhLuan || [];
        if (!allComments.length) {
          datNoiDung(commentsList, e('p', 'trong', 'Chưa có bình luận nào. Hãy là người đầu tiên bình luận!'));
          return;
        }

        // Gom nhóm cha - con (Nested structure)
        const mapReplies = {};
        const rootComments = [];

        allComments.forEach((bl) => {
          if (!bl.traLoiId) {
            rootComments.push(bl);
          } else {
            if (!mapReplies[bl.traLoiId]) mapReplies[bl.traLoiId] = [];
            mapReplies[bl.traLoiId].push(bl);
          }
        });

        // Nếu có reply mồ côi (cha bị xoá), vẫn hiển thị
        allComments.forEach((bl) => {
          if (bl.traLoiId && !allComments.some(x => x.id === bl.traLoiId)) {
            rootComments.push(bl);
          }
        });

        function veMotBinhLuan(bl, laCon = false) {
          const wrapBl = e('div', 'tpc-comment-wrap');
          const itemBl = e('div', 'tpc-comment-item' + (laCon ? ' tpc-comment-child' : ''));
          const avtBl = e('img', 'tpc-comment-avatar');
          avtBl.src = bl.vaiTro === 'giao_vien'
            ? 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%231d9bf0"/><text x="50%" y="54%" font-size="16" text-anchor="middle" fill="%23fff" font-family="sans-serif" dy=".3em">👨‍🏫</text></svg>'
            : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%238b5cf6"/><text x="50%" y="54%" font-size="16" text-anchor="middle" fill="%23fff" font-family="sans-serif" dy=".3em">🎓</text></svg>';

          const bubbleBl = e('div', 'tpc-comment-bubble');
          const metaBl = e('div', 'tpc-comment-meta');
          const tenBl = e('span', 'tpc-comment-author', bl.nguoiDungTen);
          metaBl.append(tenBl);
          if (bl.vaiTro === 'giao_vien') metaBl.append(e('span', 'tpc-comment-role', 'GVCN'));
          else if (bl.vaiTro === 'can_bo') metaBl.append(e('span', 'tpc-comment-role', 'Cán bộ'));
          metaBl.append(e('span', 'tpc-comment-time', thoiGianTuongDoi(bl.taoLuc)));

          // Nút xoá nếu có quyền
          if (laGiaoVien || coQuyenQuanLy) {
            const nutXoaBl = e('button', 'tpc-comment-del', '✕');
            nutXoaBl.title = 'Xoá bình luận';
            nutXoaBl.addEventListener('click', async () => {
              if (!confirm('Xoá bình luận này?')) return;
              try {
                await api('/api/bai-dang/tuong-tac?id=' + bl.id, { method: 'DELETE' });
                wrapBl.remove();
                const cntSpan = btnComment.querySelector('.tpc-count');
                const cur = Math.max(0, (parseInt(cntSpan.textContent || '0', 10) || 1) - 1);
                cntSpan.textContent = cur ? formatSoLuong(cur) : '';
              } catch (err) { nhac(err.message, 'xau'); }
            });
            metaBl.append(nutXoaBl);
          }

          const textBl = e('p', 'tpc-comment-text', bl.noiDung);

          // Nút Trả lời (Reply)
          const btnReply = e('button', 'tpc-reply-action-btn', '↩ Trả lời');
          btnReply.type = 'button';

          bubbleBl.append(metaBl, textBl, btnReply);
          itemBl.append(avtBl, bubbleBl);
          wrapBl.append(itemBl);

          // Khung trả lời trực tiếp bên dưới (inline reply box)
          const replyBox = e('div', 'tpc-inline-reply-box');
          replyBox.hidden = true;
          const replyInput = e('input', 'tpc-inline-reply-input');
          replyInput.placeholder = `Trả lời ${bl.nguoiDungTen}…`;
          const replySend = e('button', 'tpc-inline-reply-btn', 'Gửi');
          replySend.type = 'button';
          const replyCancel = e('button', 'tpc-inline-reply-cancel', 'Huỷ');
          replyCancel.type = 'button';

          replyBox.append(replyInput, replySend, replyCancel);
          wrapBl.append(replyBox);

          btnReply.addEventListener('click', () => {
            replyBox.hidden = !replyBox.hidden;
            if (!replyBox.hidden) {
              replyInput.focus();
            }
          });

          replyCancel.addEventListener('click', () => {
            replyBox.hidden = true;
            replyInput.value = '';
          });

          async function guiReply() {
            const ndReply = replyInput.value.trim();
            if (!ndReply) return;
            replySend.disabled = true;
            try {
              const tbId = layThietBiId();
              const kqReply = await api('/api/bai-dang/tuong-tac', {
                method: 'PUT',
                body: {
                  baiDangId: item.id,
                  traLoiId: bl.id,
                  noiDung: ndReply,
                  thietBiId: tbId,
                }
              });
              if (kqReply.ok) {
                nhac('Đã trả lời bình luận!', 'tot');
                replyInput.value = '';
                replyBox.hidden = true;
                await napBinhLuan();
                const cntSpan = btnComment.querySelector('.tpc-count');
                const cur = (parseInt(cntSpan.textContent || '0', 10) || 0) + 1;
                cntSpan.textContent = formatSoLuong(cur);
              }
            } catch (err) {
              nhac(err.message, 'xau');
            } finally {
              replySend.disabled = false;
            }
          }

          replySend.addEventListener('click', guiReply);
          replyInput.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
              ev.preventDefault();
              guiReply();
            }
          });

          // Danh sách reply con (thụt lùi vào trong theo phân cấp)
          const replies = mapReplies[bl.id] || [];
          if (replies.length > 0) {
            const repliesList = e('div', 'tpc-replies-list');
            replies.forEach((subBl) => {
              repliesList.append(veMotBinhLuan(subBl, true));
            });
            wrapBl.append(repliesList);
          }

          return wrapBl;
        }

        datNoiDung(commentsList, ...rootComments.map(r => veMotBinhLuan(r, false)));
      }
    } catch { /* bỏ qua */ }
  }

  btnComment.addEventListener('click', () => {
    commentDrawer.hidden = !commentDrawer.hidden;
    if (!commentDrawer.hidden && !daTaiBinhLuan) {
      napBinhLuan();
    }
  });

  async function guiBinhLuan() {
    const nd = commentInput.value.trim();
    if (!nd) return;
    try {
      commentSendBtn.disabled = true;
      const thietBiId = layThietBiId();
      const kq = await api('/api/bai-dang/tuong-tac', {
        method: 'PUT',
        body: { baiDangId: item.id, noiDung: nd, thietBiId }
      });
      commentInput.value = '';
      commentSendBtn.disabled = false;
      if (kq.ok && kq.binhLuan) {
        nhac('Đã gửi bình luận!', 'tot');
        napBinhLuan();
        const cntSpan = btnComment.querySelector('.tpc-count');
        const currentCount = parseInt(cntSpan.textContent || '0', 10) || 0;
        cntSpan.textContent = formatSoLuong(currentCount + 1);
      }
    } catch (err) {
      commentSendBtn.disabled = false;
      nhac(err.message, 'xau');
    }
  }

  commentSendBtn.addEventListener('click', guiBinhLuan);
  commentInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      guiBinhLuan();
    }
  });

  card.append(avatarCol, contentCol);
  return card;
}

/** Khởi tạo slide-over danh sách thành viên khi bấm vào vùng 2 (Twitter Members style) */
function khoiTaoMembersPanel(d, phien) {
  const badgeBtn = $('#commMembersBadge');
  const panel = $('#membersPanel');
  const backdrop = $('#membersBackdrop');
  const closeBtn = $('#membersCloseBtn');
  const searchInput = $('#membersSearchInput');
  const tabAll = $('#membersTabAll');
  const tabMods = $('#membersTabMods');
  const listEl = $('#membersList');

  if (!panel || !badgeBtn) return;

  let tabHienTai = 'all'; // 'all' | 'mods'
  let tuKhoa = '';

  // Danh sách thành viên tổng hợp
  const dsThanhVien = [];

  // 1. Giáo viên chủ nhiệm (Admin)
  const tenGV = d.lop?.gvcn || 'Giáo viên chủ nhiệm';
  dsThanhVien.push({
    ten: tenGV,
    role: 'admin',
    roleLabel: 'Admin',
    sub: '@gvcn · Giáo viên chủ nhiệm',
    laMod: true,
    avatarChar: '👑',
    avatarBg: '#fef3c7',
    avatarColor: '#b45309',
  });

  // 2. Học sinh trong lớp
  (d.hocSinh || []).forEach((h, idx) => {
    const chucVu = (h.chucVu || '').trim();
    const laMod = Boolean(chucVu);
    const bgColors = ['#e0f2fe', '#f3e8ff', '#fce7f3', '#dcfce7', '#fef9c3'];
    const textColors = ['#0284c7', '#7e22ce', '#be185d', '#15803d', '#a16207'];
    const colorIdx = idx % bgColors.length;

    dsThanhVien.push({
      ten: h.hoTen || `Học sinh ${idx + 1}`,
      role: laMod ? 'mod' : 'member',
      roleLabel: laMod ? (chucVu.length <= 14 ? chucVu : 'Mod') : 'Member',
      sub: `@hs_${h.stt || idx + 1}${chucVu ? ' · ' + chucVu : ''}${h.lopNghe ? ' · ' + h.lopNghe : ''}`,
      laMod,
      avatarChar: (h.hoTen ? h.hoTen.trim().split(/\s+/).pop().charAt(0) : '🎓').toUpperCase(),
      avatarBg: bgColors[colorIdx],
      avatarColor: textColors[colorIdx],
      chiTiet: h,
    });
  });

  function veDanhSach() {
    if (!listEl) return;
    const q = tuKhoa.toLowerCase();
    const filtered = dsThanhVien.filter((m) => {
      if (tabHienTai === 'mods' && !m.laMod) return false;
      if (q && !m.ten.toLowerCase().includes(q) && !m.sub.toLowerCase().includes(q)) return false;
      return true;
    });

    if (!filtered.length) {
      listEl.innerHTML = '<div style="text-align:center;padding:32px 16px;color:var(--chu-nhat);font-size:14px;">Không tìm thấy thành viên nào.</div>';
      return;
    }

    listEl.innerHTML = '';
    filtered.forEach((m) => {
      const item = e('div', 'member-item');
      item.innerHTML = `
        <div class="member-avatar" style="background:${m.avatarBg};color:${m.avatarColor};">
          ${m.avatarChar}
        </div>
        <div class="member-info">
          <div class="member-name-row">
            <span class="member-name">${m.ten}</span>
            <span class="member-role-badge ${m.role}">${m.roleLabel}</span>
          </div>
          <div class="member-sub">${m.sub}</div>
        </div>
        <button class="member-action-btn" type="button">Chi tiết</button>
      `;

      item.querySelector('.member-action-btn')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (m.chiTiet) {
          nhac(`Học sinh: ${m.ten} • ${m.sub}`, 'tot');
        } else {
          nhac(`${m.ten} • Giáo viên chủ nhiệm`, 'tot');
        }
      });

      listEl.appendChild(item);
    });
  }

  function moPanel() {
    panel.classList.add('hien');
    backdrop.classList.add('hien');
    document.body.style.overflow = 'hidden';
    tuKhoa = '';
    if (searchInput) searchInput.value = '';
    veDanhSach();
  }

  function dongPanel() {
    panel.classList.remove('hien');
    backdrop.classList.remove('hien');
    document.body.style.overflow = '';
  }

  // Gắn sự kiện click vào badge thành viên vùng 2
  badgeBtn.onclick = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    moPanel();
  };

  closeBtn?.addEventListener('click', dongPanel);
  backdrop?.addEventListener('click', dongPanel);

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && panel.classList.contains('hien')) dongPanel();
  });

  tabAll?.addEventListener('click', () => {
    tabHienTai = 'all';
    tabAll.classList.add('active');
    tabMods?.classList.remove('active');
    veDanhSach();
  });

  tabMods?.addEventListener('click', () => {
    tabHienTai = 'mods';
    tabMods.classList.add('active');
    tabAll?.classList.remove('active');
    veDanhSach();
  });

  searchInput?.addEventListener('input', () => {
    tuKhoa = searchInput.value.trim();
    veDanhSach();
  });
}

/** Khởi tạo khung soạn bài thiết kế lại đơn giản, chuyên nghiệp (Ảnh | Video | Âm thanh | Emoji) */
function khoiTaoComposer(phien, lamMoi) {
  const comp = $('#commComposer');
  if (!comp) return;

  // Quyền: Giáo viên hoặc tài khoản phụ / học sinh có quyền đăng bài
  const duocDangBai = Boolean(phien && (
    phien.role === 'teacher' ||
    (phien.quyen || []).some(q => ['hoat-dong-lop', 'hinh-anh', 'video', 'dang-bai'].includes(q))
  ));

  if (!duocDangBai) {
    comp.hidden = true;
    return;
  }

  comp.hidden = false;

  const oNhap = $('#compInput');
  const nutDang = $('#compBtnDang');
  const boxPreview = $('#compPreviewBox');
  const imgPreview = $('#compPreviewImg');
  const vidPreview = $('#compPreviewVid');
  const audioPreview = $('#compPreviewAudio');
  const audioPlayer = $('#compAudioPlayer');
  const nutGoiPreview = $('#compPreviewRemove');

  // Media Picker Panel
  const pickerPanel = $('#compMediaPicker');
  const pickerTabs = $('#compPickerTabs');
  const panelMay = $('#compPanelMay');
  const panelThuVien = $('#compPanelThuVien');
  const panelLink = $('#compPanelLink');
  const fileInput = $('#compFileInput');
  const btnChonTep = $('#compBtnChonTep');
  const btnChonTepText = $('#compBtnChonTepText');
  const libGrid = $('#compLibGrid');
  const inputLinkUrl = $('#compInputLinkUrl');
  const emojiDrawer = $('#compEmojiDrawer');

  // Tool buttons
  const toolAnh = $('#compToolAnh');
  const toolVideo = $('#compToolVideo');
  const toolAmThanh = $('#compToolAmThanh');
  const toolEmoji = $('#compToolEmoji');

  // Active state
  let loaiMediaHienTai = null; // 'anh' | 'video' | 'am-thanh' | null
  let nguonHienTai = 'may'; // 'may' | 'thuvien' | 'link'

  // File / URL state
  let tepChon = null; // File object
  let blobPreviewUrl = null;
  let thuVienIdChon = null; // Number ID from library
  let linkUrlChon = null; // String URL

  function capNhatTrangThaiNut() {
    const coText = Boolean((oNhap?.value || '').trim());
    const coMedia = Boolean(tepChon || thuVienIdChon || linkUrlChon);
    if (nutDang) nutDang.disabled = !(coText || coMedia);
  }

  function xoaDinhKem() {
    if (blobPreviewUrl) {
      try { URL.revokeObjectURL(blobPreviewUrl); } catch {}
      blobPreviewUrl = null;
    }
    tepChon = null;
    thuVienIdChon = null;
    linkUrlChon = null;
    loaiMediaHienTai = null;

    if (fileInput) fileInput.value = '';
    if (inputLinkUrl) inputLinkUrl.value = '';

    if (imgPreview) { imgPreview.src = ''; imgPreview.hidden = true; }
    if (vidPreview) { vidPreview.src = ''; vidPreview.hidden = true; }
    if (audioPlayer) { audioPlayer.src = ''; }
    if (audioPreview) { audioPreview.hidden = true; }
    if (boxPreview) { boxPreview.hidden = true; }

    [toolAnh, toolVideo, toolAmThanh].forEach(b => b?.classList.remove('active'));
    if (pickerPanel) pickerPanel.hidden = true;
    capNhatTrangThaiNut();
  }

  nutGoiPreview?.addEventListener('click', xoaDinhKem);

  function datXemTruoc(loai, src) {
    if (!boxPreview) return;
    boxPreview.hidden = false;
    if (imgPreview) imgPreview.hidden = (loai !== 'anh');
    if (vidPreview) vidPreview.hidden = (loai !== 'video');
    if (audioPreview) audioPreview.hidden = (loai !== 'am-thanh');

    if (loai === 'anh' && imgPreview) imgPreview.src = src;
    if (loai === 'video' && vidPreview) vidPreview.src = src;
    if (loai === 'am-thanh' && audioPlayer) audioPlayer.src = src;
    capNhatTrangThaiNut();
  }

  function chuyenNguonPicker(nguon) {
    nguonHienTai = nguon;
    pickerTabs?.querySelectorAll('.composer-picker-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.nguon === nguon);
    });

    if (panelMay) panelMay.hidden = (nguon !== 'may');
    if (panelThuVien) panelThuVien.hidden = (nguon !== 'thuvien');
    if (panelLink) panelLink.hidden = (nguon !== 'link');

    if (nguon === 'thuvien') {
      taiDuLieuThuVien();
    } else if (nguon === 'link' && inputLinkUrl) {
      inputLinkUrl.focus();
    }
  }

  pickerTabs?.addEventListener('click', (ev) => {
    const tab = ev.target.closest('.composer-picker-tab');
    if (tab && tab.dataset.nguon) {
      chuyenNguonPicker(tab.dataset.nguon);
    }
  });

  async function taiDuLieuThuVien() {
    if (!libGrid) return;
    libGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--chu-nhat);font-size:13px;"><span class="quay" style="display:inline-block;width:18px;height:18px;vertical-align:middle;margin-right:6px;"></span>Đang tải thư viện…</div>';

    try {
      if (loaiMediaHienTai === 'video') {
        const d = await api('/api/gv/thu-vien-video');
        const ds = (d && d.danhSach) || [];
        if (!ds.length) {
          libGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--chu-nhat);font-size:13px;">Chưa có video nào trong thư viện lớp.</div>';
          return;
        }
        libGrid.innerHTML = '';
        ds.forEach((item) => {
          const card = e('div', 'composer-lib-item');
          card.title = item.ten || 'Video lớp';
          const videoSrc = item.url || `/api/gv/tep-video?id=${item.id}`;
          card.innerHTML = `<video src="${videoSrc}" preload="metadata" style="width:100%;height:100%;object-fit:cover;"></video><span style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.7);color:#fff;font-size:10px;padding:1px 4px;border-radius:3px;">▶</span>`;
          card.style.position = 'relative';
          card.addEventListener('click', () => {
            tepChon = null;
            thuVienIdChon = item.id;
            linkUrlChon = videoSrc;
            datXemTruoc('video', videoSrc);
            pickerPanel.hidden = true;
          });
          libGrid.appendChild(card);
        });
      } else if (loaiMediaHienTai === 'am-thanh') {
        const d = await api('/api/gv/thu-vien-am-thanh');
        const ds = (d && d.danhSach) || [];
        if (!ds.length) {
          libGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--chu-nhat);font-size:13px;">Chưa có bài âm thanh nào trong thư viện.</div>';
          return;
        }
        libGrid.innerHTML = '';
        ds.forEach((item) => {
          const card = e('div', 'composer-lib-audio-item');
          const audioSrc = item.url || `/api/gv/tep-am-thanh?id=${item.id}`;
          card.innerHTML = `
            <span class="composer-lib-audio-icon">🎵</span>
            <div style="flex:1;min-width:0;">
              <div class="composer-lib-audio-name">${item.ten || item.tenBai || 'Âm thanh'}</div>
              <small style="color:var(--chu-nhat);font-size:11px;">Chạm để chọn đính kèm</small>
            </div>
          `;
          card.addEventListener('click', () => {
            tepChon = null;
            thuVienIdChon = item.id;
            linkUrlChon = audioSrc;
            datXemTruoc('am-thanh', audioSrc);
            pickerPanel.hidden = true;
          });
          libGrid.appendChild(card);
        });
      } else {
        // Ảnh
        const d = await api('/api/gv/hoat-dong-lop');
        const ds = (d && d.hoatDong) || [];
        const dsAnh = ds.filter(x => x.anhKhoa || x.hinhUrl);
        if (!dsAnh.length) {
          libGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--chu-nhat);font-size:13px;">Chưa có ảnh nào trong thư viện lớp.</div>';
          return;
        }
        libGrid.innerHTML = '';
        dsAnh.forEach((item) => {
          const card = e('div', 'composer-lib-item');
          const src = item.anhKhoa ? `/api/gv/hoat-dong-lop-tep?id=${item.anhKhoa}` : item.hinhUrl;
          card.innerHTML = `<img src="${src}" alt="Ảnh" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`;
          card.addEventListener('click', () => {
            tepChon = null;
            thuVienIdChon = item.anhKhoa || null;
            linkUrlChon = src;
            datXemTruoc('anh', src);
            pickerPanel.hidden = true;
          });
          libGrid.appendChild(card);
        });
      }
    } catch (err) {
      libGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--xau);font-size:13px;">Lỗi tải: ${err.message}</div>`;
    }
  }

  function moPickerChoLoai(loai) {
    if (emojiDrawer) emojiDrawer.hidden = true;

    if (loaiMediaHienTai === loai && !pickerPanel.hidden) {
      pickerPanel.hidden = true;
      return;
    }

    loaiMediaHienTai = loai;
    pickerPanel.hidden = false;

    // Cập nhật nhãn và accept
    if (loai === 'anh') {
      if (fileInput) fileInput.accept = 'image/*';
      if (btnChonTepText) btnChonTepText.textContent = 'Chọn ảnh từ thiết bị (JPG, PNG, WebP)';
      if (inputLinkUrl) inputLinkUrl.placeholder = 'Dán link ảnh trực tiếp: JPG, PNG, WebP, GIF (https://...)';
    } else if (loai === 'video') {
      if (fileInput) fileInput.accept = 'video/*';
      if (btnChonTepText) btnChonTepText.textContent = 'Chọn video từ thiết bị (MP4, WebM, MOV)';
      if (inputLinkUrl) inputLinkUrl.placeholder = 'Dán link YouTube, Google Drive, hoặc file video trực tiếp (.mp4)...';
    } else if (loai === 'am-thanh') {
      if (fileInput) fileInput.accept = 'audio/*';
      if (btnChonTepText) btnChonTepText.textContent = 'Chọn file âm thanh từ thiết bị (MP3, M4A, WAV)';
      if (inputLinkUrl) inputLinkUrl.placeholder = '🔗 Link file âm thanh trực tiếp: MP3, M4A, WAV (KHÔNG nhận YouTube)';
    }

    chuyenNguonPicker(nguonHienTai);
  }

  toolAnh?.addEventListener('click', () => moPickerChoLoai('anh'));
  toolVideo?.addEventListener('click', () => moPickerChoLoai('video'));
  toolAmThanh?.addEventListener('click', () => moPickerChoLoai('am-thanh'));

  btnChonTep?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (loaiMediaHienTai === 'video' && file.size > 50_000_000) {
      return nhac('Video vượt quá 50 MB, vui lòng chọn video nhỏ hơn hoặc dùng link YouTube.', 'xau');
    }
    if (loaiMediaHienTai === 'am-thanh' && file.size > 15_000_000) {
      return nhac('Âm thanh vượt quá 15 MB, vui lòng chọn file nhỏ hơn hoặc dùng link.', 'xau');
    }

    tepChon = file;
    thuVienIdChon = null;
    linkUrlChon = null;

    if (blobPreviewUrl) URL.revokeObjectURL(blobPreviewUrl);
    blobPreviewUrl = URL.createObjectURL(file);

    datXemTruoc(loaiMediaHienTai, blobPreviewUrl);
    pickerPanel.hidden = true;
    nhac(`Đã chọn: ${file.name}`, 'tot');
  });

  inputLinkUrl?.addEventListener('input', () => {
    const url = (inputLinkUrl.value || '').trim();
    if (!url) return;

    // Âm thanh KHÔNG được nhận YouTube link — YouTube chỉ dành cho Video
    if (loaiMediaHienTai === 'am-thanh') {
      if (idYoutube(url) || /youtube\.com|youtu\.be/i.test(url)) {
        nhac('⚠️ Âm thanh không hỗ trợ YouTube. Vui lòng dán link file âm thanh trực tiếp (MP3, M4A, WAV).', 'xau');
        inputLinkUrl.value = '';
        linkUrlChon = null;
        return;
      }
    }

    linkUrlChon = url;
    tepChon = null;
    thuVienIdChon = null;

    if (loaiMediaHienTai === 'video') {
      const maYt = idYoutube(url);
      if (maYt) {
        datXemTruoc('video', `https://img.youtube.com/vi/${maYt}/hqdefault.jpg`);
      } else {
        datXemTruoc('video', url);
      }
    } else if (loaiMediaHienTai === 'anh') {
      // Ảnh: chỉ nhận URL ảnh trực tiếp, không nhận YouTube
      if (idYoutube(url) || /youtube\.com|youtu\.be/i.test(url)) {
        nhac('⚠️ Ảnh không hỗ trợ YouTube. Vui lòng dán link ảnh trực tiếp (JPG, PNG, WebP).', 'xau');
        inputLinkUrl.value = '';
        linkUrlChon = null;
        return;
      }
      datXemTruoc(loaiMediaHienTai, url);
    } else {
      datXemTruoc(loaiMediaHienTai, url);
    }
  });

  // Khay Emoji
  const EMOJIS = ['😀', '😂', '🥰', '😎', '🥳', '🤔', '👍', '👏', '🔥', '✨', '🎉', '❤️', '💙', '⭐', '📚', '🎓', '📝', '💯', '🏆', '☕', '🌸', '🍀', '🎵', '🎮'];
  if (emojiDrawer) {
    emojiDrawer.innerHTML = EMOJIS.map(e => `<button class="composer-emoji-item" type="button">${e}</button>`).join('');
    emojiDrawer.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.composer-emoji-item');
      if (btn && oNhap) {
        oNhap.value += btn.textContent;
        oNhap.focus();
        capNhatTrangThaiNut();
      }
    });
  }

  toolEmoji?.addEventListener('click', () => {
    if (pickerPanel) pickerPanel.hidden = true;
    if (emojiDrawer) emojiDrawer.hidden = !emojiDrawer.hidden;
  });

  if (oNhap) {
    oNhap.addEventListener('input', () => {
      oNhap.style.height = 'auto';
      oNhap.style.height = Math.min(220, Math.max(54, oNhap.scrollHeight)) + 'px';
      capNhatTrangThaiNut();
    });
  }

  // Nút Post
  nutDang?.addEventListener('click', async () => {
    const nd = (oNhap?.value || '').trim();
    if (!nd && !tepChon && !thuVienIdChon && !linkUrlChon) return;

    try {
      nutDang.disabled = true;
      nutDang.textContent = 'Đang đăng…';

      let anhId = null, videoId = null, amThanhId = null;
      let hinhUrl = null, videoUrl = null, amThanhUrl = null;

      // 1. Tải tệp từ máy lên (nếu có)
      if (tepChon) {
        nutDang.textContent = 'Đang tải tệp…';
        if (loaiMediaHienTai === 'anh') {
          const blob = await nenAnhThanhBlob(tepChon);
          const res = await api('/api/gv/hoat-dong-lop-tep?loai=anh', {
            method: 'POST',
            headers: { 'Content-Type': 'image/jpeg' },
            body: blob
          });
          anhId = res.id;
        } else if (loaiMediaHienTai === 'video') {
          const buf = await tepChon.arrayBuffer();
          const res = await api('/api/gv/hoat-dong-lop-tep?loai=video', {
            method: 'POST',
            headers: { 'Content-Type': tepChon.type || 'video/mp4' },
            body: buf
          });
          videoId = res.id;
        } else if (loaiMediaHienTai === 'am-thanh') {
          const buf = await tepChon.arrayBuffer();
          const res = await api('/api/gv/hoat-dong-lop-tep?loai=am-thanh', {
            method: 'POST',
            headers: { 'Content-Type': tepChon.type || 'audio/mpeg' },
            body: buf
          });
          amThanhId = res.id;
        }
      } else if (thuVienIdChon) {
        if (loaiMediaHienTai === 'anh') anhId = thuVienIdChon;
        else if (loaiMediaHienTai === 'video') videoId = thuVienIdChon;
        else if (loaiMediaHienTai === 'am-thanh') amThanhId = thuVienIdChon;
      } else if (linkUrlChon) {
        if (loaiMediaHienTai === 'anh') hinhUrl = linkUrlChon;
        else if (loaiMediaHienTai === 'video') videoUrl = linkUrlChon;
        else if (loaiMediaHienTai === 'am-thanh') amThanhUrl = linkUrlChon;
      }

      nutDang.textContent = 'Đang lưu…';
      await api('/api/gv/hoat-dong-lop', {
        method: 'POST',
        than: {
          noiDung: nd,
          anhId,
          videoId,
          amThanhId,
          hinhUrl,
          videoUrl,
          amThanhUrl,
          ngay: new Date().toISOString().slice(0, 10),
        },
      });

      nhac('Đã đăng bài lên bảng tin cộng đồng!', 'tot');
      if (oNhap) {
        oNhap.value = '';
        oNhap.style.height = '54px';
      }
      xoaDinhKem();
      nutDang.textContent = 'Post';
      if (lamMoi) await lamMoi();
    } catch (err) {
      nutDang.disabled = false;
      nutDang.textContent = 'Post';
      nhac(err.message, 'xau');
    }
  });
}

/** Master Renderer cho toàn bộ Twitter / X Communities (Lớp 10A7) */
function veTwitterCommunities(d, phien, lamMoi) {
  // 1. Cập nhật Profile Cộng đồng
  const tenLop = d.lop?.ten || 'Lớp 10A7';
  if ($('#commTenLop')) $('#commTenLop').textContent = tenLop;
  if ($('#commBio')) {
    $('#commBio').textContent = d.lop?.gioiThieu || `Trung tâm GDNN - GDTX Huyện Định Quán · Niên khóa ${d.lop?.namHoc || '2026 – 2027'}`;
  }
  if ($('#commSoLuongThanhVien')) {
    $('#commSoLuongThanhVien').textContent = (d.hocSinh || []).length || 42;
  }

  // Avatar stack: lấy 4 học sinh đầu tiên
  const stack = $('#commAvatarStack');
  if (stack) {
    const hsList = (d.hocSinh || []).slice(0, 4);
    datNoiDung(stack, ...hsList.map((h, i) => {
      const avt = e('img', 'community-stack-avatar');
      avt.alt = h.hoTen;
      avt.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="${['%231d9bf0','%238b5cf6','%23ec4899','%2310b981'][i % 4]}"/><text x="50%" y="54%" font-size="14" text-anchor="middle" fill="%23fff" font-family="sans-serif" dy=".3em">${h.hoTen ? h.hoTen.charAt(0) : '🎓'}</text></svg>`;
      return avt;
    }));
  }

  // Slide-over danh sách thành viên (centered modal)
  khoiTaoMembersPanel(d, phien);

  // Nút Chỉnh sửa thông tin lớp — chỉ hiện với giáo viên
  const nutSuaThongTin = $('#commBtnSuaThongTin');
  if (nutSuaThongTin) {
    const laGiaoVien = Boolean(phien && phien.role === 'teacher');
    nutSuaThongTin.hidden = !laGiaoVien;
    if (laGiaoVien && !nutSuaThongTin.dataset.daGan) {
      nutSuaThongTin.dataset.daGan = '1';
      nutSuaThongTin.addEventListener('click', async () => {
        const lopHienTai = d.lop || {};
        const oTen = oNhap('editTenLop', 'text', lopHienTai.ten || '', 'VD: Lớp 10A7');
        const oNamHoc = oNhap('editNamHoc', 'text', lopHienTai.namHoc || '', 'VD: 2026 – 2027');
        const oTruong = oNhap('editTruong', 'text', lopHienTai.truong || '', 'VD: Trung tâm GDNN - GDTX Huyện Định Quán');
        const oGioiThieu = oNhap('editGioiThieu', 'textarea', lopHienTai.gioiThieu || '', 'Mô tả ngắn về lớp…');
        oGioiThieu.rows = 3;

        moHopThoai('Chỉnh sửa thông tin lớp', [
          truong('Tên lớp', oTen),
          truong('Niên khóa', oNamHoc),
          truong('Trường / Trung tâm', oTruong),
          truong('Giới thiệu / Bio', oGioiThieu),
        ], [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Lưu thay đổi', 'nut-chinh', async (ev) => {
            const nutBam = ev.currentTarget;
            const tenMoi = oTen.value.trim();
            if (!tenMoi) return nhac('Tên lớp không được để trống.', 'xau');
            nutBam.disabled = true;
            nutBam.textContent = 'Đang lưu…';
            try {
              await api('/api/gv/thong-tin-lop', {
                method: 'POST',
                than: {
                  ten: tenMoi,
                  namHoc: oNamHoc.value.trim(),
                  truong: oTruong.value.trim(),
                  gioiThieu: oGioiThieu.value.trim(),
                },
              });
              dongHopThoai();
              nhac('Đã cập nhật thông tin lớp!', 'tot');
              if (lamMoi) await lamMoi();
            } catch (err) {
              nutBam.disabled = false;
              nutBam.textContent = 'Lưu thay đổi';
              nhac(err.message, 'xau');
            }
          }),
        ]);
      });
    }
  }

  // Khởi tạo khung soạn bài thiết kế mới
  khoiTaoComposer(phien, lamMoi);

  // 2. Chuyển đổi giữa 4 Tabs Twitter
  const tabBtns = document.querySelectorAll('#commNavTabs .community-tab-item');
  const panes = {
    top: $('#commPaneTop'),
    latest: $('#commPaneLatest'),
    media: $('#commPaneMedia'),
    about: $('#commPaneAbout'),
  };

  function chuyenTab(tabKey) {
    tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabKey));
    Object.keys(panes).forEach((k) => {
      if (panes[k]) panes[k].hidden = k !== tabKey;
    });
  }
  window.commChuyenTab = chuyenTab;

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => chuyenTab(btn.dataset.tab));
  });

  $('#commBtnKhamPha')?.addEventListener('click', () => chuyenTab('media'));

  // 3. Tab Top: Thông báo ghim & bài hoạt động nổi bật
  const feedTop = $('#feedTop');
  if (feedTop) {
    const dsGhim = [
      ...(d.thongBao || []).filter(t => t.ghim || t.noiBat),
      ...(d.hoatDongLop || []).slice(0, 8)
    ];
    if (!dsGhim.length) {
      datNoiDung(feedTop, e('p', 'trong', 'Chưa có bài viết hoặc thông báo nổi bật nào được ghim.'));
    } else {
      datNoiDung(feedTop, ...dsGhim.map(item => veTheTwitterPost(item, phien, lamMoi)));
    }
  }

  // 4. Tab Latest: Toàn bộ bài đăng theo thứ tự mới nhất
  const feedLatest = $('#feedLatest');
  if (feedLatest) {
    const dsLatest = [...(d.hoatDongLop || []), ...(d.thongBao || [])].sort((a, b) => {
      return (b.ngay || '').localeCompare(a.ngay || '');
    });
    if (!dsLatest.length) {
      datNoiDung(feedLatest, e('p', 'trong', 'Chưa có bài đăng nào trong dòng thời gian.'));
    } else {
      datNoiDung(feedLatest, ...dsLatest.map(item => veTheTwitterPost(item, phien, lamMoi)));
    }
  }

  // 5. Tab Media: Lưới ảnh & video hoạt động
  const feedMedia = $('#feedMedia');
  if (feedMedia) {
    const dsMedia = [...(d.hoatDongLop || []), ...(d.thongBao || [])].filter(x => x.anhKhoa || x.hinhUrl || x.videoUrl || x.videoKhoa);
    if (!dsMedia.length) {
      datNoiDung(feedMedia, e('p', 'trong', 'Chưa có hình ảnh hoặc video hoạt động nào được tải lên.'));
    } else {
      datNoiDung(feedMedia, ...dsMedia.map(item => {
        const tile = e('div', 'community-media-item');
        if (item.videoUrl || item.videoKhoa) {
          const badge = e('span', 'community-media-type-badge', '🎬 Video');
          const maYt = idYoutube(item.videoUrl);
          if (maYt) {
            const img = e('img');
            img.src = `https://img.youtube.com/vi/${maYt}/hqdefault.jpg`;
            img.loading = 'lazy';
            tile.append(img, badge);
          } else {
            tile.append(badge);
          }
          tile.addEventListener('click', () => {
            if (item.videoUrl) window.open(item.videoUrl, '_blank');
          });
        } else {
          const src = xuLyLinkHinh(item.anhKhoa || item.hinhUrl);
          const img = e('img');
          img.src = src;
          img.loading = 'lazy';
          tile.append(img);
          tile.addEventListener('click', () => moXemAnh([{ src, chuThich: item.tieuDe || item.chuThich || '' }], 0));
        }
        return tile;
      }));
    }
  }

  // 6. Tab About: Giới thiệu lớp (Text + Hình ảnh + Âm thanh + Video)
  veTabAbout(d.about, phien, lamMoi);

  // Điều hướng hash anchor tự chuyển tab
  const hash = location.hash;
  if (hash === '#thoi-khoa-bieu') {
    chuyenTab('about');
  } else if (hash === '#hinh-anh') {
    chuyenTab('media');
  } else if (hash === '#thong-bao') {
    chuyenTab('top');
  }
}

/** Hiển thị nội dung Tab About (Văn bản + Hình ảnh + Video + Âm thanh) */
function veTabAbout(aboutData, phien, lamMoi) {
  const card = $('#commAboutCard');
  if (!card) return;

  const textEl = $('#commAboutText');
  const imgWrap = $('#commAboutImageWrap');
  const imgEl = $('#commAboutImage');
  const vidWrap = $('#commAboutVideoWrap');
  const vidContainer = $('#commAboutVideoContainer');
  const audioWrap = $('#commAboutAudioWrap');
  const audioEl = $('#commAboutAudio');
  const emptyEl = $('#commAboutEmpty');
  const btnSua = $('#commBtnSuaAbout');

  const laGiaoVien = phien?.role === 'teacher';
  if (btnSua) {
    btnSua.hidden = !laGiaoVien;
    if (laGiaoVien && !btnSua.dataset.daGan) {
      btnSua.dataset.daGan = '1';
      btnSua.addEventListener('click', () => {
        moHopThoaiSuaAbout(aboutData, lamMoi);
      });
    }
  }

  const vanBan = (aboutData?.vanBan || '').trim();
  const anhSrc = aboutData?.anhKhoa ? xuLyLinkHinh(aboutData.anhKhoa) : (aboutData?.hinhUrl || '');
  const videoSrc = aboutData?.videoUrl || '';
  const amThanhSrc = aboutData?.amThanhKhoa ? ('/api/thu-vien-tep?loai=am-thanh&id=' + encodeURIComponent(aboutData.amThanhId)) : (aboutData?.amThanhUrl || '');

  let coDuLieu = false;

  // 1. Văn bản
  if (vanBan && textEl) {
    textEl.textContent = vanBan;
    textEl.hidden = false;
    coDuLieu = true;
  } else if (textEl) {
    textEl.hidden = true;
  }

  // 2. Hình ảnh
  if (anhSrc && imgWrap && imgEl) {
    imgEl.src = anhSrc;
    imgWrap.hidden = false;
    imgEl.onclick = () => moXemAnh([{ src: anhSrc, chuThich: vanBan || 'Ảnh giới thiệu lớp' }], 0);
    coDuLieu = true;
  } else if (imgWrap) {
    imgWrap.hidden = true;
  }

  // 3. Video
  if (videoSrc && vidWrap && vidContainer) {
    vidWrap.hidden = false;
    vidContainer.innerHTML = '';
    const maYt = idYoutube(videoSrc);
    if (maYt) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${maYt}`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      vidContainer.append(iframe);
    } else {
      const vid = document.createElement('video');
      vid.controls = true;
      vid.playsInline = true;
      vid.preload = 'metadata';
      vid.src = videoSrc;
      vidContainer.append(vid);
    }
    coDuLieu = true;
  } else if (vidWrap) {
    vidWrap.hidden = true;
  }

  // 4. Âm thanh
  if (amThanhSrc && audioWrap && audioEl) {
    audioEl.src = amThanhSrc;
    audioWrap.hidden = false;
    coDuLieu = true;
  } else if (audioWrap) {
    audioWrap.hidden = true;
  }

  // 5. Trạng thái trống
  if (emptyEl) {
    emptyEl.hidden = coDuLieu;
    if (laGiaoVien && !coDuLieu) {
      emptyEl.innerHTML = '<p>Chưa có thông tin giới thiệu về lớp.<br><small style="color:var(--chinh);cursor:pointer;" id="commAboutEmptyLink">👉 Bấm vào đây hoặc nút "Chỉnh sửa" ở trên để thêm nội dung</small></p>';
      $('#commAboutEmptyLink')?.addEventListener('click', () => moHopThoaiSuaAbout(aboutData, lamMoi));
    }
  }
}

/** Hộp thoại chỉnh sửa thông tin Tab About của lớp */
function moHopThoaiSuaAbout(aboutData, lamMoi) {
  const hienTai = aboutData || {};
  const oVanBan = oNhap('aboutVanBan', 'textarea', hienTai.vanBan || '', 'Nhập nội dung giới thiệu lớp (truyền thống, kỷ niệm, thông điệp, quy định...)');
  oVanBan.rows = 6;

  const oHinhUrl = oNhap('aboutHinhUrl', 'url', hienTai.hinhUrl || '', 'Dán link ảnh trực tiếp (https://...)');
  const oVideoUrl = oNhap('aboutVideoUrl', 'url', hienTai.videoUrl || '', 'Dán link YouTube (https://youtu.be/... hoặc link video trực tiếp)');
  const oAmThanhUrl = oNhap('aboutAmThanhUrl', 'url', hienTai.amThanhUrl || '', 'Dán link file âm thanh trực tiếp (https://... .mp3)');

  moHopThoai('Chỉnh sửa Tab About của lớp', [
    truong('Nội dung văn bản giới thiệu', oVanBan),
    truong('Hình ảnh giới thiệu (Link ảnh)', oHinhUrl, 'Dán link ảnh trực tiếp (JPEG, PNG, WebP)'),
    truong('Video giới thiệu (YouTube / Link video)', oVideoUrl, 'Hỗ trợ link YouTube shorts/watch hoặc file mp4 trực tiếp'),
    truong('Âm thanh / Bài hát của lớp (Link audio)', oAmThanhUrl, 'Hỗ trợ file âm thanh mp3, m4a, wav'),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu thông tin', 'nut-chinh', async (ev) => {
      const nutBam = ev.currentTarget;
      nutBam.disabled = true;
      nutBam.textContent = 'Đang lưu…';
      try {
        await api('/api/gv/thong-tin-about', {
          method: 'POST',
          than: {
            vanBan: oVanBan.value.trim(),
            hinhUrl: oHinhUrl.value.trim(),
            videoUrl: oVideoUrl.value.trim(),
            amThanhUrl: oAmThanhUrl.value.trim(),
            anhId: hienTai.anhId || null,
            videoId: hienTai.videoId || null,
            amThanhId: hienTai.amThanhId || null,
          },
        });
        dongHopThoai();
        nhac('Đã cập nhật thông tin Tab About thành công!', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) {
        nutBam.disabled = false;
        nutBam.textContent = 'Lưu thông tin';
        nhac(err.message, 'xau');
      }
    }),
  ]);
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
      // "day-loc-deu-co-gian" để các nút TỰ CHIA ĐỀU hết chiều ngang khi hàng này xuống dòng
      // riêng trên điện thoại (trước đây chỉ "margin-left:auto" nên các nút dồn về một phía,
      // thừa hẳn nửa hàng bên kia — đúng lỗi "card chưa đều so với màn hình").
      vungThaoTac = e('div', 'khu-thao-tac-muc day-loc-deu-co-gian');
      vungThaoTac.style.marginLeft = 'auto';
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

        const tdStt = e('td', null, String(h.soThuTu ?? h.id));
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
  quy: '#thu-quy', 'thoi-khoa-bieu': '#thoi-khoa-bieu', 'diem-danh': '#trangDiemDanh',
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
  // Hiển thị mã lớp (10A7) trong logo huy hiệu
  const hieuMaLop = $('#hieuMaLop'); if (hieuMaLop) { hieuMaLop.textContent = tenNgan; hieuMaLop.hidden = false; }
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
  // Tài khoản: icon TÁCH RIÊNG khỏi chữ + xuống 2 DÒNG (tên, rồi chức vụ/tổ) — giống hệt cách
  // đang làm ở khu quản lý (xem giao-vien/app.js) — trước đây gộp chung 1 dòng nối bằng "·",
  // trên điện thoại hẹp dễ vỡ chữ giữa dòng và dấu "·" trông như một dấu chấm lạc lõng.
  const hieuTruong = $('#hieuTruong');
  if (hieuTruong) {
    if (phien) {
      const { icon, dong } = layCacDongTaiKhoan(phien);
      const boc = datNoiDung(e('span', 'hieu-phu-dong-boc'), ...dong.map((d) => e('span', 'hieu-phu-dong', d)));
      datNoiDung(hieuTruong, e('span', 'hieu-phu-icon', icon), boc);
    } else {
      // Tên trường hiện 2 dòng căn đều:
      // Dòng 1: tên đầy đủ của trung tâm (ưu tiên từ DB), Dòng 2: địa chỉ hành chính.
      // Nếu truong có dấu " - " hoặc ", " thì tách tự động, không thì dùng 2 hằng mặc định.
      let dong1, dong2;
      if (truong) {
        const sep = truong.includes(' - ') ? ' - ' : (truong.includes(', ') ? ', ' : null);
        if (sep) {
          const parts = truong.split(sep);
          dong1 = parts[0].trim();
          dong2 = parts.slice(1).join(sep).trim();
        } else {
          dong1 = truong;
          dong2 = '';
        }
      } else {
        dong1 = 'Trung tâm GDNN-GDTX Khu vực I Phân hiệu 2';
        dong2 = 'xã Định Quán, thành phố Đồng Nai';
      }
      const cac = dong2 ? [dong1, dong2] : [dong1];
      const boc = datNoiDung(e('span', 'hieu-phu-dong-boc'), ...cac.map((d) => e('span', 'hieu-phu-dong', d)));
      datNoiDung(hieuTruong, boc);
    }
  }
  // "Đổi lớp chủ nhiệm" chỉ giáo viên chủ nhiệm mới có — tài khoản học sinh (dù thường hay
  // được cấp quyền) chỉ gắn với đúng một lớp nên nút này không có ý nghĩa gì với các em.
  const nutDoiLop = $('#nutDoiLop');
  if (nutDoiLop) nutDoiLop.hidden = !(phien && phien.role === 'teacher');
  const gioiThieuHinhAnh = $('#gioiThieuHinhAnh');
  if (gioiThieuHinhAnh) gioiThieuHinhAnh.textContent = 'Khoảnh khắc & kỷ niệm sinh hoạt của lớp.';

  veBannerLop(lop);
  const nutSuaBanner = $('#moDauNutSua');
  if (nutSuaBanner) {
    // Chỉ giáo viên chủ nhiệm mới sửa được ảnh/video bìa lớp (Vùng 1)
    const duocSuaBanner = Boolean(phien && phien.role === 'teacher');
    nutSuaBanner.hidden = !duocSuaBanner;
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
    veTwitterCommunities(d, phien, taiDuLieu);
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
  batDauTheoDoiPhien();
})();

