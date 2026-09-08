-- Thêm số điện thoại CỦA CHÍNH học sinh (khác với dien_thoai_ph là số của phụ huynh, chỉ GVCN
-- xem). Mặc định ẨN khỏi "công khai giữa học sinh trong lớp" cho MỌI lớp đang có — số điện
-- thoại nhạy cảm hơn các trường vốn để mặc định công khai (giới tính, ngày sinh...), giáo viên
-- chủ nhiệm bật lại ở "⚙ Tuỳ chỉnh hiển thị" nếu muốn học sinh trong lớp xem được của nhau.
ALTER TABLE hoc_sinh ADD COLUMN dien_thoai_hs TEXT DEFAULT '';

UPDATE lop
   SET hs_cong_khai_an = CASE
     WHEN hs_cong_khai_an IS NULL OR hs_cong_khai_an = '' THEN 'dien-thoai-hs'
     ELSE hs_cong_khai_an || ',dien-thoai-hs'
   END
 WHERE hs_cong_khai_an IS NULL OR hs_cong_khai_an NOT LIKE '%dien-thoai-hs%';
