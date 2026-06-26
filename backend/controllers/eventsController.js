import { pool } from '../config/db.js'
import { toPublicUploadUrl } from '../middlewares/upload.js'

// Bug Fix #1: Dideklarasikan di awal agar bisa dipakai oleh semua fungsi di bawah
const statusOrder = ['pending', 'survey', 'deal', 'running', 'selesai', 'cancel']

// Bug Fix #2: Added try/catch to fetchEvents
export async function fetchEvents(req, res) {
  const { status, clientId } = req.query
  let query = 'SELECT e.*, u.name AS client_name, u.phone AS client_phone FROM events e LEFT JOIN users u ON e.client_id = u.id'
  const params = []
  const conditions = []

  if (req.user.role === 'client') {
    conditions.push('e.client_id = ?')
    params.push(req.user.id)
  }

  if (status) {
    conditions.push('e.status = ?')
    params.push(status)
  }

  if (clientId && req.user.role === 'admin') {
    conditions.push('e.client_id = ?')
    params.push(clientId)
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ')
  }

  query += ' ORDER BY e.event_date DESC LIMIT 100'
  try {
    const [events] = await pool.query(query, params)
    console.log(`fetchEvents called by user ${req.user.id} (${req.user.role}). Returning ${events.length} events.`)
    res.json({ success: true, data: events })
  } catch (error) {
    console.error('fetchEvents error:', error)
    res.status(500).json({ success: false, error: 'Gagal mengambil data event' })
  }
}

// Bug Fix #2: Added try/catch to getEvent
export async function getEvent(req, res) {
  try {
    const eventId = Number(req.params.id)
    const [rows] = await pool.query(
      `SELECT e.*, u.name AS client_name, u.email AS client_email
       FROM events e
       LEFT JOIN users u ON e.client_id = u.id
       WHERE e.id = ?`,
      [eventId],
    )
    const event = rows[0]
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    if (req.user.role === 'client' && event.client_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }

    const [equipment] = await pool.query(
      `SELECT eq.id, eq.name, ee.quantity
       FROM event_equipment ee
       JOIN equipment eq ON ee.equipment_id = eq.id
       WHERE ee.event_id = ?`,
      [eventId],
    )

    const [crewMembers] = await pool.query(
      `SELECT c.id, c.name, c.role, c.status, ec.task
       FROM event_crew ec
       JOIN crew c ON ec.crew_id = c.id
       WHERE ec.event_id = ?`,
      [eventId],
    )

    const [payments] = await pool.query(
      `SELECT * FROM payments WHERE event_id = ? ORDER BY created_at DESC`,
      [eventId],
    )

    const [checkins] = await pool.query(
      `SELECT ci.*, u.name AS crew_name, u.email AS crew_email
       FROM event_checkins ci
       JOIN users u ON ci.crew_user_id = u.id
       WHERE ci.event_id = ?
       ORDER BY ci.updated_at DESC`,
      [eventId],
    )

    res.json({ success: true, data: { ...event, equipment, crew: crewMembers, payments, checkins } })
  } catch (error) {
    console.error('getEvent error:', error)
    res.status(500).json({ success: false, error: 'Gagal mengambil detail event' })
  }
}

