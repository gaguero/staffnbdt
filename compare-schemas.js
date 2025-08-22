const { Client } = require('pg');

// Database connections
const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';
const DEV_DB_URL = 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway';

async function compareSchemas() {
  const devClient = new Client({ connectionString: DEV_DB_URL });
  const prodClient = new Client({ connectionString: PROD_DB_URL });
  
  try {
    await devClient.connect();
    await prodClient.connect();
    
    // Get tables from both databases
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
    
    console.log('📊 Schema Comparison');
    console.log('\n🔵 Dev Database Tables:');
    devTableNames.forEach(table => console.log(`  - ${table}`));
    
    console.log('\n🟡 Production Database Tables:');
    prodTableNames.forEach(table => console.log(`  - ${table}`));
    
    console.log('\n🔍 Analysis:');
    const onlyInDev = devTableNames.filter(table => !prodTableNames.includes(table));
    const onlyInProd = prodTableNames.filter(table => !devTableNames.includes(table));
    const common = devTableNames.filter(table => prodTableNames.includes(table));
    
    if (onlyInDev.length > 0) {
      console.log('\n🆕 Tables only in Dev:');
      onlyInDev.forEach(table => console.log(`  - ${table}`));
    }
    
    if (onlyInProd.length > 0) {
      console.log('\n🏠 Tables only in Production:');
      onlyInProd.forEach(table => console.log(`  - ${table}`));
    }
    
    console.log(`\n✅ Common tables: ${common.length}`);
    console.log(`🆕 Dev-only tables: ${onlyInDev.length}`);
    console.log(`🏠 Prod-only tables: ${onlyInProd.length}`);
    
    return { common, onlyInDev, onlyInProd };
    
  } finally {
    await devClient.end();
    await prodClient.end();
  }
}

compareSchemas().catch(console.error);