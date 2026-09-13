// functions/_lib/rooms.js
// Quản trị kiểm tra quyền truy cập và rào chắn phòng (Room Admission & Scope Security)
import { actorKey } from './auth.js';
import { layPhamViQuanTri } from './quan-tri.js';

// NHIP_HOAT_DONG ('-90 seconds'): cửa sổ "đang online NGAY" — CHỈ dùng cho chỉ báo presence
// (đếm người hoạt động toàn campus). TUYỆT ĐỐI không dùng cho membership/capacity/admission.
//
// NHIP_HIEU_LUC ('-15 minutes'): LEASE THÀNH VIÊN DUY NHẤT — một cửa sổ cho mọi ngữ nghĩa
// "đang là thành viên phòng": đếm sức chứa (soNguoi), isAdmitted, vai trò co-host,
// danh sách thành viên, và bypass mật khẩu khi rejoin. Row còn trong lease = chiếm chỗ
// VÀ được admit; hết lease = đã rời (không chiếm chỗ, không admit — phải 'vao' lại qua
// kiểm tra sức chứa). Frontend heartbeat 20s; tab ẩn bị trình duyệt throttle nên lease
// phải đủ dài để không đá người dùng oan, nhưng ngắn hơn thời gian cleanup chạy định kỳ.
export const NHIP_HOAT_DONG = '-90 seconds';
export const NHIP_HIEU_LUC = '-15 minutes';

// ─── STUDY ROOM GOVERNANCE (Phase 4G) ────────────────────────────────────────
// Sức chứa Study Room (loai='video'): mặc định 8, cứng tối đa 12 (v1).
// Phòng loại khác giữ nguyên giới hạn generic 2..50 / mặc định 20.
export const STUDY_CAP = { MIN: 2, DEFAULT: 8, MAX: 12 };
export const PHONG_CAP = { MIN: 2, DEFAULT: 20, MAX: 50 };

export const CAPABILITY = {
  VIDEO_CONTROL: 'video_control',
  VIDEO_CHANGE: 'video_change',
  QUEUE: 'queue',
  CHAT: 'chat',
  NOTES: 'notes',
  WHITEBOARD: 'whiteboard',
  SHEET: 'sheet',
  VOICE: 'voice',
  INVITE: 'invite',
  MODERATION: 'moderation',
};

export const ACCESS_MODES = ['staff_only', 'selected_members', 'everyone'];

// Chính sách mặc định khi Study Room mới tạo — theo mô hình đã chốt:
// điều khiển video/đổi video/queue: staff_only; chat/notes/whiteboard/sheet/invite: everyone;
// voice: selected_members (request → staff duyệt); moderation: luôn staff.
export const DEFAULT_STUDY_POLICY = {
  video_control: { enabled: 1, access_mode: 'staff_only' },
  video_change:  { enabled: 1, access_mode: 'staff_only' },
  queue:         { enabled: 1, access_mode: 'staff_only' },
  chat:          { enabled: 1, access_mode: 'everyone' },
  notes:         { enabled: 1, access_mode: 'everyone' },
  whiteboard:    { enabled: 1, access_mode: 'everyone' },
  sheet:         { enabled: 1, access_mode: 'everyone' },
  voice:         { enabled: 1, access_mode: 'selected_members' },
  invite:        { enabled: 1, access_mode: 'everyone' },
  moderation:    { enabled: 1, access_mode: 'staff_only' },
};

// Capability không bao giờ mở cho member: moderation luôn staff_only.
export const STAFF_LOCKED_CAPS = ['moderation'];

// Seed chính sách mặc định cho Study Room mới tạo. KHÔNG nuốt lỗi — nếu seed thất bại,
// caller phải đóng/huỷ phòng (governance chưa được khởi tạo thì phòng chưa an toàn).
export async function seedChinhSachPhong(db, phongId) {
  const stmts = Object.entries(DEFAULT_STUDY_POLICY).map(([cap, pol]) =>
    db.prepare(
      `INSERT OR IGNORE INTO phong_policy (phong_id, capability, enabled, access_mode) VALUES (?1, ?2, ?3, ?4)`
    ).bind(phongId, cap, pol.enabled, pol.access_mode)
  );
  await db.batch(stmts);
}

