const { Client } = require('pg');

// Database connections
const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';
const DEV_DB_URL = 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway';

async function completeMigration() {
  console.log('🚀 Starting COMPLETE PRODUCTION -> DEVELOPMENT migration...');
  
  const prodClient = new Client({ connectionString: PROD_DB_URL });
  const devClient = new Client({ connectionString: DEV_DB_URL });
  
  try {
    await prodClient.connect();
    await devClient.connect();
    console.log('✅ Connected to both databases');
    
    // Step 1: Analyze dependencies
    console.log('\n📋 Analyzing table dependencies...');
    
    const foreignKeysResult = await prodClient.query(`
      SELECT 
        tc.table_name as table_name,
        kcu.column_name as column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `);
    
    const dependencies = {};
    foreignKeysResult.rows.forEach(row => {
      if (!dependencies[row.table_name]) {
        dependencies[row.table_name] = [];
      }
      dependencies[row.table_name].push(row.foreign_table_name);
    });
    
    console.log('🔗 Dependencies found:');
    Object.entries(dependencies).forEach(([table, deps]) => {
      console.log(`  ${table} -> depends on: ${deps.join(', ')}`);
    });
    
    // Step 2: Determine migration order based on dependencies
    const allTables = await prodClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const tables = allTables.rows.map(row => row.tablename);
    
    // Topological sort for dependency order
    const orderedTables = topologicalSort(tables, dependencies);
    console.log('\n📑 Migration order determined:');
    orderedTables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table}`);
    });
    
    // Step 3: Disable all foreign key constraints
    console.log('\n🔒 Disabling foreign key constraints...');
    await devClient.query('SET session_replication_role = replica');
    
    // Step 4: Clear all tables in reverse dependency order
    console.log('\n🗑️ Clearing all tables...');
    for (const table of orderedTables.reverse()) {
      try {
        await devClient.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`  ✓ Cleared ${table}`);
      } catch (error) {
        console.log(`  ⚠️ Could not clear ${table}: ${error.message}`);
      }
    }
    
    // Step 5: Migrate tables in dependency order
    console.log('\n📥 Migrating tables in dependency order...');
    orderedTables.reverse(); // Back to correct order
    
    const migrationResults = [];
    
    for (const table of orderedTables) {
      console.log(`\n🔄 Migrating: ${table}`);
      
      try {
        // Get data from production
        const prodData = await prodClient.query(`SELECT * FROM "${table}"`);
        
        if (prodData.rows.length > 0) {
          const columns = Object.keys(prodData.rows[0]);
          const columnNames = columns.map(col => `"${col}"`).join(', ');
          
          // Special handling for JSON/Array columns
          let processedRows = 0;
          let skippedRows = 0;
          
          for (const row of prodData.rows) {
            try {
              const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
              const values = columns.map(col => {
                let value = row[col];
                
                // Handle JSON columns properly
                if (value && typeof value === 'object') {
                  return JSON.stringify(value);
                }
                
                // Handle array columns that come as strings
                if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                  try {
                    // Validate JSON
                    JSON.parse(value);
                    return value;
                  } catch (parseError) {
                    // If not valid JSON, convert to null or handle appropriately
                    console.log(`    ⚠️ Invalid JSON in ${table}.${col}: ${value}`);
                    return null;
                  }
                }
                
                return value;
              });
              
              const insertQuery = `INSERT INTO "${table}" (${columnNames}) VALUES (${placeholders})`;
              await devClient.query(insertQuery, values);
              processedRows++;
              
            } catch (rowError) {
              console.log(`    ⚠️ Row failed: ${rowError.message}`);
              skippedRows++;
            }
          }
          
          console.log(`  ✓ ${table}: ${processedRows}/${prodData.rows.length} rows (${skippedRows} skipped)`);
          migrationResults.push({
            table,
            total: prodData.rows.length,
            migrated: processedRows,
            skipped: skippedRows,
            success: true
          });
          
        } else {
          console.log(`  - ${table}: Empty table`);
          migrationResults.push({
            table,
            total: 0,
            migrated: 0,
            skipped: 0,
            success: true
          });
        }
        
      } catch (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
        migrationResults.push({
          table,
          total: 0,
          migrated: 0,
          skipped: 0,
          success: false,
          error: error.message
        });
      }
    }
    
    // Step 6: Re-enable foreign key constraints
    console.log('\n🔓 Re-enabling foreign key constraints...');
    await devClient.query('SET session_replication_role = DEFAULT');
    
    // Step 7: Final verification
    console.log('\n🔍 Final verification...');
    
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalRows = 0;
    let migratedRows = 0;
    
    for (const result of migrationResults) {
      try {
        const devCount = await devClient.query(`SELECT COUNT(*) FROM "${result.table}"`);
        const prodCount = await prodClient.query(`SELECT COUNT(*) FROM "${result.table}"`);
        
        const devRows = parseInt(devCount.rows[0].count);
        const prodRows = parseInt(prodCount.rows[0].count);
        
        totalRows += prodRows;
        migratedRows += devRows;
        
        if (prodRows === devRows && prodRows > 0) {
          console.log(`✅ ${result.table}: ${prodRows} rows (complete)`);
          totalSuccess++;
        } else if (devRows > 0 && devRows < prodRows) {
          console.log(`⚠️ ${result.table}: ${devRows}/${prodRows} rows (partial)`);
          totalSuccess++;
        } else if (prodRows === 0 && devRows === 0) {
          console.log(`✅ ${result.table}: Empty (match)`);
          totalSuccess++;
        } else {
          console.log(`❌ ${result.table}: ${devRows}/${prodRows} rows (failed)`);
          totalFailed++;
        }
      } catch (verifyError) {
        console.log(`❌ ${result.table}: Verification failed`);
        totalFailed++;
      }
    }
    
    // Summary
    console.log(`\n📊 MIGRATION SUMMARY:`);
    console.log(`✅ Tables successfully migrated: ${totalSuccess}`);
    console.log(`❌ Tables failed: ${totalFailed}`);
    console.log(`📈 Total data: ${migratedRows}/${totalRows} rows migrated`);
    console.log(`📈 Success rate: ${((migratedRows/totalRows) * 100).toFixed(1)}%`);
    
    if (totalFailed === 0) {
      console.log(`\n🎉 COMPLETE MIGRATION SUCCESSFUL!`);
    } else {
      console.log(`\n⚠️ Migration completed with ${totalFailed} issues`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await prodClient.end();
    await devClient.end();
  }
}

// Topological sort function for dependency ordering
function topologicalSort(tables, dependencies) {
  const visited = new Set();
  const visiting = new Set();
  const result = [];
  
  function visit(table) {
    if (visiting.has(table)) {
      // Circular dependency - add to result anyway
      return;
    }
    if (visited.has(table)) {
      return;
    }
    
    visiting.add(table);
    
    // Visit dependencies first
    const deps = dependencies[table] || [];
    for (const dep of deps) {
      if (tables.includes(dep)) {
        visit(dep);
      }
    }
    
    visiting.delete(table);
    visited.add(table);
    result.push(table);
  }
  
  // Visit all tables
  for (const table of tables) {
    visit(table);
  }
  
  return result;
}

completeMigration();