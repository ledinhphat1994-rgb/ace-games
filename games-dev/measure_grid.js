import sharp from 'sharp';

async function measureExact() {
  // Let's add crosshairs to live_cropped_towers.png to find exact coordinates
  // Width is 700, Height is 600
  let svg = '<svg width=\"700\" height=\"600\">';
  for (let x = 0; x < 700; x += 50) {
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="600" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`;
    svg += `<text x="${x+2}" y="15" fill="yellow" font-size="12">${x}</text>`;
  }
  for (let y = 0; y < 600; y += 50) {
    svg += `<line x1="0" y1="${y}" x2="700" y2="${y}" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`;
    svg += `<text x="2" y="${y+15}" fill="yellow" font-size="12">${y}</text>`;
  }
  svg += '</svg>';

  await sharp('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_cropped_towers.png')
    .composite([{ input: Buffer.from(svg) }])
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_grid_measured.png');

  console.log('Saved live_grid_measured.png');
}
measureExact().catch(console.error);
