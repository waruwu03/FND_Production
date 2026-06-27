import dotenv from 'dotenv';
import { pool } from './config/db.js';

dotenv.config();

async function checkEquipment() {
    try {
        const [rows] = await pool.query('DESCRIBE events');
        console.log(JSON.stringify(rows.find(r=>r.Field === 'status'), null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
checkEquipment();
