import crypto from 'crypto';

// Mock OTP service - Replace with actual SMS service (Twilio, AWS SNS, etc.)
class OTPService {
  constructor() {
    // In-memory storage for demo purposes
    this.otpStore = new Map();
    this.maxAttempts = 3;
    this.otpExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Generate 6-digit OTP
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Send OTP to phone number
  async sendOTP(phone) {
    try {
      // Clear any existing OTP for this phone
      this.otpStore.delete(phone);

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.otpExpiry);

      // Store OTP data
      this.otpStore.set(phone, {
        otp,
        expiresAt,
        attempts: 0,
        createdAt: new Date()
      });

      // Mock SMS sending - Replace with actual SMS service
      console.log(`📱 SMS OTP for ${phone}: ${otp} (expires in 5 minutes)`);
      
      // In production, integrate with SMS service:
      // await smsService.send(phone, `Your SIH verification code is: ${otp}. Valid for 5 minutes.`);

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 300 // 5 minutes in seconds
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  // Verify OTP
  async verifyOTP(phone, inputOTP) {
    try {
      const otpData = this.otpStore.get(phone);

      if (!otpData) {
        return {
          success: false,
          message: 'No OTP found for this phone number. Please request a new OTP.'
        };
      }

      // Check if OTP is expired
      if (new Date() > otpData.expiresAt) {
        this.otpStore.delete(phone);
        return {
          success: false,
          message: 'OTP has expired. Please request a new OTP.'
        };
      }

      // Check attempts
      if (otpData.attempts >= this.maxAttempts) {
        this.otpStore.delete(phone);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.'
        };
      }

      // Increment attempts
      otpData.attempts++;

      // Verify OTP
      if (otpData.otp === inputOTP) {
        // OTP is correct, remove from store
        this.otpStore.delete(phone);
        return {
          success: true,
          message: 'OTP verified successfully'
        };
      } else {
        // Wrong OTP
        const remainingAttempts = this.maxAttempts - otpData.attempts;
        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
        };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new Error('Failed to verify OTP. Please try again.');
    }
  }

  // Resend OTP (same as sendOTP but with additional checks)
  async resendOTP(phone) {
    try {
      const otpData = this.otpStore.get(phone);

      // Check if we can resend (prevent too frequent requests)
      if (otpData && otpData.createdAt) {
        const timeSinceLastOTP = Date.now() - otpData.createdAt.getTime();
        const minResendInterval = 60 * 1000; // 1 minute

        if (timeSinceLastOTP < minResendInterval) {
          const waitTime = Math.ceil((minResendInterval - timeSinceLastOTP) / 1000);
          return {
            success: false,
            message: `Please wait ${waitTime} seconds before requesting a new OTP.`
          };
        }
      }

      // Send new OTP
      return await this.sendOTP(phone);
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw new Error('Failed to resend OTP. Please try again.');
    }
  }

  // Clean up expired OTPs (should be called periodically)
  cleanupExpiredOTPs() {
    const now = new Date();
    for (const [phone, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStore.delete(phone);
      }
    }
  }

  // Get OTP status for phone number (for debugging/admin purposes)
  getOTPStatus(phone) {
    const otpData = this.otpStore.get(phone);
    if (!otpData) {
      return { exists: false };
    }

    return {
      exists: true,
      expiresAt: otpData.expiresAt,
      attempts: otpData.attempts,
      maxAttempts: this.maxAttempts,
      isExpired: new Date() > otpData.expiresAt
    };
  }
}

export default new OTPService();