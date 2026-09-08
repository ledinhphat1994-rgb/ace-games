/* Các mảnh giao diện dùng lại trong khu quản lý. */
import { $, e, datNoiDung, api, nhac, khoiDangTai, ngayVN } from './chung.js';

export function tieuDeTrang(tieuDe, phu, ...nutPhai) {
  const hop = e('div', 'tieu-de-trang');
  const trai = e('div');
  trai.append(e('h1', null, tieuDe));
  if (phu) trai.append(e('p', null, phu));
  hop.append(trai);
  if (nutPhai.length) hop.append(datNoiDung(e('div', 'phai'), ...nutPhai));
  return hop;
}

/** Bọc một <input type="date"> để LUÔN hiện chữ theo đúng thứ tự lịch Việt Nam (ngày/tháng/năm),
    bất kể máy đang đặt ngôn ngữ hệ thống gì — định dạng chữ hiển thị của ô ngày gốc theo NGÔN
    NGỮ/VÙNG của HỆ ĐIỀU HÀNH trình duyệt đang chạy, không theo lang="vi" của trang, nên nhiều
    máy vẫn hiện kiểu Mỹ tháng/ngày/năm (dễ đọc nhầm ngày, có thể trùng cả hai cách đọc như 09/08).
    Chỉ ẨN PHẦN CHỮ của ô gốc bằng CSS (giữ icon lịch, giữ nguyên hành vi bấm mở lịch/gõ tay),
    rồi đè lên một nhãn tự vẽ đúng dd/mm/yyyy. Chỉ Chromium (Chrome/Edge/WebView Android — trình
    duyệt chính của người dùng ứng dụng này) hỗ trợ ẩn đúng phần chữ qua ::-webkit-datetime-edit;
    trình duyệt khác (vd Firefox) không ẩn được nên bỏ qua, giữ nguyên hiển thị gốc của họ. */
export function boiNgayVN(oNgay) {
  const boc = e('span', 'boc-ngay-vn');
  boc.append(oNgay);
  const nhan = e('span', 'nhan-ngay-vn');
  nhan.setAttribute('aria-hidden', 'true');
  boc.append(nhan);
  const capNhat = () => { nhan.textContent = oNgay.value ? ngayVN(oNgay.value) : ''; };
  oNgay.addEventListener('input', capNhat);
  oNgay.addEventListener('change', capNhat);
  capNhat();
  return boc;
}

export function oThongKe(conSo, ten, kieu = '', bieuTuong = '') {
  const o = e('div', 'o-thong-ke ' + kieu);
  const dau = e('div', 'o-thong-ke-dau');
  dau.append(e('span', 'ten', ten));
  if (bieuTuong) dau.append(e('span', 'o-thong-ke-icon', bieuTuong));
  o.append(dau, e('div', 'con-so', conSo));
  return o;
}

// nhan (không bắt buộc): tên cho trình đọc màn hình — bắt buộc dùng khi "chu" chỉ là
// icon (✎ 🗑 ✓ ✕...), vì khi đó văn bản hiển thị không mô tả được hành động.
export function nut(chu, kieu, khiBam, nhan) {
  const b = e('button', 'nut ' + (kieu || ''), chu);
  b.type = 'button';
  if (khiBam) b.addEventListener('click', khiBam);
  if (nhan) b.setAttribute('aria-label', nhan);
  return b;
}

export function lienKetNut(chu, duongDan, kieu = '') {
  const a = e('a', 'nut ' + kieu, chu);
  a.href = duongDan;
  return a;
}

export function truong(nhan, oNhap, ghiChu) {
  const hop = e('div');
  const l = e('label', 'nhan-nhap', nhan);
  l.htmlFor = oNhap.id;
  // Mọi ô ngày đi qua truong() đều tự động hiện đúng thứ tự lịch Việt Nam (xem boiNgayVN) — áp
  // dụng chung MỘT LẦN ở đây thay vì phải sửa từng nơi gọi oNhap(id, 'date', ...) rải rác khắp
  // các trang/hộp thoại.
  hop.append(l, oNhap.type === 'date' ? boiNgayVN(oNhap) : oNhap);
  if (ghiChu) hop.append(Object.assign(e('div', 'trong', ghiChu), { style: 'margin-top:4px;font-size:12.5px' }));
  return hop;
}

