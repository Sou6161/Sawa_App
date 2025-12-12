/**
 * OTP Utilities
 * 
 * Functions for generating and managing OTP codes
 */

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Check if OTP is expired
 */
export const isOTPExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};

/**
 * OTP expiration time (10 minutes)
 */
export const getOTPExpiration = (): Date => {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + 10);
  return expiration;
};

/**
 * Validate mobile number format (basic validation)
 * Format: +[country code][number] or just numbers
 */
export const validateMobileNumber = (mobile: string): boolean => {
  // Remove spaces, dashes, and parentheses
  const cleaned = mobile.replace(/[\s\-\(\)]/g, "");
  
  // Check if it's a valid mobile number (10-15 digits, optionally starting with +)
  const mobileRegex = /^\+?[1-9]\d{9,14}$/;
  return mobileRegex.test(cleaned);
};

/**
 * Normalize mobile number (remove spaces, dashes, etc.)
 */
export const normalizeMobileNumber = (mobile: string): string => {
  return mobile.replace(/[\s\-\(\)]/g, "");
};

