import { pool } from '../config/db.js'
import { revokeUserRefreshTokens } from '../utils/authTokens.js'

// Bug Fix #2: Added try/catch to fetchCrew and getCrew
export async function fetchCrew(req, res) {
  try {
    const status = req.query.status === 'tersedia' ? 'available' : req.query.status
    let query = 'SELECT c.*, COALESCE(u.name, c.name) AS name, COALESCE(u.phone, c.phone) AS phone, u.avatar_url FROM crew c LEFT JOIN users u ON c.user_id = u.id'
    const params = []

    if (status) {
      query += ' WHERE c.status = ?'
      params.push(status)
    }

    query += ' ORDER BY c.status, c.id DESC'
    const [rows] = await pool.query(query, params)
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('fetchCrew error:', error)
    res.status(500).json({ success: false, error: 'Gagal mengambil data crew' })
  }
}

export async function getCrew(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT c.*, COALESCE(u.name, c.name) AS name, COALESCE(u.phone, c.phone) AS phone, u.avatar_url FROM crew c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?', 
      [Number(req.params.id)]
    )
    const item = rows[0]
    if (!item) {
      return res.status(404).json({ success: false, error: 'Crew not found' })
    }
    res.json({ success: true, data: item })
  } catch (error) {
    console.error('getCrew error:', error)
    res.status(500).json({ success: false, error: 'Gagal mengambil data crew' })
  }
}

export async function createCrew(req, res) {
  try {
    const { name, role, phone } = req.body
    if (!name || !role) {
      return res.status(400).json({ success: false, error: 'Name and role are required' })
    }

    const [result] = await pool.query('INSERT INTO crew (name, role, phone) VALUES (?, ?, ?)', [name, role, phone || null])
    res.status(201).json({ success: true, data: { crewId: result.insertId } })
  } catch (error) {
    console.error('createCrew error:', error)
    res.status(500).json({ success: false, error: 'Gagal membuat data crew' })
  }
}

export async function updateCrew(req, res) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const id = Number(req.params.id)
    const { name, role, phone } = req.body
    const status = req.body.status === 'tersedia' ? 'available' : req.body.status
    const [rows] = await connection.query('SELECT * FROM crew WHERE id = ?', [id])
    const crewMember = rows[0]
    if (!crewMember) {
      await connection.rollback()
      return res.status(404).json({ success: false, error: 'Crew not found' })
    }

    await connection.query(
      'UPDATE crew SET name = ?, role = ?, phone = ?, status = ? WHERE id = ?',
      [name || crewMember.name, role || crewMember.role, phone !== undefined ? phone : crewMember.phone, status || crewMember.status, id]
    )

    // Sync to users table if user_id is linked
    if (crewMember.user_id) {
      const userUpdates = []
      const userParams = []
      if (name) {
        userUpdates.push('name = ?')
        userParams.push(name)
      }
      if (phone !== undefined) {
        userUpdates.push('phone = ?')
        userParams.push(phone || null)
      }
      if (userUpdates.length > 0) {
        userParams.push(crewMember.user_id)
        await connection.query(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, userParams)
      }
    }

    await connection.commit()
    res.json({ success: true, message: 'Crew updated' })
  } catch (error) {
    await connection.rollback()
    console.error('updateCrew error:', error)
    res.status(500).json({ success: false, error: 'Gagal memperbarui data crew' })
  } finally {
    connection.release()
  }
}

