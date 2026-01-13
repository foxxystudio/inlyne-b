const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

// DigitalOcean Spaces configuration
const s3Client = new S3Client({
   region: process.env.DO_SPACES_REGION || 'nyc3', // örn: nyc3, ams3, sgp1, fra1
   endpoint: process.env.DO_SPACES_ENDPOINT, // örn: https://nyc3.digitaloceanspaces.com
   credentials: {
      accessKeyId: process.env.DO_SPACES_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET
   },
   forcePathStyle: false
});

/**
 * Upload a file to DigitalOcean Spaces
 * @param {string} filePath - Local file path
 * @param {string} key - Object key (path) in Spaces
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL of uploaded file
 */
const uploadToSpaces = async (filePath, key, contentType = 'image/webp') => {
   try {
      const fileContent = fs.readFileSync(filePath);
      const bucketName = process.env.DO_SPACES_BUCKET;

      const command = new PutObjectCommand({
         Bucket: bucketName,
         Key: key,
         Body: fileContent,
         ACL: 'public-read', // Make file publicly accessible
         ContentType: contentType,
         CacheControl: 'public, max-age=31536000' // Cache for 1 year
      });

      await s3Client.send(command);

      // Construct public URL
      // Format: https://{bucket}.{region}.digitaloceanspaces.com/{key}
      // or if using CDN: https://{bucket}.{region}.cdn.digitaloceanspaces.com/{key}
      const region = process.env.DO_SPACES_REGION || 'nyc3';
      const useCDN = process.env.DO_SPACES_USE_CDN === 'true';
      const cdnSuffix = useCDN ? '.cdn' : '';
      const publicUrl = `https://${bucketName}.${region}${cdnSuffix}.digitaloceanspaces.com/${key}`;

      console.log(`✅ File uploaded to Spaces: ${publicUrl}`);
      return publicUrl;
   } catch (error) {
      console.error('❌ Error uploading to Spaces:', error);
      throw error;
   }
};

module.exports = uploadToSpaces;
