/* Hộp thoại soạn/sửa Thông báo — DÙNG CHUNG cho khu quản lý (giao-vien/app.js) và lối tắt
   "⚙ Quản lý" ngay trên trang lớp (trang-lop.js), để hai nơi luôn giống hệt nhau, không lệch
   tính năng như trước (bên khu quản lý từng thiếu ô "nổi bật"). */
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

/** Khối "đính kèm hình ảnh": ảnh hiện có (nếu có) + tích xoá, và ô chọn ảnh mới. */
function khoiDinhKemHinh(tb) {
  const khung = e('div');
  khung.style.cssText = 'border-top:1px dashed var(--vien);padding-top:12px;margin-top:4px';
  khung.append(Object.assign(e('div', null, '🖼 Hình ảnh đính kèm'), { style: 'font-weight:700;font-size:13.5px;margin-bottom:8px' }));

  let oXoa = null;
  if (tb && tb.hinhKhoa) {
    const img = e('img');
    img.src = '/api/anh?khoa=' + encodeURIComponent(tb.hinhKhoa);
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
  khung.append(truong(tb && tb.hinhKhoa ? 'Thay bằng ảnh khác' : 'Chọn ảnh (tự nén nhỏ)', oTep));

  return { khung, oTep, oXoa };
}

/** Khối "đính kèm âm thanh": nghe thử file hiện có (nếu có) + tích xoá, và ô chọn file mới. */
function khoiDinhKemNhac(tb) {
  const khung = e('div');
  khung.style.cssText = 'border-top:1px dashed var(--vien);padding-top:12px;margin-top:4px';
  khung.append(Object.assign(e('div', null, '🎵 Âm thanh đính kèm'), { style: 'font-weight:700;font-size:13.5px;margin-bottom:8px' }));

  let oXoa = null;
  if (tb && tb.nhacKhoa) {
    const audio = e('audio');
    audio.controls = true;
    audio.preload = 'none';
    audio.src = '/api/thong-bao-nhac?id=' + tb.id;
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
  khung.append(truong(tb && tb.nhacKhoa ? 'Thay bằng file khác (.mp3, tối đa 12 MB)' : 'Chọn file .mp3 (tối đa 12 MB)', oTep));

  return { khung, oTep, oXoa };
}

export function moHopThoaiSoanThongBao(tb, lamMoi) {
  const oNgay = oNhap('tbNgay', 'date', tb ? tb.ngay : homNay());
  const oTd = oNhap('tbTd', 'text', tb ? tb.tieuDe : '', 'Ví dụ: Họp phụ huynh đầu năm');
  const oNd = oNhap('tbNd', 'textarea', tb ? tb.noiDung : '', 'Nội dung chi tiết…');
  const oLoai = oChon('tbLoai', LOAI_THONG_BAO, tb ? tb.loai : 'Chủ nhiệm');
  const oMucDo = oChon('tbMucDo', MUC_DO_THONG_BAO, tb ? (tb.mucDo || '') : '');
  const oVideo = oNhap('tbVideo', 'text', tb ? (tb.videoUrl || '') : '', 'Dán link YouTube… (để trống nếu không có)');

  const [oGhim, hangGhim] = hangTich('tbGhim', 'Ghim lên đầu trang lớp', tb && tb.ghim);
  const [oNoiBat, hangNoiBat] = hangTich('tbNoiBat', 'Hiện trong băng điểm nhấn ở trang chủ', tb && tb.noiBat);

  const { khung: khoiHinh, oTep: oTepHinh, oXoa: oXoaHinh } = khoiDinhKemHinh(tb);
  const { khung: khoiNhac, oTep: oTepNhac, oXoa: oXoaNhac } = khoiDinhKemNhac(tb);

  moHopThoai(tb ? 'Sửa thông báo' : 'Soạn thông báo', [
    truong('Ngày', oNgay),
    truong('Tiêu đề', oTd),
    truong('Loại', oLoai),
    truong('Mức độ quan trọng', oMucDo, 'Quyết định màu nhãn hiển thị cho học sinh — chọn "Quan trọng" cho tin cần chú ý nhất.'),
    truong('Nội dung', oNd),
    hangGhim,
    hangNoiBat,
    truong('Video', oVideo),
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

      ev.currentTarget.disabled = true;
      try {
        const than = {
          ngay: oNgay.value, tieuDe: oTd.value, noiDung: oNd.value, loai: oLoai.value,
          ghim: oGhim.checked, noiBat: oNoiBat.checked, mucDo: oMucDo.value, videoUrl: oVideo.value.trim(),
        };

        let id = tb ? tb.id : null;
        if (tb) await api('/api/gv/thong-bao', { method: 'PATCH', than: { id, ...than } });
        else { const kq = await api('/api/gv/thong-bao', { method: 'POST', than }); id = kq.id; }

        if (oXoaHinh && oXoaHinh.checked) {
          await api(`/api/gv/thong-bao-tep?id=${id}&loai=hinh`, { method: 'DELETE' });
        } else if (oTepHinh.files[0]) {
          const blob = await nenAnhThanhBlob(oTepHinh.files[0]);
          await api(`/api/gv/thong-bao-tep?id=${id}&loai=hinh`, {
            method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob,
          });
        }

        if (oXoaNhac && oXoaNhac.checked) {
          await api(`/api/gv/thong-bao-tep?id=${id}&loai=nhac`, { method: 'DELETE' });
        } else if (tepNhac) {
          const duLieu = await tepNhac.arrayBuffer();
          await api(`/api/gv/thong-bao-tep?id=${id}&loai=nhac`, {
            method: 'POST', headers: { 'Content-Type': 'audio/mpeg' }, body: duLieu,
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
