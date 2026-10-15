const sharp = require('sharp');

async function generateFlapFrames() {
  const src = 'games-dev/godot-project/assets/sprites/enemy_winged_bot.png';
  const meta = await sharp(src).metadata();
  const W = meta.width;
  const H = meta.height;

  // We can use SVG to compose the transformed wings with the clean body on top!
  // Wing Left base: extract rect (0, 0, 165, 230)
  const lWingBuf = await sharp(src)
    .extract({ left: 0, top: 0, width: 170, height: 230 })
    .toBuffer();
  const lWingBase64 = `data:image/png;base64,${lWingBuf.toString('base64')}`;

  // Wing Right base: extract rect (310, 0, 130, 230)
  const rWingBuf = await sharp(src)
    .extract({ left: 310, top: 0, width: 130, height: 230 })
    .toBuffer();
  const rWingBase64 = `data:image/png;base64,${rWingBuf.toString('base64')}`;

  // Full original image base64
  const fullBuf = await sharp(src).toBuffer();
  const fullBase64 = `data:image/png;base64,${fullBuf.toString('base64')}`;

  // 1. Frame UP: Left wing angle = -25 deg, Right wing angle = +25 deg
  // Left pivot: (145, 160). Since left crop starts at 0, local pivot is (145, 160).
  // Right pivot: (335, 140). Since right crop starts at 310, local pivot is (25, 140).
  const svgUp = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <!-- Rotated Left Wing -->
    <g transform="rotate(-26, 145, 160)">
      <image href="${lWingBase64}" x="0" y="0" width="170" height="230" />
    </g>
    <!-- Rotated Right Wing -->
    <g transform="rotate(26, 335, 140)">
      <image href="${rWingBase64}" x="310" y="0" width="130" height="230" />
    </g>
    <!-- Clean Body on Top (mask out wings from full image so original wings don't show behind) -->
    <g>
      <clipPath id="bodyClip">
        <circle cx="240" cy="190" r="115" />
        <rect x="180" y="270" width="160" height="150" />
        <rect x="200" y="40" width="80" height="80" />
      </clipPath>
      <image href="${fullBase64}" x="0" y="0" width="${W}" height="${H}" clip-path="url(#bodyClip)" />
    </g>
  </svg>`;

  await sharp(Buffer.from(svgUp))
    .png()
    .toFile('games-dev/godot-project/assets/sprites/enemy_winged_bot_up.png');

  // 2. Frame DOWN: Left wing angle = +24 deg, Right wing angle = -24 deg
  const svgDown = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <!-- Rotated Left Wing -->
    <g transform="rotate(24, 145, 160)">
      <image href="${lWingBase64}" x="0" y="0" width="170" height="230" />
    </g>
    <!-- Rotated Right Wing -->
    <g transform="rotate(-24, 335, 140)">
      <image href="${rWingBase64}" x="310" y="0" width="130" height="230" />
    </g>
    <!-- Clean Body on Top -->
    <g>
      <clipPath id="bodyClipDown">
        <circle cx="240" cy="190" r="115" />
        <rect x="180" y="270" width="160" height="150" />
        <rect x="200" y="40" width="80" height="80" />
      </clipPath>
      <image href="${fullBase64}" x="0" y="0" width="${W}" height="${H}" clip-path="url(#bodyClipDown)" />
    </g>
  </svg>`;

  await sharp(Buffer.from(svgDown))
    .png()
    .toFile('games-dev/godot-project/assets/sprites/enemy_winged_bot_down.png');

  console.log('Generated enemy_winged_bot_up.png and enemy_winged_bot_down.png!');
}
generateFlapFrames();
