// cong-cu/migrate.mjs — Theo dõi + nạp migration D1 theo thứ tự tên file.
//
// Vấn đề giải quyết: trước đây 90+ file SQL trong co-so-du-lieu/ được nạp tay,
// không có ghi nhận file nào đã chạy ở local/remote — dễ nạp thiếu hoặc nạp lại.
// Tool này tạo bảng `_migrations` trong CSDL và ghi nhận mỗi file đã nạp kèm
// sha256 để phát hiện file bị sửa sau khi nạp (drift).
//
// Cách dùng:
//   node cong-cu/migrate.mjs status  [--local|--remote]  — liệt kê đã nạp / chờ
//   node cong-cu/migrate.mjs apply   [--local|--remote]  — nạp các file còn thiếu theo thứ tự
//   node cong-cu/migrate.mjs baseline [--local|--remote] — CHỈ CHẠY 1 LẦN trên môi trường
//        đã có schema sẵn: đánh dấu toàn bộ file hiện có là "đã nạp" mà không chạy lại.
//
// Mặc định: --local. --remote cần xác nhận gõ "CO" vì ghi lên CSDL thật.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const THU_MUC_SQL = path.join(ROOT, 'co-so-du-lieu');
const DB = 'lop-10a7-db';

const lenh = process.argv[2] || 'status';
const remote = process.argv.includes('--remote');
const CO = remote ? '--remote' : '--local';

function chayWrangler(args, { json = false } = {}) {
  const cmd = `npx wrangler d1 execute ${DB} ${CO} ${args}${json ? ' --json' : ''}`;
  return execSync(cmd, { encoding: 'utf-8', cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'] });
}

function truyVan(sql) {
  const out = chayWrangler(`--command="${sql.replace(/"/g, '\\"')}"`, { json: true });
  const parsed = JSON.parse(out.slice(out.indexOf('[')));
  return parsed[0]?.results || [];
}

function sha256File(p) {
  return createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function danhSachFile() {
  return fs.readdirSync(THU_MUC_SQL)
    .filter(f => f.endsWith('.sql'))
    .sort() // tên file đánh số NN-*.sql — sort chuỗi = đúng thứ tự nạp
    .map(f => ({ ten: f, duong: path.join(THU_MUC_SQL, f), sha: sha256File(path.join(THU_MUC_SQL, f)) }));
}

async function damBaoBangMigrations() {
  await Promise.resolve();
  chayWrangler(`--command="CREATE TABLE IF NOT EXISTS _migrations (ten TEXT PRIMARY KEY, sha256 TEXT NOT NULL, ap_dung_luc TEXT NOT NULL, baseline INTEGER NOT NULL DEFAULT 0);"`);
}

async function xacNhanRemote() {
  if (!remote) return;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const traLoi = await new Promise(r => rl.question(`GHI LÊN REMOTE ${DB} — gõ CO để xác nhận: `, r));
  rl.close();
  if (traLoi.trim() !== 'CO') { console.log('Đã huỷ.'); process.exit(1); }
}

async function main() {
  const ds = danhSachFile();
  if (ds.length === 0) { console.log('Không có file .sql nào trong co-so-du-lieu/.'); return; }

  if (lenh === 'status') {
    let daNap = new Map();
    try {
      for (const r of truyVan('SELECT ten, sha256 FROM _migrations')) daNap.set(r.ten, r.sha256);
    } catch { /* bảng chưa có -> chưa nạp gì qua tool này */ }
    let cho = 0, drift = 0;
    for (const f of ds) {
      const sha = daNap.get(f.ten);
      if (!sha) { cho++; console.log(`  CHỜ    ${f.ten}`); }
      else if (sha !== f.sha) { drift++; console.log(`  DRIFT  ${f.ten} (file đã đổi sau khi nạp)`); }
    }
    console.log(`\nTổng: ${ds.length} file | đã nạp ${daNap.size} | chờ ${cho} | drift ${drift}`);
    if (daNap.size === 0) console.log('Mẹo: môi trường đã có schema sẵn thì chạy "baseline" một lần trước.');
    return;
  }

  await xacNhanRemote();
  await damBaoBangMigrations();

  const daNap = new Set(truyVan('SELECT ten FROM _migrations').map(r => r.ten));

  if (lenh === 'baseline') {
    const chen = ds.filter(f => !daNap.has(f.ten));
    if (!chen.length) { console.log('Tất cả file đã được ghi nhận — không cần baseline.'); return; }
    // INSERT qua file tạm — 80+ dòng inline vượt giới hạn command-line Windows (~8KB).
    const values = chen.map(f => `('${f.ten}', '${f.sha}', datetime('now'), 1)`).join(',\n');
    const tmp = path.join(ROOT, 'cong-cu', '.tmp-baseline.sql');
    fs.writeFileSync(tmp, `INSERT OR IGNORE INTO _migrations (ten, sha256, ap_dung_luc, baseline) VALUES\n${values};\n`);
    try {
      chayWrangler(`--file="cong-cu/.tmp-baseline.sql" -y`);
    } finally {
      fs.unlinkSync(tmp);
    }
    console.log(`Đã baseline ${chen.length} file (ghi nhận đã nạp, không chạy lại).`);
    return;
  }

  if (lenh === 'apply') {
    const cho = ds.filter(f => !daNap.has(f.ten));
    if (!cho.length) { console.log('Không có migration nào chờ.'); return; }
    console.log(`Nạp ${cho.length} migration ${remote ? 'REMOTE' : 'LOCAL'}:`);
    for (const f of cho) {
      process.stdout.write(`  ${f.ten} ... `);
      chayWrangler(`--file="co-so-du-lieu/${f.ten}" -y`);
      truyVan(`INSERT INTO _migrations (ten, sha256, ap_dung_luc, baseline) VALUES ('${f.ten}', '${f.sha}', datetime('now'), 0)`);
      console.log('OK');
    }
    console.log('Xong.');
    return;
  }

  console.log(`Lệnh không biết: ${lenh}. Dùng: status | apply | baseline [--local|--remote]`);
  process.exit(1);
}

main().catch(e => { console.error('LỖI:', e.message); process.exit(1); });
