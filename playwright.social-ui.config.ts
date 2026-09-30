import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'social-responsive.spec.ts',
  timeout: 180000,
  expect: { timeout: 15000 },
  workers: 1,
  reporter: [['list']],
  outputDir: 'test-results/social-ui',
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173', actionTimeout: 10000, navigationTimeout: 20000 },
})
