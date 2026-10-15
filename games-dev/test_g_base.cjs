const sharp = require('sharp');

async function testGatlingBase() {
  // Load current gatling base
  const { data, info } = await sharp('games-dev/godot-project/assets/sprites/tower_gatling_base.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Let's create a clean turntable disc on top
  // In the original tower_gatling_gun.png, what does the base look like?
  // Let's inspect the turntable area of tower_gatling_gun.png
  console.log('Testing gatling base');
}
testGatlingBase();
