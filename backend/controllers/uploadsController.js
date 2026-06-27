import { toPublicUploadUrl } from '../middlewares/upload.js'

export async function uploadImages(req, res) {
  const files = req.files || []
  if (!files.length) {
    return res.status(400).json({ success: false, error: 'Tidak ada file yang diunggah' })
  }

  const data = files.map((file) => ({
    url: toPublicUploadUrl(file),
    filename: file.key || file.filename || file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  }))

  res.status(201).json({ success: true, data, message: 'Gambar berhasil diunggah' })
}
