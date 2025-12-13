/**
 * Story Viewer Component
 * 
 * Instagram-like full-screen story viewer with:
 * - Progress bars
 * - Swipe gestures
 * - Tap to pause/play
 * - Auto-advance
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from './DefaultAvatar';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story
const PROGRESS_BAR_HEIGHT = 3;

interface Story {
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
  userGender?: string | null;
}

interface StoryViewerProps {
  visible: boolean;
  story: Story | null;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onLike?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export default function StoryViewer({
  visible,
  story,
  onClose,
  onNext,
  onPrevious,
  onLike,
  onShare,
  onDelete,
}: StoryViewerProps) {
  const { user } = useAuth();
  // Check if this is the user's own story by comparing userId
  const isOwnStory = story?.userId === user?.id;
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const likeAnimationScale = useRef(new Animated.Value(0)).current;
  const likeAnimationOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const startTimeRef = useRef<number | null>(null);
  const elapsedTimeRef = useRef(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const swipeThreshold = 50;

        // Horizontal swipe (left/right)
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
          if (dx > 0 && onPrevious) {
            // Swipe right - previous story
            onPrevious();
          } else if (dx < 0 && onNext) {
            // Swipe left - next story
            onNext();
          }
        }
        // Vertical swipe down to close
        else if (dy > swipeThreshold) {
          onClose();
        }
      },
    })
  ).current;

  // Reset progress when story changes
  useEffect(() => {
    if (visible && story) {
      // Clear any existing intervals
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setProgress(0);
      elapsedTimeRef.current = 0;
      startTimeRef.current = null;
      progressAnim.setValue(0);
    }
  }, [story?.id, visible, progressAnim]);

  // Auto-advance progress
  useEffect(() => {
    if (!visible || !story) {
      // Clean up when not visible
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    if (isPaused) {
      // Pause: stop interval and save elapsed time
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (startTimeRef.current) {
        // Calculate and save elapsed time
        const elapsed = Date.now() - startTimeRef.current;
        elapsedTimeRef.current += elapsed;
        startTimeRef.current = null;
      }
      return;
    }

    // Start or resume progress
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    // Update progress every 50ms for smooth animation
    progressIntervalRef.current = setInterval(() => {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      const now = Date.now();
      const currentElapsed = now - startTimeRef.current;
      const totalElapsed = elapsedTimeRef.current + currentElapsed;
      const newProgress = Math.min((totalElapsed / STORY_DURATION) * 100, 100);

      setProgress(newProgress);
      
      // Animate progress bar
      progressAnim.setValue(newProgress);

      // Check if story is complete
      if (newProgress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        startTimeRef.current = null;
        elapsedTimeRef.current = 0;
        
        // Small delay before moving to next/close
        setTimeout(() => {
          if (onNext) {
            onNext();
          } else {
            onClose();
          }
        }, 100);
      }
    }, 50); // Update every 50ms for smooth progress

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [visible, story, isPaused, progressAnim, onNext, onClose]);

  // Helper function to get time ago
  const getTimeAgo = (timestamp: number | undefined): string => {
    if (!timestamp || isNaN(timestamp)) {
      return 'now';
    }
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 0 || isNaN(diff)) {
      return 'now';
    }
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  if (!visible || !story) {
    return null;
  }

  // Debug: Log story data to check location
  if (__DEV__) {
    console.log('StoryViewer story data:', {
      id: story.id,
      location: story.location,
      locationType: typeof story.location,
      locationName: story.location?.name,
      createdAt: story.createdAt,
    });
  }

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, width - 16], // Account for padding
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.container} {...panResponder.panHandlers}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressBarWidth,
                },
              ]}
            />
          </View>
        </View>

        {/* Story Image */}
        <TouchableWithoutFeedback
          onPressIn={() => setIsPaused(true)}
          onPressOut={() => setIsPaused(false)}
        >
          <View style={styles.imageContainer}>
            {story.imageUrl ? (
              <ExpoImage
                source={{ uri: story.imageUrl }}
                style={styles.storyImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>

        {/* Like Animation Overlay */}
        {showLikeAnimation && (
          <Animated.View
            style={[
              styles.likeAnimationContainer,
              {
                opacity: likeAnimationOpacity,
                transform: [{ scale: likeAnimationScale }],
              },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="heart" size={80} color="#FF3040" />
          </Animated.View>
        )}

        {/* Bottom Action Buttons */}
        <View style={styles.bottomActions}>
          {isOwnStory ? (
            // For own story: Show likes count (non-interactive)
            <View style={styles.likesCountContainer}>
              <View style={styles.actionButton}>
                <Ionicons name="heart" size={24} color="#FF3040" />
              </View>
              <Text style={styles.likesCountText}>
                {story?.likesCount || 0}
              </Text>
            </View>
          ) : (
            // For other users' stories: Show interactive like button
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                const newLikedState = !isLiked;
                setIsLiked(newLikedState);
                
                // Trigger like animation
                if (newLikedState) {
                  setShowLikeAnimation(true);
                  likeAnimationScale.setValue(0);
                  likeAnimationOpacity.setValue(1);
                  
                  Animated.parallel([
                    Animated.spring(likeAnimationScale, {
                      toValue: 1.2,
                      tension: 100,
                      friction: 7,
                      useNativeDriver: true,
                    }),
                    Animated.timing(likeAnimationOpacity, {
                      toValue: 0,
                      duration: 600,
                      useNativeDriver: true,
                    }),
                  ]).start(() => {
                    setShowLikeAnimation(false);
                    likeAnimationScale.setValue(0);
                    likeAnimationOpacity.setValue(0);
                  });
                }
                
                if (onLike) {
                  onLike();
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#FF3040" : "#FFFFFF"} 
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (onShare) {
                onShare();
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="paper-plane-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Header with User Info and Location */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {(story.userProfilePhoto || user?.profilePhoto) ? (
              <ExpoImage
                source={{ uri: story.userProfilePhoto || user?.profilePhoto }}
                style={styles.profileImage}
                contentFit="cover"
              />
            ) : (
              <DefaultAvatar
                gender={story.userGender || user?.gender}
                size={32}
                color="#FFFFFF"
                backgroundColor="rgba(255, 255, 255, 0.2)"
              />
            )}
            <View style={styles.userInfo}>
              <Text style={styles.username}>
                {story.userName || user?.name || user?.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={styles.timeAgo}>{getTimeAgo(story.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {story.location && story.location.name && (
              <View style={styles.locationTag}>
                <Ionicons name="location" size={14} color="#FFFFFF" />
                <Text style={styles.locationText}>{story.location.name}</Text>
              </View>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={() => setShowMenu(true)}
                style={styles.menuButton}
                activeOpacity={0.7}
              >
                <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Pause Indicator Overlay */}
        {isPaused && (
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseIconContainer}>
              <Ionicons name="pause" size={40} color="#FFFFFF" />
            </View>
          </View>
        )}

        {/* Menu Modal */}
        {showMenu && (
          <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
            <View style={styles.menuOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.menuContainer}>
                  {onDelete && (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setShowMenu(false);
                        if (onDelete) {
                          onDelete();
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                      <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                        Delete Story
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        )}

        {/* Navigation Areas */}
        <View style={styles.navigationContainer}>
          {/* Left tap area - Previous */}
          <TouchableWithoutFeedback
            onPress={() => {
              if (onPrevious) {
                onPrevious();
              }
            }}
          >
            <View style={[styles.navigationArea, styles.navigationLeft]} />
          </TouchableWithoutFeedback>

          {/* Center tap area - Hold to pause */}
          <View style={[styles.navigationArea, styles.navigationCenter]} />

          {/* Right tap area - Next */}
          <TouchableWithoutFeedback
            onPress={() => {
              if (onNext) {
                onNext();
              } else {
                onClose();
              }
            }}
          >
            <View style={[styles.navigationArea, styles.navigationRight]} />
          </TouchableWithoutFeedback>
        </View>
        
        {/* Bottom Glass Overlay - Instagram style */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.95)']}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.bottomGlassOverlay}
          pointerEvents="none"
        />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    marginTop: 0,
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  progressBarBackground: {
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  header: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: 8,
  },
  profileImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 20,
  },
  menuContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  menuItemTextDanger: {
    color: '#FF3B30',
  },
  bottomActions: {
    position: 'absolute',
    bottom: height * 0.30, // Position in middle-right area, slightly below center (35% from bottom)
    right: 16,
    flexDirection: 'column', // Stack vertically like Instagram
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  likesCountContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  likesCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  pauseIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  navigationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 5,
  },
  navigationArea: {
    flex: 1,
  },
  navigationLeft: {
    // Left third for previous
  },
  navigationCenter: {
    // Center third for pause/play
  },
  navigationRight: {
    // Right third for next
  },
  likeAnimationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  bottomGlassOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 5,
  },
});

