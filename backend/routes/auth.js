import express from 'express'
import {
  changePassword,
  createUser,
  deleteAvatar,
  deleteUser,
  getUsers,
  login,
  logout,
  logoutAll,
  profile,
  refresh,
  signup,
  updateProfile,
  updatePreferences,
  updateUser,
  uploadAvatar,
  uploadAvatarBase64,
} from '../controllers/authController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
  adminUserSchema,
  changePasswordSchema,
  loginSchema,
  signupSchema,
  updateAdminUserSchema,
  updateProfileSchema,
} from '../utils/schemas.js'
import { avatarUpload } from '../middlewares/upload.js'

const router = express.Router()

router.post('/login', validate(loginSchema), login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.post('/signup', validate(signupSchema), signup)
router.get('/profile', authenticate, profile)
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile)
router.put('/preferences', authenticate, updatePreferences)
router.put('/profile/password', authenticate, validate(changePasswordSchema), changePassword)
router.post('/profile/avatar', authenticate, avatarUpload.single('avatar'), uploadAvatar)
router.post('/profile/avatar-base64', authenticate, uploadAvatarBase64)
router.delete('/profile/avatar', authenticate, deleteAvatar)
router.get('/users', authenticate, authorize('admin'), getUsers)
router.post('/users', authenticate, authorize('admin'), validate(adminUserSchema), createUser)
router.put('/users/:id', authenticate, authorize('admin'), validate(updateAdminUserSchema), updateUser)
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser)
router.post('/logout-all', authenticate, logoutAll)

export default router
