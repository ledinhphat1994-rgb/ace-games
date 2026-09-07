# Tổng quan dự án — trang lớp 10A7

Trang nội bộ của một lớp học: thông báo, điểm danh, quỹ lớp, hình ảnh.
Chạy trên **Cloudflare Pages** (miễn phí), dữ liệu trong **D1** (SQLite) và **KV**.

**Không có bước biên dịch, không framework.** HTML + CSS + JavaScript thuần, chạy trực tiếp.
Đây là lựa chọn có chủ ý: người bảo trì là một giáo viên, không phải nhóm lập trình.

## Cấu trúc

| Nơi | Nội dung |
|---|---|
| `index.html`, `login.html`, `ca-nhan.html` | Ba trang của học sinh |
| `assets/css`, `assets/js` | Giao diện chung (JS dạng ES module, chạy thẳng trên trình duyệt) |
| `giao-vien/` | Khu quản lý của giáo viên (`index.html` + các `trang-*.js`) |
| `functions/_middleware.js` | **Cổng bảo vệ toàn trang** — chạy trước mọi yêu cầu |
| `functions/_lib/` | Tiện ích dùng chung: `api.js`, `auth.js`, `tt22.js`, `quy-*.js` |
| `functions/api/`, `functions/api/gv/` | API cho học sinh và API cho giáo viên |
| `co-so-du-lieu/NN-*.sql` | Các bước tạo/đổi cấu trúc D1, đánh số tăng dần |
| `du-lieu-goc/` | Dữ liệu gốc dùng để sinh SQL ban đầu (không phải dữ liệu đang chạy) |
| `data/hinh-anh.json` | Danh sách ảnh cũ còn đọc từ tệp |
| `cong-cu/` | Script chạy trên máy (CommonJS), không đăng lên mạng |
| `build.js` → `dist/` | Chỉ sao chép **đúng những mục có trong `DANH_SACH_DANG`** |
| `deploy.js` | Kiểm tra tài khoản → build → `wrangler pages deploy` |

## Ba vai trò

- `student` — mã lớp `CLASS_CODE`, chỉ xem `/`
- `teacher` — mã `TEACHER_CODE`, toàn quyền, mở thêm `/giao-vien`
- `phu` — tài khoản đặc biệt do giáo viên cấp (lớp trưởng, thủ quỹ...), vào `/giao-vien`
  nhưng từng API còn kiểm tra tiếp `quyen`

## Người dùng thật

Giáo viên và học sinh **dùng điện thoại**, mạng lớp học hay chập chờn.
Vì vậy: ưu tiên bố cục dọc, nút to dễ chạm, ít bước bấm, và giữ nguyên cơ chế
hàng đợi ngoại tuyến (`assets/js/hang-doi.js`) khi sửa phần điểm danh.

## Trạng thái

Trang **đang chạy thật** tại `https://lop-10a7.pages.dev` với dữ liệu thật của một lớp.
Mọi thay đổi đều là sửa trên hệ thống đang hoạt động — cẩn thận tương ứng.
Xem thêm `HUONG-DAN.md` (tài liệu dành cho giáo viên).
