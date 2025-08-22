const { Client } = require('pg');

// Production database URL
const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';

async function createCompleteDepartmentPermission() {
  const client = new Client({ connectionString: PROD_DB_URL });
  
  try {
    await client.connect();
    console.log('🔌 Connected to production database');
    
    // Create the exact permission needed: resource=department, action=update, scope=department
    const permissionId = 'dept-analytics-perm-' + Date.now();
    const permission = {
      resource: 'department',
      action: 'update',
      scope: 'department',
      name: 'department.update.department',
      description: 'View department analytics and statistics',
      category: 'Department Management',
      isSystem: true
    };
    
    // Check if permission already exists
    const existingPermission = await client.query(`
      SELECT id, name FROM "Permission" 
      WHERE resource = $1 AND action = $2 AND scope = $3
    `, [permission.resource, permission.action, permission.scope]);
    
    let actualPermissionId;
    
    if (existingPermission.rows.length > 0) {
      console.log('✅ Permission already exists:', permission.name);
      actualPermissionId = existingPermission.rows[0].id;
    } else {
      // Create the permission
      await client.query(`
        INSERT INTO "Permission" (id, resource, action, scope, name, description, category, "isSystem", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        permissionId, 
        permission.resource, 
        permission.action, 
        permission.scope, 
        permission.name, 
        permission.description, 
        permission.category, 
        permission.isSystem
      ]);
      
      console.log('✅ Created new permission:', permission.name);
      console.log(`   Resource: ${permission.resource}`);
      console.log(`   Action: ${permission.action}`);
      console.log(`   Scope: ${permission.scope}`);
      actualPermissionId = permissionId;
    }
    
    // Roberto Martinez's user ID
    const userId = 'cmej91r0l002ns2f0e9dxocvf';
    
    // Check if user already has this permission
    const existingUserPermission = await client.query(`
      SELECT id FROM "UserPermission" 
      WHERE "userId" = $1 AND "permissionId" = $2
    `, [userId, actualPermissionId]);
    
    if (existingUserPermission.rows.length > 0) {
      console.log('✅ Roberto Martinez already has this permission');
    } else {
      // Grant the permission to Roberto Martinez
      const userPermissionId = 'dept-analytics-user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      await client.query(`
        INSERT INTO "UserPermission" (id, "userId", "permissionId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [userPermissionId, userId, actualPermissionId]);
      
      console.log('✅ Successfully granted department analytics permission to Roberto Martinez');
      console.log(`📝 User Permission ID: ${userPermissionId}`);
    }
    
    // Verify the permission was added
    const verification = await client.query(`
      SELECT up.id, u.email, p.name, p.description, p.resource, p.action, p.scope
      FROM "UserPermission" up
      JOIN "User" u ON up."userId" = u.id
      JOIN "Permission" p ON up."permissionId" = p.id
      WHERE up."userId" = $1 AND p.resource = $2 AND p.action = $3 AND p.scope = $4
    `, [userId, permission.resource, permission.action, permission.scope]);
    
    if (verification.rows.length > 0) {
      console.log('✅ Permission verification successful:');
      console.log(`  User: ${verification.rows[0].email}`);
      console.log(`  Permission: ${verification.rows[0].name}`);
      console.log(`  Resource: ${verification.rows[0].resource}`);
      console.log(`  Action: ${verification.rows[0].action}`);
      console.log(`  Scope: ${verification.rows[0].scope}`);
      console.log(`  Description: ${verification.rows[0].description}`);
    }
    
    // Also create some related department permissions that might be needed
    const additionalPermissions = [
      {
        resource: 'department',
        action: 'read',
        scope: 'department',
        name: 'department.read.department',
        description: 'Read department information and statistics'
      },
      {
        resource: 'department',
        action: 'create',
        scope: 'property',
        name: 'department.create.property',
        description: 'Create departments within property'
      }
    ];
    
    for (const additionalPerm of additionalPermissions) {
      const existingAdditional = await client.query(`
        SELECT id FROM "Permission" 
        WHERE resource = $1 AND action = $2 AND scope = $3
      `, [additionalPerm.resource, additionalPerm.action, additionalPerm.scope]);
      
      let additionalPermId;
      
      if (existingAdditional.rows.length > 0) {
        additionalPermId = existingAdditional.rows[0].id;
      } else {
        additionalPermId = 'dept-additional-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
        await client.query(`
          INSERT INTO "Permission" (id, resource, action, scope, name, description, category, "isSystem", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          additionalPermId, 
          additionalPerm.resource, 
          additionalPerm.action, 
          additionalPerm.scope, 
          additionalPerm.name, 
          additionalPerm.description, 
          'Department Management', 
          true
        ]);
        console.log(`✅ Created additional permission: ${additionalPerm.name}`);
      }
      
      // Grant to Roberto if not already granted
      const existingUserPerm = await client.query(`
        SELECT id FROM "UserPermission" 
        WHERE "userId" = $1 AND "permissionId" = $2
      `, [userId, additionalPermId]);
      
      if (existingUserPerm.rows.length === 0) {
        const additionalUserPermId = 'dept-additional-user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
        await client.query(`
          INSERT INTO "UserPermission" (id, "userId", "permissionId", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, NOW(), NOW())
        `, [additionalUserPermId, userId, additionalPermId]);
        console.log(`✅ Granted additional permission: ${additionalPerm.name}`);
      }
    }
    
    console.log('\n🎉 Department analytics permissions setup complete!');
    console.log('🔄 Please refresh the page to test the analytics tab.');
    
  } catch (error) {
    console.error('❌ Error creating/granting permission:', error);
    throw error;
  } finally {
    await client.end();
  }
}

createCompleteDepartmentPermission().catch(console.error);