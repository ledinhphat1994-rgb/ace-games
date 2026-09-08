// GET /api/gv/rieng/nhat-ky-dang-nhap — nhật ký đăng nhập của MỌI vai trò (giáo viên, tài khoản phụ,
// mã cá nhân thường/có quyền — trước đây chỉ ghi mã được cấp quyền quản lý). CHỈ ĐỌC — không có
// DELETE ở đây, kể cả cho giáo viên, để nhật ký luôn còn nguyên vẹn mà khôi phục lại nếu một mã
// bị chiếm quyền và xoá phá dữ liệu.
import { bocXuLy, json } from '../../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const { results } = await env.DB.prepare(
    `SELECT n.id, n.ma, n.vai_tro AS vaiTro, n.ket_qua AS ketQua, n.ip, n.canh_bao_ip AS canhBaoIp,
            n.thoi_diem AS thoiDiem, h.ho_ten AS hoTen
       FROM nhat_ky_dang_nhap n LEFT JOIN hoc_sinh h ON h.id = n.hoc_sinh_id
      WHERE n.lop_id = ?1
      ORDER BY n.id DESC LIMIT 300`
  ).bind(phien.lopId).all();
  return json({ ok: true, danhSach: results.map((r) => ({ ...r, canhBaoIp: Boolean(r.canhBaoIp) })) });
}, { canGiaoVien: true });
