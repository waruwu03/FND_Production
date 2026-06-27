import multer from 'multer'
import path from 'path'
import multerS3 from 'multer-s3'
import { S3Client } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

dotenv.config() // Ensure env variables are loaded

// S3 Client configuration for Cloudflare R2
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau WebP.'), false)
  }
}

function createImageUpload(subdir, maxFileSizeMb = 5) {
  const storage = multerS3({
    s3: s3,
    bucket: process.env.R2_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const safeExt = path.extname(file.originalname).toLowerCase() || '.jpg'
      const userPart = req.user?.id ? `u${req.user.id}-` : ''
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      const fileName = `${subdir}/${file.fieldname}-${userPart}${uniqueSuffix}${safeExt}`
      cb(null, fileName)
    }
  })

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSizeMb * 1024 * 1024,
      files: 10,
    },
  })
}

export function toPublicUploadUrl(file) {
  // multer-s3 menempatkan path file di dalam properti 'key'
  if (file.key) {
    return `${process.env.R2_PUBLIC_URL}/${file.key}`
  }
  // Fallback
  return file.location || ''
}

export const avatarUpload = createImageUpload('avatars', 5)
export const proofUpload = createImageUpload('payments', 8)
export const imageUpload = createImageUpload('images', 8)
export const upload = imageUpload
