---
name: kiem-tra-truoc-khi-push
description: Chạy toàn bộ kiểm tra bắt buộc của lop-10a7 trước khi commit/push. Dùng mỗi khi sắp commit.
---
1. `npm run lint` → phải 0 error (warning được phép nhưng không tăng so với main).
2. `npm run kiem-tra-du-lieu` → không có advisory mới.
3. `npm run build` → dist/ tạo thành công.
4. `rg -n "innerHTML" index.html` → 0 kết quả. `rg -n "unsplash|mock|demo|fake|seed" index.html assets/js` → 0 kết quả trong code chạy.
5. `rg -n "WHERE id = \?" functions/api` → mỗi kết quả phải có `lop_id` trong cùng câu lệnh; nếu không → sửa.
6. Khởi động `npm run dev` (port 8788), đăng nhập mã GV trong .dev.vars, mở `/` và `/#/bang-tin-lop`, chụp màn hình 1440px bằng Playwright (`npx playwright screenshot --viewport-size=1440,900 ...`) lưu vào `qa/`.
7. Chỉ khi 1–6 đạt mới commit. Ghi kết quả 6 bước vào phần mô tả commit/PR.
