import { pool } from './config/db.js';

async function migrate() {
  console.log('Starting migration to add preference columns...');
  try {
    await pool.query('ALTER TABLE users ADD COLUMN push_notif BOOLEAN DEFAULT TRUE;');
    console.log('Added push_notif column.');
  } catch (err) {
    console.log('push_notif column might already exist:', err.message);
  }

  try {
    await pool.query('ALTER TABLE users ADD COLUMN email_notif BOOLEAN DEFAULT FALSE;');
    console.log('Added email_notif column.');
  } catch (err) {
    console.log('email_notif column might already exist:', err.message);
  }

  try {
    await pool.query('ALTER TABLE users ADD COLUMN dark_mode BOOLEAN DEFAULT FALSE;');
    console.log('Added dark_mode column.');
  } catch (err) {
    console.log('dark_mode column might already exist:', err.message);
  }

  console.log('Migration complete.');
  process.exit(0);
}

migrate();
