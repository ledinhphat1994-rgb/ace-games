import sharp from 'sharp'
import fs from 'node:fs'

const destPng = 'games-dev/godot-project/assets/textures/tactical_battlefield.png'

const waypoints = [
  // 1. Spawning out of the Magical Portal Archway
  {x: 100, y: 390},
  {x: 145, y: 415},
  {x: 195, y: 445},
  {x: 245, y: 470},
  {x: 285, y: 485},
  // 2. Approach & Crossing of Stone Arch Bridge
  {x: 340, y: 460},
  {x: 410, y: 435},
  {x: 480, y: 420},
  // 3. Passing Wooden Barricades & Stone Wall Gate
  {x: 550, y: 410},
  {x: 620, y: 395},
  {x: 700, y: 400},
  // 4. Central Plains Plateau (Strategic Killzone)
  {x: 790, y: 415},
  {x: 880, y: 415},
  {x: 970, y: 380},
  // 5. Grand Castle Cobblestone Ramp into Royal Fortress Gate
  {x: 1040, y: 345},
  {x: 1110, y: 300},
  {x: 1160, y: 280}
]

let svg = `<svg width="1376" height="768" xmlns="http://www.w3.org/2000/svg">`
svg += `<path d="M ${waypoints.map(p => `${p.x} ${p.y}`).join(' L ')}" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />`
waypoints.forEach((p, idx) => {
  svg += `<circle cx="${p.x}" cy="${p.y}" r="6" fill="#facc15" stroke="#000" stroke-width="2" />`
  svg += `<text x="${p.x + 8}" y="${p.y - 6}" fill="#fff" font-size="12" font-weight="bold" stroke="#000" stroke-width="1.2">${idx}</text>`
})
svg += `</svg>`

await sharp(destPng)
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .toFile('games-dev/godot-project/assets/textures/test_tactical_v3_FLAWLESS.png')

console.log('Saved test_tactical_v3_FLAWLESS.png')
