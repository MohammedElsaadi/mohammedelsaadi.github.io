import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/trains/e2e', fullyParallel: false, workers: 1, timeout: 120_000,
  reporter: 'list', use: { baseURL: 'http://127.0.0.1:8787', channel: 'msedge', headless: true, viewport: { width: 1440, height: 960 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev:full', url: 'http://127.0.0.1:8787', reuseExistingServer: true, timeout: 120_000 },
})
