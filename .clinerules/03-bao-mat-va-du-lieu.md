# Bảo mật và an toàn dữ liệu — phần quan trọng nhất

Đây là dữ liệu thật của học sinh vị thành niên: điểm, chuyên cần, nhận xét, hoàn cảnh gia đình,
số điện thoại phụ huynh, thu chi quỹ lớp. Mất hoặc lộ là hậu quả thật, không phải lỗi kỹ thuật.

## Mã bí mật

- `SESSION_SECRET`, `CLASS_CODE`, `TEACHER_CODE` chỉ tồn tại ở hai nơi:
  biến môi trường trên Cloudflare, và tệp `.dev.vars` trên máy (đã bị `.gitignore`).
- **Không bao giờ** viết mã thật vào mã nguồn, tài liệu, bình luận, thông báo commit, hay câu trả lời.
- Không mở, không in nội dung `.dev.vars`. Cần biết có biến nào thì xem `.dev.vars.example`.
- Không tự tạo, không tự dán API token Cloudflare hay GitHub. Việc đó chỉ giáo viên làm.

## Cổng bảo vệ

- `functions/_middleware.js` là lớp chặn duy nhất cho toàn trang. Sửa tệp này phải hết sức cẩn thận.
- **Không thêm đường dẫn vào `PUBLIC_PATHS` khi chưa được đồng ý rõ ràng** — mỗi mục thêm vào là
  một đường mở ra Internet, không cần mã cũng vào được.
- API mới trong `functions/api/gv/` **bắt buộc** bọc bằng `bocXuLy(..., { canGiaoVien: true })`.
  Chỉ đặt thêm `quyenCan` khi người dùng nói rõ mục đó mở cho tài khoản phụ (thủ quỹ, lớp trưởng).
- Không kiểm tra quyền ở phía trình duyệt và coi đó là đủ. Trình duyệt chỉ để hiển thị.

## Dữ liệu cá nhân

- Không `console.log` và không trả về trong thông báo lỗi: số điện thoại phụ huynh, hoàn cảnh,
  nhận xét riêng, mã cá nhân của học sinh.
- API cho học sinh (`functions/api/`, `ca-nhan.js`) chỉ được trả dữ liệu **của chính em đó**.
- Không thêm thư viện phân tích/thống kê của bên thứ ba, không gửi dữ liệu ra ngoài Cloudflare.

## Cơ sở dữ liệu

- Thử ở cục bộ trước: `npx wrangler d1 execute lop-10a7-db --local --command "..."`.
  Chỉ dùng `--remote` khi đã chắc chắn.
- **Hỏi trước khi chạy** bất cứ câu nào có: `DROP`, `ALTER ... DROP`, `DELETE` không `WHERE`,
  `UPDATE` không `WHERE`, hoặc ghi hàng loạt lên `--remote`.
- Không tự chạy `wrangler d1 time-travel restore`. Đó là quyết định của giáo viên.
- Đổi cấu trúc bảng thì thêm tệp SQL **mới** đánh số tiếp trong `co-so-du-lieu/`,
  viết được lặp lại nhiều lần không lỗi (`CREATE TABLE IF NOT EXISTS`, `INSERT OR IGNORE`).
  Không sửa lại các tệp SQL đã chạy trên máy chủ thật.
- Trước khi sửa phần Thủ quỹ: nhớ rằng mỗi thao tác tự tạo điểm khôi phục
  (`functions/_lib/quy-checkpoint.js`) — đừng làm hỏng cơ chế đó.

## Git

- Chỉ commit khi được yêu cầu. Không `git push --force`, `reset --hard`, `clean -f`.
- Không đưa vào commit: `.dev.vars`, `dist/`, `.wrangler/`, ảnh chụp có tên học sinh thật.
- Thư mục này đã ghim cứng tài khoản GitHub và Cloudflare (xem `HUONG-DAN.md`).
  **Không chạy `gh auth switch`, không sửa `.git/config`, không sửa `credential.helper`.**

## Khi không chắc

Nói ra chỗ chưa chắc thay vì đoán. Với dữ liệu học sinh, dừng lại hỏi luôn rẻ hơn làm sai.
