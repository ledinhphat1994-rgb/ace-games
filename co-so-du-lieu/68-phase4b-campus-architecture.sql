-- ==============================================================================
-- 68-phase4b-campus-architecture.sql
-- Phase 4B: Minimal Campus Shell, Unified Activity Lobbies, Generic Accounts & Room Hardening
--   1. Tạo bảng tai_khoan_campus: tài khoản độc lập (student, teacher, external)
--   2. Mở rộng bảng phong: access_mode ('public'|'password'), mat_khau_hash, mat_khau_salt, suc_chua
-- ==============================================================================

-- 1. BẢNG TÀI KHOẢN CAMPUS ĐỘC LẬP
CREATE TABLE IF NOT EXISTS tai_khoan_campus (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  ten_dang_nhap       TEXT NOT NULL UNIQUE,              -- username / email định danh (lowercase)
  ten_hien_thi        TEXT NOT NULL,                     -- tên hiển thị
  mat_khau_hash       TEXT NOT NULL,                     -- hash PBKDF2-SHA256 (hex)
  salt                TEXT NOT NULL,                     -- salt ngẫu nhiên (hex)
  iterations          INTEGER NOT NULL DEFAULT 100000,
  vai_tro             TEXT NOT NULL DEFAULT 'student',   -- 'student' | 'teacher' | 'external'
  teacher_pending     INTEGER NOT NULL DEFAULT 0,        -- 1: đăng ký GV chờ duyệt, 0: đã duyệt/vai trò khác
  duyet_boi_khoa      TEXT,                              -- định danh GV duyệt
  duyet_luc           TEXT,                              -- thời điểm duyệt
  hoc_sinh_id         INTEGER REFERENCES hoc_sinh(id) ON DELETE SET NULL, -- liên kết nếu có
  lop_id              INTEGER REFERENCES lop(id) ON DELETE SET NULL,      -- lớp nếu có
  dang_hoat_dong      INTEGER NOT NULL DEFAULT 1,
  thiet_bi            TEXT,                              -- khoá thiết bị/phiên duy nhất
  tao_luc             TEXT DEFAULT CURRENT_TIMESTAMP,
  cap_nhat_luc        TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tkc_ten_dn ON tai_khoan_campus(ten_dang_nhap);
CREATE INDEX IF NOT EXISTS idx_tkc_role_pending ON tai_khoan_campus(vai_tro, teacher_pending);

-- 2. MỞ RỘNG BẢNG PHÒNG HOẠT ĐỘNG
ALTER TABLE phong ADD COLUMN access_mode TEXT NOT NULL DEFAULT 'public';
ALTER TABLE phong ADD COLUMN mat_khau_hash TEXT;
ALTER TABLE phong ADD COLUMN mat_khau_salt TEXT;
ALTER TABLE phong ADD COLUMN suc_chua INTEGER NOT NULL DEFAULT 20;

CREATE INDEX IF NOT EXISTS idx_phong_access ON phong(access_mode, trang_thai);
