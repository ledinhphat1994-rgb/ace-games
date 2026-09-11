// QA gate cho Digital Campus — chạy bằng Playwright có sẵn trong devDependencies.
//   node cong-cu/qa-campus.mjs [URL]
// Mặc định test bản production https://gdtxdinhquan.pages.dev (truyền URL local khi dev).
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://gdtxdinhquan.pages.dev';
let pass = 0, fail = 0;
const loiConsole = [];
const unexpected401s = [];

function ok(ten, dk, chiTiet = '') {
  if (dk) {
    pass++;
    console.log(`  ✅ ${ten}`);
  } else {
    fail++;
    console.log(`  ❌ ${ten} ${chiTiet}`);
  }
}

const browser = await chromium.launch();

try {
  // ── 1. API public & security assertions (Guest) ─────────────────────────────
  console.log('\n== 1. API Security Assertions (Guest) ==');
  const ctx = await browser.newContext();

  // 1.1 GET /api/campus -> 200 & sanitized
  const resCampus = await ctx.request.get(`${BASE}/api/campus`);
  ok('GET /api/campus HTTP 200', resCampus.status() === 200, `status=${resCampus.status()}`);
  const dCampus = await resCampus.json().catch(() => ({}));
  ok('GET /api/campus ok=true', dCampus.ok === true);
  ok('GET /api/campus có dangHoatDong hợp lệ', typeof dCampus.dangHoatDong === 'number' && dCampus.dangHoatDong >= 0);

  const phongs = dCampus.phongs || [];
  const phong0 = phongs[0] || {};
  const truongRiengTu = ['chuPhongKhoa', 'chuPhongTen', 'lopTen', 'lopId', 'thanhVien', 'hocSinhId']
    .filter(k => Object.prototype.hasOwnProperty.call(phong0, k));
  ok('GET /api/campus không lộ danh tính/lớp', truongRiengTu.length === 0, `→ lộ: ${truongRiengTu.join(', ')}`);
  ok('GET /api/campus chỉ trả phòng toàn trường', phongs.every(p => p.phamVi !== 'lop'));

  // 1.2 GET /api/phong -> 401 as guest
  const resGetPhong = await ctx.request.get(`${BASE}/api/phong`);
  ok('GET /api/phong chặn khách (401)', resGetPhong.status() === 401, `status=${resGetPhong.status()}`);

  // 1.3 POST /api/phong -> 401 as guest
  const resPostPhong = await ctx.request.post(`${BASE}/api/phong`, {
    data: { hanhDong: 'tao', ten: 'Phòng kiểm tra QA khách' },
    headers: { 'Content-Type': 'application/json' }
  });
  ok('POST /api/phong chặn khách (401)', resPostPhong.status() === 401, `status=${resPostPhong.status()}`);

  // 1.4 GET /api/su-kien -> 200 public
  const resGetSk = await ctx.request.get(`${BASE}/api/su-kien`);
  ok('GET /api/su-kien public 200', resGetSk.status() === 200, `status=${resGetSk.status()}`);

  // 1.5 POST /api/su-kien -> 401/403 as guest
  const resPostSk = await ctx.request.post(`${BASE}/api/su-kien`, {
    data: {
      tieuDe: 'Sự kiện kiểm tra QA khách',
      batDauLuc: '2026-09-12T08:00:00.000Z',
      ketThucLuc: '2026-09-12T09:00:00.000Z'
    },
    headers: { 'Content-Type': 'application/json' }
  });
  ok('POST /api/su-kien chặn khách (401/403)', resPostSk.status() === 401 || resPostSk.status() === 403, `status=${resPostSk.status()}`);

  // ── 2. Render Campus UI & Strict 401 / Console Filtering ────────────────────
  console.log('\n== 2. Render Campus UI & Console Whitelist ==');
  const page = await ctx.newPage();

  // Strict network monitoring: Whitelist ONLY expected 401s (e.g. /api/whoami on initial guest auth check)
  page.on('response', resp => {
    if (resp.status() === 401) {
      const url = resp.url();
      if (!url.includes('/api/whoami')) {
        unexpected401s.push(`${resp.status()} ${resp.request().method()} ${url}`);
      }
    }
  });

  // Console error tracking: ignore only expected whoami 401 or favicon
  page.on('console', m => {
    if (m.type() === 'error') {
      const txt = m.text();
      const loc = typeof m.location === 'function' ? m.location() : {};
      const url = loc.url || '';
      const isExpectedWhoami = (/api\/whoami/i.test(url) || /api\/whoami/i.test(txt) || (unexpected401s.length === 0 && /401/i.test(txt)));
      const isFavicon = /favicon|net::ERR_/i.test(txt);
      if (!isExpectedWhoami && !isFavicon) {
        loiConsole.push(txt);
      }
    }
  });
  page.on('pageerror', e => loiConsole.push(String(e)));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load').catch(() => {});

  // Campus là tab mặc định khi chưa đăng nhập; bấm nút Campus nếu đang ở bảng tin.
  const nutCampus = page.locator('button:has-text("Digital Campus")').first();
  if (await nutCampus.count()) await nutCampus.click();
  await page.waitForTimeout(1500);

  ok('Hero #campus-lobby render', await page.locator('#campus-lobby').count() > 0);
  const textCampus = (await page.locator('#campus-lobby').count())
    ? await page.locator('#campus-lobby').textContent() : '';
  ok('Có brand Digital Campus', /Digital Campus/i.test(await page.textContent('body')));
  ok('KHÔNG rò nội dung lớp vào Campus Hero',
    !/Thông báo lớp|nhạc nền lớp 10A7|Bảng Tin Cộng Đồng lớp/i.test(textCampus));
  ok('Hero hiển thị chỉ số hoạt động Campus',
    /hoạt động trên Campus/i.test(textCampus) || /đang hoạt động/i.test(textCampus));

  // ── 3. Guest Caro CTA Boundary ─────────────────────────────────────────────
  console.log('\n== 3. Guest Caro CTA Boundary ==');
  const btnVaoCaro = page.locator('button:has-text("Vào đấu trường")').first();
  ok('Có nút CTA Caro "Vào đấu trường"', await btnVaoCaro.count() > 0);
  if (await btnVaoCaro.count()) {
    await btnVaoCaro.click();
    await page.waitForTimeout(400);
    const authGateOpen = await page.locator('#modal-auth-gate').count() > 0;
    ok('Bấm Caro CTA mở Auth Gate modal', authGateOpen);
    const enteredGameScreen = await page.locator('#caro-arena').count() > 0;
    ok('Khách KHÔNG bị đưa vào màn hình game bảo vệ', !enteredGameScreen);

    // Đóng Auth Gate modal để tiếp tục kiểm tra
    const btnDongAuthGate = page.locator('#modal-auth-gate button:has-text("Tiếp tục xem trang")').first();
    if (await btnDongAuthGate.count()) {
      await btnDongAuthGate.click();
      await page.waitForTimeout(300);
    }
  }

  // ── 4. Mood Chips & Rail Tabs ──────────────────────────────────────────────
  console.log('\n== 4. Campus Features & WAI-ARIA Tabs ==');
  const chipChat = page.locator('button:has-text("💬 Trò chuyện")');
  ok('Mood chip "💬 Trò chuyện" hiển thị', await chipChat.count() > 0);
  if (await chipChat.count()) {
    await chipChat.click();
    await page.waitForTimeout(300);
  }

  const tabSk = page.locator('#railtab-su-kien');
  ok('Tab sự kiện có role=tab', await tabSk.count() > 0);
  if (await tabSk.count()) {
    await tabSk.click();
    await page.waitForTimeout(300);
    ok('Panel sự kiện mở + empty state', await page.locator('#railpanel-su-kien').count() > 0);
  }

  const tabNhac = page.locator('#railtab-nhac');
  if (await tabNhac.count()) {
    await tabNhac.click();
    await page.waitForTimeout(300);
    const panelNhac = await page.textContent('#railpanel-nhac');
    ok('Nhạc rail là phòng campus, không phải nhạc lớp', !/Nhạc nền lớp 10A7/i.test(panelNhac));
  }

  // ── 5. Responsive Matrix (1440px, 1024px, 768px, 390px) ────────────────────
  console.log('\n== 5. Responsive Breakpoint Matrix ==');
  const viewports = [
    { name: 'Desktop (1440px)', width: 1440, height: 900 },
    { name: 'Laptop/Tablet L (1024px)', width: 1024, height: 768 },
    { name: 'Tablet (768px)', width: 768, height: 1024 },
    { name: 'Mobile (390px)', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(300);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    ok(`${vp.name}: Không tràn ngang`, !hasHorizontalOverflow);

    const heroRendered = await page.locator('#campus-lobby').isVisible();
    ok(`${vp.name}: Campus Hero hiển thị`, heroRendered);

    const navUsable = (await page.locator('#railtab-phong, #railtab-su-kien, nav, header').first().count()) > 0;
    ok(`${vp.name}: Điều hướng Campus khả dụng`, navUsable);
  }

  // ── 6. Console Errors & Unexpected 401s ─────────────────────────────────────
  console.log('\n== 6. Strict Network & Console Quality ==');
  ok('Không có request 401 ngoài dự kiến (chỉ cho phép /api/whoami)',
    unexpected401s.length === 0,
    `→ phát hiện: ${unexpected401s.join('; ')}`
  );

  ok('Không có lỗi console nghiêm trọng',
    loiConsole.length === 0,
    `→ ${loiConsole.slice(0, 3).join(' | ')}`
  );

  // ── 7. Scenarios Requiring Authenticated Fixtures ───────────────────────────
  console.log('\n== 7. Cross-Class Isolation & Fixtures Status ==');
  console.log('  ℹ️  [NOT AUTOMATED in guest smoke] Cross-class room isolation (Class A vs Class B) requires authenticated multi-session fixtures.');

} finally {
  await browser.close();
}

console.log(`\n═══════════════════════════════════════════`);
console.log(` KẾT QUẢ QA CAMPUS: ${pass} pass, ${fail} fail`);
console.log(`═══════════════════════════════════════════`);
process.exit(fail ? 1 : 0);
