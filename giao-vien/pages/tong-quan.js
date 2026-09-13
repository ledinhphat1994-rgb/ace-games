import { KHUNG, PHAM_VI_LOP_ID, PHIEN, apiTheoPhamVi, datPhamVi, gioNgayVN } from '../lib.js';
import { theLopChon } from './admin.js';
import { api, datNoiDung, e, khoiDangTai, khoiLoi } from '/assets/js/chung.js';
import { tieuDeTrang } from '/assets/js/giao-dien.js';


export function taoOThongKe(tieuDe, so, moTa, mauSo = '#00F2FE') {
  const o = e('div');
  o.style.cssText = 'padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);';
  const d1 = e('div', null, tieuDe);
  d1.style.cssText = 'font-size: 11px; color: var(--chu-nhat);';
  const d2 = e('div', null, String(so));
  d2.style.cssText = 'font-size: 20px; font-weight: 900; color: ' + mauSo + '; margin-top: 2px;';
  const d3 = e('div', null, moTa);
  d3.style.cssText = 'font-size: 10px; color: var(--chu-nhat); margin-top: 2px;';
  o.append(d1, d2, d3);
  return o;
}

export const NHAN_HANH_DONG_QT = {
  duyet_giao_vien: { icon: '✅', nhan: 'Duyệt giáo viên' },
  tu_choi_giao_vien: { icon: '⛔', nhan: 'Từ chối giáo viên' },
  khoa_tai_khoan: { icon: '🔒', nhan: 'Khoá tài khoản' },
  mo_khoa_tai_khoan: { icon: '🔓', nhan: 'Mở khoá tài khoản' },
};

