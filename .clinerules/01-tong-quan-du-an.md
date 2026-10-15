# Tổng quan dự án — Ace Games (Digital Campus v2)

Nền tảng mạng xã hội học tập thời gian thực & đấu trường game đa người chơi (Ace Games / Digital Campus).
Chạy trên **Cloudflare Workers** + **Durable Objects** (WebSocket Hibernation, SQLite) + **D1 Database** + **KV** (Rate Limit) + **R2 Storage**.

## Kiến trúc Nền tảng

| Thành phần | Công nghệ / Vị trí | Mô tả |
|---|---|---|
| **Frontend** | `src/`, Vite 8 + React 19 + TypeScript + Tailwind CSS v4 | Giao diện mạng xã hội, phòng học nhóm, đấu trường game |
| **Backend API** | `worker/index.ts`, `worker/routes/` (Hono API Router) | API RESTful tốc độ cao, xác thực token phiên PBKDF2/HMAC |
| **Realtime DO** | `worker/CampusDO.ts`, `RoomDO.ts` | Durable Objects quản lý sảnh trường, chat thời gian thực, phòng học |
| **Đấu trường Game** | `games-dev/godot-project/` -> `public/games/godot/` | Godot 4.x Engine xuất WebAssembly / GL Compatibility 2.5D |
| **CSDL Migrations** | `migrations/00xx_*.sql` | Cấu trúc D1 SQLite đa lớp phân quyền |
| **Shared Protocol** | `shared/protocol/` | Type an toàn và giao thức gói tin dùng chung Frontend & Worker |

## Vai trò & Phân quyền

- `student` — học sinh, tham gia lớp học, chat sảnh, đấu trường game
- `teacher` — giáo viên, quản lý phòng học, phê duyệt và cấp quyền
- `admin` / `phu` — quản trị hệ thống, cán bộ hỗ trợ

## Quy tắc Kỹ thuật Trọng yếu

1. **Hiến pháp Game 2.5D:** Tiếp đất chuẩn 100% (Zero Ground Clearance), cấm vẽ bóng tròn đen giả bằng code trên thảm cỏ, Zero-allocation trong game loop.
2. **Bảo mật D1:** Mọi truy vấn đọc/ghi đều phải ràng buộc `lop_id` và phân quyền; phiên duy nhất 1 tài khoản 1 thiết bị (`4001`).
3. **UI/UX:** Tôn trọng khoảng đệm thoáng mắt, cấm chú thích thừa, card cố định không giật rung, backdrop mờ nhẹ không che lấp cảnh sau.
