/* Trang lớp — học sinh xem. Toàn bộ dữ liệu lấy từ /api/lop.

   Trang chủ chỉ để bốn mục: sĩ số lớp, thông báo (đảm nhiệm luôn vai trò của "kế hoạch năm
   học" cũ qua mức độ quan trọng), thời khoá biểu, hình ảnh.
   Danh sách lớp và Thủ quỹ là hai "trang riêng" mở từ menu — cùng một tệp HTML,
   chỉ ẩn/hiện theo địa chỉ #/… nên không cần thêm trang mới và không cần tải lại. */
import { $, e, datNoiDung, api, ngayVN, ngayDayDu, tienVN, ganDoiGiaoDien, ganMenu, khoiLoi, layNhanTaiKhoan, nhac, ganNhacNen, nhanMucDo } from './chung.js';
import { nut, moHopThoai, dongHopThoai } from './giao-dien.js';
import { moHopThoaiSoanThongBao } from './thong-bao-dialog.js';

ganDoiGiaoDien($('#doiGiaoDien'));

// Hiển thị vai trò tài khoản đăng nhập rõ ràng
api('/api/whoami').then((w) => {
  const hieuPhu = document.querySelector('.hieu-phu');
  if (hieuPhu) hieuPhu.textContent = layNhanTaiKhoan(w);
}).catch(() => {});

/* ---------- Menu ---------- */
ganMenu();

