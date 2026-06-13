require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function test() {
  console.log('=== QuickByte Login Diagnostic ===');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
  console.log('DB_NAME:', process.env.DB_NAME);

  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('\n✅ Database connected!');

    const [users] = await conn.query('SELECT auth_id, role, password_hash FROM auth');
    console.log('\n📋 Users in database:');
    for (const u of users) {
      const testMatch = await bcrypt.compare('password123', u.password_hash);
      console.log(`  ${u.auth_id} (${u.role}) - password123 match: ${testMatch}`);
    }

    // If no match, let's create a fresh hash and update
    const freshHash = await bcrypt.hash('password123', 10);
    console.log('\n🔑 Fresh bcrypt hash for password123:', freshHash);
    
    // Update all users with the fresh hash
    await conn.query('UPDATE auth SET password_hash = ?', [freshHash]);
    console.log('✅ Updated ALL user passwords to password123');
    
    // Verify
    const [verify] = await conn.query('SELECT auth_id, role FROM auth');
    console.log('\n📋 Final users:');
    verify.forEach(u => console.log(`  ${u.auth_id} → ${u.role}`));

    await conn.end();
    console.log('\n🎉 Done! You can now login with password123');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }
}
test();
