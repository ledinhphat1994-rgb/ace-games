-- Thu cố định / Thu nhanh: mỗi khoản thu (quy_khoan) giờ có khoảng ngày rõ ràng (bắt đầu →
-- kết thúc) — áp dụng cho cả "Thu nhanh" (1 khoản, 1 khoảng ngày giáo viên tự chọn) lẫn từng
-- kỳ của "Thu cố định" (một chuỗi khoản tự sinh, kỳ sau nối tiếp NGAY SAU kỳ trước, đúng bằng
-- độ dài thật của kỳ 1 — không còn ép cứng "1 tuần = 7 ngày" như trước).
--
-- Mẫu định kỳ (quy_dinh_ky) giờ sinh SẴN toàn bộ "số lượng kỳ" ngay lúc tạo (giáo viên nhập
-- trước tổng số kỳ muốn thu), không còn sinh dần mỗi khi mở trang Thủ quỹ (sinhKyConThieu cũ)
-- — nhờ vậy giáo viên thấy ngay toàn bộ lịch thu, không còn thắc mắc "định kỳ là khi nào".
ALTER TABLE quy_khoan ADD COLUMN ngay_bat_dau TEXT;
ALTER TABLE quy_khoan ADD COLUMN ngay_ket_thuc TEXT;
ALTER TABLE quy_dinh_ky ADD COLUMN ngay_ket_thuc TEXT;
ALTER TABLE quy_dinh_ky ADD COLUMN so_ky INTEGER NOT NULL DEFAULT 0;

-- Vá dữ liệu cũ: các khoản do mẫu định kỳ sinh ra TRƯỚC bản cập nhật này chưa có ngày rõ ràng
-- — tính lại theo đúng công thức cũ (kỳ N bắt đầu N-1 tuần/tháng/năm sau ngày bắt đầu mẫu) để
-- không mất thông tin hiển thị.
UPDATE quy_khoan
   SET ngay_bat_dau = date((SELECT dk.ngay_bat_dau FROM quy_dinh_ky dk WHERE dk.id = quy_khoan.dinh_ky_id), '+' || ((quy_khoan.ky_so - 1) * 7) || ' days'),
       ngay_ket_thuc = date((SELECT dk.ngay_bat_dau FROM quy_dinh_ky dk WHERE dk.id = quy_khoan.dinh_ky_id), '+' || ((quy_khoan.ky_so - 1) * 7 + 6) || ' days')
 WHERE dinh_ky_id IS NOT NULL AND ngay_bat_dau IS NULL
   AND (SELECT dk.chu_ky FROM quy_dinh_ky dk WHERE dk.id = quy_khoan.dinh_ky_id) = 'tuan';

UPDATE quy_khoan
   SET ngay_bat_dau = date((SELECT dk.ngay_bat_dau FROM quy_dinh_ky dk WHERE dk.id = quy_khoan.dinh_ky_id), '+' || (quy_khoan.ky_so - 1) || ' months'),
       ngay_ket_thuc = date((SELECT dk.ngay_bat_dau FROM quy_dinh_ky dk WHERE dk.id = quy_khoan.dinh_ky_id), '+' || quy_khoan.ky_so || ' months', '-1 days')
 WHERE dinh_ky_id IS NOT NULL AND ngay_bat_dau IS NULL
   AND (SELECT dk.chu_ky FROM quy_dinh_ky dk WHERE dk.id = quy_khoan.dinh_ky_id) = 'thang';

UPDATE quy_khoan
   SET ngay_bat_dau = date((SELECT dk.ngay_bat_dau FROM quy_dinh_ky dk WHERE dk.id = quy_khoan.dinh_ky_id), '+' || (quy_khoan.ky_so - 1) || ' years'),
       ngay_ket_thuc = date((SELECT dk.ngay_bat_dau FROM quy_dinh_ky dk WHERE dk.id = quy_khoan.dinh_ky_id), '+' || quy_khoan.ky_so || ' years', '-1 days')
 WHERE dinh_ky_id IS NOT NULL AND ngay_bat_dau IS NULL
   AND (SELECT dk.chu_ky FROM quy_dinh_ky dk WHERE dk.id = quy_khoan.dinh_ky_id) = 'nam';

-- Vá quy_dinh_ky.so_ky/ngay_ket_thuc cho các mẫu tạo trước đây: so_ky = số kỳ ĐÃ sinh được
-- tính tới lúc chạy migration này (mô hình cũ không có khái niệm "tổng số kỳ dự kiến" nên chỉ
-- có thể vá lại đúng những gì đã thực sự tồn tại), ngay_ket_thuc = ngày kết thúc kỳ 1 suy ra
-- từ chu kỳ cũ.
UPDATE quy_dinh_ky
   SET so_ky = (SELECT COUNT(*) FROM quy_khoan WHERE quy_khoan.dinh_ky_id = quy_dinh_ky.id),
       ngay_ket_thuc = CASE chu_ky
         WHEN 'tuan' THEN date(ngay_bat_dau, '+6 days')
         WHEN 'thang' THEN date(ngay_bat_dau, '+1 months', '-1 days')
         WHEN 'nam' THEN date(ngay_bat_dau, '+1 years', '-1 days')
         ELSE ngay_bat_dau
       END
 WHERE ngay_ket_thuc IS NULL;
