const sharp = require('sharp');

async function smoothBottomPlasma() {
  const meta = await sharp('games-dev/godot-project/assets/sprites/tower_plasma_turret.png').metadata();

  // Fill the bottom cut with a solid rounded mechanical base
  // The cut goes from (130, 240) to (340, 290).
  const fillSvg = `
  <svg width="${meta.width}" height="${meta.height}">
    <path d="M 120,200 C 120,270 200,290 320,290 C 350,290 370,260 370,220 Z"
          fill="#0c1726" stroke="#050a12" stroke-width="3" />
  </svg>`;

  const current = await sharp('games-dev/godot-project/assets/sprites/tower_plasma_turret.png').toBuffer();

  const bg = await sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: Buffer.from(fillSvg), top: 0, left: 0 }])
  .png()
  .toBuffer();

  await sharp(bg)
    .composite([{ input: current, top: 0, left: 0 }])
    .toFile('games-dev/godot-project/assets/sprites/tower_plasma_turret.png');

  console.log('Smoothed bottom plasma');
}
smoothBottomPlasma();
