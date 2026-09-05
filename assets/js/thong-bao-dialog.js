/* Hộp thoại soạn/sửa Thông báo — DÙNG CHUNG cho khu quản lý (giao-vien/app.js) và lối tắt
   "⚙ Quản lý" ngay trên trang lớp (trang-lop.js). */
import { e, api, homNay, nhac, nenAnhThanhBlob, MUC_DO_THONG_BAO } from './chung.js';
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

/** Khối "đính kèm hình ảnh": hỗ trợ tải ảnh từ máy (tự nén) HOẶC dán link ảnh trực tuyến. */
function khoiDinhKemHinh(tb) {
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

  const oTep = e('input');
  oTep.type = 'file';
  oTep.accept = 'image/jpeg,image/png,image/webp';
  oTep.id = 'tbTepHinh';
  oTep.className = 'o-nhap';

  const linkHienTai = (tb && tb.hinhKhoa && tb.hinhKhoa.startsWith('http')) ? tb.hinhKhoa : '';
  const oUrlHinh = oNhap('tbUrlHinh', 'text', linkHienTai, 'Dán link ảnh trực tiếp (https://...) hoặc link chia sẻ Google Drive');

  khung.append(
    truong('Cách 1: Chọn ảnh từ máy (tự nén nhỏ)', oTep, 'Hệ thống tự nén ảnh tối ưu dung lượng (dưới 1,5 MB) lưu vào Cloudflare R2.'),
    truong('Cách 2: Hoặc dán link ảnh trực tuyến', oUrlHinh, 'Dán link ảnh từ internet (chuột phải chọn "Sao chép địa chỉ hình ảnh") hoặc link Google Drive (quyền xem: Bất kỳ ai có liên kết).')
  );

  return { khung, oTep, oUrlHinh, oXoa };
}

/** Khối "đính kèm âm thanh": hỗ trợ tải file .mp3 từ máy HOẶC dán link nhạc trực tuyến. */
function khoiDinhKemNhac(tb) {
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

  const oTep = e('input');
  oTep.type = 'file';
  oTep.accept = 'audio/mpeg,.mp3';
  oTep.id = 'tbTepNhac';
  oTep.className = 'o-nhap';

  const linkHienTai = (tb && tb.nhacKhoa && tb.nhacKhoa.startsWith('http')) ? tb.nhacKhoa : '';
  const oUrlNhac = oNhap('tbUrlNhac', 'text', linkHienTai, 'Dán link file nhạc (.mp3) hoặc link chia sẻ Google Drive');

  khung.append(
    truong('Cách 1: Chọn file .mp3 từ máy (tối đa 12 MB)', oTep, 'Tệp MP3 tải lên sẽ lưu an toàn trong kho Cloudflare R2 của lớp.'),
    truong('Cách 2: Hoặc dán link âm thanh trực tuyến', oUrlNhac, 'Dán link tệp .mp3 trực tuyến hoặc link chia sẻ file âm thanh từ Google Drive.')
  );

  return { khung, oTep, oUrlNhac, oXoa };
}

/** Khối "đính kèm video": hỗ trợ tải video từ máy (R2) HOẶC dán link (YouTube, Drive, TikTok, FB, .mp4). */
function khoiDinhKemVideo(tb) {
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

  const oTep = e('input');
  oTep.type = 'file';
  oTep.accept = 'video/mp4,video/webm,video/quicktime,video/*';
  oTep.id = 'tbTepVideo';
  oTep.className = 'o-nhap';

  const oUrlVideo = oNhap('tbVideo', 'text', tb ? (tb.videoUrl || '') : '', 'Dán link YouTube, Google Drive, TikTok, Facebook, hoặc link .mp4');

  khung.append(
    truong('Cách 1: Dán link video (YouTube, Drive, TikTok, Facebook, .mp4)', oUrlVideo, 'Hệ thống tự động nhận diện và nhúng phát video trên cả máy tính lẫn điện thoại.'),
    truong('Cách 2: Hoặc chọn file video từ máy/điện thoại (tối đa 50 MB)', oTep, 'Tệp video tải lên sẽ được lưu an toàn trong kho Cloudflare R2.')
  );

  return { khung, oTep, oUrlVideo, oXoa };
}

