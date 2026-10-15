const sharp = require('sharp');

async function testComposite() {
  const baseImg = await sharp('games-dev/godot-project/assets/sprites/tower_gatling_base.png').toBuffer();
  const turretImg = await sharp('games-dev/godot-project/assets/sprites/tower_gatling_turret.png').toBuffer();

  // Gatling base dimensions
  const baseMeta = await sharp(baseImg).metadata();
  console.log('Base:', baseMeta.width, baseMeta.height);
}

testComposite();