export async function trangTongQuan() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải dữ liệu điều hành trường học...'));
  try {
    const [resPhong, resGame, resBaoCao, resGv, resLopChuY, resNhatKy] = await Promise.allSettled([
      api('/api/phong?phamVi=truong'),
      api('/api/game?action=danh_sach'),
      api('/api/gv/bao-cao?status=pending'),
      api('/api/gv/duyet-giao-vien'),
      api(apiTheoPhamVi('/api/gv/lop-can-chu-y')),
      api(apiTheoPhamVi('/api/gv/nhat-ky-quan-tri?limit=6')),
    ]);

    const dsPhong = resPhong.status === 'fulfilled' && Array.isArray(resPhong.value?.phong) ? resPhong.value.phong : [];
    const dsGame = resGame.status === 'fulfilled' && Array.isArray(resGame.value?.danhSach) ? resGame.value.danhSach : [];
    const pendingReports = resBaoCao.status === 'fulfilled' && Array.isArray(resBaoCao.value?.reports) ? resBaoCao.value.reports : [];
    const pendingTeachers = resGv.status === 'fulfilled' && Array.isArray(resGv.value?.pendingTeachers) ? resGv.value.pendingTeachers : [];
    const dsLop = resLopChuY.status === 'fulfilled' && Array.isArray(resLopChuY.value?.danhSach) ? resLopChuY.value.danhSach : [];
    const dsNhatKy = resNhatKy.status === 'fulfilled' && Array.isArray(resNhatKy.value?.danhSach) ? resNhatKy.value.danhSach : [];
    const dsLopChuaDiemDanh = dsLop.filter((l) => l.chuaDiemDanhHomNay);

    const activeCaro = dsGame.filter((b) => b.trangThai === 'dang_choi').length;
    const waitingCaro = dsGame.filter((b) => b.trangThai === 'cho_nguoi').length;
    const totalCaro = activeCaro + waitingCaro;
    const totalOnline = dsPhong.reduce((s, p) => s + (p.soNguoi || 0), 0) + (activeCaro * 2) + waitingCaro;

    const khung = e('div');
    khung.append(tieuDeTrang(
      '📊 Tổng Quan Quản Trị Campus',
      PHAM_VI_LOP_ID
        ? `Đang xem phạm vi: ${dsLop.find((l) => l.lopId === PHAM_VI_LOP_ID)?.ten || 'lớp đã chọn'}. Đổi "Phạm vi" ở thanh trên để xem lớp khác hoặc toàn trường.`
        : 'Việc cần xử lý và tình trạng vận hành toàn trường hôm nay.'
    ));

    // ---------- Việc cần xử lý ----------
    const dongViec = (mau, icon, chu, href) => {
      const a = e('a', 'hang-viec');
      a.href = href;
      a.style.setProperty('--mau-qt', mau);
      a.append(
        e('span', 'hang-viec-icon', icon),
        e('span', 'hang-viec-chu', chu),
        e('span', 'hang-viec-nut', 'Xem →')
      );
      return a;
    };
    const dsViec = [];
    if (pendingReports.length > 0) dsViec.push(dongViec('#F43F5E', '🔴', `${pendingReports.length} báo cáo vi phạm đang chờ xử lý`, '#/bao-cao-vi-pham'));
    if (pendingTeachers.length > 0) dsViec.push(dongViec('#F59E0B', '🟠', `${pendingTeachers.length} hồ sơ giáo viên đang chờ duyệt`, '#/duyet-giao-vien'));
    dsLopChuaDiemDanh.forEach((l) => {
      const a = dongViec('#FBBF24', '🟡', `${l.ten} chưa điểm danh hôm nay`, '#/diem-danh');
      // Tài khoản kiêm nhiều lớp bấm vào đây phải chuyển đúng phạm vi sang lớp NÀY trước — nếu
      // không, #/diem-danh vẫn thao tác trên lớp mặc định của phiên đăng nhập, có thể là lớp khác.
      a.addEventListener('click', () => datPhamVi(l.lopId));
      dsViec.push(a);
    });

    const khoiViec = e('div', 'the');
    khoiViec.style.cssText = 'margin-top: 18px; padding: 18px;';
    khoiViec.append(Object.assign(e('h3', null, `⚡ Việc cần xử lý${dsViec.length ? ' — ' + dsViec.length : ''}`), {
      style: 'font-size: 13px; font-weight: 800; color: var(--chu); margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.04em;'
    }));
    if (dsViec.length === 0) {
      khoiViec.append(Object.assign(e('p', null, '✓ Không có việc gì cần xử lý — mọi thứ đang vận hành bình thường.'), {
        style: 'color: var(--chu-nhat); font-size: 13px; margin: 0;'
      }));
    } else {
      const dsViecBoc = e('div');
      dsViecBoc.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
      dsViecBoc.append(...dsViec);
      khoiViec.append(dsViecBoc);
    }
    khung.append(khoiViec);

    // ---------- Lớp phụ trách (lối vào chính cho nghiệp vụ lớp: Học sinh/Điểm danh/Quỹ/TKB) ----------
    if (dsLop.length) {
      const khoiLop = e('div', 'the');
      khoiLop.style.cssText = 'margin-top: 14px; padding: 18px;';
      khoiLop.append(Object.assign(e('h3', null, '👥 Lớp phụ trách'), {
        style: 'font-size: 13px; font-weight: 800; color: var(--chu); margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.04em;',
      }));
      const luoiLop = e('div', 'luoi-qt');
      dsLop.forEach((l) => luoiLop.append(theLopChon(l, (lopId) => {
        datPhamVi(lopId);
        const sel = document.getElementById('adminScopeSelect');
        if (sel && Array.from(sel.options).some((o) => o.value === String(lopId))) sel.value = String(lopId);
        location.hash = '#/lop-quan-tri';
      })));
      khoiLop.append(luoiLop);
      khung.append(khoiLop);
    }

    // ---------- Tình trạng hôm nay (1 dòng gọn) ----------
    const dongSo = (...capSo) => {
      const dong = e('div', 'the-qt-so');
      dong.style.cssText = 'border-top: none; padding-top: 0; font-size: 13px;';
      capSo.forEach(([so, nhan], i) => {
        if (i > 0) dong.append(e('span', null, '  ·  '));
        dong.append(e('b', null, String(so)), e('span', null, ' ' + nhan));
      });
      return dong;
    };
    const theTinhTrang = e('div', 'the');
    theTinhTrang.style.cssText = 'margin-top: 14px; padding: 14px 18px;';
    theTinhTrang.style.setProperty('--mau-qt', '#38BDF8');
    theTinhTrang.append(dongSo(
      [totalOnline, 'đang hoạt động'], [dsPhong.length, 'phòng mở'], [totalCaro, 'bàn Caro'], [dsLop.length, PHIEN.isSchoolAdmin && !PHAM_VI_LOP_ID ? 'lớp toàn trường' : 'lớp trong phạm vi']
    ));
    khung.append(theTinhTrang);

    // ---------- Hoạt động gần đây (Nhật ký quản trị) ----------
    const theHoatDong = e('div', 'the');
    theHoatDong.style.cssText = 'margin-top: 14px; padding: 18px;';
    theHoatDong.append(Object.assign(e('h3', null, '🕘 Hoạt động gần đây'), {
      style: 'font-size: 13px; font-weight: 800; color: var(--chu); margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.04em;'
    }));
    if (dsNhatKy.length === 0) {
      theHoatDong.append(Object.assign(e('p', null, 'Chưa có hoạt động quản trị nào được ghi nhận.'), {
        style: 'color: var(--chu-nhat); font-size: 13px; margin: 0;'
      }));
    } else {
      const dsHoatDongBoc = e('div');
      dsHoatDongBoc.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';
      dsNhatKy.forEach((n) => {
        const mau = NHAN_HANH_DONG_QT[n.hanhDong] || { icon: '•', nhan: n.hanhDong };
        const dong = e('div');
        dong.style.cssText = 'display: flex; align-items: flex-start; gap: 10px; font-size: 12.5px;';
        dong.append(
          Object.assign(e('span', null, mau.icon), { style: 'flex: none;' }),
          datNoiDung(e('div'),
            Object.assign(e('p', null, n.chiTiet || mau.nhan), { style: 'margin: 0; color: var(--chu);' }),
            Object.assign(e('p', null, `${n.tacNhanTen || 'Hệ thống'} · ${gioNgayVN(n.taoLuc)}`), { style: 'margin: 2px 0 0; color: var(--chu-mo, var(--chu-nhat)); font-size: 11px;' })
          )
        );
        dsHoatDongBoc.append(dong);
      });
      theHoatDong.append(dsHoatDongBoc);
    }
    khung.append(theHoatDong);

    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi khi tải tổng quan quản trị: ' + err.message));
  }
}

/* ================= Người dùng (Admin IA v1, Phase 2) =================
   Gộp hoc_sinh + tai_khoan_campus thành 1 danh sách — xem functions/api/gv/nguoi-dung.js
   để biết đúng định nghĩa 4 "loai": giao-vien / hoc-sinh / tai-khoan-campus / hoc-sinh-chua-lien-ket. */