export function oNhap(id, kieu = 'text', giaTri = '', goiY = '') {
  const o = e(kieu === 'textarea' ? 'textarea' : 'input', 'o-nhap');
  o.id = id;
  if (kieu !== 'textarea') o.type = kieu;
  o.value = giaTri ?? '';
  if (goiY) o.placeholder = goiY;
  return o;
}

export function oChon(id, cacMuc, giaTri) {
  const s = e('select', 'o-nhap');
  s.id = id;
  cacMuc.forEach(([v, t]) => {
    const op = e('option', null, t);
    op.value = v;
    if (String(v) === String(giaTri)) op.selected = true;
    s.append(op);
  });
  return s;
}

// 3 cách nạp một tệp (Thư viện có sẵn / Tải lên / Dán link) — CHỈ hiện đúng một ô nhập tại
// một thời điểm theo nút đang chọn, thay vì hiện sẵn cả 3 ô cùng lúc (rối mắt, hộp thoại dài
// lê thê). Dùng chung cho banner lớp và đính kèm Thông báo — mọi nơi cần chọn ảnh/nhạc/video
// đều theo đúng một khuôn mẫu này.
const NGUON_TEP = [['thu-vien', '📚 Thư viện'], ['tai-len', '⬆ Tải lên'], ['link', '🔗 Dán link']];

export function khoiChonNguon({ nguonMacDinh, oThuVien, oTep, oLink, ghiChuLink, nhanTaiLen }) {
  const khung = e('div');
  const dayNut = e('div', 'day-loc day-loc-deu');
  dayNut.style.cssText = 'margin-bottom:10px';
  dayNut.style.setProperty('--the-nho-nhat', '85px');
  const oNoiDung = e('div');

  let nguonHienTai = nguonMacDinh;

  function ve() {
    datNutDay();
    let o;
    if (nguonHienTai === 'thu-vien') o = oThuVien;
    else if (nguonHienTai === 'tai-len') o = oTep;
    else o = oLink;

    const con = [o];
    const ghiChu = nguonHienTai === 'link' ? ghiChuLink : (nguonHienTai === 'tai-len' ? nhanTaiLen : '');
    if (ghiChu) con.push(Object.assign(e('div', 'trong', ghiChu), { style: 'margin-top:6px;font-size:12px' }));
    oNoiDung.replaceChildren(...con);
  }

  function datNutDay() {
    dayNut.replaceChildren(...NGUON_TEP.map(([ma, nhan]) => {
      const b = e('button', 'vien-loc', nhan);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(nguonHienTai === ma));
      b.addEventListener('click', () => { nguonHienTai = ma; ve(); });
      return b;
    }));
  }

  khung.append(dayNut, oNoiDung);
  ve();
  return { khung, layNguon: () => nguonHienTai };
}

