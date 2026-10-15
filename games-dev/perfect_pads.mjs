import sharp from 'sharp';

async function perfectPadsCalibration() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';

  // Looking at pads_verified_overlay.jpg:
  // P0: (356, 358) -> perfect!
  // P1: (246, 398) -> perfect!
  // P2: (278, 480) -> perfect!
  // P3: (372, 424) -> perfect!
  // P4: (516, 402) -> perfect!
  // P5: in overlay, yellow cross is at (560, 482), but the real disc is at (568, 540)!
  // P6: in overlay, yellow cross is at (494, 524), but the real disc is at (500, 598)!
  // P7: in overlay, yellow cross is at (574, 588), but the real disc is at (580, 678)!
  // P8: (212, 738) -> perfect!
  // P9: in overlay, yellow cross is at (278, 796), but the real disc is at (284, 826)!
  // P10: in overlay, yellow cross is at (346, 846), but the real disc is at (346, 886)!
  // P11: in overlay, yellow cross is at (466, 824), but the real disc is at (462, 870)!
  // P12: in overlay, yellow cross is at (562, 864), but the real disc is at (564, 928)!
  // P13: in overlay, yellow cross is at (416, 932), but the real disc is at (416, 1004)!

  const pads = [
    { id: 0, name: 'P0_GroveTop', tx: 356, ty: 358 },
    { id: 1, name: 'P1_UpperLeft', tx: 246, ty: 398 },
    { id: 2, name: 'P2_MidLeft', tx: 278, ty: 480 },
    { id: 3, name: 'P3_CenterU', tx: 372, ty: 424 },
    { id: 4, name: 'P4_UpperRight', tx: 516, ty: 402 },
    { id: 5, name: 'P5_RightSlopeUpper', tx: 568, ty: 540 },
    { id: 6, name: 'P6_BridgeApproach', tx: 500, ty: 598 },
    { id: 7, name: 'P7_CrystalCave', tx: 580, ty: 678 },
    { id: 8, name: 'P8_WindmillVillage', tx: 212, ty: 738 },
    { id: 9, name: 'P9_BottomLeftLoop', tx: 284, ty: 826 },
    { id: 10, name: 'P10_BottomMid', tx: 346, ty: 886 },
    { id: 11, name: 'P11_UnderBridge', tx: 462, ty: 870 },
    { id: 12, name: 'P12_BottomRight', tx: 564, ty: 928 },
    { id: 13, name: 'P13_BottomTip', tx: 416, ty: 1004 },
  ];

  let svgElements = [];
  pads.forEach((p) => {
    svgElements.push(`<ellipse cx="${p.tx}" cy="${p.ty}" rx="28" ry="16" fill="rgba(0, 255, 0, 0.25)" stroke="#00ff00" stroke-width="2"/>`);
    svgElements.push(`<circle cx="${p.tx}" cy="${p.ty}" r="4" fill="red"/>`);
    svgElements.push(`<line x1="${p.tx-24}" y1="${p.ty}" x2="${p.tx+24}" y2="${p.ty}" stroke="yellow" stroke-width="2"/>`);
    svgElements.push(`<line x1="${p.tx}" y1="${p.ty-16}" x2="${p.tx}" y2="${p.ty+16}" stroke="yellow" stroke-width="2"/>`);
    svgElements.push(`<text x="${p.tx+24}" y="${p.ty-8}" fill="white" font-size="18" font-weight="bold" stroke="black" stroke-width="1">P${p.id}</text>`);
  });

  const svg = Buffer.from(`<svg width="768" height="1376">${svgElements.join('\n')}</svg>`);

  await sharp(mapPath)
    .composite([{ input: svg }])
    .jpeg({ quality: 90 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/pads_perfect_100.jpg');

  console.log('Saved pads_perfect_100.jpg');

  console.log('--- GODOT WORLD COORDINATES 100% PERFECT ---');
  pads.forEach((p) => {
    const wx = +(360.0 + (p.tx - 384.0) * 0.938).toFixed(1);
    const wy = +(640.0 + (p.ty - 688.0) * 0.938).toFixed(1);
    console.log(`Vector2(${wx}, ${wy}), # Pad ${p.id} (${p.name} - tex: ${p.tx}, ${p.ty})`);
  });
}

perfectPadsCalibration().catch(console.error);
