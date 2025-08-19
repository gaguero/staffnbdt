import { chromium, FullConfig } from '@playwright/test';
import { LoginPage } from './utils/LoginPage';

/**
 * Global setup for Playwright tests
 * This runs once before all tests and handles authentication
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for Hotel Operations Hub tests...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Get base URL from config
    const baseURL = config.use?.baseURL || 'https://frontend-production-55d3.up.railway.app';
    console.log(`🌐 Testing against: ${baseURL}`);

    // Navigate to login page
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');

    // Check if we can access the login page
    const loginForm = page.locator('form');
    await loginForm.waitFor({ state: 'visible', timeout: 10000 });
    
    console.log('✅ Login page is accessible');

    // Login with test credentials
    const loginPage = new LoginPage(page);
    await loginPage.login('admin@nayara.com', 'password123');

    // Wait for successful login - should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✅ Authentication successful');

    // Save authenticated state
    await page.context().storageState({ path: 'tests/.auth/user.json' });
    console.log('✅ Authentication state saved');

    // Verify critical pages are working
    await page.goto(`${baseURL}/users`);
    await page.waitForLoadState('networkidle');
    
    const usersHeading = page.getByRole('heading', { name: /users/i });
    await usersHeading.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Users page is accessible');

    await page.goto(`${baseURL}/departments`);
    await page.waitForLoadState('networkidle');
    
    const departmentsHeading = page.getByRole('heading', { name: /departments/i });
    await departmentsHeading.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Departments page is accessible');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('🎉 Global setup completed successfully');
}

export default globalSetup;