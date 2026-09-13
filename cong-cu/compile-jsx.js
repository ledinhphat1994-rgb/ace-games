// cong-cu/compile-jsx.js — Compile JSX (src/**/*.jsx) → JS thuần (assets/gen/**/*.js)
// bằng esbuild. Chạy ở build-time; KHÔNG bundle (mỗi file giữ nguyên cấu trúc, ESM import
// giữ nguyên — trình duyệt tự resolve ./x.js). File output được commit để
// `wrangler pages dev .` chạy ngay mà không cần bước build.
// Cách dùng:
//   node cong-cu/compile-jsx.js            — compile + ghi assets/gen
//   node cong-cu/compile-jsx.js --check    — chỉ kiểm cú pháp, không ghi
//   node cong-cu/compile-jsx.js --verify   — compile trong RAM và SO SÁNH với assets/gen
//     trên đĩa: lệch nội dung / thiếu file / file gen mồ côi (src đã xoá) => exit 1.
//     Dùng trong pre-commit để commit không bao giờ chứa assets/gen cũ hơn src/.
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
    else if (/\.(jsx|js)$/.test(item.name)) ds.push(p);
  }
  return ds;
}

function compileMotTep(duongDan, ghi = true) {
  // Normalize LF trước khi compile: sourcemap nhúng sourcesContent nguyên văn — nếu không
  // normalize, file src checkout dạng CRLF (core.autocrlf=true) sẽ sinh output khác với
  // lúc src là LF → verify báo drift ảo và gen không deterministic giữa các máy.
  const code = fs.readFileSync(duongDan, 'utf8').replace(/\r\n/g, '\n');
  const rel = path.relative(SRC, duongDan);
  const res = esbuild.transformSync(code, {
    loader: duongDan.endsWith('.jsx') ? 'jsx' : 'js',
    jsx: 'transform', // React.createElement — React vẫn tải qua CDN
    target: 'es2020',
    sourcefile: rel.split(path.sep).join('/'),
    // Sourcemap inline: stack trace trong DevTools trỏ về dòng .jsx gốc — dễ debug.
    sourcemap: 'inline',
  });
  const noiDung = '// GEN TU src/' + rel.split(path.sep).join('/') + ' — KHONG SUA TAY\n' + res.code;
  const ra = path.join(OUT, rel.replace(/\.jsx$/, '.js'));
  if (ghi) {
    // .js giữ nguyên tên — ESM import './x.js' resolve đúng cả 2 loại
    fs.mkdirSync(path.dirname(ra), { recursive: true });
    fs.writeFileSync(ra, noiDung, 'utf8');
  }
  return { ra, noiDung };
}

function main() {
  const chiKiem = process.argv.includes('--check');
  const xacMinh = process.argv.includes('--verify');
  const ds = lietKeJsx(SRC);
  if (ds.length === 0) {
    if (chiKiem) { console.log('(không có file .jsx nào trong src/)'); return; }
    console.warn('Không có file .jsx nào trong src/ — bỏ qua compile.');
    return;
  }
  let loi = 0;
  const viet = [];
  const lech = [];
  const genMongDoi = new Set();
  for (const f of ds) {
    try {
      const { ra, noiDung } = compileMotTep(f, !chiKiem && !xacMinh);
      if (!chiKiem && !xacMinh) viet.push(path.relative(ROOT, ra));
      if (xacMinh) {
        genMongDoi.add(path.normalize(ra));
        const trenDia = fs.existsSync(ra) ? fs.readFileSync(ra, 'utf8') : null;
        // core.autocrlf=true đổi LF→CRLF lúc checkout — line ending không phải drift.
        const diaNorm = trenDia === null ? null : trenDia.replace(/\r\n/g, '\n');
        if (diaNorm !== noiDung) lech.push(path.relative(ROOT, ra));
      }
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
    return;
  }
  if (xacMinh) {
    // File gen mồ côi: tồn tại trong assets/gen nhưng không còn nguồn tương ứng trong src/.
    for (const g of lietKeJsx(OUT)) {
      if (!genMongDoi.has(path.normalize(g))) lech.push(path.relative(ROOT, g) + ' (mồ côi — src đã xoá)');
    }
    if (lech.length) {
      console.error(`❌ assets/gen LỆCH source — ${lech.length} tệp:`);
      lech.forEach((v) => console.error('   ' + v));
      console.error('Chạy `npm run compile:jsx` rồi stage lại cả assets/gen trước khi commit.');
      process.exit(1);
    }
    console.log(`✅ assets/gen đồng bộ với src/ (${ds.length} tệp).`);
    return;
  }
  viet.forEach((v) => console.log('  → ' + v));
  console.log(`Đã compile ${viet.length} tệp JSX vào assets/gen/.`);
}

main();
