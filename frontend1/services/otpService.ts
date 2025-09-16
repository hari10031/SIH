// OTP Service for handling OTP operations
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateIndianPhoneNumber, formatForAPI } from '../utils/phoneValidation';

export interface OTPResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface OTPSession {
  phoneNumber: string;
  otp: string;
  expiresAt: number;
  attempts: number;
}

const OTP_STORAGE_KEY = 'otp_session';
const MAX_ATTEMPTS = 3;
const OTP_EXPIRY_MINUTES = 5;

class OTPService {
  private baseURL = 'http://localhost:3001/api'; // Backend API base URL

  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string): Promise<OTPResponse> {
    try {
      // Validate phone number first
      const validation = validateIndianPhoneNumber(phoneNumber);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errorMessage || 'Invalid phone number',
        };
      }

      const formattedNumber = formatForAPI(validation.formattedNumber);
      // Actual API call to backend
      const response = await fetch(`${this.baseURL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedNumber,
        }),
      });
      console.log(response);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to send OTP',
        };
      }

      // For development - also store OTP locally as fallback
      const testOTP = this.generateOTP();
      await this.storeOTPSession(formattedNumber, testOTP);
      console.log(`Development OTP for ${formattedNumber}: ${testOTP}`);
      
      return {
        success: true,
        message: data.message || 'OTP sent successfully',
        data: { phoneNumber: formattedNumber },
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phoneNumber: string, otp: string): Promise<OTPResponse> {
    try {
      const validation = validateIndianPhoneNumber(phoneNumber);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errorMessage || 'Invalid phone number',
        };
      }

      const formattedNumber = formatForAPI(validation.formattedNumber);

      // First try with actual API
      try {
        const response = await fetch(`${this.baseURL}/auth/verify-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: formattedNumber,
            otp,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          await this.clearOTPSession(formattedNumber);
          return {
            success: true,
            message: data.message || 'OTP verified successfully',
            data: data.data,
          };
        } else {
          // If API fails, fall back to local verification for development
          console.log('API verification failed, trying local verification...');
        }
      } catch (apiError) {
        console.log('API call failed, trying local verification...');
      }

      // Fallback to local verification for development
      const session = await this.getOTPSession(formattedNumber);
      if (session) {
        if (Date.now() > session.expiresAt) {
          await this.clearOTPSession(formattedNumber);
          return {
            success: false,
            message: 'OTP has expired. Please request a new one.',
          };
        }

        if (session.attempts >= MAX_ATTEMPTS) {
          await this.clearOTPSession(formattedNumber);
          return {
            success: false,
            message: 'Maximum attempts exceeded. Please request a new OTP.',
          };
        }

        if (session.otp === otp) {
          await this.clearOTPSession(formattedNumber);
          return {
            success: true,
            message: 'OTP verified successfully (development mode)',
            data: { phoneNumber: formattedNumber },
          };
        } else {
          // Increment attempts
          session.attempts += 1;
          await this.storeOTPSession(formattedNumber, session.otp, session.attempts);
          return {
            success: false,
            message: `Invalid OTP. ${MAX_ATTEMPTS - session.attempts} attempts remaining.`,
          };
        }
      }

      return {
        success: false,
        message: 'No OTP session found. Please request a new OTP.',
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(phoneNumber: string): Promise<OTPResponse> {
    // Clear existing session and send new OTP
    const validation = validateIndianPhoneNumber(phoneNumber);
    if (validation.isValid) {
      const formattedNumber = formatForAPI(validation.formattedNumber);
      await this.clearOTPSession(formattedNumber);
    }
    
    return this.sendOTP(phoneNumber);
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP session locally (for development)
   */
  private async storeOTPSession(phoneNumber: string, otp: string, attempts: number = 0): Promise<void> {
    try {
      const session: OTPSession = {
        phoneNumber,
        otp,
        expiresAt: Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000),
        attempts,
      };
      
      await AsyncStorage.setItem(`${OTP_STORAGE_KEY}_${phoneNumber}`, JSON.stringify(session));
    } catch (error) {
      console.error('Error storing OTP session:', error);
    }
  }

  /**
   * Get OTP session
   */
  private async getOTPSession(phoneNumber: string): Promise<OTPSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(`${OTP_STORAGE_KEY}_${phoneNumber}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error getting OTP session:', error);
      return null;
    }
  }

  /**
   * Clear OTP session
   */
  private async clearOTPSession(phoneNumber: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${OTP_STORAGE_KEY}_${phoneNumber}`);
    } catch (error) {
      console.error('Error clearing OTP session:', error);
    }
  }

  /**
   * Check if phone number has an active OTP session
   */
  async hasActiveSession(phoneNumber: string): Promise<boolean> {
    const validation = validateIndianPhoneNumber(phoneNumber);
    if (!validation.isValid) return false;

    const formattedNumber = formatForAPI(validation.formattedNumber);
    const session = await this.getOTPSession(formattedNumber);
    
    if (session && Date.now() < session.expiresAt && session.attempts < MAX_ATTEMPTS) {
      return true;
    }
    
    if (session) {
      await this.clearOTPSession(formattedNumber);
    }
    
    return false;
  }

  /**
   * Get remaining time for OTP expiry
   */
  async getRemainingTime(phoneNumber: string): Promise<number> {
    const validation = validateIndianPhoneNumber(phoneNumber);
    if (!validation.isValid) return 0;

    const formattedNumber = formatForAPI(validation.formattedNumber);
    const session = await this.getOTPSession(formattedNumber);
    
    if (session && Date.now() < session.expiresAt) {
      return Math.max(0, session.expiresAt - Date.now());
    }
    
    return 0;
  }
}

export const otpService = new OTPService();