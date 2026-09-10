// API Quản trị Phòng tán gẫu dành riêng cho Giáo viên chủ nhiệm
import { bocXuLy, docThan, json, loi } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const lopId = phien.lopId || 1;

  // 1. Cài đặt hiện tại
  const caiDat = await env.DB.prepare(
    'SELECT dang_mo AS dangMo, gian_cach_giay AS gianCachGiay, thong_bao_ghim AS thongBaoGhim FROM chat_cai_dat WHERE lop_id = ?1'
  ).bind(lopId).first() || { dangMo: 1, gianCachGiay: 5, thongBaoGhim: '' };

  // 2. Danh sách học sinh đang bị cấm chat
  const rsCam = await env.DB.prepare(`
    SELECT c.hoc_sinh_id AS hocSinhId, h.ho_ten AS hoTen, h.stt, c.ly_do AS lyDo, c.den_luc AS denLuc, c.tao_luc AS taoLuc
    FROM chat_cam_hoc_sinh c
    JOIN hoc_sinh h ON c.hoc_sinh_id = h.id
    WHERE c.lop_id = ?1
    ORDER BY c.tao_luc DESC
  `).bind(lopId).all();

  return json({
    ok: true,
    caiDat,
    danhSachCam: rsCam.results || [],
  });
}, { canGiaoVien: true });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const lopId = phien.lopId || 1;
  const than = await docThan(request);

  const dangMo = than.dangMo === false ? 0 : 1;
  const gianCachGiay = Math.max(1, Math.min(60, parseInt(than.gianCachGiay || '5', 10)));
  const thongBaoGhim = String(than.thongBaoGhim || '').trim().slice(0, 300);

  await env.DB.prepare(`
    INSERT INTO chat_cai_dat (lop_id, dang_mo, gian_cach_giay, thong_bao_ghim, cap_nhat_luc)
    VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
    ON CONFLICT(lop_id) DO UPDATE SET
      dang_mo = excluded.dang_mo,
      gian_cach_giay = excluded.gian_cach_giay,
      thong_bao_ghim = excluded.thong_bao_ghim,
      cap_nhat_luc = CURRENT_TIMESTAMP
  `).bind(lopId, dangMo, gianCachGiay, thongBaoGhim).run();

  return json({ ok: true, thongBao: 'Đã cập nhật cài đặt phòng chat.' });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const lopId = phien.lopId || 1;
  const than = await docThan(request);
  const hanhDong = than.hanhDong;

  if (hanhDong === 'cam_chat') {
    const hocSinhId = Number(than.hocSinhId);
    const lyDo = String(than.lyDo || 'Vi phạm nội quy chat').trim().slice(0, 200);
    const thoiGianPhut = Number(than.thoiGianPhut || 0); // 0 = cấm vĩnh viễn tới khi gỡ

    if (!hocSinhId) return loi('Thiếu mã học sinh cần cấm chat.');

    let denLuc = null;
    if (thoiGianPhut > 0) {
      denLuc = new Date(Date.now() + thoiGianPhut * 60 * 1000).toISOString();
    }

    await env.DB.prepare(`
      INSERT INTO chat_cam_hoc_sinh (hoc_sinh_id, lop_id, ly_do, den_luc)
      VALUES (?1, ?2, ?3, ?4)
      ON CONFLICT(hoc_sinh_id, lop_id) DO UPDATE SET
        ly_do = excluded.ly_do,
        den_luc = excluded.den_luc,
        tao_luc = CURRENT_TIMESTAMP
    `).bind(hocSinhId, lopId, lyDo, denLuc).run();

    // Lấy tên học sinh để ghi thông báo hệ thống
    const hs = await env.DB.prepare('SELECT ho_ten AS hoTen FROM hoc_sinh WHERE id = ?1').bind(hocSinhId).first();
    const tenHs = hs ? hs.hoTen : `Học sinh #${hocSinhId}`;
    const thoiGianStr = thoiGianPhut > 0 ? `${thoiGianPhut} phút` : 'cho đến khi mở lại';

    await env.DB.prepare(`
      INSERT INTO chat_tin_nhan (lop_id, hoc_sinh_id, ten_nguoi_gui, vai_tro, noi_dung)
      VALUES (?1, NULL, 'Hệ thống', 'he_thong', ?2)
    `).bind(lopId, `⚠️ Giáo viên đã tạm dừng quyền chat của em ${tenHs} (${thoiGianStr})`).run();

    return json({ ok: true, thongBao: `Đã cấm chat học sinh ${tenHs}.` });
  }

  if (hanhDong === 'mo_cam_chat') {
    const hocSinhId = Number(than.hocSinhId);
    if (!hocSinhId) return loi('Thiếu mã học sinh cần gỡ cấm chat.');

    await env.DB.prepare('DELETE FROM chat_cam_hoc_sinh WHERE hoc_sinh_id = ?1 AND lop_id = ?2')
      .bind(hocSinhId, lopId).run();

    return json({ ok: true, thongBao: 'Đã mở lại quyền chat cho học sinh.' });
  }

  if (hanhDong === 'xoa_tin') {
    const tinId = Number(than.tinId);
    if (!tinId) return loi('Thiếu mã tin nhắn cần xoá.');

    await env.DB.prepare('UPDATE chat_tin_nhan SET da_xoa = 1 WHERE id = ?1 AND lop_id = ?2')
      .bind(tinId, lopId).run();

    return json({ ok: true, thongBao: 'Đã xoá tin nhắn.' });
  }

  if (hanhDong === 'xoa_lich_su') {
    await env.DB.prepare('DELETE FROM chat_tin_nhan WHERE lop_id = ?1').bind(lopId).run();
    return json({ ok: true, thongBao: 'Đã dọn sạch lịch sử phòng chat.' });
  }

  return loi('Hành động không hợp lệ.');
}, { canGiaoVien: true });