// Bug Fix #4: Cek apakah crew masih aktif di event sebelum menghapus
export async function deleteCrew(req, res) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const crewId = Number(req.params.id)

    const [rows] = await connection.query('SELECT user_id FROM crew WHERE id = ?', [crewId])
    const crewMember = rows[0]
    if (!crewMember) {
      await connection.rollback()
      return res.status(404).json({ success: false, error: 'Crew not found' })
    }

    // Cek apakah crew masih ditugaskan di event aktif
    const [activeAssignments] = await connection.query(
      `SELECT ec.id FROM event_crew ec
       JOIN events e ON ec.event_id = e.id
       WHERE ec.crew_id = ? AND e.status NOT IN ('selesai', 'cancel')`,
      [crewId]
    )

    if (activeAssignments.length > 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        error: `Crew masih ditugaskan di ${activeAssignments.length} event aktif. Selesaikan atau batalkan event terlebih dahulu.`
      })
    }

    // Jika ada user_id yang terhubung, check and delete user record
    if (crewMember.user_id) {
      if (crewMember.user_id === req.user.id) {
        await connection.rollback()
        return res.status(400).json({ success: false, error: 'Tidak dapat menghapus akun sendiri' })
      }
      await revokeUserRefreshTokens(crewMember.user_id)
      await connection.query('DELETE FROM users WHERE id = ?', [crewMember.user_id])
    }

    await connection.query('DELETE FROM crew WHERE id = ?', [crewId])

    await connection.commit()
    res.json({ success: true, message: 'Crew removed' })
  } catch (error) {
    await connection.rollback()
    console.error('deleteCrew error:', error)
    res.status(500).json({ success: false, error: 'Gagal menghapus crew' })
  } finally {
    connection.release()
  }
}

// Bug Fix #5: Tambahkan cek konflik jadwal di assignCrew
export async function assignCrew(req, res) {
  try {
    const eventId = Number(req.params.id)
    const { crewId, task } = req.body
    if (!crewId) {
      return res.status(400).json({ success: false, error: 'Crew ID is required' })
    }

    // Ambil tanggal event untuk cek konflik
    const [eventRows] = await pool.query('SELECT event_date FROM events WHERE id = ?', [eventId])
    if (!eventRows[0]) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    // Cek konflik jadwal crew
    const [busyCrew] = await pool.query(
      `SELECT c.name, e.name as event_name
       FROM event_crew ec
       JOIN crew c ON ec.crew_id = c.id
       JOIN events e ON ec.event_id = e.id
       WHERE ec.crew_id = ? AND e.event_date = ? AND e.status NOT IN ('cancel', 'selesai') AND ec.event_id != ?`,
      [crewId, eventRows[0].event_date, eventId]
    )

    if (busyCrew.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Konflik Jadwal: ${busyCrew[0].name} sudah bertugas di event "${busyCrew[0].event_name}" pada tanggal tersebut.`
      })
    }

    await pool.query('INSERT INTO event_crew (event_id, crew_id, task) VALUES (?, ?, ?)', [eventId, crewId, task || 'Support'])
    await pool.query('UPDATE crew SET status = ? WHERE id = ?', ['on_job', crewId])
    res.json({ success: true, message: 'Crew assigned' })
  } catch (error) {
    console.error('assignCrew error:', error)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Crew sudah ditugaskan di event ini' })
    }
    res.status(500).json({ success: false, error: 'Gagal menugaskan crew' })
  }
}

// Admin-only: Create crew member with login account
export async function registerCrewAccount(req, res) {
  const { name, email, password, role, phone } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required' })
  }

  const bcrypt = (await import('bcryptjs')).default
  const hashed = bcrypt.hashSync(password, 12)
  const crewRole = role || 'Technician'
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    // Create user account with role 'crew'
    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, 'crew', phone || null]
    )

    // Create crew record linked to the user
    const [crewResult] = await connection.query(
      'INSERT INTO crew (user_id, name, role, phone) VALUES (?, ?, ?, ?)',
      [userResult.insertId, name, crewRole, phone || null]
    )

    await connection.commit()
    res.status(201).json({
      success: true,
      data: { userId: userResult.insertId, crewId: crewResult.insertId }
    })
  } catch (error) {
    await connection.rollback()
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Email sudah terdaftar' })
    }
    res.status(500).json({ success: false, error: error.message })
  } finally {
    connection.release()
  }
}

export async function unassignCrew(req, res) {
  try {
    const eventId = Number(req.params.id)
    const crewId = Number(req.params.crewId)

    await pool.query('DELETE FROM event_crew WHERE event_id = ? AND crew_id = ?', [eventId, crewId])
    await pool.query('UPDATE crew SET status = ? WHERE id = ?', ['available', crewId])

    res.json({ success: true, message: 'Crew unassigned successfully' })
  } catch (error) {
    console.error('unassignCrew error:', error)
    res.status(500).json({ success: false, error: 'Gagal melepas tugas crew' })
  }
}

