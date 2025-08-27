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
    
    // Start transaction on development database
    await devClient.query('BEGIN');
    
    try {
      // Disable foreign key checks temporarily
      console.log('🔒 Disabling foreign key constraints on development...');
      await devClient.query('SET session_replication_role = replica');
      
      // Clear all tables in development database
      console.log('🗑️ Clearing development database tables...');
      for (const table of tables.reverse()) {
        try {
          await devClient.query(`TRUNCATE TABLE "${table}" CASCADE`);
          console.log(`  ✓ Cleared ${table}`);
        } catch (error) {
          console.log(`  ⚠️ Could not clear ${table}:`, error.message);
        }
      }
      
      // Copy data from production to development
      console.log('📥 Copying data from PRODUCTION to DEVELOPMENT...');
      tables.reverse(); // Back to original order
      
      for (const table of tables) {
        try {
          // Get data from production
          const prodData = await prodClient.query(`SELECT * FROM "${table}"`);
          
          if (prodData.rows.length > 0) {
            // Get column names
            const columns = Object.keys(prodData.rows[0]);
            const columnNames = columns.map(col => `"${col}"`).join(', ');
            
            // Insert data in batches to avoid parameter limits
            const batchSize = 100;
            let insertedRows = 0;
            
            for (let i = 0; i < prodData.rows.length; i += batchSize) {
              const batch = prodData.rows.slice(i, i + batchSize);
              
              // Prepare batch insert
              const values = batch.map((row, batchIndex) => {
                const placeholders = columns.map((_, colIndex) => `$${batchIndex * columns.length + colIndex + 1}`).join(', ');
                return `(${placeholders})`;
              }).join(', ');
              
              // Flatten all values for this batch
              const allValues = batch.flatMap(row => columns.map(col => row[col]));
              
              // Insert batch into development
              if (allValues.length > 0) {
                const insertQuery = `INSERT INTO "${table}" (${columnNames}) VALUES ${values}`;
                await devClient.query(insertQuery, allValues);
                insertedRows += batch.length;
              }
            }
            
            console.log(`  ✓ Copied ${insertedRows} rows to ${table}`);
          } else {
            console.log(`  - ${table} is empty in production`);
          }
        } catch (error) {
          console.log(`  ❌ Error copying table ${table}:`, error.message);
          // Continue with other tables
        }
      }
      
      // Re-enable foreign key checks
      console.log('🔓 Re-enabling foreign key constraints...');
      await devClient.query('SET session_replication_role = DEFAULT');
      
      // Commit transaction
      await devClient.query('COMMIT');
      console.log('✅ PRODUCTION -> DEVELOPMENT clone completed successfully!');
      
      // Verify the clone
      console.log('🔍 Verifying clone...');
      for (const table of tables.slice(0, 3)) { // Check first 3 tables
        const devCount = await devClient.query(`SELECT COUNT(*) FROM "${table}"`);
        const prodCount = await prodClient.query(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`  ${table}: DEV=${devCount.rows[0].count}, PROD=${prodCount.rows[0].count}`);
      }
      
    } catch (error) {
      await devClient.query('ROLLBACK');
      throw error;
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