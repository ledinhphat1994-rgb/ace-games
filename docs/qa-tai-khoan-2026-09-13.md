# Kiểm chứng quản trị tài khoản và reset dữ liệu

Phạm vi owner xác nhận: xóa dữ liệu thật; bỏ toàn bộ chức năng quản trị cũ (kể cả
Điểm danh); chỉ giữ danh sách tài khoản Campus. Owner chỉ định `ledinhphat` làm
quản trị viên toàn trường. Xem hợp đồng sản phẩm và API cập nhật cùng commit.

## Kết quả trước triển khai

1. `npm run lint`: 0 error, 41 warning có sẵn; không thêm warning trong các file mới.
2. `npm run kiem-tra-du-lieu`: 0 lỗi, 20 advisory cũ; migration 79 không thêm advisory.
3. `npm run build`: 94 tệp deploy, JSX compile thành công. `npm run verify:gen`: 9 module đồng bộ.
4. Không có `innerHTML` trong `index.html`; không có chuỗi mock/demo/fake/seed/unsplash
   trong `index.html` và JavaScript client đang được phục vụ.
5. Query quản lý tài khoản được kiểm tra quyền từ D1. `lopId` chỉ thu hẹp phạm vi
   `giao_vien_lop`; mutation kiểm tra lại phạm vi và trạng thái trong UPDATE.
   Query toàn trường dùng quyền School Admin rõ ràng, không ràng sai vào một lớp.
   Những kết quả quét `WHERE id = ?` còn lại thuộc auth, phòng Campus liên lớp hoặc
   đã có `lop_id`/`phong_id` và kiểm tra membership; không sửa domain phòng trong task này.
6. App chạy local ở 8788. Đã đăng nhập username/password thật của fixture QA,
   và mã GV hiện có trong D1 local. Mã `TEACHER_CODE` của `.dev.vars` bị mã GV
   đã lưu trong D1 thay thế theo thiết kế của `login.js`; dùng mã có hiệu lực để
   kiểm chứng. Chụp Campus/Bảng tin ở 1440×900, khu quản trị ở 1440×900 và 390×844;
   kiểm tra thêm Điểm danh/Quỹ ở trạng thái trống. Không có lỗi JS hoặc HTTP 5xx.

`npm run qa:tai-khoan`: **52 PASS**. Bao gồm không lộ hash/salt/thiết bị,
khách/học sinh bị chặn, không vượt phạm vi lớp, cookie cũ không giữ quyền đã thu hồi,
không tự khóa/khóa admin, khóa giáo viên, phiên khóa bị thu hồi, duyệt có điều kiện,
không dùng endpoint duyệt để nâng tài khoản thường, dữ liệu dạng HTML chỉ hiện text,
tìm/lọc/empty-state và thao tác khóa/mở khóa qua trình duyệt thật.

## Kiểm chứng migration

`python cong-cu/qa-reset-tai-khoan.py <D1-export>` chạy hoàn toàn trong SQLite RAM.

| Bản xuất | Bảng xóa | Bảng đang có dữ liệu | Dòng xóa | Tài khoản giữ |
|---|---:|---:|---:|---:|
| D1 local | 68 | 52 | 3.230 | 186 (gồm fixture owner cục bộ) |
| D1 production trước reset | 68 | 33 | 873 | 6 |

Hai bản đều đạt: giữ toàn bộ trường tài khoản ngoài thay đổi đã cho phép,
giữ mật khẩu và metadata xác thực GV/TOTP, không còn khóa ngoại treo,
chạy lại không thay đổi kết quả; thiếu tài khoản owner thì dừng trước khi ghi.
Production có 70 học sinh trước reset. R2 `lop-10a7-anh`: 0 object, 0 B.
Bản xuất và ảnh QA lưu ở `qa/account-reset/`, được gitignore; không commit dữ liệu thật.

## Đối chiếu giao diện

`docs/mockups/1.png` và `2.png` chưa được cung cấp trong repository (thư mục chỉ
có README yêu cầu đặt ảnh). Vì thế không khẳng định pixel parity với hai ảnh mẫu.
Đã xem trực tiếp ảnh render của ứng dụng, đối chiếu cấu trúc JSX trước/sau:

| Khối | Có trong app? | Khác gì |
|---|---|---|
| Header Campus/Bảng tin, logo, chuyển trang, đăng nhập | Có | Giữ cấu trúc, lối vào quản trị dẫn tới danh sách tài khoản |
| Campus trái: Tiêu điểm | Có | Empty-state khi không có nội dung |
| Campus giữa: Học tập/Game | Có | Giữ hai vùng hoạt động |
| Campus phải: Chat rail | Có | Empty-state tin nhắn |
| Bảng tin trái: tiện ích, giữa: bài đăng, phải: bảng vàng/online | Có | Dữ liệu rỗng; bỏ composer/chấm điểm danh theo yêu cầu owner |
| Quản trị desktop | Có | Trang tài khoản duy nhất; bỏ sidebar, menu, các hub cũ |
| Quản trị mobile | Có | Mỗi tài khoản có thẻ và nút Chi tiết, không cuộn ngang |

Các DOM id/hash công khai được giữ; không thêm dữ liệu mẫu vào UI.
