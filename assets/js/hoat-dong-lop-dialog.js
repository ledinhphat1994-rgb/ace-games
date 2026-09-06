/* Hộp thoại thêm MỘT mục vào "Hoạt động lớp" — dành cho giáo viên hoặc học sinh được cấp quyền
   quản lý Ảnh/Âm thanh/Video. Cùng cách chọn gọn như hộp thoại Banner: chọn LOẠI bằng tab (Ảnh/
   Video/Âm thanh), rồi chọn NGUỒN bằng 3 nút nhỏ (Thư viện có sẵn / Tải lên / Dán link) — chỉ
   một ô nhập hiện ra tại một thời điểm. */
import { e, api, datNoiDung, ngayVN, nenAnhThanhBlob, nhac } from './chung.js';
import { nut, oNhap, oChon, moHopThoai, dongHopThoai } from './giao-dien.js';

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

const CAC_LOAI = [['anh', '🖼 Ảnh'], ['video', '🎬 Video'], ['am-thanh', '🎵 Âm thanh']];

export async function moHopThoaiThemHoatDong(lamMoi) {
  const [ketQuaAnh, ketQuaVideo, ketQuaNhac] = await Promise.all([khoiAnh(), khoiVideo(), khoiAmThanh()]);
  const KHOI_THEO_LOAI = { anh: ketQuaAnh, video: ketQuaVideo, 'am-thanh': ketQuaNhac };

  let loaiHienTai = 'anh';
  const dayTabLoai = e('div', 'day-loc');
  const khungLoai = e('div');
  const oChuThich = oNhap('hdChuThich', 'text', '', 'Ví dụ: Buổi lao động ngày 05/09 (không bắt buộc)');

  function veTabLoai() {
    datNoiDung(dayTabLoai, ...CAC_LOAI.map(([ma, nhan]) => {
      const b = e('button', 'vien-loc', nhan);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(loaiHienTai === ma));
      b.addEventListener('click', () => { loaiHienTai = ma; veTabLoai(); veNoiDungLoai(); });
      return b;
    }));
  }
  function veNoiDungLoai() {
    datNoiDung(khungLoai, KHOI_THEO_LOAI[loaiHienTai].khung);
  }
  veTabLoai();
  veNoiDungLoai();

  moHopThoai('Thêm hoạt động lớp', [
    e('p', 'trong', 'Chọn ảnh, video hoặc âm thanh để đăng vào khối "Hoạt động lớp" ở trang chủ.'),
    dayTabLoai,
    khungLoai,
    (() => { const d = e('div'); d.style.marginTop = '10px'; d.append(e('label', 'nhan-nhap', 'Chú thích'), oChuThich); return d; })(),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Đăng', '', async (ev) => {
      const { oTep, oLink, oThuVien, layNguon } = KHOI_THEO_LOAI[loaiHienTai];
      const nguon = layNguon();
      const tep = oTep.files[0];

      if (loaiHienTai === 'video' && tep && tep.size > 50_000_000) {
        return nhac('File video vượt quá 50 MB, vui lòng chọn file nhỏ hơn hoặc dùng link.', 'xau');
      }
      if (loaiHienTai === 'am-thanh' && tep && tep.size > 12_000_000) {
        return nhac('File nhạc vượt quá 12 MB, vui lòng chọn file nhỏ hơn hoặc dùng link.', 'xau');
      }
      if (nguon === 'tai-len' && !tep) return nhac('Chưa chọn file để tải lên.', 'xau');
      if (nguon === 'thu-vien' && !oThuVien.value) return nhac('Chưa chọn mục nào trong thư viện.', 'xau');
      if (nguon === 'link' && !oLink.value.trim()) return nhac('Chưa dán link nào.', 'xau');

      ev.currentTarget.disabled = true;
      try {
        if (nguon === 'tai-len') {
          const duLieu = loaiHienTai === 'anh' ? await nenAnhThanhBlob(tep) : await tep.arrayBuffer();
          const kieu = loaiHienTai === 'anh' ? 'image/jpeg' : (tep.type || (loaiHienTai === 'video' ? 'video/mp4' : 'audio/mpeg'));
          await api(`/api/gv/hoat-dong-lop-tep?loai=${loaiHienTai}`, { method: 'POST', headers: { 'Content-Type': kieu }, body: duLieu });
        } else {
          const than = { loai: loaiHienTai, chuThich: oChuThich.value.trim() };
          if (nguon === 'thu-vien') {
            if (loaiHienTai === 'anh') than.anhId = Number(oThuVien.value);
            else if (loaiHienTai === 'video') than.videoId = Number(oThuVien.value);
            else than.amThanhId = Number(oThuVien.value);
          } else {
            than.url = oLink.value.trim();
          }
          await api('/api/gv/hoat-dong-lop', { method: 'POST', than });
        }

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
