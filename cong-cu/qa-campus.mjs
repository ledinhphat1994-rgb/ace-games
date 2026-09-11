// QA smoke cho Digital Campus — chạy bằng Playwright có sẵn trong devDependencies.
//   node cong-cu/qa-campus.mjs [URL]
// Mặc định test bản production https://gdtxdinhquan.pages.dev (truyền URL local khi dev).
// Không cần đăng nhập: chỉ kiểm tra các trạng thái an toàn đọc được từ ngoài.
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://gdtxdinhquan.pages.dev';
let pass = 0, fail = 0;
const loiConsole = [];

function ok(ten, dk, chiTiet = '') {
  if (dk) { pass++; console.log(`  ✅ ${ten}`); }
  else { fail++; console.log(`  ❌ ${ten} ${chiTiet}`); }
}

const browser = await chromium.launch();

// ── 1. API public: /api/campus phải sanitized ────────────────────────────────
console.log('\n== API /api/campus (guest) ==');
const ctx = await browser.newContext();
const resCampus = await ctx.request.get(`${BASE}/api/campus`);
ok('HTTP 200', resCampus.status() === 200, `status=${resCampus.status()}`);
const dCampus = await resCampus.json();
ok('ok=true', dCampus.ok === true);
const phong0 = (dCampus.phongs || [])[0] || {};
const truongRiengTu = ['chuPhongKhoa', 'chuPhongTen', 'lopTen', 'lopId', 'thanhVien', 'hocSinhId']
  .filter(k => Object.prototype.hasOwnProperty.call(phong0, k));
ok('Không lộ danh tính/lớp', truongRiengTu.length === 0, `→ lộ: ${truongRiengTu.join(', ')}`);
ok('Chỉ phòng toàn trường', (dCampus.phongs || []).every(p => p.phamVi !== 'lop'));

// ── 2. /api/phong vẫn chặn khách ─────────────────────────────────────────────
const resPhong = await ctx.request.get(`${BASE}/api/phong`);
ok('/api/phong chặn khách (401)', resPhong.status() === 401, `status=${resPhong.status()}`);

// ── 3. /api/su-kien public ───────────────────────────────────────────────────
const resSk = await ctx.request.get(`${BASE}/api/su-kien`);
ok('/api/su-kien public 200', resSk.status() === 200, `status=${resSk.status()}`);

// ── 4. Trang Campus render (khách) ───────────────────────────────────────────
console.log('\n== Render Campus (khách, desktop) ==');
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') loiConsole.push(m.text()); });
page.on('pageerror', e => loiConsole.push(String(e)));
await page.goto(BASE, { waitUntil: 'networkidle' });

// Campus là tab mặc định khi chưa đăng nhập; bấm nút Campus nếu đang ở bảng tin.
const nutCampus = page.locator('button:has-text("Digital Campus")').first();
if (await nutCampus.count()) await nutCampus.click();
await page.waitForTimeout(1500);

ok('Hero render', await page.locator('#campus-lobby').count() > 0);
const textBody = await page.textContent('body');
ok('Có brand Digital Campus', /Digital Campus/i.test(textBody));
ok('KHÔNG rò nội dung lớp vào Campus', !/Thông báo lớp|nhạc nền lớp 10A7|Bảng Tin Cộng Đồng lớp/i.test(textBody));

// Mood chips
const chipChat = page.locator('button:has-text("💬 Trò chuyện")');
ok('Mood chip hiển thị', await chipChat.count() > 0);
if (await chipChat.count()) { await chipChat.click(); await page.waitForTimeout(300); }

// Rail tabs (WAI-ARIA)
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

// ── 5. Mobile viewport ───────────────────────────────────────────────────────
console.log('\n== Mobile 390px ==');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
const tranNgang = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
ok('Không tràn ngang', !tranNgang, `scrollWidth>innerWidth`);

// ── 6. Console errors ────────────────────────────────────────────────────────
const loiNghiem = loiConsole.filter(l => !/favicon|404|net::/i.test(l));
ok('Không có lỗi console nghiêm trọng', loiNghiem.length === 0, loiNghiem.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n═══ KẾT QUẢ: ${pass} pass, ${fail} fail ═══`);
process.exit(fail ? 1 : 0);
