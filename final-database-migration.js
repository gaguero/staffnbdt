const { Client } = require('pg');

// Database connections
const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';
const DEV_DB_URL = 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway';

async function migrateDatabaseData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  console.log(`🚀 Starting final database migration at ${timestamp}`);
  console.log('⚠️  WARNING: This will replace ALL production data with dev data!\n');
  
  const devClient = new Client({ connectionString: DEV_DB_URL });
  const prodClient = new Client({ connectionString: PROD_DB_URL });
  
  try {
    // Connect to both databases
    console.log('🔌 Connecting to databases...');
    await devClient.connect();
    await prodClient.connect();
    
    // Get all tables from dev (including ProfilePhoto)
    console.log('📋 Getting complete table list...');
    const tablesResult = await devClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename != '_prisma_migrations'
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`📊 Found ${tables.length} tables to migrate (excluding _prisma_migrations)`);
    tables.forEach(table => console.log(`  - ${table}`));
    
    // Start transaction on production
    console.log('\n🔒 Starting transaction...');
    await prodClient.query('BEGIN');
    
    try {
      // Disable foreign key checks temporarily
      console.log('🔒 Disabling foreign key constraints...');
      await prodClient.query('SET session_replication_role = replica');
      
      // Clear all tables in reverse order to avoid foreign key issues
      console.log('🗑️ Clearing production tables...');
      const reversedTables = [...tables].reverse();
      for (const table of reversedTables) {
        try {
          await prodClient.query(`TRUNCATE TABLE "${table}" CASCADE`);
          console.log(`  ✓ Cleared ${table}`);
        } catch (error) {
          if (error.code === '42P01') {
            console.log(`  ⚠️  Table ${table} doesn't exist in production, skipping...`);
          } else {
            throw error;
          }
        }
      }
      
      // Copy data from dev to production
      console.log('\n📥 Copying data from dev to production...');
      let totalRowsMigrated = 0;
      
      for (const table of tables) {
        try {
          // Check if table exists in production
          const tableExists = await prodClient.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            )
          `, [table]);
          
          if (!tableExists.rows[0].exists) {
            console.log(`  ⚠️  Table ${table} doesn't exist in production, skipping...`);
            continue;
          }
          
          // Get data from dev
          const devData = await devClient.query(`SELECT * FROM "${table}"`);
          
          if (devData.rows.length > 0) {
            // Get column names
            const columns = Object.keys(devData.rows[0]);
            const columnNames = columns.map(col => `"${col}"`).join(', ');
            
            // Insert rows in batches to avoid parameter limits
            const batchSize = 100;
            let insertedRows = 0;
            
            for (let i = 0; i < devData.rows.length; i += batchSize) {
              const batch = devData.rows.slice(i, i + batchSize);
              
              // Prepare values for this batch
              const values = batch.map((row, index) => {
                const placeholders = columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`).join(', ');
                return `(${placeholders})`;
              }).join(', ');
              
              // Flatten all values for this batch
              const allValues = batch.flatMap(row => columns.map(col => row[col]));
              
              // Insert batch into production
              const insertQuery = `INSERT INTO "${table}" (${columnNames}) VALUES ${values}`;
              await prodClient.query(insertQuery, allValues);
              insertedRows += batch.length;
            }
            
            console.log(`  ✅ Copied ${insertedRows} rows to ${table}`);
            totalRowsMigrated += insertedRows;
          } else {
            console.log(`  - ${table} is empty`);
          }
        } catch (error) {
          console.log(`  ❌ Error with table ${table}:`, error.message);
          throw error;
        }
      }
      
      // Re-enable foreign key checks
      console.log('\n🔓 Re-enabling foreign key constraints...');
      await prodClient.query('SET session_replication_role = DEFAULT');
      
      // Commit transaction
      await prodClient.query('COMMIT');
      console.log(`\n🎉 Database migration completed successfully!`);
      console.log(`📊 Total rows migrated: ${totalRowsMigrated}`);
      console.log(`📅 Migration timestamp: ${timestamp}`);
      
    } catch (error) {
      console.log('🔄 Rolling back transaction...');
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
migrateDatabaseData().catch(console.error);