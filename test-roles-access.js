const { Client } = require('pg');
const fetch = require('node-fetch');

async function testRolesAccess() {
  console.log('=== TESTING ROLES ACCESS FOR ROBERTO ===\n');

  // First check database state to confirm our understanding
  const client = new Client({
    connectionString: 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway'
  });

  try {
    await client.connect();
    console.log('✅ Connected to Railway database');

    // Get Roberto's details
    const robertoQuery = `
      SELECT id, email, role, "organizationId", "propertyId" 
      FROM "User" 
      WHERE email = 'roberto.martinez@nayararesorts.com'
    `;
    
    const robertoResult = await client.query(robertoQuery);
    const roberto = robertoResult.rows[0];
    
    if (!roberto) {
      console.log('❌ Roberto not found');
      return;
    }
    
    console.log(`Found Roberto:`, roberto);
    console.log(`  - Role: ${roberto.role} (should be PLATFORM_ADMIN)`);
    console.log(`  - Organization: ${roberto.organizationId}`);
    console.log(`  - Property: ${roberto.propertyId}`);

    // Check if role.read.all permission exists and Roberto should have it
    const roleReadAllQuery = `
      SELECT id, resource, action, scope, name 
      FROM "Permission" 
      WHERE resource = 'role' AND action = 'read' AND scope = 'all'
    `;
    
    const roleReadAllResult = await client.query(roleReadAllQuery);
    if (roleReadAllResult.rows.length > 0) {
      const permission = roleReadAllResult.rows[0];
      console.log(`\n✅ role.read.all permission exists: ${permission.name}`);
      console.log(`   Permission ID: ${permission.id}`);
      
      // Check if PLATFORM_ADMIN should have this permission based on our logic
      console.log(`   ✅ PLATFORM_ADMIN (Roberto) should have this permission via getLegacyRolePermissions`);
    }

    // Test the actual permission check via API if possible
    console.log('\n=== TESTING API ACCESS ===');
    
    // We'll test the login and roles endpoints directly
    const apiBaseUrl = 'https://backend-production-fe88.up.railway.app';
    
    // First, try to login as Roberto
    try {
      const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'roberto.martinez@nayararesorts.com',
          password: 'tempPassword123!' // From previous scripts
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Roberto login successful');
        console.log(`   User role in response: ${loginData.user?.role}`);
        console.log(`   Token received: ${loginData.token ? 'Yes' : 'No'}`);
        
        // Now test roles endpoint access
        const rolesResponse = await fetch(`${apiBaseUrl}/roles`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`\n📡 Roles API Response Status: ${rolesResponse.status}`);
        
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          console.log('✅ Roberto can access roles API');
          console.log(`   Roles returned: ${Array.isArray(rolesData) ? rolesData.length : 'Unknown format'}`);
        } else {
          const errorData = await rolesResponse.text();
          console.log('❌ Roberto cannot access roles API');
          console.log(`   Error: ${errorData}`);
        }
        
        // Test user permissions endpoint
        const permissionsResponse = await fetch(`${apiBaseUrl}/permissions/user/${roberto.id}`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`\n📡 User Permissions API Response Status: ${permissionsResponse.status}`);
        
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json();
          console.log('✅ Roberto can access permissions API');
          console.log(`   Total permissions: ${Array.isArray(permissionsData) ? permissionsData.length : 'Unknown format'}`);
          
          // Check if role.read.all is in the permissions
          if (Array.isArray(permissionsData)) {
            const roleReadAll = permissionsData.find(p => 
              p.resource === 'role' && p.action === 'read' && p.scope === 'all'
            );
            
            if (roleReadAll) {
              console.log('   ✅ role.read.all permission found in user permissions');
            } else {
              console.log('   ❌ role.read.all permission NOT found in user permissions');
              console.log('   Available role permissions:');
              permissionsData
                .filter(p => p.resource === 'role')
                .forEach(p => console.log(`      - ${p.resource}.${p.action}.${p.scope}`));
            }
          }
        } else {
          const errorData = await permissionsResponse.text();
          console.log('❌ Roberto cannot access user permissions API');
          console.log(`   Error: ${errorData}`);
        }
        
      } else {
        const errorData = await loginResponse.text();
        console.log('❌ Roberto login failed');
        console.log(`   Error: ${errorData}`);
      }
      
    } catch (apiError) {
      console.log('❌ API test failed:', apiError.message);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await client.end();
  }
}

testRolesAccess();