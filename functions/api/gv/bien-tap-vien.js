// API Giáo viên Quản trị Biên Tập Viên Học Sinh Campus (Phase 4A.1)
import { json, loi, layPhien, docThan, chuoi } from '../../_lib/api.js';

export async function onRequestGet({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const phien = await layPhien(request, env);
    if (!phien || phien.role !== 'teacher') {
      return loi('Chỉ giáo viên mới có quyền xem danh sách biên tập viên.', 403);
    }

    const lopId = phien.lopId;
    if (!lopId) return loi('Phiên không có lớp hợp lệ.', 403);

    const rs = await db.prepare(`
      SELECT btv.hoc_sinh_id AS hocSinhId, btv.lop_id AS lopId, btv.duoc_phep_dang AS duocPhepDang,
             btv.nguoi_cap_khoa AS nguoiCapKhoa, btv.tao_luc AS taoLuc,
             hs.ho_ten AS hoTen, hs.so_thu_tu AS soThuTu
      FROM campus_bien_tap_vien btv
      JOIN hoc_sinh hs ON hs.id = btv.hoc_sinh_id
      WHERE btv.lop_id = ?1
      ORDER BY hs.so_thu_tu ASC, hs.id ASC
    `).bind(lopId).all();

    return json({
      ok: true,
      bienTapVien: rs.results || []
    });
  } catch (e) {
    console.error('gv/bien-tap-vien GET error:', e);
    return loi('Không tải được danh sách biên tập viên.', 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const phien = await layPhien(request, env);
    if (!phien || phien.role !== 'teacher') {
      return loi('Chỉ giáo viên mới có quyền phân quyền biên tập viên.', 403);
    }

    const lopId = phien.lopId;
    if (!lopId) return loi('Phiên không có lớp hợp lệ.', 403);
    const body = await docThan(request);
    const hanhDong = chuoi(body.hanhDong || 'cap_quyen');

    if (!['cap_quyen', 'thu_hoi'].includes(hanhDong)) return loi('Hành động không hợp lệ.');
    const hocSinhId = Number(body.hocSinhId);
    if (!hocSinhId || isNaN(hocSinhId)) return loi('Thiếu ID học sinh.');

    // 1. Kiểm tra học sinh có đúng thuộc lớp của giáo viên không
    const hs = await db.prepare('SELECT ho_ten AS hoTen FROM hoc_sinh WHERE id = ?1 AND lop_id = ?2').bind(hocSinhId, lopId).first();
    if (!hs) return loi('Học sinh không tồn tại trong lớp được phân công.', 400);

    // 2. THU HỒI QUYỀN BIÊN TẬP
    if (hanhDong === 'thu_hoi') {
      await db.prepare('DELETE FROM campus_bien_tap_vien WHERE hoc_sinh_id = ?1 AND lop_id = ?2').bind(hocSinhId, lopId).run();
      return json({ ok: true, thongBao: `Đã thu hồi quyền biên tập viên của em ${hs.hoTen}.` });
    }

    // 3. CẤP QUYỀN BIÊN TẬP (Mặc định duoc_phep_dang = 0: chỉ soạn nháp và gửi duyệt)
    const actorKey = phien.id ? `gv:${phien.id}` : `gv:${lopId}`;

    await db.prepare(`
      INSERT INTO campus_bien_tap_vien (hoc_sinh_id, lop_id, duoc_phep_dang, nguoi_cap_khoa, tao_luc)
      VALUES (?1, ?2, 0, ?3, CURRENT_TIMESTAMP)
      ON CONFLICT(hoc_sinh_id, lop_id) DO UPDATE SET
        duoc_phep_dang = 0,
        nguoi_cap_khoa = excluded.nguoi_cap_khoa
    `).bind(hocSinhId, lopId, actorKey).run();

    return json({
      ok: true,
      thongBao: `Đã cấp quyền biên tập viên (soạn nháp & gửi duyệt) cho em ${hs.hoTen}.`
    });
  } catch (e) {
    console.error('gv/bien-tap-vien POST error:', e);
    return loi('Lỗi khi phân quyền biên tập viên. Thử lại sau.', 500);
  }
}
