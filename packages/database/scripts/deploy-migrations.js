#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('🚀 Database Migration Deployment Script');
console.log('========================================');

// Check which database we're connected to (without exposing credentials)
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

// Extract just the database name for logging (safe)
const dbName = dbUrl.includes('railway') ? 
  (dbUrl.match(/\/([^?]+)/)?.[1] || 'unknown') : 'local';
console.log(`📍 Target database: ${dbName}`);
console.log(`🌿 Branch: ${process.env.RAILWAY_GIT_BRANCH || 'unknown'}`);
console.log(`🏗️  Service: ${process.env.RAILWAY_SERVICE_NAME || 'unknown'}`);

async function runMigrations() {
  try {
    // Check migration status
    console.log('\n📋 Checking migration status...');
    const status = execSync('npx prisma migrate status', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
  
  console.log(status);
  
  if (status.includes('Database schema is up to date')) {
    console.log('✅ Database is already up to date!');
    process.exit(0);
  }
  
  // Apply pending migrations
  console.log('\n📦 Applying pending migrations...');
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ Migrations applied successfully!');
  
  // Run default tenant seeding after migrations
  console.log('\n🌱 Running default tenant seeding...');
  try {
    const { seedDefaultTenant } = require('./seed-default-tenant.js');
    await seedDefaultTenant();
    console.log('✅ Default tenant seeding completed!');
  } catch (seedError) {
    console.log('⚠️  Default tenant seeding failed (this is OK if already seeded):', seedError.message);
  }
  
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    
    // For Railway deployments, log error but continue
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log('\n⚠️  Railway deployment detected');
      console.log('⚠️  Continuing deployment despite migration error');
      console.log('⚠️  Check Railway logs and consider manual intervention');
      console.log('⚠️  You can run migrations manually with: railway run npx prisma migrate deploy');
      process.exit(0); // Don't fail the build
    } else {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   - Check DATABASE_URL is correct');
      console.log('   - Ensure database is accessible');
      console.log('   - Review migration files for syntax errors');
      process.exit(1);
    }
  }
}

// Run the migration function
runMigrations();