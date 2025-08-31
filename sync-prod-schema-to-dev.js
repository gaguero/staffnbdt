const { Client } = require('pg');

// Database connections
const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';
const DEV_DB_URL = 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway';

function buildColumnType(col) {
  // Map information_schema to DDL type
  const dataType = col.data_type; // e.g., character varying, integer, boolean, ARRAY
  const udtName = col.udt_name;   // e.g., _text for text[]
  if (dataType === 'USER-DEFINED') {
    // Use underlying user-defined type name
    return `"${udtName}"`;
  }
  if (dataType === 'ARRAY') {
    // Derive base from udt_name (e.g., _text -> text[])
    const base = udtName && udtName.startsWith('_') ? udtName.slice(1) : 'text';
    return `${base}[]`;
  }
  if (dataType === 'character varying') {
    if (col.character_maximum_length) {
      return `varchar(${col.character_maximum_length})`;
    }
    return 'varchar';
  }
  if (dataType === 'character') {
    if (col.character_maximum_length) {
      return `char(${col.character_maximum_length})`;
    }
    return 'char';
  }
  if (dataType === 'numeric' || dataType === 'decimal') {
    if (col.numeric_precision && col.numeric_scale !== null) {
      return `numeric(${col.numeric_precision},${col.numeric_scale || 0})`;
    }
    if (col.numeric_precision) {
      return `numeric(${col.numeric_precision})`;
    }
    return 'numeric';
  }
  if (dataType === 'timestamp with time zone') return 'timestamptz';
  if (dataType === 'timestamp without time zone') return 'timestamp';
  if (dataType === 'time with time zone') return 'timetz';
  if (dataType === 'time without time zone') return 'time';
  // Fallback to data_type as-is
  return dataType;
}

async function getTables(client) {
  const res = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename
  `);
  return res.rows.map(r => r.tablename);
}

async function getColumns(client, tableName) {
  const res = await client.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale,
      udt_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  return res.rows;
}

async function getPrimaryKey(client, tableName) {
  const res = await client.query(`
    SELECT a.attname AS column_name
    FROM   pg_index i
    JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE  i.indrelid = $1::regclass
    AND    i.indisprimary;
  `, [tableName]);
  return res.rows.map(r => r.column_name);
}

async function isEnumType(client, typeName) {
  const res = await client.query(
    `SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = $1 LIMIT 1`,
    [typeName]
  );
  return res.rowCount > 0;
}

async function getEnumLabels(client, typeName) {
  const res = await client.query(
    `SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = $1 ORDER BY e.enumsortorder`,
    [typeName]
  );
  return res.rows.map(r => r.enumlabel);
}

async function ensureUserDefinedType(dev, prod, typeName) {
  // Check if type exists in prod
  const exists = await prod.query(`SELECT 1 FROM pg_type WHERE typname = $1`, [typeName]);
  if (exists.rowCount > 0) return;
  // If enum in dev, replicate
  const isEnum = await isEnumType(dev, typeName);
  if (isEnum) {
    const labels = await getEnumLabels(dev, typeName);
    const quoted = labels.map(l => `'${l.replace(/'/g, "''")}'`).join(', ');
    const ddl = `CREATE TYPE "${typeName}" AS ENUM (${quoted});`;
    console.log(`  ✨ Creating enum type ${typeName} in prod`);
    await prod.query(ddl);
  } else {
    // Fallback: create domain as text for unknown user-defined types
    console.log(`  ⚠️  Unknown user-defined type ${typeName}; creating as text domain`);
    await prod.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}') THEN CREATE DOMAIN "${typeName}" AS text; END IF; END $$;`);
  }
}

async function main() {
  const dev = new Client({ connectionString: DEV_DB_URL });
  const prod = new Client({ connectionString: PROD_DB_URL });
  await dev.connect();
  await prod.connect();
  try {
    console.log('🔍 Syncing prod schema to match dev...');
    const devTables = await getTables(dev);
    const prodTables = await getTables(prod);
    const prodTableSet = new Set(prodTables);
    const missingTables = devTables.filter(t => !prodTableSet.has(t));
    if (missingTables.length) {
      console.log(`🆕 Creating missing tables in prod: ${missingTables.join(', ')}`);
    }

    // Create missing tables
    for (const table of missingTables) {
      const cols = await getColumns(dev, table);
      if (cols.length === 0) {
        console.log(`  ⚠️  Skipping empty definition for ${table}`);
        continue;
      }
      // Ensure user-defined types exist in prod before table create
      for (const col of cols) {
        if (col.data_type === 'USER-DEFINED') {
          await ensureUserDefinedType(dev, prod, col.udt_name);
        }
      }
      const colDefs = cols.map(col => {
        const type = buildColumnType(col);
        const nullable = col.is_nullable === 'NO' ? ' NOT NULL' : '';
        const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        return `"${col.column_name}" ${type}${def}${nullable}`;
      }).join(', ');
      // Primary key
      const pkCols = await getPrimaryKey(dev, table);
      const pkDef = pkCols.length ? `, PRIMARY KEY (${pkCols.map(c => `"${c}"`).join(', ')})` : '';
      const ddl = `CREATE TABLE IF NOT EXISTS "${table}" (${colDefs}${pkDef});`;
      console.log(`  ➕ ${table}`);
      await prod.query(ddl);
    }

    // Align columns for common tables
    const commonTables = devTables.filter(t => prodTableSet.has(t));
    for (const table of commonTables) {
      const devCols = await getColumns(dev, table);
      const prodCols = await getColumns(prod, table);
      const prodColSet = new Set(prodCols.map(c => c.column_name));
      const toAdd = devCols.filter(c => !prodColSet.has(c.column_name));
      for (const col of toAdd) {
        if (col.data_type === 'USER-DEFINED') {
          await ensureUserDefinedType(dev, prod, col.udt_name);
        }
        const type = buildColumnType(col);
        const nullable = col.is_nullable === 'NO' ? ' NOT NULL' : '';
        const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        const ddl = `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${col.column_name}" ${type}${def}${nullable};`;
        console.log(`  ➕ ${table}.${col.column_name} (${type})`);
        await prod.query(ddl);
      }
    }

    console.log('✅ Prod schema aligned to dev (tables/columns).');
  } finally {
    await dev.end();
    await prod.end();
  }
}

main().catch(err => {
  console.error('❌ Schema sync failed:', err.message);
  process.exit(1);
});


