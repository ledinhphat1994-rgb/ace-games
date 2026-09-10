# HƯỚNG DẪN QUẢN TRỊ & BẢO TRÌ CƠ SỞ DỮ LIỆU (CLOUDFLARE D1 & R2)

Tài liệu này hướng dẫn cách bảo trì, sao lưu, phục hồi và mở rộng hệ thống dữ liệu cho website `gdtxdinhquan.com`.

---

## 1. Cấu trúc tổng thể
Hệ thống kết hợp 3 dịch vụ lưu trữ của Cloudflare để tối ưu chi phí và tốc độ:

| Dịch vụ | Mục đích | Giới hạn & Chi phí |
|---|---|---|
| **Cloudflare D1 (SQLite)** | Dữ liệu dạng bảng quan hệ: Danh sách học sinh, mã đăng nhập, điểm danh, thông báo, thu chi quỹ, thời khoá biểu. | **5 GB miễn phí**, 5 triệu lượt đọc/ngày. Dữ liệu bảng dạng chữ và số chạy siêu tốc. |
| **Cloudflare R2** | Lưu trữ tệp đa phương tiện & tài liệu: Ảnh hoạt động, video, nhạc nền, tài liệu học tập (.pdf, .docx). | **10 GB miễn phí**. Zero Egress (miễn phí 100% băng thông tải về). Vượt 10 GB chỉ ~380đ/GB/tháng. |
| **Workers KV** | Bộ nhớ đệm (Rate limit, session nhanh). | **1 GB miễn phí**, đọc siêu tốc tại biên mạng (Edge). |

---

## 2. File Schema Chuẩn
- **`00-schema-chuan-toan-bo.sql`**: Tệp chứa toàn bộ cấu trúc bảng và chỉ mục (INDEX) hoàn chỉnh nhất.
- Khi cần tạo cơ sở dữ liệu mới (ví dụ môi trường test hoặc clone sang trường khác), chỉ cần thực thi tệp này 1 lần duy nhất thay vì chạy tuần tự 54 tệp migration cũ.

---

## 3. Các lệnh quản trị CSDL thông dụng

### A. Kiểm tra cấu trúc CSDL cục bộ (Local test):
```bash
npm run d1-cuc-bo -- --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### B. Kiểm tra danh sách bảng trên cơ sở dữ liệu thật (Remote):
```bash
npm run d1-that -- --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### C. Xem danh sách các lớp đang hoạt động:
```bash
npm run d1-that -- --command="SELECT id, ten, nam_hoc, truong, slug FROM lop;"
```

### D. Sao lưu (Backup) toàn bộ dữ liệu thật về máy tính:
```bash
npx wrangler d1 export lop-10a7-db --remote --output=./co-so-du-lieu/backup-$(date +%Y%m%d).sql
```
*(Khuyên dùng: Nên sao lưu trước mỗi kỳ học mới hoặc trước các đợt cập nhật lớn).*

---

## 4. Quy trình thêm một lớp học mới
Hệ thống hỗ trợ đa lớp độc lập trên cùng một địa chỉ web (`gdtxdinhquan.pages.dev`). Mỗi lớp có một `lop_id` riêng:

1. **Thêm lớp vào bảng `lop`**:
   ```sql
   INSERT INTO lop (ten, khoa_hoc, nam_hoc, truong, slug)
   VALUES ('Lớp 12A3', '2026-2027', '2026-2027', 'GDTX Định Quán', '12a3');
   ```
2. **Khởi tạo mã đăng nhập giáo viên cho lớp mới**:
   Chạy trong khu quản lý hoặc script để tạo mã giáo viên và mã học sinh cho `lop_id` tương ứng.
3. Dữ liệu điểm danh, học sinh, quỹ, thông báo của lớp mới sẽ hoàn toàn tách biệt với các lớp còn lại.

---

## 5. Nguyên tắc mở rộng dung lượng cho tương lai (R2 Document Storage)
- **Tuyệt đối không lưu tệp nhị phân hoặc chuỗi Base64 vào D1:** Điều này sẽ làm phình to cơ sở dữ liệu và chậm tốc độ truy vấn.
- **Mọi tệp (Ảnh, Tài liệu PDF, Đề thi, Video):** Tải lên bucket Cloudflare R2 (`lop-10a7-anh`), chỉ lưu **khoá (key)** vào cột `khoa` trong D1.
- Tốc độ tải từ R2 được Cloudflare CDN phân phối trực tiếp tới học sinh mà không tốn tài nguyên máy chủ hay dung lượng database.
