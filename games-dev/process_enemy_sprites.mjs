import sharp from 'sharp'

async function removeWhiteBackground(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Data is RGBA buffer
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // If pixel is near pure white (background)
    if (r > 245 && g > 245 && b > 245) {
      data[i + 3] = 0 // Transparent
    } else if (r > 220 && g > 220 && b > 220) {
      // Smooth edge antialiasing
      const alpha = Math.min(255, Math.max(0, 255 - Math.round(((r + g + b) / 3 - 220) * 7.2)))
      data[i + 3] = Math.min(data[i + 3], alpha)
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .png({ quality: 100 })
  .toFile(outputPath)

  console.log('Saved transparent sprite:', outputPath)
}

const swarmInput = 'C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/swarm_crawler_sprite_1791847925275.jpg'
const shieldInput = 'C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/shield_droid_sprite_1791847943638.jpg'
const wraithInput = 'C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/ethereal_wraith_sprite_1791847961751.jpg'

await removeWhiteBackground(swarmInput, 'games-dev/godot-project/assets/sprites/enemy_swarm_crawler.png')
await removeWhiteBackground(shieldInput, 'games-dev/godot-project/assets/sprites/enemy_shield_droid.png')
await removeWhiteBackground(wraithInput, 'games-dev/godot-project/assets/sprites/enemy_ethereal_wraith.png')
console.log('All 3 enemy sprites converted successfully!')
