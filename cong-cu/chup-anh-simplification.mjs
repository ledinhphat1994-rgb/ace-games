import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const url = process.argv[2] || 'https://gdtxdinhquan.pages.dev';
const outDir = path.resolve(process.cwd(), 'qa');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

console.log(`Navigating to ${url}...`);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForLoadState('load').catch(() => {});

const nutCampus = page.locator('button:has-text("Digital Campus")').first();
if (await nutCampus.count()) await nutCampus.click();
await page.waitForTimeout(2000);

// 1. 1920x1080: Expand Cinema category in navigator to showcase Region 2
await page.setViewportSize({ width: 1920, height: 1080 });
const catCinema = page.locator('#cat-nav-CINEMA');
if (await catCinema.count()) {
  await catCinema.click();
  await page.waitForTimeout(500);
}
await page.screenshot({ path: path.join(outDir, 'simplification_desktop_1920.png') });
console.log('Saved simplification_desktop_1920.png');

// 2. 1440x900
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(outDir, 'simplification_desktop_1440.png') });
console.log('Saved simplification_desktop_1440.png');

// 3. 1024x768
await page.setViewportSize({ width: 1024, height: 768 });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(outDir, 'simplification_tablet_1024.png') });
console.log('Saved simplification_tablet_1024.png');

// 4. 390x844: Mobile overview
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(outDir, 'simplification_mobile_390.png') });
console.log('Saved simplification_mobile_390.png');

// 5. 390x844: Mobile with drawer open
const btnMobCinema = page.locator('#mobile-cat-CINEMA');
if (await btnMobCinema.count() && await btnMobCinema.isVisible()) {
  await btnMobCinema.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'simplification_mobile_sheet_390.png') });
  console.log('Saved simplification_mobile_sheet_390.png');
}

await browser.close();
console.log('Capture finished successfully.');
