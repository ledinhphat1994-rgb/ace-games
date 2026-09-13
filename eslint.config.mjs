// Cấu hình ESLint — chỉ bắt lỗi thật (biến gõ sai, biến không dùng, trùng khoá),
// không bắt lỗi hình thức, vì mã nguồn này do một người bảo trì, không cần quy tắc rườm rà.
//
// Mỗi vùng có môi trường chạy khác nhau nên biến toàn cục cũng khác:
// functions/ chạy trên Cloudflare Workers, assets/ và giao-vien/ chạy trên trình duyệt,
// build.js và cong-cu/ chạy bằng Node trên máy.
import js from '@eslint/js';
import globals from 'globals';

const quyTacChung = {
  ...js.configs.recommended.rules,
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  'no-empty': ['warn', { allowEmptyCatch: true }],
  // Mã hiện tại hay khai báo trước rồi mới gán trong try/catch (vd `let code = ''`).
  // Đó là cách viết phòng xa, không phải lỗi — nên chỉ nhắc, không chặn.
  'no-useless-assignment': 'warn',
  eqeqeq: ['warn', 'smart'],
  'prefer-const': 'warn',
  'no-var': 'warn',
};

export default [
  {
    ignores: ['dist/**', '.wrangler/**', 'node_modules/**', '.playwright-mcp/**', 'assets/gen/**'],
  },

  // API và cổng bảo vệ: ES module chạy trên Cloudflare Workers.
  {
    files: ['functions/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.worker },
    },
    rules: quyTacChung,
  },

  // Giao diện học sinh và khu giáo viên: ES module chạy trên trình duyệt.
  {
    files: ['assets/js/**/*.js', 'giao-vien/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      ...quyTacChung,
      // Nhắc nhẹ: dữ liệu học sinh nhập phải đi qua textContent, không qua innerHTML.
      'no-restricted-properties': [
        'warn',
        {
          property: 'innerHTML',
          message: 'Dùng textContent hoặc tạo phần tử, để tên/ghi chú của học sinh không chèn được HTML.',
        },
      ],
    },
  },

  // Nguồn JSX frontend: chạy trên trình duyệt, React/ReactDOM toàn cục qua CDN.
  {
    files: ['src/**/*.jsx', 'src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, React: 'readonly', ReactDOM: 'readonly' },
    },
    rules: quyTacChung,
  },

  // Service worker: script thuần, không import.
  {
    files: ['sw.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: { ...globals.serviceworker },
    },
    rules: quyTacChung,
  },

  // Script chạy trên máy: CommonJS.
  {
    files: ['build.js', 'deploy.js', 'kiem-tra-tai-khoan.js', 'cong-cu/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: quyTacChung,
  },
];
