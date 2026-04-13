const mysql = require('mysql2/promise');

// 🔹 Create pool using Railway connection string
const pool = mysql.createPool(process.env.MYSQL_PUBLIC_URL);

// 🔹 Test DB connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to Railway MySQL');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL Connection Error:', err);
  }
})();

module.exports = pool;
