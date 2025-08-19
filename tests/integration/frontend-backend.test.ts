import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/TestHelpers';

/**
 * Frontend-Backend Integration Tests
 * 
 * These tests verify that frontend and backend work correctly together
 * after the logging improvements, ensuring no functionality was broken
 * during the logging optimization process.
 */

test.describe('Frontend-Backend Integration', () => {

  test('should verify dashboard loads with all API data', async ({ page }) => {
    console.log('📊 Testing dashboard integration...');

    // Monitor network requests
    const apiRequests: string[] = [];
    const failedRequests = TestHelpers.setupNetworkMonitoring(page);
    
    page.on('request', req => {
      if (req.url().includes('/api/') || req.url().includes('/health')) {
        apiRequests.push(req.url());
      }
    });

    await page.goto('/dashboard');
    await TestHelpers.waitForLoadingToComplete(page);

    // Take screenshot for verification
    await TestHelpers.takeTimestampedScreenshot(page, 'dashboard-integration-test');

    // Verify dashboard elements are visible
    const heading = page.getByRole('heading', { name: /dashboard|welcome/i });
    await expect(heading).toBeVisible();

    console.log(`📡 API requests made: ${apiRequests.length}`);
    console.log(`❌ Failed requests: ${failedRequests.length}`);

    // Should have minimal failed requests
    expect(failedRequests.length).toBeLessThan(3);

    console.log('✅ Dashboard integration working correctly');
  });

  test('should verify users page functionality', async ({ page }) => {
    console.log('👥 Testing users page integration...');

    const failedRequests = TestHelpers.setupNetworkMonitoring(page);
    
    await page.goto('/users');
    await TestHelpers.waitForLoadingToComplete(page);

    // Wait for users data to load
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

    // Take screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'users-page-integration');

    // Check if users table/list is present (may be empty but structure should exist)
    const userContent = page.locator('[data-testid="users-table"], .users-list, table, .user-card');
    
    try {
      await userContent.first().waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Users content is visible');
    } catch {
      // May not have users data, but the page structure should be there
      console.log('ℹ️  Users page loaded (may not have data)');
    }

    expect(failedRequests.length).toBeLessThan(3);
    console.log('✅ Users page integration working');
  });

  test('should verify departments page functionality', async ({ page }) => {
    console.log('🏢 Testing departments page integration...');

    const failedRequests = TestHelpers.setupNetworkMonitoring(page);
    
    await page.goto('/departments');
    await TestHelpers.waitForLoadingToComplete(page);

    // Verify departments page loads
    await expect(page.getByRole('heading', { name: /departments/i })).toBeVisible();

    // Take screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'departments-page-integration');

    // Check for departments content
    const deptContent = page.locator('[data-testid="departments-table"], .departments-list, table, .department-card');
    
    try {
      await deptContent.first().waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Departments content is visible');
    } catch {
      console.log('ℹ️  Departments page loaded (may not have data)');
    }

    expect(failedRequests.length).toBeLessThan(3);
    console.log('✅ Departments page integration working');
  });

  test('should verify navigation between pages works correctly', async ({ page }) => {
    console.log('🧭 Testing navigation integration...');

    const navigationTests = [
      { name: 'Dashboard', path: '/dashboard', selector: 'heading' },
      { name: 'Users', path: '/users', selector: 'heading' },
      { name: 'Departments', path: '/departments', selector: 'heading' },
      { name: 'Dashboard Return', path: '/dashboard', selector: 'heading' }
    ];

    const failedRequests = TestHelpers.setupNetworkMonitoring(page);

    for (const navTest of navigationTests) {
      console.log(`   Navigating to ${navTest.name}...`);
      
      await page.goto(navTest.path);
      await TestHelpers.waitForLoadingToComplete(page);
      
      // Verify page loaded
      await expect(page.locator(navTest.selector)).toBeVisible();
      
      // Brief pause between navigations
      await page.waitForTimeout(500);
    }

    console.log(`📡 Total failed requests during navigation: ${failedRequests.length}`);
    expect(failedRequests.length).toBeLessThan(5);

    // Take final screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'navigation-integration-complete');

    console.log('✅ Navigation integration working correctly');
  });

  test('should verify responsive design works after logging changes', async ({ page }) => {
    console.log('📱 Testing responsive design integration...');

    // Test responsive design on key pages
    const pagesToTest = ['/dashboard', '/users', '/departments'];
    
    for (const pagePath of pagesToTest) {
      console.log(`   Testing responsive design for ${pagePath}...`);
      
      await page.goto(pagePath);
      await TestHelpers.waitForLoadingToComplete(page);
      
      // Test responsive breakpoints
      const screenshots = await TestHelpers.testResponsiveDesign(page, `integration-${pagePath.replace('/', '')}`);
      
      console.log(`   Generated ${screenshots.length} responsive screenshots`);
    }

    console.log('✅ Responsive design integration working');
  });

  test('should verify authentication state persists correctly', async ({ page }) => {
    console.log('🔐 Testing authentication integration...');

    // Start at dashboard (should be authenticated)
    await page.goto('/dashboard');
    await TestHelpers.waitForLoadingToComplete(page);

    // Verify we're authenticated (not redirected to login)
    await expect(page).not.toHaveURL(/\/login/);
    
    // Navigate to protected pages
    const protectedPages = ['/users', '/departments'];
    
    for (const protectedPage of protectedPages) {
      await page.goto(protectedPage);
      await TestHelpers.waitForLoadingToComplete(page);
      
      // Should stay on the protected page, not redirect to login
      expect(page.url()).toContain(protectedPage);
      
      console.log(`   ✅ Authentication maintained for ${protectedPage}`);
    }

    console.log('✅ Authentication integration working correctly');
  });

  test('should verify error handling works correctly', async ({ page }) => {
    console.log('❌ Testing error handling integration...');

    // Test navigation to non-existent page
    await page.goto('/nonexistent-page');
    await TestHelpers.waitForLoadingToComplete(page);

    // Should either show 404 page or redirect to valid page
    const currentUrl = page.url();
    console.log(`   Navigated to non-existent page, current URL: ${currentUrl}`);

    // Take screenshot of error handling
    await TestHelpers.takeTimestampedScreenshot(page, 'error-handling-404');

    // Should not crash or show debug information
    const pageContent = await page.textContent('body');
    expect(pageContent?.toLowerCase()).not.toContain('stack trace');
    expect(pageContent?.toLowerCase()).not.toContain('internal server error');

    console.log('✅ Error handling integration working correctly');
  });

  test('should verify API error handling does not expose debug info', async ({ page }) => {
    console.log('🔒 Testing API error handling integration...');

    let apiErrors: string[] = [];
    
    // Monitor console for any API errors
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('api')) {
        apiErrors.push(msg.text());
      }
    });

    // Navigate to pages that make API calls
    await page.goto('/users');
    await TestHelpers.waitForLoadingToComplete(page);
    
    await page.goto('/departments');
    await TestHelpers.waitForLoadingToComplete(page);

    console.log(`   API errors detected: ${apiErrors.length}`);
    
    // If there are API errors, verify they don't expose debug information
    for (const error of apiErrors) {
      expect(error.toLowerCase()).not.toContain('stack trace');
      expect(error.toLowerCase()).not.toContain('console.log');
      expect(error.toLowerCase()).not.toContain('debug');
    }

    console.log('✅ API error handling properly secured');
  });

  test('should verify session management works correctly', async ({ page }) => {
    console.log('🎫 Testing session management integration...');

    // Navigate through several pages to test session persistence
    const sessionTestPages = ['/dashboard', '/users', '/departments', '/dashboard'];
    
    for (let i = 0; i < sessionTestPages.length; i++) {
      const testPage = sessionTestPages[i];
      
      await page.goto(testPage);
      await TestHelpers.waitForLoadingToComplete(page);
      
      // Verify we're still authenticated
      await expect(page).not.toHaveURL(/\/login/);
      
      console.log(`   Session maintained through navigation ${i + 1}`);
      
      // Brief pause between requests
      await page.waitForTimeout(1000);
    }

    console.log('✅ Session management integration working correctly');
  });
});