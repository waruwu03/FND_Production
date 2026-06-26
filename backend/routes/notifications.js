import express from 'express'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notificationsController.js'
import { authenticate } from '../middlewares/auth.js'

const router = express.Router()

// All notification routes require authentication
router.use(authenticate)

router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.put('/read/:id', markAsRead)
router.put('/read-all', markAllAsRead)

export default router
