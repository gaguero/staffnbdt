import { defineConfig, devices } from '@playwright/test';

/**
 * Simple Playwright configuration for verification tests without complex setup
 */

export default defineConfig({
  testDir: './tests',
  
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['line'],
    ['json', { outputFile: 'test-results/simple-results.json' }],
    process.env.CI ? ['github'] : ['list']
  ].filter(Boolean),
  
  use: {
    baseURL: 'https://frontend-production-55d3.up.railway.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/simple-verification.test.ts',
    },
  ],

  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  outputDir: 'test-results/',
});