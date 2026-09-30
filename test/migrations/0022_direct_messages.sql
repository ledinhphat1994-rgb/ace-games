-- 0022_direct_messages.sql
-- Hệ thống tin nhắn riêng 1-1 giữa các học sinh/bạn bè trong Digital Campus.

CREATE TABLE IF NOT EXISTS direct_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id),
  receiver_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id),
  noi_dung TEXT NOT NULL,
  tao_luc INTEGER NOT NULL,
  da_doc INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_dm_pair ON direct_messages (sender_id, receiver_id, tao_luc);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages (receiver_id, da_doc);
