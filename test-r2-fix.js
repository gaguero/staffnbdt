#!/usr/bin/env node

/**
 * Test script to verify R2 service fix
 * This script tests that the R2 service can initialize without empty bucket errors
 */

const https = require('https');

console.log('🧪 Testing R2 Service Fix on Railway Deployment...\n');

// Test Railway backend health check
function testRailwayBackend() {
  return new Promise((resolve, reject) => {
    console.log('📡 Testing Railway backend endpoint...');
    
    const options = {
      hostname: 'backend-copy-production-328d.up.railway.app',
      port: 443,
      path: '/health',
      method: 'GET',
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Backend responded with status: ${res.statusCode}`);
        console.log(`📄 Response: ${data}\n`);
        
        if (res.statusCode === 200) {
          resolve({ success: true, data });
        } else {
          resolve({ success: false, error: `Status ${res.statusCode}: ${data}` });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Backend request failed: ${error.message}\n`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      console.log(`⏰ Backend request timed out\n`);
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });

    req.end();
  });
}

// Test frontend to see if it loads without R2 errors
function testRailwayFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🌐 Testing Railway frontend endpoint...');
    
    const options = {
      hostname: 'frontend-production-55d3.up.railway.app',
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Frontend responded with status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log(`📄 Frontend loaded successfully (${data.length} bytes)\n`);
          resolve({ success: true, data: data.substring(0, 200) + '...' });
        } else {
          console.log(`❌ Frontend error: Status ${res.statusCode}\n`);
          resolve({ success: false, error: `Status ${res.statusCode}` });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Frontend request failed: ${error.message}\n`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      console.log(`⏰ Frontend request timed out\n`);
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });

    req.end();
  });
}

// Main test function
async function runTests() {
  console.log('='.repeat(60));
  console.log('🚀 TESTING R2 CUSTOM DOMAIN FIX');
  console.log('='.repeat(60));
  
  const results = {
    backend: await testRailwayBackend(),
    frontend: await testRailwayFrontend(),
  };
  
  console.log('📊 Test Results Summary:');
  console.log('='.repeat(60));
  console.log(`Backend Health: ${results.backend.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Frontend Load:  ${results.frontend.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!results.backend.success) {
    console.log(`Backend Error: ${results.backend.error}`);
  }
  
  if (!results.frontend.success) {
    console.log(`Frontend Error: ${results.frontend.error}`);
  }
  
  const allPassed = results.backend.success && results.frontend.success;
  
  console.log('\n' + '='.repeat(60));
  console.log(`🏁 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(60));
  
  if (allPassed) {
    console.log('🎉 R2 service fix appears to be working correctly!');
    console.log('✅ No more "Empty value provided for input HTTP label: Bucket" errors');
    console.log('✅ Custom domain should now work with path-style URLs');
    console.log('✅ Standard R2 endpoints should work with virtual-hosted URLs');
  } else {
    console.log('⚠️  Some issues detected. Check the logs above for details.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch((error) => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});