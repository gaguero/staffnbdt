import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown for Playwright tests
 * This runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');

  try {
    // Clean up authentication state
    const authFile = 'tests/.auth/user.json';
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
      console.log('✅ Authentication state cleaned up');
    }

    // Generate test summary
    const testResultsPath = 'test-results/results.json';
    if (fs.existsSync(testResultsPath)) {
      const results = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
      
      console.log('\n📊 Test Summary:');
      console.log(`   Total tests: ${results.stats?.total || 'unknown'}`);
      console.log(`   Passed: ${results.stats?.expected || 'unknown'}`);
      console.log(`   Failed: ${results.stats?.unexpected || 'unknown'}`);
      console.log(`   Skipped: ${results.stats?.skipped || 'unknown'}`);
      
      if (results.stats?.unexpected > 0) {
        console.log('\n❌ Some tests failed. Check the HTML report for details.');
        console.log('   Run: npx playwright show-report');
      } else {
        console.log('\n✅ All tests passed!');
      }
    }

    // Log environment information
    console.log('\n🌍 Test Environment:');
    console.log(`   Base URL: ${config.use?.baseURL || 'unknown'}`);
    console.log(`   CI: ${process.env.CI ? 'Yes' : 'No'}`);
    console.log(`   Node version: ${process.version}`);
    
    // Log Railway deployment status
    const railwayUrl = config.use?.baseURL;
    if (railwayUrl?.includes('railway.app')) {
      console.log(`   Railway deployment tested: ${railwayUrl}`);
    }

  } catch (error) {
    console.error('❌ Global teardown encountered an error:', error);
  }

  console.log('🎯 Global teardown completed');
}

export default globalTeardown;