// Soát cả dự án trước khi đăng lên mạng.
//
// Dự án không có bước biên dịch nên không có gì tự phát hiện lỗi gõ sai:
// một dấu phẩy thừa trong JSON, một đường dẫn import gõ sai, hay một mã bí mật
// lỡ viết thẳng vào mã nguồn đều lên mạng được. Tệp này là lưới chắn cuối cùng.
//
// Chạy: npm run kiem-tra-du-lieu
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BO_QUA_THU_MUC = new Set(['node_modules', '.git', '.wrangler', 'dist', '.playwright-mcp', '.claude']);

// Không đọc .dev.vars: tệp đó chứa mã dùng thử, không cần soát và cũng không nên mở.
const BO_QUA_TEP = new Set(['.dev.vars', '.dev.vars.example', 'package-lock.json', 'cong-cu/kiem-tra-du-lieu.js']);

const loi = [];
const canhBao = [];
const ghiLoi = (tep, mo_ta) => loi.push(`${tep}: ${mo_ta}`);
const ghiCanhBao = (tep, mo_ta) => canhBao.push(`${tep}: ${mo_ta}`);
const tenTuongDoi = (p) => path.relative(ROOT, p).split(path.sep).join('/');

function duyetThuMuc(thuMuc, ketQua = []) {
  for (const muc of fs.readdirSync(thuMuc, { withFileTypes: true })) {
    if (BO_QUA_THU_MUC.has(muc.name) || muc.name.startsWith('.tmp')) continue;
    const duongDan = path.join(thuMuc, muc.name);
    if (muc.isDirectory()) duyetThuMuc(duongDan, ketQua);
    else ketQua.push(duongDan);
  }
  return ketQua;
}

const tatCaTep = duyetThuMuc(ROOT).filter((p) => !BO_QUA_TEP.has(tenTuongDoi(p)));
const doc = (p) => {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
};

