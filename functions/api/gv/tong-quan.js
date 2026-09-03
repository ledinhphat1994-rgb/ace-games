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

  const [siSo, ddHomNay, vangNhieu, theoDoi, nhatKy, keHoachToi, hoanCanh] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS n FROM hoc_sinh WHERE dang_hoc = 1').first(),

    db.prepare(
      `SELECT trang_thai AS trangThai, COUNT(*) AS n
         FROM diem_danh WHERE ngay = ?1 GROUP BY trang_thai`
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
  ]);

  return json({
    ok: true,
    ngay: homNay,
    siSo: siSo?.n ?? 0,
    diemDanhHomNay: Object.fromEntries(ddHomNay.results.map((r) => [r.trangThai, r.n])),
    vangNhieu: vangNhieu.results,
    theoDoi: theoDoi.results,
    nhatKy: nhatKy.results,
    keHoachSapToi: keHoachToi.results,
    hoanCanh: hoanCanh.results,
  });
}, { canGiaoVien: true });
