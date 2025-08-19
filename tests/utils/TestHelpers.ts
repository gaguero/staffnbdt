import { Page, expect, APIRequestContext } from '@playwright/test';

/**
 * Test helper utilities for Hotel Operations Hub testing
 */
export class TestHelpers {
  
  /**
   * Wait for API response and verify it's successful
   */
  static async waitForAPIResponse(page: Page, urlPattern: string, timeout = 10000) {
    const responsePromise = page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === 200,
      { timeout }
    );
    
    return await responsePromise;
  }

  /**
   * Check for JavaScript errors in console
   */
  static async checkForConsoleErrors(page: Page): Promise<string[]> {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    return errors;
  }

  /**
   * Wait for loading indicators to disappear
   */
  static async waitForLoadingToComplete(page: Page) {
    // Wait for common loading indicators to disappear
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '[data-testid="loading"]',
      '.skeleton',
      '[role="progressbar"]'
    ];

    for (const selector of loadingSelectors) {
      try {
        await page.locator(selector).waitFor({ state: 'hidden', timeout: 2000 });
      } catch {
        // Ignore if selector doesn't exist
      }
    }

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot with timestamp for debugging
   */
  static async takeTimestampedScreenshot(page: Page, name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    
    await page.screenshot({ 
      path: `test-results/${filename}`,
      fullPage: true 
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  /**
   * Verify responsive design by testing different viewports
   */
  static async testResponsiveDesign(page: Page, testName: string) {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    const screenshots: string[] = [];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Let layout settle
      
      const filename = await this.takeTimestampedScreenshot(page, `${testName}-${viewport.name}`);
      screenshots.push(filename);
      
      // Verify basic responsiveness
      const bodyRect = await page.locator('body').boundingBox();
      expect(bodyRect?.width).toBeLessThanOrEqual(viewport.width);
    }

    return screenshots;
  }

  /**
   * Monitor network requests and log any failures
   */
  static setupNetworkMonitoring(page: Page) {
    const failedRequests: string[] = [];

    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} - ${response.url()}`);
        console.log(`❌ Failed request: ${response.status()} - ${response.url()}`);
      }
    });

    return failedRequests;
  }

  /**
   * Verify API endpoint returns expected structure
   */
  static async verifyAPIStructure(request: APIRequestContext, endpoint: string, expectedKeys: string[]) {
    const response = await request.get(endpoint);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    for (const key of expectedKeys) {
      expect(data).toHaveProperty(key);
    }
    
    return data;
  }

  /**
   * Monitor log volume and detect excessive logging
   */
  static monitorLogVolume(page: Page) {
    let logCount = 0;
    const startTime = Date.now();

    page.on('console', () => {
      logCount++;
    });

    return {
      getLogRate: () => {
        const elapsed = (Date.now() - startTime) / 1000; // seconds
        return elapsed > 0 ? logCount / elapsed : 0;
      },
      getTotalLogs: () => logCount,
      reset: () => {
        logCount = 0;
      }
    };
  }

  /**
   * Verify tenant isolation in multi-tenant system
   */
  static async verifyTenantIsolation(page: Page, tenantId: string) {
    // Check that tenant context is properly set in requests
    const requests: string[] = [];
    
    page.on('request', request => {
      const headers = request.headers();
      if (headers['x-tenant-id'] && headers['x-tenant-id'] !== tenantId) {
        throw new Error(`Tenant isolation breach: expected ${tenantId}, got ${headers['x-tenant-id']}`);
      }
      requests.push(request.url());
    });

    return requests;
  }

  /**
   * Performance monitoring helper
   */
  static async measurePageLoadTime(page: Page, url: string) {
    const startTime = Date.now();
    
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`⚡ Page load time: ${loadTime}ms`);
    
    return loadTime;
  }

  /**
   * Memory usage monitoring (basic)
   */
  static async checkMemoryUsage(page: Page) {
    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          // @ts-ignore - performance.memory is not standard but available in Chrome
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          // @ts-ignore
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          // @ts-ignore
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });

    if (metrics) {
      const usedMB = Math.round(metrics.usedJSHeapSize / 1024 / 1024);
      console.log(`🧠 Memory usage: ${usedMB}MB`);
      return usedMB;
    }

    return null;
  }
}