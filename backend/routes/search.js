import express from 'express'
import { globalSearch } from '../controllers/searchController.js'
import { authenticate } from '../middlewares/auth.js'

const router = express.Router()

router.use(authenticate)
router.get('/', globalSearch)

export default router
