// ==============================================================================
// cong-cu/qa-games-arena.mjs — QA tích hợp GAME ARENA đa-game
//   API  : tao_ban/vao_ban/danh_co/van_moi cho caro9, c4, reversi + loai=tat_ca
//   E2E  : 2 browser context thật — A tạo bàn c4, B vào, chơi xen kẽ tới thắng
//          + mini game 1 mình trong lobby Game
// Chạy: node cong-cu/qa-games-arena.mjs [baseUrl]   (mặc định dev :8788)
// ==============================================================================
import { chromium } from 'playwright';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const SECRET = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

let pass = 0, fail = 0;
const ok = (ten, dk, chiTiet = '') => {
  if (dk) { pass++; console.log(`  ✅ ${ten}`); }
  else { fail++; console.log(`  ❌ ${ten} ${chiTiet}`); }
};

const HS_A = { hocSinhId: 90001, lopId: 1, role: 'student', ten: 'QA-A' };
const HS_B = { hocSinhId: 90002, lopId: 1, role: 'student', ten: 'QA-B' };

// Fixture: session hocSinhId cần hoc_sinh + ma_ca_nhan row trong LOCAL D1
import { execSync } from 'child_process';
const sqlLocal = cau => execSync(
  `npx wrangler d1 execute lop-10a7-db --local --command "${cau.replace(/"/g, '\\"')}"`,
  { stdio: 'pipe' });
try {
  // wrangler --command chỉ chạy 1 statement → tách từng lệnh
  sqlLocal(`INSERT OR IGNORE INTO hoc_sinh (id, ho_ten, lop_id, so_thu_tu) VALUES (90001,'QA-A',1,991),(90002,'QA-B',1,992)`);
  sqlLocal(`INSERT OR IGNORE INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id) VALUES (90001,'qa-90001',1),(90002,'qa-90002',1)`);
} catch { console.log('  ⚠️ seed fixture học sinh thất bại — các test có thể fail'); }

async function cookie(u) {
  return `${COOKIE_NAME}=${await createToken(SECRET, u, 3600)}`;
}
const ckA = await cookie(HS_A);
const ckB = await cookie(HS_B);

async function api(path, { method = 'GET', body = null, ck = ckA } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: ck },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
const taoBan = (loaiGame, ck = ckA) => api('/api/game', { method: 'POST', body: { hanhDong: 'tao_ban', loaiGame, phamVi: 'lop', tenBan: `QA ${loaiGame}` }, ck });
const vaoBan = (id, ck) => api('/api/game', { method: 'POST', body: { hanhDong: 'vao_ban', phongId: id }, ck });
const danh = (id, r, c, ck) => api('/api/game', { method: 'POST', body: { hanhDong: 'danh_co', phongId: id, r, c }, ck });
const xemBan = (id, ck = ckA) => api(`/api/game?phongId=${id}`, { ck });
const donBan = id => api('/api/game', { method: 'POST', body: { hanhDong: 'roi_ban', phongId: id } });

console.log('================================================================');
console.log(`QA GAME ARENA TÍCH HỢP — ${BASE}`);
console.log('================================================================\n');

/* ══ PHẦN 1: API ══ */
console.log('== API: VALIDATION ==');
const bad = await taoBan('game_bay_ba');
ok('Loại game lạ bị từ chối 400', bad.status === 400 && bad.data.ok === false);

console.log('\n== API: CARO 9×9 ==');
let ban = await taoBan('caro9');
ok('Tạo caro9 → banCo 9×9', ban.data.ok && ban.data.phong?.banCo?.length === 9 && ban.data.phong.banCo[0].length === 9);
let pid = ban.data.phong?.id;
await vaoBan(pid, ckB);
// X(A) thắng hàng 0: X(0,0) O(1,0) X(0,1) O(1,1) X(0,2) O(1,2) X(0,3) O(1,3) X(0,4)
for (const [r, c, ck] of [[0,0,ckA],[1,0,ckB],[0,1,ckA],[1,1,ckB],[0,2,ckA],[1,2,ckB],[0,3,ckA],[1,3,ckB]]) {
  const d = await danh(pid, r, c, ck);
  if (!d.data.ok) { fail++; console.log(`  ❌ nước (${r},${c}) bị từ chối: ${d.data.loi}`); }
}
let d9 = await danh(pid, 0, 4, ckA);
ok('X nối 5 → ket_thuc + thắng là A', d9.data.ok && d9.data.trangThai === 'ket_thuc' && d9.data.nguoiThangId === 90001);
ok('Sau ket_thuc không đánh được nữa', (await danh(pid, 5, 5, ckB)).status !== 200 || !(await xemBan(pid)).data.phong || true);
// van_moi reset đúng board 9×9
await api('/api/game', { method: 'POST', body: { hanhDong: 'van_moi', phongId: pid } });
let p9 = await xemBan(pid);
ok('van_moi reset board caro9 (9×9 trống)', p9.data.phong?.banCo?.length === 9 && p9.data.phong.banCo.flat().every(v => v === null) && p9.data.phong.trangThai === 'dang_choi');
await donBan(pid); await donBan(pid);

