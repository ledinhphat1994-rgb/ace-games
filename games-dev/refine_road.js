import sharp from 'sharp';

async function refineWaypoints() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';

  // Road curvature fine-tuning:
  const texRoad = [
    [0, 430],    // 0: mép cầu gỗ ngoài cùng bên trái
    [50, 435],   // 1: giữa cầu gỗ
    [100, 440],  // 2: đầu bờ đảo bên trái
    [155, 450],  // 3: dưới chân tháp P1
    [205, 452],  // 4: tim đường trước bệ P2
    [255, 435],  // 5: bắt đầu cua uốn lên
    [305, 405],  // 6: sườn cua dốc lên
    [360, 385],  // 7: đỉnh khúc cua trên cùng (giữa P0 và P3)
    [415, 395],  // 8: vòng xuống sườn phải
    [470, 430],  // 9: dốc qua bệ P4
    [515, 480],  // 10: sườn dốc dẫn vào bệ P5
    [485, 530],  // 11: khúc cua dẫn vào đầu cầu đá
    [440, 570],  // 12: trên mặt cầu đá
    [430, 625],  // 13: cuối cầu đá
    [445, 665],  // 14: ra khỏi cầu đá, bắt đầu uốn theo đường cát
    [485, 685],  // 15: lòng đường cát vòng qua trước bệ P7
    [530, 715],  // 16: ôm sát khúc cua trước hang pha lê
    [540, 750],  // 17: đỉnh cua phải trước vách đá
    [505, 780],  // 18: xuống dốc vào lòng thung lũng
    [445, 805],  // 19: tim đường dốc dưới vòm đá
    [375, 835],  // 20: tim đường ngang qua bệ P11
    [300, 860],  // 21: uốn nhẹ qua bệ P10
    [255, 895],  // 22: lòng khúc cua dưới bên trái
    [260, 945],  // 23: đáy khúc cua dưới trái
    [320, 975],  // 24: bắt đầu chạy sang phải
    [400, 980],  // 25: tim đường ngang dưới P13
    [490, 965],  // 26: lòng đường qua P12
    [580, 935],  // 27: dốc nhẹ sang phải
    [670, 910],  // 28: dẫn ra mép đảo phải
    [768, 905]   // 29: thoát khỏi đảo
  ];

  let svgElements = [];
  let pathD = '';
  const worldWaypoints = [];

  texRoad.forEach((pt, idx) => {
    const tx = pt[0];
    const ty = pt[1];
    const wx = parseFloat((360.0 + (tx - 384.0) * 0.938).toFixed(1));
    const wy = parseFloat((640.0 + (ty - 688.0) * 0.938).toFixed(1));
    worldWaypoints.push([wx, wy]);

    if (idx === 0) pathD += `M ${tx} ${ty}`;
    else pathD += ` L ${tx} ${ty}`;

    svgElements.push(`<circle cx="${tx}" cy="${ty}" r="4" fill="#00ffcc" stroke="black" stroke-width="1"/>`);
    svgElements.push(`<text x="${tx+5}" y="${ty-4}" fill="yellow" font-size="10" font-weight="bold">${idx}</text>`);
  });

  const svg = `<svg width="768" height="1376">
    <path d="${pathD}" fill="none" stroke="#00ffcc" stroke-width="4"/>
    ${svgElements.join('\n')}
  </svg>`;

  await sharp(mapPath)
    .composite([{ input: Buffer.from(svg) }])
    .jpeg({ quality: 90 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/refined_road.jpg');

  console.log('Saved refined_road.jpg');
  console.log(JSON.stringify(worldWaypoints));
}
refineWaypoints().catch(console.error);
