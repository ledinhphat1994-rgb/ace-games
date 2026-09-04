// GET /api/gv/tuong-tac — số liệu "Tương tác" trên trang lớp: lượt truy cập theo ngày,
// và AI đã truy cập bao nhiêu lần / lần gần nhất (suy ra từ mã cá nhân máy đó đã lưu — nếu
// học sinh chưa từng tra cứu mã, lượt của em tính vào "Ẩn danh"). Đây là nơi tập trung mọi
// số liệu tương tác trong tương lai (chat nhóm, chat cá nhân, trò chơi nhẹ…) — thêm bảng/
// nguồn dữ liệu mới thì gộp vào đây, KHÔNG tạo trang thống kê rời rạc khác.
import { bocXuLy, json } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env }) => {
  const denNgay = new Date().toISOString().slice(0, 10);
  const tuDate = new Date(); tuDate.setUTCDate(tuDate.getUTCDate() - 13);
  const tuNgay = tuDate.toISOString().slice(0, 10);

  const [theoNgay, tongTat, theoHocSinh, tongAnDanh] = await Promise.all([
    env.DB.prepare(
      'SELECT ngay, luot FROM luot_truy_cap WHERE ngay BETWEEN ?1 AND ?2 ORDER BY ngay'
    ).bind(tuNgay, denNgay).all(),
    env.DB.prepare('SELECT COALESCE(SUM(luot), 0) AS n FROM luot_truy_cap').first(),
    env.DB.prepare(
      `SELECT h.id AS hocSinhId, h.ho_ten AS hoTen, COUNT(n.id) AS soLan, MAX(n.thoi_diem) AS lanCuoi
         FROM nhat_ky_truy_cap n JOIN hoc_sinh h ON h.id = n.hoc_sinh_id
        GROUP BY h.id ORDER BY soLan DESC`
    ).all(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM nhat_ky_truy_cap WHERE hoc_sinh_id IS NULL').first(),
  ]);

  const homNayRow = theoNgay.results.find((r) => r.ngay === denNgay);

  return json({
    ok: true,
    tuNgay, denNgay,
    homNay: homNayRow ? homNayRow.luot : 0,
    tong: tongTat?.n || 0,
    theoNgay: theoNgay.results,
    theoHocSinh: theoHocSinh.results,
    anDanh: tongAnDanh?.n || 0,
  });
}, { canGiaoVien: true });
