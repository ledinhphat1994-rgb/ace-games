import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs'

// Load .env.e2e if present (local runs), fallback to process.env (CI GitHub Actions)
if (fs.existsSync('.env.e2e')) {
  process.loadEnvFile('.env.e2e')
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL
if (!baseURL) {
  throw new Error('Missing required environment variable PLAYWRIGHT_BASE_URL. Please specify in .env.e2e or environment.')
}

export default defineConfig({
  testDir: './e2e',
  timeout: 120000,
  expect: {
    timeout: 20000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium-watch',
      testMatch: /watch-together\.spec\.ts|smoke\.spec\.ts/,
      testIgnore: /watch-autoplay\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--autoplay-policy=no-user-gesture-required',
          ],
        },
      },
    },
    {
      name: 'chromium-autoplay-restricted',
      testMatch: /watch-autoplay\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--autoplay-policy=user-gesture-required',
          ],
        },
      },
    },
  ],
})
