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
    
    // Get list of tables from dev and prod databases
    console.log('📋 Getting table lists...');
    const devTablesResult = await devClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    const prodTablesResult = await prodClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    const devTables = devTablesResult.rows.map(row => row.tablename);
    const prodTables = new Set(prodTablesResult.rows.map(row => row.tablename));
    const tables = devTables.filter(t => prodTables.has(t));
    const skipped = devTables.filter(t => !prodTables.has(t));
    console.log(`📊 Dev tables: ${devTables.length}, Prod tables: ${prodTables.size}, Intersect: ${tables.length}`);
    if (skipped.length) {
      console.log(`⚠️ Skipping ${skipped.length} dev-only tables not present in prod:`, skipped);
    }
    
    // Start transaction on production
    await prodClient.query('BEGIN');
    
    try {
      // Disable foreign key checks temporarily
      console.log('🔒 Disabling foreign key constraints...');
      await prodClient.query('SET session_replication_role = replica');
      
      // Clear all common tables in reverse order to avoid foreign key issues
      console.log('🗑️ Clearing production tables...');
      for (const table of tables.reverse()) {
        await prodClient.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`  ✓ Cleared ${table}`);
      }
      
      // Copy data from dev to production for common tables
      console.log('📥 Copying data from dev to production...');
      tables.reverse(); // Back to original order
      
      for (const table of tables) {
        // Get data from dev
        const devData = await devClient.query(`SELECT * FROM "${table}"`);

        if (devData.rows.length > 0) {
          // Determine common columns between dev and prod for this table
          const devColsRes = await devClient.query(
            `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
            [table]
          );
          const prodColsRes = await prodClient.query(
            `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
            [table]
          );
          const prodColsMap = new Map(prodColsRes.rows.map(r => [r.column_name, { data_type: r.data_type, udt_name: r.udt_name }]));
          const commonColumns = devColsRes.rows
            .map(r => ({ name: r.column_name, data_type: r.data_type, udt_name: r.udt_name }))
            .filter(c => prodColsMap.has(c.name));

          if (commonColumns.length === 0) {
            console.log(`  ⚠️  No common columns for ${table}, skipping`);
            continue;
          }

          const columnNames = commonColumns.map(col => `"${col.name}"`).join(', ');

          let inserted = 0;
          let rowIndex = 0;
          for (const row of devData.rows) {
            try {
              const spName = `sp_${table}_${rowIndex++}`;
              await prodClient.query(`SAVEPOINT ${spName}`);
              const placeholders = commonColumns.map((_, idx) => `$${idx + 1}`).join(', ');
              const values = commonColumns.map(col => {
                const prodType = prodColsMap.get(col.name);
                let v = row[col.name];
                // Normalize arrays (e.g., text[])
                const isArrayType = prodType && (prodType.data_type === 'ARRAY' || (typeof prodType.udt_name === 'string' && prodType.udt_name.startsWith('_')));
                if (isArrayType) {
                  if (Array.isArray(v)) return v;
                  if (typeof v === 'string') {
                    const s = v.trim();
                    try {
                      if (s.startsWith('[') && s.endsWith(']')) {
                        const parsed = JSON.parse(s);
                        if (Array.isArray(parsed)) return parsed;
                      }
                      // Postgres array literal like {a,b}
                      if (s.startsWith('{') && s.endsWith('}')) {
                        // naive split on comma not safe for quoted commas; fallback: strip braces and split
                        const inner = s.slice(1, -1);
                        return inner.length ? inner.split(',').map(x => x.replace(/^\"|\"$/g, '').trim()) : [];
                      }
                    } catch (_) { /* fallthrough */ }
                    return [];
                  }
                  return [];
                }
                // Normalize JSON-ish objects to string
                if (v && typeof v === 'object' && !(v instanceof Date)) {
                  return JSON.stringify(v);
                }
                return v;
              });
              const insertQuery = `INSERT INTO "${table}" (${columnNames}) VALUES (${placeholders})`;
              await prodClient.query(insertQuery, values);
              await prodClient.query(`RELEASE SAVEPOINT ${spName}`);
              inserted++;
            } catch (e) {
              try { await prodClient.query(`ROLLBACK TO SAVEPOINT ${spName}`); } catch (_) {}
              console.log(`    ⚠️  Skipped a row in ${table}: ${e.message}`);
            }
          }
          console.log(`  ✓ Copied ${inserted}/${devData.rows.length} rows to ${table}`);
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