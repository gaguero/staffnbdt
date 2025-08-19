import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../utils/LoginPage';
import { TestHelpers } from '../utils/TestHelpers';

const authFile = 'tests/.auth/user.json';

/**
 * Authentication setup for all tests
 * This runs before other tests to establish authenticated session
 */
setup('authenticate', async ({ page }) => {
  console.log('🔐 Setting up authentication...');

  // Monitor network requests for potential issues
  const failedRequests = TestHelpers.setupNetworkMonitoring(page);

  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Take initial screenshot
  await TestHelpers.takeTimestampedScreenshot(page, 'auth-setup-login-page');

  // Create login page object
  const loginPage = new LoginPage(page);
  
  // Verify login page is accessible
  await loginPage.verifyOnLoginPage();
  
  // Test login with admin credentials
  await loginPage.login('admin@nayara.com', 'password123');
  
  // Verify successful login
  await loginPage.verifyLoginSuccess();
  
  // Take screenshot of successful login
  await TestHelpers.takeTimestampedScreenshot(page, 'auth-setup-dashboard');

  // Verify we can access protected routes
  console.log('🔍 Verifying access to protected routes...');
  
  // Test users page access
  await page.goto('/users');
  await TestHelpers.waitForLoadingToComplete(page);
  await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
  
  // Test departments page access  
  await page.goto('/departments');
  await TestHelpers.waitForLoadingToComplete(page);
  await expect(page.getByRole('heading', { name: /departments/i })).toBeVisible();

  // Save authenticated state
  await page.context().storageState({ path: authFile });
  
  // Check for any failed requests during setup
  if (failedRequests.length > 0) {
    console.warn(`⚠️  ${failedRequests.length} failed requests during auth setup:`);
    failedRequests.forEach(req => console.warn(`   ${req}`));
  }

  console.log('✅ Authentication setup completed successfully');
});