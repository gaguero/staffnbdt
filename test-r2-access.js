/**
 * R2 Bucket Access Test Script
 * 
 * This script tests access to your R2 bucket with different configurations
 * to help diagnose connection issues.
 */

import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Your R2 credentials (from Railway environment variables)
const R2_CREDENTIALS = {
  accountId: '5d3433b8618a65d5e8d459bd785d5f78',
  accessKeyId: 'e73fae23393cfd49e2f6734b87d8625f',
  secretAccessKey: '021ab25f7ffc5b1d8adfa02612f2719916edf222ec37d423867a5c17e8600c17',
  bucketName: 'hoh'
};

// Test configurations
const TEST_CONFIGS = [
  {
    name: 'Standard R2 Endpoint (Virtual-hosted style)',
    endpoint: `https://${R2_CREDENTIALS.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: false
  },
  {
    name: 'Standard R2 Endpoint (Path style)',
    endpoint: `https://${R2_CREDENTIALS.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true
  },
  {
    name: 'Custom Domain (Virtual-hosted style)',
    endpoint: 'https://buckethoh.thecraftedhospitality.com',
    forcePathStyle: false
  },
  {
    name: 'Custom Domain (Path style)',
    endpoint: 'https://buckethoh.thecraftedhospitality.com',
    forcePathStyle: true
  }
];

/**
 * Create S3 client for testing
 */
function createS3Client(config) {
  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: R2_CREDENTIALS.accessKeyId,
      secretAccessKey: R2_CREDENTIALS.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
  });
}

/**
 * Test basic connectivity by listing objects
 */
