import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import QRCode from 'qrcode'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3005

const APP_PUBLIC_GODOT = path.resolve(__dirname, '../../public/games/godot')
const PREVIEW_PUBLIC = path.resolve(__dirname, 'public')
const STATIC_DIR = fs.existsSync(APP_PUBLIC_GODOT) ? APP_PUBLIC_GODOT : PREVIEW_PUBLIC

// Tìm IP LAN cục bộ (Wi-Fi hoặc Ethernet) để hiển thị cho điện thoại thật kết nối
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          return iface.address
        }
      }
    }
  }
  return 'localhost'
}

const localIP = getLocalIP()
const localPhoneUrl = `http://${localIP}:${PORT}/`

// Tạo mã QR SVG ngoại tuyến (Offline 100%, không phụ thuộc mạng ngoài)
let qrSvgCached = ''
try {
  qrSvgCached = await QRCode.toString(localPhoneUrl, {
    type: 'svg',
    width: 160,
    margin: 1,
    color: {
      dark: '#0369a1',
      light: '#ffffff'
    }
  })
} catch (e) {
  qrSvgCached = `<div style="padding: 1rem; color:#ef4444; font-size:12px;">Không thể tạo QR</div>`
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.pck': 'application/octet-stream',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.css': 'text/css; charset=utf-8',
}

