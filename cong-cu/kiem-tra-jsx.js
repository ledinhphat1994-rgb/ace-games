// cong-cu/kiem-tra-jsx.js — Kiểm tra cú pháp JSX trong src/**/*.jsx (esbuild --check).
// Giữ tên script cũ để package.json/CI không phải đổi.
process.argv.push('--check');
require('./compile-jsx.js');
