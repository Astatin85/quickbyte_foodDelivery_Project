require('dotenv').config();
console.log('User:', process.env.DB_USER);
console.log('Password Length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
console.log('DB Name:', process.env.DB_NAME);

const mysql = require('mysql2/promise');
async function test() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('Connected successfully!');
    await conn.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}
test();
