import express from 'express';
import Joi from 'joi';
import authController from '../controllers/authController.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { authSchemas } from '../middleware/validation.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', 
  validateBody(authSchemas.register),
  authController.register
);

router.post('/login', 
  validateBody(authSchemas.login),
  authController.login
);

// OTP-based authentication routes
router.post('/send-otp', authController.sendOTP);
// validateBody(authSchemas.sendOTP),

router.post('/signup', 
  validateBody(authSchemas.signup),
  authController.signup
);

router.post('/forgot-password', 
  validateBody(authSchemas.forgotPassword),
  authController.forgotPassword
);

router.post('/reset-password', 
  validateBody(authSchemas.resetPassword),
  authController.resetPassword
);

router.post('/verify-otp', 
  validateBody(authSchemas.verifyOTP),
  authController.verifyOTP
);

router.post('/resend-otp', 
  validateBody(authSchemas.verifyOTP),
  authController.resendOTP
);

router.post('/refresh-token', 
  validateBody(authSchemas.refreshToken),
  authController.refreshToken
);

// OAuth routes (if implementing social login)
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Protected routes (authentication required)
router.post('/logout', 
  optionalAuth,
  authController.logout
);

router.post('/change-password', 
  validateBody(authSchemas.changePassword),
  authController.changePassword
);

router.get('/me', authController.getProfile);

router.post('/verify-email/:token', 
  validateParams(Joi.object({ token: Joi.string().required() })),
  authController.verifyEmail
);

export default router;