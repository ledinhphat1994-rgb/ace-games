# Thêm một API mới

1. Xác định ai được dùng:
   - Học sinh xem được → đặt trong `functions/api/`, chỉ trả dữ liệu của chính em đó.
   - Giáo viên → đặt trong `functions/api/gv/`, bắt buộc `{ canGiaoVien: true }`.
   - Cho phép tài khoản phụ (thủ quỹ, lớp trưởng) → thêm `quyenCan: 'ten-quyen'`,
     **chỉ khi giáo viên nói rõ**.

2. Viết tệp theo mẫu, tên tệp tiếng Việt không dấu:

   ```js
   import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';

   export const onRequestGet = bocXuLy(async ({ env }) => {
     const { results } = await env.DB.prepare('SELECT ... WHERE ... = ?').bind(x).all();
     return json({ ok: true, danhSach: results });
   }, { canGiaoVien: true });
   ```

3. Kiểm tra dữ liệu người dùng gửi lên: `chuoi(...)` giới hạn độ dài, `ngayHopLe(...)` cho ngày,
   số thì `Number.isFinite`. Luôn `.bind()`, không nối chuỗi SQL.

4. Gọi thử cả ba trường hợp:
   - chưa đăng nhập → 401
   - đăng nhập bằng mã học sinh nhưng gọi API giáo viên → 403
   - đăng nhập đúng quyền → 200 và dữ liệu đúng

   ```powershell
   curl -i http://localhost:8788/api/gv/ten-api
   ```

5. Nối vào giao diện trong `giao-vien/trang-*.js` hoặc `assets/js/*.js`,
   hiển thị bằng `textContent` (không `innerHTML`).

6. Chạy `npm run kiem-tra-du-lieu` và `npm run lint` trước khi báo xong.
