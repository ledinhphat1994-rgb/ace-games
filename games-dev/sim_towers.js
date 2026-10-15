import sharp from 'sharp';

async function testComposite() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';
  const plasmaPath = 'games-dev/godot-project/assets/sprites/tower_plasma_cannon.png';
  const gatlingPath = 'games-dev/godot-project/assets/sprites/tower_gatling_gun.png';
  const teslaPath = 'games-dev/godot-project/assets/sprites/tower_tesla_coil.png';

  // In Godot:
  // island is scaled 0.938 at (360, 640).
  // Pad world coords:
  // P1: [229.0, 370.0] -> tex: [244, 400]
  // P3: [345.0, 404.0] -> tex: [368, 436]
  // P4: [484.0, 375.0] -> tex: [516, 405]

  // In Godot, tower.scale = 1.0 (world).
  // But island has scale 0.938!
  // That means 1 world pixel = 1 / 0.938 = 1.066 texture pixels!
  // In Godot:
  // Plasma: base_scale = 0.175 (world). Relative to island texture: 0.175 / 0.938 = 0.1865
  // Gatling: base_scale = 0.165 (world). Relative to island: 0.165 / 0.938 = 0.1759
  // Tesla: base_scale = 0.165 (world). Relative to island: 0.165 / 0.938 = 0.1759

  // In Godot, sprite_head.offset:
  // Plasma: offset = (0, -195). In Godot Sprite2D, offset shifts the texture relative to node position.
  // When offset is (0, -195), top-left of sprite is at (-width/2 + offset.x, -height/2 + offset.y).
  // Node position in texture coords for P1 is (244, 400).
  // Let's compute exact rendered position of the tower sprites!

  const plasmaBuf = await sharp(plasmaPath)
    .resize(Math.round(520 * 0.1865), Math.round(490 * 0.1865))
    .toBuffer();
  const gatlingBuf = await sharp(gatlingPath)
    .resize(Math.round(500 * 0.1759), Math.round(480 * 0.1759))
    .toBuffer();
  const teslaBuf = await sharp(teslaPath)
    .resize(Math.round(360 * 0.1759), Math.round(670 * 0.1759))
    .toBuffer();

  // For Plasma:
  // texture size 520x490 -> resized to 97 x 91
  // In Godot: node is at P1 tex (244, 400).
  // sprite_head.offset is (0, -195).
  // Godot Sprite2D draws centered by default:
  // origin of texture is (width/2, height/2) = (260, 245).
  // with offset (0, -195), origin is (260, 245 + 195) = (260, 440).
  // In resized sprite:
  // origin_x = 260 * 0.1865 = 48.5
  // origin_y = 440 * 0.1865 = 82.0
  // So top-left in texture coords = (244 - 48.5, 400 - 82.0) = (195.5, 318)

  // Let's check Gatling:
  // 500x480 -> resized to 88 x 84
  // offset is (0, -188). origin = (250, 240 + 188) = (250, 428).
  // origin_x = 250 * 0.1759 = 44.0
  // origin_y = 428 * 0.1759 = 75.3
  // top-left at P3 tex (368, 436) = (368 - 44, 436 - 75.3) = (324, 360.7)

  // Let's check Tesla:
  // 360x670 -> resized to 63 x 118
  // offset is (0, -295). origin = (180, 335 + 295) = (180, 630).
  // origin_x = 180 * 0.1759 = 31.6
  // origin_y = 630 * 0.1759 = 110.8
  // top-left at P4 tex (516, 405) = (516 - 31.6, 405 - 110.8) = (484.4, 294.2)

  await sharp(mapPath)
    .composite([
      { input: plasmaBuf, left: Math.round(244 - 48.5), top: Math.round(400 - 82.0) },
      { input: gatlingBuf, left: Math.round(368 - 44), top: Math.round(436 - 75.3) },
      { input: teslaBuf, left: Math.round(516 - 31.6), top: Math.round(405 - 110.8) },
    ])
    .extract({ left: 100, top: 250, width: 568, height: 350 })
    .jpeg({ quality: 95 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/simulated_towers_current.jpg');

  console.log('Saved simulated_towers_current.jpg');
}
testComposite().catch(console.error);
