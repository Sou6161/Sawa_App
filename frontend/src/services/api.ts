/**
 * API Service for Mobile App
 * 
 * Centralized API client for making HTTP requests to the backend.
 * Uses React Native's fetch API with proper error handling.
 */

import { API_CONFIG, API_ENDPOINTS } from "../config/api";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Make an HTTP request with timeout and error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Debug logging in development
    if (__DEV__) {
      console.log("🔗 Making request to:", url);
      console.log("📤 Method:", options.method || "GET");
      if (options.body) {
        console.log("📦 Body:", options.body);
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (__DEV__) {
        console.log("📥 Response status:", response.status);
        console.log("📥 Response ok:", response.ok);
      }

      clearTimeout(timeoutId);

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
        if (__DEV__) {
          console.log("📥 Response data:", JSON.stringify(data, null, 2));
        }
      } catch (parseError) {
        console.error("❌ Failed to parse response:", parseError);
        return {
          success: false,
          error: {
            message: "Invalid response from server",
            code: "PARSE_ERROR",
          },
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: {
            message: data.error?.message || data.message || "Request failed",
            code: data.error?.code || response.status.toString(),
          },
        };
      }

      // Backend returns { success: true, data: {...} } format
      if (data.success !== undefined) {
        return data;
      }

      // Fallback for other response formats
      return {
        success: true,
        data,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          error: {
            message: "Request timeout. Please check your connection.",
            code: "TIMEOUT",
          },
        };
      }

      // Better error messages for network issues
      let errorMessage = "Network request failed";
      if (error instanceof Error) {
        if (error.message.includes("Network request failed")) {
          errorMessage = "Cannot connect to server. Please check:\n1. Backend is running\n2. Correct IP address\n3. Same Wi-Fi network";
        } else if (error.message.includes("Failed to fetch")) {
          errorMessage = "Server connection failed. Check if backend is running on port 3001";
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: {
          message: errorMessage,
          code: "NETWORK_ERROR",
        },
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "GET",
      ...options,
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      ...options,
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse> {
    return this.get("/health");
  }

  /**
   * API health check
   */
  async apiHealthCheck(): Promise<ApiResponse> {
    return this.get(`${API_CONFIG.API_PREFIX}/health`);
  }
}

export const apiService = new ApiService();
export default apiService;

