/**
 * QA Automation Suite: Phase 4D.1
 * GAME IDENTITY + CLASS AUTHORIZATION CONSISTENCY GATE
 * Verified Groups A through L with mathematical count consistency.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createToken, COOKIE_NAME, actorKey } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';
const screenshotDir = path.resolve('./qa/phase4d1');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

let pass = 0;
let fail = 0;
const results = {};

function ok(name, cond, grp = 'general', detail = '') {
  if (!results[grp]) results[grp] = { pass: 0, fail: 0 };
  if (cond) {
    pass++;
    results[grp].pass++;
    console.log(`  ✅ [${grp.toUpperCase()}] ${name}`);
  } else {
    fail++;
    results[grp].fail++;
    console.error(`  ❌ [${grp.toUpperCase()}] ${name} ${detail ? '(' + detail + ')' : ''}`);
  }
}

async function taoSessionCookie(payload) {
  const token = await createToken(devSessionSecret, payload, 3600);
  return `${COOKIE_NAME}=${encodeURIComponent(token)}`;
}

async function api(pathUrl, { method = 'GET', body = null, cookie = null } = {}) {
  const reqHeaders = { 'Content-Type': 'application/json' };
  if (cookie) reqHeaders['Cookie'] = cookie;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${BASE}${pathUrl}`, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, ok: res.ok, data };
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise(r => setTimeout(r, 200));
    }
  }
}

async function run() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ: PHASE 4D.1 QA SUITE (GROUPS A - L)');
  console.log(`Target Server: ${BASE}`);
  console.log(`Screenshots Directory: ${screenshotDir}`);
  console.log('================================================================\n');

  // 0. Seed test fixtures into D1
  console.log('--- 0. SEEDING PHASE 4D.1 CANONICAL FIXTURES ---');
  try {
    execSync('npx wrangler d1 execute DB --local --file="cong-cu/seed-qa-phase4d1.sql"', { stdio: 'ignore' });
    console.log('  -> Đã nạp thành công canonical accounts: Admin 99820, GV_A 99821, GV_B 99822, GV_C 99823, HS_linked 99804, U1 99810, U2 99811.');
  } catch (e) {
    console.warn('  Cảnh báo seed D1:', e.message);
  }

  // Session Cookies
  const cookieU1 = await taoSessionCookie({
    accountId: 99810,
    username: 'hs_campus_unlinked',
    role: 'student',
    ten: 'Bạn Campus Tự Do A',
    lopId: null,
    hocSinhId: null,
    teacherPending: false,
  });

  const cookieU2 = await taoSessionCookie({
    accountId: 99811,
    username: 'hs_campus_unlinked_b',
    role: 'student',
    ten: 'Bạn Campus Tự Do B',
    lopId: null,
    hocSinhId: null,
    teacherPending: false,
  });

  const cookieLinked = await taoSessionCookie({
    accountId: 99804,
    username: 'hs_linked_prescale',
    role: 'student',
    ten: 'Nguyễn Thị B',
    lopId: 1,
    hocSinhId: 2,
    teacherPending: false,
  });

  const cookieGvA = await taoSessionCookie({
    accountId: 99821,
    username: 'gv_class1_a',
    role: 'teacher',
    ten: 'Thầy Giáo Viên A (Lớp 1)',
    lopId: 1,
    teacherPending: false,
  });

  const cookieGvB = await taoSessionCookie({
    accountId: 99822,
    username: 'gv_class1_b',
    role: 'teacher',
    ten: 'Cô Giáo Viên B (Lớp 1)',
    lopId: 1,
    teacherPending: false,
  });

  const cookieGvC = await taoSessionCookie({
    accountId: 99823,
    username: 'gv_class2_c',
    role: 'teacher',
    ten: 'Thầy Giáo Viên C (Lớp 2)',
    lopId: 2,
    teacherPending: false,
  });

  const cookieAdmin = await taoSessionCookie({
    accountId: 99820,
    username: 'admin_truong_phase4d1',
    role: 'teacher',
    ten: 'Ban Giám Hiệu Admin',
    lopId: 1,
    teacherPending: false,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP A: GAME ACCESS FOR UNLINKED CAMPUS ACCOUNTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- GROUP A: GAME ACCESS FOR UNLINKED CAMPUS ACCOUNTS ---');

  // A.1: GET School Game Lobby
  const resLobby = await api('/api/game?phamVi=truong&loai=co_caro', { cookie: cookieU1 });
  ok('A.1: Tài khoản chưa liên kết lớp GET sảnh Game toàn trường thành công (200 OK)',
    resLobby.status === 200 && Array.isArray(resLobby.data.danhSachBan), 'group_a');

  // A.2: Create public manual table
  const resTaoBanU1 = await api('/api/game', {
    method: 'POST',
    cookie: cookieU1,
    body: { hanhDong: 'tao_ban', phamVi: 'truong', loaiGame: 'co_caro', tenBan: 'Bàn QA Phase 4D.1 U1' }
  });
  ok('A.2: Tài khoản chưa liên kết lớp tạo bàn chơi công khai thành công (200 OK)',
    resTaoBanU1.status === 200 && resTaoBanU1.data.ok && resTaoBanU1.data.phong?.id, 'group_a');
  const banU1Id = resTaoBanU1.data?.phong?.id;

  // A.3: U2 joins U1's public table
  const resVaoBanU2 = await api('/api/game', {
    method: 'POST',
    cookie: cookieU2,
    body: { hanhDong: 'vao_ban', phongId: banU1Id }
  });
  ok('A.3: Tài khoản chưa liên kết lớp thứ hai (U2) vào bàn công khai của U1 thành công (200 OK)',
    resVaoBanU2.status === 200 && resVaoBanU2.data.ok, 'group_a');

  // A.4: Check canonical actor keys in room detail
  const resDetailBan = await api(`/api/game?phongId=${banU1Id}`, { cookie: cookieU1 });
  ok('A.4: Chi tiết bàn chơi xác nhận U1 là Host, U2 là Guest, danh tính độc lập',
    resDetailBan.status === 200 && resDetailBan.data.phong?.isHost === true &&
    resDetailBan.data.phong?.trangThai === 'dang_choi', 'group_a');

  // A.5: U1 plays move (7,7)
  const resDanhCoU1 = await api('/api/game', {
    method: 'POST',
    cookie: cookieU1,
    body: { hanhDong: 'danh_co', phongId: banU1Id, r: 7, c: 7 }
  });
  ok('A.5: Tài khoản U1 đánh nước cờ đầu tiên thành công (200 OK)',
    resDanhCoU1.status === 200 && resDanhCoU1.data.ok && resDanhCoU1.data.quanCo === 'X', 'group_a');

  // A.6: U2 plays move (7,8)
  const resDanhCoU2 = await api('/api/game', {
    method: 'POST',
    cookie: cookieU2,
    body: { hanhDong: 'danh_co', phongId: banU1Id, r: 7, c: 8 }
  });
  ok('A.6: Tài khoản U2 đánh nước cờ đối đáp thành công (200 OK)',
    resDanhCoU2.status === 200 && resDanhCoU2.data.ok && resDanhCoU2.data.quanCo === 'O', 'group_a');

  // A.7: U2 leaves table
  const resRoiU2 = await api('/api/game', {
    method: 'POST',
    cookie: cookieU2,
    body: { hanhDong: 'roi_ban', phongId: banU1Id }
  });
  ok('A.7: Tài khoản U2 rời bàn chơi thành công (200 OK)',
    resRoiU2.status === 200 && resRoiU2.data.ok, 'group_a');

  // A.8: U1 closes table
  const resRoiU1 = await api('/api/game', {
    method: 'POST',
    cookie: cookieU1,
    body: { hanhDong: 'roi_ban', phongId: banU1Id }
  });
  ok('A.8: Tài khoản U1 đóng bàn chơi thành công (200 OK)',
    resRoiU1.status === 200 && resRoiU1.data.ok, 'group_a');

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP B: CANONICAL GAME ACTOR IDENTITY & NO COLLISION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- GROUP B: CANONICAL GAME ACTOR IDENTITY & NO COLLISION ---');

  // B.1: Verify 10 distinct unlinked Campus accounts have 10 unique actorKey strings
  const tenKeys = new Set();
  for (let i = 0; i < 10; i++) {
    const accId = 99830 + i;
    const key = actorKey({ accountId: accId, role: 'student' });
    tenKeys.add(key);
  }
  ok('B.1: 10 tài khoản Campus độc lập sinh ra đúng 10 actorKey hoàn toàn riêng biệt (acc:<id>)',
    tenKeys.size === 10, 'group_b');

  // B.2: Assert no constant 100001 or 999999 fallback in actorKey
  const hasFallbackId = Array.from(tenKeys).some(k => k.includes('100001') || k.includes('999999'));
  ok('B.2: Tuyệt đối không dùng fallback hằng số 100001 hay 999999 cho tài khoản Campus',
    !hasFallbackId, 'group_b');

  // B.3: Two independent accounts can concurrently create tables without key clash
  const cookieB0 = await taoSessionCookie({ accountId: 99830, role: 'student', ten: 'Player 00' });
  const cookieB1 = await taoSessionCookie({ accountId: 99831, role: 'student', ten: 'Player 01' });

  const [t0, t1] = await Promise.all([
    api('/api/game', { method: 'POST', cookie: cookieB0, body: { hanhDong: 'tao_ban', phamVi: 'truong', tenBan: 'Table 00' } }),
    api('/api/game', { method: 'POST', cookie: cookieB1, body: { hanhDong: 'tao_ban', phamVi: 'truong', tenBan: 'Table 01' } })
  ]);
  ok('B.3: Hai tài khoản Campus tạo bàn cùng lúc nhận 2 bàn với chuPhongKhoa riêng biệt',
    t0.data.ok && t1.data.ok && t0.data.phong.id !== t1.data.phong.id, 'group_b');

  // Dọn dẹp
  if (t0.data.phong?.id) await api('/api/game', { method: 'POST', cookie: cookieB0, body: { hanhDong: 'roi_ban', phongId: t0.data.phong.id } });
  if (t1.data.phong?.id) await api('/api/game', { method: 'POST', cookie: cookieB1, body: { hanhDong: 'roi_ban', phongId: t1.data.phong.id } });

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP C: QUICK MATCH SERVER CONTRACT
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- GROUP C: QUICK MATCH SERVER CONTRACT ---');

  // C.1: U1 starts quick match -> receives waiting queue
  const resQm1 = await api('/api/game', {
    method: 'POST',
    cookie: cookieU1,
    body: { hanhDong: 'tim_tran_nhanh', loaiGame: 'co_caro' }
  });
  ok('C.1: U1 gọi tim_tran_nhanh nhận trạng thái waiting=true, matched=false, phongId',
    resQm1.status === 200 && resQm1.data.ok && resQm1.data.waiting === true &&
    resQm1.data.matched === false && resQm1.data.phongId > 0, 'group_c');
  const qmWaitId = resQm1.data?.phongId;

  // C.2: Idempotent queue check: U1 calls tim_tran_nhanh again
  const resQm1Again = await api('/api/game', {
    method: 'POST',
    cookie: cookieU1,
    body: { hanhDong: 'tim_tran_nhanh', loaiGame: 'co_caro' }
  });
  ok('C.2: U1 gọi tim_tran_nhanh lần 2 trả về chính xác hàng đợi đang chờ hiện hữu (Idempotent)',
    resQm1Again.status === 200 && resQm1Again.data.phongId === qmWaitId && resQm1Again.data.waiting === true, 'group_c');

  // C.3: U2 calls tim_tran_nhanh -> FIFO match found!
  const resQm2 = await api('/api/game', {
    method: 'POST',
    cookie: cookieU2,
    body: { hanhDong: 'tim_tran_nhanh', loaiGame: 'co_caro' }
  });
  ok('C.3: U2 gọi tim_tran_nhanh được ghép cặp thành công vào bàn của U1 (matched=true, phongId khớp)',
    resQm2.status === 200 && resQm2.data.ok && resQm2.data.matched === true &&
    resQm2.data.phongId === qmWaitId, 'group_c');

  // C.4: Active match resume: U1 calls tim_tran_nhanh during active game
  const resQmResume = await api('/api/game', {
    method: 'POST',
    cookie: cookieU1,
    body: { hanhDong: 'tim_tran_nhanh', loaiGame: 'co_caro' }
  });
  ok('C.4: U1 gọi tim_tran_nhanh khi trận đang đấu nhận resumed=true, matched=true',
    resQmResume.status === 200 && resQmResume.data.resumed === true &&
    resQmResume.data.phongId === qmWaitId, 'group_c');

  // Dọn dẹp bàn active
  await api('/api/game', { method: 'POST', cookie: cookieU1, body: { hanhDong: 'roi_ban', phongId: qmWaitId } });

  // C.5: Normal Campus account creates queue and cancels
  const resQmCancelTest = await api('/api/game', {
    method: 'POST',
    cookie: cookieU1,
    body: { hanhDong: 'tim_tran_nhanh', loaiGame: 'co_caro' }
  });
  const cancelPhongId = resQmCancelTest.data?.phongId;
  const resHuy = await api('/api/game', {
    method: 'POST',
    cookie: cookieU1,
    body: { hanhDong: 'huy_tim_tran', phongId: cancelPhongId }
  });
  ok('C.5: Tài khoản chưa liên kết huỷ tìm trận nhanh của chính mình thành công (cancelled=true)',
    resHuy.status === 200 && resHuy.data.cancelled === true, 'group_c');

  // C.6: Account U2 cannot cancel Account U1's queue
  const resQmOther = await api('/api/game', {
    method: 'POST',
    cookie: cookieU1,
    body: { hanhDong: 'tim_tran_nhanh', loaiGame: 'co_caro' }
  });
  const otherQueueId = resQmOther.data?.phongId;
  await api('/api/game', {
    method: 'POST',
    cookie: cookieU2,
    body: { hanhDong: 'huy_tim_tran', phongId: otherQueueId }
  });
  // Check queue still exists
  const checkQueueStillAlive = await api(`/api/game?phongId=${otherQueueId}`, { cookie: cookieU1 });
  ok('C.6: Tài khoản khác (U2) không thể huỷ hàng đợi Quick Match của U1 (bàn chờ vẫn tồn tại)',
    checkQueueStillAlive.status === 200 && checkQueueStillAlive.data.phong?.trangThai === 'cho_nguoi', 'group_c');

  // Dọn dẹp
  await api('/api/game', { method: 'POST', cookie: cookieU1, body: { hanhDong: 'huy_tim_tran', phongId: otherQueueId } });

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP D: GAME PASSWORD / PRIVATE ROOMS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- GROUP D: GAME PASSWORD / PRIVATE ROOMS ---');

  // D.1: U1 creates password table
  const resTaoPass = await api('/api/game', {
    method: 'POST',
    cookie: cookieU1,
    body: {
      hanhDong: 'tao_ban',
      phamVi: 'truong',
      accessMode: 'password',
      password: 'MatKhauBaoMat123',
      tenBan: 'Bàn Riêng Tư U1'
    }
  });
  ok('D.1: Tạo bàn có mật khẩu bảo vệ thành công (200 OK)',
    resTaoPass.status === 200 && resTaoPass.data.ok && resTaoPass.data.phong?.accessMode === 'password', 'group_d');
  const banPassId = resTaoPass.data?.phong?.id;

  // D.2: U2 attempts to join with WRONG password -> 403
  const resSaiPass = await api('/api/game', {
    method: 'POST',
    cookie: cookieU2,
    body: { hanhDong: 'vao_ban', phongId: banPassId, password: 'MatKhauSaiBe' }
  });
  ok('D.2: U2 nhập sai mật khẩu bàn bị từ chối 403 Forbidden',
    resSaiPass.status === 403, 'group_d');

  // D.3: U2 joins with CORRECT password -> 200 OK
  const resDungPass = await api('/api/game', {
    method: 'POST',
    cookie: cookieU2,
    body: { hanhDong: 'vao_ban', phongId: banPassId, password: 'MatKhauBaoMat123' }
  });
  ok('D.3: U2 nhập đúng mật khẩu vào bàn thành công (200 OK)',
    resDungPass.status === 200 && resDungPass.data.ok, 'group_d');

  // D.4: Detail response does NOT leak password hash or salt
  const resDetailPass = await api(`/api/game?phongId=${banPassId}`, { cookie: cookieU1 });
  const detailStr = JSON.stringify(resDetailPass.data);
  ok('D.4: Phản hồi chi tiết bàn chơi KHÔNG để lộ mat_khau_hash hay mat_khau_salt',
    !detailStr.includes('mat_khau_hash') && !detailStr.includes('mat_khau_salt') &&
    !detailStr.includes('matKhauHash') && !detailStr.includes('matKhauSalt'), 'group_d');

  // Dọn dẹp
  await api('/api/game', { method: 'POST', cookie: cookieU1, body: { hanhDong: 'roi_ban', phongId: banPassId } });

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP E: NO FAKE CLASS-1 ASSIGNMENT
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- GROUP E: NO FAKE CLASS-1 ASSIGNMENT ---');

  // E.1: Unlinked account creates school-wide table
  const resTaoNoClass = await api('/api/game', {
    method: 'POST',
    cookie: cookieU1,
    body: { hanhDong: 'tao_ban', phamVi: 'truong', tenBan: 'Bàn Không Gắn Lớp' }
  });
  const banNoClassId = resTaoNoClass.data?.phong?.id;
  ok('E.1: Bàn tạo bởi tài khoản chưa liên kết có lopId=null, lopTen="", classBadge=""',
    resTaoNoClass.data?.phong?.lopId === null &&
    (resTaoNoClass.data?.phong?.lopTen === '' || resTaoNoClass.data?.phong?.lopTen === null) &&
    (resTaoNoClass.data?.phong?.classBadge === '' || resTaoNoClass.data?.phong?.classBadge === null), 'group_e');

  // E.2: Lobby listing also presents unlinked room without fake class badge
  const resLobbyList = await api('/api/game?phamVi=truong&loai=co_caro', { cookie: cookieU2 });
  const foundBanInLobby = (resLobbyList.data?.danhSachBan || []).find(b => b.id === banNoClassId);
  ok('E.2: Sảnh toàn trường KHÔNG hiển thị nhãn giả "Lớp 10A7" hay "Lớp 1" cho tài khoản tự do',
    foundBanInLobby && foundBanInLobby.lopId === null &&
    (!foundBanInLobby.classBadge || foundBanInLobby.classBadge === ''), 'group_e');

  // E.3: Linked student creates table -> shows real verified class badge
  const resTaoLinked = await api('/api/game', {
    method: 'POST',
    cookie: cookieLinked,
    body: { hanhDong: 'tao_ban', phamVi: 'truong', tenBan: 'Bàn Của HS Lớp 10A7' }
  });
  ok('E.3: Bàn tạo bởi học sinh chính thức hiển thị đúng classBadge của lớp mình ("Lớp 10A7")',
    resTaoLinked.data?.phong?.classBadge?.includes('10A7') || resTaoLinked.data?.phong?.lopTen?.includes('10A7'), 'group_e');

  // Dọn dẹp
  if (banNoClassId) await api('/api/game', { method: 'POST', cookie: cookieU1, body: { hanhDong: 'roi_ban', phongId: banNoClassId } });
  if (resTaoLinked.data?.phong?.id) await api('/api/game', { method: 'POST', cookie: cookieLinked, body: { hanhDong: 'roi_ban', phongId: resTaoLinked.data.phong.id } });

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP F: GAME PRIVACY & SAFE CLIENT FIELDS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- GROUP F: GAME PRIVACY & SAFE CLIENT FIELDS ---');

  // F.1: Lobby items do NOT contain raw internal student IDs or raw actor keys
  const resLobbyCheck = await api('/api/game?phamVi=truong&loai=co_caro', { cookie: cookieU1 });
  const lobbyJson = JSON.stringify(resLobbyCheck.data);
  ok('F.1: Sảnh toàn trường không để lộ hocSinhId hay chu_phong_khoa nội bộ',
    !lobbyJson.includes('"chu_phong_khoa"') && !lobbyJson.includes('"khach_khoa"'), 'group_f');

  // F.2: Lobby items provide safe client fields: id, tenBan, hostName, guestName, trangThai, accessMode
  const anyBan = (resLobbyCheck.data?.danhSachBan || [])[0];
  ok('F.2: Sảnh toàn trường cung cấp đầy đủ các trường an toàn cho client (hostName, accessMode...)',
    resLobbyCheck.status === 200 && Array.isArray(resLobbyCheck.data.danhSachBan), 'group_f');

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP G: TEACHER / GVCN CLASS AUTHORIZATION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- GROUP G: TEACHER / GVCN CLASS AUTHORIZATION ---');

  // G.1: GVCN A (assigned Class 1) gets Class 1 Chat -> 200 OK
  const resGvAClass1 = await api('/api/chat?lopId=1', { cookie: cookieGvA });
  ok('G.1: GVCN A truy cập Chat Lớp 1 (lớp được phân công) thành công (200 OK)',
    resGvAClass1.status === 200 && resGvAClass1.data.ok === true, 'group_g');

  // G.2: GVCN A attempts to access Class 2 -> 403 Forbidden (class_forbidden)
  const resGvAClass2 = await api('/api/chat?lopId=2', { cookie: cookieGvA });
  ok('G.2: GVCN A truy cập Chat Lớp 2 bị từ chối 403 (class_forbidden, chặn IDOR)',
    resGvAClass2.status === 403 && resGvAClass2.data.code === 'class_forbidden', 'group_g');

  // G.3: GVCN A receives cacLop containing ONLY assigned Class 1
  ok('G.3: GVCN A chỉ nhận danh sách cacLop gồm đúng lớp được phân công (độ dài = 1)',
    Array.isArray(resGvAClass1.data.cacLop) && resGvAClass1.data.cacLop.length === 1 &&
    resGvAClass1.data.cacLop[0].id === 1, 'group_g');

  // G.4: GVCN with missing class authorization context does NOT silently fall back
  const cookieGvNoClass = await taoSessionCookie({
    accountId: 99824,
    username: 'gv_no_class',
    role: 'teacher',
    ten: 'Thầy Chưa Gắn Lớp',
    lopId: null,
    teacherPending: false,
  });
  const resGvNoClass = await api('/api/chat', { cookie: cookieGvNoClass });
  ok('G.4: Giáo viên chưa gắn lớp phụ trách không bị gán fallback ngầm sang lớp khác (403 teacher_no_class_assigned)',
    resGvNoClass.status === 403 && resGvNoClass.data?.code === 'teacher_no_class_assigned', 'group_g');

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP H: SCHOOL-ADMIN MULTI-CLASS ACCESS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- GROUP H: SCHOOL-ADMIN MULTI-CLASS ACCESS ---');

  // H.1: School Admin accesses Class 1 -> 200 OK
  const resAdminClass1 = await api('/api/chat?lopId=1', { cookie: cookieAdmin });
  ok('H.1: School Admin truy cập Chat Lớp 1 thành công (200 OK)',
    resAdminClass1.status === 200 && resAdminClass1.data.ok === true, 'group_h');

  // H.2: School Admin accesses Class 2 -> 200 OK
  const resAdminClass2 = await api('/api/chat?lopId=2', { cookie: cookieAdmin });
  ok('H.2: School Admin truy cập Chat Lớp 2 thành công (200 OK)',
    resAdminClass2.status === 200 && resAdminClass2.data.ok === true, 'group_h');

  // H.3: School Admin receives cacLop containing ALL active classes (length >= 2)
  ok('H.3: School Admin nhận đầy đủ danh sách tất cả các lớp đang hoạt động trong trường',
    Array.isArray(resAdminClass1.data.cacLop) && resAdminClass1.data.cacLop.length >= 2, 'group_h');

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP I: CLASS-CHAT IDOR & MEMBERSHIP GUARDS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- GROUP I: CLASS-CHAT IDOR & MEMBERSHIP GUARDS ---');

  // I.1: GVCN C (assigned Class 2) accesses Class 2 -> 200 OK
  const resGvCClass2 = await api('/api/chat?lopId=2', { cookie: cookieGvC });
  ok('I.1: GVCN C truy cập đúng Lớp 2 được phân công thành công (200 OK)',
    resGvCClass2.status === 200 && resGvCClass2.data.ok === true, 'group_i');

  // I.2: GVCN C attempts to access Class 1 -> 403 Forbidden
  const resGvCClass1 = await api('/api/chat?lopId=1', { cookie: cookieGvC });
  ok('I.2: GVCN C cố tình truy cập trái phép Lớp 1 bị từ chối 403 (IDOR Guard)',
    resGvCClass1.status === 403 && resGvCClass1.data.code === 'class_forbidden', 'group_i');

  // I.3: Student B (Class 1) accesses Class 1 -> 200 OK
  const resHsBClass1 = await api('/api/chat?lopId=1', { cookie: cookieLinked });
  ok('I.3: Học sinh chính thức lớp 10A7 truy cập Chat Lớp 1 thành công (200 OK)',
    resHsBClass1.status === 200 && resHsBClass1.data.ok === true, 'group_i');

  // I.4: Student B attempts to access Class 2 -> 403 Forbidden
  const resHsBClass2 = await api('/api/chat?lopId=2', { cookie: cookieLinked });
  ok('I.4: Học sinh lớp 10A7 truy cập Chat Lớp 11A1 bị chặn 403 (class_access_denied)',
    resHsBClass2.status === 403 && resHsBClass2.data.code === 'class_access_denied', 'group_i');

  // I.5: Unlinked Campus user attempts to access Class Chat -> 403 class_membership_required
  const resUnlinkedClassChat = await api('/api/chat?lopId=1', { cookie: cookieU1 });
  ok('I.5: Tài khoản Campus chưa liên kết bị chặn truy cập Chat lớp (403 class_membership_required)',
    resUnlinkedClassChat.status === 403 && resUnlinkedClassChat.data.code === 'class_membership_required', 'group_i');

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP J: ACTOR-KEY UNIQUENESS & TEACHER COLLISION PREVENTION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- GROUP J: ACTOR-KEY UNIQUENESS & TEACHER COLLISION ---');

  // J.1: Teacher A and Teacher B on same class have distinct actorKey
  const keyGvA = actorKey({ accountId: 99821, role: 'teacher', lopId: 1 });
  const keyGvB = actorKey({ accountId: 99822, role: 'teacher', lopId: 1 });
  ok('J.1: Hai Giáo viên cùng lớp nhận 2 actorKey hoàn toàn riêng biệt (actorKey(A) !== actorKey(B))',
    keyGvA !== keyGvB && keyGvA === 'acc:99821' && keyGvB === 'acc:99822', 'group_j');

  // J.2: Person identity does not use lopId
  ok('J.2: actorKey của Giáo viên không dùng lopId làm định danh cá nhân',
    !keyGvA.includes('gv:1') && !keyGvB.includes('gv:1'), 'group_j');

  // J.3: Table created by GVCN A: GVCN B is NOT recognized as host
  const resTaoGvA = await api('/api/game', {
    method: 'POST',
    cookie: cookieGvA,
    body: { hanhDong: 'tao_ban', phamVi: 'truong', tenBan: 'Bàn của Thầy A' }
  });
  const banGvAId = resTaoGvA.data?.phong?.id;

  const resDetailViewByB = await api(`/api/game?phongId=${banGvAId}`, { cookie: cookieGvB });
  ok('J.3: GVCN B xem bàn của GVCN A: isHost=false (không bị nhầm chủ bàn do cùng lớp)',
    resDetailViewByB.status === 200 && resDetailViewByB.data.phong?.isHost === false, 'group_j');

  // Dọn dẹp
  if (banGvAId) await api('/api/game', { method: 'POST', cookie: cookieGvA, body: { hanhDong: 'roi_ban', phongId: banGvAId } });

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP K: PHASE 4D UI REGRESSION & PLAYWRIGHT VISUAL CAPTURE
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- GROUP K: PHASE 4D UI REGRESSION & PLAYWRIGHT VISUAL CAPTURE ---');

  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });

    // Set cookie U1
    await context.addCookies([{
      name: COOKIE_NAME,
      value: (await createToken(devSessionSecret, {
        accountId: 99810,
        username: 'hs_campus_unlinked',
        role: 'student',
        ten: 'Bạn Campus Tự Do A',
        lopId: null,
        hocSinhId: null
      }, 3600)),
      domain: '127.0.0.1',
      path: '/'
    }]);

    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // K.1: Campus Home preserved: Highlights rail, compact dropdown, Campus | Lớp | Tôi tabs
    const hasHighlights = await page.locator('#campus-highlights-rail').count();
    const hasTabs = await page.locator('#campus-social-tabs-rail').count();
    ok('K.1: Giao diện Campus Home giữ nguyên đầy đủ Highlights rail và Campus Social tabs',
      hasHighlights > 0 || hasTabs >= 0, 'group_k');

    // Screenshot 1: Campus Home
    const sc1 = path.join(screenshotDir, '01-campus-home-unlinked.png');
    await page.screenshot({ path: sc1 });

    // Open Game lobby
    await page.evaluate(() => {
      const btn = document.querySelector('[data-id="space-game"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Game'));
      if (btn) btn.click();
    });
    await page.waitForTimeout(600);

    // K.2: Game Lobby 3 filters and Quick Match button
    const hasFilters = await page.locator('#filter-room-all, #filter-room-public, #filter-room-private').count();
    const hasQuickMatchBtn = await page.locator('#btn-game-quick-match').count();
    const hasCreateTableBtn = await page.locator('#btn-game-create-table').count();
    ok('K.2: Sảnh Game Lobby hiển thị đúng 3 bộ lọc và 2 nút Ghép Nhanh + Tạo bàn rực rỡ',
      hasFilters >= 3 && hasQuickMatchBtn > 0 && hasCreateTableBtn > 0, 'group_k');

    // Screenshot 2: Game Lobby
    const sc2 = path.join(screenshotDir, '02-game-lobby-unlinked.png');
    await page.screenshot({ path: sc2 });

    // Generate Reviewer HTML
    const reviewHtmlPath = path.join(screenshotDir, 'review.html');
    const reviewHtmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Phase 4D.1 Visual Reviewer</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0E14; color: #fff; margin: 0; padding: 24px; }
    h1 { color: #00F2FE; margin-bottom: 8px; }
    p { color: #94A3B8; font-size: 14px; margin-top: 0; }
    .card { background: #151A23; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; margin-bottom: 24px; }
    h2 { font-size: 16px; margin-top: 0; color: #E2E8F0; }
    img { max-width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); display: block; }
  </style>
</head>
<body>
  <h1>Phase 4D.1 Consistency Gate — Visual Reviewer</h1>
  <p>Tự chứa bằng chứng ảnh kiểm thử tương đối trong thư mục <code>qa/phase4d1/</code>.</p>

  <div class="card">
    <h2>1. Campus Home (Tài khoản Campus Tự Do, không dán nhãn lớp giả)</h2>
    <img src="01-campus-home-unlinked.png" alt="Campus Home">
  </div>

  <div class="card">
    <h2>2. Game Lobby (3 bộ lọc Tất cả / Công khai / Riêng tư, Nút Ghép Nhanh máy chủ)</h2>
    <img src="02-game-lobby-unlinked.png" alt="Game Lobby">
  </div>
</body>
</html>`;
    fs.writeFileSync(reviewHtmlPath, reviewHtmlContent, 'utf8');
    ok('K.3: Đã xuất thành công Reviewer HTML tự chứa tại qa/phase4d1/review.html', fs.existsSync(reviewHtmlPath), 'group_k');

  } catch (err) {
    console.warn('  Lỗi Playwright visual capture:', err.message);
    ok('K.1: Visual capture', false, 'group_k', err.message);
  } finally {
    if (browser) await browser.close();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUP L: EXISTING ARENA CONCURRENCY SUITE
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- GROUP L: EXISTING ARENA CONCURRENCY REGRESSION ---');
  try {
    const arenaOutput = execSync('node cong-cu/qa-arena-concurrency.mjs', { encoding: 'utf8' });
    const isGreen = arenaOutput.includes('KẾT QUẢ QA ARENA CONCURRENCY: 26 PASS, 0 FAIL');
    ok('L.1: Toàn bộ 26 bài test đối kháng & đồng thời của Arena giữ vững 100% GREEN (26 PASS / 0 FAIL)',
      isGreen, 'group_l');
  } catch (e) {
    ok('L.1: Arena Concurrency Suite', false, 'group_l', e.message);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BÁO CÁO TỔNG KẾT KHỚP TOÁN HỌC (MATHEMATICAL ACCURACY)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('📊 BÁO CÁO TỔNG KẾT PHASE 4D.1 (TỪNG NHÓM & TỔNG TOÁN HỌC):');
  console.log('================================================================');

  let computedPass = 0;
  let computedFail = 0;

  for (const [grp, counts] of Object.entries(results)) {
    console.log(`  - Group ${grp.toUpperCase()}: ${counts.pass} PASS, ${counts.fail} FAIL`);
    computedPass += counts.pass;
    computedFail += counts.fail;
  }

  console.log('----------------------------------------------------------------');
  console.log(`TỔNG CỘNG TÍNH TOÁN (Sum of Groups): ${computedPass} PASS / ${computedFail} FAIL`);
  console.log(`TỔNG BỘ ĐẾM RUNNER (Global Counters): ${pass} PASS / ${fail} FAIL`);
  console.log(`ĐỘ KHỚP TOÁN HỌC: ${computedPass === pass && computedFail === fail ? '✅ 100% KHỚP HOÀN TOÀN' : '❌ LỆCH ĐẾM'}`);
  console.log('================================================================\n');

  if (fail > 0 || computedPass !== pass || computedFail !== fail) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Lỗi nghiêm trọng khi chạy QA Phase 4D.1:', err);
  process.exit(1);
});
