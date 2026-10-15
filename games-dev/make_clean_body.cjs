const sharp = require('sharp');

async function makeCleanBody() {
  const src = 'games-dev/godot-project/assets/sprites/enemy_winged_bot.png';
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  // Sphere center is roughly at (235, 195), radius ~ 110.
  // Left ear socket is at (130, 160).
  // Right ear socket is at (335, 140).
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      // Erase left wing feathers
      if (x < 135 && y < 195) {
        data[idx + 3] = 0;
      }
      // Erase right wing feathers
      if (x > 335 && y < 185) {
        data[idx + 3] = 0;
      }
    }
  }

  // Also clean the left ear border to make it a neat round socket
  const svgSockets = `
  <svg width="${W}" height="${H}">
    <!-- Left ear socket for left wing -->
    <circle cx="130" cy="160" r="18" fill="#5c4422" stroke="#2a1f10" stroke-width="3" />
    <circle cx="130" cy="160" r="10" fill="#2a1f10" stroke="#8a6c38" stroke-width="2" />
    <circle cx="130" cy="160" r="4" fill="#8a6c38" />
  </svg>`;

  const cleared = await sharp(data, { raw: info }).png().toBuffer();
  await sharp(cleared)
    .composite([{ input: Buffer.from(svgSockets), top: 0, left: 0 }])
    .toFile('games-dev/godot-project/assets/sprites/winged_bot_body.png');

  console.log('Clean winged_bot_body created with sockets!');
}
makeCleanBody();
