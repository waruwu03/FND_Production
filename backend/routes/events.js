import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  fetchEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  updateStatus,
  getAssignedEvents,
  uploadEventDocumentation,
  getCheckInStatus,
  checkInEvent,
  checkOutEvent
} from '../controllers/eventsController.js'
import { validate } from '../middlewares/validate.js'
import { eventSchema, updateEventSchema, statusSchema } from '../utils/schemas.js'
import { imageUpload } from '../middlewares/upload.js'

const router = express.Router()

router.use(authenticate)
router.get('/assigned', authorize('crew'), getAssignedEvents)
router.get('/:id/checkin', authorize('crew'), getCheckInStatus)
router.post('/:id/checkin', authorize('crew'), checkInEvent)
router.post('/:id/checkout', authorize('crew'), checkOutEvent)
router.get('/', fetchEvents)
router.get('/:id', getEvent)
router.post('/:id/documentation', authorize('admin','crew'), imageUpload.array('images', 10), uploadEventDocumentation)
router.post('/', authorize('admin','client'), validate(eventSchema), createEvent)
router.put('/:id', authorize('admin','client'), validate(updateEventSchema), updateEvent)
router.delete('/:id', authorize('admin','client'), deleteEvent)
router.put('/:id/status', authorize('admin', 'crew'), validate(statusSchema), updateStatus)

export default router
