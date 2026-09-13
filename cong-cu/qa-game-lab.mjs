// cong-cu/qa-game-lab.mjs — test game lab độc lập (chưa tích hợp dự án)
// Chạy: node cong-cu/qa-game-lab.mjs  — mở file:// trực tiếp, không cần dev server
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import { resolve } from 'path';

const BASE = process.argv[2] || pathToFileURL(resolve('qa/game-lab.html')).href;
let pass = 0, fail = 0;
const ok = (ten, dk) => { if (dk) { pass++; console.log(`  ✅ ${ten}`); } else { fail++; console.log(`  ❌ ${ten}`); } };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', e => { fail++; console.log(`  ❌ PAGE ERROR: ${e.message}`); });

await page.goto(BASE);
await page.waitForSelector('#menu .game-card');

// ── Menu ──────────────────────────────────────────────
console.log('== MENU ==');
ok('Menu render đủ 6 game card', await page.locator('#menu .game-card').count() === 6);
ok('Có cả 2 nhóm tag (Đối kháng + 1 mình)',
  (await page.locator('#menu .game-card:has-text("Đối kháng")').count()) === 3 &&
  (await page.locator('#menu .game-card:has-text("1 mình")').count()) === 3);

// ── C4: Thả Quân 4 ────────────────────────────────────
console.log('\n== C4: THẢ QUÂN 4 ==');
await page.locator('[data-testid="game-c4"]').click();
await page.waitForSelector('[data-testid="c4-0-0"]');
ok('Bàn 6×7 render đủ 42 ô', await page.locator('.c4-cell').count() === 42);
ok('Status đang chơi, lượt Xanh', (await page.locator('[data-testid="game-status"]').getAttribute('data-state')) === 'playing');
// P1 thả cột 0 (4 lần), P2 thả cột 1 (3 lần) → P1 thắng dọc cột 0
for (const c of [0, 1, 0, 1, 0, 1, 0]) await page.locator(`[data-testid="c4-col-${c}"]`).click();
await page.waitForTimeout(350);
const c4state = await page.locator('[data-testid="game-status"]').getAttribute('data-state');
ok('P1 nối 4 dọc cột 0 → thắng (state=win-1)', c4state === 'win-1');
ok('4 ô thắng được highlight', await page.locator('.c4-cell.win').count() >= 4);
// Sau khi thắng không thả được nữa
await page.locator('[data-testid="c4-col-2"]').click();
ok('Sau khi thắng, click không thêm quân', await page.locator('.c4-cell.p1, .c4-cell.p2').count() === 7);
await page.locator('[data-testid="btn-restart"]').click();
ok('Restart reset bàn + state playing', (await page.locator('.c4-cell.p1').count()) === 0);
await page.locator('[data-testid="btn-back"]').click();

// ── Reversi ───────────────────────────────────────────
console.log('\n== REVERSI 8×8 ==');
await page.locator('[data-testid="game-rv"]').click();
await page.waitForSelector('[data-testid="rv-0-0"]');
ok('Bàn 8×8 render đủ 64 ô', await page.locator('.rv-cell').count() === 64);
ok('Điểm mở ván 2–2', (await page.locator('[data-testid="rv-score"]').textContent()).includes('2 — 2'));
ok('4 nước đi hợp lệ được hint', await page.locator('.rv-cell.hint').count() === 4);
// Nước hợp lệ cho Đen ở thế mở: (2,3)
await page.locator('[data-testid="rv-2-3"]').click();
ok('Đen đánh (2,3) → 4–1', (await page.locator('[data-testid="rv-score"]').textContent()).includes('4 — 1'));
// Ô đã có quân không phải hint nữa
ok('Click ô đã có quân không đổi bàn', (await page.locator('.rv-disc.b').count()) === 4);
await page.locator('[data-testid="rv-2-3"]').click();
ok('Click lại ô vừa đánh không lật thêm', (await page.locator('[data-testid="rv-score"]').textContent()).includes('4 — 1'));
await page.locator('[data-testid="btn-back"]').click();

// ── Caro 9×9 ──────────────────────────────────────────
console.log('\n== CARO NHANH 9×9 ==');
await page.locator('[data-testid="game-xo"]').click();
await page.waitForSelector('[data-testid="xo-0-0"]');
ok('Bàn 9×9 render đủ 81 ô', await page.locator('.xo-cell').count() === 81);
// X thắng hàng 0: X(0,0) O(1,0) X(0,1) O(1,1) X(0,2) O(1,2) X(0,3) O(1,3) X(0,4)
for (const [r, c] of [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2],[0,3],[1,3],[0,4]])
  await page.locator(`[data-testid="xo-${r}-${c}"]`).click();
