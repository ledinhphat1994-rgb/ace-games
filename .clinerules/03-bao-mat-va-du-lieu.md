# Bảo mật và an toàn dữ liệu — Ace Games (v2)

Dữ liệu học sinh và trận đấu là dữ liệu thật: điểm số, thành tựu, thông tin tài khoản, phòng học.
An toàn và bảo mật là bất biến tối cao.

## Bí mật & Môi trường

- `SESSION_SECRET`, `JWT_SECRET`, và các khóa bảo mật chỉ tồn tại ở:
  biến môi trường Cloudflare (Production/Staging) và `.dev.vars` (đã bị `.gitignore`).
- Tuyệt đối **không bao giờ** commit mã bí mật, API key hoặc token vào Git.
- Cấu hình cục bộ nằm trong `.dev.vars` / `.env.e2e`.

## Xác thực & Quản lý Phiên (Auth Invariants)

- **Mật khẩu:** Thuật toán PBKDF2-SHA256 với salt/hash hex, số vòng lấy theo từng dòng `tai_khoan_campus.iterations`.
- **Token phiên:** Định dạng `<payload-base64url>.<HMAC-SHA256>`, cookie `c10a7_session` (HttpOnly, SameSite=Lax).
- **Phiên đăng nhập duy nhất:** Cơ chế 1 tài khoản 1 thiết bị qua cột `thiet_bi`. Thiết bị mới đá thiết bị cũ với mã WebSocket `4001` (Strict Single-device).
- **Phân quyền Server-Authoritative:** Server kiểm tra quyền độc lập, tuyệt đối không tin tưởng client claims.

## Cơ sở dữ liệu D1 & Migrations

- Mọi truy vấn đọc/ghi dữ liệu lớp/học sinh **bắt buộc** kèm điều kiện phân quyền và phạm vi dữ liệu (`lop_id`, `vai_tro`).
- Thử nghiệm cục bộ: `npm run d1:migrate:local` hoặc `npx wrangler d1 execute DB --local --command "..."`.
- **Migrations bất biến:** Các tệp trong `migrations/` sau khi đã áp dụng là bất biến. Mọi thay đổi schema mới bắt buộc tạo tệp mới đánh số tiếp theo (`migrations/00xx_*.sql`), có `IF NOT EXISTS` và không xóa thiếu `WHERE`.
- Dữ liệu thật: Tuyệt đối không dùng mock data hoặc placeholder arrays trong UI.

## Quy tắc Git

- Không dùng `git push --force`, `git reset --hard` làm mất lịch sử mã nguồn.
- Không đưa vào commit: `.dev.vars`, `.wrangler/`, `dist/`, `public/games/godot/*.pck` nặng.
