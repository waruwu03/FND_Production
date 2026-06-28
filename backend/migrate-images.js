import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { pool } from './config/db.js';

dotenv.config();

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  }
});

const uploadRoot = path.resolve('uploads');
const publicUrlBase = process.env.R2_PUBLIC_URL;
const bucketName = process.env.R2_BUCKET_NAME;

async function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.avif':
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
}

async function uploadFile(localPath, s3Key) {
  const fileStream = fs.createReadStream(localPath);
  const mimeType = await getMimeType(localPath);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: fileStream,
    ContentType: mimeType,
  });

  try {
    await s3.send(command);
    console.log(`Uploaded ${s3Key} successfully.`);
    return true;
  } catch (err) {
    console.error(`Failed to upload ${s3Key}:`, err);
    return false;
  }
}

async function migrateDirectory(subdir, dbTable, dbColumn) {
  const dirPath = path.join(uploadRoot, subdir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory ${dirPath} does not exist. Skipping.`);
    return;
  }

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const localPath = path.join(dirPath, file);
    if (fs.statSync(localPath).isFile()) {
      const s3Key = `${subdir}/${file}`;
      console.log(`Processing ${s3Key}...`);
      
      const success = await uploadFile(localPath, s3Key);
      
      if (success) {
        // Update database
        const oldUrl = `/uploads/${subdir}/${file}`;
        const newUrl = `${publicUrlBase}/${s3Key}`;
        
        try {
          const [result] = await pool.query(
            `UPDATE ${dbTable} SET ${dbColumn} = ? WHERE ${dbColumn} = ?`,
            [newUrl, oldUrl]
          );
          if (result.affectedRows > 0) {
            console.log(`Updated DB for ${file}: ${result.affectedRows} rows.`);
          }
        } catch (dbErr) {
          console.error(`Failed to update DB for ${file}:`, dbErr);
        }
      }
    }
  }
}

async function run() {
  console.log('Starting migration...');
  
  console.log('--- Migrating Avatars ---');
  await migrateDirectory('avatars', 'users', 'avatar_url');
  
  console.log('--- Migrating Images (Equipment) ---');
  await migrateDirectory('images', 'equipment', 'image_url');
  
  console.log('Migration completed.');
  process.exit(0);
}

run();