function renderMobileSimulatorHTML(gameUrl, phoneUrl, qrSvg) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ace Games — Mobile Studio Simulator</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #020817;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 1.25rem 1.5rem;
      overflow-x: hidden;
    }

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 1100px;
      margin-bottom: 1.25rem;
      padding: 0.75rem 1.25rem;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 1rem;
      backdrop-filter: blur(12px);
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 800;
      font-size: 1.05rem;
      color: #38bdf8;
    }

    .controls-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .group-label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-right: 0.2rem;
    }

    .btn {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      padding: 0.45rem 0.85rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      text-decoration: none;
    }
    .btn:hover, .btn.active {
      background: #0284c7;
      color: #fff;
      border-color: #38bdf8;
    }

    .main-workspace {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2.5rem;
      width: 100%;
      max-width: 1200px;
      flex: 1;
    }

    /* Khung điện thoại siêu thực */
    .phone-container {
      position: relative;
      width: 390px;
      height: 800px;
      background: #000;
      border-radius: 48px;
      box-shadow: 0 0 0 10px #1e293b, 0 0 0 12px #334155, 0 25px 60px rgba(0,0,0,0.85);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: width 0.25s ease, height 0.25s ease;
      flex-shrink: 0;
    }

    /* Kích thước phóng to / thu nhỏ linh hoạt */
    .phone-container.zoom-large {
      width: 440px;
      height: 900px;
      border-radius: 52px;
    }

    .phone-container.zoom-xlarge {
      width: 520px;
      height: 1060px;
      border-radius: 56px;
    }

    .phone-container.zoom-fit {
      height: calc(100vh - 120px);
      width: calc((100vh - 120px) * (720 / 1280));
      max-width: 600px;
      border-radius: 44px;
    }

    /* Chế độ nằm ngang (Landscape) */
    .phone-container.landscape {
      width: 800px;
      height: 390px;
      border-radius: 40px;
    }

    .phone-container.landscape.zoom-large {
      width: 900px;
      height: 440px;
    }

    .phone-container.landscape.zoom-xlarge {
      width: 1060px;
      height: 520px;
    }

    .phone-container.landscape.zoom-fit {
      width: calc((100vh - 120px) * (1280 / 720));
      height: calc(100vh - 120px);
      max-width: 1000px;
    }

    /* Dynamic Island / Notch */
    .phone-notch {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 110px;
      height: 26px;
      background: #000;
      border-radius: 20px;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.8);
      pointer-events: none;
    }
    .phone-camera {
      width: 10px;
      height: 10px;
      background: #0f172a;
      border-radius: 50%;
      border: 1px solid #1e293b;
    }

    .phone-screen {
      width: 100%;
      height: 100%;
      border: none;
      background: #020c24;
      z-index: 10;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }

    /* Thanh chỉ báo cảm ứng dưới đáy */
    .home-indicator {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 4px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 2px;
      z-index: 20;
      pointer-events: none;
    }

    /* Bảng thông tin quét điện thoại thật */
    .side-panel {
      max-width: 360px;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .info-card {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(56, 189, 248, 0.18);
      padding: 1.25rem;
      border-radius: 1rem;
    }

    .info-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .info-desc {
      font-size: 0.8rem;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 0.75rem;
    }

    .ip-box {
      background: #0f172a;
      border: 1px dashed rgba(56, 189, 248, 0.3);
      padding: 0.6rem 0.8rem;
      border-radius: 0.5rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #a5f3fc;
      word-break: break-all;
    }

    .qr-container {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      padding: 0.75rem;
      border-radius: 0.75rem;
      margin-top: 0.75rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .qr-container svg {
      width: 160px;
      height: 160px;
      display: block;
    }

    .badge-tip {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.2rem 0.5rem;
      border-radius: 0.35rem;
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body>

  <div class="top-bar">
    <div class="brand">
      <span>🎮</span> ACE GAMES STUDIO
    </div>

    <!-- Hướng màn hình -->
    <div class="controls-group">
      <span class="group-label">Góc xoay:</span>
      <button id="btn-portrait" class="btn active" onclick="setOrientation('portrait')">
        📱 Dọc
      </button>
      <button id="btn-landscape" class="btn" onclick="setOrientation('landscape')">
        🔄 Ngang
      </button>
    </div>

    <!-- Phóng to trên PC -->
    <div class="controls-group">
      <span class="group-label">Độ lớn:</span>
      <button id="zoom-std" class="btn zoom-btn active" onclick="setZoom('standard', this)">
        390px
      </button>
      <button id="zoom-lg" class="btn zoom-btn" onclick="setZoom('large', this)">
        440px
      </button>
      <button id="zoom-xlg" class="btn zoom-btn" onclick="setZoom('xlarge', this)">
        520px
      </button>
      <button id="zoom-fit" class="btn zoom-btn" onclick="setZoom('fit', this)">
        🖥️ Vừa màn hình PC
      </button>
    </div>

    <!-- Nút điều khiển -->
    <div class="controls-group">
      <button class="btn" onclick="reloadFrame()">
        ⚡ Tải lại (F5)
      </button>
      <a href="/raw" class="btn" target="_blank" title="Mở toàn màn hình không có khung vỏ điện thoại">
        ⛶ Toàn màn hình
      </a>
    </div>
  </div>

  <div class="main-workspace">
    <!-- Khung điện thoại ảo -->
    <div id="phone" class="phone-container">
      <div class="phone-notch">
        <div class="phone-camera"></div>
      </div>
      <iframe id="game-frame" class="phone-screen" src="/raw" allow="autoplay; accelerometer; gyroscope"></iframe>
      <div class="home-indicator"></div>
    </div>

    <!-- Thông tin kết nối điện thoại thật -->
    <div class="side-panel">
      <div class="info-card">
        <div class="badge-tip">ĐIỆN THOẠI THẬT CỰC NÉT</div>
        <div class="info-title">
          <span>📶</span> Quét mã mở trên điện thoại
        </div>
        <div class="info-desc">
          Kết nối cùng Wi-Fi và quét mã QR để trải nghiệm độ phân giải Retina nguyên bản và <b>rung Haptics thật</b>:
        </div>
        <div class="ip-box">${phoneUrl}</div>
        <div class="qr-container">
          ${qrSvg}
        </div>
      </div>

      <div class="info-card">
        <div class="info-title">
          <span>💡</span> Mẹo xem chữ siêu nét trên PC
        </div>
        <div class="info-desc">
          • Bấm nút <b>🖥️ Vừa màn hình PC</b> hoặc <b>520px</b> ở thanh trên để khung điện thoại phóng to to rõ ràng.<br><br>
          • Bấm nút <b>⛶ Toàn màn hình</b> để xem giao diện với độ nét 100% gốc.<br><br>
          • Mỗi lần bấm <b>Ctrl + S</b> trong Godot, màn hình sẽ tự động cập nhật!
        </div>
      </div>
    </div>
  </div>

  <script>
    function setOrientation(mode) {
      const phone = document.getElementById('phone');
      const btnP = document.getElementById('btn-portrait');
      const btnL = document.getElementById('btn-landscape');
      if (mode === 'landscape') {
        phone.classList.add('landscape');
        btnL.classList.add('active');
        btnP.classList.remove('active');
      } else {
        phone.classList.remove('landscape');
        btnP.classList.add('active');
        btnL.classList.remove('active');
      }
      setTimeout(reloadFrame, 150);
    }

    function setZoom(mode, el) {
      const phone = document.getElementById('phone');
      phone.classList.remove('zoom-large', 'zoom-xlarge', 'zoom-fit');
      document.querySelectorAll('.zoom-btn').forEach(b => b.classList.remove('active'));
      if (mode === 'large') phone.classList.add('zoom-large');
      if (mode === 'xlarge') phone.classList.add('zoom-xlarge');
      if (mode === 'fit') phone.classList.add('zoom-fit');
      if (el) el.classList.add('active');
      setTimeout(reloadFrame, 150);
    }

    function reloadFrame() {
      const iframe = document.getElementById('game-frame');
      iframe.src = '/raw?t=' + Date.now();
    }
  </script>
</body>
</html>`
}

const server = http.createServer((req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  res.setHeader('Access-Control-Allow-Origin', '*')

  const urlObj = new URL(req.url, 'http://localhost')
  let pathname = decodeURIComponent(urlObj.pathname)
  const userAgent = req.headers['user-agent'] || ''
  const isMobileClient = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

  // Nếu yêu cầu /simulator hoặc ?simulator -> hiển thị Khung giả lập Mobile Simulator
  if (pathname === '/simulator' || urlObj.searchParams.has('simulator')) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(renderMobileSimulatorHTML('/raw', localPhoneUrl, qrSvgCached))
    return
  }

  // Mặc định tại / hoặc /raw -> phục vụ trực tiếp Web Game toàn màn hình (1376x768 landscape)
  if (pathname === '/' || pathname === '/raw' || pathname === '/raw/' || pathname === '/raw/index.html' || pathname === '/index.html') {
    const filePath = path.join(STATIC_DIR, 'index.html')
    if (fs.existsSync(filePath)) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      fs.createReadStream(filePath).pipe(res)
      return
    }
  }


  // Chuẩn hóa đường dẫn: Nếu browser yêu cầu file bên dưới /raw/ -> chuyển về file gốc trong STATIC_DIR
  if (pathname.startsWith('/raw/')) {
    pathname = pathname.substring(4)
  }

  // Phục vụ các file tĩnh (.wasm, .pck, .js, .png, etc.)
  const filePath = path.join(STATIC_DIR, pathname)

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`
      <html>
        <body style="font-family:sans-serif; background:#020c24; color:#38bdf8; padding:2rem; text-align:center;">
          <h2>🎮 Ace Games Preview</h2>
          <p>Chưa tìm thấy file: <code>${pathname}</code></p>
          <p style="color:#94a3b8; font-size:14px;">Hãy lưu file trong Godot hoặc chạy <code>npm run game:export</code> nhé!</p>
        </body>
      </html>
    `)
    return
  }

  const stat = fs.statSync(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  // Header tăng tốc độ tải & hỗ trợ tua nhanh byte range cho WASM / PCK
  res.setHeader('Accept-Ranges', 'bytes')

  // Cache linh hoạt cho static images, không cache .wasm hay .pck để hot reload tức thì
  if (ext === '.png' || ext === '.jpg' || ext === '.woff2') {
    res.setHeader('Cache-Control', 'public, max-age=120')
  } else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  }

  const range = req.headers.range
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
    const chunksize = (end - start) + 1

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    })
    fs.createReadStream(filePath, { start, end, highWaterMark: 1024 * 1024 }).pipe(res)
    return
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
  })
  fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 }).pipe(res)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`)
  console.log(`🎮 ACE GAMES — MOBILE GAME STUDIO PREVIEW`)
  console.log(`👉 Trình giả lập Mobile trên PC: http://localhost:${PORT}`)
  console.log(`👉 Chơi trên điện thoại thật (cùng Wi-Fi): ${localPhoneUrl}`)
  console.log(`📁 Thư mục phục vụ: ${STATIC_DIR}`)
  console.log(`======================================================\n`)
})
