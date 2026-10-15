import sharp from 'sharp';

async function testSplitTurret() {
  const gatlingPath = 'games-dev/godot-project/assets/sprites/tower_gatling_gun.png';

  // Gatling size: 500 x 480
  // Base: y from 270 to 475
  // Turret: y from 0 to 320

  // 1. Base image: crop { left: 0, top: 260, width: 500, height: 220 }
  // And to make sure top is clean, we can clip or smooth
  await sharp(gatlingPath)
    .extract({ left: 30, top: 265, width: 440, height: 205 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/test_gatling_base.png');

  // 2. Turret image: crop { left: 0, top: 20, width: 500, height: 300 }
  await sharp(gatlingPath)
    .extract({ left: 30, top: 20, width: 440, height: 280 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/test_gatling_turret.png');

  console.log('Saved test_gatling_base.png and test_gatling_turret.png');
}

testSplitTurret().catch(console.error);
