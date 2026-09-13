/* Ứng dụng quản lý lớp dành cho giáo viên chủ nhiệm.
   Điều hướng bằng dấu # trên thanh địa chỉ: #/diem-danh, #/hoc-sinh, ... */
import {
  $, $$, e, datNoiDung, api, homNay, ngayVN, ngayDayDu,
  ganDoiGiaoDien, nhac, khoiLoi, khoiDangTai,
  layNhanTaiKhoan, layCacDongTaiKhoan, moBangThemeBg, ganNhacNen, nhanMucDo, giuViTriCuonKhiVe,
  batDauTheoDoiPhien,
} from '/assets/js/chung.js';
import { moHopThoaiSoanThongBao } from '/assets/js/thong-bao-dialog.js';
import { moHopThoaiThemHoatDong } from '/assets/js/hoat-dong-lop-dialog.js';
import {
  tieuDeTrang, oThongKe, nut, truong, oNhap, oChon, moHopThoai, dongHopThoai, trangLichSuKhoiPhucChung, boiNgayVN,
} from '/assets/js/giao-dien.js';
import { themVaoHangDoi, soChoGui, dongBo, tuDongBoKhiCoMang } from '/assets/js/hang-doi.js';
import {
  trangThongKe, trangBaoCao, trangMaCaNhan, trangHinhAnh, trangThuVienAmThanh, trangThuVienVideo, trangNhatKyDangNhap,
  trangHinhAnhThungRac, trangThuVienAmThanhThungRac, trangThuVienVideoThungRac,
} from './trang-hoc-tap.js';
import { trangQuy, trangQuyLichSu } from './trang-quy.js';
import { trangThoiKhoaBieu, trangThoiKhoaBieuLichSu } from './trang-lich.js';
import { trangDiemDanhLichSu } from './trang-diem-danh-lich-su.js';
import { trangResetDuLieu } from './trang-reset-du-lieu.js';
import { KHUNG, PHAM_VI_LOP_ID, PHIEN, danhDauMenu, datPhamVi, datPhien, duocVaoTuyen, locMenuTheoQuyen } from './lib.js';
import { trangBaoCaoViPham, trangBienTapVien, trangDuyetGiaoVien, trangHeThong, trangKiemDuyet, trangLopThanhVien, trangMaCongDong } from './pages/admin.js';
import { trangBangTin, trangCampus, trangCampusHighlights, trangHoSoGiaoVien, trangPhongCampus } from './pages/campus.js';
import { trangDiemDanh } from './pages/diem-danh.js';
import { trangHoSo, trangHocSinh } from './pages/hoc-sinh.js';
import { trangNguoiDung } from './pages/nguoi-dung.js';
import { trangHoatDongLop, trangThem, trangThongBao } from './pages/noi-dung.js';
import { trangTongQuan } from './pages/tong-quan.js';

ganDoiGiaoDien($('#doiGiaoDien'));

const nutTheme = $('#nutThemeBg');
if (nutTheme) nutTheme.addEventListener('click', moBangThemeBg);

const TRANG = {
  '/tong-quan': trangTongQuan,
  '/nguoi-dung': trangNguoiDung,
  '/campus-quan-tri': trangCampus,
  '/bang-tin-quan-tri': trangBangTin,
  '/lop-quan-tri': trangLopThanhVien,
  '/kiem-duyet-quan-tri': trangKiemDuyet,
  '/he-thong-quan-tri': trangHeThong,
  '/diem-danh': trangDiemDanh,
  '/diem-danh-lich-su': () => trangDiemDanhLichSu(KHUNG),
  '/hoc-sinh': trangHocSinh,
  '/hoat-dong-lop': () => trangHoatDongLop(KHUNG),
  '/hoat-dong-lop-khoi-phuc': () => trangLichSuKhoiPhucChung(KHUNG, { muc: 'hoat-dong-lop', tieuDe: 'Hoạt động lớp', veTrangTruoc: '#/hoat-dong-lop' }),
  '/thong-bao': trangThongBao,
  '/thong-bao-khoi-phuc': () => trangLichSuKhoiPhucChung(KHUNG, { muc: 'thong-bao', tieuDe: 'Thông báo', veTrangTruoc: '#/thong-bao' }),
  '/thong-ke': () => trangThongKe(KHUNG),
  '/bao-cao': () => trangBaoCao(KHUNG),
  '/ma-ca-nhan': () => trangMaCaNhan(KHUNG),
  '/nhat-ky-dang-nhap': () => trangNhatKyDangNhap(KHUNG),
  '/reset-du-lieu': () => trangResetDuLieu(KHUNG),
  '/hinh-anh': () => trangHinhAnh(KHUNG),
  '/hinh-anh-thung-rac': () => trangHinhAnhThungRac(KHUNG),
  '/thu-vien-am-thanh': () => trangThuVienAmThanh(KHUNG),
  '/thu-vien-am-thanh-thung-rac': () => trangThuVienAmThanhThungRac(KHUNG),
  '/thu-vien-video': () => trangThuVienVideo(KHUNG),
  '/thu-vien-video-thung-rac': () => trangThuVienVideoThungRac(KHUNG),
  '/quy': () => trangQuy(KHUNG),
  '/quy-lich-su': () => trangQuyLichSu(KHUNG),
  '/thoi-khoa-bieu': () => trangThoiKhoaBieu(KHUNG),
  '/thoi-khoa-bieu-lich-su': () => trangThoiKhoaBieuLichSu(KHUNG),
  '/thoi-khoa-bieu-khoi-phuc': () => trangLichSuKhoiPhucChung(KHUNG, { muc: 'thoi-khoa-bieu', tieuDe: 'Thời khoá biểu', veTrangTruoc: '#/thoi-khoa-bieu' }),
  '/campus-highlights': trangCampusHighlights,
  '/ho-so-gv': trangHoSoGiaoVien,
  '/phong-campus': trangPhongCampus,
  '/bao-cao-vi-pham': () => trangBaoCaoViPham('all'),
  '/duyet-giao-vien': trangDuyetGiaoVien,
  '/ma-cong-dong': trangMaCongDong,
  '/bien-tap-vien': trangBienTapVien,
  '/them': trangThem,
};

