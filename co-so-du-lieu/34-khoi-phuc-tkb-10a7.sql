-- KHÔI PHỤC dữ liệu thời khoá biểu buổi chiều của Lớp 10A7 (phiên bản HK1, id=7 trên production)
-- đã bị XOÁ NHẦM do lỗi "Sửa nhanh": khi lưu chỉ gửi lên các ô của MỘT buổi đang xem (vd buổi
-- sáng, vốn không có tiết nào), backend xoá sạch TOÀN BỘ tkb_o của phiên bản đó rồi chỉ chèn lại
-- đúng những gì vừa gửi — buổi chiều (chưa từng mở tab xem trong lần sửa đó) bị xoá theo.
-- Dữ liệu dưới đây chép lại y nguyên từ migration 30-cap-nhat-tkb-10a7-11a1.sql (phần Lớp 10A7).
-- An toàn chạy nhiều lần: xoá sạch tkb_o hiện có của phiên bản HK1 đang áp dụng của lớp 10A7
-- trước khi chèn lại, để không tạo trùng nếu lỡ chạy lại.
DELETE FROM tkb_o WHERE lop_id = 1 AND phien_ban_id = (
  SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1
);

INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 2, 1, 'Văn (Hằng)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 2, 2, 'Văn (Hằng)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 2, 3, 'HĐGD (Phát)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 2, 4, 'SHL (Phát)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 2, 5, 'Chào cờ', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;

INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 3, 1, 'Toán (Đông)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 3, 2, 'Toán (Đông)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 3, 3, 'Hóa (Phương)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 3, 4, 'Địa (H.Thủy)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;

INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 4, 1, 'Hóa (Toàn)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 4, 2, 'Hóa (Toàn)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 4, 3, 'Địa (Nga)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 4, 4, 'Địa (Nga)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;

INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 5, 1, 'Văn (Hằng)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 5, 2, 'Văn (Hằng)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 5, 3, 'SHL (Lộc)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
SELECT id, 'chieu', 5, 4, 'Địa (H.Thủy)', 'A5', 1 FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_ket_thuc IS NULL ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1;
