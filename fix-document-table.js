const { Client } = require('pg');

const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';
const DEV_DB_URL = 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway';

async function fixDocumentTable() {
  console.log('🔧 Fixing Document table array column issues...');
  
  const prodClient = new Client({ connectionString: PROD_DB_URL });
  const devClient = new Client({ connectionString: DEV_DB_URL });
  
  try {
    await prodClient.connect();
    await devClient.connect();
    
    // Get Document table structure
    const columns = await prodClient.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'Document' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Document table columns:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.udt_name})`);
    });
    
    // Get production data
    const prodData = await prodClient.query('SELECT * FROM "Document"');
    console.log(`\n📊 Found ${prodData.rows.length} rows in production`);
    
    // Clear dev table
    await devClient.query('TRUNCATE TABLE "Document" CASCADE');
    console.log('✓ Cleared Document table');
    
    let successCount = 0;
    
    for (let i = 0; i < prodData.rows.length; i++) {
      const row = prodData.rows[i];
      
      try {
        // Handle the tags column which appears to be the problematic array
        const processedRow = { ...row };
        
        if (processedRow.tags && typeof processedRow.tags === 'string') {
          try {
            // Convert string array to proper array format
            const arrayString = processedRow.tags;
            console.log(`  Processing tags: ${arrayString}`);
            
            // Parse the malformed array string
            const cleanArray = arrayString
              .replace(/^\["/, '')  // Remove opening ["
              .replace(/"\]$/, '')  // Remove closing "]
              .split('","')         // Split on ","
              .filter(tag => tag.length > 0); // Remove empty strings
            
            processedRow.tags = cleanArray;
            console.log(`    Converted to: [${cleanArray.join(', ')}]`);
            
          } catch (parseError) {
            console.log(`    ⚠️ Could not parse tags, setting to null`);
            processedRow.tags = null;
          }
        }
        
        // Build insert query
        const columnNames = Object.keys(processedRow);
        const placeholders = columnNames.map((_, index) => `$${index + 1}`).join(', ');
        const values = columnNames.map(col => processedRow[col]);
        
        const insertQuery = `INSERT INTO "Document" (${columnNames.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders})`;
        
        await devClient.query(insertQuery, values);
        successCount++;
        console.log(`  ✓ Row ${i + 1} inserted successfully`);
        
      } catch (rowError) {
        console.log(`  ❌ Row ${i + 1} failed: ${rowError.message}`);
      }
    }
    
    console.log(`\n✅ Document table: ${successCount}/${prodData.rows.length} rows migrated`);
    
    // Verify
    const devCount = await devClient.query('SELECT COUNT(*) FROM "Document"');
    console.log(`🔍 Verification: ${devCount.rows[0].count} rows in development`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await prodClient.end();
    await devClient.end();
  }
}

fixDocumentTable();