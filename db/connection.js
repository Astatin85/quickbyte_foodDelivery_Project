const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: 'localhost',
  port: '3306',
  user: 'cn1',
  database: 'quickbyte',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


const promisePool = pool.promise();

module.exports = promisePool;
