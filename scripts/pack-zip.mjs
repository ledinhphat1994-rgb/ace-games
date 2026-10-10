import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const OUTPUT_ZIP = path.join(ROOT_DIR, 'game-project.zip');

// Danh sách các thư mục rác / binary cần loại trừ
const EXCLUDE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.wrangler',
  '.claude',
  '.devin',
  '.cache',
  'android',
  'mobile-apk',
  'artifacts',
  'scratch',
  'qa',
  'unrealworld',
  'playwright-report',
  'test-results',
  'phase4c-screenshots',
  '.playwright-mcp',
  '.husky',
]);

// Danh sách các đuôi file binary / media / log nặng cần loại trừ để zip nhẹ
const EXCLUDE_EXTS = new Set([
  '.apk',
  '.mp3',
  '.wav',
  '.ogg',
  '.glb',
  '.gltf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.ico',
  '.log',
  '.zip',
  '.tar',
  '.gz',
  '.pdf',
  '.docx',
  '.pptx',
]);

// Danh sách file cụ thể bị loại trừ
const EXCLUDE_FILES = new Set([
  'repomix-codebase.txt',
  'game-project.zip',
  'DigitalCampus-Native-10A7.apk',
  '.dev.vars',
  '.env.e2e',
]);

const fileList = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (
        EXCLUDE_DIRS.has(entry.name) ||
        relPath.includes('node_modules') ||
        relPath.includes('.git') ||
        relPath.includes('docs/phase4') ||
        relPath.includes('docs/qa-phase')
      ) {
        continue;
      }
      walk(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      // Bỏ qua file HTML report quá lớn trong docs (> 1MB)
      if (relPath.startsWith('docs/') && ext === '.html') {
        continue;
      }
      // Bỏ qua thư viện phaser bundle đã minify sẵn trong public/assets/engines/
      if (relPath.includes('phaser.min.js')) {
        continue;
      }
      if (EXCLUDE_EXTS.has(ext) || EXCLUDE_FILES.has(entry.name)) {
        continue;
      }
      fileList.push(relPath);
    }
  }
}

console.log('📦 Đang quét toàn bộ mã nguồn tinh gọn...');
walk(ROOT_DIR);
console.log(`✨ Tìm thấy ${fileList.length} files mã nguồn cốt lõi.`);

const listFilePath = path.join(ROOT_DIR, 'filelist_for_zip.txt');
fs.writeFileSync(listFilePath, fileList.join('\n'), 'utf-8');

console.log('🗜️  Đang nén thành game-project.zip...');
if (fs.existsSync(OUTPUT_ZIP)) {
  fs.unlinkSync(OUTPUT_ZIP);
}

execSync('tar.exe -a -c -f game-project.zip -T filelist_for_zip.txt', { stdio: 'inherit' });

if (fs.existsSync(listFilePath)) {
  fs.unlinkSync(listFilePath);
}

const stats = fs.statSync(OUTPUT_ZIP);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`\n✅ NÉN HOÀN TẤT: game-project.zip (${sizeMb} MB)`);
