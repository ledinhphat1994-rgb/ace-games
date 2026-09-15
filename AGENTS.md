# Digital Campus v2 — Quy tắc bắt buộc

## 1. Kiến trúc hệ thống chính thức
- **Runtime & Deployment:** Cloudflare Workers + Static Assets + Durable Objects (SQLite, WebSocket Hibernation API) + D1 Database + KV (Rate Limit) + R2 (Lưu trữ ảnh & media).
- **Frontend:** Vite 8 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (Base UI) + Lucide Icons + TanStack Query.
- **Backend / Workers:** Hono API Router (`worker/index.ts`), Durable Objects (`CampusDO` cho sảnh toàn trường & chat trực tiếp, `RoomDO` cho phòng học nhóm / YouTube sync / Game Arena).
- **Shared Contracts:** Giao thức WebSocket & Type dùng chung tại `shared/protocol/` (`campus.ts`, `room.ts`, `game.ts`, `common.ts`).

## 2. Tiêu chuẩn chất lượng & Kiểm tra bắt buộc (Quality Gates)
Trước khi commit hoặc push:
1. `npm run typecheck` — Tạo kiểu Cloudflare (`wrangler types`) và kiểm tra TypeScript (`tsc -b`). Phải đạt 0 lỗi.
2. `npm run lint` — Chạy `oxlint`. Phải đạt 0 lỗi.
3. `npm test` — Chạy toàn bộ Vitest suite (`vitest run`) trên môi trường giả lập Workers runtime (`@cloudflare/vitest-plugin`). Đảm bảo 100% test xanh (51/51 tests).
4. `npm run build` — Đóng gói production bundle cho cả Worker và Client. Phải build thành công không lỗi.

## 3. Quy tắc bảo toàn dữ liệu & Tương thích hệ thống (Data Invariants)
- **Mật khẩu:** Thuật toán PBKDF2-SHA256 với salt/hash hex, số vòng lấy theo từng dòng `tai_khoan_campus.iterations` của cơ sở dữ liệu gốc.
- **Token phiên:** Định dạng `<payload-base64url>.<HMAC-SHA256>`, cookie `c10a7_session` (HttpOnly, SameSite=Lax).
- **Phiên đăng nhập duy nhất:** Cơ chế 1 tài khoản 1 thiết bị thông qua cột `thiet_bi`. Khi đăng nhập ở thiết bị mới, thiết bị cũ bị đá ra với mã WebSocket `4001` (Strict Single-device). Đăng xuất không gỡ `thiet_bi`.
- **An toàn truy vấn D1:** Mọi truy vấn đọc/ghi dữ liệu lớp/học sinh phải kèm điều kiện phân quyền và phạm vi dữ liệu (`lop_id`, `vai_tro`), không tin tưởng dữ liệu thô gửi từ client.
- **Dữ liệu thật:** Không dùng mock data hoặc placeholder arrays trong UI. Mọi dữ liệu lấy qua API thật hoặc WebSocket snapshot. Ô trống hiển thị empty-state.

## 4. Chống giật màn hình & Trải nghiệm người dùng (Zero CLS & Anti-Jitter)
- **Cấm hijack window scroll:** Tuyệt đối không gọi `scrollIntoView()` trên các phần tử con nội tuyến. Mọi cuộn tự động (chat, danh sách) chỉ được cuộn nội bộ trong container cha (`container.scrollTo`).
- **Focus an toàn:** Khi gọi `.focus()` qua JavaScript, luôn kèm `{ preventScroll: true }`. Tuyệt đối không đặt thuộc tính `autoFocus` trên input nội tuyến.
- **Zero CLS khi chuyển view:** Các khung tab hoặc view song song phải khóa chiều cao tối thiểu và có empty-state căn giữa chiếm trọn không gian, tránh làm sụt lún layout khi nội dung thay đổi.
- **Bố cục 2 cột độc lập:** Bố cục 2 cột cạnh nhau phải sử dụng `items-start` và `self-start`, không dùng `self-stretch` gây giằng co kéo giật chiều cao giữa các cột.

## 5. Quy tắc Git & Deploy
- Mọi thay đổi hoàn tất phải tự động kiểm thử toàn diện, commit với thông điệp rõ ràng chuẩn conventional, push lên nhánh làm việc và sẵn sàng deploy lên domain chính thức.
