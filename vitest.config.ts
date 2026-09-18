import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig(async () => ({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations('./test/migrations'),
          // Secret riêng cho test (không phải secret thật); trùng với secret dùng để sinh vector tương thích.
          SESSION_SECRET: 'bi-mat-chi-dung-trong-test-khong-phai-that',
        },
      },
    }),
  ],
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
}))
