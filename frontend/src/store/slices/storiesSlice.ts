/**
 * Stories Slice
 * 
 * Manages user stories state using API (database-backed)
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import * as storyService from '../../services/story.service';

export interface Story {
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
  userName?: string;
  userProfilePhoto?: string;
}

interface StoriesState {
  items: Story[];
  userStory: Story | null;
  nearbyStories: Story[]; // Stories from nearby users
  followingStories: Story[]; // Stories from users that the current user follows
  isLoading: boolean;
  isLoadingNearby: boolean;
  isLoadingFollowing: boolean;
  error: string | null;
}

const initialState: StoriesState = {
  items: [],
  userStory: null,
  nearbyStories: [],
  followingStories: [],
  isLoading: false,
  isLoadingNearby: false,
  isLoadingFollowing: false,
  error: null,
};

const TOKEN_KEY = 'auth_token';

/**
 * Get authentication token from SecureStore
 */
const getToken = async (): Promise<string> => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) {
    throw new Error('User not authenticated');
  }
  return token;
};

/**
 * Convert image URI to base64 data URL for upload (fallback method)
 * Note: This should rarely be used since ImagePicker provides base64 directly
 * In production, you'd upload to cloud storage (S3, Cloudinary) and get URL
 */
const convertImageToDataURL = async (imageUri: string): Promise<string> => {
  try {
    // For React Native, we need to use a different approach
    // Since FileReader is not available, we'll use fetch and convert manually
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Convert blob to base64 using a React Native compatible method
    return new Promise((resolve, reject) => {
      // Use XMLHttpRequest for React Native compatibility
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        const reader = new FileReader();
        reader.onloadend = function() {
          const base64data = reader.result as string;
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      };
      xhr.onerror = reject;
      xhr.open('GET', imageUri);
      xhr.responseType = 'blob';
      xhr.send();
    });
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    throw new Error('Failed to convert image to base64. Please try selecting the image again.');
  }
};

/**
 * Async thunk to upload a story
 */
