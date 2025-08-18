const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== Prisma Client Generation for BFF ===');
console.log('Current directory:', __dirname);
console.log('Environment DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Ensure @prisma/client is installed
try {
  require.resolve('@prisma/client');
  console.log('✅ @prisma/client is installed');
} catch (e) {
  console.log('📦 Installing @prisma/client...');
  execSync('npm install @prisma/client@5.11.0 --no-save', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
}

// Paths
const schemaPath = path.join(__dirname, '../../packages/database/prisma/schema.prisma');
const outputPath = path.join(__dirname, 'node_modules/.prisma/client');
const clientPath = path.join(__dirname, 'node_modules/@prisma/client');

console.log('Schema path:', schemaPath);
console.log('Output path:', outputPath);
console.log('Client path:', clientPath);

// Verify schema exists
if (!fs.existsSync(schemaPath)) {
  console.error('ERROR: Schema file not found at', schemaPath);
  process.exit(1);
}

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Created directory:', dir);
  }
};

ensureDir(path.dirname(outputPath));
ensureDir(path.dirname(clientPath));

try {
  console.log('\nGenerating Prisma Client...');
  
  // First, ensure Prisma CLI is available
  try {
    execSync('npx prisma --version', { stdio: 'ignore' });
  } catch (e) {
    console.log('Installing Prisma CLI...');
    execSync('npm install prisma@5.11.0 --no-save', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
  }
  
  // Generate with explicit schema path and output directory
  const command = `npx prisma generate --schema="${schemaPath}"`;
  console.log('Running:', command);
  
  // Create temporary schema with local output
  const tempSchemaPath = path.join(__dirname, 'temp-schema.prisma');
  const originalSchema = fs.readFileSync(schemaPath, 'utf8');
  const localSchema = originalSchema.replace(
    'output   = "../node_modules/.prisma/client"',
    `output   = "${outputPath.replace(/\\/g, '\\\\')}"`
  );
  fs.writeFileSync(tempSchemaPath, localSchema);
  
  const localCommand = `npx prisma generate --schema="${tempSchemaPath}"`;
  console.log('Running:', localCommand);
  
  execSync(localCommand, {
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      // Force output to local node_modules
      PRISMA_GENERATE_DATAPROXY: 'false'
    }
  });
  
  // Clean up temp schema
  fs.unlinkSync(tempSchemaPath);
  
  console.log('\n✅ Prisma Client generated successfully');
  
  // Verify the client was generated
  if (fs.existsSync(outputPath)) {
    console.log('✅ Verified: .prisma/client exists');
  } else {
    console.warn('⚠️  Warning: .prisma/client not found at expected location');
  }
  
  if (fs.existsSync(clientPath)) {
    console.log('✅ Verified: @prisma/client exists');
  } else {
    console.warn('⚠️  Warning: @prisma/client not found at expected location');
  }
  
} catch (error) {
  console.error('\n❌ Failed to generate Prisma Client:', error.message);
  process.exit(1);
}

console.log('\n=== Generation Complete ===');