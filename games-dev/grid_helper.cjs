const sharp = require('sharp');

async function grid(src, out, w, h) {
  let svg = `<svg width="${w}" height="${h}">`;
  for (let x = 0; x < w; x += 50) {
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="red" stroke-width="1" opacity="0.4"/>`;
    svg += `<text x="${x+2}" y="15" fill="red" font-size="11">${x}</text>`;
  }
  for (let y = 0; y < h; y += 50) {
    svg += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="yellow" stroke-width="1" opacity="0.4"/>`;
    svg += `<text x="2" y="${y+15}" fill="yellow" font-size="11">${y}</text>`;
  }
  svg += `</svg>`;

  await sharp(src)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toFile(out);
}

async function run() {
  await grid('games-dev/godot-project/assets/sprites/tower_gatling_turret.png', 'games-dev/grid_gatling.png', 440, 280);
  await grid('games-dev/godot-project/assets/sprites/tower_plasma_turret.png', 'games-dev/grid_plasma.png', 500, 290);
  console.log('Done grids');
}
run();