// ─────────────────────────────────────────────────────────────
// 1. JSON đọc được không (thừa/thiếu dấu phẩy là lỗi hay gặp nhất)
// ─────────────────────────────────────────────────────────────
const tepJson = tatCaTep.filter((p) => /\.(json|webmanifest)$/.test(p));
for (const p of tepJson) {
  try {
    JSON.parse(doc(p));
  } catch (e) {
    ghiLoi(tenTuongDoi(p), `JSON sai cú pháp — ${e.message}`);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. JS có sai cú pháp không
// Tệp trong functions/, assets/js/, giao-vien/ là ES module; build.js, deploy.js,
// cong-cu/ là CommonJS. Nhận biết bằng việc có dòng import/export ở đầu dòng.
// ─────────────────────────────────────────────────────────────
const tepJs = tatCaTep.filter((p) => /\.(js|mjs)$/.test(p));
for (const p of tepJs) {
  const ma = doc(p);
  const laEsm = p.endsWith('.mjs') || /^\s*(import|export)[\s{*]/m.test(ma);
  let ketQua;

  if (laEsm) {
    // node --check đọc tệp .js theo kiểu CommonJS nên sẽ báo lỗi ở dòng import.
    // Chép tạm sang .mjs để Node hiểu đúng là ES module. Nội dung y nguyên nên số dòng vẫn khớp.
    const tam = path.join(os.tmpdir(), `soat-${process.pid}-${path.basename(p, path.extname(p))}.mjs`);
    fs.writeFileSync(tam, ma);
    try {
      ketQua = spawnSync(process.execPath, ['--check', tam], { encoding: 'utf8' });
    } finally {
      fs.rmSync(tam, { force: true });
    }
  } else {
    ketQua = spawnSync(process.execPath, ['--check', p], { encoding: 'utf8' });
  }

  if (ketQua.status !== 0) {
    const dongLoi = String(ketQua.stderr || '')
      .split('\n')
      .find((d) => /Error/.test(d)) || 'sai cú pháp';
    ghiLoi(tenTuongDoi(p), `JS ${dongLoi.trim()}`);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Đường dẫn import và đường dẫn tệp trong HTML có tồn tại không
// Không có bundler nên gõ sai tên tệp chỉ vỡ khi người dùng mở trang.
// ─────────────────────────────────────────────────────────────
for (const p of tepJs) {
  const ma = doc(p);
  for (const khop of ma.matchAll(/(?:^|\s)(?:import|export)[^'"\n]*?from\s*['"](\.[^'"]+)['"]/g)) {
    const dich = path.resolve(path.dirname(p), khop[1]);
    if (!fs.existsSync(dich)) ghiCanhBao(tenTuongDoi(p), `import trỏ tới tệp không có: ${khop[1]}`);
  }
}

for (const p of tatCaTep.filter((f) => f.endsWith('.html'))) {
  const ma = doc(p);
  for (const khop of ma.matchAll(/(?:src|href)="(\/[^"#?]+\.(?:js|css|png|jpg|jpeg|svg|webmanifest))"/g)) {
    const dich = path.join(ROOT, khop[1]);
    if (!fs.existsSync(dich)) ghiCanhBao(tenTuongDoi(p), `trỏ tới tệp không có: ${khop[1]}`);
  }
}

// ─────────────────────────────────────────────────────────────
// 4. SQL có câu nào xoá/sửa hàng loạt không (chỉ nhắc, không chặn)
// ─────────────────────────────────────────────────────────────
const tepSql = tatCaTep.filter((p) => p.endsWith('.sql'));
for (const p of tepSql) {
  const cauLenh = doc(p)
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean);

  for (const cau of cauLenh) {
    const gonGang = cau.replace(/\s+/g, ' ');
    if (/\bDROP\s+(TABLE|INDEX|VIEW|TRIGGER)\b/i.test(gonGang)) {
      ghiCanhBao(tenTuongDoi(p), `có câu DROP — xác nhận với giáo viên trước khi chạy: ${gonGang.slice(0, 60)}`);
    }
    if (/^DELETE\s+FROM\b/i.test(gonGang) && !/\bWHERE\b/i.test(gonGang)) {
      ghiCanhBao(tenTuongDoi(p), `DELETE không có WHERE — sẽ xoá cả bảng: ${gonGang.slice(0, 60)}`);
    }
    if (/^UPDATE\b/i.test(gonGang) && !/\bWHERE\b/i.test(gonGang)) {
      ghiCanhBao(tenTuongDoi(p), `UPDATE không có WHERE — sẽ sửa cả bảng: ${gonGang.slice(0, 60)}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 5. Mã bí mật có lỡ nằm trong mã nguồn không
// Chỉ báo TÊN TỆP và SỐ DÒNG, không in giá trị ra màn hình.
// ─────────────────────────────────────────────────────────────
const MAU_NGUY_HIEM = [
  { ten: 'SESSION_SECRET gán thẳng chuỗi', re: /SESSION_SECRET\s*[:=]\s*['"][^'"]{6,}['"]/ },
  { ten: 'CLASS_CODE gán thẳng chuỗi', re: /CLASS_CODE\s*[:=]\s*['"][^'"]{3,}['"]/ },
  { ten: 'TEACHER_CODE gán thẳng chuỗi', re: /TEACHER_CODE\s*[:=]\s*['"][^'"]{3,}['"]/ },
  { ten: 'token GitHub', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/ },
  { ten: 'token GitHub dạng mới', re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  { ten: 'token Cloudflare gán thẳng chuỗi', re: /CLOUDFLARE_API_TOKEN\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/ },
];
const DUOI_VAN_BAN = /\.(js|mjs|html|css|md|json|ya?ml|sql|txt|toml|webmanifest)$/;

for (const p of tatCaTep.filter((f) => DUOI_VAN_BAN.test(f))) {
  const dongs = doc(p).split('\n');
  dongs.forEach((dong, i) => {
    for (const mau of MAU_NGUY_HIEM) {
      if (mau.re.test(dong)) ghiLoi(tenTuongDoi(p), `dòng ${i + 1} có thể là ${mau.ten}`);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// 6. dist/ có lọt tệp không được phép đăng không
// ─────────────────────────────────────────────────────────────
const KHONG_DUOC_DANG = new Set([
  '.dev.vars', '.dev.vars.example', '.clinerules', '.vscode', '.github', '.claude',
  'du-lieu-goc', 'cong-cu', 'co-so-du-lieu', 'build.js', 'deploy.js',
  'kiem-tra-tai-khoan.js', 'package.json', 'package-lock.json', 'wrangler.toml',
  'HUONG-DAN.md', 'node_modules', '.git', '.gitignore', 'eslint.config.mjs', '.editorconfig',
]);
const thuMucDist = path.join(ROOT, 'dist');
if (fs.existsSync(thuMucDist)) {
  for (const ten of fs.readdirSync(thuMucDist)) {
    if (KHONG_DUOC_DANG.has(ten)) {
      ghiLoi('dist/' + ten, 'tệp/thư mục này không được đăng lên mạng — kiểm tra DANH_SACH_DANG trong build.js');
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Kết quả
// ─────────────────────────────────────────────────────────────
console.log(
  `Đã soát ${tepJson.length} tệp JSON, ${tepJs.length} tệp JS, ${tepSql.length} tệp SQL.`
);

if (canhBao.length) {
  console.log(`\nCần để ý (${canhBao.length}):`);
  for (const c of canhBao) console.log('  ! ' + c);
}

if (loi.length) {
  console.error(`\nLỖI phải sửa (${loi.length}):`);
  for (const l of loi) console.error('  x ' + l);
  console.error('\nChưa đăng gì cả. Sửa các mục trên rồi chạy lại.');
  process.exit(1);
}

console.log('\nKhông có lỗi. Có thể chạy thử hoặc đăng trang.');
