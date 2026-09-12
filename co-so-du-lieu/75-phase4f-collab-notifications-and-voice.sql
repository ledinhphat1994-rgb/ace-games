-- ==============================================================================
-- 75-phase4f-collab-notifications-and-voice.sql
-- Phase 4F: Social Notifications, Collaborative Study Dock, and Voice Signaling
-- 1. chat_read_state:
--    - Lưu trữ mốc tin nhắn đã đọc cho từng tài khoản trên các kênh (campus, lop, dm)
-- 2. watch_room_collab:
--    - Lưu trữ tài nguyên cộng tác thời gian thực trong phòng học tập YouTube (notes, sheet, whiteboard)
--    - Optimistic concurrency control qua trường version
-- 3. watch_room_voice_signal:
--    - Bảng trung chuyển tín hiệu WebRTC 1-1 phòng (offer, answer, candidate, join, leave)
-- ==============================================================================

-- 1. TRẠNG THÁI ĐÃ ĐỌC TIN NHẮN (Campus, Lớp, DM Bạn bè)
CREATE TABLE IF NOT EXISTS chat_read_state (
  account_id            INTEGER NOT NULL,
  channel_type          TEXT NOT NULL,                           -- 'campus' | 'class' | 'dm'
  channel_key           TEXT NOT NULL,                           -- 'campus' | 'lop:<id>' | 'peer:<friendAccountId>'
  last_read_message_id  INTEGER NOT NULL DEFAULT 0,
  updated_at            TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id, channel_type, channel_key)
);

CREATE INDEX IF NOT EXISTS idx_chat_read_state_acc ON chat_read_state(account_id);

-- 2. TÀI NGUYÊN CỘNG TÁC PHÒNG YOUTUBE (Ghi chú, Bảng vẽ, Bảng tính)
CREATE TABLE IF NOT EXISTS watch_room_collab (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id               INTEGER NOT NULL,
  resource_type         TEXT NOT NULL,                           -- 'notes' | 'sheet' | 'whiteboard'
  payload_json          TEXT NOT NULL DEFAULT '{}',
  version               INTEGER NOT NULL DEFAULT 1,
  updated_by            TEXT,
  updated_at            TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (room_id, resource_type)
);

CREATE INDEX IF NOT EXISTS idx_watch_room_collab ON watch_room_collab(room_id, resource_type);

-- 3. TÍN HIỆU WEBRTC VOICE 1-1 PHÒNG Hoạt Động (Signaling Only)
CREATE TABLE IF NOT EXISTS watch_room_voice_signal (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id               INTEGER NOT NULL,
  sender_key            TEXT NOT NULL,
  sender_name           TEXT,
  signal_type           TEXT NOT NULL,                           -- 'join' | 'offer' | 'answer' | 'candidate' | 'leave'
  payload_json          TEXT NOT NULL DEFAULT '{}',
  created_at            TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_voice_signal_room ON watch_room_voice_signal(room_id, id);
