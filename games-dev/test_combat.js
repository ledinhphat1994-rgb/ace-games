import { chromium } from 'playwright';

async function testGameplayWave() {
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

  // Click NEXT WAVE button
  // In the HUD, NEXT WAVE button is at bottom center (x: 225, y: 855 in 450x950 css)
  console.log('Clicking NEXT WAVE button at (225, 855)...');
  await page.mouse.click(225, 855);

  // Wait 2.5s for enemies to spawn and march along the road
  console.log('Waiting 2.5s for enemies to march along road...');
  await page.waitForTimeout(2500);

  await page.screenshot({
    path: 'C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_wave_combat_1.png'
  });
  console.log('Screenshot saved to live_wave_combat_1.png');

  // Wait another 2s and take another screenshot
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: 'C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_wave_combat_2.png'
  });
  console.log('Screenshot saved to live_wave_combat_2.png');

  await browser.close();
}
testGameplayWave().catch(console.error);
