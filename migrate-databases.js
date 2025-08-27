const { execSync } = require('child_process');

// Database URLs from Railway
const PROD_DB = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';
const DEV_DB = 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

console.log('🚀 Database Migration: Dev → Production');
console.log(`📅 Timestamp: ${timestamp}`);
console.log('⚠️  WARNING: This will replace ALL production data with dev data!');

try {
  console.log('\n1️⃣ Backing up production database...');
  const backupFile = `prod_backup_${timestamp}.sql`;
  
  // Use Railway to execute pg_dump on production database
  execSync(`railway run --service Postgres "pg_dump '${PROD_DB}'" > ${backupFile}`, 
    { stdio: 'inherit', env: { ...process.env, DATABASE_URL: PROD_DB } });
  
  console.log(`✅ Production backup saved as: ${backupFile}`);

  console.log('\n2️⃣ Exporting dev database...');
  const exportFile = `dev_export_${timestamp}.sql`;
  
  // Use Railway to execute pg_dump on dev database with --clean flag
  execSync(`railway run --service "Postgres Copy" "pg_dump --clean '${DEV_DB}'" > ${exportFile}`, 
    { stdio: 'inherit', env: { ...process.env, DATABASE_URL: DEV_DB } });
  
  console.log(`✅ Dev database exported as: ${exportFile}`);

  console.log('\n3️⃣ Importing dev data into production...');
  
  // Use Railway to execute psql on production database
  execSync(`railway run --service Postgres "psql '${PROD_DB}'" < ${exportFile}`, 
    { stdio: 'inherit', env: { ...process.env, DATABASE_URL: PROD_DB } });
  
  console.log('✅ Database migration completed successfully!');
  console.log('\n🎉 Production database now contains dev data.');
  console.log(`📁 Backup file: ${backupFile}`);
  console.log(`📁 Export file: ${exportFile}`);

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('\n🔄 To restore production, run:');
  console.log(`railway run --service Postgres "psql '${PROD_DB}'" < prod_backup_${timestamp}.sql`);
  process.exit(1);
}