# docs/contracts — API Contracts (SWE 2 → Claude handoff)

Thư mục chứa các API contract **đã được accept** mà frontend (Claude) được phép consume.

## Quy tắc

- Mỗi file = 1 feature/phiên bản: `<feature>-api-v<N>.md`
- Header bắt buộc ghi: **status** (`draft` / `accepted`), **backend commit SHA**, **ngày**
- Claude chỉ được implement frontend theo contract `accepted`.
- Contract `draft` = SWE 2 đang triển khai — frontend có thể đọc để chuẩn bị nhưng KHÔNG được coi là đã khóa.
- Thay đổi contract đã accept → phải quay lại SWE 2, không sửa ngầm.

## Danh sách

| File | Status | Ghi chú |
|---|---|---|
| `study-room-governance-api-v1.md` | draft | Study Room governance + collab v2 + voice pair — backend đang triển khai, chưa qua review gate |
