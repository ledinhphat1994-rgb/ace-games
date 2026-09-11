// ==============================================================================
// cong-cu/qa-arena-concurrency.mjs
// BỘ KIỂM THỬ ĐỐI KHÁNG & ĐỒNG THỜI CHO CAMPUS GAME ARENA (PHASE 3B.1)
// ==============================================================================
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

let pass = 0, fail = 0;

function ok(ten, dk, chiTiet = '') {
  if (dk) {
    pass++;
    console.log(`  ✅ ${ten}`);
  } else {
    fail++;
    console.log(`  ❌ ${ten} ${chiTiet}`);
  }
}

async function taoAuthCookie(user) {
  const token = await createToken(devSessionSecret, user, 3600);
  return `${COOKIE_NAME}=${token}`;
}

async function api(path, { method = 'GET', body = null, cookie = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

console.log('================================================================');
console.log('CHẠY BỘ KIỂM THỬ ĐỐI KHÁNG & ĐỒNG THỜI PHASE 3B.1 GAME ARENA');
console.log(`Target: ${BASE}`);
console.log('================================================================\n');

// Danh tính học sinh giả lập hợp lệ
const HS_A = { hocSinhId: 1, lopId: 1, role: 'student', ten: 'Học sinh 10A7-A' };
const HS_B = { hocSinhId: 2, lopId: 1, role: 'student', ten: 'Học sinh 10A7-B' };
const HS_C = { hocSinhId: 39, lopId: 2, role: 'student', ten: 'Học sinh 11A1-C' }; // Khác lớp!
const GV = { role: 'teacher', ten: 'Giáo viên Chủ nhiệm' };

const cookieA = await taoAuthCookie(HS_A);
const cookieB = await taoAuthCookie(HS_B);
const cookieC = await taoAuthCookie(HS_C);
const cookieGV = await taoAuthCookie(GV);

// ─────────────────────────────────────────────────────────────────────────────
// 0. KIỂM THỬ ĐẶC TẢ SCHEMA & TRƯỜNG DỮ LIỆU DB (PHASE 3B.1)
// ─────────────────────────────────────────────────────────────────────────────
console.log('== 0. Database Schema & Field Invariants ==');
const resCheck = await api('/api/game', {
  method: 'POST',
  cookie: cookieA,
  body: { hanhDong: 'tao_ban', phamVi: 'truong', tenBan: 'Check Schema Fields' }
});
ok('DB Invariant: cột pham_vi tồn tại và trả về đúng (truong)', resCheck.data?.phong?.phamVi === 'truong');
ok('DB Invariant: cột kieu_ghep tồn tại và mặc định đúng (thu_cong)', resCheck.data?.phong?.kieuGhep === 'thu_cong');
if (resCheck.data?.phong?.id) {
  await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'roi_ban', phongId: resCheck.data.phong.id } });
}

// ─────────────────────────────────────────────────────────────────────────────
// K. GUEST CHẶN TRUY CẬP
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== K. Guest Access Protections ==');
const guestGet = await api('/api/game');
ok('K.1 Guest không thể GET /api/game (401)', guestGet.status === 401);

const guestGetArena = await api('/api/game?phamVi=truong');
ok('K.2 Guest không thể xem Sảnh Toàn trường /api/game?phamVi=truong (401/403)', guestGetArena.status === 401 || guestGetArena.status === 403);

const guestQuick = await api('/api/game', { method: 'POST', body: { hanhDong: 'tim_tran_nhanh' } });
ok('K.3 Guest không thể Ghép trận nhanh (401)', guestQuick.status === 401);

const guestCreate = await api('/api/game', { method: 'POST', body: { hanhDong: 'tao_ban', phamVi: 'truong' } });
ok('K.4 Guest không thể Tạo bàn (401)', guestCreate.status === 401);

// ─────────────────────────────────────────────────────────────────────────────
// F & G. CLASS BOUNDARY vs SCHOOL-WIDE ACCESS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== F & G. Class Boundary vs School Access ==');
// A (Lớp 1) tạo bàn pham_vi='lop'
const resLopA = await api('/api/game', {
  method: 'POST',
  cookie: cookieA,
  body: { hanhDong: 'tao_ban', phamVi: 'lop', tenBan: 'Bàn nội bộ Lớp 10A7' }
});
ok('Tạo bàn lớp thành công', resLopA.data.ok === true && resLopA.data.phong?.phamVi === 'lop');
const banLopId = resLopA.data.phong.id;

