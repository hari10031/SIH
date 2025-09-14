// Indian phone number validation and formatting utilities

export interface PhoneValidationResult {
  isValid: boolean;
  formattedNumber: string;
  errorMessage?: string;
}

// Common Indian mobile number prefixes
const INDIAN_MOBILE_PREFIXES = [
  '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', // 7x series
  '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', // 8x series
  '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', // 9x series
  '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', // 6x series (newer)
];

/**
 * Validates an Indian phone number
 * @param phoneNumber - The phone number to validate
 * @returns Validation result with formatted number
 */
export const validateIndianPhoneNumber = (phoneNumber: string): PhoneValidationResult => {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  // Check if empty
  if (!cleanNumber) {
    return {
      isValid: false,
      formattedNumber: '',
      errorMessage: 'Phone number is required',
    };
  }

  // Handle different input formats
  let processedNumber = cleanNumber;

  // Remove country code if present
  if (processedNumber.startsWith('91') && processedNumber.length === 12) {
    processedNumber = processedNumber.substring(2);
  } else if (processedNumber.startsWith('+91') && processedNumber.length === 13) {
    processedNumber = processedNumber.substring(3);
  }

  // Check length (Indian mobile numbers are 10 digits)
  if (processedNumber.length !== 10) {
    return {
      isValid: false,
      formattedNumber: cleanNumber,
      errorMessage: 'Phone number must be 10 digits',
    };
  }

  // Check if it starts with valid prefix
  const prefix = processedNumber.substring(0, 2);
  if (!INDIAN_MOBILE_PREFIXES.includes(prefix)) {
    return {
      isValid: false,
      formattedNumber: processedNumber,
      errorMessage: 'Invalid Indian mobile number',
    };
  }

  // Additional checks
  // Check for repeated digits (like 0000000000)
  if (/^(\d)\1{9}$/.test(processedNumber)) {
    return {
      isValid: false,
      formattedNumber: processedNumber,
      errorMessage: 'Invalid phone number pattern',
    };
  }

  return {
    isValid: true,
    formattedNumber: processedNumber,
  };
};

/**
 * Formats Indian phone number for display
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number string
 */
export const formatIndianPhoneNumber = (phoneNumber: string): string => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (cleanNumber.length === 10) {
    return `+91 ${cleanNumber.substring(0, 5)} ${cleanNumber.substring(5)}`;
  }
  
  return phoneNumber;
};

/**
 * Formats phone number for API calls (with country code)
 * @param phoneNumber - The phone number to format
 * @returns Phone number with +91 prefix
 */
export const formatForAPI = (phoneNumber: string): string => {
  const validation = validateIndianPhoneNumber(phoneNumber);
  if (validation.isValid) {
    return `+91${validation.formattedNumber}`;
  }
  return phoneNumber;
};

/**
 * Masks phone number for display (shows only last 4 digits)
 * @param phoneNumber - The phone number to mask
 * @returns Masked phone number
 */
export const maskPhoneNumber = (phoneNumber: string): string => {
  const validation = validateIndianPhoneNumber(phoneNumber);
  if (validation.isValid) {
    const number = validation.formattedNumber;
    return `+91 ******${number.substring(6)}`;
  }
  return phoneNumber;
};

/**
 * Real-time input formatter for phone number input field
 * @param input - Current input value
 * @param previousInput - Previous input value
 * @returns Formatted input value
 */
export const formatPhoneInput = (input: string, previousInput: string = ''): string => {
  // Remove all non-digit characters
  const cleanInput = input.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limitedInput = cleanInput.substring(0, 10);
  
  // Format as user types: XXXXX XXXXX
  if (limitedInput.length <= 5) {
    return limitedInput;
  } else {
    return `${limitedInput.substring(0, 5)} ${limitedInput.substring(5)}`;
  }
};

/**
 * Generates a simple OTP (for testing purposes only)
 * In production, this should be handled by the backend
 */
export const generateTestOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Validates OTP format
 * @param otp - The OTP to validate
 * @returns Validation result
 */
export const validateOTP = (otp: string): { isValid: boolean; errorMessage?: string } => {
  const cleanOTP = otp.replace(/\D/g, '');
  
  if (!cleanOTP) {
    return { isValid: false, errorMessage: 'OTP is required' };
  }
  
  if (cleanOTP.length !== 6) {
    return { isValid: false, errorMessage: 'OTP must be 6 digits' };
  }
  
  return { isValid: true };
};