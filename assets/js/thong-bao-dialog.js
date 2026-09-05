/* Hộp thoại soạn/sửa Thông báo — DÙNG CHUNG cho khu quản lý (giao-vien/app.js) và lối tắt
   "⚙ Quản lý" ngay trên trang lớp (trang-lop.js).

   Mỗi loại đính kèm (hình/nhạc/video) có 3 cách, đúng như 3 thư viện Ảnh/Âm thanh/Video —
   không còn file nào "riêng" của một thông báo nữa:
     1) Chọn một mục CÓ SẴN trong thư viện.
     2) Tải file MỚI từ máy — file này tự động trở thành một mục mới trong thư viện đó.
     3) Dán LINK ngoài (ảnh/nhạc: link trực tiếp hoặc Google Drive; video: YouTube/Drive/TikTok/Facebook/.mp4). */
import { e, api, homNay, ngayVN, nhac, nenAnhThanhBlob, MUC_DO_THONG_BAO } from './chung.js';
import { nut, truong, oNhap, oChon, moHopThoai, dongHopThoai } from './giao-dien.js';

const LOAI_THONG_BAO = [['Chủ nhiệm', 'Chủ nhiệm'], ['Nhà trường', 'Nhà trường'], ['Học tập', 'Học tập'], ['Hoạt động', 'Hoạt động']];

function hangTich(id, nhanChu, daChon) {
  const o = e('input');
  o.type = 'checkbox';
  o.id = id;
  o.checked = Boolean(daChon);
  const l = e('label');
  l.style.cssText = 'display:flex;gap:9px;align-items:center;font-size:14px;font-weight:600';
  l.append(o, document.createTextNode(nhanChu));
  return [o, l];
}

function xuLyLinkHinh(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) {
    const mDrive = url.match(/drive\.google\.com\/(?:file\/d\/|(?:open|uc)\?id=)([\w-]+)/i);
    if (mDrive) return `https://lh3.googleusercontent.com/d/${mDrive[1]}`;
    return url;
  }
  return '/api/anh?khoa=' + encodeURIComponent(url);
}

function xuLyLinkNhac(url, id) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) {
    const mDrive = url.match(/drive\.google\.com\/(?:file\/d\/|(?:open|uc)\?id=)([\w-]+)/i);
    if (mDrive) return `https://drive.google.com/uc?export=download&id=${mDrive[1]}`;
    return url;
  }
  return '/api/thong-bao-nhac?id=' + encodeURIComponent(id);
}

/** Lấy danh sách một thư viện để hiện trong bộ chọn — im lặng bỏ qua nếu tài khoản không xem
    được (vd tài khoản cán sự chỉ có quyền "thong-bao" mà API thư viện đó lỡ chưa mở, dù bình
    thường đã cho phép đọc chung — xem functions/api/gv/anh.js, thu-vien-am-thanh.js, thu-vien-video.js). */
async function layDanhSachThuVien(duong) {
  try {
    const d = await api(duong);
    return d.danhSach || [];
  } catch {
    return [];
  }
}

/** Khối "đính kèm hình ảnh": chọn từ thư viện Ảnh, HOẶC tải ảnh mới (tự nén, thêm vào thư
    viện), HOẶC dán link ảnh trực tuyến. */
