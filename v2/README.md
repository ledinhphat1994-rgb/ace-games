# Digital Campus v2 (bản rebuild)

Bản viết lại của Digital Campus lớp 10A7: Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui (Base UI),
chạy trên Cloudflare Workers + static assets + Durable Objects (SQLite, gói Free), dùng lại D1 hiện có.

> Đang ở **Phase 0** (nền móng). Web đang chạy thật vẫn là bản cũ ở thư mục gốc repo —
> **không** chạy `npm run deploy` của thư mục gốc từ nhánh này (sẽ deploy đè gdtxdinhquan.com).

## Yêu cầu

- Node **24 LTS** ghim riêng cho dự án: gói npm `node` (devDependencies) + file `.node-version`. Node hệ
  thống của máy vẫn là Node 20 cho dự án khác — **không** nâng Node hệ thống.
- Trong thư mục `v2/`, mọi lệnh chạy qua `npm run ...`, `npm exec -- ...` hoặc `npx ...` đều dùng Node 24
  của dự án. Gõ thẳng `node` ngoài npm thì vẫn là Node 20 của máy.
- Chạy `npm install` khi đang đứng trong thư mục `v2/`. Không dùng `npm install --prefix ...` để thêm
  gói — npm từng tự thêm nhầm cả repo chính thành dependency `file:`.

## Chạy thử trên máy

1. Chép `.dev.vars.example` thành `.dev.vars`, điền `SESSION_SECRET` là một chuỗi ngẫu nhiên dài.
2. Nạp dữ liệu vào D1 local (bản sao, không đụng production):
   `npx wrangler d1 execute lop-10a7-db-staging --local --file=<file .sql xuất từ D1 local của app cũ>`
   File dump chứa tên và hash mật khẩu thật — để ngoài repo và xoá ngay sau khi nạp.
3. `npm run dev` — giao diện + Worker + Durable Object chạy chung trong Vite (http://localhost:5173).
   Qua Vite dev, request WebSocket bị từ chối (401/403) chỉ hiện là mất kết nối; muốn thấy đúng mã lỗi
   thì dùng bước 4.
4. `npm run build && npm run preview:worker` — chạy bản build trên `wrangler dev`
   (http://localhost:8787), giống runtime production. Không chạy song song với bước 3 vì cả hai dùng
   chung dữ liệu local.

## Kiểm tra

- `npm run typecheck` — sinh type cho Worker rồi chạy `tsc -b` (cả giao diện, Worker và thư mục test).
- `npm run lint` — Oxlint.
- `npm test` — Vitest chạy ngay trong Workers runtime (`@cloudflare/vitest-plugin`): tương thích mật khẩu/token
  với bản cũ, API đăng nhập, phòng real-time. Schema + tài khoản thử nằm trong `test/`, không đụng D1 thật.
- CI GitHub Actions (`.github/workflows/v2-ci.yml`) chạy đủ 4 bước trên mỗi lần đổi `v2/`.

## Cấu trúc

- `worker/index.ts` — định tuyến `/api/*` và `/ws/room/:id` (kiểm tra Origin + phiên trước khi vào phòng).
- `worker/room-do.ts` — Durable Object mỗi phòng, dùng WebSocket Hibernation API.
- `worker/lib/` — token phiên, mật khẩu, kiểm tra phiên với D1; `worker/routes/` — handler API.
- `src/` — frontend: `features/`, `hooks/`, `lib/`, `components/ui/` (shadcn).

## Tương thích với bản cũ (bắt buộc giữ)

- Mật khẩu PBKDF2-SHA256, salt/hash dạng hex, số vòng lấy theo từng dòng `tai_khoan_campus.iterations`.
- Token phiên `<payload-base64url>.<HMAC-SHA256>`, cookie `c10a7_session` (HttpOnly, SameSite=Lax, 7 ngày)
  — cùng secret thì phiên của bản cũ và bản mới dùng thay nhau được.
- 1 tài khoản 1 thiết bị qua cột `thiet_bi`; đăng xuất **không** gỡ `thiet_bi` (gỡ sẽ làm token cũ ở
  thiết bị đã bị đá ra hợp lệ trở lại).

## Deploy preview

- Bản preview: https://gdtxdinhquan-v2.ledinhphat1994.workers.dev (Worker `gdtxdinhquan-v2`, tài khoản
  Cloudflare ghim trong `wrangler.jsonc`).
- Dữ liệu: D1 `lop-10a7-db-staging` + KV `gdtxdinhquan-v2-rate-limit`, riêng cho v2. Hiện chỉ có cấu trúc
  73 bảng, 2 lớp và 3 tài khoản thử `qa.v2.*` — chưa có tài khoản thật.
- `npm run deploy` = build + `wrangler deploy`. `SESSION_SECRET` của preview đã lưu trên Cloudflare (khác
  web thật) và được giữ qua các lần deploy; muốn đổi thì dùng `npx wrangler secret put SESSION_SECRET`.
- Bảng binding in ra khi deploy hiển thị `preview_database_id` cho D1, nhưng binding thật là
  `database_id` — kiểm tra trong `dist/gdtxdinhquan_v2/wrangler.json` nếu nghi ngờ.
- **Không bao giờ** đặt id của D1 production `lop-10a7-db` vào `wrangler.jsonc`.
- Chép tài khoản thật sang staging phải được owner đồng ý (dữ liệu cá nhân + hash mật khẩu). Không dùng
  `wrangler d1 export --remote` trong giờ học: lệnh này chặn truy vấn của web thật trong lúc chạy.
