// GET /api/gv/bao-cao?loai=...&hocKi=&tuNgay=&denNgay=
// Xuất báo cáo dạng CSV, mở được bằng Excel.
//   loai = danh-sach | chuyen-can | so-diem | nhat-ky | tong-hop
import { bocXuLy, loi, ngayHopLe } from '../../_lib/api.js';
import { gomBangDiem, xepLoaiHocTap } from '../../_lib/tt22.js';

// Excel trên Windows đọc CSV theo bảng mã hệ thống; thêm BOM để không bị lỗi font tiếng Việt.
const BOM = '﻿';

function oCsv(v) {
  const s = String(v ?? '');
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function traVeCsv(tenTep, cacHang) {
  // Dùng dấu chấm phẩy vì Excel bản tiếng Việt tách cột theo dấu này.
  const noiDung = BOM + cacHang.map((h) => h.map(oCsv).join(';')).join('\r\n');
  return new Response(noiDung, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(tenTep)}"`,
      'Cache-Control': 'no-store',
    },
  });
}

const TEN_TRANG_THAI = {
  co_mat: 'Có mặt', tre: 'Đi trễ', vang_phep: 'Vắng có phép', vang_khong_phep: 'Vắng không phép',
};

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const q = new URL(request.url).searchParams;
  const loai = q.get('loai') || 'danh-sach';
  const hocKi = Number(q.get('hocKi')) === 2 ? 2 : 1;

  const denNgay = ngayHopLe(q.get('denNgay')) ? q.get('denNgay') : new Date().toISOString().slice(0, 10);
  let tuNgay = q.get('tuNgay');
  if (!ngayHopLe(tuNgay)) {
    const d = new Date(denNgay + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 30);
    tuNgay = d.toISOString().slice(0, 10);
  }

  const ngayVN = (v) => (v ? String(v).split('-').reverse().join('/') : '');

  if (loai === 'danh-sach') {
    const { results } = await db.prepare(
      `SELECT id, ho_ten, gioi_tinh, ngay_sinh, lop_nghe, to_hop, chuc_vu, to_so, dien_thoai_ph, hoan_canh, ghi_chu
         FROM hoc_sinh WHERE dang_hoc = 1 ORDER BY id`
    ).all();

    return traVeCsv('danh-sach-lop-10A7.csv', [
      ['DANH SÁCH LỚP 10A7 — NĂM HỌC 2026-2027'],
      ['Trung tâm GDNN – GDTX xã Định Quán, tỉnh Đồng Nai'],
      [],
      ['STT', 'Họ và tên', 'Giới tính', 'Ngày sinh', 'Lớp nghề', 'Tổ hợp', 'Chức vụ', 'Tổ', 'ĐT phụ huynh', 'Hoàn cảnh', 'Ghi chú'],
      ...results.map((h) => [h.id, h.ho_ten, h.gioi_tinh, ngayVN(h.ngay_sinh), h.lop_nghe,
        h.to_hop, h.chuc_vu, h.to_so || '', h.dien_thoai_ph, h.hoan_canh, h.ghi_chu]),
    ]);
  }

  if (loai === 'chuyen-can') {
    const { results } = await db.prepare(
      `SELECT h.id, h.ho_ten,
              COUNT(d.ngay) AS tong,
              SUM(CASE WHEN d.trang_thai = 'co_mat' THEN 1 ELSE 0 END) AS co_mat,
              SUM(CASE WHEN d.trang_thai = 'tre' THEN 1 ELSE 0 END) AS tre,
              SUM(CASE WHEN d.trang_thai = 'vang_phep' THEN 1 ELSE 0 END) AS vang_phep,
              SUM(CASE WHEN d.trang_thai = 'vang_khong_phep' THEN 1 ELSE 0 END) AS vang_khong_phep
         FROM hoc_sinh h LEFT JOIN diem_danh d
           ON d.hoc_sinh_id = h.id AND d.ngay BETWEEN ?1 AND ?2
        WHERE h.dang_hoc = 1 GROUP BY h.id ORDER BY h.id`
    ).bind(tuNgay, denNgay).all();

    return traVeCsv(`chuyen-can-10A7-${tuNgay}-den-${denNgay}.csv`, [
      ['BÁO CÁO CHUYÊN CẦN LỚP 10A7'],
      [`Từ ngày ${ngayVN(tuNgay)} đến ngày ${ngayVN(denNgay)}`],
      [],
      ['STT', 'Họ và tên', 'Tổng buổi', 'Có mặt', 'Đi trễ', 'Vắng có phép', 'Vắng không phép', 'Tỉ lệ chuyên cần (%)'],
      ...results.map((h) => [h.id, h.ho_ten, h.tong, h.co_mat, h.tre, h.vang_phep, h.vang_khong_phep,
        h.tong ? Math.round((h.co_mat / h.tong) * 100) : '']),
    ]);
  }

  if (loai === 'nhat-ky') {
    const { results } = await db.prepare(
      `SELECT n.ngay, n.loai, n.noi_dung, n.da_xu_ly, h.ho_ten
         FROM nhat_ky n LEFT JOIN hoc_sinh h ON h.id = n.hoc_sinh_id
        WHERE n.ngay BETWEEN ?1 AND ?2 ORDER BY n.ngay DESC`
    ).bind(tuNgay, denNgay).all();

    const TEN_LOAI = { khen: 'Khen thưởng', nhac_nho: 'Nhắc nhở', vi_pham: 'Vi phạm', ho_tro: 'Cần hỗ trợ', khac: 'Khác' };
    return traVeCsv(`nhat-ky-10A7-${tuNgay}-den-${denNgay}.csv`, [
      ['SỔ NHẬT KÝ CHỦ NHIỆM LỚP 10A7'],
      [`Từ ngày ${ngayVN(tuNgay)} đến ngày ${ngayVN(denNgay)}`],
      [],
      ['Ngày', 'Loại', 'Học sinh', 'Nội dung', 'Đã xử lý'],
      ...results.map((n) => [ngayVN(n.ngay), TEN_LOAI[n.loai] || n.loai,
        n.ho_ten || 'Cả lớp', n.noi_dung, n.da_xu_ly ? 'Rồi' : 'Chưa']),
    ]);
  }

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

    return traVeCsv(`so-diem-10A7-hoc-ki-${hocKi}.csv`, [
      [`SỔ ĐIỂM LỚP 10A7 — HỌC KÌ ${hocKi} — NĂM HỌC 2026-2027`],
      ['Điểm trung bình môn tính theo Thông tư 22/2021/TT-BGDĐT'],
      [],
      ['STT', 'Họ và tên', ...cacMon.map((m) => m.ten), 'TB chung', 'Học lực', 'Rèn luyện'],
      ...hocSinh.map((h) => {
        const bang = gomBangDiem(theoHs[h.id] || [], cacMon);
        const oDiem = cacMon.map((m) => (m.cach_danh_gia === 'diem'
          ? (bang[m.ma].dtb ?? '')
          : (bang[m.ma].nhanXet === 'CD' ? 'Chưa đạt' : bang[m.ma].nhanXet === 'D' ? 'Đạt' : '')));

        const coDiem = cacMon.filter((m) => m.cach_danh_gia === 'diem' && bang[m.ma].dtb !== null);
        const tb = coDiem.length
          ? Math.round((coDiem.reduce((a, m) => a + bang[m.ma].dtb, 0) / coDiem.length) * 10) / 10 : '';

        const xl = xepLoaiHocTap(cacMon.map((m) => ({
          cachDanhGia: m.cach_danh_gia, dtb: bang[m.ma].dtb, nhanXet: bang[m.ma].nhanXet,
        })));

        return [h.id, h.ho_ten, ...oDiem, tb, xl || '', rl[h.id] || ''];
      }),
    ]);
  }

  if (loai === 'tong-hop') {
    const { results } = await db.prepare(
      `SELECT h.id, h.ho_ten, h.gioi_tinh, h.lop_nghe, h.chuc_vu, h.hoan_canh, h.dien_thoai_ph,
              SUM(CASE WHEN d.trang_thai = 'vang_khong_phep' THEN 1 ELSE 0 END) AS vang_khong_phep,
              SUM(CASE WHEN d.trang_thai = 'vang_phep' THEN 1 ELSE 0 END) AS vang_phep,
              (SELECT COUNT(*) FROM nhat_ky n WHERE n.hoc_sinh_id = h.id AND n.loai = 'vi_pham') AS vi_pham,
              (SELECT COUNT(*) FROM nhat_ky n WHERE n.hoc_sinh_id = h.id AND n.loai = 'khen') AS khen,
              (SELECT trang_thai FROM theo_doi t WHERE t.hoc_sinh_id = h.id AND t.muc = 'sgk') AS sgk,
              (SELECT trang_thai FROM theo_doi t WHERE t.hoc_sinh_id = h.id AND t.muc = 'dong_phuc') AS dong_phuc
         FROM hoc_sinh h LEFT JOIN diem_danh d ON d.hoc_sinh_id = h.id
        WHERE h.dang_hoc = 1 GROUP BY h.id ORDER BY h.id`
    ).all();

    return traVeCsv('tong-hop-10A7.csv', [
      ['BÁO CÁO TỔNG HỢP LỚP 10A7 — NĂM HỌC 2026-2027'],
      [`Xuất ngày ${ngayVN(denNgay)}`],
      [],
      ['STT', 'Họ và tên', 'Giới tính', 'Lớp nghề', 'Chức vụ', 'Hoàn cảnh', 'ĐT phụ huynh',
       'Vắng không phép', 'Vắng có phép', 'Lượt vi phạm', 'Lượt khen', 'Sách giáo khoa', 'Đồng phục'],
      ...results.map((h) => [h.id, h.ho_ten, h.gioi_tinh, h.lop_nghe, h.chuc_vu, h.hoan_canh,
        h.dien_thoai_ph, h.vang_khong_phep, h.vang_phep, h.vi_pham, h.khen, h.sgk || '', h.dong_phuc || '']),
    ]);
  }

  return loi('Loại báo cáo không hợp lệ.', 400);
}, { canGiaoVien: true });
