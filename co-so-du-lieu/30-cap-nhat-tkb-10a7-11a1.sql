-- Cập nhật thời khoá biểu học kỳ I (Năm học 2026-2027) áp dụng từ ngày 07/09/2026
-- Chỉ áp dụng cho 2 lớp: Lớp 10A7 (lop_id = 1, Buổi chiều) và Lớp 11A1 (lop_id = 2, Buổi sáng).

-- 1. Đóng các phiên bản thời khoá biểu cũ (nếu có) trước ngày 07/09/2026
UPDATE tkb_phien_ban SET ngay_ket_thuc = '2026-09-06' WHERE ngay_ket_thuc IS NULL;

-- 2. Dọn dẹp phiên bản 2026-09-07 nếu đã từng chạy migration này trước đó (đảm bảo idempotent)
DELETE FROM tkb_o WHERE phien_ban_id IN (SELECT id FROM tkb_phien_ban WHERE ngay_bat_dau = '2026-09-07');
DELETE FROM tkb_phien_ban WHERE ngay_bat_dau = '2026-09-07';

-- ============================================================================
-- PHẦN I: LỚP 10A7 (lop_id = 1) - BUỔI CHIỀU - PHÒNG A5
-- ============================================================================
INSERT INTO tkb_phien_ban (lop_id, ten, ngay_bat_dau, ghi_chu)
VALUES (1, 'Thời khoá biểu HK1 (từ 07/09/2026)', '2026-09-07', 'Buổi chiều · Phòng A5 · Có mặt lúc 12h45');

-- Thứ 2 (10A7)
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 2, 1, 'Văn (Hằng)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 2, 2, 'Văn (Hằng)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 2, 3, 'HĐGD (Phát)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 2, 4, 'SHL (Phát)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 2, 5, 'Chào cờ', 'A5', 1);

-- Thứ 3 (10A7)
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 3, 1, 'Toán (Đông)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 3, 2, 'Toán (Đông)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 3, 3, 'Hóa (Phương)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 3, 4, 'Địa (H.Thủy)', 'A5', 1);

-- Thứ 4 (10A7)
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 4, 1, 'Hóa (Toàn)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 4, 2, 'Hóa (Toàn)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 4, 3, 'Địa (Nga)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 4, 4, 'Địa (Nga)', 'A5', 1);

-- Thứ 5 (10A7)
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 5, 1, 'Văn (Hằng)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 5, 2, 'Văn (Hằng)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 5, 3, 'SHL (Lộc)', 'A5', 1);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 1 AND ngay_bat_dau = '2026-09-07'), 'chieu', 5, 4, 'Địa (H.Thủy)', 'A5', 1);

-- ============================================================================
-- PHẦN II: LỚP 11A1 (lop_id = 2) - BUỔI SÁNG - PHÒNG 301
-- ============================================================================
INSERT INTO tkb_phien_ban (lop_id, ten, ngay_bat_dau, ghi_chu)
VALUES (2, 'Thời khoá biểu HK1 (từ 07/09/2026)', '2026-09-07', 'Buổi sáng · Phòng 301 · Có mặt lúc 6h45');

-- Thứ 2 (11A1)
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 2, 1, 'Chào cờ', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 2, 2, 'Lý (Thắng)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 2, 3, 'Lý (Thắng)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 2, 4, 'Sử (Hải)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 2, 5, 'Sử (Hải)', 'P.301', 2);

-- Thứ 3 (11A1)
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 3, 1, 'HĐGD (Phát)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 3, 2, 'SHL (Phát)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 3, 3, 'Toán (Tạo)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 3, 4, 'Anh (Chi)', 'P.301', 2);

-- Thứ 4 (11A1)
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 4, 1, 'Toán (Tạo)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 4, 2, 'Toán (Tạo)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 4, 3, 'Địa (Linh)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 4, 4, 'Địa (Linh)', 'P.301', 2);

-- Thứ 5 (11A1)
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 5, 1, 'Văn (Hoa)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 5, 2, 'Văn (Hoa)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 5, 3, 'Anh (Chi)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 5, 4, 'Anh (Chi)', 'P.301', 2);

-- Thứ 6 (11A1)
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 6, 1, 'Văn (Hoa)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 6, 2, 'Văn (Hoa)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 6, 3, 'Tin (Trinh)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 6, 4, 'Tin (Trinh)', 'P.301', 2);

-- Thứ 7 (11A1)
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 7, 1, 'Sử (Hải)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 7, 2, 'Toán (Tạo)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 7, 3, 'Hóa (Tâm)', 'P.301', 2);
INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon, phong, lop_id)
VALUES ((SELECT id FROM tkb_phien_ban WHERE lop_id = 2 AND ngay_bat_dau = '2026-09-07'), 'sang', 7, 4, 'Hóa (Tâm)', 'P.301', 2);
