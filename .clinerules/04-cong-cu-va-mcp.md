# Công cụ trên máy này

## Vỏ lệnh là Windows PowerShell 5.1

Nối lệnh bằng dấu `;` — **`&&` không chạy được**.
Đường dẫn dự án có dấu tiếng Việt và dấu cách, luôn bọc trong dấu ngoặc kép.

## Lệnh hay dùng

| Lệnh | Việc |
|---|---|
| `npm run kiem-tra-du-lieu` | Soát JSON, cú pháp JS, SQL nguy hiểm, rò rỉ mã bí mật |
| `npm run lint` | ESLint cho toàn bộ JS |
| `npm run dev` | Build rồi chạy thử ở `http://localhost:8788` (đọc `.dev.vars`) |
| `npm run kiem-tra` | Xác nhận đang dùng đúng tài khoản GitHub/Cloudflare |
| `npm run deploy` | Kiểm tra → build → đăng lên Cloudflare |
| `npm run log` | Xem log trực tiếp của trang đang chạy |
| `npm run d1-cuc-bo -- --command "SELECT ..."` | Truy vấn D1 **trên máy** |
| `npm run d1-that -- --command "SELECT ..."` | Truy vấn D1 **thật** (chỉ đọc, cẩn thận) |

## Vì sao `npm run dev` có thêm `--compatibility-date`

Máy này **phải giữ Node.js 20** để khớp với VPS của một dự án khác (bot Telegram) — không nâng Node.

Chuỗi ràng buộc sinh ra từ đó:

- `wrangler.toml` đặt `compatibility_date = "2026-09-03"` (môi trường chạy của trang thật).
- Wrangler 4.86 — bản mới nhất còn chạy trên Node 20 — chỉ mang runtime tới `2026-05-03`,
  nên nếu không làm gì thì máy chủ thử báo lỗi *"requires compatibility date ... newest supported is 2026-05-03"*.
- Các bản wrangler có runtime đủ mới đều **đòi Node ≥ 22**.

Cách đang dùng: script `dev` truyền `--compatibility-date=2026-05-03`, tức **chỉ hạ ngày cho lúc chạy thử
trên máy**. `wrangler.toml` giữ nguyên `2026-09-03`, nên trang thật không đổi gì.

- **Đừng** sửa `compatibility_date` trong `wrangler.toml` — đó là đổi môi trường chạy của trang đang phục vụ học sinh.
- Runtime lúc thử là bản tháng 5/2026, thật là tháng 9/2026. Khác biệt chỉ ở vài cờ nhỏ, không ảnh hưởng
  D1/KV/cookie mà dự án đang dùng — nhưng nếu gặp hành vi lạ chỉ xảy ra ở máy thì nhớ tới điều này.
- Khi nào máy dùng được Node ≥ 22 thì bỏ tham số đó đi và `npm install --save-dev wrangler@latest`,
  đồng thời sửa `node-version` trong `.github/workflows/dang-len-cloudflare.yml` cho khớp.

## MCP đã cài

| Server | Dùng khi nào |
|---|---|
| `cloudflare-docs` | Tra cứu Pages Functions / D1 / KV **trước khi đoán** cú pháp Cloudflare |
| `cloudflare-bindings` | Xem danh sách D1, KV, project thật. Tự động chỉ cho phép các lệnh **đọc**; mọi lệnh ghi phải xin phép |
| `cloudflare-observability` | Xem log, lỗi 500 thật của trang khi giáo viên báo sự cố |
| `playwright` | Mở trình duyệt kiểm tra thật giao diện: đăng nhập, điểm danh, sổ điểm |
| `memory` | Ghi lại quyết định thiết kế, lỗi đã gặp, việc đang dở giữa các phiên làm việc |

Quy tắc khi dùng:

- Playwright chỉ chạy trên `http://localhost:8788` với mã trong `.dev.vars`.
  Muốn thử trên trang thật thì hỏi giáo viên trước, và **không gõ mã thật vào bản ghi hội thoại**.
- `cloudflare-bindings` không dùng để sửa/xoá dữ liệu. Sửa dữ liệu là việc của giao diện web,
  để còn giữ được lịch sử và điểm khôi phục.
- Lần đầu chạy hai server `bindings` và `observability` sẽ mở trình duyệt xin đăng nhập Cloudflare.
- Playwright cần tải trình duyệt một lần: `npx playwright install chromium`.

## Kiểm tra trước khi báo là xong

Không nói "đã xong" khi chưa chạy được ít nhất một trong các bước sau:

1. `npm run kiem-tra-du-lieu` không lỗi.
2. `npm run dev` mở được trang và luồng vừa sửa hoạt động (tự kiểm bằng Playwright nếu có thể).
3. Với API: gọi thử bằng `curl`/Playwright, xem cả trường hợp không có quyền (401/403).
