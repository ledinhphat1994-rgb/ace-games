# Đổi cấu trúc cơ sở dữ liệu

Không bao giờ sửa lại các tệp SQL đã chạy trên máy chủ thật. Luôn thêm tệp mới.

1. Tạo tệp `co-so-du-lieu/NN-viec-can-lam.sql` với `NN` là số tiếp theo (xem tệp cuối cùng đang có).

2. Viết sao cho chạy lại nhiều lần vẫn không lỗi:

   ```sql
   CREATE TABLE IF NOT EXISTS ten_bang (
     id     INTEGER PRIMARY KEY AUTOINCREMENT,
     ngay   TEXT NOT NULL,              -- NĂM-THÁNG-NGÀY
     ghi_chu TEXT
   );
   CREATE INDEX IF NOT EXISTS idx_ten_bang_ngay ON ten_bang(ngay);
   ```

   SQLite không có `ADD COLUMN IF NOT EXISTS`. Thêm cột thì ghi rõ trong bình luận
   rằng tệp này chỉ chạy một lần, và kiểm tra trước bằng `PRAGMA table_info(ten_bang);`.

3. Áp dụng **trên máy trước**:

   ```powershell
   npx wrangler d1 execute lop-10a7-db --local --file "co-so-du-lieu/NN-viec-can-lam.sql"
   ```

4. Chạy `npm run dev`, thử luồng dùng bảng mới cho tới khi chắc chắn đúng.

5. Xin phép giáo viên, rồi mới áp dụng lên cơ sở dữ liệu thật:

   ```powershell
   npx wrangler d1 execute lop-10a7-db --remote --file "co-so-du-lieu/NN-viec-can-lam.sql"
   ```

6. Ghi thêm bảng mới vào mục "Cấu trúc cơ sở dữ liệu" trong `HUONG-DAN.md`.

Nhắc lại: `DROP`, `DELETE` không `WHERE`, `UPDATE` không `WHERE` → **hỏi trước khi chạy**.
D1 có Time Travel 30 ngày, nhưng khôi phục là quyết định của giáo viên, không phải của Cline.
