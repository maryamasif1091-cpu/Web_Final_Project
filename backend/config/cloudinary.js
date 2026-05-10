const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify connection
cloudinary.api.ping()
  .then(() => console.log(' Cloudinary Connected'))
  .catch(err => console.error(' Cloudinary Error:', err.message));

// Memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Upload handler with CORRECT resource_type
const uploadToCloudinary = (buffer, filename, folderPath = 'resumes') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw', 
        folder: folderPath,
        public_id: filename,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error('Upload Error:', error);
          reject(error);
        } else {
          console.log(' Upload Success:', result.secure_url);
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
};

module.exports = { cloudinary, upload, uploadToCloudinary };