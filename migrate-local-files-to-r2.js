#!/usr/bin/env node

/**
 * Migration Script: Local Files to R2 Storage
 * Migrates all existing profile photos and documents from Railway local storage to Cloudflare R2
 */

const fs = require('fs').promises;
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Configuration from environment
const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID || '5d3433b8618a65d5e8d459bd785d5f78',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || 'e73fae23393cfd49e2f6734b87d8625f',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '347f5467439c446b771ff27b7cf962f7bd92db3250d99c36bb1b5588fb3f7ecf',
  bucketName: process.env.R2_BUCKET_NAME || 'hoh',
};

// Local storage paths to check
const LOCAL_STORAGE_PATHS = [
  '/app/storage',           // Railway volume mount
  './storage',              // Local dev storage
  '../storage',             // Alternative path
  '/tmp/storage',           // Temporary storage
];

console.log('🚀 Starting Local Files to R2 Migration...');
console.log('=' .repeat(60));

// Initialize R2 client
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
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
 * Find the actual local storage directory
 */
async function findLocalStorageDirectory() {
  for (const storagePath of LOCAL_STORAGE_PATHS) {
    try {
      const stats = await fs.stat(storagePath);
      if (stats.isDirectory()) {
        console.log(`✅ Found local storage directory: ${storagePath}`);
        return storagePath;
      }
    } catch (error) {
      // Directory doesn't exist, continue
    }
  }
  
  throw new Error('❌ No local storage directory found');
}

/**
 * Recursively scan directory for files
 */
async function scanDirectory(dirPath, basePath = '', files = []) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name).replace(/\\/g, '/');
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, relativePath, files);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        files.push({
          localPath: fullPath,
          relativePath,
          size: stats.size,
          modified: stats.mtime,
          name: entry.name,
        });
      }
    }
  } catch (error) {
    console.warn(`⚠️ Could not scan directory ${dirPath}:`, error.message);
  }
  
  return files;
}

/**
 * Check if file already exists in R2
 */
async function fileExistsInR2(key) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      Prefix: key,
      MaxKeys: 1,
    });
    
    const response = await s3Client.send(command);
    return response.Contents && response.Contents.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Upload file to R2 with tenant-scoped path
 */