async function khoiDinhKemHinh(tb) {
  const khung = e('div');
  khung.style.cssText = 'border-top:1px dashed var(--vien);padding-top:12px;margin-top:4px';
  khung.append(Object.assign(e('div', null, '🖼 Hình ảnh đính kèm'), { style: 'font-weight:700;font-size:13.5px;margin-bottom:8px' }));

  let oXoa = null;
  if (tb && tb.hinhKhoa) {
    const img = e('img');
    img.src = xuLyLinkHinh(tb.hinhKhoa);
    img.style.cssText = 'max-width:160px;max-height:120px;border-radius:8px;display:block;margin-bottom:8px;object-fit:cover';
    khung.append(img);
    const [o, l] = hangTich('tbXoaHinh', 'Xoá ảnh hiện tại', false);
    oXoa = o;
    khung.append(l);
  }

  const dsAnh = await layDanhSachThuVien('/api/gv/anh');
  const oChonThuVien = oChon('tbChonAnh',
    [['', '— Không chọn —'], ...dsAnh.map((a) => [String(a.id), `${a.chuThich || 'Ảnh'} — ${ngayVN(a.ngay)}`])],
    tb && tb.anhId ? String(tb.anhId) : '');

  const oTep = e('input');
  oTep.type = 'file';
  oTep.accept = 'image/jpeg,image/png,image/webp';
  oTep.id = 'tbTepHinh';
  oTep.className = 'o-nhap';

  const linkHienTai = (tb && tb.hinhUrl) || '';
  const oUrlHinh = oNhap('tbUrlHinh', 'text', linkHienTai, 'Dán link ảnh trực tiếp (https://...) hoặc link chia sẻ Google Drive');

  khung.append(
    truong('Cách 1: Chọn ảnh có sẵn trong Thư viện Ảnh', oChonThuVien),
    truong('Cách 2: Hoặc tải ảnh mới từ máy (tự nén, tự thêm vào thư viện)', oTep, 'Hệ thống tự nén ảnh tối ưu dung lượng (dưới 1,5 MB).'),
    truong('Cách 3: Hoặc dán link ảnh trực tuyến', oUrlHinh, 'Dán link ảnh từ internet (chuột phải chọn "Sao chép địa chỉ hình ảnh") hoặc link Google Drive (quyền xem: Bất kỳ ai có liên kết).')
  );

  return { khung, oTep, oUrlHinh, oXoa, oChonThuVien };
}

/** Khối "đính kèm âm thanh": chọn từ thư viện Âm thanh, HOẶC tải file .mp3 mới (thêm vào thư
    viện), HOẶC dán link nhạc trực tuyến. */
async function khoiDinhKemNhac(tb) {
  const khung = e('div');
  khung.style.cssText = 'border-top:1px dashed var(--vien);padding-top:12px;margin-top:4px';
  khung.append(Object.assign(e('div', null, '🎵 Âm thanh đính kèm'), { style: 'font-weight:700;font-size:13.5px;margin-bottom:8px' }));

  let oXoa = null;
  if (tb && tb.nhacKhoa) {
    const audio = e('audio');
    audio.controls = true;
    audio.preload = 'none';
    audio.src = xuLyLinkNhac(tb.nhacKhoa, tb.id);
    audio.style.cssText = 'width:100%;margin-bottom:8px';
    khung.append(audio);
    const [o, l] = hangTich('tbXoaNhac', 'Xoá âm thanh hiện tại', false);
    oXoa = o;
    khung.append(l);
  }

  const dsNhac = await layDanhSachThuVien('/api/gv/thu-vien-am-thanh');
  const oChonThuVien = oChon('tbChonNhac',
    [['', '— Không chọn —'], ...dsNhac.map((b) => [String(b.id), b.ten || 'Bài hát chưa đặt tên'])],
    tb && tb.amThanhId ? String(tb.amThanhId) : '');

  const oTep = e('input');
  oTep.type = 'file';
  oTep.accept = 'audio/mpeg,.mp3';
  oTep.id = 'tbTepNhac';
  oTep.className = 'o-nhap';

  const linkHienTai = (tb && tb.nhacUrl) || '';
  const oUrlNhac = oNhap('tbUrlNhac', 'text', linkHienTai, 'Dán link file nhạc (.mp3) hoặc link chia sẻ Google Drive');

  khung.append(
    truong('Cách 1: Chọn bài có sẵn trong Thư viện Âm thanh', oChonThuVien),
    truong('Cách 2: Hoặc tải file .mp3 mới từ máy (tối đa 12 MB, tự thêm vào thư viện)', oTep),
    truong('Cách 3: Hoặc dán link âm thanh trực tuyến', oUrlNhac, 'Dán link tệp .mp3 trực tuyến hoặc link chia sẻ file âm thanh từ Google Drive.')
  );

  return { khung, oTep, oUrlNhac, oXoa, oChonThuVien };
}

/** Khối "đính kèm video": chọn từ thư viện Video, HOẶC tải video mới từ máy (thêm vào thư
    viện), HOẶC dán link (YouTube, Drive, TikTok, FB, .mp4). */
