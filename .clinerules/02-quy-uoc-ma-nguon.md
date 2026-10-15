# Quy ước viết mã — Ace Games (v2)

## Ngôn ngữ và kiểu mã

- Toàn bộ frontend và worker viết bằng **TypeScript** chặt chẽ (strict mode, 0 typecheck errors).
- Giao diện người dùng: React 19, Tailwind CSS v4, Lucide Icons, shadcn/ui (Base UI).
- Game Core & Renderer: Tách biệt logic game (`src/core/`) và hiển thị canvas/webgl, hoặc Godot Engine (`games-dev/godot-project/`).
- Bình luận và văn bản hiển thị cho người dùng: Tiếng Việt có dấu, rõ ràng.

## Viết một Worker API (Hono)

Tất cả API đặt trong `worker/` hoặc các route con trong `worker/routes/`:

```ts
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.post('/api/example', async (c) => {
  const body = await c.req.json();
  // Ràng buộc tham số D1 an toàn
  const result = await c.env.DB.prepare(
    'SELECT * FROM bang_du_lieu WHERE id = ? AND lop_id = ?'
  ).bind(body.id, c.get('lopId')).all();
  return c.json({ ok: true, data: result.results });
});
```

- Truy vấn D1 **luôn dùng `.bind(...)`**, tuyệt đối không nối chuỗi SQL.
- Mọi câu lệnh đọc/ghi phải kèm điều kiện phân quyền và phạm vi `lop_id`.
- Trả lỗi thân thiện cho client, ghi log chi tiết phía server qua `console.error`.

## Quy tắc Giao diện & Hiệu năng

- Tuân thủ nghiêm ngặt Hiến pháp UI/UX (Mục 8, 12, 17, 18 trong `AGENTS.md`).
- Vùng chạm tối thiểu >= 40px desktop, >= 44px mobile touch; các nút chỉ có icon bắt buộc có `aria-label` và `title`.
- Card cố định không di chuyển tọa độ khi chuyển tab/chế độ (Zero CLS).
- Popup và dialog dùng backdrop siêu trong suốt (tối đa `bg-black/10`), căn giữa an toàn viewport.

## Kiểm tra mã nguồn

```powershell
npm run typecheck    # 0 lỗi TypeScript
npm run lint         # 0 lỗi Oxlint/ESLint
npm run game:test    # 100% GUT unit tests pass
```
