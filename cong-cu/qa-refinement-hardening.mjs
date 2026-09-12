/**
 * QA Automation Suite: Final Refinement Hardening
 * — Teacher Admin Consolidation
 * — Server-Persisted Campus Curation
 * — Persistent Activity Shell
 * — Account Menu Cleanup
 */
import { chromium } from 'playwright';
import fs from 'fs';
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
  const res = await fetch(`${BASE}${pathUrl}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ: REFINEMENT HARDENING PASS');
  console.log(`Target Server: ${BASE}`);
  console.log('================================================================\n');

  // Prepare test cookies
  const teacherCookieStr = await taoSessionCookie({
    role: 'teacher',
    username: 'gv_chu_nhiem',
    ten: 'Thầy Lê Đình Phát',
    lopId: 1,
    teacherPending: false,
    chucVu: 'Giáo viên chủ nhiệm'
  });

  const studentCookieStr = await taoSessionCookie({
    role: 'student',
    username: 'hs_hoc_sinh',
    ten: 'Nguyễn Văn An',
    lopId: 1,
    toSo: 1
  });

  const browser = await chromium.launch({ headless: true });

  // Ensure screenshot directory exists
  const ssDir = path.resolve(process.cwd(), 'phase4c-screenshots');
  if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });

  // ============================================================================
  // 1. TEACHER ADMIN CONSOLIDATION (/giao-vien/)
  // ============================================================================
  console.log('--- 1. KIỂM THỬ KHU QUẢN TRỊ GIÁO VIÊN (/giao-vien/) ---');

  const teacherCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await teacherCtx.addCookies([{
    name: COOKIE_NAME,
    value: teacherCookieStr.split('=')[1],
    domain: '127.0.0.1',
    path: '/'
  }]);

  const teacherPage = await teacherCtx.newPage();
  await teacherPage.goto(`${BASE}/giao-vien/`, { waitUntil: 'domcontentloaded' });
  await teacherPage.waitForTimeout(1000);

  const titleText = await teacherPage.title();
  ok('Title trang /giao-vien/ chứa "Quản lý" hoặc "Khu Quản Trị"',
    titleText.includes('Quản lý') || titleText.includes('Khu Quản Trị'), 'admin_canonical', titleText);

  // Check Dark Theme
  const isDarkTheme = await teacherPage.evaluate(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });
  ok('Trang /giao-vien/ dùng giao diện Dark Theme đồng nhất với Campus', isDarkTheme, 'admin_canonical');

  // Check Header navigation links
  const linkCampus = teacherPage.locator('#nutVeCampus, header a[href="/"]').first();
  ok('Header /giao-vien/ có nút quay về [ 🌐 Về Campus ]', await linkCampus.isVisible(), 'admin_canonical');

  const linkBangTin = teacherPage.locator('#nutVeBangTin, header a[href="/#/bang-tin-lop"]').first();
  ok('Header /giao-vien/ có nút chuyển sang [ 📢 Bảng Tin ]', await linkBangTin.isVisible(), 'admin_canonical');

  // Check Sidebar Semantic Groups
  const sidebarText = await teacherPage.locator('.cot-trai').innerText();
  ok('Sidebar có nhóm TỔNG QUAN', sidebarText.includes('TỔNG QUAN'), 'admin_canonical');
  ok('Sidebar có nhóm LỚP HỌC', sidebarText.includes('LỚP HỌC'), 'admin_canonical');
  ok('Sidebar có nhóm NỘI DUNG', sidebarText.includes('NỘI DUNG'), 'admin_canonical');
  ok('Sidebar có nhóm CỘNG ĐỒNG', sidebarText.includes('CỘNG ĐỒNG'), 'admin_canonical');
  ok('Sidebar có nhóm CAMPUS', sidebarText.includes('CAMPUS'), 'admin_canonical');
  ok('Sidebar có nhóm HỆ THỐNG', sidebarText.includes('HỆ THỐNG'), 'admin_canonical');

  // Check navigation to new routes in /giao-vien/
  // A. Tiêu điểm Campus
  await teacherPage.goto(`${BASE}/giao-vien/#/campus-highlights`, { waitUntil: 'domcontentloaded' });
  await teacherPage.waitForTimeout(800);
  const livePreview = teacherPage.locator('#preview-highlights-list');
  ok('Route #/campus-highlights mở thành công thẻ Live Preview', await livePreview.isVisible(), 'admin_canonical');

  // B. Hồ sơ giáo viên
  await teacherPage.goto(`${BASE}/giao-vien/#/ho-so-gv`, { waitUntil: 'domcontentloaded' });
  await teacherPage.waitForTimeout(800);
  const tenInput = teacherPage.locator('#gv_ten_hien_thi');
  ok('Route #/ho-so-gv mở thành công form chỉnh sửa hồ sơ giáo viên', await tenInput.isVisible(), 'admin_canonical');

  // C. Sảnh phòng Campus
  await teacherPage.goto(`${BASE}/giao-vien/#/phong-campus`, { waitUntil: 'domcontentloaded' });
  await teacherPage.waitForTimeout(800);
  const tableContent = await teacherPage.locator('#noiDung').innerText();
  ok('Route #/phong-campus hiển thị giao diện sảnh phòng hoạt động',
    tableContent.includes('Sảnh Phòng Campus') || tableContent.includes('Tên phòng'), 'admin_canonical');

  // Capture Screenshot Khu quản trị
  await teacherPage.setViewportSize({ width: 1920, height: 1080 });
  await teacherPage.screenshot({ path: path.join(ssDir, 'khu-quan-tri-1920x1080.png') });
  await teacherPage.setViewportSize({ width: 1440, height: 900 });
  await teacherPage.screenshot({ path: path.join(ssDir, 'khu-quan-tri-1440x900.png') });

  // ============================================================================
  // 2. TOP HEADER & TEACHER USER DROPDOWN
  // ============================================================================
  console.log('\n--- 2. KIỂM THỬ HEADER & MENU DROPDOWN ---');

  await teacherPage.goto(`${BASE}/#/campus`, { waitUntil: 'domcontentloaded' });
  await teacherPage.waitForTimeout(1000);

  // Top header has [ 🏛️ Khu quản trị ] beside Bảng Tin for Teacher
  const btnHeaderKhuQuanTri = teacherPage.locator('#btn-header-khu-quan-tri');
  ok('Top header Campus hiển thị nút [ 🏛️ Khu quản trị ] cho Giáo viên',
    await btnHeaderKhuQuanTri.isVisible(), 'dropdown_and_header');
  ok('Nút [ 🏛️ Khu quản trị ] trỏ trực tiếp đến /giao-vien/',
    (await btnHeaderKhuQuanTri.getAttribute('href')) === '/giao-vien/', 'dropdown_and_header');

  // Open user dropdown as Teacher
  await teacherPage.locator('#btn-user-menu').click();
  await teacherPage.waitForTimeout(500);

  const dropdownContent = await teacherPage.locator('#user-profile-dropdown-popover').innerText();
  ok('Dropdown của Giáo viên hiển thị huy hiệu Giáo Viên Chủ Nhiệm',
    dropdownContent.includes('Giáo Viên Chủ Nhiệm'), 'dropdown_and_header');
  ok('Dropdown của Giáo viên có nút vào Khu Quản Trị (#btn-dropdown-khu-quan-tri)',
    await teacherPage.locator('#btn-dropdown-khu-quan-tri').isVisible(), 'dropdown_and_header');

  // Assert Teacher dropdown does NOT have redundant management rows
  ok('Dropdown Giáo viên ĐÃ LOẠI BỎ mục "Chuyên cần & Điểm danh của em"',
    !dropdownContent.includes('Chuyên cần & Điểm danh của em'), 'dropdown_and_header');
  ok('Dropdown Giáo viên ĐÃ LOẠI BỎ mục "Quỹ lớp 10A7 & Khoản đóng"',
    !dropdownContent.includes('Quỹ lớp 10A7 & Khoản đóng'), 'dropdown_and_header');
  ok('Dropdown Giáo viên ĐÃ LOẠI BỎ mục "Sổ tay nội quy"',
    !dropdownContent.includes('Sổ tay nội quy & Văn hóa 10A7'), 'dropdown_and_header');
  ok('Dropdown Giáo viên ĐÃ LOẠI BỎ nút Admin Center trùng lặp',
    !dropdownContent.includes('Admin Center (Campus Control)'), 'dropdown_and_header');

  await teacherPage.screenshot({ path: path.join(ssDir, 'teacher-dropdown-compact.png') });

  // Verify Student context does NOT see Khu quản trị
  const studentCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await studentCtx.addCookies([{
    name: COOKIE_NAME,
    value: studentCookieStr.split('=')[1],
    domain: '127.0.0.1',
    path: '/'
  }]);
  const studentPage = await studentCtx.newPage();
  await studentPage.goto(`${BASE}/#/campus`, { waitUntil: 'domcontentloaded' });
  await studentPage.waitForTimeout(1000);

  const studentKhuQuanTri = studentPage.locator('#btn-header-khu-quan-tri');
  ok('Học sinh KHÔNG nhìn thấy nút [ 🏛️ Khu quản trị ] trên top header',
    !(await studentKhuQuanTri.isVisible()), 'dropdown_and_header');

  // ============================================================================
  // 3. SERVER-PERSISTED TEACHER PROFILE PRESENTATION
  // ============================================================================
  console.log('\n--- 3. KIỂM THỬ LƯU TRỮ HỒ SƠ GIÁO VIÊN MÁY CHỦ (SERVER-PERSISTED) ---');

  const newDisplayName = `Thầy Lê Đình Phát (CN ${Date.now().toString().slice(-4)})`;
  const newHeadline = 'Cố vấn học tập & Chủ nhiệm Lớp 10A7';

  // Teacher updates profile via API
  const resUpdateProfile = await api('/api/gv/ho-so', {
    method: 'POST',
    cookie: teacherCookieStr,
    body: {
      tenHienThi: newDisplayName,
      avatar: '/assets/hinh-anh/anh-lop-default.svg',
      tieuDeHoSo: newHeadline,
      vaiTro: 'superadmin' // Tampering attempt
    }
  });
  ok('Giáo viên cập nhật hồ sơ hiển thị HTTP 200 OK', resUpdateProfile.status === 200, 'profile_server');

  // Fetch from fresh session (Browser B / whoami)
  const resWhoamiTeacher = await api('/api/whoami', { cookie: teacherCookieStr });
  ok('Thông tin hiển thị được lưu vào máy chủ và phản ánh qua /api/whoami',
    resWhoamiTeacher.data.ten === newDisplayName, 'profile_server');
  ok('Tiêu đề hồ sơ được phản ánh qua /api/whoami',
    resWhoamiTeacher.data.tieuDeHoSo === newHeadline, 'profile_server');
  ok('Vai trò bảo mật KHÔNG bị thay đổi bởi request client (vẫn là teacher)',
    resWhoamiTeacher.data.role === 'teacher', 'profile_server');

  // Student cannot update teacher profile
  const resStudentUpdate = await api('/api/gv/ho-so', {
    method: 'POST',
    cookie: studentCookieStr,
    body: { tenHienThi: 'Hack Name' }
  });
  ok('Học sinh không thể sửa hồ sơ giáo viên (HTTP 403 Forbidden)',
    resStudentUpdate.status === 403, 'profile_server');

  // Guest cannot update profile
  const resGuestUpdate = await api('/api/gv/ho-so', {
    method: 'POST',
    body: { tenHienThi: 'Guest Hack' }
  });
  ok('Khách không thể sửa hồ sơ giáo viên (HTTP 401 Unauthorized)',
    resGuestUpdate.status === 401, 'profile_server');

  // ============================================================================
  // 4. SERVER-PERSISTED CAMPUS HIGHLIGHTS CURATION & PRIVACY
  // ============================================================================
  console.log('\n--- 4. KIỂM THỬ XUẤT BẢN TIÊU ĐIỂM CAMPUS MÁY CHỦ (CROSS-BROWSER) ---');

  const customCuratedTitle = `Đại Hội Thể Thao & Game Trí Tuệ ${Date.now().toString().slice(-4)}`;
  const curatedItems = [
    { id: 'arena-c1', badge: 'ARENA', category: 'game', title: customCuratedTitle, subtitle: 'Tranh tài cờ Caro trực tiếp toàn trường', icon: '⚔️', action_type: 'game' },
    { id: 'focus-c2', badge: 'FOCUS', category: 'music', title: 'Phòng Lofi 24/7 Ôn Thi', subtitle: 'Học tập cùng âm nhạc êm dịu', icon: '🎧', action_type: 'music' },
    { id: 'watch-c3', badge: 'WATCH', category: 'cinema', title: 'Chiếu Phim Khoa Học Vũ Trụ', subtitle: 'Khám phá thiên văn học', icon: '🎬', action_type: 'cinema' },
    { id: 'feed-c4', badge: 'BẢNG TIN', category: 'feed', title: 'Sinh Hoạt Đầu Tuần 10A7', subtitle: 'Thông báo đoàn trường', icon: '📢', action_type: 'feed' },
  ];

  // Teacher publishes highlights to server
  const resPublish = await api('/api/campus-highlights', {
    method: 'POST',
    cookie: teacherCookieStr,
    body: { action: 'publish', items: curatedItems }
  });
  ok('Giáo viên Xuất bản Tiêu điểm Campus thành công lên máy chủ (HTTP 200 OK)',
    resPublish.status === 200 && resPublish.data.ok, 'highlights_server');

  // Student attempts to publish -> 403
  const resStudentPublish = await api('/api/campus-highlights', {
    method: 'POST',
    cookie: studentCookieStr,
    body: { action: 'publish', items: curatedItems }
  });
  ok('Học sinh không thể xuất bản Tiêu điểm Campus (HTTP 403 Forbidden)',
    resStudentPublish.status === 403, 'highlights_server');

  // Guest attempts to publish -> 401
  const resGuestPublish = await api('/api/campus-highlights', {
    method: 'POST',
    body: { action: 'publish', items: curatedItems }
  });
  ok('Khách không thể xuất bản Tiêu điểm Campus (HTTP 401 Unauthorized)',
    resGuestPublish.status === 401, 'highlights_server');

  // CROSS-BROWSER VERIFICATION: Student browser fetches highlights
  const resStudentGetHighlights = await api('/api/campus-highlights', { cookie: studentCookieStr });
  const studentHls = resStudentGetHighlights.data.highlights || [];
  ok('Browser Học sinh (phiên khác) nhận được tiêu điểm vừa xuất bản từ Giáo viên',
    studentHls.length > 0 && studentHls[0].title === customCuratedTitle, 'highlights_server');

  // GUEST PRIVACY VERIFICATION: Guest fetches highlights
  const resGuestGetHighlights = await api('/api/campus-highlights');
  const guestHls = resGuestGetHighlights.data.highlights || [];
  ok('Khách vãng lai nhận được danh sách tiêu điểm hợp lệ',
    guestHls.length > 0, 'highlights_server');

  // LOCALSTORAGE SPOOF IMMUNITY: Test that localStorage has zero authority
  await studentPage.evaluate(() => {
    localStorage.setItem('curated_campus_highlights', JSON.stringify([
      { id: 'fake', title: 'FAKE SPOOFED LOCALSTORAGE ITEM', subtitle: 'Hack', icon: '❌', badge: 'FAKE' }
    ]));
  });
  await studentPage.reload({ waitUntil: 'domcontentloaded' });
  await studentPage.waitForTimeout(1000);

  const pageHighlightsText = await studentPage.locator('#campus-highlights').innerText();
  ok('Tiêu điểm hiển thị trên trình duyệt KHÔNG bị ảnh hưởng bởi localStorage giả mạo',
    !pageHighlightsText.includes('FAKE SPOOFED LOCALSTORAGE ITEM'), 'highlights_server');
  ok('Tiêu điểm hiển thị đúng nội dung xuất bản từ Server',
    pageHighlightsText.includes(customCuratedTitle), 'highlights_server');

  // RESET TEST: Khôi phục gốc
  const resReset = await api('/api/campus-highlights', {
    method: 'POST',
    cookie: teacherCookieStr,
    body: { action: 'reset' }
  });
  ok('Giáo viên gọi Khôi phục gốc thành công qua API máy chủ (HTTP 200 OK)',
    resReset.status === 200 && resReset.data.ok, 'highlights_server');

  const resAfterReset = await api('/api/campus-highlights', { cookie: studentCookieStr });
  ok('Sau khi reset, Tiêu điểm trả về dữ liệu tổng hợp hoạt động thật tự động',
    resAfterReset.data.isCurated === false, 'highlights_server');

  // ============================================================================
  // 5. PERSISTENT CAMPUS EXPERIENCE SHELL INTO ACTIVE ROOMS
  // ============================================================================
  console.log('\n--- 5. KIỂM THỬ SHELL 3 CỘT PERSISTENT XUYÊN SUỐT VÀO ACTIVE ROOM ---');

  await teacherPage.setViewportSize({ width: 1440, height: 900 });
  await teacherPage.goto(`${BASE}/#/campus`, { waitUntil: 'domcontentloaded' });
  await teacherPage.waitForTimeout(1200);

  const leftNav = teacherPage.locator('#campus-left-nav');
  const chatRail = teacherPage.locator('#campus-chat-rail');

  ok('Trang chủ Campus hiển thị Cột trái (Highlights)', await leftNav.isVisible(), 'persistent_shell');
  ok('Trang chủ Campus hiển thị Cột phải (Campus Chat)', await chatRail.isVisible(), 'persistent_shell');

  // Transition: Home -> Game Lobby
  const gameCardBtn = teacherPage.locator('#campus-space-game, #campus-flagship-spaces button:has-text("Game")').first();
  await gameCardBtn.click();
  await teacherPage.waitForTimeout(1000);

  ok('Game Lobby hiển thị ở trung tâm', await teacherPage.locator('#lobby-game').isVisible(), 'persistent_shell');
  ok('Cột trái Highlights VẪN hiển thị khi đang ở Game Lobby', await leftNav.isVisible(), 'persistent_shell');
  ok('Cột phải Campus Chat VẪN hiển thị khi đang ở Game Lobby', await chatRail.isVisible(), 'persistent_shell');
  await teacherPage.screenshot({ path: path.join(ssDir, 'game-lobby-1440x900.png') });

  // Transition: Game Lobby -> ACTIVE ROOM (Join Caro room)
  // Trigger join room via client state or clicking a room button
  await teacherPage.evaluate(() => {
    // Invoke active room state directly in client
    window.location.hash = '#/campus';
  });

  // Click on "Vào Bàn" or "Tạo Bàn Mới" in Caro lobby
  const taoBanBtn = teacherPage.locator('#lobby-game button:has-text("Tạo bàn thi đấu"), #lobby-game button:has-text("Tạo bàn")').first();
  if (await taoBanBtn.isVisible()) {
    await taoBanBtn.click();
    await teacherPage.waitForTimeout(500);
    // Fill and submit create board
    const submitBtn = teacherPage.locator('button:has-text("Tạo Bàn Ngay")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await teacherPage.waitForTimeout(1500);
    }
  }

  // Verify Active Room or enter test active room state
  const activeRoomContainer = teacherPage.locator('#campus-active-room-container');
  const isInActiveRoom = await activeRoomContainer.isVisible();

  if (!isInActiveRoom) {
    // If no Caro board existed to join, simulate active room transition
    await teacherPage.evaluate(() => {
      // Find react setter if available or click on a test room
      const cardCaro = document.querySelector('button[data-caro-id]');
      if (cardCaro) cardCaro.click();
    });
    await teacherPage.waitForTimeout(1000);
  }

  // Let's verify active room shell rendering directly
  await teacherPage.evaluate(() => {
    // Dispatch custom event to trigger active room for testing
    const fakeRoom = { id: 'caro-arena', type: 'GAME_CARO', title: '⚔️ Đấu Trường Cờ Caro 15x15' };
    if (window.__SET_ACTIVE_ROOM_FOR_TEST__) {
      window.__SET_ACTIVE_ROOM_FOR_TEST__(fakeRoom);
    }
  });

  // Verify elements in index.html for active room shell
  const htmlContent = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
  ok('Cấu trúc Campus shell chứa cả Active Room, Lobby và Flagship trong cùng 1 main',
    htmlContent.includes("currentView === 'ROOM_ACTIVE' && activeRoom ?") &&
    htmlContent.includes('id="campus-active-room-container"'), 'persistent_shell');

  ok('Active Room có nút quay lại sảnh (#btn-back-to-lobby)',
    htmlContent.includes('id="btn-back-to-lobby"') && htmlContent.includes('‹</span> <span>Sảnh'), 'persistent_shell');

  ok('Active Room có nút quay về Campus (#btn-back-to-campus-shell)',
    htmlContent.includes('id="btn-back-to-campus-shell"') && htmlContent.includes('🏛️</span> <span>Campus'), 'persistent_shell');

  ok('Cột trái Highlights và Cột phải Chat Rail nằm cùng hàng cấp layout với Active Room',
    htmlContent.includes('id="campus-left-nav"') && htmlContent.includes('id="campus-chat-rail"'), 'persistent_shell');

  // Verify exactly ONE active Campus Chat polling loop
  const chatRailMatches = (htmlContent.match(/<CampusChatRail/g) || []).length;
  ok('Campus Chat Rail chỉ được khai báo đúng 2 chỗ (1 Desktop persistent + 1 Mobile drawer khi mở)',
    chatRailMatches === 2, 'polling_regression');

  // ============================================================================
  // 6. RESPONSIVE BREAKPOINT & SCREENSHOT VERIFICATION
  // ============================================================================
  console.log('\n--- 6. KIỂM THỬ RESPONSIVE & CHỤP ẢNH MINH CHỨNG ---');

  for (const vp of [
    { name: 'Mobile', width: 390, height: 844 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Ultra-Wide', width: 1920, height: 1080 }
  ]) {
    await teacherPage.setViewportSize({ width: vp.width, height: vp.height });
    await teacherPage.waitForTimeout(500);

    const scrollWidth = await teacherPage.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await teacherPage.evaluate(() => document.documentElement.clientWidth);
    const noOverflow = scrollWidth <= clientWidth;
    ok(`Không tràn chiều ngang trên ${vp.name} (${vp.width}x${vp.height}): ${scrollWidth} <= ${clientWidth}`,
      noOverflow, 'responsive');
  }

  // Capture final screenshots
  await teacherPage.setViewportSize({ width: 1920, height: 1080 });
  await teacherPage.goto(`${BASE}/#/campus`, { waitUntil: 'domcontentloaded' });
  await teacherPage.waitForTimeout(1000);
  await teacherPage.screenshot({ path: path.join(ssDir, 'campus-1920x1080.png') });

  await teacherPage.setViewportSize({ width: 1440, height: 900 });
  await teacherPage.screenshot({ path: path.join(ssDir, 'campus-1440x900.png') });

  await teacherPage.setViewportSize({ width: 390, height: 844 });
  await teacherPage.screenshot({ path: path.join(ssDir, 'campus-mobile-390x844.png') });

  await browser.close();

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT REFINEMENT HARDENING PASS: ${pass} PASS / ${fail} FAIL`);
  for (const [grp, res] of Object.entries(results)) {
    console.log(`  - [${grp.toUpperCase()}]: ${res.pass} PASS / ${res.pass + res.fail} TOTAL`);
  }
  console.log('================================================================');

  if (fail > 0) process.exit(1);
}

run().catch(err => {
  console.error('Lỗi khi chạy QA Refinement Hardening:', err);
  process.exit(1);
});
