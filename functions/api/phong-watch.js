// API Đồng bộ phát video thời gian thực cho phòng Xem chung (Digital Campus - Phase 3C.1 Hardening).
// Server-authoritative playback synchronization với optimistic concurrency control.
// Chỉ chủ phòng hoặc giáo viên mới có quyền điều khiển (play/pause/seek/set_rate).
// Thành viên khác chỉ đọc và đồng bộ timeline theo máy chủ.
import { bocXuLy, docThan, json, loi, chuoi, chuanUrlMedia } from '../_lib/api.js';
import { kiemTraTruyCapPhong, kiemTraQuyenPhong, taiQuyenCuaToi, CAPABILITY } from '../_lib/rooms.js';

const CAC_TOC_DO = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const CAC_HANH_DONG = ['play', 'pause', 'seek', 'set_rate', 'set_video'];

const tenCua = (phien) => phien.ten || phien.vaiTro || 'Thành viên';

function phanLoaiProvider(videoUrl) {
  const s = String(videoUrl || '').trim();
  if (/youtu\.be|youtube\.com/i.test(s)) return 'YOUTUBE';
  if (/drive\.google\.com/i.test(s)) return 'GOOGLE_DRIVE';
  // Chỉ coi là Native HTML5 với định dạng chuẩn tương thích phổ quát trình duyệt web
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(s)) return 'NATIVE_HTML5';
  return 'UNSUPPORTED';
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const check = await kiemTraTruyCapPhong(db, phongId, phien, { loai: 'video', requireAdmitted: true });
  if (check.loi) return loi(check.loi, check.status || 403, check.code ? { code: check.code } : null);
  const p = check.phong;
  // canControl = quyền điều khiển video theo capability (staff hoặc member được cấp).
  const canControl = (await kiemTraQuyenPhong(db, check, CAPABILITY.VIDEO_CONTROL)).ok;

  let row = await db.prepare(
    `SELECT phong_id AS phongId, trang_thai AS trangThai, vi_tri_giay AS viTriGiay,
            toc_do AS tocDo, revision, cap_nhat_luc AS capNhatLuc,
            nguoi_cap_nhat_khoa AS nguoiCapNhatKhoa, nguoi_cap_nhat_ten AS nguoiCapNhatTen
       FROM phong_dong_bo_video WHERE phong_id = ?1`
  ).bind(phongId).first();

  // Khởi tạo dòng đồng bộ nếu chưa có (với người cập nhật là NULL để không ghi nhận viewer sai lệch)
  if (!row) {
    await db.prepare(
      `INSERT INTO phong_dong_bo_video (phong_id, trang_thai, vi_tri_giay, toc_do, revision, cap_nhat_luc, nguoi_cap_nhat_khoa, nguoi_cap_nhat_ten)
       VALUES (?1, 'paused', 0, 1.0, 1, CURRENT_TIMESTAMP, NULL, NULL)`
    ).bind(phongId).run().catch(() => {});

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
    caps: await taiQuyenCuaToi(db, check),
    provider,
    phong: {
      id: p.id,
      ten: p.ten,
      phamVi: p.phamVi,
      chuPhongTen: p.chuPhongTen,
      videoUrl: cauHinh.videoUrl || ''
    }
  });
});

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const than = await docThan(request);
  const phongId = parseInt(than.phongId || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const check = await kiemTraTruyCapPhong(db, phongId, phien, { loai: 'video', requireAdmitted: true });
  if (check.loi) return loi(check.loi, check.status || 403, check.code ? { code: check.code } : null);
  const khoa = check.actorKey;

  const action = chuoi(than.action, 20);
  if (!CAC_HANH_DONG.includes(action)) {
    return loi('Hành động không hợp lệ (chỉ nhận play, pause, seek, set_rate, set_video).', 400);
  }

  // Capability server-authoritative: play/pause/seek/set_rate → video_control; set_video → video_change.
  const capCan = action === 'set_video' ? CAPABILITY.VIDEO_CHANGE : CAPABILITY.VIDEO_CONTROL;
  const quyen = await kiemTraQuyenPhong(db, check, capCan);
  if (!quyen.ok) return json({ ok: false, loi: quyen.loi, code: quyen.code }, quyen.status);

  // ── ĐỔI VIDEO (set_video): cập nhật cau_hinh.videoUrl + reset dòng đồng bộ ──
  if (action === 'set_video') {
    const u = chuanUrlMedia(than.videoUrl || than.url);
    if (u === false) return loi('Link video không hợp lệ — chỉ nhận link https:// (YouTube, Drive, mp4...).');
    if (!u) return loi('Thiếu link video mới.', 400);

    let cauHinh = {};
    try { cauHinh = check.phong.cauHinh ? JSON.parse(check.phong.cauHinh) : {}; } catch { /* bỏ qua */ }
    cauHinh.videoUrl = u;
    // cau_hinh + dòng đồng bộ phải cùng commit (batch nguyên tử) — không nuốt lỗi:
    // lỗi giữa chừng sẽ để state lệch video, lúc đó trả 500 chứ không giả vờ thành công.
    const qid = parseInt(than.queueId || '0', 10);
    const stmts = [
      db.prepare(
        `UPDATE phong SET cau_hinh = ?1, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?2`
      ).bind(JSON.stringify(cauHinh), phongId),
      db.prepare(
        `INSERT INTO phong_dong_bo_video (phong_id, trang_thai, vi_tri_giay, toc_do, revision, cap_nhat_luc, nguoi_cap_nhat_khoa, nguoi_cap_nhat_ten)
         VALUES (?1, 'paused', 0, 1.0, 1, CURRENT_TIMESTAMP, ?2, ?3)
         ON CONFLICT(phong_id) DO UPDATE SET
           trang_thai = 'paused', vi_tri_giay = 0, toc_do = 1.0,
           revision = revision + 1, cap_nhat_luc = CURRENT_TIMESTAMP,
           nguoi_cap_nhat_khoa = ?2, nguoi_cap_nhat_ten = ?3`
      ).bind(phongId, khoa, tenCua(phien)),
    ];
    if (qid > 0) {
      // Đổi theo mục queue: dọn 'playing' cũ + gắn 'playing' cho item trong cùng batch.
      stmts.push(
        db.prepare(
          `UPDATE phong_video_queue SET trang_thai = 'played' WHERE phong_id = ?1 AND trang_thai = 'playing'`
        ).bind(phongId),
        db.prepare(
          `UPDATE phong_video_queue SET trang_thai = 'playing' WHERE id = ?1 AND phong_id = ?2 AND trang_thai = 'queued'`
        ).bind(qid, phongId)
      );
    }
    await db.batch(stmts);
    return json({ ok: true, videoUrl: u });
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

  let rate = Number(hienTai.tocDo || 1.0);
  let targetPos = Number(hienTai.viTriGiay || 0);
  let trangThaiMoi = hienTai.trangThai;

  if (action === 'set_rate') {
    // Với set_rate: playbackRate là bắt buộc và phải nằm trong whitelist
    const rawRate = Number(than.playbackRate);
    if (typeof than.playbackRate === 'undefined' || isNaN(rawRate) || !CAC_TOC_DO.includes(rawRate)) {
      return loi('Tốc độ phát không hợp lệ (chỉ chấp nhận: 0.5, 0.75, 1.0, 1.25, 1.5, 2.0).', 400);
    }
    rate = rawRate;

    // Giữ liên tục dòng thời gian khi đang play: tính vị trí hiện tại của server trước khi áp dụng rate mới
    if (hienTai.trangThai === 'playing') {
      const updateTimeMs = new Date(String(hienTai.capNhatLuc).replace(' ', 'T') + (String(hienTai.capNhatLuc).includes('T') ? '' : 'Z')).getTime();
      const elapsedSec = Math.max(0, (Date.now() - updateTimeMs) / 1000);
      targetPos = Math.max(0, Number((hienTai.viTriGiay + elapsedSec * (hienTai.tocDo || 1.0)).toFixed(2)));
    } else if (typeof than.position !== 'undefined' && !isNaN(Number(than.position)) && Number(than.position) >= 0) {
      targetPos = Math.max(0, Number(Number(than.position).toFixed(2)));
    }
  } else {
    // Với play, pause, seek: vị trí là bắt buộc và rate được bảo toàn từ trạng thái hiện tại
    const rawPos = Number(than.position);
    if (isNaN(rawPos) || !isFinite(rawPos) || rawPos < 0 || rawPos > 86400) {
      return loi('Vị trí video không hợp lệ (phải là số từ 0 đến 86400 giây).', 400);
    }
    targetPos = Math.max(0, Number(rawPos.toFixed(2)));

    if (action === 'play') trangThaiMoi = 'playing';
    else if (action === 'pause') trangThaiMoi = 'paused';
    // với 'seek', giữ nguyên trạng thái playing hay paused
  }

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
  ).bind(trangThaiMoi, targetPos, rate, khoa, tenCua(phien), phongId, expectedRev).run();

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
      positionSeconds: targetPos,
      basePositionSeconds: targetPos,
      playbackRate: rate,
      revision: expectedRev + 1,
      updatedAt: new Date(nowMs).toISOString(),
      serverNow: new Date(nowMs).toISOString(),
      updatedBy: tenCua(phien)
    },
    canControl: true
  });
});
