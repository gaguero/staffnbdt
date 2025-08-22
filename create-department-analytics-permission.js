const { Client } = require('pg');

// Production database URL
const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';

async function createDepartmentAnalyticsPermission() {
  const client = new Client({ connectionString: PROD_DB_URL });
  
  try {
    await client.connect();
    console.log('🔌 Connected to production database');
    
    // Create the exact permission needed: resource=department, action=update, scope=department
    const permissionId = 'dept-analytics-perm-' + Date.now();
    const permissionName = 'department.update.department';
    const permissionDescription = 'View department analytics and statistics';
    
    // Check if permission already exists
    const existingPermission = await client.query(`
      SELECT id, name FROM "Permission" 
      WHERE name = $1
    `, [permissionName]);
    
    let actualPermissionId;
    
    if (existingPermission.rows.length > 0) {
      console.log('✅ Permission already exists:', permissionName);
      actualPermissionId = existingPermission.rows[0].id;
    } else {
      // Create the permission
      await client.query(`
        INSERT INTO "Permission" (id, name, description, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [permissionId, permissionName, permissionDescription]);
      
      console.log('✅ Created new permission:', permissionName);
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
      SELECT up.id, u.email, p.name, p.description
      FROM "UserPermission" up
      JOIN "User" u ON up."userId" = u.id
      JOIN "Permission" p ON up."permissionId" = p.id
      WHERE up."userId" = $1 AND p.name = $2
    `, [userId, permissionName]);
    
    if (verification.rows.length > 0) {
      console.log('✅ Permission verification successful:');
      console.log(`  User: ${verification.rows[0].email}`);
      console.log(`  Permission: ${verification.rows[0].name}`);
      console.log(`  Description: ${verification.rows[0].description}`);
    }
    
    // Also grant some related permissions for comprehensive department management
    const additionalPermissions = [
      {
        name: 'department.read.department',
        description: 'Read department information'
      },
      {
        name: 'department.create.property',
        description: 'Create departments within property'
      }
    ];
    
    for (const additionalPerm of additionalPermissions) {
      const existingAdditional = await client.query(`
        SELECT id FROM "Permission" WHERE name = $1
      `, [additionalPerm.name]);
      
      let additionalPermId;
      
      if (existingAdditional.rows.length > 0) {
        additionalPermId = existingAdditional.rows[0].id;
      } else {
        additionalPermId = 'dept-additional-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
        await client.query(`
          INSERT INTO "Permission" (id, name, description, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, NOW(), NOW())
        `, [additionalPermId, additionalPerm.name, additionalPerm.description]);
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
    
  } catch (error) {
    console.error('❌ Error creating/granting permission:', error);
    throw error;
  } finally {
    await client.end();
  }
}

createDepartmentAnalyticsPermission().catch(console.error);