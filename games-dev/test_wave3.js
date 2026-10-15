import { chromium } from 'playwright';
import sharp from 'sharp';

async function testWave3() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 450, height: 950 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  console.log('Navigating to http://localhost:3005/raw ...');
  await page.goto('http://localhost:3005/raw', { waitUntil: 'networkidle', timeout: 30000 });

  await page.waitForTimeout(4000);

  // Wave 1
  console.log('Next wave 1...');
  await page.mouse.click(225, 855);
  await page.waitForTimeout(1000);

  // Wave 2
  console.log('Next wave 2...');
  await page.mouse.click(225, 855);
  await page.waitForTimeout(1000);

  // Wave 3 (Winged Bot)
  console.log('Next wave 3...');
  await page.mouse.click(225, 855);
  await page.waitForTimeout(3500);

  const fullPath = 'C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_wave3_winged.png';
  await page.screenshot({ path: fullPath });
  console.log('Saved live_wave3_winged.png');

  // Crop top left road where enemies spawn
  await sharp(fullPath)
    .extract({ left: 50, top: 250, width: 800, height: 750 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_crop_wave3_winged.png');
  console.log('Saved live_crop_wave3_winged.png');

  await browser.close();
}

testWave3().catch(console.error);
