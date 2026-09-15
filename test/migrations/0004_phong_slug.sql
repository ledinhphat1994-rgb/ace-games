-- Test mirror of migrations/0004_phong_security_gate.sql
-- Thêm mat_khau_iterations vào phong (dùng cho PBKDF2-SHA256 xác minh mật khẩu phòng).
-- Canonical room key là phong-<id> — không dùng slug, không cần thêm cột slug.
ALTER TABLE phong ADD COLUMN mat_khau_iterations INTEGER;
UPDATE phong SET mat_khau_iterations = 100000 WHERE mat_khau_hash IS NOT NULL AND mat_khau_iterations IS NULL;
