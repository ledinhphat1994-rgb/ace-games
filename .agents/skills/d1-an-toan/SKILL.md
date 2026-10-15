---
name: d1-an-toan
description: Quy tắc viết query D1 an toàn đa lớp cho Worker API & Durable Objects. Dùng khi thêm/sửa bất kỳ câu SQL.
---
- Lấy lopId = phien.lopId (không nhận từ query/body). Teacher cũng không được override trừ khi có bảng phân quyền rõ.
- SELECT/UPDATE/DELETE theo id → luôn `AND lop_id = ?`. Ghi/đổi trạng thái → dùng UPDATE có điều kiện (atomic).
- Migration mới: `migrations/00xx_ten.sql`, có `IF NOT EXISTS`, không `DELETE` thiếu `WHERE`. Test bằng `npx wrangler d1 execute DB --local --file=...` hoặc `npm run d1:migrate:local`.
- Trả lỗi chung chung cho client (`c.json({ error: 'Máy chủ đang bận...' }, 500)`), log chi tiết bằng console.error.
