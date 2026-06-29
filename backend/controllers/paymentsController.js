import { pool } from '../config/db.js'
import { toPublicUploadUrl } from '../middlewares/upload.js'

export async function fetchPayments(req, res) {
  const { status } = req.query
  let query = `
    SELECT p.*, e.name AS event_name, e.status AS event_status, u.name AS client_name 
    FROM payments p 
    JOIN events e ON p.event_id = e.id 
    JOIN users u ON e.client_id = u.id
  `
  const params = []
  if (status) {
    query += ' WHERE p.status = ?'
    params.push(status)
  }
  query += ' ORDER BY p.created_at DESC LIMIT 200'
  const [rows] = await pool.query(query, params)
  res.json({ success: true, data: rows })
}

export async function createPayment(req, res) {
  const { eventId, amount, paymentType, status, proofUrl } = req.body
  if (!eventId || !amount || !paymentType) {
    return res.status(400).json({ success: false, error: 'Event ID, amount and payment type are required' })
  }

  const normalizedPaymentType = paymentType === 'pelunasan' ? 'full' : paymentType
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    
    const [result] = await connection.query(
      'INSERT INTO payments (event_id, amount, payment_type, status, proof_url) VALUES (?, ?, ?, ?, ?)',
      [eventId, amount, normalizedPaymentType, status || 'unpaid', proofUrl || null]
    )
    
    if (status === 'paid') {
      await connection.query('UPDATE events SET paid_amount = paid_amount + ? WHERE id = ?', [amount, eventId])
    }
    
    if (normalizedPaymentType === 'dp') {
      await connection.query('UPDATE events SET dp_amount = dp_amount + ? WHERE id = ?', [amount, eventId])
    }
    
    await connection.commit()
    res.status(201).json({ success: true, data: { paymentId: result.insertId } })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({ success: false, error: error.message })
  } finally {
    connection.release()
  }
}

export async function updatePayment(req, res) {
  const id = Number(req.params.id)
  const { amount, status, proofUrl } = req.body
  
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    
    const [rows] = await connection.query('SELECT * FROM payments WHERE id = ?', [id])
    const existing = rows[0]
    
    if (!existing) {
      await connection.rollback()
      return res.status(404).json({ success: false, error: 'Payment not found' })
    }

    const nextAmount = amount ?? existing.amount
    const nextStatus = status ?? existing.status
    const nextProofUrl = proofUrl !== undefined ? proofUrl : existing.proof_url
    
    await connection.query(
      'UPDATE payments SET amount = ?, status = ?, proof_url = ? WHERE id = ?',
      [nextAmount, nextStatus, nextProofUrl, id]
    )
    
    if (existing.status !== 'paid' && nextStatus === 'paid') {
      await connection.query(
        'UPDATE events SET paid_amount = paid_amount + ? WHERE id = ?',
        [nextAmount, existing.event_id]
      )
    } else if (existing.status === 'paid' && nextStatus !== 'paid') {
      await connection.query(
        'UPDATE events SET paid_amount = GREATEST(paid_amount - ?, 0) WHERE id = ?',
        [existing.amount, existing.event_id]
      )
    } else if (existing.status === 'paid' && Number(nextAmount) !== Number(existing.amount)) {
      await connection.query(
        'UPDATE events SET paid_amount = GREATEST(paid_amount - ? + ?, 0) WHERE id = ?',
        [existing.amount, nextAmount, existing.event_id]
      )
    }
    
    if (existing.payment_type === 'dp' && Number(nextAmount) !== Number(existing.amount)) {
      await connection.query(
        'UPDATE events SET dp_amount = GREATEST(dp_amount - ? + ?, 0) WHERE id = ?',
        [existing.amount, nextAmount, existing.event_id]
      )
    }
    
    await connection.commit()
    res.json({ success: true, message: 'Payment updated' })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({ success: false, error: error.message })
  } finally {
    connection.release()
  }
}

export async function getPayment(req, res) {
  const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [Number(req.params.id)])
  if (!rows[0]) {
    return res.status(404).json({ success: false, error: 'Payment not found' })
  }
  res.json({ success: true, data: rows[0] })
}

export async function uploadProof(req, res) {
  try {
    const id = Number(req.params.id)
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File tidak ditemukan' })
    }

    if (req.user.role === 'client') {
      const [rows] = await pool.query(
        `SELECT p.id
         FROM payments p
         JOIN events e ON e.id = p.event_id
         WHERE p.id = ? AND e.client_id = ?
         LIMIT 1`,
        [id, req.user.id],
      )
      if (!rows[0]) {
        return res.status(403).json({ success: false, error: 'Forbidden' })
      }
    }

    const proofUrl = toPublicUploadUrl(req.file)
    await pool.query('UPDATE payments SET proof_url = ? WHERE id = ?', [proofUrl, id])

    res.json({ success: true, data: { proofUrl }, message: 'Bukti pembayaran berhasil diunggah' })
  } catch (error) {
    console.error('Upload proof error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
