/**
 * QA Automation Suite: Pre-Scale Security & Data-Correctness Gate
 * Checks A through N:
 * A. Revoked Teacher cannot publish
 * B. Pending Teacher cannot edit verified profile
 * C. Invalid avatar rejected (javascript:, data:, http:, //)
 * D. Profile endpoint never auto-creates privileged account
 * E. Guest cannot receive a named-student curated Highlight
 * F. Teacher Spotlight respects audience rules
 * G. Concurrent publish results in one coherent set
 * H. Failed replacement preserves old valid publication
 * I. Empty Admin editor does not inject fake highlights
 * J. Real Watch activity produces Watch aggregate Highlight
 * K. Active Caro shell persistent
 * L. Active Watch shell persistent
 * M. Active Focus shell persistent
 * N. Exactly ONE Campus Chat polling loop maximum
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import path from 'path';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

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

function queryDb(sql) {
  const safeSql = sql.replace(/\r?\n/g, ' ').replace(/"/g, '""');
  try {
    const raw = execSync(`npx wrangler d1 execute lop-10a7-db --local --command="${safeSql}" --json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed[0] && Array.isArray(parsed[0].results)) {
      return parsed[0].results;
    }
  } catch (err) {
    console.error('Lỗi truy vấn queryDb:', err.message);
  }
  return [];
}

async function run() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ: PRE-SCALE SECURITY & DATA-CORRECTNESS GATE');
  console.log(`Target Server: ${BASE}`);
  console.log('================================================================\n');

  // 0. Seed test fixtures into D1
  console.log('--- 0. SEEDING CANONICAL ACCOUNTS & FIXTURES ---');
  try {
    execSync('npx wrangler d1 execute lop-10a7-db --local --file="cong-cu/seed-qa-prescale.sql" -y', { stdio: 'ignore' });
    console.log('  -> Đã nạp thành công canonical accounts: 99801 (GV), 99802 (Pending), 99803 (Revoked), 99804 (HS).');
  } catch (e) {
    console.warn('  Cảnh báo seed D1:', e.message);
  }

  const realTeacherCookie = await taoSessionCookie({
    accountId: 99801,
    username: 'gv_prescale_real',
    role: 'teacher',
    ten: 'Thầy Phát Test',
    lopId: 1,
    teacherPending: false
  });

  const pendingTeacherCookie = await taoSessionCookie({
    accountId: 99802,
    username: 'gv_pending_test',
    role: 'teacher',
    ten: 'Thầy Chờ Duyệt',
    lopId: 1,
    teacherPending: true
  });

  const revokedTeacherCookie = await taoSessionCookie({
    accountId: 99803,
    username: 'gv_revoked_test',
    role: 'teacher',
    ten: 'Thầy Bị Khóa',
    lopId: 1,
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

  const unlinkedTeacherSessionCookie = await taoSessionCookie({
    role: 'teacher',
    username: 'gv_legacy_no_account',
    ten: 'Giáo viên Chưa Link Account',
    lopId: 1,
    teacherPending: false
  });

  // ─── 1. TEACHER AUTHORIZATION & SESSION REVOCATION GATE (A, B, D) ───────────
  console.log('\n--- 1. TEACHER AUTHORIZATION & REVOCATION (A, B, D) ---');

  // Check 1.1: Real verified teacher can publish
  const resPubValid = await api('/api/campus-highlights', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: {
      action: 'publish',
      items: [{
        title: 'Hoạt động thể thao trường',
        subtitle: 'Giải bóng chuyền giao lưu các khối lớp',
        icon: '🏐',
        badge: 'THỂ THAO',
        category: 'Hoạt động',
        actionType: 'event',
        sourceType: 'manual',
        audience: 'school'
      }]
    }
  });
  ok('Giáo viên xác thực xuất bản thành công (200 OK)', resPubValid.status === 200, 'auth_gate');

  // Check 1.2: Check A — Revoked/Disabled teacher cannot publish
  const resPubRevoked = await api('/api/campus-highlights', {
    method: 'POST',
    cookie: revokedTeacherCookie,
    body: {
      action: 'publish',
      items: [{ title: 'Spam từ tài khoản bị khóa', subtitle: 'Test', actionType: 'event' }]
    }
  });
  ok('Check A: Tài khoản GV bị khóa không thể xuất bản (403 Forbidden)', resPubRevoked.status === 403, 'auth_gate');

  // Check 1.3: Dynamic DB revocation test
  queryDb("UPDATE tai_khoan_campus SET dang_hoat_dong = 0 WHERE id = 99801;");
  const resPubDynamicRevoked = await api('/api/campus-highlights', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: {
      action: 'publish',
      items: [{ title: 'Thử xuất bản sau khi bị khóa DB', subtitle: 'Test', actionType: 'event' }]
    }
  });
  ok('Check A.2: Cookie cũ của GV bị khóa DB lập tức bị từ chối xuất bản (403)', resPubDynamicRevoked.status === 403, 'auth_gate');
  queryDb("UPDATE tai_khoan_campus SET dang_hoat_dong = 1 WHERE id = 99801;");

  // Check 1.4: Check B — Pending teacher cannot access or edit verified profile
  const resGetPendingProfile = await api('/api/gv/ho-so', {
    method: 'GET',
    cookie: pendingTeacherCookie
  });
  ok('Check B.1: Giáo viên chờ duyệt bị từ chối GET hồ sơ (403 Forbidden)', resGetPendingProfile.status === 403, 'auth_gate');

  const resPostPendingProfile = await api('/api/gv/ho-so', {
    method: 'POST',
    cookie: pendingTeacherCookie,
    body: { tenHienThi: 'Tên Hacker' }
  });
  ok('Check B.2: Giáo viên chờ duyệt bị từ chối POST hồ sơ (403 Forbidden)', resPostPendingProfile.status === 403, 'auth_gate');

  // Check 1.5: Check D — Profile endpoint never auto-creates privileged accounts
  const resUnlinkedProfileGet = await api('/api/gv/ho-so', {
    method: 'GET',
    cookie: unlinkedTeacherSessionCookie
  });
  ok('Check D.1: Session chưa link account bị từ chối GET với 409 account_link_required',
    resUnlinkedProfileGet.status === 409 && resUnlinkedProfileGet.data.loi === 'account_link_required', 'auth_gate');

  const resUnlinkedProfilePost = await api('/api/gv/ho-so', {
    method: 'POST',
    cookie: unlinkedTeacherSessionCookie,
    body: { tenHienThi: 'Tự phong giáo viên' }
  });
  ok('Check D.2: Session chưa link account bị từ chối POST với 409 account_link_required',
    resUnlinkedProfilePost.status === 409 && resUnlinkedProfilePost.data.loi === 'account_link_required', 'auth_gate');

  const localAuthRows = queryDb("SELECT id FROM tai_khoan_campus WHERE mat_khau_hash = 'LOCAL_AUTH';");
  ok('Check D.3: CSDL tuyệt đối KHÔNG có tài khoản placeholder LOCAL_AUTH tự sinh', localAuthRows.length === 0, 'auth_gate');

  // ─── 2. AVATAR SECURITY VALIDATION (C) ─────────────────────────────────────
  console.log('\n--- 2. AVATAR SECURITY VALIDATION (C) ---');

  // Safe HTTPS URL allowed
  const resAvSafeHttps = await api('/api/gv/ho-so', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: {
      tenHienThi: 'Thầy Lê Đình Phát',
      avatar: 'https://cdn.school.edu.vn/images/teacher.jpg',
      tieuDeHoSo: 'Giáo viên Chủ nhiệm 10A7'
    }
  });
  ok('URL avatar HTTPS hợp lệ được chấp thuận (200 OK)', resAvSafeHttps.status === 200, 'avatar_sec');

  // Safe internal path allowed
  const resAvSafeInternal = await api('/api/gv/ho-so', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: {
      tenHienThi: 'Thầy Lê Đình Phát',
      avatar: '/assets/avatars/teacher-1.png'
    }
  });
  ok('Đường dẫn avatar nội bộ /assets/... được chấp thuận (200 OK)', resAvSafeInternal.status === 200, 'avatar_sec');

  // Reject javascript:
  const resAvJs = await api('/api/gv/ho-so', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: {
      tenHienThi: 'Thầy Lê Đình Phát',
      avatar: 'javascript:alert(document.cookie)'
    }
  });
  ok('Check C.1: Từ chối protocol javascript: độc hại (400 Bad Request)', resAvJs.status === 400, 'avatar_sec');

  // Reject data:
  const resAvData = await api('/api/gv/ho-so', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: {
      tenHienThi: 'Thầy Lê Đình Phát',
      avatar: 'data:image/svg+xml;base64,PHN2Zy...'
    }
  });
  ok('Check C.2: Từ chối URL dạng data: (400 Bad Request)', resAvData.status === 400, 'avatar_sec');

  // Reject insecure http:
  const resAvHttp = await api('/api/gv/ho-so', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: {
      tenHienThi: 'Thầy Lê Đình Phát',
      avatar: 'http://insecure-domain.com/pic.png'
    }
  });
  ok('Check C.3: Từ chối URL không bảo mật http:// (400 Bad Request)', resAvHttp.status === 400, 'avatar_sec');

  // Reject protocol-relative //evil
  const resAvProtoRel = await api('/api/gv/ho-so', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: {
      tenHienThi: 'Thầy Lê Đình Phát',
      avatar: '//evil.attacker.com/malicious.png'
    }
  });
  ok('Check C.4: Từ chối URL dạng //evil... (400 Bad Request)', resAvProtoRel.status === 400, 'avatar_sec');

  // ─── 3. GUEST PRIVACY & AUDIENCE BOUNDARY (E, F) ───────────────────────────
  console.log('\n--- 3. GUEST HIGHLIGHT PRIVACY & AUDIENCE BOUNDARY (E, F) ---');

  // Teacher publishes one school-only item with student name and one public item
  const resPubMixed = await api('/api/campus-highlights', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: {
      action: 'publish',
      items: [
        {
          title: 'Nguyễn Văn An thắng 5 trận Caro',
          subtitle: 'Kỷ lục đấu trường toàn trường',
          icon: '🏆',
          badge: 'VINH DANH',
          category: 'Game',
          actionType: 'game',
          sourceType: 'manual',
          audience: 'school'
        },
        {
          title: 'Tuần lễ đọc sách thư viện 10A7',
          subtitle: 'Phát động phong trào đọc sách toàn trường',
          icon: '📖',
          badge: 'SỰ KIỆN',
          category: 'Hoạt động',
          actionType: 'event',
          sourceType: 'manual',
          audience: 'public'
        }
      ]
    }
  });
  ok('Giáo viên xuất bản tập tiêu điểm phân định audience thành công (200 OK)', resPubMixed.status === 200, 'privacy');

  // Linked student reads highlights
  const resStudentGet = await api('/api/campus-highlights', {
    method: 'GET',
    cookie: linkedStudentCookie
  });
  const studentHighlights = resStudentGet.data.highlights || [];
  const studentSeesStudentName = studentHighlights.some(h => (h.title || '').includes('Nguyễn Văn An'));
  ok('Check F.1: Học sinh liên kết nhìn thấy tiêu điểm nội bộ trường có tên học sinh', studentSeesStudentName, 'privacy');

  // Anonymous Guest reads highlights
  const resGuestGet = await api('/api/campus-highlights', {
    method: 'GET'
  });
  const guestHighlights = resGuestGet.data.highlights || [];
  const guestRawJson = JSON.stringify(resGuestGet.data);
  const guestHasStudentName = guestRawJson.includes('Nguyễn Văn An');
  ok('Check E: Khách vãng lai TUYỆT ĐỐI KHÔNG nhận được tên học sinh "Nguyễn Văn An"', !guestHasStudentName, 'privacy');

  const guestSeesPublicItem = guestHighlights.some(h => (h.title || '').includes('Tuần lễ đọc sách'));
  ok('Check F.2: Khách vãng lai nhận được tiêu điểm công khai (audience = public)', guestSeesPublicItem, 'privacy');

  // ─── 4. ATOMIC REPLACEMENT & CONCURRENCY (G, H) ────────────────────────────
  console.log('\n--- 4. ATOMIC REPLACEMENT & CONCURRENCY (G, H) ---');

  // Check H: Failed publication preserves previously valid set
  const resFailedPub = await api('/api/campus-highlights', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: {
      action: 'publish',
      items: [
        {
          title: 'A', // invalid: < 2 characters
          actionType: 'invalid_action_type'
        }
      ]
    }
  });
  ok('Gửi payload tiêu điểm không hợp lệ bị từ chối 400', resFailedPub.status === 400, 'atomic_pub');

  const resVerifyOldSet = await api('/api/campus-highlights', {
    method: 'GET',
    cookie: linkedStudentCookie
  });
  const oldSetPreserved = (resVerifyOldSet.data.highlights || []).some(h => (h.title || '').includes('Nguyễn Văn An'));
  ok('Check H: Sau khi xuất bản lỗi, tập tiêu điểm hợp lệ trước đó ĐƯỢC GIỮ NGUYÊN vẹn', oldSetPreserved, 'atomic_pub');

  // Check G: Concurrent publication results in one coherent set
  const pubPromise1 = api('/api/campus-highlights', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: {
      action: 'publish',
      items: [
        { title: 'Tập A - Mục 1', subtitle: 'Sub A1', actionType: 'game', audience: 'school' },
        { title: 'Tập A - Mục 2', subtitle: 'Sub A2', actionType: 'event', audience: 'public' }
      ]
    }
  });

  const pubPromise2 = api('/api/campus-highlights', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: {
      action: 'publish',
      items: [
        { title: 'Tập B - Mục 1', subtitle: 'Sub B1', actionType: 'focus', audience: 'school' },
        { title: 'Tập B - Mục 2', subtitle: 'Sub B2', actionType: 'video', audience: 'public' }
      ]
    }
  });

  const [resC1, resC2] = await Promise.all([pubPromise1, pubPromise2]);
  ok('Hai request xuất bản đồng thời không gây lỗi máy chủ 500', resC1.status === 200 && resC2.status === 200, 'atomic_pub');

  const curRowsDb = queryDb("SELECT DISTINCT set_id, COUNT(*) as cnt FROM campus_highlight_curation GROUP BY set_id;");
  ok('Check G.1: Toàn bộ tiêu điểm hiện hành thuộc DUY NHẤT 1 publication set_id', curRowsDb.length === 1, 'atomic_pub');

  const activeTotalRows = queryDb("SELECT COUNT(*) as total FROM campus_highlight_curation WHERE active = 1;");
  const totalCount = activeTotalRows[0]?.total || 0;
  ok('Check G.2: Số lượng tiêu điểm hiện hành không vượt quá 4 mục (không bị trộn lẫn set)', totalCount <= 4, 'atomic_pub');

  // ─── 5. WATCH AUTO-HIGHLIGHT GENERATION (J) ────────────────────────────────
  console.log('\n--- 5. WATCH AUTO-HIGHLIGHT (J) ---');

  // Reset highlights to test automatic aggregation
  const resReset = await api('/api/campus-highlights', {
    method: 'POST',
    cookie: realTeacherCookie,
    body: { action: 'reset' }
  });
  ok('Reset tiêu điểm về nguồn tự động thành công (200 OK)', resReset.status === 200, 'watch_auto');

  const resAutoHighlights = await api('/api/campus-highlights', { method: 'GET' });
  const watchHl = (resAutoHighlights.data.highlights || []).find(h => h.loai === 'video');
  ok('Check J.1: Hoạt động Xem Chung thực tế sinh ra thẻ tiêu điểm video tự động', Boolean(watchHl), 'watch_auto');
  ok('Check J.2: Tiêu đề thẻ xem chung thể hiện số người đang xem', Boolean(watchHl && watchHl.title.includes('người đang xem chung')), 'watch_auto');

  // Check guest privacy: room name not in guest subtitle
  const guestSeesRoomName = (watchHl?.sub || '').includes('Rạp Phim Tài Liệu Khám Phá');
  ok('Check J.3: Khách vãng lai không bị lộ tên phòng riêng tư trong tiêu điểm xem chung', !guestSeesRoomName, 'watch_auto');

  // ─── 6. PLAYWRIGHT E2E: EMPTY ADMIN EDITOR (I) ─────────────────────────────
  console.log('\n--- 6. PLAYWRIGHT E2E: EMPTY ADMIN EDITOR (I) ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Add teacher auth cookie to browser context
  const token = await createToken(devSessionSecret, {
    accountId: 99801,
    username: 'gv_prescale_real',
    role: 'teacher',
    ten: 'Thầy Phát Test',
    lopId: 1,
    teacherPending: false
  }, 3600);

  await context.addCookies([{
    name: COOKIE_NAME,
    value: encodeURIComponent(token),
    domain: '127.0.0.1',
    path: '/'
  }]);

  const page = await context.newPage();
  await page.goto(`${BASE}/giao-vien/#/campus-highlights`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Check empty state
  const emptyStateElem = await page.$('#empty-highlights-state');
  const emptyText = emptyStateElem ? await emptyStateElem.innerText() : '';
  ok('Check I.1: Khi API không có curation, hiển thị trạng thái "Chưa có tiêu điểm"',
    emptyText.includes('Chưa có tiêu điểm'), 'admin_editor');

  const hasFakeCaro = await page.evaluate(() => document.body.innerText.includes('Đấu Trường Cờ Caro Đỉnh Cao'));
  const hasFakeLofi = await page.evaluate(() => document.body.innerText.includes('Phòng Tập Trung Lofi 24/7'));
  ok('Check I.2: Editor KHÔNG tự ý chèn thẻ fake Caro Arena hay Lofi 24/7', !hasFakeCaro && !hasFakeLofi, 'admin_editor');

  const btnThemSpotlight = await page.$('#btn-them-spotlight');
  ok('Check I.3: Có nút "+ Thêm Spotlight" để biên soạn thủ công', Boolean(btnThemSpotlight), 'admin_editor');
  console.log('\n--- 7. PLAYWRIGHT E2E: PERSISTENT SHELL ACROSS ACTIVE ROOMS (K, L, M, N) ---');

  // Đăng nhập học sinh định danh (Student) để tham gia Đấu trường Caro và các phòng Campus
  const studentToken = await createToken(devSessionSecret, {
    accountId: 99804,
    username: 'hs_linked_prescale',
    role: 'student',
    ten: 'Nguyễn Thị B',
    lopId: 1,
    hocSinhId: 2,
    teacherPending: false
  }, 3600);

  await context.addCookies([{
    name: COOKIE_NAME,
    value: encodeURIComponent(studentToken),
    domain: '127.0.0.1',
    path: '/'
  }]);

  // K. Active Caro Room
  await page.goto(`${BASE}/#/campus`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Click Game flagship to open lobby
  const gameCard = page.locator('#campus-space-game, #campus-flagship-spaces button:has-text("Game")').first();
  if (await gameCard.isVisible()) await gameCard.click();
  await page.waitForTimeout(600);

  // In Game Lobby, click on Caro to join or create
  await page.waitForSelector('#lobby-game');
  const btnVaoBan = page.locator('#lobby-game button:has-text("Vào bàn")').first();
  if (await btnVaoBan.isVisible()) {
    await btnVaoBan.click();
  } else {
    const btnQuick = page.locator('#lobby-game button:has-text("Ghép Nhanh"), #lobby-game button:has-text("Tạo bàn")').first();
    if (await btnQuick.isVisible()) await btnQuick.click();
  }
  const btnTaoModal = page.locator('button:has-text("Tạo Bàn Ngay")').first();
  if (await btnTaoModal.isVisible()) await btnTaoModal.click();
  await page.waitForTimeout(1500);

  const caroHighlightsVis = await page.$eval('#campus-highlights', el => el && el.offsetParent !== null).catch(() => false);
  const caroChatRailVis = await page.$eval('#campus-chat-rail', el => el && el.offsetParent !== null).catch(() => false);
  const caroCenterVis = await page.$eval('#campus-active-room-container', el => el && el.offsetParent !== null).catch(() => false);

  ok('Check K.1: Active Caro Room giữ cột Highlights bên trái', caroHighlightsVis, 'active_shell');
  ok('Check K.2: Active Caro Room giữ cột Campus Chat bên phải', caroChatRailVis, 'active_shell');
  ok('Check K.3: Active Caro Room hiển thị không gian trung tâm thi đấu', caroCenterVis, 'active_shell');

  // L. Active Watch Room
  const btnBackCampus = page.locator('#btn-back-to-campus-shell, #btn-back-to-campus, #btn-back-to-lobby').first();
  if (await btnBackCampus.isVisible()) {
    await btnBackCampus.click();
    await page.waitForTimeout(600);
  }
  if (await page.locator('#campus-flagship-spaces').isHidden()) {
    const btnBack = page.locator('#btn-back-to-campus-shell, #btn-back-to-campus, #btn-back-to-lobby').first();
    if (await btnBack.isVisible()) {
      await btnBack.click();
      await page.waitForTimeout(600);
    }
  }

  // Open Watch Lobby
  const watchCard = page.locator('#campus-space-cinema, [id*="space-cinema"]').first();
  if (await watchCard.isVisible()) await watchCard.click();
  await page.waitForTimeout(600);

  // In Watch Lobby, click on seeded room 9989 ("Vào")
  await page.waitForSelector('#lobby-watch');
  const btnJoinWatch = page.locator('#lobby-watch button:has-text("Vào"), #lobby-watch button:has-text("+ Tạo phòng")').first();
  if (await btnJoinWatch.isVisible()) {
    await btnJoinWatch.click();
    await page.waitForTimeout(1500);
  }

  const watchHighlightsVis = await page.$eval('#campus-highlights', el => el && el.offsetParent !== null).catch(() => false);
  const watchChatRailVis = await page.$eval('#campus-chat-rail', el => el && el.offsetParent !== null).catch(() => false);
  const watchActiveCenter = await page.$eval('#campus-active-room-container', el => el && el.offsetParent !== null).catch(() => false);

  ok('Check L.1: Active Watch Together giữ cột Highlights bên trái', watchHighlightsVis, 'active_shell');
  ok('Check L.2: Active Watch Together giữ cột Campus Chat bên phải', watchChatRailVis, 'active_shell');
  ok('Check L.3: Active Watch Together hiển thị giao diện xem chung trung tâm', watchActiveCenter, 'active_shell');

  // M. Active Focus Room
  const btnBackFromWatch = page.locator('#btn-back-to-campus-shell, #btn-back-to-campus, #btn-back-to-lobby').first();
  if (await btnBackFromWatch.isVisible()) {
    await btnBackFromWatch.click();
    await page.waitForTimeout(600);
  }
  if (await page.locator('#campus-flagship-spaces').isHidden()) {
    const btnBack = page.locator('#btn-back-to-campus-shell, #btn-back-to-campus, #btn-back-to-lobby').first();
    if (await btnBack.isVisible()) {
      await btnBack.click();
      await page.waitForTimeout(600);
    }
  }

  // Open Music/Focus Lobby
  const musicCard = page.locator('#campus-space-music, [id*="space-music"]').first();
  if (await musicCard.isVisible()) await musicCard.click();
  await page.waitForTimeout(600);

  // In Music Lobby, click on seeded room 9990 ("Vào")
  await page.waitForSelector('#lobby-music');
  const btnJoinFocus = page.locator('#lobby-music button:has-text("Vào"), #lobby-music button:has-text("+ Tạo phòng")').first();
  if (await btnJoinFocus.isVisible()) {
    await btnJoinFocus.click();
    await page.waitForTimeout(1500);
  }

  const focusHighlightsVis = await page.$eval('#campus-highlights', el => el && el.offsetParent !== null).catch(() => false);
  const focusChatRailVis = await page.$eval('#campus-chat-rail', el => el && el.offsetParent !== null).catch(() => false);
  const focusActiveCenter = await page.$eval('#campus-active-room-container', el => el && el.offsetParent !== null).catch(() => false);

  ok('Check M.1: Active Focus Pomodoro giữ cột Highlights bên trái', focusHighlightsVis, 'active_shell');
  ok('Check M.2: Active Focus Pomodoro giữ cột Campus Chat bên phải', focusChatRailVis, 'active_shell');
  ok('Check M.3: Active Focus Pomodoro hiển thị đồng hồ Pomodoro trung tâm', focusActiveCenter, 'active_shell');

  // N. Polling Loop Count Invariant (Exact 1 Polling Loop)
  let chatRequestCount = 0;
  page.on('request', req => {
    if (req.url().includes('/api/campus-chat')) {
      chatRequestCount++;
    }
  });

  // Measure requests inside active room over 8 seconds
  chatRequestCount = 0;
  await page.waitForTimeout(8000);
  // Polling rate is 4s, so in 8s should be 1-3 requests, NOT 4+ (which would indicate 2+ instances)
  ok('Check N: Trong phòng hoạt động đang mở: Có đúng 1 vòng lặp Campus Chat polling (~1 req / 4s)',
    chatRequestCount >= 1 && chatRequestCount <= 3, 'active_shell', `Số request: ${chatRequestCount}`);

  // ─── 8. MOBILE 390px RESPONSIVE ACTIVE ROOM EXPERIENCES ────────────────────
  console.log('\n--- 8. MOBILE (390px) RESPONSIVE & POLLING (K, L, M) ---');
  const mContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mContext.addCookies([{
    name: COOKIE_NAME,
    value: encodeURIComponent(studentToken),
    domain: '127.0.0.1',
    path: '/'
  }]);

  const mPage = await mContext.newPage();
  let mChatRequests = 0;
  mPage.on('request', req => {
    if (req.url().includes('/api/campus-chat')) mChatRequests++;
  });

  await mPage.goto(`${BASE}/#/campus`, { waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(1000);

  // Mobile overflow-x check on Home
  const mHomeOverflow = await mPage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('Mobile 390px Campus Home không tràn ngang (overflow-x = 0)', mHomeOverflow <= 0, 'mobile_active');

  // Open game lobby on mobile
  const mGameCard = mPage.locator('#campus-space-game, #campus-flagship-spaces button:has-text("Game")').first();
  if (await mGameCard.isVisible()) await mGameCard.click();
  await mPage.waitForTimeout(600);

  // Enter Caro on mobile
  await mPage.waitForSelector('#lobby-game');
  const mBtnVaoBan = mPage.locator('#lobby-game button:has-text("Vào bàn")').first();
  if (await mBtnVaoBan.isVisible()) {
    await mBtnVaoBan.click();
  } else {
    const mBtnQuick = mPage.locator('#lobby-game button:has-text("Ghép Nhanh"), #lobby-game button:has-text("Tạo bàn")').first();
    if (await mBtnQuick.isVisible()) await mBtnQuick.click();
  }
  const mBtnTaoModal = mPage.locator('button:has-text("Tạo Bàn Ngay")').first();
  if (await mBtnTaoModal.isVisible()) await mBtnTaoModal.click();
  await mPage.waitForTimeout(1500);

  const mCaroOverflow = await mPage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('Mobile 390px Active Caro không tràn ngang (overflow-x = 0)', mCaroOverflow <= 0, 'mobile_active');

  // Check 0 polling while mobile chat drawer is closed
  mChatRequests = 0;
  await mPage.waitForTimeout(6000);
  ok('Mobile 390px khi Chat Drawer đóng trong 6s: Đúng 0 request polling', mChatRequests === 0, 'mobile_active');

  // Open Chat Drawer on mobile
  const btnOpenMobileChat = mPage.locator('#mobile-active-campus-chat-btn, #mobile-campus-chat-btn').first();
  if (await btnOpenMobileChat.isVisible()) await btnOpenMobileChat.click();
  await mPage.waitForTimeout(600);

  mChatRequests = 0;
  await mPage.waitForTimeout(8000);
  ok('Mobile 390px khi Chat Drawer mở: Có đúng 1 vòng lặp polling', mChatRequests >= 1 && mChatRequests <= 3, 'mobile_active', `Số request: ${mChatRequests}`);

  await browser.close();

  // ─── FINAL SUMMARY ─────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`🏁 TỔNG KẾT PRE-SCALE SECURITY GATE: ${pass} PASS, ${fail} FAIL`);
  for (const [grp, res] of Object.entries(results)) {
    console.log(`  - [${grp.toUpperCase()}]: ${res.pass} PASS / ${res.pass + res.fail} TOTAL`);
  }
  console.log('================================================================\n');

  if (fail > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal pre-scale gate error:', err);
  process.exit(1);
});
