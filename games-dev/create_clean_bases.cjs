const sharp = require('sharp');

async function createCleanBases() {
  // 1. Clean Gatling Base:
  // From tower_gatling_gun.png:
  // Base circle top edge is around y = 370.
  // The turntable ring is an ellipse centered at x = 240, y = 360, rx = 100, ry = 35.
  // Let's create an SVG overlay that cleanly covers the remnants with a metallic turntable disc!
  const gBaseMeta = await sharp('games-dev/godot-project/assets/sprites/tower_gatling_base.png').metadata();

  // Create clean metallic turntable for Gatling Base
  // Gatling base is 440 x 205.
  // Disc center is around x = 220, y = 50.
  const gTurntableSvg = `
  <svg width="${gBaseMeta.width}" height="${gBaseMeta.height}">
    <defs>
      <radialGradient id="discGrad" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#7a887a" />
        <stop offset="70%" stop-color="#4a554a" />
        <stop offset="100%" stop-color="#2c352c" />
      </radialGradient>
      <linearGradient id="rimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#8a9a8a" />
        <stop offset="100%" stop-color="#1f261f" />
      </linearGradient>
    </defs>
    <!-- Dark socket under turntable -->
    <ellipse cx="220" cy="50" rx="92" ry="32" fill="#182018" stroke="#101510" stroke-width="3" />
    <!-- Metallic rotating turntable ring -->
    <ellipse cx="220" cy="48" rx="86" ry="29" fill="url(#discGrad)" stroke="url(#rimGrad)" stroke-width="3" />
    <!-- Inner mount ring -->
    <ellipse cx="220" cy="48" rx="55" ry="19" fill="#2d382d" stroke="#506050" stroke-width="2" />
    <!-- Center pivot hole -->
    <ellipse cx="220" cy="48" rx="28" ry="10" fill="#121812" stroke="#222b22" stroke-width="2" />
  </svg>`;

  await sharp('games-dev/godot-project/assets/sprites/tower_gatling_base.png')
    .composite([{ input: Buffer.from(gTurntableSvg), top: 0, left: 0 }])
    .toFile('games-dev/clean_gatling_base.png');

  // 2. Clean Plasma Base:
  // Plasma base is 460 x 225.
  // The turntable is centered around x = 230, y = 60.
  const pTurntableSvg = `
  <svg width="460" height="225">
    <defs>
      <radialGradient id="pDiscGrad" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#3d6b99" />
        <stop offset="70%" stop-color="#1e3a59" />
        <stop offset="100%" stop-color="#0f2033" />
      </radialGradient>
      <linearGradient id="pRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#5599dd" />
        <stop offset="100%" stop-color="#0b1726" />
      </linearGradient>
    </defs>
    <!-- Dark socket under turntable -->
    <ellipse cx="230" cy="62" rx="98" ry="34" fill="#09131f" stroke="#050a12" stroke-width="3" />
    <!-- Blue high-tech turntable ring -->
    <ellipse cx="230" cy="60" rx="92" ry="31" fill="url(#pDiscGrad)" stroke="url(#pRimGrad)" stroke-width="3" />
    <!-- Inner glowing reactor socket ring -->
    <ellipse cx="230" cy="60" rx="60" ry="21" fill="#13273d" stroke="#38bdf8" stroke-width="2" />
    <!-- Center energy conduit socket -->
    <ellipse cx="230" cy="60" rx="30" ry="11" fill="#07111c" stroke="#0ea5e9" stroke-width="2" />
  </svg>`;

  await sharp('games-dev/godot-project/assets/sprites/tower_plasma_base.png')
    .composite([{ input: Buffer.from(pTurntableSvg), top: 0, left: 0 }])
    .toFile('games-dev/clean_plasma_base.png');

  console.log('Clean bases created successfully!');
}
createCleanBases();
