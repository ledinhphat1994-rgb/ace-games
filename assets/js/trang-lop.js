/* Trang lớp — học sinh xem. Toàn bộ dữ liệu lấy từ /api/lop.

   Trang chủ chỉ để bốn mục: sĩ số lớp, thông báo (đảm nhiệm luôn vai trò của "kế hoạch năm
   học" cũ qua mức độ quan trọng), thời khoá biểu, hình ảnh.
   Danh sách lớp và Thủ quỹ là hai "trang riêng" mở từ menu — cùng một tệp HTML,
   chỉ ẩn/hiện theo địa chỉ #/… nên không cần thêm trang mới và không cần tải lại. */
import { $, e, datNoiDung, api, homNay, ngayVN, ngayDayDu, tienVN, ganDoiGiaoDien, ganMenu, khoiLoi, layNhanTaiKhoan, nhac, ganNhacNen, nhanMucDo, CAC_LOAI_CHI } from './chung.js';
import { nut, moHopThoai, dongHopThoai } from './giao-dien.js';
import { moHopThoaiSoanThongBao } from './thong-bao-dialog.js';
import { moHopThoaiBannerLop } from './lop-banner-dialog.js';
import { moHopThoaiThemHoatDong } from './hoat-dong-lop-dialog.js';

ganDoiGiaoDien($('#doiGiaoDien'));

/* ---------- Menu ---------- */
ganMenu();

/* ---------- Trang riêng mở từ menu ---------- */
const TRANG_PHU = {
  '#/danh-sach': '#trangDanhSach',
  '#/thu-quy': '#trangThuQuy',
  '#/diem-danh': '#trangDiemDanh',
};

/* Mỏ neo hợp lệ: #thong-bao, #thoi-khoa-bieu… (không phải địa chỉ trang riêng #/…) */
function laMoNeo(hash) {
  return /^#[a-z][\w-]*$/i.test(hash);
}

function dinhTuyen() {
  const hash = location.hash;
  const trangCanHien = TRANG_PHU[hash] || null;

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
  if (laMoNeo(hash)) {
    const muc = document.querySelector(hash);
    if (muc) muc.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    bai.append(dau, e('h3', null, t.tieuDe), e('p', null, t.noiDung), ...veDinhKemTin(t));
    return bai;
  }));
}

