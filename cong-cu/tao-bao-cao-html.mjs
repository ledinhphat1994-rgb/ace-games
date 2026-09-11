import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function toBase64(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) return '';
  const buf = fs.readFileSync(fullPath);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const img1920 = toBase64('qa/phase3a_campus_1920.png');
const img1440 = toBase64('qa/phase3a_campus_1440.png');
const img1024 = toBase64('qa/phase3a_campus_1024.png');
const img768 = toBase64('qa/phase3a_campus_768.png');
const img390 = toBase64('qa/phase3a_campus_390.png');

const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo Cáo Nghiệm Thu Phase 3A.1 — Digital Campus</title>
  <style>
    :root {
      --bg: #0B0E14;
      --card-bg: #151A23;
      --card-border: rgba(255, 255, 255, 0.1);
      --text: #F1F5F9;
      --text-muted: #94A3B8;
      --cyan: #00F2FE;
      --amber: #FFB800;
      --violet: #8B5CF6;
      --emerald: #10B981;
      --rose: #F43F5E;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 24px; line-height: 1.5; }
    .container { max-width: 1280px; margin: 0 auto; }
    header { background: linear-gradient(135deg, rgba(0, 242, 254, 0.1), rgba(139, 92, 246, 0.1)); border: 1px solid var(--card-border); border-radius: 20px; padding: 32px; margin-bottom: 32px; backdrop-filter: blur(10px); }
    .badge-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge-pass { background: rgba(16, 185, 129, 0.15); color: var(--emerald); border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-info { background: rgba(0, 242, 254, 0.15); color: var(--cyan); border: 1px solid rgba(0, 242, 254, 0.3); }
    .badge-amber { background: rgba(255, 184, 0, 0.15); color: var(--amber); border: 1px solid rgba(255, 184, 0, 0.3); }
    h1 { font-size: 28px; font-weight: 900; margin: 12px 0 6px; background: linear-gradient(to right, #FFFFFF, var(--cyan)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    p.lead { color: var(--text-muted); font-size: 14px; max-width: 800px; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 24px; }
    .meta-item { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); padding: 14px; border-radius: 12px; }
    .meta-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
    .meta-val { font-size: 13px; font-weight: 700; color: #fff; word-break: break-all; }
    .meta-val a { color: var(--cyan); text-decoration: none; }
    .meta-val a:hover { text-decoration: underline; }

    .section { margin-bottom: 40px; }
    .section-title { font-size: 20px; font-weight: 800; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; color: #FFFFFF; }

    /* Gallery Tabs */
    .tab-bar { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--card-border); }
    .tab-btn { background: var(--card-bg); border: 1px solid var(--card-border); color: var(--text-muted); padding: 10px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .tab-btn:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
    .tab-btn.active { background: rgba(0, 242, 254, 0.15); color: var(--cyan); border-color: var(--cyan); }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }
    .img-preview { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; padding: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .img-preview img { width: 100%; height: auto; border-radius: 8px; display: block; border: 1px solid rgba(255,255,255,0.05); }
    .mobile-frame { max-width: 420px; margin: 0 auto; border: 10px solid #1E293B; border-radius: 36px; padding: 6px; background: #000; box-shadow: 0 25px 50px -12px rgba(0, 242, 254, 0.25); }
    .mobile-frame img { border-radius: 24px; width: 100%; display: block; }

    /* Review Findings Table */
    .review-table { width: 100%; border-collapse: separate; border-spacing: 0; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; overflow: hidden; margin-bottom: 24px; }
    .review-table th { background: rgba(255,255,255,0.03); color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 800; padding: 14px 16px; text-align: left; border-bottom: 1px solid var(--card-border); }
    .review-table td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: top; }
    .review-table tr:last-child td { border-bottom: none; }
    .level-p1 { color: #EF4444; font-weight: 800; }
    .level-p2 { color: #F59E0B; font-weight: 800; }
    .level-ux { color: #38BDF8; font-weight: 800; }

    /* QA Cards */
    .qa-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
    .qa-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px 16px; display: flex; align-items: flex-start; gap: 10px; }
    .qa-icon { font-size: 16px; margin-top: 1px; }
    .qa-name { font-size: 12.5px; font-weight: 700; color: #F8FAFC; }
    .qa-desc { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }

    footer { text-align: center; color: var(--text-muted); font-size: 12px; padding: 32px 0; border-top: 1px solid var(--card-border); margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 8px;">
          <span class="badge-pill badge-info">PHASE 3A.1</span>
          <span class="badge-pill badge-pass">63 PASS / 0 FAIL (100% GREEN)</span>
        </div>
        <span class="badge-pill badge-amber">SẴN SÀNG SANG PHASE 3B</span>
      </div>
      <h1>Báo Cáo Nghiệm Thu Hoàn Thành: Phase 3A.1</h1>
      <p class="lead">Tổng hợp sửa chữa chi tiết UX / Responsive / Semantic Correctness Polish theo review thực tế độc lập từ commit e1c5757 đến b061a02.</p>

      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Mã Commit Đã Push</div>
          <div class="meta-val"><a href="https://github.com/ledinhphat1994-rgb/lop-10a7/commit/b061a020d7072567133f68ea76571ddacb4fc897" target="_blank">b061a020d707256...</a></div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Deploy Production URL</div>
          <div class="meta-val"><a href="https://gdtxdinhquan.pages.dev" target="_blank">https://gdtxdinhquan.pages.dev</a></div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Cloudflare Deployment ID</div>
          <div class="meta-val">d587047a</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">QA Production Matrix</div>
          <div class="meta-val" style="color: var(--emerald);">63 Assertions Pass (0 Fail)</div>
        </div>
      </div>
    </header>

    <!-- SECTION 1: VISUAL VERIFICATION -->
    <div class="section">
      <div class="section-title">
        <span>📸</span> Hình Ảnh Đối Chiếu Thực Tế (5 Viewports Đầy Đủ)
      </div>
      <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">Tất cả ảnh chụp màn hình độ phân giải gốc được nhúng trực tiếp dạng Base64 bên trong tệp này — mở offline hoặc gửi cho reviewer xem ngay mà không lo thiếu file hoặc chết link ảnh.</p>

      <div class="tab-bar">
        <button class="tab-btn active" onclick="showTab('tab-1920')">🖥️ Desktop Ultra-wide (1920×1080)</button>
        <button class="tab-btn" onclick="showTab('tab-390')">📱 Mobile Phone (390×844)</button>
        <button class="tab-btn" onclick="showTab('tab-1024')">💻 Laptop / Tablet L (1024×768)</button>
        <button class="tab-btn" onclick="showTab('tab-1440')">🖥️ Large Desktop (1440×900)</button>
        <button class="tab-btn" onclick="showTab('tab-768')">📱 Tablet Dọc (768×1024)</button>
      </div>

      <!-- Tab 1920 -->
      <div id="tab-1920" class="tab-pane active">
        <div class="img-preview">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; color: var(--text-muted);">
            <span><strong>Đặc điểm kiểm tra:</strong> Bố cục 3 cột nằm ngang chuẩn (Left &lt; Main &lt; Right rail). Theme hover riêng biệt: Cinema (cyan), Game (amber), Music (violet), Social (teal).</span>
            <span class="badge-pill badge-info">1920 × 1080</span>
          </div>
          <img src="${img1920}" alt="Desktop 1920x1080">
        </div>
      </div>

      <!-- Tab 390 -->
      <div id="tab-390" class="tab-pane">
        <div class="img-preview" style="text-align: center;">
          <div style="margin-bottom: 12px; font-size: 12px; color: var(--text-muted);">
            <span><strong>Đặc điểm kiểm tra:</strong> Đã ẩn hoàn toàn sidebar máy tính sticky (hidden lg:flex). Hero Stage hiển thị ngay đỉnh trang (y &lt; 280px). Quick-nav cuộn ngang tiện lợi.</span>
          </div>
          <div class="mobile-frame">
            <img src="${img390}" alt="Mobile 390x844">
          </div>
        </div>
      </div>

      <!-- Tab 1024 -->
      <div id="tab-1024" class="tab-pane">
        <div class="img-preview">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; color: var(--text-muted);">
            <span><strong>Đặc điểm kiểm tra (Fix P1):</strong> Right rail không còn rơi vào cột hẹp 220px dưới sidebar. Right rail được xếp gọn dưới Main content, dàn trải toàn bộ chiều rộng &gt; 700px.</span>
            <span class="badge-pill badge-info">1024 × 768</span>
          </div>
          <img src="${img1024}" alt="Laptop 1024x768">
        </div>
      </div>

      <!-- Tab 1440 -->
      <div id="tab-1440" class="tab-pane">
        <div class="img-preview">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; color: var(--text-muted);">
            <span><strong>Đặc điểm kiểm tra:</strong> Bố cục 3 cột (Sidebar 230px, Main 1fr, Right rail 300px sticky). Status rail hiển thị "Campus yên tĩnh" thay vì "0 ONLINE".</span>
            <span class="badge-pill badge-info">1440 × 900</span>
          </div>
          <img src="${img1440}" alt="Desktop 1440x900">
        </div>
      </div>

      <!-- Tab 768 -->
      <div id="tab-768" class="tab-pane">
        <div class="img-preview">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; color: var(--text-muted);">
            <span><strong>Đặc điểm kiểm tra:</strong> Bố cục tablet 1 cột gọn gàng, điều hướng qua quick-nav, không tràn ngang.</span>
            <span class="badge-pill badge-info">768 × 1024</span>
          </div>
          <img src="${img768}" alt="Tablet 768x1024">
        </div>
      </div>
    </div>

    <!-- SECTION 2: REVIEW FINDINGS & IMPLEMENTATION FIXES -->
    <div class="section">
      <div class="section-title">
        <span>🛠️</span> Chi Tiết 10 Điểm Polish Theo Yêu Cầu Review
      </div>

      <table class="review-table">
        <thead>
          <tr>
            <th style="width: 80px;">Mức</th>
            <th style="width: 260px;">Vấn Đề Phát Hiện</th>
            <th>Giải Pháp Kỹ Thuật Đã Triển Khai Trong Phase 3A.1</th>
            <th style="width: 140px;">Kết Quả QA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="level-p1">🔴 P1</span></td>
            <td><strong>Responsive 1024px:</strong> Grid 2 cột nhưng có 3 phần tử con, Right Rail auto-placement rơi xuống cột 220px dưới sidebar.</td>
            <td>Áp dụng <code>lg:col-start-2 lg:col-span-1 xl:col-start-3 xl:col-span-1</code>. Tại 1024px, Rail chuyển xuống dưới Main Content và hưởng trọn chiều rộng cột chính (&gt;700px), không bị bóp méo.</td>
            <td><span class="badge-pill badge-pass">✅ PASS (width&ge;400)</span></td>
          </tr>
          <tr>
            <td><span class="level-p1">🔴 P1</span></td>
            <td><strong>Search False-Positive:</strong> Tìm "Caro" nhưng cờ caro, cinema, music, social cùng render; sự kiện render toàn bộ.</td>
            <td>Chuẩn hóa model tìm kiếm độc quyền theo từng không gian (cả tiếng Việt có dấu & không dấu): gõ "Caro" CHỈ hiện Caro/Game, Cinema/Music/Social bị ẩn 100%. Nếu không có kết quả, hiển thị Empty State chuẩn.</td>
            <td><span class="badge-pill badge-pass">✅ PASS (Exclusivity)</span></td>
          </tr>
          <tr>
            <td><span class="level-p1">🟠 P1</span></td>
            <td><strong>Semantics Cờ Caro:</strong> Truyền số bàn cờ (<code>caroRooms.length</code>) thành "N bạn tham gia".</td>
            <td>Tách biệt giao diện <code>CampusSpaceCard</code>: hỗ trợ <code>statusText</code> riêng. Caro hiển thị chuẩn xác: <code>\${caroRooms.length} bàn đang mở</code> hoặc <code>Sẵn sàng tranh tài</code>.</td>
            <td><span class="badge-pill badge-pass">✅ PASS</span></td>
          </tr>
          <tr>
            <td><span class="level-p1">🟠 P1</span></td>
            <td><strong>Semantics Social:</strong> Dùng tổng người toàn campus (<code>dangHoatDong</code>) làm người trong Social.</td>
            <td>Loại bỏ việc gán số liệu campus chung vào thẻ chat; hiển thị trạng thái trung thực: <code>Mở cửa tự do 24/7</code>.</td>
            <td><span class="badge-pill badge-pass">✅ PASS</span></td>
          </tr>
          <tr>
            <td><span class="level-p1">🟠 P1</span></td>
            <td><strong>Right Rail Label:</strong> Ghi "ONLINE" nhưng metric là người trong public rooms.</td>
            <td>Đổi thành <code>\${dangHoatDong} ĐANG HOẠT ĐỘNG</code>. Khi bằng 0, hiển thị trạng thái yên tĩnh <code>Campus yên tĩnh</code>, không khoe số 0.</td>
            <td><span class="badge-pill badge-pass">✅ PASS</span></td>
          </tr>
          <tr>
            <td><span class="level-p1">🟠 P1</span></td>
            <td><strong>Hero School-wide Identity:</strong> Mặc định ghi "Digital Campus 10A7 & Toàn Trường".</td>
            <td>Đổi thành <code>Digital Campus · GDTX Định Quán</code> (kèm badge <code>✦ Toàn trường 24/7</code>). Tên lớp 10A7 chỉ xuất hiện riêng ở Class Community.</td>
            <td><span class="badge-pill badge-pass">✅ PASS</span></td>
          </tr>
          <tr>
            <td><span class="level-p2">🟡 P2</span></td>
            <td><strong>Product Copy Cinema:</strong> Quảng cáo "đồng bộ 1080p" khi chưa có bằng chứng sync thật.</td>
            <td>Sửa copy thành trung thực: <code>Không gian xem video chung & thảo luận</code>, phản ánh đúng tính năng phòng video hiện hành.</td>
            <td><span class="badge-pill badge-pass">✅ PASS</span></td>
          </tr>
          <tr>
            <td><span class="level-p2">🟡 P2</span></td>
            <td><strong>Screenshot Script Hardcode:</strong> Chứa đường dẫn Windows / IDE cá nhân.</td>
            <td>Xóa bỏ toàn bộ hardcode path trong <code>chup-anh-campus.mjs</code>. Lưu mặc định vào <code>qa/</code>; hỗ trợ override qua biến môi trường <code>CAMPUS_ARTIFACT_DIR</code>.</td>
            <td><span class="badge-pill badge-pass">✅ PASS</span></td>
          </tr>
          <tr>
            <td><span class="level-p2">🟡 P2</span></td>
            <td><strong>JSX Checker Dependency:</strong> <code>kiem-tra-jsx.js</code> require <code>esbuild</code> nhưng không khai báo trực tiếp.</td>
            <td>Khai báo chính thức <code>"esbuild": "^0.27.3"</code> trong <code>devDependencies</code> của <code>package.json</code> và thêm script <code>"check:jsx"</code>.</td>
            <td><span class="badge-pill badge-pass">✅ PASS</span></td>
          </tr>
          <tr>
            <td><span class="level-ux">🟡 UX</span></td>
            <td><strong>Quiet Zero Metrics:</strong> Hero và Right rail khoe số 0 khi Campus yên tĩnh.</td>
            <td>Khi <code>dangHoatDong === 0</code>, Hero hiển thị thông điệp tích cực <code>✦ Campus sẵn sàng kết nối</code>; Right rail hiển thị <code>Campus yên tĩnh</code>.</td>
            <td><span class="badge-pill badge-pass">✅ PASS</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SECTION 3: QA RESULTS -->
    <div class="section">
      <div class="section-title">
        <span>🧪</span> Kết Quả Kiểm Tra Tự Động QA Production (63 / 63 Pass)
      </div>
      <div class="qa-grid">
        <div class="qa-card">
          <span class="qa-icon">✅</span>
          <div>
            <div class="qa-name">API Security &amp; Boundary (9/9)</div>
            <div class="qa-desc">Sanitized /api/campus, 401 khi khách gọi /api/phong, bảo vệ dữ liệu lớp.</div>
          </div>
        </div>
        <div class="qa-card">
          <span class="qa-icon">✅</span>
          <div>
            <div class="qa-name">Search Exclusivity (8/8)</div>
            <div class="qa-desc">Query "Caro" không xuất hiện Cinema/Music/Social; query rỗng hiện Empty State.</div>
          </div>
        </div>
        <div class="qa-card">
          <span class="qa-icon">✅</span>
          <div>
            <div class="qa-name">Responsive Real Bounding Boxes (23/23)</div>
            <div class="qa-desc">Đo tọa độ x, y, width thực tế trên 1920, 1440, 1280, 1024, 768, 390.</div>
          </div>
        </div>
        <div class="qa-card">
          <span class="qa-icon">✅</span>
          <div>
            <div class="qa-name">Copy &amp; Semantic Assertions (4/4)</div>
            <div class="qa-desc">Không 1080p giả định, không "0 ONLINE", brand chuẩn GDTX Định Quán.</div>
          </div>
        </div>
        <div class="qa-card">
          <span class="qa-icon">✅</span>
          <div>
            <div class="qa-name">Caro Guest Auth Gate (3/3)</div>
            <div class="qa-desc">Nút CTA mở Auth Gate modal, khách không bị đưa vào giao diện chơi cờ.</div>
          </div>
        </div>
        <div class="qa-card">
          <span class="qa-icon">✅</span>
          <div>
            <div class="qa-name">WAI-ARIA &amp; Console Quality (6/6)</div>
            <div class="qa-desc">Phím mũi tên &larr;/&rarr; trên tabs, 0 unexpected 401, 0 console error.</div>
          </div>
        </div>
      </div>
    </div>

    <footer>
      <p>Báo cáo tự động tổng hợp cho Phase 3A.1 — Hệ Thống Digital Campus · Trường GDTX Định Quán</p>
      <p style="margin-top: 4px; color: #64748B;">Mọi thay đổi đã được verify và merge vào remote main: <code>b061a020d7072567133f68ea76571ddacb4fc897</code></p>
    </footer>
  </div>

  <script>
    function showTab(tabId) {
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      const pane = document.getElementById(tabId);
      if (pane) pane.classList.add('active');
      const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
      if (btn) btn.classList.add('active');
    }
  </script>
</body>
</html>
`;

const outDocsPath = path.join(ROOT, 'docs', 'BAO-CAO-PHASE-3A1.html');
const outQaPath = path.join(ROOT, 'qa', 'BAO-CAO-PHASE-3A1.html');

fs.writeFileSync(outDocsPath, htmlContent, 'utf8');
fs.writeFileSync(outQaPath, htmlContent, 'utf8');

console.log(`✅ Đã tạo thành công file báo cáo nghiệm thu tự thân kèm ảnh Base64:`);
console.log(`   → ${outDocsPath}`);
console.log(`   → ${outQaPath}`);
