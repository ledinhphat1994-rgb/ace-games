# lop-10a7 — quy tắc bắt buộc
- Đọc PROJECT_RULES.md trước khi sửa. Stack: Cloudflare Pages + Functions + D1/KV/R2, vanilla HTML/JS + React qua CDN. CẤM Webpack/Vite/Next/bundler.
- CẤM mock data / mảng dữ liệu mẫu trong UI. Mọi dữ liệu qua /api/*. Ô rỗng thì hiện empty-state.
- Mọi query D1 đọc/ghi dữ liệu lớp PHẢI có `lop_id = phien.lopId`. Không tin id từ client.
- Không dùng innerHTML với dữ liệu từ API; dùng textContent / DOM API / `urlMediaAnToan`.
- Giữ nguyên DOM id: #khuDiemDanh #ddTabLoai #ddLopKhoi #ddCaNhan #thu-quy #tqTongQuan #tqKhoan và URL hash ↔ activeTab.
- Không sửa giao diện lệch khỏi ảnh mẫu trong docs/mockups/ (1.png lobby, 2.png bảng tin). Chỉ đổi DỮ LIỆU, không đổi CẤU TRÚC.
- Không xóa/tắt endpoint để "vá" lỗi bảo mật — phải sửa query.
- Trước khi commit: dùng skill `kiem-tra-truoc-khi-push`. Khi sửa UI: dùng skill `so-khop-giao-dien`.
- Commit message tiếng Việt/Anh dạng conventional (`feat:`, `fix:`, `security:`); 1 việc = 1 commit. Không `--force`.
