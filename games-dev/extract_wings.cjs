const sharp = require('sharp');

async function extractCleanWings() {
  const src = 'games-dev/godot-project/assets/sprites/enemy_winged_bot.png';
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  // 1. LEFT WING:
  // Left wing is on the left side of the sphere.
  // The sphere edge runs roughly from (145, 120) to (120, 200).
  // Any pixel to the right of the wing contour should be transparent.
  const lData = Buffer.from(data);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      // Keep only left wing area
      if (x > 140 || y > 210) {
        lData[idx + 3] = 0;
      }
    }
  }
  await sharp(lData, { raw: info })
    .trim()
    .toFile('games-dev/godot-project/assets/sprites/winged_bot_wing_left.png');

  // 2. RIGHT WING:
  // Right wing is on the right side of the sphere.
  // The sphere right ear mount is at (335, 135).
  const rData = Buffer.from(data);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      // Keep only right wing area
      if (x < 325 || y > 210) {
        rData[idx + 3] = 0;
      }
    }
  }
  await sharp(rData, { raw: info })
    .trim()
    .toFile('games-dev/godot-project/assets/sprites/winged_bot_wing_right.png');

  console.log('Clean trimmed wings created!');
}
extractCleanWings();
