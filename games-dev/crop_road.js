import sharp from 'sharp';

async function cropRoad() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';

  // W0 to W6 is in the region: left 0 to 500, top 350 to 550
  let svg = '<svg width=\"550\" height=\"300\">';
  for (let x = 0; x < 550; x += 50) {
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="300" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`;
    svg += `<text x="${x+2}" y="15" fill="yellow" font-size="12">${x}</text>`;
  }
  for (let y = 0; y < 300; y += 50) {
    svg += `<line x1="0" y1="${y}" x2="${550}" y2="${y}" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`;
    svg += `<text x="2" y="${y+15}" fill="yellow" font-size="12">${350+y}</text>`;
  }
  svg += '</svg>';

  await sharp(mapPath)
    .extract({ left: 0, top: 350, width: 550, height: 300 })
    .composite([{ input: Buffer.from(svg) }])
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/road_w0_w6_grid.png');

  console.log('Saved road_w0_w6_grid.png');
}
cropRoad().catch(console.error);
