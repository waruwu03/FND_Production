import dotenv from 'dotenv';
import { pool } from './config/db.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const mapping = {
  "Moving Head Beam": "8-ezgif.com-png-to-webp-converter.webp",
  "Par Light LED": "FND-Par120-ezgif.com-png-to-webp-converter.webp",
  "Fresnel LED": "FND-Freshnel300-ezgif.com-png-to-webp-converter.webp",
  "Follow Spotlight": "FND-Followspot-ezgif.com-png-to-webp-converter.webp",
  "Moving Head Big Eye": "FND-Bigeyes-ezgif.com-png-to-webp-converter.webp",
  "Minibrute": "FND-Minibrute400-ezgif.com-png-to-webp-converter.webp",
  "Wall Washer": "FND-Wallwasher-ezgif.com-png-to-webp-converter.webp",
  "Stromy / Strobo Light": "Stromy-Strobo-Light-1.000-FND-Pro-png.avif",
  "Mesin Laser RGB": "FND-LaserRGB-ezgif.com-png-to-webp-converter.webp",
  "Mixer Light GrandMA2": "FND-Pro-Grandma2-lighting-console-png.avif",
  "Mesin Dry Ice": "FND-Dryice3000-ezgif.com-png-to-webp-converter.webp",
  "Mesin Haze / Smoke": "FND-Haze600-ezgif.com-png-to-webp-converter.webp",
  "LED Par Light": "FND-Par120-ezgif.com-png-to-webp-converter.webp",
  "Moving Head": "8-ezgif.com-png-to-webp-converter.webp"
};

async function updateDatabase() {
    try {
        const [rows] = await pool.query('SELECT id, name FROM equipment');
        
        for (const row of rows) {
            const fileName = mapping[row.name];
            if (fileName) {
                // Ensure the file is in uploads/images
                const source = path.join(process.cwd(), 'uploads', 'scraped', fileName);
                const dest = path.join(process.cwd(), 'uploads', 'images', fileName);
                
                if (fs.existsSync(source)) {
                    // Copy to images folder
                    fs.copyFileSync(source, dest);
                    
                    // Update database
                    const imageUrl = `/uploads/images/${fileName}`;
                    await pool.query('UPDATE equipment SET image_url = ? WHERE id = ?', [imageUrl, row.id]);
                    console.log(`Updated ${row.name} with ${imageUrl}`);
                } else {
                    console.log(`File not found for ${row.name}: ${fileName}`);
                }
            }
        }
        console.log('Update complete!');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
updateDatabase();
