# ARCHITECTURE — bản đồ domain → file

Mục đích: biết NGAY file nào cần mở khi debug/sửa/thêm tính năng. Không liệt kê API
chi tiết (đã có `docs/contracts/`); chỉ bản đồ tổ chức.

## Luồng request

```
Browser → Cloudflare Pages (dist/ tĩnh) → /api/* → functions/api/*.js → D1/KV/R2
```

## Frontend chính — Digital Campus (`index.html` + `src/`)

`index.html` chỉ là shell (367 dòng). React qua CDN; JSX compile bằng esbuild
(`npm run compile:jsx`) → `assets/gen/**` (file GEN — không sửa tay).

| Thư mục | Chứa | Khi nào sửa |
|---|---|---|
| `src/lib/helpers.js` | format tiền/ngày, media URL, const trạng thái, normalizeCampusRoom, YouTube iframe API | helper dùng chung |
| `src/lib/icons.jsx` | `ICONS` + `Ic` | thêm/sửa icon SVG |
| `src/components/cards.jsx` | TheHoatDong, CampusSpaceCard, HeroStage, PulseStatus, CampusHighlights | card/hero lobby |
| `src/components/feed.jsx` | TheBaiDang, AnnouncementTicker, AnnouncementDetailModal | bài đăng, ticker, chi tiết TB |
| `src/features/study.jsx` | **StudyDock** (chat/notes/whiteboard/sheet/voice), **CampusWatchTogether**, QueueInput, CampusFocusRoom | mọi thứ Study Room / Watch Together |
| `src/features/lobby.jsx` | ActivityLobby, CampusActivityUniverse, RoomPasswordModal, QuickTaoPhong/Ban, YoutubeSearchPanel | sảnh, tạo phòng, tìm YouTube |
| `src/features/chat-rail.jsx` | CampusChatRail | rail chat phải lobby |
| `src/features/modals.jsx` | AuthModal, CommunityBoardGateModal | modal đăng nhập / cổng Bảng tin |
| `src/campus-app.jsx` | DigitalCampusApp (root) + mount | routing hash ↔ tab, state toàn cục, bảng tin lớp |

Quy ước: import specifier luôn ghi đuôi `.js` (trỏ file đã compile), ESM native —
KHÔNG bundle. File `.jsx` mới trong `src/` tự được `compile:jsx` + `build` nhặt.

## Khu quản trị tài khoản (`giao-vien/`)

Từ 13/09/2026, khu quản trị chỉ còn danh sách tài khoản Campus theo yêu cầu owner.

| File | Vai trò |
|---|---|
| `giao-vien/index.html` | Shell độc lập: thương hiệu, tài khoản đăng nhập, nút đăng xuất |
| `giao-vien/app.js` | Xác minh phiên, đưa mọi hash cũ về `#/nguoi-dung` |
| `giao-vien/lib.js` | DOM root và định dạng giờ Việt Nam |
| `giao-vien/pages/nguoi-dung.js` | Tìm/lọc, bảng tài khoản, dialog chi tiết và thao tác |
| `assets/css/tai-khoan.css` | Giao diện desktop và các thẻ tài khoản trên mobile |
| `functions/api/gv/nguoi-dung.js` | Danh sách/chi tiết và thay đổi trạng thái có kiểm tra phạm vi |
| `functions/api/gv/duyet-giao-vien.js` | URL duyệt tài khoản tương thích |

Không còn trang/API quản trị lớp/điểm danh/quỹ/TKB/nội dung/thư viện/cài đặt.
`assets/js/chung.js` vẫn cung cấp DOM API, client API và theo dõi phiên.
Hợp đồng API: `docs/contracts/account-administration-v1.md`.

## Backend — `functions/`

Pages Functions: `functions/api/<tên>.js` ↔ `GET/POST /api/<tên>`. **Không di chuyển
file vào subdir** — đổi URL. Nhóm domain theo TIỀN TỐ tên file:

| Prefix/file | Domain |
|---|---|
| `phong*.js` (`phong`, `phong-watch`, `phong-chat`, `phong-collab`, `phong-queue`, `phong-focus`) | Study Room — contract: `docs/contracts/study-room-governance-api-v1.md` |
| `gv/**` | API riêng giáo viên/admin (phân quyền qua `giao_vien_lop`) |
| `campus-*`, `chat*`, `dm*`, `friend*` | Social campus |
| `game*` / `arena*` | Game |
| `login`, `whoami`, `logout` | Auth |

`_lib/` chia theo vai trò:
`auth.js` (session/token), `api.js` (`loi()` chuẩn + code), `rooms.js` (admission/
policy/capability — nguồn quyền Study Room), `social.js` (quyền social + verified
class membership), `quan-tri.js` (phạm vi quản trị School Admin/GVCN), `db*.js`,
`html-an-toan.js`.

## Database — `co-so-du-lieu/`

Migrations đánh số `NN-ten.sql`, nạp theo thứ tự tên. Tracker:

```
npm run migrate -- status  [--local|--remote]  # đã nạp / chờ / drift (bookkeeping)
npm run migrate -- apply   [--local|--remote]  # nạp file còn thiếu
npm run migrate -- baseline [--local|--remote] # 1 lần/môi trường đã-có-schema
npm run migrate -- verify  [--local|--remote]  # READ-ONLY: đối chiếu schema thật
```

`_migrations` (ten, sha256, ap_dung_luc, baseline) nằm trong chính DB. File đã nạp
mà hash đổi → `status` báo DRIFT (không tự chạy lại — phải tạo file migration mới).
`status`/`baseline` chỉ là bookkeeping — "đã nạp 81/81" KHÔNG chứng minh bảng/cột/index
tồn tại. `verify` mới là bằng chứng schema: nó đọc `sqlite_master` + `PRAGMA table_info`
và đối chiếu manifest các object mà migration quan trọng (61/64/65/68/75/76/77/78)
phải tạo — thiếu cái nào báo cái đó, exit 1. Migration mới tạo bảng/cột/index thì
bổ sung object đó vào `SCHEMA_MONG_DOI` trong `cong-cu/migrate.mjs`.

## Build & QA

- `npm run compile:jsx` — esbuild src → assets/gen (lint-staged tự chạy khi stage `src/**/*.{js,jsx}`)
- `npm run verify:gen` — compile trong RAM + so sánh assets/gen trên đĩa; lệch → exit 1
  (chạy trong pre-commit sau lint-staged — commit không thể chứa gen cũ hơn src)
- `npm run build` — compile JSX + gom `dist/` + minify
- `npm run deploy` — build + `wrangler pages deploy dist`
- QA theo domain: `cong-cu/qa-*.mjs` (xem package.json scripts, prefix `qa:`)
- `cong-cu/qa-study-room-audit.mjs` — gate Study Room (188 test: A–J + K1–K6 lease)
- `npm run qa:tai-khoan` — API + browser quản lý tài khoản (thay qa-admin-ia cũ)
- `cong-cu/qa-reset-tai-khoan.py <D1-export>` — kiểm chứng migration 79 trong SQLite RAM
- `cong-cu/kiem-tra-du-lieu.js` — soát an toàn dữ liệu/JSON/SQL
- Mockups bắt buộc đối chiếu khi sửa UI: `docs/mockups/1.png` (lobby), `2.png` (bảng tin)

## Chỗ còn nợ kỹ thuật (đã biết, chưa đụng)

- `src/campus-app.jsx` (4042d): root app — tách tiếp cần thiết kế context/state,
  không cơ học được.
- `functions/api/` phẳng 100 file: KHÔNG dời vào subdir (đổi URL). Nhóm theo prefix.
