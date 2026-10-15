import sharp from 'sharp';

async function cropNew() {
  await sharp('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_browser_screenshot.png')
    .extract({ left: 80, top: 400, width: 450, height: 350 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_towers_check_2.png');
  console.log('Saved live_towers_check_2.png');
}
cropNew().catch(console.error);
