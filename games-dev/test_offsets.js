import sharp from 'sharp';

async function testOffsets() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';
  const plasmaPath = 'games-dev/godot-project/assets/sprites/tower_plasma_cannon.png';
  const gatlingPath = 'games-dev/godot-project/assets/sprites/tower_gatling_gun.png';
  const teslaPath = 'games-dev/godot-project/assets/sprites/tower_tesla_coil.png';

  // Map is 768x1376. In Godot: scale = 0.938 at (360, 640).
  // Pad 1 world: (229, 370) -> tex: (244, 400)
  // Pad 3 world: (345, 404) -> tex: (368, 436)
  // Pad 4 world: (484, 375) -> tex: (516, 405)

  // In Godot, tower.scale = 1.0 (world).
  // In map texture space, tower size is multiplied by (1 / 0.938) = 1.0661.
  // Plasma: base_scale = 0.175 -> tex_scale = 0.175 * 1.0661 = 0.1866
  // Gatling: base_scale = 0.165 -> tex_scale = 0.165 * 1.0661 = 0.1759
  // Tesla: base_scale = 0.165 -> tex_scale = 0.165 * 1.0661 = 0.1759

  // Let's test 3 different offsets for each tower:
  // For Plasma: try offset.y = -60, -90, -120
  // For Gatling: try offset.y = -60, -85, -110
  // For Tesla: try offset.y = -100, -140, -180

  const testConfigs = [
    { label: 'Offset_A', plasma_off_y: -60, gatling_off_y: -60, tesla_off_y: -100 },
    { label: 'Offset_B', plasma_off_y: -85, gatling_off_y: -80, tesla_off_y: -140 },
    { label: 'Offset_C', plasma_off_y: -110, gatling_off_y: -105, tesla_off_y: -180 },
  ];

  for (const cfg of testConfigs) {
    const plasmaW = Math.round(520 * 0.1866);
    const plasmaH = Math.round(490 * 0.1866);
    const plasmaBuf = await sharp(plasmaPath).resize(plasmaW, plasmaH).toBuffer();

    const gatlingW = Math.round(500 * 0.1759);
    const gatlingH = Math.round(480 * 0.1759);
    const gatlingBuf = await sharp(gatlingPath).resize(gatlingW, gatlingH).toBuffer();

    const teslaW = Math.round(360 * 0.1759);
    const teslaH = Math.round(670 * 0.1759);
    const teslaBuf = await sharp(teslaPath).resize(teslaW, teslaH).toBuffer();

    // Godot Sprite2D placement:
    // With centered=true and offset = (0, off_y):
    // In texture coords of tower: origin is (w/2, h/2 - off_y)
    // Resized origin:
    // Plasma origin in resized:
    // x = plasmaW / 2 = 97 / 2 = 48.5
    // y = (245 - cfg.plasma_off_y) * 0.1866
    const pOriginY = (245 - cfg.plasma_off_y) * 0.1866;
    const pLeft = Math.round(244 - 48.5);
    const pTop = Math.round(400 - pOriginY);

    const gOriginY = (240 - cfg.gatling_off_y) * 0.1759;
    const gLeft = Math.round(368 - gatlingW / 2);
    const gTop = Math.round(436 - gOriginY);

    const tOriginY = (335 - cfg.tesla_off_y) * 0.1759;
    const tLeft = Math.round(516 - teslaW / 2);
    const tTop = Math.round(405 - tOriginY);

    await sharp(mapPath)
      .composite([
        { input: plasmaBuf, left: pLeft, top: pTop },
        { input: gatlingBuf, left: gLeft, top: gTop },
        { input: teslaBuf, left: tLeft, top: tTop },
      ])
      .extract({ left: 150, top: 280, width: 450, height: 260 })
      .jpeg({ quality: 95 })
      .toFile(`C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/compare_${cfg.label}.jpg`);

    console.log(`Saved compare_${cfg.label}.jpg`);
  }
}
testOffsets().catch(console.error);
