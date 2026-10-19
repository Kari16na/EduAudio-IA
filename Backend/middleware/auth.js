const cloudinary = require('cloudinary').v2;

const config = {
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
};

const missing = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.warn('Cloudinary no configurado completamente. Faltan variables:', missing.join(', '));
}

cloudinary.config(config);

module.exports = cloudinary;
