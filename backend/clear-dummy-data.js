import { pool } from './config/db.js';

async function run() {
  const connection = await pool.getConnection();
  try {
    console.log('Starting data cleanup...');
    await connection.beginTransaction();

    // Delete transactional data in correct order to respect foreign keys
    console.log('Deleting notifications...');
    await connection.query('DELETE FROM notifications');
    
    console.log('Deleting event_checkins...');
    await connection.query('DELETE FROM event_checkins');
    
    console.log('Deleting event_equipment...');
    await connection.query('DELETE FROM event_equipment');
    
    console.log('Deleting event_crew...');
    await connection.query('DELETE FROM event_crew');
    
    console.log('Deleting payments...');
    await connection.query('DELETE FROM payments');
    
    console.log('Deleting events...');
    await connection.query('DELETE FROM events');

    await connection.commit();
    console.log('Cleanup completed successfully. Master data (Users, Crew, Equipment) is preserved.');
  } catch (error) {
    await connection.rollback();
    console.error('Error during cleanup:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
