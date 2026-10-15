import sharp from 'sharp';

async function generateTowerSprites() {
  const spriteDir = 'games-dev/godot-project/assets/sprites';

  // 1. Gatling Gun: 500 x 480
  // Base: crop { left: 30, top: 265, width: 440, height: 205 }
  // Let's trim or keep clean dimensions:
  // Base: width 440, height 205
  await sharp(`${spriteDir}/tower_gatling_gun.png`)
    .extract({ left: 30, top: 265, width: 440, height: 205 })
    .toFile(`${spriteDir}/tower_gatling_base.png`);

  // Turret: crop { left: 30, top: 20, width: 440, height: 280 }
  await sharp(`${spriteDir}/tower_gatling_gun.png`)
    .extract({ left: 30, top: 20, width: 440, height: 280 })
    .toFile(`${spriteDir}/tower_gatling_turret.png`);

  // 2. Plasma Cannon: 520 x 490
  // Base: crop { left: 30, top: 260, width: 460, height: 225 }
  await sharp(`${spriteDir}/tower_plasma_cannon.png`)
    .extract({ left: 30, top: 260, width: 460, height: 225 })
    .toFile(`${spriteDir}/tower_plasma_base.png`);

  // Turret: crop { left: 30, top: 10, width: 460, height: 280 }
  await sharp(`${spriteDir}/tower_plasma_cannon.png`)
    .extract({ left: 30, top: 10, width: 460, height: 280 })
    .toFile(`${spriteDir}/tower_plasma_turret.png`);

  console.log('Successfully generated split tower sprites in assets/sprites!');
}

generateTowerSprites().catch(console.error);
