import { defineConfig, devices } from '@playwright/test';

/**
 * Standalone Playwright config for Roberto Martinez testing
 * Bypasses global setup to avoid credential conflicts
 */

const RAILWAY_DEV_URL = 'https://frontend-copy-production-f1da.up.railway.app';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests sequentially for Roberto testing
  forbidOnly: false,
  retries: 0,
  workers: 1,
  
  reporter: [
    ['html', { outputFolder: 'playwright-report-roberto' }],
    ['list']
  ],
  
  use: {
    baseURL: RAILWAY_DEV_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // NO global setup - we handle auth in individual tests
  
  projects: [
    {
      name: 'Roberto Tests',
      use: { 
        ...devices['Desktop Chrome'],
        // No storage state - fresh context for each test
      },
      testMatch: '**/roberto-platform-admin-permissions.test.ts',
    },
  ],

  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  outputDir: 'test-results-roberto/',
});