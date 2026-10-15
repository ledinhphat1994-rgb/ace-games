const sharp = require('sharp');

async function createFlapFrames() {
  const src = 'games-dev/godot-project/assets/sprites/enemy_winged_bot.png';
  const meta = await sharp(src).metadata();
  const W = meta.width;
  const H = meta.height;

  // We can extract left wing (with transparent background) and right wing
  // Left wing boundary: x: 0 to 180, y: 0 to 240
  // Right wing boundary: x: 300 to W, y: 0 to 240
  // Body boundary: x: 140 to 350, full height

  // Let's create an exact SVG transform that rotates the wings around their joints!
  // Joint left: (150, 160)
  // Joint right: (340, 135)

  // Frame UP: Left wing rotates -22 deg (tips up), Right wing rotates +22 deg (tips up)
  // Frame DOWN: Left wing rotates +22 deg (tips down), Right wing rotates -22 deg (tips down)

  // To do this cleanly, let's cut left wing and right wing into separate transparent PNGs:
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });

  // 1. Isolate Left Wing (clear everything else)
  const lWingData = Buffer.from(data);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      // Keep only left wing (x < 155, y < 220, but not body part)
      if (x > 155 || y > 225) {
        lWingData[idx + 3] = 0;
      }
    }
  }
  const lWingBuf = await sharp(lWingData, { raw: info }).png().toBuffer();

  // 2. Isolate Right Wing (clear everything else)
  const rWingData = Buffer.from(data);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      // Keep only right wing (x > 325, y < 220)
      if (x < 325 || y > 225) {
        rWingData[idx + 3] = 0;
      }
    }
  }
  const rWingBuf = await sharp(rWingData, { raw: info }).png().toBuffer();

  // 3. Clean Body (keep sphere and thrusters)
  const bodyData = Buffer.from(data);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      // Clear wing feathers outside body
      if ((x < 135 && y < 190) || (x > 345 && y < 180)) {
        bodyData[idx + 3] = 0;
      }
    }
  }
  const bodyBuf = await sharp(bodyData, { raw: info }).png().toBuffer();

  // Save isolated parts
  await sharp(lWingBuf).toFile('games-dev/godot-project/assets/sprites/winged_bot_wing_left.png');
  await sharp(rWingBuf).toFile('games-dev/godot-project/assets/sprites/winged_bot_wing_right.png');
  await sharp(bodyBuf).toFile('games-dev/godot-project/assets/sprites/winged_bot_body.png');

  console.log('Isolated wing parts created!');
}
createFlapFrames();