export function moHopThoai(tieuDe, noiDung, cacNut) {
  let hop = $('#hopThoai');
  if (!hop) {
    hop = document.createElement('dialog');
    hop.className = 'hop-thoai';
    hop.id = 'hopThoai';

    const form = e('form');
    form.method = 'dialog';
    form.id = 'hopThoaiForm';

    const dau = e('div', 'hop-thoai-dau');
    const h2 = e('h2', null, '…');
    h2.id = 'hopThoaiTieuDe';
    const nutDong = e('button', 'nut-tron', '✕');
    nutDong.value = 'dong';
    nutDong.style.marginLeft = 'auto';
    nutDong.setAttribute('aria-label', 'Đóng');
    dau.append(h2, nutDong);

    const than = e('div', 'hop-thoai-than');
    than.id = 'hopThoaiThan';

    const chan = e('div', 'hop-thoai-chan');
    chan.id = 'hopThoaiChan';

    form.append(dau, than, chan);
    hop.append(form);
    hop.addEventListener('click', (ev) => {
      const rect = hop.getBoundingClientRect();
      const inDialog = (
        rect.top <= ev.clientY && ev.clientY <= rect.top + rect.height &&
        rect.left <= ev.clientX && ev.clientX <= rect.left + rect.width
      );
      if (!inDialog) hop.close();
    });
    document.body.appendChild(hop);
  }
  $('#hopThoaiTieuDe').textContent = tieuDe;
  datNoiDung($('#hopThoaiThan'), ...(Array.isArray(noiDung) ? noiDung : [noiDung]));
  datNoiDung($('#hopThoaiChan'), ...cacNut);
  hop.showModal();
  return hop;
}

export const dongHopThoai = () => {
  const hop = $('#hopThoai');
  if (hop && hop.open) hop.close();
};

/**
 * Biểu đồ cột chồng vẽ bằng SVG thuần — không cần tải thư viện nào.
 * @param {Array<{nhan:string, phan:Array<{giaTri:number, mau:string, ten:string}>}>} cot
 */
export function bieuDoCot(cot, { cao = 190 } = {}) {
  const RONG = Math.max(320, cot.length * 56);
  const LE_TRAI = 34, LE_DUOI = 30, LE_TREN = 10;
  const caoVe = cao - LE_DUOI - LE_TREN;
  const dinh = Math.max(1, ...cot.map((c) => c.phan.reduce((a, p) => a + p.giaTri, 0)));

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${RONG} ${cao}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(cao));
  svg.setAttribute('role', 'img');
  svg.style.overflow = 'visible';

  const tao = (ten, thuocTinh) => {
    const n = document.createElementNS('http://www.w3.org/2000/svg', ten);
    Object.entries(thuocTinh).forEach(([k, v]) => n.setAttribute(k, String(v)));
    return n;
  };

  // Đường kẻ ngang và số
  [0, 0.5, 1].forEach((p) => {
    const y = LE_TREN + caoVe * (1 - p);
    svg.append(tao('line', {
      x1: LE_TRAI, x2: RONG, y1: y, y2: y,
      stroke: 'var(--vien)', 'stroke-width': 1,
    }));
    const chu = tao('text', { x: 0, y: y + 4, fill: 'var(--chu-mo)', 'font-size': 11 });
    chu.textContent = String(Math.round(dinh * p));
    svg.append(chu);
  });

  const rongCot = (RONG - LE_TRAI) / Math.max(cot.length, 1);
  cot.forEach((c, i) => {
    const x = LE_TRAI + i * rongCot + rongCot * 0.2;
    const w = rongCot * 0.6;
    let y = LE_TREN + caoVe;

    c.phan.forEach((p) => {
      if (!p.giaTri) return;
      const h = (p.giaTri / dinh) * caoVe;
      y -= h;
      const o = tao('rect', { x, y, width: w, height: h, fill: p.mau, rx: 2 });
      const tip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      tip.textContent = `${c.nhan} — ${p.ten}: ${p.giaTri}`;
      o.append(tip);
      svg.append(o);
    });

    const nhan = tao('text', {
      x: x + w / 2, y: cao - 10, fill: 'var(--chu-nhat)',
      'font-size': 10.5, 'text-anchor': 'middle',
    });
    nhan.textContent = c.nhan;
    svg.append(nhan);
  });

  const boc = e('div', 'cuon-ngang');
  const trong = e('div');
  trong.style.minWidth = RONG + 'px';
  trong.append(svg);
  boc.append(trong);
  return boc;
}

/** Chú thích màu cho biểu đồ. */
export function chuThichMau(cacMuc) {
  const hop = e('div', 'chu-thich');
  cacMuc.forEach(([ten, mau]) => {
    const s = e('span');
    const i = e('i');
    i.style.background = mau;
    s.append(i, document.createTextNode(ten));
    hop.append(s);
  });
  return hop;
}

