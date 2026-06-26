import { pool } from '../config/db.js'

export async function globalSearch(req, res) {
  try {
    const q = req.query.q || ''
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { events: [], users: [], equipment: [], crew: [] } })
    }

    const searchTerm = `%${q}%`
    
    // Search Events
    const eventsPromise = pool.query(
      `SELECT id, name, type, event_date, status 
       FROM events 
       WHERE name LIKE ? OR type LIKE ? OR location LIKE ? 
       LIMIT 5`,
      [searchTerm, searchTerm, searchTerm]
    )

    // Search Users (Clients)
    const usersPromise = pool.query(
      `SELECT id, name, email, role 
       FROM users 
       WHERE (name LIKE ? OR email LIKE ?) AND role = 'client' 
       LIMIT 5`,
      [searchTerm, searchTerm]
    )

    // Search Equipment
    const equipmentPromise = pool.query(
      `SELECT id, name, category, available_stock 
       FROM equipment 
       WHERE name LIKE ? OR category LIKE ? 
       LIMIT 5`,
      [searchTerm, searchTerm]
    )

    // Search Crew
    const crewPromise = pool.query(
      `SELECT id, name, role, status 
       FROM crew 
       WHERE name LIKE ? OR role LIKE ? 
       LIMIT 5`,
      [searchTerm, searchTerm]
    )

    const [
      [eventsRows],
      [usersRows],
      [equipmentRows],
      [crewRows]
    ] = await Promise.all([eventsPromise, usersPromise, equipmentPromise, crewPromise])

    res.json({
      success: true,
      data: {
        events: eventsRows,
        users: usersRows,
        equipment: equipmentRows,
        crew: crewRows
      }
    })

  } catch (error) {
    console.error('globalSearch error:', error)
    res.status(500).json({ success: false, error: 'Gagal melakukan pencarian' })
  }
}
