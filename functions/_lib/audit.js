// Audit Log cho Khu quản trị: ghi lại hành động sửa/xoá của admin (khác nhat_ky_truy_cap/
// nhat_ky_dang_nhap vốn chỉ ghi lượt xem/đăng nhập). Dùng waitUntil để không làm chậm response
// (mẫu giống cache write trong _lib/media-stream.js).
export function ghiNhatKyQuanTri(env, waitUntil, { tacNhanId, tacNhanTen, hanhDong, doiTuongLoai = '', doiTuongId = '', chiTiet = '', lopId = null }) {
  const p = env.DB.prepare(
    `INSERT INTO nhat_ky_quan_tri (tac_nhan_id, tac_nhan_ten, hanh_dong, doi_tuong_loai, doi_tuong_id, chi_tiet, lop_id)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
  ).bind(
    tacNhanId || null,
    String(tacNhanTen || '').slice(0, 200),
    String(hanhDong || '').slice(0, 100),
    String(doiTuongLoai || '').slice(0, 50),
    String(doiTuongId || '').slice(0, 100),
    String(chiTiet || '').slice(0, 2000),
    lopId || null
  ).run().catch((e) => console.error('Lỗi ghi nhật ký quản trị:', e));

  if (waitUntil) waitUntil(p);
  else return p;
}
