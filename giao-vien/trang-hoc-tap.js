/* Sổ điểm, thống kê chuyên cần, báo cáo và mã cá nhân. */
import { $, e, datNoiDung, api, homNay, ngayVN, nhac, khoiDangTai, layThongTinVaiTro } from '/assets/js/chung.js';
import {
  tieuDeTrang, oThongKe, nut, lienKetNut, truong, oNhap, oChon,
  moHopThoai, dongHopThoai, chonHocKi, bieuDoCot, chuThichMau,
} from '/assets/js/giao-dien.js';
import { veKhoiTaiKhoanPhu } from './trang-quy.js';

const MAU = {
  coMat: 'var(--tot)', tre: 'var(--luu-y)',
  vangPhep: 'var(--chinh)', vangKhongPhep: 'var(--xau)',
};

const MUC_XEP_LOAI = ['Tốt', 'Khá', 'Đạt', 'Chưa đạt'];
const LOP_XEP_LOAI = { 'Tốt': 'nhan-tot', 'Khá': 'nhan', 'Đạt': 'nhan-luuy', 'Chưa đạt': 'nhan-xau' };

/* ================= Sổ điểm ================= */

export async function trangSoDiem(KHUNG, monDangXem) {
  datNoiDung(KHUNG, khoiDangTai());
  let hocKi = Number(sessionStorage.getItem('sd-hocki')) || 1;
  let mon = monDangXem || '';

  async function ve() {
    sessionStorage.setItem('sd-hocki', String(hocKi));
    const d = await api(`/api/gv/so-diem?hocKi=${hocKi}${mon ? '&mon=' + encodeURIComponent(mon) : ''}`);
    datNoiDung(KHUNG, mon ? veBangMot(d) : veTongHop(d));
  }

  /* ---------- Tổng hợp tất cả các môn ---------- */
  function veTongHop(d) {
    const khung = e('div');
    khung.append(tieuDeTrang('Sổ điểm', `Học kì ${hocKi} · điểm trung bình tính theo Thông tư 22/2021`));
    khung.append(chonHocKi(hocKi, (hk) => { hocKi = hk; ve(); }));

    const dem = {};
    d.danhSach.forEach((h) => { if (h.xepLoai) dem[h.xepLoai] = (dem[h.xepLoai] || 0) + 1; });
    const chuaDu = d.danhSach.filter((h) => !h.xepLoai).length;

    const day = e('div', 'day-so');
    day.style.marginTop = '16px';
    day.append(
      oThongKe(String(dem['Tốt'] || 0), 'Tốt', 'tot'),
      oThongKe(String(dem['Khá'] || 0), 'Khá'),
      oThongKe(String(dem['Đạt'] || 0), 'Đạt', 'luuy'),
      oThongKe(String((dem['Chưa đạt'] || 0)), 'Chưa đạt', 'xau')
    );
    khung.append(day);

    if (chuaDu) {
      const nhac2 = e('div', 'the');
      nhac2.style.borderColor = 'var(--luu-y)';
      nhac2.append(e('p', null,
        `${chuaDu} em chưa xếp loại được vì còn thiếu điểm giữa kì hoặc cuối kì ở một số môn.`));
      khung.append(nhac2);
    }

    // Chọn môn để nhập điểm
    const nhanMon = e('div', 'the-nhan', 'Chọn môn để nhập điểm');
    nhanMon.style.margin = '18px 0 8px';
    khung.append(nhanMon);

    const hopMon = e('div', 'day-loc');
    d.monHoc.forEach((m) => {
      const b = e('button', 'vien-loc', m.ten);
      b.type = 'button';
      b.addEventListener('click', () => { mon = m.ma; ve(); });
      hopMon.append(b);
    });
    khung.append(hopMon);

    // Bảng tổng hợp
    const boc = e('div', 'cuon-ngang');
    boc.style.marginTop = '18px';
    const bang = e('table');
    const dau = e('thead');
    const hangDau = e('tr');
    hangDau.append(e('th', 'so', 'STT'), e('th', null, 'Họ và tên'));
    d.monHoc.forEach((m) => {
      const th = e('th', null, vietTat(m.ten));
      th.title = m.ten;
      dau.append();
      hangDau.append(th);
    });
    hangDau.append(e('th', null, 'TB'), e('th', null, 'Học lực'), e('th', null, 'Rèn luyện'));
    dau.append(hangDau);

    const than = e('tbody');
    d.danhSach.forEach((h) => {
      const tr = e('tr');
      tr.append(e('td', 'so', h.id), e('td', null, h.hoTen));
      d.monHoc.forEach((m) => {
        const v = h.theoMon[m.ma];
        const td = e('td');
        if (m.cach_danh_gia === 'diem') {
          td.textContent = v === null || v === undefined ? '—' : String(v);
          if (typeof v === 'number' && v < 5) td.style.color = 'var(--xau)';
        } else {
          td.textContent = v === 'CD' ? 'CĐ' : v === 'D' ? 'Đ' : '—';
        }
        tr.append(td);
      });
      tr.append(e('td', null, h.dtbChung ?? '—'));

      const tdXl = e('td');
      if (h.xepLoai) tdXl.append(e('span', 'nhan ' + LOP_XEP_LOAI[h.xepLoai], h.xepLoai));
      else tdXl.append(e('span', 'trong', 'Thiếu điểm'));
      tr.append(tdXl);

      const tdRl = e('td');
      const chonRl = oChon('rl' + h.id, [['', '—'], ...MUC_XEP_LOAI.map((m2) => [m2, m2])], h.renLuyen);
      chonRl.style.cssText = 'min-height:32px;padding:4px 8px;font-size:13px';
      chonRl.addEventListener('change', async () => {
        try {
          await api('/api/gv/ren-luyen', {
            method: 'POST',
            than: { hocKi, ghiNhan: [{ hocSinhId: h.id, muc: chonRl.value, nhanXet: h.nhanXetRenLuyen }] },
          });
          nhac('Đã lưu rèn luyện', 'tot');
        } catch (err) { nhac(err.message, 'xau'); }
      });
      tdRl.append(chonRl);
      tr.append(tdRl);
      than.append(tr);
    });

    bang.append(dau, than);
    boc.append(bang);
    khung.append(boc);

    khung.append(Object.assign(
      e('p', 'trong', 'Đ = Đạt, CĐ = Chưa đạt (môn đánh giá bằng nhận xét). Ô “—” là chưa đủ điểm để tính.'),
      { style: 'margin-top:10px' }
    ));
    return khung;
  }

  /* ---------- Nhập điểm một môn ---------- */
  function veBangMot(d) {
    const m = d.mon;
    const thayDoi = new Map();   // "hsId|loai|stt" -> giá trị

    const khung = e('div');
    khung.append(nut('← Tất cả các môn', 'nut-nhe nut-nho', () => { mon = ''; ve(); }));
    khung.append(tieuDeTrang(m.ten, `Học kì ${hocKi} · ${m.cach_danh_gia === 'diem'
      ? `${m.so_dgtx} cột thường xuyên + giữa kì + cuối kì` : 'đánh giá bằng nhận xét'}`));
    khung.append(chonHocKi(hocKi, (hk) => { hocKi = hk; ve(); }));

    const boc = e('div', 'cuon-ngang');
    boc.style.marginTop = '16px';
    const bang = e('table');

    const hangDau = e('tr');
    hangDau.append(e('th', 'so', 'STT'), e('th', null, 'Họ và tên'));
    if (m.cach_danh_gia === 'diem') {
      for (let i = 1; i <= m.so_dgtx; i++) hangDau.append(e('th', null, 'TX' + i));
      hangDau.append(e('th', null, 'Giữa kì'), e('th', null, 'Cuối kì'), e('th', null, 'ĐTB'));
    } else {
      hangDau.append(e('th', null, 'Đánh giá'));
    }
    const dau = e('thead');
    dau.append(hangDau);

    const than = e('tbody');
    d.danhSach.forEach((h) => {
      const tr = e('tr');
      tr.append(e('td', 'so', h.id), e('td', null, h.hoTen));

      if (m.cach_danh_gia === 'diem') {
        const oDtb = e('td', null, h.dtb ?? '—');
        oDtb.style.fontWeight = '700';

        const taoO = (loai, stt, giaTri) => {
          const o = e('input', 'o-nhap');
          o.type = 'number';
          o.min = '0'; o.max = '10'; o.step = '0.1';
          o.value = giaTri === null || giaTri === undefined ? '' : String(giaTri);
          o.style.cssText = 'width:62px;min-height:34px;padding:4px 6px;text-align:center;font-size:14px';
          o.setAttribute('aria-label', `${h.hoTen} — ${loai === 'tx' ? 'thường xuyên ' + stt : loai === 'gk' ? 'giữa kì' : 'cuối kì'}`);
          o.addEventListener('input', () => {
            const v = o.value.trim();
            if (v !== '' && (Number(v) < 0 || Number(v) > 10 || Number.isNaN(Number(v)))) {
              o.style.borderColor = 'var(--xau)';
              return;
            }
            o.style.borderColor = '';
            thayDoi.set(`${h.id}|${loai}|${stt}`, v === '' ? null : Number(v));
            capNhatThanhLuu();
          });
          const td = e('td');
          td.append(o);
          return td;
        };

        for (let i = 0; i < m.so_dgtx; i++) tr.append(taoO('tx', i + 1, h.tx[i]));
        tr.append(taoO('gk', 1, h.gk), taoO('ck', 1, h.ck), oDtb);
      } else {
        const chon = oChon('nx' + h.id, [['', '—'], ['D', 'Đạt'], ['CD', 'Chưa đạt']], h.nhanXet);
        chon.style.cssText = 'min-height:32px;padding:4px 8px;font-size:13px;width:auto';
        chon.addEventListener('change', () => {
          thayDoi.set(`${h.id}|ck|1`, chon.value);
          capNhatThanhLuu();
        });
        const td = e('td');
        td.append(chon);
        tr.append(td);
      }
      than.append(tr);
    });

    bang.append(dau, than);
    boc.append(bang);
    khung.append(boc);
    khung.append(Object.assign(e('div'), { style: 'height:70px' }));

    function capNhatThanhLuu() {
      const cu = khung.querySelector('.thanh-luu');
      if (cu) cu.remove();
      if (!thayDoi.size) return;

      const thanh = e('div', 'thanh-luu');
      thanh.append(e('div', 'thong-tin', `${thayDoi.size} ô điểm chưa lưu`));
      thanh.append(
        nut('Bỏ', 'nut-nhe nut-nho', () => ve()),
        nut('Lưu điểm', '', async (ev) => {
          const b = ev.currentTarget;
          b.disabled = true;
          b.textContent = 'Đang lưu…';
          try {
            const ghiDiem = [...thayDoi].map(([khoa, giaTri]) => {
              const [hsId, loai, stt] = khoa.split('|');
              return m.cach_danh_gia === 'diem'
                ? { hocSinhId: Number(hsId), loai, soThuTu: Number(stt), giaTri }
                : { hocSinhId: Number(hsId), loai: 'ck', soThuTu: 1, giaTri: null, nhanXet: giaTri || '' };
            });
            await api('/api/gv/so-diem', { method: 'POST', than: { hocKi, mon: m.ma, ghiDiem } });
            nhac('Đã lưu điểm', 'tot');
            await ve();
          } catch (err) {
            nhac(err.message, 'xau');
            b.disabled = false;
            b.textContent = 'Lưu điểm';
          }
        })
      );
      khung.append(thanh);
    }

    return khung;
  }

  await ve();
}

