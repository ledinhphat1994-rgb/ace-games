-- Bổ sung cho diem_danh_checkpoint (38-diem-danh-checkpoint.sql):
--   loai      'chinh' | 'phu' | NULL — NULL dùng cho điểm khôi phục chụp trước khi KHÔI PHỤC
--             (ảnh hưởng toàn bộ dữ liệu, không thuộc riêng loại nào) — chỉ hiện ở tab "Tất cả".
--   chi_tiet  JSON mảng từng học sinh có thay đổi thật sự trong lần ghi đó:
--             [{ hocSinhId, hoTen, truoc, sau, lyDo }] — truoc/sau là mã trạng thái hoặc null
--             (null ở "sau" nghĩa là điểm danh của em đó bị XOÁ trong lần ghi này).
ALTER TABLE diem_danh_checkpoint ADD COLUMN loai TEXT;
ALTER TABLE diem_danh_checkpoint ADD COLUMN chi_tiet TEXT;