// Giờ Việt Nam từ chuỗi "YYYY-MM-DD HH:MM:SS" (UTC) do D1 lưu — lặp lại đúng logic taoLucVN()
// ở giao-vien/trang-quy.js (không import chéo từ đó vì file này là tiện ích nền, không nên phụ
// thuộc ngược vào một trang cụ thể).
function taoLucVN(taoLuc) {
  const d = new Date(String(taoLuc).replace(' ', 'T') + 'Z');
  if (isNaN(d)) return taoLuc;
  d.setHours(d.getHours() + 7);
  const gio = String(d.getHours()).padStart(2, '0');
  const phut = String(d.getMinutes()).padStart(2, '0');
  return `${gio}:${phut} ${ngayVN(d.toISOString().slice(0, 10))}`;
}

/** Trang "Lịch sử & khôi phục" DÙNG CHUNG cho Thông báo / Thời khoá biểu / Hoạt động lớp — cùng
    một kiểu giao diện với "🛡️ Lịch sử & khôi phục" của Thủ quỹ, chỉ khác nguồn API
    (/api/gv/checkpoint-chung?muc=...) và tham số "muc" cho đúng chức năng đang xem.
      muc: 'thong-bao' | 'thoi-khoa-bieu' | 'hoat-dong-lop'
      tieuDe: tên chức năng hiển thị, ví dụ 'Thông báo'
      veTrangTruoc: hash quay lại trang chính của chức năng, ví dụ '#/thong-bao' */
