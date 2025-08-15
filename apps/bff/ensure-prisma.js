#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== Ensuring Prisma Client for Production Build ===');

// This script ensures Prisma client is generated properly for Railway deployment
// It's designed to work in the monorepo structure where the schema is in packages/database

const bffDir = __dirname;
const databaseDir = path.join(__dirname, '../../packages/database');
const schemaPath = path.join(databaseDir, 'prisma/schema.prisma');

console.log('BFF Directory:', bffDir);
console.log('Database Directory:', databaseDir);
console.log('Schema Path:', schemaPath);

// Verify schema exists
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Schema not found at:', schemaPath);
  process.exit(1);
}

// Step 1: Ensure @prisma/client is installed in bff
console.log('\n1. Ensuring @prisma/client in BFF...');
try {
  require.resolve('@prisma/client');
  console.log('✅ @prisma/client already installed');
} catch {
  console.log('Installing @prisma/client...');
  execSync('npm install @prisma/client@5.11.0', { 
    stdio: 'inherit',
    cwd: bffDir 
  });
}

// Step 2: Ensure prisma CLI is available
console.log('\n2. Ensuring Prisma CLI...');
try {
  execSync('npx prisma --version', { 
    stdio: 'pipe',
    cwd: bffDir 
  });
  console.log('✅ Prisma CLI available');
} catch {
  console.log('Installing Prisma CLI...');
  execSync('npm install prisma@5.11.0', { 
    stdio: 'inherit',
    cwd: bffDir 
  });
}

// Step 3: Generate Prisma Client in packages/database first (as designed)
console.log('\n3. Generating in packages/database...');
try {
  execSync('npm run db:generate', {
    stdio: 'inherit',
    cwd: databaseDir,
    env: process.env
  });
  console.log('✅ Generated in packages/database');
} catch (error) {
  console.log('⚠️  Could not generate in packages/database, continuing...');
}

// Step 4: Generate Prisma Client in apps/bff (for local types)
console.log('\n4. Generating in apps/bff...');
try {
  const generateCmd = `npx prisma generate --schema="${schemaPath}"`;
  execSync(generateCmd, {
    stdio: 'inherit',
    cwd: bffDir,
    env: process.env
  });
  console.log('✅ Generated in apps/bff');
} catch (error) {
  console.error('❌ Failed to generate in apps/bff:', error.message);
  process.exit(1);
}

// Step 5: Verify generation was successful
console.log('\n5. Verifying generation...');
const clientPath = path.join(bffDir, 'node_modules/@prisma/client');
const prismaPath = path.join(bffDir, 'node_modules/.prisma/client');

if (fs.existsSync(clientPath)) {
  console.log('✅ @prisma/client exists at:', clientPath);
} else {
  console.error('❌ @prisma/client not found');
  process.exit(1);
}

if (fs.existsSync(prismaPath)) {
  console.log('✅ .prisma/client exists at:', prismaPath);
  const indexPath = path.join(prismaPath, 'index.d.ts');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    if (content.includes('export type User')) {
      console.log('✅ Types verified: User type found in index.d.ts');
    } else {
      console.warn('⚠️  Warning: User type not found in generated client');
    }
  }
} else {
  console.warn('⚠️  .prisma/client not found at expected location');
}

console.log('\n=== Prisma Client Setup Complete ===');