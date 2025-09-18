import Upload from '../models/Upload.js';
import User from '../models/User.js';
import { cleanupFiles } from '../middleware/uploadMiddleware.js';
import path from 'path';
import fs from 'fs';

class UploadController {
  // Create a new upload
  async createUpload(req, res, next) {
    let uploadedFiles = req.files;
    
    try {
      const {
        description,
        phonenumber,
        imageSource,
        locationType = 'none',
        latitude,
        longitude,
        accuracy,
        address,
        deviceInfo,
        appVersion,
        voiceNoteDuration
      } = req.body;

      // Validate required fields
      if (!description || !phonenumber || !imageSource) {
        cleanupFiles(uploadedFiles);
        return res.status(400).json({
          success: false,
          message: 'Description, phone number, and image source are required'
        });
      }

      // Check if image file is provided
      if (!uploadedFiles || !uploadedFiles.image || uploadedFiles.image.length === 0) {
        cleanupFiles(uploadedFiles);
        return res.status(400).json({
          success: false,
          message: 'Image file is required'
        });
      }

      // Validate phone number format
      const phoneRegex = /^[+]?[0-9]{10,15}$/;
      if (!phoneRegex.test(phonenumber)) {
        cleanupFiles(uploadedFiles);
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      // Find user by phone number
      const user = await User.findByPhoneNumber(phonenumber);
      if (!user) {
        cleanupFiles(uploadedFiles);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const imageFile = uploadedFiles.image[0];
      const voiceFile = uploadedFiles.voice ? uploadedFiles.voice[0] : null;

      // Validate location data based on locationType
      let locationData = { accuracy: null, address: '' };
      
      if (locationType === 'manual' || locationType === 'automatic') {
        if (!latitude || !longitude) {
          cleanupFiles(uploadedFiles);
          return res.status(400).json({
            success: false,
            message: 'Latitude and longitude are required for location-based uploads'
          });
        }

        // Validate coordinate ranges
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          cleanupFiles(uploadedFiles);
          return res.status(400).json({
            success: false,
            message: 'Invalid latitude or longitude values'
          });
        }

        locationData = {
          latitude: lat,
          longitude: lng,
          accuracy: accuracy ? parseFloat(accuracy) : null,
          address: address || ''
        };
      }

      // Create upload record
      const uploadData = {
        userId: user._id,
        userPhoneNumber: phonenumber,
        description: description.trim(),
        imagePath: imageFile.path,
        originalImageName: imageFile.originalname,
        imageSize: imageFile.size,
        mimeType: imageFile.mimetype,
        location: locationData,
        locationType,
        imageSource,
        metadata: {
          deviceInfo: deviceInfo || '',
          appVersion: appVersion || '',
          uploadMethod: 'mobile'
        }
      };

      // Add voice note data if provided
      if (voiceFile) {
        uploadData.voiceNotePath = voiceFile.path;
        uploadData.voiceNoteDuration = voiceNoteDuration ? parseInt(voiceNoteDuration) : null;
      }

      const upload = new Upload(uploadData);
      await upload.save();

      // Update user's last login to track activity
      await user.updateLastLogin();

      res.status(201).json({
        success: true,
        message: 'Upload created successfully',
        data: {
          upload: {
            id: upload._id,
            description: upload.description,
            imageSource: upload.imageSource,
            locationType: upload.locationType,
            location: upload.formattedLocation,
            hasVoiceNote: !!upload.voiceNotePath,
            voiceNoteDuration: upload.voiceNoteDuration,
            status: upload.status,
            createdAt: upload.createdAt
          }
        }
      });

    } catch (error) {
      // Clean up uploaded files on error
      cleanupFiles(uploadedFiles);
      
      console.error('Error creating upload:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: Object.values(error.errors).map(err => err.message)
        });
      }
      
      next(error);
    }
  }

  // Get user uploads
  async getUserUploads(req, res, next) {
    try {
      const { phonenumber } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Validate phone number
      const phoneRegex = /^[+]?[0-9]{10,15}$/;
      if (!phoneRegex.test(phonenumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      // Check if user exists
      const user = await User.findByPhoneNumber(phonenumber);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const uploads = await Upload.findByUserPhone(phonenumber, parseInt(limit), skip);
      
      const totalUploads = await Upload.countDocuments({ userPhoneNumber: phonenumber });
      const totalPages = Math.ceil(totalUploads / parseInt(limit));

      res.json({
        success: true,
        data: {
          uploads: uploads.map(upload => ({
            id: upload._id,
            description: upload.description,
            imageSource: upload.imageSource,
            locationType: upload.locationType,
            location: upload.formattedLocation,
            hasVoiceNote: !!upload.voiceNotePath,
            voiceNoteDuration: upload.voiceNoteDuration,
            status: upload.status,
            createdAt: upload.createdAt,
            updatedAt: upload.updatedAt
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalUploads,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('Error fetching user uploads:', error);
      next(error);
    }
  }

  // Get single upload details
  async getUploadById(req, res, next) {
    try {
      const { id } = req.params;
      const { phonenumber } = req.query;

      const upload = await Upload.findById(id).populate('userId', 'name phonenumber');
      
      if (!upload) {
        return res.status(404).json({
          success: false,
          message: 'Upload not found'
        });
      }

      // Check if user has permission to view this upload
      if (phonenumber && upload.userPhoneNumber !== phonenumber) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          upload: {
            id: upload._id,
            description: upload.description,
            imageSource: upload.imageSource,
            locationType: upload.locationType,
            location: upload.formattedLocation,
            hasVoiceNote: !!upload.voiceNotePath,
            voiceNoteDuration: upload.voiceNoteDuration,
            status: upload.status,
            metadata: upload.metadata,
            user: {
              name: upload.userId.name,
              phonenumber: upload.userId.phonenumber
            },
            createdAt: upload.createdAt,
            updatedAt: upload.updatedAt
          }
        }
      });

    } catch (error) {
      console.error('Error fetching upload:', error);
      next(error);
    }
  }

  // Delete upload
  async deleteUpload(req, res, next) {
    try {
      const { id } = req.params;
      const { phonenumber } = req.body;

      if (!phonenumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      const upload = await Upload.findById(id);
      
      if (!upload) {
        return res.status(404).json({
          success: false,
          message: 'Upload not found'
        });
      }

      // Check if user owns this upload
      if (upload.userPhoneNumber !== phonenumber) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Delete associated files
      try {
        if (upload.imagePath && fs.existsSync(upload.imagePath)) {
          fs.unlinkSync(upload.imagePath);
        }
        if (upload.voiceNotePath && fs.existsSync(upload.voiceNotePath)) {
          fs.unlinkSync(upload.voiceNotePath);
        }
      } catch (fileError) {
        console.error('Error deleting files:', fileError);
        // Continue with database deletion even if file deletion fails
      }

      await Upload.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Upload deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting upload:', error);
      next(error);
    }
  }

  // Get uploads by location (nearby uploads)
  async getUploadsByLocation(req, res, next) {
    try {
      const { latitude, longitude, radius = 10 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseFloat(radius);

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid latitude or longitude values'
        });
      }

      const uploads = await Upload.findByLocationRange(lat, lng, radiusKm);

      res.json({
        success: true,
        data: {
          uploads: uploads.map(upload => ({
            id: upload._id,
            description: upload.description,
            imageSource: upload.imageSource,
            locationType: upload.locationType,
            location: upload.formattedLocation,
            distance: this.calculateDistance(lat, lng, upload.location.latitude, upload.location.longitude),
            createdAt: upload.createdAt
          })),
          searchParams: {
            center: { latitude: lat, longitude: lng },
            radius: radiusKm,
            total: uploads.length
          }
        }
      });

    } catch (error) {
      console.error('Error fetching uploads by location:', error);
      next(error);
    }
  }

  // Helper method to calculate distance between two coordinates
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2); // Distance in kilometers
  }
}

export default new UploadController();