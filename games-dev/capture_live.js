import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 450, height: 950 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  console.log('Navigating to http://localhost:3005/raw ...');
  await page.goto('http://localhost:3005/raw', { waitUntil: 'networkidle', timeout: 30000 });
  // Wait for Godot canvas to render
  console.log('Waiting 5s for Godot game canvas to load...');
  await page.waitForTimeout(5000);

  await page.screenshot({
    path: 'C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_browser_screenshot.png'
  });
  console.log('Screenshot saved to live_browser_screenshot.png');
  await browser.close();
}
capture().catch(console.error);
