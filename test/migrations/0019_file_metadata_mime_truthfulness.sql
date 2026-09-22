-- Digital Campus v2: Milestone F1 PR #13 Closure
-- Migration 0019: Đảm bảo tính chân thực MIME cho tệp legacy và cập nhật mọi avatar chưa xác định rõ MIME

UPDATE file_metadata
SET mime_type = 'unknown'
WHERE original_name = 'legacy_avatar'
  AND mime_type = 'image/jpeg'
  AND object_key NOT LIKE '%.jpg'
  AND object_key NOT LIKE '%.jpeg';
