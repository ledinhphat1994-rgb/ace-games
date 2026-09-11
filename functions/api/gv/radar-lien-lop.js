// GET /api/gv/radar-lien-lop — "Radar giám sát liên lớp" trên trang chủ.
// Trả số liệu THẬT của từng lớp: sĩ số đang học, số tài khoản đang có phiên (online),
// số em đã được điểm danh có mặt hôm nay, tổng số bài đăng hoạt động lớp.
// CHỈ giáo viên chủ nhiệm — dữ liệu giám sát toàn trường, học sinh/cán sự không xem được.
import { bocXuLy, json } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(`
    SELECT l.id, l.ten,
      (SELECT COUNT(*) FROM hoc_sinh hs
        WHERE hs.lop_id = l.id AND hs.dang_hoc = 1) AS siSo,
      (
        (SELECT COUNT(*) FROM ma_ca_nhan m
          WHERE m.lop_id = l.id AND m.dang_hoat_dong = 1
            AND m.thiet_bi IS NOT NULL AND m.thiet_bi <> '')
        +
        (SELECT COUNT(*) FROM tai_khoan_phu p
          WHERE p.lop_id = l.id AND p.dang_hoat_dong = 1
            AND p.thiet_bi IS NOT NULL AND p.thiet_bi <> '')
      ) AS online,
      (SELECT COUNT(*) FROM diem_danh d
        WHERE d.lop_id = l.id AND d.ngay = date('now')
          AND d.buoi NOT LIKE '%_phu' AND d.trang_thai = 'co_mat') AS coMatHomNay,
      (SELECT COUNT(*) FROM hoat_dong_lop hd WHERE hd.lop_id = l.id) AS soBaiDang
    FROM lop l
    ORDER BY l.id ASC
  `).all();

  return json({ ok: true, lops: results || [] });
}, { canGiaoVien: true });
