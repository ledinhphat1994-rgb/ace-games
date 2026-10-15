import sharp from 'sharp';

async function measurePad1() {
  // Let's crop Pad 1 area with a fine grid
  // left: 50, top: 400, width: 350, height: 350
  let svg = '<svg width=\"350\" height=\"350\">';
  for (let x = 0; x < 350; x += 25) {
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="350" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>`;
    svg += `<text x="${x+2}" y="12" fill="yellow" font-size="10">${50+x}</text>`;
  }
  for (let y = 0; y < 350; y += 25) {
    svg += `<line x1="0" y1="${y}" x2="350" y2="${y}" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>`;
    svg += `<text x="2" y="${y+12}" fill="yellow" font-size="10">${400+y}</text>`;
  }
  svg += '</svg>';

  await sharp('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/live_browser_screenshot.png')
    .extract({ left: 50, top: 400, width: 350, height: 350 })
    .composite([{ input: Buffer.from(svg) }])
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/pad1_fine_measure.png');

  console.log('Saved pad1_fine_measure.png');
}
measurePad1().catch(console.error);
