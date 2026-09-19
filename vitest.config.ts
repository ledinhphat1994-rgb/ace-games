import fs from 'node:fs'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig(async () => ({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations('./test/migrations'),
          ANALYTICS_TEST_MIGRATIONS: await readD1Migrations('./test/analytics-migrations'),
          CORE_MIGRATION_FILES: fs.readdirSync('./migrations'),
          ANALYTICS_MIGRATION_FILES: fs.readdirSync('./analytics-migrations'),
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
