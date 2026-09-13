import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import { resolve } from 'path';

const url = pathToFileURL(resolve('qa/game-lab.html')).href;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(url);
await p.waitForSelector('#menu .game-card');
await p.screenshot({ path: 'qa/lab-menu.png' });

await p.locator('[data-testid="game-c4"]').click();
for (const c of [3, 4, 3, 4, 3]) await p.locator(`[data-testid="c4-col-${c}"]`).click();
await p.waitForTimeout(400);
await p.screenshot({ path: 'qa/lab-c4.png' });
await p.locator('[data-testid="btn-back"]').click();

await p.locator('[data-testid="game-rv"]').click();
await p.locator('[data-testid="rv-2-3"]').click();
await p.waitForTimeout(300);
await p.screenshot({ path: 'qa/lab-rv.png' });
await p.locator('[data-testid="btn-back"]').click();

await p.locator('[data-testid="game-xo"]').click();
for (const [r, c] of [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2],[0,3],[1,3],[0,4]])
  await p.locator(`[data-testid="xo-${r}-${c}"]`).click();
await p.waitForTimeout(300);
await p.screenshot({ path: 'qa/lab-xo.png' });
await p.locator('[data-testid="btn-back"]').click();

await p.locator('[data-testid="game-g48"]').click();
await p.locator('[data-testid="g48-left"]').click();
await p.locator('[data-testid="g48-up"]').click();
await p.locator('[data-testid="g48-left"]').click();
await p.waitForTimeout(250);
await p.screenshot({ path: 'qa/lab-2048.png' });
await p.locator('[data-testid="btn-back"]').click();

await p.locator('[data-testid="game-mem"]').click();
await p.locator('[data-testid="mem-0"]').click();
await p.locator('[data-testid="mem-5"]').click();
await p.waitForTimeout(250);
await p.screenshot({ path: 'qa/lab-mem.png' });
await p.locator('[data-testid="btn-back"]').click();

await p.locator('[data-testid="game-snk"]').click();
await p.waitForTimeout(1500);
await p.screenshot({ path: 'qa/lab-snk.png' });
await b.close();
console.log('done');
