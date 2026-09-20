-- Digital Campus v2: Milestone A1 — Admin Control Plane & Room Lifecycle Management
-- Migration 0015:
-- 1. Server-authoritative room lifecycle columns on phong
-- 2. Performance indexes for admin queries & status transitions
-- 3. Singleton campus_room_policy table for configurable auto-cleanup rules

-- 1. Thêm các trường quản lý chu kỳ sống vào bảng phong
ALTER TABLE phong ADD COLUMN created_at INTEGER;
ALTER TABLE phong ADD COLUMN last_activity_at INTEGER;
ALTER TABLE phong ADD COLUMN last_join_at INTEGER;
ALTER TABLE phong ADD COLUMN last_participant_left_at INTEGER;
ALTER TABLE phong ADD COLUMN ever_joined INTEGER NOT NULL DEFAULT 0;
ALTER TABLE phong ADD COLUMN closing_at INTEGER;
ALTER TABLE phong ADD COLUMN closed_at INTEGER;
ALTER TABLE phong ADD COLUMN closed_by INTEGER REFERENCES tai_khoan_campus(id);
ALTER TABLE phong ADD COLUMN close_reason TEXT;
ALTER TABLE phong ADD COLUMN lifecycle_revision INTEGER NOT NULL DEFAULT 1;

-- Backfill dữ liệu cho các phòng đã tồn tại
UPDATE phong
SET created_at = COALESCE(strftime('%s', tao_luc) * 1000, strftime('%s', 'now') * 1000),
    last_activity_at = COALESCE(strftime('%s', cap_nhat_luc) * 1000, strftime('%s', tao_luc) * 1000, strftime('%s', 'now') * 1000)
WHERE created_at IS NULL;

UPDATE phong
SET closed_at = COALESCE(strftime('%s', cap_nhat_luc) * 1000, strftime('%s', 'now') * 1000),
    close_reason = 'legacy_closed'
WHERE trang_thai != 'mo' AND closed_at IS NULL;

-- 2. Chỉ mục phục vụ truy vấn admin & đối soát chu kỳ sống
CREATE INDEX IF NOT EXISTS idx_phong_lifecycle ON phong(trang_thai, closed_at);
CREATE INDEX IF NOT EXISTS idx_phong_created ON phong(created_at);
CREATE INDEX IF NOT EXISTS idx_phong_activity ON phong(last_activity_at);

-- 3. Bảng cấu hình chính sách dọn dẹp phòng học (Singleton id = 1)
CREATE TABLE IF NOT EXISTS campus_room_policy (
  id                        INTEGER PRIMARY KEY CHECK (id = 1),
  auto_close_enabled        INTEGER NOT NULL DEFAULT 1,
  never_joined_ttl_minutes  INTEGER NOT NULL DEFAULT 5,
  empty_room_ttl_minutes    INTEGER NOT NULL DEFAULT 15,
  max_room_lifetime_minutes INTEGER NOT NULL DEFAULT 480,
  updated_at                INTEGER NOT NULL,
  updated_by                INTEGER REFERENCES tai_khoan_campus(id),
  revision                  INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO campus_room_policy (
  id,
  auto_close_enabled,
  never_joined_ttl_minutes,
  empty_room_ttl_minutes,
  max_room_lifetime_minutes,
  updated_at,
  revision
) VALUES (
  1,
  1,
  5,
  15,
  480,
  (strftime('%s', 'now') * 1000),
  1
);
