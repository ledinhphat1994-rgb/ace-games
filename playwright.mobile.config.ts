import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'mobile-responsive.spec.ts',
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 2,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/mobile' }]],
  outputDir: 'test-results/mobile',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})
