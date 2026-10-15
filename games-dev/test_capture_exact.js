import { chromium } from 'playwright';
import sharp from 'sharp';

async function testExact() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 450, height: 950 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  console.log('Navigating to http://localhost:3005/raw ...');
  await page.goto('http://localhost:3005/raw', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('Waiting 4s for Godot game to load...');
  await page.waitForTimeout(4000);

  // Trigger Wave 1
  console.log('Clicking Next Wave at (225, 855)...');
  await page.mouse.click(225, 855);
  await page.waitForTimeout(2500);

  // Trigger Wave 2
  console.log('Triggering Wave 2...');
  await page.mouse.click(225, 855);
  await page.waitForTimeout(3000);

  const fullPath = 'C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_exact_match.png';
  await page.screenshot({ path: fullPath });
  console.log('Saved live_exact_match.png');

  // Crop Pad 3 (Gatling) & Pad 6 (Plasma) & Monster combat
  await sharp(fullPath)
    .extract({ left: 100, top: 450, width: 700, height: 850 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_crop_exact_combat.png');
  console.log('Saved live_crop_exact_combat.png');

  await browser.close();
}

testExact().catch(console.error);
