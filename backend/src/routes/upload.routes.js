import { Router } from 'express';
import uploadController from '../controllers/uploadController.js';
import { uploadCombined, handleMulterError } from '../middleware/uploadMiddleware.js';
import Upload from '../models/Upload.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for upload endpoints
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 uploads per windowMs
  message: {
    success: false,
    message: 'Too many upload requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to validate phone number in requests
const validatePhoneNumber = (req, res, next) => {
  const phonenumber = req.body.phonenumber || req.params.phonenumber || req.query.phonenumber;
  
  if (!phonenumber) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }
  
  const phoneRegex = /^[+]?[0-9]{10,15}$/;
  if (!phoneRegex.test(phonenumber)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format'
    });
  }
  
  next();
};

// Basic authentication middleware (can be enhanced with JWT later)
const authenticate = (req, res, next) => {
  // For now, we're using phone number as identifier
  // In a production system, you would validate JWT tokens here
  const authorization = req.headers.authorization;
  const phonenumber = req.body.phonenumber || req.params.phonenumber || req.query.phonenumber;
  
  if (!phonenumber) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // Add user info to request for downstream middleware
  req.user = { phonenumber };
  next();
};

// Routes

/**
 * POST /uploads
 * Create a new upload with image and optional voice note
 * 
 * Form fields:
 * - image (file, required): Image file
 * - voice (file, optional): Voice note file
 * - description (string, required): Upload description
 * - phonenumber (string, required): User's phone number
 * - imageSource (string, required): 'camera' or 'gallery'
 * - locationType (string, optional): 'automatic', 'manual', or 'none'
 * - latitude (number, conditional): Required if locationType is not 'none'
 * - longitude (number, conditional): Required if locationType is not 'none'
 * - accuracy (number, optional): GPS accuracy in meters
 * - address (string, optional): Human-readable address
 * - deviceInfo (string, optional): Device information
 * - appVersion (string, optional): App version
 */
router.post('/', 
  uploadRateLimit,
  uploadCombined.fields([
    { name: 'image', maxCount: 1 },
    { name: 'voice', maxCount: 1 }
  ]),
  handleMulterError,
  validatePhoneNumber,
  authenticate,
  uploadController.createUpload
);

/**
 * GET /uploads/user/:phonenumber
 * Get all uploads for a specific user
 * 
 * Query parameters:
 * - page (number, optional): Page number (default: 1)
 * - limit (number, optional): Items per page (default: 20)
 */
router.get('/user/:phonenumber',
  generalRateLimit,
  validatePhoneNumber,
  authenticate,
  uploadController.getUserUploads
);

/**
 * GET /uploads/:id
 * Get a specific upload by ID
 * 
 * Query parameters:
 * - phonenumber (string, required): User's phone number for authorization
 */
router.get('/:id',
  generalRateLimit,
  authenticate,
  uploadController.getUploadById
);

/**
 * DELETE /uploads/:id
 * Delete a specific upload
 * 
 * Body:
 * - phonenumber (string, required): User's phone number for authorization
 */
router.delete('/:id',
  generalRateLimit,
  validatePhoneNumber,
  authenticate,
  uploadController.deleteUpload
);

/**
 * GET /uploads/location/nearby
 * Get uploads near a specific location
 * 
 * Query parameters:
 * - latitude (number, required): Latitude coordinate
 * - longitude (number, required): Longitude coordinate
 * - radius (number, optional): Search radius in kilometers (default: 10)
 */
router.get('/location/nearby',
  generalRateLimit,
  uploadController.getUploadsByLocation
);

/**
 * GET /uploads/stats/:phonenumber
 * Get upload statistics for a user
 */
router.get('/stats/:phonenumber',
  generalRateLimit,
  validatePhoneNumber,
  authenticate,
  async (req, res, next) => {
    try {
      const { phonenumber } = req.params;
      
      const stats = await Promise.all([
        // Total uploads
        Upload.countDocuments({ userPhoneNumber: phonenumber }),
        // Uploads with location
        Upload.countDocuments({ 
          userPhoneNumber: phonenumber, 
          locationType: { $in: ['automatic', 'manual'] }
        }),
        // Camera vs gallery uploads
        Upload.countDocuments({ userPhoneNumber: phonenumber, imageSource: 'camera' }),
        Upload.countDocuments({ userPhoneNumber: phonenumber, imageSource: 'gallery' }),
        // Uploads with voice notes
        Upload.countDocuments({ 
          userPhoneNumber: phonenumber, 
          voiceNotePath: { $ne: null }
        })
      ]);
      
      res.json({
        success: true,
        data: {
          stats: {
            totalUploads: stats[0],
            uploadsWithLocation: stats[1],
            cameraUploads: stats[2],
            galleryUploads: stats[3],
            uploadsWithVoice: stats[4],
            locationUsagePercentage: stats[0] > 0 ? Math.round((stats[1] / stats[0]) * 100) : 0,
            voiceUsagePercentage: stats[0] > 0 ? Math.round((stats[4] / stats[0]) * 100) : 0
          }
        }
      });
      
    } catch (error) {
      console.error('Error fetching upload stats:', error);
      next(error);
    }
  }
);

/**
 * GET /
 * Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Upload API is running',
    endpoints: {
      'POST /uploads': 'Create new upload',
      'GET /uploads/user/:phonenumber': 'Get user uploads',
      'GET /uploads/:id': 'Get upload by ID',
      'DELETE /uploads/:id': 'Delete upload',
      'GET /uploads/location/nearby': 'Get nearby uploads',
      'GET /uploads/stats/:phonenumber': 'Get user statistics'
    }
  });
});

export default router;