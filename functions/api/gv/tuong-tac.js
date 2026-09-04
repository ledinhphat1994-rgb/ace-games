// GET /api/gv/tuong-tac — số liệu "Tương tác" trên trang lớp: hiện chỉ có lượt truy cập
// trang chủ theo ngày. Đây là nơi tập trung mọi số liệu tương tác trong tương lai (chat
// nhóm, chat cá nhân, trò chơi nhẹ…) — thêm bảng/nguồn dữ liệu mới thì gộp vào đây, KHÔNG
// tạo trang thống kê rời rạc khác.
import { bocXuLy, json } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env }) => {
  const denNgay = new Date().toISOString().slice(0, 10);
  const tuDate = new Date(); tuDate.setUTCDate(tuDate.getUTCDate() - 13);
  const tuNgay = tuDate.toISOString().slice(0, 10);

  const { results } = await env.DB.prepare(
    'SELECT ngay, luot FROM luot_truy_cap WHERE ngay BETWEEN ?1 AND ?2 ORDER BY ngay'
  ).bind(tuNgay, denNgay).all();

  const tongTat = await env.DB.prepare('SELECT COALESCE(SUM(luot), 0) AS n FROM luot_truy_cap').first();
  const homNayRow = results.find((r) => r.ngay === denNgay);

  return json({
    ok: true,
    tuNgay, denNgay,
    homNay: homNayRow ? homNayRow.luot : 0,
    tong: tongTat?.n || 0,
    theoNgay: results,
  });
}, { canGiaoVien: true });
