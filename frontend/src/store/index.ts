/**
 * Redux Store Configuration
 * 
 * Centralized state management using Redux Toolkit
 */

import { configureStore } from '@reduxjs/toolkit';
import storiesReducer from './slices/storiesSlice';

export const store = configureStore({
  reducer: {
    stories: storiesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['stories/addStory', 'stories/updateStory'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.image', 'payload.video'],
        // Ignore these paths in the state
        ignoredPaths: ['stories.items'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

