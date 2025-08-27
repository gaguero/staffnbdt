const { Client } = require('pg');

// Database connections
const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';
const DEV_DB_URL = 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway';

async function cloneProdToDev() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  console.log(`🚀 Starting PRODUCTION -> DEVELOPMENT clone at ${timestamp}`);
  
  const prodClient = new Client({ connectionString: PROD_DB_URL });
  const devClient = new Client({ connectionString: DEV_DB_URL });
  
  try {
    // Connect to both databases
    console.log('🔌 Connecting to databases...');
    await prodClient.connect();
    console.log('✅ Connected to PRODUCTION database');
    await devClient.connect();
    console.log('✅ Connected to DEVELOPMENT database');
    
    // Get list of tables from production database
    console.log('📋 Getting table list from production database...');
    const tablesResult = await prodClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`📊 Found ${tables.length} tables to clone:`, tables);
    
    // Process tables one by one with individual transactions
    const successfulTables = [];
    const failedTables = [];
    
    for (const table of tables) {
      console.log(`\n🔄 Processing table: ${table}`);
      
      try {
        // Start individual transaction for this table
        await devClient.query('BEGIN');
        
        // Disable foreign key checks for this transaction
        await devClient.query('SET session_replication_role = replica');
        
        // Clear the table
        await devClient.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`  ✓ Cleared ${table}`);
        
        // Get data from production
        const prodData = await prodClient.query(`SELECT * FROM "${table}"`);
        
        if (prodData.rows.length > 0) {
          // Get column names and types
          const columnInfo = await prodClient.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
          `, [table]);
          
          const columns = columnInfo.rows.map(col => col.column_name);
          const columnNames = columns.map(col => `"${col}"`).join(', ');
          
          // Insert data row by row to handle data type issues
          let insertedRows = 0;
          
          for (const row of prodData.rows) {
            try {
              const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
              const values = columns.map(col => {
                const value = row[col];
                // Handle potential JSON parsing issues
                if (value && typeof value === 'object') {
                  return JSON.stringify(value);
                }
                return value;
              });
              
              const insertQuery = `INSERT INTO "${table}" (${columnNames}) VALUES (${placeholders})`;
              await devClient.query(insertQuery, values);
              insertedRows++;
            } catch (rowError) {
              console.log(`    ⚠️ Skipped problematic row in ${table}:`, rowError.message);
            }
          }
          
          console.log(`  ✓ Copied ${insertedRows}/${prodData.rows.length} rows to ${table}`);
        } else {
          console.log(`  - ${table} is empty in production`);
        }
        
        // Re-enable foreign key checks
        await devClient.query('SET session_replication_role = DEFAULT');
        
        // Commit this table
        await devClient.query('COMMIT');
        successfulTables.push(table);
        console.log(`  ✅ ${table} completed successfully`);
        
      } catch (error) {
        // Rollback this table
        try {
          await devClient.query('ROLLBACK');
        } catch (rollbackError) {
          // Ignore rollback errors
        }
        
        console.log(`  ❌ Failed to copy ${table}:`, error.message);
        failedTables.push({ table, error: error.message });
      }
    }
    
    // Summary
    console.log(`\n📊 Clone Summary:`);
    console.log(`✅ Successfully cloned: ${successfulTables.length} tables`);
    console.log(`❌ Failed to clone: ${failedTables.length} tables`);
    
    if (failedTables.length > 0) {
      console.log(`\n❌ Failed tables:`);
      failedTables.forEach(({ table, error }) => {
        console.log(`  - ${table}: ${error}`);
      });
    }
    
    if (successfulTables.length > 0) {
      console.log(`\n✅ Successfully cloned tables:`);
      successfulTables.forEach(table => console.log(`  - ${table}`));
    }
    
    // Verify some successful tables
    if (successfulTables.length > 0) {
      console.log(`\n🔍 Verifying clone for some tables...`);
      for (const table of successfulTables.slice(0, 5)) {
        try {
          const devCount = await devClient.query(`SELECT COUNT(*) FROM "${table}"`);
          const prodCount = await prodClient.query(`SELECT COUNT(*) FROM "${table}"`);
          const match = devCount.rows[0].count === prodCount.rows[0].count ? '✅' : '⚠️';
          console.log(`  ${match} ${table}: DEV=${devCount.rows[0].count}, PROD=${prodCount.rows[0].count}`);
        } catch (verifyError) {
          console.log(`  ❌ Could not verify ${table}`);
        }
      }
    }
    
    if (failedTables.length === 0) {
      console.log(`\n🎉 PRODUCTION -> DEVELOPMENT clone completed successfully!`);
    } else {
      console.log(`\n⚠️ Clone completed with ${failedTables.length} failed tables`);
    }
    
  } catch (error) {
    console.error('❌ Clone failed:', error.message);
    throw error;
  } finally {
    await prodClient.end();
    await devClient.end();
  }
}

// Run the clone
cloneProdToDev().catch(console.error);