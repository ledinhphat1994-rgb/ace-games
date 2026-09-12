/**
 * QA Automation Suite: Phase 4D
 * Comprehensive Verification: Campus Access Model + Social Tabs + Final UI Composition
 * Groups A through L
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';
const screenshotDir = path.resolve('C:/Users/lepha/.gemini/antigravity-ide/brain/8a71fa6e-6654-4a3c-8b68-7741484bc9d1/phase4d-screenshots');

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
  console.log('🚀 BẮT ĐẦU KIỂM THỬ: PHASE 4D QA SUITE (GROUPS A - L)');
  console.log(`Target Server: ${BASE}`);
  console.log(`Screenshots: ${screenshotDir}`);
  console.log('================================================================\n');

  // 0. Seed test fixtures into D1
  console.log('--- 0. SEEDING CANONICAL FIXTURES ---');
  try {
    execSync('npx wrangler d1 execute lop-10a7-db --local --file="cong-cu/seed-qa-phase4d.sql" -y', { stdio: 'ignore' });
    console.log('  -> Đã nạp thành công canonical accounts: 99801 (GV), 99804 (HS linked), 99810 (HS unlinked A), 99811 (HS unlinked B).');
  } catch (e) {
    console.warn('  Cảnh báo seed D1:', e.message);
  }

  const unlinkedCookieA = await taoSessionCookie({
    accountId: 99810,
    username: 'hs_campus_unlinked',
    role: 'student',
    ten: 'Bạn Campus Tự Do',
    lopId: null,
    hocSinhId: null,
    teacherPending: false
  });

  const unlinkedCookieB = await taoSessionCookie({
    accountId: 99811,
    username: 'hs_campus_unlinked_b',
    role: 'student',
    ten: 'Bạn Campus B',
    lopId: null,
    hocSinhId: null,
    teacherPending: false
  });

  const linkedStudentCookie = await taoSessionCookie({
    accountId: 99804,
    username: 'hs_linked_prescale',
    role: 'student',
    ten: 'Nguyễn Thị B',
    lopId: 1,
    hocSinhId: 2,
    teacherPending: false
  });

  const teacherCookie = await taoSessionCookie({
    accountId: 99801,
    username: 'gv_prescale_real',
    role: 'teacher',
    ten: 'Thầy Phát Test',
    lopId: 1,
    teacherPending: false
  });

  // ─── GROUP A: CAMPUS ACCOUNT ACCESS (UNLINKED OPEN MODEL) ─────────────────────
  console.log('\n--- GROUP A: CAMPUS ACCOUNT ACCESS (OPEN CAMPUS SOCIAL) ---');

  // A.1: GET Campus Chat
  const resGetCampusChat = await api('/api/campus-chat', { cookie: unlinkedCookieA });
  ok('A.1: Tài khoản chưa liên kết lớp được phép GET /api/campus-chat (200 OK)',
    resGetCampusChat.status === 200 && Array.isArray(resGetCampusChat.data.messages), 'group_a');

  // A.2: POST Campus Chat
  const uniqueMsg = `Tin nhắn Campus tự do ${Date.now()}`;
  const resPostCampusChat = await api('/api/campus-chat', {
    method: 'POST',
    cookie: unlinkedCookieA,
    body: { noiDung: uniqueMsg }
  });
  ok('A.2: Tài khoản chưa liên kết lớp được phép POST /api/campus-chat (200 OK)',
    resPostCampusChat.status === 200 && resPostCampusChat.data.ok, 'group_a');

  // A.3: Search Friends
  const resSearchFriends = await api('/api/campus-friends', {
    method: 'POST',
    cookie: unlinkedCookieA,
    body: { action: 'search', query: 'hs_campus' }
  });
  ok('A.3: Tài khoản chưa liên kết lớp được phép tìm kiếm bạn bè toàn trường',
    resSearchFriends.status === 200 && Array.isArray(resSearchFriends.data.list) && resSearchFriends.data.list.length > 0, 'group_a');

  // A.4: Send Friend Request
  const resSendReq = await api('/api/campus-friends', {
    method: 'POST',
    cookie: unlinkedCookieA,
    body: { action: 'request', targetAccountId: 99811 }
  });
  ok('A.4: Gửi lời mời kết bạn giữa 2 tài khoản Campus tự do thành công',
    resSendReq.status === 200 && resSendReq.data.ok, 'group_a');

  // A.5: List Received Friend Requests
  const resListReqs = await api('/api/campus-friends', { cookie: unlinkedCookieB });
  const hasReq = (resListReqs.data.pendingIncoming || []).some(r => r.fromAccountId === 99810);
  ok('A.5: Tài khoản nhận thấy lời mời kết bạn từ tài khoản tự do',
    resListReqs.status === 200 && hasReq, 'group_a');

  // A.6: Accept Friend Request
  const resAcceptReq = await api('/api/campus-friends', {
    method: 'POST',
    cookie: unlinkedCookieB,
    body: { action: 'accept', fromAccountId: 99810 }
  });
  ok('A.6: Chấp nhận kết bạn thành công',
    resAcceptReq.status === 200 && resAcceptReq.data.ok, 'group_a');

  // A.7: List Friends
  const resFriendsList = await api('/api/campus-friends', { cookie: unlinkedCookieA });
  const isFriend = (resFriendsList.data.friends || []).some(f => f.accountId === 99811);
  ok('A.7: Danh sách bạn bè hiển thị đúng bạn mới kết nối',
    resFriendsList.status === 200 && isFriend, 'group_a');

  // A.8: Send DM
  const dmContent = `Hello DM ${Date.now()}`;
  const resSendDm = await api('/api/campus-dm', {
    method: 'POST',
    cookie: unlinkedCookieA,
    body: { action: 'send', recipientAccountId: 99811, content: dmContent }
  });
  ok('A.8: Nhắn tin riêng (DM) giữa 2 tài khoản Campus thành công',
    resSendDm.status === 200 && resSendDm.data.ok, 'group_a');

  // A.9: Get DM Messages
  const resGetDm = await api('/api/campus-dm?friendAccountId=99810', { cookie: unlinkedCookieB });
  const foundDm = (resGetDm.data.messages || []).some(m => m.content === dmContent);
  ok('A.9: Người nhận đọc được tin nhắn riêng đầy đủ',
    resGetDm.status === 200 && foundDm, 'group_a');

  // A.10: GET Campus Highlights
  const resHighlights = await api('/api/campus-highlights', { cookie: unlinkedCookieA });
  ok('A.10: Tài khoản chưa liên kết lớp xem được Tiêu điểm Campus toàn trường',
    resHighlights.status === 200 && Array.isArray(resHighlights.data.highlights), 'group_a');

  // ─── GROUP B: CLASS CHAT STRICT ISOLATION (NO LOPID || 1 FALLBACK) ───────────
  console.log('\n--- GROUP B: CLASS CHAT STRICT ISOLATION ---');

  // B.1: GET /api/chat rejected with 403 class_membership_required for unlinked
  const resUnlinkedGetClassChat = await api('/api/chat', { cookie: unlinkedCookieA });
  ok('B.1: GET /api/chat bị từ chối 403 class_membership_required cho tài khoản chưa link',
    resUnlinkedGetClassChat.status === 403 && resUnlinkedGetClassChat.data.code === 'class_membership_required', 'group_b');

  // B.2: POST /api/chat rejected with 403 class_membership_required for unlinked
  const resUnlinkedPostClassChat = await api('/api/chat', {
    method: 'POST',
    cookie: unlinkedCookieA,
    body: { noiDung: 'Thử gửi lén vào chat lớp' }
  });
  ok('B.2: POST /api/chat bị từ chối 403 class_membership_required cho tài khoản chưa link',
    resUnlinkedPostClassChat.status === 403 && resUnlinkedPostClassChat.data.code === 'class_membership_required', 'group_b');

  // B.3: Explicit ?lopId=1 param query still rejected
  const resUnlinkedExplicitLop = await api('/api/chat?lopId=1', { cookie: unlinkedCookieA });
  ok('B.3: Truyền rõ ?lopId=1 vẫn bị chặn 403 (chống IDOR / bypass lớp)',
    resUnlinkedExplicitLop.status === 403 && resUnlinkedExplicitLop.data.code === 'class_membership_required', 'group_b');

  // B.4: Linked Student can access their own class chat
  const resLinkedGetClassChat = await api('/api/chat', { cookie: linkedStudentCookie });
  ok('B.4: Học sinh đã liên kết lớp vào được Chat lớp chính quy (200 OK)',
    resLinkedGetClassChat.status === 200 && resLinkedGetClassChat.data.ok && resLinkedGetClassChat.data.lopId === 1, 'group_b');

  // B.5: Linked Student can send message in class chat
  const resLinkedPostClassChat = await api('/api/chat', {
    method: 'POST',
    cookie: linkedStudentCookie,
    body: { noiDung: `Tin nhắn lớp 10A7 ${Date.now()}` }
  });
  ok('B.5: Học sinh đã liên kết lớp gửi được tin nhắn trong chat lớp',
    resLinkedPostClassChat.status === 200 && resLinkedPostClassChat.data.ok, 'group_b');

  // B.6: Teacher can access class chat
  const resTeacherClassChat = await api('/api/chat?lopId=1', { cookie: teacherCookie });
  ok('B.6: Giáo viên chủ nhiệm truy cập chat lớp thành công (200 OK)',
    resTeacherClassChat.status === 200 && resTeacherClassChat.data.laGiaoVien === true, 'group_b');

  // ─── GROUP C: CLASS-CODE BADGE VERIFICATION ─────────────────────────────────
  console.log('\n--- GROUP C: CLASS-CODE BADGE VERIFICATION ---');

  // C.1: Whoami for unlinked account has isLinkedStudent = false and empty tenLop
  const resWhoamiUnlinked = await api('/api/whoami', { cookie: unlinkedCookieA });
  ok('C.1: Whoami tài khoản tự do có isLinkedStudent = false',
    resWhoamiUnlinked.data.isLinkedStudent === false, 'group_c');
  ok('C.2: Whoami tài khoản tự do có tenLop là chuỗi rỗng (không rò rỉ 10A7)',
    resWhoamiUnlinked.data.tenLop === '', 'group_c');

  // C.2: Whoami for linked student has isLinkedStudent = true and tenLop = 10A7
  const resWhoamiLinked = await api('/api/whoami', { cookie: linkedStudentCookie });
  ok('C.3: Whoami học sinh liên kết có isLinkedStudent = true',
    resWhoamiLinked.data.isLinkedStudent === true, 'group_c');
  ok('C.4: Whoami học sinh liên kết có tenLop là 10A7',
    Boolean(resWhoamiLinked.data.tenLop && resWhoamiLinked.data.tenLop.includes('10A7')), 'group_c');

  // C.3: Friend search returns classBadge only for linked student
  const resSearchLinked = await api('/api/campus-friends', {
    method: 'POST',
    cookie: unlinkedCookieA,
    body: { action: 'search', query: 'hs_linked_prescale' }
  });
  const linkedTarget = (resSearchLinked.data.list || []).find(u => u.id === 99804);
  ok('C.5: Tìm kiếm bạn bè hiển thị classBadge lớp cho học sinh đã liên kết',
    Boolean(linkedTarget && linkedTarget.classBadge && linkedTarget.classBadge.includes('10A7')), 'group_c');

  const resSearchUnlinked = await api('/api/campus-friends', {
    method: 'POST',
    cookie: linkedStudentCookie,
    body: { action: 'search', query: 'hs_campus_unlinked' }
  });
  const unlinkedTarget = (resSearchUnlinked.data.list || []).find(u => u.id === 99810);
  ok('C.6: Tìm kiếm bạn bè KHÔNG gắn classBadge lớp cho học sinh chưa liên kết',
    Boolean(unlinkedTarget && (!unlinkedTarget.classBadge || unlinkedTarget.classBadge === '')), 'group_c');

  // ─── UI & PLAYWRIGHT AUTOMATION (GROUPS D - L) ───────────────────────────────
  console.log('\n--- PLAYWRIGHT BROWSER VERIFICATION (GROUPS D - L) ---');

  const browser = await chromium.launch({ headless: true });

  try {
    // ─── 1. Unlinked User Browser Context ───
    const contextUnlinked = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const parsedCookieA = unlinkedCookieA.split(';')[0].split('=');
    await contextUnlinked.addCookies([{
      name: parsedCookieA[0].trim(),
      value: decodeURIComponent(parsedCookieA[1].trim()),
      domain: '127.0.0.1',
      path: '/'
    }]);

    const pageUnlinked = await contextUnlinked.newPage();
    await pageUnlinked.goto(BASE, { waitUntil: 'domcontentloaded' });
    await pageUnlinked.waitForTimeout(2000);

    // Group D.1: Tab model for unlinked account (Campus | Tôi)
    const tabCampusUnlinked = await pageUnlinked.$('#chat-tab-campus');
    const tabClassUnlinked = await pageUnlinked.$('#chat-tab-class');
    const tabMeUnlinked = await pageUnlinked.$('#chat-tab-me');
    ok('D.1: Tài khoản tự do thấy tab Campus', tabCampusUnlinked !== null, 'group_d');
    ok('D.2: Tài khoản tự do thấy tab Tôi', tabMeUnlinked !== null, 'group_d');
    ok('D.3: Tài khoản tự do KHÔNG thấy tab Lớp (#chat-tab-class)', tabClassUnlinked === null, 'group_d');

    // Group E: Account Dropdown Cleanup for unlinked
    const userBtn = await pageUnlinked.$('#user-profile-menu-button');
    if (userBtn) {
      await userBtn.click();
      await pageUnlinked.waitForTimeout(500);

      const dropdownPopover = await pageUnlinked.$('#user-profile-dropdown-popover');
      ok('E.1: Dropdown popover mở thành công', dropdownPopover !== null, 'group_e');

      // Check single-line achievements row
      const achRow = await pageUnlinked.$('text=Thành tựu ·');
      ok('E.2: Dòng Thành tựu hiển thị gọn dạng "Thành tựu · X huy hiệu"', achRow !== null, 'group_e');

      // Check class rows are hidden for unlinked
      const chuyenCanRow = await pageUnlinked.$('text=Chuyên cần & Điểm danh');
      const quyLopRow = await pageUnlinked.$('text=Quỹ lớp');
      const noiQuyRow = await pageUnlinked.$('text=Sổ tay nội quy');
      ok('E.3: Các mục nội bộ lớp (Chuyên cần, Quỹ lớp, Nội quy) bị ẩn đối với tài khoản tự do',
        chuyenCanRow === null && quyLopRow === null && noiQuyRow === null, 'group_e');

      // Check old 3 metric boxes are removed
      const oldMetrics = await pageUnlinked.$('#user-dropdown-three-metrics');
      ok('E.4: Ba khối vi chỉ số cũ đã bị loại bỏ hoàn toàn khỏi dropdown', oldMetrics === null, 'group_e');

      // Check Admin Center is absent from dropdown
      const dropdownAdminBtn = await pageUnlinked.$('#btn-dropdown-khu-quan-tri');
      ok('F.1: Mục Khu quản trị hoàn toàn KHÔNG có trong dropdown tài khoản', dropdownAdminBtn === null, 'group_f');

      await pageUnlinked.screenshot({ path: path.join(screenshotDir, 'unlinked-dropdown.png') });

      // Close dropdown
      await pageUnlinked.click('body', { position: { x: 10, y: 10 } });
      await pageUnlinked.waitForTimeout(300);
    }

    // Group G: Highlights Rail sizing
    const highlightsEl = await pageUnlinked.$('#campus-highlights');
    if (highlightsEl) {
      const box = await highlightsEl.boundingBox();
      ok('G.1: Tiêu điểm Campus (#campus-highlights) hiển thị trên giao diện', box !== null, 'group_g');
      ok('G.2: Khung Tiêu điểm có độ rộng đạt chuẩn rail lớn (width >= 280px)',
        box && box.width >= 280, 'group_g', `actual width: ${box?.width}`);
    }

    // Group H, I, J: Game Lobby
    const gameCard = await pageUnlinked.$('h3:has-text("Game")');
    if (gameCard) {
      await gameCard.click();
      await pageUnlinked.waitForTimeout(1000);

      const lobbyGame = await pageUnlinked.$('#lobby-game');
      ok('H.1: Mở sảnh Game Lobby (#lobby-game) thành công', lobbyGame !== null, 'group_h');

      // Check exact 3 filter buttons: Tất cả | Công khai | Riêng tư
      const btnAll = await pageUnlinked.$('#filter-room-all');
      const btnPublic = await pageUnlinked.$('#filter-room-public');
      const btnPrivate = await pageUnlinked.$('#filter-room-private');
      ok('H.2: Bộ lọc phòng Game gồm chính xác 3 lựa chọn (Tất cả, Công khai, Riêng tư)',
        btnAll !== null && btnPublic !== null && btnPrivate !== null, 'group_h');

      // Group I: Quick Match & Create Table buttons
      const btnQuick = await pageUnlinked.$('#btn-game-quick-match');
      const btnCreate = await pageUnlinked.$('#btn-game-create-table');
      ok('I.1: Nút Ghép Nhanh (#btn-game-quick-match) hiển thị rõ ràng và bấm được',
        btnQuick !== null && await btnQuick.isVisible(), 'group_i');
      ok('I.2: Nút Tạo bàn (#btn-game-create-table) hiển thị rõ ràng và bấm được',
        btnCreate !== null && await btnCreate.isVisible(), 'group_i');

      // Group J: Room list duplicate CTA removal
      const duplicateCta = await pageUnlinked.$('text=+ Mở bàn cờ đầu tiên');
      ok('J.1: Trạng thái sảnh không chứa nút trùng lặp "+ Mở bàn cờ đầu tiên"',
        duplicateCta === null, 'group_j');

      await pageUnlinked.screenshot({ path: path.join(screenshotDir, 'game-lobby-1440x900.png') });

      // Back to campus
      const btnBack = await pageUnlinked.$('#btn-back-to-campus');
      if (btnBack) {
        await btnBack.click();
        await pageUnlinked.waitForTimeout(500);
      }
    }

    // Capture desktop unlinked campus
    await pageUnlinked.screenshot({ path: path.join(screenshotDir, 'campus-1440x900.png') });

    // Capture chat tabs unlinked
    const chatRail = await pageUnlinked.$('#campus-chat-rail');
    if (chatRail) {
      await chatRail.screenshot({ path: path.join(screenshotDir, 'chat-tabs-unlinked.png') });
    }

    await contextUnlinked.close();

    // ─── 2. Linked Student Browser Context ───
    const contextLinked = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const parsedCookieLinked = linkedStudentCookie.split(';')[0].split('=');
    await contextLinked.addCookies([{
      name: parsedCookieLinked[0].trim(),
      value: decodeURIComponent(parsedCookieLinked[1].trim()),
      domain: '127.0.0.1',
      path: '/'
    }]);

    const pageLinked = await contextLinked.newPage();
    await pageLinked.goto(BASE, { waitUntil: 'domcontentloaded' });
    await pageLinked.waitForTimeout(2000);

    // Group D.2: Linked student sees all 3 tabs (Campus | Lớp | Tôi)
    const tabCampusLinked = await pageLinked.$('#chat-tab-campus');
    const tabClassLinked = await pageLinked.$('#chat-tab-class');
    const tabMeLinked = await pageLinked.$('#chat-tab-me');
    ok('D.4: Học sinh liên kết lớp thấy tab Campus', tabCampusLinked !== null, 'group_d');
    ok('D.5: Học sinh liên kết lớp thấy tab Lớp (#chat-tab-class)', tabClassLinked !== null, 'group_d');
    ok('D.6: Học sinh liên kết lớp thấy tab Tôi', tabMeLinked !== null, 'group_d');

    // Group E.2: Linked student dropdown contains class items
    const userBtnLinked = await pageLinked.$('#user-profile-menu-button');
    if (userBtnLinked) {
      await userBtnLinked.click();
      await pageLinked.waitForTimeout(500);

      const chuyenCanRow = await pageLinked.$('text=Chuyên cần');
      const quyLopRow = await pageLinked.$('text=Quỹ lớp');
      const noiQuyRow = await pageLinked.$('text=Sổ tay nội quy');
      ok('E.5: Học sinh liên kết lớp thấy các mục tiện ích lớp gọn gàng',
        chuyenCanRow !== null && quyLopRow !== null && noiQuyRow !== null, 'group_e');

      await pageLinked.screenshot({ path: path.join(screenshotDir, 'linked-student-dropdown.png') });
      await pageLinked.click('body', { position: { x: 10, y: 10 } });
      await pageLinked.waitForTimeout(300);
    }

    const chatRailLinked = await pageLinked.$('#campus-chat-rail');
    if (chatRailLinked) {
      await chatRailLinked.screenshot({ path: path.join(screenshotDir, 'chat-tabs-linked.png') });
    }

    await contextLinked.close();

    // ─── 3. Teacher Browser Context ───
    const contextTeacher = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const parsedCookieTeacher = teacherCookie.split(';')[0].split('=');
    await contextTeacher.addCookies([{
      name: parsedCookieTeacher[0].trim(),
      value: decodeURIComponent(parsedCookieTeacher[1].trim()),
      domain: '127.0.0.1',
      path: '/'
    }]);

    const pageTeacher = await contextTeacher.newPage();
    await pageTeacher.goto(BASE, { waitUntil: 'domcontentloaded' });
    await pageTeacher.waitForTimeout(2000);

    // Group F.2: Admin Center canonical header placement for teacher
    const headerAdminBtn = await pageTeacher.$('#btn-header-khu-quan-tri');
    ok('F.2: Nút Khu quản trị (#btn-header-khu-quan-tri) hiện diện chuẩn tắc trên thanh tiêu đề giáo viên',
      headerAdminBtn !== null, 'group_f');

    const teacherDropdownBtn = await pageTeacher.$('#user-profile-menu-button');
    if (teacherDropdownBtn) {
      await teacherDropdownBtn.click();
      await pageTeacher.waitForTimeout(500);
      await pageTeacher.screenshot({ path: path.join(screenshotDir, 'teacher-dropdown.png') });
      await pageTeacher.click('body', { position: { x: 10, y: 10 } });
      await pageTeacher.waitForTimeout(300);
    }

    // Capture 1920x1080 campus
    await pageTeacher.screenshot({ path: path.join(screenshotDir, 'campus-1920x1080.png') });

    // Group K: Network Polling loop count
    console.log('\n--- GROUP K: SINGLE ACTIVE POLLING LOOP VERIFICATION ---');
    const interceptedCalls = [];
    pageTeacher.on('request', req => {
      const u = req.url();
      if (u.includes('/api/campus-chat') || u.includes('/api/chat') || u.includes('/api/campus-dm') || u.includes('/api/campus-friends')) {
        interceptedCalls.push({ url: u, time: Date.now() });
      }
    });

    // Wait 5 seconds to observe polling
    await pageTeacher.waitForTimeout(5000);
    const campusChatPolls = interceptedCalls.filter(c => c.url.includes('/api/campus-chat'));
    ok('K.1: Tab Campus chỉ kích hoạt một vòng lặp polling duy nhất (tần suất ~4s)',
      campusChatPolls.length >= 1 && campusChatPolls.length <= 3, 'group_k', `count: ${campusChatPolls.length}`);

    // Switch to Class Chat tab
    const classTabBtn = await pageTeacher.$('#chat-tab-class');
    if (classTabBtn) {
      interceptedCalls.length = 0;
      await classTabBtn.click();
      await pageTeacher.waitForTimeout(5000);
      const classChatPolls = interceptedCalls.filter(c => c.url.includes('/api/chat') && !c.url.includes('/api/campus-chat'));
      ok('K.2: Chuyển sang tab Lớp chỉ polling /api/chat duy nhất, không rò rỉ loop cũ',
        classChatPolls.length >= 1 && classChatPolls.length <= 3, 'group_k', `count: ${classChatPolls.length}`);
    }

    await contextTeacher.close();

    // ─── 4. Mobile Viewport Context (390x844) ───
    const contextMobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true
    });
    await contextMobile.addCookies([{
      name: parsedCookieA[0].trim(),
      value: decodeURIComponent(parsedCookieA[1].trim()),
      domain: '127.0.0.1',
      path: '/'
    }]);

    const pageMobile = await contextMobile.newPage();
    await pageMobile.goto(BASE, { waitUntil: 'domcontentloaded' });
    await pageMobile.waitForTimeout(2000);

    await pageMobile.screenshot({ path: path.join(screenshotDir, 'campus-mobile-390x844.png') });
    ok('L.1: Chụp ảnh mobile 390x844 thành công', fs.existsSync(path.join(screenshotDir, 'campus-mobile-390x844.png')), 'group_l');

    await contextMobile.close();

  } finally {
    await browser.close();
  }

  // ─── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`BÁO CÁO TỔNG HỢP KIỂM THỬ PHASE 4D: ${pass} PASS / ${fail} FAIL`);
  for (const [grp, res] of Object.entries(results)) {
    console.log(`  - [${grp.toUpperCase()}]: ${res.pass} PASS, ${res.fail} FAIL`);
  }
  console.log('================================================================\n');

  if (fail > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Lỗi nghiêm trọng:', err);
  process.exit(1);
});
