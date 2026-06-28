import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { mockPool } from './mockDb.js'

dotenv.config()
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') })

let pool;

async function createDatabasePool() {
  const candidate = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'event_lighting',
    ssl: process.env.DB_HOST && (process.env.DB_HOST.includes('aivencloud.com') || process.env.DB_HOST.includes('tidbcloud.com')) ? { rejectUnauthorized: true } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  })
  candidate.on('error', (err) => {
    console.warn('MySQL pool error:', err.message)
  })

  try {
    const connection = await candidate.getConnection()
    await connection.query('SELECT 1')
    connection.release()
    return candidate
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw err
    }
    console.warn('Failed to connect to MySQL, using mock database:', err.message)
    try {
      await candidate.end()
    } catch (_) {}
    return mockPool
  }
}

try {
  pool = await createDatabasePool()
} catch (err) {
  if (process.env.NODE_ENV === 'production') {
    throw err
  }
  console.warn('Failed to initialize database pool, using mock database:', err.message)
  pool = mockPool
}

export { pool }
