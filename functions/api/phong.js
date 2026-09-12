// API Phòng hoạt động của Digital Campus — mọi học sinh/giáo viên đăng nhập
// đều tạo và vào phòng được. Phòng pham_vi='truong' mở cho học sinh TẤT CẢ các lớp
// (liên lớp); pham_vi='lop' chỉ học sinh cùng lớp chủ phòng (và giáo viên) vào được.
// Hỗ trợ chế độ phòng công khai / có mật khẩu và giới hạn sức chứa nguyên tử (Atomic Capacity).
import { bocXuLy, docThan, json, loi, chuoi, chuanUrlMedia } from '../_lib/api.js';
import { ghiNhanHoatDong } from './gamification.js';
import { bamMatKhau, taoSalt, xacMinhMatKhau } from '../_lib/passwords.js';
import { actorKey } from '../_lib/auth.js';
import { kiemTraTruyCapPhong, lamSachPhong, NHIP_HOAT_DONG, NHIP_HIEU_LUC } from '../_lib/rooms.js';

const LOAI_PHONG = ['chat', 'video', 'nhac']; // Caro Game sử dụng Game Arena riêng
const SO_PHONG_TOI_DA = 3; // mỗi người mở tối đa 3 phòng cùng lúc — chống spam

const vaiTroCua = (phien) => (phien.role === 'teacher' ? 'giao_vien' : 'hoc_sinh');
const tenCua = (phien) => phien.ten || phien.vaiTro || 'Thành viên';

// Ghi nhận vào phòng với kiểm soát sức chứa nguyên tử (Atomic Capacity Enforcement)
async function ghiNhanVao(db, phongId, phien, sucChua = 20) {
  const khoa = actorKey(phien);
  const res = await db.prepare(
    `INSERT INTO phong_thanh_vien (phong_id, khoa, hoc_sinh_id, ten, vai_tro, lop_id, hoat_dong_luc)
     SELECT ?1, ?2, ?3, ?4, ?5, ?6, datetime('now')
      WHERE (
        EXISTS (SELECT 1 FROM phong_thanh_vien WHERE phong_id = ?1 AND khoa = ?2)
        OR
        (SELECT COUNT(*) FROM phong_thanh_vien WHERE phong_id = ?1 AND datetime(hoat_dong_luc) > datetime('now', ?7)) < ?8
      )
      ON CONFLICT(phong_id, khoa) DO UPDATE SET hoat_dong_luc = datetime('now'), ten = ?4`
  ).bind(phongId, khoa, phien.hocSinhId || null, tenCua(phien), vaiTroCua(phien), phien.lopId || null, NHIP_HOAT_DONG, sucChua).run();

  return (res.meta?.changes ?? 0) > 0;
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  // Dọn thành viên đã "chết" heartbeat (rời phòng không bấm nút / đóng tab).
  await db.prepare(
    `DELETE FROM phong_thanh_vien WHERE datetime(hoat_dong_luc) < datetime('now', ?1)`
  ).bind(NHIP_HIEU_LUC).run().catch(() => {});

  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('id') || '', 10);

  // Chi tiết 1 phòng + danh sách thành viên đang trong phòng.
  if (phongId > 0) {
    const check = await kiemTraTruyCapPhong(db, phongId, phien);
    if (check.loi) return loi(check.loi, check.status || 400);

    const p = check.phong;
    // Nếu phòng có mật khẩu và chưa được duyệt vào phòng (không phải host/GV và chưa nhập pass)
    if (p.accessMode === 'password' && !check.isAdmitted && !check.canControl) {
      return json({
        ok: true,
        phong: lamSachPhong(p, { isAdmitted: false, canControl: false }),
        thanhVien: [],
        isAdmitted: false,
        canControl: false,
        laChuPhong: false,
      });
    }

    const tv = await db.prepare(
      `SELECT v.ten, v.vai_tro AS vaiTro, v.lop_id AS lopId, l.ten AS lopTen,
              (v.khoa = ?2) AS laChuPhong
         FROM phong_thanh_vien v LEFT JOIN lop l ON l.id = v.lop_id
        WHERE v.phong_id = ?1 AND datetime(v.hoat_dong_luc) > datetime('now', ?3)
        ORDER BY v.vao_luc ASC LIMIT 60`
    ).bind(phongId, p.chuPhongKhoa, NHIP_HOAT_DONG).all();

    return json({
      ok: true,
      phong: lamSachPhong(p, { isAdmitted: check.isAdmitted, canControl: check.canControl }),
      thanhVien: tv.results || [],
      isAdmitted: check.isAdmitted,
      canControl: check.canControl,
      laChuPhong: check.isHost,
      minhKhoa: actorKey(phien),
    });
  }

  // Danh sách phòng đang mở: toàn bộ phòng 'truong' + phòng 'lop' của lớp mình.
  const rs = await db.prepare(
    `SELECT p.id, p.loai, p.ten, p.mo_ta AS moTa, p.pham_vi AS phamVi, p.lop_id AS lopId,
            p.chu_phong_ten AS chuPhongTen,
            p.trang_thai AS trangThai, p.tao_luc AS taoLuc,
            p.access_mode AS accessMode, p.suc_chua AS sucChua,
            l.ten AS lopTen,
            (SELECT COUNT(*) FROM phong_thanh_vien v
              WHERE v.phong_id = p.id AND datetime(v.hoat_dong_luc) > datetime('now', ?3)) AS soNguoi
       FROM phong p LEFT JOIN lop l ON l.id = p.lop_id
      WHERE p.trang_thai = 'mo'
        AND (p.pham_vi = 'truong' OR (p.lop_id IS NOT NULL AND p.lop_id = ?1) OR ?2 = 1)
      ORDER BY (p.chu_phong_khoa = 'he-thong') DESC, soNguoi DESC, p.tao_luc DESC
      LIMIT 50`
  ).bind(phien.lopId || 0, phien.role === 'teacher' ? 1 : 0, NHIP_HOAT_DONG).all();

  // Số người đang hoạt động toàn campus (chỉ tính phòng toàn trường đang mở) — DISTINCT khoá phiên.
  const dd = await db.prepare(
    `SELECT COUNT(DISTINCT v.khoa) AS n
       FROM phong_thanh_vien v
       JOIN phong p ON p.id = v.phong_id
      WHERE p.trang_thai = 'mo'
        AND p.pham_vi = 'truong'
        AND datetime(v.hoat_dong_luc) > datetime('now', ?1)`
  ).bind(NHIP_HOAT_DONG).first();

  const phongSach = (rs.results || []).map((p) => lamSachPhong(p));

  return json({ ok: true, phongs: phongSach, dangHoatDong: dd?.n || 0 });
});

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const than = await docThan(request);
  const hanhDong = chuoi(than.hanhDong, 20);
  const khoa = actorKey(phien);

  // ── TẠO PHÒNG — mọi học sinh/GV đăng nhập đều được ──
  if (hanhDong === 'tao') {
    const ten = chuoi(than.ten, 80);
    const moTa = chuoi(than.moTa, 300);
    if (than.loai === 'game') {
      return loi('Chế độ chơi Caro vui lòng tạo trực tiếp từ Game Arena.', 400);
    }
    const loai = LOAI_PHONG.includes(than.loai) ? than.loai : 'chat';
    const phamVi = than.phamVi === 'lop' ? 'lop' : 'truong';
    if (ten.length < 2) return loi('Đặt tên phòng ít nhất 2 ký tự.');

    if (phamVi === 'lop') {
      if ((!phien.lopId || phien.lopId <= 0) && phien.role !== 'teacher') {
        return loi('Tài khoản chưa liên kết lớp không thể tạo phòng riêng của lớp.', 403);
      }
    }

    // Chế độ truy cập: public hoặc password
    const accessMode = (than.accessMode === 'password' || than.access_mode === 'password') ? 'password' : 'public';
    let matKhauHash = null;
    let matKhauSalt = null;

    if (accessMode === 'password') {
      const pass = String(than.password || than.matKhau || '').trim();
      if (pass.length < 1) {
        return loi('Phòng có mật khẩu yêu cầu nhập mật khẩu bảo vệ.', 400);
      }
      matKhauSalt = taoSalt(16);
      matKhauHash = await bamMatKhau(pass, matKhauSalt);
    }

    // Sức chứa tối đa (Capacity)
    const rawSucChua = parseInt(than.sucChua || than.capacity, 10);
    const sucChua = !isNaN(rawSucChua) ? Math.min(50, Math.max(2, rawSucChua)) : 20;

    const cauHinh = {};
    if (loai === 'nhac' && than.nhacUrl) {
      const u = chuanUrlMedia(than.nhacUrl);
      if (u === false) return loi('Link nhạc không hợp lệ — chỉ nhận link https:// (mp3/stream).');
      if (u) cauHinh.nhacUrl = u;
    }

    if (loai === 'video') {
      const u = chuanUrlMedia(than.videoUrl);
      if (u === false) return loi('Link video không hợp lệ — chỉ nhận link https:// (YouTube, Drive, mp4...).');
      if (!u) return loi('Phòng xem video cần dán link video (YouTube / Google Drive / mp4).');
      cauHinh.videoUrl = u;
    }

    const dangMo = await db.prepare(
      `SELECT COUNT(*) AS n FROM phong WHERE chu_phong_khoa = ?1 AND trang_thai = 'mo'`
    ).bind(khoa).first();
    if ((dangMo?.n || 0) >= SO_PHONG_TOI_DA) {
      return loi(`Mỗi người chỉ mở tối đa ${SO_PHONG_TOI_DA} phòng cùng lúc — đóng bớt phòng cũ rồi tạo lại.`, 429);
    }

    const lopIdPhong = phamVi === 'lop' ? (phien.lopId || null) : null;
    const kq = await db.prepare(
      `INSERT INTO phong (
         loai, ten, mo_ta, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten,
         cau_hinh, access_mode, mat_khau_hash, mat_khau_salt, suc_chua
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
    ).bind(
      loai, ten, moTa || null, phamVi, lopIdPhong, khoa, tenCua(phien),
      Object.keys(cauHinh).length ? JSON.stringify(cauHinh) : null,
      accessMode, matKhauHash, matKhauSalt, sucChua
    ).run();

    const phongId = kq.meta?.last_row_id;
    if (loai === 'video' && phongId > 0) {
      await db.prepare(
        `INSERT INTO phong_dong_bo_video (phong_id, trang_thai, vi_tri_giay, toc_do, revision, cap_nhat_luc, nguoi_cap_nhat_khoa, nguoi_cap_nhat_ten)
         VALUES (?1, 'paused', 0, 1.0, 1, CURRENT_TIMESTAMP, ?2, ?3)`
      ).bind(phongId, khoa, tenCua(phien)).run().catch(() => {});
    }
    if (loai === 'nhac' && phongId > 0) {
      await db.prepare(
        `INSERT INTO phong_focus_state (phong_id, giai_doan, trang_thai, thoi_luong_giay, thoi_gian_con_lai_giay, preset, revision, cap_nhat_luc, nguoi_cap_nhat_khoa, nguoi_cap_nhat_ten)
         VALUES (?1, 'focus', 'paused', 1500, 1500, '25_5', 1, CURRENT_TIMESTAMP, ?2, ?3)`
      ).bind(phongId, khoa, tenCua(phien)).run().catch(() => {});
    }

    await ghiNhanVao(db, phongId, phien, sucChua);
    if (phien.hocSinhId) {
      await ghiNhanHoatDong(env, { hocSinhId: phien.hocSinhId, lopId: phien.lopId, loaiHoatDong: 'chat', moTa: `Tạo phòng "${ten}"` }).catch(() => {});
    }
    const checkTao = await kiemTraTruyCapPhong(db, phongId, phien);
    return json({ ok: true, phong: lamSachPhong(checkTao.phong, { isAdmitted: true, canControl: true }), canControl: true, isAdmitted: true, laChuPhong: true });
  }

  const phongId = parseInt(than.phongId || '', 10);
  if (!(phongId > 0)) return loi('Thiếu phòng.', 400);
  const check = await kiemTraTruyCapPhong(db, phongId, phien);
  if (check.loi) return loi(check.loi, check.status || 400);
  const p = check.phong;

  // ── VÀO PHÒNG / NHỊP heartbeat (giữ chỗ trong phòng) ──
  if (hanhDong === 'vao' || hanhDong === 'nhip') {
    // Kiểm tra mật khẩu nếu phòng ở chế độ password và chưa phải là chủ phòng hay giáo viên
    if (p.accessMode === 'password' && !check.canControl) {
      const daTrongPhong = await db.prepare(
        'SELECT 1 FROM phong_thanh_vien WHERE phong_id = ?1 AND khoa = ?2'
      ).bind(phongId, khoa).first();

      if (!daTrongPhong) {
        const pass = String(than.password || than.matKhau || '').trim();
        const dungMatKhau = await xacMinhMatKhau(pass, p.matKhauHash, p.matKhauSalt);
        if (!dungMatKhau) {
          return loi('Mật khẩu phòng không chính xác.', 403);
        }
      }
    }

    const sucChua = p.sucChua || 20;
    const ghiNhanOk = await ghiNhanVao(db, phongId, phien, sucChua);
    if (!ghiNhanOk) {
      return loi('Phòng đã đầy (đạt giới hạn người tham gia).', 409);
    }

    const updatedCheck = await kiemTraTruyCapPhong(db, phongId, phien);
    return json({
      ok: true,
      phong: lamSachPhong(updatedCheck.phong, { isAdmitted: true, canControl: check.canControl }),
      isAdmitted: true,
      canControl: check.canControl,
      laChuPhong: check.isHost,
    });
  }

  // ── RỜI PHÒNG ──
  if (hanhDong === 'roi') {
    await db.prepare('DELETE FROM phong_thanh_vien WHERE phong_id = ?1 AND khoa = ?2').bind(phongId, khoa).run();
    return json({ ok: true });
  }

  // ── ĐÓNG PHÒNG — chỉ chủ phòng hoặc giáo viên ──
  if (hanhDong === 'dong') {
    if (!check.canControl) {
      return loi('Chỉ chủ phòng hoặc giáo viên mới đóng được phòng.', 403);
    }
    await db.prepare(`UPDATE phong SET trang_thai = 'dong', cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1`).bind(phongId).run();
    await db.prepare('DELETE FROM phong_thanh_vien WHERE phong_id = ?1').bind(phongId).run();
    await db.prepare('DELETE FROM phong_dong_bo_video WHERE phong_id = ?1').bind(phongId).run().catch(() => {});
    await db.prepare('DELETE FROM phong_focus_state WHERE phong_id = ?1').bind(phongId).run().catch(() => {});
    return json({ ok: true });
  }

  return loi('Hành động không hợp lệ.', 400);
});
