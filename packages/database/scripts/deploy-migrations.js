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
  let migrationSuccess = false;
  
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
      migrationSuccess = true;
    } else {
      // Apply pending migrations
      console.log('\n📦 Applying pending migrations...');
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('\n✅ Migrations applied successfully!');
      migrationSuccess = true;
    }
    
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    console.log('\n🔄 Attempting fallback: Direct schema push...');
    
    try {
      // Fallback: Push schema directly to sync database
      execSync('npx prisma db push --accept-data-loss', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Schema pushed successfully via fallback method!');
      migrationSuccess = true;
    } catch (pushError) {
      console.error('❌ Schema push also failed:', pushError.message);
      
      // For Railway deployments, log error but continue
      if (process.env.RAILWAY_ENVIRONMENT) {
        console.log('\n⚠️  Railway deployment detected');
        console.log('⚠️  Both migrations and schema push failed');
        console.log('⚠️  Continuing deployment - manual intervention may be needed');
        console.log('⚠️  Manual commands to try:');
        console.log('     railway run npx prisma migrate deploy');
        console.log('     railway run npx prisma db push --accept-data-loss');
        migrationSuccess = false; // Continue but mark as unsuccessful
      } else {
        console.log('\n💡 Troubleshooting tips:');
        console.log('   - Check DATABASE_URL is correct');
        console.log('   - Ensure database is accessible');
        console.log('   - Review migration files for syntax errors');
        console.log('   - Try: npx prisma db push --accept-data-loss');
        process.exit(1);
      }
    }
  }

  // Always attempt to seed default tenant data (regardless of migration success)
  console.log('\n🌱 Running default tenant seeding...');
  try {
    const { seedDefaultTenant } = require('./seed-default-tenant.js');
    await seedDefaultTenant();
    console.log('✅ Default tenant seeding completed!');
  } catch (seedError) {
    console.log('⚠️  Default tenant seeding failed (this is OK if already seeded):', seedError.message);
  }
  
  if (migrationSuccess) {
    console.log('\n🎉 Database setup completed successfully!');
  } else {
    console.log('\n⚠️  Database setup completed with issues - check logs above');
  }
}

// Run the migration function
runMigrations();