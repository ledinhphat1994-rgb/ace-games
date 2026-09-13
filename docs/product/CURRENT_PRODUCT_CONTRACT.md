# CURRENT PRODUCT CONTRACT — Digital Campus lớp 10A7

> Các quyết định sản phẩm ĐÃ KHÓA. Khi code và tài liệu khác mâu thuẫn, file này ưu tiên sau yêu cầu trực tiếp của owner.
> Cập nhật: 13/09/2026 — đặt lại dữ liệu và chỉ giữ quản trị tài khoản theo xác nhận trực tiếp của owner.

## Khu quản trị — hợp đồng hiện tại

- `/giao-vien/` chỉ có **Danh sách tài khoản**; các hash quản trị cũ chuyển về `#/nguoi-dung`.
- Nguồn danh sách: `tai_khoan_campus`, không gộp học sinh chưa đăng ký từ `hoc_sinh`.
- Chức năng: tìm tên/tên đăng nhập, lọc vai trò/trạng thái, xem chi tiết, khóa/mở khóa, duyệt/từ chối yêu cầu giáo viên.
- `ledinhphat` được owner chỉ định làm quản trị viên toàn trường. Mật khẩu giữ nguyên.
- School Admin quản lý toàn bộ tài khoản. Giáo viên khác giữ phạm vi qua `giao_vien_lop` (và quyền xét yêu cầu giáo viên đang chờ); học sinh/cán sự không vào khu quản trị.
- Không khóa quản trị viên hoặc tự khóa chính mình. Chỉ duyệt tài khoản thực sự đang chờ; không dùng endpoint duyệt để nâng quyền tài khoản thường.
- Đã bỏ các trang/API quản trị lớp, điểm danh, quỹ, thời khóa biểu, nội dung, mã, thư viện, kiểm duyệt, cài đặt/reset. Công cụ tương ứng trên Campus cũng được bỏ.
- Endpoint công khai đọc Bảng tin/Campus và chức năng tham gia phòng của người dùng vẫn được giữ. DOM id và hash của trang lớp giữ nguyên, dữ liệu rỗng có empty-state.

## Đặt lại dữ liệu — migration 79

- Owner đã xác nhận xóa DỮ LIỆU THẬT, gồm cả sổ học sinh và điểm danh.
- Xóa toàn bộ nội dung cũ trong 68 bảng: học sinh, điểm danh, quỹ, TKB, bài đăng, thư viện, chat, quan hệ xã hội, phòng/game, thành tích, nhật ký và bản khôi phục.
- Giữ tài khoản Campus, mật khẩu, vai trò/trạng thái và hồ sơ; gỡ `hoc_sinh_id` đã hết hiệu lực.
- Giữ metadata lớp (`id`, tên, slug…), mã đăng nhập giáo viên/TOTP và phân quyền lớp vì đây là các phụ thuộc xác thực. Xóa mô tả/banner/cấu hình học sinh cũ của lớp.
- Giữ tracker `_migrations` và sequence định danh; không tái sử dụng id cũ.
- Chạy bằng `npm run migrate -- apply --remote`. Migration dừng trước thao tác ghi nếu thiếu tài khoản `ledinhphat` đang hoạt động.
- Dữ liệu mới do người dùng tạo sau reset (chat, phòng, nhật ký đăng nhập…) là hoạt động mới bình thường.

## Campus

- Hoạt động Campus: **Học tập**, **Game**
- **Không có Music standalone** — nhạc/bài giảng/lofi đi qua YouTube trong Học tập
- Điểm danh, thu quỹ, bảng tin giữ nguyên cấu trúc theo `docs/mockups/`

## Study Room (Học tập)

### Vai trò

| Vai trò | Quyền |
|---|---|
| Host | Toàn quyền trong phòng |
| Teacher | Tương đương Host (authority không thể bị học sinh gỡ) |
| Co-host | Điều hành gần như staff; KHÔNG cấp thêm co-host, KHÔNG sửa quyền Teacher |
| Member | Chỉ các capability mà policy phòng cho phép |

### Capability model

Mỗi công cụ = `enabled` + `access_mode` (`staff_only` / `selected_members` / `everyone`).

Mặc định đã khóa:

| Capability | Mặc định |
|---|---|
| video_control (play/pause/seek) | staff_only |
| video_change / queue | staff_only |
| chat | everyone |
| notes / whiteboard / sheet | everyone |
| voice | selected_members (request/approval) |
| invite | everyone |
| moderation (kick/xoá tin) | staff — không cấp cho member |
| đóng phòng / đổi password | host + teacher |

### Capacity

- Default: **8** · Min: **2** · Max v1: **12** (server-side enforced)
- Lộ trình tăng: 12 → 20 → 30 → 40 — chỉ khi có benchmark chứng minh

### Voice

- **1-to-1 P2P WebRTC** — tối đa 1 cặp/phòng ở v1
- "Voice → everyone" = mọi người ĐỦ ĐIỀU KIỆN dùng voice, KHÔNG phải conference 8–20 người
- Group conference cần SFU/TURN — KHÔNG triển khai ở giai đoạn này
- Hiện chỉ có STUN (stun.l.google.com); TURN chưa có

### Collaboration v2

- Notes: entry append (mỗi người một dòng, có thể gắn mốc video)
- Whiteboard: append-only ops (stroke/clear), KHÔNG whole-doc overwrite
- Sheet: upsert từng ô (A1..H10), KHÔNG whole-sheet conflict

## Class code

- Mã lớp xác minh membership — KHÔNG bắt buộc cho truy cập Campus chung
- Mọi dữ liệu lớp ràng `lop_id` từ session, không tin client

## Hạ tầng — đã khóa KHÔNG làm ở giai đoạn này

- Không migrate sang Durable Objects/WebSocket (hoàn thiện chức năng trước)
- Không AI/quiz/PDF/screen-share trong Study Room
- Không bundler (Webpack/Vite/Next)
