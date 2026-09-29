-- Digital Campus v2 — Đăng nhập bằng Google (mức liên kết, Platform Core: Identity & Accounts)
-- Migration 0021: bảng liên kết tài khoản Campus ↔ tài khoản Google.
--
-- Google chỉ xác nhận danh tính; tài khoản, vai trò, lớp vẫn nằm ở tai_khoan_campus.
-- Mỗi tài khoản Campus liên kết tối đa 1 Google, mỗi Google chỉ gắn với 1 tài khoản Campus.
-- Không sửa bảng tai_khoan_campus. Gỡ liên kết = xoá dòng ở bảng này.

CREATE TABLE IF NOT EXISTS lien_ket_google (
  account_id  INTEGER PRIMARY KEY REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  google_sub  TEXT NOT NULL UNIQUE,
  email       TEXT,
  created_at  INTEGER NOT NULL
);
