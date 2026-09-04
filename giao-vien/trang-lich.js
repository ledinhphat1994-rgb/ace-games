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
          }, (k.hoanThanh ? 'Đánh dấu chưa xong: ' : 'Đánh dấu hoàn thành: ') + k.tieuDe),
          nut('✎', 'nut-nhe nut-nho', () => soanKeHoach(k, ve), 'Sửa mốc: ' + k.tieuDe),
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
          }, 'Xoá mốc: ' + k.tieuDe)
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

/* ================= Thời khoá biểu (có phiên bản, sáng + chiều) ================= */

const CAC_THU = [2, 3, 4, 5, 6, 7];
const TEN_THU = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7' };
const CAC_BUOI = [['sang', 'Buổi sáng'], ['chieu', 'Buổi chiều']];

export async function trangThoiKhoaBieu(KHUNG, phienBanXem) {
  datNoiDung(KHUNG, khoiDangTai());

  const d = phienBanXem
    ? await api('/api/gv/thoi-khoa-bieu?phienBanId=' + phienBanXem)
    : await api('/api/gv/thoi-khoa-bieu');

  const chiXem = Boolean(phienBanXem);   // xem phiên bản lịch sử thì không cho sửa tại chỗ
  let buoiDangXem = 'sang';
  let dangSua = false;

  const bang = {};   // "buoi-thu-tiet" -> mon (dữ liệu gốc từ máy chủ)
  (d.o || []).forEach((x) => { bang[`${x.buoi}-${x.thu}-${x.tiet}`] = x.mon; });
  let soTietToiDa = Math.max(5, ...(d.o || []).map((x) => x.tiet), 0);
  const oCacO = new Map();   // "buoi-thu-tiet" -> input, dùng khi đang sửa nhanh — giữ qua đổi tab buổi

  const khung = e('div');

  if (chiXem) {
    khung.append(nut('← Về thời khoá biểu hiện tại', 'nut-nhe nut-nho', () => { if (history.length > 1) history.back(); else location.hash = '#/thoi-khoa-bieu'; }));
  }

  const dauTrang = e('div');
  khung.append(dauTrang);

  // Tab chọn buổi
  const tabBuoi = e('div', 'day-loc');
  tabBuoi.style.marginBottom = '14px';

  function veTab() {
    datNoiDung(tabBuoi, ...CAC_BUOI.map(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(buoiDangXem === ma));
      b.addEventListener('click', () => { buoiDangXem = ma; veTab(); veBang(); });
      return b;
    }));
  }

  const khungBang = e('div');
  const khungThanhLuu = e('div');

  function veThanhLuu() {
    datNoiDung(khungThanhLuu);
    if (!dangSua) return;
    const thanh = e('div', 'thanh-luu');
    thanh.append(e('div', 'thong-tin', 'Đang sửa thời khoá biểu — nhớ bấm Lưu để áp dụng.'));
    thanh.append(
      nut('Huỷ', 'nut-nhe nut-nho', () => { dangSua = false; oCacO.clear(); veDauTrang(); veBang(); veThanhLuu(); }),
      nut('Lưu thay đổi', '', async (ev) => {
        ev.currentTarget.disabled = true;
        const o = [];
        oCacO.forEach((input, khoa) => {
          if (!input.value.trim()) return;
          const [buoi, thu, tiet] = khoa.split('-');
          o.push({ buoi, thu: Number(thu), tiet: Number(tiet), mon: input.value.trim() });
        });
        try {
          await api('/api/gv/thoi-khoa-bieu', { method: 'PATCH', than: { phienBanId: d.phienBan.id, o } });
          nhac('Đã lưu thời khoá biểu', 'tot');
          await trangThoiKhoaBieu(KHUNG, phienBanXem);
        } catch (err) {
          nhac(err.message, 'xau');
          ev.currentTarget.disabled = false;
        }
      })
    );
    khungThanhLuu.append(thanh);
  }

  function veDauTrang() {
    datNoiDung(dauTrang, tieuDeTrang(
      chiXem ? `Phiên bản cũ: ${d.phienBan?.ten || ''}` : 'Thời khoá biểu',
      d.phienBan
        ? `Áp dụng từ ${ngayVN(d.phienBan.ngayBatDau)}${d.phienBan.ngayKetThuc ? ' đến ' + ngayVN(d.phienBan.ngayKetThuc) : ' — đang áp dụng'}`
        : 'Chưa có thời khoá biểu nào.',
      ...(chiXem || !d.phienBan ? [] : dangSua ? [] : [
        nut('📜 Lịch sử phiên bản', 'nut-vien nut-nho', () => { location.hash = '#/thoi-khoa-bieu-lich-su'; }),
        nut('✎ Sửa nhanh', 'nut-vien nut-nho', () => { dangSua = true; veDauTrang(); veBang(); veThanhLuu(); }),
        nut('+ Đổi lịch (tạo phiên bản mới)', '', () => taoPhienBanMoi(bang, soTietToiDa)),
      ])
    ));
  }

  function veBang() {
    const soTietXem = dangSua ? Math.max(soTietToiDa, 5) : (Math.max(5, ...(d.o || []).filter((x) => x.buoi === buoiDangXem).map((x) => x.tiet), 0) || 5);
    const boc = e('div', 'cuon-ngang');
    const bangHtml = e('table');
    const dau = e('thead');
    const hd = e('tr');
    hd.append(e('th', 'so', 'Tiết'), ...CAC_THU.map((t) => e('th', null, TEN_THU[t])));
    dau.append(hd);

    const than = e('tbody');
    for (let tiet = 1; tiet <= soTietXem; tiet++) {
      const tr = e('tr');
      tr.append(e('td', 'so', tiet));
      CAC_THU.forEach((thu) => {
        const khoa = `${buoiDangXem}-${thu}-${tiet}`;
        if (dangSua) {
          let o = oCacO.get(khoa);
          if (!o) {
            o = e('input', 'o-nhap');
            o.style.cssText = 'min-width:100px;min-height:34px;padding:4px 7px;font-size:13px';
            o.value = bang[khoa] || '';
            oCacO.set(khoa, o);
          }
          const td = e('td');
          td.append(o);
          tr.append(td);
        } else {
          const mon = bang[khoa] || '';
          tr.append(e('td', null, mon || '—'));
        }
      });
      than.append(tr);
    }
    bangHtml.append(dau, than);
    boc.append(bangHtml);
    datNoiDung(khungBang, boc);
  }

  veDauTrang();
  veTab();
  veBang();
  khung.append(tabBuoi, khungBang);

  if (d.phienBan?.ghiChu) {
    khung.append(Object.assign(e('p', 'trong', 'Ghi chú: ' + d.phienBan.ghiChu), { style: 'margin-top:12px' }));
  }
  khung.append(khungThanhLuu);
  khung.append(Object.assign(e('div'), { style: 'height:70px' }));

  datNoiDung(KHUNG, khung);
}