/* ---------- Trang riêng mở từ menu ---------- */
const TRANG_PHU = {
  '#/danh-sach': '#trangDanhSach',
  '#/thu-quy': '#trangThuQuy',
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

      tr.append(
        e('td', 'so', h.stt),
        e('td', null, h.hoTen),
        e('td', null, h.gioiTinh || ''),
        e('td', null, ngayVN(h.ngaySinh)),
        tdNghe,
        e('td', null, h.toHop || ''),
        e('td', null, h.toSo ? 'Tổ ' + h.toSo : ''),
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
    hangDau.append(e('th', null, 'Tiết'), ...cacThu.map((t) => e('th', null, t === 7 ? 'Thứ 7' : 'Thứ ' + t)));
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
      cacThu.forEach((t) => tr.append(e('td', null, bang[`${t}-${i}`] || '—')));
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

/* ---------- Thủ quỹ (công khai: chỉ số liệu tổng hợp) ---------- */
function veThuQuy(tq) {
  const oTongQuan = $('#tqTongQuan');
  datNoiDung(oTongQuan,
    (() => { const o = e('div', 'o-thong-ke tot'); o.append(e('div', 'con-so', tienVN(tq.tonQuy)), e('div', 'ten', 'Tồn quỹ hiện tại')); return o; })(),
    (() => { const o = e('div', 'o-thong-ke'); o.append(e('div', 'con-so', tienVN(tq.tongThu)), e('div', 'ten', 'Tổng đã thu')); return o; })(),
    (() => { const o = e('div', 'o-thong-ke luuy'); o.append(e('div', 'con-so', tienVN(tq.tongChi)), e('div', 'ten', 'Tổng đã chi')); return o; })()
  );

  const hop = $('#tqKhoan');
  if (!tq.khoan.length) {
    return datNoiDung(hop, e('p', 'trong', 'Chưa có khoản thu nào được mở.'));
  }

  datNoiDung(hop, e('h3', null, 'Các khoản thu'), ...tq.khoan.map((k) => {
    const dong = e('div');
    dong.style.cssText = 'padding:10px 0;border-bottom:1px solid var(--vien)';
    const dau = e('div');
    dau.style.cssText = 'display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap';
    dau.append(
      e('b', null, k.ten + (k.dangMo ? '' : ' (đã đóng)')),
      e('span', null, `${tienVN(k.tongDaThu)} / ${tienVN(k.tongCanThu)}`)
    );
    dong.append(dau);
    const thanh = e('div', 'thanh-tien-do');
    const i = e('i', 'p-comat');
    i.style.width = Math.min(100, k.tongCanThu ? Math.round((k.tongDaThu / k.tongCanThu) * 100) : 0) + '%';
    thanh.append(i);
    dong.append(thanh);
    return dong;
  }));
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
    img.src = '/api/anh?khoa=' + encodeURIComponent(a.khoa);
    img.alt = a.chuThich || 'Ảnh hoạt động lớp 10A7';
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

function veHinhAnh(ds) {
  const than = $('#hinh-anh .than-khoi');
  const hop = $('#thuVien');
  const dsDay = ds || [];

  let oTim = $('#thuVienTim');
  if (!oTim && than) {
    oTim = e('input', 'o-nhap');
    oTim.id = 'thuVienTim';
    oTim.type = 'search';
    oTim.placeholder = 'Tìm ảnh theo chú thích…';
    oTim.setAttribute('aria-label', 'Tìm ảnh theo chú thích');
    oTim.style.marginBottom = '14px';
    than.insertBefore(oTim, hop);
    oTim.addEventListener('input', () => veLoc());
  }
  if (oTim) oTim.hidden = dsDay.length < 6;

  function veLoc() {
    if (!dsDay.length) {
      return datNoiDung(hop, e('p', 'trong',
        'Chưa có hình ảnh nào. Giáo viên chủ nhiệm sẽ đăng ảnh hoạt động của lớp tại đây.'));
    }

    const q = (oTim?.value || '').trim().toLowerCase();
    const dsHien = q ? dsDay.filter((a) => (a.chuThich || '').toLowerCase().includes(q)) : dsDay;

    if (!dsHien.length) {
      return datNoiDung(hop, e('p', 'trong', 'Không tìm thấy ảnh nào khớp với "' + q + '".'));
    }

    datNoiDung(hop, ...dsHien.map((a, i) => {
      const hinh = e('figure');
      const img = e('img');
      img.src = '/api/anh?khoa=' + encodeURIComponent(a.khoa);
      img.alt = a.chuThich || 'Ảnh hoạt động lớp 10A7';
      img.loading = 'lazy';
      img.decoding = 'async';
      hinh.append(img);
      if (a.chuThich) hinh.append(e('figcaption', null, a.chuThich));
      hinh.addEventListener('click', () => moXemAnh(dsHien, i));
      hinh.style.cursor = 'zoom-in';
      return hinh;
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
  ['hinh-anh', '#/hinh-anh', 'hinh-anh'],
  ['danh-sach', '#/hoc-sinh', null],
  ['thu-quy', '#/quy', 'quy'],
];

function veLoiTatQuanLy(phien, lamMoi) {
  if (!phien || (phien.role !== 'teacher' && phien.role !== 'phu')) return;

  $('#mucQuanLy').hidden = false;

  MUC_QUAN_LY.forEach(([idMuc, duong, quyenCan]) => {
    const duocPhep = phien.role === 'teacher' || (quyenCan && (phien.quyen || []).includes(quyenCan));
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

    const a = e('a', 'nut nut-vien nut-nho', '⚙ Quản lý');
    a.href = '/giao-vien/' + duong;
    vungThaoTac.append(a);
  });
}

/* ---------- Khởi động & làm mới dữ liệu ---------- */
let thongTinPhien = null;

// Mục nào giáo viên đã ẩn riêng cho mã cá nhân đang dùng trên máy này (nếu có) — chỉ để ẩn
// bớt giao diện, không phải kiểm soát truy cập thật (mã lớp vẫn xem được dữ liệu như cũ).
const CHO_MUC_AN = {
  quy: '#thu-quy', 'thong-bao': '#thong-bao', 'thoi-khoa-bieu': '#thoi-khoa-bieu',
};

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

    $('#tenLop').textContent = d.lop.ten;
    apDungAnMuc(d.anMuc);
    const thongBaoHien = (d.anMuc || []).includes('thong-bao') ? [] : d.thongBao;
    veOSo(d.lop.thongKe);
    veDiemNhan(thongBaoHien);
    veThongBao(thongBaoHien, phien, taiDuLieu);
    veThoiKhoaBieu(d.thoiKhoaBieu);
    veHinhAnh(d.hinhAnh);
    veDanhSach(d.hocSinh);
    veThuQuy(d.thuQuy || { tonQuy: 0, tongThu: 0, tongChi: 0, khoan: [] });
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