// C (Lớp 2) cố gắng vào bàn lớp của A -> PHẢI THẤT BẠI
const resJoinLopFail = await api('/api/game', {
  method: 'POST',
  cookie: cookieC,
  body: { hanhDong: 'vao_ban', phongId: banLopId }
});
ok('F. Học sinh khác lớp (11A1) bị chặn vào bàn phạm vi lớp (403)', resJoinLopFail.status === 403, `status=${resJoinLopFail.status}`);

// C cố gắng GET detail bàn lớp của A -> PHẢI THẤT BẠI
const resGetLopFail = await api(`/api/game?phongId=${banLopId}`, { cookie: cookieC });
ok('F.2 Học sinh khác lớp không thể GET detail bàn lớp (403)', resGetLopFail.status === 403);

// Dọn bàn lớp
await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'roi_ban', phongId: banLopId } });

// G. A (Lớp 1) tạo bàn pham_vi='truong' -> C (Lớp 2) vào -> PHẢI THÀNH CÔNG!
const resTruongA = await api('/api/game', {
  method: 'POST',
  cookie: cookieA,
  body: { hanhDong: 'tao_ban', phamVi: 'truong', tenBan: 'Đấu trường toàn trường A vs C' }
});
ok('Tạo bàn toàn trường thành công', resTruongA.data.ok === true && resTruongA.data.phong?.phamVi === 'truong');
const banTruongId = resTruongA.data.phong.id;

// C (Lớp 2) vào bàn toàn trường của A
const resJoinTruongOk = await api('/api/game', {
  method: 'POST',
  cookie: cookieC,
  body: { hanhDong: 'vao_ban', phongId: banTruongId }
});
ok('G. Học sinh khác lớp (11A1) vào bàn Toàn trường THÀNH CÔNG', resJoinTruongOk.data.ok === true);

// C xem chi tiết bàn toàn trường -> Thành công
const resGetTruongDetail = await api(`/api/game?phongId=${banTruongId}`, { cookie: cookieC });
ok('G.2 Học sinh khác lớp GET detail bàn toàn trường THÀNH CÔNG', resGetTruongDetail.data.ok === true && resGetTruongDetail.data.phong?.trangThai === 'dang_choi');

// Dọn bàn
await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'roi_ban', phongId: banTruongId } });

// ─────────────────────────────────────────────────────────────────────────────
// E. SELF-JOIN REJECTION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== E. Self-Join Protection ==');
const resBanSelf = await api('/api/game', {
  method: 'POST',
  cookie: cookieA,
  body: { hanhDong: 'tao_ban', phamVi: 'truong', tenBan: 'Bàn tự đấu' }
});
const selfPhongId = resBanSelf.data.phong.id;
const resSelfJoin = await api('/api/game', {
  method: 'POST',
  cookie: cookieA,
  body: { hanhDong: 'vao_ban', phongId: selfPhongId }
});
const detailSelf = await api(`/api/game?phongId=${selfPhongId}`, { cookie: cookieA });
ok('E. Chủ bàn không thể tự biến mình thành khách (khachId vẫn null)', detailSelf.data.phong?.khachId === null);
await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'roi_ban', phongId: selfPhongId } });

// ─────────────────────────────────────────────────────────────────────────────
// A. TWO PLAYERS CLAIM SAME TABLE CONCURRENTLY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== A. Two Players Claim Same Table Concurrently ==');
const resBanA = await api('/api/game', {
  method: 'POST',
  cookie: cookieA,
  body: { hanhDong: 'tao_ban', phamVi: 'truong', tenBan: 'Bàn thử đua claim' }
});
const raceBanId = resBanA.data.phong.id;

