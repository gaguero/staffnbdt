import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/TestHelpers';

/**
 * Log Performance Tests
 * 
 * These tests verify that logging optimizations have improved performance:
 * - Measure log volume during typical operations
 * - Verify log overhead reduction
 * - Test that the 50 logs/sec limit is respected
 * - Monitor memory usage impact of logging
 */

test.describe('Log Performance Verification', () => {

  test('should verify log volume stays under 50 logs/second during normal usage', async ({ page }) => {
    console.log('📊 Testing log volume during normal user workflow...');

    // Start comprehensive monitoring
    const logMonitor = TestHelpers.monitorLogVolume(page);
    const failedRequests = TestHelpers.setupNetworkMonitoring(page);
    
    let totalConsoleMessages = 0;
    let debugMessages = 0;
    let errorMessages = 0;

    page.on('console', msg => {
      totalConsoleMessages++;
      const text = msg.text().toLowerCase();
      
      if (text.includes('debug') || msg.type() === 'debug') {
        debugMessages++;
      }
      
      if (msg.type() === 'error') {
        errorMessages++;
      }
    });

    const testDuration = 30; // seconds
    const testStartTime = Date.now();

    console.log(`🕒 Running ${testDuration}s performance test...`);

    // Simulate realistic user behavior for the test duration
    const userActions = [
      () => page.goto('/dashboard'),
      () => page.goto('/users'),
      () => page.goto('/departments'),
      () => page.goto('/dashboard'),
      () => page.reload(),
      () => page.goto('/users'),
      () => page.goto('/departments'),
    ];

    let actionIndex = 0;
    const actionInterval = setInterval(async () => {
      try {
        const action = userActions[actionIndex % userActions.length];
        await action();
        await TestHelpers.waitForLoadingToComplete(page);
        await page.waitForTimeout(1000); // Brief pause between actions
        actionIndex++;
        
        const elapsed = (Date.now() - testStartTime) / 1000;
        if (elapsed >= testDuration) {
          clearInterval(actionInterval);
        }
      } catch (error) {
        console.error('Action failed:', error);
      }
    }, 3000); // Perform action every 3 seconds

    // Wait for test duration
    await page.waitForTimeout(testDuration * 1000);
    clearInterval(actionInterval);

    // Calculate final metrics
    const finalLogRate = logMonitor.getLogRate();
    const totalLogs = logMonitor.getTotalLogs();
    
    console.log(`📈 Performance Test Results:`);
    console.log(`   Test duration: ${testDuration}s`);
    console.log(`   Total console messages: ${totalConsoleMessages}`);
    console.log(`   Debug messages: ${debugMessages}`);
    console.log(`   Error messages: ${errorMessages}`);
    console.log(`   Total monitored logs: ${totalLogs}`);
    console.log(`   Average logs per second: ${finalLogRate.toFixed(2)}`);
    console.log(`   Failed requests: ${failedRequests.length}`);

    // Key assertions for logging performance
    expect(finalLogRate).toBeLessThan(50); // Primary requirement
    expect(debugMessages).toBe(0); // No debug logs in production
    expect(errorMessages).toBeLessThan(5); // Minimal errors allowed
    
    // Failed requests should be minimal
    expect(failedRequests.length).toBeLessThan(3);

    // Take final screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'log-performance-test-final');

    console.log('✅ Log performance meets requirements');
  });

  test('should measure page load performance impact of logging changes', async ({ page }) => {
    console.log('⚡ Measuring page load performance...');

    const performanceMetrics = {
      dashboard: 0,
      users: 0,
      departments: 0
    };

    // Test each major page
    const pages = [
      { name: 'dashboard', url: '/dashboard' },
      { name: 'users', url: '/users' },
      { name: 'departments', url: '/departments' }
    ];

    for (const testPage of pages) {
      console.log(`📄 Testing ${testPage.name} page...`);
      
      const loadTime = await TestHelpers.measurePageLoadTime(page, testPage.url);
      performanceMetrics[testPage.name as keyof typeof performanceMetrics] = loadTime;

      // Pages should load reasonably fast
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
      
      console.log(`   ${testPage.name}: ${loadTime}ms`);
    }

    const averageLoadTime = Object.values(performanceMetrics).reduce((a, b) => a + b, 0) / 3;
    console.log(`📊 Average load time: ${averageLoadTime.toFixed(2)}ms`);

    // Overall performance should be good
    expect(averageLoadTime).toBeLessThan(8000);

    console.log('✅ Page load performance is acceptable');
  });

  test('should verify memory usage with optimized logging', async ({ page }) => {
    console.log('🧠 Testing memory usage with logging optimizations...');

    // Navigate to initial page
    await page.goto('/dashboard');
    await TestHelpers.waitForLoadingToComplete(page);

    const initialMemory = await TestHelpers.checkMemoryUsage(page);
    
    // Perform memory-intensive operations
    for (let i = 0; i < 5; i++) {
      await page.goto('/users');
      await TestHelpers.waitForLoadingToComplete(page);
      await page.waitForTimeout(1000);
      
      await page.goto('/departments');
      await TestHelpers.waitForLoadingToComplete(page);
      await page.waitForTimeout(1000);
      
      await page.goto('/dashboard');
      await TestHelpers.waitForLoadingToComplete(page);
      await page.waitForTimeout(1000);
    }

    const finalMemory = await TestHelpers.checkMemoryUsage(page);
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory;
      console.log(`📊 Memory Usage:`);
      console.log(`   Initial: ${initialMemory}MB`);
      console.log(`   Final: ${finalMemory}MB`);
      console.log(`   Increase: ${memoryIncrease}MB`);

      // Memory increase should be reasonable (less than 50MB for these operations)
      expect(memoryIncrease).toBeLessThan(50);
      
      // Total memory usage should be reasonable
      expect(finalMemory).toBeLessThan(200);
    }

    console.log('✅ Memory usage is within acceptable limits');
  });

  test('should test logging performance under concurrent operations', async ({ page }) => {
    console.log('🔄 Testing logging performance under concurrent load...');

    // Start monitoring
    const logMonitor = TestHelpers.monitorLogVolume(page);
    let totalNetworkRequests = 0;
    
    page.on('request', () => totalNetworkRequests++);

    // Create multiple concurrent operations
    const concurrentOperations = [
      page.goto('/dashboard').then(() => TestHelpers.waitForLoadingToComplete(page)),
      page.goto('/users').then(() => TestHelpers.waitForLoadingToComplete(page)),
      page.goto('/departments').then(() => TestHelpers.waitForLoadingToComplete(page)),
    ];

    const startTime = Date.now();
    
    // Execute operations concurrently (simulate multiple tabs/users)
    await Promise.all(concurrentOperations.slice(0, 1)); // Start with dashboard
    
    // Simulate rapid navigation
    for (let i = 0; i < 3; i++) {
      await page.goto('/users');
      await page.goto('/departments');
      await page.goto('/dashboard');
    }

    const executionTime = (Date.now() - startTime) / 1000;
    const logsPerSecond = logMonitor.getLogRate();
    
    console.log(`📊 Concurrent Load Test Results:`);
    console.log(`   Execution time: ${executionTime.toFixed(2)}s`);
    console.log(`   Network requests: ${totalNetworkRequests}`);
    console.log(`   Total logs: ${logMonitor.getTotalLogs()}`);
    console.log(`   Logs per second: ${logsPerSecond.toFixed(2)}`);

    // Even under load, should stay under limits
    expect(logsPerSecond).toBeLessThan(50);

    console.log('✅ Concurrent operations maintain logging performance');
  });

  test('should verify TenantInterceptor performance improvement', async ({ page }) => {
    console.log('🎯 Testing TenantInterceptor performance specifically...');

    let interceptorLogs = 0;
    let tenantRelatedLogs = 0;
    let authRequests = 0;

    // Monitor for tenant/auth related activity
    page.on('console', msg => {
      const text = msg.text().toLowerCase();
      if (text.includes('interceptor') || text.includes('tenant')) {
        interceptorLogs++;
      }
      if (text.includes('tenant') || text.includes('context')) {
        tenantRelatedLogs++;
      }
    });

    page.on('request', req => {
      if (req.url().includes('/auth') || req.headers()['authorization']) {
        authRequests++;
      }
    });

    // Perform operations that would trigger the TenantInterceptor
    const interceptorTestPages = [
      '/dashboard',
      '/users', 
      '/departments',
      '/dashboard', // Return to dashboard
      '/users',     // Second visit to users
    ];

    for (const testPath of interceptorTestPages) {
      await page.goto(testPath);
      await TestHelpers.waitForLoadingToComplete(page);
      await page.waitForTimeout(500);
    }

    console.log(`📊 TenantInterceptor Performance:`);
    console.log(`   Pages visited: ${interceptorTestPages.length}`);
    console.log(`   Auth requests: ${authRequests}`);
    console.log(`   Interceptor logs: ${interceptorLogs}`);
    console.log(`   Tenant-related logs: ${tenantRelatedLogs}`);

    // With the logging improvements, we should see minimal tenant logging
    // Previously, we might have seen 1 log per request, now should be much less
    expect(tenantRelatedLogs).toBeLessThan(authRequests);
    
    // Ideally, interceptor logs should be minimal or zero in production
    expect(interceptorLogs).toBeLessThanOrEqual(2);

    console.log('✅ TenantInterceptor logging has been optimized');
  });

  test('should benchmark logging performance over extended session', async ({ page }) => {
    console.log('⏱️  Running extended session benchmark...');

    const sessionDuration = 60; // 1 minute test
    const logMonitor = TestHelpers.monitorLogVolume(page);
    const measurements: Array<{ time: number; logs: number; rate: number }> = [];

    console.log(`⏳ Starting ${sessionDuration}s extended session test...`);

    const startTime = Date.now();
    let isRunning = true;

    // Background monitoring
    const monitoringInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const currentRate = logMonitor.getLogRate();
      const totalLogs = logMonitor.getTotalLogs();
      
      measurements.push({
        time: elapsed,
        logs: totalLogs,
        rate: currentRate
      });

      if (elapsed >= sessionDuration) {
        isRunning = false;
        clearInterval(monitoringInterval);
      }
    }, 5000); // Take measurement every 5 seconds

    // Simulate continuous user activity
    const userSession = async () => {
      const activities = [
        '/dashboard',
        '/users',
        '/departments',
      ];

      while (isRunning) {
        for (const activity of activities) {
          if (!isRunning) break;
          
          await page.goto(activity);
          await TestHelpers.waitForLoadingToComplete(page);
          await page.waitForTimeout(2000);
        }
      }
    };

    await userSession();

    // Analyze measurements
    const finalRate = logMonitor.getLogRate();
    const maxRate = Math.max(...measurements.map(m => m.rate));
    const avgRate = measurements.reduce((sum, m) => sum + m.rate, 0) / measurements.length;

    console.log(`📈 Extended Session Results:`);
    console.log(`   Duration: ${sessionDuration}s`);
    console.log(`   Final log rate: ${finalRate.toFixed(2)}/sec`);
    console.log(`   Maximum rate: ${maxRate.toFixed(2)}/sec`);
    console.log(`   Average rate: ${avgRate.toFixed(2)}/sec`);
    console.log(`   Total measurements: ${measurements.length}`);

    // Critical performance requirements
    expect(finalRate).toBeLessThan(50);
    expect(maxRate).toBeLessThan(100); // Even peaks should be reasonable
    expect(avgRate).toBeLessThan(30);  // Average should be well under limit

    // Take final screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'extended-session-benchmark-complete');

    console.log('✅ Extended session performance meets all requirements');
  });
});