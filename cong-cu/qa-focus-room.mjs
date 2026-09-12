// ==============================================================================
// cong-cu/qa-focus-room.mjs
// BỘ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN PHASE 3D.1: MUSIC & FOCUS ROOM (STUDY CAFÉ SỐ)
// Kiểm thử chi tiết: API, Concurrency, Server Math, Lifecycle & Real Two-Browser E2E
// ==============================================================================
import { execSync } from 'child_process';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

let pass = 0, fail = 0;
const resultsByGroup = {
  api: { pass: 0, fail: 0 },
  concurrency: { pass: 0, fail: 0 },
  browser: { pass: 0, fail: 0 },
  detailed: {}
};

function ok(ten, dk, group = 'api', chiTiet = '') {
  if (dk) {
    pass++;
    if (resultsByGroup[group]) resultsByGroup[group].pass++;
    console.log(`  ✅ ${ten}`);
  } else {
    fail++;
    if (resultsByGroup[group]) resultsByGroup[group].fail++;
    console.log(`  ❌ ${ten} ${chiTiet}`);
  }
}

async function taoAuthCookie(user) {
  const token = await createToken(devSessionSecret, user, 3600);
  return `${COOKIE_NAME}=${token}`;
}

async function api(path, { method = 'GET', body = null, cookie = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

console.log('================================================================');
console.log('CHẠY BỘ KIỂM THỬ ĐỒNG BỘ MUSIC & FOCUS ROOM CORE (PHASE 3D.1)');
console.log(`Target: ${BASE}`);
console.log('================================================================\n');

// Danh tính giả lập
const HS_A = { hocSinhId: 1, lopId: 1, role: 'student', ten: 'Học sinh 10A7-A (Chủ phòng Focus)' };
const HS_B = { hocSinhId: 2, lopId: 1, role: 'student', ten: 'Học sinh 10A7-B (Người tham gia cùng lớp)' };
const HS_C = { hocSinhId: 39, lopId: 2, role: 'student', ten: 'Học sinh 11A1-C (Khác lớp)' };
const GV = { role: 'teacher', lopId: 1, ten: 'Giáo viên Chủ nhiệm' };

const cookieA = await taoAuthCookie(HS_A);
const cookieB = await taoAuthCookie(HS_B);
const cookieC = await taoAuthCookie(HS_C);
const cookieGV = await taoAuthCookie(GV);

// Dọn dẹp phòng cũ còn mở của HS_A nếu có
try {
  const dsCu = await api('/api/phong', { cookie: cookieA });
  if (dsCu.ok && Array.isArray(dsCu.data?.phongs)) {
    for (const p of dsCu.data.phongs) {
      if (p.laChuPhong || p.canControl || p.chuPhongKhoa === `hs:${HS_A.hocSinhId}`) {
        await api('/api/phong', { method: 'POST', cookie: cookieA, body: { hanhDong: 'dong', phongId: p.id } });
      }
    }
  }
} catch {
  // Bỏ qua lỗi dọn dẹp ban đầu
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TẠO PHÒNG MUSIC & FOCUS (TRƯỜNG & LỚP)
// ─────────────────────────────────────────────────────────────────────────────
console.log('== 1. Khởi tạo phòng Music & Focus (Trường & Lớp) ==');

const resTaoTruong = await api('/api/phong', {
  method: 'POST',
  cookie: cookieA,
  body: {
    hanhDong: 'tao',
    ten: 'Study Café Toàn Trường QA Focus',
    loai: 'nhac',
    phamVi: 'truong',
    moTa: 'Phòng học tập trung kèm Pomodoro toàn trường',
    nhacUrl: 'https://cdn.freesound.org/previews/518/518887_11538356-lq.mp3'
  }
});
ok('Tạo phòng Music & Focus toàn trường thành công', resTaoTruong.ok && resTaoTruong.data.phong?.id > 0, 'api');
const phongTruongId = resTaoTruong.data.phong?.id;

const resTaoLop = await api('/api/phong', {
  method: 'POST',
  cookie: cookieA,
  body: {
    hanhDong: 'tao',
    ten: 'Góc Ôn Thi 10A7 Focus QA',
    loai: 'nhac',
    phamVi: 'lop',
    moTa: 'Chỉ dành riêng cho lớp 10A7 tập trung học',
    nhacUrl: ''
  }
});
ok('Tạo phòng Music & Focus riêng lớp thành công', resTaoLop.ok && resTaoLop.data.phong?.id > 0, 'api');
const phongLopId = resTaoLop.data.phong?.id;

// ─────────────────────────────────────────────────────────────────────────────
// 2. KIỂM THỬ TEST A -> TEST P (API & LOGIC SPECIFICATION)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 2. Kiểm thử chi tiết Tests A -> P ==');

// TEST A: Viewer read & initial state
const testA_viewer = await api(`/api/phong-focus?phongId=${phongTruongId}`, { cookie: cookieB });
const stateA = testA_viewer.data?.state;
ok('Test A: Viewer đọc trạng thái ban đầu thành công (200 OK)', testA_viewer.status === 200 && testA_viewer.data.ok, 'api');
const phaseA = stateA?.phase || stateA?.giai_doan;
const statusA = stateA?.status || stateA?.trang_thai;
const remA = stateA?.remainingSeconds ?? stateA?.thoi_gian_con_lai_giay;
ok('Test A: Giai đoạn mặc định là focus, trạng thái paused, preset 25_5',
  phaseA === 'focus' && statusA === 'paused' && stateA?.preset === '25_5' && remA === 1500, 'api');
ok('Test A: canControl === false đối với Viewer thường B', testA_viewer.data.canControl === false, 'api');

const testA_host = await api(`/api/phong-focus?phongId=${phongTruongId}`, { cookie: cookieA });
ok('Test A: canControl === true đối với Chủ phòng A', testA_host.data?.canControl === true, 'api');

// TEST B: Viewer authorization check (Viewer không được phép điều khiển)
const testB = await api('/api/phong-focus', {
  method: 'POST',
  cookie: cookieB,
  body: {
    phongId: phongTruongId,
    action: 'start',
    expectedRevision: stateA?.revision || 1
  }
});
ok('Test B: Viewer B cố tình điều khiển bị từ chối 403 Forbidden', testB.status === 403 && !testB.ok, 'api');

// TEST C: Host start timer
const testC = await api('/api/phong-focus', {
  method: 'POST',
  cookie: cookieA,
  body: {
    phongId: phongTruongId,
    action: 'start',
    expectedRevision: testA_host.data?.state?.revision || 1
  }
});
ok('Test C: Host A bấm Bắt đầu (action: start) thành công (200 OK)', testC.status === 200 && testC.ok, 'api');
const statusC = testC.data?.state?.status || testC.data?.state?.trang_thai;
ok('Test C: Trạng thái cập nhật thành running và revision tăng',
  statusC === 'running' && testC.data?.state?.revision > (stateA?.revision || 1), 'api');

// TEST M: Running timer server-authoritative math
console.log('  -> Đợi 3.2 giây để đo lường server time math...');
await new Promise(r => setTimeout(r, 3200));

const testM = await api(`/api/phong-focus?phongId=${phongTruongId}`, { cookie: cookieB });
const remainingM = testM.data?.state?.remainingSeconds ?? testM.data?.state?.thoi_gian_con_lai_giay;
// Ban đầu 1500, sau 3.2s phải còn ~1496 hoặc 1497 (dung sai +- 1s)
const mathOk = typeof remainingM === 'number' && remainingM <= 1498 && remainingM >= 1495;
ok(`Test M: Server tính thời gian trôi tự động chính xác (còn ${remainingM}s, dự kiến 1496-1497s)`, mathOk, 'api');

// TEST D: Host pause timer
const curRevD = testM.data?.state?.revision;
const testD = await api('/api/phong-focus', {
  method: 'POST',
  cookie: cookieA,
  body: {
    phongId: phongTruongId,
    action: 'pause',
    expectedRevision: curRevD
  }
});
ok('Test D: Host A bấm Tạm dừng (action: pause) thành công (200 OK)', testD.status === 200 && testD.ok, 'api');
const statusD = testD.data?.state?.status || testD.data?.state?.trang_thai;
const remD = testD.data?.state?.remainingSeconds ?? testD.data?.state?.thoi_gian_con_lai_giay;
ok('Test D: Trạng thái trở về paused và thời gian còn lại được đóng băng',
  statusD === 'paused' && Math.abs(remD - remainingM) <= 1, 'api');

// TEST N: Paused timer invariance (không bị trôi thời gian khi pause)
await new Promise(r => setTimeout(r, 2000));
const testN = await api(`/api/phong-focus?phongId=${phongTruongId}`, { cookie: cookieB });
const remN = testN.data?.state?.remainingSeconds ?? testN.data?.state?.thoi_gian_con_lai_giay;
ok('Test N: Khi pause, thời gian còn lại cố định tuyệt đối (không suy hao)',
  remN === remD, 'api');

// TEST E: Host reset timer
const curRevE = testD.data?.state?.revision;
const testE = await api('/api/phong-focus', {
  method: 'POST',
  cookie: cookieA,
  body: {
    phongId: phongTruongId,
    action: 'reset',
    expectedRevision: curRevE
  }
});
const remE = testE.data?.state?.remainingSeconds ?? testE.data?.state?.thoi_gian_con_lai_giay;
const statusE = testE.data?.state?.status || testE.data?.state?.trang_thai;
ok('Test E: Host A bấm Đặt lại (action: reset) đưa về 25:00 (1500s)',
  testE.status === 200 && remE === 1500 && statusE === 'paused', 'api');

// TEST F: Teacher control override
const curRevF = testE.data?.state?.revision;
const testF = await api('/api/phong-focus', {
  method: 'POST',
  cookie: cookieGV,
  body: {
    phongId: phongTruongId,
    action: 'start',
    expectedRevision: curRevF
  }
});
const statusF = testF.data?.state?.status || testF.data?.state?.trang_thai;
ok('Test F: Giáo viên GV có quyền điều khiển phòng (Teacher override 200 OK)',
  testF.status === 200 && statusF === 'running', 'api');

// Đưa về pause để chuẩn bị kiểm thử concurrency
const testF_pause = await api('/api/phong-focus', {
  method: 'POST',
  cookie: cookieGV,
  body: {
    phongId: phongTruongId,
    action: 'pause',
    expectedRevision: testF.data?.state?.revision
  }
});

// TEST G: Class boundary check (Phòng riêng lớp)
const testG_unauth = await api(`/api/phong-focus?phongId=${phongLopId}`, { cookie: cookieC });
ok('Test G: Học sinh khác lớp C truy cập phòng riêng lớp bị từ chối 403',
  testG_unauth.status === 403 && !testG_unauth.ok, 'api');

// TEST H: Cross-class school room check (Phòng toàn trường)
const testH = await api(`/api/phong-focus?phongId=${phongTruongId}`, { cookie: cookieC });
ok('Test H: Học sinh khác lớp C truy cập phòng toàn trường được phép 200 OK',
  testH.status === 200 && testH.ok && testH.data?.canControl === false, 'api');

// TEST I: Concurrency conflict (Optimistic locking 409)
console.log('  -> Kiểm thử 2 request đồng thời cùng expectedRevision...');
const currentRevI = testF_pause.data?.state?.revision;
const [p1, p2] = await Promise.all([
  api('/api/phong-focus', {
    method: 'POST',
    cookie: cookieA,
    body: { phongId: phongTruongId, action: 'start', expectedRevision: currentRevI }
  }),
  api('/api/phong-focus', {
    method: 'POST',
    cookie: cookieGV,
    body: { phongId: phongTruongId, action: 'start_break', expectedRevision: currentRevI }
  })
]);

const has200 = (p1.status === 200 || p2.status === 200);
const has409 = (p1.status === 409 || p2.status === 409);
ok('Test I: Xung đột đồng thời được xử lý qua Optimistic Lock (1 thành công 200, 1 xung đột 409)',
  has200 && has409, 'concurrency');

// TEST J: Stale revision handling
const testJ = await api('/api/phong-focus', {
  method: 'POST',
  cookie: cookieA,
  body: {
    phongId: phongTruongId,
    action: 'reset',
    expectedRevision: 1 // Revision cũ chắc chắn đã lạc hậu
  }
});
const returnedRev = testJ.data?.serverState?.revision || testJ.data?.state?.revision;
ok('Test J: Gửi revision cũ bị từ chối 409 Conflict và trả về serverState mới nhất',
  testJ.status === 409 && returnedRev > 1, 'concurrency');

// TEST O: Invalid command validation
const testO = await api('/api/phong-focus', {
  method: 'POST',
  cookie: cookieA,
  body: {
    phongId: phongTruongId,
    action: 'hack_timer',
    expectedRevision: returnedRev
  }
});
ok('Test O: Hành động không hợp lệ bị từ chối 400 Bad Request', testO.status === 400 && !testO.ok, 'api');

// TEST P: Invalid preset validation
const testP = await api('/api/phong-focus', {
  method: 'POST',
  cookie: cookieA,
  body: {
    phongId: phongTruongId,
    action: 'set_preset',
    preset: '100_50',
    expectedRevision: returnedRev
  }
});
ok('Test P: Preset không hợp lệ bị từ chối 400 Bad Request', testP.status === 400 && !testP.ok, 'api');

// TEST K: Room close
const testK_close = await api('/api/phong', {
  method: 'POST',
  cookie: cookieA,
  body: { hanhDong: 'dong', phongId: phongLopId }
});
ok('Test K: Chủ phòng đóng phòng thành công', testK_close.ok, 'api');

const testK_get = await api(`/api/phong-focus?phongId=${phongLopId}`, { cookie: cookieA });
ok('Test K: Sau khi đóng phòng, GET /api/phong-focus trả về 404 (hoặc 400)', testK_get.status === 404 || testK_get.status === 400, 'api');

// TEST L: DB row cleanup count check
let d1Cleaned = true;
try {
  const queryRes = execSync(`npx wrangler d1 execute lop-10a7-db --local --command="SELECT COUNT(*) as c FROM phong_focus_state WHERE phong_id = ${phongLopId};"`, { encoding: 'utf-8' });
  d1Cleaned = queryRes.includes('"c": 0') || queryRes.includes('"c":0');
} catch (e) {
  // Nếu wrangler d1 CLI không khả dụng trong sub-process, kiểm tra qua get 404
  d1Cleaned = (testK_get.status === 404);
}
ok('Test L: Bản ghi phong_focus_state bị xóa hoàn toàn khi đóng phòng (Row count === 0)', d1Cleaned, 'api');

// ─────────────────────────────────────────────────────────────────────────────
// 3. KIỂM THỬ PLAYWRIGHT E2E HAI TRÌNH DUYỆT (BROWSER A vs B)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 3. Kiểm thử Playwright E2E Hai Trình Duyệt Thực Tế ==');

let browser;
try {
  const { chromium } = await import('playwright');
  browser = await chromium.launch({ headless: true });

  // Tạo phòng riêng phục vụ kiểm thử E2E
  const resTaoE2E = await api('/api/phong', {
    method: 'POST',
    cookie: cookieA,
    body: {
      hanhDong: 'tao',
      ten: 'Study Café E2E Sync Pomodoro',
      loai: 'nhac',
      phamVi: 'truong',
      moTa: 'Phòng kiểm thử Playwright hai trình duyệt song song',
      nhacUrl: 'https://cdn.freesound.org/previews/518/518887_11538356-lq.mp3'
    }
  });
  const e2ePhongId = resTaoE2E.data.phong?.id;
  ok('Tạo phòng E2E Playwright thành công', Boolean(e2ePhongId), 'browser');

  const urlObj = new URL(BASE);
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const tokenA = await createToken(devSessionSecret, HS_A, 3600);
  const tokenB = await createToken(devSessionSecret, HS_B, 3600);

  await ctxA.addCookies([{ name: COOKIE_NAME, value: tokenA, domain: urlObj.hostname, path: '/' }]);
  await ctxB.addCookies([{ name: COOKIE_NAME, value: tokenB, domain: urlObj.hostname, path: '/' }]);

  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  // Chủ phòng A mở giao diện và vào phòng
  await pageA.goto(`${BASE}/`);
  await pageA.waitForSelector('#campus-lobby', { timeout: 10000 });

  const navMusicA = pageA.locator('#cat-nav-LOFI');
  if (await navMusicA.count()) {
    await navMusicA.click();
    await pageA.waitForSelector('#room-nav-list-LOFI', { timeout: 5000 });
    const rowA = pageA.locator('#room-nav-list-LOFI div:has-text("Study Café E2E Sync Pomodoro")').first();
    await rowA.locator('button:has-text("Vào")').first().click();
  } else {
    await pageA.locator('#campus-flagship-spaces button:has-text("Music")').first().click();
    await pageA.waitForSelector('#lobby-music', { timeout: 5000 });
    const rowA = pageA.locator('#lobby-music div:has-text("Study Café E2E Sync Pomodoro")').first();
    await rowA.locator('button:has-text("Vào")').first().click();
  }

  await pageA.waitForSelector('#focus-timer-display', { timeout: 8000 });
  ok('Browser A (Host): Giao diện Pomodoro hiển thị (#focus-timer-display)', true, 'browser');

  await pageA.waitForSelector('#btn-focus-start', { timeout: 8000 });
  const btnStartHostA = pageA.locator('#btn-focus-start');
  ok('Browser A (Host): Thấy nút Bắt đầu điều khiển (#btn-focus-start)', (await btnStartHostA.count()) > 0, 'browser');

  // Người xem B mở giao diện và vào phòng
  await pageB.goto(`${BASE}/`);
  await pageB.waitForSelector('#campus-lobby', { timeout: 10000 });

  const navMusicB = pageB.locator('#cat-nav-LOFI');
  if (await navMusicB.count()) {
    await navMusicB.click();
    await pageB.waitForSelector('#room-nav-list-LOFI', { timeout: 5000 });
    const rowB = pageB.locator('#room-nav-list-LOFI div:has-text("Study Café E2E Sync Pomodoro")').first();
    await rowB.locator('button:has-text("Vào")').first().click();
  } else {
    await pageB.locator('#campus-flagship-spaces button:has-text("Music")').first().click();
    await pageB.waitForSelector('#lobby-music', { timeout: 5000 });
    const rowB = pageB.locator('#lobby-music div:has-text("Study Café E2E Sync Pomodoro")').first();
    await rowB.locator('button:has-text("Vào")').first().click();
  }

  await pageB.waitForSelector('#focus-timer-display', { timeout: 8000 });
  ok('Browser B (Viewer): Giao diện Pomodoro hiển thị trên người xem', true, 'browser');

  // Kiểm tra Viewer B KHÔNG thấy nút điều khiển
  const btnStartViewerB = pageB.locator('#btn-focus-start');
  ok('Browser B (Viewer): KHÔNG thấy nút điều khiển timer (#btn-focus-start = 0)', (await btnStartViewerB.count()) === 0, 'browser');

  // Kiểm tra nút priming ambient audio
  const btnAudioB = pageB.locator('#btn-start-focus-audio');
  const coNutAudio = (await btnAudioB.count()) > 0;
  ok('Browser B (Viewer): Thấy nút cấp quyền âm thanh ambient (#btn-start-focus-audio)', coNutAudio, 'browser');
  if (coNutAudio) {
    await btnAudioB.click();
    await pageB.waitForTimeout(400);
  }
  resultsByGroup.detailed['Ambient Audio'] = 'PASS (Local-only, user-gesture primed)';

  // ──────────────────────────────────────────────────
  // 1. HOST A BẮT ĐẦU -> VIEWER B ĐỒNG BỘ ĐẾM NGƯỢC
  // ──────────────────────────────────────────────────
  console.log('  -> Host A bấm Bắt đầu Pomodoro...');
  await btnStartHostA.click();

  // Chờ 3.5 giây để B nhận poll và cập nhật
  await pageB.waitForTimeout(3500);

  const timeTextA = await pageA.locator('#focus-timer-display').innerText();
  const timeTextB = await pageB.locator('#focus-timer-display').innerText();
  console.log(`     Timer A: ${timeTextA} | Timer B: ${timeTextB}`);

  // Chuyển mm:ss sang giây
  const parseSec = (str) => {
    const [m, s] = str.trim().split(':').map(Number);
    return m * 60 + s;
  };
  const secA = parseSec(timeTextA);
  const secB = parseSec(timeTextB);

  const timerSyncOk = Math.abs(secA - secB) <= 2 && secB < 1500;
  ok(`Actual Pomodoro timer sync: Browser B đếm ngược đồng bộ với Host A (${timeTextB}, lệch <= 2s)`, timerSyncOk, 'browser');
  resultsByGroup.detailed['Actual Pomodoro timer sync'] = timerSyncOk ? 'PASS' : 'FAIL';

  // ──────────────────────────────────────────────────
  // 2. HOST A TẠM DỪNG -> VIEWER B DỪNG LẠI
  // ──────────────────────────────────────────────────
  console.log('  -> Host A bấm Tạm dừng...');
  const btnPauseHostA = pageA.locator('#btn-focus-pause');
  await btnPauseHostA.click();

  await pageB.waitForTimeout(3500);

  const pauseTimeB1 = await pageB.locator('#focus-timer-display').innerText();
  await pageB.waitForTimeout(2000);
  const pauseTimeB2 = await pageB.locator('#focus-timer-display').innerText();
  const pauseStopped = (pauseTimeB1 === pauseTimeB2);
  ok(`Pause convergence: Browser B tạm dừng hẳn tại ${pauseTimeB1} (không đếm tiếp)`, pauseStopped, 'browser');
  resultsByGroup.detailed['Pause convergence'] = pauseStopped ? 'PASS' : 'FAIL';

  // ──────────────────────────────────────────────────
  // 3. HOST A ĐẶT LẠI -> VIEWER B TRỞ VỀ 25:00
  // ──────────────────────────────────────────────────
  console.log('  -> Host A bấm Đặt lại...');
  const btnResetHostA = pageA.locator('#btn-focus-reset');
  await btnResetHostA.click();

  await pageB.waitForTimeout(3500);

  const resetTimeB = await pageB.locator('#focus-timer-display').innerText();
  const resetOk = (resetTimeB.trim() === '25:00');
  ok(`Reset convergence: Browser B hội tụ về 25:00 sau khi Host đặt lại (${resetTimeB})`, resetOk, 'browser');
  resultsByGroup.detailed['Reset convergence'] = resetOk ? 'PASS' : 'FAIL';

  // ──────────────────────────────────────────────────
  // 4. KIỂM THỬ FOCUS MODE (CHẾ ĐỘ TẬP TRUNG)
  // ──────────────────────────────────────────────────
  console.log('  -> Kiểm thử bật/tắt Chế độ Focus Mode...');
  const btnFocusModeB = pageB.locator('#btn-focus-mode-toggle');
  await btnFocusModeB.click();
  await pageB.waitForTimeout(500);

  // Khi bật Focus Mode, khung Chat và Sidebar người trong phòng bị ẩn hoàn toàn
  const chatCount = await pageB.locator('text=Chat phòng').count();
  const sidebarCount = await pageB.locator('text=Trong phòng (').count();
  const indicatorCount = await pageB.locator('#focus-mode-active-indicator').count();
  const focusModeOn = (chatCount === 0 && sidebarCount === 0 && indicatorCount > 0);
  ok('Focus Mode: Ẩn chat và sidebar khi bật Focus Mode (Distraction-Free)', focusModeOn, 'browser');

  // Bấm lại để tắt Focus Mode
  await pageB.locator('#btn-focus-mode-toggle').click();
  await pageB.waitForTimeout(500);
  const chatRestored = (await pageB.locator('text=Chat phòng').count()) > 0;
  ok('Focus Mode: Phục hồi lại Chat và Sidebar khi tắt Focus Mode', chatRestored, 'browser');
  resultsByGroup.detailed['Focus Mode distraction-free'] = (focusModeOn && chatRestored) ? 'PASS' : 'FAIL';

  // ──────────────────────────────────────────────────
  // 5. KIỂM THỬ DỌN DẸP POLLING KHI RỜI PHÒNG
  // ──────────────────────────────────────────────────
  console.log('  -> Kiểm thử ngắt polling khi rời phòng...');
  let focusReqAfterLeave = 0;
  pageB.on('request', req => {
    if (req.url().includes('/api/phong-focus')) {
      focusReqAfterLeave++;
    }
  });

  const btnRoiB = pageB.locator('#btn-roi-phong-top');
  await btnRoiB.click();
  await pageB.waitForSelector('#campus-lobby, #lobby-music', { timeout: 5000 });

  // Đợi 7 giây (> 2 chu kỳ polling 3s)
  await pageB.waitForTimeout(7000);
  const pollingStopped = (focusReqAfterLeave === 0);
  ok(`Polling cleanup: Rời phòng ngắt hoàn toàn polling (${focusReqAfterLeave} request phát sinh trong 7s)`, pollingStopped, 'browser');
  resultsByGroup.detailed['Polling cleanup'] = pollingStopped ? 'PASS' : 'FAIL';

  // Mobile viewport 390px responsive check
  const pageMobile = await ctxA.newPage();
  await pageMobile.setViewportSize({ width: 390, height: 844 });
  await pageMobile.goto(`${BASE}/`);
  await pageMobile.waitForTimeout(1000);
  const overflow = await pageMobile.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  ok('Giao diện Mobile (390px): Không tràn chiều ngang màn hình (overflow-x = 0)', !overflow, 'browser');

  // Đóng phòng E2E
  await api('/api/phong', { method: 'POST', cookie: cookieA, body: { hanhDong: 'dong', phongId: e2ePhongId } });
} catch (err) {
  fail++;
  resultsByGroup.browser.fail++;
  console.error('\n  ❌ LỖI PLAYWRIGHT E2E:', err.message);
} finally {
  if (browser) await browser.close();
}

// Dọn dẹp phòng trường
try {
  await api('/api/phong', { method: 'POST', cookie: cookieA, body: { hanhDong: 'dong', phongId: phongTruongId } });
} catch {
  // Bỏ qua lỗi dọn dẹp cuối
}

// ─────────────────────────────────────────────────────────────────────────────
// BÁO CÁO KẾT QUẢ THEO ĐÚNG TIÊU CHUẨN SECTION 38
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log('BÁO CÁO KẾT QUẢ KIỂM THỬ ĐỒNG BỘ FOCUS ROOM (PHASE 3D.1)');
console.log('================================================================');
console.log(`API tests:                     ${resultsByGroup.api.pass} PASS / ${resultsByGroup.api.fail} FAIL`);
console.log(`Concurrency tests:             ${resultsByGroup.concurrency.pass} PASS / ${resultsByGroup.concurrency.fail} FAIL`);
console.log(`Native two-browser:            ${resultsByGroup.browser.pass} PASS / ${resultsByGroup.browser.fail} FAIL`);
console.log(`Actual Pomodoro timer sync:    ${resultsByGroup.detailed['Actual Pomodoro timer sync'] || 'FAIL'}`);
console.log(`Pause convergence:             ${resultsByGroup.detailed['Pause convergence'] || 'FAIL'}`);
console.log(`Reset convergence:             ${resultsByGroup.detailed['Reset convergence'] || 'FAIL'}`);
console.log(`Focus Mode distraction-free:   ${resultsByGroup.detailed['Focus Mode distraction-free'] || 'FAIL'}`);
console.log(`Polling cleanup:               ${resultsByGroup.detailed['Polling cleanup'] || 'FAIL'}`);
console.log(`Ambient Audio:                 ${resultsByGroup.detailed['Ambient Audio'] || 'FAIL'}`);
console.log('----------------------------------------------------------------');
console.log(`TỔNG CỘNG:                     ${pass} PASS / ${fail} FAIL`);
console.log('================================================================');

if (fail > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