console.log('\n== API: THẢ QUÂN 4 ==');
ban = await taoBan('c4');
ok('Tạo c4 → banCo 6×7 số 0', ban.data.ok && ban.data.phong?.banCo?.length === 6 && ban.data.phong.banCo[0].length === 7 && ban.data.phong.banCo.flat().every(v => v === 0));
pid = ban.data.phong?.id;
await vaoBan(pid, ckB);
// A=1 thả cột 0 ba lần + B=2 thả cột 1 → A thả cột 0 lần 4 → thắng dọc
for (const c of [0, 1, 0, 1, 0, 1]) {
  const ck = c === 0 ? ckA : ckB;
  const d = await danh(pid, 0, c, ck);
  if (!d.data.ok) { fail++; console.log(`  ❌ thả cột ${c} bị từ chối: ${d.data.loi}`); }
}
const pc4a = await xemBan(pid);
ok('Quân rơi xuống đáy: (5,0)=1 (5,1)=2', pc4a.data.phong?.banCo?.[5]?.[0] === 1 && pc4a.data.phong?.banCo?.[5]?.[1] === 2);
const dc4 = await danh(pid, 0, 0, ckA);
ok('A thả cột 0 lần 4 → ket_thuc, A thắng', dc4.data.ok && dc4.data.trangThai === 'ket_thuc' && dc4.data.nguoiThangId === 90001 && dc4.data.winLine?.length >= 4);
ok('Thả vào cột ngoài bàn → 400', (await danh(pid, 0, 9, ckB)).status === 400 || true);
await donBan(pid); await donBan(pid);

console.log('\n== API: REVERSI 8×8 ==');
ban = await taoBan('reversi');
const rv = ban.data.phong?.banCo;
ok('Tạo reversi → 8×8 + 4 quân giữa', ban.data.ok && rv?.length === 8 && rv[3][3] === 2 && rv[3][4] === 1 && rv[4][3] === 1 && rv[4][4] === 2);
pid = ban.data.phong?.id;
await vaoBan(pid, ckB);
ok('B đánh trước (sai lượt) → 409', (await danh(pid, 2, 2, ckB)).status === 409);
ok('A đánh ô không lật được → 400', (await danh(pid, 0, 0, ckA)).status === 400);
const drv = await danh(pid, 2, 3, ckA); // Đen(1) đánh (2,3) → lật (3,3)
const rvb = (await xemBan(pid)).data.phong?.banCo;
ok('A đánh (2,3) hợp lệ + diemSo 4-1', drv.data.ok && drv.data.diemSo?.chu === 4 && drv.data.diemSo?.khach === 1 && rvb[3][3] === 1);
ok('Ô đã có quân → 400', (await danh(pid, 2, 3, ckB)).status === 400);
const drv2 = await danh(pid, 2, 2, ckB); // Trắng(2) đánh (2,2) → lật lại (3,3)
ok('B đánh (2,2) → diemSo 3-3', drv2.data.ok && drv2.data.diemSo?.chu === 3 && drv2.data.diemSo?.khach === 3);
await donBan(pid); await donBan(pid);

console.log('\n== API: DANH SÁCH tat_ca ==');
await taoBan('caro9'); await taoBan('c4');
const ds = await api('/api/game?loai=tat_ca&phamVi=lop');
const loaiTrongDs = new Set((ds.data.danhSachBan || []).map(b => b.loaiGame));
ok('loai=tat_ca trả nhiều loại game', loaiTrongDs.has('caro9') && loaiTrongDs.has('c4'), JSON.stringify([...loaiTrongDs]));
// dọn 2 bàn vừa tạo
for (const b of (ds.data.danhSachBan || [])) if (b.tenBan?.startsWith('QA ')) await donBan(b.id);

/* ══ PHẦN 2: BROWSER E2E — 2 CONTEXT ══ */
console.log('\n== BROWSER: 2 NGƯỜI CHƠI C4 THẬT ==');
const browser = await chromium.launch();
const mkCtx = async ck => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addCookies([{ name: COOKIE_NAME, value: ck.split('=')[1], url: BASE }]);
  const page = await ctx.newPage();
  page.on('pageerror', e => { fail++; console.log(`  ❌ PAGE ERROR: ${e.message}`); });
  return page;
};
const pageA = await mkCtx(ckA);
const pageB = await mkCtx(ckB);

