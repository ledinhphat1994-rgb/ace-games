import { KHUNG, apiTheoPhamVi, datPhamVi, gioNgayVN } from '../lib.js';
import { $$, api, datNoiDung, e, khoiDangTai, khoiLoi, nhac } from '/assets/js/chung.js';
import { nut, oNhap, tieuDeTrang } from '/assets/js/giao-dien.js';


export const NHAN_LOAI_NGUOI = {
  'giao-vien': 'Giáo viên', 'hoc-sinh': 'Học sinh', 'tai-khoan-campus': 'Tài khoản Campus',
  'hoc-sinh-chua-lien-ket': 'Học sinh (chưa đăng nhập)',
};
export const NHAN_TRANG_THAI_NGUOI = {
  'binh-thuong': { nhan: 'Hoạt động', mau: '#34D399' },
  'cho-xac-minh': { nhan: 'Chờ xác minh', mau: '#F59E0B' },
  'bi-khoa': { nhan: 'Bị khoá', mau: '#F43F5E' },
  'chua-dang-nhap': { nhan: 'Chưa đăng nhập', mau: '#94A3B8' },
  'da-nghi-hoc': { nhan: 'Đã nghỉ học', mau: '#64748B' },
};

export function nhanTrangThaiNguoi(trangThai) {
  const tt = NHAN_TRANG_THAI_NGUOI[trangThai] || { nhan: trangThai, mau: '#94A3B8' };
  const s = e('span', 'nhan-tt', tt.nhan);
  s.style.setProperty('--mau-tt', tt.mau);
  return s;
}

// ---------- Menu "⋯" hành động dùng chung (chỉ 1 menu mở tại 1 thời điểm) ----------
export let _menuHdDangMo = null;
export function dongMenuHanhDongDangMo() {
  if (_menuHdDangMo) { _menuHdDangMo.remove(); _menuHdDangMo = null; }
}
document.addEventListener('click', dongMenuHanhDongDangMo);

export function taoNutMenuHanhDong(dsHanhDong) {
  const boc = e('div', 'o-menu-hd');
  const nutMo = e('button', 'nut-menu-hd', '⋯');
  nutMo.type = 'button';
  nutMo.setAttribute('aria-label', 'Hành động khác');
  nutMo.onclick = (ev) => {
    ev.stopPropagation();
    const dangMoChinhNo = _menuHdDangMo && boc.contains(_menuHdDangMo);
    dongMenuHanhDongDangMo();
    if (dangMoChinhNo) return;
    const bang = e('div', 'bang-menu-hd');
    dsHanhDong.forEach(({ nhan, onClick, nguyHiem }) => {
      const muc = e('button', 'muc-menu-hd' + (nguyHiem ? ' nguy-hiem' : ''), nhan);
      muc.type = 'button';
      muc.onclick = (ev2) => { ev2.stopPropagation(); dongMenuHanhDongDangMo(); onClick(); };
      bang.append(muc);
    });
    boc.append(bang);
    _menuHdDangMo = bang;
  };
  boc.append(nutMo);
  return boc;
}

// ---------- Drawer chi tiết trượt từ phải (khác .hop-thoai modal giữa màn hình) ----------
export function _thoatDrawerKhiEsc(ev) { if (ev.key === 'Escape') dongDrawerChiTiet(); }
export function dongDrawerChiTiet() {
  $$('.man-drawer-qt').forEach((m) => m.remove());
  document.removeEventListener('keydown', _thoatDrawerKhiEsc);
}
export function moDrawerChiTiet(tieuDe, noiDungEl) {
  dongDrawerChiTiet();
  const man = e('div', 'man-drawer-qt');
  man.onclick = dongDrawerChiTiet;
  const drawer = e('div', 'drawer-qt');
  drawer.onclick = (ev) => ev.stopPropagation();
  const dau = e('div', 'drawer-qt-dau');
  const nutDong = e('button', 'nut-tron', '✕');
  nutDong.type = 'button';
  nutDong.setAttribute('aria-label', 'Đóng');
  nutDong.onclick = dongDrawerChiTiet;
  dau.append(Object.assign(e('b', null, tieuDe), { style: 'font-size: 14px;' }), nutDong);
  const than = e('div', 'drawer-qt-than');
  than.append(noiDungEl);
  drawer.append(dau, than);
  man.append(drawer);
  document.body.append(man);
  document.addEventListener('keydown', _thoatDrawerKhiEsc);
}
export function dongDrawerDong(nhan, giaTri) {
  const d = e('div', 'drawer-qt-dong');
  d.append(e('span', null, nhan), e('span', null, giaTri == null || giaTri === '' ? '—' : String(giaTri)));
  return d;
}

