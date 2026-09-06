/* Hộp thoại đổi ảnh/video nền đầu trang lớp (banner) — chỉ giáo viên chủ nhiệm.
   Mô phỏng đúng "3 cách đính kèm" đã dùng cho Thông báo (xem thong-bao-dialog.js): chọn từ
   thư viện có sẵn / tải file mới / dán link ngoài — áp dụng cho ảnh và video, ĐÚNG MỘT TRONG
   HAI tại một thời điểm. Không có mục âm thanh ở đây — nhạc nền trang chủ đã là một tính năng
   riêng (Thư viện Âm thanh → Làm nhạc nền), banner chỉ lo phần "nhìn thấy". */
import { e, api, ngayVN, nenAnhThanhBlob, nhac } from './chung.js';
import { nut, truong, oNhap, oChon, moHopThoai, dongHopThoai } from './giao-dien.js';

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

async function layDanhSachThuVien(duong) {
  try {
    const d = await api(duong);
    return d.danhSach || [];
  } catch {
    return [];
  }
}

async function khoiChonHinh(banner) {
  const khung = e('div');
  khung.style.cssText = 'border-top:1px dashed var(--vien);padding-top:12px;margin-top:4px';
  khung.append(Object.assign(e('div', null, '🖼 Ảnh nền'), { style: 'font-weight:700;font-size:13.5px;margin-bottom:8px' }));

  if (banner && (banner.bannerHinhKhoa || banner.bannerHinhUrl)) {
    const img = e('img');
    img.src = xuLyLinkHinh(banner.bannerHinhKhoa || banner.bannerHinhUrl);
    img.style.cssText = 'max-width:200px;max-height:120px;border-radius:8px;display:block;margin-bottom:8px;object-fit:cover';
    khung.append(img);
  }

  const dsAnh = await layDanhSachThuVien('/api/gv/anh');
  const oChonThuVien = oChon('bnChonAnh',
    [['', '— Không chọn —'], ...dsAnh.map((a) => [String(a.id), `${a.chuThich || 'Ảnh'} — ${ngayVN(a.ngay)}`])],
    banner && banner.bannerAnhId ? String(banner.bannerAnhId) : '');

  const oTep = e('input');
  oTep.type = 'file';
  oTep.accept = 'image/jpeg,image/png,image/webp';
  oTep.id = 'bnTepHinh';
  oTep.className = 'o-nhap';

  const oUrlHinh = oNhap('bnUrlHinh', 'text', (banner && banner.bannerHinhUrl) || '', 'Dán link ảnh trực tiếp (https://...) hoặc link chia sẻ Google Drive');

  khung.append(
    truong('Cách 1: Chọn ảnh có sẵn trong Thư viện Ảnh', oChonThuVien),
    truong('Cách 2: Hoặc tải ảnh mới từ máy (tự nén, tự thêm vào thư viện)', oTep, 'Hệ thống tự nén ảnh tối ưu dung lượng (dưới 1,5 MB).'),
    truong('Cách 3: Hoặc dán link ảnh trực tuyến', oUrlHinh, 'Dán link ảnh từ internet (chuột phải chọn "Sao chép địa chỉ hình ảnh") hoặc link Google Drive (quyền xem: Bất kỳ ai có liên kết).')
  );

  return { khung, oTep, oUrlHinh, oChonThuVien };
}

