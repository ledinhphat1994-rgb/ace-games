// GET /api/whoami — cho frontend biết đang đăng nhập là ai, để hiện đúng menu.
import { bocXuLy, json } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  // Tên lớp hiện tại — giáo viên có thể chủ nhiệm nhiều lớp bằng nhiều mã khác nhau, hiển thị
  // rõ đang ở đúng lớp nào để tránh nhầm lẫn (dù dữ liệu đã tách biệt tuyệt đối ở tầng máy chủ).
  const lop = await env.DB.prepare('SELECT ten FROM lop WHERE id = ?1').bind(phien.lopId).first().catch(() => null);

  return json({
    ok: true,
    role: phien.role,
    ten: phien.ten || '',
    vaiTro: phien.vaiTro || '',
    quyen: phien.quyen || [],
    hocSinhId: phien.hocSinhId || null,
    ma: phien.ma || '',
    tenLop: lop?.ten || '',
    toSo: phien.toSo || null,
    chucVu: phien.chucVu || '',
  });
});
