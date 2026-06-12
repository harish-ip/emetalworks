import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The vite dev server transforms modules on demand and this machine cannot
  // sustain many parallel Chromium instances — navigations start timing out
  // beyond 2 workers (verified: 4 workers → 45s goto timeouts, 1 worker → 11s).
  workers: process.env.CI ? 1 : 2,
  timeout: 60000,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: true,
    navigationTimeout: 45000,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome (Pixel 5)',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Chrome (Galaxy S21)',
      use: { ...devices['Galaxy S9+'] },
    },
  ],
});
