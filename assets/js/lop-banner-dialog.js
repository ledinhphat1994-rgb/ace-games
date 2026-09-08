/* Hộp thoại đổi ảnh/video nền đầu trang lớp (banner) — chỉ giáo viên chủ nhiệm.
   Gọn theo 2 lớp lựa chọn để đỡ rối mắt: chọn LOẠI (Ảnh/Video) bằng tab, rồi chọn NGUỒN
   (Thư viện có sẵn / Tải lên / Dán link) bằng 3 nút nhỏ — chỉ MỘT ô nhập hiện ra tại một
   thời điểm, thay vì hiện sẵn cả 6 ô như trước. Không có mục âm thanh ở đây — nhạc nền trang
   chủ đã là một tính năng riêng (Thư viện Âm thanh → Làm nhạc nền), banner chỉ lo phần
   "nhìn thấy". */
import { e, api, datNoiDung, ngayVN, nenAnhThanhBlob, nhac } from './chung.js';
import { nut, oNhap, oChon, moHopThoai, dongHopThoai, khoiChonNguon } from './giao-dien.js';

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

async function khoiAnh(banner) {
  const dsAnh = await layDanhSachThuVien('/api/gv/anh');
  const oThuVien = oChon('bnChonAnh',
    [['', '— Chọn một ảnh —'], ...dsAnh.map((a) => [String(a.id), `${a.chuThich || 'Ảnh'} — ${ngayVN(a.ngay)}`])],
    banner?.bannerAnhId ? String(banner.bannerAnhId) : '');

  const oTep = e('input');
  oTep.type = 'file';
  oTep.accept = 'image/jpeg,image/png,image/webp';
  oTep.className = 'o-nhap';

  const oLink = oNhap('bnUrlHinh', 'text', banner?.bannerHinhUrl || '', 'Dán link ảnh (https://...) hoặc link Google Drive');

  const nguonMacDinh = banner?.bannerHinhUrl ? 'link' : (banner?.bannerAnhId ? 'thu-vien' : 'thu-vien');
  const { khung, layNguon } = khoiChonNguon({
    nguonMacDinh, oThuVien, oTep, oLink,
    ghiChuLink: 'Chuột phải ảnh → "Sao chép địa chỉ hình ảnh", hoặc link chia sẻ Google Drive (quyền xem: Bất kỳ ai có liên kết).',
  });

  return { khung, oTep, oLink, oThuVien, layNguon };
}

