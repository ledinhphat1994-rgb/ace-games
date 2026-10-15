import sharp from 'sharp';

async function findPadCenters() {
  // Let's crop 3 towers/pads from live_browser_screenshot.png:
  // 1. Pad 1 (top-left)
  // 2. Pad 3 (center)
  // 3. Pad 4 (top-right)

  // In live_browser_screenshot (900 x 1900):
  // Let's crop the whole upper gameplay area (x: 50-850, y: 350-950) with 20px grid
  let svg = '<svg width=\"800\" height=\"600\">';
  for (let x = 0; x < 800; x += 40) {
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="600" stroke="rgba(255,255,0,0.3)" stroke-width="1"/>`;
    svg += `<text x="${x+2}" y="15" fill="yellow" font-size="11">${50+x}</text>`;
  }
  for (let y = 0; y < 600; y += 40) {
    svg += `<line x1="0" y1="${y}" x2="800" y2="${y}" stroke="rgba(255,255,0,0.3)" stroke-width="1"/>`;
    svg += `<text x="2" y="${y+15}" fill="yellow" font-size="11">${350+y}</text>`;
  }
  svg += '</svg>';

  await sharp('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_browser_screenshot.png')
    .extract({ left: 50, top: 350, width: 800, height: 600 })
    .composite([{ input: Buffer.from(svg) }])
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/pads_grid_calibrated.png');

  console.log('Saved pads_grid_calibrated.png');
}
findPadCenters().catch(console.error);
