// Đăng trang lớp 10A7 lên mạng bằng MỘT lệnh:  npm run deploy
//
// Trình tự: kiểm tra đúng tài khoản  →  gom tệp sạch vào dist/  →  đăng lên Cloudflare.
// Tài khoản Cloudflare được ghim cứng ở đây, nên dù máy có đăng nhập tài khoản nào khác
// thì cũng không thể đăng nhầm sang tài khoản đó.
const { execFileSync } = require('child_process');

const TAI_KHOAN_CLOUDFLARE = 'bfc647e65d847f61ca386b7f11c27173'; // ledinhphat1994@gmail.com

const moiTruong = { ...process.env, CLOUDFLARE_ACCOUNT_ID: TAI_KHOAN_CLOUDFLARE };

function buoc(mo_ta, lenh, thamSo) {
  try {
    execFileSync(lenh, thamSo, { stdio: 'inherit', env: moiTruong, shell: true });
  } catch {
    console.error(`\nDừng ở bước: ${mo_ta}. Chưa đăng gì lên mạng.`);
    process.exit(1);
  }
}

buoc('kiểm tra tài khoản', 'node', ['kiem-tra-tai-khoan.js']);
buoc('gom tệp vào dist/', 'node', ['build.js']);
buoc('đăng lên Cloudflare', 'npx', ['wrangler', 'pages', 'deploy']);

console.log('\nXong. Trang đã cập nhật tại https://lop-10a7.pages.dev');
