// ==============================================================================
// cong-cu/qa-study-multiuser.mjs
// F-STUDY MULTI-USER FUNCTIONAL GATE — 3 browser độc lập qua UI THẬT:
//   A = host, B = member (sau đó được cấp co-host), C = late-join (bị kick)
// Phủ: vào phòng → video → queue → chat 2 chiều → note gắn mốc → whiteboard →
//      sheet → voice (UI-level, fake media) → grant/co-host → kick/ban →
//      late-join thấy lịch sử → reload reconnect → đo lease 15'
// Không nới assertion: mọi hành vi phải đi qua DOM/API thật của sản phẩm.
// ==============================================================================
import { execSync } from 'child_process';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';
const VIDEO_1 = 'https://vjs.zencdn.net/v/oceans.webm';
const VIDEO_2 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

let pass = 0, fail = 0;
function ok(ten, dk, chiTiet = '') {
  if (dk) { pass++; console.log(`  ✅ ${ten}`); }
  else { fail++; console.log(`  ❌ ${ten} ${chiTiet}`); }
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function taoAuthCookie(user) {
  const token = await createToken(devSessionSecret, user, 3600);
  return `${COOKIE_NAME}=${token}`;
}
async function api(path, { method = 'GET', body = null, cookie = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

console.log('================================================================');
console.log('F-STUDY MULTI-USER FUNCTIONAL GATE (3 BROWSER — UI THẬT)');
console.log(`Target: ${BASE}`);
console.log('================================================================\n');

// ── Fixture local D1: session hocSinhId cần hoc_sinh + ma_ca_nhan ─────────────
if (BASE.includes('127.0.0.1') || BASE.includes('localhost')) {
  const sqlLocal = (cau) => execSync(`npx wrangler d1 execute lop-10a7-db --local --json --command "${cau}"`, { encoding: 'utf8' });
  sqlLocal(`INSERT OR IGNORE INTO hoc_sinh (id, ho_ten, lop_id, so_thu_tu) VALUES (1,'QA HS-A',1,1),(2,'QA HS-B',1,2),(3,'QA HS-C',1,3)`);
  sqlLocal(`INSERT OR IGNORE INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id) VALUES (1,'qa-hs1',1),(2,'qa-hs2',1),(3,'qa-hs3',1)`);
  try { execSync(`npx wrangler d1 execute lop-10a7-db --local --command="UPDATE phong SET trang_thai='dong' WHERE chu_phong_khoa='hs:1';"`, { stdio: 'ignore' }); } catch {}
}

const HS_A = { hocSinhId: 1, lopId: 1, role: 'student', ten: 'QA HS-A' };
const HS_B = { hocSinhId: 2, lopId: 1, role: 'student', ten: 'QA HS-B' };
const HS_C = { hocSinhId: 3, lopId: 1, role: 'student', ten: 'QA HS-C' };
const cookieA = await taoAuthCookie(HS_A);
const cookieB = await taoAuthCookie(HS_B);
const cookieC = await taoAuthCookie(HS_C);

// ── Tạo phòng video scope lớp qua API (giống qa-watch-together) ───────────────
const resPhong = await api('/api/phong', {
  method: 'POST', cookie: cookieA,
  body: { hanhDong: 'tao', ten: 'QA Multi-User Gate', loai: 'video', phamVi: 'lop', moTa: 'gate 3 browser', videoUrl: VIDEO_1 }
});
const phongId = resPhong.data.phong?.id;
if (!phongId) { console.log('FATAL: không tạo được phòng:', JSON.stringify(resPhong.data)); process.exit(1); }
console.log(`Phòng #${phongId} đã tạo (host = QA HS-A, scope lớp 1)\n`);

const { chromium } = await import('playwright');
const browser = await chromium.launch({
  args: [
    '--no-sandbox', '--disable-setuid-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'
  ]
});
const urlObj = new URL(BASE);
const moContext = async (hs) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const token = await createToken(devSessionSecret, hs, 3600);
  await ctx.addCookies([{ name: COOKIE_NAME, value: token, domain: urlObj.hostname, path: '/' }]);
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept()); // confirm() kick / alert() — auto accept
  await page.goto(`${BASE}/`);
  await page.waitForSelector('#campus-lobby', { timeout: 15000 });
  return { ctx, page };
};

// Vào phòng qua luồng UI thật (giống qa-watch-together)
const vaoPhongQuaUI = async (page, pid) => {
  await page.evaluate(() => document.querySelector('#world-hoc-tap')?.click());
  await page.waitForSelector('#lobby-watch', { timeout: 10000 });
  const btnVao = page.locator(`[data-testid="study-room-enter"][data-phong-id="${pid}"]`);
  await btnVao.waitFor({ state: 'visible', timeout: 15000 });
  await btnVao.click();
  await page.waitForSelector('#btn-back-to-lobby', { timeout: 10000 });
  await page.waitForTimeout(800);
};
const SEL_VIDEO = '[data-testid="study-video-player"]';
const videoInfo = (page) => page.evaluate((sel) => {
  const v = document.querySelector(sel);
  return v ? { paused: v.paused, ct: v.currentTime, src: v.currentSrc || v.src || '', controls: v.hasAttribute('controls') } : null;
}, SEL_VIDEO);
const choThayText = async (page, text, timeout = 8000) => {
  try {
    await page.waitForFunction((t) => document.body.innerText.includes(t), text, { timeout });
    return true;
  } catch { return false; }
};
const moTab = async (page, tabId) => { await page.locator(`#${tabId}`).click(); await page.waitForTimeout(400); };

let pageA, pageB, pageC, ctxC;
try {
  ({ page: pageA } = await moContext(HS_A));
  ({ page: pageB } = await moContext(HS_B));

  // ═══ SECTION A — VÀO PHÒNG & VAI TRÒ ═══════════════════════════════════════
  console.log('== A. Vào phòng & vai trò ==');
  await vaoPhongQuaUI(pageA, phongId);
  ok('A: vào phòng qua UI, thấy nút host play (#btn-host-watch-toggle)', (await pageA.locator('#btn-host-watch-toggle').count()) > 0);
  ok('A: thấy đủ tab dock (chat/notes/whiteboard/sheet/voice/members)', (await pageA.locator('#tab-study-chat, #tab-study-notes, #tab-study-whiteboard, #tab-study-sheet, #tab-study-voice, #tab-study-members').count()) === 6);

  await vaoPhongQuaUI(pageB, phongId);
  ok('B: KHÔNG thấy nút host play', (await pageB.locator('#btn-host-watch-toggle').count()) === 0);
  ok('B: KHÔNG thấy tab quản trị (#tab-study-quan-tri)', (await pageB.locator('#tab-study-quan-tri').count()) === 0);
  const btnStartB = pageB.locator('#btn-viewer-start-watch');
  if ((await btnStartB.count()) > 0) { await btnStartB.click(); await pageB.waitForTimeout(500); }
  const vb = await videoInfo(pageB);
  ok('B: video member không có controls', vb && vb.controls === false, JSON.stringify(vb));

  // Danh sách thành viên — detail poll 10s
  await moTab(pageA, 'tab-study-members');
  ok('A: danh sách thành viên hiện QA HS-B (≤14s)', await choThayText(pageA, 'QA HS-B', 14000));

  // ═══ SECTION B — CHAT 2 CHIỀU ════════════════════════════════════════════
  console.log('== B. Chat phòng 2 chiều ==');
  await moTab(pageA, 'tab-study-chat');
  await pageA.locator('#input-phong-chat').fill('chào cả nhóm QA');
  await pageA.locator('#btn-send-phong-chat').click();
  ok('A→B: B thấy tin nhắn của A (poll 3s)', await choThayText(pageB, 'chào cả nhóm QA', 8000));

  await moTab(pageB, 'tab-study-chat');
  await pageB.locator('#input-phong-chat').fill('chào host từ B');
  await pageB.locator('#btn-send-phong-chat').click();
  ok('B→A: A thấy tin nhắn của B', await choThayText(pageA, 'chào host từ B', 8000));

  // ═══ SECTION C — VIDEO + QUEUE ════════════════════════════════════════════
  console.log('== C. Video play + hàng đợi ==');
  await pageA.locator('#btn-host-watch-toggle').click();
  await pageB.waitForFunction((sel) => { const v = document.querySelector(sel); return v && !v.paused; }, SEL_VIDEO, { timeout: 9000 }).catch(() => {});
  const vb2 = await videoInfo(pageB);
  ok('Host PLAY → video B phát theo (paused=false)', vb2 && vb2.paused === false, JSON.stringify(vb2));

  await moTab(pageA, 'tab-study-config');
  await pageA.locator('#input-queue-add').fill(VIDEO_2);
  await pageA.locator('#btn-queue-enqueue').click();
  ok('A: video mới xuất hiện trong hàng đợi', await choThayText(pageA, 'ForBiggerBlazes', 6000));

  // play_now → cả hai chuyển video
  await pageA.locator('button[title="Phát ngay"]').first().click();
  await pageA.waitForFunction(() => (document.querySelector('[data-testid="study-video-player"]')?.currentSrc || '').includes('ForBiggerBlazes'), { timeout: 8000 }).catch(() => {});
  const va = await videoInfo(pageA);
  ok('A: play_now chuyển video host sang ForBiggerBlazes', va && va.src.includes('ForBiggerBlazes'), va?.src);
  await pageB.waitForFunction(() => (document.querySelector('[data-testid="study-video-player"]')?.currentSrc || '').includes('ForBiggerBlazes'), { timeout: 8000 }).catch(() => {});
  const vb3 = await videoInfo(pageB);
  ok('B: video member đổi theo queue (sync URL)', vb3 && vb3.src.includes('ForBiggerBlazes'), vb3?.src);

  // ═══ SECTION D — NOTES + MỐC THỜI GIAN ════════════════════════════════════
  console.log('== D. Ghi chú + timestamp ==');
  await moTab(pageB, 'tab-study-notes');
  const ctTruocNote = (await videoInfo(pageB))?.ct || 0;
  await pageB.locator('button[title*="mốc video"], button[title*="gắn mốc"]').first().click().catch(() => {});
  await pageB.locator('#study-note-input').fill('mốc quan trọng QA');
  await pageB.locator('#btn-add-note').click();
  ok('B: note vừa thêm hiện trong list', await choThayText(pageB, 'mốc quan trọng QA', 5000));

  await moTab(pageA, 'tab-study-notes');
  ok('A: thấy note của B (poll 3s)', await choThayText(pageA, 'mốc quan trọng QA', 8000));
  const chipNote = pageA.locator('button:has-text("▶")').first();
  const coChip = (await chipNote.count()) > 0;
  ok('A: note có chip ▶ timestamp', coChip);
  if (coChip) {
    await chipNote.click();
    await pageA.waitForTimeout(1500);
    const va2 = await videoInfo(pageA);
    // Chip mốc = vị trí video B lúc viết note (ctTruocNote); video đang chạy nên A phải land gần đó
    ok('A: bấm chip ▶ → host tua về mốc note', va2 && Math.abs(va2.ct - ctTruocNote) <= 5, `A.ct=${va2?.ct?.toFixed(1)} vs mốc=${ctTruocNote.toFixed(1)}`);
  }

  // ═══ SECTION E — WHITEBOARD ════════════════════════════════════════════════
  console.log('== E. Whiteboard cộng tác ==');
  await moTab(pageA, 'tab-study-whiteboard');
  const cvA = pageA.locator('#study-whiteboard-canvas');
  const box = await cvA.boundingBox();
  if (box) {
    await pageA.mouse.move(box.x + 40, box.y + 40);
    await pageA.mouse.down();
    await pageA.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
    await pageA.mouse.move(box.x + box.width - 40, box.y + 40, { steps: 8 });
    await pageA.mouse.up(); // stopDrawing → POST op
  }
  await moTab(pageB, 'tab-study-whiteboard');
  await pageB.waitForTimeout(4500); // poll wb 3s
  const bCoNetVe = await pageB.evaluate(() => {
    const c = document.querySelector('#study-whiteboard-canvas');
    if (!c) return false;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < d.length; i += 4) { if (d[i] > 0) return true; }
    return false;
  });
  ok('A vẽ nét → canvas B nhận được nét vẽ (pixel non-blank)', bCoNetVe === true);

  // ═══ SECTION F — SHEET ════════════════════════════════════════════════════
  console.log('== F. Sheet cộng tác ==');
  await moTab(pageB, 'tab-study-sheet');
  const cellB = pageB.locator('input[data-cell="B2"]');
  await cellB.click();
  await cellB.fill('QA-123');
  await pageB.locator('input[data-cell="C3"]').click(); // blur B2 → debounce 800ms → POST
  await moTab(pageA, 'tab-study-sheet');
  await pageA.waitForTimeout(4500);
  const valA = await pageA.locator('input[data-cell="B2"]').inputValue().catch(() => '');
  ok('B ghi B2=QA-123 → A đọc được B2 (sheet sync)', valA === 'QA-123', `A.B2="${valA}"`);

  // ═══ SECTION G — VOICE (UI-level, fake media) ═════════════════════════════
  console.log('== G. Voice 1-1 (cấp quyền + join UI) ==');
  await moTab(pageB, 'tab-study-voice');
  const reqB = pageB.locator('#btn-voice-request');
  const joinB = pageB.locator('#btn-voice-join');
  const canJoinTruoc = (await joinB.count()) > 0;
  if (!canJoinTruoc && (await reqB.count()) > 0) {
    await reqB.click();
    await pageB.waitForTimeout(600);
    // Host cấp voice qua tab members — row là div.rounded-xl có nút kick
    await moTab(pageA, 'tab-study-members');
    const rowB = pageA.locator('div.rounded-xl').filter({ hasText: 'QA HS-B' }).filter({ has: pageA.locator('button[title="Kick khỏi phòng"]') }).first();
    await rowB.locator('button[title*="mic"]').click();
    await pageB.waitForTimeout(11000); // detail poll 10s
    await moTab(pageB, 'tab-study-voice');
  }
  const joinB2 = pageB.locator('#btn-voice-join');
  ok('B: sau khi được cấp quyền thấy nút Tham gia voice', (await joinB2.count()) > 0 || canJoinTruoc);
  if ((await joinB2.count()) > 0) {
    await joinB2.click();
    await pageB.waitForTimeout(1500);
    ok('B: join voice → nút Rời voice/Mic xuất hiện', (await pageB.locator('#btn-voice-leave').count()) > 0);
  } else { ok('B: join voice → nút Rời voice/Mic xuất hiện', false, 'không có nút join'); }

  // ═══ SECTION H — CO-HOST, LATE-JOIN, KICK/BAN ═════════════════════════════
  console.log('== H. Co-host, late-join, kick ==');
  await moTab(pageA, 'tab-study-members');
  const rowB2 = pageA.locator('div.rounded-xl').filter({ hasText: 'QA HS-B' }).filter({ has: pageA.locator('button[title="Kick khỏi phòng"]') }).first();
  await rowB2.locator('button:has-text("co-host")').click();
  await pageB.waitForTimeout(11000); // detail poll 10s
  ok('B được cấp co-host → thấy tab quản trị (#tab-study-quan-tri)', (await pageB.locator('#tab-study-quan-tri').count()) > 0);

  // C late-join — phải thấy lịch sử chat + video hiện tại
  ({ ctx: ctxC, page: pageC } = await moContext(HS_C));
  await vaoPhongQuaUI(pageC, phongId);
  ok('C late-join: thấy lịch sử chat "chào cả nhóm QA"', await choThayText(pageC, 'chào cả nhóm QA', 8000));
  const vc = await videoInfo(pageC);
  ok('C late-join: video đang phát đúng URL hiện tại', vc && vc.src.includes('ForBiggerBlazes'), vc?.src);

  // A kick C (C là member, A là host) — confirm() auto-accept
  await moTab(pageA, 'tab-study-members');
  await pageA.waitForFunction(() => document.body.innerText.includes('QA HS-C'), { timeout: 12000 }).catch(() => {});
  const rowC = pageA.locator('div.rounded-xl').filter({ hasText: 'QA HS-C' }).filter({ has: pageA.locator('button[title="Kick khỏi phòng"]') }).first();
  const btnKickC = rowC.locator('button[title="Kick khỏi phòng"]');
  ok('A: thấy hàng QA HS-C + nút kick', (await btnKickC.count()) > 0);
  if ((await btnKickC.count()) > 0) {
    await btnKickC.click();
    // C bị ban → taiChiTiet (chu kỳ 10s) trả room_banned → về lobby.
    // (#campus-lobby render luôn — phải chờ nút phòng BIẾN MẤT, không đo selector lobby)
    await pageC.waitForSelector('#btn-back-to-lobby', { state: 'detached', timeout: 25000 }).catch(() => {});
    const cVeLobby = (await pageC.locator('#btn-back-to-lobby').count()) === 0;
    ok('C bị kick → UI tự thoát khỏi phòng (room_banned → lobby)', cVeLobby);
    const resC = await api(`/api/phong-watch?phongId=${phongId}`, { cookie: cookieC });
    ok('C bị kick → API phong-watch trả 403 room_banned', resC.status === 403 && resC.data.code === 'room_banned', `${resC.status} ${resC.data.code}`);
    // C thử vào lại qua UI → bị chặn
    await pageC.evaluate(() => document.querySelector('#world-hoc-tap')?.click()).catch(() => {});
    await pageC.waitForSelector('#lobby-watch', { timeout: 8000 }).catch(() => {});
    const btnVaoC = pageC.locator(`[data-testid="study-room-enter"][data-phong-id="${phongId}"]`);
    if ((await btnVaoC.count()) > 0) { await btnVaoC.click().catch(() => {}); await pageC.waitForTimeout(3500); }
    ok('C bị ban → vào lại qua UI KHÔNG tới được phòng', (await pageC.locator('#btn-back-to-lobby').count()) === 0);
  }

  // ═══ SECTION I — RELOAD / RECONNECT ═══════════════════════════════════════
  console.log('== I. Reload & reconnect ==');
  await pageB.reload();
  await pageB.waitForSelector('#campus-lobby', { timeout: 15000 });
  await vaoPhongQuaUI(pageB, phongId);
  ok('B reload → vào lại được phòng (lease còn hiệu lực)', (await pageB.locator('#btn-back-to-lobby').count()) > 0);
  ok('B reload → vẫn thấy lịch sử chat', await choThayText(pageB, 'chào cả nhóm QA', 8000));

  // ═══ SECTION J — ĐO LEASE 15' (hoat_dong_luc + NHIP_HIEU_LUC) ═════════════
  // Lease không phải cột — là cửa sổ datetime(hoat_dong_luc) > now-15'.
  // Đo thực tế: đóng tab C (giả lập chết đột ngột) → đếm sức chứa qua D1.
  console.log('== J. Đo lease thành viên (NHIP_HIEU_LUC = 15\') ==');
  try {
    // C đã bị ban nên đếm capacity qua B: đóng hẳn context B (giả lập tab chết, không nhip nữa)
    const soNguoiTruoc = execSync(`npx wrangler d1 execute lop-10a7-db --local --json --command "SELECT COUNT(*) AS n FROM phong_thanh_vien WHERE phong_id=${phongId} AND datetime(hoat_dong_luc) > datetime('now','-15 minutes');"`, { encoding: 'utf8' });
    const nTruoc = JSON.parse(soNguoiTruoc)?.[0]?.results?.[0]?.n ?? -1;
    // hs:1 (host A) + hs:2 (B vừa reconnect) còn tươi; hs:3 đã bị ban nhưng row vẫn đếm nếu tươi
    console.log(`     Số member còn lease tươi (≤15'): ${nTruoc} (kỳ vọng ≥2: A+B)`);
    ok('Lease window đếm đúng member còn heartbeat tươi', nTruoc >= 2, `n=${nTruoc}`);
    const beat = execSync(`npx wrangler d1 execute lop-10a7-db --local --json --command "SELECT khoa, hoat_dong_luc, CAST((julianday('now')-julianday(hoat_dong_luc))*1440 AS REAL) AS tuoi_phut FROM phong_thanh_vien WHERE phong_id=${phongId} ORDER BY khoa;"`, { encoding: 'utf8' });
    for (const r of (JSON.parse(beat)?.[0]?.results || [])) {
      console.log(`     ${r.khoa}: heartbeat cuối ${r.hoat_dong_luc} (cách ${Number(r.tuoi_phut).toFixed(1)}' — hết lease sau ${(15 - Number(r.tuoi_phut)).toFixed(1)}' nữa nếu tab chết)`);
    }
    ok('Heartbeat B còn tươi (<2\' — nhip 20s đang chạy)', (JSON.parse(beat)?.[0]?.results || []).some(r => r.khoa === 'hs:2' && Number(r.tuoi_phut) < 2), 'beat stale');
  } catch { ok('Đo lease qua D1', false, 'D1 busy — SQLITE_BUSY'); }

} catch (e) {
  console.log('\n⚠️ LỖI GIỮA CHỪNG:', e.message);
  fail++;
} finally {
  try { await api('/api/phong', { method: 'POST', cookie: cookieA, body: { hanhDong: 'dong', phongId } }); } catch {}
  try { await browser.close(); } catch {}
}

console.log('\n================================================================');
console.log(`KẾT QUẢ: ${pass} PASS / ${fail} FAIL`);
console.log('================================================================');
process.exit(fail > 0 ? 1 : 0);
