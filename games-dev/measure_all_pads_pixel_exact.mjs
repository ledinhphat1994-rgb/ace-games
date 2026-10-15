import sharp from 'sharp';

async function cropAllPadsFine() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';

  // Let's crop 120x120 tiles around all 14 pads with exact grids
  const testPads = [
    { id: 2, name: 'P2', x: 278, y: 515 },
    { id: 4, name: 'P4', x: 516, y: 440 },
    { id: 5, name: 'P5', x: 570, y: 580 },
    { id: 6, name: 'P6', x: 500, y: 640 },
    { id: 7, name: 'P7', x: 580, y: 720 },
    { id: 8, name: 'P8', x: 212, y: 780 },
    { id: 9, name: 'P9', x: 284, y: 870 },
    { id: 10, name: 'P10', x: 346, y: 930 },
    { id: 11, name: 'P11', x: 462, y: 910 },
    { id: 12, name: 'P12', x: 564, y: 970 },
    { id: 13, name: 'P13', x: 416, y: 1050 },
  ];

  for (const p of testPads) {
    const left = p.x - 70;
    const top = p.y - 70;
    let svg = '<svg width="140" height="140">';
    for (let x = 0; x < 140; x += 10) {
      const gx = left + x;
      const isMajor = (gx % 50 === 0);
      svg += `<line x1="${x}" y1="0" x2="${x}" y2="140" stroke="${isMajor ? 'yellow' : 'rgba(255,255,255,0.3)'}" stroke-width="1"/>`;
      if (isMajor) svg += `<text x="${x+2}" y="10" fill="yellow" font-size="8">${gx}</text>`;
    }
    for (let y = 0; y < 140; y += 10) {
      const gy = top + y;
      const isMajor = (gy % 50 === 0);
      svg += `<line x1="0" y1="${y}" x2="140" y2="${y}" stroke="${isMajor ? 'yellow' : 'rgba(255,255,255,0.3)'}" stroke-width="1"/>`;
      if (isMajor) svg += `<text x="2" y="${y+8}" fill="yellow" font-size="8">${gy}</text>`;
    }
    svg += '</svg>';

    await sharp(mapPath)
      .extract({ left, top, width: 140, height: 140 })
      .composite([{ input: Buffer.from(svg) }])
      .toFile(`C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/fine_${p.name}.png`);
  }

  console.log('Saved all fine crop tiles');
}

cropAllPadsFine().catch(console.error);
