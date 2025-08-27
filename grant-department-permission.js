const { Client } = require('pg');

// Production database URL
const PROD_DB_URL = 'postgresql://postgres:MeMOMyfbJrHjjMXjlSSmUyizxbNpBBZh@nozomi.proxy.rlwy.net:23758/railway';

async function grantDepartmentPermission() {
  const client = new Client({ connectionString: PROD_DB_URL });
  
  try {
    await client.connect();
    console.log('🔌 Connected to production database');
    
    // Roberto Martinez's user ID
    const userId = 'cmej91r0l002ns2f0e9dxocvf';
    
    // Update Property Departments permission ID
    const permissionId = 'cmehusk38000lyvrrlcte2bpw';
    
    // Check if permission already exists
    const existingPermission = await client.query(`
      SELECT id FROM "UserPermission" 
      WHERE "userId" = $1 AND "permissionId" = $2
    `, [userId, permissionId]);
    
    if (existingPermission.rows.length > 0) {
      console.log('✅ Roberto Martinez already has "Update Property Departments" permission');
      return;
    }
    
    // Generate a unique ID for the user permission
    const userPermissionId = 'dept-analytics-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Grant the permission
    await client.query(`
      INSERT INTO "UserPermission" (id, "userId", "permissionId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), NOW())
    `, [userPermissionId, userId, permissionId]);
    
    console.log('✅ Successfully granted "Update Property Departments" permission to Roberto Martinez');
    console.log(`📝 User Permission ID: ${userPermissionId}`);
    
    // Verify the permission was added
    const verification = await client.query(`
      SELECT up.id, u.email, p.name, p.description
      FROM "UserPermission" up
      JOIN "User" u ON up."userId" = u.id
      JOIN "Permission" p ON up."permissionId" = p.id
      WHERE up."userId" = $1 AND up."permissionId" = $2
    `, [userId, permissionId]);
    
    if (verification.rows.length > 0) {
      console.log('✅ Permission verification successful:');
      console.log(`  User: ${verification.rows[0].email}`);
      console.log(`  Permission: ${verification.rows[0].name}`);
      console.log(`  Description: ${verification.rows[0].description}`);
    }
    
  } catch (error) {
    console.error('❌ Error granting permission:', error);
    throw error;
  } finally {
    await client.end();
  }
}

grantDepartmentPermission().catch(console.error);