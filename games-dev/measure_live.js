import sharp from 'sharp';

async function measureLive() {
  const meta = await sharp('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_browser_screenshot.png').metadata();
  console.log('Live screenshot dimensions:', meta.width, meta.height);

  // In live screenshot (450x950 scaled by 2 = 900x1900):
  // Let's crop the area around Pad 1 (top-left) and Pad 3 (center)
  // Pad 1 is roughly at x=100-300, y=300-600
  await sharp('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_browser_screenshot.png')
    .extract({ left: 100, top: 400, width: 700, height: 600 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_cropped_towers.png');

  console.log('Saved live_cropped_towers.png');
}
measureLive().catch(console.error);
