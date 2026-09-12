/**
 * QA Automation Suite: Product + IA + Teacher Admin UX Refinement Pass
 * Verifies all requirements from the refinement pass prompt.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:8788';
let pass = 0;
let fail = 0;
const results = {};

function ok(name, cond, grp = 'general') {
  if (!results[grp]) results[grp] = { pass: 0, fail: 0 };
  if (cond) {
    pass++;
    results[grp].pass++;
    console.log(`  ✅ [${grp.toUpperCase()}] ${name}`);
  } else {
    fail++;
    results[grp].fail++;
    console.error(`  ❌ [${grp.toUpperCase()}] ${name}`);
  }
}

async function run() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ REFINEMENT PASS (PRODUCT, IA & ADMIN UX)');
  console.log(`Target Server: ${BASE}`);
  console.log('================================================================\n');

  const indexPath = path.resolve(process.cwd(), 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');

  // --- 1. CODEBASE / HTML AUDIT ---
  console.log('--- 1. AUDIT CODEBASE & IA RULES ---');
  ok('Teacher Admin Control Center Modal có id #teacher-control-center-modal hoặc #modal-teacher-control-center',
    html.includes('id="modal-teacher-control-center"') && html.includes('id="teacher-control-center-modal"'), 'admin_ia');

  ok('Teacher Admin Center có tab Tiêu Điểm Campus với live preview',
    html.includes("id: 'tieu_diem'") && html.includes('✨ Tiêu Điểm') && html.includes('Xem Trước Hiển Thị Thẻ Tiêu Điểm'), 'admin_ia');

  ok('Teacher Admin Center & Content Editor Modal hỗ trợ flow soạn & preview thông báo',
    html.includes('ContentEditorModal') && html.includes("tab === 'thong_bao'") && html.includes('setTab'), 'admin_ia');

  ok('AnnouncementTicker có nút mở trực tiếp Admin Center (#btn-admin-center-ticker)',
    html.includes('id="btn-admin-center-ticker"'), 'admin_ia');

  ok('User dropdown có nút trực tiếp mở Admin Center (#btn-open-teacher-control-center)',
    html.includes('id="btn-open-teacher-control-center"'), 'dropdown');

  ok('User dropdown đã loại bỏ link trùng lặp tới /giao-vien/',
    !html.includes('href="/giao-vien/"') && !html.includes("href='/giao-vien/'"), 'dropdown');

  ok('Flagship cards có keyframe animation cao cấp cinemaRayBreath, arenaGlowBreath, chatDotPulse',
    html.includes('cinemaRayBreath') && html.includes('arenaGlowBreath') && html.includes('chatDotPulse'), 'animations');

  ok('Hỗ trợ prefers-reduced-motion: reduce để tắt animation khi người dùng yêu cầu',
    html.includes('@media (prefers-reduced-motion: reduce)'), 'animations');

  ok('Class board có #class-online-card hiển thị sĩ số trực tuyến rõ ràng',
    html.includes('id="class-online-card"') && html.includes('Online'), 'class_board');

  ok('Class board chỉ giữ 2 tiện ích thiết yếu: 📋 Điểm danh và 💰 Quỹ lớp',
    html.includes('📋 Điểm danh') && html.includes('💰 Quỹ lớp') && !html.includes('🏆 Bảng Vàng Vinh Danh'), 'class_board');

  ok('Activity Lobby có nút "‹ Trở về Campus" (#btn-back-to-campus)',
    html.includes('id="btn-back-to-campus"') && html.includes('Trở về Campus'), 'lobby');

  ok('Campus layout giữ cấu trúc 3 cột persistent trên cả Home và Activity Lobby',
    html.includes('id="campus-left-nav"') && html.includes('id="campus-chat-rail"'), 'lobby');

  // --- 2. BROWSER PLAYWRIGHT VERIFICATION ---
  console.log('\n--- 2. KIỂM THỬ PLAYWRIGHT BROWSER (DESKTOP 1440x900) ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE}/#/campus`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Check 3-column layout presence
  const leftNav = page.locator('#campus-left-nav');
  ok('Cột trái (Campus Highlights) hiển thị trên Desktop', await leftNav.isVisible(), 'browser');

  const chatRail = page.locator('#campus-chat-rail');
  ok('Cột phải (Campus Chat Rail) hiển thị trên Desktop', await chatRail.isVisible(), 'browser');

  const mainArea = page.locator('#campus-main-content');
  ok('Khu vực trung tâm (Campus Main Content) hiển thị trên Desktop', await mainArea.isVisible(), 'browser');

  // Highlights component audit
  const highlightsCard = page.locator('#campus-highlights');
  ok('Card Campus Highlights có id #campus-highlights', await highlightsCard.isVisible(), 'browser');

  // Navigate to Activity Lobby (e.g. Game)
  console.log('\n--- 3. ĐIỀU HƯỚNG VÀO ACTIVITY LOBBY & PERSISTENT SIDE PANELS ---');
  const gameCard = page.locator('#campus-space-game, #campus-flagship-spaces button:has-text("Game")').first();
  ok('Card Flagship Game tồn tại và bấm được', await gameCard.isVisible(), 'lobby');
  await gameCard.click();
  await page.waitForTimeout(1000);

  const gameLobby = page.locator('#lobby-game');
  ok('Activity Lobby Game (#lobby-game) hiển thị ở trung tâm', await gameLobby.isVisible(), 'lobby');

  // Verify persistent side panels while inside Activity Lobby
  ok('Cột trái Highlights VẪN hiển thị khi đang trong Game Lobby', await leftNav.isVisible(), 'lobby');
  ok('Cột phải Chat Rail VẪN hiển thị khi đang trong Game Lobby', await chatRail.isVisible(), 'lobby');

  // Back to campus navigation
  const btnBack = page.locator('#btn-back-to-campus, #lobby-game button:has-text("Trở về Campus")').first();
  ok('Nút "‹ Trở về Campus" hiển thị trong Lobby', await btnBack.isVisible(), 'lobby');
  await btnBack.click();
  await page.waitForTimeout(1000);

  const heroLobby = page.locator('#campus-lobby, #campus-flagship-spaces').first();
  ok('Bấm "‹ Trở về Campus" đưa người dùng trở lại màn hình chính Campus', await heroLobby.isVisible(), 'lobby');

  // --- 4. RESPONSIVE BREAKPOINT OVERFLOW AUDIT ---
  console.log('\n--- 4. KIỂM THỬ KHÔNG TRÀN MÀN HÌNH (NO OVERFLOW) ---');
  for (const vp of [
    { name: 'Mobile', width: 390, height: 844 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Ultra-Wide', width: 1920, height: 1080 }
  ]) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(500);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const noOverflow = scrollWidth <= clientWidth;
    ok(`Không tràn chiều ngang trên ${vp.name} (${vp.width}x${vp.height}): ${scrollWidth} <= ${clientWidth}`, noOverflow, 'responsive');
  }

  await browser.close();

  // --- TỔNG KẾT ---
  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT REFINEMENT PASS: ${pass} PASS / ${fail} FAIL`);
  for (const [grp, res] of Object.entries(results)) {
    console.log(`  - [${grp.toUpperCase()}]: ${res.pass} PASS / ${res.pass + res.fail} TOTAL`);
  }
  console.log('================================================================');

  if (fail > 0) process.exit(1);
}

run().catch(err => {
  console.error('Lỗi khi chạy QA Refinement Pass:', err);
  process.exit(1);
});
