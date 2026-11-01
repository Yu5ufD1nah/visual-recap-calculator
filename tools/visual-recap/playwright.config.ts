import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', timeout: 30000, retries: 0,
  use: { baseURL: 'http://127.0.0.1:4177', ...devices['Desktop Chrome'] },
  webServer: { command: 'npm run dev -- --port 4177', url: 'http://127.0.0.1:4177', reuseExistingServer: !process.env.CI, timeout: 90000 }
})