async function uploadFileToR2(file, tenantKey) {
  try {
    // Read file content
    const fileBuffer = await fs.readFile(file.localPath);
    
    // Determine MIME type based on extension
    const ext = path.extname(file.name).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
    };
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: tenantKey,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: {
        'migration-source': 'railway-local-storage',
        'migration-timestamp': new Date().toISOString(),
        'original-path': file.relativePath,
        'original-size': file.size.toString(),
        'original-modified': file.modified.toISOString(),
      },
    });
    
    await s3Client.send(command);
    
    return {
      success: true,
      key: tenantKey,
      size: fileBuffer.length,
      mimeType,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate tenant-scoped R2 key from local file path
 */
function generateTenantKey(file) {
  // Default tenant context for migration (using the main organization)
  const defaultOrgId = 'cmej91j5f0000s2f06t3denvz';
  const defaultPropId = 'cmej91jf70003s2f0b8qe7qiz';
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  // Analyze file path to determine type and module
  const pathParts = file.relativePath.split('/');
  
  // Profile photos (common pattern: profiles/userId/photoname.jpg)
  if (pathParts.includes('profiles') || file.name.includes('profile-photo')) {
    return `org/${defaultOrgId}/property/${defaultPropId}/profiles/FORMAL/${timestamp}-${randomString}-${file.name}`;
  }
  
  // Documents (common pattern: documents/type/filename)
  if (pathParts.includes('documents') || pathParts.includes('payslips')) {
    return `org/${defaultOrgId}/property/${defaultPropId}/documents/general/${timestamp}-${randomString}-${file.name}`;
  }
  
  // Training materials
  if (pathParts.includes('training')) {
    return `org/${defaultOrgId}/property/${defaultPropId}/training/materials/${timestamp}-${randomString}-${file.name}`;
  }
  
  // Default: general documents
  return `org/${defaultOrgId}/property/${defaultPropId}/documents/general/${timestamp}-${randomString}-${file.name}`;
}

/**
 * Main migration function
 */
async function runMigration() {
  let stats = {
    scanned: 0,
    uploaded: 0,
    skipped: 0,
    failed: 0,
    totalSize: 0,
  };
  
  try {
    // 1. Find local storage directory
    console.log('🔍 Searching for local storage directory...');
    const storageDir = await findLocalStorageDirectory();
    
    // 2. Scan all files
    console.log('📁 Scanning for files to migrate...');
    const files = await scanDirectory(storageDir);
    stats.scanned = files.length;
    
    if (files.length === 0) {
      console.log('✅ No local files found to migrate');
      return stats;
    }
    
    console.log(`📊 Found ${files.length} files to potentially migrate`);
    console.table(files.slice(0, 10).map(f => ({
      name: f.name,
      path: f.relativePath,
      size: `${(f.size / 1024).toFixed(1)}KB`,
      modified: f.modified.toISOString().split('T')[0]
    })));
    
    if (files.length > 10) {
      console.log(`... and ${files.length - 10} more files`);
    }
    
    // 3. Test R2 connection
    console.log('\n🧪 Testing R2 connection...');
    const testCommand = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      MaxKeys: 1,
    });
    await s3Client.send(testCommand);
    console.log('✅ R2 connection successful');
    
    // 4. Process each file
    console.log('\n🚀 Starting file migration...');
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = `[${i + 1}/${files.length}]`;
      
      console.log(`\n${progress} Processing: ${file.name}`);
      
      // Generate tenant-scoped key
      const tenantKey = generateTenantKey(file);
      console.log(`  📍 Target key: ${tenantKey}`);
      
      // Check if already exists in R2
      const exists = await fileExistsInR2(tenantKey);
      if (exists) {
        console.log(`  ⏭️  File already exists in R2, skipping`);
        stats.skipped++;
        continue;
      }
      
      // Upload to R2
      console.log(`  ☁️  Uploading to R2...`);
      const result = await uploadFileToR2(file, tenantKey);
      
      if (result.success) {
        console.log(`  ✅ Upload successful (${(result.size / 1024).toFixed(1)}KB)`);
        stats.uploaded++;
        stats.totalSize += result.size;
      } else {
        console.log(`  ❌ Upload failed: ${result.error}`);
        stats.failed++;
      }
      
      // Small delay to avoid rate limiting
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
  
  return stats;
}

/**
 * Display final migration report
 */
function displayReport(stats) {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 MIGRATION REPORT');
  console.log('=' .repeat(60));
  console.log(`Files scanned: ${stats.scanned}`);
  console.log(`Files uploaded: ${stats.uploaded}`);
  console.log(`Files skipped: ${stats.skipped}`);
  console.log(`Files failed: ${stats.failed}`);
  console.log(`Total size migrated: ${(stats.totalSize / (1024 * 1024)).toFixed(2)}MB`);
  
  const successRate = stats.scanned > 0 ? ((stats.uploaded / stats.scanned) * 100).toFixed(1) : 0;
  console.log(`Success rate: ${successRate}%`);
  
  if (stats.uploaded > 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('✅ Files are now available in Cloudflare R2');
    console.log('✅ You can now set STORAGE_USE_R2=true in Railway environment');
  } else if (stats.scanned === 0) {
    console.log('\nℹ️  No local files found to migrate');
    console.log('✅ You can safely set STORAGE_USE_R2=true in Railway environment');
  } else {
    console.log('\n⚠️  Migration completed with issues');
    console.log('🔍 Review failed uploads before enabling R2 storage');
  }
}

// Run migration
runMigration()
  .then(displayReport)
  .catch(error => {
    console.error('💥 Migration script crashed:', error);
    process.exit(1);
  });