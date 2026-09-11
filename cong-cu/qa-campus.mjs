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
    /hoạt động trên Campus/i.test(textCampus) || /đang hoạt động/i.test(textCampus) || /Campus đang yên tĩnh/i.test(textCampus) || /Campus sẵn sàng kết nối/i.test(textCampus));

  // ── 2.1 Campus Simplification: X / 1 / 2 Assertions ─────────────────────────
  console.log('\n== 2.1 Campus Simplification: X / 1 / 2 Assertions ==');
  ok('Campus Hero Stage render (#campus-hero-stage)', await page.locator('#campus-hero-stage').count() > 0);
  ok('Campus Pulse strip hoàn toàn vắng mặt (#campus-pulse-status = 0)', await page.locator('#campus-pulse-status').count() === 0);
  ok('"Hôm Nay Trên Campus" lớn vắng mặt trên home', await page.locator('main').locator('#campus-events-section').count() === 0);
  ok('"Phòng Do Học Sinh Tạo" lớn vắng mặt trên home', await page.locator('main').locator('text=Phòng Do Học Sinh Tạo').count() === 0);

  // Region 2: Activity Room Navigator
  const roomNav = page.locator('#campus-room-navigator');
  ok('Left Activity Room Navigator hiển thị (#campus-room-navigator)', await roomNav.count() > 0);

  if (await roomNav.count()) {
    // 1. Click Cinema category
    const catCinema = page.locator('#cat-nav-CINEMA');
    ok('Category nav Cinema hiển thị (#cat-nav-CINEMA)', await catCinema.count() > 0);
    if (await catCinema.count()) {
      await catCinema.click();
      await page.waitForTimeout(300);
      ok('Bấm Cinema mở danh sách phòng (#room-nav-list-CINEMA)', await page.locator('#room-nav-list-CINEMA').count() > 0);
    }

    // 2. Click Music / Lofi category
    const catLofi = page.locator('#cat-nav-LOFI');
    ok('Category nav Lofi hiển thị (#cat-nav-LOFI)', await catLofi.count() > 0);
    if (await catLofi.count()) {
      await catLofi.click();
      await page.waitForTimeout(300);
      ok('Bấm Lofi mở danh sách phòng (#room-nav-list-LOFI)', await page.locator('#room-nav-list-LOFI').count() > 0);
    }

    // 3. Click Game / Caro category
    const catGame = page.locator('#cat-nav-GAME');
    ok('Category nav Game hiển thị (#cat-nav-GAME)', await catGame.count() > 0);
    if (await catGame.count()) {
      await catGame.click();
      await page.waitForTimeout(300);
      ok('Bấm Game mở danh sách bàn cờ (#room-nav-list-GAME)', await page.locator('#room-nav-list-GAME').count() > 0);
    }

    // 4. CTA tạo phòng / vào phòng bảo vệ Auth Gate đối với khách
    const btnCreateNav = page.locator('#campus-room-navigator button:has-text("+ Mở"), #campus-room-navigator button:has-text("+ Tạo")').first();
    ok('Navigator có CTA tạo phòng', await btnCreateNav.count() > 0);
    if (await btnCreateNav.count()) {
      await btnCreateNav.click();
      await page.waitForTimeout(350);
      ok('Khách bấm tạo phòng mở Auth Gate modal', await page.locator('#modal-auth-gate').count() > 0);
      const btnDongGate = page.locator('#modal-auth-gate button:has-text("Tiếp tục xem trang")').first();
      if (await btnDongGate.count()) {
        await btnDongGate.click();
        await page.waitForTimeout(300);
      }
    }
  }

  ok('Flagship Cinema Space hiển thị ("Xem Chung")', await page.locator('text=Xem Chung').count() > 0);
  ok('Flagship Game Arena Space hiển thị ("Game Arena" / "Cờ Caro")',
    (await page.locator('text=Game Arena').count() > 0) || (await page.locator('text=Cờ Caro').count() > 0));
  ok('Flagship Music & Focus Space hiển thị',
    (await page.locator('text=Music & Focus').count() > 0) || (await page.locator('text=Lofi Study').count() > 0));
  ok('Flagship Social Space hiển thị',
    (await page.locator('text=Trò Chuyện & Kết Nối').count() > 0) || (await page.locator('text=Sảnh Trò Chuyện').count() > 0));

  // ── 2.2 Phase 3A.1: Campus Search Hardening & Exclusivity ─────────────────
  console.log('\n== 2.2 Phase 3A.1: Campus Local Search Exclusivity ==');
  const searchInput = page.locator('#campus-search-input');
  ok('Campus search input hiển thị (#campus-search-input)', await searchInput.count() > 0);
  if (await searchInput.count()) {
    // 1. Tìm kiếm "Caro" -> Chỉ hiện Caro/Game, Cinema và Music không được hiện
    await searchInput.fill('Caro');
    await page.waitForTimeout(300);
    const hasCaro = (await page.locator('text=Cờ Caro').count() > 0) || (await page.locator('text=Game Arena').count() > 0);
    ok('Tìm kiếm "Caro" hiển thị kết quả Cờ Caro / Game', hasCaro);

    const flagshipSpaces = page.locator('#campus-flagship-spaces');
    const cinemaCount = await flagshipSpaces.locator('text=Rạp Chiếu & Xem Chung').count();
    const musicCount = await flagshipSpaces.locator('text=Lofi Study Café').count();
    const socialCount = await flagshipSpaces.locator('text=Sảnh Trò Chuyện Toàn Trường').count();
    ok('Tìm kiếm "Caro" KHÔNG hiển thị Rạp Chiếu Cinema', cinemaCount === 0, `cinemaCount=${cinemaCount}`);
    ok('Tìm kiếm "Caro" KHÔNG hiển thị Lofi Music', musicCount === 0, `musicCount=${musicCount}`);
    ok('Tìm kiếm "Caro" KHÔNG hiển thị Sảnh Trò Chuyện Social', socialCount === 0, `socialCount=${socialCount}`);

    // 2. Tìm kiếm "nhạc" -> Hiện Lofi Music, không hiện Caro
    await searchInput.fill('nhạc');
    await page.waitForTimeout(300);
    const hasMusic = (await flagshipSpaces.locator('text=Lofi Study Café').count() > 0);
    const caroWhenMusic = await flagshipSpaces.locator('text=Đấu Trường Cờ Caro').count();
    ok('Tìm kiếm "nhạc" hiển thị Lofi Study Café', hasMusic);
    ok('Tìm kiếm "nhạc" KHÔNG hiển thị Đấu Trường Cờ Caro', caroWhenMusic === 0, `caroCount=${caroWhenMusic}`);

    // 3. Tìm kiếm từ khóa không tồn tại -> Hiển thị Empty State thống nhất
    await searchInput.fill('xyznonexistentterm123');
    await page.waitForTimeout(300);
    const emptyStateVisible = (await page.locator('#campus-search-empty').count() > 0) || (await page.locator('text=Không tìm thấy kết quả phù hợp').count() > 0);
    ok('Tìm kiếm từ khóa không tồn tại hiển thị Empty State chuẩn', emptyStateVisible);

    // Reset lại ô tìm kiếm
    const btnClearSearch = page.locator('button:has-text("Xóa tìm kiếm")').first();
    if (await btnClearSearch.count()) {
      await btnClearSearch.click();
    } else {
      await searchInput.fill('');
    }
    await page.waitForTimeout(300);
  }

  // ── 2.3 Phase 3A.1: Semantic Correctness & Copy Claims ────────────────────
  console.log('\n== 2.3 Phase 3A.1: Semantic Correctness & Copy Claims ==');
  const bodyText = await page.textContent('body');
  ok('Hero brand là trường rộng ("GDTX Định Quán" / "Toàn Trường")',
    /Digital Campus · GDTX Định Quán/i.test(bodyText) || /Digital Campus Toàn Trường/i.test(bodyText));
  ok('Hero KHÔNG dùng brand lai "Digital Campus 10A7 & Toàn Trường"',
    !/Digital Campus 10A7 & Toàn Trường/i.test(bodyText));
  ok('Cinema card KHÔNG quảng cáo unverified "đồng bộ 1080p"',
    !/đồng bộ 1080p/i.test(bodyText));
  ok('Right rail KHÔNG dùng wording gây hiểu lầm "0 ONLINE"',
    !/0 ONLINE/i.test(bodyText));

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

  // ── 5. Responsive Matrix (1920px, 1440px, 1280px, 1024px, 768px, 390px) ───
  console.log('\n== 5. Responsive Breakpoint Matrix (Real Layout & Bounding Boxes) ==');
  const viewports = [
    { name: 'Ultra-wide Desktop (1920px)', width: 1920, height: 1080 },
    { name: 'Large Desktop (1440px)', width: 1440, height: 900 },
    { name: 'Standard Laptop (1280px)', width: 1280, height: 800 },
    { name: 'Laptop/Tablet L (1024px)', width: 1024, height: 768 },
    { name: 'Tablet (768px)', width: 768, height: 1024 },
    { name: 'Mobile (390px)', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(400);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    ok(`${vp.name}: Không tràn ngang`, !hasHorizontalOverflow);

    const heroRendered = await page.locator('#campus-lobby').isVisible();
    ok(`${vp.name}: Campus Hero hiển thị`, heroRendered);

    const leftNav = page.locator('#campus-left-nav');
    const mainContent = page.locator('main').first();
    const rightRail = page.locator('#campus-right-rail');

    if (vp.width >= 1280) {
      // >= 1280px: 3 cột nằm ngang Left < Main < Right
      const leftBox = await leftNav.boundingBox();
      const mainBox = await mainContent.boundingBox();
      const rightBox = await rightRail.boundingBox();
      if (leftBox && mainBox && rightBox) {
        ok(`${vp.name}: Bố cục 3 cột nằm ngang chuẩn (Left < Main < Right)`,
          leftBox.x < mainBox.x && mainBox.x < rightBox.x,
          `leftX=${Math.round(leftBox.x)}, mainX=${Math.round(mainBox.x)}, rightX=${Math.round(rightBox.x)}`
        );
      }
    } else if (vp.width >= 1024) {
      // 1024px: left nav ở cột 1, main ở cột 2. Right rail nằm dưới main ở cột 2 (rightX >= mainX), KHÔNG lọt dưới sidebar cột 1!
      const leftBox = await leftNav.boundingBox();
      const mainBox = await mainContent.boundingBox();
      const rightBox = await rightRail.boundingBox();
      if (leftBox && mainBox && rightBox) {
        ok(`${vp.name}: Right rail nằm dưới main content (rightX >= mainX), không rơi vào cột sidebar 220px`,
          rightBox.x >= mainBox.x - 10,
          `leftX=${Math.round(leftBox.x)}, mainX=${Math.round(mainBox.x)}, rightX=${Math.round(rightBox.x)}`
        );
        ok(`${vp.name}: Right rail rộng tương đương main (không bị bóp méo)`,
          rightBox.width >= 400,
          `rightWidth=${Math.round(rightBox.width)}`
        );
      }
    } else {
      // < 1024px (768px, 390px):
      // 1. Desktop sidebar phải ẩn
      const isLeftNavHidden = await leftNav.evaluate(el => window.getComputedStyle(el).display === 'none');
      ok(`${vp.name}: Desktop sidebar được ẩn gọn trên mobile/tablet`, isLeftNavHidden);

      // 2. Mobile navigation strip phải hiển thị
      const mobileNav = page.locator('#campus-mobile-nav');
      const isMobileNavVisible = await mobileNav.isVisible();
      ok(`${vp.name}: Mobile quick-nav hiển thị khả dụng`, isMobileNavVisible);

      // 3. Hero stage phải ở vị trí dễ tiếp cận ngay trên màn hình (không bị sidebar đẩy xuống)
      const heroStage = page.locator('#campus-hero-stage');
      const heroBox = await heroStage.boundingBox();
      if (heroBox) {
        ok(`${vp.name}: Hero ở vị trí ưu tiên gần đỉnh trang (y < 280px)`,
          heroBox.y < 280,
          `heroY=${Math.round(heroBox.y)}`
        );
      }

      // 4. Khi ở 390px (mobile): Bấm pill category mở drawer #campus-mobile-room-sheet
      if (vp.width === 390) {
        const btnMobCinema = page.locator('#mobile-cat-CINEMA');
        if (await btnMobCinema.count() && await btnMobCinema.isVisible()) {
          await btnMobCinema.click();
          await page.waitForTimeout(300);
          const sheetVisible = await page.locator('#campus-mobile-room-sheet').isVisible();
          ok('Mobile bấm category pill mở #campus-mobile-room-sheet', sheetVisible);
          const btnCloseSheet = page.locator('#campus-mobile-room-sheet button:has-text("✕")').first();
          if (await btnCloseSheet.count()) {
            await btnCloseSheet.click();
            await page.waitForTimeout(200);
          }
        }
      }
    }
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
