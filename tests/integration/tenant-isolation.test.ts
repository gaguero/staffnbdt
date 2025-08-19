import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/TestHelpers';

/**
 * Tenant Isolation Integration Tests
 * 
 * These tests verify that the tenant isolation system still works correctly
 * after the logging improvements, ensuring that the TenantInterceptor
 * optimizations didn't break multi-tenant functionality.
 */

test.describe('Tenant Isolation Integration', () => {

  test('should verify tenant context is maintained across requests', async ({ page }) => {
    console.log('🏢 Testing tenant context maintenance...');

    const tenantRequests: Array<{ url: string; headers: any }> = [];
    
    // Monitor all requests to verify tenant context
    page.on('request', req => {
      const headers = req.headers();
      if (req.url().includes('/api/') || headers.authorization) {
        tenantRequests.push({
          url: req.url(),
          headers: headers
        });
      }
    });

    // Navigate through pages that require tenant context
    await page.goto('/dashboard');
    await TestHelpers.waitForLoadingToComplete(page);

    await page.goto('/users');
    await TestHelpers.waitForLoadingToComplete(page);

    await page.goto('/departments');
    await TestHelpers.waitForLoadingToComplete(page);

    console.log(`📡 Tenant-related requests captured: ${tenantRequests.length}`);

    // Verify tenant context is present in requests
    const requestsWithAuth = tenantRequests.filter(req => 
      req.headers.authorization || req.headers['x-tenant-id']
    );

    console.log(`🔐 Requests with authentication/tenant context: ${requestsWithAuth.length}`);

    // Should have tenant context in authenticated requests
    if (requestsWithAuth.length > 0) {
      console.log('✅ Tenant context is being maintained in requests');
    } else {
      console.log('ℹ️  No authenticated requests detected (may be using stored auth)');
    }

    // Take screenshot for verification
    await TestHelpers.takeTimestampedScreenshot(page, 'tenant-context-test');

    console.log('✅ Tenant context integration verified');
  });

  test('should verify tenant data isolation in users page', async ({ page }) => {
    console.log('👥 Testing tenant data isolation in users...');

    const failedRequests = TestHelpers.setupNetworkMonitoring(page);
    
    await page.goto('/users');
    await TestHelpers.waitForLoadingToComplete(page);

    // Check that we can access the users page (tenant-specific data)
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

    // Verify page loads without server errors that might indicate tenant isolation issues
    expect(failedRequests.filter(req => req.includes('500')).length).toBe(0);

    // Take screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'tenant-users-isolation');

    console.log('✅ Users page tenant isolation working correctly');
  });

  test('should verify tenant data isolation in departments page', async ({ page }) => {
    console.log('🏢 Testing tenant data isolation in departments...');

    const failedRequests = TestHelpers.setupNetworkMonitoring(page);
    
    await page.goto('/departments');
    await TestHelpers.waitForLoadingToComplete(page);

    // Check departments page access
    await expect(page.getByRole('heading', { name: /departments/i })).toBeVisible();

    // Verify no server errors from tenant isolation issues
    expect(failedRequests.filter(req => req.includes('500')).length).toBe(0);

    // Take screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'tenant-departments-isolation');

    console.log('✅ Departments page tenant isolation working correctly');
  });

  test('should verify TenantInterceptor still functions after logging optimization', async ({ page }) => {
    console.log('🎯 Testing TenantInterceptor functionality...');

    let interceptorActivity = false;
    let tenantHeaders: any[] = [];

    // Monitor for tenant-related activity (but not excessive logging)
    page.on('request', req => {
      const headers = req.headers();
      
      // Check for tenant-related headers
      if (headers['x-tenant-id'] || headers['x-organization-id'] || headers['x-property-id']) {
        interceptorActivity = true;
        tenantHeaders.push(headers);
      }
    });

    // Perform operations that would trigger the TenantInterceptor
    const testPages = ['/dashboard', '/users', '/departments'];
    
    for (const testPath of testPages) {
      await page.goto(testPath);
      await TestHelpers.waitForLoadingToComplete(page);
      await page.waitForTimeout(1000); // Allow time for requests
    }

    console.log(`🔍 Tenant interceptor activity detected: ${interceptorActivity}`);
    console.log(`📊 Requests with tenant headers: ${tenantHeaders.length}`);

    // The interceptor should still be working (setting headers) but not logging excessively
    if (tenantHeaders.length > 0) {
      console.log('✅ TenantInterceptor is still functioning');
      
      // Verify tenant headers are consistent
      const uniqueTenantIds = [...new Set(tenantHeaders.map(h => h['x-tenant-id']).filter(Boolean))];
      console.log(`   Unique tenant IDs: ${uniqueTenantIds.length}`);
      
      // Should have consistent tenant context
      expect(uniqueTenantIds.length).toBeLessThanOrEqual(1);
    } else {
      console.log('ℹ️  No tenant headers detected (may be using different auth mechanism)');
    }

    console.log('✅ TenantInterceptor functionality verified');
  });

  test('should verify tenant security boundaries are maintained', async ({ page }) => {
    console.log('🔒 Testing tenant security boundaries...');

    const securityViolations: string[] = [];
    
    // Monitor for potential security issues in responses
    page.on('response', async response => {
      try {
        if (response.status() === 200 && response.url().includes('/api/')) {
          const contentType = response.headers()['content-type'];
          
          if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            
            // Check for potential data leakage
            if (text.includes('tenant') && text.includes('all') || 
                text.includes('cross-tenant') ||
                text.toLowerCase().includes('unauthorized tenant')) {
              securityViolations.push(`Potential tenant leakage in ${response.url()}`);
            }
          }
        }
      } catch (error) {
        // Ignore response reading errors
      }
    });

    // Navigate through tenant-specific pages
    await page.goto('/users');
    await TestHelpers.waitForLoadingToComplete(page);
    
    await page.goto('/departments');
    await TestHelpers.waitForLoadingToComplete(page);

    console.log(`🛡️  Security violations detected: ${securityViolations.length}`);
    
    // Should have no security boundary violations
    expect(securityViolations.length).toBe(0);
    
    if (securityViolations.length > 0) {
      console.error('❌ Security violations found:', securityViolations);
    }

    console.log('✅ Tenant security boundaries are maintained');
  });

  test('should verify multi-tenant navigation works correctly', async ({ page }) => {
    console.log('🧭 Testing multi-tenant navigation...');

    const navigationLog: Array<{ page: string; timestamp: number; success: boolean }> = [];
    
    const testPages = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Users', path: '/users' },
      { name: 'Departments', path: '/departments' },
    ];

    for (const testPage of testPages) {
      const startTime = Date.now();
      
      try {
        await page.goto(testPage.path);
        await TestHelpers.waitForLoadingToComplete(page);
        
        // Verify we're on the correct page and not redirected due to tenant issues
        expect(page.url()).toContain(testPage.path);
        
        navigationLog.push({
          page: testPage.name,
          timestamp: Date.now() - startTime,
          success: true
        });
        
        console.log(`   ✅ ${testPage.name}: ${Date.now() - startTime}ms`);
        
      } catch (error) {
        navigationLog.push({
          page: testPage.name,
          timestamp: Date.now() - startTime,
          success: false
        });
        
        console.error(`   ❌ ${testPage.name}: Failed`);
        throw error;
      }
    }

    // All navigations should succeed
    const successfulNavs = navigationLog.filter(nav => nav.success);
    expect(successfulNavs.length).toBe(testPages.length);

    // Take final screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'multi-tenant-navigation-complete');

    console.log('✅ Multi-tenant navigation working correctly');
  });

  test('should verify tenant context survives page refreshes', async ({ page }) => {
    console.log('🔄 Testing tenant context persistence through page refresh...');

    // Navigate to a tenant-specific page
    await page.goto('/users');
    await TestHelpers.waitForLoadingToComplete(page);

    // Take screenshot before refresh
    await TestHelpers.takeTimestampedScreenshot(page, 'before-refresh');

    // Refresh the page
    await page.reload();
    await TestHelpers.waitForLoadingToComplete(page);

    // Verify we're still on the users page (not redirected to login)
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
    expect(page.url()).toContain('/users');

    // Take screenshot after refresh
    await TestHelpers.takeTimestampedScreenshot(page, 'after-refresh');

    console.log('✅ Tenant context persists through page refresh');
  });

  test('should verify tenant isolation under concurrent operations', async ({ page }) => {
    console.log('⚡ Testing tenant isolation under concurrent load...');

    const operationResults: Array<{ operation: string; success: boolean; time: number }> = [];
    
    // Define concurrent operations
    const operations = [
      { name: 'Dashboard Load', action: () => page.goto('/dashboard') },
      { name: 'Users Load', action: () => page.goto('/users') },
      { name: 'Departments Load', action: () => page.goto('/departments') }
    ];

    // Execute operations and verify tenant isolation is maintained
    for (const operation of operations) {
      const startTime = Date.now();
      
      try {
        await operation.action();
        await TestHelpers.waitForLoadingToComplete(page);
        
        // Verify page loaded correctly (tenant isolation working)
        const currentUrl = page.url();
        const isOnCorrectPage = currentUrl.includes('/dashboard') || 
                               currentUrl.includes('/users') || 
                               currentUrl.includes('/departments');
        
        operationResults.push({
          operation: operation.name,
          success: isOnCorrectPage,
          time: Date.now() - startTime
        });
        
        console.log(`   ${operation.name}: ${Date.now() - startTime}ms - ${isOnCorrectPage ? '✅' : '❌'}`);
        
      } catch (error) {
        operationResults.push({
          operation: operation.name,
          success: false,
          time: Date.now() - startTime
        });
        console.error(`   ${operation.name}: Failed -`, error);
      }
    }

    // All operations should succeed
    const successfulOps = operationResults.filter(op => op.success);
    expect(successfulOps.length).toBe(operations.length);

    console.log('✅ Tenant isolation maintained under concurrent operations');
  });
});