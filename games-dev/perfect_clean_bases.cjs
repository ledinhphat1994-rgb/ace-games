const sharp = require('sharp');

async function createPerfectBases() {
  // 1. GATLING BASE:
  // First clear pixels above the turntable
  const { data: gData, info: gInfo } = await sharp('games-dev/godot-project/assets/sprites/tower_gatling_base.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Turntable center: (220, 48), rx = 92, ry = 30.
  // Any pixel with y < 48 - 30 * sqrt(1 - ((x-220)/92)^2) should be transparent!
  for (let y = 0; y < gInfo.height; y++) {
    for (let x = 0; x < gInfo.width; x++) {
      const idx = (y * gInfo.width + x) * 4;
      const dx = (x - 220) / 95;
      if (Math.abs(dx) <= 1.0) {
        const topY = 48 - 30 * Math.sqrt(1 - dx * dx);
        if (y < topY) {
          gData[idx + 3] = 0; // Transparent
        }
      } else if (y < 48) {
        gData[idx + 3] = 0;
      }
    }
  }

  const gCleared = await sharp(gData, { raw: gInfo }).png().toBuffer();

  const gSvg = `
  <svg width="${gInfo.width}" height="${gInfo.height}">
    <defs>
      <linearGradient id="gRim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#4a5c4a" />
        <stop offset="50%" stop-color="#2d382d" />
        <stop offset="100%" stop-color="#182018" />
      </linearGradient>
      <radialGradient id="gDisc" cx="50%" cy="35%" r="50%">
        <stop offset="0%" stop-color="#8ba08b" />
        <stop offset="50%" stop-color="#4a5a4a" />
        <stop offset="85%" stop-color="#2a342a" />
        <stop offset="100%" stop-color="#151c15" />
      </radialGradient>
    </defs>
    <!-- Outer metallic bevel ring -->
    <ellipse cx="220" cy="50" rx="94" ry="32" fill="#1e261e" stroke="#121812" stroke-width="4" />
    <!-- Turntable disc -->
    <ellipse cx="220" cy="48" rx="90" ry="30" fill="url(#gDisc)" stroke="url(#gRim)" stroke-width="3" />
    <!-- Inner mount bearing track -->
    <ellipse cx="220" cy="48" rx="60" ry="20" fill="#222b22" stroke="#607560" stroke-width="2" />
    <!-- Heavy gear teeth notches on turntable ring -->
    <ellipse cx="220" cy="48" rx="35" ry="12" fill="#121812" stroke="#3d4c3d" stroke-width="2" />
    <ellipse cx="220" cy="48" rx="14" ry="5" fill="#0b0f0b" />
  </svg>`;

  await sharp(gCleared)
    .composite([{ input: Buffer.from(gSvg), top: 0, left: 0 }])
    .toFile('games-dev/godot-project/assets/sprites/tower_gatling_base.png');

  // 2. PLASMA BASE:
  const { data: pData, info: pInfo } = await sharp('games-dev/godot-project/assets/sprites/tower_plasma_base.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Turntable center: (230, 60), rx = 100, ry = 34.
  for (let y = 0; y < pInfo.height; y++) {
    for (let x = 0; x < pInfo.width; x++) {
      const idx = (y * pInfo.width + x) * 4;
      const dx = (x - 230) / 102;
      if (Math.abs(dx) <= 1.0) {
        const topY = 60 - 34 * Math.sqrt(1 - dx * dx);
        if (y < topY) {
          pData[idx + 3] = 0; // Transparent
        }
      } else if (y < 60) {
        pData[idx + 3] = 0;
      }
    }
  }

  const pCleared = await sharp(pData, { raw: pInfo }).png().toBuffer();

  const pSvg = `
  <svg width="${pInfo.width}" height="${pInfo.height}">
    <defs>
      <linearGradient id="pRim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="40%" stop-color="#1e3a5f" />
        <stop offset="100%" stop-color="#0c1726" />
      </linearGradient>
      <radialGradient id="pDisc" cx="50%" cy="35%" r="50%">
        <stop offset="0%" stop-color="#60a5fa" />
        <stop offset="45%" stop-color="#1d4ed8" />
        <stop offset="85%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#030712" />
      </radialGradient>
    </defs>
    <!-- Outer high-tech bevel ring -->
    <ellipse cx="230" cy="62" rx="100" ry="35" fill="#0b1320" stroke="#050912" stroke-width="4" />
    <!-- Turntable disc -->
    <ellipse cx="230" cy="60" rx="96" ry="33" fill="url(#pDisc)" stroke="url(#pRim)" stroke-width="3" />
    <!-- Inner glowing cyan reactor track -->
    <ellipse cx="230" cy="60" rx="64" ry="22" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5" />
    <!-- Center energy socket -->
    <ellipse cx="230" cy="60" rx="36" ry="12" fill="#020617" stroke="#0ea5e9" stroke-width="2" />
    <ellipse cx="230" cy="60" rx="16" ry="6" fill="#38bdf8" opacity="0.8" />
  </svg>`;

  await sharp(pCleared)
    .composite([{ input: Buffer.from(pSvg), top: 0, left: 0 }])
    .toFile('games-dev/godot-project/assets/sprites/tower_plasma_base.png');

  console.log('Saved perfect clean bases!');
}
createPerfectBases();