export async function dieuHuong() {
  const duong = location.hash.replace(/^#/, '') || (PHIEN.role === 'teacher' ? '/tong-quan' : '/them');
  danhDauMenu(duong);
  window.scrollTo(0, 0);

  if (!duocVaoTuyen(duong) && duong !== '/them') {
    datNoiDung(KHUNG, khoiLoi(
      'Tài khoản này không có quyền vào mục này. Vào "Thêm" để xem các việc bạn được phép làm.'
    ));
    return;
  }

  try {
    const hoSo = duong.match(/^\/hoc-sinh\/(\d+)$/);
    if (hoSo) return await trangHoSo(Number(hoSo[1]));

    const xemTkb = duong.match(/^\/thoi-khoa-bieu-xem\/(\d+)$/);
    if (xemTkb) return await trangThoiKhoaBieu(KHUNG, Number(xemTkb[1]));

    const xuLy = TRANG[duong] || (PHIEN.role === 'teacher' ? trangTongQuan : trangThem);
    await xuLy();
  } catch (err) {
    console.error(err);
    datNoiDung(KHUNG, khoiLoi('Không tải được trang: ' + err.message));
  }
}

(async function khoiDong() {
  try {
    const d = await api('/api/whoami');
    datPhien({ role: d.role, ten: d.ten || '', vaiTro: d.vaiTro || '', quyen: d.quyen || [], tenLop: d.tenLop || '', namHoc: d.namHoc || '', isSchoolAdmin: Boolean(d.isSchoolAdmin || d.laAdminTruong) });
  } catch {
    // Không lấy được thì coi như giáo viên (an toàn hơn là ẩn hết) — API vẫn tự kiểm tra thật ở máy chủ.
  }

  // Chỉ hiện tên + quyền — tên lớp đang quản lý đã hiện sẵn ở huy hiệu ngay cạnh đó (mã lớp +
  // năm học), không nhắc lại bằng chữ "Lớp ..." riêng nữa (trước đây có dòng chữ này, thừa vì
  // đã có huy hiệu, lại dễ đọc thành lặp từ nếu chức danh tài khoản cũng chứa chữ "Quản lý").
  // Tên và chức danh xuống 2 DÒNG RIÊNG (bỏ dấu "·" nối giữa) — trước đây nhồi chung 1 dòng dài
  // "Tên · Chức danh", trên điện thoại hẹp dễ vỡ chữ giữa dòng, phải tách hẳn cho rõ ràng. Icon
  // tách ra một cột RIÊNG (không nhồi vào đầu dòng 1) để dòng 1 và dòng 2 luôn căn thẳng lề trái.
  const hieuPhu = document.querySelector('.hieu-phu');
  if (hieuPhu) {
    hieuPhu.textContent = PHIEN.isSchoolAdmin ? 'Quản trị viên trường' : (PHIEN.ten || 'Giáo viên');
  }

  // Nạp phạm vi quản trị thật (Admin IA v1) — dùng /api/gv/lop-can-chu-y vì nó vốn đã trả đúng
  // danh sách lớp trong phạm vi tài khoản (School Admin: tất cả; GVCN: đúng các lớp mình phụ
  // trách qua giao_vien_lop, hỗ trợ kiêm nhiệm nhiều lớp) — không cần gọi thêm API nào khác.
  const scopeSelect = document.getElementById('adminScopeSelect');
  if (scopeSelect) {
    let dsLopPhamVi = [];
    try {
      const res = await api('/api/gv/lop-can-chu-y');
      dsLopPhamVi = Array.isArray(res?.danhSach) ? res.danhSach : [];
    } catch { /* giữ mảng rỗng, coi như 1 lớp mặc định bên dưới */ }

    scopeSelect.textContent = '';
    if (PHIEN.isSchoolAdmin || dsLopPhamVi.length > 1) {
      if (PHIEN.isSchoolAdmin) {
        const optAll = document.createElement('option');
        optAll.value = 'all';
        optAll.textContent = 'Toàn trường';
        optAll.style.cssText = 'background: #151A23; color: #FFFFFF;';
        scopeSelect.appendChild(optAll);
      }
      for (const l of dsLopPhamVi) {
        const opt = document.createElement('option');
        opt.value = String(l.lopId);
        opt.textContent = l.ten || ('Lớp ' + l.lopId);
        opt.style.cssText = 'background: #151A23; color: #FFFFFF;';
        scopeSelect.appendChild(opt);
      }
      // Nếu phạm vi đã lưu trước đó (sessionStorage) không còn hợp lệ với danh sách lớp hiện tại
      // (vd tài khoản GVCN không có tuỳ chọn "Toàn trường") thì lùi về lựa chọn đầu tiên có thật,
      // đồng thời cập nhật lại PHAM_VI_LOP_ID cho khớp — tránh lệch giữa ô chọn và dữ liệu tải về.
      const cacGiaTriHople = Array.from(scopeSelect.options).map((o) => o.value);
      const muon = PHAM_VI_LOP_ID ? String(PHAM_VI_LOP_ID) : 'all';
      const giaTriCuoi = cacGiaTriHople.includes(muon) ? muon : cacGiaTriHople[0];
      scopeSelect.value = giaTriCuoi;
      datPhamVi(giaTriCuoi === 'all' ? null : Number(giaTriCuoi));
      scopeSelect.disabled = false;
      scopeSelect.onchange = () => {
        datPhamVi(scopeSelect.value === 'all' ? null : Number(scopeSelect.value));
        dieuHuong();
      };
    } else {
      const opt = document.createElement('option');
      opt.value = 'lop';
      opt.textContent = (dsLopPhamVi[0] && dsLopPhamVi[0].ten) || PHIEN.tenLop || 'Lớp';
      opt.style.cssText = 'background: #151A23; color: #FFFFFF;';
      scopeSelect.appendChild(opt);
      scopeSelect.disabled = true;
      datPhamVi(null);
    }
  }
  if (PHIEN.tenLop) {
    document.title = `Quản lý ${PHIEN.tenLop}`;
    const hieuMaLop = document.querySelector('#hieuMaLop');
    if (hieuMaLop) hieuMaLop.textContent = PHIEN.tenLop.replace(/^Lớp\s*/i, '');
  }
  // Badge năm học ghim ở góc huy hiệu lớp — viết tắt "26–27" cho gọn, giống hệt cách trang lớp
  // công khai đang làm (xem apDungThuongHieuLop trong assets/js/trang-lop.js).
  if (PHIEN.namHoc) {
    const hieuNamHoc = document.querySelector('#hieuNamHoc');
    if (hieuNamHoc) {
      const m = PHIEN.namHoc.match(/(\d{4})\s*[–-]\s*(\d{4})/);
      hieuNamHoc.textContent = m ? `${m[1].slice(2)}–${m[2].slice(2)}` : PHIEN.namHoc;
    }
  }

  // "Đổi lớp chủ nhiệm" — chỉ giáo viên chủ nhiệm mới có (người có thể giữ mã của nhiều lớp);
  // tài khoản cán sự chỉ gắn với đúng một lớp nên nút này không có ý nghĩa gì với họ.
  const nutDoiLop = document.querySelector('#nutDoiLop');
  if (nutDoiLop) nutDoiLop.hidden = PHIEN.role !== 'teacher';

  locMenuTheoQuyen();
  addEventListener('hashchange', dieuHuong);
  dieuHuong();

  // Nút loa nhạc nền — cùng hành vi với trang lớp, để chuyển qua lại giữa khu quản lý và
  // trang lớp không thấy thanh đầu trang khác nhau.
  api('/api/nhac-nen-info').then((d) => ganNhacNen(d.nhac)).catch(() => {});

  // Có mạng trở lại thì tự gửi những lần điểm danh còn nằm chờ trong máy.
  tuDongBoKhiCoMang((kq) => {
    nhac(`Đã gửi ${kq.daGui} lần điểm danh lưu tạm lúc mất mạng`, 'tot');
    if (location.hash.startsWith('#/diem-danh')) dieuHuong();
  });

  batDauTheoDoiPhien();
})();
