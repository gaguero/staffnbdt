import { defineConfig, devices } from '@playwright/test';

/**
 * Hotel Operations Hub - Playwright Test Configuration
 * 
 * This configuration is optimized for testing the logging improvements
 * and verifying the multi-tenant system works correctly on Railway deployment.
 */

// Railway deployment URLs - these are the actual deployed environments
const RAILWAY_DEV_URL = 'https://frontend-copy-production-f1da.up.railway.app';
const RAILWAY_PROD_URL = 'https://frontend-production-55d3.up.railway.app';
const RAILWAY_BACKEND_URL = 'https://backend-copy-production-328d.up.railway.app';

// Determine which environment to test
const BASE_URL = process.env.CI ? RAILWAY_PROD_URL : RAILWAY_DEV_URL;
const API_BASE_URL = process.env.CI ? RAILWAY_BACKEND_URL : RAILWAY_BACKEND_URL;

export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    // Add line reporter for CI
    process.env.CI ? ['github'] : ['list']
  ].filter(Boolean),
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: BASE_URL,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Global test timeout
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Global setup and teardown
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  // Configure projects for major browsers
  projects: [
    // Setup project to authenticate users
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop browsers
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Use authenticated state from setup
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/setup/**', '**/*.setup.ts'],
    },

    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/setup/**', '**/*.setup.ts'],
    },

    {
      name: 'Desktop Safari',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/setup/**', '**/*.setup.ts'],
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 7'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/setup/**', '**/*.setup.ts'],
    },

    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 14'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/setup/**', '**/*.setup.ts'],
    },

    // API testing project
    {
      name: 'API Tests',
      use: {
        baseURL: API_BASE_URL,
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      },
      testMatch: '**/api/**/*.test.ts',
    },

    // Logging verification tests
    {
      name: 'Logging Verification',
      use: {
        baseURL: API_BASE_URL,
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      },
      testMatch: '**/logging/**/*.test.ts',
    },

    // Performance tests
    {
      name: 'Performance Tests',
      use: {
        baseURL: BASE_URL,
        // Performance tests need more time
        actionTimeout: 30000,
        navigationTimeout: 60000,
      },
      testMatch: '**/performance/**/*.test.ts',
    },
  ],

  // Global test configuration
  timeout: 30000,
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 5000,
    
    // Threshold for screenshot comparisons
    threshold: 0.2,
    
    // Enable soft assertions
    toHaveScreenshot: { threshold: 0.2, mode: 'rgb' },
  },

  // Output directories
  outputDir: 'test-results/',
  
  // Web server configuration for local testing
  webServer: process.env.CI ? undefined : {
    command: 'echo "Using Railway deployment for testing"',
    url: BASE_URL,
    timeout: 10000,
    reuseExistingServer: true,
  },

  // Test metadata
  metadata: {
    environment: process.env.CI ? 'production' : 'development',
    railwayUrl: BASE_URL,
    apiUrl: API_BASE_URL,
    testSuite: 'Hotel Operations Hub - Logging Verification',
    version: '1.0.0',
  },
});