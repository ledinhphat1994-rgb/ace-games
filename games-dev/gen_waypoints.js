import sharp from 'sharp';

async function generatePerfectWaypoints() {
  const mapPath = 'games-dev/godot-project/assets/textures/island_map.jpg';

  // Measured texture coordinates of the road center:
  const texRoad = [
    [0, 430],    // W0: mép cầu gỗ ngoài cùng bên trái
    [50, 435],   // W1: giữa cầu gỗ
    [100, 440],  // W2: đầu bờ đảo bên trái
    [155, 450],  // W3: dưới chân tháp P1
    [205, 452],  // W4: tim đường trước bệ P2
    [255, 435],  // W5: bắt đầu cua uốn lên
    [305, 405],  // W6: sườn cua dốc lên
    [360, 385],  // W7: đỉnh khúc cua trên cùng (giữa P0 và P3)
    [415, 395],  // W8: bắt đầu vòng xuống sườn phải
    [470, 430],  // W9: dốc qua bệ P4
    [515, 480],  // W10: sườn dốc dẫn vào bệ P5
    [495, 535],  // W11: khúc cua dẫn vào đầu cầu đá
    [445, 575],  // W12: trên mặt cầu đá
    [435, 630],  // W13: ra khỏi cầu đá
    [455, 680],  // W14: khúc cua trước vách đá P7
    [510, 715],  // W15: cua vòng qua trước hang pha lê
    [530, 760],  // W16: xuống dốc vào thung lũng
    [475, 800],  // W17: dốc qua lưng cầu dưới
    [410, 830],  // W18: tim đường qua bệ P11
    [330, 850],  // W19: uốn nhẹ qua bệ P10
    [265, 885],  // W20: đáy khúc cua dưới bên trái
    [270, 935],  // W21: lòng đường dưới cùng
    [340, 965],  // W22: tim đường qua mũi chân đảo P13
    [430, 965],  // W23: chạy ngang qua bệ P12
    [525, 945],  // W24: dốc ra mép đảo phải
    [620, 915],  // W25: qua bệ P12 ra mép phải
    [710, 895],  // W26: mép đảo phải
    [768, 895]   // W27: thoát khỏi đảo
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

    svgElements.push(`<circle cx="${tx}" cy="${ty}" r="5" fill="#00ffcc" stroke="black" stroke-width="1.5"/>`);
    svgElements.push(`<text x="${tx+6}" y="${ty-5}" fill="yellow" font-size="11" font-weight="bold">${idx}</text>`);
  });

  const svg = `<svg width="768" height="1376">
    <path d="${pathD}" fill="none" stroke="#00ffcc" stroke-width="4"/>
    ${svgElements.join('\n')}
  </svg>`;

  await sharp(mapPath)
    .composite([{ input: Buffer.from(svg) }])
    .jpeg({ quality: 90 })
    .toFile('C:/Users/lepha/.gemini/antigravity-ide/brain/d12ca50c-2a82-4d6b-89e4-fd7d1d41a204/.tempmediaStorage/perfect_road_check.jpg');

  console.log('Saved perfect_road_check.jpg');
  console.log('Total world waypoints:', worldWaypoints.length);
  return worldWaypoints;
}
generatePerfectWaypoints().catch(console.error);
