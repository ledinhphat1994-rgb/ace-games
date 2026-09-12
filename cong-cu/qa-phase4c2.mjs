// ==============================================================================
// cong-cu/qa-phase4c2.mjs
// BỘ KIỂM THỬ TỰ ĐỘNG PHASE 4C.2:
// RATE-LIMIT CORRECTNESS & BENCHMARK PRE-FLIGHT (REAL-BROWSER POLLING VERIFIED)
// ==============================================================================
import path from 'path';
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

let pass = 0, fail = 0;
const resultsByGroup = {
  chat_semantics: { pass: 0, fail: 0 },
  dm_semantics: { pass: 0, fail: 0 },
  search_window: { pass: 0, fail: 0 },
  friend_window: { pass: 0, fail: 0 },
  report_abuse: { pass: 0, fail: 0 },
  browser_polling: { pass: 0, fail: 0 },
};

function ok(ten, dk, group = 'chat_semantics', chiTiet = '') {
  if (dk) {
    pass++;
    if (resultsByGroup[group]) resultsByGroup[group].pass++;
    console.log(`  ✅ [${group.toUpperCase()}] ${ten}`);
  } else {
    fail++;
    if (resultsByGroup[group]) resultsByGroup[group].fail++;
    console.log(`  ❌ [${group.toUpperCase()}] ${ten} ${chiTiet}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function api(pathUrl, { method = 'GET', body = null, cookie = null, headers = {} } = {}) {
  const reqHeaders = { 'Content-Type': 'application/json', ...headers };
  if (cookie) reqHeaders['Cookie'] = cookie;
  const res = await fetch(`${BASE}${pathUrl}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

async function taoSessionCookie(payload) {
  const token = await createToken(devSessionSecret, payload, 3600);
  return `${COOKIE_NAME}=${encodeURIComponent(token)}`;
}

console.log('================================================================');
console.log('🚀 BẮT ĐẦU KIỂM THỬ RATE-LIMIT CORRECTNESS & PRE-FLIGHT (PHASE 4C.2)');
console.log('Target Server:', BASE);
console.log('================================================================\n');

// 1. Nạp fixture test accounts
const uidA = 92001; // Học sinh A
const uidB = 92002; // Học sinh B
const uidC = 92003; // Học sinh C
const uidGV = 92004; // Giáo viên

try {
  const seedFilePath = path.resolve(process.cwd(), 'cong-cu/seed-qa-phase4c2.sql');
  execSync(`npx wrangler d1 execute lop-10a7-db --local --file="${seedFilePath}" -y`, { stdio: 'ignore' });

  // Nạp thêm 15 tài khoản phụ (vai_tro teacher hợp lệ) để test friend request limit 10/min
  let extraAccountsSql = '';
  for (let i = 1; i <= 15; i++) {
    const accId = 92100 + i;
    extraAccountsSql += `DELETE FROM tai_khoan_campus WHERE id = ${accId}; INSERT INTO tai_khoan_campus (id, ten_dang_nhap, mat_khau_hash, salt, ten_hien_thi, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id) VALUES (${accId}, 'qa4c2_target_${i}', 'hash', 'salt', 'Bạn Mẫu ${i}', 'teacher', 0, 1, NULL, 1); `;
  }
  execSync(`npx wrangler d1 execute lop-10a7-db --local --command="${extraAccountsSql}"`, { stdio: 'ignore' });
} catch (e) {
  console.warn('Cảnh báo nạp fixture D1 cục bộ:', e.message);
}

const cookieA = await taoSessionCookie({
  role: 'student',
  accountId: uidA,
  tenDangNhap: 'qa4c2_hsa',
  tenHienThi: 'Nguyễn Tốc Độ A',
  hocSinhId: 5,
  lopId: 1,
  lopIds: [1],
});

const cookieB = await taoSessionCookie({
  role: 'student',
  accountId: uidB,
  tenDangNhap: 'qa4c2_hsb',
  tenHienThi: 'Trần Nhịp Điệu B',
  hocSinhId: 6,
  lopId: 1,
  lopIds: [1],
});

const cookieC = await taoSessionCookie({
  role: 'student',
  accountId: uidC,
  tenDangNhap: 'qa4c2_hsc',
  tenHienThi: 'Lê Bền Bỉ C',
  hocSinhId: 7,
  lopId: 1,
  lopIds: [1],
});

// ─── 1. CHAT UX BURST & SHORT-INTERVAL SEMANTICS ──────────────────────────────
console.log('--- 1. CHAT UX BURST & SHORT-INTERVAL SEMANTICS (2s WINDOW) ---');
// 1.1 Gửi tin nhắn #1 -> 200 OK
const resChat1 = await api('/api/campus-chat', {
  method: 'POST',
  cookie: cookieA,
  body: { noiDung: `Tin nhắn kiểm thử 1 - ${Date.now()}` }
});
ok('Gửi Campus Chat tin #1 thành công (HTTP 200)', resChat1.ok, 'chat_semantics', `Status: ${resChat1.status}`);

// 1.2 Gửi tin nhắn #2 ngay lập tức (< 2s) -> 429 Too Many Requests
const resChatImmediate = await api('/api/campus-chat', {
  method: 'POST',
  cookie: cookieA,
  body: { noiDung: `Tin nhắn spam ngay lập tức - ${Date.now()}` }
});
ok('Gửi Campus Chat ngay lập tức (< 2s) bị chặn 429 Too Many Requests',
  resChatImmediate.status === 429, 'chat_semantics', `Status: ${resChatImmediate.status}`);

// 1.3 Đợi 2.2 giây (vượt qua cửa sổ 2000ms UX throttle)
console.log('  -> Đang chờ 2.2 giây để kiểm tra khôi phục quyền gửi tin...');
await sleep(2200);

// 1.4 Gửi tin nhắn #3 sau 2.2s -> BẮT BUỘC PHẢI THÀNH CÔNG (200 OK)
// Chứng minh KV KHÔNG khóa 60 giây oan uổng đối với người dùng
const resChatAfterWait = await api('/api/campus-chat', {
  method: 'POST',
  cookie: cookieA,
  body: { noiDung: `Tin nhắn hợp lệ sau 2.2s - ${Date.now()}` }
});
ok('Gửi Campus Chat tin #3 sau 2.2s THÀNH CÔNG (200 OK) — Chứng minh KHÔNG bị khóa 60s bởi KV',
  resChatAfterWait.ok, 'chat_semantics', `Status: ${resChatAfterWait.status} - Lỗi: ${resChatAfterWait.data?.loi || 'None'}`);

// ─── 2. DM UX BURST & SHORT-INTERVAL SEMANTICS ────────────────────────────────
console.log('\n--- 2. DM UX BURST & SHORT-INTERVAL SEMANTICS (1s WINDOW) ---');
// 2.1 A gửi DM #1 cho B -> 200 OK
const resDm1 = await api('/api/campus-dm', {
  method: 'POST',
  cookie: cookieA,
  body: { receiverAccountId: uidB, noiDung: `Tin DM #1 - ${Date.now()}` }
});
ok('Gửi tin nhắn riêng DM #1 thành công (HTTP 200)', resDm1.ok, 'dm_semantics', `Status: ${resDm1.status}`);

// 2.2 A gửi DM #2 ngay lập tức (< 1s) -> 429 Too Many Requests
const resDmImmediate = await api('/api/campus-dm', {
  method: 'POST',
  cookie: cookieA,
  body: { receiverAccountId: uidB, noiDung: `Tin DM spam tức thì - ${Date.now()}` }
});
ok('Gửi tin nhắn riêng DM ngay tức thì (< 1s) bị chặn 429 Too Many Requests',
  resDmImmediate.status === 429, 'dm_semantics', `Status: ${resDmImmediate.status}`);

// 2.3 Chờ 1.2 giây
console.log('  -> Đang chờ 1.2 giây để kiểm tra khôi phục gửi DM...');
await sleep(1200);

// 2.4 A gửi DM #3 cho B sau 1.2s -> BẮT BUỘC THÀNH CÔNG (200 OK)
const resDmAfterWait = await api('/api/campus-dm', {
  method: 'POST',
  cookie: cookieA,
  body: { receiverAccountId: uidB, noiDung: `Tin DM hợp lệ sau 1.2s - ${Date.now()}` }
});
ok('Gửi tin nhắn riêng DM sau 1.2s THÀNH CÔNG (200 OK) — Chứng minh KHÔNG bị khóa 60s bởi KV',
  resDmAfterWait.ok, 'dm_semantics', `Status: ${resDmAfterWait.status} - Lỗi: ${resDmAfterWait.data?.loi || 'None'}`);

// ─── 3. FRIEND SEARCH WINDOW & RESET VERIFICATION ────────────────────────────
console.log('\n--- 3. FRIEND SEARCH WINDOW & RESET (20/MINUTE) ---');
// Tạo tài khoản tìm kiếm chuyên biệt theo timestamp (tránh cache time-bucket cũ)
const uidSearch = 92060 + (Date.now() % 30);
try {
  execSync(`npx wrangler d1 execute lop-10a7-db --local --command="DELETE FROM tai_khoan_campus WHERE id = ${uidSearch}; INSERT INTO tai_khoan_campus (id, ten_dang_nhap, mat_khau_hash, salt, ten_hien_thi, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id) VALUES (${uidSearch}, 'qa4c2_srch_${uidSearch}', 'hash', 'salt', 'Searcher', 'teacher', 0, 1, NULL, 1);"`, { stdio: 'ignore' });
} catch {}

const cookieSearch = await taoSessionCookie({
  role: 'teacher',
  accountId: uidSearch,
  tenDangNhap: `qa4c2_srch_${uidSearch}`,
  tenHienThi: 'Searcher',
  hocSinhId: null,
  lopId: 1,
  lopIds: [1],
});

// Thực hiện 20 lượt tìm kiếm hợp lệ liên tiếp
let searchSuccess = 0;
for (let i = 0; i < 20; i++) {
  const r = await api('/api/campus-friends', {
    method: 'POST',
    cookie: cookieSearch,
    body: { action: 'search', query: 'qa4c2_' }
  });
  if (r.ok) searchSuccess++;
}
ok('20 lượt tìm kiếm đầu tiên trong phút thành công', searchSuccess === 20, 'search_window', `Thành công: ${searchSuccess}/20`);

// Lượt thứ 21 trong cùng cửa sổ 60s BẮT BUỘC nhận 429
const resSearch21 = await api('/api/campus-friends', {
  method: 'POST',
  cookie: cookieSearch,
  body: { action: 'search', query: 'qa4c2_' }
});
ok('Lượt tìm kiếm thứ 21 trong cùng phút bị chặn 429 Too Many Requests',
  resSearch21.status === 429, 'search_window', `Status: ${resSearch21.status}`);

// ─── 4. FRIEND REQUEST WINDOW & ALIGNMENT (10/MINUTE) ─────────────────────────
console.log('\n--- 4. FRIEND REQUEST WINDOW & ALIGNMENT (10/MINUTE) ---');
// Tạo tài khoản gửi lời mời chuyên biệt theo timestamp
const uidFreq = 92070 + (Date.now() % 30);
try {
  execSync(`npx wrangler d1 execute lop-10a7-db --local --command="DELETE FROM campus_friendship WHERE requester_account_id = ${uidFreq} OR addressee_account_id = ${uidFreq}; DELETE FROM tai_khoan_campus WHERE id = ${uidFreq}; INSERT INTO tai_khoan_campus (id, ten_dang_nhap, mat_khau_hash, salt, ten_hien_thi, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id) VALUES (${uidFreq}, 'qa4c2_freq_${uidFreq}', 'hash', 'salt', 'Requester', 'teacher', 0, 1, NULL, 1);"`, { stdio: 'ignore' });
} catch {}

const cookieFreq = await taoSessionCookie({
  role: 'teacher',
  accountId: uidFreq,
  tenDangNhap: `qa4c2_freq_${uidFreq}`,
  tenHienThi: 'Requester',
  hocSinhId: null,
  lopId: 1,
  lopIds: [1],
});

// Gửi 10 lời mời kết bạn đến 10 tài khoản khác nhau
let friendReqSuccess = 0;
for (let i = 1; i <= 10; i++) {
  const targetId = 92100 + i;
  const r = await api('/api/campus-friends', {
    method: 'POST',
    cookie: cookieFreq,
    body: { action: 'request', targetAccountId: targetId }
  });
  if (r.ok) friendReqSuccess++;
}
ok('10 lời mời kết bạn đầu tiên trong phút thành công', friendReqSuccess === 10, 'friend_window', `Thành công: ${friendReqSuccess}/10`);

// Lời mời thứ 11 trong cùng phút BẮT BUỘC nhận 429
const resFreq11 = await api('/api/campus-friends', {
  method: 'POST',
  cookie: cookieFreq,
  body: { action: 'request', targetAccountId: 92111 }
});
ok('Lời mời kết bạn thứ 11 trong cùng phút bị chặn 429 Too Many Requests (chính xác 10/phút)',
  resFreq11.status === 429, 'friend_window', `Status: ${resFreq11.status}`);

// ─── 5. REPORT ABUSE CEILING (10/5-MINUTES) ───────────────────────────────────
console.log('\n--- 5. REPORT ABUSE CEILING (10/5-MINUTES) ---');
// Tạo tài khoản báo cáo chuyên biệt theo timestamp
const uidReporter = 92080 + (Date.now() % 30);
try {
  execSync(`npx wrangler d1 execute lop-10a7-db --local --command="DELETE FROM campus_report WHERE reporter_account_id = ${uidReporter}; DELETE FROM tai_khoan_campus WHERE id = ${uidReporter}; INSERT INTO tai_khoan_campus (id, ten_dang_nhap, mat_khau_hash, salt, ten_hien_thi, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id) VALUES (${uidReporter}, 'qa4c2_rep_${uidReporter}', 'hash', 'salt', 'Người Báo Cáo', 'teacher', 0, 1, NULL, 1);"`, { stdio: 'ignore' });
} catch {}

const cookieReporter = await taoSessionCookie({
  role: 'teacher',
  accountId: uidReporter,
  tenDangNhap: `qa4c2_rep_${uidReporter}`,
  tenHienThi: 'Người Báo Cáo',
  hocSinhId: null,
  lopId: 1,
  lopIds: [1],
});

let reportSuccess = 0;
for (let i = 0; i < 10; i++) {
  const r = await api('/api/campus-dm', {
    method: 'POST',
    cookie: cookieReporter,
    body: { action: 'report', targetAccountId: uidA, reason: `Spam test report ${i}` }
  });
  if (r.ok) reportSuccess++;
}
ok('10 lượt báo cáo đầu tiên trong 5 phút thành công', reportSuccess === 10, 'report_abuse', `Thành công: ${reportSuccess}/10`);

// Lượt báo cáo thứ 11 BẮT BUỘC nhận 429
const resReport11 = await api('/api/campus-dm', {
  method: 'POST',
  cookie: cookieReporter,
  body: { action: 'report', targetAccountId: uidA, reason: 'Report spam 11' }
});
ok('Lượt báo cáo thứ 11 trong cùng cửa sổ 5 phút bị chặn 429 Too Many Requests',
  resReport11.status === 429, 'report_abuse', `Status: ${resReport11.status}`);

// ─── 6. REAL PLAYWRIGHT BROWSER POLLING PRE-FLIGHT VERIFICATION ───────────────
console.log('\n--- 6. REAL PLAYWRIGHT BROWSER POLLING PRE-FLIGHT ---');
const browser = await chromium.launch();

try {
  // --- 6.A Mobile Viewport (390x844): Chat Drawer Closed -> Zero Polling ---
  console.log('  -> Khởi chạy trình duyệt Mobile 390px...');
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });

  // Đặt cookie học sinh đã đăng nhập
  const tokenA = await createToken(devSessionSecret, {
    role: 'student',
    accountId: uidA,
    tenDangNhap: 'qa4c2_hsa',
    tenHienThi: 'Nguyễn Tốc Độ A',
    hocSinhId: 5,
    lopId: 1,
    lopIds: [1],
  }, 3600);

  await mobileCtx.addCookies([{
    name: COOKIE_NAME,
    value: tokenA,
    domain: '127.0.0.1',
    path: '/',
    httpOnly: true,
  }]);

  const mobilePage = await mobileCtx.newPage();
  let mobileChatReqCount = 0;
  mobilePage.on('request', (req) => {
    if (req.url().includes('/api/campus-chat')) {
      mobileChatReqCount++;
    }
  });

  await mobilePage.goto(BASE, { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForSelector('#mobile-campus-chat-btn', { state: 'attached' });
  await sleep(1500);

  console.log('  -> Đo lường request Campus Chat trên Mobile khi Drawer ĐANG ĐÓNG trong 12 giây...');
  mobileChatReqCount = 0;
  await sleep(12000);

  ok('Trên Mobile (390px), khi Chat Drawer ĐÓNG trong 12s: CHÍNH XÁC 0 request /api/campus-chat',
    mobileChatReqCount === 0, 'browser_polling', `Số request: ${mobileChatReqCount}`);

  // Mở Chat Drawer trên mobile
  console.log('  -> Bấm mở Chat Drawer trên Mobile (#mobile-campus-chat-btn)...');
  await mobilePage.click('#mobile-campus-chat-btn');
  await sleep(1000);

  mobileChatReqCount = 0;
  console.log('  -> Đo lường request Campus Chat khi Drawer ĐÃ MỞ trong 9 giây...');
  await sleep(9000);

  ok('Khi Chat Drawer Mobile MỞ: Có ĐÚNG 1 vòng lặp polling hoạt động (~1 request mỗi 4s)',
    mobileChatReqCount >= 1 && mobileChatReqCount <= 3, 'browser_polling', `Số request: ${mobileChatReqCount}`);

  // Đóng Chat Drawer
  console.log('  -> Bấm đóng Chat Drawer...');
  await mobilePage.click('button:has-text("✕")');
  await sleep(500);

  mobileChatReqCount = 0;
  console.log('  -> Đo lường request sau khi đóng Drawer trong 6 giây...');
  await sleep(6000);

  ok('Sau khi đóng Drawer trên Mobile: Polling Campus Chat DỪNG HẲN (0 request phát sinh)',
    mobileChatReqCount === 0, 'browser_polling', `Số request: ${mobileChatReqCount}`);

  await mobileCtx.close();

  // --- 6.B Desktop Viewport (1280x800): Campus Tab vs Other Tabs ---
  console.log('  -> Khởi chạy trình duyệt Desktop 1280px...');
  const desktopCtx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  await desktopCtx.addCookies([{
    name: COOKIE_NAME,
    value: tokenA,
    domain: '127.0.0.1',
    path: '/',
    httpOnly: true,
  }]);

  const desktopPage = await desktopCtx.newPage();
  let desktopChatReqCount = 0;
  desktopPage.on('request', (req) => {
    if (req.url().includes('/api/campus-chat')) {
      desktopChatReqCount++;
    }
  });

  await desktopPage.goto(BASE, { waitUntil: 'domcontentloaded' });
  await desktopPage.waitForSelector('#campus-chat-rail', { state: 'attached' });
  await sleep(1500);

  // Kiểm tra polling trên Desktop Campus Tab
  console.log('  -> Đo lường Desktop khi đang ở Campus Tab trong 9 giây...');
  desktopChatReqCount = 0;
  await sleep(9000);

  ok('Trên Desktop (1280px) tại Campus: Có ĐÚNG 1 vòng lặp polling hoạt động',
    desktopChatReqCount >= 1 && desktopChatReqCount <= 3, 'browser_polling', `Số request: ${desktopChatReqCount}`);

  // Rời khỏi Campus tab (chuyển sang Class Board #/bang-tin-lop)
  console.log('  -> Chuyển tab rời khỏi Campus (#/bang-tin-lop)...');
  await desktopPage.evaluate(() => {
    window.location.hash = '#/bang-tin-lop';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  await desktopPage.waitForSelector('#campus-chat-rail', { state: 'detached', timeout: 10000 });
  await sleep(500);

  desktopChatReqCount = 0;
  console.log('  -> Đo lường Desktop sau khi rời khỏi Campus trong 6 giây...');
  await sleep(6000);

  ok('Khi chuyển sang tab khác ngoài Campus: Polling Campus Chat DỪNG HẲN (0 request)',
    desktopChatReqCount === 0, 'browser_polling', `Số request: ${desktopChatReqCount}`);

  await desktopCtx.close();
} finally {
  await browser.close();
}

// ─── TỔNG KẾT BÁO CÁO ─────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`📊 TỔNG KẾT KIỂM THỬ PHASE 4C.2: ${pass} ĐẠT, ${fail} HỎNG`);
console.log('Chi tiết theo nhóm:');
for (const [group, res] of Object.entries(resultsByGroup)) {
  console.log(`  - [${group.toUpperCase()}]: ${res.pass} PASS / ${res.pass + res.fail} TOTAL`);
}
console.log('================================================================\n');

if (fail > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