export async function thucHienKhoaMoTaiKhoan(id, ten, hanhDong, veLai) {
  if (hanhDong === 'khoa' && !confirm(`Khoá tài khoản "${ten}"? Người này sẽ không đăng nhập được cho tới khi được mở khoá lại.`)) return;
  try {
    await api('/api/gv/nguoi-dung', { method: 'POST', than: { id, hanhDong } });
    nhac(hanhDong === 'khoa' ? 'Đã khoá tài khoản.' : 'Đã mở khoá tài khoản.', 'tot');
    dongDrawerChiTiet();
    if (veLai) veLai();
  } catch (err) {
    nhac('Không thực hiện được: ' + err.message, 'loi');
  }
}

export async function moChiTietNguoiDung(id, veLai) {
  let d;
  try {
    d = await api('/api/gv/nguoi-dung?id=' + encodeURIComponent(id));
  } catch (err) {
    nhac('Không tải được chi tiết: ' + err.message, 'loi');
    return;
  }
  const nd = d.chiTiet;
  const than = e('div');
  than.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

  const nhomChinh = e('div');
  nhomChinh.append(e('p', 'drawer-qt-nhom-nhan', 'Thông tin'));
  nhomChinh.append(dongDrawerDong('Loại', NHAN_LOAI_NGUOI[nd.loai] || nd.loai));
  const dongTt = e('div', 'drawer-qt-dong');
  dongTt.append(e('span', null, 'Trạng thái'), nhanTrangThaiNguoi(nd.trangThai));
  nhomChinh.append(dongTt);
  nhomChinh.append(dongDrawerDong('Lớp', nd.lopTen));
  Object.entries(nd.thongTin || {}).forEach(([k, v]) => nhomChinh.append(dongDrawerDong(k, v)));
  than.append(nhomChinh);

  if (nd.trangThai === 'cho-xac-minh') {
    const idSo = parseInt(String(nd.id).split(':')[1], 10);
    const dongNut = e('div');
    dongNut.style.cssText = 'display: flex; gap: 8px;';
    const nutDuyet = e('button', 'nut nut-chinh nut-nho', '✓ Phê duyệt giáo viên');
    nutDuyet.type = 'button';
    nutDuyet.style.cssText = 'flex: 1;';
    nutDuyet.onclick = async () => {
      if (!confirm(`Phê duyệt quyền giáo viên cho "${nd.ten}"?`)) return;
      try {
        const res = await api('/api/gv/duyet-giao-vien', { method: 'POST', than: { accountId: idSo, action: 'approve' } });
        if (res.ok) { nhac('Đã phê duyệt.', 'tot'); dongDrawerChiTiet(); veLai(); }
        else nhac('Lỗi: ' + (res.loi || res.error), 'xau');
      } catch (err) { nhac('Lỗi: ' + err.message, 'xau'); }
    };
    const nutTuChoi = e('button', 'nut nut-vien nut-nho', '✕ Từ chối');
    nutTuChoi.type = 'button';
    nutTuChoi.style.cssText = 'flex: 1;';
    nutTuChoi.onclick = async () => {
      if (!confirm(`Từ chối yêu cầu quyền giáo viên của "${nd.ten}"?`)) return;
      try {
        const res = await api('/api/gv/duyet-giao-vien', { method: 'POST', than: { accountId: idSo, action: 'reject' } });
        if (res.ok) { nhac('Đã từ chối.', 'tot'); dongDrawerChiTiet(); veLai(); }
        else nhac('Lỗi: ' + (res.loi || res.error), 'xau');
      } catch (err) { nhac('Lỗi: ' + err.message, 'xau'); }
    };
    dongNut.append(nutDuyet, nutTuChoi);
    than.append(dongNut);
  } else if (nd.id.startsWith('tk:') && nd.loai !== 'giao-vien' && !nd.taiKhoan?.laAdminTruong) {
    const dangKhoa = nd.trangThai === 'bi-khoa';
    const nutKhoa = e('button', dangKhoa ? 'nut nut-chinh nut-nho' : 'nut nut-vien nut-nho', dangKhoa ? '🔓 Mở khoá tài khoản' : '🔒 Khoá tài khoản');
    nutKhoa.type = 'button';
    nutKhoa.style.cssText = 'width: 100%;';
    nutKhoa.onclick = () => thucHienKhoaMoTaiKhoan(nd.id, nd.ten, dangKhoa ? 'mo_khoa' : 'khoa', veLai);
    than.append(nutKhoa);
  }

  if ((nd.hoatDongGanDay || []).length > 0) {
    const nhomHd = e('div');
    nhomHd.append(e('p', 'drawer-qt-nhom-nhan', 'Hoạt động gần đây'));
    nd.hoatDongGanDay.forEach((h) => {
      const dong = e('div');
      dong.style.cssText = 'padding: 7px 0; border-bottom: 1px solid var(--vien); font-size: 12.5px;';
      dong.append(
        Object.assign(e('p', null, h.chiTiet || h.hanhDong), { style: 'margin: 0; color: var(--chu);' }),
        Object.assign(e('p', null, `${h.tacNhanTen || ''} · ${gioNgayVN(h.taoLuc)}`), { style: 'margin: 2px 0 0; color: var(--chu-mo, var(--chu-nhat)); font-size: 11px;' })
      );
      nhomHd.append(dong);
    });
    than.append(nhomHd);
  }

  moDrawerChiTiet(nd.ten, than);
}