async function khoiVideo(banner) {
  const dsVideo = await layDanhSachThuVien('/api/gv/thu-vien-video');
  const oThuVien = oChon('bnChonVideo',
    [['', '— Chọn một video —'], ...dsVideo.map((v) => [String(v.id), v.ten || 'Video chưa đặt tên'])],
    banner?.bannerVideoId ? String(banner.bannerVideoId) : '');

  const oTep = e('input');
  oTep.type = 'file';
  oTep.accept = 'video/mp4,video/webm,video/quicktime,video/*';
  oTep.className = 'o-nhap';

  const oLink = oNhap('bnUrlVideo', 'text', banner?.bannerVideoUrl || '', 'Dán link video .mp4 phát trực tiếp');

  const nguonMacDinh = banner?.bannerVideoUrl ? 'link' : 'thu-vien';
  const { khung, layNguon } = khoiChonNguon({
    nguonMacDinh, oThuVien, oTep, oLink,
    ghiChuLink: 'Banner tự phát/lặp/tắt tiếng nên chỉ nhận link .mp4 phát trực tiếp — không dùng được link YouTube/TikTok/Facebook.',
  });

  return { khung, oTep, oLink, oThuVien, layNguon };
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
  const laVideoHienTai = Boolean(banner.bannerVideoId || banner.bannerVideoUrl);

  // Xem trước banner hiện tại (nếu có) — một dòng gọn, không choán chỗ.
  const khungXemTruoc = e('div');
  if (coBanner) {
    khungXemTruoc.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:8px;border:1px solid var(--vien);border-radius:10px';
    const nhoNhan = e('span', 'trong', 'Đang dùng:');
    nhoNhan.style.fontSize = '13px';
    if (banner.bannerHinhKhoa || banner.bannerHinhUrl) {
      const img = e('img');
      img.src = xuLyLinkHinh(banner.bannerHinhKhoa || banner.bannerHinhUrl);
      img.style.cssText = 'width:52px;height:36px;border-radius:6px;object-fit:cover';
      khungXemTruoc.append(img, nhoNhan, e('b', null, 'Ảnh nền'));
    } else {
      khungXemTruoc.append(e('span', null, '🎬'), nhoNhan, e('b', null, banner.bannerVideoTen || 'Video nền'));
    }
  }

  const [ketQuaAnh, ketQuaVideo] = await Promise.all([khoiAnh(banner), khoiVideo(banner)]);

  let loaiHienTai = laVideoHienTai ? 'video' : 'anh';
  const dayTabLoai = e('div', 'day-loc day-loc-deu');
  const khungLoai = e('div');

  function veTabLoai() {
    datNoiDung(dayTabLoai, ...[['anh', '🖼 Ảnh'], ['video', '🎬 Video']].map(([ma, nhan]) => {
      const b = e('button', 'vien-loc', nhan);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(loaiHienTai === ma));
      b.addEventListener('click', () => { loaiHienTai = ma; veTabLoai(); veNoiDungLoai(); });
      return b;
    }));
  }
  function veNoiDungLoai() {
    datNoiDung(khungLoai, loaiHienTai === 'anh' ? ketQuaAnh.khung : ketQuaVideo.khung);
  }
  veTabLoai();
  veNoiDungLoai();

  moHopThoai('Ảnh/video nền đầu trang lớp', [
    khungXemTruoc,
    e('p', 'trong', 'Chọn ảnh hoặc video làm nền cho khối giới thiệu đầu trang — chọn loại nào thì banner dùng đúng loại đó.'),
    dayTabLoai,
    khungLoai,
  ], [
    coBanner ? nut('🗑 Xoá banner', 'nut-nhe nut-nho', async (ev) => {
      // "currentTarget" chỉ tồn tại TRONG LÚC sự kiện đang lan truyền — qua khỏi "await" là bị
      // trình duyệt đặt lại thành null, nên phải lưu tham chiếu nút TRƯỚC khi chờ.
      const nutBam = ev.currentTarget;
      nutBam.disabled = true;
      try {
        await api('/api/gv/lop-banner', { method: 'PATCH', than: {} });
        dongHopThoai();
        nhac('Đã xoá banner, dùng lại nền mặc định', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) { nhac(err.message, 'xau'); nutBam.disabled = false; }
    }) : null,
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu', '', async (ev) => {
      const { oTep: oTepAnh, oLink: oLinkAnh, oThuVien: oThuVienAnh, layNguon: layNguonAnh } = ketQuaAnh;
      const { oTep: oTepVideo, oLink: oLinkVideo, oThuVien: oThuVienVideo, layNguon: layNguonVideo } = ketQuaVideo;

      if (loaiHienTai === 'video' && oTepVideo.files[0] && oTepVideo.files[0].size > 50_000_000) {
        return nhac('File video vượt quá 50 MB, vui lòng chọn file nhỏ hơn hoặc dùng link .mp4', 'xau');
      }

      const nutBam = ev.currentTarget;
      nutBam.disabled = true;
      try {
        if (loaiHienTai === 'anh') {
          const nguon = layNguonAnh();
          if (nguon === 'tai-len' && oTepAnh.files[0]) {
            const blob = await nenAnhThanhBlob(oTepAnh.files[0]);
            await api('/api/gv/lop-banner-tep?loai=hinh', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
          } else if (nguon === 'thu-vien' && oThuVienAnh.value) {
            await api('/api/gv/lop-banner', { method: 'PATCH', than: { anhId: Number(oThuVienAnh.value) } });
          } else if (nguon === 'link' && oLinkAnh.value.trim()) {
            await api('/api/gv/lop-banner', { method: 'PATCH', than: { hinhUrl: oLinkAnh.value.trim() } });
          } else {
            nutBam.disabled = false;
            return nhac('Chưa chọn ảnh nào — chọn từ thư viện, tải lên, hoặc dán link.', 'xau');
          }
        } else {
          const nguon = layNguonVideo();
          if (nguon === 'tai-len' && oTepVideo.files[0]) {
            const duLieu = await oTepVideo.files[0].arrayBuffer();
            await api('/api/gv/lop-banner-tep?loai=video', { method: 'POST', headers: { 'Content-Type': oTepVideo.files[0].type || 'video/mp4' }, body: duLieu });
          } else if (nguon === 'thu-vien' && oThuVienVideo.value) {
            await api('/api/gv/lop-banner', { method: 'PATCH', than: { videoId: Number(oThuVienVideo.value) } });
          } else if (nguon === 'link' && oLinkVideo.value.trim()) {
            await api('/api/gv/lop-banner', { method: 'PATCH', than: { videoUrl: oLinkVideo.value.trim() } });
          } else {
            nutBam.disabled = false;
            return nhac('Chưa chọn video nào — chọn từ thư viện, tải lên, hoặc dán link.', 'xau');
          }
        }

        dongHopThoai();
        nhac('Đã cập nhật banner lớp', 'tot');
        if (lamMoi) await lamMoi();
      } catch (err) {
        nhac(err.message, 'xau');
        nutBam.disabled = false;
      }
    }),
  ].filter(Boolean));
}
