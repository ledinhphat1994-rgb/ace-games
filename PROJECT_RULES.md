# SYSTEM CONTEXT & CONSTRAINTS: LỚP 10A7 DIGITAL CAMPUS

## 1. TECH STACK INVARIANTS
- Deployment: Cloudflare Pages + Pages Functions (`functions/`).
- Database: Cloudflare D1 (SQLite serverless) via `env.DB`.
- Frontend: Hybrid SPA with Vanilla HTML5/CSS3 + React 18 & Babel Standalone via CDN.
- CRITICAL: STRICTLY FORBIDDEN to introduce Webpack, Vite, Next.js, or complex bundlers. Do not install Node packages for the client runtime.

## 2. CODEBASE CONTRACTS & NON-NEGOTIABLES
- ZERO MOCK DATA: Never write inline mock arrays or mock objects. Always fetch from `/api/*` endpoints.
- DOM PRESERVATION: Never remove or alter critical DOM IDs: `#khuDiemDanh`, `#ddTabLoai`, `#ddLopKhoi`, `#ddCaNhan`, `#thu-quy`, `#tqTongQuan`, `#tqKhoan`.
- NAVIGATION: Maintain two-way sync between URL hash (`#/diem-danh`, `#/thu-quy`, etc.) and React state `activeTab`.
- UI/UX: Dark SaaS aesthetic (Background: `#090d16`, Surface: `#0f172a`, Hairline 1px border `white/10`). Mobile touch target >= 44px.
- OUTPUT INTEGRITY: Output production-ready, 100% complete code. No placeholders, no `// TODO`, no omitted implementation.

## 3. VERIFICATION & AUTO-DEPLOY PIPELINE
Before finalizing any changes, ensure:
1. `node cong-cu/kiem-tra-du-lieu.js` (or `npm run kiem-tra-du-lieu`) passes with 0 syntax/security issues.
2. `node build.js` (or `npm run build`) builds cleanly into `dist/`.
3. AUTOMATIC COMMIT, PUSH & DEPLOY: Once verification passes, always execute the full pipeline automatically: commit → `git push origin main` → remote D1 migration (if SQL changed) → `npm run deploy` to Cloudflare Pages. Never leave shipping unfinished.

## 4. ZERO UNWANTED SCREEN JITTER & SCROLL HIJACKING (TUYỆT ĐỐI KHÔNG GIẬT / DI CHUYỂN MÀN HÌNH VÔ LÝ)
- CẤM HIJACK WINDOW SCROLL: Tuyệt đối KHÔNG gọi `scrollIntoView()` trên các phần tử con nội tuyến. Chỉ cuộn nội bộ container bằng `container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })` trên chính phần tử có thanh cuộn (`overflow-y: auto`). Không để nhánh fallback gọi `scrollIntoView()` ra ngoài cửa sổ (`window`).
- ZERO CLS KHI CHUYỂN TAB & SUB-VIEW: Khung chứa các tab song song (YouTube search vs Hàng đợi, Chat vs Ghi chú vs Bảng vẽ) PHẢI cố định chiều cao tối thiểu (`h-[...]` hoặc `min-h-[...]` + `overflow-hidden` khung ngoài, `overflow-y-auto` bên trong). Không để tab rỗng làm sụt lún chiều cao toàn trang khiến trình duyệt giật ngược thanh cuộn lên trên. Luôn có empty-state căn giữa chiếm trọn chiều cao khi rỗng.
- CẤM AUTOFOCUS GÂY GIẬT VIEWPORT: Không đặt thuộc tính `autoFocus` trên các form/input nội tuyến trong trang vì sẽ ép trình duyệt nhảy màn hình tới vị trí input. Khi gọi `.focus()` qua JS, BẮT BUỘC luôn truyền `{ preventScroll: true }`.
- ĐỘC LẬP BỐ CỤC CỘT ĐÔI: Bố cục 2 cột nằm cạnh nhau (Video và StudyDock) ở chế độ thông thường phải dùng `items-start` và `self-start`, tuyệt đối không dùng `self-stretch` hay `items-stretch` kéo giãn chéo nhau. Chiều cao của một cột thay đổi (mở rộng kết quả tìm kiếm, mở accordion) không bao giờ được phép làm co giãn hay giật cột bên cạnh.
- CHỐNG GIẬT THANH CUỘN & NEO CUỘN: `html` luôn có `scrollbar-gutter: stable` để tránh giật ngang layout khi thanh cuộn xuất hiện/biến mất. Khung tab động có nội dung thay đổi nhiều gán `overflow-anchor: none` (hoặc inline `style={{ overflowAnchor: 'none' }}`) để ngăn trình duyệt tự ý bù trừ thanh cuộn.
