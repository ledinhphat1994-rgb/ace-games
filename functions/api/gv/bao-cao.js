// GET /api/gv/bao-cao?loai=...&dinhDang=excel|csv&hocKi=&tuNgay=&denNgay=
// Xuất báo cáo chuyên nghiệp mở được trực tiếp bằng Microsoft Excel:
//   dinhDang = 'excel' (.xls, bảng tính định dạng sư phạm chuẩn)
//   dinhDang = 'csv'   (.csv, có chỉ thị sep=; và UTF-8 BOM để Excel tự động tách cột)
//
// 10 danh mục báo cáo đồng bộ 100% với Vùng 1:
//   - Lớp học: diem-danh, hoc-sinh, so-diem, nhat-ky, thu-quy
//   - Trang lớp: ke-hoach, thong-bao, thoi-khoa-bieu
//   - Báo cáo & Tài khoản: thong-ke, ma-ca-nhan
import { bocXuLy, loi, ngayHopLe } from '../../_lib/api.js';
import { gomBangDiem, xepLoaiHocTap } from '../../_lib/tt22.js';
import { CAC_QUYEN } from './tai-khoan-phu.js';

const BOM = '\uFEFF';

function oCsv(v) {
  const s = String(v ?? '');
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function escapeHtml(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layGiaTriO(o) {
  if (o !== null && typeof o === 'object' && 'v' in o) return o.v;
  return o;
}

// Xuất file CSV chuẩn có BOM và chỉ thị sep=; ở đầu tệp
function traVeCsv(tenTep, { tieuDe, phuDe, tieuDeCot, cacHang, tongCong, ghiChu }) {
  const dong = [
    [tieuDe],
    phuDe ? [phuDe] : [],
    [],
    tieuDeCot,
    ...cacHang.map((hang) => hang.map(layGiaTriO)),
  ];

  if (tongCong && tongCong.length) {
    dong.push(tongCong.map(layGiaTriO));
  }

  if (ghiChu && ghiChu.length) {
    dong.push([]);
    ghiChu.forEach((gc) => dong.push([gc]));
  }

  const noiDung = BOM + 'sep=;\r\n' + dong.map((h) => h.map(oCsv).join(';')).join('\r\n');
  return new Response(noiDung, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(tenTep)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

// Xuất file Excel chuyên nghiệp (.xls) mở ngay trong Microsoft Excel với bố cục chuẩn văn bản giáo dục
function traVeExcel(tenTep, { tieuDe, phuDe, tieuDeCot, cacHang, tongCong, thongKeThem, ghiChu }) {
  const soCot = Math.max(tieuDeCot.length, 6);
  const cotTrai = Math.floor(soCot / 2);
  const cotPhai = soCot - cotTrai;

  const homNay = new Date();
  const ngayStr = `Định Quán, ngày ${String(homNay.getDate()).padStart(2, '0')} tháng ${String(homNay.getMonth() + 1).padStart(2, '0')} năm ${homNay.getFullYear()}`;

  let hangThemHtml = '';
  if (thongKeThem && thongKeThem.length) {
    hangThemHtml = `
      <tr class="no-border"><td colspan="${soCot}" class="no-border" style="height: 10px;"></td></tr>
      <tr class="no-border"><td colspan="${soCot}" class="no-border" style="font-weight: bold; color: #1e3a8a; font-size: 11pt;">THỐNG KÊ TỔNG HỢP:</td></tr>
      ${thongKeThem.map((tk) => `
        <tr class="no-border">
          <td colspan="2" class="no-border" style="font-weight: bold; color: #334155;">${escapeHtml(tk.nhan)}:</td>
          <td colspan="${soCot - 2}" class="no-border" style="color: #0f172a;">${escapeHtml(tk.giaTri)}</td>
        </tr>
      `).join('')}
      <tr class="no-border"><td colspan="${soCot}" class="no-border" style="height: 10px;"></td></tr>
    `;
  }

  const theadHtml = `
    <tr>
      ${tieuDeCot.map((tc) => `<th>${escapeHtml(tc)}</th>`).join('')}
    </tr>
  `;

  const tbodyHtml = cacHang.map((hang, i) => {
    const chanClass = i % 2 === 1 ? 'hang-chan' : '';
    const oHtml = hang.map((o) => {
      let v = o;
      let kieu = 'trai';
      let dam = false;
      let mau = '';

      if (o !== null && typeof o === 'object' && 'v' in o) {
        v = o.v;
        kieu = o.kieu || 'trai';
        dam = Boolean(o.dam);
        mau = o.mau || '';
      }

      let cls = `c-${kieu}`;
      if (dam) cls += ' dam';
      const style = mau ? ` style="color: ${mau};"` : '';

      return `<td class="${cls}"${style}>${escapeHtml(v)}</td>`;
    }).join('');

    return `<tr class="${chanClass}">${oHtml}</tr>`;
  }).join('');

  let tfootHtml = '';
  if (tongCong && tongCong.length) {
    const oTong = tongCong.map((o) => {
      let v = o;
      let kieu = 'trai';
      if (o !== null && typeof o === 'object' && 'v' in o) {
        v = o.v;
        kieu = o.kieu || 'trai';
      }
      return `<td class="tong-cong c-${kieu}">${escapeHtml(v)}</td>`;
    }).join('');
    tfootHtml = `<tfoot><tr>${oTong}</tr></tfoot>`;
  }

  let ghiChuHtml = '';
  if (ghiChu && ghiChu.length) {
    ghiChuHtml = `
      <tr class="no-border"><td colspan="${soCot}" class="no-border" style="height: 10px;"></td></tr>
      ${ghiChu.map((gc) => `
        <tr class="no-border">
          <td colspan="${soCot}" class="no-border" style="font-style: italic; color: #64748b; font-size: 9.5pt;">* ${escapeHtml(gc)}</td>
        </tr>
      `).join('')}
    `;
  }

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="ProgId" content="Excel.Sheet">
  <meta name="Generator" content="Microsoft Excel">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Báo cáo 10A7</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
            <x:Print>
              <x:ValidPrinterInfo/>
              <x:PaperSizeIndex>9</x:PaperSizeIndex>
              <x:HorizontalResolution>600</x:HorizontalResolution>
              <x:VerticalResolution>600</x:VerticalResolution>
            </x:Print>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #0f172a; }
    table { border-collapse: collapse; width: 100%; }
    th {
      background-color: #1e3a8a;
      color: #ffffff;
      font-weight: bold;
      text-align: center;
      vertical-align: middle;
      border: 0.5pt solid #000000;
      padding: 7px 5px;
      font-size: 10pt;
    }
    td {
      border: 0.5pt solid #94a3b8;
      padding: 5px 6px;
      font-size: 10pt;
      vertical-align: middle;
    }
    .no-border { border: none !important; }
    .hdr-don-vi { font-size: 10pt; font-weight: bold; text-align: center; text-transform: uppercase; }
    .hdr-lop { font-size: 10pt; font-weight: bold; text-align: center; color: #1e3a8a; }
    .hdr-quoc-hieu { font-size: 10pt; font-weight: bold; text-align: center; text-transform: uppercase; }
    .hdr-tieu-ngu { font-size: 9.5pt; font-style: italic; text-align: center; text-decoration: underline; }
    .tieu-de-chinh {
      font-size: 15pt;
      font-weight: bold;
      text-align: center;
      color: #1e3a8a;
      text-transform: uppercase;
      padding: 10px 0 3px 0;
    }
    .phu-de { font-size: 10pt; font-style: italic; text-align: center; color: #475569; padding-bottom: 10px; }
    .dam { font-weight: bold; }
    .c-giua { text-align: center; }
    .c-trai { text-align: left; }
    .c-phai { text-align: right; }
    .c-chuoi { mso-number-format: "\\@"; text-align: center; }
    .c-tien { mso-number-format: "\\#\\,\\#\\#0"; text-align: right; }
    .c-phantram { mso-number-format: "0\\%"; text-align: right; }
    .hang-chan { background-color: #f8fafc; }
    .tong-cong {
      background-color: #e2e8f0;
      font-weight: bold;
      border-top: 1pt solid #000000;
      border-bottom: 1pt solid #000000;
    }
    .chu-ky-title { font-weight: bold; text-align: center; font-size: 10.5pt; }
    .chu-ky-sub { font-style: italic; text-align: center; font-size: 9pt; color: #64748b; }
    .chu-ky-space { height: 60px; }
  </style>
</head>
<body>
  <table>
    <!-- Phần Quốc hiệu & Cơ quan ban hành -->
    <tr class="no-border">
      <td colspan="${cotTrai}" class="no-border hdr-don-vi">TRUNG TÂM GDNN – GDTX ĐỊNH QUÁN</td>
      <td colspan="${cotPhai}" class="no-border hdr-quoc-hieu">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</td>
    </tr>
    <tr class="no-border">
      <td colspan="${cotTrai}" class="no-border hdr-lop">LỚP 10A7 — NĂM HỌC 2026-2027</td>
      <td colspan="${cotPhai}" class="no-border hdr-tieu-ngu">Độc lập – Tự do – Hạnh phúc</td>
    </tr>
    <tr class="no-border"><td colspan="${soCot}" class="no-border" style="height: 12px;"></td></tr>

    <!-- Tiêu đề báo cáo -->
    <tr class="no-border">
      <td colspan="${soCot}" class="no-border tieu-de-chinh">${escapeHtml(tieuDe)}</td>
    </tr>
    ${phuDe ? `<tr class="no-border"><td colspan="${soCot}" class="no-border phu-de">${escapeHtml(phuDe)}</td></tr>` : ''}

    ${hangThemHtml}

    <!-- Bảng dữ liệu chính -->
    ${theadHtml}
    ${tbodyHtml}
    ${tfootHtml}

    ${ghiChuHtml}

    <!-- Phần ký duyệt cuối báo cáo -->
    <tr class="no-border"><td colspan="${soCot}" class="no-border" style="height: 20px;"></td></tr>
    <tr class="no-border">
      <td colspan="${cotTrai}" class="no-border"></td>
      <td colspan="${cotPhai}" class="no-border" style="text-align: center; font-style: italic; font-size: 10pt;">${escapeHtml(ngayStr)}</td>
    </tr>
    <tr class="no-border">
      <td colspan="${cotTrai}" class="no-border chu-ky-title">NGƯỜI LẬP BÁO CÁO</td>
      <td colspan="${cotPhai}" class="no-border chu-ky-title">GIÁO VIÊN CHỦ NHIỆM</td>
    </tr>
    <tr class="no-border">
      <td colspan="${cotTrai}" class="no-border chu-ky-sub">(Ký và ghi rõ họ tên)</td>
      <td colspan="${cotPhai}" class="no-border chu-ky-sub">(Ký và ghi rõ họ tên)</td>
    </tr>
    <tr class="no-border chu-ky-space">
      <td colspan="${cotTrai}" class="no-border"></td>
      <td colspan="${cotPhai}" class="no-border"></td>
    </tr>
    <tr class="no-border">
      <td colspan="${cotTrai}" class="no-border" style="text-align: center; font-weight: bold;"></td>
      <td colspan="${cotPhai}" class="no-border" style="text-align: center; font-weight: bold; color: #1e3a8a;">Lê Đình Phát</td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return new Response(BOM + html, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(tenTep)}.xls"`,
      'Cache-Control': 'no-store',
    },
  });
}

function phanHoiBaoCao(dinhDang, tenTepGoc, duLieu) {
  if (dinhDang === 'csv') {
    return traVeCsv(tenTepGoc, duLieu);
  }
  return traVeExcel(tenTepGoc, duLieu);
}

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const q = new URL(request.url).searchParams;
  const loai = q.get('loai') || 'hoc-sinh';
  const dinhDang = (q.get('dinhDang') || 'excel').toLowerCase() === 'csv' ? 'csv' : 'excel';
  const hocKi = Number(q.get('hocKi')) === 2 ? 2 : 1;

  const denNgay = ngayHopLe(q.get('denNgay')) ? q.get('denNgay') : new Date().toISOString().slice(0, 10);
  let tuNgay = q.get('tuNgay');
  if (!ngayHopLe(tuNgay)) {
    const d = new Date(denNgay + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 30);
    tuNgay = d.toISOString().slice(0, 10);
  }

  const ngayVN = (v) => (v ? String(v).split('-').reverse().join('/') : '');

  // 1. MỤC: ĐIỂM DANH (Khớp mục "Điểm danh" trong Vùng 1)
  if (loai === 'diem-danh' || loai === 'chuyen-can') {
    const { results } = await db.prepare(
      `SELECT h.id, h.ho_ten, h.to_so,
              COUNT(d.ngay) AS tong,
              SUM(CASE WHEN d.trang_thai = 'co_mat' THEN 1 ELSE 0 END) AS co_mat,
              SUM(CASE WHEN d.trang_thai = 'tre' THEN 1 ELSE 0 END) AS tre,
              SUM(CASE WHEN d.trang_thai = 'vang_phep' THEN 1 ELSE 0 END) AS vang_phep,
              SUM(CASE WHEN d.trang_thai = 'vang_khong_phep' THEN 1 ELSE 0 END) AS vang_khong_phep
         FROM hoc_sinh h LEFT JOIN diem_danh d
           ON d.hoc_sinh_id = h.id AND d.ngay BETWEEN ?1 AND ?2
        WHERE h.dang_hoc = 1 GROUP BY h.id ORDER BY h.id`
    ).bind(tuNgay, denNgay).all();

    let tongBuoi = 0;
    let tongCoMat = 0;
    let tongTre = 0;
    let tongVangPhep = 0;
    let tongVangKp = 0;

    const cacHang = results.map((h, i) => {
      tongBuoi += h.tong;
      tongCoMat += h.co_mat;
      tongTre += h.tre;
      tongVangPhep += h.vang_phep;
      tongVangKp += h.vang_khong_phep;
      const tiLe = h.tong ? Math.round((h.co_mat / h.tong) * 100) : 100;

      return [
        { v: i + 1, kieu: 'giua' },
        { v: String(h.id).padStart(2, '0'), kieu: 'chuoi' },
        { v: h.ho_ten, kieu: 'trai', dam: true },
        { v: h.to_so ? 'Tổ ' + h.to_so : '', kieu: 'giua' },
        { v: h.tong, kieu: 'giua' },
        { v: h.co_mat, kieu: 'giua', mau: '#15803d' },
        { v: h.tre, kieu: 'giua', mau: '#d97706' },
        { v: h.vang_phep, kieu: 'giua', mau: '#0284c7' },
        { v: h.vang_khong_phep, kieu: 'giua', mau: '#dc2626' },
        { v: tiLe + '%', kieu: 'phai', dam: true },
        { v: tiLe < 80 ? 'Cần nhắc nhở' : 'Bình thường', kieu: 'giua' },
      ];
    });

    const tiLeChung = tongBuoi ? Math.round((tongCoMat / tongBuoi) * 100) : 100;
    const tongCong = [
      { v: 'TỔNG CỘNG', kieu: 'giua', dam: true },
      { v: '', kieu: 'giua' },
      { v: `${results.length} học sinh`, kieu: 'trai', dam: true },
      { v: '', kieu: 'giua' },
      { v: tongBuoi, kieu: 'giua', dam: true },
      { v: tongCoMat, kieu: 'giua', dam: true },
      { v: tongTre, kieu: 'giua', dam: true },
      { v: tongVangPhep, kieu: 'giua', dam: true },
      { v: tongVangKp, kieu: 'giua', dam: true },
      { v: tiLeChung + '%', kieu: 'phai', dam: true },
      { v: '', kieu: 'giua' },
    ];

    return phanHoiBaoCao(dinhDang, `Bao_cao_Diem_danh_10A7_${tuNgay}_den_${denNgay}`, {
      tieuDe: 'BÁO CÁO ĐIỂM DANH VÀ CHUYÊN CẦN LỚP 10A7',
      phuDe: `Theo dõi từ ngày ${ngayVN(tuNgay)} đến ngày ${ngayVN(denNgay)}`,
      tieuDeCot: ['STT', 'Mã HS', 'Họ và tên', 'Tổ', 'Tổng buổi', 'Có mặt', 'Đi trễ', 'Vắng phép', 'Không phép', 'Tỉ lệ (%)', 'Đánh giá'],
      cacHang,
      tongCong,
      ghiChu: ['Tỉ lệ chuyên cần tính bằng số buổi có mặt chia cho tổng số buổi điểm danh thực tế.'],
    });
  }

  // 2. MỤC: HỌC SINH (Khớp mục "Học sinh" trong Vùng 1)
  if (loai === 'hoc-sinh' || loai === 'danh-sach') {
    const { results } = await db.prepare(
      `SELECT id, ho_ten, gioi_tinh, ngay_sinh, lop_nghe, to_hop, chuc_vu, to_so, dien_thoai_ph, hoan_canh, ghi_chu
         FROM hoc_sinh WHERE dang_hoc = 1 ORDER BY id`
    ).all();

    const namDem = results.filter((h) => (h.gioi_tinh || '').toLowerCase() === 'nam').length;
    const nuDem = results.length - namDem;

    const cacHang = results.map((h, i) => [
      { v: i + 1, kieu: 'giua' },
      { v: String(h.id).padStart(2, '0'), kieu: 'chuoi' },
      { v: h.ho_ten, kieu: 'trai', dam: true },
      { v: h.gioi_tinh || '', kieu: 'giua' },
      { v: ngayVN(h.ngay_sinh), kieu: 'giua' },
      { v: h.lop_nghe || '', kieu: 'trai' },
      { v: h.to_hop || '', kieu: 'trai' },
      { v: h.to_so ? 'Tổ ' + h.to_so : '', kieu: 'giua' },
      { v: h.chuc_vu || 'Học sinh', kieu: 'giua' },
      { v: h.dien_thoai_ph || '', kieu: 'chuoi' },
      { v: h.hoan_canh || '', kieu: 'trai' },
      { v: h.ghi_chu || '', kieu: 'trai' },
    ]);

    const tongCong = [
      { v: 'TỔNG SỐ', kieu: 'giua', dam: true },
      { v: '', kieu: 'giua' },
      { v: `${results.length} học sinh (Nam: ${namDem}, Nữ: ${nuDem})`, kieu: 'trai', dam: true },
      { v: '', kieu: 'giua' },
      { v: '', kieu: 'giua' },
      { v: '', kieu: 'giua' },
      { v: '', kieu: 'giua' },
      { v: '', kieu: 'giua' },
      { v: '', kieu: 'giua' },
      { v: '', kieu: 'giua' },
      { v: '', kieu: 'giua' },
      { v: '', kieu: 'giua' },
    ];

    return phanHoiBaoCao(dinhDang, 'Bao_cao_Hoc_sinh_10A7', {
      tieuDe: 'BÁO CÁO DANH SÁCH HỌC SINH LỚP 10A7',
      phuDe: `Năm học 2026-2027 — Trích xuất ngày ${ngayVN(denNgay)}`,
      tieuDeCot: ['STT', 'Mã HS', 'Họ và tên', 'Giới tính', 'Ngày sinh', 'Lớp nghề', 'Tổ hợp', 'Tổ', 'Chức vụ', 'ĐT Phụ huynh', 'Hoàn cảnh', 'Ghi chú'],
      cacHang,
      tongCong,
    });
  }

  // 3. MỤC: SỔ ĐIỂM (Khớp mục "Sổ điểm" trong Vùng 1)
  if (loai === 'so-diem') {
    const [{ results: cacMon }, { results: hocSinh }, { results: diem }, { results: renLuyen }] = await Promise.all([
      db.prepare('SELECT ma, ten, cach_danh_gia, so_dgtx FROM mon_hoc WHERE dang_hoc = 1 ORDER BY thu_tu').all(),
      db.prepare('SELECT id, ho_ten FROM hoc_sinh WHERE dang_hoc = 1 ORDER BY id').all(),
      db.prepare('SELECT hoc_sinh_id, mon, loai, so_thu_tu, gia_tri, nhan_xet FROM diem WHERE hoc_ki = ?1').bind(hocKi).all(),
      db.prepare('SELECT hoc_sinh_id, muc FROM ren_luyen WHERE hoc_ki = ?1').bind(hocKi).all(),
    ]);

    const theoHs = {};
    diem.forEach((d) => { (theoHs[d.hoc_sinh_id] = theoHs[d.hoc_sinh_id] || []).push(d); });
    const rl = Object.fromEntries(renLuyen.map((r) => [r.hoc_sinh_id, r.muc]));

    const cacHang = hocSinh.map((h, i) => {
      const bang = gomBangDiem(theoHs[h.id] || [], cacMon);
      const oDiem = cacMon.map((m) => {
        if (m.cach_danh_gia === 'diem') {
          return { v: bang[m.ma].dtb !== null ? bang[m.ma].dtb : '', kieu: 'phai' };
        }
        const nx = bang[m.ma].nhanXet;
        return { v: nx === 'CD' ? 'Chưa đạt' : nx === 'D' ? 'Đạt' : '', kieu: 'giua' };
      });

      const coDiem = cacMon.filter((m) => m.cach_danh_gia === 'diem' && bang[m.ma].dtb !== null);
      const tb = coDiem.length
        ? Math.round((coDiem.reduce((a, m) => a + bang[m.ma].dtb, 0) / coDiem.length) * 10) / 10
        : '';

      const xl = xepLoaiHocTap(cacMon.map((m) => ({
        cachDanhGia: m.cach_danh_gia, dtb: bang[m.ma].dtb, nhanXet: bang[m.ma].nhanXet,
      })));

      return [
        { v: i + 1, kieu: 'giua' },
        { v: h.ho_ten, kieu: 'trai', dam: true },
        ...oDiem,
        { v: tb, kieu: 'phai', dam: true },
        { v: xl || '', kieu: 'giua', dam: true },
        { v: rl[h.id] || '', kieu: 'giua' },
      ];
    });

    const tieuDeCot = ['STT', 'Họ và tên', ...cacMon.map((m) => m.ten), 'ĐTB chung', 'Học lực', 'Rèn luyện'];

    return phanHoiBaoCao(dinhDang, `Bao_cao_So_diem_10A7_Hoc_ki_${hocKi}`, {
      tieuDe: `BÁO CÁO BẢNG ĐIỂM TỔNG HỢP LỚP 10A7 — HỌC KÌ ${hocKi}`,
      phuDe: 'Điểm trung bình và kết quả đánh giá xếp loại theo Thông tư 22/2021/TT-BGDĐT',
      tieuDeCot,
      cacHang,
    });
  }

  // 4. MỤC: NHẬT KÝ LỚP (Khớp mục "Nhật ký lớp" trong Vùng 1)
  if (loai === 'nhat-ky') {
    const { results } = await db.prepare(
      `SELECT n.ngay, n.loai, n.noi_dung, n.da_xu_ly, h.ho_ten
         FROM nhat_ky n LEFT JOIN hoc_sinh h ON h.id = n.hoc_sinh_id
        WHERE n.ngay BETWEEN ?1 AND ?2 ORDER BY n.ngay DESC`
    ).bind(tuNgay, denNgay).all();

    const TEN_LOAI = { khen: 'Khen thưởng', nhac_nho: 'Nhắc nhở', vi_pham: 'Vi phạm', ho_tro: 'Cần hỗ trợ', khac: 'Khác' };
    const cacHang = results.map((n, i) => [
      { v: i + 1, kieu: 'giua' },
      { v: ngayVN(n.ngay), kieu: 'giua' },
      { v: TEN_LOAI[n.loai] || n.loai, kieu: 'giua', dam: true },
      { v: n.ho_ten || 'Cả lớp', kieu: 'trai', dam: Boolean(n.ho_ten) },
      { v: n.noi_dung, kieu: 'trai' },
      { v: n.da_xu_ly ? 'Đã xử lý' : 'Chưa xử lý', kieu: 'giua', mau: n.da_xu_ly ? '#15803d' : '#dc2626' },
    ]);

    return phanHoiBaoCao(dinhDang, `Bao_cao_Nhat_ky_lop_10A7_${tuNgay}_den_${denNgay}`, {
      tieuDe: 'BÁO CÁO SỔ NHẬT KÝ THEO DÕI LỚP 10A7',
      phuDe: `Ghi nhận từ ngày ${ngayVN(tuNgay)} đến ngày ${ngayVN(denNgay)}`,
      tieuDeCot: ['STT', 'Ngày', 'Phân loại', 'Học sinh liên quan', 'Nội dung sự việc / Theo dõi', 'Tình trạng xử lý'],
      cacHang,
    });
  }

  // 5. MỤC: THỦ QUỸ (Khớp mục "Thủ quỹ" trong Vùng 1)
  if (loai === 'thu-quy') {
    const [{ results: cacKhoan }, { results: hocSinh }, { results: cacDong }, { results: cacChi }] = await Promise.all([
      db.prepare('SELECT id, ten, so_tien_moi_em FROM quy_khoan ORDER BY id ASC').all(),
      db.prepare('SELECT id, ho_ten, to_so FROM hoc_sinh WHERE dang_hoc = 1 ORDER BY id').all(),
      db.prepare('SELECT khoan_id, hoc_sinh_id, so_tien FROM quy_dong').all(),
      db.prepare('SELECT id, ngay, noi_dung, so_tien, ghi_chu FROM quy_chi ORDER BY ngay DESC, id DESC').all(),
    ]);

    const dongTheoKhoanHs = {};
    let tongThuThucTe = 0;
    cacDong.forEach((d) => {
      const k = `${d.khoan_id}_${d.hoc_sinh_id}`;
      dongTheoKhoanHs[k] = (dongTheoKhoanHs[k] || 0) + d.so_tien;
      tongThuThucTe += d.so_tien;
    });

    let tongChiThucTe = 0;
    cacChi.forEach((c) => { tongChiThucTe += c.so_tien; });
    const tonQuyHienTai = tongThuThucTe - tongChiThucTe;

    const dinhDangTien = (n) => Number(n || 0).toLocaleString('vi-VN') + ' đ';

    const cacHang = hocSinh.map((h, i) => {
      let tongHsDaDong = 0;
      let tongHsMucThu = 0;

      const oKhoan = cacKhoan.map((k) => {
        const daDong = dongTheoKhoanHs[`${k.id}_${h.id}`] || 0;
        tongHsDaDong += daDong;
        tongHsMucThu += (k.so_tien_moi_em || 0);
        return { v: daDong, kieu: 'tien' };
      });

      const conThieu = Math.max(0, tongHsMucThu - tongHsDaDong);
      let trangThai = 'Đã đóng đủ';
      let mau = '#15803d';
      if (tongHsDaDong === 0 && tongHsMucThu > 0) {
        trangThai = 'Chưa đóng';
        mau = '#dc2626';
      } else if (conThieu > 0) {
        trangThai = `Thiếu ${Number(conThieu).toLocaleString('vi-VN')} đ`;
        mau = '#d97706';
      }

      return [
        { v: i + 1, kieu: 'giua' },
        { v: String(h.id).padStart(2, '0'), kieu: 'chuoi' },
        { v: h.ho_ten, kieu: 'trai', dam: true },
        { v: h.to_so ? 'Tổ ' + h.to_so : '', kieu: 'giua' },
        ...oKhoan,
        { v: tongHsDaDong, kieu: 'tien', dam: true },
        { v: trangThai, kieu: 'giua', dam: true, mau },
      ];
    });

    const oTongKhoan = cacKhoan.map((k) => {
      const tongKhoan = cacDong.filter((d) => d.khoan_id === k.id).reduce((a, b) => a + b.so_tien, 0);
      return { v: tongKhoan, kieu: 'tien', dam: true };
    });

    const tongCong = [
      { v: 'TỔNG THU', kieu: 'giua', dam: true },
      { v: '', kieu: 'giua' },
      { v: `${hocSinh.length} học sinh`, kieu: 'trai', dam: true },
      { v: '', kieu: 'giua' },
      ...oTongKhoan,
      { v: tongThuThucTe, kieu: 'tien', dam: true },
      { v: '', kieu: 'giua' },
    ];

    const tieuDeCot = ['STT', 'Mã HS', 'Họ và tên', 'Tổ', ...cacKhoan.map((k) => k.ten), 'Tổng đã đóng', 'Trạng thái'];

    const thongKeThem = [
      { nhan: 'Tổng số tiền đã thu', giaTri: dinhDangTien(tongThuThucTe) },
      { nhan: 'Tổng số tiền đã chi tiêu', giaTri: dinhDangTien(tongChiThucTe) },
      { nhan: 'Số dư tồn quỹ hiện tại', giaTri: dinhDangTien(tonQuyHienTai) },
    ];

    return phanHoiBaoCao(dinhDang, 'Bao_cao_Thu_quy_10A7', {
      tieuDe: 'BÁO CÁO THU CHI VÀ QUẢN LÝ QUỸ LỚP 10A7',
      phuDe: `Cập nhật đến ngày ${ngayVN(denNgay)}`,
      tieuDeCot,
      cacHang,
      tongCong,
      thongKeThem,
      ghiChu: [
        `Tổng quỹ thu được: ${dinhDangTien(tongThuThucTe)}. Tổng các khoản đã chi: ${dinhDangTien(tongChiThucTe)}. Tồn quỹ thực tế: ${dinhDangTien(tonQuyHienTai)}.`,
      ],
    });
  }

  // 6. MỤC: THÔNG BÁO (Khớp mục "Thông báo" trong Vùng 1)
  if (loai === 'thong-bao') {
    const { results } = await db.prepare(
      `SELECT id, tieu_de, noi_dung, ngay_tao, ghim, nguoi_tao
         FROM thong_bao ORDER BY ngay_tao DESC, id DESC`
    ).all();

    const cacHang = results.map((t, i) => [
      { v: i + 1, kieu: 'giua' },
      { v: ngayVN(t.ngay_tao ? t.ngay_tao.slice(0, 10) : ''), kieu: 'giua' },
      { v: t.tieu_de, kieu: 'trai', dam: true },
      { v: t.noi_dung, kieu: 'trai' },
      { v: t.ghim ? '★ Đang ghim' : 'Bình thường', kieu: 'giua', mau: t.ghim ? '#0284c7' : '' },
      { v: t.nguoi_tao || 'Giáo viên', kieu: 'giua' },
    ]);

    return phanHoiBaoCao(dinhDang, 'Bao_cao_Thong_bao_10A7', {
      tieuDe: 'BÁO CÁO DANH SÁCH THÔNG BÁO LỚP 10A7',
      phuDe: `Tổng hợp toàn bộ thông báo đã ban hành đến ngày ${ngayVN(denNgay)}`,
      tieuDeCot: ['STT', 'Ngày ban hành', 'Tiêu đề thông báo', 'Nội dung chi tiết', 'Trạng thái', 'Người ban hành'],
      cacHang,
    });
  }

  // 7. MỤC: KẾ HOẠCH (Khớp mục "Kế hoạch" trong Vùng 1)
  if (loai === 'ke-hoach') {
    const { results } = await db.prepare(
      `SELECT id, tieu_de, noi_dung, ngay_bat_dau, ngay_ket_thuc, muc_do
         FROM ke_hoach ORDER BY ngay_bat_dau ASC, id ASC`
    ).all();

    const MUC_DO = { quan_trong: 'Quan trọng', can_chu_y: 'Cần chú ý', binh_thuong: 'Bình thường' };

    const cacHang = results.map((k, i) => [
      { v: i + 1, kieu: 'giua' },
      { v: ngayVN(k.ngay_bat_dau), kieu: 'giua' },
      { v: ngayVN(k.ngay_ket_thuc) || 'Trong ngày', kieu: 'giua' },
      { v: k.tieu_de, kieu: 'trai', dam: true },
      { v: k.noi_dung, kieu: 'trai' },
      { v: MUC_DO[k.muc_do] || 'Bình thường', kieu: 'giua', dam: k.muc_do === 'quan_trong' },
    ]);

    return phanHoiBaoCao(dinhDang, 'Bao_cao_Ke_hoach_10A7', {
      tieuDe: 'BÁO CÁO KẾ HOẠCH HOẠT ĐỘNG LỚP 10A7',
      phuDe: 'Lịch trình sự kiện và kế hoạch học tập năm học 2026-2027',
      tieuDeCot: ['STT', 'Từ ngày', 'Đến ngày', 'Tiêu đề kế hoạch / Hoạt động', 'Nội dung chi tiết', 'Mức độ ưu tiên'],
      cacHang,
    });
  }

  // 8. MỤC: THỜI KHOÁ BIỂU (Khớp mục "Thời khoá biểu" trong Vùng 1)
  if (loai === 'thoi-khoa-bieu') {
    const phienBan = await db.prepare(
      `SELECT id, ten, ngay_bat_dau FROM tkb_phien_ban ORDER BY ngay_bat_dau DESC LIMIT 1`
    ).first();

    const cacHang = [];
    if (phienBan) {
      const { results: oTkb } = await db.prepare(
        `SELECT buoi, thu, tiet, mon FROM tkb_o WHERE phien_ban_id = ?1 ORDER BY buoi, tiet, thu`
      ).bind(phienBan.id).all();

      const banDo = {};
      oTkb.forEach((o) => { banDo[`${o.buoi}_${o.tiet}_${o.thu}`] = o.mon; });

      ['sang', 'chieu'].forEach((buoi) => {
        const tenBuoi = buoi === 'sang' ? 'Buổi sáng' : 'Buổi chiều';
        for (let tiet = 1; tiet <= 5; tiet++) {
          const hang = [
            { v: tenBuoi, kieu: 'giua', dam: tiet === 1 },
            { v: `Tiết ${tiet}`, kieu: 'giua' },
          ];
          for (let thu = 2; thu <= 7; thu++) {
            const mon = banDo[`${buoi}_${tiet}_${thu}`] || '—';
            hang.push({ v: mon, kieu: 'giua', dam: mon !== '—' });
          }
          cacHang.push(hang);
        }
      });
    }

    return phanHoiBaoCao(dinhDang, 'Bao_cao_Thoi_khoa_bieu_10A7', {
      tieuDe: 'BÁO CÁO THỜI KHOÁ BIỂU LỚP 10A7',
      phuDe: phienBan ? `Phiên bản: ${phienBan.ten} — Áp dụng từ ngày ${ngayVN(phienBan.ngay_bat_dau)}` : '',
      tieuDeCot: ['Buổi', 'Tiết', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
      cacHang,
    });
  }

  // 9. MỤC: THỐNG KÊ (Khớp mục "Thống kê" trong Vùng 1)
  if (loai === 'thong-ke' || loai === 'tong-hop') {
    const { results } = await db.prepare(
      `SELECT h.id, h.ho_ten, h.gioi_tinh, h.lop_nghe, h.to_so, h.chuc_vu, h.hoan_canh, h.dien_thoai_ph,
              SUM(CASE WHEN d.trang_thai = 'vang_khong_phep' THEN 1 ELSE 0 END) AS vang_khong_phep,
              SUM(CASE WHEN d.trang_thai = 'vang_phep' THEN 1 ELSE 0 END) AS vang_phep,
              SUM(CASE WHEN d.trang_thai = 'tre' THEN 1 ELSE 0 END) AS tre,
              (SELECT COUNT(*) FROM nhat_ky n WHERE n.hoc_sinh_id = h.id AND n.loai = 'vi_pham') AS vi_pham,
              (SELECT COUNT(*) FROM nhat_ky n WHERE n.hoc_sinh_id = h.id AND n.loai = 'khen') AS khen,
              (SELECT trang_thai FROM theo_doi t WHERE t.hoc_sinh_id = h.id AND t.muc = 'sgk') AS sgk,
              (SELECT trang_thai FROM theo_doi t WHERE t.hoc_sinh_id = h.id AND t.muc = 'dong_phuc') AS dong_phuc
         FROM hoc_sinh h LEFT JOIN diem_danh d ON d.hoc_sinh_id = h.id
        WHERE h.dang_hoc = 1 GROUP BY h.id ORDER BY h.id`
    ).all();

    const cacHang = results.map((h, i) => [
      { v: i + 1, kieu: 'giua' },
      { v: String(h.id).padStart(2, '0'), kieu: 'chuoi' },
      { v: h.ho_ten, kieu: 'trai', dam: true },
      { v: h.gioi_tinh || '', kieu: 'giua' },
      { v: h.lop_nghe || '', kieu: 'trai' },
      { v: h.to_so ? 'Tổ ' + h.to_so : '', kieu: 'giua' },
      { v: h.chuc_vu || 'Học sinh', kieu: 'giua' },
      { v: h.vang_phep, kieu: 'giua' },
      { v: h.vang_khong_phep, kieu: 'giua', mau: h.vang_khong_phep > 0 ? '#dc2626' : '' },
      { v: h.tre, kieu: 'giua' },
      { v: h.vi_pham, kieu: 'giua', mau: h.vi_pham > 0 ? '#dc2626' : '' },
      { v: h.khen, kieu: 'giua', mau: h.khen > 0 ? '#15803d' : '' },
      { v: h.sgk === 'du' ? 'Đủ' : h.sgk === 'thieu' ? 'Thiếu' : 'Chưa có', kieu: 'giua' },
      { v: h.dong_phuc === 'roi' ? 'Đã nhận' : 'Chưa nhận', kieu: 'giua' },
    ]);

    return phanHoiBaoCao(dinhDang, 'Bao_cao_Thong_ke_tong_hop_10A7', {
      tieuDe: 'BÁO CÁO THỐNG KÊ TỔNG HỢP LỚP 10A7',
      phuDe: `Báo cáo chuyên cần, nề nếp, sách giáo khoa & đồng phục — Ngày ${ngayVN(denNgay)}`,
      tieuDeCot: ['STT', 'Mã HS', 'Họ và tên', 'Giới tính', 'Lớp nghề', 'Tổ', 'Chức vụ', 'Vắng phép', 'Không phép', 'Đi trễ', 'Vi phạm', 'Khen thưởng', 'Sách GK', 'Đồng phục'],
      cacHang,
    });
  }

  // 10. MỤC: MÃ CÁ NHÂN & PHÂN QUYỀN (Khớp mục "Mã cá nhân" trong Vùng 1)
  if (loai === 'ma-ca-nhan') {
    const { results } = await db.prepare(
      `SELECT h.id, h.ho_ten, h.chuc_vu, h.to_so, m.ma, m.quyen, m.an_muc, t.vai_tro_ten
         FROM hoc_sinh h
         LEFT JOIN ma_ca_nhan m ON m.hoc_sinh_id = h.id
         LEFT JOIN tai_khoan_phu t ON t.hoc_sinh_id = h.id
        WHERE h.dang_hoc = 1 ORDER BY h.id`
    ).all();

    const BAN_DO_QUYEN = Object.fromEntries(CAC_QUYEN);

    const cacHang = results.map((h, i) => {
      const quyenDs = (h.quyen ? h.quyen.split(',') : [])
        .map((q) => BAN_DO_QUYEN[q] || q)
        .filter(Boolean)
        .join(', ');

      return [
        { v: i + 1, kieu: 'giua' },
        { v: String(h.id).padStart(2, '0'), kieu: 'chuoi' },
        { v: h.ho_ten, kieu: 'trai', dam: true },
        { v: h.chuc_vu || 'Học sinh', kieu: 'giua' },
        { v: h.to_so ? 'Tổ ' + h.to_so : '', kieu: 'giua' },
        { v: h.ma || '—', kieu: 'chuoi', dam: true },
        { v: h.vai_tro_ten || (quyenDs ? 'Ban cán sự' : 'Học sinh'), kieu: 'giua' },
        { v: quyenDs || 'Chỉ tra cứu cá nhân', kieu: 'trai' },
      ];
    });

    return phanHoiBaoCao(dinhDang, 'Bao_cao_Ma_ca_nhan_10A7', {
      tieuDe: 'BÁO CÁO MÃ TRA CỨU CÁ NHÂN VÀ PHÂN QUYỀN LỚP 10A7',
      phuDe: 'Danh sách mã bảo mật cá nhân và tài khoản cán sự được phân quyền quản lý',
      tieuDeCot: ['STT', 'Mã HS', 'Họ và tên', 'Chức vụ', 'Tổ', 'Mã cá nhân', 'Vai trò quản trị', 'Quyền thao tác'],
      cacHang,
      ghiChu: ['Mã cá nhân dùng để học sinh xem điểm, chuyên cần và tài khoản cán sự đăng nhập quản lý.'],
    });
  }

  return loi('Loại báo cáo không hợp lệ.', 400);
}, { canGiaoVien: true });
