import sharp from 'sharp';

async function testSplit() {
  // Let's inspect Gatling: 500 x 480
  // Base: from y=270 to 480
  // Turret: from y=0 to 330
  // Let's create an annotated image with lines showing y cuts
  let svg = '<svg width="500" height="480">';
  for (let y = 0; y < 480; y += 20) {
    svg += `<line x1="0" y1="${y}" x2="500" y2="${y}" stroke="rgba(255,255,0,0.4)" stroke-width="1"/>`;
    svg += `<text x="5" y="${y - 2}" fill="yellow" font-size="10">${y}</text>`;
  }
  svg += '</svg>';

  await sharp('games-dev/godot-project/assets/sprites/tower_gatling_gun.png')
    .composite([{ input: Buffer.from(svg) }])
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/gatling_cut_analysis.png');

  // Let's do the same for Plasma: 520 x 490
  let svgP = '<svg width="520" height="490">';
  for (let y = 0; y < 490; y += 20) {
    svgP += `<line x1="0" y1="${y}" x2="520" y2="${y}" stroke="rgba(255,255,0,0.4)" stroke-width="1"/>`;
    svgP += `<text x="5" y="${y - 2}" fill="yellow" font-size="10">${y}</text>`;
  }
  svgP += '</svg>';

  await sharp('games-dev/godot-project/assets/sprites/tower_plasma_cannon.png')
    .composite([{ input: Buffer.from(svgP) }])
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/plasma_cut_analysis.png');

  console.log('Saved cut analysis images');
}

testSplit().catch(console.error);
