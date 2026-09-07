// Điểm khôi phục (checkpoint) của Điểm danh — cùng cơ chế đã có cho Thủ quỹ
// (xem functions/_lib/quy-checkpoint.js).
//
// Nguyên tắc: TRƯỚC mỗi lần lưu điểm danh, chụp lại toàn bộ bản ghi điểm danh hiện tại rồi
// mới áp dụng thay đổi. Nếu sau này ghi nhầm hoặc tài khoản bị chiếm, khôi phục về đúng bản
// chụp trước thời điểm nghi ngờ là xong.
import { taChuThich } from './quy-checkpoint.js';

const TOI_DA_CHECKPOINT = 200;   // giữ 200 điểm gần nhất, đủ cho vài tháng dùng bình thường

export { taChuThich };

/** Chụp toàn bộ bản ghi điểm danh hiện tại CỦA ĐÚNG LỚP đang đăng nhập, TRƯỚC khi áp dụng
    một thay đổi — không chụp lẫn dữ liệu điểm danh của lớp khác vào cùng một điểm khôi phục.
    `loai` ('chinh' | 'phu' | null) và `chiTiet` (mảng {hocSinhId, hoTen, truoc, sau, lyDo})
    cho phép trang Lịch sử Điểm danh lọc theo tab và hiện đúng từng em đã đổi gì — null dùng
    cho điểm chụp trước khi KHÔI PHỤC (ảnh hưởng toàn bộ, không thuộc riêng loại nào). */
export async function chupCheckpointDiemDanh(db, hanhDong, phien, loai = null, chiTiet = null) {
  const lopId = phien?.lopId ?? 1;
  const { results } = await db.prepare('SELECT * FROM diem_danh WHERE lop_id = ?1').bind(lopId).all();

  const duLieu = JSON.stringify({ diemDanh: results });

  await db.prepare(
    'INSERT INTO diem_danh_checkpoint (hanh_dong, nguoi_thuc_hien, du_lieu, loai, chi_tiet, lop_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
  ).bind(hanhDong, taChuThich(phien), duLieu, loai, chiTiet ? JSON.stringify(chiTiet) : null, lopId).run();

  // Dọn bớt các bản cũ CỦA ĐÚNG LỚP NÀY, tránh phình bảng vô hạn (không đụng tới lớp khác).
  await db.prepare(
    `DELETE FROM diem_danh_checkpoint WHERE lop_id = ?1 AND id NOT IN
       (SELECT id FROM diem_danh_checkpoint WHERE lop_id = ?1 ORDER BY id DESC LIMIT ?2)`
  ).bind(lopId, TOI_DA_CHECKPOINT).run();
}

/** Ghi đè toàn bộ bảng diem_danh CỦA ĐÚNG LỚP bằng đúng nội dung của một checkpoint đã chụp —
    không đụng tới dữ liệu điểm danh của lớp khác. */
export async function khoiPhucCheckpointDiemDanh(db, checkpointId, lopId) {
  const cp = await db.prepare('SELECT du_lieu FROM diem_danh_checkpoint WHERE id = ?1 AND lop_id = ?2').bind(checkpointId, lopId).first();
  if (!cp) throw new Error('Không tìm thấy điểm khôi phục này.');

  const { diemDanh } = JSON.parse(cp.du_lieu);

  const cauLenh = [
    db.prepare('DELETE FROM diem_danh WHERE lop_id = ?1').bind(lopId),
    ...diemDanh.map((d) => db.prepare(
      `INSERT INTO diem_danh (ngay, buoi, hoc_sinh_id, trang_thai, ly_do, cap_nhat_luc, lop_id)
       VALUES (?1,?2,?3,?4,?5,?6,?7)`
    ).bind(d.ngay, d.buoi, d.hoc_sinh_id, d.trang_thai, d.ly_do ?? '', d.cap_nhat_luc, lopId)),
  ];

  // batch() chạy trọn vẹn hoặc không chạy gì — không sợ khôi phục dở dang.
  await db.batch(cauLenh);
}
