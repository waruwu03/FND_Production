import { pool } from './config/db.js';

const baseUrl = 'https://fnd-production-frontend-uxxg.vercel.app/r2-assets/images/';

const mapping = [
  { id: 2, file: 'FND-Par120-ezgif.com-png-to-webp-converter.webp' },
  { id: 3, file: 'FND-Freshnel300-ezgif.com-png-to-webp-converter.webp' },
  { id: 4, file: 'FND-Followspot-ezgif.com-png-to-webp-converter.webp' },
  { id: 5, file: 'FND-Bigeyes-ezgif.com-png-to-webp-converter.webp' },
  { id: 6, file: 'FND-Minibrute400-ezgif.com-png-to-webp-converter.webp' },
  { id: 7, file: 'FND-Wallwasher-ezgif.com-png-to-webp-converter.webp' },
  { id: 8, file: 'Stromy-Strobo-Light-1.000-FND-Pro-png.avif' },
  { id: 9, file: 'FND-LaserRGB-ezgif.com-png-to-webp-converter.webp' },
  { id: 10, file: 'FND-Pro-Grandma2-lighting-console-png.avif' },
  { id: 11, file: 'FND-Dryice3000-ezgif.com-png-to-webp-converter.webp' },
  { id: 12, file: 'FND-Haze600-ezgif.com-png-to-webp-converter.webp' },
];

async function run() {
  const connection = await pool.getConnection();
  try {
    for (const item of mapping) {
      const fullUrl = baseUrl + item.file;
      await connection.query('UPDATE equipment SET image_url = ? WHERE id = ?', [fullUrl, item.id]);
      console.log(`Updated equipment ID ${item.id} with image ${fullUrl}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
