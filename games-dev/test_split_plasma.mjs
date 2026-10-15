import sharp from 'sharp';

async function testSplitPlasma() {
  const plasmaPath = 'games-dev/godot-project/assets/sprites/tower_plasma_cannon.png';

  // Plasma: 520 x 490
  // Base: from y=260 to 485
  await sharp(plasmaPath)
    .extract({ left: 30, top: 260, width: 460, height: 225 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/test_plasma_base.png');

  // Turret: from y=10 to 290
  await sharp(plasmaPath)
    .extract({ left: 30, top: 10, width: 460, height: 280 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/test_plasma_turret.png');

  console.log('Saved test_plasma_base.png and test_plasma_turret.png');
}

testSplitPlasma().catch(console.error);
