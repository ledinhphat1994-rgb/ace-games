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
//   node cong-cu/migrate.mjs verify  [--local|--remote]  — READ-ONLY, KHÔNG ghi gì:
//        đối chiếu schema THẬT (sqlite_master + PRAGMA table_info) với manifest các
//        object quan trọng mà migration phải tạo. `baseline`/`status` chỉ là bookkeeping
//        ("file đã được ghi nhận nạp") — KHÔNG chứng minh bảng/cột/index tồn tại;
//        muốn kết luận schema đủ thì phải chạy `verify`.
//
// Mặc định: --local. --remote cần xác nhận gõ "CO" cho lệnh GHI (apply/baseline);
// verify là read-only nên chạy remote không cần xác nhận.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const THU_MUC_SQL = path.join(ROOT, 'co-so-du-lieu');
const DB = 'lop-10a7-db';

// Manifest schema tối thiểu mà các migration quan trọng phải tạo — verify đối chiếu
// sqlite_master + PRAGMA table_info. Phủ các migration gần nhất của hệ thống phòng
// (61/64/65), campus hardening (68), collab/voice (75), admin IA (76), study-room
// governance (77) và noi-dung (78). Khi thêm migration mới tạo object mới, BỔ SUNG
// object đó vào đây để verify luôn bắt được thiếu sót.
const SCHEMA_MONG_DOI = {
  '61-phong-lien-lop.sql': {
    tables: ['phong', 'phong_thanh_vien', 'phong_tin_nhan'],
    indexes: ['idx_phong_mo', 'idx_ptv_phong', 'idx_ptn_phong'],
  },
  '64-phong-dong-bo-video.sql': {
    tables: ['phong_dong_bo_video'],
    indexes: ['idx_pdbv_phong'],
  },
  '65-phong-focus-state.sql': {
    tables: ['phong_focus_state'],
    indexes: ['idx_pfs_phong'],
  },
  '68-phase4b-campus-architecture.sql': {
    tables: ['tai_khoan_campus'],
    indexes: ['idx_tkc_ten_dn', 'idx_tkc_role_pending', 'idx_phong_access'],
    columns: { phong: ['access_mode', 'mat_khau_hash', 'mat_khau_salt', 'suc_chua'] },
  },
  '75-phase4f-collab-notifications-and-voice.sql': {
    tables: ['chat_read_state', 'watch_room_collab', 'watch_room_voice_signal'],
    indexes: ['idx_chat_read_state_acc', 'idx_watch_room_collab', 'idx_voice_signal_room'],
  },
  '76-admin-ia-v1-nen-tang.sql': {
    tables: ['giao_vien_lop', 'nhat_ky_quan_tri'],
    indexes: ['idx_gvl_giao_vien', 'idx_gvl_lop', 'idx_nkqt_tao_luc', 'idx_nkqt_lop'],
  },
  '77-study-room-governance.sql': {
    tables: [
      'phong_policy', 'phong_grant', 'phong_ban', 'phong_video_queue',
      'phong_voice_pair', 'phong_note', 'phong_wb_op', 'phong_sheet_cell',
    ],
    indexes: ['idx_pvq_phong', 'idx_pn_phong', 'idx_pwbo_phong'],
    columns: {
      phong_thanh_vien: ['vai_tro_phong'],
      phong_tin_nhan: ['da_xoa', 'video_time_sec'],
    },
  },
  '78-noi-dung-trang-thai.sql': {
    columns: { thong_bao: ['trang_thai'] },
  },
  '80-index-hieu-nang-gamification-campus.sql': {
    indexes: [
      'idx_tkc_hoc_sinh_id',
      'idx_user_streaks_streak_hien_tai',
      'idx_leaderboard_bang_tuan_lop',
      'idx_user_achievements_hs_lop',
    ],
  },
};

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
    console.log('Lưu ý: "đã nạp" chỉ là bookkeeping trong _migrations — chạy "verify" để kiểm chứng schema thật.');
    if (daNap.size === 0) console.log('Mẹo: môi trường đã có schema sẵn thì chạy "baseline" một lần trước.');
    return;
  }

  if (lenh === 'verify') {
    // READ-ONLY: đối chiếu schema thật với manifest — không ghi, không cần xác nhận remote.
    const master = truyVan(`SELECT type, name FROM sqlite_master WHERE type IN ('table','index')`);
    const coBang = new Set(master.filter(r => r.type === 'table').map(r => r.name));
    const coIndex = new Set(master.filter(r => r.type === 'index').map(r => r.name));
    let thieu = 0;
    for (const [tep, mong] of Object.entries(SCHEMA_MONG_DOI)) {
      const loiCua = [];
      for (const t of mong.tables || []) {
        if (!coBang.has(t)) loiCua.push(`thiếu bảng ${t}`);
      }
      for (const i of mong.indexes || []) {
        if (!coIndex.has(i)) loiCua.push(`thiếu index ${i}`);
      }
      for (const [bang, cots] of Object.entries(mong.columns || {})) {
        if (!coBang.has(bang)) { loiCua.push(`thiếu bảng ${bang} (nên có cột ${cots.join(', ')})`); continue; }
        const info = truyVan(`PRAGMA table_info(${bang})`);
        const coCot = new Set(info.map(r => r.name));
        for (const c of cots) {
          if (!coCot.has(c)) loiCua.push(`thiếu cột ${bang}.${c}`);
        }
      }
      if (loiCua.length) {
        thieu += loiCua.length;
        console.log(`  ✗ ${tep}:`);
        loiCua.forEach(l => console.log(`      - ${l}`));
      } else {
        console.log(`  ✓ ${tep}`);
      }
    }
    if (thieu) {
      console.log(`\nVERIFY THẤT BẠI: ${thieu} object thiếu trên ${remote ? 'REMOTE' : 'LOCAL'} ${DB}.`);
      console.log('Bookkeeping _migrations chỉ ghi nhận file đã chạy — nó KHÔNG chứng minh schema đủ.');
      process.exit(1);
    }
    console.log(`\nVERIFY OK: toàn bộ schema mong đợi hiện diện trên ${remote ? 'REMOTE' : 'LOCAL'} ${DB}.`);
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

  console.log(`Lệnh không biết: ${lenh}. Dùng: status | apply | baseline | verify [--local|--remote]`);
  process.exit(1);
}

main().catch(e => { console.error('LỖI:', e.message); process.exit(1); });
