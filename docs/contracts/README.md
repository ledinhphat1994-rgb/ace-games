# docs/contracts — API Contracts

Thư mục chứa các API contract **đã được accept** — nguồn thật duy nhất để frontend consume.

## Quy tắc

- Mỗi file = 1 feature/phiên bản: `<feature>-api-v<N>.md`
- Header bắt buộc ghi: **status** (`draft` / `accepted`), **backend commit SHA**, **ngày**
- Frontend chỉ implement theo contract `accepted` — `draft` có thể đọc để chuẩn bị nhưng KHÔNG được coi là đã khóa.
- Thay đổi contract đã accept → sửa contract trước, ghi SHA mới, rồi mới sửa code theo.

## Danh sách

| File | Status | Ghi chú |
|---|---|---|
| `study-room-governance-api-v1.md` | ACCEPTED_BACKEND_CANDIDATE | Study Room governance + collab v2 + voice pair — QA 163/163, chờ review độc lập |
