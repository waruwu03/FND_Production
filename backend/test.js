const { pool } = require('./config/db.js');
async function test() {
  try {
    await pool.query('UPDATE users SET name = COALESCE(NULLIF(?, ""), name), phone = ? WHERE id = ?', ['Admin Updated', '08123456789', 1]);
    console.log('Success');
  } catch(e) {
    console.error('SQL Error:', e.message);
  }
  process.exit(0);
}
test();
