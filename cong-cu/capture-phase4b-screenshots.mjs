// cong-cu/capture-phase4b-screenshots.mjs
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const OUT_DIR = path.resolve('docs/phase4b-screenshots');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const browser = await chromium.launch();

try {
  console.log('Capturing Phase 4B screenshots...');

  // 1. Campus Guest Desktop (1920x1080)
  const ctxGuest = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const pageGuest = await ctxGuest.newPage();
  await pageGuest.goto(BASE, { waitUntil: 'domcontentloaded' });
  await pageGuest.waitForTimeout(1500);
  await pageGuest.screenshot({ path: path.join(OUT_DIR, '01-campus-guest-desktop.png'), fullPage: false });
  console.log('  -> 01-campus-guest-desktop.png');

  // 2. Login Modal
  await pageGuest.locator('#btn-header-dang-nhap').click();
  await pageGuest.waitForTimeout(500);
  await pageGuest.screenshot({ path: path.join(OUT_DIR, '02-modal-login.png'), fullPage: false });
  console.log('  -> 02-modal-login.png');

  // 3. Register Modal
  await pageGuest.locator('#tab-btn-register').click();
  await pageGuest.waitForTimeout(500);
  await pageGuest.screenshot({ path: path.join(OUT_DIR, '03-modal-register.png'), fullPage: false });
  console.log('  -> 03-modal-register.png');

  // Close auth modal
  await pageGuest.locator('#modal-auth button[aria-label="Đóng"]').first().click();
  await pageGuest.waitForTimeout(300);

  // 4. Announcement Detail Modal
  const tickerBtn = pageGuest.locator('#campus-announcement-ticker button').first();
  if (await tickerBtn.count()) {
    await tickerBtn.click({ force: true });
    await pageGuest.waitForTimeout(500);
    await pageGuest.screenshot({ path: path.join(OUT_DIR, '04-modal-announcement-detail.png'), fullPage: false });
    console.log('  -> 04-modal-announcement-detail.png');
    await pageGuest.locator('#modal-announcement-detail button:has-text("Đóng"), #modal-announcement-detail button[aria-label="Đóng"]').first().click();
    await pageGuest.waitForTimeout(300);
  }

  // 5. Watch Lobby
  await pageGuest.locator('#campus-flagship-spaces button:has-text("Xem chung")').first().click();
  await pageGuest.waitForTimeout(500);
  await pageGuest.screenshot({ path: path.join(OUT_DIR, '05-lobby-watch.png'), fullPage: false });
  console.log('  -> 05-lobby-watch.png');
  await pageGuest.locator('#lobby-watch button:has-text("Trở về Campus")').first().click();
  await pageGuest.waitForTimeout(300);

  // 6. Game Lobby
  await pageGuest.locator('#campus-flagship-spaces button:has-text("Game")').first().click();
  await pageGuest.waitForTimeout(500);
  await pageGuest.screenshot({ path: path.join(OUT_DIR, '06-lobby-game.png'), fullPage: false });
  console.log('  -> 06-lobby-game.png');
  await pageGuest.locator('#lobby-game button:has-text("Trở về Campus")').first().click();
  await pageGuest.waitForTimeout(300);

  // 7. Music Lobby
  await pageGuest.locator('#campus-flagship-spaces button:has-text("Music")').first().click();
  await pageGuest.waitForTimeout(500);
  await pageGuest.screenshot({ path: path.join(OUT_DIR, '07-lobby-music.png'), fullPage: false });
  console.log('  -> 07-lobby-music.png');
  await pageGuest.locator('#lobby-music button:has-text("Trở về Campus")').first().click();
  await pageGuest.waitForTimeout(300);

  // 8. Chat Lobby
  await pageGuest.locator('#campus-flagship-spaces button:has-text("Chat")').first().click();
  await pageGuest.waitForTimeout(500);
  await pageGuest.screenshot({ path: path.join(OUT_DIR, '08-lobby-chat.png'), fullPage: false });
  console.log('  -> 08-lobby-chat.png');
  await pageGuest.locator('#lobby-chat button:has-text("Trở về Campus")').first().click();
  await pageGuest.waitForTimeout(300);

  // 9. Mobile Home (390x844)
  const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageMobile = await ctxMobile.newPage();
  await pageMobile.goto(BASE, { waitUntil: 'domcontentloaded' });
  await pageMobile.waitForTimeout(1500);
  await pageMobile.screenshot({ path: path.join(OUT_DIR, '09-mobile-home-390px.png'), fullPage: false });
  console.log('  -> 09-mobile-home-390px.png');
  await ctxMobile.close();

  // 10. Logged-in Student & User Dropdown
  const studentUser = `student_ss_${Date.now()}`;
  const testPass = 'StudentPass123!';
  const ctxStudent = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxStudent.request.post(`${BASE}/api/register`, {
    data: { username: studentUser, displayName: 'Lê Học Sinh Test', password: testPass, accountType: 'student' }
  });
  await ctxStudent.request.post(`${BASE}/api/login`, {
    data: { username: studentUser, password: testPass }
  });
  const pageStudent = await ctxStudent.newPage();
  await pageStudent.goto(BASE, { waitUntil: 'domcontentloaded' });
  await pageStudent.waitForTimeout(1500);
  await pageStudent.screenshot({ path: path.join(OUT_DIR, '10-campus-student-desktop.png'), fullPage: false });
  console.log('  -> 10-campus-student-desktop.png');

  // Open user dropdown
  await pageStudent.locator('#btn-user-menu').click();
  await pageStudent.waitForTimeout(300);
  await pageStudent.screenshot({ path: path.join(OUT_DIR, '11-student-user-dropdown.png'), fullPage: false });
  console.log('  -> 11-student-user-dropdown.png');

  // Close user dropdown
  const backdrop = pageStudent.locator('.fixed.inset-0.z-40');
  if (await backdrop.count() > 0) {
    await backdrop.click();
  } else {
    await pageStudent.locator('#btn-user-menu').click({ force: true });
  }
  await pageStudent.waitForTimeout(300);

  // 12. Community Code Gate
  await pageStudent.locator('#btn-nav-bang-tin').first().click();
  await pageStudent.waitForTimeout(500);
  await pageStudent.screenshot({ path: path.join(OUT_DIR, '12-community-code-gate.png'), fullPage: false });
  console.log('  -> 12-community-code-gate.png');

  // 13. Teacher Control Center & Teacher Dropdown
  const ctxTeacher = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxTeacher.request.post(`${BASE}/api/login`, {
    data: { code: 'GV11A1-G3WNFYKN', lop: '11a1' }
  });
  const pageTeacher = await ctxTeacher.newPage();
  await pageTeacher.goto(BASE, { waitUntil: 'domcontentloaded' });
  await pageTeacher.waitForTimeout(1500);

  // Open teacher dropdown
  await pageTeacher.locator('#btn-user-menu').click();
  await pageTeacher.waitForTimeout(300);
  await pageTeacher.screenshot({ path: path.join(OUT_DIR, '13-teacher-dropdown.png'), fullPage: false });
  console.log('  -> 13-teacher-dropdown.png');

  // Open Teacher Control Center
  await pageTeacher.locator('#btn-open-teacher-control-center').click();
  await pageTeacher.waitForTimeout(500);
  await pageTeacher.screenshot({ path: path.join(OUT_DIR, '14-teacher-control-center.png'), fullPage: false });
  console.log('  -> 14-teacher-control-center.png');

  // 15. Password room join dialog
  const ctxViewer = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const viewerUser = `viewer_${Date.now()}`;
  await ctxViewer.request.post(`${BASE}/api/register`, {
    data: { username: viewerUser, displayName: 'Người Xem Test', password: testPass, accountType: 'student' }
  });
  await ctxViewer.request.post(`${BASE}/api/login`, {
    data: { username: viewerUser, password: testPass }
  });
  await ctxStudent.request.post(`${BASE}/api/phong`, {
    data: {
      hanhDong: 'tao',
      ten: 'Phòng Khoá Mật Khẩu Demo',
      loai: 'chat',
      phamVi: 'truong',
      access_mode: 'password',
      matKhau: 'Demo123',
      sucChua: 5
    }
  });
  const pageViewer = await ctxViewer.newPage();
  await pageViewer.goto(BASE, { waitUntil: 'domcontentloaded' });
  await pageViewer.waitForTimeout(1000);
  await pageViewer.locator('#campus-flagship-spaces button:has-text("Chat")').first().click();
  await pageViewer.waitForTimeout(500);
  const lockedBtn = pageViewer.locator('#lobby-chat button:has-text("Nhập pass"), #lobby-chat button:has-text("Nhập mã")').first();
  if (await lockedBtn.count()) {
    await lockedBtn.click();
    await pageViewer.waitForTimeout(400);
    await pageViewer.screenshot({ path: path.join(OUT_DIR, '15-modal-room-password.png'), fullPage: false });
    console.log('  -> 15-modal-room-password.png');
  }

  console.log('\nAll screenshots captured successfully in docs/phase4b-screenshots/');
} catch (err) {
  console.error('Screenshot capture error:', err);
} finally {
  await browser.close();
}