export async function trangLichSuKhoiPhucChung(KHUNG, { muc, tieuDe, veTrangTruoc }) {
  datNoiDung(KHUNG, khoiDangTai());

  const phienD = await api('/api/whoami').catch(() => ({ role: '' }));
  const laGiaoVien = phienD.role === 'teacher';

  async function ve() {
    const d = await api('/api/gv/checkpoint-chung?muc=' + muc);
    const khung = e('div');
    khung.append(nut('← Về ' + tieuDe, 'nut-nhe nut-nho', () => { location.hash = veTrangTruoc; }));
    khung.append(tieuDeTrang('Lịch sử & khôi phục — ' + tieuDe, `${d.danhSach.length} điểm khôi phục gần nhất`));

    if (laGiaoVien) {
      const the = e('div', 'the');
      the.style.borderColor = 'var(--chinh)';
      the.append(
        e('h3', null, 'Nếu tài khoản bị lộ hoặc dữ liệu sai'),
        e('p', null, `Chọn đúng thời điểm trước khi sự cố xảy ra, bấm "Khôi phục về đây". Toàn bộ dữ liệu ${tieuDe} sẽ trở về đúng như lúc đó. Bản thân việc khôi phục cũng được lưu lại một điểm mới, nên nếu chọn nhầm vẫn quay lại được.`)
      );
      khung.append(the);
    } else {
      khung.append(e('p', 'trong', 'Tài khoản của bạn chỉ xem được danh sách này. Nhờ giáo viên chủ nhiệm khôi phục nếu cần.'));
    }

    if (!d.danhSach.length) {
      khung.append(e('p', 'trong', 'Chưa có điểm khôi phục nào — sẽ tự xuất hiện khi có thao tác đầu tiên.'));
      datNoiDung(KHUNG, khung);
      return;
    }

    if (laGiaoVien) {
      const nutXoaTatCa = e('div');
      nutXoaTatCa.style.cssText = 'margin-bottom:10px;text-align:right';
      nutXoaTatCa.append(nut('🗑 Xoá tất cả điểm khôi phục', 'nut-nhe nut-nho', () => {
        moHopThoai('Xoá TOÀN BỘ lịch sử khôi phục?', [
          e('p', null, `Toàn bộ ${d.danhSach.length} điểm khôi phục sẽ mất vĩnh viễn.`),
          e('p', 'trong', 'Đây là lưới an toàn duy nhất nếu tài khoản bị lộ hay ghi nhầm dữ liệu — xoá xong sẽ KHÔNG còn cách nào quay lại các thời điểm cũ nữa. Chỉ xoá khi chắc chắn không cần nữa.'),
        ], [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá tất cả', 'nut-xau', async (ev) => {
            ev.currentTarget.disabled = true;
            try {
              await api(`/api/gv/checkpoint-chung?muc=${muc}&tatCa=1`, { method: 'DELETE' });
              dongHopThoai();
              nhac('Đã xoá toàn bộ lịch sử khôi phục', 'tot');
              ve();
            } catch (err) {
              nhac(err.message, 'xau');
              ev.currentTarget.disabled = false;
            }
          }),
        ]);
      }));
      khung.append(nutXoaTatCa);
    }

    const ds = e('div', 'ds-nhat-ky');
    d.danhSach.forEach((cp) => {
      const m = e('div', 'muc-nhat-ky khac');
      const dong = e('div', 'dong-dau');
      dong.append(e('span', 'ngay', taoLucVN(cp.taoLuc)), e('span', 'nhan nhan-xam', cp.nguoiThucHien));
      if (laGiaoVien) {
        const viec = e('div', 'viec');
        viec.append(nut('Khôi phục về đây', 'nut-nho nut-xau', () => {
          moHopThoai(`Khôi phục ${tieuDe} về điểm này?`, [
            e('p', null, cp.hanhDong),
            Object.assign(e('p', null, `Lúc: ${taoLucVN(cp.taoLuc)}`), { style: 'color:var(--chu-nhat)' }),
            e('p', null, `Mọi thay đổi ${tieuDe} sau thời điểm này sẽ mất. Chắc chắn chứ?`),
          ], [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Khôi phục ngay', 'nut-xau', async (ev) => {
              ev.currentTarget.disabled = true;
              try {
                await api('/api/gv/checkpoint-chung', { method: 'POST', than: { muc, id: cp.id } });
                dongHopThoai();
                nhac('Đã khôi phục ' + tieuDe, 'tot');
                ve();
              } catch (err) {
                nhac(err.message, 'xau');
                ev.currentTarget.disabled = false;
              }
            }),
          ]);
        }));
        viec.append(nut('🗑 Xoá', 'nut-nho nut-nhe', () => {
          moHopThoai('Xoá điểm khôi phục này?', [
            e('p', null, cp.hanhDong),
            e('p', 'trong', 'Chỉ xoá dòng lịch sử này — không ảnh hưởng dữ liệu hiện tại. Không thể hoàn tác.'),
          ], [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá', 'nut-xau', async (ev) => {
              ev.currentTarget.disabled = true;
              try {
                await api(`/api/gv/checkpoint-chung?muc=${muc}&id=${cp.id}`, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá điểm khôi phục', 'tot');
                ve();
              } catch (err) {
                nhac(err.message, 'xau');
                ev.currentTarget.disabled = false;
              }
            }),
          ]);
        }));
        dong.append(viec);
      }
      m.append(dong, e('p', null, cp.hanhDong));
      ds.append(m);
    });
    khung.append(ds);
    datNoiDung(KHUNG, khung);
  }

  await ve();
}

// Số ngày còn lại trước khi một mục trong thùng rác bị tự xoá vĩnh viễn (khớp
// NGAY_GIU_THUNG_RAC = 30 ở functions/_lib/thu-vien.js).
function soNgayConLaiTruocKhiXoa(daXoaLuc) {
  const d = new Date(String(daXoaLuc).replace(' ', 'T') + 'Z');
  if (isNaN(d)) return 30;
  const conLaiMs = d.getTime() + 30 * 86400000 - Date.now();
  return Math.max(0, Math.ceil(conLaiMs / 86400000));
}

