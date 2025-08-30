import { test, expect, Page } from '@playwright/test';
import { LoginPage } from './utils/LoginPage';
import { TestHelpers } from './utils/TestHelpers';

/**
 * Comprehensive test of Roberto Martinez's Platform Admin permissions
 * Tests all hotel operations that were previously failing with 403 errors
 */

// Roberto's credentials
const ROBERTO_EMAIL = 'roberto.martinez@nayararesorts.com';
const ROBERTO_PASSWORD = 'password123';

test.describe('Roberto Martinez Platform Admin Permissions', () => {
  let page: Page;
  let loginPage: LoginPage;
  let consoleErrors: string[] = [];
  let failedRequests: string[] = [];

  test.beforeEach(async ({ browser }) => {
    // Create a fresh context for each test
    const context = await browser.newContext({
      // Clear any existing storage
      storageState: undefined,
    });
    
    page = await context.newPage();
    loginPage = new LoginPage(page);

    // Set up error monitoring
    consoleErrors = [];
    failedRequests = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        const errorInfo = `${response.status()} - ${response.url()}`;
        failedRequests.push(errorInfo);
        console.log(`❌ Failed Request: ${errorInfo}`);
      }
    });
  });

  test.afterEach(async () => {
    await page?.close();
  });

  test('1. Login as Roberto Martinez and access dashboard', async () => {
    console.log('🔐 Testing Roberto Martinez login and dashboard access...');
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await TestHelpers.takeTimestampedScreenshot(page, 'roberto-01-login-page');
    
    // Verify login page is accessible
    await loginPage.verifyOnLoginPage();
    
    // Login as Roberto
    await loginPage.login(ROBERTO_EMAIL, ROBERTO_PASSWORD);
    
    // Take screenshot of successful login
    await TestHelpers.takeTimestampedScreenshot(page, 'roberto-02-dashboard-loaded');
    
    // Verify successful login and dashboard access
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Wait for dashboard to fully load
    await TestHelpers.waitForLoadingToComplete(page);
    
    // Verify no console errors during login
    expect(consoleErrors.filter(e => !e.includes('DevTools'))).toHaveLength(0);
    
    // Verify no failed requests during login
    expect(failedRequests.filter(r => r.includes('403'))).toHaveLength(0);
    
    console.log('✅ Roberto login and dashboard access successful');
  });

  test('2. Test navigation menu access - no 403 errors', async () => {
    console.log('🧭 Testing navigation menu access...');
    
    // Login first
    await page.goto('/login');
    await loginPage.login(ROBERTO_EMAIL, ROBERTO_PASSWORD);
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await TestHelpers.waitForLoadingToComplete(page);
    
    // Clear error arrays
    consoleErrors.length = 0;
    failedRequests.length = 0;
    
    // Test main navigation items
    const navigationItems = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Users', path: '/users' },
      { name: 'Organizations', path: '/organizations' },
      { name: 'Properties', path: '/properties' },
      { name: 'Departments', path: '/departments' },
      { name: 'Roles', path: '/roles' },
    ];
    
    for (const item of navigationItems) {
      console.log(`Testing navigation to ${item.name}...`);
      
      // Navigate to the page
      await page.goto(item.path);
      await TestHelpers.waitForLoadingToComplete(page);
      
      // Take screenshot
      await TestHelpers.takeTimestampedScreenshot(page, `roberto-03-nav-${item.name.toLowerCase()}`);
      
      // Verify no 403 errors for this page
      const page403Errors = failedRequests.filter(r => r.includes('403') && r.includes(item.path));
      expect(page403Errors).toHaveLength(0);
      
      // Verify page loaded successfully (no generic error page)
      const hasErrorMessage = await page.locator('[role="alert"], .error-message, .alert-error').isVisible();
      expect(hasErrorMessage).toBe(false);
    }
    
    console.log('✅ All navigation menu items accessible without 403 errors');
  });

  test('3. Test hotel operations - Units/Rooms management', async () => {
    console.log('🏨 Testing Units/Rooms management access...');
    
    // Login first
    await page.goto('/login');
    await loginPage.login(ROBERTO_EMAIL, ROBERTO_PASSWORD);
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Clear error arrays
    consoleErrors.length = 0;
    failedRequests.length = 0;
    
    // Navigate to units/rooms page
    await page.goto('/units');
    await TestHelpers.waitForLoadingToComplete(page);
    
    // Take screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'roberto-04-units-page');
    
    // Verify no 403 errors
    const units403Errors = failedRequests.filter(r => r.includes('403') && r.includes('unit'));
    expect(units403Errors).toHaveLength(0);
    
    // Verify page loaded successfully
    const hasUnitsContent = await page.locator('h1, h2, h3').filter({ hasText: /units|rooms/i }).isVisible();
    expect(hasUnitsContent).toBe(true);
    
    // Test units API endpoint
    try {
      await page.goto('/api/units');
      await page.waitForLoadState('networkidle');
      // Should not get 403, might get redirect or JSON response
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('403');
    } catch (error) {
      // API endpoint might redirect, that's okay as long as it's not 403
      console.log('Units API test completed (redirect is acceptable)');
    }
    
    console.log('✅ Units/Rooms management access successful');
  });

  test('4. Test hotel operations - Guests management', async () => {
    console.log('👥 Testing Guests management access...');
    
    // Login first
    await page.goto('/login');
    await loginPage.login(ROBERTO_EMAIL, ROBERTO_PASSWORD);
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Clear error arrays
    consoleErrors.length = 0;
    failedRequests.length = 0;
    
    // Navigate to guests page
    await page.goto('/guests');
    await TestHelpers.waitForLoadingToComplete(page);
    
    // Take screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'roberto-05-guests-page');
    
    // Verify no 403 errors
    const guests403Errors = failedRequests.filter(r => r.includes('403') && r.includes('guest'));
    expect(guests403Errors).toHaveLength(0);
    
    // Verify page loaded successfully
    const hasGuestsContent = await page.locator('h1, h2, h3').filter({ hasText: /guests/i }).isVisible();
    expect(hasGuestsContent).toBe(true);
    
    console.log('✅ Guests management access successful');
  });

  test('5. Test hotel operations - Reservations page', async () => {
    console.log('📅 Testing Reservations page access...');
    
    // Login first
    await page.goto('/login');
    await loginPage.login(ROBERTO_EMAIL, ROBERTO_PASSWORD);
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Clear error arrays
    consoleErrors.length = 0;
    failedRequests.length = 0;
    
    // Navigate to reservations page
    await page.goto('/reservations');
    await TestHelpers.waitForLoadingToComplete(page);
    
    // Take screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'roberto-06-reservations-page');
    
    // Verify no 403 errors
    const reservations403Errors = failedRequests.filter(r => r.includes('403') && r.includes('reservation'));
    expect(reservations403Errors).toHaveLength(0);
    
    // Verify page loaded successfully
    const hasReservationsContent = await page.locator('h1, h2, h3').filter({ hasText: /reservations/i }).isVisible();
    expect(hasReservationsContent).toBe(true);
    
    console.log('✅ Reservations page access successful');
  });

  test('6. Test roles management page - previously broken', async () => {
    console.log('👤 Testing Roles management page...');
    
    // Login first
    await page.goto('/login');
    await loginPage.login(ROBERTO_EMAIL, ROBERTO_PASSWORD);
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Clear error arrays
    consoleErrors.length = 0;
    failedRequests.length = 0;
    
    // Navigate to roles page
    await page.goto('/roles');
    await TestHelpers.waitForLoadingToComplete(page);
    
    // Take screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'roberto-07-roles-page');
    
    // Verify no 403 errors
    const roles403Errors = failedRequests.filter(r => r.includes('403') && r.includes('role'));
    expect(roles403Errors).toHaveLength(0);
    
    // Verify page loaded successfully
    const hasRolesContent = await page.locator('h1, h2, h3').filter({ hasText: /roles/i }).isVisible();
    expect(hasRolesContent).toBe(true);
    
    console.log('✅ Roles management page access successful');
  });

  test('7. Test dashboard statistics - no loading errors', async () => {
    console.log('📊 Testing dashboard statistics loading...');
    
    // Login first
    await page.goto('/login');
    await loginPage.login(ROBERTO_EMAIL, ROBERTO_PASSWORD);
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Clear error arrays
    consoleErrors.length = 0;
    failedRequests.length = 0;
    
    // Wait for dashboard to fully load including statistics
    await TestHelpers.waitForLoadingToComplete(page);
    await page.waitForTimeout(3000); // Give extra time for stats to load
    
    // Take screenshot of dashboard with stats
    await TestHelpers.takeTimestampedScreenshot(page, 'roberto-08-dashboard-stats');
    
    // Verify no 403 errors during stats loading
    const stats403Errors = failedRequests.filter(r => r.includes('403'));
    expect(stats403Errors).toHaveLength(0);
    
    // Verify no console errors related to permission
    const permissionErrors = consoleErrors.filter(e => 
      e.toLowerCase().includes('permission') || 
      e.toLowerCase().includes('403') || 
      e.toLowerCase().includes('forbidden')
    );
    expect(permissionErrors).toHaveLength(0);
    
    console.log('✅ Dashboard statistics loaded without permission errors');
  });

  test('8. Test responsive design - mobile viewport', async () => {
    console.log('📱 Testing responsive design on mobile viewport...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login first
    await page.goto('/login');
    await loginPage.login(ROBERTO_EMAIL, ROBERTO_PASSWORD);
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await TestHelpers.waitForLoadingToComplete(page);
    
    // Take mobile screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'roberto-09-mobile-dashboard');
    
    // Test navigation on mobile
    await page.goto('/users');
    await TestHelpers.waitForLoadingToComplete(page);
    await TestHelpers.takeTimestampedScreenshot(page, 'roberto-10-mobile-users');
    
    // Verify no layout issues causing errors
    const bodyRect = await page.locator('body').boundingBox();
    expect(bodyRect?.width).toBeLessThanOrEqual(375);
    
    console.log('✅ Mobile viewport testing completed successfully');
  });

  test('9. Comprehensive permission verification', async () => {
    console.log('🔐 Running comprehensive permission verification...');
    
    // Login first
    await page.goto('/login');
    await loginPage.login(ROBERTO_EMAIL, ROBERTO_PASSWORD);
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Clear error arrays for clean test
    consoleErrors.length = 0;
    failedRequests.length = 0;
    
    // Test all critical hotel operations pages
    const criticalPages = [
      '/dashboard',
      '/users',
      '/organizations', 
      '/properties',
      '/departments',
      '/roles',
      '/units',
      '/guests',
      '/reservations',
      '/reports',
      '/settings'
    ];
    
    const pageResults = [];
    
    for (const pagePath of criticalPages) {
      console.log(`Testing ${pagePath}...`);
      
      try {
        await page.goto(pagePath);
        await TestHelpers.waitForLoadingToComplete(page);
        
        // Check for 403 errors
        const page403s = failedRequests.filter(r => r.includes('403'));
        const hasPermissionError = await page.locator('.error, [role="alert"]').filter({ hasText: /permission|forbidden|403/i }).isVisible();
        
        pageResults.push({
          page: pagePath,
          accessible: page403s.length === 0 && !hasPermissionError,
          errors: page403s
        });
        
      } catch (error) {
        pageResults.push({
          page: pagePath,
          accessible: false,
          errors: [`Navigation error: ${error.message}`]
        });
      }
    }
    
    // Take final screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'roberto-11-final-verification');
    
    // Generate comprehensive report
    console.log('\n=== ROBERTO MARTINEZ PERMISSION VERIFICATION REPORT ===');
    pageResults.forEach(result => {
      const status = result.accessible ? '✅' : '❌';
      console.log(`${status} ${result.page}`);
      if (!result.accessible && result.errors.length > 0) {
        result.errors.forEach(error => console.log(`    Error: ${error}`));
      }
    });
    
    // Verify all pages are accessible
    const inaccessiblePages = pageResults.filter(r => !r.accessible);
    expect(inaccessiblePages).toHaveLength(0);
    
    console.log('\n✅ ALL PAGES ACCESSIBLE - Roberto has full Platform Admin access');
  });

  test('10. Final console and network validation', async () => {
    console.log('🔍 Running final console and network validation...');
    
    // Login and navigate through system
    await page.goto('/login');
    await loginPage.login(ROBERTO_EMAIL, ROBERTO_PASSWORD);
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Clear arrays for clean final test
    consoleErrors.length = 0;
    failedRequests.length = 0;
    
    // Navigate through key areas to trigger any remaining permission issues
    const testFlow = ['/dashboard', '/users', '/organizations', '/units', '/guests', '/reservations'];
    
    for (const path of testFlow) {
      await page.goto(path);
      await TestHelpers.waitForLoadingToComplete(page);
      await page.waitForTimeout(1000); // Allow any async operations to complete
    }
    
    // Take final screenshot of clean state
    await TestHelpers.takeTimestampedScreenshot(page, 'roberto-12-final-clean-state');
    
    // Final validation
    const final403Errors = failedRequests.filter(r => r.includes('403'));
    const finalPermissionConsoleErrors = consoleErrors.filter(e => 
      e.toLowerCase().includes('permission') || 
      e.toLowerCase().includes('403') || 
      e.toLowerCase().includes('forbidden')
    );
    
    // Report final results
    console.log('\n=== FINAL VALIDATION RESULTS ===');
    console.log(`Total 403 errors: ${final403Errors.length}`);
    console.log(`Permission-related console errors: ${finalPermissionConsoleErrors.length}`);
    
    if (final403Errors.length > 0) {
      console.log('❌ Remaining 403 errors:');
      final403Errors.forEach(error => console.log(`  ${error}`));
    }
    
    if (finalPermissionConsoleErrors.length > 0) {
      console.log('❌ Remaining console errors:');
      finalPermissionConsoleErrors.forEach(error => console.log(`  ${error}`));
    }
    
    // Assertions for final validation
    expect(final403Errors).toHaveLength(0);
    expect(finalPermissionConsoleErrors).toHaveLength(0);
    
    console.log('✅ FINAL VALIDATION PASSED - Roberto has full Platform Admin permissions with zero errors');
  });
});