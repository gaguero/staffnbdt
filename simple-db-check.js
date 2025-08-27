const { Client } = require('pg');

async function checkDatabase() {
  const client = new Client({
    connectionString: 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway'
  });

  try {
    await client.connect();
    console.log('✅ Connected to Railway database\n');

    // Check if Roberto exists
    console.log('=== CHECKING ROBERTO MARTINEZ ===');
    const robertoQuery = `
      SELECT id, email, role, "organizationId", "propertyId" 
      FROM "User" 
      WHERE email ILIKE '%roberto%'
    `;
    
    const robertoResult = await client.query(robertoQuery);
    if (robertoResult.rows.length > 0) {
      console.log('Found Roberto:', robertoResult.rows[0]);
    } else {
      console.log('❌ Roberto not found');
    }

    // Check Permission table
    console.log('\n=== CHECKING PERMISSION TABLE ===');
    const permissionCountQuery = 'SELECT COUNT(*) as total FROM "Permission"';
    const permissionCount = await client.query(permissionCountQuery);
    console.log(`Total permissions: ${permissionCount.rows[0].total}`);

    // Check isSystem field values
    const systemPermQuery = `
      SELECT 
        COUNT(CASE WHEN "isSystem" = true THEN 1 END) as system_true,
        COUNT(CASE WHEN "isSystem" = false THEN 1 END) as system_false,
        COUNT(CASE WHEN "isSystem" IS NULL THEN 1 END) as system_null
      FROM "Permission"
    `;
    
    const systemPermResult = await client.query(systemPermQuery);
    const stats = systemPermResult.rows[0];
    console.log(`System permissions breakdown:`);
    console.log(`  - isSystem = true: ${stats.system_true}`);
    console.log(`  - isSystem = false: ${stats.system_false}`);
    console.log(`  - isSystem = null: ${stats.system_null}`);

    // Sample permissions
    console.log('\n=== SAMPLE PERMISSIONS ===');
    const sampleQuery = `
      SELECT resource, action, scope, name, "isSystem" 
      FROM "Permission" 
      ORDER BY resource, action 
      LIMIT 10
    `;
    
    const sampleResult = await client.query(sampleQuery);
    sampleResult.rows.forEach((perm, i) => {
      console.log(`${i + 1}. ${perm.resource}.${perm.action}.${perm.scope} (isSystem: ${perm.isSystem}) - ${perm.name || 'No name'}`);
    });

    // Check CustomRole table for Platform Admin roles
    console.log('\n=== CHECKING CUSTOM ROLES ===');
    const rolesQuery = `
      SELECT id, name, description, "isSystemRole", "organizationId", "propertyId"
      FROM "CustomRole" 
      WHERE name ILIKE '%platform%' OR name ILIKE '%admin%' OR "isSystemRole" = true
    `;
    
    const rolesResult = await client.query(rolesQuery);
    console.log(`Found ${rolesResult.rows.length} platform/admin roles:`);
    rolesResult.rows.forEach(role => {
      console.log(`  - ${role.name} (system: ${role.isSystemRole}, org: ${role.organizationId})`);
    });

    // Check Roberto's custom role assignments
    console.log('\n=== ROBERTO\'S ROLE ASSIGNMENTS ===');
    const robertoId = robertoResult.rows[0]?.id;
    if (robertoId) {
      const userRolesQuery = `
        SELECT ucr.id, cr.name, cr.description, ucr."isActive", ucr."expiresAt"
        FROM "UserCustomRole" ucr
        JOIN "CustomRole" cr ON ucr."roleId" = cr.id
        WHERE ucr."userId" = $1
      `;
      
      const userRolesResult = await client.query(userRolesQuery, [robertoId]);
      console.log(`Roberto has ${userRolesResult.rows.length} custom role assignments:`);
      userRolesResult.rows.forEach(role => {
        console.log(`  - ${role.name} (active: ${role.isActive}, expires: ${role.expiresAt})`);
      });

      // Check Roberto's direct permissions
      const userPermsQuery = `
        SELECT up.id, p.resource, p.action, p.scope, up.granted, up."isActive"
        FROM "UserPermission" up
        JOIN "Permission" p ON up."permissionId" = p.id
        WHERE up."userId" = $1
      `;
      
      const userPermsResult = await client.query(userPermsQuery, [robertoId]);
      console.log(`Roberto has ${userPermsResult.rows.length} direct permissions:`);
      userPermsResult.rows.forEach(perm => {
        console.log(`  - ${perm.resource}.${perm.action}.${perm.scope} (granted: ${perm.granted}, active: ${perm.isActive})`);
      });
    }

    // Check for roles-related permissions specifically
    console.log('\n=== ROLES MANAGEMENT PERMISSIONS ===');
    const rolesPermQuery = `
      SELECT resource, action, scope, name, "isSystem"
      FROM "Permission"
      WHERE resource ILIKE '%role%' OR name ILIKE '%role%'
      ORDER BY resource, action, scope
    `;
    
    const rolesPermResult = await client.query(rolesPermQuery);
    console.log(`Found ${rolesPermResult.rows.length} roles-related permissions:`);
    rolesPermResult.rows.forEach(perm => {
      console.log(`  - ${perm.resource}.${perm.action}.${perm.scope} - ${perm.name}`);
    });

    // Check what permissions the Platform Administrator custom role has
    if (robertoId) {
      console.log('\n=== PLATFORM ADMINISTRATOR CUSTOM ROLE PERMISSIONS ===');
      const platformAdminPermQuery = `
        SELECT p.resource, p.action, p.scope, p.name, rp.granted
        FROM "CustomRole" cr
        JOIN "RolePermission" rp ON cr.id = rp."roleId"
        JOIN "Permission" p ON rp."permissionId" = p.id
        WHERE cr.name = 'Platform Administrator' AND cr."organizationId" IS NULL
        ORDER BY p.resource, p.action, p.scope
      `;
      
      const platformPermResult = await client.query(platformAdminPermQuery);
      console.log(`Platform Administrator role has ${platformPermResult.rows.length} permissions:`);
      if (platformPermResult.rows.length > 0) {
        // Show first 20 permissions
        platformPermResult.rows.slice(0, 20).forEach((perm, i) => {
          console.log(`  ${i + 1}. ${perm.resource}.${perm.action}.${perm.scope} (granted: ${perm.granted}) - ${perm.name}`);
        });
        if (platformPermResult.rows.length > 20) {
          console.log(`  ... and ${platformPermResult.rows.length - 20} more permissions`);
        }
      } else {
        console.log('  ⚠️  No permissions found for Platform Administrator custom role!');
      }
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();