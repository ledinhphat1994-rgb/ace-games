import sharp from 'sharp';

async function verifyAll14Centers() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';

  // Manual precise texture centers directly aligned to the disc face:
  const exactPads = [
    { id: 0, name: 'P0_GroveTop', tx: 354, ty: 358 },
    { id: 1, name: 'P1_UpperLeft', tx: 252, ty: 432 },
    { id: 2, name: 'P2_MidLeft', tx: 270, ty: 512 },
    { id: 3, name: 'P3_CenterU', tx: 382, ty: 456 },
    { id: 4, name: 'P4_UpperRight', tx: 516, ty: 430 },
    { id: 5, name: 'P5_RightSlopeUpper', tx: 570, ty: 544 },
    { id: 6, name: 'P6_BridgeApproach', tx: 492, ty: 592 },
    { id: 7, name: 'P7_CrystalCave', tx: 578, ty: 680 },
    { id: 8, name: 'P8_WindmillVillage', tx: 220, ty: 770 },
    { id: 9, name: 'P9_BottomLeftLoop', tx: 284, ty: 830 },
    { id: 10, name: 'P10_BottomMid', tx: 346, ty: 890 },
    { id: 11, name: 'P11_UnderBridge', tx: 462, ty: 872 },
    { id: 12, name: 'P12_BottomRight', tx: 564, ty: 930 },
    { id: 13, name: 'P13_BottomTip', tx: 418, ty: 1006 },
  ];

  let svgElements = [];
  exactPads.forEach(p => {
    svgElements.push(`<ellipse cx="${p.tx}" cy="${p.ty}" rx="28" ry="16" fill="rgba(0, 255, 0, 0.3)" stroke="#00ff00" stroke-width="2"/>`);
    svgElements.push(`<circle cx="${p.tx}" cy="${p.ty}" r="4" fill="red"/>`);
    svgElements.push(`<line x1="${p.tx-24}" y1="${p.ty}" x2="${p.tx+24}" y2="${p.ty}" stroke="yellow" stroke-width="2"/>`);
    svgElements.push(`<line x1="${p.tx}" y1="${p.ty-16}" x2="${p.tx}" y2="${p.ty+16}" stroke="yellow" stroke-width="2"/>`);
    svgElements.push(`<text x="${p.tx+24}" y="${p.ty-6}" fill="white" font-size="16" font-weight="bold" stroke="black" stroke-width="1">${p.name}</text>`);
  });

  const svg = Buffer.from(`<svg width="768" height="1376">${svgElements.join('\n')}</svg>`);

  await sharp(mapPath)
    .composite([{ input: svg }])
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/final_14_perfect.jpg');

  console.log('Saved final_14_perfect.jpg');

  console.log('--- FINAL GODOT WORLD COORDINATES ---');
  exactPads.forEach(p => {
    const wx = +(360.0 + (p.tx - 384.0) * 0.938).toFixed(1);
    const wy = +(640.0 + (p.ty - 688.0) * 0.938).toFixed(1);
    console.log(`Vector2(${wx}, ${wy}), # Pad ${p.id} (${p.name} - tex: ${p.tx}, ${p.ty})`);
  });
}

verifyAll14Centers().catch(console.error);
