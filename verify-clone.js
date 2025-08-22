const { Client } = require('pg');

// Database connections
const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';
const DEV_DB_URL = 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway';

async function verifyClone() {
  console.log('🔍 Verifying database clone...');
  
  const prodClient = new Client({ connectionString: PROD_DB_URL });
  const devClient = new Client({ connectionString: DEV_DB_URL });
  
  try {
    await prodClient.connect();
    await devClient.connect();
    console.log('✅ Connected to both databases');
    
    // Get table list
    const tablesResult = await prodClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`\n📊 Checking ${tables.length} tables...\n`);
    
    let totalMismatches = 0;
    
    for (const table of tables) {
      try {
        const prodCount = await prodClient.query(`SELECT COUNT(*) FROM "${table}"`);
        const devCount = await devClient.query(`SELECT COUNT(*) FROM "${table}"`);
        
        const prodRows = parseInt(prodCount.rows[0].count);
        const devRows = parseInt(devCount.rows[0].count);
        
        if (prodRows === devRows) {
          console.log(`✅ ${table}: ${prodRows} rows (match)`);
        } else {
          console.log(`❌ ${table}: PROD=${prodRows}, DEV=${devRows} (mismatch)`);
          totalMismatches++;
        }
      } catch (error) {
        console.log(`⚠️ ${table}: Error checking - ${error.message}`);
        totalMismatches++;
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`✅ Tables matching: ${tables.length - totalMismatches}`);
    console.log(`❌ Tables with issues: ${totalMismatches}`);
    
    if (totalMismatches === 0) {
      console.log(`\n🎉 Database clone verification PASSED!`);
    } else {
      console.log(`\n⚠️ Database clone verification found ${totalMismatches} issues`);
    }
    
    // Check a few sample records
    console.log(`\n🔍 Sample data verification:`);
    const sampleTables = ['User', 'Organization', 'Permission'];
    
    for (const table of sampleTables) {
      try {
        const devSample = await devClient.query(`SELECT * FROM "${table}" LIMIT 1`);
        if (devSample.rows.length > 0) {
          console.log(`✅ ${table}: Has sample data`);
        } else {
          console.log(`❌ ${table}: No data found`);
        }
      } catch (error) {
        console.log(`⚠️ ${table}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await prodClient.end();
    await devClient.end();
  }
}

verifyClone();