// API Đồng bộ phát video thời gian thực cho phòng Xem chung (Digital Campus - Phase 3C.1).
// Server-authoritative playback synchronization với optimistic concurrency control.
// Chỉ chủ phòng hoặc giáo viên mới có quyền điều khiển (play/pause/seek).
// Thành viên khác chỉ đọc và đồng bộ timeline theo máy chủ.
import { bocXuLy, docThan, json, loi, chuoi } from '../_lib/api.js';

const CAC_TOC_DO = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const CAC_HANH_DONG = ['play', 'pause', 'seek', 'set_rate'];

function khoaPhien(phien) {
  if (phien.role === 'teacher') return `gv:${phien.lopId || 1}`;
  if (phien.hocSinhId) return `hs:${phien.hocSinhId}`;
  return `phu:${phien.phuId || 0}`;
}
const tenCua = (phien) => phien.ten || phien.vaiTro || 'Thành viên';

async function damBaoBang(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS phong_dong_bo_video (
    phong_id            INTEGER PRIMARY KEY REFERENCES phong(id) ON DELETE CASCADE,
    trang_thai          TEXT NOT NULL DEFAULT 'paused',
    vi_tri_giay         REAL NOT NULL DEFAULT 0,
    toc_do              REAL NOT NULL DEFAULT 1.0,
    revision            INTEGER NOT NULL DEFAULT 1,
    cap_nhat_luc        TEXT DEFAULT CURRENT_TIMESTAMP,
    nguoi_cap_nhat_khoa TEXT,
    nguoi_cap_nhat_ten  TEXT
  )`).run().catch(() => {});
}

async function layPhongVaKiem(db, phongId, phien) {
  const p = await db.prepare(
    `SELECT id, loai, ten, mo_ta AS moTa, pham_vi AS phamVi, lop_id AS lopId,
            chu_phong_khoa AS chuPhongKhoa, chu_phong_ten AS chuPhongTen,
            cau_hinh AS cauHinh, trang_thai AS trangThai
       FROM phong WHERE id = ?1`
  ).bind(phongId).first();

  if (!p || p.trangThai !== 'mo') return { loi: 'Phòng không tồn tại hoặc đã đóng.', status: 404 };
  if (p.loai !== 'video') return { loi: 'Phòng này không phải phòng xem video.', status: 400 };

  // Phân quyền vào phòng: phòng trường mở cho mọi lớp; phòng lớp chỉ lớp mình hoặc GV
  if (p.phamVi !== 'truong' && phien.role !== 'teacher' && p.lopId !== phien.lopId) {
    return { loi: 'Phòng này chỉ dành cho lớp khác.', status: 403 };
  }

  return { phong: p };
}

function phanLoaiProvider(videoUrl) {
  const s = String(videoUrl || '').trim();
  if (/youtu\.be|youtube\.com/i.test(s)) return 'YOUTUBE';
  if (/drive\.google\.com/i.test(s)) return 'GOOGLE_DRIVE';
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(s)) return 'NATIVE_HTML5';
  return 'UNSUPPORTED';
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  await damBaoBang(db);
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const k = await layPhongVaKiem(db, phongId, phien);
  if (k.loi) return loi(k.loi, k.status);
  const p = k.phong;

  const khoa = khoaPhien(phien);
  const canControl = Boolean((p.chuPhongKhoa === khoa) || (phien.role === 'teacher'));

  let row = await db.prepare(
    `SELECT phong_id AS phongId, trang_thai AS trangThai, vi_tri_giay AS viTriGiay,
            toc_do AS tocDo, revision, cap_nhat_luc AS capNhatLuc,
            nguoi_cap_nhat_khoa AS nguoiCapNhatKhoa, nguoi_cap_nhat_ten AS nguoiCapNhatTen
       FROM phong_dong_bo_video WHERE phong_id = ?1`
  ).bind(phongId).first();

  // Khởi tạo dòng đồng bộ nếu chưa có
  if (!row) {
    await db.prepare(
      `INSERT INTO phong_dong_bo_video (phong_id, trang_thai, vi_tri_giay, toc_do, revision, cap_nhat_luc, nguoi_cap_nhat_khoa, nguoi_cap_nhat_ten)
       VALUES (?1, 'paused', 0, 1.0, 1, CURRENT_TIMESTAMP, ?2, ?3)`
    ).bind(phongId, khoa, tenCua(phien)).run().catch(() => {});

    row = await db.prepare(
      `SELECT phong_id AS phongId, trang_thai AS trangThai, vi_tri_giay AS viTriGiay,
              toc_do AS tocDo, revision, cap_nhat_luc AS capNhatLuc,
              nguoi_cap_nhat_khoa AS nguoiCapNhatKhoa, nguoi_cap_nhat_ten AS nguoiCapNhatTen
         FROM phong_dong_bo_video WHERE phong_id = ?1`
    ).bind(phongId).first();
  }

  let cauHinh = {};
  try { cauHinh = p.cauHinh ? JSON.parse(p.cauHinh) : {}; } catch { /* bỏ qua */ }
  const provider = phanLoaiProvider(cauHinh.videoUrl);

  const nowMs = Date.now();
  let viTriUocTinh = Number(row?.viTriGiay || 0);

  if (row && row.trangThai === 'playing') {
    const updateTimeMs = new Date(String(row.capNhatLuc).replace(' ', 'T') + (String(row.capNhatLuc).includes('T') ? '' : 'Z')).getTime();
    const elapsedSec = Math.max(0, (nowMs - updateTimeMs) / 1000);
    viTriUocTinh += elapsedSec * (row.tocDo || 1.0);
  }

  return json({
    ok: true,
    state: {
      playing: row?.trangThai === 'playing',
      positionSeconds: Math.max(0, Number(viTriUocTinh.toFixed(2))),
      basePositionSeconds: Number(row?.viTriGiay || 0),
      playbackRate: Number(row?.tocDo || 1.0),
      revision: Number(row?.revision || 1),
      updatedAt: row?.capNhatLuc || new Date().toISOString(),
      serverNow: new Date(nowMs).toISOString(),
      updatedBy: row?.nguoiCapNhatTen || null
    },
    canControl,
    provider,
    phong: {
      id: p.id,
      ten: p.ten,
      phamVi: p.phamVi,
      chuPhongKhoa: p.chuPhongKhoa,
      chuPhongTen: p.chuPhongTen,
      videoUrl: cauHinh.videoUrl || ''
    }
  });
});

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  await damBaoBang(db);
  const than = await docThan(request);
  const phongId = parseInt(than.phongId || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const k = await layPhongVaKiem(db, phongId, phien);
  if (k.loi) return loi(k.loi, k.status);
  const p = k.phong;

  const khoa = khoaPhien(phien);
  const canControl = Boolean((p.chuPhongKhoa === khoa) || (phien.role === 'teacher'));
  if (!canControl) {
    return loi('Bạn không có quyền điều khiển phát video trong phòng này (chỉ chủ phòng hoặc giáo viên).', 403);
  }

  const action = chuoi(than.action, 20);
  if (!CAC_HANH_DONG.includes(action)) {
    return loi('Hành động không hợp lệ (chỉ nhận play, pause, seek, set_rate).', 400);
  }

  const rawPos = Number(than.position);
  if (isNaN(rawPos) || !isFinite(rawPos) || rawPos < 0 || rawPos > 86400) {
    return loi('Vị trí video không hợp lệ (phải là số từ 0 đến 86400 giây).', 400);
  }
  const pos = Math.max(0, Number(rawPos.toFixed(2)));

  let rate = Number(than.playbackRate || 1.0);
  if (!CAC_TOC_DO.includes(rate)) {
    rate = 1.0;
  }

  const expectedRev = parseInt(than.expectedRevision || '0', 10);
  if (!(expectedRev >= 1)) {
    return loi('Thiếu hoặc sai số revision kỳ vọng.', 400);
  }

  // Lấy trạng thái hiện tại
  let hienTai = await db.prepare(
    `SELECT phong_id AS phongId, trang_thai AS trangThai, vi_tri_giay AS viTriGiay,
            toc_do AS tocDo, revision, cap_nhat_luc AS capNhatLuc
       FROM phong_dong_bo_video WHERE phong_id = ?1`
  ).bind(phongId).first();

  if (!hienTai) {
    // Khởi tạo trước nếu chưa có
    await db.prepare(
      `INSERT INTO phong_dong_bo_video (phong_id, trang_thai, vi_tri_giay, toc_do, revision, cap_nhat_luc, nguoi_cap_nhat_khoa, nguoi_cap_nhat_ten)
       VALUES (?1, 'paused', 0, 1.0, 1, CURRENT_TIMESTAMP, ?2, ?3)`
    ).bind(phongId, khoa, tenCua(phien)).run().catch(() => {});
    hienTai = await db.prepare(
      `SELECT phong_id AS phongId, trang_thai AS trangThai, vi_tri_giay AS viTriGiay,
              toc_do AS tocDo, revision, cap_nhat_luc AS capNhatLuc
         FROM phong_dong_bo_video WHERE phong_id = ?1`
    ).bind(phongId).first();
  }

  // Xác định trạng thái mới
  let trangThaiMoi = hienTai.trangThai;
  if (action === 'play') trangThaiMoi = 'playing';
  else if (action === 'pause') trangThaiMoi = 'paused';
  // với 'seek' hoặc 'set_rate', giữ nguyên trạng thái đang play hay pause

  // Thực hiện cập nhật với Optimistic Concurrency Control
  const kq = await db.prepare(
    `UPDATE phong_dong_bo_video
        SET trang_thai = ?1,
            vi_tri_giay = ?2,
            toc_do = ?3,
            revision = revision + 1,
            cap_nhat_luc = CURRENT_TIMESTAMP,
            nguoi_cap_nhat_khoa = ?4,
            nguoi_cap_nhat_ten = ?5
      WHERE phong_id = ?6 AND revision = ?7`
  ).bind(trangThaiMoi, pos, rate, khoa, tenCua(phien), phongId, expectedRev).run();

  if (!kq.meta || kq.meta.changes === 0) {
    // Xung đột phiên bản! Lấy trạng thái mới nhất từ server trả về để client hòa giải
    const moiNhat = await db.prepare(
      `SELECT phong_id AS phongId, trang_thai AS trangThai, vi_tri_giay AS viTriGiay,
              toc_do AS tocDo, revision, cap_nhat_luc AS capNhatLuc,
              nguoi_cap_nhat_khoa AS nguoiCapNhatKhoa, nguoi_cap_nhat_ten AS nguoiCapNhatTen
         FROM phong_dong_bo_video WHERE phong_id = ?1`
    ).bind(phongId).first();

    const nowMs = Date.now();
    let viTriUocTinh = Number(moiNhat?.viTriGiay || 0);
    if (moiNhat && moiNhat.trangThai === 'playing') {
      const updateTimeMs = new Date(String(moiNhat.capNhatLuc).replace(' ', 'T') + (String(moiNhat.capNhatLuc).includes('T') ? '' : 'Z')).getTime();
      const elapsedSec = Math.max(0, (nowMs - updateTimeMs) / 1000);
      viTriUocTinh += elapsedSec * (moiNhat.tocDo || 1.0);
    }

    return json({
      ok: false,
      conflict: true,
      loi: 'Lệnh điều khiển bị xung đột do có thay đổi mới hơn.',
      state: {
        playing: moiNhat?.trangThai === 'playing',
        positionSeconds: Math.max(0, Number(viTriUocTinh.toFixed(2))),
        basePositionSeconds: Number(moiNhat?.viTriGiay || 0),
        playbackRate: Number(moiNhat?.tocDo || 1.0),
        revision: Number(moiNhat?.revision || 1),
        updatedAt: moiNhat?.capNhatLuc || new Date().toISOString(),
        serverNow: new Date(nowMs).toISOString(),
        updatedBy: moiNhat?.nguoiCapNhatTen || null
      }
    }, 409);
  }

  const nowMs = Date.now();
  return json({
    ok: true,
    state: {
      playing: trangThaiMoi === 'playing',
      positionSeconds: pos,
      basePositionSeconds: pos,
      playbackRate: rate,
      revision: expectedRev + 1,
      updatedAt: new Date(nowMs).toISOString(),
      serverNow: new Date(nowMs).toISOString(),
      updatedBy: tenCua(phien)
    },
    canControl: true
  });
});
