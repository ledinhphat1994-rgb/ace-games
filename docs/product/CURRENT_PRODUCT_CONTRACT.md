# CURRENT PRODUCT CONTRACT — Digital Campus lớp 10A7

> Các quyết định sản phẩm ĐÃ KHÓA. Khi code và tài liệu khác mâu thuẫn, file này ưu tiên sau yêu cầu trực tiếp của owner.
> Cập nhật: giai đoạn Study Room governance (post-audit `cd3a051`).

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
