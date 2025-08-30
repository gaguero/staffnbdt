const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function updateRobertoProduction() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to production database');
    
    // Hash password123
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('🔐 Generated password hash');
    
    // Update roberto's password specifically
    const result = await client.query(
      'UPDATE "User" SET password = $1 WHERE email = $2 RETURNING email, "firstName", "lastName", role',
      [hashedPassword, 'roberto.martinez@nayararesorts.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Updated password for:', result.rows[0]);
      console.log('🔑 Roberto can now login with password: password123');
    } else {
      console.log('❌ User roberto.martinez@nayararesorts.com not found');
    }
    
    // Check total users in database
    const totalResult = await client.query('SELECT COUNT(*) as total FROM "User"');
    console.log(`📊 Total users in database: ${totalResult.rows[0].total}`);
    
    // List first few users
    const userList = await client.query('SELECT email FROM "User" ORDER BY email LIMIT 5');
    console.log('📋 Sample users:');
    userList.rows.forEach(user => console.log(`  - ${user.email}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateRobertoProduction();