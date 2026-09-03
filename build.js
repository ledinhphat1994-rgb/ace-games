// Gom đúng những tệp cần đăng vào thư mục dist/.
// Mục đích: KHÔNG bao giờ đẩy nhầm tệp cấu hình, tệp tạm hay tệp chứa mã bí mật lên mạng.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');

// Chỉ những mục có tên dưới đây mới được đăng lên.
const DANH_SACH_DANG = ['index.html', 'login.html', 'robots.txt', 'assets', 'data', 'functions', 'giao-vien'];

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
for (const ten of fs.readdirSync(path.join(OUT, 'data'))) {
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

const dem = (d) => fs.readdirSync(d, { withFileTypes: true })
  .reduce((n, e) => n + (e.isDirectory() ? dem(path.join(d, e.name)) : 1), 0);

console.log(`Đã chuẩn bị ${dem(OUT)} tệp trong dist/ — sẵn sàng đăng.`);
