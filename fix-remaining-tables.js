const { Client } = require('pg');

// Database connections
const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';
const DEV_DB_URL = 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway';

async function fixRemainingTables() {
  console.log('🔧 Fixing remaining tables that failed to clone...');
  
  const prodClient = new Client({ connectionString: PROD_DB_URL });
  const devClient = new Client({ connectionString: DEV_DB_URL });
  
  try {
    await prodClient.connect();
    await devClient.connect();
    console.log('✅ Connected to both databases');
    
    // Tables that need fixing based on verification
    const tablesToFix = [
      'AuditLog', 'CommercialBenefit', 'CustomRole', 'Department', 
      'Document', 'ModuleSubscription', 'Notification', 'Payslip',
      'PermissionCache', 'ProfilePhoto', 'TrainingSession'
    ];
    
    console.log(`\n🎯 Fixing ${tablesToFix.length} tables...`);
    
    for (const table of tablesToFix) {
      console.log(`\n🔄 Fixing table: ${table}`);
      
      try {
        // Clear the table
        await devClient.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`  ✓ Cleared ${table}`);
        
        // Get data from production with proper type casting for problematic tables
        let query = `SELECT * FROM "${table}"`;
        
        // Special handling for Document table with array issues
        if (table === 'Document') {
          // Get column info first
          const columns = await prodClient.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
          `, [table]);
          
          // Build select with proper casting for array columns
          const selectColumns = columns.rows.map(col => {
            if (col.data_type === 'ARRAY' || col.data_type.includes('[]')) {
              return `"${col.column_name}"::text as "${col.column_name}"`;
            }
            return `"${col.column_name}"`;
          }).join(', ');
          
          query = `SELECT ${selectColumns} FROM "${table}"`;
        }
        
        const prodData = await prodClient.query(query);
        
        if (prodData.rows.length > 0) {
          const columns = Object.keys(prodData.rows[0]);
          const columnNames = columns.map(col => `"${col}"`).join(', ');
          
          // Insert row by row for better error handling
          let successCount = 0;
          
          for (let i = 0; i < prodData.rows.length; i++) {
            const row = prodData.rows[i];
            
            try {
              const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
              const values = columns.map(col => {
                let value = row[col];
                
                // Special handling for array columns in Document table
                if (table === 'Document' && typeof value === 'string' && value.startsWith('[')) {
                  try {
                    // Convert string representation back to array
                    value = JSON.parse(value);
                  } catch (parseError) {
                    console.log(`    ⚠️ Could not parse array for ${col}: ${value}`);
                    value = null;
                  }
                }
                
                return value;
              });
              
              const insertQuery = `INSERT INTO "${table}" (${columnNames}) VALUES (${placeholders})`;
              await devClient.query(insertQuery, values);
              successCount++;
              
            } catch (rowError) {
              console.log(`    ⚠️ Row ${i + 1} failed:`, rowError.message);
            }
          }
          
          console.log(`  ✓ Copied ${successCount}/${prodData.rows.length} rows to ${table}`);
          
        } else {
          console.log(`  - ${table} is empty in production`);
        }
        
      } catch (error) {
        console.log(`  ❌ Failed to fix ${table}:`, error.message);
      }
    }
    
    // Verify the fixes
    console.log(`\n🔍 Verifying fixes...`);
    
    for (const table of tablesToFix) {
      try {
        const prodCount = await prodClient.query(`SELECT COUNT(*) FROM "${table}"`);
        const devCount = await devClient.query(`SELECT COUNT(*) FROM "${table}"`);
        
        const prodRows = parseInt(prodCount.rows[0].count);
        const devRows = parseInt(devCount.rows[0].count);
        
        if (prodRows === devRows) {
          console.log(`✅ ${table}: ${prodRows} rows (fixed)`);
        } else {
          console.log(`⚠️ ${table}: PROD=${prodRows}, DEV=${devRows} (still mismatched)`);
        }
      } catch (error) {
        console.log(`❌ ${table}: Error verifying - ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Fix process completed!`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await prodClient.end();
    await devClient.end();
  }
}

fixRemainingTables();