#!/usr/bin/env node

/**
 * Comprehensive R2 Connection Diagnostic Script
 * Tests Cloudflare R2 connectivity with detailed error analysis
 */

const { S3Client, ListObjectsV2Command, HeadBucketCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

console.log('🔧 R2 Connection Diagnostic Script');
console.log('=' .repeat(60));

// Configuration from your current env
const R2_CONFIG = {
  accountId: '5d3433b8618a65d5e8d459bd785d5f78',
  accessKeyId: 'e73fae23393cfd49e2f6734b87d8625f',
  // OLD (wrong): '021ab25f7ffc5b1d8adfa02612f2719916edf222ec37d423867a5c17e8600c17'
  // NEW (correct): 
  secretAccessKey: '347f5467439c446b771ff27b7cf962f7bd92db3250d99c36bb1b5588fb3f7ecf',
  bucketName: 'hoh',
  publicUrl: 'https://5d3433b8618a65d5e8d459bd785d5f78.r2.cloudflarestorage.com'
};

// Initialize S3 client for R2
const endpoint = `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`;

console.log('📋 Configuration:');
console.log(`  Account ID: ${R2_CONFIG.accountId}`);
console.log(`  Access Key: ${R2_CONFIG.accessKeyId.substring(0, 8)}...`);
console.log(`  Secret Key: ${R2_CONFIG.secretAccessKey.substring(0, 8)}... (${R2_CONFIG.secretAccessKey.length} chars)`);
console.log(`  Bucket: ${R2_CONFIG.bucketName}`);
console.log(`  Endpoint: ${endpoint}`);
console.log(`  Public URL: ${R2_CONFIG.publicUrl}`);
console.log();

const s3Client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
  forcePathStyle: false,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
  maxAttempts: 3,
  retryMode: 'adaptive',
});

/**
 * Test 1: Basic bucket existence check
 */
async function testBucketExists() {
  console.log('🧪 Test 1: Checking if bucket exists...');
  
  try {
    const command = new HeadBucketCommand({
      Bucket: R2_CONFIG.bucketName
    });
    
    const startTime = Date.now();
    await s3Client.send(command);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Bucket '${R2_CONFIG.bucketName}' exists and is accessible`);
    console.log(`   Response time: ${duration}ms`);
    return { success: true, duration };
  } catch (error) {
    console.log(`❌ Bucket test failed:`);
    console.log(`   Error Code: ${error.name || 'Unknown'}`);
    console.log(`   HTTP Status: ${error.$metadata?.httpStatusCode || 'N/A'}`);
    console.log(`   Message: ${error.message}`);
    
    // Specific error analysis
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`   🔍 Analysis: Bucket '${R2_CONFIG.bucketName}' does not exist`);
      console.log(`   💡 Solution: Create bucket in Cloudflare R2 dashboard`);
    } else if (error.name === 'Forbidden' || error.$metadata?.httpStatusCode === 403) {
      console.log(`   🔍 Analysis: Access denied - check credentials and permissions`);
      console.log(`   💡 Solution: Verify R2 token has Admin Read & Write permissions`);
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.log(`   🔍 Analysis: Authentication signature invalid`);
      console.log(`   💡 Solution: Check R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY`);
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log(`   🔍 Analysis: Network connectivity issue`);
      console.log(`   💡 Solution: Check internet connection and firewall`);
    }
    
    return { success: false, error };
  }
}

/**
 * Test 2: List objects in bucket
 */
async function testListObjects() {
  console.log('\n🧪 Test 2: Listing objects in bucket...');
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      MaxKeys: 10
    });
    
    const startTime = Date.now();
    const response = await s3Client.send(command);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Successfully listed objects`);
    console.log(`   Object count: ${response.KeyCount || 0}`);
    console.log(`   Response time: ${duration}ms`);
    
    if (response.Contents && response.Contents.length > 0) {
      console.log(`   Sample objects:`);
      response.Contents.slice(0, 3).forEach(obj => {
        console.log(`     - ${obj.Key} (${obj.Size} bytes)`);
      });
    } else {
      console.log(`   📁 Bucket is empty`);
    }
    
    return { success: true, duration, objects: response.KeyCount || 0 };
  } catch (error) {
    console.log(`❌ List objects failed:`);
    console.log(`   Error Code: ${error.name || 'Unknown'}`);
    console.log(`   HTTP Status: ${error.$metadata?.httpStatusCode || 'N/A'}`);
    console.log(`   Message: ${error.message}`);
    
    return { success: false, error };
  }
}