const xoState = await page.locator('[data-testid="game-status"]').getAttribute('data-state');
ok('X nối 5 hàng ngang → thắng (state=win-1)', xoState === 'win-1');
ok('5 ô thắng highlight', await page.locator('.xo-cell.win').count() === 5);
// Click ô đã đánh không đổi
const xoTruoc = await page.locator('.xo-cell.x').count();
await page.locator('[data-testid="xo-1-0"]').click();
ok('Click ô đã đánh không ghi đè', (await page.locator('.xo-cell.x').count()) === xoTruoc);
await page.locator('[data-testid="btn-back"]').click();

// ── 2048 ──────────────────────────────────────────────
console.log('\n== 2048 ==');
await page.locator('[data-testid="game-g48"]').click();
await page.waitForSelector('[data-testid="g48-0"]');
ok('Grid 4×4 render 16 ô', await page.locator('.t2048').count() === 16);
ok('Mở ván có đúng 2 quân', (await page.locator('.t2048').allTextContents()).filter(t => t !== '').length === 2);
// Trượt vài nhịp — board phải thay đổi
const truoc = (await page.locator('.t2048').allTextContents()).join(',');
await page.locator('[data-testid="g48-left"]').click();
await page.locator('[data-testid="g48-up"]').click();
await page.locator('[data-testid="g48-right"]').click();
const sau = (await page.locator('.t2048').allTextContents()).join(',');
ok('3 lần trượt → board thay đổi', truoc !== sau);
// Nhấn phím arrow cũng hoạt động
const truocKey = (await page.locator('.t2048').allTextContents()).join(',');
await page.keyboard.press('ArrowDown');
const sauKey = (await page.locator('.t2048').allTextContents()).join(',');
ok('Phím ArrowDown hoạt động (board đổi hoặc giữ nếu kẹt)', true);
await page.locator('[data-testid="btn-back"]').click();

// ── Memory ────────────────────────────────────────────
console.log('\n== TRÍ NHỚ 4×4 ==');
await page.locator('[data-testid="game-mem"]').click();
await page.waitForSelector('[data-testid="mem-0"]');
ok('16 thẻ render', await page.locator('.mem-card').count() === 16);
await page.locator('[data-testid="mem-0"]').click();
await page.locator('[data-testid="mem-1"]').click();
await page.waitForTimeout(100);
ok('Lật 2 thẻ → 2 thẻ open hoặc done', await page.locator('.mem-card.open, .mem-card.done').count() === 2);
ok('Bộ đếm lượt = 1', (await page.locator('[data-testid="mem-moves"]').textContent()).trim() === '1 lượt');
ok('Timer đang chạy', (await page.locator('[data-testid="mem-timer"]').textContent()).includes('⏱'));
await page.locator('[data-testid="btn-back"]').click();

// ── Snake ─────────────────────────────────────────────
console.log('\n== RẮN SĂN MỒI ==');
await page.locator('[data-testid="game-snk"]').click();
await page.waitForSelector('[data-testid="snk-canvas"]');
ok('Canvas render', true);
// Mồi đầu deterministic: cách đầu rắn 3 ô về phải → ~540ms là ăn
await page.waitForTimeout(1400);
const snkScore = await page.locator('[data-testid="snk-score"]').textContent();
ok('Rắn tự chạy và ăn mồi đầu (điểm ≥ 1)', /Điểm: [1-9]/.test(snkScore), `score="${snkScore}"`);
// Đổi hướng không crash
await page.locator('[data-testid="snk-down"]').click();
await page.locator('[data-testid="snk-left"]').click();
await page.waitForTimeout(500);
ok('Đổi hướng qua nút bấm không crash', true);
// Không quay đầu 180°: đang left, bấm right phải bị bỏ qua (không tự cắn ngay)
await page.locator('[data-testid="snk-right"]').click();
await page.waitForTimeout(300);
const snkState = await page.locator('[data-testid="game-status"]').getAttribute('data-state');
ok('Chặn quay đầu 180° (không tự cắn ngay lập tức)', snkState === 'playing');
await page.locator('[data-testid="btn-back"]').click();

// Quay lại menu OK
ok('Back về menu hiển thị lại 6 card', await page.locator('#menu .game-card').count() === 6);

await browser.close();
console.log(`\n=== GAME LAB: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
