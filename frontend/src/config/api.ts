/**
 * API Configuration for Mobile App
 * 
 * This file contains the API base URL configuration.
 * In development, use your local machine's IP address.
 * In production, use your deployed backend URL.
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

// Get the API URL from environment variables or use default
const getApiUrl = (): string => {
  // Check environment variable first
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log("🌐 Using API URL from env:", process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Development mode
  if (__DEV__) {
    // Always use local IP for mobile devices (both physical and emulator)
    // This ensures consistency across all testing scenarios
    const apiUrl = "http://192.168.1.2:3001";
    console.log("🌐 Development API URL:", apiUrl);
    console.log("📱 Platform:", Platform.OS);
    console.log("📱 Is Device:", Constants.isDevice);
    return apiUrl;
  }
  
  // Production API URL - update this with your deployed backend
  return "https://api.sawaapp.com";
};

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  API_PREFIX: "/api",
  TIMEOUT: 30000, // 30 seconds
} as const;

export const API_ENDPOINTS = {
  HEALTH: `${API_CONFIG.BASE_URL}/health`,
  API_HEALTH: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/health`,
} as const;

