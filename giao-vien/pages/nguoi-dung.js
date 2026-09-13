import { KHUNG, gioNgayVN } from '../lib.js';
import { api, e, nhac } from '/assets/js/chung.js';

const VAI_TRO = { 'quan-tri-vien': 'Quản trị viên', 'giao-vien': 'Giáo viên', 'hoc-sinh': 'Học sinh', khach: 'Thành viên ngoài trường' };
const TRANG_THAI = { 'binh-thuong': 'Hoạt động', 'cho-xac-minh': 'Chờ duyệt giáo viên', 'bi-khoa': 'Bị khóa' };
function taoNut(nhan, lop, xuLy) {
  const n = e('button', 'nut ' + lop, nhan);
  n.type = 'button'; n.onclick = xuLy; return n;
}

export async function trangNguoiDung() {
  let boLoc = 'tat-ca', soYeuCau = 0, henTim;
  const dau = e('div', 'tk-title'), tieuDe = e('div');
  tieuDe.append(e('h1', null, 'Danh sách tài khoản'), e('p', 'tk-muted', 'Quản lý người đã đăng ký tài khoản trên Digital Campus.'));
  dau.append(tieuDe, taoNut('Tải lại', 'nut-vien', () => tai()));
  const thanh = e('div', 'tk-toolbar'), nhanTim = e('label', 'tk-search', 'Tìm tài khoản');
  const tim = e('input');
  tim.type = 'search'; tim.placeholder = 'Tên hiển thị hoặc tên đăng nhập'; tim.id = 'ndTim';
  tim.oninput = () => { clearTimeout(henTim); henTim = setTimeout(tai, 250); };
  nhanTim.append(tim);
  const nhanLoc = e('label', 'tk-filter', 'Lọc tài khoản'), loc = e('select'); loc.id = 'ndLoc';
  Object.entries({ 'tat-ca': 'Tất cả tài khoản', ...VAI_TRO, 'cho-xac-minh': 'Chờ duyệt giáo viên', 'bi-khoa': 'Bị khóa' }).forEach(([v, t]) => {
    const o = e('option', null, t); o.value = v; loc.append(o);
  });
  loc.onchange = () => { boLoc = loc.value; tai(); };
  nhanLoc.append(loc); thanh.append(nhanTim, nhanLoc);
  const dem = e('p', 'tk-count'), ketQua = e('div', 'tk-results');
  KHUNG.replaceChildren(dau, thanh, dem, ketQua);

  async function hanhDong(nd, action, dialog) {
    const nhan = { khoa: 'Khóa tài khoản', mo_khoa: 'Mở khóa tài khoản', duyet: 'Duyệt giáo viên', tu_choi: 'Từ chối yêu cầu giáo viên' }[action];
    if (!confirm(`${nhan} “${nd.tenDangNhap}”?`)) return;
    const buttons = [...dialog.querySelectorAll('button')]; buttons.forEach(b => { b.disabled = true; });
    try {
      await api('/api/gv/nguoi-dung', { method: 'POST', than: { id: nd.id, hanhDong: action } });
      dialog.close(); nhac('Đã cập nhật tài khoản.', 'tot'); await tai();
    } catch (err) { nhac(err.message, 'loi'); buttons.forEach(b => { b.disabled = false; }); }
  }

  async function chiTiet(nd, trigger) {
    trigger.disabled = true;
    try {
      const { chiTiet: tk } = await api('/api/gv/nguoi-dung?id=' + encodeURIComponent(nd.id));
      const dialog = e('dialog', 'tk-dialog'); dialog.setAttribute('aria-labelledby', 'tkDialogTitle');
      const title = e('h2', null, tk.ten); title.id = 'tkDialogTitle';
      const dong = taoNut('Đóng', 'nut-vien', () => dialog.close()), header = e('div', 'tk-dialog-header');
      header.append(title, dong);
      const dl = e('dl', 'tk-details');
      Object.entries({ 'Tên đăng nhập': tk.tenDangNhap, 'Vai trò': VAI_TRO[tk.loai], 'Trạng thái': TRANG_THAI[tk.trangThai],
        'Lớp liên kết': tk.lopTen || 'Chưa liên kết', 'Ngày đăng ký': gioNgayVN(tk.taoLuc), 'Cập nhật gần nhất': gioNgayVN(tk.capNhatLuc) }).forEach(([k, v]) => {
        const row = e('div'); row.append(e('dt', null, k), e('dd', null, v)); dl.append(row);
      });
      const actions = e('div', 'tk-actions');
      if (tk.coTheDuyet) actions.append(taoNut('Duyệt giáo viên', 'nut-chinh', () => hanhDong(tk, 'duyet', dialog)),
        taoNut('Từ chối yêu cầu', 'nut-vien', () => hanhDong(tk, 'tu_choi', dialog)));
      if (tk.coTheKhoa) {
        const khoa = tk.trangThai !== 'bi-khoa';
        actions.append(taoNut(khoa ? 'Khóa tài khoản' : 'Mở khóa tài khoản', khoa ? 'tk-danger nut-vien' : 'nut-chinh', () => hanhDong(tk, khoa ? 'khoa' : 'mo_khoa', dialog)));
      }
      if (tk.laAdminTruong) actions.append(e('p', 'tk-muted', 'Tài khoản quản trị viên được bảo vệ khỏi thao tác khóa.'));
      dialog.append(header, dl, actions);
      dialog.addEventListener('close', () => { dialog.remove(); trigger.focus(); }, { once: true });
      dialog.onclick = ev => { if (ev.target === dialog) { const r = dialog.getBoundingClientRect(); if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) dialog.close(); } };
      document.body.append(dialog); dialog.showModal();
    } catch (err) { nhac(err.message, 'loi'); } finally { trigger.disabled = false; }
  }

  async function tai() {
    const yeuCau = ++soYeuCau; ketQua.setAttribute('aria-busy', 'true');
    const qs = new URLSearchParams({ loai: boLoc, q: tim.value.trim() });
    try {
      const d = await api('/api/gv/nguoi-dung?' + qs);
      if (yeuCau !== soYeuCau) return;
      dem.textContent = `${d.tong} / ${d.tongTaiKhoan} tài khoản`;
      ketQua.replaceChildren();
      if (!d.danhSach.length) {
        ketQua.append(e('div', 'tk-empty', d.tongTaiKhoan ? 'Không có tài khoản phù hợp. Hãy đổi từ khóa hoặc bộ lọc.' : 'Chưa có tài khoản trong phạm vi quản trị.'));
        return;
      }
      const boc = e('div', 'tk-table-wrap'), bang = e('table', 'tk-table');
      const caption = e('caption', 'tk-sr-only', 'Danh sách tài khoản đã đăng ký'), head = e('thead'), hr = e('tr');
      ['Tài khoản', 'Vai trò', 'Trạng thái', 'Ngày đăng ký', 'Thao tác'].forEach(t => { const th = e('th', null, t); th.scope = 'col'; hr.append(th); });
      head.append(hr); const body = e('tbody');
      d.danhSach.forEach(nd => {
        const row = e('tr'), ten = e('td');
        ten.append(e('strong', null, nd.ten), e('span', 'tk-username', '@' + nd.tenDangNhap));
        const tt = e('td'); tt.append(e('span', 'tk-status ' + nd.trangThai, TRANG_THAI[nd.trangThai]));
        const hd = e('td'), nut = taoNut('Chi tiết', 'nut-vien', () => chiTiet(nd, nut));
        nut.setAttribute('aria-label', 'Chi tiết tài khoản ' + nd.tenDangNhap); hd.append(nut);
        row.append(ten, e('td', null, VAI_TRO[nd.loai]), tt, e('td', 'tk-date', gioNgayVN(nd.taoLuc)), hd); body.append(row);
      });
      bang.append(caption, head, body); boc.append(bang); ketQua.append(boc);
    } catch (err) {
      if (yeuCau !== soYeuCau) return;
      dem.textContent = '';
      const loi = e('div', 'tk-empty');
      loi.append(e('p', null, 'Không tải được danh sách: ' + err.message), taoNut('Thử lại', 'nut-chinh', tai));
      ketQua.replaceChildren(loi);
    } finally { if (yeuCau === soYeuCau) ketQua.removeAttribute('aria-busy'); }
  }
  await tai();
}