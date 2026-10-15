import sharp from 'sharp';

async function debugTowers() {
  const towers = [
    { name: 'tower_plasma_cannon', w: 520, h: 490, offset: [0, -195], scale: 0.175 },
    { name: 'tower_gatling_gun', w: 500, h: 480, offset: [0, -188], scale: 0.165 },
    { name: 'tower_tesla_coil', w: 360, h: 670, offset: [0, -295], scale: 0.165 },
  ];

  for (const t of towers) {
    const p = `games-dev/godot-project/assets/sprites/${t.name}.png`;
    const cy = t.h / 2;
    const cx = t.w / 2;
    // Pivot with offset:
    const pivotX = cx - t.offset[0];
    const pivotY = cy - t.offset[1];

    let svg = `<svg width="${t.w}" height="${t.h}">`;
    // Crosshair at center
    svg += `<line x1="0" y1="${cy}" x2="${t.w}" y2="${cy}" stroke="blue" stroke-width="2"/>`;
    // Crosshair at pivot
    svg += `<line x1="0" y1="${pivotY}" x2="${t.w}" y2="${pivotY}" stroke="red" stroke-width="4"/>`;
    svg += `<line x1="${pivotX}" y1="0" x2="${pivotX}" y2="${t.h}" stroke="red" stroke-width="4"/>`;
    svg += `<circle cx="${pivotX}" cy="${pivotY}" r="8" fill="yellow"/>`;
    svg += `</svg>`;

    await sharp(p)
      .composite([{ input: Buffer.from(svg) }])
      .png()
      .toFile(`C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/${t.name}_debug.png`);
  }
  console.log('Saved tower debug images');
}
debugTowers().catch(console.error);
