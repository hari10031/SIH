import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler.js';
import userService from '../services/userService.js';
import fileUploadService from '../services/fileUploadService.js';

class UserController {
  // Get all users (admin only)
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      };

      const result = await userService.getAllUsers(options);

      res.json({
        success: true,
        data: {
          users: result.users,
          pagination: {
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            totalUsers: result.totalUsers,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user by ID
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await userService.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
            bio: user.bio,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLogin: user.lastLogin
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if user exists
      const existingUser = await userService.findById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Check for email uniqueness if email is being updated
      if (updates.email && updates.email !== existingUser.email) {
        const emailExists = await userService.findByEmail(updates.email);
        if (emailExists) {
          throw new ConflictError('Email already exists');
        }
      }

      // Check for phone uniqueness if phone is being updated
      if (updates.phone && updates.phone !== existingUser.phone) {
        const phoneExists = await userService.findByPhone(updates.phone);
        if (phoneExists) {
          throw new ConflictError('Phone number already exists');
        }
      }

      // Update user
      const updatedUser = await userService.updateById(id, {
        ...updates,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
            bio: updatedUser.bio,
            isEmailVerified: updatedUser.isEmailVerified,
            isPhoneVerified: updatedUser.isPhoneVerified,
            updatedAt: updatedUser.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user avatar
  async updateAvatar(req, res, next) {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await userService.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Handle file upload
      const uploadResult = await fileUploadService.uploadImage(req, res);
      if (!uploadResult.success) {
        throw new ValidationError(uploadResult.message);
      }

      // Update user avatar
      const updatedUser = await userService.updateById(id, {
        avatar: uploadResult.data.url,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Avatar updated successfully',
        data: {
          avatar: updatedUser.avatar
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user account
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await userService.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Soft delete user
      await userService.softDelete(id);

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user statistics (admin only)
  async getUserStats(req, res, next) {
    try {
      const stats = await userService.getUserStats();

      res.json({
        success: true,
        data: {
          totalUsers: stats.totalUsers,
          activeUsers: stats.activeUsers,
          blockedUsers: stats.blockedUsers,
          verifiedUsers: stats.verifiedUsers,
          newUsersThisMonth: stats.newUsersThisMonth,
          userGrowth: stats.userGrowth,
          roleDistribution: stats.roleDistribution
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Search users (admin only)
  async searchUsers(req, res, next) {
    try {
      const { q, page = 1, limit = 10 } = req.query;

      const options = {
        query: q,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await userService.searchUsers(options);

      res.json({
        success: true,
        data: {
          users: result.users,
          pagination: {
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            totalResults: result.totalResults,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user activity log
  async getUserActivity(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Check if user exists
      const user = await userService.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const activity = await userService.getUserActivity(id, options);

      res.json({
        success: true,
        data: {
          activity: activity.logs,
          pagination: {
            currentPage: activity.currentPage,
            totalPages: activity.totalPages,
            totalLogs: activity.totalLogs,
            hasNext: activity.hasNext,
            hasPrev: activity.hasPrev
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user status (admin only)
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Check if user exists
      const user = await userService.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Update user status
      const updatedUser = await userService.updateById(id, {
        status,
        updatedAt: new Date()
      });

      // Log the status change
      await userService.logActivity(id, 'status_changed', {
        from: user.status,
        to: status,
        changedBy: req.user.id
      });

      res.json({
        success: true,
        message: `User status updated to ${status}`,
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            status: updatedUser.status,
            updatedAt: updatedUser.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();