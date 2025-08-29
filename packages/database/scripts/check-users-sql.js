const { Client } = require('pg');

async function checkUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');
    
    // Check total users
    const totalResult = await client.query('SELECT COUNT(*) as total FROM "User"');
    console.log(`📊 Total users: ${totalResult.rows[0].total}`);
    
    // Check if roberto exists
    const robertoResult = await client.query(
      'SELECT email, "firstName", "lastName", role, password FROM "User" WHERE email = $1',
      ['roberto.martinez@nayararesorts.com']
    );
    
    if (robertoResult.rows.length > 0) {
      const user = robertoResult.rows[0];
      console.log('✅ Roberto found:', {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        passwordHash: user.password.substring(0, 20) + '...'
      });
    } else {
      console.log('❌ Roberto not found');
    }
    
    // List first 10 users to see what's available
    const usersResult = await client.query('SELECT email, "firstName", "lastName", role FROM "User" LIMIT 10');
    console.log('\n📋 First 10 users:');
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();