function vietTat(ten) {
  const rutGon = {
    'Ngữ văn': 'Văn', 'Toán': 'Toán', 'Tiếng Anh': 'Anh', 'Vật lí': 'Lí', 'Hoá học': 'Hoá',
    'Sinh học': 'Sinh', 'Lịch sử': 'Sử', 'Địa lí': 'Địa', 'Tin học': 'Tin',
    'Giáo dục kinh tế & pháp luật': 'KT-PL', 'Giáo dục thể chất': 'TC',
    'Hoạt động trải nghiệm, hướng nghiệp': 'HĐTN',
  };
  return rutGon[ten] || ten.slice(0, 6);
}

/* ================= Thống kê chuyên cần ================= */

/* Thống kê là nơi TẬP TRUNG mọi số liệu tương tác của trang lớp — không chỉ chuyên cần.
   "Chuyên cần" là tab gốc (giữ nguyên logic cũ); "Tương tác" gộp lượt truy cập trang chủ
   và sẽ là chỗ cắm thêm chat nhóm/chat cá nhân/trò chơi nhẹ sau này — thêm số liệu mới thì
   thêm thẻ vào veTuongTac(), không mở trang thống kê rời rạc khác. */
const CAC_TAB_THONG_KE = [['chuyen-can', 'Chuyên cần'], ['tuong-tac', 'Tương tác']];

export async function trangThongKe(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());
  let tab = sessionStorage.getItem('tk-tab') || 'chuyen-can';
  if (!CAC_TAB_THONG_KE.some(([ma]) => ma === tab)) tab = 'chuyen-can';

  const vo = e('div');
  const hopTab = e('div', 'day-loc');
  hopTab.style.margin = '0 0 16px';
  const noiDung = e('div');
  vo.append(hopTab, noiDung);
  datNoiDung(KHUNG, vo);

  function veThanhTab() {
    datNoiDung(hopTab, ...CAC_TAB_THONG_KE.map(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(tab === ma));
      b.addEventListener('click', () => {
        tab = ma;
        sessionStorage.setItem('tk-tab', tab);
        veThanhTab();
        veTab();
      });
      return b;
    }));
  }

  async function veTab() {
    datNoiDung(noiDung, khoiDangTai());
    if (tab === 'tuong-tac') await veTuongTac(noiDung);
    else await veChuyenCan(noiDung);
  }

  veThanhTab();
  await veTab();
}

