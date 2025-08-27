const { execSync } = require('child_process');

// Get current timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

console.log('🚀 Starting database migration from dev to production');
console.log(`📅 Timestamp: ${timestamp}`);

try {
  console.log('\n1️⃣ Backing up production database...');
  execSync('railway run --environment production --service Postgres "pg_dump $DATABASE_URL" > prod_backup_' + timestamp + '.sql', 
    { stdio: 'inherit' });
  console.log('✅ Production backup created');

  console.log('\n2️⃣ Exporting dev database...');
  execSync('railway run --environment dev --service "Postgres Copy" "pg_dump --clean $DATABASE_URL" > dev_export_' + timestamp + '.sql', 
    { stdio: 'inherit' });
  console.log('✅ Dev database exported');

  console.log('\n3️⃣ Importing dev database to production...');
  execSync('railway run --environment production --service Postgres "psql $DATABASE_URL" < dev_export_' + timestamp + '.sql', 
    { stdio: 'inherit' });
  console.log('✅ Database migration completed');

  console.log('\n🎉 Migration successful! Production now has dev data.');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}