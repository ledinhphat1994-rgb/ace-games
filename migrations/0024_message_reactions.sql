-- 0024_message_reactions.sql
-- Lưu trữ và đồng bộ cảm xúc Emoji Reactions cho tất cả các nơi có chat trong Digital Campus.

CREATE TABLE IF NOT EXISTS message_reactions (
  scope TEXT NOT NULL, -- 'campus' hoặc 'dm' hoặc 'room'
  message_id INTEGER NOT NULL,
  emojis TEXT NOT NULL, -- JSON array chuỗi emoji tối đa 3 phần tử: '["🔥","👏"]'
  cap_nhat_luc INTEGER NOT NULL,
  PRIMARY KEY (scope, message_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_scope_id ON message_reactions (scope, message_id);
