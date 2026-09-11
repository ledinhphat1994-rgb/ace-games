import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const url = process.argv[2] || 'http://127.0.0.1:8788';
const outDir = path.resolve(process.cwd(), 'qa');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const artifactDir = 'C:\\Users\\lepha\\.gemini\\antigravity-ide\\brain\\1e1daa78-3e35-4321-815c-17803a413ced';

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

console.log(`Navigating to ${url}...`);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForLoadState('load').catch(() => {});

const nutCampus = page.locator('button:has-text("Digital Campus")').first();
if (await nutCampus.count()) await nutCampus.click();
await page.waitForTimeout(2000);

const viewports = [
  { name: 'phase3a_campus_1920', width: 1920, height: 1080 },
  { name: 'phase3a_campus_1440', width: 1440, height: 900 },
  { name: 'phase3a_campus_390', width: 390, height: 844 },
];

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.waitForTimeout(600);
  const localPath = path.join(outDir, `${vp.name}.png`);
  await page.screenshot({ path: localPath, fullPage: false });
  console.log(`Saved screenshot: ${localPath}`);

  if (fs.existsSync(artifactDir)) {
    const artPath = path.join(artifactDir, `${vp.name}.png`);
    fs.copyFileSync(localPath, artPath);
    console.log(`Copied to artifact dir: ${artPath}`);
  }
}

await browser.close();
console.log('Capture completed.');
