#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== Simple Prisma Fix for Railway ===');

const bffDir = __dirname;
const schemaPath = path.join(__dirname, '../../packages/database/prisma/schema.prisma');

// Step 1: Check dependencies (already installed in package.json)
console.log('\n1. Checking dependencies...');
try {
  require.resolve('@prisma/client');
  require.resolve('prisma');
  console.log('✅ Dependencies available');
} catch {
  console.log('Installing missing dependencies...');
  try {
    execSync('npm install', { 
      stdio: 'inherit',
      cwd: bffDir 
    });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Step 2: Copy schema locally
console.log('\n2. Copying schema...');
const localSchemaDir = path.join(bffDir, 'prisma');
const localSchemaPath = path.join(localSchemaDir, 'schema.prisma');

if (!fs.existsSync(localSchemaDir)) {
  fs.mkdirSync(localSchemaDir, { recursive: true });
}

fs.copyFileSync(schemaPath, localSchemaPath);
console.log('✅ Schema copied');

// Step 3: Generate Prisma Client with dummy URL
console.log('\n3. Generating Prisma Client...');
try {
  // Use a dummy PostgreSQL URL for generation
  // The actual URL will be used at runtime
  const env = {
    ...process.env,
    DATABASE_URL: 'postgresql://postgres:password@localhost:5432/mydb?schema=public'
  };
  
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: bffDir,
    env: env
  });
  
  console.log('✅ Prisma Client generated');
} catch (error) {
  console.error('❌ Generation failed:', error.message);
  process.exit(1);
}

// Step 4: Clean up
console.log('\n4. Cleaning up...');
try {
  fs.rmSync(localSchemaDir, { recursive: true, force: true });
  console.log('✅ Cleaned up temporary files');
} catch (error) {
  console.log('⚠️  Could not clean up:', error.message);
}

console.log('\n=== Complete ===');