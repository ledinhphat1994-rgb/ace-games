-- ==============================================================================
-- 62-su-kien-campus.sql
-- Sự kiện toàn trường của Digital Campus — do giáo viên tạo, học sinh mọi lớp
-- và khách đều xem được. KHÔNG chứa dữ liệu riêng tư của lớp.
-- Trạng thái (đang diễn ra / sắp diễn ra / đã kết thúc) được SUY RA từ mốc giờ,
-- không lưu trạng thái thừa trong DB.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS su_kien_campus (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tieu_de         TEXT NOT NULL,
  mo_ta           TEXT,
  loai            TEXT NOT NULL DEFAULT 'chung',  -- 'chung'|'chat'|'video'|'nhac'|'game'|'hoc-tap'|'cuoc-thi'
  bat_dau         TEXT NOT NULL,                  -- UTC ISO 'YYYY-MM-DDTHH:MM:SS.sssZ'
  ket_thuc        TEXT NOT NULL,                  -- UTC ISO — phải sau bat_dau (API kiểm tra)
  phong_id        INTEGER REFERENCES phong(id),   -- tuỳ chọn: phòng campus gắn với sự kiện
  noi_bat         INTEGER NOT NULL DEFAULT 0,     -- 1 = ghim lên Hero campus
  tao_boi         TEXT NOT NULL,                  -- khoá phiên giáo viên 'gv:<lop_id>'
  tao_boi_ten     TEXT NOT NULL,
  trang_thai      TEXT NOT NULL DEFAULT 'hoat_dong', -- 'hoat_dong' | 'huy' (huỷ = xoá mềm)
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
  cap_nhat_luc    TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_skc_thoi_gian ON su_kien_campus(trang_thai, bat_dau);
