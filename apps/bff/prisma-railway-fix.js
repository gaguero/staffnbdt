#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== Prisma Railway Fix ===');
console.log('Current directory:', process.cwd());
console.log('Script directory:', __dirname);

const bffDir = __dirname;
const schemaPath = path.join(__dirname, '../../packages/database/prisma/schema.prisma');

// Step 1: Install dependencies if needed
console.log('\n1. Checking dependencies...');
try {
  require.resolve('@prisma/client');
  console.log('✅ @prisma/client found');
} catch {
  console.log('📦 Installing @prisma/client...');
  execSync('npm install @prisma/client@^5.11.0 --save', { 
    stdio: 'inherit',
    cwd: bffDir 
  });
}

// Step 2: Install Prisma CLI
console.log('\n2. Checking Prisma CLI...');
try {
  execSync('npx prisma --version', { stdio: 'ignore', cwd: bffDir });
  console.log('✅ Prisma CLI available');
} catch {
  console.log('📦 Installing Prisma CLI...');
  execSync('npm install prisma@^5.11.0 --save-dev', { 
    stdio: 'inherit',
    cwd: bffDir 
  });
}

// Step 3: Create a local Prisma schema with explicit output
console.log('\n3. Creating local Prisma schema with output configuration...');
const localSchemaDir = path.join(bffDir, 'prisma');
const localSchemaPath = path.join(localSchemaDir, 'schema.prisma');

if (!fs.existsSync(localSchemaDir)) {
  fs.mkdirSync(localSchemaDir, { recursive: true });
}

// Read original schema
const originalSchema = fs.readFileSync(schemaPath, 'utf8');

// Modify the schema to add explicit output path
const modifiedSchema = originalSchema.replace(
  'generator client {\n  provider = "prisma-client-js"\n}',
  `generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}`
);

// Write modified schema
fs.writeFileSync(localSchemaPath, modifiedSchema);
console.log('✅ Schema created with explicit output path');

// Step 4: Set environment and generate
console.log('\n4. Generating Prisma Client...');
try {
  // Always use a valid PostgreSQL URL for generation
  // The actual URL will be used at runtime
  const dummyUrl = 'postgresql://postgres:password@localhost:5432/mydb?schema=public';
  
  const env = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || dummyUrl,
    PRISMA_GENERATE_DATAPROXY: 'false'
  };
  
  console.log('Using DATABASE_URL for generation:', env.DATABASE_URL ? 'Set' : 'Using dummy');
  
  // Generate with the modified schema
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

// Step 5: Verify the generation
console.log('\n5. Verifying generation...');
const clientPath = path.join(bffDir, 'node_modules/@prisma/client');
const prismaPath = path.join(bffDir, 'node_modules/.prisma/client');

if (!fs.existsSync(clientPath)) {
  console.error('❌ @prisma/client not found at:', clientPath);
  process.exit(1);
}

if (!fs.existsSync(prismaPath)) {
  console.error('❌ .prisma/client not found at:', prismaPath);
  process.exit(1);
}

// Check the generated index.js to ensure it's not using prisma://
const indexPath = path.join(prismaPath, 'index.js');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (indexContent.includes('prisma://')) {
    console.error('❌ Generated client contains prisma:// references');
    console.log('This usually means Prisma Accelerate was detected. Regenerating...');
    
    // Try again with explicit non-accelerate generation
    env.PRISMA_ACCELERATE_DISABLED = 'true';
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: bffDir,
      env: env
    });
  }
}

console.log('✅ Verification complete');

// Step 6: Clean up
console.log('\n6. Cleaning up...');
try {
  // Keep the schema for debugging if needed
  // fs.rmSync(localSchemaDir, { recursive: true, force: true });
  console.log('✅ Keeping local schema for reference');
} catch {
  // Ignore cleanup errors
}

console.log('\n=== Prisma Railway Fix Complete ===');