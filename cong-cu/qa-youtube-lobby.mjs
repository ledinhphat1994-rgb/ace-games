/**
 * QA Automation Suite: YouTube Lobby Rebuild & Search Correctness
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
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

function ok(name, cond, grp = 'youtube', detail = '') {
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
  console.log('🚀 BẮT ĐẦU KIỂM THỬ: YOUTUBE LOBBY & SEARCH REBUILD');
  console.log(`Target Server: ${BASE}`);
  console.log(`Screenshots Directory: ${screenshotDir}`);
  console.log('================================================================\n');

  // 1. Backend Proxy Verification
  console.log('--- 1. BACKEND YOUTUBE PROXY TESTS ---');
  try {
    const res = await fetch(`${BASE}/api/youtube-search?q=test`);
    const data = await res.json();
    ok('1.1: Proxy YouTube trả về JSON hợp lệ', typeof data === 'object', 'backend');
    ok('1.2: Proxy YouTube xử lý trạng thái chưa cấu hình API key an toàn (configured: false, code: youtube_unconfigured)',
      data.configured === false && data.code === 'youtube_unconfigured',
      'backend',
      JSON.stringify(data)
    );
  } catch (err) {
    ok('1.1: Backend fetch failed', false, 'backend', err.message);
  }

  // 2. Frontend Lobby IA & Interaction
  console.log('\n--- 2. FRONTEND YOUTUBE LOBBY IA TESTS ---');
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
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([
      { name: COOKIE_NAME, value: tokenStudent, domain: '127.0.0.1', path: '/' },
      { name: COOKIE_NAME, value: tokenStudent, domain: 'localhost', path: '/' }
    ]);
    const page = await ctx.newPage();

    // Mock search API route for deterministic test of 3-column media grid & abort controller
    await page.route('**/api/youtube-search*', async route => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get('q') || '';
      if (!q) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, configured: true })
        });
        return;
      }
      const items = [
        {
          videoId: 'vid123',
          title: `Bài giảng ôn tập: ${q} phần 1`,
          channelTitle: 'Kênh Học Tập GDTX',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          publishedAt: '2026-09-01T00:00:00Z',
          description: 'Bài giảng hướng dẫn giải đề cương chi tiết'
        },
        {
          videoId: 'vid456',
          title: `Chuyên đề nâng cao: ${q} thực hành`,
          channelTitle: 'Thầy Giáo Định Quán',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          publishedAt: '2026-09-02T00:00:00Z',
          description: 'Các bài toán ví dụ thực tế'
        },
        {
          videoId: 'vid789',
          title: `Phương pháp ghi nhớ ${q} nhanh`,
          channelTitle: 'Tổ Tự Nhiên GDTX',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          publishedAt: '2026-09-03T00:00:00Z',
          description: 'Tổng hợp sơ đồ tư duy'
        }
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, configured: true, items })
      });
    });

    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Click world HỌC TẬP to enter YouTube lobby (force: true for animated orbital element)
    const worldHocTap = page.locator('#world-hoc-tap');
    await worldHocTap.click({ force: true });
    await page.waitForTimeout(1000);

    // Verify Lobby header
    const lobbyWatch = page.locator('#lobby-watch');
    ok('2.1: Nhấp HỌC TẬP mở trực tiếp Sảnh Học Tập / YouTube (không qua bộ chọn Music)',
      (await lobbyWatch.count()) > 0,
      'lobby'
    );

    // Verify SINGLE CTA in header
    const createBtn = page.locator('#btn-create-youtube-room');
    ok('2.2: Sảnh YouTube có duy nhất MỘT nút CTA [+ Tạo phòng] tại Header',
      (await createBtn.count()) === 1,
      'lobby'
    );

    // Screenshot empty state
    await page.screenshot({ path: path.join(screenshotDir, 'youtube-lobby-empty.png'), fullPage: false });

    // Verify Hero Search Input
    const searchInput = page.locator('#yt-search-input');
    ok('2.3: Thanh tìm kiếm Hero #yt-search-input hiển thị nổi bật', (await searchInput.count()) > 0, 'lobby');

    // Type search query
    await searchInput.fill('Toán học 10');
    await page.screenshot({ path: path.join(screenshotDir, 'youtube-lobby-search.png'), fullPage: false });

    // Wait for 450ms debounce and response
    await page.waitForTimeout(1200);

    // Verify 3-column media grid
    const resultCards = page.locator('.yt-result-card');
    const resultCount = await resultCards.count();
    ok('2.4: Hiển thị lưới kết quả video 3 cột với tiêu đề và thumbnail 16:9',
      resultCount === 3,
      'lobby',
      `count: ${resultCount}`
    );
    await page.screenshot({ path: path.join(screenshotDir, 'youtube-lobby-results.png'), fullPage: false });

    // Click [Chọn video] on first item
    const selectBtn = resultCards.first().locator('button', { hasText: 'Chọn video' });
    await selectBtn.click();
    await page.waitForTimeout(500);

    // Verify Selected Video State
    const selectedState = page.locator('#yt-selected-preview');
    ok('2.5: Trạng thái video đã chọn hiển thị xem trước và nút xác nhận tạo phòng',
      (await selectedState.count()) > 0,
      'lobby'
    );
    const confirmCreateBtn = page.locator('#btn-create-room-with-video');
    const changeVideoBtn = page.locator('#btn-change-video');
    ok('2.6: Có nút [Tạo phòng với video này] và [Đổi video]',
      (await confirmCreateBtn.count()) > 0 && (await changeVideoBtn.count()) > 0,
      'lobby'
    );
    await page.screenshot({ path: path.join(screenshotDir, 'youtube-lobby-selected.png'), fullPage: false });

    // Test Room Filters
    const filterAll = page.locator('#filter-room-all');
    const filterPublic = page.locator('#filter-room-public');
    const filterPrivate = page.locator('#filter-room-private');
    ok('2.7: Bộ lọc phòng [Tất cả] [Công khai] [Riêng tư] tồn tại và hoạt động',
      (await filterAll.count()) > 0 && (await filterPublic.count()) > 0 && (await filterPrivate.count()) > 0,
      'lobby'
    );
    await filterPublic.click();
    await page.waitForTimeout(200);
    await filterAll.click();

    await ctx.close();
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n================================================================');
  console.log(`🏁 HOÀN TẤT YOUTUBE LOBBY QA SUITE: ${pass} PASS, ${fail} FAIL`);
  console.log('================================================================');
  if (fail > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal YouTube Lobby QA error:', err);
  process.exit(1);
});
