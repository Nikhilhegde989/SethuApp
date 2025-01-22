const cloudinary = require('cloudinary').v2;

// Configure Cloudinary using the CLOUDINARY_URL environment variable
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL, // Parses the URL automatically
});

module.exports = cloudinary;
