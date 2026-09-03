// GET /api/gv/tong-quan — bảng điều khiển của giáo viên chủ nhiệm.
import { bocXuLy, json } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const homNay = url.searchParams.get('ngay') || new Date().toISOString().slice(0, 10);

  // 30 ngày gần nhất tính từ ngày đang xem.
  const tuNgay = new Date(homNay + 'T00:00:00Z');
  tuNgay.setUTCDate(tuNgay.getUTCDate() - 30);
  const moc = tuNgay.toISOString().slice(0, 10);

  const [siSo, ddHomNay, vangNhieu, theoDoi, nhatKy, keHoachToi, hoanCanh, nhatKyChuaXuLy, viPhamKhen] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS n FROM hoc_sinh WHERE dang_hoc = 1').first(),

    db.prepare(
      `SELECT buoi, trang_thai AS trangThai, COUNT(*) AS n
         FROM diem_danh WHERE ngay = ?1 GROUP BY buoi, trang_thai`
    ).bind(homNay).all(),

    db.prepare(
      `SELECT h.id, h.ho_ten AS hoTen,
              SUM(CASE WHEN d.trang_thai = 'vang_khong_phep' THEN 1 ELSE 0 END) AS vangKhongPhep,
              SUM(CASE WHEN d.trang_thai = 'vang_phep' THEN 1 ELSE 0 END) AS vangPhep,
              SUM(CASE WHEN d.trang_thai = 'tre' THEN 1 ELSE 0 END) AS tre
         FROM hoc_sinh h JOIN diem_danh d ON d.hoc_sinh_id = h.id
        WHERE d.ngay >= ?1 AND d.trang_thai <> 'co_mat'
        GROUP BY h.id
        HAVING vangKhongPhep + vangPhep + tre > 0
        ORDER BY vangKhongPhep DESC, vangPhep DESC LIMIT 10`
    ).bind(moc).all(),

    db.prepare(
      `SELECT muc, trang_thai AS trangThai, COUNT(*) AS n
         FROM theo_doi GROUP BY muc, trang_thai`
    ).all(),

    db.prepare(
      `SELECT n.id, n.ngay, n.loai, n.noi_dung AS noiDung, n.da_xu_ly AS daXuLy,
              h.ho_ten AS hoTen, h.id AS hocSinhId
         FROM nhat_ky n LEFT JOIN hoc_sinh h ON h.id = n.hoc_sinh_id
        ORDER BY n.ngay DESC, n.id DESC LIMIT 15`
    ).all(),

    db.prepare(
      `SELECT id, ngay, tieu_de AS tieuDe, muc_do AS mucDo
         FROM ke_hoach WHERE ngay >= ?1 AND hoan_thanh = 0 ORDER BY ngay LIMIT 5`
    ).bind(homNay).all(),

    db.prepare(
      `SELECT id, ho_ten AS hoTen, hoan_canh AS hoanCanh
         FROM hoc_sinh WHERE dang_hoc = 1 AND hoan_canh <> '' ORDER BY id`
    ).all(),

    // Việc còn tồn đọng — cũ nhất lên trước, để không bị quên lâu ngày.
    db.prepare(
      `SELECT n.id, n.ngay, n.loai, n.noi_dung AS noiDung,
              h.ho_ten AS hoTen, h.id AS hocSinhId
         FROM nhat_ky n LEFT JOIN hoc_sinh h ON h.id = n.hoc_sinh_id
        WHERE n.da_xu_ly = 0
        ORDER BY n.ngay ASC, n.id ASC LIMIT 20`
    ).all(),

    // Khen/vi phạm trong 30 ngày gần nhất — để gộp với chuyên cần thành "Cần chú ý".
    db.prepare(
      `SELECT hoc_sinh_id AS hocSinhId,
              SUM(CASE WHEN loai = 'vi_pham' THEN 1 ELSE 0 END) AS soViPham,
              SUM(CASE WHEN loai = 'khen' THEN 1 ELSE 0 END) AS soKhen
         FROM nhat_ky
        WHERE ngay >= ?1 AND hoc_sinh_id IS NOT NULL
        GROUP BY hoc_sinh_id`
    ).bind(moc).all(),
  ]);

  // --- Cần chú ý: hợp nhất chuyên cần (vắng nhiều) + hạnh kiểm (vi phạm/khen), xếp theo điểm rủi ro ---
  const diemVpk = {};
  viPhamKhen.results.forEach((r) => { diemVpk[r.hocSinhId] = r; });
  const theoHs = {};
  vangNhieu.results.forEach((h) => { theoHs[h.id] = { ...h, soViPham: 0, soKhen: 0 }; });
  // Cần lấy cả em có vi phạm/khen nhưng KHÔNG nằm trong danh sách vắng nhiều — nạp tên cho các em đó.
  const idThieu = viPhamKhen.results.map((r) => r.hocSinhId).filter((id) => !theoHs[id]);
  let tenThieu = [];
  if (idThieu.length) {
    const cho = idThieu.map((_, i) => `?${i + 1}`).join(',');
    const { results } = await db.prepare(
      `SELECT id, ho_ten AS hoTen FROM hoc_sinh WHERE id IN (${cho})`
    ).bind(...idThieu).all();
    tenThieu = results;
  }
  tenThieu.forEach((h) => { theoHs[h.id] = { id: h.id, hoTen: h.hoTen, vangKhongPhep: 0, vangPhep: 0, tre: 0, soViPham: 0, soKhen: 0 }; });
  Object.values(theoHs).forEach((h) => {
    const vpk = diemVpk[h.id];
    h.soViPham = vpk?.soViPham || 0;
    h.soKhen = vpk?.soKhen || 0;
    h.diemRuiRo = (h.vangKhongPhep || 0) * 2 + (h.vangPhep || 0) * 1 + (h.tre || 0) * 0.5 + h.soViPham * 2 - h.soKhen * 1;
  });
  const canChuY = Object.values(theoHs).filter((h) => h.diemRuiRo > 0).sort((a, b) => b.diemRuiRo - a.diemRuiRo).slice(0, 8);

  // Tổng gộp mọi buổi (giữ để không phá phần đang dùng) + tách riêng theo từng buổi.
  const tongTheoTrangThai = {};
  const theoBuoi = {};
  ddHomNay.results.forEach((r) => {
    tongTheoTrangThai[r.trangThai] = (tongTheoTrangThai[r.trangThai] || 0) + r.n;
    theoBuoi[r.buoi] = theoBuoi[r.buoi] || {};
    theoBuoi[r.buoi][r.trangThai] = r.n;
  });

  return json({
    ok: true,
    ngay: homNay,
    siSo: siSo?.n ?? 0,
    diemDanhHomNay: tongTheoTrangThai,
    diemDanhHomNayTheoBuoi: theoBuoi,
    vangNhieu: vangNhieu.results,
    theoDoi: theoDoi.results,
    nhatKy: nhatKy.results,
    keHoachSapToi: keHoachToi.results,
    hoanCanh: hoanCanh.results,
    viecTonDong: nhatKyChuaXuLy.results,
    canChuY,
  });
}, { canGiaoVien: true });
