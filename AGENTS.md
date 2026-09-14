# lop-10a7 — quy tắc bắt buộc
- Đọc PROJECT_RULES.md trước khi sửa. Stack: Cloudflare Pages + Functions + D1/KV/R2, vanilla HTML/JS + React qua CDN. CẤM Webpack/Vite/Next/bundler.
- Frontend JSX sống trong `src/**/*.jsx`, compile bằng `npm run compile:jsx` (esbuild) → `assets/gen/*.js` (file gen, commit kèm, KHÔNG sửa tay). `index.html` chỉ còn shell HTML; không viết JSX inline trong HTML. `npm run build` tự compile trước khi gom `dist/`.
- Cấu trúc `src/`: `lib/` (helpers thuần + icons), `components/` (UI trình bày), `features/` (domain lớn: study, lobby, chat-rail, modals), `campus-app.jsx` (entry + DigitalCampusApp). Module ESM native — import specifier luôn ghi đuôi `.js` (vd `from '../lib/helpers.js'`) vì browser resolve file đã compile; KHÔNG bundle.
- Bản đồ domain → file chi tiết: `docs/ARCHITECTURE.md`. Migration D1: `npm run migrate -- status|apply|baseline [--local|--remote]` — KHÔNG nạp file SQL tay nữa, tracker `_migrations` ghi nhận + báo drift.
- Product contract đã khóa: `docs/product/CURRENT_PRODUCT_CONTRACT.md`; API contracts: `docs/contracts/`. Một agent chịu trách nhiệm trọn vẹn từ backend tới frontend trong một task — không chia vai theo model.
- CẤM mock data / mảng dữ liệu mẫu trong UI. Mọi dữ liệu qua /api/*. Ô rỗng thì hiện empty-state.
- Mọi query D1 đọc/ghi dữ liệu lớp PHẢI có `lop_id = phien.lopId`. Không tin id từ client.
- Không dùng innerHTML với dữ liệu từ API; dùng textContent / DOM API / `urlMediaAnToan`.
- Giữ nguyên DOM id: #khuDiemDanh #ddTabLoai #ddLopKhoi #ddCaNhan #thu-quy #tqTongQuan #tqKhoan và URL hash ↔ activeTab.
- Không sửa giao diện lệch khỏi ảnh mẫu trong docs/mockups/ (1.png lobby, 2.png bảng tin). Chỉ đổi DỮ LIỆU, không đổi CẤU TRÚC.
- Không xóa/tắt endpoint để "vá" lỗi bảo mật — phải sửa query.
- Trước khi commit: dùng skill `kiem-tra-truoc-khi-push`. Khi sửa UI: dùng skill `so-khop-giao-dien`.
- Commit message tiếng Việt/Anh dạng conventional (`feat:`, `fix:`, `security:`); 1 việc = 1 commit. Không `--force`.
- QUY TẮC CHỐNG GIẬT MÀN HÌNH & TRẢI NGHIỆM NGƯỜI DÙNG (BẮT BUỘC): Không bao giờ được phép làm giật, rung lắc hoặc tự ý dịch chuyển thanh cuộn màn hình (`window`). Cấm gọi `scrollIntoView()` trên DOM con; mọi cuộn tự động (chat, danh sách) chỉ được cuộn nội bộ trong container cha (`container.scrollTo`). Khi gọi `.focus()` phải luôn kèm `{ preventScroll: true }`. Cấm đặt `autoFocus` trên input nội tuyến. Mọi tab/sub-view song song phải khóa chiều cao (Zero CLS) và có empty-state lấp đầy để không làm sụt lún layout. Bố cục 2 cột cạnh nhau phải độc lập (`items-start`, `self-start`), không được dùng `self-stretch` kéo giật lẫn nhau.
- QUY TẮC COMMIT, PUSH & DEPLOY TỰ ĐỘNG (BẮT BUỘC): Bất cứ khi nào hoàn tất xong công việc, sau khi kiểm thử và verify đạt chuẩn 100%, agent PHẢI tự động hoàn thành trọn vẹn: commit → git push origin main → nạp migration D1 remote (nếu có tệp SQL mới) → chạy `npm run deploy` lên Cloudflare Pages. Không dừng lại ở giữa chừng bắt người dùng phải tự deploy thủ công.

