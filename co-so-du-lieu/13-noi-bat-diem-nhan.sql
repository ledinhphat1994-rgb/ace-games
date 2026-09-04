-- Cờ RIÊNG cho "băng điểm nhấn" ở trang chủ — tách khỏi "ghim" (thông báo) và "mức độ"
-- (kế hoạch), vì hai cờ đó vốn dùng cho mục đích khác (ghim lên đầu danh sách / phân loại
-- mức quan trọng), không phải lúc nào giáo viên cũng muốn CẢ hai cùng đưa vào băng điểm nhấn.
ALTER TABLE thong_bao ADD COLUMN noi_bat INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ke_hoach ADD COLUMN noi_bat INTEGER NOT NULL DEFAULT 0;

-- Thông báo đã ghim từ trước và mốc kế hoạch "Quan trọng"/"Cần chú ý" chưa xong: bật sẵn cờ
-- này để không bị "biến mất" khỏi băng điểm nhấn ngay sau khi nâng cấp.
UPDATE thong_bao SET noi_bat = 1 WHERE ghim = 1;
UPDATE ke_hoach SET noi_bat = 1 WHERE hoan_thanh = 0 AND muc_do IN ('warn', 'danger');
