-- ==============================================================================
-- 70-phase4c-social-and-campus-chat.sql
-- Phase 4C: Campus Social Rail, Campus Chat, Friends & 1-on-1 Private Messaging
-- ==============================================================================

-- 1. BẢNG TIN NHẮN CHAT CHUNG TOÀN TRƯỜNG (CAMPUS CHAT)
CREATE TABLE IF NOT EXISTS campus_chat_message (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_account_id INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  lop_id INTEGER,
  content TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ccm_id ON campus_chat_message(id);
CREATE INDEX IF NOT EXISTS idx_ccm_active ON campus_chat_message(deleted_at, id);

-- 2. QUAN HỆ BẠN BÈ CAMPUS (FRIENDSHIP)
CREATE TABLE IF NOT EXISTS campus_friendship (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_account_id INTEGER NOT NULL,
  addressee_account_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'declined', 'blocked')),
  action_by_account_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_cf_pair UNIQUE(requester_account_id, addressee_account_id),
  CONSTRAINT chk_cf_diff CHECK(requester_account_id != addressee_account_id)
);

CREATE INDEX IF NOT EXISTS idx_cf_req ON campus_friendship(requester_account_id, status);
CREATE INDEX IF NOT EXISTS idx_cf_add ON campus_friendship(addressee_account_id, status);
CREATE INDEX IF NOT EXISTS idx_cf_lookup ON campus_friendship(requester_account_id, addressee_account_id);

-- 3. TIN NHẮN RIÊNG 1-1 (CAMPUS PRIVATE MESSAGING / DM)
CREATE TABLE IF NOT EXISTS campus_private_message (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_account_id INTEGER NOT NULL,
  receiver_account_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  retracted_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_cpm_diff CHECK(sender_account_id != receiver_account_id)
);

CREATE INDEX IF NOT EXISTS idx_cpm_convo ON campus_private_message(sender_account_id, receiver_account_id, id);
CREATE INDEX IF NOT EXISTS idx_cpm_recv ON campus_private_message(receiver_account_id, sender_account_id, id);

-- 4. BÁO CÁO VI PHẠM AN TOÀN (CAMPUS MODERATION REPORT)
CREATE TABLE IF NOT EXISTS campus_report (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_account_id INTEGER NOT NULL,
  target_account_id INTEGER NOT NULL,
  message_id INTEGER,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cr_target ON campus_report(target_account_id, created_at);
