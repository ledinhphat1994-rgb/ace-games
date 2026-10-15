const sharp = require('sharp');

async function splitWingedBot() {
  const src = 'games-dev/godot-project/assets/sprites/enemy_winged_bot.png';
  const meta = await sharp(src).metadata();
  console.log('Winged bot size:', meta.width, meta.height);

  // 1. Extract Left Wing:
  // Left wing is approximately x: 0 to 175, y: 0 to 220.
  // Pivot point on wing: around (145, 155).
  await sharp(src)
    .extract({ left: 10, top: 15, width: 165, height: 200 })
    .toFile('games-dev/godot-project/assets/sprites/winged_bot_wing_left.png');

  // 2. Extract Right Wing:
  // Right wing is approximately x: 310 to 440, y: 15 to 215.
  // Pivot point on wing: around (335, 135).
  await sharp(src)
    .extract({ left: 310, top: 15, width: 125, height: 200 })
    .toFile('games-dev/godot-project/assets/sprites/winged_bot_wing_right.png');

  // 3. Extract Body:
  // The sphere body + thrusters + antenna
  // We can erase the wings or keep body clean
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });

  // Clear the wings from body image:
  // Left wing area: x < 135 and y < 200
  // Right wing area: x > 330 and y < 190
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      if (x < 135 && y < 200) {
        data[idx + 3] = 0; // Transparent
      } else if (x > 335 && y < 190) {
        data[idx + 3] = 0; // Transparent
      }
    }
  }

  await sharp(data, { raw: info })
    .png()
    .toFile('games-dev/godot-project/assets/sprites/winged_bot_body.png');

  console.log('Winged bot split successfully!');
}
splitWingedBot();