async function testListObjects(client, configName) {
  try {
    console.log(`\n🧪 Testing ${configName} - List Objects`);
    
    const command = new ListObjectsV2Command({
      Bucket: R2_CREDENTIALS.bucketName,
      MaxKeys: 5,
    });
    
    const response = await client.send(command);
    
    console.log(`✅ Success! Found ${response.KeyCount || 0} objects`);
    if (response.Contents && response.Contents.length > 0) {
      console.log(`   First few objects: ${response.Contents.map(obj => obj.Key).join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.name} - ${error.message}`);
    
    // Log additional error details
    if (error.$metadata) {
      console.log(`   HTTP Status: ${error.$metadata.httpStatusCode}`);
    }
    if (error.Code) {
      console.log(`   Error Code: ${error.Code}`);
    }
    
    return false;
  }
}

/**
 * Test upload functionality
 */
async function testUpload(client, configName) {
  try {
    console.log(`\n🧪 Testing ${configName} - Upload Object`);
    
    const testContent = `Test file created at ${new Date().toISOString()}`;
    const testKey = `test-uploads/test-${Date.now()}.txt`;
    
    const command = new PutObjectCommand({
      Bucket: R2_CREDENTIALS.bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });
    
    const response = await client.send(command);
    
    console.log(`✅ Upload Success! ETag: ${response.ETag}`);
    console.log(`   Object key: ${testKey}`);
    
    return testKey;
  } catch (error) {
    console.log(`❌ Upload Failed: ${error.name} - ${error.message}`);
    return null;
  }
}

/**
 * Test download functionality
 */
async function testDownload(client, configName, objectKey) {
  if (!objectKey) {
    console.log(`\n⏭️  Skipping download test for ${configName} (no object to download)`);
    return false;
  }
  
  try {
    console.log(`\n🧪 Testing ${configName} - Download Object`);
    
    const command = new GetObjectCommand({
      Bucket: R2_CREDENTIALS.bucketName,
      Key: objectKey,
    });
    
    const response = await client.send(command);
    
    // Read the body stream
    const body = await response.Body.transformToString();
    
    console.log(`✅ Download Success! Content length: ${body.length}`);
    console.log(`   Content preview: ${body.substring(0, 50)}...`);
    
    return true;
  } catch (error) {
    console.log(`❌ Download Failed: ${error.name} - ${error.message}`);
    return false;
  }
}

/**
 * Test delete functionality
 */
async function testDelete(client, configName, objectKey) {
  if (!objectKey) {
    console.log(`\n⏭️  Skipping delete test for ${configName} (no object to delete)`);
    return false;
  }
  
  try {
    console.log(`\n🧪 Testing ${configName} - Delete Object`);
    
    const command = new DeleteObjectCommand({
      Bucket: R2_CREDENTIALS.bucketName,
      Key: objectKey,
    });
    
    await client.send(command);
    
    console.log(`✅ Delete Success!`);
    
    return true;
  } catch (error) {
    console.log(`❌ Delete Failed: ${error.name} - ${error.message}`);
    return false;
  }
}

/**
 * Run comprehensive tests for a configuration
 */
async function runTestSuite(config) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Testing Configuration: ${config.name}`);
  console.log(`   Endpoint: ${config.endpoint}`);
  console.log(`   Force Path Style: ${config.forcePathStyle}`);
  console.log(`${'='.repeat(60)}`);
  
  const client = createS3Client(config);
  
  // Test 1: List objects (basic connectivity)
  const listSuccess = await testListObjects(client, config.name);
  
  if (!listSuccess) {
    console.log(`\n❌ Basic connectivity failed, skipping further tests for this configuration.\n`);
    return {
      config: config.name,
      list: false,
      upload: false,
      download: false,
      delete: false
    };
  }
  
  // Test 2: Upload
  const uploadedKey = await testUpload(client, config.name);
  const uploadSuccess = uploadedKey !== null;
  
  // Test 3: Download (only if upload succeeded)
  const downloadSuccess = await testDownload(client, config.name, uploadedKey);
  
  // Test 4: Delete (only if upload succeeded)
  const deleteSuccess = await testDelete(client, config.name, uploadedKey);
  
  console.log(`\n📊 Results for ${config.name}:`);
  console.log(`   List Objects: ${listSuccess ? '✅' : '❌'}`);
  console.log(`   Upload: ${uploadSuccess ? '✅' : '❌'}`);
  console.log(`   Download: ${downloadSuccess ? '✅' : '❌'}`);
  console.log(`   Delete: ${deleteSuccess ? '✅' : '❌'}`);
  
  return {
    config: config.name,
    list: listSuccess,
    upload: uploadSuccess,
    download: downloadSuccess,
    delete: deleteSuccess
  };
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 R2 Bucket Access Test Script');
  console.log('===============================');
  console.log(`Testing bucket: ${R2_CREDENTIALS.bucketName}`);
  console.log(`Account ID: ${R2_CREDENTIALS.accountId}`);
  console.log(`Access Key ID: ${R2_CREDENTIALS.accessKeyId}`);
  console.log('');
  
  const results = [];
  
  // Run tests for each configuration
  for (const config of TEST_CONFIGS) {
    const result = await runTestSuite(config);
    results.push(result);
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📋 SUMMARY RESULTS');
  console.log(`${'='.repeat(60)}`);
  
  const workingConfigs = results.filter(r => r.list && r.upload && r.download && r.delete);
  const partiallyWorkingConfigs = results.filter(r => r.list && (!r.upload || !r.download || !r.delete));
  const failedConfigs = results.filter(r => !r.list);
  
  if (workingConfigs.length > 0) {
    console.log('\n✅ FULLY WORKING CONFIGURATIONS:');
    workingConfigs.forEach(r => console.log(`   ${r.config}`));
  }
  
  if (partiallyWorkingConfigs.length > 0) {
    console.log('\n⚠️  PARTIALLY WORKING CONFIGURATIONS:');
    partiallyWorkingConfigs.forEach(r => console.log(`   ${r.config} (list works, some operations failed)`));
  }
  
  if (failedConfigs.length > 0) {
    console.log('\n❌ FAILED CONFIGURATIONS:');
    failedConfigs.forEach(r => console.log(`   ${r.config}`));
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (workingConfigs.length > 0) {
    const recommended = workingConfigs[0];
    console.log(`   Use configuration: "${recommended.config}"`);
    
    const config = TEST_CONFIGS.find(c => c.name === recommended.config);
    console.log(`   
   Environment Variables for Railway:
   R2_PUBLIC_URL="${config.endpoint === `https://${R2_CREDENTIALS.accountId}.r2.cloudflarestorage.com` ? '' : config.endpoint}"
   
   Code Configuration:
   forcePathStyle: ${config.forcePathStyle}
   `);
  } else if (partiallyWorkingConfigs.length > 0) {
    console.log(`   Investigate issues with: "${partiallyWorkingConfigs[0].config}"`);
    console.log(`   Basic connectivity works, but some operations fail.`);
  } else {
    console.log(`   ❌ No configurations worked. Check:
   1. R2 credentials are correct
   2. Bucket exists and is accessible
   3. Custom domain is properly configured in Cloudflare
   4. Network connectivity to endpoints`);
  }
  
  console.log('\n🏁 Test completed!');
}

// Run the tests
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});