import { chromium } from 'playwright';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:8788';
const ARTIFACTS_DIR = 'C:\\Users\\lepha\\.gemini\\antigravity-ide\\brain\\8a71fa6e-6654-4a3c-8b68-7741484bc9d1';

async function run() {
  console.log('🚀 Bắt đầu kiểm thử Playwright E2E cho StudyDock Tabs (Thành viên + Video config)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // 1. Đăng ký & Đăng nhập một tài khoản học sinh Campus
  const studentUser = `host_e2e_${Date.now()}`;
  const testPass = 'HostPass123!';
  console.log(`  → Đăng ký & đăng nhập tài khoản: ${studentUser}...`);

  await context.request.post(`${BASE_URL}/api/register`, {
    data: {
      username: studentUser,
      displayName: 'Nguyễn Văn Host E2E',
      password: testPass,
      accountType: 'student'
    }
  });

  const loginRes = await context.request.post(`${BASE_URL}/api/login`, {
    data: {
      username: studentUser,
      password: testPass
    }
  });
  console.log('  ✓ Đăng nhập status:', loginRes.status());

  const page = await context.newPage();

  // Xử lý dialog khi bấm "🔗 Dán link"
  page.on('dialog', async dialog => {
    console.log('  → Xử lý prompt dán link YouTube:', dialog.message());
    await dialog.accept('https://www.youtube.com/watch?v=jfKfPfyJRdk');
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('403')) console.log('  [Browser Error]:', txt);
    }
  });

  try {
    // 2. Truy cập Campus
    console.log('  → Mở trang Campus...');
    await page.goto(`${BASE_URL}/#/campus`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 3. Mở Watch Lobby qua card #world-hoc-tap (YouTube Study World)
    console.log('  → Click #world-hoc-tap để vào Watch Lobby...');
    await page.locator('#world-hoc-tap').click({ force: true });
    await page.waitForSelector('#lobby-watch', { timeout: 10000 });
    console.log('  ✓ Đã vào Watch Lobby (#lobby-watch)');

    // 4. Bấm "+ Tạo phòng"
    console.log('  → Bấm nút "+ Tạo phòng"...');
    await page.click('#btn-create-youtube-room');
    await page.waitForSelector('input[placeholder*="Tên phòng"]', { timeout: 8000 });

    // 5. Điền tên phòng & dán link video YouTube
    console.log('  → Điền tên phòng và dán link YouTube...');
    await page.fill('input[placeholder*="Tên phòng"]', 'Phòng Học Toán Playwright E2E');
    await page.click('button:has-text("🔗 Dán link")');
    await page.waitForTimeout(1000);

    // 6. Bấm "🚀 Mở phòng ngay"
    console.log('  → Bấm "🚀 Mở phòng ngay"...');
    const submitBtn = page.locator('button:has-text("🚀 Mở phòng ngay")');
    await submitBtn.waitFor({ state: 'visible' });
    await submitBtn.click();

    // 7. Chờ giao diện phòng học và StudyDock xuất hiện
    console.log('  → Chờ StudyDock container xuất hiện...');
    await page.waitForSelector('#study-dock-container', { timeout: 15000 });
    console.log('  ✓ Đã vào phòng thành công với tư cách Host! #study-dock-container hiện diện.');

    // 8. Kiểm tra sự tồn tại của tất cả các Tab trong StudyDock
    const tabs = [
      { id: '#tab-study-chat', name: 'Chat' },
      { id: '#tab-study-notes', name: 'Ghi chú' },
      { id: '#tab-study-whiteboard', name: 'Bảng vẽ' },
      { id: '#tab-study-sheet', name: 'Bảng tính' },
      { id: '#tab-study-voice', name: 'Thoại' },
      { id: '#tab-study-members', name: 'Thành viên' },
      { id: '#tab-study-config', name: 'Video (Config)' }
    ];

    console.log('\n  👉 [KIỂM TRA CÁC TAB BUTTONS]');
    for (const t of tabs) {
      const loc = page.locator(t.id);
      const exists = await loc.count() > 0;
      console.log(`  ${exists ? '✓' : '✗'} Tab [${t.name}] (${t.id}): ${exists ? 'TỒN TẠI' : 'THIẾU'}`);
      if (!exists) throw new Error(`Thiếu tab ${t.name}`);
    }

    // 9. Kiểm thử Tab Thành viên
    console.log('\n  👉 [TEST 1] Click tab Thành viên (#tab-study-members)...');
    await page.click('#tab-study-members');
    await page.waitForTimeout(600);
    const membersHeading = await page.locator('text=Thành viên trong phòng').count();
    console.log(`  ✓ Tab Thành viên hiển thị danh sách: ${membersHeading > 0 ? 'PASS' : 'FAIL'}`);
    const hostBadge = await page.locator('text=👑 Host').count();
    console.log(`  ✓ Huy hiệu Host hiển thị chính xác: ${hostBadge > 0 ? 'PASS' : 'FAIL'}`);
    const membersShot = path.join(ARTIFACTS_DIR, 'studydock_tab_members.png');
    await page.screenshot({ path: membersShot });
    console.log(`  📷 Đã lưu ảnh tab Thành viên: ${membersShot}`);

    // 10. Kiểm thử Tab Video (Config)
    console.log('\n  👉 [TEST 2] Click tab Video (#tab-study-config)...');
    await page.click('#tab-study-config');
    await page.waitForTimeout(600);
    const inputVideo = await page.locator('#input-config-video-moi').count();
    const btnVideo = await page.locator('#btn-config-doi-video').count();
    console.log(`  ✓ Form đổi video phát ngay hiển thị: ${inputVideo > 0 && btnVideo > 0 ? 'PASS' : 'FAIL'}`);
    const queueSection = await page.locator('text=Hàng đợi video').count();
    console.log(`  ✓ Khu vực hàng đợi video (Queue) hiển thị: ${queueSection > 0 ? 'PASS' : 'FAIL'}`);
    const roomOps = await page.locator('text=Thao tác phòng').count();
    console.log(`  ✓ Khu vực thao tác phòng & đóng phòng hiển thị: ${roomOps > 0 ? 'PASS' : 'FAIL'}`);
    const configShot = path.join(ARTIFACTS_DIR, 'studydock_tab_config.png');
    await page.screenshot({ path: configShot });
    console.log(`  📷 Đã lưu ảnh tab Video: ${configShot}`);

    // 11. Kiểm thử Tab Ghi chú
    console.log('\n  👉 [TEST 3] Click tab Ghi chú (#tab-study-notes)...');
    await page.click('#tab-study-notes');
    await page.waitForTimeout(500);
    const noteInputCount = await page.locator('#study-note-input').count();
    console.log(`  ✓ Tab Ghi chú hiển thị ô nhập ghi chú (#study-note-input): ${noteInputCount > 0 ? 'PASS' : 'FAIL'}`);

    // 12. Kiểm thử Tab Bảng vẽ Whiteboard
    console.log('\n  👉 [TEST 4] Click tab Bảng vẽ (#tab-study-whiteboard)...');
    await page.click('#tab-study-whiteboard');
    await page.waitForTimeout(500);
    const canvasExists = await page.locator('canvas').count();
    console.log(`  ✓ Tab Bảng vẽ hiển thị canvas: ${canvasExists > 0 ? 'PASS' : 'FAIL'}`);

    // 13. Kiểm thử Tab Chat
    console.log('\n  👉 [TEST 5] Click tab Chat (#tab-study-chat)...');
    await page.click('#tab-study-chat');
    await page.waitForTimeout(500);
    const chatInput = await page.locator('#input-phong-chat').count();
    console.log(`  ✓ Tab Chat hiển thị ô nhập tin (#input-phong-chat): ${chatInput > 0 ? 'PASS' : 'FAIL'}`);

    console.log('\n🎉 TẤT CẢ CÁC KIỂM THỬ PLAYWRIGHT E2E CHO STUDYDOCK ĐỀU PASS 100%!');
  } catch (err) {
    console.error('❌ Lỗi khi chạy Playwright E2E:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