export async function createEvent(req, res) {
  const {
    name,
    type,
    eventDate,
    location,
    notes,
    totalAmount,
    dpAmount,
    referenceImages = [],
    equipment = [],
    crew = [],
  } = req.body

  if (!name || !type || !eventDate || !location) {
    return res.status(400).json({ success: false, error: 'Required fields are missing' })
  }

  const clientId = req.user.role === 'client' ? req.user.id : req.body.clientId || req.user.id
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    // 1. Check Crew Conflict
    if (crew.length > 0) {
      const crewIds = crew.map(m => m.crewId)
      const [busyCrew] = await connection.query(
        `SELECT c.name, e.name as event_name 
         FROM event_crew ec 
         JOIN crew c ON ec.crew_id = c.id 
         JOIN events e ON ec.event_id = e.id 
         WHERE ec.crew_id IN (?) AND e.event_date = ? AND e.status != 'cancel'`,
        [crewIds, eventDate]
      )

      if (busyCrew.length > 0) {
        await connection.rollback()
        return res.status(400).json({ 
          success: false, 
          error: `Konflik Jadwal: ${busyCrew[0].name} sudah bertugas di event "${busyCrew[0].event_name}" pada tanggal tersebut.` 
        })
      }
    }

    // 2. Check Equipment Stock
    for (const item of equipment) {
      if (!item.equipmentId || !item.quantity) continue
      const [stockRows] = await connection.query(
        'SELECT name, available_stock FROM equipment WHERE id = ?',
        [item.equipmentId]
      )
      if (stockRows[0] && stockRows[0].available_stock < item.quantity) {
        await connection.rollback()
        return res.status(400).json({
          success: false,
          error: `Stok Tidak Cukup: ${stockRows[0].name} hanya tersedia ${stockRows[0].available_stock} unit.`
        })
      }
    }

    const [result] = await connection.query(
      'INSERT INTO events (name, type, event_date, location, notes, client_id, total_amount, dp_amount, paid_amount, reference_images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, type, eventDate, location, notes, clientId, totalAmount || 0, dpAmount || 0, dpAmount || 0, JSON.stringify(referenceImages)],
    )

    const eventId = result.insertId

    for (const item of equipment) {
      if (!item.equipmentId || !item.quantity) continue
      await connection.query('INSERT INTO event_equipment (event_id, equipment_id, quantity) VALUES (?, ?, ?)', [eventId, item.equipmentId, item.quantity])
      await connection.query('UPDATE equipment SET available_stock = GREATEST(available_stock - ?, 0) WHERE id = ?', [item.quantity, item.equipmentId])
    }

    for (const member of crew) {
      if (!member.crewId) continue
      await connection.query('INSERT INTO event_crew (event_id, crew_id, task) VALUES (?, ?, ?)', [eventId, member.crewId, member.task || 'Support'])
      await connection.query('UPDATE crew SET status = ? WHERE id = ?', ['on_job', member.crewId])
    }

    await connection.commit()
    console.log(`createEvent: Event ${eventId} created successfully for client ${clientId}`)
    res.status(201).json({ success: true, data: { eventId }, message: 'Event created' })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({ success: false, error: error.message })
  } finally {
    connection.release()
  }
}

export async function updateEvent(req, res) {
  try {
    const eventId = Number(req.params.id)
    const { name, type, eventDate, location, notes, status, totalAmount, dpAmount, referenceImages } = req.body
    const [eventRows] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId])
    const existing = eventRows[0]

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    if (req.user.role === 'client' && existing.client_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }

    const updatedStatus = status && statusOrder.includes(status) ? status : existing.status
    const updatedImages = referenceImages
      ? JSON.stringify(referenceImages)
      : (existing.reference_images
          ? (typeof existing.reference_images === 'string'
              ? existing.reference_images
              : JSON.stringify(existing.reference_images))
          : null)

    await pool.query(
      'UPDATE events SET name = ?, type = ?, event_date = ?, location = ?, notes = ?, status = ?, total_amount = ?, dp_amount = ?, reference_images = ? WHERE id = ?',
      [
        name || existing.name,
        type || existing.type,
        eventDate || existing.event_date,
        location || existing.location,
        notes || existing.notes,
        updatedStatus,
        totalAmount || existing.total_amount,
        dpAmount || existing.dp_amount,
        updatedImages,
        eventId
      ],
    )

    if (status === 'selesai' && existing.status !== 'selesai') {
      await returnEquipmentAndCrew(eventId)
    }

    res.json({ success: true, message: 'Event updated' })
  } catch (error) {
    console.error('updateEvent error:', error)
    res.status(500).json({ success: false, error: 'Gagal memperbarui event' })
  }
}

