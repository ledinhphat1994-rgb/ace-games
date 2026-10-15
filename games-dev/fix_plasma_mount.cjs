const sharp = require('sharp');

async function fixPlasmaTurretBase() {
  const meta = await sharp('games-dev/godot-project/assets/sprites/tower_plasma_turret.png').metadata();

  // The swivel pivot in tower_plasma_turret is around x = 205, y = 183.
  // The bottom-left diagonal cut is below y = 130 and left of x = 250.
  // Let's add a rounded mechanical mounting ball/gear housing under the pivot!
  const mountSvg = `
  <svg width="${meta.width}" height="${meta.height}">
    <defs>
      <radialGradient id="ballGrad" cx="40%" cy="40%" r="55%">
        <stop offset="0%" stop-color="#254d77" />
        <stop offset="60%" stop-color="#13273f" />
        <stop offset="100%" stop-color="#091422" />
      </radialGradient>
      <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#0b1726" />
      </linearGradient>
    </defs>
    <!-- Rounded mechanical pivot housing -->
    <path d="M 120,130 C 100,180 130,250 200,260 C 260,265 290,230 300,180 Z"
          fill="url(#ballGrad)" stroke="#0f172a" stroke-width="4" />
    <!-- Gear rim detail -->
    <circle cx="180" cy="205" r="32" fill="#0b1726" stroke="#38bdf8" stroke-width="3" />
    <circle cx="180" cy="205" r="16" fill="#1e3a5f" stroke="#0ea5e9" stroke-width="2" />
  </svg>`;

  // Composite mount BEHIND the turret
  const turretBuffer = await sharp('games-dev/godot-project/assets/sprites/tower_plasma_turret.png').toBuffer();

  const mountBuffer = await sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: Buffer.from(mountSvg), top: 0, left: 0 }])
  .png()
  .toBuffer();

  // Combine mount BEHIND turret
  await sharp(mountBuffer)
    .composite([{ input: turretBuffer, top: 0, left: 0 }])
    .toFile('games-dev/godot-project/assets/sprites/tower_plasma_turret.png');

  console.log('Fixed plasma turret mounting!');
}
fixPlasmaTurretBase();