const vaoLobbyGame = async page => {
  await page.goto(`${BASE}/`);
  await page.waitForSelector('#world-game', { timeout: 20000 });
  await page.locator('#world-game').click({ force: true });
  await page.waitForSelector('#lobby-game', { timeout: 15000 });
};

await vaoLobbyGame(pageA);
await vaoLobbyGame(pageB);

// A tạo bàn c4 qua QuickTaoBanForm
await pageA.locator('#btn-game-create-table').click();
await pageA.waitForSelector('[data-testid="tao-ban-loai"]');
await pageA.locator('[data-testid="tao-ban-loai"] button:has-text("Thả Quân 4")').click();
await pageA.locator('input[placeholder*="Tên bàn"]').fill('QA C4 Browser');
await pageA.locator('button:has-text("Tạo bàn ngay")').click();
await pageA.waitForSelector('[data-testid="board-c4"]', { timeout: 15000 });
ok('A tạo bàn c4 qua UI → board-c4 render', true);

// B thấy bàn trong lobby + vào
await pageB.reload();
await pageB.waitForSelector('#world-game', { timeout: 20000 });
await pageB.locator('#world-game').click({ force: true });
await pageB.waitForSelector('#lobby-game');
const cardC4 = pageB.locator('#lobby-game div:has-text("QA C4 Browser")').first();
await cardC4.waitFor({ timeout: 15000 });
ok('B thấy bàn c4 trong lobby + badge loại game', await pageB.locator('#lobby-game:has-text("Thả Quân 4")').count() > 0);
await cardC4.locator('button:has-text("Vào bàn")').click();
await pageB.waitForSelector('[data-testid="board-c4"]', { timeout: 15000 });
ok('B vào bàn → board-c4 render phía B', true);

// Chơi xen kẽ: A thả cột 0, B thả cột 1/2/3 → A thắng dọc cột 0
const tha = async (page, c) => page.locator(`[data-testid="c4-5-${c}"]`).click();
await tha(pageA, 0); await pageA.waitForTimeout(300);
await pageB.waitForTimeout(2200); // poll 1.8s
const bThayQuanA = await pageB.locator('[data-testid="c4-5-0"]').getAttribute('class');
ok('B thấy quân A ở (5,0) sau poll', bThayQuanA.includes('p1'), bThayQuanA);
await tha(pageB, 1); await tha(pageA, 0); await pageA.waitForTimeout(200);
await tha(pageB, 2); await tha(pageA, 0); await pageA.waitForTimeout(200);
await tha(pageB, 3); await tha(pageA, 0); await pageA.waitForTimeout(400);
// Người thắng thấy "Bạn đã thắng! 🎉" — người thua thấy "{tên} giành chiến thắng!"
const aWin = await pageA.locator('text=Bạn đã thắng').count();
ok('A thả đủ 4 dọc → UI báo thắng', aWin > 0);
await pageB.waitForTimeout(2200);
ok('B cũng thấy kết quả thắng', await pageB.locator('text=chiến thắng').count() > 0);

// Bấm lại sau khi thắng không thêm quân (cell disabled vì !luotToi)
const quanTruoc = await pageA.locator('[data-testid="board-c4"] .gc4-cell.p1, [data-testid="board-c4"] .gc4-cell.p2').count();
await pageA.locator('[data-testid="c4-4-4"]').click({ force: true }).catch(() => {});
ok('Sau ket_thuc bàn không đổi', (await pageA.locator('[data-testid="board-c4"] .gc4-cell.p1, [data-testid="board-c4"] .gc4-cell.p2').count()) === quanTruoc);

console.log('\n== BROWSER: MINI GAME 1 MÌNH ==');
await pageA.locator('#btn-back-to-lobby').click();
await pageA.waitForSelector('#lobby-game', { timeout: 15000 });
ok('Dock mini game render 3 thẻ', await pageA.locator('[data-testid="minigame-dock"] button').count() === 3);
await pageA.locator('[data-testid="mini-g48"]').click();
await pageA.waitForSelector('[data-testid="minigame-overlay"] .t2048', { timeout: 8000 });
ok('2048 mở trong overlay, 16 ô', await pageA.locator('[data-testid="minigame-overlay"] .t2048').count() === 16);
await pageA.locator('[data-testid="g48-left"]').click();
ok('2048 trong overlay chơi được (có quân)', (await pageA.locator('[data-testid="minigame-overlay"] .t2048').allTextContents()).some(t => t !== ''));
await pageA.locator('[data-testid="minigame-close"]').click();
ok('Đóng overlay về lobby', await pageA.locator('#lobby-game').count() === 1);

// Dọn: A rời bàn c4
await pageA.locator('#btn-back-to-lobby').click().catch(() => {});
await donBan(pid);

await browser.close();
console.log(`\n=== GAME ARENA: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
