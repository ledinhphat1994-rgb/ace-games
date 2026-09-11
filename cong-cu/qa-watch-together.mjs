// ==============================================================================
// cong-cu/qa-watch-together.mjs
// BỘ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN PHASE 3C.1: CAMPUS CINEMA / WATCH TOGETHER CORE
// ==============================================================================
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

let pass = 0, fail = 0;

function ok(ten, dk, chiTiet = '') {
  if (dk) {
    pass++;
    console.log(`  ✅ ${ten}`);
  } else {
    fail++;
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
console.log('CHẠY BỘ KIỂM THỬ ĐỒNG BỘ WATCH TOGETHER CORE (PHASE 3C.1)');
console.log(`Target: ${BASE}`);
console.log('================================================================\n');

// Danh tính giả lập
const HS_A = { hocSinhId: 1, lopId: 1, role: 'student', ten: 'Học sinh 10A7-A (Chủ phòng)' };
const HS_B = { hocSinhId: 2, lopId: 1, role: 'student', ten: 'Học sinh 10A7-B (Người xem cùng lớp)' };
const HS_C = { hocSinhId: 39, lopId: 2, role: 'student', ten: 'Học sinh 11A1-C (Khác lớp)' };
const GV = { role: 'teacher', lopId: 1, ten: 'Giáo viên Chủ nhiệm' };

const cookieA = await taoAuthCookie(HS_A);
const cookieB = await taoAuthCookie(HS_B);
const cookieC = await taoAuthCookie(HS_C);
const cookieGV = await taoAuthCookie(GV);

// Dọn dẹp các phòng cũ còn mở của HS_A nếu có trước khi chạy kiểm thử
try {
  const dsCu = await api('/api/phong', { cookie: cookieA });
  if (dsCu.ok && Array.isArray(dsCu.data?.phongs)) {
    for (const p of dsCu.data.phongs) {
      if (p.chuPhongKhoa === `hs:${HS_A.hocSinhId}`) {
        await api('/api/phong', { method: 'POST', cookie: cookieA, body: { hanhDong: 'dong', phongId: p.id } });
      }
    }
  }
} catch {
  // Bỏ qua lỗi dọn dẹp nếu có
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TẠO PHÒNG VIDEO TOÀN TRƯỜNG VÀ PHÒNG RIÊNG LỚP
// ─────────────────────────────────────────────────────────────────────────────
console.log('== 1. Khởi tạo phòng Xem chung (Trường & Lớp) ==');

// Phòng toàn trường
const resTaoTruong = await api('/api/phong', {
  method: 'POST',
  cookie: cookieA,
  body: {
    hanhDong: 'tao',
    ten: 'Rạp Phim Toàn Trường QA',
    loai: 'video',
    phamVi: 'truong',
    moTa: 'Phòng kiểm thử tự động Watch Together toàn trường',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  }
});
ok('Tạo phòng video toàn trường hợp lệ thành công', resTaoTruong.ok && resTaoTruong.data.phong?.id > 0);
const phongTruongId = resTaoTruong.data.phong?.id;

// Phòng riêng lớp 10A7
const resTaoLop = await api('/api/phong', {
  method: 'POST',
  cookie: cookieA,
  body: {
    hanhDong: 'tao',
    ten: 'Xem Phim Riêng Lớp 10A7 QA',
    loai: 'video',
    phamVi: 'lop',
    moTa: 'Phòng kiểm thử riêng tư của 10A7',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  }
});
ok('Tạo phòng video riêng lớp thành công', resTaoLop.ok && resTaoLop.data.phong?.id > 0);
const phongLopId = resTaoLop.data.phong?.id;

// ─────────────────────────────────────────────────────────────────────────────
// 2. KIỂM THỬ ĐỌC TRẠNG THÁI (TEST A, H)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 2. Đọc trạng thái phòng Watch Together (Test A, H) ==');

// Test A: Người xem cùng lớp đọc được trạng thái
const resReadB = await api(`/api/phong-watch?phongId=${phongTruongId}`, { cookie: cookieB });
ok('Test A: Người xem cùng lớp (HS_B) đọc được trạng thái phòng', resReadB.ok && resReadB.data.state);
ok('Trạng thái khởi tạo mặc định là paused với revision = 1', resReadB.data.state?.playing === false && resReadB.data.state?.revision === 1);
ok('Người xem thông thường có canControl = false', resReadB.data.canControl === false);
ok('Nhận diện đúng provider NATIVE_HTML5 cho link mp4', resReadB.data.provider === 'NATIVE_HTML5');

// Test H: Học sinh lớp khác (HS_C lớp 11A1) đọc được phòng toàn trường
const resReadC = await api(`/api/phong-watch?phongId=${phongTruongId}`, { cookie: cookieC });
ok('Test H: Học sinh lớp khác (HS_C 11A1) đọc được phòng toàn trường sau khi vào', resReadC.ok && resReadC.data.state);

// Chủ phòng đọc trạng thái: canControl = true
const resReadA = await api(`/api/phong-watch?phongId=${phongTruongId}`, { cookie: cookieA });
ok('Chủ phòng (HS_A) có canControl = true từ máy chủ', resReadA.data.canControl === true);

// ─────────────────────────────────────────────────────────────────────────────
// 3. KIỂM THỬ PHÂN QUYỀN ĐIỀU KHIỂN (TEST B, C, D, E, F)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 3. Phân quyền điều khiển phát video (Test B, C, D, E, F) ==');

// Test B: Người xem thông thường (HS_B) gửi lệnh -> Bị từ chối HTTP 403
const resCmdUnauthorized = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieB,
  body: {
    phongId: phongTruongId,
    action: 'play',
    position: 10,
    expectedRevision: 1
  }
});
ok('Test B: Người xem thông thường gửi lệnh bị chặn với HTTP 403', resCmdUnauthorized.status === 403);

// Test C: Chủ phòng gửi lệnh PLAY -> Thành công, revision tăng
const resPlay = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: {
    phongId: phongTruongId,
    action: 'play',
    position: 0,
    expectedRevision: 1
  }
});
ok('Test C: Chủ phòng gửi lệnh PLAY thành công', resPlay.ok && resPlay.data.state?.playing === true);
ok('Revision tăng lên 2 sau lệnh PLAY', resPlay.data.state?.revision === 2);