async function khoiChonVideo(banner) {
  const khung = e('div');
  khung.style.cssText = 'border-top:1px dashed var(--vien);padding-top:12px;margin-top:4px';
  khung.append(Object.assign(e('div', null, '🎬 Video nền'), { style: 'font-weight:700;font-size:13.5px;margin-bottom:8px' }));

  if (banner && banner.bannerVideoTen) {
    khung.append(Object.assign(e('div', null, '🎬 Đang dùng: ' + banner.bannerVideoTen), { style: 'font-size:13px;margin-bottom:8px;color:var(--chu-nhat)' }));
  }

  const dsVideo = await layDanhSachThuVien('/api/gv/thu-vien-video');
  const oChonThuVien = oChon('bnChonVideo',
    [['', '— Không chọn —'], ...dsVideo.map((v) => [String(v.id), v.ten || 'Video chưa đặt tên'])],
    banner && banner.bannerVideoId ? String(banner.bannerVideoId) : '');

  const oTep = e('input');
  oTep.type = 'file';
  oTep.accept = 'video/mp4,video/webm,video/quicktime,video/*';
  oTep.id = 'bnTepVideo';
  oTep.className = 'o-nhap';

  const oUrlVideo = oNhap('bnUrlVideo', 'text', (banner && banner.bannerVideoUrl) || '', 'Dán link video phát trực tiếp (.mp4)');

  khung.append(
    truong('Cách 1: Chọn video có sẵn trong Thư viện Video', oChonThuVien),
    truong('Cách 2: Hoặc tải video mới từ máy/điện thoại (tối đa 50 MB, tự thêm vào thư viện)', oTep),
    truong('Cách 3: Hoặc dán link video .mp4 trực tuyến', oUrlVideo, 'Banner tự phát/lặp lại/tắt tiếng nên chỉ nhận link phát trực tiếp (.mp4) — không dùng được link YouTube/TikTok/Facebook ở đây.')
  );

  return { khung, oTep, oUrlVideo, oChonThuVien };
}

export async function moHopThoaiBannerLop(lamMoi) {
  let banner = {};
  try {
    const d = await api('/api/gv/lop-banner');
    banner = d.banner || {};
  } catch (err) {
    return nhac(err.message, 'xau');
  }

  const coBanner = Boolean(banner.bannerAnhId || banner.bannerHinhUrl || banner.bannerVideoId || banner.bannerVideoUrl);
  const [oXoa, hangXoa] = hangTich('bnXoa', 'Xoá banner hiện tại, dùng lại nền mặc định', false);

  const [ketQuaHinh, ketQuaVideo] = await Promise.all([khoiChonHinh(banner), khoiChonVideo(banner)]);
  const { khung: khoiHinh, oTep: oTepHinh, oUrlHinh, oChonThuVien: oChonAnh } = ketQuaHinh;
  const { khung: khoiVideo, oTep: oTepVideo, oUrlVideo, oChonThuVien: oChonVideo } = ketQuaVideo;

  moHopThoai('Ảnh/video nền đầu trang lớp', [
    e('p', null, 'Chọn ĐÚNG MỘT TRONG HAI để làm nền cho khối giới thiệu đầu trang lớp: ảnh HOẶC video. Chọn/tải loại nào thì loại kia tự bỏ.'),
    coBanner ? hangXoa : null,
    khoiVideo,
    khoiHinh,
  ].filter(Boolean), [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      const tepVideo = oTepVideo.files[0];
      if (tepVideo && tepVideo.size > 50_000_000) {
        return nhac('File video vượt quá 50 MB, vui lòng chọn file nhỏ hơn hoặc dùng link .mp4', 'xau');
      }
      const coXoa = oXoa && oXoa.checked;
      const coChonGi = coXoa || oTepHinh.files[0] || tepVideo
        || oChonVideo.value || oUrlVideo.value.trim() || oChonAnh.value || oUrlHinh.value.trim();
      if (!coChonGi) {
        return nhac('Chưa chọn ảnh hoặc video nào — tích vào "Xoá banner" nếu muốn quay về nền mặc định.', 'xau');
      }

      ev.currentTarget.disabled = true;
      try {
        if (coXoa) {
          await api('/api/gv/lop-banner', { method: 'PATCH', than: {} });
        } else if (oTepHinh.files[0]) {
          const blob = await nenAnhThanhBlob(oTepHinh.files[0]);
          await api('/api/gv/lop-banner-tep?loai=hinh', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
        } else if (tepVideo) {
          const duLieu = await tepVideo.arrayBuffer();
          await api('/api/gv/lop-banner-tep?loai=video', { method: 'POST', headers: { 'Content-Type': tepVideo.type || 'video/mp4' }, body: duLieu });
        } else {
          const than = {};
          if (oChonVideo.value) than.videoId = Number(oChonVideo.value);
          else if (oUrlVideo.value.trim()) than.videoUrl = oUrlVideo.value.trim();
          else if (oChonAnh.value) than.anhId = Number(oChonAnh.value);
          else than.hinhUrl = oUrlHinh.value.trim();
          await api('/api/gv/lop-banner', { method: 'PATCH', than });
        }

        dongHopThoai();
        nhac('Đã cập nhật banner lớp', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}
