import sharp from 'sharp';

async function findPadDiscMarks() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';

  // Candidate regions around the 14 pads:
  const padBoxes = [
    { id: 0, name: 'P0', cx: 356, cy: 338 },
    { id: 1, name: 'P1', cx: 252, cy: 432 },
    { id: 2, name: 'P2', cx: 270, cy: 512 },
    { id: 3, name: 'P3', cx: 380, cy: 455 },
    { id: 4, name: 'P4', cx: 516, cy: 430 },
    { id: 5, name: 'P5', cx: 566, cy: 574 },
    { id: 6, name: 'P6', cx: 492, cy: 590 },
    { id: 7, name: 'P7', cx: 580, cy: 720 },
    { id: 8, name: 'P8', cx: 212, cy: 780 },
    { id: 9, name: 'P9', cx: 284, cy: 870 },
    { id: 10, name: 'P10', cx: 346, cy: 930 },
    { id: 11, name: 'P11', cx: 462, cy: 910 },
    { id: 12, name: 'P12', cx: 564, cy: 970 },
    { id: 13, name: 'P13', cx: 416, cy: 1050 },
  ];

  const { data, info } = await sharp(mapPath).raw().toBuffer({ resolveWithObject: true });

  const exactPads = [];

  for (const p of padBoxes) {
    // Look in a +/- 40px box around cx, cy for the brightest center pixels (the white/cream Ω symbol)
    let sumX = 0, sumY = 0, count = 0;
    let minX = p.cx - 35, maxX = p.cx + 35;
    let minY = p.cy - 25, maxY = p.cy + 25;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const idx = (y * info.width + x) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        // The inner disc face has high brightness and cream/grey tone (r > 170, g > 160, b > 140)
        // especially the white symbol (r > 210, g > 200, b > 180)
        if (r > 200 && g > 190 && b > 160) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }

    if (count > 0) {
      const bestX = Math.round(sumX / count);
      const bestY = Math.round(sumY / count);
      exactPads.push({ id: p.id, name: p.name, tx: bestX, ty: bestY });
    } else {
      exactPads.push({ id: p.id, name: p.name, tx: p.cx, ty: p.cy });
    }
  }

  console.log('--- EXACT CENTROIDS OF STONE DISC MARKS ---');
  let svgElements = [];
  exactPads.forEach(p => {
    const wx = +(360.0 + (p.tx - 384.0) * 0.938).toFixed(1);
    const wy = +(640.0 + (p.ty - 688.0) * 0.938).toFixed(1);
    console.log(`Vector2(${wx}, ${wy}), # Pad ${p.id} (${p.name} - tex: ${p.tx}, ${p.ty})`);

    svgElements.push(`<ellipse cx="${p.tx}" cy="${p.ty}" rx="28" ry="16" fill="rgba(255, 0, 0, 0.2)" stroke="#ff0000" stroke-width="2"/>`);
    svgElements.push(`<circle cx="${p.tx}" cy="${p.ty}" r="4" fill="yellow"/>`);
    svgElements.push(`<text x="${p.tx+22}" y="${p.ty-6}" fill="yellow" font-size="16" font-weight="bold">${p.name}</text>`);
  });

  const svg = Buffer.from(`<svg width="${info.width}" height="${info.height}">${svgElements.join('\n')}</svg>`);
  await sharp(mapPath)
    .composite([{ input: svg }])
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/centroids_verified.jpg');

  console.log('Saved centroids_verified.jpg');
}

findPadDiscMarks().catch(console.error);
