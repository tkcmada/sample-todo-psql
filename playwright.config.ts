import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  ...(process.env.E2E_BASE_URL
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          port: 3000,
          reuseExistingServer: !process.env.CI,
        },
      }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
});