// B và C cùng lao vào claim 1 bàn cùng 1 lúc!
const [claimB, claimC] = await Promise.all([
  api('/api/game', { method: 'POST', cookie: cookieB, body: { hanhDong: 'vao_ban', phongId: raceBanId } }),
  api('/api/game', { method: 'POST', cookie: cookieC, body: { hanhDong: 'vao_ban', phongId: raceBanId } }),
]);

const thanhCongCount = (claimB.data.ok ? 1 : 0) + (claimC.data.ok ? 1 : 0);
const thatBaiCount = (!claimB.data.ok ? 1 : 0) + (!claimC.data.ok ? 1 : 0);
ok('A. Chính xác MỘT người chơi claim thành công', thanhCongCount === 1, `thành công=${thanhCongCount}`);
ok('A.2 Người thứ hai bị từ chối với xung đột 409', thatBaiCount === 1 && (claimB.status === 409 || claimC.status === 409));

await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'roi_ban', phongId: raceBanId } });

// ─────────────────────────────────────────────────────────────────────────────
// B. DOUBLE-CLICK QUICK MATCH (SAME PLAYER)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== B. Double-Click Quick Match (Same Player) ==');
// Dọn sạch mọi bàn cũ của A nếu có
await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'roi_ban', phongId: 9999 } });

// Gửi 2 request tim_tran_nhanh đồng thời từ CÙNG MỘT HỌC SINH A
const [qm1, qm2] = await Promise.all([
  api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'tim_tran_nhanh', loaiGame: 'co_caro' } }),
  api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'tim_tran_nhanh', loaiGame: 'co_caro' } }),
]);

ok('B.1 Cả 2 request double-click đều phản hồi ok=true (không trả 500)', qm1.data.ok === true && qm2.data.ok === true);
ok('B.2 Cả 2 request đều trỏ về CÙNG MỘT mã phòng chờ (Idempotent)', qm1.data.phongId === qm2.data.phongId, `p1=${qm1.data.phongId}, p2=${qm2.data.phongId}`);

// Huỷ tìm trận
const qmHuy = await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'huy_tim_tran', phongId: qm1.data.phongId } });
ok('Huỷ tìm trận thành công', qmHuy.data.cancelled === true);

// ─────────────────────────────────────────────────────────────────────────────
// C. SAME PLAYER CLAIMS TWO OPPONENTS CONCURRENTLY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== C. Same Player Claims Two Opponents Concurrently ==');
// B và C mỗi người tạo 1 bàn Quick Match đang chờ (không ghép lẫn nhau vì dùng tao_ban)
const resWaitB = await api('/api/game', { method: 'POST', cookie: cookieB, body: { hanhDong: 'tao_ban', phamVi: 'truong', kieuGhep: 'nhanh', tenBan: 'Quick B' } });
const resWaitC = await api('/api/game', { method: 'POST', cookie: cookieC, body: { hanhDong: 'tao_ban', phamVi: 'truong', kieuGhep: 'nhanh', tenBan: 'Quick C' } });

ok('Tạo 2 đối thủ B và C đang chờ', resWaitB.data.ok === true && resWaitC.data.ok === true);

// Giờ A gửi đồng thời 2 request Quick Match
const [matchA1, matchA2] = await Promise.all([
  api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'tim_tran_nhanh' } }),
  api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'tim_tran_nhanh' } }),
]);

// Invariant: A chỉ được matched vào DUY NHẤT 1 trận, trận thứ 2 nếu phản hồi phải là resumed cùng phòng đó!
const matchedBanId1 = matchA1.data.phongId;
const matchedBanId2 = matchA2.data.phongId;
ok('C. A chỉ được ghép vào DUY NHẤT 1 trận đấu (không chiếm 2 đối thủ)', matchedBanId1 === matchedBanId2, `p1=${matchedBanId1}, p2=${matchedBanId2}`);

// Dọn dẹp
if (matchedBanId1) {
  await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'roi_ban', phongId: matchedBanId1 } });
}
if (resWaitB.data?.phong?.id) {
  await api('/api/game', { method: 'POST', cookie: cookieB, body: { hanhDong: 'roi_ban', phongId: resWaitB.data.phong.id } });
}
if (resWaitC.data?.phong?.id) {
  await api('/api/game', { method: 'POST', cookie: cookieC, body: { hanhDong: 'roi_ban', phongId: resWaitC.data.phong.id } });
}