export async function trangNguoiDung() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách người dùng...'));

  let loaiLoc = 'tat-ca';
  let tuKhoa = '';
  let henTimKiem = null;
  let soBaoCaoCho = 0;

  const BO_LOC = [
    { id: 'tat-ca', nhan: 'Tất cả' },
    { id: 'hoc-sinh', nhan: 'Học sinh' },
    { id: 'giao-vien', nhan: 'Giáo viên' },
    { id: 'tai-khoan-campus', nhan: 'Tài khoản Campus' },
    { id: 'cho-xac-minh', nhan: 'Chờ xác minh' },
    { id: 'bi-khoa', nhan: 'Bị khoá' },
  ];

  function ve(danhSach) {
    const khung = e('div');
    khung.append(tieuDeTrang('👤 Người Dùng', 'Học sinh, giáo viên và tài khoản Campus trong phạm vi quản trị.'));

    const nutBaoCao = e('a', 'nut nut-vien nut-nho', soBaoCaoCho > 0 ? `🚩 Báo cáo vi phạm (${soBaoCaoCho} đang chờ)` : '🚩 Báo cáo vi phạm');
    nutBaoCao.href = '#/bao-cao-vi-pham';
    nutBaoCao.style.cssText = 'display: inline-flex; border-radius: 12px; font-weight: 700; margin-bottom: 14px;' + (soBaoCaoCho > 0 ? ' border-color: #F43F5E; color: #F43F5E;' : '');
    khung.append(nutBaoCao);

    const thanhLoc = e('div');
    thanhLoc.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;';
    BO_LOC.forEach((f) => {
      thanhLoc.append(nut(f.nhan, f.id === loaiLoc ? 'nut-chinh nut-nho' : 'nut-vien nut-nho', () => {
        loaiLoc = f.id;
        taiVaVe();
      }));
    });
    khung.append(thanhLoc);

    const oTim = oNhap('ndTim', 'search', tuKhoa, 'Tìm theo họ tên hoặc tên đăng nhập…');
    oTim.style.cssText = 'width: 100%; max-width: 360px; margin-bottom: 14px; display: block;';
    oTim.addEventListener('input', () => {
      tuKhoa = oTim.value;
      clearTimeout(henTimKiem);
      henTimKiem = setTimeout(taiVaVe, 350);
    });
    khung.append(oTim);

    if (danhSach.length === 0) {
      const rong = e('div', 'the', 'Không tìm thấy người dùng nào khớp bộ lọc hiện tại.');
      rong.style.cssText = 'padding: 28px; text-align:center; color: var(--chu-nhat); font-size: 13px;';
      khung.append(rong);
      datNoiDung(KHUNG, khung);
      return;
    }

    const bocBang = e('div', 'bang-qt-boc');
    const bang = e('table', 'bang-qt');
    const trHead = e('tr');
    ['Họ tên', 'Loại', 'Lớp', 'Trạng thái', 'Hoạt động cuối', ''].forEach((c) => trHead.append(e('th', null, c)));
    const thead = e('thead');
    thead.append(trHead);
    const tbody = e('tbody');

    danhSach.forEach((nd) => {
      const tr = e('tr');
      tr.append(
        e('td', null, nd.ten),
        e('td', null, NHAN_LOAI_NGUOI[nd.loai] || nd.loai),
        e('td', null, nd.lopTen || '—')
      );
      const tdTt = e('td');
      tdTt.append(nhanTrangThaiNguoi(nd.trangThai));
      tr.append(tdTt);
      tr.append(e('td', null, nd.hoatDongCuoi ? gioNgayVN(nd.hoatDongCuoi) : '—'));

      const tdHd = e('td');
      const dsHanhDong = [{ nhan: 'Xem chi tiết', onClick: () => moChiTietNguoiDung(nd.id, taiVaVe) }];
      if ((nd.loai === 'hoc-sinh' || nd.loai === 'hoc-sinh-chua-lien-ket') && nd.lopId) {
        dsHanhDong.push({ nhan: 'Vào quản lý lớp', onClick: () => { datPhamVi(nd.lopId); location.hash = '#/lop-quan-tri'; } });
      }
      if (nd.trangThai === 'cho-xac-minh') {
        const idSo = parseInt(String(nd.id).split(':')[1], 10);
        dsHanhDong.push({
          nhan: 'Phê duyệt giáo viên', onClick: async () => {
            if (!confirm(`Phê duyệt quyền giáo viên cho "${nd.ten}"?`)) return;
            try {
              const res = await api('/api/gv/duyet-giao-vien', { method: 'POST', than: { accountId: idSo, action: 'approve' } });
              if (res.ok) { nhac('Đã phê duyệt.', 'tot'); taiVaVe(); }
              else nhac('Lỗi: ' + (res.loi || res.error), 'xau');
            } catch (err) { nhac('Lỗi: ' + err.message, 'xau'); }
          },
        });
        dsHanhDong.push({
          nhan: 'Từ chối giáo viên', nguyHiem: true, onClick: async () => {
            if (!confirm(`Từ chối yêu cầu quyền giáo viên của "${nd.ten}"?`)) return;
            try {
              const res = await api('/api/gv/duyet-giao-vien', { method: 'POST', than: { accountId: idSo, action: 'reject' } });
              if (res.ok) { nhac('Đã từ chối.', 'tot'); taiVaVe(); }
              else nhac('Lỗi: ' + (res.loi || res.error), 'xau');
            } catch (err) { nhac('Lỗi: ' + err.message, 'xau'); }
          },
        });
      } else if (nd.id.startsWith('tk:') && nd.loai !== 'giao-vien') {
        dsHanhDong.push(nd.trangThai === 'bi-khoa'
          ? { nhan: 'Mở khoá tài khoản', onClick: () => thucHienKhoaMoTaiKhoan(nd.id, nd.ten, 'mo_khoa', taiVaVe) }
          : { nhan: 'Khoá tài khoản', onClick: () => thucHienKhoaMoTaiKhoan(nd.id, nd.ten, 'khoa', taiVaVe), nguyHiem: true });
      }
      tdHd.append(taoNutMenuHanhDong(dsHanhDong));
      tr.append(tdHd);
      tr.onclick = () => moChiTietNguoiDung(nd.id, taiVaVe);
      tbody.append(tr);
    });

    bang.append(thead, tbody);
    bocBang.append(bang);
    khung.append(bocBang);
    datNoiDung(KHUNG, khung);
  }

  async function taiVaVe() {
    datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách người dùng...'));
    try {
      const qs = new URLSearchParams();
      if (loaiLoc !== 'tat-ca') qs.set('loai', loaiLoc);
      if (tuKhoa.trim()) qs.set('q', tuKhoa.trim());
      const [d, resBaoCao] = await Promise.all([
        api(apiTheoPhamVi('/api/gv/nguoi-dung?' + qs.toString())),
        api('/api/gv/bao-cao?status=pending').catch(() => ({ reports: [] })),
      ]);
      soBaoCaoCho = Array.isArray(resBaoCao?.reports) ? resBaoCao.reports.length : 0;
      ve(d.danhSach || []);
    } catch (err) {
      datNoiDung(KHUNG, khoiLoi('Không tải được danh sách người dùng: ' + err.message));
    }
  }

  await taiVaVe();
}
