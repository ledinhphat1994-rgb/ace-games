/* Hộp thoại thêm MỘT mục vào "Hoạt động lớp" — dành cho giáo viên hoặc học sinh được cấp quyền.
   Hỗ trợ 2 hình thức:
     1) Bài viết / Bản tin văn bản (text thông thường) — dành cho mọi tài khoản có quyền Hoạt động lớp.
     2) Đính kèm Media (Ảnh, Video, Âm thanh) — chỉ dành cho tài khoản có quyền Thư viện tương ứng. */
import { e, api, datNoiDung, ngayVN, nenAnhThanhBlob, nhac, homNay } from './chung.js';
import { nut, oNhap, oChon, moHopThoai, dongHopThoai, truong } from './giao-dien.js';

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

export async function moHopThoaiThemHoatDong(lamMoi) {
  // Lấy thông tin phiên để phân quyền các tab media
  const phien = await api('/api/whoami').catch(() => ({ role: 'teacher', quyen: [] }));
  const laGiaoVien = phien.role === 'teacher';
  const quyen = phien.quyen || [];
  const coQuyenAnh = laGiaoVien || quyen.includes('hinh-anh');
  const coQuyenVideo = laGiaoVien || quyen.includes('video');
  const coQuyenAmThanh = laGiaoVien || quyen.includes('am-thanh');
  const coBatKyMedia = coQuyenAnh || coQuyenVideo || coQuyenAmThanh;

  // Khởi tạo các khối nhập
  const oNgay = oNhap('hdNgay', 'date', homNay());

  // 1. Khối Văn bản (Text)
  const oTieuDe = oNhap('hdTieuDe', 'text', '', 'Ví dụ: Lao động vệ sinh khuôn viên lớp, Thi văn nghệ 20/11...');
  const oNoiDungText = oNhap('hdNoiDungText', 'textarea', '', 'Ghi lại diễn biến, thành tích hoặc chi tiết hoạt động...');
  oNoiDungText.rows = 4;
  const khungText = e('div');
  khungText.append(
    truong('Tiêu đề / Chủ đề hoạt động', oTieuDe),
    truong('Nội dung chi tiết', oNoiDungText),
    truong('Ngày diễn ra', oNgay)
  );

  // 2. Các khối Media (chỉ nạp khi có quyền tương ứng)
  const [ketQuaAnh, ketQuaVideo, ketQuaNhac] = await Promise.all([
    coQuyenAnh ? khoiAnh() : null,
    coQuyenVideo ? khoiVideo() : null,
    coQuyenAmThanh ? khoiAmThanh() : null,
  ]);
  const KHOI_THEO_LOAI = {
    text: { khung: khungText },
    anh: ketQuaAnh,
    video: ketQuaVideo,
    'am-thanh': ketQuaNhac,
  };

  // Mặc định chọn text nếu không có media hoặc ưu tiên text cho học sinh
  let loaiHienTai = coBatKyMedia ? 'anh' : 'text';

  const CAC_LOAI = [
    ['text', '📝 Văn bản / Bài viết', true],
    ['anh', coQuyenAnh ? '🖼 Ảnh' : '🔒 Ảnh', coQuyenAnh, 'Cần quyền Thư viện Ảnh'],
    ['video', coQuyenVideo ? '🎬 Video' : '🔒 Video', coQuyenVideo, 'Cần quyền Thư viện Video'],
    ['am-thanh', coQuyenAmThanh ? '🎵 Âm thanh' : '🔒 Âm thanh', coQuyenAmThanh, 'Cần quyền Thư viện Âm thanh'],
  ];

  const dayTabLoai = e('div', 'day-loc');
  dayTabLoai.style.cssText = 'margin-bottom:12px;display:flex;gap:6px;flex-wrap:wrap;';
  const khungLoai = e('div');
  const oChuThichMedia = oNhap('hdChuThichMedia', 'text', '', 'Ví dụ: Buổi giao lưu chào cờ sáng thứ Hai (không bắt buộc)');
  const vungChuThichMedia = e('div');
  vungChuThichMedia.style.marginTop = '10px';
  vungChuThichMedia.append(e('label', 'nhan-nhap', 'Chú thích ảnh/video/âm thanh'), oChuThichMedia);

  // Thông báo giải thích quy tắc text cho học sinh không có quyền media
  const hopHuongDan = e('div');
  hopHuongDan.style.cssText = 'padding:10px 12px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.25);border-radius:8px;font-size:12.5px;color:var(--chu);line-height:1.5;margin-bottom:12px;';
  if (!coBatKyMedia) {
    datNoiDung(hopHuongDan,
      Object.assign(e('b', null, 'ℹ️ Chế độ văn bản: '), { style: 'color:var(--chinh)' }),
      document.createTextNode('Bạn được cấp quyền '),
      e('i', null, 'Hoạt động lớp'),
      document.createTextNode(' để đăng tin, bài viết sự kiện bằng văn bản. Để tải ảnh, video hoặc bài hát, nhờ giáo viên chủ nhiệm cấp thêm quyền '),
      e('i', null, 'Thư viện'),
      document.createTextNode(' tương ứng.')
    );
  } else {
    datNoiDung(hopHuongDan,
      Object.assign(e('b', null, '💡 Hoạt động lớp: '), { style: 'color:var(--chinh)' }),
      document.createTextNode('Bạn có thể đăng bản tin dạng văn bản hoặc đính kèm ảnh, video, âm thanh vào trang chủ.')
    );
  }

  function veTabLoai() {
    datNoiDung(dayTabLoai, ...CAC_LOAI.map(([ma, nhan, choPhep, lyDo]) => {
      const b = e('button', 'vien-loc', nhan);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(loaiHienTai === ma));
      if (!choPhep) {
        b.style.opacity = '0.55';
        b.title = lyDo || 'Chưa được cấp quyền';
      }
      b.addEventListener('click', () => {
        if (!choPhep) {
          return nhac(`Tài khoản chưa được cấp quyền ${lyDo ? lyDo.replace('Cần ', '') : 'này'}. Bạn có thể ghi bài viết bằng tab "Văn bản / Bài viết".`, 'xau');
        }
        loaiHienTai = ma;
        veTabLoai();
        veNoiDungLoai();
      });
      return b;
    }));
  }

  function veNoiDungLoai() {
    if (loaiHienTai === 'text') {
      datNoiDung(khungLoai, KHOI_THEO_LOAI.text.khung);
      vungChuThichMedia.hidden = true;
    } else {
      datNoiDung(khungLoai, KHOI_THEO_LOAI[loaiHienTai].khung);
      vungChuThichMedia.hidden = false;
    }
  }

  veTabLoai();
  veNoiDungLoai();

  moHopThoai('Thêm hoạt động lớp', [
    hopHuongDan,
    dayTabLoai,
    khungLoai,
    vungChuThichMedia,
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Đăng lên trang chủ', '', async (ev) => {
      ev.currentTarget.disabled = true;

      try {
        if (loaiHienTai === 'text') {
          const td = oTieuDe.value.trim();
          const nd = oNoiDungText.value.trim();
          if (!td && !nd) {
            ev.currentTarget.disabled = false;
            return nhac('Vui lòng nhập tiêu đề hoặc nội dung hoạt động.', 'xau');
          }
          await api('/api/gv/hoat-dong-lop', {
            method: 'POST',
            than: {
              loai: 'text',
              tieuDe: td,
              chuThich: nd,
              ngay: oNgay.value || homNay(),
            },
          });
        } else {
          const { oTep, oLink, oThuVien, layNguon } = KHOI_THEO_LOAI[loaiHienTai];
          const nguon = layNguon();
          const tep = oTep.files[0];

          if (loaiHienTai === 'video' && tep && tep.size > 50_000_000) {
            ev.currentTarget.disabled = false;
            return nhac('File video vượt quá 50 MB, vui lòng chọn file nhỏ hơn hoặc dùng link.', 'xau');
          }
          if (loaiHienTai === 'am-thanh' && tep && tep.size > 12_000_000) {
            ev.currentTarget.disabled = false;
            return nhac('File nhạc vượt quá 12 MB, vui lòng chọn file nhỏ hơn hoặc dùng link.', 'xau');
          }
          if (nguon === 'tai-len' && !tep) {
            ev.currentTarget.disabled = false;
            return nhac('Chưa chọn file để tải lên.', 'xau');
          }
          if (nguon === 'thu-vien' && !oThuVien.value) {
            ev.currentTarget.disabled = false;
            return nhac('Chưa chọn mục nào trong thư viện.', 'xau');
          }
          if (nguon === 'link' && !oLink.value.trim()) {
            ev.currentTarget.disabled = false;
            return nhac('Chưa dán link nào.', 'xau');
          }

          if (nguon === 'tai-len') {
            const duLieu = loaiHienTai === 'anh' ? await nenAnhThanhBlob(tep) : await tep.arrayBuffer();
            const kieu = loaiHienTai === 'anh' ? 'image/jpeg' : (tep.type || (loaiHienTai === 'video' ? 'video/mp4' : 'audio/mpeg'));
            await api(`/api/gv/hoat-dong-lop-tep?loai=${loaiHienTai}`, { method: 'POST', headers: { 'Content-Type': kieu }, body: duLieu });
          } else {
            const than = { loai: loaiHienTai, chuThich: oChuThichMedia.value.trim(), ngay: oNgay.value || homNay() };
            if (nguon === 'thu-vien') {
              if (loaiHienTai === 'anh') than.anhId = Number(oThuVien.value);
              else if (loaiHienTai === 'video') than.videoId = Number(oThuVien.value);
              else than.amThanhId = Number(oThuVien.value);
            } else {
              than.url = oLink.value.trim();
            }
            await api('/api/gv/hoat-dong-lop', { method: 'POST', than });
          }
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
