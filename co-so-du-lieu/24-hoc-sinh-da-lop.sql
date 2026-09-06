-- Đưa "hoc_sinh" sang mô hình đa lớp.
--
-- Không cần đổi khoá chính: cột id ĐÃ được gán bằng MAX(id)+1 TOÀN CỤC khi thêm học sinh mới
-- (xem functions/api/gv/hoc-sinh.js) — nghĩa là id vốn đã là một khoá thay thế duy nhất trên
-- toàn hệ thống, chỉ TRÙNG HỢP bằng đúng số thứ tự sổ lớp vì hiện chỉ có một lớp. Học sinh của
-- lớp thứ 2 trở đi vẫn được cấp id KHÔNG đụng hàng (tiếp tục MAX(id)+1 toàn cục), nên không có
-- rủi ro đụng khoá chính như đã lo ban đầu — không cần rebuild bảng.
--
-- Thêm lop_id để biết học sinh thuộc lớp nào, và so_thu_tu để giữ đúng "số thứ tự trong sổ
-- lớp" hiển thị cho người dùng (số này CẦN tính riêng theo từng lớp, ví dụ lớp nào cũng có thể
-- có "học sinh số 1" của lớp mình).
-- (SQLite không cho ADD COLUMN có REFERENCES kèm giá trị mặc định khác NULL — bỏ khai báo
-- REFERENCES ở đây, việc cô lập dữ liệu giữa các lớp do TẦNG ỨNG DỤNG lọc lop_id ở mọi truy
-- vấn đảm nhiệm, không phụ thuộc ràng buộc khoá ngoại của SQLite.)
ALTER TABLE hoc_sinh ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE hoc_sinh ADD COLUMN so_thu_tu INTEGER;

-- Dữ liệu lớp 10A7 hiện có: giữ đúng thứ tự đang hiển thị (so_thu_tu = id cũ).
UPDATE hoc_sinh SET so_thu_tu = id WHERE so_thu_tu IS NULL;
