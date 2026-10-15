import sharp from 'sharp';

async function verifyAll14Pads() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';

  // These are candidate texture coordinates on island_map.jpg (768 x 1376)
  // Let's check each pad from upper_pads_grid.jpg and map_with_grid.jpg:
  const pads = [
    { id: 0, name: 'P0_GroveTop', tx: 356, ty: 358 },
    { id: 1, name: 'P1_UpperLeft', tx: 246, ty: 398 },
    { id: 2, name: 'P2_MidLeft', tx: 278, ty: 480 },
    { id: 3, name: 'P3_CenterU', tx: 372, ty: 424 },
    { id: 4, name: 'P4_UpperRight', tx: 516, ty: 402 },
    { id: 5, name: 'P5_RightSlopeUpper', tx: 560, ty: 482 },
    { id: 6, name: 'P6_BridgeApproach', tx: 494, ty: 524 },
    { id: 7, name: 'P7_CrystalCave', tx: 574, ty: 588 },
    { id: 8, name: 'P8_WindmillVillage', tx: 212, ty: 738 },
    { id: 9, name: 'P9_BottomLeftLoop', tx: 278, ty: 796 },
    { id: 10, name: 'P10_BottomMid', tx: 346, ty: 846 },
    { id: 11, name: 'P11_UnderBridge', tx: 466, ty: 824 },
    { id: 12, name: 'P12_BottomRight', tx: 562, ty: 864 },
    { id: 13, name: 'P13_BottomTip', tx: 416, ty: 932 },
  ];

  let svgElements = [];
  pads.forEach((p) => {
    // Disc ellipse on texture: radius ~28px x ~16px
    svgElements.push(`<ellipse cx="${p.tx}" cy="${p.ty}" rx="26" ry="15" fill="rgba(0, 255, 0, 0.2)" stroke="#00ff00" stroke-width="2"/>`);
    svgElements.push(`<circle cx="${p.tx}" cy="${p.ty}" r="4" fill="red"/>`);
    svgElements.push(`<line x1="${p.tx-24}" y1="${p.ty}" x2="${p.tx+24}" y2="${p.ty}" stroke="yellow" stroke-width="2"/>`);
    svgElements.push(`<line x1="${p.tx}" y1="${p.ty-16}" x2="${p.tx}" y2="${p.ty+16}" stroke="yellow" stroke-width="2"/>`);
    svgElements.push(`<text x="${p.tx+22}" y="${p.ty-8}" fill="white" font-size="18" font-weight="bold" stroke="black" stroke-width="1">P${p.id}</text>`);
  });

  const svg = Buffer.from(`<svg width="768" height="1376">${svgElements.join('\n')}</svg>`);

  await sharp(mapPath)
    .composite([{ input: svg }])
    .jpeg({ quality: 90 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/pads_verified_overlay.jpg');

  console.log('Saved pads_verified_overlay.jpg');

  // Also print Godot world coordinates
  console.log('--- GODOT WORLD COORDINATES ---');
  pads.forEach((p) => {
    const wx = +(360.0 + (p.tx - 384.0) * 0.938).toFixed(1);
    const wy = +(640.0 + (p.ty - 688.0) * 0.938).toFixed(1);
    console.log(`Vector2(${wx}, ${wy}), # Pad ${p.id} (${p.name} - tex: ${p.tx}, ${p.ty})`);
  });
}

verifyAll14Pads().catch(console.error);
