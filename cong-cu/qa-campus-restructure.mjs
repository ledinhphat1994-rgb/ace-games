// QA test suite cho Phase 4A: Tái cấu trúc Digital Campus
// Chạy: node cong-cu/qa-campus-restructure.mjs [URL]
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
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
  console.log(`\n======================================================`);
  console.log(`QA SUITE: PHASE 4A DIGITAL CAMPUS RESTRUCTURE`);
  console.log(`Target: ${BASE}`);
  console.log(`======================================================\n`);

  const ctx = await browser.newContext();

  // ─────────────────────────────────────────────────────────────
  // 1. API SECURITY & FUNCTIONALITY ASSERTIONS
  // ─────────────────────────────────────────────────────────────
  console.log('== 1. API Security & Functionality Assertions ==');

  // 1.1 GET /api/campus-thong-bao (Guest)
  const resTb = await ctx.request.get(`${BASE}/api/campus-thong-bao`);
  ok('GET /api/campus-thong-bao trả HTTP 200', resTb.status() === 200, `status=${resTb.status()}`);
  const dTb = await resTb.json().catch(() => ({}));
  ok('GET /api/campus-thong-bao có ok=true', dTb.ok === true);
  ok('GET /api/campus-thong-bao có mảng danhSach', Array.isArray(dTb.danhSach));
  ok('GET /api/campus-thong-bao chỉ trả bài đã xuất bản cho khách',
    Array.isArray(dTb.danhSach) && dTb.danhSach.every(tb => tb.trangThai === 'published' || tb.trangThai === 'xuat_ban')
  );

  // 1.2 POST /api/campus-thong-bao (Guest blocked)
  const resPostTb = await ctx.request.post(`${BASE}/api/campus-thong-bao`, {
    data: { hanhDong: 'xuat_ban', tieuDe: 'Test Hacker', noiDung: 'Hack test' },
    headers: { 'Content-Type': 'application/json' }
  });
  ok('POST /api/campus-thong-bao chặn khách (401/403)', resPostTb.status() === 401 || resPostTb.status() === 403, `status=${resPostTb.status()}`);

  // 1.3 GET /api/campus-highlights
  const resHl = await ctx.request.get(`${BASE}/api/campus-highlights`);
  ok('GET /api/campus-highlights trả HTTP 200', resHl.status() === 200, `status=${resHl.status()}`);
  const dHl = await resHl.json().catch(() => ({}));
  ok('GET /api/campus-highlights có ok=true', dHl.ok === true);
  ok('GET /api/campus-highlights có highlights', Array.isArray(dHl.highlights));
  ok('GET /api/campus-highlights có topStreaks', Array.isArray(dHl.topStreaks));
  ok('GET /api/campus-highlights có focusTongQuan', typeof dHl.focusTongQuan === 'object' && dHl.focusTongQuan !== null);
  ok('GET /api/campus-highlights có gameDoiKhang', typeof dHl.gameDoiKhang === 'object' && dHl.gameDoiKhang !== null);
  ok('GET /api/campus-highlights có thongKe tổng hợp', typeof dHl.thongKe === 'object' && dHl.thongKe !== null);

  // 1.4 POST /api/kiem-tra-ma-cong-dong (validation test)
  const resMaRong = await ctx.request.post(`${BASE}/api/kiem-tra-ma-cong-dong`, {
    data: { maCode: '' },
    headers: { 'Content-Type': 'application/json' }
  });
  ok('POST /api/kiem-tra-ma-cong-dong từ chối mã rỗng (400)', resMaRong.status() === 400);

  const resMaSai = await ctx.request.post(`${BASE}/api/kiem-tra-ma-cong-dong`, {
    data: { maCode: 'MA-KHONG-TON-TAI-999' },
    headers: { 'Content-Type': 'application/json' }
  });
  ok('POST /api/kiem-tra-ma-cong-dong báo mã không hợp lệ (400)', resMaSai.status() === 400);
  const dMaSai = await resMaSai.json().catch(() => ({}));
  ok('Response mã sai trả hopLe=false', dMaSai.hopLe === false);

  const resMaDung = await ctx.request.post(`${BASE}/api/kiem-tra-ma-cong-dong`, {
    data: { maCode: '10A7-2026' },
    headers: { 'Content-Type': 'application/json' }
  });
  ok('POST /api/kiem-tra-ma-cong-dong chấp nhận mã chuẩn (200)', resMaDung.status() === 200, `status=${resMaDung.status()}`);
  const dMaDung = await resMaDung.json().catch(() => ({}));
  ok('Response mã đúng trả hopLe=true', dMaDung.hopLe === true);
  ok('Mã đúng xác nhận lớp 10A7', dMaDung.lopTen === 'Lớp 10A7');

  // ─────────────────────────────────────────────────────────────
  // 2. UI DESKTOP INTEGRATION & RESTRUCTURE ASSERTIONS
  // ─────────────────────────────────────────────────────────────
  console.log('\n== 2. UI Desktop Integration & Layout Assertions ==');
  const page = await ctx.newPage();
  page.setViewportSize({ width: 1440, height: 900 });

  page.on('console', msg => {
    const txt = msg.text();
    if (msg.type() === 'error' && !txt.includes('favicon') && !txt.includes('401') && !txt.includes('400')) {
      loiConsole.push(txt);
    }
  });

  page.on('response', resp => {
    if (resp.status() === 401) {
      const u = resp.url();
      if (!u.includes('/api/whoami')) {
        unexpected401s.push(`${resp.status()} ${resp.request().method()} ${u}`);
      }
    }
  });

  await page.goto(`${BASE}/#campus`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForTimeout(2000);

  // 2.1 Header Top Guest Mode
  const loginBtn = await page.$('#header-btn-login');
  ok('Header có nút [Đăng nhập] riêng cho khách (#header-btn-login)', loginBtn !== null);

  const registerBtn = await page.$('#header-btn-register');
  ok('Header có nút [Đăng ký] riêng cho khách (#header-btn-register)', registerBtn !== null);

  // 2.2 Hero Stage Removal
  const heroStage = await page.$('#campus-hero-stage');
  ok('Vùng 2 (Hero khổng lồ) đã được loại bỏ hoàn toàn (#campus-hero-stage is null)', heroStage === null);

  // 2.3 Vùng 3 -> Campus Highlights (Left Column)
  const highlights = await page.$('#campus-highlights');
  ok('Vùng 3 (Cột trái) hiển thị #campus-highlights', highlights !== null);
  if (highlights) {
    const textHl = await highlights.innerText();
    const upperHl = textHl.toUpperCase();
    ok('Campus Highlights có khối Tiêu Điểm / Nổi Bật',
      upperHl.includes('NỔI BẬT') || upperHl.includes('TIÊU ĐIỂM') || upperHl.includes('CAMPUS')
    );
  }

  // 2.4 Vùng 4 -> Teacher Announcements (Right Column)
  const teacherAnn = await page.$('#teacher-announcements');
  ok('Vùng 4 (Cột phải) hiển thị #teacher-announcements', teacherAnn !== null);
  if (teacherAnn) {
    const textAnn = await teacherAnn.innerText();
    const upperAnn = textAnn.toUpperCase();
    ok('Teacher Announcements có nhãn Thông Báo Giáo Viên',
      upperAnn.includes('THÔNG BÁO') || upperAnn.includes('GIÁO VIÊN') || upperAnn.includes('BAN QUẢN TRỊ')
    );
  }

  // 2.5 Vùng 1 -> Vùng 1x (Personal Quick Access)
  const quickAccess = await page.$('#personal-quick-access');
  ok('Vùng 1x (Cột phải) hiển thị #personal-quick-access', quickAccess !== null);
  if (quickAccess) {
    const textQa = await quickAccess.innerText();
    ok('Personal Quick Access có Trang chủ, Sôi động, Thành tựu',
      textQa.includes('Trang chủ') && textQa.includes('Sôi động') && textQa.includes('Thành tựu')
    );
  }

  // 2.6 Community Board Gate Modal (Chặn truy cập khách và yêu cầu mã)
  console.log('\n== 3. Community Board Gate Modal Test ==');
  const btnBangTin = await page.$('#btn-nav-bang-tin');
  ok('Nút Bảng Tin Cộng Đồng tồn tại (#btn-nav-bang-tin)', btnBangTin !== null);

  if (btnBangTin) {
    await btnBangTin.click();
    await page.waitForTimeout(500);

    const modalGate = await page.$('#modal-community-gate');
    ok('Nhấp Bảng Tin khi chưa đăng nhập hiện modal yêu cầu mã (#modal-community-gate)', modalGate !== null);

    if (modalGate) {
      // Test nhập mã sai
      const inputCode = await page.$('#input-community-gate-code');
      const btnSubmit = await page.$('#btn-submit-community-gate');
      ok('Modal có ô nhập mã và nút xác nhận', inputCode !== null && btnSubmit !== null);

      if (inputCode && btnSubmit) {
        await inputCode.fill('SAI-MA-123');
        await btnSubmit.click();
        await page.waitForTimeout(600);

        const errorMsg = await page.$eval('#modal-community-gate', el => el.innerText);
        ok('Nhập mã sai hiển thị thông báo lỗi',
          errorMsg.includes('không chính xác') || errorMsg.includes('hết hạn') || errorMsg.includes('Lỗi') || errorMsg.includes('khoá')
        );

        // Test nhập mã đúng
        await inputCode.fill('10A7-2026');
        await btnSubmit.click();
        await page.waitForTimeout(1000);

        const currentHash = page.url();
        ok('Nhập mã hợp lệ chuyển trang thành công vào bảng tin lớp',
          currentHash.includes('bang-tin') || currentHash.includes('ban-tin') || currentHash.includes('feed')
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. MOBILE RESPONSIVE ASSERTION (390px Viewport)
  // ─────────────────────────────────────────────────────────────
  console.log('\n== 4. Mobile Responsive Viewport (390px) ==');
  const mobilePage = await ctx.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await mobilePage.goto(`${BASE}/#campus`, { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForLoadState('load').catch(() => {});
  await mobilePage.waitForTimeout(1500);

  const overflowInfo = await mobilePage.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      hasOverflow: doc.scrollWidth > doc.clientWidth
    };
  });

  ok('Không bị tràn ngang trên màn hình mobile 390px (scrollWidth === clientWidth)',
    !overflowInfo.hasOverflow,
    `scrollWidth=${overflowInfo.scrollWidth}, clientWidth=${overflowInfo.clientWidth}`
  );

  // Mobile Bottom Nav visibility
  const mobileNav = await mobilePage.$('.mobile-bottom-nav');
  ok('Thanh điều hướng dưới đáy hiển thị trên mobile', mobileNav !== null);

  // ─────────────────────────────────────────────────────────────
  // 5. STABILITY & CONSOLE ERROR AUDIT
  // ─────────────────────────────────────────────────────────────
  console.log('\n== 5. Stability & Error Audit ==');
  ok('Không có lỗi console nghiêm trọng', loiConsole.length === 0, `errors: ${loiConsole.join('; ')}`);
  ok('Không có lỗi 401 ngoài mong muốn', unexpected401s.length === 0, `401s: ${unexpected401s.join('; ')}`);

  console.log(`\n======================================================`);
  console.log(`KẾT QUẢ QA: ${pass} PASS / ${fail} FAIL`);
  console.log(`======================================================\n`);

  await browser.close();
  if (fail > 0) {
    process.exit(1);
  }
} catch (err) {
  console.error('Lỗi khi chạy QA suite:', err);
  await browser.close();
  process.exit(1);
}
