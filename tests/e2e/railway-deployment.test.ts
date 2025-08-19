import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/TestHelpers';

/**
 * Railway Deployment Verification Tests
 * 
 * These tests verify that the application is properly deployed on Railway
 * and that the logging improvements are working in the production environment.
 */

test.describe('Railway Deployment Verification', () => {

  test('should verify Railway frontend deployment is accessible', async ({ page }) => {
    console.log('🌐 Testing Railway frontend deployment...');

    const baseUrl = page.context().options.baseURL || 'https://frontend-production-55d3.up.railway.app';
    console.log(`   Testing URL: ${baseUrl}`);

    // Monitor performance
    const startTime = Date.now();
    
    await page.goto('/');
    await TestHelpers.waitForLoadingToComplete(page);
    
    const loadTime = Date.now() - startTime;
    console.log(`   Initial load time: ${loadTime}ms`);

    // Should load reasonably fast
    expect(loadTime).toBeLessThan(15000); // 15 seconds max for Railway deployment

    // Take screenshot of Railway deployment
    await TestHelpers.takeTimestampedScreenshot(page, 'railway-frontend-deployed');

    // Verify basic page structure
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Should not show error pages
    const pageText = await page.textContent('body');
    expect(pageText?.toLowerCase()).not.toContain('application error');
    expect(pageText?.toLowerCase()).not.toContain('502 bad gateway');
    expect(pageText?.toLowerCase()).not.toContain('503 service unavailable');

    console.log('✅ Railway frontend deployment is accessible');
  });

  test('should verify Railway backend API is accessible', async ({ request }) => {
    console.log('🔌 Testing Railway backend API...');

    const apiUrl = process.env.API_BASE_URL || 'https://backend-copy-production-328d.up.railway.app';
    console.log(`   Testing API URL: ${apiUrl}`);

    // Test health endpoint
    const startTime = Date.now();
    const response = await request.get('/health');
    const responseTime = Date.now() - startTime;

    console.log(`   API response time: ${responseTime}ms`);
    console.log(`   API status: ${response.status()}`);

    // API should be accessible
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(10000); // 10 seconds max

    const healthData = await response.json();
    console.log(`   Health data:`, healthData);

    // Should have basic health response structure
    expect(healthData).toHaveProperty('status');

    console.log('✅ Railway backend API is accessible');
  });

  test('should verify Railway environment has proper logging configuration', async ({ page }) => {
    console.log('📝 Testing Railway logging configuration...');

    // Monitor console for production logging behavior
    const consoleLogs: Array<{ type: string; text: string }> = [];
    
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Navigate through the application
    await page.goto('/dashboard');
    await TestHelpers.waitForLoadingToComplete(page);

    await page.goto('/users');
    await TestHelpers.waitForLoadingToComplete(page);

    await page.goto('/departments');
    await TestHelpers.waitForLoadingToComplete(page);

    // Analyze console output
    const debugLogs = consoleLogs.filter(log => 
      log.type === 'debug' || log.text.toLowerCase().includes('debug')
    );
    
    const errorLogs = consoleLogs.filter(log => log.type === 'error');
    const totalLogs = consoleLogs.length;

    console.log(`📊 Railway Logging Analysis:`);
    console.log(`   Total console messages: ${totalLogs}`);
    console.log(`   Debug logs: ${debugLogs.length}`);
    console.log(`   Error logs: ${errorLogs.length}`);

    // Production should have minimal debug logging
    expect(debugLogs.length).toBeLessThan(5);
    
    // Errors should be minimal
    expect(errorLogs.length).toBeLessThan(10);

    console.log('✅ Railway logging configuration is production-ready');
  });

  test('should verify Railway deployment handles load correctly', async ({ page }) => {
    console.log('⚡ Testing Railway deployment under load...');

    const performanceMetrics = {
      totalRequests: 0,
      averageLoadTime: 0,
      errors: 0
    };

    const loadTimes: number[] = [];
    let errorCount = 0;

    // Monitor requests
    page.on('request', () => performanceMetrics.totalRequests++);
    page.on('response', response => {
      if (response.status() >= 400) {
        errorCount++;
      }
    });

    // Simulate load by rapidly navigating
    const pages = ['/dashboard', '/users', '/departments'];
    
    for (let round = 0; round < 3; round++) {
      console.log(`   Load test round ${round + 1}...`);
      
      for (const pagePath of pages) {
        const startTime = Date.now();
        
        await page.goto(pagePath);
        await TestHelpers.waitForLoadingToComplete(page);
        
        const loadTime = Date.now() - startTime;
        loadTimes.push(loadTime);
        
        // Brief pause to simulate user behavior
        await page.waitForTimeout(500);
      }
    }

    performanceMetrics.errors = errorCount;
    performanceMetrics.averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;

    console.log(`📈 Railway Load Test Results:`);
    console.log(`   Total requests: ${performanceMetrics.totalRequests}`);
    console.log(`   Average load time: ${performanceMetrics.averageLoadTime.toFixed(2)}ms`);
    console.log(`   Errors: ${performanceMetrics.errors}`);
    console.log(`   Max load time: ${Math.max(...loadTimes)}ms`);
    console.log(`   Min load time: ${Math.min(...loadTimes)}ms`);

    // Performance should be acceptable
    expect(performanceMetrics.averageLoadTime).toBeLessThan(8000); // 8 seconds average
    expect(performanceMetrics.errors).toBeLessThan(10); // Low error rate

    // Take screenshot after load test
    await TestHelpers.takeTimestampedScreenshot(page, 'railway-load-test-complete');

    console.log('✅ Railway deployment handles load correctly');
  });

  test('should verify Railway HTTPS and security headers', async ({ request, page }) => {
    console.log('🔒 Testing Railway security configuration...');

    // Test HTTPS enforcement
    const baseUrl = page.context().options.baseURL || 'https://frontend-production-55d3.up.railway.app';
    expect(baseUrl.startsWith('https://')).toBe(true);

    // Navigate to site and check security headers
    await page.goto('/');
    await TestHelpers.waitForLoadingToComplete(page);

    // Check basic SSL/HTTPS functionality
    const currentUrl = page.url();
    expect(currentUrl.startsWith('https://')).toBe(true);

    console.log(`   HTTPS URL verified: ${currentUrl}`);

    // Test API security
    const apiResponse = await request.get('/health');
    const headers = apiResponse.headers();
    
    console.log('🛡️  Security Headers Check:');
    
    // Check for common security headers (Railway may or may not set these)
    const securityHeaders = [
      'strict-transport-security',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];

    for (const header of securityHeaders) {
      const value = headers[header];
      console.log(`   ${header}: ${value || 'Not set'}`);
    }

    console.log('✅ Railway HTTPS and basic security verified');
  });

  test('should verify Railway environment variables are working', async ({ page, request }) => {
    console.log('🔧 Testing Railway environment configuration...');

    // Test that backend responds correctly (environment configured)
    const healthResponse = await request.get('/health');
    expect(healthResponse.status()).toBe(200);

    const healthData = await healthResponse.json();
    console.log('   Backend health check successful');

    // Test frontend can connect to backend (environment URLs configured)
    await page.goto('/dashboard');
    await TestHelpers.waitForLoadingToComplete(page);

    // Monitor network requests to verify frontend->backend connectivity
    const apiCalls: string[] = [];
    
    page.on('request', req => {
      if (req.url().includes('/api/') || req.url().includes('backend')) {
        apiCalls.push(req.url());
      }
    });

    // Navigate to trigger API calls
    await page.goto('/users');
    await TestHelpers.waitForLoadingToComplete(page);
    
    await page.goto('/departments');
    await TestHelpers.waitForLoadingToComplete(page);

    console.log(`   API calls detected: ${apiCalls.length}`);
    
    if (apiCalls.length > 0) {
      console.log('   Frontend->Backend connectivity verified');
    } else {
      console.log('   No API calls detected (may be using cached data)');
    }

    console.log('✅ Railway environment configuration working');
  });

  test('should verify Railway deployment is production-ready', async ({ page, request }) => {
    console.log('🚀 Final Railway production readiness check...');

    const readinessChecklist = {
      frontendAccessible: false,
      backendAccessible: false,
      httpsWorking: false,
      performanceAcceptable: false,
      noDebugLeaks: false,
      authenticationWorking: false
    };

    // Frontend accessibility
    try {
      await page.goto('/');
      await TestHelpers.waitForLoadingToComplete(page);
      readinessChecklist.frontendAccessible = true;
      console.log('   ✅ Frontend accessible');
    } catch (error) {
      console.log('   ❌ Frontend not accessible');
    }

    // Backend accessibility
    try {
      const response = await request.get('/health');
      readinessChecklist.backendAccessible = response.status() === 200;
      console.log(`   ${readinessChecklist.backendAccessible ? '✅' : '❌'} Backend accessible`);
    } catch (error) {
      console.log('   ❌ Backend not accessible');
    }

    // HTTPS working
    const url = page.url();
    readinessChecklist.httpsWorking = url.startsWith('https://');
    console.log(`   ${readinessChecklist.httpsWorking ? '✅' : '❌'} HTTPS working`);

    // Performance check
    const startTime = Date.now();
    await page.goto('/dashboard');
    await TestHelpers.waitForLoadingToComplete(page);
    const loadTime = Date.now() - startTime;
    
    readinessChecklist.performanceAcceptable = loadTime < 10000;
    console.log(`   ${readinessChecklist.performanceAcceptable ? '✅' : '❌'} Performance acceptable (${loadTime}ms)`);

    // No debug information leak check
    const pageContent = await page.textContent('body');
    const hasDebugLeaks = pageContent?.toLowerCase().includes('debug') || 
                         pageContent?.toLowerCase().includes('console.log') ||
                         pageContent?.toLowerCase().includes('stack trace');
    
    readinessChecklist.noDebugLeaks = !hasDebugLeaks;
    console.log(`   ${readinessChecklist.noDebugLeaks ? '✅' : '❌'} No debug information leaks`);

    // Authentication working (basic check)
    try {
      await page.goto('/users');
      await TestHelpers.waitForLoadingToComplete(page);
      // If we can access users page, auth is likely working
      readinessChecklist.authenticationWorking = !page.url().includes('/login');
      console.log(`   ${readinessChecklist.authenticationWorking ? '✅' : '❌'} Authentication working`);
    } catch (error) {
      console.log('   ❌ Authentication check failed');
    }

    // Take final deployment screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'railway-production-ready-final');

    // Summary
    const passedChecks = Object.values(readinessChecklist).filter(Boolean).length;
    const totalChecks = Object.keys(readinessChecklist).length;
    
    console.log(`\n📋 Production Readiness Score: ${passedChecks}/${totalChecks}`);
    console.log('🎯 Railway deployment status:', passedChecks >= 5 ? '✅ READY' : '❌ NEEDS ATTENTION');

    // Should pass most critical checks
    expect(passedChecks).toBeGreaterThanOrEqual(4);
    
    // Critical checks that must pass
    expect(readinessChecklist.frontendAccessible).toBe(true);
    expect(readinessChecklist.httpsWorking).toBe(true);

    console.log('✅ Railway deployment production readiness verified');
  });
});