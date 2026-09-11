// Watch Party SSE stream đã TẮT cùng /api/watch-party — xem ghi chú trong watch-party.js.
import { bocXuLy, loi } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async () => loi('Tính năng xem chung đang tạm đóng.', 404));
