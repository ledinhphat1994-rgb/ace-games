/* Thống kê chuyên cần, báo cáo và mã cá nhân. */
import { $, e, datNoiDung, api, homNay, ngayVN, nhac, khoiDangTai, layThongTinVaiTro, nenAnhThanhBlob, giuViTriCuonKhiVe } from '/assets/js/chung.js';
import {
  tieuDeTrang, oThongKe, nut, lienKetNut, truong, oNhap, oChon,
  moHopThoai, dongHopThoai, bieuDoCot, chuThichMau, trangThungRacThuVien,
} from '/assets/js/giao-dien.js';
import { veKhoiTaiKhoanPhu } from './trang-quy.js';

const MAU = {
  coMat: 'var(--tot)', tre: 'var(--luu-y)',
  vangPhep: 'var(--chinh)', vangKhongPhep: 'var(--xau)',
};


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
  hopTab.id = 'thong-ke-tab';
  hopTab.style.margin = '0 0 16px';
  const noiDung = e('div');
  vo.append(hopTab, noiDung);
  datNoiDung(KHUNG, vo);

  function veThanhTab() {
    datNoiDung(hopTab, ...CAC_TAB_THONG_KE.map(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(tab === ma));
      b.addEventListener('click', async () => {
        await giuViTriCuonKhiVe('thong-ke-tab', async () => {
          tab = ma;
          sessionStorage.setItem('tk-tab', tab);
          veThanhTab();
          await veTab();
        });
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
    theBoLoc.id = 'chuyen-can-bo-loc';
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
      b.addEventListener('click', async () => {
        await giuViTriCuonKhiVe('chuyen-can-bo-loc', async () => {
          cheDo = kieu;
          [tuNgay, denNgay] = layKhoangThoiGian(kieu);
          await ve();
        });
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

    const nutApDung = nut('Áp dụng ngày', 'nut-chinh nut-nho', async () => {
      if (!inpTu.value || !inpDen.value) return nhac('Vui lòng chọn đủ từ ngày và đến ngày', 'xau');
      if (inpTu.value > inpDen.value) return nhac('Từ ngày không được lớn hơn đến ngày', 'xau');
      await giuViTriCuonKhiVe('chuyen-can-bo-loc', async () => {
        cheDo = 'tuy_chon';
        tuNgay = inpTu.value;
        denNgay = inpDen.value;
        await ve();
      });
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
      b.addEventListener('click', async () => {
        await giuViTriCuonKhiVe('chuyen-can-bo-loc', async () => { buoi = ma; await ve(); });
      });
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
      // Bố cục hang-hs-doc (như Thủ quỹ/Tổng quan) — "hoàn cảnh" là văn bản tự do có thể dài,
      // xuống dòng riêng thay vì nhét vào nhãn tròn white-space:nowrap dễ tràn ngang trên
      // điện thoại; nhãn mức cảnh báo vẫn ngắn nên giữ dạng nhãn như cũ.
      const hang = e('div', 'hang-hs hang-hs-doc');
      hang.style.cursor = 'pointer';
      const dong1 = e('div', 'hang-hs-dong1');

      const khoiTrai = e('div', 'hs-khoi-trai');
      khoiTrai.append(e('div', 'stt', h.id));
      const thongTin = e('div', 'hs-thong-tin');
      const dongTen = e('div', 'hs-ten-to');
      dongTen.append(e('span', 'hs-ho-ten', h.hoTen));
      thongTin.append(dongTen);
      const chiTiet = [];
      if (h.vangKhongPhep) chiTiet.push(`${h.vangKhongPhep} buổi không phép`);
      if (h.vangPhep) chiTiet.push(`${h.vangPhep} có phép`);
      if (h.tre) chiTiet.push(`${h.tre} lần trễ`);
      if (h.tiLeChuyenCan !== null) chiTiet.push(`chuyên cần ${h.tiLeChuyenCan}%`);
      thongTin.append(e('div', 'hs-chi-tiet-dong', chiTiet.join(' · ')));
      if (h.hoanCanh) thongTin.append(e('div', 'hs-chi-tiet-dong', h.hoanCanh));
      khoiTrai.append(thongTin);
      dong1.append(khoiTrai);

      const khoiPhai = e('div', 'hs-khoi-phai');
      const [tenMuc, lop] = TEN_MUC[h.mucCanhBao];
      khoiPhai.append(e('span', 'nhan ' + lop, tenMuc));
      dong1.append(khoiPhai);

      hang.append(dong1);
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
    'Tải file Excel chuyên nghiệp (.xls) có viền khung, màu sắc và chữ ký để nộp trường; hoặc file CSV (.csv) tách cột chuẩn.'));

  const nay = homNay();
  const truoc30 = (() => {
    const d = new Date(nay + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  const oTu = oNhap('bcTu', 'date', truoc30);
  const oDen = oNhap('bcDen', 'date', nay);

  const theLoc = e('div', 'the');
  theLoc.style.marginBottom = '20px';
  const hangLoc = e('div');
  hangLoc.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;align-items:end;';
  hangLoc.append(
    truong('Từ ngày', oTu),
    truong('Đến ngày', oDen)
  );
  const chuThichLoc = e('p', 'trong');
  chuThichLoc.style.cssText = 'font-size:12.5px;color:var(--chu-mo);margin:10px 0 0 0;line-height:1.4;';
  chuThichLoc.textContent = '💡 Khoảng ngày áp dụng cho báo cáo Điểm danh.';
  theLoc.append(hangLoc, chuThichLoc);
  khung.append(theLoc);

  function taiBaoCao(ma, theoNgay, dinhDang) {
    const p = new URLSearchParams({ loai: ma, dinhDang });
    if (theoNgay) {
      p.set('tuNgay', oTu.value);
      p.set('denNgay', oDen.value);
    }
    location.href = '/api/gv/bao-cao?' + p.toString();
  }

  function taoTheBaoCao(icon, ten, moTa, ma, theoNgay, nhanPhu) {
    const the = e('div', 'the the-bao-cao');
    the.style.cssText = 'display:flex;flex-direction:column;justify-content:space-between;height:100%;box-sizing:border-box;gap:14px;';

    const phanDau = e('div');
    phanDau.style.cssText = 'display:flex;flex-direction:column;flex-grow:1;';

    const dongTieuDe = e('div');
    dongTieuDe.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;';

    const tieuDe = e('h3');
    tieuDe.style.cssText = 'font-size:15.5px;margin:0;color:var(--chu);font-weight:700;display:flex;align-items:center;gap:7px;';
    const iconSpan = e('span');
    iconSpan.style.fontSize = '18px';
    iconSpan.textContent = icon;
    const tenSpan = e('span', null, ten);
    tieuDe.append(iconSpan, tenSpan);
    dongTieuDe.append(tieuDe);

    if (nhanPhu) {
      const chip = e('span', 'nhan nhan-nho', nhanPhu);
      dongTieuDe.append(chip);
    }

    const doanMoTa = e('p', 'trong', moTa);
    doanMoTa.style.cssText = 'font-size:13.5px;margin:0;line-height:1.5;color:var(--chu-nhat);min-height:42px;';

    phanDau.append(dongTieuDe, doanMoTa);

    const hangNut = e('div');
    hangNut.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:6px;';

    const nutExcel = nut('📥 Tải Excel (.xls)', 'nut-chinh nut-nho', () => {
      taiBaoCao(ma, theoNgay, 'excel');
    });
    nutExcel.style.cssText = 'flex:1 1 calc(50% - 4px);min-width:130px;justify-content:center;';
    nutExcel.title = 'Mở trực tiếp bằng Microsoft Excel với bảng biểu kẻ viền, có tiêu đề và chữ ký GVCN';

    const nutCsv = nut('📄 Tải CSV (.csv)', 'nut-vien nut-nho', () => {
      taiBaoCao(ma, theoNgay, 'csv');
    });
    nutCsv.style.cssText = 'flex:1 1 calc(50% - 4px);min-width:120px;justify-content:center;';
    nutCsv.title = 'Tải file dữ liệu thô (.csv), có chỉ thị sep=; để Excel tự động chia cột đúng chuẩn';

    hangNut.append(nutExcel, nutCsv);
    the.append(phanDau, hangNut);
    return the;
  }

  // 7 BÁO CÁO ĐỒNG BỘ 7 MỤC QUẢN LÝ — HIỂN THỊ TRÊN LƯỚI PHẲNG THỐNG NHẤT, KHÔNG PHÂN NHÓM RƯỜM RÀ
  const DANH_SACH_BAO_CAO = [
    ['✅', 'Báo cáo Điểm danh', 'Tổng số buổi có mặt, đi trễ, vắng phép, không phép và tỉ lệ chuyên cần từng em.', 'diem-danh', true, 'Theo ngày'],
    ['👥', 'Báo cáo Học sinh', 'Danh sách trích ngang: Họ tên, ngày sinh, giới tính, nghề, tổ hợp, tổ, chức vụ, ĐT phụ huynh.', 'hoc-sinh', false, 'Danh sách lớp'],
    ['💰', 'Báo cáo Thủ quỹ', 'Bảng đóng nộp từng em (đã đóng, thiếu, chưa đóng), tổng chi tiêu và số dư tồn quỹ thực tế.', 'thu-quy', false, 'Quỹ lớp'],
    ['📢', 'Báo cáo Thông báo', 'Tổng hợp toàn bộ các thông báo đã ban hành của lớp (gồm cả mốc sự kiện, mức độ quan trọng), ngày đăng, nội dung và trạng thái ghim.', 'thong-bao', false, 'Toàn bộ'],
    ['⏰', 'Báo cáo Thời khoá biểu', 'Lịch học các tiết từ Thứ 2 đến Thứ 7 theo phiên bản thời khoá biểu đang áp dụng.', 'thoi-khoa-bieu', false, 'TKB hiện hành'],
    ['📊', 'Báo cáo Thống kê tổng hợp', 'Báo cáo tổng hợp toàn diện: chuyên cần, sách giáo khoa, đồng phục cả lớp.', 'thong-ke', false, 'Tổng hợp'],
    ['🔑', 'Báo cáo Mã cá nhân & Phân quyền', 'Danh sách mã tra cứu điểm cá nhân của từng em, tài khoản ban cán sự và quyền quản trị.', 'ma-ca-nhan', false, 'Bảo mật'],
  ];

  const luoi = e('div', 'luoi luoi-2');
  luoi.style.alignItems = 'stretch';
  DANH_SACH_BAO_CAO.forEach(([icon, ten, moTa, ma, theoNgay, nhanPhu]) => {
    luoi.append(taoTheBaoCao(icon, ten, moTa, ma, theoNgay, nhanPhu));
  });
  khung.append(luoi);

  const goiY = e('div', 'the');
  goiY.style.marginTop = '24px';
  goiY.style.borderLeft = '4px solid var(--chinh)';
  goiY.append(
    e('h3', null, '💡 Hướng dẫn & Tiêu chuẩn xuất file báo cáo'),
    e('p', null,
      '• Định dạng Excel (.xls): Được định dạng chuẩn mẫu văn bản giáo dục với đầy đủ Quốc hiệu, Tiêu ngữ, '
      + 'tiêu đề trường lớp, viền khung ô rõ ràng, màu sắc trang nhã, phân chia cột chuẩn xác và có sẵn phần ký duyệt của Giáo viên chủ nhiệm để in nộp Ban Giám hiệu.\n'
      + '• Định dạng CSV (.csv): Đã bổ sung chỉ thị phân tách cột tự động (sep=;) và bảng mã UTF-8 BOM, đảm bảo khi mở trên bất kỳ máy tính nào cũng hiển thị đúng từng cột A, B, C, D... không bị dồn cột hay lỗi font tiếng Việt.'
    )
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
    await veKhoiTaiKhoanPhu(khoiTkPhu);

    /* ================= PHẦN 2 — học sinh: mã + quyền + chức vụ trong MỘT chỗ ================= */
    const dau2 = e('div', 'tieu-de-trang');
    dau2.style.marginTop = '28px';
    dau2.append(e('h2', null, '2️⃣ Học sinh'),
      e('p', null, 'Mỗi em một mã riêng. Bấm "⚙ Quản lý" để sửa chức vụ, mã, quyền xem và quyền quản lý – giao diện bảng cố định, quản lý tập trung.'));
    khung.append(dau2);

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
    const bang = e('table', 'bang-co-dinh');
    bang.style.cssText = 'table-layout:fixed;width:100%;min-width:860px;';

    const colgroup = e('colgroup');
    const colStt = e('col'); colStt.style.width = '56px';
    const colTen = e('col'); colTen.style.width = '200px';
    const colCv = e('col'); colCv.style.width = '140px';
    const colMa = e('col'); colMa.style.width = '130px';
    const colQuyen = e('col'); colQuyen.style.width = 'auto';
    const colNut = e('col'); colNut.style.width = '114px';
    colgroup.append(colStt, colTen, colCv, colMa, colQuyen, colNut);
    bang.append(colgroup);

    const dau = e('thead');
    const hd = e('tr');
    const thStt = e('th', 'so', 'STT'); thStt.style.width = '56px';
    const thTen = e('th', null, 'Họ và tên'); thTen.style.width = '200px';
    const thCv = e('th', null, 'Chức vụ'); thCv.style.width = '140px';
    const thMa = e('th', null, 'Mã cá nhân'); thMa.style.width = '130px'; thMa.style.textAlign = 'center';
    const thQuyen = e('th', null, 'Quyền');
    const thNut = e('th', null, ''); thNut.style.width = '114px'; thNut.style.textAlign = 'center';
    hd.append(thStt, thTen, thCv, thMa, thQuyen, thNut);
    dau.append(hd);

    const than = e('tbody');

    function capNhatHangHocSinh(hMoi) {
      const hangCu = document.getElementById(`hang-hs-${hMoi.id}`);
      if (!hangCu) return;
      const hangMoi = veHangHocSinh(hMoi, ve, capNhatHangHocSinh);
      hangMoi.classList.add('hang-vua-sua');
      hangCu.replaceWith(hangMoi);
    }

    d.danhSach.forEach((h) => {
      than.append(veHangHocSinh(h, ve, capNhatHangHocSinh));
    });
    bang.append(dau, than);
    boc.append(bang);
    khung.append(boc);

    const viTriCuon = window.scrollY;
    datNoiDung(KHUNG, khung);
    if (viTriCuon > 0) {
      window.scrollTo({ top: viTriCuon, behavior: 'instant' });
    }
  }

  await ve();
}

function veHangHocSinh(h, taiLai, capNhatHang) {
  const tr = e('tr');
  tr.id = `hang-hs-${h.id}`;
  tr.style.height = '48px';

  // 1. STT
  const tdStt = e('td', 'so', h.id);
  tdStt.style.textAlign = 'center';

  // 2. Họ và tên
  const tdTen = e('td');
  tdTen.style.fontWeight = '600';
  tdTen.style.whiteSpace = 'nowrap';
  tdTen.style.overflow = 'hidden';
  tdTen.style.textOverflow = 'ellipsis';
  tdTen.append(h.hoTen);
  tdTen.title = h.hoTen;

  // 3. Chức vụ
  const tdChucVu = e('td');
  tdChucVu.style.whiteSpace = 'nowrap';
  tdChucVu.style.overflow = 'hidden';
  if (h.chucVu) {
    const info = layThongTinVaiTro(h.chucVu);
    tdChucVu.append(Object.assign(e('span', ['nhan', info.lopMau].filter(Boolean).join(' '), `${info.bieuTuong} ${h.chucVu}`), {
      style: `background:${info.mauNen};border-color:${info.mauVien};color:${info.mauChu};font-weight:700;font-size:11.5px;padding:2px 8px;border-radius:6px;display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;`
    }));
  } else {
    tdChucVu.append(e('span', 'trong', '—'));
  }

  // 4. Mã cá nhân
  const tdMa = e('td');
  tdMa.style.textAlign = 'center';
  if (h.ma) {
    const ma = e('code', null, h.ma);
    ma.style.cssText = 'font-size:15px;letter-spacing:1px;font-weight:700';
    tdMa.append(ma);
  } else {
    tdMa.append(e('span', 'trong', 'Chưa cấp'));
  }

  // 5. Quyền
  const tdQuyen = e('td', 'o-quyen');
  if (h.ma) {
    const hopQuyen = e('div', 'hop-quyen-hang');
    const soAn = (h.anMuc || []).length;
    const dsQuyen = h.quyen || [];

    // Badge quyền xem
    hopQuyen.append(e('span', 'nhan ' + (soAn ? 'nhan-luuy' : 'nhan-tot'),
      soAn ? `🔒 Đã ẩn ${soAn} mục` : '👁 Xem hết'));

    // Badge quyền quản lý
    if (dsQuyen.length) {
      const tenCacQuyen = dsQuyen.map((q) => {
        const tim = CAC_QUYEN_QUAN_LY.find((x) => x[0] === q);
        const icon = ICON_QUYEN[q] || '🔑';
        return tim ? `${icon} ${tim[1].split(' — ')[0]}` : q;
      }).join(', ');
      const nhanQuyen = e('span', 'nhan nhan-tim', dsQuyen.length === 1 ? tenCacQuyen : `🔑 Quản lý ${dsQuyen.length} mục`);
      nhanQuyen.title = `Các quyền quản lý: ${tenCacQuyen}`;
      hopQuyen.append(nhanQuyen);
    }

    // Badge thiết bị
    if (h.coThietBi) {
      const nhanTb = e('span', 'nhan nhan-xam', '📱 Đã gắn máy');
      nhanTb.title = 'Tài khoản đã liên kết với một thiết bị';
      hopQuyen.append(nhanTb);
    }
    tdQuyen.append(hopQuyen);
  } else {
    tdQuyen.append(e('span', 'trong', '—'));
  }

  // 6. Nút Thao tác
  const tdNut = e('td');
  tdNut.style.textAlign = 'center';
  tdNut.append(nut('⚙ Quản lý', 'nut-vien nut-nho', () => moQuanLyHocSinh(h, taiLai, capNhatHang)));

  tr.append(tdStt, tdTen, tdChucVu, tdMa, tdQuyen, tdNut);
  return tr;
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
// Sổ điểm/xếp loại học tập đã bỏ HẲN khỏi cả hệ thống (không còn tính năng chấm điểm) — không
// còn liên quan gì tới danh sách "gọn giao diện" theo từng em ở đây nữa.
const CAC_MUC_XEM = [
  ['quy', 'Tiền quỹ'],
  ['thong-bao', 'Thông báo'],
  ['thoi-khoa-bieu', 'Thời khoá biểu'],
  ['diem-danh', 'Điểm danh / chuyên cần'],
];
// Trùng danh mục CAC_QUYEN ở functions/api/gv/tai-khoan-phu.js — chép tay vì đây là mã
// chạy trên trình duyệt, không import trực tiếp từ functions/ được.
// Chuẩn hoá khớp chính xác danh sách các mục thuộc nhóm "LỚP HỌC" trên sidebar.
const CAC_QUYEN_QUAN_LY = [
  ['diem-danh', 'Điểm danh — điểm danh chuyên cần hằng ngày'],
  ['quy', 'Thủ quỹ lớp — ghi thu, ghi chi, quản lý quỹ lớp'],
  ['thong-bao', 'Thông báo — soạn và đăng thông báo lên trang lớp'],
  ['thoi-khoa-bieu', 'Thời khoá biểu — chỉnh sửa lịch học của lớp'],
  ['hinh-anh', 'Thư viện Ảnh — tải/quản lý kho ảnh, quyền đính kèm ảnh'],
  ['am-thanh', 'Thư viện Âm thanh — tải bài hát/quản lý nhạc nền, quyền đính kèm âm thanh'],
  ['video', 'Thư viện Video — tải/quản lý kho video, quyền đính kèm video'],
  ['hoat-dong-lop', 'Hoạt động lớp — đăng tin/hoạt động lớp (chỉ ghi text nếu không cấp quyền media)'],
];
const ICON_QUYEN = {
  'diem-danh': '✅',
  quy: '🪙',
  'thong-bao': '📢',
  'thoi-khoa-bieu': '🕒',
  'hinh-anh': '📸',
  'am-thanh': '♪',
  video: '🎬',
  'hoat-dong-lop': '🌿',
  'hoc-sinh': '👥',
};

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

function taoNhomTichQuyenQuanLy(daChon) {
  const bo = new Set(daChon);
  const hop = e('div');
  hop.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:6px;';

  const oTich = [];

  const ghiChuMedia = e('div');
  ghiChuMedia.style.cssText = 'padding:9px 12px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.25);border-radius:8px;font-size:12.5px;color:var(--chu);line-height:1.5;margin-bottom:4px;';
  datNoiDung(ghiChuMedia,
    Object.assign(e('b', null, '💡 Quy tắc Media: '), { style: 'color:var(--chinh)' }),
    document.createTextNode('Học sinh được cấp quyền '),
    e('i', null, 'Thông báo'),
    document.createTextNode(' hoặc '),
    e('i', null, 'Hoạt động lớp'),
    document.createTextNode(' nếu không được tích quyền '),
    e('i', null, 'Thư viện Ảnh / Âm thanh / Video'),
    document.createTextNode(' thì '),
    e('b', null, 'chỉ được ghi văn bản (text) thông thường'),
    document.createTextNode('; các nút chọn hoặc tải media sẽ tự động bị khoá.')
  );
  hop.append(ghiChuMedia);

  CAC_QUYEN_QUAN_LY.forEach(([ma, nhan]) => {
    const o = e('input');
    o.type = 'checkbox';
    o.checked = bo.has(ma);
    o.style.cssText = 'margin-top:2px;cursor:pointer;flex-shrink:0;width:16px;height:16px;accent-color:var(--chinh);';

    const nhanO = e('label');
    nhanO.style.cssText = 'display:flex;gap:10px;align-items:flex-start;font-size:13.5px;padding:8px 10px;border-radius:8px;background:var(--nen-chim);border:1px solid var(--vien);cursor:pointer;transition:all 0.15s;';
    nhanO.addEventListener('mouseenter', () => { nhanO.style.borderColor = 'var(--chinh)'; });
    nhanO.addEventListener('mouseleave', () => { nhanO.style.borderColor = 'var(--vien)'; });

    const [tieuDe, moTa] = nhan.split(' — ');
    const icon = ICON_QUYEN[ma] || '🔑';
    const nd = e('div');
    nd.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
    const dongTd = e('div');
    dongTd.style.cssText = 'font-weight:700;color:var(--chu);display:flex;align-items:center;gap:6px;';
    dongTd.append(e('span', null, icon), document.createTextNode(tieuDe));
    nd.append(dongTd);
    if (moTa) {
      nd.append(Object.assign(e('div', 'trong', moTa), { style: 'font-size:12px;line-height:1.35;color:var(--chu-nhat);' }));
    }

    nhanO.append(o, nd);
    hop.append(nhanO);
    oTich.push([ma, o]);
  });

  return { hop, oTich };
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

function moQuanLyHocSinh(hocSinh, taiLai, capNhatHang) {
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
  const { hop: hopQuyenQuanLy, oTich: oTichQuanLy } = taoNhomTichQuyenQuanLy(hocSinh.quyen || []);

  const ghiChuTongQuan = e('div');
  ghiChuTongQuan.style.cssText = 'padding:10px 12px;background:var(--nen-chim);border:1px solid var(--vien);border-radius:8px;font-size:12.5px;color:var(--chu-nhat);line-height:1.6;';
  datNoiDung(ghiChuTongQuan,
    Object.assign(e('div', null, '📖 3 tầng, từ ít đến nhiều quyền:'), { style: 'font-weight:700;color:var(--chu);margin-bottom:4px;' }),
    e('div', null, '1. Mặc định (không tích gì cả) — em chỉ xem trang lớp công khai, y hệt mọi bạn khác.'),
    e('div', null, '2. "Gọn giao diện" bên dưới — chỉ ẩn/hiện mục trên trang chủ CỦA RIÊNG EM, không khoá dữ liệu.'),
    e('div', null, '3. "Quyền quản lý" bên dưới — biến mã của em thành tài khoản đăng nhập được khu quản lý, sức mạnh giống hệt "Tài khoản đặc biệt" (Thủ quỹ, Lớp trưởng…) ở trang Thủ quỹ.')
  );

  const noi = [
    ghiChuTongQuan,
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
        const maMoi = kq.ketQua[0].ma;
        hocSinh.ma = maMoi;
        oMa.value = maMoi;
        nhac('Đã cấp mã mới: ' + maMoi, 'tot');
        if (typeof capNhatHang === 'function') capNhatHang(hocSinh);
        ev.currentTarget.disabled = false;
      } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
    }),
    hocSinh.coThietBi
      ? Object.assign(e('p', 'trong', '🔒 Mã này đã gắn với một thiết bị.'), { style: 'margin-top:8px' })
      : null,
    hocSinh.coThietBi
      ? nut('📱 Đặt lại thiết bị (cho đăng nhập máy mới)', 'nut-nhe nut-nho', () => datLaiThietBi(hocSinh, taiLai, capNhatHang))
      : null,

    Object.assign(e('h3', null, '🧹 Gọn giao diện trang lớp'), { style: 'margin-top:18px' }),
    e('p', 'trong', 'Bỏ tích mục nào thì ẨN mục đó khỏi trang chủ/menu của em (mặc định hiện hết). Đây chỉ là dọn bớt giao diện cho gọn — KHÔNG phải khoá dữ liệu: mã lớp và các mã khác vẫn xem được như thường.'),
    ...oTichXem.map(([, , nhanO]) => nhanO),

    Object.assign(e('h3', null, '🔑 Quyền quản lý (đăng nhập được ở /login.html)'), { style: 'margin-top:18px' }),
    e('p', 'trong', 'Tích mục nào thì mã này đăng nhập được vào khu quản lý, chỉ thấy đúng mục đó trên sidebar. Để trống hết = chỉ xem kết quả học tập cá nhân, không quản lý gì.'),
    hopQuyenQuanLy,
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
          hocSinh.ma = maMoi;
        }

        const anMucMoi = oTichXem.filter(([, o]) => !o.checked).map(([ma]) => ma);
        const quyenMoi = oTichQuanLy.filter(([, o]) => o.checked).map(([ma]) => ma);
        await api('/api/gv/ma-ca-nhan', { method: 'PATCH', than: { hocSinhId: hocSinh.id, anMuc: anMucMoi, quyen: quyenMoi } });

        hocSinh.hoTen = tenMoi;
        hocSinh.chucVu = oChucVu.value.trim();
        hocSinh.anMuc = anMucMoi;
        hocSinh.quyen = quyenMoi;

        dongHopThoai();
        nhac('Đã lưu thông tin của ' + tenMoi, 'tot');

        if (typeof capNhatHang === 'function') {
          capNhatHang(hocSinh);
        } else if (typeof taiLai === 'function') {
          taiLai();
        }
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}

function datLaiThietBi(hocSinh, taiLai, capNhatHang) {
  moHopThoai('Đặt lại thiết bị?', [
    e('p', null, `Mã của ${hocSinh.hoTen} sẽ đăng nhập được ở một máy MỚI (máy cũ không tự mất quyền, chỉ là không còn bị ràng buộc riêng máy đó nữa cho tới lần đăng nhập kế tiếp).`),
  ], [
    nut('Huỷ', 'nut-nhe', dongHopThoai),
    nut('Đặt lại', 'nut-xau', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        await api('/api/gv/ma-ca-nhan', { method: 'PATCH', than: { hocSinhId: hocSinh.id, datLaiThietBi: true } });
        hocSinh.coThietBi = 0;
        dongHopThoai();
        nhac('Đã đặt lại thiết bị cho ' + hocSinh.hoTen, 'tot');
        if (typeof capNhatHang === 'function') {
          capNhatHang(hocSinh);
        } else if (typeof taiLai === 'function') {
          taiLai();
        }
      } catch (err) {
        nhac(err.message, 'xau');
        ev.currentTarget.disabled = false;
      }
    }),
  ]);
}


/** Mở cửa sổ in danh sách mã, cắt rời phát cho từng em. */
async function inDanhSachMa(danhSach) {
  // window.open PHẢI gọi ngay, đồng bộ với cú bấm — gọi sau một await sẽ bị trình duyệt
  // chặn popup vì không còn được coi là phản hồi trực tiếp của người dùng.
  const cua = window.open('', '_blank');
  if (!cua) return nhac('Trình duyệt đã chặn cửa sổ in. Hãy cho phép rồi thử lại.', 'xau');

  const tenLop = await api('/api/whoami').then((d) => d.tenLop).catch(() => '') || 'Lớp học';

  const the = danhSach.filter((h) => h.ma).map((h) => `
    <div class="phieu">
      <div class="ten">${thoat(h.hoTen)}</div>
      <div class="nhan">Mã cá nhân của em</div>
      <div class="ma">${thoat(h.ma)}</div>
      <div class="chan">lop-10a7.pages.dev &middot; Xem kết quả của tôi</div>
    </div>`).join('');

  cua.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8">
    <title>Mã cá nhân ${thoat(tenLop)}</title><style>
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
      <h1>MÃ CÁ NHÂN HỌC SINH ${thoat(tenLop.toUpperCase())}</h1>
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

/** Nén ảnh ngay trên máy giáo viên (dùng chung nenAnhThanhBlob ở chung.js), rồi đổi sang
    base64 vì /api/gv/anh nhận JSON (khác /api/gv/thong-bao-tep nhận thẳng nhị phân). */
async function nenAnh(tep) {
  const blob = await nenAnhThanhBlob(tep);
  const dem = new Uint8Array(await blob.arrayBuffer());
  let chuoiNhiPhan = '';
  const KHOI = 8192;   // chia nhỏ để không tràn ngăn xếp khi ảnh lớn
  for (let i = 0; i < dem.length; i += KHOI) {
    chuoiNhiPhan += String.fromCharCode(...dem.subarray(i, i + KHOI));
  }
  return { base64: btoa(chuoiNhiPhan), coByte: dem.length, kieu: 'image/jpeg' };
}

/** Thư viện Âm thanh — nhiều bài, chọn ĐÚNG MỘT bài làm nhạc nền trang chủ tại một thời điểm.
    Đây cũng là nguồn duy nhất để đính kèm âm thanh vào Thông báo (chọn từ thư viện này). */
export async function trangThuVienAmThanh(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());
  const daChon = new Set();   // id các bài đang tích chọn để xoá hàng loạt

  async function ve() {
    const d = await api('/api/gv/thu-vien-am-thanh');
    const khung = e('div');
    const tongByte = d.danhSach.reduce((a, b) => a + b.coByte, 0);

    const nutXoaTatCa = d.danhSach.length ? nut('🗑 Xoá tất cả', 'nut-nhe nut-nho', () => {
      moHopThoai('Xoá TOÀN BỘ thư viện Âm thanh?', [
        e('p', null, `Toàn bộ ${d.danhSach.length} bài sẽ mất hết, kể cả bài đang làm nhạc nền trang chủ.`),
        e('p', 'trong', 'Không thể hoàn tác.'),
      ], [
        nut('Huỷ', 'nut-nhe', dongHopThoai),
        nut('Xoá tất cả', 'nut-xau', async (ev) => {
          ev.currentTarget.disabled = true;
          try {
            await api('/api/gv/thu-vien-am-thanh?tatCa=1', { method: 'DELETE' });
            dongHopThoai();
            nhac('Đã xoá toàn bộ thư viện', 'tot');
            daChon.clear();
            ve();
          } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
        }),
      ]);
    }) : null;
    khung.append(tieuDeTrang('Thư viện Âm thanh',
      d.danhSach.length ? `${d.danhSach.length} bài · Dung lượng: ${(tongByte / 1_000_000).toFixed(1)} MB` : 'Chưa có bài nào',
      nut('🗑 Thùng rác', 'nut-vien nut-nho', () => { location.hash = '#/thu-vien-am-thanh-thung-rac'; }),
      ...(nutXoaTatCa ? [nutXoaTatCa] : [])));

    const the = e('div', 'the');
    the.append(e('h3', null, '⬆ Tải bài mới vào thư viện'));
    the.append(e('p', 'trong',
      'Bài nào được chọn "🔊 Làm nhạc nền" sẽ phát khi học sinh mở trang lớp — trình duyệt bắt buộc học sinh tự bấm nút nhạc mới nghe được, không tự phát tiếng.'));

    const oTepNhac = e('input');
    oTepNhac.type = 'file';
    oTepNhac.accept = 'audio/mpeg,.mp3';
    oTepNhac.id = 'chonNhac';
    oTepNhac.className = 'o-nhap';
    const oTenBai = oNhap('nhacTenBai', 'text', '', 'Ví dụ: Nhạc nền đầu giờ');

    the.append(
      truong('Chọn file .mp3 (tối đa 12 MB)', oTepNhac),
      truong('Tên bài hát hiển thị', oTenBai)
    );

    const tienTrinh = e('div', 'trong');
    tienTrinh.style.marginTop = '8px';

    the.append(nut('⬆ Tải lên', '', async (ev) => {
      const tep = oTepNhac.files[0];
      if (!tep) return nhac('Chưa chọn file nhạc', 'xau');
      if (!/\.mp3$/i.test(tep.name) && tep.type !== 'audio/mpeg') return nhac('Chỉ nhận file .mp3', 'xau');

      const b = ev.currentTarget;
      b.disabled = true;
      tienTrinh.textContent = 'Đang tải lên…';
      try {
        const duLieu = await tep.arrayBuffer();
        const tenBai = (oTenBai.value || tep.name.replace(/\.mp3$/i, '')).trim();
        const res = await fetch('/api/gv/thu-vien-am-thanh?tenBai=' + encodeURIComponent(tenBai), {
          method: 'POST', headers: { 'Content-Type': 'audio/mpeg' }, body: duLieu,
        });
        const kq = await res.json();
        if (!kq.ok) throw new Error(kq.loi || 'Tải lên thất bại.');
        nhac('Đã thêm vào thư viện', 'tot');
        oTepNhac.value = ''; oTenBai.value = '';
        ve();
      } catch (err) {
        nhac(err.message, 'xau');
        tienTrinh.textContent = '';
      } finally {
        b.disabled = false;
      }
    }), tienTrinh);
    khung.append(the);

    // Thanh "Đã chọn N — Bỏ chọn / Xoá đã chọn", chỉ hiện khi có tích chọn.
    if (daChon.size) {
      const thanh = e('div', 'the');
      thanh.style.cssText = 'margin-top:14px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-color:var(--xau)';
      thanh.append(e('span', null, `Đã chọn ${daChon.size}/${d.danhSach.length} bài`));
      const hop = e('div', 'day-loc');
      if (daChon.size < d.danhSach.length) {
        hop.append(nut('Chọn tất cả', 'nut-nhe nut-nho', () => { d.danhSach.forEach((b) => daChon.add(b.id)); ve(); }));
      }
      hop.append(
        nut('Bỏ chọn', 'nut-nhe nut-nho', () => { daChon.clear(); ve(); }),
        nut(`🗑 Xoá ${daChon.size} bài đã chọn`, 'nut-xau nut-nho', () => {
          moHopThoai(`Xoá ${daChon.size} bài đã chọn?`, e('p', null, 'Không thể hoàn tác.'), [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá', 'nut-xau', async (ev) => {
              ev.currentTarget.disabled = true;
              try {
                await api(`/api/gv/thu-vien-am-thanh?ids=${[...daChon].join(',')}`, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá', 'tot');
                daChon.clear();
                ve();
              } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
            }),
          ]);
        })
      );
      thanh.append(hop);
      khung.append(thanh);
    }

    if (!d.danhSach.length) {
      khung.append(Object.assign(e('p', 'trong', 'Chưa có bài nào trong thư viện.'), { style: 'margin-top:16px' }));
    } else {
      const luoi = e('div');
      luoi.style.cssText = 'margin-top:18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px';
      d.danhSach.forEach((bai) => {
        const muc = e('div', 'the');

        const dongDau = e('div');
        dongDau.style.cssText = 'display:flex;align-items:flex-start;gap:9px';

        const oChonXoa = e('input');
        oChonXoa.type = 'checkbox';
        oChonXoa.checked = daChon.has(bai.id);
        oChonXoa.setAttribute('aria-label', 'Chọn "' + bai.ten + '" để xoá hàng loạt');
        oChonXoa.style.cssText = 'width:18px;height:18px;flex:none;cursor:pointer;accent-color:var(--xau);margin-top:2px';
        oChonXoa.addEventListener('change', () => {
          if (oChonXoa.checked) daChon.add(bai.id); else daChon.delete(bai.id);
          ve();
        });
        dongDau.append(oChonXoa);

        const giua = e('div');
        giua.style.cssText = 'flex:1;min-width:0';
        giua.append(e('h3', null, bai.ten || 'Bài hát chưa đặt tên'));
        giua.append(e('p', 'trong', `${(bai.coByte / 1_000_000).toFixed(1)} MB`));
        dongDau.append(giua);

        dongDau.append(nut('🗑', 'nut-xoa-anh nut-nho', () => {
          moHopThoai('Xoá bài này khỏi thư viện?', e('p', null,
            bai.dangPhat
              ? `"${bai.ten}" đang là nhạc nền trang chủ — xoá xong học sinh sẽ không còn nghe được nhạc nền cho tới khi chọn bài khác.`
              : `Xoá "${bai.ten}"? Không thể hoàn tác.`), [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá', 'nut-xau', async () => {
              try {
                await api('/api/gv/thu-vien-am-thanh?id=' + bai.id, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá', 'tot');
                daChon.delete(bai.id);
                ve();
              } catch (err) { nhac(err.message, 'xau'); }
            }),
          ]);
        }, 'Xoá bài: ' + bai.ten));
        muc.append(dongDau);

        const audio = e('audio');
        audio.controls = true;
        audio.preload = 'none';
        audio.src = '/api/thu-vien-tep?loai=am-thanh&id=' + bai.id;
        audio.style.cssText = 'width:100%;margin:10px 0 8px';
        muc.append(audio);

        // Tuỳ chọn (radio) — chọn ĐÚNG MỘT bài làm nhạc nền, tách biệt hẳn với tích chọn để
        // xoá ở trên (khác hình dạng: nút tròn so với ô vuông) cho khỏi lẫn hai việc.
        const oChonNenNhan = e('label');
        oChonNenNhan.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;cursor:pointer';
        const oChonNen = e('input');
        oChonNen.type = 'radio';
        oChonNen.name = 'nhacNenDangChon';
        oChonNen.checked = bai.dangPhat;
        oChonNen.style.cssText = 'width:17px;height:17px;cursor:pointer;accent-color:var(--tot)';
        oChonNen.addEventListener('change', async () => {
          if (!oChonNen.checked) return;
          try {
            await api('/api/gv/thu-vien-am-thanh', { method: 'PATCH', than: { id: bai.id, datNhacNen: true } });
            nhac('Đã đặt làm nhạc nền trang chủ', 'tot');
            ve();
          } catch (err) { nhac(err.message, 'xau'); }
        });
        oChonNenNhan.append(oChonNen, document.createTextNode(bai.dangPhat ? '🔊 Đang làm nhạc nền' : 'Làm nhạc nền'));
        if (bai.dangPhat) oChonNenNhan.style.color = 'var(--tot)';
        muc.append(oChonNenNhan);

        luoi.append(muc);
      });
      khung.append(luoi);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

/** Thư viện Video — video tải lên từ máy/điện thoại (khác video dán link YouTube/Drive ở
    Thông báo, vốn không tốn kho lưu trữ nên không thuộc thư viện này). Đây là nguồn duy nhất
    để đính kèm video-tải-lên vào Thông báo (chọn từ thư viện này). */
export async function trangThuVienVideo(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());
  const daChon = new Set();   // id các video đang tích chọn để xoá hàng loạt

  async function ve() {
    const d = await api('/api/gv/thu-vien-video');
    const khung = e('div');
    const tongByte = d.danhSach.reduce((a, b) => a + b.coByte, 0);

    const nutXoaTatCa = d.danhSach.length ? nut('🗑 Xoá tất cả', 'nut-nhe nut-nho', () => {
      moHopThoai('Xoá TOÀN BỘ thư viện Video?', [
        e('p', null, `Toàn bộ ${d.danhSach.length} video sẽ mất hết.`),
        e('p', 'trong', 'Không thể hoàn tác.'),
      ], [
        nut('Huỷ', 'nut-nhe', dongHopThoai),
        nut('Xoá tất cả', 'nut-xau', async (ev) => {
          ev.currentTarget.disabled = true;
          try {
            await api('/api/gv/thu-vien-video?tatCa=1', { method: 'DELETE' });
            dongHopThoai();
            nhac('Đã xoá toàn bộ thư viện', 'tot');
            daChon.clear();
            ve();
          } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
        }),
      ]);
    }) : null;
    khung.append(tieuDeTrang('Thư viện Video',
      d.danhSach.length ? `${d.danhSach.length} video · Dung lượng: ${(tongByte / 1_000_000).toFixed(1)} MB` : 'Chưa có video nào',
      nut('🗑 Thùng rác', 'nut-vien nut-nho', () => { location.hash = '#/thu-vien-video-thung-rac'; }),
      ...(nutXoaTatCa ? [nutXoaTatCa] : [])));

    const the = e('div', 'the');
    the.append(e('h3', null, '⬆ Tải video mới vào thư viện'));
    the.append(e('p', 'trong', 'Video YouTube/Google Drive dán link ở Thông báo không cần tải lên đây — chỉ video từ máy/điện thoại mới cần.'));

    const oTep = e('input');
    oTep.type = 'file';
    oTep.accept = 'video/mp4,video/webm,video/quicktime,video/*';
    oTep.id = 'chonVideo';
    oTep.className = 'o-nhap';
    const oTen = oNhap('videoTen', 'text', '', 'Ví dụ: Văn nghệ 20/11');

    the.append(
      truong('Chọn file video (tối đa 50 MB)', oTep),
      truong('Tên hiển thị', oTen)
    );

    const tienTrinh = e('div', 'trong');
    tienTrinh.style.marginTop = '8px';

    the.append(nut('⬆ Tải lên', '', async (ev) => {
      const tep = oTep.files[0];
      if (!tep) return nhac('Chưa chọn video', 'xau');
      if (tep.size > 50_000_000) return nhac('File vượt quá 50 MB', 'xau');

      const b = ev.currentTarget;
      b.disabled = true;
      tienTrinh.textContent = 'Đang tải lên…';
      try {
        const duLieu = await tep.arrayBuffer();
        const ten = (oTen.value || tep.name).trim();
        const res = await fetch('/api/gv/thu-vien-video?ten=' + encodeURIComponent(ten), {
          method: 'POST', headers: { 'Content-Type': tep.type || 'video/mp4' }, body: duLieu,
        });
        const kq = await res.json();
        if (!kq.ok) throw new Error(kq.loi || 'Tải lên thất bại.');
        nhac('Đã thêm vào thư viện', 'tot');
        oTep.value = ''; oTen.value = '';
        ve();
      } catch (err) {
        nhac(err.message, 'xau');
        tienTrinh.textContent = '';
      } finally {
        b.disabled = false;
      }
    }), tienTrinh);
    khung.append(the);

    // Thanh "Đã chọn N — Bỏ chọn / Xoá đã chọn", chỉ hiện khi có tích chọn.
    if (daChon.size) {
      const thanh = e('div', 'the');
      thanh.style.cssText = 'margin-top:14px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-color:var(--xau)';
      thanh.append(e('span', null, `Đã chọn ${daChon.size}/${d.danhSach.length} video`));
      const hop = e('div', 'day-loc');
      if (daChon.size < d.danhSach.length) {
        hop.append(nut('Chọn tất cả', 'nut-nhe nut-nho', () => { d.danhSach.forEach((v) => daChon.add(v.id)); ve(); }));
      }
      hop.append(
        nut('Bỏ chọn', 'nut-nhe nut-nho', () => { daChon.clear(); ve(); }),
        nut(`🗑 Xoá ${daChon.size} video đã chọn`, 'nut-xau nut-nho', () => {
          moHopThoai(`Xoá ${daChon.size} video đã chọn?`, e('p', null, 'Không thể hoàn tác.'), [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá', 'nut-xau', async (ev) => {
              ev.currentTarget.disabled = true;
              try {
                await api(`/api/gv/thu-vien-video?ids=${[...daChon].join(',')}`, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá', 'tot');
                daChon.clear();
                ve();
              } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
            }),
          ]);
        })
      );
      thanh.append(hop);
      khung.append(thanh);
    }

    if (!d.danhSach.length) {
      khung.append(Object.assign(e('p', 'trong', 'Chưa có video nào trong thư viện.'), { style: 'margin-top:16px' }));
    } else {
      const luoi = e('div');
      luoi.style.cssText = 'margin-top:18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px';
      d.danhSach.forEach((v) => {
        const muc = e('div', 'the');

        const dongDau = e('div');
        dongDau.style.cssText = 'display:flex;align-items:flex-start;gap:9px';

        const oChonXoa = e('input');
        oChonXoa.type = 'checkbox';
        oChonXoa.checked = daChon.has(v.id);
        oChonXoa.setAttribute('aria-label', 'Chọn "' + v.ten + '" để xoá hàng loạt');
        oChonXoa.style.cssText = 'width:18px;height:18px;flex:none;cursor:pointer;accent-color:var(--xau);margin-top:2px';
        oChonXoa.addEventListener('change', () => {
          if (oChonXoa.checked) daChon.add(v.id); else daChon.delete(v.id);
          ve();
        });
        dongDau.append(oChonXoa);

        const giua = e('div');
        giua.style.cssText = 'flex:1;min-width:0';
        giua.append(e('h3', null, v.ten || 'Video chưa đặt tên'));
        giua.append(e('p', 'trong', `${(v.coByte / 1_000_000).toFixed(1)} MB`));
        dongDau.append(giua);

        dongDau.append(nut('🗑', 'nut-xoa-anh nut-nho', () => {
          moHopThoai('Xoá video này khỏi thư viện?', e('p', null, `Xoá "${v.ten}"? Không thể hoàn tác.`), [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá', 'nut-xau', async () => {
              try {
                await api('/api/gv/thu-vien-video?id=' + v.id, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá', 'tot');
                daChon.delete(v.id);
                ve();
              } catch (err) { nhac(err.message, 'xau'); }
            }),
          ]);
        }, 'Xoá video: ' + v.ten));
        muc.append(dongDau);

        const vid = e('video');
        vid.controls = true;
        vid.preload = 'metadata';
        vid.src = '/api/thu-vien-tep?loai=video&id=' + v.id;
        vid.style.cssText = 'width:100%;max-height:200px;border-radius:8px;display:block;margin-top:10px;background:#000';
        muc.append(vid);

        luoi.append(muc);
      });
      khung.append(luoi);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

export async function trangHinhAnh(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());
  const daChon = new Set();   // id các ảnh đang tích chọn để xoá hàng loạt

  async function ve() {
    const d = await api('/api/gv/anh');

    const khung = e('div');
    const dungLuongMB = (d.tongByte / 1048576).toFixed(1);
    const nutXoaTatCa = d.soAnh ? nut('🗑 Xoá tất cả', 'nut-nhe nut-nho', () => {
      moHopThoai('Xoá TOÀN BỘ thư viện Ảnh?', [
        e('p', null, `Toàn bộ ${d.soAnh} ảnh sẽ mất hết.`),
        e('p', 'trong', 'Không thể hoàn tác.'),
      ], [
        nut('Huỷ', 'nut-nhe', dongHopThoai),
        nut('Xoá tất cả', 'nut-xau', async (ev) => {
          ev.currentTarget.disabled = true;
          try {
            await api('/api/gv/anh?tatCa=1', { method: 'DELETE' });
            dongHopThoai();
            nhac('Đã xoá toàn bộ thư viện', 'tot');
            daChon.clear();
            ve();
          } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
        }),
      ]);
    }) : null;
    khung.append(tieuDeTrang('Thư viện Ảnh',
      d.soAnh ? `${d.soAnh} ảnh · Dung lượng: ${dungLuongMB} MB` : 'Chưa có ảnh nào',
      nut('🗑 Thùng rác', 'nut-vien nut-nho', () => { location.hash = '#/hinh-anh-thung-rac'; }),
      ...(nutXoaTatCa ? [nutXoaTatCa] : [])));

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

    // Thanh "Đã chọn N — Bỏ chọn / Xoá đã chọn", chỉ hiện khi có tích chọn.
    if (daChon.size) {
      const thanh = e('div', 'the');
      thanh.style.cssText = 'margin-top:14px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-color:var(--xau)';
      thanh.append(e('span', null, `Đã chọn ${daChon.size}/${d.danhSach.length} ảnh`));
      const hop = e('div', 'day-loc');
      if (daChon.size < d.danhSach.length) {
        hop.append(nut('Chọn tất cả', 'nut-nhe nut-nho', () => { d.danhSach.forEach((a) => daChon.add(a.id)); ve(); }));
      }
      hop.append(
        nut('Bỏ chọn', 'nut-nhe nut-nho', () => { daChon.clear(); ve(); }),
        nut(`🗑 Xoá ${daChon.size} ảnh đã chọn`, 'nut-xau nut-nho', () => {
          moHopThoai(`Xoá ${daChon.size} ảnh đã chọn?`, e('p', null, 'Không thể hoàn tác.'), [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá', 'nut-xau', async (ev) => {
              ev.currentTarget.disabled = true;
              try {
                await api(`/api/gv/anh?ids=${[...daChon].join(',')}`, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá', 'tot');
                daChon.clear();
                ve();
              } catch (err) { nhac(err.message, 'xau'); ev.currentTarget.disabled = false; }
            }),
          ]);
        })
      );
      thanh.append(hop);
      khung.append(thanh);
    }

    // Danh sách ảnh đã có
    if (!d.danhSach.length) {
      khung.append(Object.assign(e('p', 'trong', 'Chưa có ảnh nào.'), { style: 'margin-top:16px' }));
    } else {
      const luoi = e('div', 'thu-vien');
      luoi.style.marginTop = '18px';
      d.danhSach.forEach((a) => {
        const hinh = e('figure', 'the-anh-gv');
        hinh.style.position = 'relative';
        const img = e('img');
        img.src = '/api/anh?khoa=' + encodeURIComponent(a.khoa);
        img.alt = a.chuThich || 'Ảnh hoạt động của lớp';
        img.loading = 'lazy';
        img.style.cursor = 'pointer';
        img.title = 'Bấm để xem ảnh kích thước đầy đủ';
        img.addEventListener('click', () => {
          window.open('/api/anh?khoa=' + encodeURIComponent(a.khoa), '_blank');
        });
        hinh.append(img);

        const oChonXoa = e('input');
        oChonXoa.type = 'checkbox';
        oChonXoa.checked = daChon.has(a.id);
        oChonXoa.setAttribute('aria-label', 'Chọn ảnh ' + ngayVN(a.ngay) + ' để xoá hàng loạt');
        oChonXoa.style.cssText = 'position:absolute;top:8px;left:8px;width:20px;height:20px;cursor:pointer;accent-color:var(--xau);box-shadow:0 1px 4px rgba(0,0,0,.6);border-radius:4px;z-index:2';
        oChonXoa.addEventListener('change', () => {
          if (oChonXoa.checked) daChon.add(a.id); else daChon.delete(a.id);
          ve();
        });
        hinh.append(oChonXoa);

        const chan = e('div', 'the-anh-chan');
        const dongThongTin = e('div', 'the-anh-thong-tin');
        dongThongTin.append(document.createTextNode(`${ngayVN(a.ngay)} · ${Math.round(a.coByte / 1024)} KB`));
        chan.append(dongThongTin);

        if (a.chuThich) {
          const chu = e('div', 'the-anh-chu-thich', a.chuThich);
          chu.title = a.chuThich;
          chan.append(chu);
        }

        const hangNut = e('div', 'the-anh-tac-vu');
        hangNut.append(
          nut('✎ Sửa', 'nut-sua-anh nut-nho', () => suaChuThich(a, ve), 'Sửa chú thích ảnh ' + ngayVN(a.ngay)),
          nut('🗑 Xoá', 'nut-xoa-anh nut-nho', () => {
            moHopThoai('Xoá ảnh này?', e('p', null, a.chuThich || ngayVN(a.ngay)), [
              nut('Huỷ', 'nut-nhe', dongHopThoai),
              nut('Xoá', 'nut-xau', async () => {
                try {
                  await api('/api/gv/anh?id=' + a.id, { method: 'DELETE' });
                  dongHopThoai();
                  nhac('Đã xoá ảnh', 'tot');
                  daChon.delete(a.id);
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

/* ---------- Thùng rác của 3 thư viện — cùng dùng chung trangThungRacThuVien(), chỉ khác đường
   API và cách hiển thị ngắn gọn từng loại mục (ảnh xem trước / tên bài / tên video). ---------- */
export async function trangHinhAnhThungRac(KHUNG) {
  await trangThungRacThuVien(KHUNG, {
    duongApi: '/api/gv/anh',
    tieuDe: 'Ảnh',
    veTrangTruoc: '#/hinh-anh',
    hienThi: (a) => {
      const hop = e('div');
      hop.style.cssText = 'display:flex;gap:10px;align-items:center;margin-top:8px;';
      const img = e('img');
      img.src = '/api/anh?khoa=' + encodeURIComponent(a.khoa);
      img.alt = a.chuThich || 'Ảnh hoạt động của lớp';
      img.style.cssText = 'width:64px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0;';
      hop.append(img, e('span', null, a.chuThich || '(không có chú thích)'));
      return hop;
    },
  });
}

export async function trangThuVienAmThanhThungRac(KHUNG) {
  await trangThungRacThuVien(KHUNG, {
    duongApi: '/api/gv/thu-vien-am-thanh',
    tieuDe: 'Âm thanh',
    veTrangTruoc: '#/thu-vien-am-thanh',
    hienThi: (a) => e('p', null, `🎵 ${a.ten} · ${(a.coByte / 1_000_000).toFixed(1)} MB`),
  });
}

export async function trangThuVienVideoThungRac(KHUNG) {
  await trangThungRacThuVien(KHUNG, {
    duongApi: '/api/gv/thu-vien-video',
    tieuDe: 'Video',
    veTrangTruoc: '#/thu-vien-video',
    hienThi: (a) => e('p', null, `🎬 ${a.ten} · ${(a.coByte / 1_000_000).toFixed(1)} MB`),
  });
}
