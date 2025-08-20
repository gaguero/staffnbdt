const https = require('https');
const http = require('http');

// Test profile photo endpoints
async function testPhotoEndpoints() {
  console.log('🧪 Testing Profile Photo Endpoints...\n');
  
  const baseUrl = 'https://backend-copy-production-328d.up.railway.app';
  
  // Test 1: Check if backend is accessible
  console.log('1. Testing backend accessibility...');
  try {
    await makeRequest(`${baseUrl}/health`);
    console.log('✅ Backend is accessible\n');
  } catch (error) {
    console.log(`❌ Backend not accessible: ${error.message}\n`);
    return;
  }
  
  // Test 2: Check if profile photo endpoint exists (should return 401 without auth)
  console.log('2. Testing profile photo endpoint...');
  try {
    await makeRequest(`${baseUrl}/api/profile/photo`);
  } catch (error) {
    if (error.message.includes('401')) {
      console.log('✅ Profile photo endpoint exists (requires auth)\n');
    } else {
      console.log(`❌ Unexpected error: ${error.message}\n`);
    }
  }
  
  console.log('🎯 Photo endpoint tests completed!');
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      });
    });
    
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run the test
testPhotoEndpoints().catch(console.error);