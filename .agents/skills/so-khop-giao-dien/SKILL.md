---
name: so-khop-giao-dien
description: Đối chiếu giao diện index.html với ảnh mẫu docs/mockups/1.png (Digital Campus lobby) và 2.png (Bảng tin). Dùng khi sửa bất kỳ JSX/CSS trong index.html.
---
1. Mở docs/mockups/1.png và 2.png. Liệt kê từng khối theo thứ tự trên→dưới, trái→phải: header (logo, tiêu đề, nút), cột trái, cột giữa, cột phải.
2. Chạy app local, chụp màn hình tab campus và tab feed ở 1440px.
3. Lập bảng 3 cột: "Khối trong ảnh mẫu | Có trong app? | Khác gì". Mọi khối THIẾU hoặc THÊM đều là lỗi phải sửa — trừ khi user đã nói rõ.
4. Dữ liệu trong ảnh mẫu là ví dụ; thay bằng dữ liệu /api/* hoặc empty-state. KHÔNG hard-code chữ trong ảnh.
5. Không bao giờ viết comment kiểu "ĐÃ XÓA X — 100% PARITY" để biện minh việc bỏ khối có trong ảnh.
