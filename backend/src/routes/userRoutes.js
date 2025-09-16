import express from 'express';
import Joi from 'joi';
import userController from '../controllers/userController.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import { userSchemas } from '../middleware/validation.js';
import { requireRole, requireOwnership } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', 
  requireRole('admin'),
  validateQuery(Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })),
  userController.getAllUsers
);

// Get user profile by ID
router.get('/:id', 
  validateParams(userSchemas.getUserById),
  requireOwnership('id'),
  userController.getUserById
);

// Update user profile
router.put('/:id', 
  validateParams(userSchemas.getUserById),
  validateBody(userSchemas.updateProfile),
  requireOwnership('id'),
  userController.updateUser
);

// Update user avatar
router.patch('/:id/avatar', 
  validateParams(userSchemas.getUserById),
  requireOwnership('id'),
  userController.updateAvatar
);

// Delete user account
router.delete('/:id', 
  validateParams(userSchemas.getUserById),
  requireOwnership('id'),
  userController.deleteUser
);

// Get user statistics (admin only)
router.get('/stats/overview', 
  requireRole('admin'),
  userController.getUserStats
);

// Search users (admin only)
router.get('/search/query', 
  requireRole('admin'),
  validateQuery(Joi.object({
    q: Joi.string().min(2).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })),
  userController.searchUsers
);

// Get user activity log
router.get('/:id/activity', 
  validateParams(userSchemas.getUserById),
  requireOwnership('id'),
  validateQuery(Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })),
  userController.getUserActivity
);

// Block/Unblock user (admin only)
router.patch('/:id/status', 
  requireRole('admin'),
  validateParams(userSchemas.getUserById),
  validateBody(Joi.object({
    status: Joi.string().valid('active', 'blocked', 'suspended').required()
  })),
  userController.updateUserStatus
);

export default router;