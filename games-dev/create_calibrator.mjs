import fs from 'fs';
import path from 'path';

// Let's create an HTML visual calibration page to see island_map.jpg with a grid and clickable coordinates!
const html = `<!DOCTYPE html>
<html>
<head>
<title>Pad Calibrator</title>
<style>
  body { margin: 0; background: #111; color: #fff; font-family: sans-serif; display: flex; }
  #container { position: relative; }
  img { display: block; width: 768px; height: 1376px; }
  canvas { position: absolute; top: 0; left: 0; pointer-events: none; }
  #info { padding: 20px; width: 400px; font-size: 14px; }
  pre { background: #222; padding: 10px; border-radius: 6px; }
</style>
</head>
<body>
<div id="container">
  <img id="map" src="/games-dev/godot-project/assets/textures/island_map.jpg">
  <canvas id="cv" width="768" height="1376"></canvas>
</div>
<div id="info">
  <h3>Click on the center of each of the 14 pads in order:</h3>
  <ol id="padList">
    <li>Pad 0 (Đỉnh trên cùng - giữa rừng)</li>
    <li>Pad 1 (Góc trên bên trái)</li>
    <li>Pad 2 (Bên trái khúc cua chữ U)</li>
    <li>Pad 3 (Chính giữa đáy khúc cua chữ U)</li>
    <li>Pad 4 (Góc trên bên phải)</li>
    <li>Pad 5 (Gờ đồi bên phải)</li>
    <li>Pad 6 (Sườn dốc bên phải)</li>
    <li>Pad 7 (Trước cửa hang pha lê xanh)</li>
    <li>Pad 8 (Gần cối xay gió bên trái)</li>
    <li>Pad 9 (Đoạn cua dưới bên trái)</li>
    <li>Pad 10 (Đoạn cua dưới ở giữa)</li>
    <li>Pad 11 (Đoạn cua dưới bên phải)</li>
    <li>Pad 12 (Góc dưới cùng bên phải)</li>
    <li>Pad 13 (Mũi đá dưới cùng)</li>
  </ol>
  <button id="btnClear" onclick="clearPads()">Clear & Redo</button>
  <pre id="output">Coordinates will appear here...</pre>
</div>
<script>
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const img = document.getElementById('map');
const pads = [];

img.onclick = (e) => {
  const rect = img.getBoundingClientRect();
  const x = Math.round((e.clientX - rect.left) * (768 / rect.width));
  const y = Math.round((e.clientY - rect.top) * (1376 / rect.height));
  pads.push({x, y});
  draw();
};

function clearPads() {
  pads.length = 0;
  draw();
}

function draw() {
  ctx.clearRect(0, 0, 768, 1376);
  pads.forEach((p, idx) => {
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('P' + idx + ' (' + p.x + ',' + p.y + ')', p.x + 28, p.y + 6);
  });

  const out = pads.map((p, idx) => {
    // Convert to game world coords:
    // x_world = 360 + (p.x - 384) * 0.9375
    // y_world = 640 + (p.y - 688) * 0.9375
    const xw = Math.round(360 + (p.x - 384) * 0.9375);
    const yw = Math.round(640 + (p.y - 688) * 0.9375);
    return 'Vector2(' + xw + '.0, ' + yw + '.0), // Pad ' + idx + ' (tex: ' + p.x + ',' + p.y + ')';
  }).join('\\n');
  document.getElementById('output').textContent = out;
}
</script>
</body>
</html>`;

fs.writeFileSync('public/calibrator.html', html);
console.log('Calibrator written to public/calibrator.html');
