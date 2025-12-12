/**
 * Authentication Context
 * 
 * Manages authentication state and provides auth methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { authService, AuthResponse } from "../services/auth.service";
import { router } from "expo-router";

interface User {
  id: string;
  email: string;
  name?: string;
  profilePhoto?: string;
  categories?: string[];
  categoriesCompleted?: boolean;
  instagramHandle?: string;
  createdAt: string;
}

interface UpdateProfileData {
  name?: string;
  profilePhoto?: string | null;
  categories?: string[];
  instagramHandle?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, mobile: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  saveCategories: (categories: string[]) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load stored token and user on app start
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check if user is authenticated by verifying stored token
   */
  const checkAuth = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);

      if (storedToken && storedUser) {
        // Verify token is still valid and get fresh user data
        try {
          const profileResponse = await authService.getProfile(storedToken);
          if (profileResponse.success && profileResponse.data) {
            // Use fresh profile data from server
            const freshUser = profileResponse.data.user;
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(freshUser));
            setToken(storedToken);
            setUser(freshUser);
          } else {
            // Fallback to verify token
            const verifyResponse = await authService.verifyToken(storedToken);
            if (verifyResponse.success) {
              setToken(storedToken);
              setUser(JSON.parse(storedUser));
            } else {
              await clearAuth();
            }
          }
        } catch (error) {
          // If getProfile fails, fallback to verifyToken
          const verifyResponse = await authService.verifyToken(storedToken);
          if (verifyResponse.success) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            await clearAuth();
          }
        }
      } else {
        await clearAuth();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear authentication data
   */
  const clearAuth = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  };

  /**
   * Sign up a new user
   */
  const signUp = async (
    email: string,
    password: string,
    mobile: string,
    name?: string
  ): Promise<void> => {
    try {
      const response = await authService.signUp({ email, password, mobile, name });

      if (response.success && response.data) {
        const { user: userData, token: authToken } = response.data;
        
        // Store token and user securely
        await SecureStore.setItemAsync(TOKEN_KEY, authToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
        
        setToken(authToken);
        setUser(userData);
        
        // Navigate to main app (categories can be selected later from profile)
        router.replace("/(tabs)");
      } else {
        throw new Error(response.error?.message || "Sign up failed");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  /**
   * Sign in an existing user
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authService.signIn({ email, password });

      if (response.success && response.data) {
        const { user: userData, token: authToken } = response.data;
        
        // Store token and user securely
        await SecureStore.setItemAsync(TOKEN_KEY, authToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
        
        setToken(authToken);
        setUser(userData);
        
        // Navigate to main app (categories can be selected later from profile)
        router.replace("/(tabs)");
      } else {
        throw new Error(response.error?.message || "Sign in failed");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  /**
   * Sign out user
   */
  const signOut = async (): Promise<void> => {
    try {
      await clearAuth();
      // Navigate to auth screen
      router.replace("/auth/signin");
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  /**
   * Save user categories
   */
  const saveCategories = async (categories: string[]): Promise<void> => {
    try {
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await authService.saveCategories(categories, token);

      if (response.success && response.data) {
        // Update user data
        const updatedUser = { ...user, ...response.data.user };
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        throw new Error(response.error?.message || "Failed to save categories");
      }
    } catch (error) {
      console.error("Save categories error:", error);
      throw error;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (data: UpdateProfileData): Promise<void> => {
    try {
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await authService.updateProfile(data, token);

      if (response.success && response.data) {
        // Update user data
        const updatedUser = { ...user, ...response.data.user };
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        throw new Error(response.error?.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    signUp,
    signIn,
    signOut,
    checkAuth,
    saveCategories,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

