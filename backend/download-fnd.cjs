const https = require('https');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const websiteUrl = 'https://fndproduction.com/';
const uploadsDir = path.join(__dirname, 'uploads', 'scraped');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

console.log('Fetching website...');

https.get(websiteUrl, (res) => {
    let html = '';
    res.on('data', (chunk) => {
        html += chunk;
    });

    res.on('end', () => {
        const $ = cheerio.load(html);
        const imageUrls = new Set();
        
        $('img').each((i, el) => {
            let url = $(el).attr('data-src') || $(el).attr('src');
            if (!url) return;
            
            if (url.match(/\.(jpg|jpeg|png|webp|avif)(?:$|\?)/i)) {
                // Ensure absolute URL
                if (url.startsWith('//')) {
                    url = 'https:' + url;
                } else if (url.startsWith('/')) {
                    url = 'https://fndproduction.com' + url;
                }
                
                // Exclude some common non-equipment images like logos
                if (!url.includes('Logo') && !url.includes('wa-logo') && !url.includes('icon') && !url.includes('sampul')) {
                     imageUrls.add(url);
                }
            }
        });

        console.log(`Found ${imageUrls.size} images. Downloading...`);

        imageUrls.forEach((url) => {
            const fileName = path.basename(url).replace(/\?.*$/, '');
            const filePath = path.join(uploadsDir, fileName);

            https.get(url, (imageRes) => {
                if (imageRes.statusCode === 200) {
                    const fileStream = fs.createWriteStream(filePath);
                    imageRes.pipe(fileStream);
                    fileStream.on('finish', () => {
                        console.log(`Downloaded: ${fileName}`);
                    });
                }
            }).on('error', (err) => {
                console.error(`Failed to download ${url}: ${err.message}`);
            });
        });
    });
}).on('error', (err) => {
    console.error(`Failed to fetch website: ${err.message}`);
});
