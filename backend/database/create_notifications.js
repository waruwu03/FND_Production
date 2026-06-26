import { pool } from '../config/db.js';

async function run() {
  try {
    console.log("Creating notifications table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        link VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add some dummy notifications to test
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM notifications');
    if (rows[0].count === 0) {
      console.log("Adding dummy notifications...");
      await pool.query(`
        INSERT INTO notifications (title, message, type, is_read, link) VALUES 
        ('Event Baru', 'Ada pesanan event baru dari klien Budi.', 'info', FALSE, '/admin/events'),
        ('Pembayaran Diterima', 'Pembayaran DP untuk Event XYZ telah diterima.', 'success', FALSE, '/admin/finance'),
        ('Stok Menipis', 'Stok Kabel XLR sisa 2.', 'warning', FALSE, '/admin/inventory')
      `);
    }
    
    console.log("Table created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating table:", error);
    process.exit(1);
  }
}

run();
