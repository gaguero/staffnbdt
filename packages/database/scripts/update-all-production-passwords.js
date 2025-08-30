const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function updateAllProductionPasswords() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to production database');
    
    // Hash password123
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('🔐 Generated password hash');
    
    // Update all users with the new password
    const result = await client.query(
      'UPDATE "User" SET password = $1 WHERE email IS NOT NULL',
      [hashedPassword]
    );
    
    console.log(`✅ Updated passwords for ${result.rowCount} users`);
    
    // Show sample users that were updated
    const sampleUsers = await client.query(
      'SELECT email, "firstName", "lastName", role FROM "User" ORDER BY email LIMIT 10'
    );
    
    console.log('\n📝 Sample updated users:');
    sampleUsers.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`);
    });
    
    console.log('\n🔑 All users can now login with password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateAllProductionPasswords();