# SYSTEM CONTEXT & CONSTRAINTS: DIGITAL CAMPUS (GDTX ĐỊNH QUÁN)

## 1. KIẾN TRÚC CÔNG NGHỆ CHÍNH THỨC
- **Nền tảng:** Cloudflare Workers + Static Assets + Durable Objects (SQLite, WebSocket Hibernation API).
- **Cơ sở dữ liệu & Lưu trữ:** Cloudflare D1 (`DB`), Cloudflare KV (`RATE_LIMIT`), Cloudflare R2 (`ANH`).
- **Giao diện:** Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui.
- **Backend Router:** Hono (`worker/index.ts`), Durable Objects (`worker/campus/campus-do.ts`, `worker/room-do.ts`).

## 2. QUY CHUẨN DỮ LIỆU & NGUYÊN TẮC BẤT BIẾN
- **ZERO MOCK DATA:** Tuyệt đối không nhúng mảng mẫu/mock data tĩnh trong code. Mọi dữ liệu phải bắt nguồn từ D1 qua API hoặc snapshot WebSocket của Durable Object.
- **TƯƠNG THÍCH MẬT KHẨU & PHIÊN:** Duy trì tương thích 100% với tài khoản hiện hữu:
  - Mật khẩu: PBKDF2-SHA256 với salt/hash hex và số vòng băm lấy theo cột `iterations` của từng tài khoản.
  - Phiên: Token HMAC-SHA256 kết hợp cookie `c10a7_session`.
  - Cơ chế 1 thiết bị: Cột `thiet_bi` trong cơ sở dữ liệu khóa chặt phiên duy nhất; đăng nhập mới ngắt kết nối thiết bị cũ với mã `4001`.
- **CODE HOÀN CHỈNH 100%:** Tuyệt đối không dùng `// TODO`, placeholder hoặc mã dở dang. Mọi thành phần đều có xử lý lỗi, loading và empty-state.

## 3. ZERO UNWANTED SCREEN JITTER & SCROLL HIJACKING (QUY TẮC CHỐNG GIẬT MÀN HÌNH)
- **CẤM HIJACK WINDOW SCROLL:** Tuyệt đối KHÔNG gọi `scrollIntoView()` trên các phần tử con nội tuyến. Mọi cuộn tự động (chat, thông báo, danh sách) chỉ được cuộn nội bộ container bằng `container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })` trên chính phần tử có thanh cuộn (`overflow-y: auto`).
- **ZERO CLS KHI CHUYỂN TAB & SUB-VIEW:** Khung chứa các tab song song (YouTube search vs Hàng đợi, Chat vs Ghi chú vs Bảng vẽ, Cờ Caro vs Connect 4) PHẢI cố định chiều cao tối thiểu (`h-[...]` hoặc `min-h-[...]` + `overflow-hidden` khung ngoài, `overflow-y-auto` bên trong). Không để tab rỗng làm sụt lún chiều cao toàn trang. Luôn có empty-state căn giữa chiếm trọn chiều cao khi rỗng.
- **CẤM AUTOFOCUS GÂY GIẬT VIEWPORT:** Không đặt thuộc tính `autoFocus` trên các form/input nội tuyến trong trang vì sẽ ép trình duyệt nhảy màn hình tới vị trí input. Khi gọi `.focus()` qua JavaScript, BẮT BUỘC luôn truyền `{ preventScroll: true }`.
- **ĐỘC LẬP BỐ CỤC CỘT ĐÔI:** Bố cục 2 cột nằm cạnh nhau (Video và StudyDock, v.v.) phải dùng `items-start` và `self-start`, tuyệt đối không dùng `self-stretch` hay `items-stretch` kéo giãn chéo nhau. Chiều cao của một cột thay đổi không bao giờ được phép làm co giãn hay giật cột bên cạnh.
- **CHỐNG GIẬT THANH CUỘN & NEO CUỘN:** `html` luôn có `scrollbar-gutter: stable` để tránh giật ngang layout khi thanh cuộn xuất hiện/biến mất. Khung tab động có nội dung thay đổi nhiều gán `overflow-anchor: none` (hoặc inline `style={{ overflowAnchor: 'none' }}`) để ngăn trình duyệt tự ý bù trừ thanh cuộn.

## 4. QUY TRÌNH KIỂM THỬ TRƯỚC KHI DEPLOY
1. `npm run typecheck` — 0 lỗi TypeScript & Cloudflare types.
2. `npm run lint` — 0 lỗi linter (oxlint).
3. `npm test` — Toàn bộ test xanh 100%.
4. `npm run build` — Build production bundle thành công.
