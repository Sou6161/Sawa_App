/**
 * Authentication Service
 * 
 * Handles authentication API calls
 */

import apiService from "./api";
import { API_CONFIG } from "../config/api";

export interface SignUpData {
  email: string;
  password: string;
  mobile: string;
  name?: string;
  gender?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    mobile?: string;
    name?: string;
    profilePhoto?: string;
    gender?: string;
    categories?: string[];
    categoriesCompleted?: boolean;
    instagramHandle?: string;
    createdAt: string;
  };
  token: string;
}

export interface UpdateProfileData {
  name?: string;
  profilePhoto?: string | null;
  categories?: string[];
  instagramHandle?: string | null;
}

class AuthService {
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData) {
    return apiService.post<AuthResponse>(`${API_CONFIG.API_PREFIX}/auth/signup`, data);
  }

  /**
   * Sign in an existing user
   */
  async signIn(data: SignInData) {
    return apiService.post<AuthResponse>(`${API_CONFIG.API_PREFIX}/auth/signin`, data);
  }

  /**
   * Get user profile (requires authentication)
   */
  async getProfile(token: string) {
    return apiService.get(`${API_CONFIG.API_PREFIX}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Verify token
   */
  async verifyToken(token: string) {
    return apiService.get(`${API_CONFIG.API_PREFIX}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Save user categories
   */
  async saveCategories(categories: string[], token: string) {
    return apiService.post(
      `${API_CONFIG.API_PREFIX}/auth/categories`,
      { categories },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData, token: string) {
    return apiService.put(
      `${API_CONFIG.API_PREFIX}/auth/profile`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  /**
   * Search users by query string
   */
  async searchUsers(query: string, token: string, limit: number = 20) {
    return apiService.get<{ success: boolean; data: any[] }>(
      `${API_CONFIG.API_PREFIX}/auth/search?query=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  /**
   * Get user profile by userId (public profile view)
   */
  async getUserProfile(userId: string, token: string) {
    return apiService.get<{ success: boolean; data: { user: any } }>(
      `${API_CONFIG.API_PREFIX}/auth/profile/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }
}

export const authService = new AuthService();
export default authService;