function veDanhSach(ds) {
  const than = $('#bangHocSinh');
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
      tr.append(Object.assign(e('td', 'trong', 'Không tìm thấy học sinh phù hợp.'), { colSpan: 8 }));
      return datNoiDung(than, tr);
    }

    datNoiDung(than, ...hang.map((h) => {
      const tr = e('tr');
      const tdNghe = e('td');
      if (h.lopNghe) tdNghe.append(e('span', 'nhan nhan-xam', h.lopNghe));
      const tdChuc = e('td');
      if (h.chucVu) tdChuc.append(e('span', 'nhan nhan-tot', h.chucVu));

      const tdGt = e('td');
      if (h.gioiTinh) {
        tdGt.append(e('span', 'nhan-gt ' + (h.gioiTinh === 'Nam' ? 'gt-nam' : 'gt-nu'), h.gioiTinh));
      }

      const tdTo = e('td');
      if (h.toSo) {
        tdTo.append(e('span', 'nhan-to', 'Tổ ' + h.toSo));
      }

      tr.append(
        e('td', 'so', h.stt),
        e('td', null, h.hoTen),
        tdGt,
        e('td', null, ngayVN(h.ngaySinh)),
        tdNghe,
        e('td', null, h.toHop || ''),
        tdTo,
        tdChuc
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

  const dong = [];
  if (phienBan?.ten) dong.push(phienBan.ten);
  if (o.length) dong.push(soThuTkb ? `Hôm nay có ${soTietHomNay} tiết` : 'Hôm nay Chủ nhật — nghỉ');
  dong.push(phienBan ? `áp dụng từ ${ngayVN(phienBan.ngayBatDau)}` : 'chưa cập nhật thời khoá biểu');
  $('#tkbApDung').textContent = dong.join(' · ');

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
    // sáng hay buổi chiều của lớp mình.
    datNoiDung(hopTab, e('span', 'nhan nhan-xam', cacBuoiCo[0][1]));
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
    dich.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
function veThuQuy(tq, dsHocSinh = [], phien = null) {
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
      tabHienTai = 'thu';
      capNhatTab();
    }
  });

  nutTabChi.addEventListener('click', () => {
    if (tabHienTai !== 'chi') {
      tabHienTai = 'chi';
      capNhatTab();
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

    function veNutLoc() {
      datNoiDung(dayLoc, ...CAC_MUC_LOC.map(([giaTri, nhan]) => {
        const b = e('button', 'vien-loc', nhan);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(locTrangThai === giaTri && !khoanDuocChonId));
        b.addEventListener('click', () => {
          khoanDuocChonId = null;
          dropdown.value = '';
          locTrangThai = giaTri;
          veNutLoc();
          veDanhSachKhoan();
        });
        return b;
      }));
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
      const kieuThu = laDinhKy ? '[Thu định kỳ]' : '[Thu nhanh]';
      const opt = e('option', null, `${kieuThu} ${k.ten}`);
      opt.value = String(k.id);
      dropdown.append(opt);
    });

    const oTim = e('input', 'o-nhap o-tim-khoan');
    oTim.type = 'search';
    oTim.value = timKhoan;
    oTim.placeholder = 'Tìm khoản thu, tuần…';
    oTim.setAttribute('aria-label', 'Tìm kiếm khoản thu');

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
      let danhSachLoc;
      if (khoanDuocChonId) {
        danhSachLoc = dsKhoanGoc.filter((k) => k.id === khoanDuocChonId);
      } else {
        danhSachLoc = dsKhoanGoc.filter((k) => {
          const phanTram = k.tongCanThu ? Math.round((k.tongDaThu / k.tongCanThu) * 100) : 0;
          if (locTrangThai === 'dang_mo' && (!k.dangMo || phanTram >= 100)) return false;
          if (locTrangThai === 'da_du' && phanTram < 100) return false;
          if (locTrangThai === 'da_dong' && k.dangMo) return false;
          if (timKhoan) {
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
              veNutLoc();
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

        // Phân loại trạng thái
        let lopTrangThai = 'dang-thu';
        let badgeTrangThai;
        let icon = laDinhKy ? '📅' : '💰';

        if (!k.dangMo) {
          lopTrangThai = 'da-dong';
          badgeTrangThai = e('span', 'nhan nhan-xam', '🔒 Đã đóng');
          icon = '📁';
        } else if (phanTram >= 100) {
          lopTrangThai = 'da-du';
          badgeTrangThai = e('span', 'nhan nhan-tot', '✓ Đã thu đủ (100%)');
          icon = '✅';
        } else if (k.tongDaThu === 0) {
          lopTrangThai = 'chua-thu';
          badgeTrangThai = e('span', 'nhan nhan-xam', 'Chưa thu (0%)');
          icon = '⏳';
        } else {
          badgeTrangThai = e('span', 'nhan', `Đang thu · ${phanTram}%`);
        }

        const lopPhu = [
          lopTrangThai,
          laDinhKy ? 'loai-dinh-ky' : 'loai-nhanh',
          khoanDuocChonId === k.id ? 'dang-chon' : '',
        ].filter(Boolean).join(' ');

        const the = e('div', 'the-khoan-thu ' + lopPhu);

        // 1. Đầu thẻ
        const dau = e('div', 'the-khoan-dau');
        const trai = e('div', 'the-khoan-trai');
        trai.append(e('div', 'the-khoan-icon', icon));

        const thongTin = e('div', 'the-khoan-thong-tin');
        const dongTen = e('div', 'the-khoan-ten-hang');

        // Dòng đầu: kiểu thu, tuần thu, tên thu (không ghi thời gian)
        dongTen.append(e(
          'span',
          'badge-kieu-thu ' + (laDinhKy ? 'badge-dinh-ky' : 'badge-nhanh'),
          laDinhKy ? '🔁 Thu định kỳ' : '⚡ Thu nhanh'
        ));

        const soTuan = laDinhKy ? (matchTuan ? matchTuan[1] : (k.kySo || null)) : null;
        if (soTuan) {
          dongTen.append(e('span', 'badge-tuan', `Tuần ${soTuan}`));
        }

        let tenThuSach = (k.ten || '').trim();
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
        dongTen.append(e('h4', 'the-khoan-ten', tenThuSach));
        thongTin.append(dongTen);

        // Dòng 2: lịch thu, số tiền đóng mỗi em
        const chipDay = e('div', 'the-khoan-chip-day');
        let lichThu = '';
        if (k.ngayBatDau && k.ngayKetThuc) {
          lichThu = `📅 ${ngayVN(k.ngayBatDau)}–${ngayVN(k.ngayKetThuc)}`;
        } else if (k.ngayBatDau) {
          lichThu = `📅 Từ ${ngayVN(k.ngayBatDau)}`;
        } else {
          const m = /\(([^)]+\d+[/–-]\d+[^)]*)\)/.exec(k.ten);
          if (m) lichThu = `📅 ${m[1]}`;
        }
        if (lichThu) {
          chipDay.append(e('span', 'the-khoan-chip', lichThu));
        }

        if (k.soTienMoiEm) {
          chipDay.append(e('span', 'the-khoan-chip', `👤 ${tienVN(k.soTienMoiEm)}/em`));
        }
        thongTin.append(chipDay);
        trai.append(thongTin);

        const phai = e('div', 'the-khoan-phai');
        phai.append(badgeTrangThai);
        dau.append(trai, phai);
        the.append(dau);

        // 2. Khối số liệu
        const soLieu = e('div', 'the-khoan-so-lieu');

        const cotDaThu = e('div');
        cotDaThu.append(
          e('div', 'nhan-cot', 'Đã thu được'),
          e('div', 'gia-tri-da-thu', tienVN(k.tongDaThu))
        );

        const cotMucTieu = e('div');
        cotMucTieu.append(
          e('div', 'nhan-cot', 'Mục tiêu cả lớp'),
          e('div', 'gia-tri-muc-tieu', tienVN(k.tongCanThu))
        );

        const cotTienDo = e('div', 'cot-tien-do');
        cotTienDo.append(
          e('div', 'nhan-cot', 'Tiến độ'),
          e('div', 'gia-tri-phan-tram', `${phanTram}%`)
        );

        soLieu.append(cotDaThu, cotMucTieu, cotTienDo);
        the.append(soLieu);

        // 3. Thanh tiến độ
        const tienDoKhung = e('div', 'the-khoan-tien-do-khung');
        const tienDoChay = e('div', 'the-khoan-tien-do-chay');
        tienDoChay.style.width = Math.min(100, Math.max(0, phanTram)) + '%';
        tienDoKhung.append(tienDoChay);
        the.append(tienDoKhung);

        // 4. Chân thẻ
        const chan = e('div', 'the-khoan-chan');
        if (phanTram >= 100) {
          chan.append(e('span', 'hoan-thanh-tot', '🎉 Đã hoàn thành 100% chỉ tiêu thu của lớp'));
        } else if (k.dangMo) {
          chan.append(e('span', 'con-thieu', `Còn thiếu ${tienVN(conThieu)} để đạt chỉ tiêu`));
        } else {
          chan.append(e('span', null, 'Khoản thu đã khoá sổ.'));
        }

        chan.append(e('span', null, k.dangMo ? 'Đang thu quỹ' : 'Đã khoá sổ'));
        the.append(chan);

        // 5. Khối danh sách học sinh đóng tiền chi tiết
        const dsDongChiTiet = k.dongChiTiet || {};
        const dsHs = dsHocSinh || [];
        const hocSinhHienTaiId = phien?.hocSinhId || null;

        const danhSachHsVoiTrangThai = dsHs.map((hs) => {
          const id = hs.stt || hs.id;
          const thongTin = dsDongChiTiet[id] || dsDongChiTiet[String(id)] || null;
          const daDong = thongTin ? thongTin.soTien : 0;
          const ngayDong = thongTin ? thongTin.ngay : '';
          const mucTieu = k.soTienMoiEm || 0;
          let tt = 'chua_dong';
          if (mucTieu > 0 && daDong >= mucTieu) {
            tt = 'da_du';
          } else if (daDong > 0) {
            tt = 'dong_mot_phan';
          }
          return {
            id,
            hoTen: hs.hoTen,
            lopNghe: hs.lopNghe || '',
            daDong,
            ngayDong,
            trangThai: tt,
            laChinhMinh: Boolean(hocSinhHienTaiId && hocSinhHienTaiId === id),
          };
        });

        const soEmDaDong = danhSachHsVoiTrangThai.filter((x) => x.trangThai === 'da_du').length;
        const soEmDongMotPhan = danhSachHsVoiTrangThai.filter((x) => x.trangThai === 'dong_mot_phan').length;
        const soEmChuaDong = danhSachHsVoiTrangThai.filter((x) => x.trangThai === 'chua_dong').length;
        const tongSoEmDaNop = soEmDaDong + soEmDongMotPhan;

        const nutMoChiTiet = e('button', 'nut-mo-chi-tiet-dong');
        nutMoChiTiet.type = 'button';
        nutMoChiTiet.setAttribute('aria-expanded', 'false');
        const spanNhan = e('span');
        spanNhan.append(
          document.createTextNode('👥 '),
          e('b', null, 'Chi tiết đóng tiền: '),
          document.createTextNode('Đã đóng '),
          Object.assign(e('b', null, `${tongSoEmDaNop}/${dsHs.length}`), { style: 'color:var(--tot)' }),
          document.createTextNode(' · Chưa đóng '),
          Object.assign(e('b', null, String(soEmChuaDong)), { style: 'color:var(--xau)' })
        );
        nutMoChiTiet.append(spanNhan, e('span', 'mui-ten-chi-tiet', '▾'));

        const khungChiTiet = e('div', 'khung-chi-tiet-dong');
        khungChiTiet.hidden = true;

        let locHs = ''; // '' | 'da_dong' | 'chua_dong'
        let timHs = '';

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
          const bang = e('table', 'bang-dong-tien');
          const thead = e('thead');
          const hangTieuDe = e('tr');
          hangTieuDe.append(
            e('th', null, 'STT'),
            e('th', null, 'Họ và tên'),
            e('th', null, 'Đã đóng'),
            e('th', null, 'Ngày đóng'),
            e('th', null, 'Trạng thái')
          );
          thead.append(hangTieuDe);
          bang.append(thead);

          const tbody = e('tbody');
          if (!hsLoc.length) {
            const hangTrong = e('tr');
            const tdTrong = e('td');
            tdTrong.colSpan = 5;
            tdTrong.style.textAlign = 'center';
            tdTrong.style.padding = '20px';
            tdTrong.className = 'trong';
            tdTrong.textContent = 'Không có học sinh nào phù hợp bộ lọc.';
            hangTrong.append(tdTrong);
            tbody.append(hangTrong);
          } else {
            hsLoc.forEach((h) => {
              const tr = e('tr', h.laChinhMinh ? 'dong-ban-than' : '');
              const tdStt = e('td', null, String(h.id));
              const tdTen = e('td');
              tdTen.append(e('b', null, h.hoTen));
              if (h.lopNghe) {
                tdTen.append(Object.assign(e('span', 'lop-nghe-nho', ` · ${h.lopNghe}`), { style: 'font-size:11.5px;color:var(--chu-nhat)' }));
              }
              if (h.laChinhMinh) {
                tdTen.append(e('span', 'tag-ban', 'Bạn'));
              }

              const tdTien = e('td');
              if (h.daDong > 0) {
                tdTien.append(Object.assign(e('b', null, tienVN(h.daDong)), { style: 'color:var(--tot)' }));
              } else {
                tdTien.append(Object.assign(e('span', 'trong', '0 đ')));
              }

              const tdNgay = e('td', 'trong', h.ngayDong ? ngayVN(h.ngayDong) : '—');

              const tdTrangThai = e('td');
              if (h.trangThai === 'da_du') {
                tdTrangThai.append(e('span', 'nhan nhan-tot', '✓ Đã đủ 100%'));
              } else if (h.trangThai === 'dong_mot_phan') {
                tdTrangThai.append(e('span', 'nhan nhan-luuy', 'Đóng 1 phần'));
              } else {
                tdTrangThai.append(e('span', 'nhan nhan-xau', 'Chưa đóng'));
              }

              tr.append(tdStt, tdTen, tdTien, tdNgay, tdTrangThai);
              tbody.append(tr);
            });
          }

          bang.append(tbody);
          hopCuon.append(bang);

          datNoiDung(khungChiTiet, thanhLocHs, hopCuon);
        }

        nutMoChiTiet.addEventListener('click', () => {
          const dangMo = !khungChiTiet.hidden;
          khungChiTiet.hidden = dangMo;
          nutMoChiTiet.setAttribute('aria-expanded', String(!dangMo));
          if (!dangMo) {
            veBangHs();
          }
        });

        the.append(nutMoChiTiet, khungChiTiet);

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

    let veNutLocChi = () => {};
    veNutLocChi = () => {
      datNoiDung(dayLoc, ...cacMucLoc.map(([giaTri, nhan]) => {
        const b = e('button', 'vien-loc', nhan);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(locLoaiChi === giaTri && !chiDuocChonId));
        b.addEventListener('click', () => {
          chiDuocChonId = null;
          dropdownChi.value = '';
          locLoaiChi = giaTri;
          veNutLocChi();
          veDanhSachChi();
        });
        return b;
      }));
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
              if (cacMucLoc.length > 1) veNutLocChi();
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
  return xuLyLinkNhac(item.url, item.id);
}

function veTheHoatDong(item) {
  const the = e('div', 'hoat-dong-the');

  if (item.loai === 'anh') {
    const hinh = e('figure');
    const img = e('img');
    img.src = xuLyLinkHinh(item.anhKhoa || item.url);
    img.alt = item.chuThich || 'Hoạt động của lớp';
    img.loading = 'lazy';
    img.decoding = 'async';
    hinh.append(img);
    if (item.chuThich) hinh.append(e('figcaption', null, item.chuThich));
    hinh.style.cursor = 'zoom-in';
    hinh.addEventListener('click', () => moXemAnh([{ src: img.src, chuThich: item.chuThich }], 0));
    the.append(hinh);
  } else if (item.loai === 'video') {
    if (item.videoKhoa) {
      const vid = e('video');
      vid.controls = true; vid.playsInline = true; vid.preload = 'metadata';
      vid.src = '/api/thu-vien-tep?loai=video&id=' + encodeURIComponent(item.videoId);
      the.append(vid);
    } else {
      const maYt = idYoutube(item.url);
      const maDrive = idGoogleDrive(item.url);
      if (maYt) {
        const khung = e('iframe');
        khung.src = 'https://www.youtube.com/embed/' + maYt;
        khung.loading = 'lazy'; khung.allowFullscreen = true;
        khung.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        the.append(khung);
      } else if (maDrive) {
        const khung = e('iframe');
        khung.src = 'https://drive.google.com/file/d/' + maDrive + '/preview';
        khung.loading = 'lazy'; khung.allowFullscreen = true; khung.allow = 'autoplay; fullscreen';
        the.append(khung);
      } else if (laVideoTrucTiep(item.url) || /facebook\.com|fb\.watch|tiktok\.com/i.test(item.url || '')) {
        if (laVideoTrucTiep(item.url)) {
          const vid = e('video');
          vid.controls = true; vid.playsInline = true; vid.preload = 'metadata'; vid.src = item.url;
          the.append(vid);
        } else {
          const khung = e('iframe');
          khung.src = 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(item.url) + '&show_text=0';
          khung.loading = 'lazy'; khung.allowFullscreen = true;
          the.append(khung);
        }
      } else {
        const a = e('a', 'nut nut-vien nut-nho', '🎬 Xem video');
        a.href = item.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        the.append(a);
      }
    }
    if (item.chuThich) the.append(e('p', 'hoat-dong-chu-thich', item.chuThich));
  } else {
    const audio = e('audio');
    audio.controls = true; audio.preload = 'none';
    audio.src = xuLyLinkAmThanhHoatDong(item);
    the.append(audio);
    the.append(e('p', 'hoat-dong-chu-thich', item.chuThich || item.amThanhTen || 'Âm thanh'));
  }

  return the;
}

function veHoatDongLop(ds, phien, lamMoi) {
  const than = $('#hinh-anh .than-khoi');
  const hop = $('#thuVien');
  const dsDay = ds || [];
  const duocQuanLy = Boolean(phien && (phien.role === 'teacher'
    || ['hinh-anh', 'am-thanh', 'video'].some((q) => (phien.quyen || []).includes(q))));

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
        'Chưa có hoạt động nào. Giáo viên chủ nhiệm sẽ đăng ảnh, video hoặc âm thanh hoạt động của lớp tại đây.'));
    }

    const q = (oTim?.value || '').trim().toLowerCase();
    const dsHien = q ? dsDay.filter((a) => (a.chuThich || '').toLowerCase().includes(q)) : dsDay;

    if (!dsHien.length) {
      return datNoiDung(hop, e('p', 'trong', 'Không tìm thấy hoạt động nào khớp với "' + q + '".'));
    }

    datNoiDung(hop, ...dsHien.map((item) => {
      const the = veTheHoatDong(item);
      if (duocQuanLy) {
        const nutXoa = e('button', 'nut-xoa-anh nut-nho', '🗑');
        nutXoa.type = 'button';
        nutXoa.title = 'Gỡ khỏi Hoạt động lớp';
        nutXoa.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          if (!confirm('Gỡ mục này khỏi Hoạt động lớp?')) return;
          try {
            await api('/api/gv/hoat-dong-lop?id=' + item.id, { method: 'DELETE' });
            nhac('Đã gỡ khỏi Hoạt động lớp', 'tot');
            if (lamMoi) await lamMoi();
          } catch (err) { nhac(err.message, 'xau'); }
        });
        the.append(nutXoa);
      }
      return the;
    }));
  }

  veLoc();
}

