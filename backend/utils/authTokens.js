import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { pool } from '../config/db.js'

const accessSecret = process.env.JWT_SECRET || 'supersecretkey'
const refreshSecret = process.env.JWT_REFRESH_SECRET || `${accessSecret}:refresh`

export const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
export const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'
export const ACCESS_TOKEN_MAX_AGE_SECONDS = Number(process.env.JWT_MAX_AGE_SECONDS || 15 * 60)
export const REFRESH_TOKEN_MAX_AGE_SECONDS = Number(process.env.JWT_REFRESH_MAX_AGE_SECONDS || 30 * 24 * 60 * 60)

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? null,
    avatar_url: user.avatar_url ?? null,
    push_notif: user.push_notif === undefined ? true : Boolean(user.push_notif),
    email_notif: user.email_notif === undefined ? false : Boolean(user.email_notif),
    dark_mode: user.dark_mode === undefined ? false : Boolean(user.dark_mode),
  }
}

export function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, jti: crypto.randomUUID() },
    accessSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
  )
}

export function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: 'refresh', jti: crypto.randomUUID() },
    refreshSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN },
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret)
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, refreshSecret)
  if (payload.type !== 'refresh') {
    throw new Error('Invalid refresh token')
  }
  return payload
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function expiresAtFromNow(seconds = REFRESH_TOKEN_MAX_AGE_SECONDS) {
  return new Date(Date.now() + seconds * 1000)
}

export async function persistRefreshToken({ token, userId, userAgent, ip }) {
  const tokenHash = hashToken(token)
  const expiresAt = expiresAtFromNow()

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, tokenHash, userAgent || null, ip || null, expiresAt],
  )

  return { tokenHash, expiresAt }
}

export async function revokeRefreshToken(token) {
  if (!token) return
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND revoked_at IS NULL',
    [hashToken(token)],
  )
}

export async function revokeUserRefreshTokens(userId) {
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL',
    [userId],
  )
}

export async function findActiveRefreshToken(token) {
  const [rows] = await pool.query(
    `SELECT rt.id AS refresh_token_id, rt.user_id, rt.token_hash, rt.user_agent, rt.ip_address,
            rt.expires_at, rt.revoked_at, rt.created_at,
            u.id, u.name, u.email, u.role, u.phone, u.avatar_url, u.push_notif, u.email_notif, u.dark_mode
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = ?
       AND rt.revoked_at IS NULL
       AND rt.expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [hashToken(token)],
  )

  return rows[0] || null
}

export async function issueTokenPair(user, req) {
  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)

  await persistRefreshToken({
    token: refreshToken,
    userId: user.id,
    userAgent: req.get?.('user-agent'),
    ip: req.ip,
  })

  return { accessToken, refreshToken }
}
