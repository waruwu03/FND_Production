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
    console.log('Adding discount_price...');
    await connection.query('ALTER TABLE events ADD COLUMN discount_price DECIMAL(10,2) NOT NULL DEFAULT 0');
    console.log('Added discount_price.');
  } catch (err) {
    console.log('discount_price may already exist:', err.message);
  }

  try {
    console.log('Adding logistics_price...');
    await connection.query('ALTER TABLE events ADD COLUMN logistics_price DECIMAL(10,2) NOT NULL DEFAULT 0');
    console.log('Added logistics_price.');
  } catch (err) {
    console.log('logistics_price may already exist:', err.message);
  }

  await connection.end();
  console.log('Done.');
}

run();