async function khoiDinhKemVideo(tb) {
  const khung = e('div');
  khung.style.cssText = 'border-top:1px dashed var(--vien);padding-top:12px;margin-top:4px';
  khung.append(Object.assign(e('div', null, '🎬 Video đính kèm'), { style: 'font-weight:700;font-size:13.5px;margin-bottom:8px' }));

  let oXoa = null;
  if (tb && (tb.videoKhoa || tb.videoUrl)) {
    if (tb.videoKhoa) {
      const vid = e('video');
      vid.controls = true;
      vid.preload = 'metadata';
      vid.src = '/api/thong-bao-video?id=' + tb.id;
      vid.style.cssText = 'max-width:240px;max-height:140px;border-radius:8px;display:block;margin-bottom:8px;background:#000';
      khung.append(vid);
    }
    const [o, l] = hangTich('tbXoaVideo', 'Xoá video hiện tại', false);
    oXoa = o;
    khung.append(l);
  }

  const dsVideo = await layDanhSachThuVien('/api/gv/thu-vien-video');
  const oChonThuVien = oChon('tbChonVideo',
    [['', '— Không chọn —'], ...dsVideo.map((v) => [String(v.id), v.ten || 'Video chưa đặt tên'])],
    tb && tb.videoId ? String(tb.videoId) : '');

  const oTep = e('input');
  oTep.type = 'file';
  oTep.accept = 'video/mp4,video/webm,video/quicktime,video/*';
  oTep.id = 'tbTepVideo';
  oTep.className = 'o-nhap';

  const oUrlVideo = oNhap('tbVideo', 'text', tb ? (tb.videoUrl || '') : '', 'Dán link YouTube, Google Drive, TikTok, Facebook, hoặc link .mp4');

  khung.append(
    truong('Cách 1: Chọn video có sẵn trong Thư viện Video', oChonThuVien),
    truong('Cách 2: Hoặc dán link video (YouTube, Drive, TikTok, Facebook, .mp4)', oUrlVideo, 'Hệ thống tự động nhận diện và nhúng phát video trên cả máy tính lẫn điện thoại.'),
    truong('Cách 3: Hoặc tải file video mới từ máy/điện thoại (tối đa 50 MB, tự thêm vào thư viện)', oTep)
  );

  return { khung, oTep, oUrlVideo, oXoa, oChonThuVien };
}

