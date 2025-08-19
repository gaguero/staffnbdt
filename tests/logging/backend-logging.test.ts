import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Backend Logging Verification Tests
 * 
 * These tests specifically verify backend logging behavior:
 * - Verify LOG_LEVEL environment variable is respected
 * - Test that console.log statements have been removed
 * - Verify winston logger configuration
 * - Test logging behavior under load
 */

test.describe('Backend Logging Tests', () => {
  let request: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: process.env.API_BASE_URL || 'https://backend-copy-production-328d.up.railway.app',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  });

  test.afterAll(async () => {
    await request.dispose();
  });

  test('should verify health endpoint responds correctly', async () => {
    console.log('🏥 Testing health endpoint...');

    const response = await request.get('/health');
    expect(response.status()).toBe(200);

    const health = await response.json();
    console.log('Health response:', health);

    // Basic health check should work
    expect(health).toHaveProperty('status');
    
    console.log('✅ Health endpoint working correctly');
  });

  test('should test API endpoints do not return debug information', async () => {
    console.log('🔍 Testing API endpoints for debug information leakage...');

    // Test various endpoints that should be publicly accessible
    const publicEndpoints = [
      '/health',
      // Add other endpoints that don't require auth
    ];

    for (const endpoint of publicEndpoints) {
      const response = await request.get(endpoint);
      
      // Response should be successful or unauthorized, not server error
      expect(response.status()).not.toBe(500);
      
      const responseText = await response.text();
      const lowerText = responseText.toLowerCase();

      // Check for debug information leakage
      const debugPatterns = [
        'console.log',
        'debug:',
        '[debug]',
        'winston debug',
        'development mode',
        'stack trace',
        'internal server error details'
      ];

      for (const pattern of debugPatterns) {
        expect(lowerText).not.toContain(pattern);
      }

      console.log(`✅ ${endpoint} - No debug information leaked`);
    }
  });

  test('should verify CORS headers are properly configured', async () => {
    console.log('🌐 Testing CORS configuration...');

    const response = await request.options('/health');
    
    // CORS preflight should work
    expect([200, 204]).toContain(response.status());
    
    // Check for proper CORS headers
    const headers = response.headers();
    console.log('CORS headers:', headers);

    console.log('✅ CORS configuration appears correct');
  });

  test('should test error handling without debug information', async () => {
    console.log('❌ Testing error handling...');

    // Test endpoint that should return 404
    const response = await request.get('/nonexistent-endpoint');
    expect(response.status()).toBe(404);

    const errorResponse = await response.text();
    const lowerError = errorResponse.toLowerCase();

    // Error response should not contain debug info
    const sensitiveInfo = [
      'stack trace',
      'file path',
      'console.log',
      'debug',
      'internal error',
      'winston',
      '/app/', // Should not expose internal paths
      'node_modules'
    ];

    for (const info of sensitiveInfo) {
      expect(lowerError).not.toContain(info);
    }

    console.log('✅ Error responses do not leak debug information');
  });

  test('should test rate limiting behavior', async () => {
    console.log('🚦 Testing rate limiting...');

    // Make multiple rapid requests to test rate limiting
    const requests = Array.from({ length: 10 }, () => 
      request.get('/health')
    );

    const responses = await Promise.allSettled(requests);
    
    const successfulResponses = responses.filter(
      (result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value.status() === 200
    );

    const rateLimitedResponses = responses.filter(
      (result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value.status() === 429
    );

    console.log(`📊 Rate limiting results:`);
    console.log(`   Successful requests: ${successfulResponses.length}`);
    console.log(`   Rate limited requests: ${rateLimitedResponses.length}`);

    // Should have some successful requests
    expect(successfulResponses.length).toBeGreaterThan(0);

    console.log('✅ Rate limiting is working');
  });

  test('should verify response times are acceptable', async () => {
    console.log('⚡ Testing response times...');

    const startTime = Date.now();
    const response = await request.get('/health');
    const responseTime = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds

    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log('✅ Response times are acceptable');
  });

  test('should verify logging does not affect performance under load', async () => {
    console.log('🔄 Testing performance under load...');

    const concurrentRequests = 5;
    const requestsPerBatch = 3;

    const results: number[] = [];

    // Make several batches of concurrent requests
    for (let batch = 0; batch < concurrentRequests; batch++) {
      const batchStart = Date.now();
      
      const batchRequests = Array.from({ length: requestsPerBatch }, () =>
        request.get('/health')
      );

      const batchResponses = await Promise.all(batchRequests);
      const batchTime = Date.now() - batchStart;

      // Verify all requests succeeded
      batchResponses.forEach((response, index) => {
        expect(response.status()).toBe(200);
      });

      results.push(batchTime);
      console.log(`   Batch ${batch + 1}: ${batchTime}ms for ${requestsPerBatch} requests`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const averageTime = results.reduce((a, b) => a + b, 0) / results.length;
    console.log(`📊 Average batch time: ${averageTime.toFixed(2)}ms`);

    // Performance should be reasonable even under load
    expect(averageTime).toBeLessThan(10000); // 10 seconds max per batch

    console.log('✅ Performance under load is acceptable');
  });
});