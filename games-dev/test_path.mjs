import sharp from 'sharp'
import fs from 'node:fs'

const waypoints = [
  // 1. Entrance Portal & Suspension Bridge
  {x: 45, y: 345},
  {x: 105, y: 350},
  {x: 155, y: 360},
  // 2. North Hill Grove Loop
  {x: 200, y: 325},
  {x: 245, y: 310},
  {x: 285, y: 340},
  {x: 295, y: 410},
  // 3. Winding past Cave and Stone Bridge
  {x: 260, y: 490},
  {x: 280, y: 560},
  {x: 295, y: 615},
  // 4. Bottom-Left Scenic Hairpin Loop
  {x: 250, y: 675},
  {x: 195, y: 670},
  {x: 165, y: 620},
  {x: 175, y: 550},
  {x: 215, y: 540},
  // 5. Across to Bottom Choke Bridge
  {x: 270, y: 630},
  {x: 340, y: 675},
  {x: 405, y: 700},
  {x: 460, y: 685},
  // 6. Up Middle Island to Aqueduct Approach
  {x: 440, y: 600},
  {x: 420, y: 520},
  {x: 435, y: 440},
  {x: 480, y: 390},
  // 7. Cobblestone Aqueduct Bridge across Waterfall Chasm
  {x: 520, y: 470},
  {x: 580, y: 520},
  {x: 650, y: 565},
  {x: 720, y: 615},
  // 8. Castle Town Avenue
  {x: 800, y: 650},
  {x: 885, y: 685},
  {x: 960, y: 675},
  {x: 1025, y: 635},
  // 9. Grand Castle Ramp into Castle Gate
  {x: 1090, y: 545},
  {x: 1145, y: 475},
  {x: 1190, y: 410}
]

let svg = `<svg width="1376" height="768" xmlns="http://www.w3.org/2000/svg">`
svg += `<path d="M ${waypoints.map(p => `${p.x} ${p.y}`).join(' L ')}" fill="none" stroke="#22c55e" stroke-width="5" stroke-dasharray="8,6" />`
waypoints.forEach((p, idx) => {
  svg += `<circle cx="${p.x}" cy="${p.y}" r="6" fill="#facc15" stroke="#000" stroke-width="2" />`
  svg += `<text x="${p.x + 8}" y="${p.y - 6}" fill="#fff" font-size="12" font-weight="bold" stroke="#000" stroke-width="1">${idx}</text>`
})
svg += `</svg>`

await sharp('games-dev/godot-project/assets/textures/wide_tactical_battlefield.png')
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .toFile('games-dev/godot-project/assets/textures/test_path_overlay2.png')

console.log('Saved test_path_overlay2.png')
