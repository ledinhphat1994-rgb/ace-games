import sharp from 'sharp';

async function fineTuneAllPads() {
  // Let's inspect the island map directly to get absolute texture coords of all 14 pads!
  // Map size: 768 x 1376.
  // IslandSprite is at position (360, 640), scale 0.938.
  // Formula:
  // world_x = 360.0 + (tex_x - 384.0) * 0.938
  // world_y = 640.0 + (tex_y - 688.0) * 0.938

  // In pad1_fine_measure.png, we saw Pad 1 disc center clearly on the map.
  // Let's find the exact pixel center of all pads in island_map.jpg!
  console.log('Calibrating Pad 1 and Pad 4...');
}
fineTuneAllPads().catch(console.error);
