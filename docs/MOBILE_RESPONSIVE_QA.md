# Kiểm tra mobile: học tập và trò chơi

Giao diện dùng chung giữ bảng xếp hạng và tin nhắn trong một bubble tiện ích ở màn hình dưới 1280px. Bấm lần đầu mở hai chức năng con; kéo tự do và lưu cả tọa độ, không tự dính mép. Bubble mờ xuống 35% sau 3,2 giây không tương tác và hiện rõ khi dùng. Menu tự đổi vị trí để không tràn ở các góc màn hình. Trên desktop, hai khung này trở lại bố cục ba cột. Đóng/mở bảng giữ tab đang chọn và nội dung đang soạn.

Phòng học có thanh công cụ cuộn ngang, truy cập thành viên/ghi chú, chat và các công cụ hiện có. Bảng thông tin mở dạng overlay dưới 1024px. Hộp thoại và ô nhập thích ứng với chiều cao hiển thị, vùng an toàn và bàn phím ảo.

Rắn săn mồi có điều khiển cảm ứng cho cả hai người chơi, nút tăng tốc xử lý nhả/cancel, chuyển chế độ cổ điển, khởi động lại và đổi kích thước canvas. Các phản hồi khởi động/xác minh cũ không ghi đè ván mới. Khi tải engine thất bại, hiển thị lỗi và cho phép thử lại.

## Phạm vi đã kiểm tra

- Chromium, 15 viewport: 320×568, 360×640, 375×667, 390×844, 414×896, 480×800, 600×960, 768×1024, 820×1180, 1024×768, 1280×800, 1440×900, 1920×1080, 568×320, 844×390.
- 22/22 bài kiểm tra trình duyệt: 7 tuyến sảnh/trò chơi ở từng kích thước; bubble duy nhất, kéo/lưu vị trí tự do, menu ở các góc, tự mờ, dùng cảm ứng/bàn phím; bố cục thanh điều khiển và các thao tác PvE/PvP, cảm xúc, xin thua; xoay màn hình; các tab bảng xếp hạng, chat, bạn bè; rắn 3D và cổ điển; biểu mẫu màn hình ngang; phòng học với RoomDO thật, ghi chú, chat, vẽ cảm ứng, công cụ và đóng phòng.
- 1127/1127 bài kiểm tra unit/integration đạt trong một lần chạy toàn bộ (100/100 file).
- TypeScript, lint (0 lỗi), build:bundle và git diff --check đạt. Lint/build còn cảnh báo sẵn có của dự án.
- Kiểm tra bằng trình duyệt mô phỏng; chưa xác nhận trên thiết bị iOS/Android vật lý.

## Chạy lại

Khởi động ứng dụng local bằng npm run dev -- --host 127.0.0.1, rồi chạy:

~~~powershell
npx playwright test --config playwright.mobile.config.ts
npx vitest run test/snake-mobile-lifecycle.test.ts
~~~

PLAYWRIGHT_BASE_URL có thể trỏ tới staging. Bộ kiểm tra chặn production, dùng tài khoản kiểm thử và phòng có mật khẩu, rồi đóng phòng sau kiểm tra. Báo cáo trình duyệt ở playwright-report/mobile; ảnh kiểm tra ở artifacts/mobile.
