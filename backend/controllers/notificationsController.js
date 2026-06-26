import { pool } from '../config/db.js'

export async function getNotifications(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50')
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('getNotifications error:', error)
    res.status(500).json({ success: false, error: 'Gagal mengambil notifikasi' })
  }
}

export async function getUnreadCount(req, res) {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as unread FROM notifications WHERE is_read = FALSE')
    res.json({ success: true, count: rows[0].unread })
  } catch (error) {
    console.error('getUnreadCount error:', error)
    res.status(500).json({ success: false, error: 'Gagal menghitung notifikasi' })
  }
}

export async function markAsRead(req, res) {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [Number(req.params.id)])
    res.json({ success: true, message: 'Notification marked as read' })
  } catch (error) {
    console.error('markAsRead error:', error)
    res.status(500).json({ success: false, error: 'Gagal menandai notifikasi' })
  }
}

export async function markAllAsRead(req, res) {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE')
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    console.error('markAllAsRead error:', error)
    res.status(500).json({ success: false, error: 'Gagal menandai semua notifikasi' })
  }
}