export const uploadStory = createAsyncThunk(
  'stories/uploadStory',
  async (
    data: { imageUri: string; location?: { name: string; address?: string }; imageBase64?: string | null },
    { rejectWithValue }
  ) => {
    try {
      const { imageUri, location, imageBase64 } = data;
      const token = await getToken();
      
      // Use base64 from ImagePicker (should always be provided)
      // TODO: In production, upload to cloud storage (S3, Cloudinary) first and get URL
      if (!imageBase64) {
        throw new Error('Image base64 data is required. Please try selecting the image again.');
      }
      
      const imageUrl = imageBase64;
      
      // Upload story to backend
      const story = await storyService.uploadStory(
        {
          imageUrl,
          location: location?.name,
          locationAddress: location?.address,
        },
        token
      );

      // Convert backend story format to frontend format
      return {
        id: story.id,
        userId: story.userId,
        imageUrl: story.imageUrl,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        location: story.location,
        likesCount: story.likesCount,
        viewsCount: story.viewsCount,
        userName: story.userName,
        userProfilePhoto: story.userProfilePhoto,
        userGender: story.userGender,
      };
    } catch (error: any) {
      console.error('Upload story error:', error);
      const errorMessage = error?.message || error?.error?.message || 'Failed to upload story';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Async thunk to load user stories
 */
export const loadUserStories = createAsyncThunk(
  'stories/loadUserStories',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getToken();
      const story = await storyService.getUserStories(token);
      
      if (__DEV__) {
        console.log('loadUserStories - API response:', {
          story: story ? {
            id: story.id,
            expiresAt: story.expiresAt,
            expiresAtDate: new Date(story.expiresAt).toISOString(),
            isExpired: story.expiresAt < Date.now(),
            location: story.location,
          } : null,
        });
      }
      
      if (!story) {
        return null;
      }

      // Check if story is expired (client-side check as backup)
      const now = Date.now();
      if (story.expiresAt < now) {
        if (__DEV__) {
          console.log('Story expired, not loading:', {
            storyId: story.id,
            expiresAt: new Date(story.expiresAt).toISOString(),
            now: new Date(now).toISOString(),
          });
        }
        return null;
      }

      // Convert backend story format to frontend format
      return {
        id: story.id,
        userId: story.userId,
        imageUrl: story.imageUrl,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        location: story.location,
        likesCount: story.likesCount,
        viewsCount: story.viewsCount,
        userName: story.userName,
        userProfilePhoto: story.userProfilePhoto,
        userGender: story.userGender,
      };
    } catch (error: any) {
      console.error('loadUserStories error:', error);
      return rejectWithValue(error.message || 'Failed to load stories');
    }
  }
);

/**
 * Async thunk to like/unlike a story
 */
export const likeStory = createAsyncThunk(
  'stories/likeStory',
  async (storyId: string, { rejectWithValue }) => {
    try {
      const token = await getToken();
      const response = await storyService.likeStory(storyId, token);
      return { storyId, liked: response.liked };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to like story');
    }
  }
);

/**
 * Async thunk to mark story as viewed
 */
export const viewStory = createAsyncThunk(
  'stories/viewStory',
  async (storyId: string, { rejectWithValue }) => {
    try {
      const token = await getToken();
      await storyService.viewStory(storyId, token);
      return storyId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to view story');
    }
  }
);

/**
 * Async thunk to delete a story
 */
export const deleteStory = createAsyncThunk(
  'stories/deleteStory',
  async (storyId: string, { rejectWithValue }) => {
    try {
      const token = await getToken();
      await storyService.deleteStory(storyId, token);
      return storyId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete story');
    }
  }
);

/**
 * Async thunk to cleanup expired stories (called by backend automatically)
 */
export const cleanupExpiredStories = createAsyncThunk(
  'stories/cleanupExpiredStories',
  async (_, { rejectWithValue }) => {
    try {
      // Backend handles cleanup automatically, but we can reload stories
      // This is mainly for UI refresh
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cleanup stories');
    }
  }
);

/**
 * Async thunk to update user location
 */
export const updateUserLocation = createAsyncThunk(
  'stories/updateUserLocation',
  async (
    data: { latitude: number; longitude: number },
    { rejectWithValue }
  ) => {
    try {
      const token = await getToken();
      await storyService.updateUserLocation(data.latitude, data.longitude, token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update location');
    }
  }
);

/**
 * Async thunk to load stories from users that the current user follows
 */
export const loadFollowingStories = createAsyncThunk(
  'stories/loadFollowingStories',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getToken();
      const stories = await followService.getFollowingStories(token);
      
      if (__DEV__) {
        console.log('loadFollowingStories - API response:', {
          count: stories.length,
          stories: stories.map(s => ({
            id: s.id,
            userName: s.userName,
          })),
        });
      }
      
      // Filter out expired stories (client-side check)
      const now = Date.now();
      const activeStories = stories.filter(story => story.expiresAt > now);
      
      return activeStories.map(story => ({
        id: story.id,
        userId: story.userId,
        imageUrl: story.imageUrl,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        location: story.location,
        likesCount: story.likesCount,
        viewsCount: story.viewsCount,
        userName: story.userName,
        userProfilePhoto: story.userProfilePhoto,
        userGender: story.userGender,
      }));
    } catch (error: any) {
      console.error('loadFollowingStories error:', error);
      return rejectWithValue(error.message || 'Failed to load following stories');
    }
  }
);

/**
 * Async thunk to load nearby stories
 */
