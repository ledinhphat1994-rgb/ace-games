# ARCHITECTURE — Digital Campus v2

Tài liệu kiến trúc chính thức của Digital Campus v2 (GDTX Định Quán). Cập nhật 09/2026.

## 1. Tổng quan Kiến trúc

Hệ thống hoạt động theo mô hình Edge-native hiện đại trên Cloudflare Workers & Durable Objects:

```
[Browser / Client]
  │
  ├─ HTTP/REST ──► Cloudflare Workers (Hono Router: worker/index.ts)
  │                  ├── Auth & Sessions (worker/routes/auth.ts, KV + D1)
  │                  ├── R2 File Uploads (worker/index.ts, Allowlist & Quota)
  │                  ├── Social Feed & Campus (worker/routes/campus.ts, D1)
  │                  └── Highscore Leaderboards (worker/index.ts, D1)
  │
  └─ WebSocket ──► Durable Objects (Realtime Engine with SQLite & Hibernation API)
                     ├── RoomDO (Study Room & 2-Player Arena: caro, connect4, reversi)
                     ├── CampusDO (Sảnh toàn trường, Chat trực tiếp & Hiện diện)
                     └── GameLobbyDO (Danh sách bàn cờ & matchmaking)
```

## 2. Bản đồ Thư mục (Domain ↔ File)

### 2.1. Backend (`worker/`)
- `worker/index.ts`: Worker entrypoint, Hono router, middleware xác thực (`kiemTraPhien`), WebSocket gateway `/ws/room/:maPhong`, `/ws/game/:maPhong`, `/ws/campus`, R2 upload endpoint `/api/upload` (kiểm tra auth, quota 20/10p, MIME allowlist).
- `worker/room-do.ts`: Durable Object quản lý phòng học (Study Room) và sàn đấu cờ (Arena). Tích hợp SQLite cục bộ, kiểm tra luật chơi server-authoritative, runtime validation qua `LenhPhong.safeParse()` & `LenhGame.safeParse()`, phân quyền Host / Giáo viên / Admin điều khiển video, slide, xóa nét vẽ.
- `worker/campus-do.ts`: Durable Object quản lý sảnh trường học và chat toàn trường.
- `worker/games/game-lobby-do.ts`: Quản lý danh sách bàn cờ thời gian thực trong sảnh game.
- `worker/game-engine.ts`: Logic luật cờ chuẩn xác (Caro 15x15, Connect 4, Reversi 8x8) và khởi tạo bàn cờ.
- `worker/routes/auth.ts`: Xác thực PBKDF2-SHA256, session token HMAC-SHA256, luồng quên mật khẩu OWASP (mã OTP ngẫu nhiên 6 số, TTL 15 phút, lưu KV), không tự động gán lớp khi đăng ký tự do.
- `worker/routes/campus.ts`: API bài đăng, bình luận, bảng tin trường lớp trên D1.

### 2.2. Giao thức Dùng chung (`shared/protocol/`)
Hợp đồng dữ liệu được chia sẻ giữa Frontend và Backend, định nghĩa kiểu và Zod runtime validation:
- `shared/protocol/room.ts`: Schema tin nhắn phòng học `LenhPhong` (media, pomodoro, whiteboard, notes, queue, slide, chat, mic).
- `shared/protocol/game.ts`: Schema game cờ `LenhGame` (init, join, move, surrender, rematch, emote).
- `shared/protocol/campus.ts`: Schema sảnh và chat campus.
- `shared/protocol/common.ts`: Tiện ích làm sạch chuỗi `lamSachVanBan`.

### 2.3. Frontend (`src/`)
- `src/main.tsx`: Entrypoint React 19, React Router, QueryClientProvider.
- `src/app/routes.tsx`: Cấu trúc định tuyến (`/` Sảnh Hub, `/room/:roomId` Phòng học, `/arena` Sảnh đấu cờ, `/game/:gameId` Bàn cờ).
- `src/features/auth/`: Đăng nhập, Đăng ký (học sinh / giáo viên), Khôi phục mật khẩu (2-bước OTP an toàn).
- `src/features/hub/`: Sảnh trường, Bảng tin, Danh sách phòng học và mini-app.
- `src/features/study/`:
  - `StudyRoomView.tsx`: Blackboard canvas toàn màn hình, thanh công cụ dock.
  - `FloatingVideoPlayer.tsx`: Trình phát YouTube đồng bộ thời gian thực.
  - `FloatingSlidePanel.tsx` & `SlideUploadModal.tsx`: Trình chiếu Slide PowerPoint / PDF / Ảnh.
  - `Fx580Calculator.tsx`: Máy tính khoa học bỏ túi.
- `src/features/games/`: Sảnh cờ và bàn đấu Caro, Connect4, Reversi, 2048.
- `src/features/profile/`: Modal xem hồ sơ, đổi avatar, đổi mật khẩu cá nhân.
- `src/lib/api.ts`: Client fetcher có typing và xử lý lỗi đồng bộ.

## 3. Quy tắc Bảo mật & Dữ liệu Bắt buộc (Security Invariants)

1. **Identity & Class Scope:**
   - Tài khoản Campus tự do không mặc định là học sinh của bất kỳ lớp nào (`lop_id = NULL`).
   - Chỉ học sinh có mã lớp hợp lệ hoặc được giáo viên phê duyệt mới được gán `lop_id`.
2. **Password Recovery:**
   - Không dùng mã tĩnh hay mã chung của trường/lớp để reset mật khẩu.
   - Mã khôi phục gồm 6 chữ số ngẫu nhiên do hệ thống tạo (hoặc do GVCN/Admin cấp trực tiếp), có thời hạn 15 phút, dùng 1 lần (single-use), giới hạn 5 lần thử sai.
3. **Upload Security:**
   - Tuyệt đối yêu cầu đăng nhập trước khi tải tệp (`kiemTraPhien`).
   - Giới hạn quota 20 tệp / 10 phút qua Cloudflare KV.
   - Kiểm tra chặt chẽ phần mở rộng và MIME type (`.pptx`, `.ppt`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`).
   - Tên tệp lưu trữ trên R2 dùng UUID ngẫu nhiên, không để lộ đường dẫn gốc.
4. **Study Room Governance:**
   - Mặc định bảo vệ video học tập và trình chiếu (`hostOnlyControl = true`).
   - Chỉ Host hoặc Giáo viên / Quản trị viên trường mới có quyền đổi video, xóa toàn bộ nét vẽ trên bảng, đổi slide hoặc phát nhạc từ hàng đợi.
5. **No Request-path DDL:**
   - Không chạy `CREATE TABLE` / `CREATE INDEX` trong request path của API. Mọi cấu trúc dữ liệu được quản lý bởi migration.

## 4. Kiểm tra Chất lượng (Quality Gates)

Trước khi commit và deploy:
1. `npm run typecheck` — `wrangler types && tsc -b` (0 lỗi)
2. `npm run lint` — `oxlint` (0 lỗi)
3. `npm test` — `vitest run` (Toàn bộ test trong Workers runtime pass)
4. `npm run build` — Đóng gói production bundle cho cả Worker và Client Vite
