import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const voiceDir = path.join(uploadsDir, 'voice');

// Create directories if they don't exist
[uploadsDir, imagesDir, voiceDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for images
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    
    // Sanitize filename
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for voice notes
const voiceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, voiceDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `voice-${uniqueSuffix}${ext}`);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/heic',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, HEIC, and WebP images are allowed.'), false);
  }
};

// File filter for voice notes
const voiceFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/m4a',
    'audio/aac',
    'audio/ogg'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid audio file type. Only MP3, WAV, M4A, AAC, and OGG are allowed.'), false);
  }
};

// Multer configurations
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
    files: 1 // Only one image per upload
  }
});

const uploadVoice = multer({
  storage: voiceStorage,
  fileFilter: voiceFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for voice notes
    files: 1 // Only one voice note per upload
  }
});

// Combined upload for both image and voice
const uploadCombined = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === 'image') {
        cb(null, imagesDir);
      } else if (file.fieldname === 'voice') {
        cb(null, voiceDir);
      } else {
        cb(new Error('Invalid field name'), false);
      }
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      
      if (file.fieldname === 'image') {
        const name = path.basename(file.originalname, ext);
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
      } else if (file.fieldname === 'voice') {
        cb(null, `voice-${uniqueSuffix}${ext}`);
      }
    }
  }),
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'image') {
      imageFileFilter(req, file, cb);
    } else if (file.fieldname === 'voice') {
      voiceFileFilter(req, file, cb);
    } else {
      cb(new Error('Invalid field name'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB overall limit
    files: 2, // Maximum 2 files (1 image + 1 voice)
    fields: 10 // Maximum 10 non-file fields
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    let statusCode = 400;
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size is 10MB for images and 5MB for voice notes.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 1 image and 1 voice note allowed.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields in the request.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field. Only "image" and "voice" fields are allowed.';
        break;
      default:
        message = `Upload error: ${error.message}`;
    }
    
    return res.status(statusCode).json({
      success: false,
      message,
      error: error.code
    });
  }
  
  if (error.message.includes('Invalid file type') || error.message.includes('Invalid field name')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Utility function to clean up uploaded files on error
const cleanupFiles = (files) => {
  if (!files) return;
  
  const filesToDelete = [];
  
  if (Array.isArray(files)) {
    filesToDelete.push(...files);
  } else if (typeof files === 'object') {
    Object.values(files).forEach(fileArray => {
      if (Array.isArray(fileArray)) {
        filesToDelete.push(...fileArray);
      } else {
        filesToDelete.push(fileArray);
      }
    });
  }
  
  filesToDelete.forEach(file => {
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error('Error deleting file:', file.path, error);
      }
    }
  });
};

export {
  uploadImage,
  uploadVoice,
  uploadCombined,
  handleMulterError,
  cleanupFiles,
  imagesDir,
  voiceDir
};