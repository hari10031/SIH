import Joi from 'joi';
import { ValidationError } from './errorHandler.js';

// Common validation schemas
export const commonSchemas = {
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  }),
  
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
    'string.pattern.base': 'Please provide a valid Indian mobile number',
    'any.required': 'Phone number is required'
  }),
  
  name: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'string.pattern.base': 'Name can only contain letters and spaces',
    'any.required': 'Name is required'
  }),
  
  mongoId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid ID format',
    'any.required': 'ID is required'
  }),
  
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be exactly 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
    'any.required': 'OTP is required'
  })
};

// Pagination schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Auth validation schemas
export const authSchemas = {
  register: Joi.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    phone: commonSchemas.phone,
    role: Joi.string().valid('user', 'admin').default('user')
  }),
  
  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),
  
  // OTP-based authentication schemas
  sendOTP: Joi.object({
    phoneNumber: Joi.string().pattern(/^[+]?[0-9]{10,15}$/).required().messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required'
    })
  }),
  
  signup: Joi.object({
    name: commonSchemas.name,
    email: Joi.string().email().optional(),
    phoneNumber: Joi.string().pattern(/^[+]?[0-9]{10,15}$/).required().messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required'
    })
  }),
  
  forgotPassword: Joi.object({
    email: commonSchemas.email
  }),
  
  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required'
    }),
    password: commonSchemas.password
  }),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: commonSchemas.password
  }),
  
  verifyOTP: Joi.object({
    phoneNumber: Joi.string().pattern(/^[+]?[0-9]{10,15}$/).required().messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required'
    }),
    otp: commonSchemas.otp
  }),
  
  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required'
    })
  })
};

// User validation schemas
export const userSchemas = {
  updateProfile: Joi.object({
    name: commonSchemas.name.optional(),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone.optional(),
    avatar: Joi.string().uri().optional(),
    bio: Joi.string().max(500).optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),
  
  getUserById: Joi.object({
    id: commonSchemas.mongoId
  })
};

// Generic validation middleware
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return next(new ValidationError('Validation failed', errors));
    }

    // Replace the original data with validated and sanitized data
    req[source] = value;
    next();
  };
};

// Validate request parameters
export const validateParams = (schema) => validate(schema, 'params');

// Validate query parameters
export const validateQuery = (schema) => validate(schema, 'query');

// Validate request body
export const validateBody = (schema) => validate(schema, 'body');

// Sanitize input middleware
export const sanitizeInput = (req, res, next) => {
  // Remove any potentially dangerous characters
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

export default validate;