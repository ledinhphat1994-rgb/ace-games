import sharp from 'sharp';

async function cropCombatDetails() {
  const imgPath = 'C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_wave_combat_1.png';

  // live_wave_combat_1.png is 900 x 1900 (because viewport is 450x950 @ 2x)
  // Let's crop:
  // 1. Pad 1 area (Plasma tower & Mech)
  // 2. Pad 3 area (Gatling tower & disc)
  await sharp(imgPath)
    .extract({ left: 300, top: 450, width: 300, height: 350 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/crop_gatling_live.png');

  await sharp(imgPath)
    .extract({ left: 80, top: 400, width: 300, height: 350 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/crop_plasma_live.png');

  console.log('Saved crop_gatling_live.png and crop_plasma_live.png');
}

cropCombatDetails().catch(console.error);
