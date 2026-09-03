/* Kế hoạch năm học và Thời khoá biểu — quản lý trên web. */
import { $, e, datNoiDung, api, homNay, ngayVN, nhac, khoiDangTai } from '/assets/js/chung.js';
import {
  tieuDeTrang, nut, truong, oNhap, oChon, moHopThoai, dongHopThoai,
} from '/assets/js/giao-dien.js';

/* ================= Kế hoạch năm học ================= */

const MUC_DO = [['', 'Bình thường'], ['ok', 'Tốt / lễ hội'], ['warn', 'Cần chú ý'], ['danger', 'Quan trọng']];
const LOP_MUC_DO = { ok: 'nhan-tot', warn: 'nhan-luuy', danger: 'nhan-xau', '': 'nhan-xam' };

export async function trangKeHoach(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const d = await api('/api/gv/ke-hoach');
    const khung = e('div');

    const dau = e('div', 'tieu-de-trang');
    const trai = e('div');
    trai.append(e('h1', null, 'Kế hoạch năm học'), e('p', null, 'Hiện trên trang lớp cho cả lớp xem.'));
    const phai = e('div', 'phai');
    phai.append(nut('+ Thêm mốc mới', '', () => soanKeHoach(null, ve)));
    dau.append(trai, phai);
    khung.append(dau);

    if (!d.danhSach.length) {
      khung.append(e('div', 'the trong', 'Chưa có mốc nào. Bấm "Thêm mốc mới" để bắt đầu.'));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      d.danhSach.forEach((k) => {
        const m = e('div', 'muc-nhat-ky' + (k.hoanThanh ? ' da-xong' : ''));
        const dong = e('div', 'dong-dau');
        dong.append(e('span', 'nhan ' + LOP_MUC_DO[k.mucDo || ''], ngayVN(k.ngay)));
        if (k.hoanThanh) dong.append(e('span', 'nhan nhan-tot', 'Đã xong'));

        const viec = e('div', 'viec');
        viec.append(
          nut(k.hoanThanh ? '↺' : '✓', 'nut-nhe nut-nho', async () => {
            try {
              await api('/api/gv/ke-hoach', { method: 'PATCH', than: { id: k.id, hoanThanh: !k.hoanThanh } });
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          }),
          nut('✎', 'nut-nhe nut-nho', () => soanKeHoach(k, ve)),
          nut('✕', 'nut-nhe nut-nho', () => {
            moHopThoai('Xoá mốc này?', e('p', null, k.tieuDe), [
              nut('Huỷ', 'nut-nhe', dongHopThoai),
              nut('Xoá', 'nut-xau', async () => {
                try {
                  await api('/api/gv/ke-hoach?id=' + k.id, { method: 'DELETE' });
                  dongHopThoai();
                  nhac('Đã xoá', 'tot');
                  ve();
                } catch (err) { nhac(err.message, 'xau'); }
              }),
            ]);
          })
        );
        dong.append(viec);

        m.append(dong, Object.assign(e('h3', null, k.tieuDe), { style: 'margin:4px 0' }));
        if (k.moTa) m.append(e('p', null, k.moTa));
        ds.append(m);
      });
      khung.append(ds);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

function soanKeHoach(k, taiLai) {
  const oNgay = oNhap('khNgay', 'date', k ? k.ngay : homNay());
  const oTieuDe = oNhap('khTieuDe', 'text', k ? k.tieuDe : '', 'Ví dụ: Kiểm tra giữa kì I');
  const oMoTa = oNhap('khMoTa', 'textarea', k ? k.moTa : '', 'Mô tả thêm (không bắt buộc)');
  const oMucDo = oChon('khMucDo', MUC_DO, k ? (k.mucDo || '') : '');

  moHopThoai(k ? 'Sửa mốc kế hoạch' : 'Thêm mốc mới', [
    truong('Ngày', oNgay),
    truong('Tiêu đề', oTieuDe),
    truong('Mức độ', oMucDo),
    truong('Mô tả', oMoTa),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut(k ? 'Lưu' : 'Thêm', '', async (ev) => {
      if (!oTieuDe.value.trim()) return nhac('Chưa nhập tiêu đề', 'xau');
      ev.currentTarget.disabled = true;
      try {
        const than = { ngay: oNgay.value, tieuDe: oTieuDe.value, moTa: oMoTa.value, mucDo: oMucDo.value };
        if (k) await api('/api/gv/ke-hoach', { method: 'PATCH', than: { id: k.id, ...than } });
        else await api('/api/gv/ke-hoach', { method: 'POST', than });
        dongHopThoai();
        nhac(k ? 'Đã lưu' : 'Đã thêm', 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

/* ================= Thời khoá biểu ================= */

const CAC_THU = [2, 3, 4, 5, 6, 7];
const TEN_THU = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7' };

export async function trangThoiKhoaBieu(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api('/api/gv/thoi-khoa-bieu');

  const soTiet = Math.max(5, ...d.danhSach.map((x) => x.tiet));
  const bang = {};
  d.danhSach.forEach((x) => { bang[`${x.thu}-${x.tiet}`] = x.mon; });

  const khung = e('div');
  const oCacO = new Map();   // "thu-tiet" -> input element

  khung.append(tieuDeTrang('Thời khoá biểu', 'Hiện trên trang lớp. Để trống ô nào thì tiết đó nghỉ.'));

  const boc = e('div', 'cuon-ngang');
  const bangHtml = e('table');
  const dau = e('thead');
  const hd = e('tr');
  hd.append(e('th', 'so', 'Tiết'), ...CAC_THU.map((t) => e('th', null, TEN_THU[t])));
  dau.append(hd);

  const than = e('tbody');
  for (let tiet = 1; tiet <= soTiet; tiet++) {
    const tr = e('tr');
    tr.append(e('td', 'so', tiet));
    CAC_THU.forEach((thu) => {
      const td = e('td');
      const o = e('input', 'o-nhap');
      o.style.cssText = 'min-width:110px;min-height:36px;padding:5px 8px;font-size:13.5px';
      o.value = bang[`${thu}-${tiet}`] || '';
      o.placeholder = '—';
      oCacO.set(`${thu}-${tiet}`, o);
      td.append(o);
      tr.append(td);
    });
    than.append(tr);
  }
  bangHtml.append(dau, than);
  boc.append(bangHtml);
  khung.append(boc);
  khung.append(Object.assign(e('div'), { style: 'height:70px' }));

  const thanhLuu = e('div', 'thanh-luu');
  thanhLuu.append(
    e('div', 'thong-tin', 'Sửa xong bấm Lưu — áp dụng cho cả lớp.'),
    nut('Lưu thời khoá biểu', '', async (ev) => {
      const b = ev.currentTarget;
      b.disabled = true;
      b.textContent = 'Đang lưu…';
      const o = [];
      oCacO.forEach((input, khoa) => {
        const [thu, tiet] = khoa.split('-').map(Number);
        if (input.value.trim()) o.push({ thu, tiet, mon: input.value.trim() });
      });
      try {
        await api('/api/gv/thoi-khoa-bieu', { method: 'POST', than: { o } });
        nhac('Đã lưu thời khoá biểu', 'tot');
      } catch (err) {
        nhac(err.message, 'xau');
      }
      b.disabled = false;
      b.textContent = 'Lưu thời khoá biểu';
    })
  );
  khung.append(thanhLuu);

  datNoiDung(KHUNG, khung);
}