export async function deleteEvent(req, res) {
  try {
    const eventId = Number(req.params.id)
    const [rows] = await pool.query('SELECT status, client_id FROM events WHERE id = ?', [eventId])
    const event = rows[0]
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    if (req.user.role === 'client') {
      if (Number(event.client_id) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Ini bukan event Anda' })
      }
      if (event.status === 'cancel') {
        return res.json({ success: true, message: 'Event sudah dibatalkan' })
      }
      if (event.status !== 'pending' && event.status !== 'survey') {
        return res.status(400).json({ success: false, error: 'Booking yang sudah diproses tidak dapat dibatalkan, silakan hubungi admin.' })
      }
      
      // Client hanya bisa membatalkan (soft delete / status cancel)
      await pool.query('UPDATE events SET status = ? WHERE id = ?', ['cancel', eventId])
      if (!['cancel', 'selesai'].includes(rows[0].status)) {
        await returnEquipmentAndCrew(eventId)
      }
      return res.json({ success: true, message: 'Event cancelled' })
    }

    // Jika ADMIN, lakukan HARD DELETE (hapus permanen dari database)
    // 1. Kembalikan stok equipment & crew jika belum selesai/cancel
    if (!['cancel', 'selesai'].includes(event.status)) {
      await returnEquipmentAndCrew(eventId)
    }
    
    // 2. Hapus data terkait terlebih dahulu (mencegah foreign key error)
    await pool.query('DELETE FROM event_equipment WHERE event_id = ?', [eventId]);
    await pool.query('DELETE FROM event_crew WHERE event_id = ?', [eventId]);
    await pool.query('DELETE FROM payments WHERE event_id = ?', [eventId]);
    await pool.query('DELETE FROM event_checkins WHERE event_id = ?', [eventId]);
    
    // 3. Hapus event utama
    await pool.query('DELETE FROM events WHERE id = ?', [eventId]);
    
    res.json({ success: true, message: 'Event berhasil dihapus secara permanen' })
  } catch (error) {
    console.error('deleteEvent error:', error)
    res.status(500).json({ success: false, error: 'Gagal membatalkan/menghapus event' })
  }
}

async function returnEquipmentAndCrew(eventId) {
  const [equipRows] = await pool.query('SELECT equipment_id, quantity FROM event_equipment WHERE event_id = ?', [eventId])
  for (const item of equipRows) {
    await pool.query('UPDATE equipment SET available_stock = available_stock + ? WHERE id = ?', [item.quantity, item.equipment_id])
  }

  const [crewRows] = await pool.query('SELECT crew_id FROM event_crew WHERE event_id = ?', [eventId])
  for (const row of crewRows) {
    await pool.query('UPDATE crew SET status = ? WHERE id = ?', ['available', row.crew_id])
  }
}

