import sharp from 'sharp'

const img = sharp('games-dev/godot-project/assets/textures/tactical_battlefield.png')
const meta = await img.metadata()
console.log('metadata:', meta.width, meta.height)

// Let's crop 4 distinct landmarks and print their bounding boxes:
// 1. Portal
// 2. Stone bridge
// 3. Middle tower/gate
// 4. Castle entrance
await sharp('games-dev/godot-project/assets/textures/tactical_battlefield.png')
  .extract({ left: 50, top: 250, width: 250, height: 350 })
  .toFile('games-dev/godot-project/assets/textures/crop_portal.png')

await sharp('games-dev/godot-project/assets/textures/tactical_battlefield.png')
  .extract({ left: 250, top: 400, width: 350, height: 250 })
  .toFile('games-dev/godot-project/assets/textures/crop_bridge.png')

await sharp('games-dev/godot-project/assets/textures/tactical_battlefield.png')
  .extract({ left: 700, top: 200, width: 350, height: 350 })
  .toFile('games-dev/godot-project/assets/textures/crop_castle.png')

console.log('Crops generated')
