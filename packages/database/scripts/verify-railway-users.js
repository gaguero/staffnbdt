const { Client } = require('pg');

async function verifyRailwayUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to Railway database');
    
    // Check total users
    const totalResult = await client.query('SELECT COUNT(*) as total FROM "User"');
    console.log(`📊 Total users: ${totalResult.rows[0].total}`);
    
    // List all users with their roles
    const usersResult = await client.query('SELECT email, "firstName", "lastName", role, "userType" FROM "User" ORDER BY email');
    console.log('\n📋 All users in database:');
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - ${user.role} [${user.userType || 'INTERNAL'}]`);
    });
    
    // Check a specific password hash
    const adminResult = await client.query('SELECT email, password FROM "User" WHERE email = $1', ['admin@nayara.com']);
    if (adminResult.rows.length > 0) {
      console.log(`\n🔑 admin@nayara.com password hash: ${adminResult.rows[0].password.substring(0, 20)}...`);
    } else {
      console.log('\n❌ admin@nayara.com not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyRailwayUsers();