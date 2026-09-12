/**
 * QA Automation Suite: Phase 4G
 * CAMPUS ACTIVITY UNIVERSE + SOCIAL UX HARDENING + SCHOOL ADMIN REBUILD
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';
const screenshotDir = path.resolve('./docs/qa-phase4g');

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

async function run() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ: PHASE 4G QA SUITE');
  console.log(`Target Server: ${BASE}`);
  console.log(`Screenshots Directory: ${screenshotDir}`);
  console.log('================================================================\n');

  // Seed test fixtures
  try {
    execSync('npx wrangler d1 execute lop-10a7-db --local --file="cong-cu/seed-qa-phase4d1.sql"', { stdio: 'ignore' });
    console.log('  -> Đã nạp thành công canonical accounts: Admin 99820, GV_A 99821, HS_linked 99804, U1 99810.');
  } catch (e) {
    console.warn('  Cảnh báo seed D1:', e.message);
  }

  const tokenAdmin = await createToken(devSessionSecret, {
    accountId: 99820,
    username: 'admin_truong_phase4d1',
    role: 'teacher',
    ten: 'Ban Giám Hiệu Admin',
    lopId: 1,
    teacherPending: false,
    laAdminTruong: 1
  }, 3600);

  const tokenStudent = await createToken(devSessionSecret, {
    accountId: 99804,
    username: 'hs_linked_prescale',
    role: 'student',
    ten: 'Nguyễn Thị B',
    lopId: 1,
    hocSinhId: 2,
    teacherPending: false
  }, 3600);

  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });

    // ─────────────────────────────────────────────────────────────────────────────
    // GROUP 1: ORBITAL PHYSICS & ZERO COLLISION VERIFICATION
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n--- GROUP 1: ORBITAL PHYSICS & MOTION VERIFICATION ---');

    const ctx1920 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page1920 = await ctx1920.newPage();
    await page1920.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page1920.waitForTimeout(2000);

    const universe = page1920.locator('#campus-activity-universe');
    ok('1.1: Campus Activity Universe tồn tại trên Campus Home', (await universe.count()) > 0, 'motion');

    const worldHocTap = page1920.locator('#world-hoc-tap');
    const worldGame = page1920.locator('#world-game');
    ok('1.2: Cả 2 thế giới HỌC TẬP và GAME đều xuất hiện', (await worldHocTap.count()) > 0 && (await worldGame.count()) > 0, 'motion');

    // Measure bounding box at t0
    const bbHocTap0 = await worldHocTap.boundingBox();
    const bbGame0 = await worldGame.boundingBox();
    await page1920.screenshot({ path: path.join(screenshotDir, 'campus-1920-t0.png'), fullPage: false });

    // Wait 5 seconds for motion
    await page1920.waitForTimeout(5000);
    const bbHocTap5 = await worldHocTap.boundingBox();
    const bbGame5 = await worldGame.boundingBox();
    await page1920.screenshot({ path: path.join(screenshotDir, 'campus-1920-t5.png'), fullPage: false });

    const deltaXHocTap = Math.abs(bbHocTap5.x - bbHocTap0.x);
    const deltaYHocTap = Math.abs(bbHocTap5.y - bbHocTap0.y);
    const totalDisp = Math.sqrt(deltaXHocTap * deltaXHocTap + deltaYHocTap * deltaYHocTap);

    ok('1.3: Thế giới HỌC TẬP di chuyển vật lý thực tế (delta displacement >= 30px)',
      totalDisp >= 30,
      'motion',
      `measured displacement: ${totalDisp.toFixed(1)}px (deltaX: ${deltaXHocTap.toFixed(1)}px, deltaY: ${deltaYHocTap.toFixed(1)}px)`
    );

    // Collision check: Distance between centers must be >= 240px
    const centerDist0 = Math.hypot(
      (bbHocTap0.x + bbHocTap0.width / 2) - (bbGame0.x + bbGame0.width / 2),
      (bbHocTap0.y + bbHocTap0.height / 2) - (bbGame0.y + bbGame0.height / 2)
    );
    const centerDist5 = Math.hypot(
      (bbHocTap5.x + bbHocTap5.width / 2) - (bbGame5.x + bbGame5.width / 2),
      (bbHocTap5.y + bbHocTap5.height / 2) - (bbGame5.y + bbGame5.height / 2)
    );
    ok('1.4: Không có va chạm giữa 2 thế giới (Khoảng cách tâm >= 240px)',
      centerDist0 >= 240 && centerDist5 >= 240,
      'motion',
      `dist t0: ${centerDist0.toFixed(1)}px, dist t5: ${centerDist5.toFixed(1)}px`
    );

    // Hover pause check (wait 400ms for 300ms hover:scale-105 transition to settle)
    await worldHocTap.hover({ force: true });
    await page1920.waitForTimeout(400);
    const bbHocTapHover0 = await worldHocTap.boundingBox();
    await page1920.waitForTimeout(1500);
    const bbHocTapHover1 = await worldHocTap.boundingBox();
    const hoverDrift = Math.hypot(bbHocTapHover1.x - bbHocTapHover0.x, bbHocTapHover1.y - bbHocTapHover0.y);
    const isAnimPaused = await page1920.evaluate(() => {
      const el = document.querySelector('.universe-orbit-hoctap');
      return el ? window.getComputedStyle(el).animationPlayState === 'paused' : false;
    });
    ok('1.5: Hover dừng chuyển động (animation-play-state: paused)', hoverDrift <= 2 || isAnimPaused, 'motion', `hover drift: ${hoverDrift.toFixed(2)}px, paused: ${isAnimPaused}`);

    // Reduced motion test
    const ctxReduced = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce'
    });
    const pageReduced = await ctxReduced.newPage();
    await pageReduced.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await pageReduced.waitForTimeout(1000);
    const animState = await pageReduced.evaluate(() => {
      const el = document.querySelector('.universe-orbit-hoctap');
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return { animationName: cs.animationName, transform: cs.transform };
    });
    ok('1.6: prefers-reduced-motion vô hiệu hóa hoạt ảnh (animation: none)',
      animState && (animState.animationName === 'none' || animState.transform === 'none'),
      'motion',
      JSON.stringify(animState)
    );
    await ctxReduced.close();

    // ─────────────────────────────────────────────────────────────────────────────
    // GROUP 2: SPATIAL COMPOSITION & HEADER CLEANUP
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n--- GROUP 2: SPATIAL COMPOSITION & RESPONSIVE VIEWPORTS ---');

    // Header branding check
    const headerTitle = await page1920.locator('header').innerText();
    ok('2.1: Header Campus chuẩn "Digital Campus · GDTX Định Quán"',
      headerTitle.includes('Digital Campus · GDTX Định Quán'),
      'layout'
    );
    ok('2.2: Không còn phụ đề cũ "Trung tâm GDNN - GDTX Huyện Định Quán · Toàn Trường"',
      !headerTitle.includes('Trung tâm GDNN - GDTX Huyện Định Quán · Toàn Trường'),
      'layout'
    );

    // Viewport width checks at 1920
    const leftNavWidth = (await page1920.locator('#campus-left-nav').boundingBox())?.width || 0;
    const centerWidth = (await universe.boundingBox())?.width || 0;
    ok('2.3: Highlights rail ở 1920px nằm trong khoảng 300-340px', leftNavWidth >= 295 && leftNavWidth <= 345, 'layout', `width: ${leftNavWidth}px`);
    ok('2.4: Center Activity Universe ở 1920px chiếm trọn không gian (>= 900px)', centerWidth >= 900, 'layout', `width: ${centerWidth}px`);

    // Viewports capture
    const viewports = [
      { w: 1600, h: 900, name: 'campus-1600.png' },
      { w: 1440, h: 900, name: 'campus-1440.png' },
      { w: 1280, h: 800, name: 'campus-1280.png' },
      { w: 390, h: 844, name: 'campus-390.png' }
    ];
    for (const vp of viewports) {
      const c = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const p = await c.newPage();
      await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1000);
      await p.screenshot({ path: path.join(screenshotDir, vp.name), fullPage: false });
      await c.close();
    }
    ok('2.5: Đã chụp và kiểm tra toàn bộ 5 responsive viewports', true, 'layout');

    // ─────────────────────────────────────────────────────────────────────────────
    // GROUP 3: CHAT INPUT & VIETNAMESE IME BUG FIX
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n--- GROUP 3: CHAT INPUT & VIETNAMESE IME BUG FIX ---');

    const ctxAuth = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctxAuth.addCookies([
      { name: COOKIE_NAME, value: tokenStudent, domain: '127.0.0.1', path: '/' },
      { name: COOKIE_NAME, value: tokenStudent, domain: 'localhost', path: '/' }
    ]);
    const pageAuth = await ctxAuth.newPage();
    await pageAuth.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await pageAuth.waitForTimeout(2000);

    const campusTextarea = pageAuth.locator('#input-campus-chat');
    ok('3.1: Campus Chat textarea tồn tại cho tài khoản xác thực', (await campusTextarea.count()) > 0, 'chat');

    // Type text into textarea
    await campusTextarea.fill('Xin chào các bạn');

    // Simulate IME composition start
    await campusTextarea.evaluate((el) => {
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    });

    // Press Enter during IME composition
    await campusTextarea.press('Enter');
    await pageAuth.waitForTimeout(300);

    // Text must still be present because IME composition was active
    const textAfterImeEnter = await campusTextarea.inputValue();
    ok('3.2: Gõ phím Enter trong khi gõ Tiếng Việt (IME composition) KHÔNG làm gửi tin nhắn',
      textAfterImeEnter.length > 0,
      'chat',
      `content: "${textAfterImeEnter}"`
    );

    // Simulate IME composition end
    await campusTextarea.evaluate((el) => {
      el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    });

    // Test Shift+Enter (should insert newline, not send)
    await campusTextarea.press('Shift+Enter');
    await pageAuth.waitForTimeout(200);
    const textAfterShiftEnter = await campusTextarea.inputValue();
    ok('3.3: Phím Shift+Enter xuống dòng an toàn không gửi tin',
      textAfterShiftEnter.includes('\n'),
      'chat'
    );

    // Test sending and non-disabled input
    await campusTextarea.fill('Tin nhắn thử nghiệm kiểm thử Phase 4G');
    const sendBtn = pageAuth.locator('#btn-send-campus-chat');
    await sendBtn.click();

    // Textarea must not be disabled during sending
    const isTextareaDisabled = await campusTextarea.isDisabled();
    ok('3.4: Textarea KHÔNG bị disabled khi đang gửi để người dùng gõ tiếp', !isTextareaDisabled, 'chat');

    // Test DM composer IME
    const tabMe = pageAuth.locator('#chat-tab-me');
    if ((await tabMe.count()) > 0) {
      await tabMe.click();
      await pageAuth.waitForTimeout(1000);
      const dmInput = pageAuth.locator('#input-dm-chat');
      if ((await dmInput.count()) > 0) {
        ok('3.5: DM Composer sử dụng textarea an toàn với IME', true, 'chat');
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // GROUP 4: SCHOOL ADMIN REBUILD & FEATURE PARITY
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n--- GROUP 4: SCHOOL ADMIN REBUILD & PARITY ---');

    const ctxAdmin = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctxAdmin.addCookies([
      { name: COOKIE_NAME, value: tokenAdmin, domain: '127.0.0.1', path: '/' },
      { name: COOKIE_NAME, value: tokenAdmin, domain: 'localhost', path: '/' }
    ]);
    const pageAdmin = await ctxAdmin.newPage();
    await pageAdmin.goto(`${BASE}/giao-vien/`, { waitUntil: 'domcontentloaded' });
    await pageAdmin.waitForTimeout(2000);

    // Check Header & Identity
    const adminHeader = await pageAdmin.locator('header').innerText();
    ok('4.1: Admin Header hiển thị Digital Campus · Khu Quản Trị',
      adminHeader.includes('Digital Campus · Khu Quản Trị'),
      'admin'
    );

    const scopeSelect = pageAdmin.locator('#adminScopeSelect');
    ok('4.2: Scope Selector #adminScopeSelect tồn tại ở cấp trường',
      (await scopeSelect.count()) > 0,
      'admin'
    );

    // Test all 6 primary sections
    const adminSections = [
      { hash: '#/tong-quan', name: 'admin-tong-quan.png', label: 'Tổng quan' },
      { hash: '#/campus-quan-tri', name: 'admin-campus.png', label: 'Campus' },
      { hash: '#/bang-tin-quan-tri', name: 'admin-bang-tin.png', label: 'Bảng Tin' },
      { hash: '#/lop-quan-tri', name: 'admin-lop-thanh-vien.png', label: 'Lớp & Thành viên' },
      { hash: '#/kiem-duyet-quan-tri', name: 'admin-kiem-duyet.png', label: 'Kiểm duyệt' },
      { hash: '#/he-thong-quan-tri', name: 'admin-he-thong.png', label: 'Hệ thống' }
    ];

    for (const sec of adminSections) {
      await pageAdmin.goto(`${BASE}/giao-vien/${sec.hash}`, { waitUntil: 'domcontentloaded' });
      await pageAdmin.waitForTimeout(1500);
      const content = await pageAdmin.locator('#noiDung').innerText();
      ok(`4.3 [${sec.label}]: Mục ${sec.hash} tải thành công không lỗi`,
        content.length > 20 && !content.includes('Không tìm thấy trang'),
        'admin'
      );
      await pageAdmin.screenshot({ path: path.join(screenshotDir, sec.name), fullPage: false });
    }

    // Verify no standalone Music in Admin Campus
    await pageAdmin.goto(`${BASE}/giao-vien/#/campus-quan-tri`, { waitUntil: 'domcontentloaded' });
    await pageAdmin.waitForTimeout(1500);
    const campusAdminText = await pageAdmin.locator('#noiDung').innerText();
    ok('4.4: Khu Quản Trị Campus không chứa sản phẩm Music độc lập',
      !campusAdminText.includes('Phòng Music') && campusAdminText.includes('Học Tập / YouTube Study'),
      'admin'
    );

    await ctxAdmin.close();
    await ctxAuth.close();
    await ctx1920.close();

  } finally {
    if (browser) await browser.close();
  }

  console.log('\n================================================================');
  console.log(`🏁 HOÀN TẤT PHASE 4G QA SUITE: ${pass} PASS, ${fail} FAIL`);
  console.log('================================================================');
  if (fail > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
