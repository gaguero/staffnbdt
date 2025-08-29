const bcrypt = require('bcrypt');

async function verifyPassword() {
  // This is the password we want to set
  const plainPassword = 'password123';
  
  // This is the hashed password from the database for roberto.martinez@nayararesorts.com
  const hashedFromDB = '$2b$10$S3ykTbCTpKaBp7PpTGSybeHhWK22rJ81F4nJq3HTbR/gqKfBagSCm';
  
  // Test if the current hash matches password123
  const isMatch = await bcrypt.compare(plainPassword, hashedFromDB);
  console.log(`Does roberto.martinez password match 'password123'? ${isMatch}`);
  
  // Generate what the new hash would look like
  const newHash = await bcrypt.hash(plainPassword, 10);
  console.log(`New hash would be: ${newHash}`);
}

verifyPassword();