// Điểm khôi phục (checkpoint) của Thủ quỹ.
//
// Nguyên tắc: TRƯỚC mỗi lần ghi/sửa/xoá liên quan tới tiền, chụp lại toàn bộ
// trạng thái quỹ hiện tại rồi mới áp dụng thay đổi. Nếu sau này phát hiện dữ liệu
// bị phá (tài khoản bị chiếm, thao tác nhầm...), khôi phục về đúng bản chụp
// trước thời điểm nghi ngờ là xong — không cần biết chi tiết ai đã sửa gì.
const TOI_DA_CHECKPOINT = 200;   // giữ 200 điểm gần nhất, đủ cho vài tháng dùng bình thường

export function taChuThich(phien) {
  if (!phien) return 'Không rõ';
  if (phien.role === 'teacher') return 'Giáo viên chủ nhiệm';
  if (phien.role === 'phu') return `${phien.vaiTro || 'Tài khoản đặc biệt'} — ${phien.ten}`;
  return phien.role || 'Không rõ';
}

/** Chụp toàn bộ trạng thái quỹ hiện tại CỦA ĐÚNG LỚP đang đăng nhập, TRƯỚC khi áp dụng một
    thay đổi — không chụp lẫn dữ liệu quỹ của lớp khác vào cùng một điểm khôi phục. */
export async function chupCheckpoint(db, hanhDong, phien) {
  const lopId = phien?.lopId ?? 1;
  const [khoan, dong, chi] = await Promise.all([
    db.prepare('SELECT * FROM quy_khoan WHERE lop_id = ?1').bind(lopId).all(),
    db.prepare('SELECT * FROM quy_dong WHERE lop_id = ?1').bind(lopId).all(),
    db.prepare('SELECT * FROM quy_chi WHERE lop_id = ?1').bind(lopId).all(),
  ]);

  const duLieu = JSON.stringify({ khoan: khoan.results, dong: dong.results, chi: chi.results });

  const kq = await db.prepare(
    'INSERT INTO quy_checkpoint (hanh_dong, nguoi_thuc_hien, du_lieu, lop_id) VALUES (?1, ?2, ?3, ?4)'
  ).bind(hanhDong, taChuThich(phien), duLieu, lopId).run();

  // Dọn bớt các bản cũ CỦA ĐÚNG LỚP NÀY, tránh phình bảng vô hạn (không đụng tới lớp khác).
  await db.prepare(
    `DELETE FROM quy_checkpoint WHERE lop_id = ?1 AND id NOT IN
       (SELECT id FROM quy_checkpoint WHERE lop_id = ?1 ORDER BY id DESC LIMIT ?2)`
  ).bind(lopId, TOI_DA_CHECKPOINT).run();

  return kq.meta.last_row_id;
}

/** Ghi đè toàn bộ 3 bảng quỹ CỦA ĐÚNG LỚP bằng đúng nội dung của một checkpoint đã chụp —
    không đụng tới dữ liệu quỹ của lớp khác. */
export async function khoiPhucCheckpoint(db, checkpointId, lopId) {
  const cp = await db.prepare('SELECT du_lieu FROM quy_checkpoint WHERE id = ?1 AND lop_id = ?2').bind(checkpointId, lopId).first();
  if (!cp) throw new Error('Không tìm thấy điểm khôi phục này.');

  const { khoan, dong, chi } = JSON.parse(cp.du_lieu);

  const cauLenh = [
    // Xoá bảng con (quy_dong tham chiếu quy_khoan) TRƯỚC bảng cha, nếu không vi phạm khoá ngoại.
    // Chỉ xoá dữ liệu CỦA ĐÚNG LỚP NÀY.
    db.prepare('DELETE FROM quy_dong WHERE lop_id = ?1').bind(lopId),
    db.prepare('DELETE FROM quy_khoan WHERE lop_id = ?1').bind(lopId),
    db.prepare('DELETE FROM quy_chi WHERE lop_id = ?1').bind(lopId),
    // .bind() dùng "?? null / ?? 'khac'" để khôi phục được cả những checkpoint chụp TRƯỚC
    // khi các cột dinh_ky_id/ky_so/loai/ngay_bat_dau/ngay_ket_thuc tồn tại (dữ liệu cũ không
    // có các trường này).
    ...khoan.map((k) => db.prepare(
      `INSERT INTO quy_khoan (id, ten, hoc_ky, so_tien_moi_em, ghi_chu, dang_mo, tao_luc, dinh_ky_id, ky_so, ngay_bat_dau, ngay_ket_thuc, lop_id)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)`
    ).bind(k.id, k.ten, k.hoc_ky, k.so_tien_moi_em, k.ghi_chu, k.dang_mo, k.tao_luc, k.dinh_ky_id ?? null, k.ky_so ?? null, k.ngay_bat_dau ?? null, k.ngay_ket_thuc ?? null, lopId)),
    ...dong.map((d) => db.prepare(
      'INSERT INTO quy_dong (id, khoan_id, hoc_sinh_id, so_tien, ngay, ghi_chu, tao_luc, lop_id) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)'
    ).bind(d.id, d.khoan_id, d.hoc_sinh_id, d.so_tien, d.ngay, d.ghi_chu, d.tao_luc, lopId)),
    ...chi.map((c) => db.prepare(
      'INSERT INTO quy_chi (id, ngay, noi_dung, so_tien, ghi_chu, tao_luc, loai, lop_id) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)'
    ).bind(c.id, c.ngay, c.noi_dung, c.so_tien, c.ghi_chu, c.tao_luc, c.loai ?? 'khac', lopId)),
  ];

  // batch() chạy trọn vẹn hoặc không chạy gì — không sợ khôi phục dở dang.
  await db.batch(cauLenh);
}