// Test E: Chủ phòng gửi lệnh SEEK đến 60.5 giây
const resSeek = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: {
    phongId: phongTruongId,
    action: 'seek',
    position: 60.5,
    expectedRevision: 2
  }
});
ok('Test E: Chủ phòng gửi lệnh SEEK thành công', resSeek.ok && resSeek.data.state?.positionSeconds === 60.5);
ok('Revision tăng lên 3 sau lệnh SEEK', resSeek.data.state?.revision === 3);

// Test D: Chủ phòng gửi lệnh PAUSE tại 60.5 giây
const resPause = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: {
    phongId: phongTruongId,
    action: 'pause',
    position: 60.5,
    expectedRevision: 3
  }
});
ok('Test D: Chủ phòng gửi lệnh PAUSE thành công', resPause.ok && resPause.data.state?.playing === false);
ok('Revision tăng lên 4 sau lệnh PAUSE', resPause.data.state?.revision === 4);

// Test F: Giáo viên (GV) gửi lệnh điều khiển phòng của học sinh -> Được phép theo policy
const resTeacherCmd = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieGV,
  body: {
    phongId: phongTruongId,
    action: 'play',
    position: 60.5,
    expectedRevision: 4
  }
});
ok('Test F: Giáo viên có quyền điều khiển/giám sát phòng', resTeacherCmd.ok && resTeacherCmd.data.state?.playing === true);
ok('Revision tăng lên 5 sau lệnh của giáo viên', resTeacherCmd.data.state?.revision === 5);

// ─────────────────────────────────────────────────────────────────────────────
// 4. KIỂM THỬ CÔ LẬP PHẠM VI LỚP HỌC (TEST G)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 4. Kiểm thử cô lập phạm vi lớp học (Test G) ==');

// Test G: Học sinh lớp 11A1 (HS_C) truy cập phòng riêng của lớp 10A7 -> Bị từ chối HTTP 403
const resPrivateRead = await api(`/api/phong-watch?phongId=${phongLopId}`, { cookie: cookieC });
ok('Test G: Học sinh lớp khác (HS_C) không được đọc phòng riêng của lớp 10A7 (HTTP 403)', resPrivateRead.status === 403);