/** D1 lưu giờ UTC — cộng 7 tiếng để hiện đúng giờ Việt Nam. */
function taoLucVN(taoLuc) {
  const d = new Date(taoLuc.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return taoLuc;
  d.setHours(d.getHours() + 7);
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ---------- Tương tác: lượt truy cập trang lớp + chỗ dành cho chat/trò chơi sau này ---------- */
async function veTuongTac(KHUNG) {
  const d = await api('/api/gv/tuong-tac');
  const khung = e('div');
  khung.append(tieuDeTrang('Tương tác', 'Lượt truy cập trang lớp và các hoạt động tương tác khác.'));

  const day = e('div', 'day-so');
  day.append(
    oThongKe(String(d.homNay), 'Lượt truy cập hôm nay'),
    oThongKe(String(d.theoNgay.reduce((a, r) => a + r.luot, 0)), '14 ngày gần đây'),
    oThongKe(String(d.tong), 'Tổng từ trước đến nay')
  );
  khung.append(day);

  const theBieuDo = e('div', 'the');
  theBieuDo.style.marginTop = '16px';
  theBieuDo.append(e('h3', null, 'Lượt truy cập theo ngày (14 ngày gần đây)'));
  if (!d.theoNgay.length) {
    theBieuDo.append(e('p', 'trong', 'Chưa có dữ liệu — số liệu sẽ xuất hiện ngay khi có học sinh mở trang lớp.'));
  } else {
    theBieuDo.append(bieuDoCot(d.theoNgay.map((r) => ({
      nhan: ngayVN(r.ngay).slice(0, 5),
      phan: [{ giaTri: r.luot, mau: 'var(--chinh)', ten: 'Lượt truy cập' }],
    }))));
  }
  khung.append(theBieuDo);

  // Ai truy cập, lúc nào, bao nhiêu lần — suy ra từ mã cá nhân máy đó đã lưu.
  const theAi = e('div', 'the');
  theAi.style.marginTop = '16px';
  theAi.append(e('h3', null, 'Ai đã truy cập'), e('p', 'trong',
    'Chỉ nhận ra em nào nếu máy đó từng tra cứu mã cá nhân — còn lại tính là ẩn danh.'));
  if (!d.theoHocSinh.length && !d.anDanh) {
    theAi.append(e('p', 'trong', 'Chưa có dữ liệu.'));
  } else {
    const boc = e('div', 'cuon-ngang');
    const bang = e('table');
    const dau = e('tr');
    dau.append(e('th', null, 'Học sinh'), e('th', null, 'Số lần'), e('th', null, 'Lần gần nhất'));
    const than = e('tbody');
    than.append(dau);
    d.theoHocSinh.forEach((h) => {
      const tr = e('tr');
      tr.append(e('td', null, h.hoTen), e('td', null, String(h.soLan)), e('td', null, taoLucVN(h.lanCuoi)));
      than.append(tr);
    });
    if (d.anDanh) {
      const tr = e('tr');
      tr.append(e('td', null, 'Ẩn danh (chưa tra cứu mã)'), e('td', null, String(d.anDanh)), e('td', null, '—'));
      than.append(tr);
    }
    bang.append(than);
    boc.append(bang);
    theAi.append(boc);
  }
  khung.append(theAi);

  const luoi = e('div', 'luoi luoi-2');
  luoi.style.marginTop = '16px';
  [['💬 Chat nhóm & chat cá nhân', 'Số tin nhắn, số người tham gia sẽ hiện ở đây khi tính năng chat được bật.'],
   ['🎮 Trò chơi nhẹ', 'Lượt chơi, điểm cao sẽ hiện ở đây khi tính năng trò chơi được bật.']]
    .forEach(([tieuDe, moTa]) => {
      const the = e('div', 'the');
      the.style.opacity = '.7';
      the.append(e('h3', null, tieuDe), e('p', 'trong', moTa + ' (Sắp có)'));
      luoi.append(the);
    });
  khung.append(luoi);

  datNoiDung(KHUNG, khung);
}

async function veChuyenCan(KHUNG) {
  let buoi = '';
  let cheDo = 'ca_nam';

  function layKhoangThoiGian(kieu) {
    const now = new Date();
    const f = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (kieu === 'tuan') {
      const day = now.getDay();
      const diffToMon = day === 0 ? -6 : 1 - day;
      const mon = new Date(now);
      mon.setDate(now.getDate() + diffToMon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return [f(mon), f(sun)];
    }
    if (kieu === 'thang') {
      const d1 = new Date(now.getFullYear(), now.getMonth(), 1);
      const d2 = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return [f(d1), f(d2)];
    }
    if (kieu === 'hk1') {
      return ['2026-09-05', '2027-01-15'];
    }
    if (kieu === 'ca_nam') {
      return ['2026-09-05', '2027-05-31'];
    }
    // Mặc định: 12 tuần gần nhất
    const d2 = new Date();
    const den = f(d2);
    d2.setDate(d2.getDate() - 84);
    const tu = f(d2);
    return [tu, den];
  }

  let [tuNgay, denNgay] = layKhoangThoiGian(cheDo);

  async function ve() {
    const params = new URLSearchParams();
    if (tuNgay) params.set('tuNgay', tuNgay);
    if (denNgay) params.set('denNgay', denNgay);
    if (buoi) params.set('buoi', buoi);

    const d = await api('/api/gv/thong-ke?' + params.toString());
    veNoiDung(d);
  }

  function veNoiDung(d) {
    const khung = e('div');
    const TEN_BUOI_MAP = {
      '': 'Cả sáng lẫn chiều',
      'sang': 'Buổi sáng',
      'chieu': 'Buổi chiều',
      'hoat_dong': 'Hoạt động',
    };

    khung.append(tieuDeTrang('Thống kê chuyên cần',
      `Từ ${ngayVN(d.tuNgay)} đến ${ngayVN(d.denNgay)} · ${TEN_BUOI_MAP[buoi] || 'Cả ngày'}`));

    // Vùng bộ lọc chuyên sâu: Thời gian & Buổi học
    const theBoLoc = e('div', 'the');
    theBoLoc.style.cssText = 'padding:14px 16px;margin-bottom:16px;display:flex;flex-direction:column;gap:12px;';

    // Dòng 1: Chọn nhanh thời gian (Presets)
    const dongNhanh = e('div');
    dongNhanh.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;';
    dongNhanh.append(Object.assign(e('span', 'trong', 'Khoảng thời gian:'), { style: 'font-size:13px;font-weight:600;min-width:110px' }));

    const PRESETS = [
      ['tuan', 'Tuần này'],
      ['thang', 'Tháng này'],
      ['hk1', 'Học kỳ I'],
      ['ca_nam', 'Cả năm học'],
      ['12tuan', '12 tuần qua'],
    ];
    PRESETS.forEach(([kieu, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(cheDo === kieu));
      b.addEventListener('click', () => {
        cheDo = kieu;
        [tuNgay, denNgay] = layKhoangThoiGian(kieu);
        ve();
      });
      dongNhanh.append(b);
    });
    theBoLoc.append(dongNhanh);

    // Dòng 2: Chọn ngày cụ thể (Custom Date Range)
    const dongNgayTuyChon = e('div');
    dongNgayTuyChon.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;';
    dongNgayTuyChon.append(Object.assign(e('span', 'trong', 'Từ ngày đến ngày:'), { style: 'font-size:13px;font-weight:600;min-width:110px' }));

    const inpTu = oNhap('tkTuNgay', 'date', d.tuNgay);
    inpTu.style.cssText = 'max-width:160px;padding:5px 10px;font-size:13px;';

    const inpDen = oNhap('tkDenNgay', 'date', d.denNgay);
    inpDen.style.cssText = 'max-width:160px;padding:5px 10px;font-size:13px;';

    const nutApDung = nut('Áp dụng ngày', 'nut-chinh nut-nho', () => {
      if (!inpTu.value || !inpDen.value) return nhac('Vui lòng chọn đủ từ ngày và đến ngày', 'xau');
      if (inpTu.value > inpDen.value) return nhac('Từ ngày không được lớn hơn đến ngày', 'xau');
      cheDo = 'tuy_chon';
      tuNgay = inpTu.value;
      denNgay = inpDen.value;
      ve();
    });

    dongNgayTuyChon.append(inpTu, document.createTextNode('→'), inpDen, nutApDung);
    theBoLoc.append(dongNgayTuyChon);

    // Dòng 3: Chọn buổi học (Sáng / Chiều / Cả sáng chiều)
    const dongBuoi = e('div');
    dongBuoi.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:8px;border-top:1px dashed var(--vien)';
    dongBuoi.append(Object.assign(e('span', 'trong', 'Buổi học:'), { style: 'font-size:13px;font-weight:600;min-width:110px' }));

    const CAC_BUOI = [
      ['', 'Cả sáng lẫn chiều'],
      ['sang', 'Chỉ buổi sáng'],
      ['chieu', 'Chỉ buổi chiều'],
      ['hoat_dong', 'Chỉ hoạt động'],
    ];
    CAC_BUOI.forEach(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(buoi === ma));
      b.addEventListener('click', () => { buoi = ma; ve(); });
      dongBuoi.append(b);
    });
    theBoLoc.append(dongBuoi);

    khung.append(theBoLoc);

    const t = d.tongTheoMuc;
    const tong = Object.values(t).reduce((a, b) => a + b, 0) || 1;
    const day = e('div', 'day-so');
    day.append(
      oThongKe(Math.round(((t.co_mat || 0) / tong) * 100) + '%', 'Tỉ lệ chuyên cần', 'tot'),
      oThongKe(String(t.vang_khong_phep || 0), 'Lượt vắng không phép', 'xau'),
      oThongKe(String(t.vang_phep || 0), 'Lượt vắng có phép', 'thu'),
      oThongKe(String(t.tre || 0), 'Lượt đi trễ', 'luuy')
    );
    khung.append(day);

  // Biểu đồ theo tuần
  const theBd = e('div', 'the');
  theBd.append(e('h3', null, 'Diễn biến theo tuần'));
  if (!d.theoTuan.length) {
    theBd.append(e('p', 'trong', 'Chưa có dữ liệu điểm danh trong khoảng thời gian này.'));
  } else {
    theBd.append(bieuDoCot(d.theoTuan.map((w) => ({
      nhan: ngayVN(w.dauTuan).slice(0, 5),
      phan: [
        { giaTri: w.coMat, mau: MAU.coMat, ten: 'Có mặt' },
        { giaTri: w.tre, mau: MAU.tre, ten: 'Đi trễ' },
        { giaTri: w.vangPhep, mau: MAU.vangPhep, ten: 'Vắng có phép' },
        { giaTri: w.vangKhongPhep, mau: MAU.vangKhongPhep, ten: 'Vắng không phép' },
      ],
    }))));
    theBd.append(chuThichMau([
      ['Có mặt', MAU.coMat], ['Đi trễ', MAU.tre],
      ['Vắng có phép', MAU.vangPhep], ['Vắng không phép', MAU.vangKhongPhep],
    ]));
  }
  khung.append(theBd);

  // Cảnh báo
  const theCb = e('div', 'the');
  theCb.style.marginTop = '14px';
  theCb.append(e('h3', null, `Cần lưu ý (${d.canhBao.length} em)`));
  if (!d.canhBao.length) {
    theCb.append(e('p', 'trong', 'Không có em nào đáng lo. Rất tốt.'));
  } else {
    const ds = e('div', 'ds-diem-danh');
    const TEN_MUC = { cao: ['Nguy cơ cao', 'nhan-xau'], vua: ['Cần theo dõi', 'nhan-luuy'], nhe: ['Nhắc nhở', 'nhan'] };
    d.canhBao.forEach((h) => {
      const hang = e('div', 'hang-hs');
      hang.style.cursor = 'pointer';
      const ten = e('div', 'ten');
      ten.append(e('b', null, h.hoTen));
      const chiTiet = [];
      if (h.vangKhongPhep) chiTiet.push(`${h.vangKhongPhep} buổi không phép`);
      if (h.vangPhep) chiTiet.push(`${h.vangPhep} có phép`);
      if (h.tre) chiTiet.push(`${h.tre} lần trễ`);
      if (h.tiLeChuyenCan !== null) chiTiet.push(`chuyên cần ${h.tiLeChuyenCan}%`);
      ten.append(e('small', null, chiTiet.join(' · ')));
      hang.append(e('div', 'stt', h.id), ten);

      const phai = e('div', 'canh-phai');
      const [tenMuc, lop] = TEN_MUC[h.mucCanhBao];
      phai.append(e('span', 'nhan ' + lop, tenMuc));
      if (h.hoanCanh) phai.append(e('span', 'nhan nhan-luuy', h.hoanCanh));
      hang.append(phai);
      hang.addEventListener('click', () => { location.hash = '#/hoc-sinh/' + h.id; });
      ds.append(hang);
    });
    theCb.append(ds);
    theCb.append(Object.assign(
      e('p', 'trong', 'Nguy cơ cao: từ 10 buổi vắng không phép. Cần theo dõi: từ 5 buổi không phép hoặc 10 buổi vắng nói chung.'),
      { style: 'margin-top:10px' }
    ));
  }
  khung.append(theCb);

  // Bảng đầy đủ
  const theBang = e('div', 'the');
  theBang.style.marginTop = '14px';
  theBang.append(e('h3', null, 'Chuyên cần từng em'));
  const boc = e('div', 'cuon-ngang');
  const bang = e('table');
  const dau = e('thead');
  const hd = e('tr');
  ['STT', 'Họ và tên', 'Tổng buổi', 'Có mặt', 'Trễ', 'Vắng phép', 'Không phép', 'Tỉ lệ'].forEach((c, i) => {
    hd.append(e('th', i === 0 ? 'so' : null, c));
  });
  dau.append(hd);
  const than = e('tbody');
  d.theoHocSinh.forEach((h) => {
    const tr = e('tr');
    const tiLe = h.tongBuoi ? Math.round((h.coMat / h.tongBuoi) * 100) : null;
    tr.append(
      e('td', 'so', h.id), e('td', null, h.hoTen), e('td', null, h.tongBuoi),
      e('td', null, h.coMat), e('td', null, h.tre), e('td', null, h.vangPhep)
    );
    const tdKp = e('td', null, h.vangKhongPhep);
    if (h.vangKhongPhep > 0) tdKp.style.color = 'var(--xau)';
    tr.append(tdKp, e('td', null, tiLe === null ? '—' : tiLe + '%'));
    than.append(tr);
  });
  bang.append(dau, than);
  boc.append(bang);
  theBang.append(boc);
  khung.append(theBang);

  datNoiDung(KHUNG, khung);
  }

  await ve();
}

/* ================= Báo cáo ================= */

export async function trangBaoCao(KHUNG) {
  const khung = e('div');
  khung.append(tieuDeTrang('Báo cáo & xuất dữ liệu',
    'Tải về tệp CSV, mở trực tiếp bằng Excel để in hoặc nộp trường.'));

  const nay = homNay();
  const truoc30 = (() => {
    const d = new Date(nay + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  const oTu = oNhap('bcTu', 'date', truoc30);
  const oDen = oNhap('bcDen', 'date', nay);
  const oHk = oChon('bcHk', [[1, 'Học kì 1'], [2, 'Học kì 2']], sessionStorage.getItem('sd-hocki') || 1);

  const theLoc = e('div', 'the');
  const hang = e('div', 'hang-nhap hang-nhap-2');
  hang.append(truong('Từ ngày', oTu), truong('Đến ngày', oDen));
  theLoc.append(hang, truong('Học kì (dùng cho sổ điểm)', oHk));
  khung.append(theLoc);

  const CAC_BAO_CAO = [
    ['danh-sach', 'Danh sách lớp', 'Đầy đủ họ tên, ngày sinh, lớp nghề, chức vụ, SĐT phụ huynh.', false],
    ['chuyen-can', 'Báo cáo chuyên cần', 'Số buổi có mặt, trễ, vắng và tỉ lệ chuyên cần từng em.', true],
    ['so-diem', 'Sổ điểm', 'ĐTB từng môn, TB chung, xếp loại học lực và rèn luyện.', false],
    ['nhat-ky', 'Sổ nhật ký chủ nhiệm', 'Khen thưởng, nhắc nhở, vi phạm theo khoảng thời gian.', true],
    ['tong-hop', 'Báo cáo tổng hợp', 'Gộp chuyên cần, vi phạm, khen thưởng, sách, đồng phục.', false],
  ];

  const luoi = e('div', 'luoi luoi-2');
  luoi.style.marginTop = '16px';
  CAC_BAO_CAO.forEach(([ma, ten, moTa, theoNgay]) => {
    const the = e('div', 'the');
    the.append(e('h3', null, ten), e('p', 'trong', moTa));
    the.append(nut('⬇ Tải về (.csv)', 'nut-vien nut-nho', () => {
      const p = new URLSearchParams({ loai: ma });
      if (theoNgay) { p.set('tuNgay', oTu.value); p.set('denNgay', oDen.value); }
      if (ma === 'so-diem') p.set('hocKi', oHk.value);
      location.href = '/api/gv/bao-cao?' + p.toString();
    }));
    luoi.append(the);
  });
  khung.append(luoi);

  const goiY = e('div', 'the');
  goiY.style.marginTop = '16px';
  goiY.append(
    e('h3', null, 'Mẹo khi mở bằng Excel'),
    e('p', null, 'Tệp đã có sẵn dấu nhận diện tiếng Việt nên mở lên là đọc được ngay, không bị lỗi font. '
      + 'Cột được ngăn bằng dấu chấm phẩy — đúng chuẩn Excel bản tiếng Việt. '
      + 'Muốn in thì mở trong Excel rồi bấm In như bình thường.')
  );
  khung.append(goiY);

  datNoiDung(KHUNG, khung);
}

/* ================= Mã cá nhân của học sinh ================= */

export async function trangMaCaNhan(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const [d, dangNhap] = await Promise.all([
      api('/api/gv/ma-ca-nhan'),
      api('/api/gv/ma-dang-nhap'),
    ]);
    const chuaCo = d.danhSach.filter((h) => !h.ma).length;

    const khung = e('div');
    khung.append(tieuDeTrang('Mã đăng nhập & phân quyền',
      'Hai phần rõ ràng: mã dùng chung/tài khoản ngoài lớp (Phần 1), và mã + quyền của từng học sinh (Phần 2).'));

    /* ================= PHẦN 1 — không thuộc một học sinh cụ thể ================= */
    const dau1 = e('div', 'tieu-de-trang');
    dau1.style.marginTop = '10px';
    dau1.append(e('h2', null, '1️⃣ Mã đăng nhập chung & tài khoản ngoài lớp'));
    khung.append(dau1);

    khung.append(veTheMaDangNhap(dangNhap, ve));

    const dauTkPhu = e('div', 'tieu-de-trang');
    dauTkPhu.style.marginTop = '16px';
    dauTkPhu.append(e('h3', null, 'Tài khoản khác (không phải học sinh trong lớp)'),
      e('p', null, 'Dùng khi cần cấp quyền cho người KHÔNG có trong danh sách học sinh — ví dụ quản trị viên, người hỗ trợ ngoài lớp.'));
    khung.append(dauTkPhu);
    const khoiTkPhu = e('div');
    khoiTkPhu.style.marginTop = '10px';
    khung.append(khoiTkPhu);
    veKhoiTaiKhoanPhu(khoiTkPhu);

    /* ================= PHẦN 2 — học sinh: mã + quyền + chức vụ trong MỘT chỗ ================= */
    const dau2 = e('div', 'tieu-de-trang');
    dau2.style.marginTop = '28px';
    dau2.append(e('h2', null, '2️⃣ Học sinh'),
      e('p', null, 'Mỗi em một mã riêng. Bấm "⚙ Quản lý" để sửa chức vụ, mã, quyền xem và quyền quản lý — tất cả trong một chỗ.'));
    khung.append(dau2);

    const canQuanLy = d.danhSach.filter((h) => (h.quyen || []).length);
    if (canQuanLy.length) {
      const dauCanBo = e('div', 'tieu-de-trang');
      dauCanBo.style.marginTop = '14px';
      dauCanBo.append(e('h3', null, '🔑 Đang có quyền quản lý'));
      khung.append(dauCanBo);
      const dsQuanLy = e('div', 'ds-the');
      canQuanLy.forEach((h) => dsQuanLy.append(veTheQuanLy(h, ve)));
      khung.append(dsQuanLy);
    }

    const the = e('div', 'the');
    the.style.marginTop = '16px';
    const hangNut = e('div', 'day-loc');
    hangNut.append(
      nut(chuaCo ? `Cấp mã cho ${chuaCo} em chưa có` : 'Mọi em đều đã có mã', '', async (ev) => {
        if (!chuaCo) return;
        ev.currentTarget.disabled = true;
        try {
          const kq = await api('/api/gv/ma-ca-nhan', { method: 'POST', than: { tatCa: true } });
          nhac(`Đã cấp ${kq.daCap} mã`, 'tot');
          ve();
        } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
      }),
      nut('🖨 In danh sách mã', 'nut-vien', () => inDanhSachMa(d.danhSach)),
      nut('📜 Nhật ký đăng nhập', 'nut-vien', () => { location.hash = '#/nhat-ky-dang-nhap'; })
    );
    the.append(hangNut);
    khung.append(the);

    const boc = e('div', 'cuon-ngang');
    boc.style.marginTop = '16px';
    const bang = e('table');
    const dau = e('thead');
    const hd = e('tr');
    hd.append(e('th', 'so', 'STT'), e('th', null, 'Họ và tên'), e('th', null, 'Chức vụ'), e('th', null, 'Mã cá nhân'), e('th', null, 'Quyền'), e('th', null, ''));
    dau.append(hd);

    const than = e('tbody');
    d.danhSach.forEach((h) => {
      const tr = e('tr');
      const tdMa = e('td');
      if (h.ma) {
        const ma = e('code', null, h.ma);
        ma.style.cssText = 'font-size:15px;letter-spacing:1px;font-weight:700';
        tdMa.append(ma);
      } else {
        tdMa.append(e('span', 'trong', 'Chưa cấp'));
      }

      const tdTen = e('td');
      tdTen.style.fontWeight = '600';
      tdTen.append(h.hoTen);

      const tdChucVu = e('td');
      if (h.chucVu) {
        const info = layThongTinVaiTro(h.chucVu);
        tdChucVu.append(Object.assign(e('span', 'nhan', `${info.bieuTuong} ${h.chucVu}`), {
          style: `background:${info.mauNen};border-color:${info.mauVien};color:${info.mauChu};font-weight:700;font-size:11.5px;padding:2px 8px;border-radius:6px;`
        }));
      } else {
        tdChucVu.append(e('span', 'trong', '—'));
      }

      const tdQuyen = e('td');
      if (h.ma) {
        tdQuyen.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';
        // Quyền XEM và quyền QUẢN LÝ là hai chuyện độc lập — một em có thể vừa bị ẩn bớt mục
        // VỪA được cấp quyền quản lý cùng lúc, nên hiện CẢ HAI nhãn thay vì chỉ một.
        const soAn = (h.anMuc || []).length;
        const soQuanLy = (h.quyen || []).length;
        tdQuyen.append(e('span', 'nhan ' + (soAn ? 'nhan-luuy' : 'nhan-tot'),
          soAn ? `🔒 Đã ẩn ${soAn} mục` : '👁 Xem hết'));
        if (soQuanLy) tdQuyen.append(e('span', 'nhan nhan-tim', `🔑 Quản lý ${soQuanLy} mục`));
      } else {
        tdQuyen.append(e('span', 'trong', '—'));
      }

      const tdNut = e('td');
      tdNut.append(nut('⚙ Quản lý', 'nut-vien nut-nho', () => moQuanLyHocSinh(h, ve)));

      tr.append(e('td', 'so', h.id), tdTen, tdChucVu, tdMa, tdQuyen, tdNut);
      than.append(tr);
    });
    bang.append(dau, than);
    boc.append(bang);
    khung.append(boc);

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

/* ---------- Nhật ký đăng nhập: chỉ đọc, không có nút xoá ---------- */
export async function trangNhatKyDangNhap(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());
  const d = await api('/api/gv/nhat-ky-dang-nhap');
  const khung = e('div');
  khung.append(nut('← Về Mã cá nhân', 'nut-nhe nut-nho', () => { location.hash = '#/ma-ca-nhan'; }));
  khung.append(tieuDeTrang('Nhật ký đăng nhập',
    'Chỉ ghi các lượt đăng nhập bằng mã ĐƯỢC CẤP quyền quản lý — không xoá được, để còn dò lại nếu một mã bị chiếm quyền.'));

  if (!d.danhSach.length) {
    khung.append(e('p', 'trong', 'Chưa có lượt đăng nhập nào.'));
  } else {
    const boc = e('div', 'cuon-ngang');
    boc.style.marginTop = '14px';
    const bang = e('table');
    const dau = e('tr');
    dau.append(e('th', null, 'Thời điểm'), e('th', null, 'Học sinh'), e('th', null, 'Mã'), e('th', null, 'Kết quả'), e('th', null, 'IP'));
    const than = e('tbody');
    than.append(dau);
    const KET_QUA_NHAN = { thanh_cong: ['nhan-tot', 'Thành công'], sai_thiet_bi: ['nhan-xau', 'Sai thiết bị'], khoa: ['nhan-xau', 'Bị khoá'] };
    d.danhSach.forEach((n) => {
      const tr = e('tr');
      const [lop, chu] = KET_QUA_NHAN[n.ketQua] || ['nhan-xam', n.ketQua];
      tr.append(
        e('td', null, taoLucVN(n.thoiDiem)),
        e('td', null, n.hoTen || '—'),
        e('td', null, n.ma),
        Object.assign(e('td'), {}),
        e('td', null, n.ip || '—')
      );
      tr.children[3].append(e('span', 'nhan ' + lop, chu));
      than.append(tr);
    });
    bang.append(than);
    boc.append(bang);
    khung.append(boc);
  }

  datNoiDung(KHUNG, khung);
}

/* ---------- Mã đăng nhập chung: mã lớp (học sinh) và mã giáo viên ---------- */

function veTheMaDangNhap(dangNhap, taiLai) {
  const the = e('div', 'the');
  the.style.borderColor = 'var(--chinh)';
  the.append(
    e('h3', null, 'Mã đăng nhập'),
    e('p', 'trong', 'Mã riêng của giáo viên chủ nhiệm. Học sinh không dùng mã chung nữa — mỗi em vào trang lớp bằng đúng mã cá nhân của mình (xem Phần 2 bên dưới). Đổi ở đây có hiệu lực ngay, không cần vào Cloudflare.')
  );

  const luoi = e('div', 'luoi luoi-2');
  luoi.style.marginTop = '10px';

  [['teacher', '👩‍🏫 Mã giáo viên chủ nhiệm', dangNhap.teacher]]
    .forEach(([vaiTro, nhan, tt]) => {
      const o = e('div');
      o.style.cssText = 'background:var(--nen-chim);border-radius:var(--r-nho);padding:12px';
      o.append(e('div', 'the-nhan', nhan));
      const dongMa = e('div');
      dongMa.style.cssText = 'display:flex;align-items:center;gap:8px;margin:6px 0';
      const maChu = e('code', null, tt.ma || '—');
      maChu.style.cssText = 'font-size:17px;font-weight:800;letter-spacing:1px';
      dongMa.append(maChu);
      if (!tt.daTuDat) dongMa.append(e('span', 'nhan nhan-xam', 'Mặc định'));
      o.append(dongMa);
      o.append(nut('✎ Đổi mã này', 'nut-vien nut-nho', () => datMaDangNhap(vaiTro, nhan, taiLai)));
      luoi.append(o);
    });

  the.append(luoi);
  return the;
}

function datMaDangNhap(vaiTro, nhan, taiLai) {
  // Không ép chữ hoa ở đây — mã này giữ đúng hoa/thường thầy/cô gõ, vì đăng nhập
  // phân biệt hoa/thường.
  const oMa = oNhap('dnMa', 'text', '', 'Để trống để máy tự sinh mã ngẫu nhiên');

  moHopThoai(`Đổi mã — ${nhan}`, [
    truong('Mã mới (tuỳ chọn)', oMa, 'Chữ hoa, chữ thường, số, ký tự đặc biệt — 3 đến 32 ký tự, không chứa khoảng trắng. Phân biệt HOA/thường. Để trống thì máy tự sinh mã ngẫu nhiên dễ đọc.'),
    Object.assign(e('p', 'trong', '⚠ Đổi xong, mọi thiết bị đang đăng nhập bằng mã cũ vẫn dùng được tới khi hết hạn phiên (7 ngày) — nhưng mã cũ sẽ không đăng nhập MỚI được nữa.'), { style: 'margin-top:10px' }),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Đổi mã', 'nut-xau', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        const kq = await api('/api/gv/ma-dang-nhap', { method: 'POST', than: { vaiTro, ma: oMa.value.trim() || undefined } });
        dongHopThoai();
        nhac('Mã mới: ' + kq.ma, 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

/* ---------- Quyền theo mã cá nhân — GỘP một chỗ: quyền XEM (ẩn bớt mục trên trang lớp) và
   quyền QUẢN LÝ (soạn thông báo, thủ quỹ...) — không cần tạo tài khoản phụ riêng nữa.
   Có quyền quản lý thì mã đó dùng được ở trang đăng nhập /login.html, và bị RÀNG BUỘC
   1 mã = 1 thiết bị (giáo viên có thể "Đặt lại thiết bị" nếu em đổi máy). ---------- */
const CAC_MUC_XEM = [
  ['quy', 'Tiền quỹ'],
  ['thong-bao', 'Thông báo'],
  ['thoi-khoa-bieu', 'Thời khoá biểu'],
  ['diem-danh', 'Điểm danh / chuyên cần'],
  ['thong-ke', 'Sổ điểm / thống kê học tập'],
];
// Trùng danh mục CAC_QUYEN ở functions/api/gv/tai-khoan-phu.js — chép tay vì đây là mã
// chạy trên trình duyệt, không import trực tiếp từ functions/ được.
const CAC_QUYEN_QUAN_LY = [
  ['quy', 'Thủ quỹ — ghi thu, ghi chi, tạo khoản thu'],
  ['thong-bao', 'Thông báo — soạn và đăng thông báo'],
  ['nhat-ky', 'Nhật ký lớp — ghi khen thưởng, nhắc nhở, vi phạm'],
  ['diem-danh', 'Điểm danh — điểm danh hằng ngày'],
  ['hinh-anh', 'Ảnh hoạt động — đăng ảnh của lớp'],
  ['ke-hoach', 'Kế hoạch — thêm/sửa mốc sự kiện, lịch kiểm tra'],
];
const ICON_QUYEN = { quy: '🪙', 'thong-bao': '📢', 'nhat-ky': '📖', 'diem-danh': '✅', 'hinh-anh': '📸', 'ke-hoach': '📅' };

/* ---------- Thẻ tài khoản quản lý (mã cá nhân được cấp quyen) — cùng kiểu với thẻ tài
   khoản phụ cũ (avatar theo chức vụ, nhãn quyền, mã đăng nhập, hành động), để giáo viên
   thấy quyền của em ngay, không phải mở popup mới biết. ---------- */
function veTheQuanLy(h, taiLai) {
  const the = e('div', 'the the-tk-phu');
  const info = layThongTinVaiTro(h.chucVu || '');

  const dau2 = e('div', 'the-tk-dau');
  dau2.style.cssText = 'display:flex;align-items:center;gap:14px;justify-content:space-between;flex-wrap:wrap';

  const khoiTrai = e('div');
  khoiTrai.style.cssText = 'display:flex;align-items:center;gap:12px;min-width:0';

  const avatar = e('div', 'the-tk-avatar');
  avatar.style.cssText = `width:46px;height:46px;border-radius:13px;display:grid;place-items:center;font-size:22px;background:${info.mauNen};border:1.5px solid ${info.mauVien};box-shadow:0 4px 14px -3px ${info.mauVien};flex:none;`;
  avatar.textContent = info.bieuTuong;

  const thongTin = e('div');
  thongTin.style.cssText = 'min-width:0;display:flex;flex-direction:column;gap:3px';

  const dongTen = e('div');
  dongTen.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap';
  dongTen.append(
    Object.assign(e('h3', null, h.hoTen), { style: 'margin:0;font-size:16.5px;font-weight:700;' }),
    Object.assign(e('span', 'nhan', `${info.bieuTuong} ${h.chucVu ? info.tenGoi : 'Chưa đặt chức vụ'}`), {
      style: `background:${info.mauNen};border-color:${info.mauVien};color:${info.mauChu};font-weight:700;font-size:12px;padding:2px 9px;border-radius:6px;`
    })
  );
  if (!h.chucVu) {
    dongTen.append(Object.assign(e('small', 'trong', '(bấm "✏ Sửa" bên dưới để đặt chức vụ)'), { style: 'font-size:11.5px' }));
  }
  thongTin.append(dongTen);
  khoiTrai.append(avatar, thongTin);
  dau2.append(khoiTrai);
  the.append(dau2);

  const oQuyen = e('div', 'day-loc');
  oQuyen.style.cssText = 'margin-top:12px;gap:6px;flex-wrap:wrap;';
  h.quyen.forEach((q) => {
    const ten = (CAC_QUYEN_QUAN_LY.find((x) => x[0] === q) || [q, q])[1].split(' — ')[0];
    const chip = e('span', 'nhan nhan-tim');
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:5px;font-size:12.5px;padding:3px 10px;font-weight:600;border-radius:8px;';
    chip.append(e('span', null, ICON_QUYEN[q] || '⭐'), document.createTextNode(ten));
    oQuyen.append(chip);
  });
  the.append(oQuyen);

  const maHop = e('p');
  maHop.style.cssText = 'margin-top:12px;font-size:14px;color:var(--chu-nhat);display:flex;align-items:center;gap:8px;flex-wrap:wrap;';
  const maChu = e('code', null, h.ma);
  maChu.style.cssText = 'font-size:16px;font-weight:800;letter-spacing:1.5px;padding:3px 8px;border-radius:6px;color:var(--chinh);background:var(--nen-chim);border:1px solid var(--vien);';
  maHop.append(document.createTextNode('Mã đăng nhập: '), maChu);
  if (h.coThietBi) maHop.append(e('span', 'nhan nhan-xam', '🔒 Đã gắn thiết bị'));
  the.append(maHop);

  const nutHang = e('div', 'day-loc');
  nutHang.style.cssText = 'margin-top:12px;gap:8px;flex-wrap:wrap;';
  nutHang.append(
    nut('✏ Sửa', 'nut-vien nut-nho', () => moQuanLyHocSinh(h, taiLai))
  );
  if (h.coThietBi) nutHang.append(nut('📱 Đặt lại thiết bị', 'nut-nhe nut-nho', () => datLaiThietBi(h, taiLai)));
  nutHang.append(nut('🚫 Gỡ quyền quản lý', 'nut-nhe nut-nho', () => {
    moHopThoai('Gỡ quyền quản lý?', e('p', null, `${h.hoTen} sẽ không đăng nhập được vào khu quản lý nữa — mã vẫn dùng để tra cứu kết quả cá nhân như bình thường.`), [
      nut('Huỷ', 'nut-nhe', dongHopThoai),
      nut('Gỡ quyền', 'nut-xau', async () => {
        try {
          await api('/api/gv/ma-ca-nhan', { method: 'PATCH', than: { hocSinhId: h.id, quyen: [] } });
          dongHopThoai();
          nhac('Đã gỡ quyền quản lý của ' + h.hoTen, 'tot');
          taiLai();
        } catch (err) { nhac(err.message, 'xau'); }
      }),
    ]);
  }));
  the.append(nutHang);

  return the;
}

function taoNhomTich(danhMuc, daChon) {
  const bo = new Set(daChon);
  return danhMuc.map(([ma, nhan]) => {
    const o = e('input');
    o.type = 'checkbox';
    o.checked = bo.has(ma);
    const nhanO = e('label');
    nhanO.style.cssText = 'display:flex;gap:9px;align-items:flex-start;font-size:14px;font-weight:600;padding:6px 0';
    nhanO.append(o, document.createTextNode(nhan));
    return [ma, o, nhanO];
  });
}

/* ---------- MỘT hộp thoại duy nhất cho một học sinh: họ tên, chức vụ, mã cá nhân, quyền
   xem, quyền quản lý — gộp hết mọi thứ trước đây nằm rải rác ở 4-5 nút khác nhau. Bấm
   "⚙ Quản lý" ở bảng học sinh (hoặc thẻ "Đang có quyền quản lý") là mở đúng hộp này. ---------- */
const CAC_CHUC_VU_GOI_Y = [
  ['👑 Lớp trưởng', 'Lớp trưởng'],
  ['🪙 Thủ quỹ', 'Thủ quỹ'],
  ['⚡ Bí thư', 'Bí thư'],
  ['📋 Tổ trưởng', 'Tổ trưởng'],
];

function moQuanLyHocSinh(hocSinh, taiLai) {
  const oHoTen = oNhap('qlHoTen', 'text', hocSinh.hoTen, 'Họ và tên đầy đủ');
  const oChucVu = oNhap('qlChucVu', 'text', hocSinh.chucVu || '', 'Ví dụ: Lớp trưởng, Thủ quỹ, Tổ trưởng… (để trống nếu không giữ chức vụ gì)');

  const dayGoiY = e('div', 'day-loc');
  dayGoiY.style.cssText = 'margin-top:6px;gap:6px;flex-wrap:wrap;display:flex;align-items:center';
  dayGoiY.append(Object.assign(e('span', 'trong', 'Chọn nhanh:'), { style: 'font-size:12px;color:var(--chu-nhat)' }));
  CAC_CHUC_VU_GOI_Y.forEach(([nhan, val]) => {
    const b = e('button', 'nut-nhe nut-nho', nhan);
    b.type = 'button';
    b.style.cssText = 'font-size:12px;padding:2px 8px;border-radius:6px;cursor:pointer;';
    b.addEventListener('click', () => { oChucVu.value = val; });
    dayGoiY.append(b);
  });

  const oMa = oNhap('qlMa', 'text', hocSinh.ma || '', 'Để trống = giữ nguyên mã hiện tại');

  const anMuc = new Set(hocSinh.anMuc || []);
  const oTichXem = CAC_MUC_XEM.map(([ma, nhan]) => {
    const o = e('input');
    o.type = 'checkbox';
    o.checked = !anMuc.has(ma);
    const nhanO = e('label');
    nhanO.style.cssText = 'display:flex;gap:9px;align-items:flex-start;font-size:14px;font-weight:600;padding:6px 0';
    nhanO.append(o, document.createTextNode(nhan));
    return [ma, o, nhanO];
  });
  const oTichQuanLy = taoNhomTich(CAC_QUYEN_QUAN_LY, hocSinh.quyen || []);

  const noi = [
    e('h3', null, '👤 Thông tin'),
    truong('Họ và tên', oHoTen),
    truong('Chức vụ', oChucVu),
    dayGoiY,

    Object.assign(e('h3', null, '🔢 Mã cá nhân'), { style: 'margin-top:18px' }),
    hocSinh.ma
      ? truong('Mã (sửa để đổi mã tuỳ chỉnh)', oMa)
      : truong('Đặt mã (bỏ trống thì bấm "Cấp mã ngẫu nhiên" bên dưới)', oMa),
    nut('🎲 Cấp mã ngẫu nhiên mới ngay', 'nut-nhe nut-nho', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        const kq = await api('/api/gv/ma-ca-nhan', { method: 'POST', than: { hocSinhId: hocSinh.id } });
        nhac('Đã cấp mã mới: ' + kq.ketQua[0].ma, 'tot');
        dongHopThoai();
        taiLai();
      } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
    }),
    hocSinh.coThietBi
      ? Object.assign(e('p', 'trong', '🔒 Mã này đã gắn với một thiết bị.'), { style: 'margin-top:8px' })
      : null,
    hocSinh.coThietBi
      ? nut('📱 Đặt lại thiết bị (cho đăng nhập máy mới)', 'nut-nhe nut-nho', () => datLaiThietBi(hocSinh, taiLai))
      : null,

    Object.assign(e('h3', null, '👁 Quyền xem trên trang lớp'), { style: 'margin-top:18px' }),
    e('p', 'trong', 'Bỏ tích mục nào thì em KHÔNG thấy mục đó nữa (mặc định xem hết).'),
    ...oTichXem.map(([, , nhanO]) => nhanO),

    Object.assign(e('h3', null, '🔑 Quyền quản lý (đăng nhập được ở /login.html)'), { style: 'margin-top:18px' }),
    e('p', 'trong', 'Tích mục nào thì mã này đăng nhập được vào khu quản lý, chỉ thấy đúng mục đó. Để trống hết = chỉ xem, không quản lý gì.'),
    ...oTichQuanLy.map(([, , nhanO]) => nhanO),
  ].filter(Boolean);

  moHopThoai(`Quản lý — ${hocSinh.hoTen}`, noi, [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Lưu tất cả', '', async (ev) => {
      const tenMoi = oHoTen.value.trim();
      if (!tenMoi) return nhac('Họ tên không được để trống', 'xau');
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/hoc-sinh', { method: 'PATCH', than: { id: hocSinh.id, hoTen: tenMoi, chucVu: oChucVu.value.trim() } });

        const maMoi = oMa.value.trim();
        if (maMoi && maMoi !== hocSinh.ma) {
          await api('/api/gv/ma-ca-nhan', { method: 'POST', than: { hocSinhId: hocSinh.id, maTuyChinh: maMoi } });
        }

        const anMucMoi = oTichXem.filter(([, o]) => !o.checked).map(([ma]) => ma);
        const quyenMoi = oTichQuanLy.filter(([, o]) => o.checked).map(([ma]) => ma);
        await api('/api/gv/ma-ca-nhan', { method: 'PATCH', than: { hocSinhId: hocSinh.id, anMuc: anMucMoi, quyen: quyenMoi } });

        dongHopThoai();
        nhac('Đã lưu thông tin của ' + tenMoi, 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

function datLaiThietBi(hocSinh, taiLai) {
  moHopThoai('Đặt lại thiết bị?', [
    e('p', null, `Mã của ${hocSinh.hoTen} sẽ đăng nhập được ở một máy MỚI (máy cũ không tự mất quyền, chỉ là không còn bị ràng buộc riêng máy đó nữa cho tới lần đăng nhập kế tiếp).`),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Đặt lại', 'nut-xau', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/ma-ca-nhan', { method: 'PATCH', than: { hocSinhId: hocSinh.id, datLaiThietBi: true } });
        dongHopThoai();
        nhac('Đã đặt lại thiết bị cho ' + hocSinh.hoTen, 'tot');
        taiLai();
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

/** Mở cửa sổ in danh sách mã, cắt rời phát cho từng em. */
function inDanhSachMa(danhSach) {
  const cua = window.open('', '_blank');
  if (!cua) return nhac('Trình duyệt đã chặn cửa sổ in. Hãy cho phép rồi thử lại.', 'xau');

  const the = danhSach.filter((h) => h.ma).map((h) => `
    <div class="phieu">
      <div class="ten">${thoat(h.hoTen)}</div>
      <div class="nhan">Mã cá nhân của em</div>
      <div class="ma">${thoat(h.ma)}</div>
      <div class="chan">lop-10a7.pages.dev &middot; Xem kết quả của tôi</div>
    </div>`).join('');

  cua.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8">
    <title>Mã cá nhân lớp 10A7</title><style>
      *{box-sizing:border-box}
      body{font:14px "Segoe UI",system-ui,sans-serif;margin:14mm;color:#111}
      h1{font-size:17px;margin:0 0 3mm}
      p.dan{font-size:12px;color:#555;margin:0 0 6mm}
      .luoi{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm}
      .phieu{border:1px dashed #999;border-radius:3mm;padding:5mm;text-align:center;page-break-inside:avoid}
      .ten{font-weight:700;font-size:13px;margin-bottom:2mm}
      .nhan{font-size:10px;color:#666}
      .ma{font-size:22px;font-weight:800;letter-spacing:3px;margin:2mm 0;font-family:Consolas,monospace}
      .chan{font-size:9px;color:#888}
      @media print{body{margin:8mm}}
    </style></head><body>
      <h1>MÃ CÁ NHÂN HỌC SINH LỚP 10A7 — NĂM HỌC 2026-2027</h1>
      <p class="dan">Cắt rời và phát cho từng em. Nhắc các em không đưa mã cho bạn khác.</p>
      <div class="luoi">${the}</div>
    </body></html>`);
  cua.document.close();
  cua.focus();
  setTimeout(() => cua.print(), 400);
}

function thoat(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ================= Ảnh hoạt động ================= */

const RONG_TOI_DA = 1600;   // thu nhỏ cạnh dài nhất về 1600 điểm ảnh
const CHAT_LUONG = 0.82;

/** Nén ảnh ngay trên máy giáo viên: ảnh 5 MB từ điện thoại còn khoảng 200 KB. */
async function nenAnh(tep) {
  const anh = await createImageBitmap(tep);
  const tiLe = Math.min(1, RONG_TOI_DA / Math.max(anh.width, anh.height));
  const w = Math.round(anh.width * tiLe);
  const h = Math.round(anh.height * tiLe);

  const khung = document.createElement('canvas');
  khung.width = w;
  khung.height = h;
  khung.getContext('2d').drawImage(anh, 0, 0, w, h);
  anh.close();

  const blob = await new Promise((giai) => khung.toBlob(giai, 'image/jpeg', CHAT_LUONG));
  if (!blob) throw new Error('Không xử lý được ảnh này.');

  const dem = new Uint8Array(await blob.arrayBuffer());
  let chuoiNhiPhan = '';
  const KHOI = 8192;   // chia nhỏ để không tràn ngăn xếp khi ảnh lớn
  for (let i = 0; i < dem.length; i += KHOI) {
    chuoiNhiPhan += String.fromCharCode(...dem.subarray(i, i + KHOI));
  }
  return { base64: btoa(chuoiNhiPhan), coByte: dem.length, kieu: 'image/jpeg' };
}

/** Khối quản lý nhạc nền trang chủ — chỉ một bài tại một thời điểm. */
async function veKhoiNhacNen() {
  const d = await api('/api/gv/nhac-nen');
  const the = e('div', 'the');
  the.style.marginTop = '16px';
  the.append(e('h3', null, '♪ Nhạc nền trang chủ'));
  the.append(e('p', 'trong',
    'Phát khi học sinh mở trang lớp — trình duyệt bắt buộc học sinh tự bấm nút nhạc mới nghe được, không tự phát tiếng.'));

  if (d.nhac) {
    const dong = e('div');
    dong.style.cssText = 'margin:10px 0;font-size:14px';
    dong.append(e('b', null, d.nhac.tenBai), document.createTextNode(` · ${(d.nhac.coByte / 1_000_000).toFixed(1)} MB`));
    the.append(dong);

    const audio = e('audio');
    audio.controls = true;
    audio.preload = 'none';
    audio.src = '/api/nhac-nen';
    audio.style.cssText = 'width:100%;margin-bottom:10px';
    the.append(audio);

    the.append(nut('🗑 Xoá nhạc nền', 'nut-nhe nut-nho', () => {
      moHopThoai('Xoá nhạc nền?', e('p', null, 'Học sinh sẽ không còn nghe được nhạc nền khi mở trang lớp.'), [
        nut('Huỷ', 'nut-nhe', dongHopThoai),
        nut('Xoá', 'nut-xau', async () => {
          try {
            await api('/api/gv/nhac-nen', { method: 'DELETE' });
            dongHopThoai();
            nhac('Đã xoá nhạc nền', 'tot');
            trangHinhAnh(document.getElementById('noiDung'));
          } catch (err) { nhac(err.message, 'xau'); }
        }),
      ]);
    }));
  }

  const oTepNhac = e('input');
  oTepNhac.type = 'file';
  oTepNhac.accept = 'audio/mpeg,.mp3';
  oTepNhac.id = 'chonNhac';
  oTepNhac.className = 'o-nhap';
  const oTenBai = oNhap('nhacTenBai', 'text', '', 'Ví dụ: Nhạc nền lớp 10A7');

  the.append(
    truong(d.nhac ? 'Thay bằng bài khác (.mp3, tối đa 12 MB)' : 'Chọn file .mp3 (tối đa 12 MB)', oTepNhac),
    truong('Tên bài', oTenBai)
  );

  const tienTrinh = e('div', 'trong');
  tienTrinh.style.marginTop = '8px';

  the.append(nut('⬆ Tải nhạc lên', 'nut-vien nut-nho', async (ev) => {
    const tep = oTepNhac.files[0];
    if (!tep) return nhac('Chưa chọn file nhạc', 'xau');
    if (!/\.mp3$/i.test(tep.name) && tep.type !== 'audio/mpeg') return nhac('Chỉ nhận file .mp3', 'xau');

    const b = ev.currentTarget;
    b.disabled = true;
    tienTrinh.textContent = 'Đang tải lên…';
    try {
      const duLieu = await tep.arrayBuffer();
      const tenBai = (oTenBai.value || tep.name.replace(/\.mp3$/i, '')).trim();
      const res = await fetch('/api/gv/nhac-nen?tenBai=' + encodeURIComponent(tenBai), {
        method: 'POST', headers: { 'Content-Type': 'audio/mpeg' }, body: duLieu,
      });
      const kq = await res.json();
      if (!kq.ok) throw new Error(kq.loi || 'Tải lên thất bại.');
      nhac('Đã cập nhật nhạc nền', 'tot');
      trangHinhAnh(document.getElementById('noiDung'));
    } catch (err) {
      nhac(err.message, 'xau');
      b.disabled = false;
      tienTrinh.textContent = '';
    }
  }), tienTrinh);

  return the;
}

export async function trangHinhAnh(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const d = await api('/api/gv/anh');

    const khung = e('div');
    khung.append(tieuDeTrang('Ảnh hoạt động',
      `${d.soAnh} ảnh · đã dùng ${(d.tongByte / 1048576).toFixed(1)} MB trong 1 GB miễn phí`));

    // Khu chọn ảnh
    const the = e('div', 'the');
    const oTep = e('input');
    oTep.type = 'file';
    oTep.accept = 'image/*';
    oTep.multiple = true;
    oTep.id = 'chonAnh';
    oTep.className = 'o-nhap';

    const oChu = oNhap('chuThichAnh', 'text', '', 'Chú thích chung cho đợt ảnh này');
    const oNgay = oNhap('ngayAnh', 'date', homNay());

    the.append(
      truong('Chọn ảnh từ máy hoặc chụp bằng điện thoại', oTep,
        'Ảnh được thu nhỏ ngay trên máy trước khi tải lên, nên không tốn dung lượng mạng.'),
      truong('Chú thích', oChu),
      truong('Ngày chụp', oNgay)
    );

    const tienTrinh = e('div', 'trong');
    tienTrinh.style.marginTop = '10px';

    the.append(nut('⬆ Tải ảnh lên', '', async (ev) => {
      const cacTep = [...oTep.files];
      if (!cacTep.length) return nhac('Chưa chọn ảnh nào', 'xau');

      const b = ev.currentTarget;
      b.disabled = true;
      let xong = 0;
      let hong = 0;

      for (const tep of cacTep) {
        tienTrinh.textContent = `Đang xử lý ${xong + hong + 1}/${cacTep.length}: ${tep.name}`;
        try {
          const { base64, kieu } = await nenAnh(tep);
          await api('/api/gv/anh', {
            method: 'POST',
            than: { kieu, duLieu: base64, chuThich: oChu.value, ngay: oNgay.value },
          });
          xong++;
        } catch (err) {
          hong++;
          nhac(`${tep.name}: ${err.message}`, 'xau');
        }
      }

      tienTrinh.textContent = '';
      b.disabled = false;
      nhac(hong ? `Đã tải ${xong} ảnh, ${hong} ảnh lỗi` : `Đã tải lên ${xong} ảnh`, hong ? 'xau' : 'tot');
      ve();
    }), tienTrinh);
    khung.append(the);

    khung.append(await veKhoiNhacNen());

    // Danh sách ảnh đã có
    if (!d.danhSach.length) {
      khung.append(Object.assign(e('p', 'trong', 'Chưa có ảnh nào.'), { style: 'margin-top:16px' }));
    } else {
      const luoi = e('div', 'thu-vien');
      luoi.style.marginTop = '18px';
      d.danhSach.forEach((a) => {
        const hinh = e('figure');
        const img = e('img');
        img.src = '/api/anh?khoa=' + encodeURIComponent(a.khoa);
        img.alt = a.chuThich || 'Ảnh lớp 10A7';
        img.loading = 'lazy';
        hinh.append(img);

        const chan = e('figcaption');
        chan.append(document.createTextNode(`${ngayVN(a.ngay)} · ${Math.round(a.coByte / 1024)} KB`));
        if (a.chuThich) chan.append(e('div', null, a.chuThich));

        const hangNut = e('div', 'day-loc');
        hangNut.style.marginTop = '6px';
        hangNut.append(
          nut('✎', 'nut-nhe nut-nho', () => suaChuThich(a, ve), 'Sửa chú thích ảnh ' + ngayVN(a.ngay)),
          nut('✕', 'nut-nhe nut-nho', () => {
            moHopThoai('Xoá ảnh này?', e('p', null, a.chuThich || ngayVN(a.ngay)), [
              nut('Huỷ', 'nut-nhe', dongHopThoai),
              nut('Xoá', 'nut-xau', async () => {
                try {
                  await api('/api/gv/anh?id=' + a.id, { method: 'DELETE' });
                  dongHopThoai();
                  nhac('Đã xoá ảnh', 'tot');
                  ve();
                } catch (err) { nhac(err.message, 'xau'); }
              }),
            ]);
          }, 'Xoá ảnh ' + ngayVN(a.ngay))
        );
        chan.append(hangNut);
        hinh.append(chan);
        luoi.append(hinh);
      });
      khung.append(luoi);
    }

    datNoiDung(KHUNG, khung);
  }

  function suaChuThich(a, taiLai) {
    const o = oNhap('suaChu', 'text', a.chuThich, 'Chú thích cho ảnh');
    moHopThoai('Sửa chú thích', truong('Chú thích', o), [
      nut('Huỷ', 'nut-nhe', dongHopThoai),
      nut('Lưu', '', async () => {
        try {
          await api('/api/gv/anh', { method: 'PATCH', than: { id: a.id, chuThich: o.value } });
          dongHopThoai();
          taiLai();
        } catch (err) { nhac(err.message, 'xau'); }
      }),
    ]);
  }

  await ve();
}
