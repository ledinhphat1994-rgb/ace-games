-- Security Gate Migration (2026-09-15)
-- Adds mat_khau_iterations column to phong for PBKDF2-SHA256 room-password hashing.
-- Canonical room key in WS is phong-<id> — no slug column needed.
-- Backfill existing password rows with legacy iteration count (100 000).
ALTER TABLE phong ADD COLUMN mat_khau_iterations INTEGER;
UPDATE phong SET mat_khau_iterations = 100000 WHERE mat_khau_hash IS NOT NULL AND mat_khau_iterations IS NULL;
