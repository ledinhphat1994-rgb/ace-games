# Đổi cấu trúc cơ sở dữ liệu D1 (v2)

Không bao giờ sửa lại các tệp SQL migration đã chạy trên máy chủ thật. Mọi migration là bất biến.

1. Tạo tệp `migrations/00xx_ten_migration.sql` với `00xx` là số tiếp theo theo thứ tự tăng dần.

2. Viết sao cho an toàn và lặp lại nhiều lần không lỗi:

   ```sql
   CREATE TABLE IF NOT EXISTS ten_bang (
     id         TEXT PRIMARY KEY,
     lop_id     TEXT NOT NULL,
     ngay_tao   INTEGER NOT NULL DEFAULT (unixepoch()),
     ghi_chu    TEXT
   );
   CREATE INDEX IF NOT EXISTS idx_ten_bang_lop ON ten_bang(lop_id);
   ```

3. Áp dụng thử nghiệm **trên máy cục bộ trước**:

   ```powershell
   npm run d1:migrate:local
   # hoặc:
   npx wrangler d1 execute DB --local --file="migrations/00xx_ten_migration.sql"
   ```

4. Chạy kiểm tra local gate (`npm run typecheck`, targeted tests) đảm bảo code ứng dụng tương thích hoàn toàn với schema mới.

5. Triển khai lên Staging/Production theo quy trình release guard an toàn.
   Nhắc lại: Tuyệt đối không xóa/sửa migration đã được đẩy lên production.
