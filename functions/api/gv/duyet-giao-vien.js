// Giữ URL duyệt tài khoản tương thích, dùng chung kiểm tra quyền và UPDATE có điều kiện.
import { bocXuLy, docThan, loi } from '../../_lib/api.js';
import { doiTrangThaiTaiKhoan } from './nguoi-dung.js';
export const onRequestPost = bocXuLy(async context => {
  const { accountId, action } = await docThan(context.request);
  if (!Number.isSafeInteger(accountId) || accountId < 1 || !['approve', 'reject'].includes(action)) return loi('Dữ liệu không hợp lệ.', 400);
  return doiTrangThaiTaiKhoan(context, accountId, action === 'approve' ? 'duyet' : 'tu_choi');
}, { canGiaoVien: true });