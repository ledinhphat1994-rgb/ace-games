// API Đồng bộ Phiên Tập Trung (Focus / Study Café Room) - Digital Campus (Phase 3D.1)
// Quản trị trạng thái đếm giờ tập trung (Pomodoro) theo cơ chế Server-Authoritative
// với khoá lạc quan (Optimistic Concurrency Control) và phân quyền chặt chẽ.
import { bocXuLy, docThan, json, loi, chuoi } from '../_lib/api.js';

const PRESETS = {
  '25_5': { focus: 1500, break: 300 },   // 25 phút tập trung, 5 phút nghỉ
  '50_10': { focus: 3000, break: 600 }   // 50 phút tập trung, 10 phút nghỉ
};

const CAC_HANH_DONG = ['start', 'pause', 'reset', 'start_break', 'start_focus', 'set_preset'];

function khoaPhien(phien) {
  if (phien.role === 'teacher') return `gv:${phien.lopId || 1}`;
  if (phien.hocSinhId) return `hs:${phien.hocSinhId}`;
  return `phu:${phien.phuId || 0}`;
}

const tenCua = (phien) => phien.ten || phien.vaiTro || 'Thành viên';

function duocVao(phong, phien) {
  if (!phong || phong.trangThai !== 'mo') return false;
  if (phong.phamVi === 'truong') return true;
  if (phien.role === 'teacher') return true;
  return phong.lopId === phien.lopId;
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const p = await db.prepare(
    `SELECT id, loai, ten, mo_ta AS moTa, pham_vi AS phamVi, lop_id AS lopId,
            chu_phong_khoa AS chuPhongKhoa, chu_phong_ten AS chuPhongTen,
            cau_hinh AS cauHinh, trang_thai AS trangThai
       FROM phong WHERE id = ?1`
  ).bind(phongId).first();

  if (!p || p.trangThai !== 'mo') return loi('Phòng không tồn tại hoặc đã đóng.', 404);
  if (!duocVao(p, phien)) return loi('Bạn không có quyền truy cập phòng này.', 403);

  let row = await db.prepare(
    `SELECT phong_id AS phongId, giai_doan AS giaiDoan, trang_thai AS trangThai,
            thoi_luong_giay AS thoiLuongGiay, thoi_gian_con_lai_giay AS thoiGianConLaiGiay,
            preset, revision, cap_nhat_luc AS capNhatLuc,
            nguoi_cap_nhat_khoa AS nguoiCapNhatKhoa, nguoi_cap_nhat_ten AS nguoiCapNhatTen
       FROM phong_focus_state WHERE phong_id = ?1`
  ).bind(phongId).first();

  // Khởi tạo trạng thái trung lập nếu chưa có bản ghi
  if (!row) {
    await db.prepare(
      `INSERT INTO phong_focus_state (phong_id, giai_doan, trang_thai, thoi_luong_giay, thoi_gian_con_lai_giay, preset, revision, cap_nhat_luc, nguoi_cap_nhat_khoa, nguoi_cap_nhat_ten)
       VALUES (?1, 'focus', 'paused', 1500, 1500, '25_5', 1, CURRENT_TIMESTAMP, NULL, NULL)`
    ).bind(phongId).run().catch(() => {});

    row = await db.prepare(
      `SELECT phong_id AS phongId, giai_doan AS giaiDoan, trang_thai AS trangThai,
              thoi_luong_giay AS thoiLuongGiay, thoi_gian_con_lai_giay AS thoiGianConLaiGiay,
              preset, revision, cap_nhat_luc AS capNhatLuc,
              nguoi_cap_nhat_khoa AS nguoiCapNhatKhoa, nguoi_cap_nhat_ten AS nguoiCapNhatTen
         FROM phong_focus_state WHERE phong_id = ?1`
    ).bind(phongId).first();
  }

  const nowMs = Date.now();
  const isRunning = row.trangThai === 'running';
  let remainingSeconds = Number(row.thoiGianConLaiGiay || 0);

  if (isRunning) {
    const updateTimeMs = new Date(String(row.capNhatLuc).replace(' ', 'T') + (String(row.capNhatLuc).includes('T') ? '' : 'Z')).getTime();
    const elapsedSec = Math.max(0, Math.floor((nowMs - updateTimeMs) / 1000));
    remainingSeconds = Math.max(0, remainingSeconds - elapsedSec);
  }

  const khoa = khoaPhien(phien);
  const canControl = p.chuPhongKhoa === khoa || phien.role === 'teacher';

  let cauHinh = {};
  try { cauHinh = p.cauHinh ? JSON.parse(p.cauHinh) : {}; } catch { }
  const nhacUrl = cauHinh.nhacUrl || '';

  return json({
    ok: true,
    state: {
      phase: row.giaiDoan,
      status: row.trangThai,
      giai_doan: row.giaiDoan,
      trang_thai: row.trangThai,
      giaiDoan: row.giaiDoan,
      trangThai: row.trangThai,
      running: isRunning && remainingSeconds > 0,
      completed: remainingSeconds === 0,
      remainingSeconds,
      thoi_gian_con_lai_giay: remainingSeconds,
      thoiGianConLaiGiay: remainingSeconds,
      durationSeconds: Number(row.thoiLuongGiay || 1500),
      thoi_luong_giay: Number(row.thoiLuongGiay || 1500),
      thoiLuongGiay: Number(row.thoiLuongGiay || 1500),
      preset: row.preset || '25_5',
      revision: Number(row.revision || 1),
      updatedAt: row.capNhatLuc,
      serverNow: new Date(nowMs).toISOString(),
      updatedBy: row.nguoiCapNhatTen || null
    },
    canControl,
    nhacUrl,
    phong: {
      id: p.id,
      ten: p.ten,
      phamVi: p.phamVi,
      chuPhongTen: p.chuPhongTen
    }
  });
});

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const than = await docThan(request);
  const phongId = parseInt(than.phongId || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const p = await db.prepare(
    `SELECT id, loai, ten, pham_vi AS phamVi, lop_id AS lopId,
            chu_phong_khoa AS chuPhongKhoa, chu_phong_ten AS chuPhongTen,
            trang_thai AS trangThai
       FROM phong WHERE id = ?1`
  ).bind(phongId).first();

  if (!p || p.trangThai !== 'mo') return loi('Phòng không tồn tại hoặc đã đóng.', 404);
  if (!duocVao(p, phien)) return loi('Bạn không có quyền truy cập phòng này.', 403);

  const khoa = khoaPhien(phien);
  const canControl = p.chuPhongKhoa === khoa || phien.role === 'teacher';
  if (!canControl) {
    return loi('Chỉ chủ phòng hoặc giáo viên mới có quyền điều khiển phiên tập trung.', 403);
  }

  const action = chuoi(than.action, 20);
  if (!CAC_HANH_DONG.includes(action)) {
    return loi('Hành động không hợp lệ (chỉ nhận: start, pause, reset, start_break, start_focus, set_preset).', 400);
  }

  const expectedRev = parseInt(than.expectedRevision || '0', 10);
  if (!(expectedRev >= 1)) {
    return loi('Thiếu hoặc sai số revision kỳ vọng.', 400);
  }

  let hienTai = await db.prepare(
    `SELECT phong_id AS phongId, giai_doan AS giaiDoan, trang_thai AS trangThai,
            thoi_luong_giay AS thoiLuongGiay, thoi_gian_con_lai_giay AS thoiGianConLaiGiay,
            preset, revision, cap_nhat_luc AS capNhatLuc,
            nguoi_cap_nhat_khoa AS nguoiCapNhatKhoa, nguoi_cap_nhat_ten AS nguoiCapNhatTen
       FROM phong_focus_state WHERE phong_id = ?1`
  ).bind(phongId).first();

  if (!hienTai) {
    await db.prepare(
      `INSERT INTO phong_focus_state (phong_id, giai_doan, trang_thai, thoi_luong_giay, thoi_gian_con_lai_giay, preset, revision, cap_nhat_luc, nguoi_cap_nhat_khoa, nguoi_cap_nhat_ten)
       VALUES (?1, 'focus', 'paused', 1500, 1500, '25_5', 1, CURRENT_TIMESTAMP, ?2, ?3)`
    ).bind(phongId, khoa, tenCua(phien)).run().catch(() => {});

    hienTai = await db.prepare(
      `SELECT phong_id AS phongId, giai_doan AS giaiDoan, trang_thai AS trangThai,
              thoi_luong_giay AS thoiLuongGiay, thoi_gian_con_lai_giay AS thoiGianConLaiGiay,
              preset, revision, cap_nhat_luc AS capNhatLuc,
              nguoi_cap_nhat_khoa AS nguoiCapNhatKhoa, nguoi_cap_nhat_ten AS nguoiCapNhatTen
         FROM phong_focus_state WHERE phong_id = ?1`
    ).bind(phongId).first();
  }

  const nowMs = Date.now();
  const isCurrentlyRunning = hienTai.trangThai === 'running';
  let curRemaining = Number(hienTai.thoiGianConLaiGiay || 0);

  if (isCurrentlyRunning) {
    const updateTimeMs = new Date(String(hienTai.capNhatLuc).replace(' ', 'T') + (String(hienTai.capNhatLuc).includes('T') ? '' : 'Z')).getTime();
    const elapsedSec = Math.max(0, Math.floor((nowMs - updateTimeMs) / 1000));
    curRemaining = Math.max(0, curRemaining - elapsedSec);
  }

  let newGiaiDoan = hienTai.giaiDoan;
  let newTrangThai = hienTai.trangThai;
  let newThoiLuong = Number(hienTai.thoiLuongGiay || 1500);
  let newRemaining = curRemaining;
  let newPreset = hienTai.preset || '25_5';

  if (action === 'start') {
    newTrangThai = 'running';
    // Nếu phiên trước đó đã đếm xong (0s), tự động bắt đầu lại từ đầu
    if (curRemaining <= 0) {
      newRemaining = newThoiLuong;
    }
  } else if (action === 'pause') {
    newTrangThai = 'paused';
    newRemaining = curRemaining;
  } else if (action === 'reset') {
    newTrangThai = 'paused';
    newRemaining = newThoiLuong;
  } else if (action === 'start_break') {
    newGiaiDoan = 'break';
    const cfg = PRESETS[newPreset] || PRESETS['25_5'];
    newThoiLuong = cfg.break;
    newRemaining = cfg.break;
    newTrangThai = 'running';
  } else if (action === 'start_focus') {
    newGiaiDoan = 'focus';
    const cfg = PRESETS[newPreset] || PRESETS['25_5'];
    newThoiLuong = cfg.focus;
    newRemaining = cfg.focus;
    newTrangThai = 'running';
  } else if (action === 'set_preset') {
    const pName = chuoi(than.preset, 10);
    if (!PRESETS[pName]) {
      return loi('Preset không hợp lệ (chỉ nhận: 25_5, 50_10).', 400);
    }
    newPreset = pName;
    const cfg = PRESETS[newPreset];
    newThoiLuong = newGiaiDoan === 'break' ? cfg.break : cfg.focus;
    newRemaining = newThoiLuong;
    newTrangThai = 'paused';
  }

  // Cập nhật với Optimistic Concurrency Control
  const kq = await db.prepare(
    `UPDATE phong_focus_state
        SET giai_doan = ?1,
            trang_thai = ?2,
            thoi_luong_giay = ?3,
            thoi_gian_con_lai_giay = ?4,
            preset = ?5,
            revision = revision + 1,
            cap_nhat_luc = CURRENT_TIMESTAMP,
            nguoi_cap_nhat_khoa = ?6,
            nguoi_cap_nhat_ten = ?7
      WHERE phong_id = ?8 AND revision = ?9`
  ).bind(newGiaiDoan, newTrangThai, newThoiLuong, newRemaining, newPreset, khoa, tenCua(phien), phongId, expectedRev).run();

  if (!kq.meta || kq.meta.changes === 0) {
    // Xung đột phiên bản! Trả về HTTP 409 kèm state mới nhất từ server
    const latest = await db.prepare(
      `SELECT phong_id AS phongId, giai_doan AS giaiDoan, trang_thai AS trangThai,
              thoi_luong_giay AS thoiLuongGiay, thoi_gian_con_lai_giay AS thoiGianConLaiGiay,
              preset, revision, cap_nhat_luc AS capNhatLuc,
              nguoi_cap_nhat_khoa AS nguoiCapNhatKhoa, nguoi_cap_nhat_ten AS nguoiCapNhatTen
         FROM phong_focus_state WHERE phong_id = ?1`
    ).bind(phongId).first();

    const latestNowMs = Date.now();
    let latestRem = Number(latest?.thoiGianConLaiGiay || 0);
    if (latest && latest.trangThai === 'running') {
      const upMs = new Date(String(latest.capNhatLuc).replace(' ', 'T') + (String(latest.capNhatLuc).includes('T') ? '' : 'Z')).getTime();
      latestRem = Math.max(0, latestRem - Math.max(0, Math.floor((latestNowMs - upMs) / 1000)));
    }

    const conflictState = latest ? {
      phase: latest.giaiDoan,
      status: latest.trangThai,
      giai_doan: latest.giaiDoan,
      trang_thai: latest.trangThai,
      giaiDoan: latest.giaiDoan,
      trangThai: latest.trangThai,
      running: latest.trangThai === 'running' && latestRem > 0,
      completed: latestRem === 0,
      remainingSeconds: latestRem,
      thoi_gian_con_lai_giay: latestRem,
      thoiGianConLaiGiay: latestRem,
      durationSeconds: Number(latest.thoiLuongGiay || 1500),
      thoi_luong_giay: Number(latest.thoiLuongGiay || 1500),
      thoiLuongGiay: Number(latest.thoiLuongGiay || 1500),
      preset: latest.preset || '25_5',
      revision: Number(latest.revision || 1),
      updatedAt: latest.capNhatLuc,
      serverNow: new Date(latestNowMs).toISOString(),
      updatedBy: latest.nguoiCapNhatTen || null
    } : null;

    return json({
      ok: false,
      conflict: true,
      loi: 'Xung đột phiên bản điều khiển — trạng thái đã được người khác cập nhật.',
      state: conflictState,
      serverState: conflictState
    }, 409);
  }

  const postSuccessState = {
    phase: newGiaiDoan,
    status: newTrangThai,
    giai_doan: newGiaiDoan,
    trang_thai: newTrangThai,
    giaiDoan: newGiaiDoan,
    trangThai: newTrangThai,
    running: newTrangThai === 'running' && newRemaining > 0,
    completed: newRemaining === 0,
    remainingSeconds: newRemaining,
    thoi_gian_con_lai_giay: newRemaining,
    thoiGianConLaiGiay: newRemaining,
    durationSeconds: newThoiLuong,
    thoi_luong_giay: newThoiLuong,
    thoiLuongGiay: newThoiLuong,
    preset: newPreset,
    revision: expectedRev + 1,
    updatedAt: new Date(nowMs).toISOString(),
    serverNow: new Date(nowMs).toISOString(),
    updatedBy: tenCua(phien)
  };

  return json({
    ok: true,
    state: postSuccessState
  });
});
