-- Digital Campus v2: Milestone A1 — Room Policy Snapshot & Disabled System Principal
-- Migration 0016:
-- 1. Thêm các trường lưu snapshot chính sách vòng đời tại thời điểm tạo phòng vào bảng phong
-- 2. Backfill snapshot cho các phòng hiện tại từ campus_room_policy
-- 3. Tạo tài khoản hệ thống (system) bị vô hiệu hóa đăng nhập để phục vụ audit trail

-- 1. Thêm cột snapshot chính sách vào phong
ALTER TABLE phong ADD COLUMN lifecycle_auto_close_enabled INTEGER NOT NULL DEFAULT 1;
ALTER TABLE phong ADD COLUMN lifecycle_never_joined_ttl_minutes INTEGER NOT NULL DEFAULT 5;
ALTER TABLE phong ADD COLUMN lifecycle_empty_room_ttl_minutes INTEGER NOT NULL DEFAULT 15;
ALTER TABLE phong ADD COLUMN lifecycle_max_lifetime_minutes INTEGER NOT NULL DEFAULT 480;
ALTER TABLE phong ADD COLUMN lifecycle_policy_revision INTEGER NOT NULL DEFAULT 1;

-- 2. Backfill cho các phòng đã tồn tại bằng chính sách toàn cục hiện tại
UPDATE phong
SET lifecycle_auto_close_enabled = COALESCE((SELECT auto_close_enabled FROM campus_room_policy WHERE id = 1), 1),
    lifecycle_never_joined_ttl_minutes = COALESCE((SELECT never_joined_ttl_minutes FROM campus_room_policy WHERE id = 1), 5),
    lifecycle_empty_room_ttl_minutes = COALESCE((SELECT empty_room_ttl_minutes FROM campus_room_policy WHERE id = 1), 15),
    lifecycle_max_lifetime_minutes = COALESCE((SELECT max_room_lifetime_minutes FROM campus_room_policy WHERE id = 1), 480),
    lifecycle_policy_revision = COALESCE((SELECT revision FROM campus_room_policy WHERE id = 1), 1)
WHERE lifecycle_policy_revision IS NULL OR lifecycle_policy_revision = 1;

-- 3. Đảm bảo tài khoản hệ thống (system) tồn tại và bị khóa đăng nhập tương tác (dang_hoat_dong = 0)
INSERT INTO tai_khoan_campus (
  ten_dang_nhap,
  ten_hien_thi,
  mat_khau_hash,
  salt,
  iterations,
  vai_tro,
  dang_hoat_dong,
  la_admin_truong,
  tao_luc,
  cap_nhat_luc
) VALUES (
  'system',
  'Hệ thống',
  'LOCKED_SYSTEM_ACCOUNT',
  'SYSTEM_SALT',
  100000,
  'admin',
  0,
  1,
  datetime('now'),
  datetime('now')
)
ON CONFLICT(ten_dang_nhap) DO UPDATE SET
  dang_hoat_dong = 0,
  ten_hien_thi = 'Hệ thống';
