import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/phase4c-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

async function main() {
  console.log('=== CAPTURING PHASE 4C SCREENSHOTS ===');

  const uidA = 91001;
  const uidB = 91002;

  // 1. Seed friendship & DM in local D1
  const sqlSetup = `
    DELETE FROM campus_friendship WHERE requester_account_id IN (91001, 91002) OR addressee_account_id IN (91001, 91002);
    DELETE FROM campus_private_message WHERE sender_account_id IN (91001, 91002) OR receiver_account_id IN (91001, 91002);
    INSERT INTO campus_friendship (requester_account_id, addressee_account_id, status, created_at, updated_at)
    VALUES (91001, 91002, 'accepted', datetime('now'), datetime('now'));
    INSERT INTO campus_private_message (sender_account_id, receiver_account_id, content, created_at)
    VALUES
      (91002, 91001, 'Chào bạn! Mai có tiết Toán không nhỉ?', datetime('now', '-10 minutes')),
      (91001, 91002, 'Có chứ, tiết 2 nha. Đừng quên mang máy tính bỏ túi!', datetime('now', '-5 minutes'));
  `;
  try {
    const tempSqlPath = path.resolve(process.cwd(), 'cong-cu/temp-seed-visual.sql');
    fs.writeFileSync(tempSqlPath, sqlSetup, 'utf8');
    execSync(`npx wrangler d1 execute lop-10a7-db --local --file="${tempSqlPath}" -y`, { stdio: 'ignore' });
    fs.unlinkSync(tempSqlPath);
    console.log('Visual fixture seeded successfully.');
  } catch (e) {
    console.warn('Seed error:', e.message);
  }

  const sessionTokenA = await createToken(devSessionSecret, {
    accountId: uidA,
    hocSinhId: 35,
    lopId: 1,
    role: 'student',
    ten: 'Nguyễn Văn A',
    username: 'qa4c_hsa'
  }, 3600);

  // Send a message to Campus Chat so there's visual chat data
  await fetch(`${BASE_URL}/api/campus-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': `${COOKIE_NAME}=${encodeURIComponent(sessionTokenA)}` },
    body: JSON.stringify({ noiDung: 'Chào mừng cả trường đến với Campus Social 10A7! 🚀✨' })
  }).catch(() => {});

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  await context.addCookies([{
    name: COOKIE_NAME,
    value: encodeURIComponent(sessionTokenA),
    domain: '127.0.0.1',
    path: '/'
  }]);

  const page = await context.newPage();

  // 1. Campus Home 1920x1080
  console.log('1. Capturing Campus 1920x1080...');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${BASE_URL}/#campus`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'campus-1920x1080.png') });

  // 2. Campus Home 1440x900
  console.log('2. Capturing Campus 1440x900...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'campus-1440x900.png') });

  // 3. Campus Home 1024x768
  console.log('3. Capturing Campus 1024x768...');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'campus-1024x768.png') });

  // 4. Campus Mobile 390x844
  console.log('4. Capturing Campus Mobile 390x844...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'campus-mobile-390x844.png') });

  // 5. Campus Chat tab active
  console.log('5. Capturing Campus Chat tab...');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${BASE_URL}/#campus`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const chatRail = await page.$('#campus-chat-rail');
  if (chatRail) {
    await chatRail.screenshot({ path: path.join(SCREENSHOT_DIR, 'campus-chat-tab.png') });
  }

  // 6. Private Chat friend list ("Riêng" tab)
  console.log('6. Capturing Private Chat tab...');
  const riêngBtn = await page.$('button:has-text("Riêng")');
  if (riêngBtn) {
    await riêngBtn.click();
    await page.waitForTimeout(1200);
    const railElem = await page.$('#campus-chat-rail');
    if (railElem) {
      await railElem.screenshot({ path: path.join(SCREENSHOT_DIR, 'private-chat-friends.png') });
    }
  }

  // 7. Add Friend modal
  console.log('7. Capturing Add Friend modal...');
  const addFriendBtn = await page.$('#campus-chat-rail button:has-text("Kết bạn")');
  if (addFriendBtn) {
    await addFriendBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'add-friend-modal.png') });
    const closeBtn = await page.$('div:has-text("Kết bạn mới") button:has-text("✕")');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(500);
  }

  // 8. Private conversation view
  console.log('8. Capturing Private conversation view...');
  const friendBtn = await page.$('#campus-chat-rail button:has-text("Trần Thị B")');
  if (friendBtn) {
    await friendBtn.click();
    await page.waitForTimeout(1200);
    const railElem = await page.$('#campus-chat-rail');
    if (railElem) {
      await railElem.screenshot({ path: path.join(SCREENSHOT_DIR, 'private-conversation.png') });
    }
  }

  // 9. User dropdown menu
  console.log('9. Capturing User dropdown...');
  const avatarBtn = await page.$('#btn-user-menu');
  if (avatarBtn) {
    await avatarBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'user-dropdown.png') });
    await page.mouse.click(10, 10);
    await page.waitForTimeout(400);
  }

  // 10. Class Board 1920x1080
  console.log('10. Capturing Class Board 1920x1080...');
  await page.goto(`${BASE_URL}/#`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'class-board-1920x1080.png') });

  // 11. Class Board 1440x900
  console.log('11. Capturing Class Board 1440x900...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'class-board-1440x900.png') });

  // 12. Class Board Mobile 390x844
  console.log('12. Capturing Class Board Mobile 390x844...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'class-board-mobile-390x844.png') });

  await browser.close();
  console.log('=== ALL SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
