// Chốt chặn: kiểm tra ĐÚNG tài khoản trước khi đăng bài lên mạng.
// Nếu máy đang ở tài khoản khác, dừng lại ngay thay vì đăng nhầm chỗ.
const { execSync } = require('child_process');

const GITHUB_DUNG = 'ledinhphat1994-rgb';
const CLOUDFLARE_DUNG = 'ledinhphat1994@gmail.com';

let saiSot = 0;

function chay(lenh) {
  try {
    return execSync(lenh, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

// --- GitHub ---
const ghUser = chay('gh api user --jq .login');
if (ghUser === null) {
  console.log('⚠  Không kiểm tra được GitHub (chưa cài gh hoặc chưa đăng nhập). Bỏ qua bước này.');
} else if (ghUser !== GITHUB_DUNG) {
  console.error(`✗ GitHub đang là "${ghUser}", phải là "${GITHUB_DUNG}".`);
  console.error(`  Sửa bằng:  gh auth switch --user ${GITHUB_DUNG}`);
  saiSot++;
} else {
  console.log(`✓ GitHub: ${ghUser}`);
}

// --- Cloudflare ---
const cf = chay('npx --no-install wrangler whoami');
if (cf === null) {
  console.error('✗ Chưa đăng nhập Cloudflare. Sửa bằng:  npx wrangler login');
  saiSot++;
} else if (!cf.includes(CLOUDFLARE_DUNG)) {
  const email = (cf.match(/associated with the email ([^\s.]+@[^\s.]+\.[^\s]+)/) || [])[1] || 'không rõ';
  console.error(`✗ Cloudflare đang là "${email}", phải là "${CLOUDFLARE_DUNG}".`);
  console.error('  Sửa bằng:  npx wrangler logout  rồi  npx wrangler login');
  saiSot++;
} else {
  console.log(`✓ Cloudflare: ${CLOUDFLARE_DUNG}`);
}

// --- Kho mã nguồn ---
const remote = chay('git remote get-url origin') || '';
if (remote && !remote.includes(`${GITHUB_DUNG}/lop-10a7`)) {
  console.error(`✗ Remote git trỏ sai chỗ: ${remote}`);
  saiSot++;
} else if (remote) {
  console.log('✓ Remote git: ledinhphat1994-rgb/lop-10a7');
}

if (saiSot) {
  console.error(`\nDừng lại — chưa đăng gì cả. Sửa ${saiSot} vấn đề ở trên rồi chạy lại.`);
  process.exit(1);
}
console.log('Đúng tài khoản, tiếp tục.\n');
