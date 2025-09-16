import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock file upload service - Replace with cloud storage (AWS S3, Cloudinary, etc.)
class FileUploadService {
  constructor() {
    // Create uploads directory if it doesn't exist
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.ensureUploadDir();
    
    // Configure multer for file uploads
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = file.fieldname + '-' + uniqueSuffix + ext;
        cb(null, name);
      }
    });

    // File filter for images
    this.imageFilter = (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
      }
    };

    // File filter for documents
    this.documentFilter = (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
      }
    };

    // Configure multer instances
    this.imageUpload = multer({
      storage: this.storage,
      fileFilter: this.imageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
      }
    });

    this.documentUpload = multer({
      storage: this.storage,
      fileFilter: this.documentFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
      }
    });

    this.multipleUpload = multer({
      storage: this.storage,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5 // Maximum 5 files
      }
    });
  }

  // Ensure upload directory exists
  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // Upload single image
  async uploadImage(req, res) {
    return new Promise((resolve, reject) => {
      this.imageUpload.single('image')(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              resolve({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
              });
            } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
              resolve({
                success: false,
                message: 'Unexpected field name. Use "image" as field name.'
              });
            } else {
              resolve({
                success: false,
                message: err.message
              });
            }
          } else {
            resolve({
              success: false,
              message: err.message
            });
          }
        } else if (!req.file) {
          resolve({
            success: false,
            message: 'No file uploaded'
          });
        } else {
          const fileUrl = `/uploads/${req.file.filename}`;
          resolve({
            success: true,
            data: {
              filename: req.file.filename,
              originalName: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
              url: fileUrl,
              path: req.file.path
            }
          });
        }
      });
    });
  }

  // Upload single document
  async uploadDocument(req, res) {
    return new Promise((resolve, reject) => {
      this.documentUpload.single('document')(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              resolve({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
              });
            } else {
              resolve({
                success: false,
                message: err.message
              });
            }
          } else {
            resolve({
              success: false,
              message: err.message
            });
          }
        } else if (!req.file) {
          resolve({
            success: false,
            message: 'No file uploaded'
          });
        } else {
          const fileUrl = `/uploads/${req.file.filename}`;
          resolve({
            success: true,
            data: {
              filename: req.file.filename,
              originalName: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
              url: fileUrl,
              path: req.file.path
            }
          });
        }
      });
    });
  }

  // Upload multiple files
  async uploadMultiple(req, res, fieldName = 'files') {
    return new Promise((resolve, reject) => {
      this.multipleUpload.array(fieldName)(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              resolve({
                success: false,
                message: 'One or more files too large. Maximum size is 5MB per file.'
              });
            } else if (err.code === 'LIMIT_FILE_COUNT') {
              resolve({
                success: false,
                message: 'Too many files. Maximum is 5 files.'
              });
            } else {
              resolve({
                success: false,
                message: err.message
              });
            }
          } else {
            resolve({
              success: false,
              message: err.message
            });
          }
        } else if (!req.files || req.files.length === 0) {
          resolve({
            success: false,
            message: 'No files uploaded'
          });
        } else {
          const files = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            url: `/uploads/${file.filename}`,
            path: file.path
          }));

          resolve({
            success: true,
            data: {
              files,
              count: files.length
            }
          });
        }
      });
    });
  }

  // Delete file
  async deleteFile(filename) {
    try {
      const filePath = path.join(this.uploadDir, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return {
          success: true,
          message: 'File deleted successfully'
        };
      } else {
        return {
          success: false,
          message: 'File not found'
        };
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        message: 'Failed to delete file'
      };
    }
  }

  // Get file info
  getFileInfo(filename) {
    try {
      const filePath = path.join(this.uploadDir, filename);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return {
          success: true,
          data: {
            filename,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            url: `/uploads/${filename}`,
            path: filePath
          }
        };
      } else {
        return {
          success: false,
          message: 'File not found'
        };
      }
    } catch (error) {
      console.error('Error getting file info:', error);
      return {
        success: false,
        message: 'Failed to get file info'
      };
    }
  }

  // Clean up old files (should be called periodically)
  cleanupOldFiles(maxAgeInDays = 30) {
    try {
      const files = fs.readdirSync(this.uploadDir);
      const now = Date.now();
      const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000; // Convert to milliseconds
      
      let deletedCount = 0;
      
      files.forEach(filename => {
        const filePath = path.join(this.uploadDir, filename);
        const stats = fs.statSync(filePath);
        
        if (now - stats.birthtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });
      
      console.log(`Cleaned up ${deletedCount} old files`);
      return {
        success: true,
        deletedCount
      };
    } catch (error) {
      console.error('Error cleaning up files:', error);
      return {
        success: false,
        message: 'Failed to cleanup files'
      };
    }
  }
}

export default new FileUploadService();