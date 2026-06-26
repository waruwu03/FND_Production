import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.js'
import eventsRoutes from './routes/events.js'
import equipmentRoutes from './routes/equipment.js'
import crewRoutes from './routes/crew.js'
import paymentsRoutes from './routes/payments.js'
import reportsRoutes from './routes/reports.js'
import uploadsRoutes from './routes/uploads.js'
import notificationsRoutes from './routes/notifications.js'
import searchRoutes from './routes/search.js'
import { runMigrations } from '../database/migrate.js'

import os from 'os';

dotenv.config()

// Run database migrations on startup
try {
  console.log('Running database migrations...')
  await runMigrations()
  console.log('Database migrations check completed')
} catch (err) {
  console.error('Failed to run database migrations:', err)
}

const app = express()
const port = process.env.PORT || 4000
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// Security & Utility Middlewares
app.set('trust proxy', 1)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(morgan('dev'))
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },credentials: true,
}))
app.use(express.json({ limit: '8mb' }))
app.use(express.urlencoded({ extended: true, limit: '8mb' }))

// Rate Limiting (500 requests per 15 minutes - cukup longgar untuk development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 100 : 500, 
  message: { success: false, error: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.' }
})
app.use('/api/', limiter)

// Static Files
app.use('/uploads', express.static('uploads', {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
  },
}))

// API Routes
app.get('/api/db-status', async (req, res) => {
  try {
    const { pool: dbPool } = await import('./config/db.js')
    // Try a real MySQL ping
    const [rows] = await dbPool.query('SELECT DATABASE() AS db, CURRENT_USER() as user')
    // If rows have real data it's MySQL, otherwise mock
    const isMock = !rows[0]?.db || rows[0]?.db === undefined
    return res.json({
      success: true,
      database: isMock ? 'mock' : 'mysql',
      config: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
      },
      current: rows[0],
      message: isMock
        ? 'Backend is using in-memory mock database (MySQL unavailable)'
        : 'Backend is connected to MySQL database'
    })
  } catch (err) {
    return res.json({
      success: true,
      database: 'mock',
      message: 'Backend is using in-memory mock database (MySQL unavailable)',
      error: err.message
    })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/crew', crewRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/uploads', uploadsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/search', searchRoutes)

app.get('/', (req, res) => {
  res.json({ success: true, message: 'FND Production Backend is running' })
})

app.use((err, req, res, next) => {
  console.error(err)
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, error: err.message })
  }
  if (err.message?.includes('Format file tidak didukung')) {
    return res.status(400).json({ success: false, error: err.message })
  }
  res.status(500).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message || 'Server error' })
})

// Mendapatkan IP Jaringan Lokal (Network IP)
const getNetworkIP = () => {
  const interfaces = os.networkInterfaces();
  
  // Prioritaskan adapter Wi-Fi jika ada
  if (interfaces['Wi-Fi']) {
    const wifiIface = interfaces['Wi-Fi'].find(iface => iface.family === 'IPv4' && !iface.internal);
    if (wifiIface) return wifiIface.address;
  }

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const server = app.listen(port, '0.0.0.0', () => {
  const networkIP = getNetworkIP();
  console.log(`Backend running on:`)
  console.log(`- Local: http://localhost:${port}`)
  console.log(`- Network: http://${networkIP}:${port}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${port} sedang digunakan oleh proses lain.`)
    console.error(`Hentikan proses tersebut terlebih dahulu, atau ubah PORT= di backend/.env`)
    console.error(`Coba jalankan: netstat -ano | findstr :${port}\n`)
  } else {
    console.error('Server error:', err)
  }
  process.exit(1)
})
