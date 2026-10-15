const sharp = require('sharp');

async function makePerfectBody() {
  const src = 'games-dev/godot-project/assets/sprites/enemy_winged_bot.png';
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  // Eye visor starts at x = 115.
  // Left wing feathers are at x < 112.
  // Right wing feathers are at x > 330, y < 190.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      if (x < 112 && y < 210) {
        data[idx + 3] = 0;
      }
      if (x > 330 && y < 185) {
        data[idx + 3] = 0;
      }
    }
  }

  await sharp(data, { raw: info })
    .png()
    .toFile('games-dev/godot-project/assets/sprites/winged_bot_body.png');

  console.log('Created perfect winged_bot_body!');
}
makePerfectBody();