// Đọc 1 policy. Phân biệt rõ 2 trường hợp:
// - KHÔNG có row trong DB → dùng mặc định (phòng cũ chưa seed).
// - Query D1 THẤT BẠI → trả { fail:true } — fail-closed, KHÔNG coi như "mặc định enabled".
export async function taiChinhSach(db, phongId, capability) {
  let row;
  try {
    row = await db.prepare(
      `SELECT enabled, access_mode AS accessMode FROM phong_policy WHERE phong_id = ?1 AND capability = ?2`
    ).bind(phongId, capability).first();
  } catch (e) {
    console.error('taiChinhSach loi D1:', e);
    return { fail: true };
  }
  const macDinh = DEFAULT_STUDY_POLICY[capability] || { enabled: 1, access_mode: 'staff_only' };
  if (!row) return { ...macDinh };
  // STAFF_LOCKED_CAPS không bao giờ được mở rộng quá staff_only.
  if (STAFF_LOCKED_CAPS.includes(capability) && row.accessMode !== 'staff_only') {
    return { enabled: row.enabled, access_mode: 'staff_only' };
  }
  return { enabled: row.enabled, access_mode: row.accessMode };
}

// Toàn bộ policy của phòng (cho staff UI + tính myCaps). Trả null nếu query D1 lỗi —
// caller phải coi như "policy không khả dụng", KHÔNG dùng mặc định fail-open.
export async function taiToanBoChinhSach(db, phongId) {
  let rs;
  try {
    rs = await db.prepare(
      `SELECT capability, enabled, access_mode AS accessMode FROM phong_policy WHERE phong_id = ?1`
    ).bind(phongId).all();
  } catch (e) {
    console.error('taiToanBoChinhSach loi D1:', e);
    return null;
  }
  const map = {};
  for (const [cap, macDinh] of Object.entries(DEFAULT_STUDY_POLICY)) map[cap] = { ...macDinh };
  for (const r of rs.results || []) {
    map[r.capability] = { enabled: r.enabled, access_mode: r.accessMode };
  }
  for (const cap of STAFF_LOCKED_CAPS) {
    if (map[cap]) map[cap].access_mode = 'staff_only';
  }
  return map;
}

// Kiểm tra quyền capability server-authoritative.
// check = kết quả kiemTraTruyCapPhong (đã có isHost/isTeacher/isCoHost/actorKey).
// Trả { ok:true } hoặc { ok:false, loi, status, code }.
// policyDaTai (optional): policy đã tải sẵn từ nơi khác (vd taiChinhSach gọi trước đó trong cùng
// request) — truyền vào để khỏi query D1 lại lần 2 y hệt. Không truyền thì tự tải như cũ.
export async function kiemTraQuyenPhong(db, check, capability, policyDaTai = null) {
  const p = check.phong;
  if (check.isHost || check.isTeacher || check.isCoHost) return { ok: true };

  const pol = policyDaTai || await taiChinhSach(db, p.id, capability);
  if (pol.fail) {
    // D1 lỗi khi đọc policy → fail-closed: không cho member dùng capability lúc không xác định policy.
    return { ok: false, loi: 'Chính sách phòng tạm không khả dụng — thử lại sau.', status: 503, code: 'policy_unavailable' };
  }
  if (!pol.enabled) {
    return { ok: false, loi: 'Tính năng này đang bị quản trị phòng tắt.', status: 403, code: 'capability_off' };
  }
  if (pol.access_mode === 'everyone') return { ok: true };
  if (pol.access_mode === 'staff_only') {
    return { ok: false, loi: 'Chỉ quản trị phòng mới dùng được tính năng này.', status: 403, code: 'staff_only' };
  }
  // selected_members: cần grant 'granted'
  const g = await db.prepare(
    `SELECT 1 FROM phong_grant WHERE phong_id = ?1 AND khoa = ?2 AND capability = ?3 AND trang_thai = 'granted'`
  ).bind(p.id, check.actorKey, capability).first().catch(() => null);
  if (g) return { ok: true };
  return { ok: false, loi: 'Cần được quản trị phòng cấp quyền cho tính năng này.', status: 403, code: 'grant_required' };
}

