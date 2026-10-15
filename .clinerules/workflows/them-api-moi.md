# Thêm một API mới — Worker Hono (v2)

1. **Xác định phân quyền và vị trí route:**
   - Đặt trong `worker/routes/` hoặc tích hợp vào Hono sub-router trong `worker/index.ts`.
   - Ràng buộc quyền truy cập theo `vai_tro` ('student', 'teacher', 'admin') và `lop_id` từ session token.

2. **Viết route handler an toàn:**

   ```ts
   import { Hono } from 'hono';

   export const apiRouter = new Hono<{ Bindings: Env }>();

   apiRouter.post('/my-endpoint', async (c) => {
     const body = await c.req.json();
     const lopId = c.get('lopId');

     const { results } = await c.env.DB.prepare(
       'SELECT * FROM bang_du_lieu WHERE id = ? AND lop_id = ?'
     ).bind(body.id, lopId).all();

     return c.json({ ok: true, data: results });
   });
   ```

3. **Kiểm tra dữ liệu đầu vào:**
   - Xác thực schema kiểu dữ liệu (TypeScript / Zod).
   - Truy vấn D1 **luôn luôn dùng `.bind(...)`**, tuyệt đối không nối chuỗi SQL.

4. **Kiểm tra quyền truy cập:**
   - Chưa đăng nhập → HTTP 401
   - Sai vai trò / quyền hạn → HTTP 403
   - Đăng nhập đúng quyền → HTTP 200

5. **Kiểm tra mã nguồn:**
   - `npm run typecheck`
   - `npm run lint`
   - Chạy targeted unit test liên quan.
