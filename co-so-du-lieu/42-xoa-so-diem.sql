-- Bỏ hẳn chức năng "Sổ điểm" (điểm số/xếp loại học tập theo Thông tư 22, kết quả rèn luyện)
-- theo yêu cầu giáo viên — không còn giao diện nào đọc/ghi các bảng này nữa (xem giao-vien/
-- app.js, giao-vien/trang-hoc-tap.js, functions/api/gv/*). Xoá luôn dữ liệu điểm đã nhập,
-- không giữ lại. Xoá bảng con (diem tham chiếu mon_hoc) trước bảng cha.
DROP INDEX IF EXISTS idx_diem_hs;
DROP INDEX IF EXISTS idx_diem_mon;
DROP TABLE IF EXISTS diem;
DROP TABLE IF EXISTS ren_luyen;
DROP TABLE IF EXISTS mon_hoc;
