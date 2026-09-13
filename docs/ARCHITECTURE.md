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
| `src/features/modals.jsx` | AuthModal, CommunityBoardGateModal, TeacherAccessCode/Editor/ContentEditor, TeacherAnnouncements, PersonalQuickAccess | modal đăng nhập / GV / soạn nội dung |
| `src/campus-app.jsx` | DigitalCampusApp (root) + mount | routing hash ↔ tab, state toàn cục, bảng tin lớp |

Quy ước: import specifier luôn ghi đuôi `.js` (trỏ file đã compile), ESM native —
KHÔNG bundle. File `.jsx` mới trong `src/` tự được `compile:jsx` + `build` nhặt.

## Khu quản trị giáo viên (`giao-vien/`)

`giao-vien/index.html` + `app.js` (ESM, `type="module"`).

| File | Vai trò |
|---|---|
| `giao-vien/app.js` (210d) | Router `dieuHuong()` + TRANG map + `khoiDong()` init — CHỈ thêm route ở đây |
| `giao-vien/lib.js` | State chia sẻ: `PHIEN`, `PHAM_VI_LOP_ID` (export let + `datPhien`/`datPhamVi`), `apiTheoPhamVi`, `duocVaoTuyen`, menu helpers, `KHUNG`, `gioNgayVN` |
| `giao-vien/pages/diem-danh.js` | Điểm danh + lịch sử inline + quick tab |
| `giao-vien/pages/hoc-sinh.js` | DS học sinh, hồ sơ, liên hệ PH |
| `giao-vien/pages/noi-dung.js` | Thông báo, hoạt động lớp, trang "Thêm" |
| `giao-vien/pages/campus.js` | Highlights, hồ sơ GV, phòng campus, campus, bảng tin |
| `giao-vien/pages/tong-quan.js` | Tổng quan dashboard |
| `giao-vien/pages/nguoi-dung.js` | Người dùng + drawer chi tiết + menu hành động (helpers `moDrawerChiTiet`, `taoNutMenuHanhDong` dùng lại được) |
| `giao-vien/pages/admin.js` | Lớp & thành viên, kiểm duyệt, hệ thống, báo cáo VP, duyệt GV, mã cộng đồng, biên tập viên |
| `giao-vien/trang-{hoc-tap,quy,lich,diem-danh-lich-su,reset-du-lieu}.js` | Các trang đã tách sẵn từ trước (thống kê/báo cáo/quỹ/TKB/lịch sử ĐD/reset) |

Shared JS dùng chung ngoài admin: `assets/js/chung.js` ($/$$/e/api/nhac/...),
`giao-dien.js` (tieuDeTrang/nut/truong/moHopThoai/...), `hang-doi.js` (offline queue),
`soan-thao.js`, `thong-bao-dialog.js`, `hoat-dong-lop-dialog.js`, `html-an-toan.js`,
`chat-widget.js` (chat nổi — IIFE self-contained, load riêng trong admin).

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
- `cong-cu/kiem-tra-du-lieu.js` — soát an toàn dữ liệu/JSON/SQL
- Mockups bắt buộc đối chiếu khi sửa UI: `docs/mockups/1.png` (lobby), `2.png` (bảng tin)

## Chỗ còn nợ kỹ thuật (đã biết, chưa đụng)

- `chat-widget.js` (92KB): IIFE self-contained — tách module cần refactor state,
  không phải split cơ học. Làm khi có nhu cầu sửa chat widget.
- `src/campus-app.jsx` (4042d): root app — tách tiếp cần thiết kế context/state,
  không cơ học được.
- `functions/api/` phẳng 100 file: KHÔNG dời vào subdir (đổi URL). Nhóm theo prefix.
