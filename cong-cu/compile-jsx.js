// cong-cu/compile-jsx.js — Compile JSX (src/**/*.jsx) → JS thuần (assets/gen/**/*.js)
// bằng esbuild. Chạy ở build-time; KHÔNG bundle (mỗi file giữ nguyên cấu trúc, ESM import
// giữ nguyên — trình duyệt tự resolve ./x.js). File output được commit để
// `wrangler pages dev .` chạy ngay mà không cần bước build.
// Cách dùng: node cong-cu/compile-jsx.js [--check]   (--check: chỉ kiểm cú pháp, không ghi)
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'assets', 'gen');

function lietKeJsx(thuMuc, goc = thuMuc) {
  if (!fs.existsSync(thuMuc)) return [];
  const ds = [];
  for (const item of fs.readdirSync(thuMuc, { withFileTypes: true })) {
    const p = path.join(thuMuc, item.name);
    if (item.isDirectory()) ds.push(...lietKeJsx(p, goc));
    else if (item.name.endsWith('.jsx')) ds.push(p);
  }
  return ds;
}

function compileMotTep(duongDan, ghi = true) {
  const code = fs.readFileSync(duongDan, 'utf8');
  const rel = path.relative(SRC, duongDan);
  const res = esbuild.transformSync(code, {
    loader: 'jsx',
    jsx: 'transform', // React.createElement — React vẫn tải qua CDN
    target: 'es2020',
    sourcefile: rel.split(path.sep).join('/'),
    // Sourcemap inline: stack trace trong DevTools trỏ về dòng .jsx gốc — dễ debug.
    sourcemap: 'inline',
  });
  if (ghi) {
    const ra = path.join(OUT, rel.replace(/\.jsx$/, '.js'));
    fs.mkdirSync(path.dirname(ra), { recursive: true });
    fs.writeFileSync(ra, '// GEN TU src/' + rel.split(path.sep).join('/') + ' — KHONG SUA TAY\n' + res.code, 'utf8');
    return ra;
  }
  return null;
}

function main() {
  const chiKiem = process.argv.includes('--check');
  const ds = lietKeJsx(SRC);
  if (ds.length === 0) {
    if (chiKiem) { console.log('(không có file .jsx nào trong src/)'); return; }
    console.warn('Không có file .jsx nào trong src/ — bỏ qua compile.');
    return;
  }
  let loi = 0;
  const viet = [];
  for (const f of ds) {
    try {
      const ra = compileMotTep(f, !chiKiem);
      if (ra) viet.push(path.relative(ROOT, ra));
    } catch (e) {
      loi++;
      console.error(`LỖI JSX ${path.relative(ROOT, f)}: ${e.message}`);
    }
  }
  if (loi) {
    console.error(`\n${loi} tệp JSX lỗi cú pháp — sửa trước khi tiếp tục.`);
    process.exit(1);
  }
  if (chiKiem) {
    console.log(`✅ Cú pháp JSX hợp lệ (${ds.length} tệp trong src/).`);
  } else {
    viet.forEach((v) => console.log('  → ' + v));
    console.log(`Đã compile ${viet.length} tệp JSX vào assets/gen/.`);
  }
}

main();
