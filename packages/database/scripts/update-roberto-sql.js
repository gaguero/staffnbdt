const { Client } = require('pg');

async function updateRobertoPassword() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');
    
    // New hashed password for 'password123'
    const hashedPassword = '$2b$10$cL9Xf9.pQTXCH6kUd4aN.efpfnUVBFOjE4f/9K2ucqbczjBAW6o8K';
    
    // Update roberto's password
    const result = await client.query(
      'UPDATE "User" SET password = $1 WHERE email = $2 RETURNING email, "firstName", "lastName", role',
      [hashedPassword, 'roberto.martinez@nayararesorts.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Successfully updated password for:', result.rows[0]);
      console.log('🔑 Roberto can now login with password: password123');
    } else {
      console.log('❌ User not found or update failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateRobertoPassword();