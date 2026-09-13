// API Phòng hoạt động của Digital Campus — mọi học sinh/giáo viên đăng nhập
// đều tạo và vào phòng được. Phòng pham_vi='truong' mở cho học sinh TẤT CẢ các lớp
// (liên lớp); pham_vi='lop' chỉ học sinh cùng lớp chủ phòng (và giáo viên) vào được.
// Hỗ trợ chế độ phòng công khai / có mật khẩu và giới hạn sức chứa nguyên tử (Atomic Capacity).
import { bocXuLy, docThan, json, loi, chuoi, chuanUrlMedia } from '../_lib/api.js';
import { ghiNhanHoatDong } from './gamification.js';
import { bamMatKhau, taoSalt, xacMinhMatKhau } from '../_lib/passwords.js';
import { actorKey } from '../_lib/auth.js';
import { layPhamViQuanTri, xacDinhLopIdApDung } from '../_lib/quan-tri.js';
import {
  kiemTraTruyCapPhong, lamSachPhong, NHIP_HOAT_DONG, NHIP_HIEU_LUC,
  STUDY_CAP, PHONG_CAP, CAPABILITY, ACCESS_MODES, STAFF_LOCKED_CAPS,
  seedChinhSachPhong, taiToanBoChinhSach, taiQuyenCuaToi,
} from '../_lib/rooms.js';

const CAC_CAPABILITY = Object.values(CAPABILITY);

const LOAI_PHONG = ['chat', 'video', 'nhac']; // Caro Game sử dụng Game Arena riêng
const SO_PHONG_TOI_DA = 3; // mỗi người mở tối đa 3 phòng cùng lúc — chống spam

const vaiTroCua = (phien) => ((phien.role === 'teacher' || phien.role === 'admin') ? 'giao_vien' : 'hoc_sinh');
const tenCua = (phien) => phien.ten || phien.vaiTro || 'Thành viên';

