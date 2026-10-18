# Ace Games

Đấu Trường Trò Chơi Trực Tuyến 100% Mobile: Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (Base UI), chạy trên Cloudflare Workers + static assets + Durable Objects (SQLite, WebSocket Hibernation API), tích hợp cơ sở dữ liệu Cloudflare D1, KV và R2.


## Yêu cầu môi trường

- Node **24 LTS** ghim riêng cho dự án: gói npm `node` (devDependencies) + file `.node-version`.
- Mọi lệnh chạy qua `npm run ...`, `npm exec -- ...` hoặc `npx ...` đều dùng Node 24 của dự án tại thư mục gốc.

## Chạy thử trên máy (Local Development)

1. Chép `.dev.vars.example` thành `.dev.vars`, điền `SESSION_SECRET` là một chuỗi bí mật ngẫu nhiên.
2. `npm run dev` — giao diện + Worker + Durable Object chạy chung trong Vite (http://localhost:5173).
3. `npm run build && npm run preview:worker` — chạy bản build trên `wrangler dev` (http://localhost:8787), mô phỏng chính xác môi trường runtime production.

## Kiểm tra chất lượng (Quality Gates)

- `npm run typecheck` — sinh Cloudflare types (`wrangler types`) rồi chạy `tsc -b` (cả giao diện, Worker và thư mục test).
- `npm run lint` — kiểm tra cú pháp và quy chuẩn bằng Oxlint.
- `npm test` — chạy bộ kiểm thử Vitest trong Workers runtime (`@cloudflare/vitest-plugin`).
- `npm run build` — đóng gói production bundle sẵn sàng triển khai.

## Cấu trúc dự án

- `worker/index.ts` — router chính Hono, định tuyến `/api/*`, `/ws/campus`, `/ws/room/:id`.
- `worker/campus/campus-do.ts` — Durable Object cho sảnh toàn trường (danh sách online, danh bạ phòng, chat toàn trường).
- `worker/room-do.ts` — Durable Object cho từng phòng học (đồng bộ YouTube, bảng vẽ nháp, ghi chú, Game Arena đối kháng).
- `worker/game-engine.ts` — engine cờ Caro, Connect 4 và Reversi xử lý lượt đi và trọng tài trong phòng game.
- `worker/games/game-lobby-do.ts` — Durable Object danh bạ các bàn đối kháng đang mở (RoomDO báo qua RPC), phục vụ `GET /api/game/rooms` cho sảnh Đấu Trường Game.
- `worker/lib/` — thư viện xác thực phiên HMAC, kiểm tra mật khẩu PBKDF2, phân quyền scope.
- `src/` — frontend React 19 SPA: `features/` (hub, study, games, auth), `components/ui/` (shadcn), `hooks/`.
- `shared/` — giao thức WebSocket và types dùng chung giữa frontend và Worker (`protocol/`, `rooms/`).

## Tương thích dữ liệu hệ thống cũ

- **Mật khẩu:** PBKDF2-SHA256, salt/hash dạng hex, số vòng băm lấy theo từng dòng `tai_khoan_campus.iterations`.
- **Token phiên:** Định dạng `<payload-base64url>.<HMAC-SHA256>`, cookie `c10a7_session` (HttpOnly, SameSite=Lax).
- **Cơ chế 1 thiết bị:** Khóa phiên qua cột `thiet_bi`; đăng nhập thiết bị mới tự động ngắt kết nối thiết bị cũ với mã `4001`.

## Cấu hình Cloudflare & Deploy

- File cấu hình: `wrangler.jsonc` tại thư mục gốc.
  - Production D1: `lop-10a7-db` (`a12de014-e9d2-4d6d-994f-dcb36c481432`)
  - Production KV: `RATE_LIMIT` (`e2529ac570cb4d77a246f38953dcbc9f`)
  - Production R2: `ANH` (`lop-10a7-anh`)
  - Staging D1: `lop-10a7-db-staging` (`46ed8936-b447-4f10-8983-8f3c3d310e9f`)
  - Staging KV: `d8cd90e018eb4da3ba697aaba555115c`
  - Staging R2: `ANH` (`lop-10a7-anh-staging`)
- Lệnh deploy chính thức:
  - Staging: `npm run deploy:staging`
  - Production: `npm run deploy:production`
  - Lệnh chung `npm run deploy` bị cố ý chặn (hard-blocked) để tránh triển khai nhầm môi trường.
