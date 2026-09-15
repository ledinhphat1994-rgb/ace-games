-- Thêm cột slug cho bảng phong để gateway Worker tra cứu DO name -> D1 record.
-- NULL = phong chua duoc cap slug (ad-hoc, khong ap dung admission gate).
ALTER TABLE phong ADD COLUMN slug TEXT;
CREATE UNIQUE INDEX idx_phong_slug ON phong(slug) WHERE slug IS NOT NULL;
-- Them cot iterations cho mat khau phong (dung cung PBKDF2 nhu tai_khoan_campus).
ALTER TABLE phong ADD COLUMN mat_khau_iterations INTEGER;
