/**
 * Script untuk reset password semua user default ke 'password123'
 * Jalankan: node database/reset-passwords.js
 */
import { pool } from '../backend/config/db.js'
import bcrypt from 'bcryptjs'

const users = [
  { email: 'admin@fnd.com', password: 'password123', role: 'admin', name: 'Admin Name' },
  { email: 'client@fnd.com', password: 'password123', role: 'client', name: 'Client One' },
  { email: 'crew@fnd.com', password: 'password123', role: 'crew', name: 'Rian Setiawan' },
]

async function run() {
  console.log('Checking database connection...')
  
  try {
    const [dbCheck] = await pool.query('SELECT DATABASE() AS db')
    console.log('Connected to database:', dbCheck[0]?.db || '(mock)')
  } catch (e) {
    console.log('Using mock database or connection error:', e.message)
  }

  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10)
    try {
      // Cek apakah user ada
      const [existing] = await pool.query('SELECT id, email FROM users WHERE email = ?', [u.email])
      
      if (existing.length === 0) {
        // Insert user baru
        await pool.query(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [u.name, u.email, hash, u.role]
        )
        console.log(`✅ Created user: ${u.email} (password: ${u.password})`)
      } else {
        // Update password
        await pool.query('UPDATE users SET password = ? WHERE email = ?', [hash, u.email])
        console.log(`✅ Reset password: ${u.email} (password: ${u.password})`)
      }
    } catch (err) {
      console.error(`❌ Failed for ${u.email}:`, err.message)
    }
  }

  // Verify passwords
  console.log('\nVerifying passwords...')
  for (const u of users) {
    try {
      const [rows] = await pool.query('SELECT id, email, password FROM users WHERE email = ?', [u.email])
      if (rows.length === 0) {
        console.log(`❌ User not found: ${u.email}`)
        continue
      }
      const match = await bcrypt.compare(u.password, rows[0].password)
      console.log(`${match ? '✅' : '❌'} ${u.email}: bcrypt.compare = ${match}`)
    } catch (err) {
      console.error(`❌ Verify error for ${u.email}:`, err.message)
    }
  }

  await pool.end?.().catch(() => {})
  console.log('\nDone!')
}

run().catch(console.error)