// Ghi nhận vào phòng với kiểm soát sức chứa nguyên tử (Atomic Capacity Enforcement).
// MỘT lease duy nhất (NHIP_HIEU_LUC) cho cả 2 nhánh:
//  - Member row còn trong lease → refresh miễn phí (đang chiếm chỗ sẵn, không cần check sức chứa).
//  - Member row hết lease / chưa có → coi như VÀO MỚI: phải qua capacity check.
//    Row cũ còn sót (cleanup chưa chạy) KHÔNG được dùng để bypass sức chứa — EXISTS phải
//    kèm điều kiện tươi, nếu không thành viên cũ "hồi sinh" khi phòng đã đầy.
// UPSERT: khi rejoin sau hết hạn, vai_tro_phong reset về 'member' — co-host cũ không tự
// hồi sinh quyền staff; chỉ giữ role nếu row còn trong lease (heartbeat bình thường).
async function ghiNhanVao(db, phongId, phien, sucChua = 20) {
  const khoa = actorKey(phien);
  const res = await db.prepare(
    `INSERT INTO phong_thanh_vien (phong_id, khoa, hoc_sinh_id, ten, vai_tro, lop_id, hoat_dong_luc)
     SELECT ?1, ?2, ?3, ?4, ?5, ?6, datetime('now')
      WHERE (
        EXISTS (SELECT 1 FROM phong_thanh_vien
                 WHERE phong_id = ?1 AND khoa = ?2
                   AND datetime(hoat_dong_luc) > datetime('now', ?7))
        OR
        (SELECT COUNT(*) FROM phong_thanh_vien
          WHERE phong_id = ?1 AND datetime(hoat_dong_luc) > datetime('now', ?7)) < ?8
      )
      ON CONFLICT(phong_id, khoa) DO UPDATE SET
        hoat_dong_luc = datetime('now'),
        ten = ?4,
        vai_tro_phong = CASE
          WHEN datetime(phong_thanh_vien.hoat_dong_luc) > datetime('now', ?7)
          THEN phong_thanh_vien.vai_tro_phong ELSE 'member' END`
  ).bind(phongId, khoa, phien.hocSinhId || null, tenCua(phien), vaiTroCua(phien), phien.lopId || null, NHIP_HIEU_LUC, sucChua).run();

  return (res.meta?.changes ?? 0) > 0;
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  // Dọn thành viên đã "chết" heartbeat (rời phòng không bấm nút / đóng tab). Chỉ cần chạy
  // NGẪU NHIÊN ~1/10 lượt GET thay vì mọi lần — đây là dọn rác định kỳ, không ảnh hưởng tính
  // đúng của bất kỳ lượt đọc nào (mọi nơi đếm thành viên đều đã tự lọc theo NHIP_HIEU_LUC),
  // lease tới 15 phút nên chậm dọn vài chục giây không đáng kể — đổi lại giảm ~90% lượt ghi D1
  // này trên endpoint bị poll liên tục.
  if (Math.random() < 0.1) {
    await db.prepare(
      `DELETE FROM phong_thanh_vien WHERE datetime(hoat_dong_luc) < datetime('now', ?1)`
    ).bind(NHIP_HIEU_LUC).run().catch(() => {});
  }

  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('id') || '', 10);

  // Chi tiết 1 phòng + danh sách thành viên đang trong phòng.
  if (phongId > 0) {
    const check = await kiemTraTruyCapPhong(db, phongId, phien);
    if (check.loi) return loi(check.loi, check.status || 400, check.code ? { code: check.code } : null);

    const p = check.phong;
    // PREVIEW vs PARTICIPANT: chưa admitted (chưa join / chưa nhập pass) và không phải staff
    // → chỉ trả metadata an toàn của Lobby. KHÔNG trả danh sách thành viên, myCaps, policies.
    // Với phòng public, cauHinh (videoUrl) vẫn hiển thị — đó là preview công khai hợp lệ;
    // với phòng password, lamSachPhong tự ẩn cauHinh khi isAdmitted=false.
    if (!check.isAdmitted && !check.isStaff) {
      return json({
        ok: true,
        phong: lamSachPhong(p, { isAdmitted: false, canControl: false }),
        thanhVien: [],
        isAdmitted: false,
        canControl: false,
        isStaff: false,
        vaiTroPhong: 'member',
        laChuPhong: false,
      });
    }

    // Staff (host/GV/co-host) được thấy khoá thành viên để quản trị (kick, cấp quyền, co-host);
    // member thường không nhận khoá nội bộ của người khác.
    const tv = await db.prepare(
      `SELECT v.ten, v.vai_tro AS vaiTro, v.vai_tro_phong AS vaiTroPhong, v.lop_id AS lopId, l.ten AS lopTen,
              (v.khoa = ?2) AS laChuPhong
              ${check.isStaff ? ', v.khoa AS khoa' : ''}
         FROM phong_thanh_vien v LEFT JOIN lop l ON l.id = v.lop_id
        WHERE v.phong_id = ?1 AND datetime(v.hoat_dong_luc) > datetime('now', ?3)
        ORDER BY v.vao_luc ASC LIMIT 60`
    ).bind(phongId, p.chuPhongKhoa, NHIP_HIEU_LUC).all();

    const phongSach = lamSachPhong(p, { isAdmitted: check.isAdmitted, canControl: check.canControl, isHost: check.isHost });
    phongSach.vaiTroPhong = check.vaiTroPhong;

    const traVe = {
      ok: true,
      phong: phongSach,
      thanhVien: tv.results || [],
      isAdmitted: check.isAdmitted,
      canControl: check.canControl,
      isStaff: check.isStaff,
      vaiTroPhong: check.vaiTroPhong,
      laChuPhong: check.isHost,
      minhKhoa: actorKey(phien),
    };

    // Study Room: trả capability của chính mình (render UI) + policy đầy đủ cho staff.
    if (p.loai === 'video') {
      traVe.myCaps = await taiQuyenCuaToi(db, check);
      if (check.isStaff) {
        traVe.policies = await taiToanBoChinhSach(db, phongId); // null nếu D1 lỗi — client coi như không khả dụng
        const gr = await db.prepare(
          `SELECT khoa, capability, trang_thai AS trangThai FROM phong_grant WHERE phong_id = ?1`
        ).bind(phongId).all().catch(() => ({ results: [] }));
        traVe.grants = gr.results || [];
      }
    }

    return json(traVe);
  }

  // Danh sách phòng đang mở: toàn bộ phòng 'truong' + phòng 'lop' trong phạm vi được phép.
  // Student: lớp của phiên. GVCN: các lớp được gán (giao_vien_lop). School Admin: tất cả lớp.
  let dieuKienPhamVi = `(p.pham_vi = 'truong' OR (p.lop_id IS NOT NULL AND p.lop_id = ?2))`;
  const bindPhamVi = [phien.lopId || 0];
  if (phien.role === 'teacher' || phien.role === 'admin') {
    const pham = await layPhamViQuanTri(env, phien);
    if (pham.isSchoolAdmin) {
      dieuKienPhamVi = '1=1';
      bindPhamVi.length = 0;
    } else if (pham.lopIds?.length) {
      dieuKienPhamVi = `(p.pham_vi = 'truong' OR p.lop_id IN (${pham.lopIds.map((_, i) => `?${i + 2}`).join(',')}))`;
      bindPhamVi.splice(0, bindPhamVi.length, ...pham.lopIds);
    } else {
      dieuKienPhamVi = `p.pham_vi = 'truong'`;
      bindPhamVi.length = 0;
    }
  }
  const rs = await db.prepare(
    `SELECT p.id, p.loai, p.ten, p.mo_ta AS moTa, p.pham_vi AS phamVi, p.lop_id AS lopId,
            p.chu_phong_ten AS chuPhongTen, p.cau_hinh AS cauHinh,
            p.trang_thai AS trangThai, p.tao_luc AS taoLuc,
            p.access_mode AS accessMode, p.suc_chua AS sucChua,
            l.ten AS lopTen,
            (SELECT COUNT(*) FROM phong_thanh_vien v
              WHERE v.phong_id = p.id AND datetime(v.hoat_dong_luc) > datetime('now', ?1)) AS soNguoi
       FROM phong p LEFT JOIN lop l ON l.id = p.lop_id
      WHERE p.trang_thai = 'mo' AND ${dieuKienPhamVi}
      ORDER BY (p.chu_phong_khoa = 'he-thong') DESC, soNguoi DESC, p.tao_luc DESC
      LIMIT 50`
  ).bind(NHIP_HIEU_LUC, ...bindPhamVi).all();

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
  if (hanhDong === 'tao' || (!hanhDong && than.ten && !than.phongId)) {
    const ten = chuoi(than.ten, 80);
    const moTa = chuoi(than.moTa, 300);
    if (than.loai === 'game') {
      return loi('Chế độ chơi Caro vui lòng tạo trực tiếp từ Game Arena.', 400);
    }
    const loai = LOAI_PHONG.includes(than.loai) ? than.loai : 'chat';
    const phamVi = than.phamVi === 'lop' ? 'lop' : 'truong';
    if (ten.length < 2) return loi('Đặt tên phòng ít nhất 2 ký tự.');

    // Phòng phạm vi lớp: PHẢI xác định được lop_id thuộc thẩm quyền — tuyệt đối không lop_id=NULL.
    // Student: lớp của phiên. GVCN/School Admin: lớp client chọn nhưng phải nằm trong phạm vi
    // quản trị (xacDinhLopIdApDung trả null nếu ngoài phạm vi → chặn IDOR).
    let lopIdPhong = null;
    if (phamVi === 'lop') {
      if (phien.role === 'teacher' || phien.role === 'admin') {
        const pham = await layPhamViQuanTri(env, phien);
        lopIdPhong = xacDinhLopIdApDung(pham, Number(than.lopId) || null, phien.lopId);
        if (!lopIdPhong) {
          return loi('Không xác định được lớp trong phạm vi quản trị — chọn lớp được gán.', 403);
        }
      } else {
        if (!phien.lopId || phien.lopId <= 0) {
          return loi('Tài khoản chưa liên kết lớp không thể tạo phòng riêng của lớp.', 403);
        }
        lopIdPhong = phien.lopId;
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

    // Sức chứa tối đa (Capacity): Study Room (video) giới hạn cứng 2..12, mặc định 8;
    // các loại phòng khác giữ nguyên 2..50, mặc định 20.
    const capRule = loai === 'video' ? STUDY_CAP : PHONG_CAP;
    const rawSucChua = parseInt(than.sucChua || than.capacity, 10);
    const sucChua = !isNaN(rawSucChua)
      ? Math.min(capRule.MAX, Math.max(capRule.MIN, rawSucChua))
      : capRule.DEFAULT;

    const cauHinh = {};
    if (loai === 'nhac' && than.nhacUrl) {
      const u = chuanUrlMedia(than.nhacUrl);
      if (u === false) return loi('Link nhạc không hợp lệ — chỉ nhận link https:// (mp3/stream).');
      if (u) cauHinh.nhacUrl = u;
    }

    if (loai === 'video') {
      const u = chuanUrlMedia(than.videoUrl || than.linkNgoai);
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
      // Governance bắt buộc cho Study Room — seed lỗi thì đóng phòng ngay, không để phòng
      // "mở nhưng không có policy" (sẽ fail-closed ở mọi capability → phòng vô dụng).
      try {
        await seedChinhSachPhong(db, phongId);
      } catch (e) {
        console.error('seedChinhSachPhong that bai:', e);
        await db.prepare(`UPDATE phong SET trang_thai = 'dong' WHERE id = ?1`).bind(phongId).run().catch(() => {});
        return loi('Không khởi tạo được chính sách phòng — thử tạo lại.', 503);
      }
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
    return json({ ok: true, phong: lamSachPhong(checkTao.phong, { isAdmitted: true, canControl: true, isHost: true }), canControl: true, isAdmitted: true, laChuPhong: true });
  }

  const phongId = parseInt(than.phongId || '', 10);
  if (!(phongId > 0)) return loi('Thiếu phòng.', 400);
  const check = await kiemTraTruyCapPhong(db, phongId, phien);
  if (check.loi) return json({ ok: false, loi: check.loi, ...(check.code ? { code: check.code } : {}) }, check.status || 400);
  const p = check.phong;

  // ── VÀO PHÒNG / NHỊP heartbeat (giữ chỗ trong phòng) ──
  if (hanhDong === 'vao' || hanhDong === 'nhip') {
    // Kiểm tra mật khẩu nếu phòng ở chế độ password và chưa phải là chủ phòng hay giáo viên.
    // Bypass chỉ dành cho member row CÒN TRONG LEASE (NHIP_HIEU_LUC) — row cũ đã hết hạn
    // không được dùng để bỏ qua mật khẩu hiện tại (password rotation phải có hiệu lực
    // ngay với thành viên đã "rời" theo lease, dù row vật lý chưa bị cleanup xoá).
    if (p.accessMode === 'password' && !check.canControl) {
      const daTrongPhong = await db.prepare(
        `SELECT 1 FROM phong_thanh_vien WHERE phong_id = ?1 AND khoa = ?2
          AND datetime(hoat_dong_luc) > datetime('now', ?3)`
      ).bind(phongId, khoa, NHIP_HIEU_LUC).first();

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
      // Contract ổn định cho mọi đường từ chối vì hết chỗ — client/QA bắt theo code,
      // không phụ thuộc chuỗi thông báo.
      return loi('Phòng đã đầy (đạt giới hạn người tham gia).', 409, { code: 'room_full' });
    }

    const updatedCheck = await kiemTraTruyCapPhong(db, phongId, phien);
    // Query thành viên ngay khi join để frontend hiển thị ngay (không đợi poll 10s)
    const tvJoin = await db.prepare(
      `SELECT v.ten, v.vai_tro AS vaiTro, v.vai_tro_phong AS vaiTroPhong, v.lop_id AS lopId, l.ten AS lopTen,
              (v.khoa = ?2) AS laChuPhong
         FROM phong_thanh_vien v LEFT JOIN lop l ON l.id = v.lop_id
        WHERE v.phong_id = ?1 AND datetime(v.hoat_dong_luc) > datetime('now', ?3)
        ORDER BY v.vao_luc ASC LIMIT 60`
    ).bind(phongId, p.chuPhongKhoa, NHIP_HIEU_LUC).all().catch(() => ({ results: [] }));
    return json({
      ok: true,
      phong: lamSachPhong(updatedCheck.phong, { isAdmitted: true, canControl: updatedCheck.canControl, isHost: updatedCheck.isHost }),
      thanhVien: tvJoin.results || [],
      isAdmitted: true,
      canControl: updatedCheck.canControl,
      isStaff: updatedCheck.isStaff,
      vaiTroPhong: updatedCheck.vaiTroPhong,
      laChuPhong: updatedCheck.isHost,
    });
  }

  // ── RỜI PHÒNG ──
  if (hanhDong === 'roi') {
    await db.prepare('DELETE FROM phong_thanh_vien WHERE phong_id = ?1 AND khoa = ?2').bind(phongId, khoa).run();
    // Nhả slot voice nếu đang trong cặp 1-1
    await db.prepare(
      `UPDATE phong_voice_pair
          SET b_khoa = CASE WHEN b_khoa = ?2 THEN NULL ELSE b_khoa END,
              b_ten  = CASE WHEN b_khoa = ?2 THEN NULL ELSE b_ten END,
              cap_nhat_luc = CURRENT_TIMESTAMP
        WHERE phong_id = ?1 AND (a_khoa = ?2 OR b_khoa = ?2)`
    ).bind(phongId, khoa).run().catch(() => {});
    await db.prepare(
      `DELETE FROM phong_voice_pair WHERE phong_id = ?1 AND a_khoa = ?2`
    ).bind(phongId, khoa).run().catch(() => {});
    return json({ ok: true });
  }

  // ── ĐÓNG PHÒNG — chỉ chủ phòng hoặc giáo viên (co-host KHÔNG được đóng) ──
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

  // ══ STUDY ROOM GOVERNANCE — các hành động quản trị (chỉ phòng video) ══

  // ── ĐỔI MẬT KHẨU PHÒNG — chỉ host/GV ──
  if (hanhDong === 'doi_mat_khau') {
    if (!check.canControl) {
      return loi('Chỉ chủ phòng hoặc giáo viên mới đổi được mật khẩu phòng.', 403);
    }
    const mk = String(than.matKhauMoi || than.password || '').trim();
    if (mk.length < 1) return loi('Mật khẩu mới không được trống.', 400);
    const salt = taoSalt(16);
    const hash = await bamMatKhau(mk, salt);
    await db.prepare(
      `UPDATE phong SET access_mode = 'password', mat_khau_hash = ?1, mat_khau_salt = ?2, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?3`
    ).bind(hash, salt, phongId).run();
    return json({ ok: true });
  }

  // ── BỎ MẬT KHẨU (chuyển phòng về công khai) — chỉ host/GV ──
  if (hanhDong === 'bo_mat_khau') {
    if (!check.canControl) {
      return loi('Chỉ chủ phòng hoặc giáo viên mới bỏ được mật khẩu phòng.', 403);
    }
    await db.prepare(
      `UPDATE phong SET access_mode = 'public', mat_khau_hash = NULL, mat_khau_salt = NULL, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1`
    ).bind(phongId).run();
    return json({ ok: true });
  }

  // ── CẤP / THU CO-HOST — chỉ host/GV (co-host không tự thăng ai lên co-host) ──
  if (hanhDong === 'set_co_host') {
    if (!check.canControl) {
      return loi('Chỉ chủ phòng hoặc giáo viên mới cấp được co-host.', 403);
    }
    const khoaTV = chuoi(than.khoaTV || than.khoaThanhVien, 120);
    if (!khoaTV) return loi('Thiếu thành viên.', 400);
    if (khoaTV === p.chuPhongKhoa) return loi('Chủ phòng đã là host sẵn.', 400);
    // Không cấp co-host cho giáo viên (teacher đã là quyền cao nhất)
    const tvDich = await db.prepare(
      `SELECT vai_tro AS vaiTro, vai_tro_phong AS vaiTroPhong FROM phong_thanh_vien
        WHERE phong_id = ?1 AND khoa = ?2 AND datetime(hoat_dong_luc) > datetime('now', ?3)`
    ).bind(phongId, khoaTV, NHIP_HIEU_LUC).first();
    if (!tvDich) return loi('Thành viên không còn trong phòng.', 404);
    if (tvDich.vaiTro === 'giao_vien') return loi('Giáo viên đã có quyền cao nhất — không cần co-host.', 400);
    const bat = than.on !== false && than.on !== 0;
    await db.prepare(
      `UPDATE phong_thanh_vien SET vai_tro_phong = ?1 WHERE phong_id = ?2 AND khoa = ?3`
    ).bind(bat ? 'co_host' : 'member', phongId, khoaTV).run();
    return json({ ok: true, vaiTroPhong: bat ? 'co_host' : 'member' });
  }

  // ── KICK thành viên (ban trong phòng) — staff; co-host chỉ kick member ──
  if (hanhDong === 'kick') {
    if (!check.isStaff) {
      return loi('Chỉ quản trị phòng mới kick được thành viên.', 403);
    }
    const khoaTV = chuoi(than.khoaTV || than.khoaThanhVien, 120);
    if (!khoaTV) return loi('Thiếu thành viên.', 400);
    if (khoaTV === p.chuPhongKhoa) return loi('Không thể kick chủ phòng.', 400);
    if (khoaTV === khoa) return loi('Không thể tự kick chính mình — hãy bấm Rời phòng.', 400);
    const tvDich = await db.prepare(
      `SELECT ten, vai_tro AS vaiTro, vai_tro_phong AS vaiTroPhong FROM phong_thanh_vien WHERE phong_id = ?1 AND khoa = ?2`
    ).bind(phongId, khoaTV).first();
    // Teacher không bao giờ bị kick (quyền cao nhất không thể bị thu).
    if (tvDich?.vaiTro === 'giao_vien') return loi('Không thể kick giáo viên.', 403);
    // Co-host chỉ kick member thường; kick co-host khác chỉ host/GV làm được.
    if (check.isCoHost && tvDich?.vaiTroPhong === 'co_host') {
      return loi('Co-host không kick được co-host khác.', 403);
    }
    await db.prepare('DELETE FROM phong_thanh_vien WHERE phong_id = ?1 AND khoa = ?2').bind(phongId, khoaTV).run();
    await db.prepare(
      `INSERT OR REPLACE INTO phong_ban (phong_id, khoa, ten, boi_khoa) VALUES (?1, ?2, ?3, ?4)`
    ).bind(phongId, khoaTV, tvDich?.ten || null, khoa).run();
    // Nhả slot voice nếu người bị kick đang trong cặp
    await db.prepare(
      `UPDATE phong_voice_pair
          SET b_khoa = CASE WHEN b_khoa = ?2 THEN NULL ELSE b_khoa END,
              b_ten  = CASE WHEN b_khoa = ?2 THEN NULL ELSE b_ten END,
              cap_nhat_luc = CURRENT_TIMESTAMP
        WHERE phong_id = ?1 AND b_khoa = ?2`
    ).bind(phongId, khoaTV).run().catch(() => {});
    await db.prepare('DELETE FROM phong_voice_pair WHERE phong_id = ?1 AND a_khoa = ?2').bind(phongId, khoaTV).run().catch(() => {});
    return json({ ok: true });
  }

  // ── BỎ BAN — staff ──
  if (hanhDong === 'bo_chan' || hanhDong === 'bo_cam') {
    if (!check.isStaff) return loi('Chỉ quản trị phòng mới bỏ chặn được.', 403);
    const khoaTV = chuoi(than.khoaTV || than.khoaThanhVien, 120);
    if (!khoaTV) return loi('Thiếu thành viên.', 400);
    await db.prepare('DELETE FROM phong_ban WHERE phong_id = ?1 AND khoa = ?2').bind(phongId, khoaTV).run();
    return json({ ok: true });
  }

  // ── ĐỔI POLICY CAPABILITY — staff ──
  if (hanhDong === 'policy') {
    if (!check.isStaff) return loi('Chỉ quản trị phòng mới đổi được chính sách.', 403);
    if (p.loai !== 'video') return loi('Chính sách capability chỉ áp dụng cho Study Room (phòng video).', 400);
    const capability = chuoi(than.capability, 30);
    if (!CAC_CAPABILITY.includes(capability)) return loi('Capability không hợp lệ.', 400);
    let accessMode = chuoi(than.accessMode || than.access_mode, 20);
    const enabled = than.enabled === undefined ? 1 : (than.enabled ? 1 : 0);
    if (!ACCESS_MODES.includes(accessMode)) accessMode = null;
    // STAFF_LOCKED_CAPS (moderation): không cho mở rộng quá staff_only, không cấp member.
    if (STAFF_LOCKED_CAPS.includes(capability)) accessMode = 'staff_only';
    const hienTai = await taiToanBoChinhSach(db, phongId);
    if (!hienTai) return loi('Chính sách phòng tạm không khả dụng — thử lại sau.', 503);
    const pol = hienTai[capability] || { enabled: 1, access_mode: 'staff_only' };
    await db.prepare(
      `INSERT INTO phong_policy (phong_id, capability, enabled, access_mode, cap_nhat_luc)
       VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
       ON CONFLICT(phong_id, capability) DO UPDATE SET
         enabled = excluded.enabled, access_mode = excluded.access_mode, cap_nhat_luc = CURRENT_TIMESTAMP`
    ).bind(phongId, capability, enabled, accessMode || pol.access_mode).run();
    return json({ ok: true, capability, enabled, accessMode: accessMode || pol.access_mode });
  }

  // ── CẤP / THU QUYỀN CHO MEMBER (selected_members) — staff ──
  if (hanhDong === 'grant') {
    if (!check.isStaff) return loi('Chỉ quản trị phòng mới cấp quyền được.', 403);
    const capability = chuoi(than.capability, 30);
    if (!CAC_CAPABILITY.includes(capability) || STAFF_LOCKED_CAPS.includes(capability)) {
      return loi('Capability này không cấp cho thành viên được.', 400);
    }
    const khoaTV = chuoi(than.khoaTV || than.khoaThanhVien, 120);
    if (!khoaTV) return loi('Thiếu thành viên.', 400);
    const bat = than.on !== false && than.on !== 0;
    if (bat) {
      await db.prepare(
        `INSERT INTO phong_grant (phong_id, khoa, capability, trang_thai) VALUES (?1, ?2, ?3, 'granted')
         ON CONFLICT(phong_id, khoa, capability) DO UPDATE SET trang_thai = 'granted'`
      ).bind(phongId, khoaTV, capability).run();
    } else {
      await db.prepare(
        `DELETE FROM phong_grant WHERE phong_id = ?1 AND khoa = ?2 AND capability = ?3`
      ).bind(phongId, khoaTV, capability).run();
    }
    return json({ ok: true, capability, granted: bat });
  }

  return loi('Hành động không hợp lệ.', 400);
});
