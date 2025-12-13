/**
 * Story Service
 * 
 * Handles API calls for story operations
 */

import apiService from "./api";
import { API_CONFIG } from "../config/api";

export interface Story {
  id: string;
  userId: string;
  imageUrl: string;
  location?: {
    name: string;
    address?: string;
  };
  likesCount: number;
  viewsCount: number;
  expiresAt: number;
  createdAt: number;
  userName?: string;
  userProfilePhoto?: string;
}

export interface UploadStoryData {
  imageUrl: string;
  location?: string;
  locationAddress?: string;
}

export interface StoryResponse {
  success: boolean;
  data: Story | null;
  message?: string;
}

export interface LikeResponse {
  success: boolean;
  message: string;
  liked: boolean;
}

const STORY_ENDPOINT = `${API_CONFIG.API_PREFIX}/stories`;

/**
 * Upload a story
 */
export const uploadStory = async (data: UploadStoryData, token: string): Promise<Story> => {
  try {
    const response = await apiService.post<StoryResponse>(
      STORY_ENDPOINT,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    if (!response.success) {
      const errorMessage = response.error?.message || "Failed to upload story";
      console.error('Upload story API error:', response.error);
      throw new Error(errorMessage);
    }
    
    // apiService returns: { success: true, data: { success: true, data: Story } }
    // Backend returns: { success: true, data: Story }
    // So response.data is the backend response: { success: true, data: Story }
    const backendResponse = response.data as any;
    
    // Extract the story from the backend response
    let storyData: Story;
    
    if (backendResponse?.success && backendResponse?.data) {
      // Backend response structure: { success: true, data: Story }
      storyData = backendResponse.data as Story;
    } else if (backendResponse?.id) {
      // Fallback: response.data is directly the story
      storyData = backendResponse as Story;
    } else {
      console.error('Invalid response format:', response);
      throw new Error("Invalid response format from server");
    }
    
    // Debug log to verify location
    if (__DEV__) {
      console.log('Story service - extracted story:', {
        id: storyData.id,
        location: storyData.location,
        locationType: typeof storyData.location,
        locationName: storyData.location?.name,
      });
    }
    
    return storyData;
  } catch (error: any) {
    console.error('Story service upload error:', error);
    throw error;
  }
};

/**
 * Get user's active stories
 */
export const getUserStories = async (token: string): Promise<Story | null> => {
  const response = await apiService.get<StoryResponse>(STORY_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (__DEV__) {
    console.log('getUserStories - API response:', {
      success: response.success,
      hasData: !!response.data,
      dataType: typeof response.data,
      data: response.data,
    });
  }
  
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to get stories");
  }
  
  // apiService returns: { success: true, data: <backend_response> }
  // Backend returns: { success: true, data: Story | null }
  // So response.data is the backend response: { success: true, data: Story | null }
  // Following the same pattern as authService.getProfile
  const backendResponse = response.data as any;
  
  if (__DEV__) {
    console.log('getUserStories - Full response:', JSON.stringify(response, null, 2));
    console.log('getUserStories - backendResponse:', {
      success: backendResponse?.success,
      hasData: backendResponse?.data !== undefined,
      dataType: typeof backendResponse?.data,
      data: backendResponse?.data,
    });
  }
  
  // Backend returns: { success: true, data: Story | null }
  // Following authService pattern: response.data.data is the actual data
  let story: Story | null = null;
  
  if (backendResponse?.success && backendResponse?.data !== undefined) {
    // response.data is { success: true, data: Story | null }
    story = backendResponse.data as Story | null;
  } else if (response.data && typeof response.data === 'object') {
    // Try to extract story directly if structure is different
    if ('id' in response.data && 'imageUrl' in response.data) {
      story = response.data as Story;
    } else if (response.data.data && typeof response.data.data === 'object' && 'id' in response.data.data) {
      story = response.data.data as Story;
    }
  }
  
  if (story) {
    
    // Debug log to verify location
    if (__DEV__) {
      console.log('✅ Get stories - extracted story:', {
        id: story.id,
        location: story.location,
        locationName: story.location?.name,
        expiresAt: story.expiresAt,
        expiresAtDate: new Date(story.expiresAt).toISOString(),
        isExpired: story.expiresAt < Date.now(),
        timeUntilExpiry: story.expiresAt - Date.now(),
      });
    }
    
    return story;
  }
  
  if (__DEV__) {
    console.log('⚠️ getUserStories - No story found or invalid response structure');
    console.log('Response structure:', {
      responseSuccess: response.success,
      responseDataType: typeof response.data,
      responseData: response.data,
      backendResponseSuccess: backendResponse?.success,
      backendResponseData: backendResponse?.data,
    });
  }
  
  return null;
};

/**
 * Like or unlike a story
 */
export const likeStory = async (storyId: string, token: string): Promise<LikeResponse> => {
  const response = await apiService.post<LikeResponse>(
    `${STORY_ENDPOINT}/${storyId}/like`,
    undefined,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to like story");
  }
  return response.data as LikeResponse;
};

/**
 * Mark story as viewed
 */
export const viewStory = async (storyId: string, token: string): Promise<void> => {
  const response = await apiService.post(
    `${STORY_ENDPOINT}/${storyId}/view`,
    undefined,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to view story");
  }
};

/**
 * Delete a story
 */
export const deleteStory = async (storyId: string, token: string): Promise<void> => {
  const response = await apiService.delete<{ success: boolean; message: string }>(
    `${STORY_ENDPOINT}/${storyId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to delete story");
  }
};

/**
 * Update user location
 */
export const updateUserLocation = async (
  latitude: number,
  longitude: number,
  token: string
): Promise<void> => {
  const response = await apiService.post<{ success: boolean; message: string }>(
    `${STORY_ENDPOINT}/location`,
    { latitude, longitude },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to update location");
  }
};

/**
 * Get nearby stories
 */
export const getNearbyStories = async (
  latitude: number,
  longitude: number,
  radius: number = 10,
  token: string
): Promise<Story[]> => {
  const url = `${STORY_ENDPOINT}/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
  console.log('🌐 Requesting nearby stories from:', url);
  
  const response = await apiService.get<{ success: boolean; data: Story[] }>(
    url,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  console.log('📡 Nearby stories API response:', {
    success: response.success,
    hasData: !!response.data,
    dataType: typeof response.data,
    data: response.data,
    dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'N/A',
  });
  
  if (!response.success) {
    console.error('❌ API request failed:', response.error);
    throw new Error(response.error?.message || "Failed to get nearby stories");
  }
  
  // The apiService.get() already parses the response and returns { success, data, error }
  // So response.data should be the actual data from the backend
  // The backend returns: { success: true, data: [...] }
  // So response.data should be: { success: true, data: [...] }
  
  let stories: Story[] = [];
  
  if (response.data && typeof response.data === 'object') {
    // Check if response.data is the backend response structure
    if ('success' in response.data && 'data' in response.data) {
      // Backend response: { success: true, data: [...] }
      const backendResponse = response.data as { success: boolean; data: any };
      if (backendResponse.success && Array.isArray(backendResponse.data)) {
        stories = backendResponse.data as Story[];
        console.log('✅ Parsed stories from nested response:', stories.length);
      } else {
        console.log('⚠️ Backend response has success but data is not an array:', backendResponse);
      }
    } else if (Array.isArray(response.data)) {
      // Direct array response
      stories = response.data as Story[];
      console.log('✅ Parsed stories from direct array:', stories.length);
    } else {
      console.log('⚠️ Unexpected response.data structure:', response.data);
    }
  } else {
    console.log('⚠️ response.data is not an object:', typeof response.data);
  }
  
  console.log('🔍 Final parsed stories:', {
    count: stories.length,
    stories: stories.map(s => ({
      id: s.id,
      userId: s.userId,
      userName: s.userName,
      distance: (s as any).distance,
    })),
  });
  
  return stories;
};

/**
 * Get current user's location (for debugging)
 */
export const getMyLocation = async (token: string): Promise<any> => {
  const response = await apiService.get<{ success: boolean; data: any }>(
    `${STORY_ENDPOINT}/my-location`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to get location");
  }
  return response.data;
};

