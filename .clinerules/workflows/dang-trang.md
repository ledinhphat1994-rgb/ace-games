# Đăng trang lên mạng

Chạy tuần tự, dừng ngay khi có bước lỗi. Không bỏ bước nào.

1. Soát dữ liệu và cú pháp:

   ```powershell
   npm run kiem-tra-du-lieu
   ```

2. Chạy thử trên máy, mở `http://localhost:8788`, thử đúng luồng vừa sửa
   (đăng nhập → trang lớp → khu giáo viên nếu có liên quan):

   ```powershell
   npm run dev
   ```

3. Xác nhận đúng tài khoản GitHub/Cloudflare:

   ```powershell
   npm run kiem-tra
   ```

4. Đăng:

   ```powershell
   npm run deploy
   ```

5. Mở `https://lop-10a7.pages.dev` kiểm tra lại phần vừa sửa. Nếu có lỗi 500 thì
   xem log bằng `npm run log` hoặc MCP `cloudflare-observability`.

6. Nếu thay đổi ảnh hưởng cách giáo viên sử dụng → cập nhật `HUONG-DAN.md`.

Chỉ `git commit` khi giáo viên yêu cầu. Trước khi commit, chạy `git status`
và xác nhận không có `.dev.vars`, `dist/`, `.wrangler/` trong danh sách.
