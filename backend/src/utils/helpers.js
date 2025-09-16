import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Common utility functions

// Generate random string
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate UUID v4
export const generateUUID = () => {
  return crypto.randomUUID();
};

// Hash password
export const hashPassword = async (password, rounds = 12) => {
  return await bcrypt.hash(password, rounds);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate secure OTP
export const generateOTP = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max).toString();
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate Indian phone number
export const isValidIndianPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[^\d]/g, ''));
};

// Format Indian phone number
export const formatIndianPhone = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/[^\d]/g, '');
  
  // Remove country code if present
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned.substring(2);
  }
  
  // Return cleaned 10-digit number
  return cleaned.length === 10 ? cleaned : null;
};

// Sanitize string input
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Slug generator
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Remove undefined/null properties from object
export const cleanObject = (obj) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Convert bytes to human readable format
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Get file extension
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Check if object is empty
export const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
};

// Calculate pagination
export const calculatePagination = (page, limit, totalItems) => {
  const currentPage = Math.max(1, parseInt(page) || 1);
  const itemsPerPage = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const offset = (currentPage - 1) * itemsPerPage;
  
  return {
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    offset,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

// Convert string to boolean
export const stringToBoolean = (str) => {
  if (typeof str === 'boolean') return str;
  if (typeof str === 'string') {
    return str.toLowerCase() === 'true';
  }
  return Boolean(str);
};

// Get client IP address
export const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         '0.0.0.0';
};

// Parse user agent
export const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  
  // Simple browser detection
  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';
  
  // Simple OS detection
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  
  return { browser, os, userAgent: ua };
};

// Mask sensitive data
export const maskEmail = (email) => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  const maskedUsername = username.length > 2 
    ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
    : username;
  
  return `${maskedUsername}@${domain}`;
};

export const maskPhone = (phone) => {
  if (!phone) return '';
  if (phone.length < 4) return phone;
  
  return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
};

// Time utilities
export const addMinutes = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

export const addHours = (date, hours) => {
  return new Date(date.getTime() + hours * 3600000);
};

export const addDays = (date, days) => {
  return new Date(date.getTime() + days * 86400000);
};

export const isExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

// Array utilities
export const uniqueArray = (array) => {
  return [...new Set(array)];
};

export const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Default export with all utilities
export default {
  generateRandomString,
  generateUUID,
  hashPassword,
  comparePassword,
  generateOTP,
  isValidEmail,
  isValidIndianPhone,
  formatIndianPhone,
  sanitizeString,
  generateSlug,
  deepClone,
  cleanObject,
  debounce,
  throttle,
  formatBytes,
  getFileExtension,
  isEmpty,
  calculatePagination,
  stringToBoolean,
  getClientIP,
  parseUserAgent,
  maskEmail,
  maskPhone,
  addMinutes,
  addHours,
  addDays,
  isExpired,
  uniqueArray,
  chunkArray
};