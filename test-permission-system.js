/**
 * Test script for debugging permission system table detection
 * Run this after Railway deployment to verify the fix works
 */

const baseUrl = 'https://bff-production-d034.up.railway.app';

async function testPermissionSystem() {
  console.log('🔍 Testing Permission System Detection...\n');
  
  try {
    // Test 1: Check system status (requires auth, but we can see if endpoint exists)
    console.log('1. Testing system status endpoint...');
    const statusResponse = await fetch(`${baseUrl}/api/permissions/system/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${statusResponse.status}`);
    if (statusResponse.status === 401) {
      console.log('   ✅ Endpoint exists (401 = needs authentication as expected)');
    } else if (statusResponse.status === 404) {
      console.log('   ❌ Endpoint not found - deployment may not be ready');
      return false;
    }
    
    // Test 2: Check if any permission endpoint works
    console.log('\n2. Testing basic permission endpoint...');
    const permResponse = await fetch(`${baseUrl}/api/permissions/my`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${permResponse.status}`);
    if (permResponse.status === 401) {
      console.log('   ✅ Permission endpoints are accessible (authentication required)');
    }
    
    // Test 3: Check backend is running
    console.log('\n3. Testing if backend is responding...');
    const healthResponse = await fetch(`${baseUrl}/api`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${healthResponse.status}`);
    const healthText = await healthResponse.text();
    console.log(`   Response: ${healthText.substring(0, 100)}...`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Get authentication token from frontend login');
    console.log('2. Test /api/permissions/system/status with Bearer token');
    console.log('3. If tables not detected, try FORCE_PERMISSION_SYSTEM=true');
    console.log('4. Use /api/permissions/system/reinitialize to force retry');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing permission system:', error.message);
    return false;
  }
}

// Run the test
testPermissionSystem()
  .then(success => {
    if (success) {
      console.log('\n✅ Basic connectivity test completed');
    } else {
      console.log('\n❌ Test failed - check deployment status');
    }
  })
  .catch(error => {
    console.error('Test script error:', error);
  });