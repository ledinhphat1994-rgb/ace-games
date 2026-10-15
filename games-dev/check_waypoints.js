import sharp from 'sharp';

async function checkWaypoints() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';

  // World coords in MainStylized.gd:
  const PATH_WAYPOINTS = [
    [0.0, 407.0],   // W0
    [65.0, 412.0],  // W1
    [131.0, 421.0], // W2
    [197.0, 431.0], // W3
    [272.0, 407.0], // W4
    [347.0, 360.0], // W5
    [431.0, 375.0], // W6
    [492.0, 412.0], // W7
    [502.0, 464.0], // W8
    [459.0, 501.0], // W9
    [413.0, 539.0], // W10
    [403.0, 590.0], // W11
    [417.0, 637.0], // W12
    [473.0, 647.0], // W13
    [506.0, 689.0], // W14
    [469.0, 740.0], // W15
    [389.0, 778.0], // W16
    [309.0, 797.0], // W17
    [248.0, 834.0], // W18
    [244.0, 881.0], // W19
    [309.0, 909.0], // W20
    [394.0, 914.0], // W21
    [488.0, 890.0], // W22
    [581.0, 858.0], // W23
    [666.0, 844.0], // W24
    [720.0, 844.0]  // W25
  ];

  // Convert World to Texture coords:
  // tex_x = 384.0 + (world_x - 360.0) / 0.938
  // tex_y = 688.0 + (world_y - 640.0) / 0.938

  let svgElements = [];
  let pathD = '';

  PATH_WAYPOINTS.forEach((pt, idx) => {
    const tx = Math.round(384.0 + (pt[0] - 360.0) / 0.938);
    const ty = Math.round(688.0 + (pt[1] - 640.0) / 0.938);
    if (idx === 0) pathD += `M ${tx} ${ty}`;
    else pathD += ` L ${tx} ${ty}`;

    svgElements.push(`<circle cx="${tx}" cy="${ty}" r="6" fill="yellow" stroke="black" stroke-width="2"/>`);
    svgElements.push(`<text x="${tx+8}" y="${ty-6}" fill="red" font-size="14" font-weight="bold">W${idx}</text>`);
  });

  const svg = `<svg width="768" height="1376">
    <path d="${pathD}" fill="none" stroke="red" stroke-width="5" stroke-dasharray="10,5"/>
    ${svgElements.join('\n')}
  </svg>`;

  await sharp(mapPath)
    .composite([{ input: Buffer.from(svg) }])
    .jpeg({ quality: 90 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/waypoints_on_texture.jpg');

  console.log('Saved waypoints_on_texture.jpg');
}
checkWaypoints().catch(console.error);
