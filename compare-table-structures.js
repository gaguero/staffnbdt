const { Client } = require('pg');

// Database connections
const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';
const DEV_DB_URL = 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway';

async function compareTableStructures() {
  const devClient = new Client({ connectionString: DEV_DB_URL });
  const prodClient = new Client({ connectionString: PROD_DB_URL });
  
  try {
    await devClient.connect();
    await prodClient.connect();
    
    console.log('🔍 Comparing table structures...\n');
    
    // Get common tables first
    const devTables = await devClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const prodTables = await prodClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const devTableNames = devTables.rows.map(row => row.tablename);
    const prodTableNames = prodTables.rows.map(row => row.tablename);
    const commonTables = devTableNames.filter(table => prodTableNames.includes(table));
    
    console.log(`📊 Analyzing ${commonTables.length} common tables...\n`);
    
    const differences = [];
    
    for (const tableName of commonTables) {
      // Get column information for both databases
      const columnQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1
        ORDER BY ordinal_position
      `;
      
      const devColumns = await devClient.query(columnQuery, [tableName]);
      const prodColumns = await prodClient.query(columnQuery, [tableName]);
      
      // Compare columns
      const devColMap = {};
      devColumns.rows.forEach(col => {
        devColMap[col.column_name] = col;
      });
      
      const prodColMap = {};
      prodColumns.rows.forEach(col => {
        prodColMap[col.column_name] = col;
      });
      
      const devColNames = Object.keys(devColMap);
      const prodColNames = Object.keys(prodColMap);
      
      const onlyInDev = devColNames.filter(col => !prodColNames.includes(col));
      const onlyInProd = prodColNames.filter(col => !devColNames.includes(col));
      const commonCols = devColNames.filter(col => prodColNames.includes(col));
      
      let tableDifferences = {
        table: tableName,
        columnsOnlyInDev: onlyInDev,
        columnsOnlyInProd: onlyInProd,
        columnTypeDifferences: []
      };
      
      // Check for type differences in common columns
      for (const colName of commonCols) {
        const devCol = devColMap[colName];
        const prodCol = prodColMap[colName];
        
        if (devCol.data_type !== prodCol.data_type ||
            devCol.is_nullable !== prodCol.is_nullable ||
            devCol.character_maximum_length !== prodCol.character_maximum_length) {
          tableDifferences.columnTypeDifferences.push({
            column: colName,
            dev: {
              type: devCol.data_type,
              nullable: devCol.is_nullable,
              maxLength: devCol.character_maximum_length
            },
            prod: {
              type: prodCol.data_type,
              nullable: prodCol.is_nullable,
              maxLength: prodCol.character_maximum_length
            }
          });
        }
      }
      
      // Only add to differences if there are actual differences
      if (onlyInDev.length > 0 || onlyInProd.length > 0 || tableDifferences.columnTypeDifferences.length > 0) {
        differences.push(tableDifferences);
        
        console.log(`📋 Table: ${tableName}`);
        if (onlyInDev.length > 0) {
          console.log(`  🆕 Columns only in Dev: ${onlyInDev.join(', ')}`);
        }
        if (onlyInProd.length > 0) {
          console.log(`  🏠 Columns only in Prod: ${onlyInProd.join(', ')}`);
        }
        if (tableDifferences.columnTypeDifferences.length > 0) {
          console.log(`  ⚠️  Column type differences:`);
          tableDifferences.columnTypeDifferences.forEach(diff => {
            console.log(`    - ${diff.column}: Dev(${diff.dev.type}) vs Prod(${diff.prod.type})`);
          });
        }
        console.log();
      }
    }
    
    // Get row counts for each table
    console.log('📊 Row counts comparison:');
    for (const tableName of commonTables.slice(0, 10)) { // Limit to first 10 tables
      try {
        const devCount = await devClient.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const prodCount = await prodClient.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        
        const devRows = parseInt(devCount.rows[0].count);
        const prodRows = parseInt(prodCount.rows[0].count);
        
        if (devRows !== prodRows) {
          console.log(`  📋 ${tableName}: Dev(${devRows}) vs Prod(${prodRows}) rows`);
        }
      } catch (error) {
        console.log(`  ❌ ${tableName}: Error counting rows`);
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`✅ Tables with identical structure: ${commonTables.length - differences.length}`);
    console.log(`⚠️  Tables with differences: ${differences.length}`);
    
    if (differences.length === 0) {
      console.log('🎉 All common tables have identical structures!');
    }
    
    return differences;
    
  } finally {
    await devClient.end();
    await prodClient.end();
  }
}

compareTableStructures().catch(console.error);