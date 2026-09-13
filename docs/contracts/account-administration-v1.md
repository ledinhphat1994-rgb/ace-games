# Quản lý tài khoản — 13/09/2026

Đây là chức năng duy nhất của `/giao-vien/`. Quyết định sản phẩm nằm tại
`docs/product/CURRENT_PRODUCT_CONTRACT.md`.

## GET /api/gv/nguoi-dung

Query tùy chọn: `q` (tên/tên đăng nhập), `loai` (vai trò hoặc trạng thái),
`lopId` (chỉ thu hẹp phạm vi), `id=tk:<số nguyên dương>` (chi tiết).

Danh sách trả `danhSach`, `tong` (khớp bộ lọc), `tongTaiKhoan` (phạm vi được phép),
`isSchoolAdmin`. Chi tiết trả `chiTiet`.

Mỗi tài khoản có `id`, `ten`, `tenDangNhap`, `loai`, `vaiTro`, `trangThai`,
`laAdminTruong`, `teacherPending`, `lopId`, `lopTen`, `taoLuc`, `capNhatLuc`,
`coTheKhoa`, `coTheDuyet`. Không trả hash/salt/mật khẩu/thiết bị hoặc hồ sơ học sinh.

School Admin đọc toàn trường. GVCN chỉ đọc lớp được giao hoặc yêu cầu giáo viên
đang chờ chưa được xác minh. Filter `lopId` không thể mở rộng quyền.

## POST /api/gv/nguoi-dung

Body: `{ id: 'tk:123', hanhDong: 'khoa' | 'mo_khoa' | 'duyet' | 'tu_choi' }`.

- Quyền và dữ liệu phiên được đọc mới từ D1; DB lỗi/tài khoản mất hoặc bị khóa thì từ chối.
- Không tự khóa, không khóa admin. Chỉ School Admin có thể khóa giáo viên khác.
- Duyệt/từ chối chỉ áp dụng tài khoản còn hoạt động, đang chờ, chưa phải giáo viên/admin.
- UPDATE kèm phạm vi, id, lớp và trạng thái đã đọc; thay đổi cạnh tranh trả 409.
- Thành công trả `{ ok: true }` và ghi nhật ký nội bộ. Không còn trang nhật ký quản trị.
- 400: dữ liệu sai; 401: phiên không hợp lệ; 403: thiếu quyền; 404: không có trong phạm vi; 409: cần tải lại.

`POST /api/gv/duyet-giao-vien` giữ tương thích `{ accountId, action: 'approve' | 'reject' }`
và gọi cùng logic cập nhật. Không còn API hay danh sách học sinh trong khu quản trị.

## Kiểm chứng

`npm run qa:tai-khoan` dùng D1 local, HTTP và Playwright thật; hostname khác localhost bị chặn.
`python cong-cu/qa-reset-tai-khoan.py <D1-export>` kiểm thử migration trong SQLite RAM,
đối chiếu toàn bộ trường tài khoản, mật khẩu, phụ thuộc xác thực, khóa ngoại và chạy lại.