/* ---------- Lối tắt "Quản lý" cho giáo viên / tài khoản được cấp quyền ----------
   Trang này ai đăng nhập cũng xem được (kể cả giáo viên). Với người có quyền,
   thêm nút thao tác trực tiếp (Thêm thông báo) và lối tắt vào khu quản lý. */
const MUC_QUAN_LY = [
  ['thong-bao', '#/thong-bao', 'thong-bao'],
  ['thoi-khoa-bieu', '#/thoi-khoa-bieu', null],
  ['hinh-anh', null, ['hinh-anh', 'am-thanh', 'video']],
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

async function taiVaVeDiemDanh(ngay = '', buoi = '', loai = '') {
  const hopCaNhan = $('#ddCaNhan');
  const hopLop = $('#ddLopKhoi');
  if (!hopCaNhan || !hopLop) return;

  if (loai) loaiDiemDanhHienTai = loai;
  if (buoi) buoiDiemDanhHienTai = buoi;
  if (ngay) ngayDiemDanhHienTai = ngay;

  // Thanh tab chuyển đổi giữa Điểm danh chính và Điểm danh phụ
  let hopTabLoai = $('#ddTabLoai');
  if (!hopTabLoai) {
    hopTabLoai = e('div', 'day-loc');
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
      ...[['chinh', '📋 Điểm danh chính'], ['phu', '⚡ Điểm danh phụ']].map(([maL, tenL]) => {
        const b = e('button', 'vien-loc', tenL);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(loaiDiemDanhHienTai === maL));
        b.addEventListener('click', () => {
          if (loaiDiemDanhHienTai !== maL) {
            taiVaVeDiemDanh(ngayDiemDanhHienTai || '', buoiDiemDanhHienTai || '', maL);
          }
        });
        return b;
      })
    );
  }

  datNoiDung(hopLop, e('p', 'trong', 'Đang tải dữ liệu điểm danh…'));
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
      e('h3', null, (isPhu ? '⚡ Điểm danh phụ & Hoạt động: ' : '🎓 Chuyên cần chính khoá: ') + cn.hoTen),
      e('span', 'nhan ' + (isPhu ? 'nhan-luuy' : 'nhan-tot'), (cn.lopNghe || 'Chưa xếp') + (cn.chucVu ? ' · ' + cn.chucVu : ''))
    );
    theCn.append(tieuDe);

    const luoi = e('div', 'luoi-thong-ke-chuyen-can');
    const tiLe = cnData.tiLe !== null && cnData.tiLe !== undefined ? cnData.tiLe + '%' : '—';
    const lopTiLe = (cnData.tiLe || 0) >= 90 ? 'mau-tot' : (cnData.tiLe || 0) >= 75 ? 'mau-luuy' : 'mau-xau';

    const taoO = (so, nhan, lopMau = '') => {
      const o = e('div', 'o-chuyen-can ' + lopMau);
      o.append(e('div', 'so', String(so)), e('div', 'nhan-so', nhan));
      return o;
    };

    luoi.append(
      taoO(tiLe, isPhu ? 'Tỉ lệ tham gia' : 'Tỉ lệ chuyên cần', lopTiLe),
      taoO(cnData.co_mat || 0, isPhu ? 'Buổi tham gia' : 'Buổi có mặt', 'mau-tot'),
      taoO(cnData.vang_phep || 0, 'Vắng có phép'),
      taoO(cnData.vang_khong_phep || 0, 'Vắng không phép', (cnData.vang_khong_phep || 0) > 0 ? 'mau-xau' : ''),
      taoO(cnData.tre || 0, 'Đi trễ', (cnData.tre || 0) > 0 ? 'mau-luuy' : '')
    );
    theCn.append(luoi);

    if (!isPhu) {
      // Tab chính: Danh sách buổi vắng hoặc đi trễ chính khoá
      if (cnData.lichSuVang && cnData.lichSuVang.length) {
        const nutXemVang = e('button', 'nut-mo-chi-tiet-dong');
        nutXemVang.type = 'button';
        nutXemVang.setAttribute('aria-expanded', 'false');
        const spanVang = e('span');
        spanVang.append(
          e('b', null, '📋 Xem '),
          document.createTextNode(`${cnData.lichSuVang.length} buổi em vắng hoặc đi trễ chính khoá`)
        );
        nutXemVang.append(spanVang, e('span', 'mui-ten-chi-tiet', '▾'));
        const hopVang = e('div', 'khung-chi-tiet-dong');
        hopVang.hidden = true;

        const dsVang = e('div', 'ds-diem-danh');
        cnData.lichSuVang.forEach((x) => {
          const hang = e('div', 'hang-hs');
          const ten = e('div', 'ten');
          const tenBuoi = x.buoi === 'sang' ? 'Sáng' : x.buoi === 'chieu' ? 'Chiều' : 'Hoạt động';
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
        hopVang.append(dsVang);

        nutXemVang.addEventListener('click', () => {
          const hien = hopVang.hidden;
          hopVang.hidden = !hien;
          nutXemVang.setAttribute('aria-expanded', String(hien));
        });
        theCn.append(nutXemVang, hopVang);
      }

      // Nếu em có lượt tham gia ở điểm danh phụ, hiển thị gợi ý chuyển tab
      if (cn.phu && cn.phu.tong > 0) {
        const nhacPhu = e('div', 'hop-chuyen-nhanh-phu');
        nhacPhu.style.cssText = 'margin-top:14px;padding:10px 14px;border-radius:10px;background:var(--nen-noi);border:1.5px dashed color-mix(in srgb, var(--chinh) 50%, var(--vien));display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;flex-wrap:wrap;transition:all .2s;';
        const veTrai = e('div');
        veTrai.append(
          e('span', null, '⚡ '),
          document.createTextNode('Em có '),
          e('b', null, `${cn.phu.tong} lượt ghi nhận`),
          document.createTextNode(` trong Điểm danh phụ (${cn.phu.co_mat} có mặt).`)
        );
        nhacPhu.append(
          veTrai,
          e('span', 'nhan nhan-tot', 'Xem sổ điểm danh phụ →')
        );
        nhacPhu.addEventListener('click', () => {
          taiVaVeDiemDanh(ngayDiemDanhHienTai, buoiDiemDanhHienTai, 'phu');
        });
        theCn.append(nhacPhu);
      }
    } else {
      // Tab phụ: Danh sách chi tiết các buổi điểm danh phụ của em
      if (cn.phu && cn.phu.danhSach && cn.phu.danhSach.length) {
        const nutXemPhu = e('button', 'nut-mo-chi-tiet-dong');
        nutXemPhu.type = 'button';
        nutXemPhu.setAttribute('aria-expanded', 'true');
        const spanPhu = e('span');
        spanPhu.append(
          e('b', null, '⚡ Chi tiết '),
          document.createTextNode(`${cn.phu.danhSach.length} buổi em được ghi nhận điểm danh phụ`)
        );
        nutXemPhu.append(spanPhu, e('span', 'mui-ten-chi-tiet', '▴'));
        const hopPhu = e('div', 'khung-chi-tiet-dong');
        hopPhu.hidden = false;

        const dsPhu = e('div', 'ds-diem-danh');
        cn.phu.danhSach.forEach((x) => {
          const hang = e('div', 'hang-hs');
          const ten = e('div', 'ten');
          const tenBuoi = x.buoiGoc === 'sang' ? 'Sáng' : x.buoiGoc === 'chieu' ? 'Chiều' : 'Hoạt động';
          ten.append(e('b', null, ngayVN(x.ngay) + ` (${tenBuoi})`));
          if (x.lyDo) ten.append(e('small', null, x.lyDo));
          let nhanTt = 'Có mặt';
          let lopTt = 'nhan-tot';
          if (x.trangThai === 'vang_phep') { nhanTt = 'Vắng phép'; lopTt = 'nhan'; }
          else if (x.trangThai === 'vang_khong_phep') { nhanTt = 'Không phép'; lopTt = 'nhan-xau'; }
          else if (x.trangThai === 'tre') { nhanTt = 'Đi trễ'; lopTt = 'nhan-luuy'; }
          hang.append(ten, e('span', 'nhan ' + lopTt, nhanTt));
          dsPhu.append(hang);
        });
        hopPhu.append(dsPhu);

        nutXemPhu.addEventListener('click', () => {
          const hien = hopPhu.hidden;
          hopPhu.hidden = !hien;
          nutXemPhu.setAttribute('aria-expanded', String(hien));
          const muiTen = nutXemPhu.querySelector('.mui-ten-chi-tiet');
          if (muiTen) muiTen.textContent = hien ? '▴' : '▾';
        });
        theCn.append(nutXemPhu, hopPhu);
      } else {
        const oTrong = e('p', 'trong', 'Em chưa có lượt ghi nhận nào trong sổ điểm danh phụ.');
        oTrong.style.marginTop = '12px';
        theCn.append(oTrong);
      }
    }

    datNoiDung(hopCaNhan, theCn);
  } else {
    datNoiDung(hopCaNhan, '');
  }

  // 2. Điểm danh cả lớp theo ngày
  const khungLop = e('div', 'khung-diem-danh-lop');

  // Ghi chú giải thích nếu đang xem tab Điểm danh phụ
  if (isPhu) {
    const hopGhiChuPhu = e('div', 'hop-huong-dan-phu');
    hopGhiChuPhu.style.cssText = 'margin-bottom: 16px; padding: 13px 16px; border-radius: 12px; background: var(--nen-chim); border: 1.5px dashed color-mix(in srgb, var(--chinh) 45%, var(--vien)); font-size: 13.5px; line-height: 1.5; color: var(--chu);';
    const dongChu = e('div');
    dongChu.append(
      e('b', null, '⚡ Sổ điểm danh phụ: '),
      document.createTextNode('Dùng cho trường hợp đặc biệt: đi bồi dưỡng học sinh giỏi, lao động, hoạt động ngoại khoá... Dữ liệu được lưu vào một "sổ" riêng biệt, hoàn toàn không ảnh hưởng điểm danh chính khoá.')
    );
    hopGhiChuPhu.append(dongChu);
    khungLop.append(hopGhiChuPhu);
  }

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
  nhomNgay.append(oChonNgay);

  // Buổi
  const nhomBuoi = e('div', 'nhom-buoi-dd');
  const CAC_BUOI = [['sang', 'Sáng'], ['chieu', 'Chiều'], ['hoat_dong', 'Hoạt động']];
  CAC_BUOI.forEach(([maB, tenB]) => {
    const nutB = e('button', 'nut-buoi-dd', tenB);
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
  const dayLocDd = e('div', 'day-loc');
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
        locDd = giaTri;
        veNutLocDd();
        veBangDiemDanh();
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

    const bang = e('table', 'bang-diem-danh');
    const thead = e('thead');
    const trHd = e('tr');
    trHd.append(
      e('th', null, 'STT'),
      e('th', null, 'Họ và tên'),
      e('th', null, 'Lớp nghề'),
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
      });
    }

    bang.append(tbody);
    datNoiDung(hopBang, bang);
  }

  veBangDiemDanh();
  datNoiDung(hopLop, khungLop);
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
  $('#tenLop').textContent = ten;
  const hieuMaLop = $('#hieuMaLop'); if (hieuMaLop) hieuMaLop.textContent = tenNgan;
  const hieuTenLop = $('#hieuTenLop'); if (hieuTenLop) hieuTenLop.textContent = ten;
  // Dòng phụ dưới tên lớp: hiện tài khoản đang đăng nhập (tên · tổ · chức vụ nếu có) — KHÔNG
  // lặp lại tên trường ở đây (đã hiện đủ ở đoạn giới thiệu bên dưới, nhắc lại là thừa).
  // Lưu ý: trước đây có 2 đoạn mã khác nhau cùng tranh nhau ghi vào đúng một chỗ này (một đoạn
  // ghi tài khoản, một đoạn ghi tên trường), ai chạy xong sau thì đoạn kia bị mất — chỉ còn
  // ĐÚNG MỘT nơi ghi vào đây để tránh lặp lại lỗi đó.
  const hieuTruong = $('#hieuTruong');
  if (hieuTruong) hieuTruong.textContent = phien ? layNhanTaiKhoan(phien) : '';
  const gioiThieuHinhAnh = $('#gioiThieuHinhAnh'); if (gioiThieuHinhAnh) gioiThieuHinhAnh.textContent = `Khoảnh khắc của tập thể ${tenNgan}.`;
  const chanTrangTen = $('#chanTrangTen');
  if (chanTrangTen) chanTrangTen.textContent = [ten, namHoc ? `Năm học ${namHoc}` : '', truong].filter(Boolean).join(' · ');
  const gioiThieu = $('#gioiThieu');
  if (gioiThieu) gioiThieu.textContent = lop.gioiThieu || `Trang thông tin nội bộ của tập thể ${ten}${truong ? ' – ' + truong : ''}.`;

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
    apDungAnMuc(d.anMuc);
    const thongBaoHien = (d.anMuc || []).includes('thong-bao') ? [] : d.thongBao;
    veOSo(d.lop.thongKe);
    veDiemNhan(thongBaoHien);
    veThongBao(thongBaoHien, phien, taiDuLieu);
    veThoiKhoaBieu(d.thoiKhoaBieu);
    veHoatDongLop(d.hoatDongLop, phien, taiDuLieu);
    veDanhSach(d.hocSinh);
    veThuQuy(d.thuQuy || { tonQuy: 0, tongThu: 0, tongChi: 0, khoan: [] }, d.hocSinh, phien);
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

