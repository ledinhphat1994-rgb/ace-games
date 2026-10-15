import sharp from 'sharp';

async function verifyRoadWaypoints() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';

  // These are the waypoints from MainStylized.gd:
  const waypoints = [
    { w: [0.0, 398.0], tex: [0, 430] },
    { w: [46.7, 402.7], tex: [50, 435] },
    { w: [93.6, 407.4], tex: [100, 440] },
    { w: [145.2, 416.8], tex: [155, 450] },
    { w: [192.1, 418.6], tex: [205, 452] },
    { w: [239.0, 402.7], tex: [255, 435] },
    { w: [285.9, 374.5], tex: [305, 405] },
    { w: [337.5, 355.8], tex: [360, 385] },
    { w: [389.1, 365.2], tex: [415, 395] },
    { w: [440.7, 398.0], tex: [470, 430] },
    { w: [482.9, 444.9], tex: [515, 480] },
    { w: [454.7, 491.8], tex: [485, 530] },
    { w: [412.5, 529.3], tex: [440, 570] },
    { w: [403.1, 580.9], tex: [430, 625] },
    { w: [417.2, 618.4], tex: [445, 665] },
    { w: [454.7, 637.2], tex: [485, 685] },
    { w: [496.9, 665.3], tex: [530, 715] },
    { w: [506.3, 698.2], tex: [540, 750] },
    { w: [473.5, 726.3], tex: [505, 780] },
    { w: [417.2, 749.7], tex: [445, 805] },
    { w: [351.6, 777.9], tex: [375, 835] },
    { w: [281.2, 801.3], tex: [300, 860] },
    { w: [239.0, 834.2], tex: [255, 895] },
    { w: [243.7, 881.1], tex: [260, 945] },
    { w: [300.0, 909.2], tex: [320, 975] },
    { w: [375.0, 913.9], tex: [400, 980] },
    { w: [459.4, 899.8], tex: [490, 965] },
    { w: [543.8, 871.7], tex: [580, 935] },
    { w: [628.3, 848.2], tex: [670, 910] },
    { w: [720.2, 843.5], tex: [768, 905] }
  ];

  let svgElements = [];
  // Draw path polyline
  let pointsStr = waypoints.map(wp => `${wp.tex[0]},${wp.tex[1]}`).join(' ');
  svgElements.push(`<polyline points="${pointsStr}" fill="none" stroke="red" stroke-width="4" stroke-dasharray="6,4"/>`);

  waypoints.forEach((wp, idx) => {
    svgElements.push(`<circle cx="${wp.tex[0]}" cy="${wp.tex[1]}" r="5" fill="yellow" stroke="black" stroke-width="1.5"/>`);
    if (idx % 2 === 0) {
      svgElements.push(`<text x="${wp.tex[0] + 6}" y="${wp.tex[1] - 4}" fill="yellow" font-size="12" font-weight="bold">${idx}</text>`);
    }
  });

  const svg = Buffer.from(`<svg width="768" height="1376">${svgElements.join('\n')}</svg>`);

  await sharp(mapPath)
    .composite([{ input: svg }])
    .jpeg({ quality: 90 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/road_waypoints_verified.jpg');

  console.log('Saved road_waypoints_verified.jpg');
}

verifyRoadWaypoints().catch(console.error);
