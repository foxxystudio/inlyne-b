const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const uploadToSpaces = require('../uploadToSpaces');

const generateCoverImage = async (url, siteID) => {
   try {
      // Store covers under the same `/uploads` folder that Express serves
      // (mounted in `server.js` via `app.use('/uploads', express.static(...))`).
      // We need to back out two levels from `utils/site` to reach the project root.
      const uploadDir = path.join(
         __dirname,
         '..',
         '..',
         'uploads',
         'sites',
         'covers'
      );

      if (!fs.existsSync(uploadDir)) {
         fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, `${siteID}.webp`);

      // Allow overriding executable in prod where bundled Chromium is absent
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROMIUM_PATH;
      const browser = await puppeteer.launch({
         headless: true,
         executablePath: executablePath || undefined,
         args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // 🔍 sayfa hatalarını yakala
      page.on('pageerror', err => {
         console.error('PAGE ERROR:', err);
      });

      page.on('error', err => {
         console.error('BROWSER ERROR:', err);
      });

      await page.setViewport({
         width: 1920,
         height: 1080,
         deviceScaleFactor: 2
      });

      await page.goto(url, {
         waitUntil: 'networkidle2',
         timeout: 60000
      });

      await page.screenshot({
         path: filePath,
         type: 'webp',
         quality: 80,
         fullPage: false
      });

      await browser.close();

      // Check if DigitalOcean Spaces is configured
      const useSpaces = process.env.DO_SPACES_ENABLED === 'true' && 
                        process.env.DO_SPACES_BUCKET && 
                        process.env.DO_SPACES_KEY;

      if (useSpaces) {
         try {
            // Upload to DigitalOcean Spaces
            const spacesKey = `sites/covers/${siteID}.webp`;
            const spacesUrl = await uploadToSpaces(filePath, spacesKey, 'image/webp');
            
            // Optionally delete local file to save disk space
            if (process.env.DELETE_LOCAL_AFTER_UPLOAD === 'true') {
               fs.unlinkSync(filePath);
               console.log('🗑️ Local file deleted after upload');
            }
            
            return spacesUrl; // Return Spaces URL
         } catch (uploadError) {
            console.error('⚠️ Spaces upload failed, falling back to local:', uploadError);
            // Fall back to local URL if upload fails
            return `/uploads/sites/covers/${siteID}.webp`;
         }
      } else {
         console.log('📁 Saving locally (Spaces not configured)');
         return `/uploads/sites/covers/${siteID}.webp`;
      }
   } catch (error) {
      console.error('SCREENSHOT ERROR:', error);
      throw error; // frontend toast buradan tetikleniyor
   }
};

module.exports = generateCoverImage;