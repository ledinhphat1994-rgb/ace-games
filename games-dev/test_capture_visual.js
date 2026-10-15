import { chromium } from 'playwright';
import sharp from 'sharp';

async function testPadsAndEnemies() {
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

  // In Godot, click on Pad 6 or 7 to open build popup and build Plasma tower
  // Pad 6 is at world (461.3, 550.0). Camera is at (360, 520) with zoom 1.42.
  // screen.x = (461.3 - 360) * 1.42 + 225 = 101.3 * 1.42 + 225 = 368.8
  // screen.y = (550.0 - 520) * 1.42 + 950 / 2 = 30.0 * 1.42 + 475 = 517.6
  console.log('Clicking on Pad 6 at (369, 518) to build Plasma tower...');
  await page.mouse.click(369, 518);
  await page.waitForTimeout(600);

  // In the build popup, click Plasma button (left button)
  // Build popup is centered on screen.
  // Panel width is ~340. BtnPlasma is at approximately (130, 480)
  console.log('Selecting Plasma Tower option in popup...');
  await page.mouse.click(130, 480);
  await page.waitForTimeout(800);

  // Now click NEXT WAVE button at (225, 855) to start Wave 1
  console.log('Triggering Wave 1...');
  await page.mouse.click(225, 855);
  await page.waitForTimeout(3000);

  // Trigger Wave 2
  console.log('Triggering Wave 2...');
  await page.mouse.click(225, 855);
  await page.waitForTimeout(3500);

  const fullPath = 'C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_combat_wave2.png';
  await page.screenshot({ path: fullPath });
  console.log('Saved live_combat_wave2.png');

  // Crop the Pad 6/7 area (bridge and waterfall area, 100 to 800)
  await sharp(fullPath)
    .extract({ left: 100, top: 400, width: 700, height: 900 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_crop_wave2_closeup.png');
  console.log('Saved live_crop_wave2_closeup.png');

  await browser.close();
}

testPadsAndEnemies().catch(console.error);
