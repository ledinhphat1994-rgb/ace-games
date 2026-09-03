/* Sổ điểm, thống kê chuyên cần, báo cáo và mã cá nhân. */
import { $, e, datNoiDung, api, homNay, ngayVN, nhac, khoiDangTai } from '/assets/js/chung.js';
import {
  tieuDeTrang, oThongKe, nut, lienKetNut, truong, oNhap, oChon,
  moHopThoai, dongHopThoai, chonHocKi, bieuDoCot, chuThichMau,
} from '/assets/js/giao-dien.js';

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

export async function trangThongKe(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());
  let buoi = '';

  async function ve() {
    const d = await api('/api/gv/thong-ke' + (buoi ? '?buoi=' + buoi : ''));
    veNoiDung(d);
  }

  function veNoiDung(d) {
  const khung = e('div');
  khung.append(tieuDeTrang('Thống kê chuyên cần',
    `Từ ${ngayVN(d.tuNgay)} đến ${ngayVN(d.denNgay)}`));

  const tabBuoi = e('div', 'day-loc');
  tabBuoi.style.marginBottom = '16px';
  [['', 'Cả sáng lẫn chiều'], ['sang', 'Chỉ buổi sáng'], ['chieu', 'Chỉ buổi chiều'], ['hoat_dong', 'Chỉ hoạt động']]
    .forEach(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(buoi === ma));
      b.addEventListener('click', () => { buoi = ma; ve(); });
      tabBuoi.append(b);
    });
  khung.append(tabBuoi);

  const t = d.tongTheoMuc;
  const tong = Object.values(t).reduce((a, b) => a + b, 0) || 1;
  const day = e('div', 'day-so');
  day.append(
    oThongKe(Math.round(((t.co_mat || 0) / tong) * 100) + '%', 'Tỉ lệ chuyên cần', 'tot'),
    oThongKe(String(t.vang_khong_phep || 0), 'Lượt vắng không phép', 'xau'),
    oThongKe(String(t.vang_phep || 0), 'Lượt vắng có phép'),
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
    const d = await api('/api/gv/ma-ca-nhan');
    const chuaCo = d.danhSach.filter((h) => !h.ma).length;

    const khung = e('div');
    khung.append(tieuDeTrang('Mã cá nhân của học sinh',
      'Mỗi em một mã riêng để tự xem chuyên cần, điểm và nhận xét của mình.'));

    const the = e('div', 'the');
    the.append(e('p', null,
      'Học sinh vào trang lớp, bấm “Xem kết quả của tôi”, nhập mã này thì chỉ thấy kết quả '
      + 'của chính mình — không thấy của bạn khác.'));

    const hangNut = e('div', 'day-loc');
    hangNut.style.marginTop = '10px';
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
      nut('🖨 In danh sách mã', 'nut-vien', () => inDanhSachMa(d.danhSach))
    );
    the.append(hangNut);
    khung.append(the);

    const boc = e('div', 'cuon-ngang');
    boc.style.marginTop = '16px';
    const bang = e('table');
    const dau = e('thead');
    const hd = e('tr');
    hd.append(e('th', 'so', 'STT'), e('th', null, 'Họ và tên'), e('th', null, 'Mã cá nhân'), e('th', null, ''));
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
      const tdNut = e('td');
      tdNut.append(nut(h.ma ? 'Cấp lại' : 'Cấp mã', 'nut-nhe nut-nho', async () => {
        try {
          await api('/api/gv/ma-ca-nhan', { method: 'POST', than: { hocSinhId: h.id } });
          nhac('Đã cấp mã mới cho ' + h.hoTen, 'tot');
          ve();
        } catch (err) { nhac(err.message, 'xau'); }
      }));
      tr.append(e('td', 'so', h.id), e('td', null, h.hoTen), tdMa, tdNut);
      than.append(tr);
    });
    bang.append(dau, than);
    boc.append(bang);
    khung.append(boc);

    datNoiDung(KHUNG, khung);
  }

  await ve();
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
          nut('✎', 'nut-nhe nut-nho', () => suaChuThich(a, ve)),
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
          })
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