/** Trang "Thùng rác" DÙNG CHUNG cho 3 thư viện Ảnh / Âm thanh / Video — mục bị "xoá" chỉ CHUYỂN
    VÀO ĐÂY (ẩn khỏi thư viện, file thật vẫn còn nguyên trong kho R2), khôi phục lại được trong
    30 ngày trước khi tự xoá vĩnh viễn hẳn — xem functions/_lib/thu-vien.js.
      duongApi: đường API gốc của đúng thư viện đó, ví dụ '/api/gv/anh' hoặc '/api/gv/thu-vien-video'
      tieuDe: tên hiển thị, ví dụ 'Ảnh'
      veTrangTruoc: hash quay lại trang thư viện chính
      hienThi(item): trả về một phần tử DOM mô tả ngắn mục đó (tên bài, ảnh xem trước...) */
export async function trangThungRacThuVien(KHUNG, { duongApi, tieuDe, veTrangTruoc, hienThi }) {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const d = await api(duongApi + '?rac=1');
    const khung = e('div');
    khung.append(nut('← Về ' + tieuDe, 'nut-nhe nut-nho', () => { location.hash = veTrangTruoc; }));
    khung.append(tieuDeTrang('🗑 Thùng rác — ' + tieuDe, `${d.danhSach.length} mục — tự xoá vĩnh viễn sau 30 ngày kể từ lúc xoá`));

    if (!d.danhSach.length) {
      khung.append(e('p', 'trong', 'Thùng rác trống.'));
      datNoiDung(KHUNG, khung);
      return;
    }

    const ds = e('div', 'ds-nhat-ky');
    d.danhSach.forEach((m) => {
      const dong = e('div', 'muc-nhat-ky');
      const dauDong = e('div', 'dong-dau');
      const conLai = soNgayConLaiTruocKhiXoa(m.daXoaLuc);
      dauDong.append(e('span', 'nhan ' + (conLai <= 5 ? 'nhan-luuy' : 'nhan-xam'),
        conLai <= 0 ? '⏳ Sắp tự xoá vĩnh viễn' : `⏳ Còn ${conLai} ngày`));

      const viec = e('div', 'viec');
      viec.append(
        nut('↩ Khôi phục', 'nut-nho', async (ev) => {
          ev.currentTarget.disabled = true;
          try {
            await api(duongApi, { method: 'PATCH', than: { id: m.id, khoiPhuc: true } });
            nhac('Đã khôi phục', 'tot');
            ve();
          } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
        }),
        nut('❌ Xoá vĩnh viễn', 'nut-nho nut-xau', () => {
          moHopThoai('Xoá VĨNH VIỄN mục này?', [
            e('p', 'trong', 'Không thể hoàn tác — file thật sẽ mất hẳn khỏi kho lưu trữ ngay lập tức.'),
          ], [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá vĩnh viễn', 'nut-xau', async (ev) => {
              ev.currentTarget.disabled = true;
              try {
                await api(`${duongApi}?id=${m.id}&vinhVien=1`, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá vĩnh viễn', 'tot');
                ve();
              } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
            }),
          ]);
        })
      );
      dauDong.append(viec);

      // Ai xoá / lúc nào / vì sao — bắt buộc phải rõ ràng để tra soát được khi có sự cố (tài
      // khoản được cấp quyền cũng xoá được, xem functions/api/gv/anh.js).
      const chiTietXoa = e('div', 'trong');
      chiTietXoa.style.cssText = 'font-size:12px;line-height:1.6;margin-top:6px;';
      chiTietXoa.append(e('div', null, `🗑 Người xoá: ${m.xoaBoi || 'Không rõ'} · 🕐 Lúc: ${taoLucVN(m.daXoaLuc)}`));
      if (m.lyDoXoa) chiTietXoa.append(e('div', null, `💬 Lý do: ${m.lyDoXoa}`));

      dong.append(dauDong, hienThi(m), chiTietXoa);
      ds.append(dong);
    });
    khung.append(ds);
    datNoiDung(KHUNG, khung);
  }

  await ve();
}
