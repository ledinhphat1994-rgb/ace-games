const sharp = require('sharp');

async function smoothPlasmaBase() {
  const { data, info } = await sharp('games-dev/godot-project/assets/sprites/tower_plasma_base.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Clear the flat ears at x < 125, y < 65 and x > 335, y < 65
  for (let y = 0; y < 65; y++) {
    for (let x = 0; x < info.width; x++) {
      if (x < 132 || x > 330) {
        const idx = (y * info.width + x) * 4;
        data[idx + 3] = 0;
      }
    }
  }

  await sharp(data, { raw: info })
    .png()
    .toFile('games-dev/godot-project/assets/sprites/tower_plasma_base.png');

  console.log('Smoothed plasma base');
}
smoothPlasmaBase();
