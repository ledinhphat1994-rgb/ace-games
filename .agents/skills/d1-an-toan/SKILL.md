---
name: d1-an-toan
description: Quy tắc viết query D1 đa lớp cho functions/api. Dùng khi thêm/sửa bất kỳ câu SQL.
---
- Lấy lopId = phien.lopId (không nhận từ query/body). Teacher cũng không được override trừ khi có bảng phân quyền rõ.
- SELECT/UPDATE/DELETE theo id → luôn `AND lop_id = ?`. Ghi/đổi trạng thái → dùng UPDATE có điều kiện (atomic) như game.js.
- Migration mới: `co-so-du-lieu/NN-ten.sql`, có `IF NOT EXISTS`, không `DELETE` thiếu `WHERE`. Test bằng `npx wrangler d1 execute lop-10a7-db --local --file=...`.
- Trả lỗi chung chung cho client (`loi('Máy chủ đang bận...')`), log chi tiết bằng console.error.