/**
 * Test 3: Try to upload a test file
 */
async function testUpload() {
  console.log('\n🧪 Test 3: Testing file upload...');
  
  const testContent = `R2 Connection Test - ${new Date().toISOString()}`;
  const testKey = `test/connection-test-${Date.now()}.txt`;
  
  try {
    const command = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
      Metadata: {
        'test': 'r2-connection-diagnostic',
        'timestamp': new Date().toISOString()
      }
    });
    
    const startTime = Date.now();
    const response = await s3Client.send(command);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Successfully uploaded test file`);
    console.log(`   Key: ${testKey}`);
    console.log(`   ETag: ${response.ETag}`);
    console.log(`   Upload time: ${duration}ms`);
    
    return { success: true, duration, key: testKey };
  } catch (error) {
    console.log(`❌ Upload test failed:`);
    console.log(`   Error Code: ${error.name || 'Unknown'}`);
    console.log(`   HTTP Status: ${error.$metadata?.httpStatusCode || 'N/A'}`);
    console.log(`   Message: ${error.message}`);
    
    return { success: false, error };
  }
}

/**
 * Test 4: Validate configuration
 */
function testConfiguration() {
  console.log('\n🧪 Test 4: Configuration validation...');
  
  const issues = [];
  
  // Check bucket name
  if (!R2_CONFIG.bucketName || R2_CONFIG.bucketName.length < 3) {
    issues.push('Bucket name is too short (minimum 3 characters)');
  }
  
  if (R2_CONFIG.bucketName.length > 63) {
    issues.push('Bucket name is too long (maximum 63 characters)');
  }
  
  // Check credentials
  if (!R2_CONFIG.accessKeyId || R2_CONFIG.accessKeyId.length !== 32) {
    issues.push('Access Key ID should be 32 characters long');
  }
  
  if (!R2_CONFIG.secretAccessKey || R2_CONFIG.secretAccessKey.length !== 64) {
    issues.push('Secret Access Key should be 64 characters long');
  }
  
  // Check account ID
  if (!R2_CONFIG.accountId || R2_CONFIG.accountId.length !== 32) {
    issues.push('Account ID should be 32 characters long');
  }
  
  if (issues.length === 0) {
    console.log('✅ Configuration appears valid');
    return { success: true };
  } else {
    console.log('❌ Configuration issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    return { success: false, issues };
  }
}

/**
 * Main diagnostic function
 */
async function runDiagnostics() {
  console.log('🚀 Starting R2 connection diagnostics...\n');
  
  const results = {
    config: testConfiguration(),
    bucket: null,
    list: null,
    upload: null
  };
  
  // Only proceed with network tests if config is valid
  if (results.config.success) {
    results.bucket = await testBucketExists();
    
    // Only try listing if bucket exists
    if (results.bucket.success) {
      results.list = await testListObjects();
      results.upload = await testUpload();
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('=' .repeat(60));
  
  console.log(`Configuration: ${results.config.success ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`Bucket Access:  ${results.bucket?.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`List Objects:   ${results.list?.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`File Upload:    ${results.upload?.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  const overallSuccess = results.config.success && 
                        results.bucket?.success && 
                        results.list?.success && 
                        results.upload?.success;
  
  console.log('\n🏁 OVERALL RESULT:', overallSuccess ? '✅ ALL TESTS PASSED' : '❌ ISSUES DETECTED');
  
  if (!overallSuccess) {
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    
    if (!results.config.success) {
      console.log('1. Fix configuration issues listed above');
    }
    
    if (!results.bucket?.success) {
      console.log('2. Create bucket "hoh" in Cloudflare R2 dashboard');
      console.log('3. Verify R2 API token has Admin Read & Write permissions');
      console.log('4. Double-check account ID, access key, and secret key');
    }
    
    console.log('5. Update Railway environment variables with corrected values');
  } else {
    console.log('\n🎉 R2 connection is working perfectly!');
    console.log('✅ Ready to deploy updated environment variables to Railway');
  }
  
  process.exit(overallSuccess ? 0 : 1);
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('💥 Diagnostic script crashed:', error);
  process.exit(1);
});