// Tính map capability → boolean cho 1 actor (để client render UI đúng quyền). Trước đây lặp
// kiemTraQuyenPhong() riêng cho từng capability (tới 10 query/request) — giờ tải 1 lần TOÀN BỘ
// policy (taiToanBoChinhSach, đã dùng sẵn cho staff) + TOÀN BỘ grant của actor này, rồi tính
// trong JS. Giữ đúng ngữ nghĩa fail-closed: D1 lỗi (policies === null) → mọi quyền = false,
// khớp nhánh pol.fail của kiemTraQuyenPhong ở trên.
export async function taiQuyenCuaToi(db, check) {
  const caps = {};
  if (check.isHost || check.isTeacher || check.isCoHost) {
    for (const cap of Object.keys(DEFAULT_STUDY_POLICY)) caps[cap] = true;
    return caps;
  }

  const [policies, myGrantsRs] = await Promise.all([
    taiToanBoChinhSach(db, check.phong.id),
    db.prepare(
      `SELECT capability FROM phong_grant WHERE phong_id = ?1 AND khoa = ?2 AND trang_thai = 'granted'`
    ).bind(check.phong.id, check.actorKey).all().catch(() => ({ results: [] })),
  ]);
  const grantedSet = new Set((myGrantsRs.results || []).map((r) => r.capability));

  for (const cap of Object.keys(DEFAULT_STUDY_POLICY)) {
    if (!policies) { caps[cap] = false; continue; }
    const pol = policies[cap];
    caps[cap] = Boolean(pol.enabled) && (pol.access_mode === 'everyone' || (pol.access_mode === 'selected_members' && grantedSet.has(cap)));
  }
  return caps;
}

// Làm sạch đối tượng phòng trước khi gửi về client:
// - Luôn xóa matKhauHash, matKhauSalt, chuPhongKhoa
// - Nếu phòng có mật khẩu và người dùng CHƯA được duyệt vào phòng (chưa nhập pass / không phải host/GV):
//   ẩn toàn bộ cauHinh (videoUrl, nhacUrl) và các thông tin nội bộ.
export function lamSachPhong(p, { isAdmitted = true, canControl = false, isHost = false } = {}) {
  if (!p) return null;
  const clone = { ...p };
  delete clone.matKhauHash;
  delete clone.matKhauSalt;
  delete clone.mat_khau_hash;
  delete clone.mat_khau_salt;
  delete clone.chuPhongKhoa;
  delete clone.chu_phong_khoa;

  clone.access_mode = clone.accessMode || clone.access_mode || 'public';
  clone.accessMode = clone.access_mode;
  clone.canControl = Boolean(canControl);
  // laChuPhong = đúng chủ phòng (isHost), KHÔNG phải "có quyền điều khiển" —
  // Teacher/Admin có canControl nhưng không phải chủ phòng.
  clone.laChuPhong = Boolean(isHost);

  const soNguoi = clone.soNguoi || 0;
  const sucChua = clone.sucChua || 20;
  if (clone.loai === 'game') {
    clone.trangThaiChiTiet = clone.trangThai === 'mo' ? (soNguoi >= sucChua ? 'dang_choi' : 'cho_nguoi') : clone.trangThai;
  } else {
    clone.trangThaiChiTiet = soNguoi >= sucChua ? 'full' : (soNguoi > 1 ? 'active' : 'waiting');
  }

  // Rào chắn bảo mật cho phòng khoá mật khẩu
  if (clone.accessMode === 'password' && !isAdmitted && !canControl) {
    clone.cauHinh = null;
    clone.cau_hinh = null;
    delete clone.videoUrl;
    delete clone.nhacUrl;
    clone.admissionRequired = true;
  }

  return clone;
}

