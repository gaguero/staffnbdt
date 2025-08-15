#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== Prisma Client Fix for Railway Production ===');
console.log('Working directory:', process.cwd());
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
  execSync('npm install @prisma/client@^5.11.0 --no-save', { 
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
  execSync('npm install prisma@^5.11.0 --no-save', { 
    stdio: 'inherit',
    cwd: bffDir 
  });
}

// Step 3: Copy schema to local directory temporarily
console.log('\n3. Setting up local schema...');
const localSchemaDir = path.join(bffDir, 'prisma');
const localSchemaPath = path.join(localSchemaDir, 'schema.prisma');

if (!fs.existsSync(localSchemaDir)) {
  fs.mkdirSync(localSchemaDir, { recursive: true });
}

// Copy schema file
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
fs.writeFileSync(localSchemaPath, schemaContent);
console.log('✅ Schema copied to local directory');

// Step 4: Generate Prisma Client with local schema
console.log('\n4. Generating Prisma Client locally...');
try {
  // Generate with local schema - this ensures it goes to the right place
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: bffDir,
    env: {
      ...process.env,
      PRISMA_GENERATE_DATAPROXY: 'false'
    }
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

// Check for types
const indexDtsPath = path.join(prismaPath, 'index.d.ts');
if (fs.existsSync(indexDtsPath)) {
  const content = fs.readFileSync(indexDtsPath, 'utf8');
  const hasUserType = content.includes('User') && 
                      (content.includes('export type') || 
                       content.includes('export interface') || 
                       content.includes('namespace Prisma'));
  
  if (hasUserType) {
    console.log('✅ TypeScript types verified');
  } else {
    console.warn('⚠️  Types may not be properly exported');
  }
}

// Step 6: Clean up temporary schema
console.log('\n6. Cleaning up...');
try {
  fs.rmSync(localSchemaDir, { recursive: true, force: true });
  console.log('✅ Temporary files cleaned');
} catch {
  // Ignore cleanup errors
}

console.log('\n=== Prisma Client Fix Complete ===');