import sharp from 'sharp';

async function testPads() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';

  const padsWorld = [
    { name: 'Pad0', w: [322.0, 330.0] },
    { name: 'Pad1', w: [229.0, 370.0] },
    { name: 'Pad2', w: [254.0, 477.0] },
    { name: 'Pad3', w: [345.0, 404.0] },
    { name: 'Pad4', w: [484.0, 375.0] },
    { name: 'Pad5', w: [525.0, 503.0] },
    { name: 'Pad6', w: [464.0, 556.0] },
    { name: 'Pad7', w: [539.0, 632.0] },
    { name: 'Pad8', w: [195.0, 708.0] },
    { name: 'Pad9', w: [257.0, 777.0] },
    { name: 'Pad10', w: [322.0, 831.0] },
    { name: 'Pad11', w: [429.0, 814.0] },
    { name: 'Pad12', w: [525.0, 869.0] },
    { name: 'Pad13', w: [383.0, 940.0] },
  ];

  let svgElements = [];
  padsWorld.forEach((p, idx) => {
    const tx = Math.round(384.0 + (p.w[0] - 360.0) / 0.938);
    const ty = Math.round(688.0 + (p.w[1] - 640.0) / 0.938);
    svgElements.push(`<ellipse cx="${tx}" cy="${ty}" rx="28" ry="16" fill="rgba(0, 255, 0, 0.25)" stroke="#00ff00" stroke-width="2"/>`);
    svgElements.push(`<circle cx="${tx}" cy="${ty}" r="4" fill="red"/>`);
    svgElements.push(`<line x1="${tx-20}" y1="${ty}" x2="${tx+20}" y2="${ty}" stroke="yellow" stroke-width="2"/>`);
    svgElements.push(`<line x1="${tx}" y1="${ty-20}" x2="${tx}" y2="${ty+20}" stroke="yellow" stroke-width="2"/>`);
    svgElements.push(`<text x="${tx+20}" y="${ty-8}" fill="white" font-size="20" font-weight="bold" stroke="black" stroke-width="1">P${idx}</text>`);
  });

  const svg = Buffer.from(`<svg width="768" height="1376">${svgElements.join('\n')}</svg>`);

  await sharp(mapPath)
    .composite([{ input: svg }])
    .jpeg({ quality: 90 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/pads_check_full.jpg');

  console.log('Saved pads_check_full.jpg successfully');
}
testPads().catch(console.error);
