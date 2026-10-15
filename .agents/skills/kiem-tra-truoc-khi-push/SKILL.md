---
name: kiem-tra-truoc-khi-push
description: Quy trình Local Final Gate bắt buộc trước khi commit/push cho Ace Games v2.
---
1. `npm run typecheck` → 0 lỗi.
2. `npm run lint` → 0 lỗi.
3. Targeted test → 100% xanh (`npx vitest run test/<file>.test.ts` cho web hoặc `npm run game:test` cho Godot).
4. `npm run build:bundle` → bundle tạo thành công.
5. `git diff --check` → 0 lỗi whitespace/conflict markers.
6. Dữ liệu thật: không dùng mock data trong UI.
7. D1/Worker query: mọi câu lệnh truy vấn đọc/ghi phải kèm điều kiện phân quyền và phạm vi dữ liệu (`lop_id`, `vai_tro`).