function taoPhienBanMoi(bangCu, soTietCu) {
  const oTen = oNhap('tkbTen', 'text', '', 'Ví dụ: Thời khoá biểu học kì 2');
  const oNgay = oNhap('tkbNgay', 'date', homNay());
  const oGhiChu = oNhap('tkbGhiChu', 'text', '', 'Lý do đổi lịch (không bắt buộc)');

  const oSaoChep = e('input');
  oSaoChep.type = 'checkbox';
  oSaoChep.id = 'tkbSaoChep';
  oSaoChep.checked = true;
  const nhanSaoChep = e('label');
  nhanSaoChep.style.cssText = 'display:flex;gap:9px;align-items:center;font-size:14px;margin-top:4px';
  nhanSaoChep.append(oSaoChep, document.createTextNode('Sao chép thời khoá biểu hiện tại làm điểm bắt đầu, rồi sửa lại'));

  let buoiDangSua = 'sang';
  const oCacO = new Map();   // "buoi-thu-tiet" -> input

  const hopBang = e('div');
  const tabBuoi = e('div', 'day-loc');
  tabBuoi.style.margin = '10px 0';

  function veTabSua() {
    datNoiDung(tabBuoi, ...CAC_BUOI.map(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(buoiDangSua === ma));
      b.addEventListener('click', () => { buoiDangSua = ma; veTabSua(); veBangSua(); });
      return b;
    }));
  }

  function veBangSua() {
    const boc = e('div', 'cuon-ngang');
    const bangHtml = e('table');
    const dau = e('thead');
    const hd = e('tr');
    hd.append(e('th', 'so', 'Tiết'), ...CAC_THU.map((t) => e('th', null, TEN_THU[t])));
    dau.append(hd);

    const than = e('tbody');
    const soTiet = Math.max(5, soTietCu || 0);
    for (let tiet = 1; tiet <= soTiet; tiet++) {
      const tr = e('tr');
      tr.append(e('td', 'so', tiet));
      CAC_THU.forEach((thu) => {
        const khoa = `${buoiDangSua}-${thu}-${tiet}`;
        let o = oCacO.get(khoa);
        if (!o) {
          o = e('input', 'o-nhap');
          o.style.cssText = 'min-width:100px;min-height:34px;padding:4px 7px;font-size:13px';
          if (oSaoChep.checked) o.value = bangCu[khoa] || '';
          oCacO.set(khoa, o);
        }
        const td = e('td');
        td.append(o);
        tr.append(td);
      });
      than.append(tr);
    }
    bangHtml.append(dau, than);
    boc.append(bangHtml);
    datNoiDung(hopBang, boc);
  }

  oSaoChep.addEventListener('change', () => {
    oCacO.forEach((o, khoa) => { o.value = oSaoChep.checked ? (bangCu[khoa] || '') : ''; });
  });

  veTabSua();
  veBangSua();

  moHopThoai('Tạo phiên bản thời khoá biểu mới', [
    truong('Tên phiên bản', oTen),
    truong('Áp dụng từ ngày', oNgay, 'Thời khoá biểu cũ tự động kết thúc đúng một ngày trước đó — vẫn xem lại được trong Lịch sử.'),
    nhanSaoChep,
    tabBuoi,
    hopBang,
    truong('Ghi chú', oGhiChu),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu phiên bản mới', '', async (ev) => {
      ev.currentTarget.disabled = true;
      const o = [];
      oCacO.forEach((input, khoa) => {
        if (!input.value.trim()) return;
        const [buoi, thu, tiet] = khoa.split('-');
        o.push({ buoi, thu: Number(thu), tiet: Number(tiet), mon: input.value.trim() });
      });
      try {
        await api('/api/gv/thoi-khoa-bieu', {
          method: 'POST',
          than: { ten: oTen.value, ngayBatDau: oNgay.value, ghiChu: oGhiChu.value, o },
        });
        dongHopThoai();
        nhac('Đã lưu phiên bản thời khoá biểu mới', 'tot');
        location.hash = '#/thoi-khoa-bieu';
        trangThoiKhoaBieu(document.getElementById('noiDung'));
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

export async function trangThoiKhoaBieuLichSu(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api('/api/gv/thoi-khoa-bieu?ds=1');

  const khung = e('div');
  khung.append(nut('← Về thời khoá biểu hiện tại', 'nut-nhe nut-nho', () => { if (history.length > 1) history.back(); else location.hash = '#/thoi-khoa-bieu'; }));
  khung.append(tieuDeTrang('Lịch sử thời khoá biểu', `${d.danhSach.length} phiên bản đã lưu`));

  if (!d.danhSach.length) {
    khung.append(e('p', 'trong', 'Chưa có phiên bản nào.'));
  } else {
    const ds = e('div', 'ds-nhat-ky');
    d.danhSach.forEach((pb, i) => {
      const dangApDung = i === 0 && !pb.ngayKetThuc;
      const m = e('div', 'muc-nhat-ky' + (dangApDung ? '' : ' da-xong'));
      const dong = e('div', 'dong-dau');
      dong.append(
        e('span', 'ngay', `${ngayVN(pb.ngayBatDau)}${pb.ngayKetThuc ? ' → ' + ngayVN(pb.ngayKetThuc) : ' → hiện tại'}`)
      );
      if (dangApDung) dong.append(e('span', 'nhan nhan-tot', 'Đang áp dụng'));
      const viec = e('div', 'viec');
      viec.append(nut('Xem', 'nut-nhe nut-nho', () => {
        location.hash = '#/thoi-khoa-bieu-xem/' + pb.id;
      }));
      if (!dangApDung) {
        viec.append(nut('✕', 'nut-nhe nut-nho', () => {
          moHopThoai('Xoá phiên bản này?', e('p', null, pb.ten), [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá', 'nut-xau', async () => {
              try {
                await api('/api/gv/thoi-khoa-bieu?phienBanId=' + pb.id, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá', 'tot');
                trangThoiKhoaBieuLichSu(KHUNG);
              } catch (err) { nhac(err.message, 'xau'); }
            }),
          ]);
        }, 'Xoá phiên bản: ' + pb.ten));
      }
      dong.append(viec);
      m.append(dong, e('h3', null, pb.ten));
      if (pb.ghiChu) m.append(e('p', null, pb.ghiChu));
      ds.append(m);
    });
    khung.append(ds);
  }

  datNoiDung(KHUNG, khung);
}
