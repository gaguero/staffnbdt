const { Client } = require('pg');

// Database connections
const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';
const DEV_DB_URL = 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway';

async function cloneDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  console.log(`🚀 Starting database clone at ${timestamp}`);
  
  const devClient = new Client({ connectionString: DEV_DB_URL });
  const prodClient = new Client({ connectionString: PROD_DB_URL });
  
  try {
    // Connect to both databases
    console.log('🔌 Connecting to databases...');
    await devClient.connect();
    await prodClient.connect();
    
    // Get list of tables from dev database
    console.log('📋 Getting table list from dev database...');
    const tablesResult = await devClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`📊 Found ${tables.length} tables to migrate`);
    
    // Start transaction on production
    await prodClient.query('BEGIN');
    
    try {
      // Disable foreign key checks temporarily
      console.log('🔒 Disabling foreign key constraints...');
      await prodClient.query('SET session_replication_role = replica');
      
      // Clear all tables in reverse order to avoid foreign key issues
      console.log('🗑️ Clearing production tables...');
      for (const table of tables.reverse()) {
        await prodClient.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`  ✓ Cleared ${table}`);
      }
      
      // Copy data from dev to production
      console.log('📥 Copying data from dev to production...');
      tables.reverse(); // Back to original order
      
      for (const table of tables) {
        // Get data from dev
        const devData = await devClient.query(`SELECT * FROM "${table}"`);
        
        if (devData.rows.length > 0) {
          // Get column names
          const columns = Object.keys(devData.rows[0]);
          const columnNames = columns.map(col => `"${col}"`).join(', ');
          
          // Prepare values
          const values = devData.rows.map((row, index) => {
            const placeholders = columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`).join(', ');
            return `(${placeholders})`;
          }).join(', ');
          
          // Flatten all values
          const allValues = devData.rows.flatMap(row => columns.map(col => row[col]));
          
          // Insert into production
          if (allValues.length > 0) {
            const insertQuery = `INSERT INTO "${table}" (${columnNames}) VALUES ${values}`;
            await prodClient.query(insertQuery, allValues);
            console.log(`  ✓ Copied ${devData.rows.length} rows to ${table}`);
          }
        } else {
          console.log(`  - ${table} is empty`);
        }
      }
      
      // Re-enable foreign key checks
      console.log('🔓 Re-enabling foreign key constraints...');
      await prodClient.query('SET session_replication_role = DEFAULT');
      
      // Commit transaction
      await prodClient.query('COMMIT');
      console.log('✅ Database clone completed successfully!');
      
    } catch (error) {
      await prodClient.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await devClient.end();
    await prodClient.end();
  }
}

// Run the migration
cloneDatabase().catch(console.error);