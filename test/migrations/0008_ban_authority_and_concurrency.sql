-- Migration 0008: Ban Authority and Concurrency Protection
-- Digital Campus v2: Server-Authoritative Moderation Invariants

-- 1. Bổ sung cấp thẩm quyền tại thời điểm cấm (authority_rank: 3=Admin, 2=Teacher, 1=Host)
-- Mặc định là 3 (Admin) cho các bản ghi cũ (fail-closed legacy handling)
-- Cho phép NULL đối với các bản ghi legacy cũ nhưng runtime luôn xử lý NULL thành 3 (Admin)
ALTER TABLE phong_ban ADD COLUMN authority_rank INTEGER DEFAULT 3;

-- 2. Bổ sung số phiên bản (revision) để kiểm soát tương tranh lạc quan (Optimistic Concurrency Control)
ALTER TABLE phong_ban ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;

-- 3. Bổ sung thời gian cập nhật (updated_at)
ALTER TABLE phong_ban ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0;
