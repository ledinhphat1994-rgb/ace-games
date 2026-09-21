// scripts/clean-u2-assets.mjs
// Digital Campus v2: Clean baked UI elements from decorative visual assets

import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'

const CAMPUS_HERO = path.resolve('public/assets/campus/hero_illustration.webp')
const CAMPUS_HERO_BANNER = path.resolve('public/assets/campus/hero_banner.webp')
const CARD_LEARNING = path.resolve('public/assets/learning/card_learning.webp')
const CARD_GAME = path.resolve('public/assets/games/card_game.webp')
const CARD_COMMUNITY = path.resolve('public/assets/community/card_community.webp')

async function cleanHeroIllustration() {
  console.log('Cleaning hero_illustration.webp (removing baked carousel controls)...')
  const inputBuffer = fs.readFileSync(CAMPUS_HERO)
  const meta = await sharp(inputBuffer).metadata()

  // Overlay a smooth dark gradient patch over the bottom right corner (x: 1000..1240, y: 220..322)
  const patchSvg = `
<svg width="${meta.width}" height="${meta.height}">
  <defs>
    <radialGradient id="cornerMask" cx="100%" cy="100%" r="300px" fx="100%" fy="100%">
      <stop offset="0%" stop-color="#080d19" stop-opacity="1" />
      <stop offset="70%" stop-color="#080d19" stop-opacity="0.96" />
      <stop offset="100%" stop-color="#080d19" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect x="${meta.width - 320}" y="${meta.height - 110}" width="320" height="110" fill="url(#cornerMask)" />
</svg>
`
  const cleanedBuffer = await sharp(inputBuffer)
    .composite([{ input: Buffer.from(patchSvg), top: 0, left: 0 }])
    .webp({ quality: 95 })
    .toBuffer()

  fs.writeFileSync(CAMPUS_HERO, cleanedBuffer)
  console.log('✓ hero_illustration.webp cleaned.')
}

async function cleanHeroBanner() {
  if (!fs.existsSync(CAMPUS_HERO_BANNER)) return
  console.log('Cleaning hero_banner.webp...')
  const inputBuffer = fs.readFileSync(CAMPUS_HERO_BANNER)
  const meta = await sharp(inputBuffer).metadata()
  const patchSvg = `
<svg width="${meta.width}" height="${meta.height}">
  <defs>
    <radialGradient id="cornerMask" cx="100%" cy="100%" r="350px" fx="100%" fy="100%">
      <stop offset="0%" stop-color="#080d19" stop-opacity="1" />
      <stop offset="70%" stop-color="#080d19" stop-opacity="0.96" />
      <stop offset="100%" stop-color="#080d19" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect x="${meta.width - 360}" y="${meta.height - 120}" width="360" height="120" fill="url(#cornerMask)" />
</svg>
`
  const cleanedBuffer = await sharp(inputBuffer)
    .composite([{ input: Buffer.from(patchSvg), top: 0, left: 0 }])
    .webp({ quality: 95 })
    .toBuffer()

  fs.writeFileSync(CAMPUS_HERO_BANNER, cleanedBuffer)
  console.log('✓ hero_banner.webp cleaned.')
}

async function cleanDestinationCard(filePath, name) {
  console.log(`Cleaning ${name}...`)
  const inputBuffer = fs.readFileSync(filePath)
  const meta = await sharp(inputBuffer).metadata()

  // 1. Fade out the left 60% of the card artwork where mockup text was
  // 2. Fade out the top-right circle (x: 175..245, y: 35..105) where arrow button was baked
  const maskSvg = `
<svg width="${meta.width}" height="${meta.height}">
  <defs>
    <linearGradient id="leftFade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0b101d" stop-opacity="1" />
      <stop offset="55%" stop-color="#0b101d" stop-opacity="1" />
      <stop offset="75%" stop-color="#0b101d" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#0b101d" stop-opacity="0" />
    </linearGradient>
    <radialGradient id="arrowMask" cx="205" cy="65" r="45" fx="205" fy="65" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0b101d" stop-opacity="1" />
      <stop offset="70%" stop-color="#0b101d" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#0b101d" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="${meta.width}" height="${meta.height}" fill="url(#leftFade)" />
  <circle cx="205" cy="65" r="45" fill="url(#arrowMask)" />
</svg>
`
  const cleanedBuffer = await sharp(inputBuffer)
    .composite([{ input: Buffer.from(maskSvg), top: 0, left: 0 }])
    .webp({ quality: 95 })
    .toBuffer()

  fs.writeFileSync(filePath, cleanedBuffer)
  console.log(`✓ ${name} cleaned.`)
}

async function main() {
  await cleanHeroIllustration()
  await cleanHeroBanner()
  await cleanDestinationCard(CARD_LEARNING, 'card_learning.webp')
  await cleanDestinationCard(CARD_GAME, 'card_game.webp')
  await cleanDestinationCard(CARD_COMMUNITY, 'card_community.webp')
  console.log('\nAll visual assets successfully cleaned of baked application UI!')
}

main().catch((err) => {
  console.error('Error cleaning assets:', err)
  process.exit(1)
})
