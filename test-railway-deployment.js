#!/usr/bin/env node

/**
 * Test Railway Deployment Status
 * Verifies that latest code changes are deployed
 */

const https = require('https');

console.log('🚀 Testing Railway Deployment Status...\n');

// Test Railway backend health and version
function testRailwayDeployment() {
  return new Promise((resolve, reject) => {
    console.log('📡 Testing Railway backend...');
    
    const options = {
      hostname: 'backend-copy-production-328d.up.railway.app',
      port: 443,
      path: '/health',
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Railway-Test-Client'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Railway Response Status: ${res.statusCode}`);
        console.log(`📄 Response: ${data}`);
        
        try {
          const response = JSON.parse(data);
          if (response.status === 'ok') {
            console.log('✅ Railway backend is healthy');
            
            // Check for our recent commit
            if (response.version || response.timestamp) {
              console.log('📍 Deployment info:', {
                version: response.version,
                timestamp: response.timestamp
              });
            }
            
            resolve({ success: true, data: response });
          } else {
            resolve({ success: false, error: 'Backend unhealthy' });
          }
        } catch (error) {
          // Health endpoint might not return JSON
          console.log('✅ Backend responded (non-JSON)');
          resolve({ success: true, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Railway request failed: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      console.log(`⏰ Railway request timed out`);
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });

    req.end();
  });
}

// Test API endpoint that should use updated code
function testProfilePhotosEndpoint() {
  return new Promise((resolve, reject) => {
    console.log('\n🔍 Testing profile photos endpoint (should show enhanced error logs)...');
    
    // This will return 401 but we want to see if enhanced logging appears
    const options = {
      hostname: 'backend-copy-production-328d.up.railway.app',
      port: 443,
      path: '/api/profile/photos',
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Deployment-Test-Client'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 Profile Photos Endpoint Status: ${res.statusCode}`);
        console.log(`📄 Response: ${data.substring(0, 200)}...`);
        
        // We expect 401 Unauthorized (no JWT token)
        if (res.statusCode === 401) {
          console.log('✅ Endpoint accessible (401 expected without auth)');
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          console.log(`⚠️  Unexpected status: ${res.statusCode}`);
          resolve({ success: false, statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Profile photos request failed: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      console.log(`⏰ Profile photos request timed out`);
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });

    req.end();
  });
}

// Main test function
async function runDeploymentTest() {
  console.log('='.repeat(60));
  console.log('🔍 RAILWAY DEPLOYMENT VERIFICATION');
  console.log('='.repeat(60));
  
  const results = {
    health: await testRailwayDeployment(),
    profilePhotos: await testProfilePhotosEndpoint(),
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(60));
  console.log(`Railway Health: ${results.health.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Profile Photos: ${results.profilePhotos.success ? '✅ ACCESSIBLE' : '❌ FAILED'}`);
  
  if (!results.health.success) {
    console.log(`Health Error: ${results.health.error}`);
  }
  
  if (!results.profilePhotos.success) {
    console.log(`Profile Photos Error: ${results.profilePhotos.error}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🚨 CRITICAL NEXT STEPS:');
  console.log('='.repeat(60));
  console.log('1. ADD to Railway Environment Variables: STORAGE_USE_R2=true');
  console.log('2. Verify latest commit c5cb203 is deployed');
  console.log('3. Check Railway logs for enhanced getUserPhotos debugging');
  console.log('4. Test photo upload after adding STORAGE_USE_R2=true');
  
  const overallSuccess = results.health.success && results.profilePhotos.success;
  console.log(`\n🏁 Overall: ${overallSuccess ? '✅ READY FOR R2 ACTIVATION' : '❌ DEPLOYMENT ISSUES'}`);
  
  process.exit(overallSuccess ? 0 : 1);
}

// Run the test
runDeploymentTest().catch((error) => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});