/**
 * Follow Service
 * 
 * Handles API calls related to follow/unfollow functionality
 */

import { apiService } from "./api";
import { API_CONFIG } from "../config/api";

const FOLLOW_ENDPOINT = `${API_CONFIG.API_PREFIX}/follow`;

export interface FollowResponse {
  success: boolean;
  message: string;
}

export interface FollowStatusResponse {
  success: boolean;
  data: {
    isFollowing: boolean;
  };
}

export interface FollowingStoriesResponse {
  success: boolean;
  data: Array<{
    id: string;
    userId: string;
    imageUrl: string;
    createdAt: number;
    expiresAt: number;
    location?: {
      name: string;
      address?: string;
    };
    likesCount: number;
    viewsCount: number;
    userName: string;
    userProfilePhoto?: string;
  }>;
}

export interface CountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

/**
 * Follow a user
 */
export const followUser = async (
  followingId: string,
  token: string
): Promise<void> => {
  const response = await apiService.post<FollowResponse>(
    FOLLOW_ENDPOINT,
    { followingId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to follow user");
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (
  followingId: string,
  token: string
): Promise<void> => {
  const response = await apiService.post<FollowResponse>(
    `${FOLLOW_ENDPOINT}/unfollow`,
    { followingId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to unfollow user");
  }
};

/**
 * Check if current user follows a specific user
 */
export const checkFollowStatus = async (
  userId: string,
  token: string
): Promise<boolean> => {
  const response = await apiService.get<FollowStatusResponse>(
    `${FOLLOW_ENDPOINT}/check/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to check follow status");
  }
  
  const backendResponse = response.data as any;
  if (backendResponse?.success && backendResponse?.data) {
    return backendResponse.data.isFollowing;
  }
  
  return false;
};

/**
 * Get stories from users that the current user follows
 */
export const getFollowingStories = async (
  token: string
): Promise<FollowingStoriesResponse["data"]> => {
  const response = await apiService.get<FollowingStoriesResponse>(
    `${FOLLOW_ENDPOINT}/stories`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to get following stories");
  }
  
  const backendResponse = response.data as any;
  if (backendResponse?.success && Array.isArray(backendResponse?.data)) {
    return backendResponse.data;
  }
  
  return [];
};

/**
 * Get followers count for a user
 */
export const getFollowersCount = async (
  userId: string,
  token: string
): Promise<number> => {
  const response = await apiService.get<CountResponse>(
    `${FOLLOW_ENDPOINT}/followers/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to get followers count");
  }
  
  const backendResponse = response.data as any;
  if (backendResponse?.success && backendResponse?.data) {
    return backendResponse.data.count;
  }
  
  return 0;
};

/**
 * Get following count for a user
 */
export const getFollowingCount = async (
  userId: string,
  token: string
): Promise<number> => {
  const response = await apiService.get<CountResponse>(
    `${FOLLOW_ENDPOINT}/following/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to get following count");
  }
  
  const backendResponse = response.data as any;
  if (backendResponse?.success && backendResponse?.data) {
    return backendResponse.data.count;
  }
  
  return 0;
};

// Default export object for convenience
const followService = {
  followUser,
  unfollowUser,
  checkFollowStatus,
  getFollowingStories,
  getFollowersCount,
  getFollowingCount,
};

export default followService;

