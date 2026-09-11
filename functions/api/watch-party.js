// Watch Party đã TẮT — endpoint tồn tại nhưng không có frontend nào gọi tới,
// đồng thời bảng watch_party chưa có lop_id nên không thể cô lập dữ liệu giữa các lớp.
// Giữ route trả 404 để tránh lộ bề mặt tấn công (IDOR xuyên phòng).
// Muốn mở lại: thêm cột lop_id + kiểm tra thành viên phòng trước khi cho phép sync.
import { bocXuLy, loi } from '../_lib/api.js';

const tamDong = bocXuLy(async () => loi('Tính năng xem chung đang tạm đóng.', 404));

export const onRequestGet = tamDong;
export const onRequestPost = tamDong;
export const onRequestPatch = tamDong;
export const onRequestPut = tamDong;