// ─────────────────────────────────────────────────────────────────────────────
// D. ALREADY IN ACTIVE MATCH (RESUME)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== D. Resume Existing Active Match ==');
// A tạo bàn và B vào bàn
const resD_Tao = await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'tao_ban', phamVi: 'truong' } });
const phongActiveId = resD_Tao.data.phong.id;
await api('/api/game', { method: 'POST', cookie: cookieB, body: { hanhDong: 'vao_ban', phongId: phongActiveId } });

// Khi A đang trong trận active, gọi Quick Match -> PHẢI trả về trận này (resumed: true)
const resD_Resume = await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'tim_tran_nhanh' } });
ok('D. Quick Match phát hiện trận đang chơi và trả về resumed: true', resD_Resume.data.resumed === true && resD_Resume.data.phongId === phongActiveId);

// ─────────────────────────────────────────────────────────────────────────────
// I & J. MOVE CONCURRENCY (DOUBLE MOVE SAME TURN & WRONG TURN)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== I & J. Move Concurrency Protections ==');
// Kiểm tra trạng thái bàn: A là chủ (X, đi trước), B là khách (O)
const detailD = await api(`/api/game?phongId=${phongActiveId}`, { cookie: cookieA });
ok('Trạng thái bàn đang chơi, lượt của A', detailD.data.phong?.trangThai === 'dang_choi' && detailD.data.phong?.luotDiId === HS_A.hocSinhId);

// J. B (O) cố tình đi trước khi đến lượt -> PHẢI BỊ TỪ CHỐI 409
const resWrongTurn = await api('/api/game', {
  method: 'POST',
  cookie: cookieB,
  body: { hanhDong: 'danh_co', phongId: phongActiveId, r: 0, c: 0 }
});
ok('J. Nước đi sai lượt bị từ chối bởi server (409)', resWrongTurn.status === 409);

// I. A gửi ĐỒNG THỜI 2 nước đi khác nhau trong cùng 1 lượt của mình
const [move1, move2] = await Promise.all([
  api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'danh_co', phongId: phongActiveId, r: 7, c: 7 } }),
  api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'danh_co', phongId: phongActiveId, r: 7, c: 8 } }),
]);

const moveThanhCong = (move1.data.ok ? 1 : 0) + (move2.data.ok ? 1 : 0);
const moveXungDot = (!move1.data.ok ? 1 : 0) + (!move2.data.ok ? 1 : 0);
ok('I.1 Chính xác MỘT nước đi được ghi nhận trong lượt', moveThanhCong === 1, `thành công=${moveThanhCong}`);
ok('I.2 Nước đi đồng thời thứ hai bị từ chối 409 (Optimistic Concurrency)', moveXungDot === 1 && (move1.status === 409 || move2.status === 409));

// Dọn bàn
await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'roi_ban', phongId: phongActiveId } });

// ─────────────────────────────────────────────────────────────────────────────
// H. STALE / FINISHED TABLE
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== H. Stale / Finished Table Ignored ==');
// Bàn kết thúc không được Quick Match ghép vào
const resH_Tao = await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'tao_ban', phamVi: 'truong' } });
const banH_Id = resH_Tao.data.phong.id;
await api('/api/game', { method: 'POST', cookie: cookieA, body: { hanhDong: 'roi_ban', phongId: banH_Id } }); // Set 'huy'

// B gọi Quick Match -> Không được ghép vào bàn H
const qmH = await api('/api/game', { method: 'POST', cookie: cookieB, body: { hanhDong: 'tim_tran_nhanh' } });
ok('H. Bàn đã huỷ/kết thúc không bị Quick Match ghép vào', qmH.data.phongId !== banH_Id);
await api('/api/game', { method: 'POST', cookie: cookieB, body: { hanhDong: 'huy_tim_tran', phongId: qmH.data.phongId } });

// ─────────────────────────────────────────────────────────────────────────────
// KẾT QUẢ CUỐI CÙNG
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`KẾT QUẢ QA ARENA CONCURRENCY: ${pass} PASS, ${fail} FAIL`);
console.log('================================================================');

if (fail > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
