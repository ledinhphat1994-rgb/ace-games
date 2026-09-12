-- ==============================================================================
-- 71-phase4c1-social-hardening.sql
-- Phase 4C.1: Social Correctness, Safety & Polling Hardening
-- ==============================================================================

-- 1. TÁCH BẢNG CHẶN RIÊNG BIỆT (CAMPUS BLOCK)
CREATE TABLE IF NOT EXISTS campus_block (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_account_id INTEGER NOT NULL,
  blocked_account_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_cb_pair UNIQUE(blocker_account_id, blocked_account_id),
  CONSTRAINT chk_cb_diff CHECK(blocker_account_id != blocked_account_id)
);

CREATE INDEX IF NOT EXISTS idx_cb_lookup ON campus_block(blocker_account_id, blocked_account_id);
CREATE INDEX IF NOT EXISTS idx_cb_blocked ON campus_block(blocked_account_id);

-- Chuyển các bản ghi 'blocked' cũ từ campus_friendship sang campus_block (nếu có)
INSERT OR IGNORE INTO campus_block (blocker_account_id, blocked_account_id, created_at)
SELECT COALESCE(action_by_account_id, requester_account_id),
       CASE WHEN COALESCE(action_by_account_id, requester_account_id) = requester_account_id THEN addressee_account_id ELSE requester_account_id END,
       updated_at
FROM campus_friendship WHERE status = 'blocked';

DELETE FROM campus_friendship WHERE status = 'blocked';

-- 2. KHÓA BẤT BIẾN CẶP KHÔNG THỨ TỰ CHO CAMPUS FRIENDSHIP (UNORDERED PAIR INVARIANT)
-- Thêm 2 cột pair_low và pair_high
ALTER TABLE campus_friendship ADD COLUMN pair_low INTEGER;
ALTER TABLE campus_friendship ADD COLUMN pair_high INTEGER;

-- Điền dữ liệu pair_low và pair_high cho các hàng hiện có
UPDATE campus_friendship
SET pair_low = MIN(requester_account_id, addressee_account_id),
    pair_high = MAX(requester_account_id, addressee_account_id)
WHERE pair_low IS NULL;

-- Dọn dẹp các hàng trùng lặp đảo ngược nếu có trước khi tạo UNIQUE INDEX (giữ lại id mới nhất)
DELETE FROM campus_friendship
WHERE id NOT IN (
  SELECT MAX(id)
  FROM campus_friendship
  GROUP BY pair_low, pair_high
);

-- Tạo UNIQUE INDEX bắt buộc cặp (pair_low, pair_high) là duy nhất tuyệt đối
CREATE UNIQUE INDEX IF NOT EXISTS uq_cf_unordered_pair ON campus_friendship(pair_low, pair_high);
CREATE INDEX IF NOT EXISTS idx_cf_pair_lookup ON campus_friendship(pair_low, pair_high, status);

-- 3. BỔ SUNG CỘT CHO BẢNG BÁO CÁO VI PHẠM (CAMPUS REPORT)
ALTER TABLE campus_report ADD COLUMN action_note TEXT;
ALTER TABLE campus_report ADD COLUMN resolved_by_account_id INTEGER;
ALTER TABLE campus_report ADD COLUMN resolved_at TEXT;

CREATE INDEX IF NOT EXISTS idx_cr_status ON campus_report(status, created_at);
