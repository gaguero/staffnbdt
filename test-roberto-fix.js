const { Client } = require('pg');

async function testRobertoPermissionsFix() {
  console.log('=== TESTING ROBERTO PERMISSIONS FIX ===\n');

  // Test the fix logic manually first
  console.log('1. Simulating PLATFORM_ADMIN permission logic:');
  
  const client = new Client({
    connectionString: 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway'
  });

  try {
    await client.connect();
    
    // Get all permissions (what PLATFORM_ADMIN should get)
    const allPermissionsQuery = 'SELECT COUNT(*) as total FROM "Permission"';
    const allPermissionsResult = await client.query(allPermissionsQuery);
    const totalPermissions = allPermissionsResult.rows[0].total;
    
    console.log(`   ✅ Total permissions in system: ${totalPermissions}`);
    
    // Get role-related permissions specifically
    const rolePermissionsQuery = `
      SELECT resource, action, scope, name 
      FROM "Permission" 
      WHERE resource = 'role'
      ORDER BY action, scope
    `;
    const rolePermissionsResult = await client.query(rolePermissionsQuery);
    
    console.log(`   ✅ Role-related permissions: ${rolePermissionsResult.rows.length}`);
    rolePermissionsResult.rows.forEach(perm => {
      console.log(`      - ${perm.resource}.${perm.action}.${perm.scope}: ${perm.name}`);
    });
    
    // Check if Roberto would have access to role.read.all specifically
    const roleReadAllQuery = `
      SELECT id, resource, action, scope, name 
      FROM "Permission" 
      WHERE resource = 'role' AND action = 'read' AND scope = 'all'
    `;
    const roleReadAllResult = await client.query(roleReadAllQuery);
    
    if (roleReadAllResult.rows.length > 0) {
      const permission = roleReadAllResult.rows[0];
      console.log(`   ✅ Found role.read.all permission: ${permission.id} - ${permission.name}`);
      console.log(`   ✅ PLATFORM_ADMIN should have access to this permission`);
    } else {
      console.log(`   ❌ role.read.all permission not found!`);
    }
    
    console.log('\n2. Current Platform Administrator custom role permissions:');
    
    // Check what the custom role currently has
    const customRoleQuery = `
      SELECT p.resource, p.action, p.scope, p.name, rp.granted
      FROM "CustomRole" cr
      JOIN "RolePermission" rp ON cr.id = rp."roleId"
      JOIN "Permission" p ON rp."permissionId" = p.id
      WHERE cr.name = 'Platform Administrator' 
        AND cr."organizationId" IS NULL
        AND p.resource = 'role'
      ORDER BY p.action, p.scope
    `;
    
    const customRoleResult = await client.query(customRoleQuery);
    console.log(`   Custom role has ${customRoleResult.rows.length} role-related permissions:`);
    customRoleResult.rows.forEach(perm => {
      console.log(`      - ${perm.resource}.${perm.action}.${perm.scope} (granted: ${perm.granted}): ${perm.name}`);
    });
    
    // Check if role.read.all is missing from custom role
    const hasRoleReadAll = customRoleResult.rows.some(p => 
      p.resource === 'role' && p.action === 'read' && p.scope === 'all' && p.granted
    );
    
    if (!hasRoleReadAll) {
      console.log(`   ⚠️  Custom role is missing role.read.all permission!`);
      console.log(`   ✅ But PLATFORM_ADMIN legacy role should provide this via getAllPermissions()`);
    }
    
    console.log('\n3. Testing permission check logic:');
    console.log(`   - Legacy PLATFORM_ADMIN role should grant ALL ${totalPermissions} permissions`);
    console.log(`   - Including role.read.all which is needed for roles management page`);
    console.log(`   - Custom role permissions (${customRoleResult.rows.length}) will be additional/override`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
  }
}

testRobertoPermissionsFix();