export async function moHopThoaiSoanThongBao(tb, lamMoi) {
  const oNgay = oNhap('tbNgay', 'date', tb ? tb.ngay : homNay());
  const oTd = oNhap('tbTd', 'text', tb ? tb.tieuDe : '', 'Ví dụ: Họp phụ huynh đầu năm');
  const oNd = oNhap('tbNd', 'textarea', tb ? tb.noiDung : '', 'Nội dung chi tiết…');
  const oLoai = oChon('tbLoai', LOAI_THONG_BAO, tb ? tb.loai : 'Chủ nhiệm');
  const oMucDo = oChon('tbMucDo', MUC_DO_THONG_BAO, tb ? (tb.mucDo || '') : '');

  const [oGhim, hangGhim] = hangTich('tbGhim', 'Ghim lên đầu trang lớp', tb && tb.ghim);
  const [oNoiBat, hangNoiBat] = hangTich('tbNoiBat', 'Hiện trong băng điểm nhấn ở trang chủ', tb && tb.noiBat);

  // Tải sẵn danh sách 3 thư viện trước khi mở hộp thoại (song song cho nhanh) — tránh hộp
  // thoại "giật" khi các khối đính kèm tự tải danh sách xong mới vẽ lại.
  const [ketQuaHinh, ketQuaNhac, ketQuaVideo] = await Promise.all([
    khoiDinhKemHinh(tb), khoiDinhKemNhac(tb), khoiDinhKemVideo(tb),
  ]);
  const { khung: khoiHinh, oTep: oTepHinh, oUrlHinh, oXoa: oXoaHinh, oChonThuVien: oChonAnh } = ketQuaHinh;
  const { khung: khoiNhac, oTep: oTepNhac, oUrlNhac, oXoa: oXoaNhac, oChonThuVien: oChonNhac } = ketQuaNhac;
  const { khung: khoiVideo, oTep: oTepVideo, oUrlVideo, oXoa: oXoaVideo, oChonThuVien: oChonVideo } = ketQuaVideo;

  moHopThoai(tb ? 'Sửa thông báo' : 'Soạn thông báo', [
    truong('Ngày', oNgay),
    truong('Tiêu đề', oTd),
    truong('Loại', oLoai),
    truong('Mức độ quan trọng', oMucDo, 'Quyết định màu nhãn hiển thị cho học sinh — từ Bình thường, Quan trọng, Rất quan trọng đến Khẩn cấp.'),
    truong('Nội dung', oNd),
    hangGhim,
    hangNoiBat,
    khoiVideo,
    khoiHinh,
    khoiNhac,
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut(tb ? 'Lưu thay đổi' : 'Đăng thông báo', '', async (ev) => {
      if (!oTd.value.trim() || !oNd.value.trim()) return nhac('Cần nhập cả tiêu đề và nội dung', 'xau');
      const tepNhac = oTepNhac.files[0];
      if (tepNhac && tepNhac.type !== 'audio/mpeg' && !/\.mp3$/i.test(tepNhac.name)) {
        return nhac('File âm thanh chỉ nhận định dạng .mp3', 'xau');
      }
      const tepVideo = oTepVideo.files[0];
      if (tepVideo && tepVideo.size > 50_000_000) {
        return nhac('File video vượt quá 50 MB, vui lòng chọn file nhỏ hơn hoặc dùng link YouTube/Drive', 'xau');
      }

      ev.currentTarget.disabled = true;
      try {
        const than = {
          ngay: oNgay.value, tieuDe: oTd.value, noiDung: oNd.value, loai: oLoai.value,
          ghim: oGhim.checked, noiBat: oNoiBat.checked, mucDo: oMucDo.value,
          videoUrl: (oXoaVideo && oXoaVideo.checked) ? '' : oUrlVideo.value.trim(),
        };

        // Ảnh: xoá > chọn từ thư viện > dán link. Nếu tải file mới thì gọi riêng bên dưới sau
        // khi có id thông báo (có thể ghi đè lựa chọn ở đây, không sao vì hiếm khi chọn cùng lúc 2 cách).
        if (oXoaHinh && oXoaHinh.checked) { than.anhId = null; than.hinhUrl = ''; }
        else if (oChonAnh.value) { than.anhId = Number(oChonAnh.value); than.hinhUrl = ''; }
        else if (oUrlHinh.value.trim()) { than.anhId = null; than.hinhUrl = oUrlHinh.value.trim(); }

        if (oXoaNhac && oXoaNhac.checked) { than.amThanhId = null; than.nhacUrl = ''; }
        else if (oChonNhac.value) { than.amThanhId = Number(oChonNhac.value); than.nhacUrl = ''; }
        else if (oUrlNhac.value.trim()) { than.amThanhId = null; than.nhacUrl = oUrlNhac.value.trim(); }

        if (oXoaVideo && oXoaVideo.checked) than.videoId = null;
        else if (oChonVideo.value) than.videoId = Number(oChonVideo.value);

        let id = tb ? tb.id : null;
        if (tb) await api('/api/gv/thong-bao', { method: 'PATCH', than: { id, ...than } });
        else { const kq = await api('/api/gv/thong-bao', { method: 'POST', than }); id = kq.id; }

        // Tải file MỚI (nếu có) — tự thêm vào đúng thư viện rồi đính kèm luôn, ghi đè lựa chọn
        // "chọn từ thư viện"/"dán link" ở trên nếu giáo viên lỡ chọn cả hai.
        if (oTepHinh.files[0]) {
          const blob = await nenAnhThanhBlob(oTepHinh.files[0]);
          await api(`/api/gv/thong-bao-tep?id=${id}&loai=hinh`, {
            method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob,
          });
        }
        if (tepNhac) {
          const duLieu = await tepNhac.arrayBuffer();
          await api(`/api/gv/thong-bao-tep?id=${id}&loai=nhac`, {
            method: 'POST', headers: { 'Content-Type': 'audio/mpeg' }, body: duLieu,
          });
        }
        if (tepVideo) {
          const duLieu = await tepVideo.arrayBuffer();
          await api(`/api/gv/thong-bao-tep?id=${id}&loai=video`, {
            method: 'POST', headers: { 'Content-Type': tepVideo.type || 'video/mp4' }, body: duLieu,
          });
        }

        dongHopThoai();
        nhac(tb ? 'Đã lưu thông báo' : 'Đã đăng thông báo mới', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}
