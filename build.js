// Gom đúng những tệp cần đăng vào thư mục dist/.
// Mục đích: KHÔNG bao giờ đẩy nhầm tệp cấu hình, tệp tạm hay tệp chứa mã bí mật lên mạng.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');

// Chỉ những mục có tên dưới đây mới được đăng lên.
const DANH_SACH_DANG = [
  'index.html', 'login.html', 'robots.txt',
  'manifest.webmanifest', 'sw.js', '_headers',
  'assets', 'data', 'functions', 'giao-vien',
  'digital-campus.html', 'community-feed.html',
];

// Không đăng các tệp ghi chú nội bộ nằm lẫn trong thư mục trên.
const BO_QUA = new Set(['README.txt', '.DS_Store', 'Thumbs.db']);

function copy(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const ten of fs.readdirSync(src)) {
      if (BO_QUA.has(ten)) continue;
      copy(path.join(src, ten), path.join(dest, ten));
    }
    return;
  }
  fs.copyFileSync(src, dest);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const muc of DANH_SACH_DANG) {
  const src = path.join(ROOT, muc);
  if (!fs.existsSync(src)) {
    console.warn(`Bỏ qua (không tìm thấy): ${muc}`);
    continue;
  }
  copy(src, path.join(OUT, muc));
}

// Kiểm tra JSON hợp lệ trước khi đăng — tránh trang trắng vì thừa/thiếu dấu phẩy.
let loi = 0;
for (const ten of fs.existsSync(path.join(OUT, 'data')) ? fs.readdirSync(path.join(OUT, 'data')) : []) {
  const f = path.join(OUT, 'data', ten);
  try {
    JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {
    console.error(`LỖI cú pháp JSON trong data/${ten}: ${e.message}`);
    loi++;
  }
}
if (loi) {
  console.error('\nDừng lại, chưa đăng gì cả. Hãy sửa các tệp JSON ở trên rồi chạy lại.');
  process.exit(1);
}

// Nén (minify) tự động JS và CSS phía client trong dist/ để tải nhanh gấp đôi trên điện thoại.
// Giữ nguyên mã nguồn gốc trong thư mục làm việc để giáo viên/lập trình viên dễ đọc, dễ sửa.
let esbuild;
try {
  esbuild = require('esbuild');
} catch {}

if (esbuild) {
  let truoc = 0;
  let sau = 0;
  let demNen = 0;

  function nenThuMuc(thuMuc) {
    if (!fs.existsSync(thuMuc)) return;
    for (const item of fs.readdirSync(thuMuc, { withFileTypes: true })) {
      const p = path.join(thuMuc, item.name);
      if (item.isDirectory()) {
        if (item.name === 'functions') continue; // Không can thiệp mã server Functions
        nenThuMuc(p);
      } else if (item.name.endsWith('.js') || item.name.endsWith('.css')) {
        const code = fs.readFileSync(p, 'utf8');
        const loader = item.name.endsWith('.css') ? 'css' : 'js';
        try {
          const res = esbuild.transformSync(code, { loader, minify: true, target: 'es2020' });
          if (res.code && res.code.length < code.length) {
            truoc += code.length;
            sau += res.code.length;
            demNen++;
            fs.writeFileSync(p, res.code, 'utf8');
          }
        } catch (e) {
          console.warn(`Bỏ qua nén ${item.name}: ${e.message}`);
        }
      }
    }
  }

  nenThuMuc(path.join(OUT, 'assets'));
  nenThuMuc(path.join(OUT, 'giao-vien'));
  const swPath = path.join(OUT, 'sw.js');
  if (fs.existsSync(swPath)) {
    try {
      const code = fs.readFileSync(swPath, 'utf8');
      const res = esbuild.transformSync(code, { minify: true, target: 'es2020' });
      if (res.code && res.code.length < code.length) {
        truoc += code.length;
        sau += res.code.length;
        demNen++;
        fs.writeFileSync(swPath, res.code, 'utf8');
      }
    } catch {}
  }

  if (demNen > 0) {
    const tietKiemKb = ((truoc - sau) / 1024).toFixed(1);
    const phanTram = ((1 - sau / truoc) * 100).toFixed(1);
    console.log(`Đã nén ${demNen} tệp JS/CSS trong dist/ — tiết kiệm ${tietKiemKb} KB (${phanTram}%).`);
  }
}

const dem = (d) => fs.readdirSync(d, { withFileTypes: true })
  .reduce((n, e) => n + (e.isDirectory() ? dem(path.join(d, e.name)) : 1), 0);

console.log(`Đã chuẩn bị ${dem(OUT)} tệp trong dist/ — sẵn sàng đăng.`);
