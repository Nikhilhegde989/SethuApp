const multer = require('multer');
const path = require('path');

// Define file storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save files to the "uploads" directory
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Use original file name with a timestamp to prevent name conflicts
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter (optional - only allow certain file types like images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

module.exports = upload;