export async function updateStatus(req, res) {
  try {
    const eventId = Number(req.params.id)
    const { status } = req.body
    if (!statusOrder.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status: ' + status })
    }

    const [rows] = await pool.query('SELECT status FROM events WHERE id = ?', [eventId])
    if (!rows[0]) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    await pool.query('UPDATE events SET status = ? WHERE id = ?', [status, eventId])
    if (['selesai', 'cancel'].includes(status) && !['selesai', 'cancel'].includes(rows[0].status)) {
      await returnEquipmentAndCrew(eventId)
    }
    res.json({ success: true, message: 'Event status updated', data: { status } })
  } catch (error) {
    console.error('Update status error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

// Bug Fix #3: Hanya gunakan c.user_id, bukan OR c.name (mencegah konflik nama duplikat)
export async function getAssignedEvents(req, res) {
  if (req.user.role !== 'crew') {
    return res.status(403).json({ success: false, error: 'Only crew can fetch assigned events' })
  }

  try {
    const query = `
      SELECT e.*, ec.task
      FROM events e
      JOIN event_crew ec ON e.id = ec.event_id
      JOIN crew c ON ec.crew_id = c.id
      WHERE c.user_id = ?
      ORDER BY e.event_date ASC
    `
    const [rows] = await pool.query(query, [req.user.id])
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('getAssignedEvents error:', error)
    res.status(500).json({ success: false, error: 'Gagal mengambil event yang ditugaskan' })
  }
}

function parseReferenceImages(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function uploadEventDocumentation(req, res) {
  try {
    const eventId = Number(req.params.id)
    const files = req.files || []

    if (!files.length) {
      return res.status(400).json({ success: false, error: 'Tidak ada file yang diunggah' })
    }

    const [eventRows] = await pool.query('SELECT id, reference_images FROM events WHERE id = ? LIMIT 1', [eventId])
    const event = eventRows[0]

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' })
    }

    if (req.user.role === 'crew') {
      const [assignmentRows] = await pool.query(
        `SELECT ec.id
         FROM event_crew ec
         JOIN crew c ON ec.crew_id = c.id
         WHERE ec.event_id = ? AND c.user_id = ?
         LIMIT 1`,
        [eventId, req.user.id],
      )

      if (!assignmentRows[0]) {
        return res.status(403).json({ success: false, error: 'Crew tidak ditugaskan pada event ini' })
      }
    }

    const uploadedUrls = files.map(toPublicUploadUrl)
    const existingImages = parseReferenceImages(event.reference_images)
    const nextImages = [...existingImages, ...uploadedUrls].slice(-40)

    await pool.query('UPDATE events SET reference_images = ? WHERE id = ?', [JSON.stringify(nextImages), eventId])

    res.status(201).json({
      success: true,
      data: uploadedUrls.map((url) => ({ url })),
      message: 'Dokumentasi berhasil diunggah',
    })
  } catch (error) {
    console.error('Upload event documentation error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function ensureCrewAssigned(eventId, user) {
  const [assignmentRows] = await pool.query(
    `SELECT ec.id
     FROM event_crew ec
     JOIN crew c ON ec.crew_id = c.id
     WHERE ec.event_id = ? AND c.user_id = ?
     LIMIT 1`,
    [eventId, user.id],
  )

  return Boolean(assignmentRows[0])
}

export async function getCheckInStatus(req, res) {
  try {
    const eventId = Number(req.params.id)
    if (!(await ensureCrewAssigned(eventId, req.user))) {
      return res.status(403).json({ success: false, error: 'Crew tidak ditugaskan pada event ini' })
    }

    const [rows] = await pool.query(
      'SELECT * FROM event_checkins WHERE event_id = ? AND crew_user_id = ? LIMIT 1',
      [eventId, req.user.id],
    )

    res.json({ success: true, data: rows[0] || null })
  } catch (error) {
    console.error('Get check-in status error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export async function checkInEvent(req, res) {
  try {
    const eventId = Number(req.params.id)
    const latitude = req.body?.latitude ?? null
    const longitude = req.body?.longitude ?? null

    if (!(await ensureCrewAssigned(eventId, req.user))) {
      return res.status(403).json({ success: false, error: 'Crew tidak ditugaskan pada event ini' })
    }

    await pool.query(
      `INSERT INTO event_checkins (event_id, crew_user_id, check_in_at, latitude, longitude)
       VALUES (?, ?, NOW(), ?, ?)
       ON DUPLICATE KEY UPDATE
         check_in_at = COALESCE(check_in_at, NOW()),
         latitude = VALUES(latitude),
         longitude = VALUES(longitude),
         updated_at = CURRENT_TIMESTAMP`,
      [eventId, req.user.id, latitude, longitude],
    )

    const [rows] = await pool.query(
      'SELECT * FROM event_checkins WHERE event_id = ? AND crew_user_id = ? LIMIT 1',
      [eventId, req.user.id],
    )
    res.status(201).json({ success: true, data: rows[0], message: 'Check-in berhasil dicatat' })
  } catch (error) {
    console.error('Check-in error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export async function checkOutEvent(req, res) {
  try {
    const eventId = Number(req.params.id)

    if (!(await ensureCrewAssigned(eventId, req.user))) {
      return res.status(403).json({ success: false, error: 'Crew tidak ditugaskan pada event ini' })
    }

    await pool.query(
      `INSERT INTO event_checkins (event_id, crew_user_id, check_in_at, check_out_at)
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         check_out_at = NOW(),
         updated_at = CURRENT_TIMESTAMP`,
      [eventId, req.user.id],
    )

    const [rows] = await pool.query(
      'SELECT * FROM event_checkins WHERE event_id = ? AND crew_user_id = ? LIMIT 1',
      [eventId, req.user.id],
    )
    res.json({ success: true, data: rows[0], message: 'Check-out berhasil dicatat' })
  } catch (error) {
    console.error('Check-out error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
