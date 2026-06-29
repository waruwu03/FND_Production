const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });

  try {
    const [rows] = await connection.query('DESCRIBE equipment');
    console.log(rows);
    
    const [data] = await connection.query('SELECT * FROM equipment LIMIT 5');
    console.log(data);
  } catch (err) {
    console.log(err.message);
  }

  await connection.end();
}

run();
