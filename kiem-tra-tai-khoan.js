// Chốt chặn: xác nhận đúng tài khoản trước khi đăng lên mạng.
//
// Điểm quan trọng: KHÔNG quan tâm "gh" đang active tài khoản nào.
// Thư mục này đã được cấu hình lấy thẳng token của tài khoản lớp 10A7,
// nên máy có đang đăng nhập tài khoản khác cũng không ảnh hưởng.
const { execSync } = require('child_process');

const GITHUB_DUNG = 'ledinhphat1994-rgb';
const CLOUDFLARE_EMAIL = 'ledinhphat1994@gmail.com';
const CLOUDFLARE_ID = 'bfc647e65d847f61ca386b7f11c27173';

let saiSot = 0;

function chay(lenh, layCaLoi) {
  try {
    return execSync(lenh, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', layCaLoi ? 'pipe' : 'ignore'],
    });
  } catch (e) {
    return layCaLoi ? String((e.stdout || '') + (e.stderr || '')) : null;
  }
}

// --- 1. Có token của đúng tài khoản GitHub không ---
const token = chay(`gh auth token --user ${GITHUB_DUNG}`);
if (!token || !token.trim()) {
  console.error(`✗ Chưa có đăng nhập GitHub cho tài khoản "${GITHUB_DUNG}".`);
  console.error(`  Sửa bằng:  gh auth login --web --scopes repo,workflow`);
  saiSot++;
} else {
  console.log(`✓ GitHub: có token của ${GITHUB_DUNG}`);
}

// --- 2. Thực sự vào được kho mã nguồn của lớp không (bằng chứng thật) ---
const remote = (chay('git remote get-url origin') || '').trim();
if (remote && !remote.includes(`${GITHUB_DUNG}/lop-10a7`)) {
  console.error(`✗ Remote git trỏ sai chỗ: ${remote}`);
  saiSot++;
} else if (remote) {
  const thu = chay('git ls-remote --heads origin', true) || '';
  if (/refs\/heads\//.test(thu)) {
    console.log(`✓ Kho mã nguồn: vào được ${GITHUB_DUNG}/lop-10a7`);
  } else {
    console.error('✗ Không truy cập được kho mã nguồn của lớp.');
    console.error('  Sửa bằng:  gh auth login --web --scopes repo,workflow  (đăng nhập ledinhphat1994@gmail.com)');
    saiSot++;
  }
}

// --- 3. Cloudflare đúng tài khoản không ---
const cf = chay('npx --no-install wrangler whoami', true) || '';
const cfThuong = cf.toLowerCase();
if (cfThuong.includes(CLOUDFLARE_ID) || cfThuong.includes(CLOUDFLARE_EMAIL)) {
  console.log(`✓ Cloudflare: ${CLOUDFLARE_EMAIL}`);
} else if (/not authenticated|wrangler login/i.test(cf)) {
  console.error('✗ Chưa đăng nhập Cloudflare. Sửa bằng:  npx wrangler login');
  saiSot++;
} else {
  const email = (cf.match(/associated with the email ([^\s]+@[^\s]+?)\.?\s/) || [])[1];
  if (email) {
    console.error(`✗ Cloudflare đang là "${email}", phải là "${CLOUDFLARE_EMAIL}".`);
    console.error('  Sửa bằng:  npx wrangler logout   rồi   npx wrangler login');
    saiSot++;
  } else {
    // Không đọc được kết quả — không chặn, vì deploy.js đã ghim cứng mã tài khoản,
    // Cloudflare sẽ tự từ chối nếu sai chỗ.
    console.log('⚠ Không đọc được tài khoản Cloudflare; dựa vào mã tài khoản đã ghim trong deploy.js.');
  }
}

if (saiSot) {
  console.error(`\nDừng lại — chưa đăng gì cả. Sửa ${saiSot} vấn đề ở trên rồi chạy lại.`);
  process.exit(1);
}
console.log('Đúng tài khoản, tiếp tục.\n');
