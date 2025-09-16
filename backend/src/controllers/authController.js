import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateToken, generateRefreshToken, verifyToken } from '../middleware/auth.js';
import { 
  ValidationError, 
  UnauthorizedError, 
  NotFoundError, 
  ConflictError 
} from '../middleware/errorHandler.js';
import config from '../config/config.js';
import emailService from '../services/emailService.js';
import otpService from '../services/otpService.js';
import userService from '../services/userService.js';

class AuthController {
  // Send OTP for phone verification
  async sendOTP(req, res, next) {
    try {
      const { phoneNumber } = req.body;
      console.log(phoneNumber);

      // Check if user already exists (optional check)
      const existingUser = await userService.findByPhone(phoneNumber);
      if (existingUser) {
        // If user exists, allow OTP for login
        await otpService.sendOTP(phoneNumber);
        return res.json({
          success: true,
          message: 'OTP sent successfully for login',
          data: { phoneNumber }
        });
      }

      // Send OTP for new user registration
      await otpService.sendOTP(phoneNumber);

      res.json({
        success: true,
        message: 'OTP sent successfully',
        data: { phoneNumber }
      });
    } catch (error) {
      next(error);
    }
  }

  // Signup with phone number (OTP-based registration)
  async signup(req, res, next) {
    try {
      const { name, email, phoneNumber } = req.body;

      // Check if user already exists
      const existingUser = await userService.findByPhone(phoneNumber);
      if (existingUser) {
        throw new ConflictError('User already exists with this phone number');
      }

      if (email) {
        const existingEmail = await userService.findByEmail(email);
        if (existingEmail) {
          throw new ConflictError('User already exists with this email');
        }
      }

      // Create user without password (OTP-based auth)
      const userData = {
        name,
        email: email || null,
        phoneNumber,
        role: 'user',
        isEmailVerified: false,
        isPhoneVerified: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const user = await userService.create(userData);

      // Generate tokens
      const tokenPayload = {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        permissions: user.permissions || []
      };

      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Save refresh token
      await userService.updateRefreshToken(user.id, refreshToken);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: true, // Assuming OTP verification was successful
            createdAt: user.createdAt
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Register new user
  async register(req, res, next) {
    try {
      const { name, email, password, phone, role = 'user' } = req.body;

      // Check if user already exists
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('User already exists with this email');
      }

      // Check if phone number already exists
      const existingPhone = await userService.findByPhone(phone);
      if (existingPhone) {
        throw new ConflictError('User already exists with this phone number');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

      // Create user
      const userData = {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        isEmailVerified: false,
        isPhoneVerified: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const user = await userService.create(userData);

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      await userService.updateEmailVerificationToken(user.id, emailVerificationToken);

      // Send verification email
      await emailService.sendVerificationEmail(email, emailVerificationToken);

      // Send OTP for phone verification
      await otpService.sendOTP(phone);

      // Generate tokens
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      };

      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Save refresh token
      await userService.updateRefreshToken(user.id, refreshToken);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your email and phone number.',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            createdAt: user.createdAt
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await userService.findByEmailWithPassword(email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new UnauthorizedError('Account is blocked or suspended');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Update last login
      await userService.updateLastLogin(user.id);

      // Generate tokens
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      };

      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Save refresh token
      await userService.updateRefreshToken(user.id, refreshToken);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            lastLogin: new Date()
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile
  async getProfile(req, res, next) {
    try {
      const user = await userService.findById(req.user.id);
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
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout user
  async logout(req, res, next) {
    try {
      if (req.user) {
        // Clear refresh token
        await userService.updateRefreshToken(req.user.id, null);
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh access token
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = verifyToken(refreshToken);
      
      // Find user and check if refresh token matches
      const user = await userService.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Generate new tokens
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      };

      const newAccessToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      // Update refresh token
      await userService.updateRefreshToken(user.id, newRefreshToken);

      res.json({
        success: true,
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify OTP
  async verifyOTP(req, res, next) {
    try {
      const { phoneNumber, otp } = req.body;

      const isValid = await otpService.verifyOTP(phoneNumber, otp);
      if (!isValid) {
        throw new ValidationError('Invalid or expired OTP');
      }

      // Find user by phone number
      const user = await userService.findByPhone(phoneNumber);
      if (!user) {
        throw new NotFoundError('User not found with this phone number');
      }

      // Update phone verification status
      await userService.updatePhoneVerification(user.id, true);
      
      // Update last login
      await userService.updateLastLogin(user.id);

      // Generate tokens for login
      const tokenPayload = {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        permissions: user.permissions || []
      };

      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Save refresh token
      await userService.updateRefreshToken(user.id, refreshToken);

      res.json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: true,
            lastLogin: new Date()
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Resend OTP
  async resendOTP(req, res, next) {
    try {
      const { phoneNumber } = req.body;

      await otpService.sendOTP(phoneNumber);

      res.json({
        success: true,
        message: 'OTP sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Forgot password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await userService.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: 'If the email exists, a reset link has been sent'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      await userService.updatePasswordResetToken(user.id, resetToken, resetTokenExpiry);

      // Send reset email
      await emailService.sendPasswordResetEmail(email, resetToken);

      res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset password
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      const user = await userService.findByPasswordResetToken(token);
      if (!user || user.passwordResetExpiry < new Date()) {
        throw new ValidationError('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

      // Update password and clear reset token
      await userService.updatePassword(user.id, hashedPassword);
      await userService.clearPasswordResetToken(user.id);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await userService.findByIdWithPassword(req.user.id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

      // Update password
      await userService.updatePassword(user.id, hashedNewPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify email
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;

      const user = await userService.findByEmailVerificationToken(token);
      if (!user) {
        throw new ValidationError('Invalid verification token');
      }

      // Update email verification status
      await userService.updateEmailVerification(user.id, true);
      await userService.clearEmailVerificationToken(user.id);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Google OAuth (placeholder - implement based on your OAuth strategy)
  async googleAuth(req, res, next) {
    try {
      // Redirect to Google OAuth
      res.redirect(`/auth/google`);
    } catch (error) {
      next(error);
    }
  }

  // Google OAuth callback (placeholder)
  async googleCallback(req, res, next) {
    try {
      // Handle Google OAuth callback
      res.json({
        success: true,
        message: 'Google OAuth not implemented yet'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();