// OTP Service for handling OTP operations
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
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
  
  /**
   * Send OTP to phone number
   */
  async sendOTP(phonenumber: string): Promise<OTPResponse> {
    const baseURL = 'http://192.168.0.156:3002';
    try {
      // Validate phone number first
      const validation = validateIndianPhoneNumber(phonenumber);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errorMessage || 'Invalid phone number',
        };
      }

      const formattedNumber = formatForAPI(validation.formattedNumber);
      console.log("formattedNumber: ",formattedNumber);
      console.log("Making request to:", `${baseURL}/auth/send-otp`);
      
      // Actual API call to backend
      const response = await fetch(`${baseURL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phonenumber: formattedNumber,
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
      
      return {
        success: true,
        message: data.message || 'OTP sent successfully',
        data: { phonenumber: formattedNumber },
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
  async verifyOTP(phoneNumber: string, otp: string, userData?: { name?: string; email?: string }): Promise<OTPResponse> {
    try {
      const validation = validateIndianPhoneNumber(phoneNumber);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errorMessage || 'Invalid phone number',
        };
      }

      const formattedNumber = formatForAPI(validation.formattedNumber);
      const baseURL = 'http://192.168.0.156:3002';
      
      const requestBody: any = {
        phonenumber: formattedNumber,
        otp,
      };
      
      // Add user data if provided (for signup)
      if (userData) {
        if (userData.name) requestBody.name = userData.name;
        if (userData.email) requestBody.email = userData.email;
      }
      
      const response = await fetch(`${baseURL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message || 'OTP verified successfully',
          data: data.data,
        };
      } else {
        return {
          success: false,
          message: data.message || 'OTP verification failed',
        };
      }
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
    try {
      const validation = validateIndianPhoneNumber(phoneNumber);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errorMessage || 'Invalid phone number',
        };
      }

      const formattedNumber = formatForAPI(validation.formattedNumber);
      const baseURL = 'http://192.168.0.156:3002';
      
      const response = await fetch(`${baseURL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phonenumber: formattedNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message || 'OTP resent successfully',
          data: data.data,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to resend OTP',
        };
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  /**
   * Add signup method to register user data before OTP verification
   */
  async signup(userData: { name: string; email?: string; phonenumber: string }): Promise<OTPResponse> {
    try {
      const validation = validateIndianPhoneNumber(userData.phonenumber);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errorMessage || 'Invalid phone number',
        };
      }

      const formattedNumber = formatForAPI(validation.formattedNumber);
      const baseURL = 'http://192.168.0.156:3002';
      
      const response = await fetch(`${baseURL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email || '',
          phonenumber: formattedNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message || 'User data registered successfully',
          data: data.data,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Signup failed',
        };
      }
    } catch (error) {
      console.error('Error during signup:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }
}

export const otpService = new OTPService();