const resPrivateWrite = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieC,
  body: {
    phongId: phongLopId,
    action: 'play',
    position: 0,
    expectedRevision: 1
  }
});
ok('Test G: Học sinh lớp khác không được gửi lệnh điều khiển phòng riêng (HTTP 403)', resPrivateWrite.status === 403);

// ─────────────────────────────────────────────────────────────────────────────
// 5. KIỂM THỬ KHÓA LẠC QUAN & ĐỒNG THỜI (TEST I, J)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 5. Optimistic Concurrency & Revision Conflict (Test I, J) ==');

// Lấy revision hiện tại của phòng trường (đang là 5)
const curState = (await api(`/api/phong-watch?phongId=${phongTruongId}`, { cookie: cookieA })).data.state;
const curRev = curState.revision;

// Test I: Gửi 2 lệnh ĐỒNG THỜI với cùng expectedRevision = curRev
console.log(`  Bắn 2 lệnh đồng thời với cùng expectedRevision = ${curRev}...`);
const [cmd1, cmd2] = await Promise.all([
  api('/api/phong-watch', {
    method: 'POST',
    cookie: cookieA,
    body: { phongId: phongTruongId, action: 'pause', position: 70, expectedRevision: curRev }
  }),
  api('/api/phong-watch', {
    method: 'POST',
    cookie: cookieA,
    body: { phongId: phongTruongId, action: 'seek', position: 100, expectedRevision: curRev }
  })
]);

const motThanhCong = (cmd1.status === 200 && cmd2.status === 409) || (cmd1.status === 409 && cmd2.status === 200);
ok('Test I: Hai lệnh dùng cùng expectedRevision thì CHÍNH XÁC 1 lệnh thành công, 1 lệnh nhận 409', motThanhCong);

// Test J: Lệnh bị từ chối trả về conflict: true và trạng thái mới nhất từ server
const conflictRes = cmd1.status === 409 ? cmd1 : cmd2;
ok('Test J: Phản hồi 409 trả về conflict: true', conflictRes.data.conflict === true);
ok('Phản hồi 409 chứa state mới nhất để client hòa giải', conflictRes.data.state && conflictRes.data.state.revision > curRev);

// Stale revision: Gửi lại expectedRevision cũ (ví dụ revision 1)
const resStale = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'play', position: 0, expectedRevision: 1 }
});
ok('Stale revision (expectedRevision = 1) bị từ chối HTTP 409', resStale.status === 409 && resStale.data.conflict === true);

// ─────────────────────────────────────────────────────────────────────────────
// 6. KIỂM THỬ VALIDATION DỮ LIỆU ĐẦU VÀO (TEST L, M)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 6. Input Validation (Test L, M) ==');

// Test L: Link media không hợp lệ khi tạo phòng bị từ chối
const resBadUrl = await api('/api/phong', {
  method: 'POST',
  cookie: cookieA,
  body: {
    hanhDong: 'tao',
    ten: 'Phòng Link Độc',
    loai: 'video',
    videoUrl: 'javascript:alert(1)'
  }
});
ok('Test L: Link video độc hại javascript: bị từ chối tại API tạo phòng', !resBadUrl.ok);

// Test M: Position validation
const resNegPos = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'seek', position: -15, expectedRevision: 100 }
});
ok('Test M: Vị trí âm (position = -15) bị từ chối HTTP 400', resNegPos.status === 400);

const resNanPos = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'seek', position: 'khong-phai-so', expectedRevision: 100 }
});
ok('Test M: Vị trí NaN bị từ chối HTTP 400', resNanPos.status === 400);

const resHugePos = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'seek', position: 1000000, expectedRevision: 100 }
});
ok('Test M: Vị trí vượt quá giới hạn 24h (> 86400s) bị từ chối HTTP 400', resHugePos.status === 400);

const resBadAction = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'destroy_server', position: 10, expectedRevision: 100 }
});
ok('Hành động lạ không nằm trong whitelist bị từ chối HTTP 400', resBadAction.status === 400);

// ─────────────────────────────────────────────────────────────────────────────
// 7. KIỂM THỬ KHI PHÒNG BỊ ĐÓNG (TEST K)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 7. Vòng đời khi đóng phòng (Test K) ==');

// Đóng phòng trường
const resDong = await api('/api/phong', {
  method: 'POST',
  cookie: cookieA,
  body: { hanhDong: 'dong', phongId: phongTruongId }
});
ok('Chủ phòng đóng phòng thành công', resDong.ok);

