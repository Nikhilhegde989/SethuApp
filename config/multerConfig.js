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


const multerMemory = multer({
  storage: multer.memoryStorage(), // Use memory storage for Cloudinary
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'), false);
    }
  }
});

const chatAttachmentUpload = multer({
  storage: multer.memoryStorage(), // Use memory storage for Cloudinary
  limits: { fileSize: 10 * 1024 * 1024 }, // **10MB file size limit**
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/jpg',
      'video/mp4', 'video/mov', 'video/avi',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, MP4, MOV, AVI, PDF, DOC, DOCX'), false);
    }
  }
});


module.exports = { upload,multerMemory,chatAttachmentUpload  };