export function moHopThoaiSoanThongBao(tb, lamMoi) {
  const oNgay = oNhap('tbNgay', 'date', tb ? tb.ngay : homNay());
  const oTd = oNhap('tbTd', 'text', tb ? tb.tieuDe : '', 'Ví dụ: Họp phụ huynh đầu năm');
  const oNd = oNhap('tbNd', 'textarea', tb ? tb.noiDung : '', 'Nội dung chi tiết…');
  const oLoai = oChon('tbLoai', LOAI_THONG_BAO, tb ? tb.loai : 'Chủ nhiệm');
  const oMucDo = oChon('tbMucDo', MUC_DO_THONG_BAO, tb ? (tb.mucDo || '') : '');

  const [oGhim, hangGhim] = hangTich('tbGhim', 'Ghim lên đầu trang lớp', tb && tb.ghim);
  const [oNoiBat, hangNoiBat] = hangTich('tbNoiBat', 'Hiện trong băng điểm nhấn ở trang chủ', tb && tb.noiBat);

  const { khung: khoiHinh, oTep: oTepHinh, oUrlHinh, oXoa: oXoaHinh } = khoiDinhKemHinh(tb);
  const { khung: khoiNhac, oTep: oTepNhac, oUrlNhac, oXoa: oXoaNhac } = khoiDinhKemNhac(tb);
  const { khung: khoiVideo, oTep: oTepVideo, oUrlVideo, oXoa: oXoaVideo } = khoiDinhKemVideo(tb);

  moHopThoai(tb ? 'Sửa thông báo' : 'Soạn thông báo', [
    truong('Ngày', oNgay),
    truong('Tiêu đề', oTd),
    truong('Loại', oLoai),
    truong('Mức độ quan trọng', oMucDo, 'Quyết định màu nhãn hiển thị cho học sinh — chọn "Quan trọng" cho tin cần chú ý nhất.'),
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

        if (oXoaHinh && oXoaHinh.checked) than.hinhKhoa = null;
        else if (oUrlHinh.value.trim()) than.hinhKhoa = oUrlHinh.value.trim();

        if (oXoaNhac && oXoaNhac.checked) than.nhacKhoa = null;
        else if (oUrlNhac.value.trim()) than.nhacKhoa = oUrlNhac.value.trim();

        let id = tb ? tb.id : null;
        if (tb) await api('/api/gv/thong-bao', { method: 'PATCH', than: { id, ...than } });
        else { const kq = await api('/api/gv/thong-bao', { method: 'POST', than }); id = kq.id; }

        // Xử lý tệp hình ảnh
        if (oXoaHinh && oXoaHinh.checked) {
          await api(`/api/gv/thong-bao-tep?id=${id}&loai=hinh`, { method: 'DELETE' });
        } else if (oTepHinh.files[0]) {
          const blob = await nenAnhThanhBlob(oTepHinh.files[0]);
          await api(`/api/gv/thong-bao-tep?id=${id}&loai=hinh`, {
            method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob,
          });
        }

        // Xử lý tệp âm thanh
        if (oXoaNhac && oXoaNhac.checked) {
          await api(`/api/gv/thong-bao-tep?id=${id}&loai=nhac`, { method: 'DELETE' });
        } else if (tepNhac) {
          const duLieu = await tepNhac.arrayBuffer();
          await api(`/api/gv/thong-bao-tep?id=${id}&loai=nhac`, {
            method: 'POST', headers: { 'Content-Type': 'audio/mpeg' }, body: duLieu,
          });
        }

        // Xử lý tệp video
        if (oXoaVideo && oXoaVideo.checked) {
          await api(`/api/gv/thong-bao-tep?id=${id}&loai=video`, { method: 'DELETE' });
        } else if (tepVideo) {
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
