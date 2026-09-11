// cong-cu/kiem-tra-jsx.js — Kiểm tra cú pháp JSX trong index.html tránh lỗi trang trắng do Babel
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const match = html.match(/<script\s+type=["']text\/babel["']>([\s\S]*?)<\/script>/i);
if (!match) {
  console.error('❌ Không tìm thấy thẻ <script type="text/babel"> trong index.html');
  process.exit(1);
}

try {
  esbuild.transformSync(match[1], { loader: 'jsx', target: 'es2020' });
  console.log('✅ Cú pháp JSX trong index.html hoàn toàn hợp lệ (0 lỗi cú pháp).');
} catch (err) {
  console.error('❌ Lỗi cú pháp JSX trong index.html:');
  console.error(err.message);
  process.exit(1);
}
