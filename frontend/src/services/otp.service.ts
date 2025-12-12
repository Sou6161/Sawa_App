/**
 * OTP Service
 * 
 * Handles OTP-related API calls
 */

import apiService from "./api";
import { API_CONFIG } from "../config/api";

export interface SendOTPData {
  mobile: string;
}

export interface VerifyOTPData {
  mobile: string;
  code: string;
}

export interface OTPResponse {
  mobile: string;
  expiresAt?: string;
  verified?: boolean;
}

class OTPService {
  /**
   * Send OTP to mobile number
   */
  async sendOTP(data: SendOTPData) {
    return apiService.post<OTPResponse>(`${API_CONFIG.API_PREFIX}/otp/send`, data);
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(data: VerifyOTPData) {
    return apiService.post<OTPResponse>(`${API_CONFIG.API_PREFIX}/otp/verify`, data);
  }

  /**
   * Resend OTP
   */
  async resendOTP(data: SendOTPData) {
    return apiService.post<OTPResponse>(`${API_CONFIG.API_PREFIX}/otp/resend`, data);
  }
}

export const otpService = new OTPService();
export default otpService;

