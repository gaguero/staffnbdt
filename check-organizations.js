const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway'
  });

  try {
    await client.connect();
    console.log('✅ Connected');

    // Organizations overview
    const orgs = await client.query(`
      SELECT id, name, slug, "createdAt"
      FROM "Organization"
      WHERE "deletedAt" IS NULL
      ORDER BY "createdAt" ASC
    `);
    console.log(`\nOrganizations (${orgs.rows.length}):`);
    orgs.rows.forEach((o, i) => console.log(`  ${i + 1}. ${o.name} (${o.id}) slug=${o.slug}`));

    // Roberto context
    const user = await client.query(`
      SELECT id, email, role, "organizationId", "propertyId" 
      FROM "User" 
      WHERE email = 'roberto.martinez@nayararesorts.com'
    `);
    console.log('\nRoberto:', user.rows[0]);

    // Platform admin permission presence check
    const perm = await client.query(`
      SELECT id, resource, action, scope 
      FROM "Permission" 
      WHERE resource='organization' AND action='read' AND scope='platform'
    `);
    console.log(`\nHas organization.read.platform permission defined: ${perm.rows.length > 0}`);

    // Direct user permission check
    const direct = await client.query(`
      SELECT p.resource, p.action, p.scope, up.granted
      FROM "UserPermission" up
      JOIN "Permission" p ON up."permissionId" = p.id
      WHERE up."userId" = $1
      ORDER BY p.resource, p.action, p.scope
    `, [user.rows[0]?.id]);
    console.log(`Direct permissions for Roberto: ${direct.rows.length}`);
    direct.rows.slice(0, 20).forEach((r, i) => console.log(`  ${i + 1}. ${r.resource}.${r.action}.${r.scope} granted=${r.granted}`));

    // Custom role permission check (Platform Administrator)
    const rolePerms = await client.query(`
      SELECT p.resource, p.action, p.scope
      FROM "CustomRole" cr
      JOIN "RolePermission" rp ON rp."roleId" = cr.id
      JOIN "Permission" p ON p.id = rp."permissionId"
      WHERE cr.name = 'Platform Administrator'
    `);
    console.log(`Role permissions for 'Platform Administrator': ${rolePerms.rows.length}`);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

run();