export const loadNearbyStories = createAsyncThunk(
  'stories/loadNearbyStories',
  async (
    data: { latitude: number; longitude: number; radius?: number },
    { rejectWithValue }
  ) => {
    try {
      const token = await getToken();
      const stories = await storyService.getNearbyStories(
        data.latitude,
        data.longitude,
        data.radius || 10,
        token
      );
      
      console.log('📥 loadNearbyStories - Raw API response:', {
        rawResponse: stories,
        count: stories.length,
        latitude: data.latitude,
        longitude: data.longitude,
        radius: data.radius,
      });
      
      if (__DEV__) {
        console.log('loadNearbyStories - Processed stories:', {
          count: stories.length,
          stories: stories.map(s => ({
            id: s.id,
            userId: s.userId,
            userName: s.userName,
            distance: (s as any).distance,
            expiresAt: s.expiresAt,
            createdAt: s.createdAt,
          })),
        });
      }
      
      // Filter out expired stories (client-side check)
      const now = Date.now();
      const activeStories = stories.filter(story => story.expiresAt > now);
      
      return activeStories.map(story => ({
        id: story.id,
        userId: story.userId,
        imageUrl: story.imageUrl,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        location: story.location,
        likesCount: story.likesCount,
        viewsCount: story.viewsCount,
        userName: story.userName,
        userProfilePhoto: story.userProfilePhoto,
        userGender: story.userGender,
        distance: (story as any).distance, // Include distance for sorting
      }));
    } catch (error: any) {
      console.error('❌ loadNearbyStories error:', {
        message: error.message,
        error: error,
        stack: error.stack,
      });
      return rejectWithValue(error.message || 'Failed to load nearby stories');
    }
  }
);

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    markStoryAsViewed: (state, action: PayloadAction<string>) => {
      const story = state.items.find((s) => s.id === action.payload);
      if (story) {
        // View count is managed by backend
      }
      if (state.userStory && state.userStory.id === action.payload) {
        // View count is managed by backend
      }
    },
  },
  extraReducers: (builder) => {
    // Upload story
    builder
      .addCase(uploadStory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadStory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userStory = action.payload;
        state.items = [action.payload, ...state.items];
        if (__DEV__) {
          console.log('✅ Story uploaded and saved to Redux:', {
            storyId: action.payload.id,
            expiresAt: new Date(action.payload.expiresAt).toISOString(),
            location: action.payload.location,
          });
        }
      })
      .addCase(uploadStory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load user stories
    builder
      .addCase(loadUserStories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserStories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userStory = action.payload;
        if (__DEV__) {
          console.log('✅ Stories loaded into Redux state:', {
            hasStory: !!action.payload,
            storyId: action.payload?.id,
            expiresAt: action.payload?.expiresAt,
            expiresAtDate: action.payload?.expiresAt ? new Date(action.payload.expiresAt).toISOString() : null,
            isExpired: action.payload?.expiresAt ? action.payload.expiresAt < Date.now() : false,
          });
        }
      })
      .addCase(loadUserStories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        if (__DEV__) {
          console.error('❌ Failed to load stories:', action.payload);
        }
      });

    // Like story
    builder
      .addCase(likeStory.fulfilled, (state, action) => {
        const { storyId, liked } = action.payload;
        if (state.userStory && state.userStory.id === storyId) {
          state.userStory.likesCount += liked ? 1 : -1;
        }
        const story = state.items.find((s) => s.id === storyId);
        if (story) {
          story.likesCount += liked ? 1 : -1;
        }
      });

    // View story
    builder
      .addCase(viewStory.fulfilled, (state, action) => {
        const storyId = action.payload;
        if (state.userStory && state.userStory.id === storyId) {
          state.userStory.viewsCount += 1;
        }
        const story = state.items.find((s) => s.id === storyId);
        if (story) {
          story.viewsCount += 1;
        }
      });

    // Delete story
    builder
      .addCase(deleteStory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteStory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter((s) => s.id !== action.payload);
        if (state.userStory && state.userStory.id === action.payload) {
          state.userStory = null;
        }
      })
      .addCase(deleteStory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cleanup expired stories
    builder
      .addCase(cleanupExpiredStories.fulfilled, (state) => {
        // Stories cleaned up by backend
      });

    // Update user location
    builder
      .addCase(updateUserLocation.fulfilled, (state) => {
        // Location updated
      })
      .addCase(updateUserLocation.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Load nearby stories
    builder
      .addCase(loadNearbyStories.pending, (state) => {
        state.isLoadingNearby = true;
        state.error = null;
      })
      .addCase(loadNearbyStories.fulfilled, (state, action) => {
        state.isLoadingNearby = false;
        state.nearbyStories = action.payload;
        console.log('✅ Nearby stories loaded into Redux state:', {
          count: action.payload.length,
          stories: action.payload.map(s => ({
            id: s.id,
            userId: s.userId,
            userName: s.userName,
            distance: (s as any).distance,
          })),
        });
      })
      .addCase(loadNearbyStories.rejected, (state, action) => {
        state.isLoadingNearby = false;
        state.error = action.payload as string;
        if (__DEV__) {
          console.error('❌ Failed to load nearby stories:', action.payload);
        }
      });

    // Load following stories
    builder
      .addCase(loadFollowingStories.pending, (state) => {
        state.isLoadingFollowing = true;
        state.error = null;
      })
      .addCase(loadFollowingStories.fulfilled, (state, action) => {
        state.isLoadingFollowing = false;
        state.followingStories = action.payload;
        if (__DEV__) {
          console.log('✅ Following stories loaded into Redux:', {
            count: action.payload.length,
          });
        }
      })
      .addCase(loadFollowingStories.rejected, (state, action) => {
        state.isLoadingFollowing = false;
        state.error = action.payload as string;
        if (__DEV__) {
          console.error('❌ Failed to load following stories:', action.payload);
        }
      });
  },
});

export const { clearError, markStoryAsViewed } = storiesSlice.actions;
export default storiesSlice.reducer;

