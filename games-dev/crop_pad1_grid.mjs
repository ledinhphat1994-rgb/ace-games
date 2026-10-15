import sharp from 'sharp';

async function cropPad1Grid() {
  // Pad 1 is top-left
  // Let's crop x: 180-380, y: 300-500
  const width = 200, height = 200;
  let svg = '<svg width="200" height="200">';
  for (let x = 0; x < 200; x += 10) {
    const gx = 180 + x;
    const isMajor = (gx % 50 === 0);
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="200" stroke="${isMajor ? 'yellow' : 'rgba(255,255,255,0.3)'}" stroke-width="1"/>`;
    if (isMajor) svg += `<text x="${x+2}" y="12" fill="yellow" font-size="9">${gx}</text>`;
  }
  for (let y = 0; y < 200; y += 10) {
    const gy = 300 + y;
    const isMajor = (gy % 50 === 0);
    svg += `<line x1="0" y1="${y}" x2="200" y2="${y}" stroke="${isMajor ? 'yellow' : 'rgba(255,255,255,0.3)'}" stroke-width="1"/>`;
    if (isMajor) svg += `<text x="2" y="${y+10}" fill="yellow" font-size="9">${gy}</text>`;
  }
  svg += '</svg>';

  await sharp('games-dev/godot-project/assets/textures/island_map.jpg')
    .extract({ left: 180, top: 300, width: 200, height: 200 })
    .composite([{ input: Buffer.from(svg) }])
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/pad1_exact_texture.png');

  console.log('Saved pad1_exact_texture.png');
}

cropPad1Grid().catch(console.error);
