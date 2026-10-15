import sharp from 'sharp';

async function cropPads() {
  // Let's crop P1, P3, P4 from island_map.jpg directly with grid lines every 10 pixels
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';

  // P1 is around tex (244, 400)
  // P3 is around tex (368, 436)
  // P4 is around tex (516, 405)

  // Let's create an annotated crop for P1:
  // left: 180, top: 340, width: 140, height: 140
  let svg = '<svg width=\"140\" height=\"140\">';
  for (let x = 0; x < 140; x += 20) {
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="140" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
    svg += `<text x="${x+2}" y="12" fill="white" font-size="10">${180+x}</text>`;
  }
  for (let y = 0; y < 140; y += 20) {
    svg += `<line x1="0" y1="${y}" x2="140" y2="${y}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
    svg += `<text x="2" y="${y+12}" fill="white" font-size="10">${340+y}</text>`;
  }
  svg += '</svg>';

  await sharp(mapPath)
    .extract({ left: 180, top: 340, width: 140, height: 140 })
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/pad1_grid.png');

  console.log('Saved pad1_grid.png');
}
cropPads().catch(console.error);