// Kiểm tra quyền truy cập phòng tập trung cho toàn bộ API (phong, phong-chat, phong-watch, phong-focus)
export async function kiemTraTruyCapPhong(db, phongId, phien, {
  loai = null,
  requireAdmitted = false,
  requireHostOrTeacher = false,
} = {}) {
  const id = parseInt(phongId || '', 10);
  if (!(id > 0)) return { loi: 'Thiếu mã phòng.', status: 400 };

  const p = await db.prepare(`
    SELECT p.id, p.loai, p.ten, p.mo_ta AS moTa, p.pham_vi AS phamVi, p.lop_id AS lopId,
           p.chu_phong_khoa AS chuPhongKhoa, p.chu_phong_ten AS chuPhongTen,
           p.cau_hinh AS cauHinh, p.trang_thai AS trangThai, p.tao_luc AS taoLuc,
           p.access_mode AS accessMode, p.mat_khau_hash AS matKhauHash, p.mat_khau_salt AS matKhauSalt,
           p.suc_chua AS sucChua,
           l.ten AS lopTen,
           (SELECT COUNT(*) FROM phong_thanh_vien v
             WHERE v.phong_id = p.id AND datetime(v.hoat_dong_luc) > datetime('now', ?2)) AS soNguoi
      FROM phong p LEFT JOIN lop l ON l.id = p.lop_id
     WHERE p.id = ?1
  `).bind(id, NHIP_HIEU_LUC).first();

  if (!p || p.trangThai !== 'mo') {
    return { loi: 'Phòng không tồn tại hoặc đã đóng.', status: 404 };
  }

  if (loai && p.loai !== loai) {
    return { loi: `Phòng này không phải phòng ${loai}.`, status: 400 };
  }

  // 2. Xác định định danh phiên chuẩn tắc + thẩm quyền Teacher THEO PHẠM VI QUẢN TRỊ
  //    (quan-tri.js — nguồn quyền chuẩn của hệ thống):
  //    - School Admin (la_admin_truong/vai_tro admin trên tai_khoan_campus): thẩm quyền toàn trường.
  //    - GVCN: staff trong phòng thuộc lớp được gán + phòng pham_vi='truong' (không gian chung).
  //    - GVCN KHÔNG tự động là staff/phá vỡ boundary của phòng lớp ngoài phạm vi.
  const actor = actorKey(phien);
  const isHost = Boolean(p.chuPhongKhoa && p.chuPhongKhoa === actor);
  // Phiên accountId qua middleware sẽ mang role='admin' cho School Admin (vai_tro trên
  // tai_khoan_campus) — cả 'teacher' lẫn 'admin' đều đi qua layPhamViQuanTri để xác định
  // thẩm quyền THẬT, không suy ra quyền từ chuỗi role.
  let isTeacher = false;
  if (!isHost && (phien.role === 'teacher' || phien.role === 'admin')) {
    const pham = await layPhamViQuanTri({ DB: db }, phien);
    isTeacher = Boolean(
      pham.isSchoolAdmin
      || p.phamVi === 'truong'
      || (p.lopId && (pham.lopIds || []).includes(p.lopId))
    );
  }

  // 1. Kiểm tra phạm vi lớp (Class Scope Boundary) — KHÔNG ngoại lệ cho GVCN ngoài phạm vi;
  //    chỉ Teacher CÓ thẩm quyền với lớp này (đã xác định ở trên) mới được qua.
  if (p.phamVi !== 'truong' && !isTeacher) {
    if (!phien.lopId || p.lopId !== phien.lopId) {
      return { loi: 'Phòng này chỉ dành cho lớp ' + (p.lopTen || 'khác') + '.', status: 403 };
    }
  }

  // Vai trò trong phòng: host/teacher suy ra từ phiên + chủ phòng; co_host lưu trong bản ghi thành viên.
  // Bản ghi chỉ còn hiệu lực khi heartbeat tươi (NHIP_HIEU_LUC) — hết hạn thì coi như đã rời phòng.
  const tvRow = await db.prepare(
    `SELECT vai_tro_phong AS vaiTroPhong FROM phong_thanh_vien
      WHERE phong_id = ?1 AND khoa = ?2 AND datetime(hoat_dong_luc) > datetime('now', ?3)`
  ).bind(p.id, actor, NHIP_HIEU_LUC).first().catch(() => null);
  const isCoHost = !isHost && !isTeacher && tvRow?.vaiTroPhong === 'co_host';
  const vaiTroPhong = isHost ? 'host' : isTeacher ? 'teacher' : isCoHost ? 'co_host' : 'member';

  // canControl: quyền cao nhất (đóng phòng, đổi mật khẩu, hành động chỉ host/GV).
  // isStaff: quản trị phòng gồm cả co_host (điều hành cộng tác, kick member, set policy...).
  const canControl = isHost || isTeacher;
  const isStaff = canControl || isCoHost;

  // 2b. Bị ban trong phòng này → chặn mọi truy cập tài nguyên (host/GV không thể bị ban).
  if (!canControl) {
    const biBan = await db.prepare(
      `SELECT 1 FROM phong_ban WHERE phong_id = ?1 AND khoa = ?2`
    ).bind(p.id, actor).first().catch(() => null);
    if (biBan) return { loi: 'Bạn đã bị quản trị phòng chặn khỏi phòng này.', status: 403, code: 'room_banned' };
  }

  // 3. Participant boundary — TÁCH preview khỏi admitted:
  //    - Staff (host/teacher trong phạm vi/co_host): quản trị không cần member row.
  //    - SẢNH CHAT HỆ THỐNG duy nhất (migration 61: chu_phong_khoa='he-thong' + loai='chat'
  //      + pham_vi='truong'): mở cho mọi tài khoản đăng nhập — không ai "join" sảnh,
  //      membership không áp dụng. Ngoại lệ này KHÔNG lan sang loại phòng khác:
  //      phòng video/nhạc do 'he-thong' sở hữu vẫn bắt buộc member row như phòng thường.
  //    - Mọi trường hợp còn lại (kể cả phòng PUBLIC): BẮT BUỘC member row còn hạn trong
  //      phong_thanh_vien — được tạo bởi hanhDong 'vao' (atomic capacity) hoặc 'nhip'.
  //      Public chỉ nới PHẠM VI được tham gia, không tự động admit.
  const laPhongHeThong = p.chuPhongKhoa === 'he-thong' && p.loai === 'chat' && p.phamVi === 'truong';
  const isAdmitted = isStaff || laPhongHeThong || Boolean(tvRow);

  // 4. Kiểm tra yêu cầu quyền điều khiển (Host / Teacher)
  if (requireHostOrTeacher && !canControl) {
    return { loi: 'Chỉ chủ phòng hoặc giáo viên mới có quyền thực hiện.', status: 403 };
  }

  // 5. Rào chắn participant cho các tài nguyên bên trong (Chat, Video, Collab, Queue, Focus):
  //    chưa join (hoặc chưa nhập mật khẩu với phòng password) → không chạm tài nguyên trong phòng.
  if (requireAdmitted && !isAdmitted) {
    return { loi: 'Cần vào phòng trước khi truy cập tài nguyên này.', status: 403, code: 'admission_required' };
  }

  return {
    phong: p,
    isHost,
    isTeacher,
    isCoHost,
    isStaff,
    vaiTroPhong,
    canControl,
    isAdmitted,
    actorKey: actor,
  };
}