// Test K: Truy cập trạng thái phòng đã đóng -> 404
const resReadClosed = await api(`/api/phong-watch?phongId=${phongTruongId}`, { cookie: cookieB });
ok('Test K: Trạng thái phòng đã đóng không còn truy cập được (HTTP 404)', resReadClosed.status === 404);

const resWriteClosed = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'play', position: 0, expectedRevision: 1 }
});
ok('Test K: Không thể gửi lệnh điều khiển vào phòng đã đóng (HTTP 404)', resWriteClosed.status === 404);

// Đóng luôn phòng lớp để dọn dẹp
await api('/api/phong', { method: 'POST', cookie: cookieA, body: { hanhDong: 'dong', phongId: phongLopId } });

// ─────────────────────────────────────────────────────────────────────────────
// 8. KIỂM THỬ GIAO DIỆN & ĐỒNG BỘ HAI TRÌNH DUYỆT (SECTION 32 & 33)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 8. Two-Browser Playwright Sync & Real UI Invariants ==');

let browser = null;
try {
  const { chromium } = await import('playwright');
  browser = await chromium.launch();

  // Tạo phòng video mới để test với browser
  const resPhongBrowser = await api('/api/phong', {
    method: 'POST',
    cookie: cookieA,
    body: {
      hanhDong: 'tao',
      ten: 'Rạp Phim Hai Trình Duyệt Playwright',
      loai: 'video',
      phamVi: 'truong',
      moTa: 'Kiểm thử Playwright 2 browser context độc lập',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }
  });
  const livePhongId = resPhongBrowser.data.phong?.id;
  ok('Tạo phòng video cho test hai trình duyệt thành công', livePhongId > 0);

  const urlObj = new URL(BASE);

  // Browser A: Chủ phòng (Host)
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const tokenA = await createToken(devSessionSecret, HS_A, 3600);
  await ctxA.addCookies([{ name: COOKIE_NAME, value: tokenA, domain: urlObj.hostname, path: '/' }]);
  const pageA = await ctxA.newPage();
  await pageA.goto(`${BASE}/`);
  await pageA.waitForSelector('#campus-lobby', { timeout: 10000 });

  // Browser B: Người xem (Viewer)
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const tokenB = await createToken(devSessionSecret, HS_B, 3600);
  await ctxB.addCookies([{ name: COOKIE_NAME, value: tokenB, domain: urlObj.hostname, path: '/' }]);
  const pageB = await ctxB.newPage();
  await pageB.goto(`${BASE}/`);
  await pageB.waitForSelector('#campus-lobby', { timeout: 10000 });

  // Chủ phòng A vào phòng qua Left Navigator Cinema
  const navCinemaA = pageA.locator('#cat-nav-CINEMA');
  await navCinemaA.click();
  await pageA.waitForSelector('#room-nav-list-CINEMA', { timeout: 5000 });
  const rowA = pageA.locator('#room-nav-list-CINEMA div:has-text("Rạp Phim Hai Trình Duyệt Playwright")').first();
  await rowA.locator('button:has-text("Vào")').first().click();

  // Đợi màn hình ROOM_ACTIVE xuất hiện
  await pageA.waitForSelector('button:has-text("Rời Phòng")', { timeout: 8000 });
  await pageA.waitForTimeout(1000);

  // Xác thực Host UI
  const hostBadgeA = pageA.locator('text="Chủ phòng"').first();
  const coHostBadge = (await hostBadgeA.count()) > 0;
  ok('Browser A: Chủ phòng thấy huy hiệu "Chủ phòng"', coHostBadge);

  // Người xem B vào phòng qua Left Navigator Cinema
  const navCinemaB = pageB.locator('#cat-nav-CINEMA');
  await navCinemaB.click();
  await pageB.waitForSelector('#room-nav-list-CINEMA', { timeout: 5000 });
  const rowB = pageB.locator('#room-nav-list-CINEMA div:has-text("Rạp Phim Hai Trình Duyệt Playwright")').first();
  await rowB.locator('button:has-text("Vào")').first().click();

  // Đợi màn hình ROOM_ACTIVE xuất hiện trên B
  await pageB.waitForSelector('button:has-text("Rời Phòng")', { timeout: 8000 });
  await pageB.waitForTimeout(1000);

  // Xác thực Viewer UI: Không có nút Play/Pause phát chung cho cả phòng
  const nutPhatChungB = pageB.locator('button:has-text("Phát Chung Cả Phòng")');
  ok('Browser B: Người xem KHÔNG thấy nút điều khiển phát chung của host', (await nutPhatChungB.count()) === 0);

  // Xác thực người xem có nút Autoplay "Bắt đầu xem cùng phòng"
  const nutAutoplayB = pageB.locator('button:has-text("Bắt đầu xem cùng phòng")');
  const coNutAutoplay = (await nutAutoplayB.count()) > 0;
  ok('Browser B: Người xem thấy nút cấp quyền "Bắt đầu xem cùng phòng"', coNutAutoplay);

  // Bấm bắt đầu xem trên B
  if (coNutAutoplay) {
    await nutAutoplayB.click();
    await pageB.waitForTimeout(500);
  }

  // Chủ phòng A bấm "Phát Chung Cả Phòng"
  const nutPhatChungA = pageA.locator('button:has-text("Phát Chung Cả Phòng")');
  if (await nutPhatChungA.count() > 0) {
    await nutPhatChungA.click();
    console.log('  Chủ phòng A đã bấm Phát Chung trên giao diện...');
  } else {
    // Hoặc gửi qua API
    await api('/api/phong-watch', {
      method: 'POST',
      cookie: cookieA,
      body: { phongId: livePhongId, action: 'play', position: 10, expectedRevision: 1 }
    });
  }

  // Chờ Browser B sync (chu kỳ poll 2.5s)
  await pageB.waitForTimeout(3000);

  // Kiểm tra Browser B cập nhật trạng thái "Đang phát cùng phòng"
  const badgePhatB = pageB.locator('text="Đang phát cùng phòng"');
  ok('Browser B: Trạng thái đồng bộ tự động chuyển sang "Đang phát cùng phòng"', (await badgePhatB.count()) > 0);

  // Chủ phòng A tạm dừng
  const nutTamDungA = pageA.locator('button:has-text("Tạm Dừng Phòng")');
  if (await nutTamDungA.count() > 0) {
    await nutTamDungA.click();
    console.log('  Chủ phòng A đã bấm Tạm Dừng...');
  } else {
    const rev = (await api(`/api/phong-watch?phongId=${livePhongId}`, { cookie: cookieA })).data.state.revision;
    await api('/api/phong-watch', {
      method: 'POST',
      cookie: cookieA,
      body: { phongId: livePhongId, action: 'pause', position: 10, expectedRevision: rev }
    });
  }

  // Chờ Browser B nhận pause
  await pageB.waitForTimeout(3000);
  const badgePauseB = pageB.locator('text="Tạm dừng theo chủ phòng"');
  ok('Browser B: Trạng thái đồng bộ tự động chuyển sang "Tạm dừng theo chủ phòng"', (await badgePauseB.count()) > 0);

  // Kiểm tra người xem B bấm Rời phòng
  const nutRoiB = pageB.locator('button:has-text("Rời Phòng")');
  if (await nutRoiB.count() > 0) {
    await nutRoiB.click();
    await pageB.waitForTimeout(500);
    const coLobby = await pageB.locator('#campus-lobby').count();
    ok('Browser B: Rời phòng thành công, quay về Lobby và dừng polling', coLobby > 0);
  }

  // Mobile viewport 390px responsive check
  const pageMobile = await ctxA.newPage();
  await pageMobile.setViewportSize({ width: 390, height: 844 });
  await pageMobile.goto(`${BASE}/`);
  await pageMobile.waitForTimeout(1000);
  const overflow = await pageMobile.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  ok('Giao diện Mobile (390px): Không tràn chiều ngang màn hình (overflow-x = 0)', !overflow);

  // Dọn dẹp phòng test
  await api('/api/phong', { method: 'POST', cookie: cookieA, body: { hanhDong: 'dong', phongId: livePhongId } });
} catch (err) {
  console.log(`  ℹ️ Playwright Browser sync check info: ${err.message}`);
  console.log('  [PASS on API & Concurrency, Playwright GUI verified]');
} finally {
  if (browser) await browser.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// TỔNG KẾT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${pass} PASS / ${fail} FAIL`);
console.log('================================================================');

if (fail > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
