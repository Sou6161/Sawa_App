import React, { useState, useRef, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Share,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Image as ExpoImage } from "expo-image";
import { useAppDispatch, useAppSelector } from "../../src/store/hooks";
import { uploadStory, loadUserStories, cleanupExpiredStories, deleteStory, likeStory, viewStory, loadNearbyStories, updateUserLocation } from "../../src/store/slices/storiesSlice";
import StoryViewer from "../../src/components/StoryViewer";
import StoryUploadLoader from "../../src/components/StoryUploadLoader";
import * as SecureStore from "expo-secure-store";
import * as storyService from "../../src/services/story.service";
import DefaultAvatar from "../../src/components/DefaultAvatar";

const { width } = Dimensions.get("window");
const CAROUSEL_AUTO_SCROLL_INTERVAL = 4000; // 4 seconds

// Mock carousel data for ads/banners/promotions
const carouselItems = [
  {
    id: 1,
    title: "WELCOME TO SAWA",
    subtitle: "Discover amazing places around you",
    phoneVisible: true,
  },
  {
    id: 2,
    title: "EXCLUSIVE OFFERS",
    subtitle: "Get 50% off on your first order",
    phoneVisible: false,
  },
  {
    id: 3,
    title: "NEW RESTAURANTS",
    subtitle: "Check out the latest additions",
    phoneVisible: false,
  },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { userStory, nearbyStories, isLoading: storiesLoading, isLoadingNearby } = useAppSelector((state) => state.stories);
  
  // Debug: Log nearby stories state changes
  useEffect(() => {
    console.log('📊 Nearby stories state updated:', {
      count: nearbyStories.length,
      isLoading: isLoadingNearby,
      stories: nearbyStories.map(s => ({
        id: s.id,
        userId: s.userId,
        userName: s.userName,
        distance: (s as any).distance,
      })),
    });
  }, [nearbyStories, isLoadingNearby]);
  const [activeTab, setActiveTab] = useState<"Nearby" | "Following">("Nearby");
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [greeting, setGreeting] = useState("Good afternoon,");
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const carouselScrollViewRef = useRef<ScrollView>(null);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrollingRef = useRef(false);
  const locationRequestedRef = useRef(false); // Track if location has been requested to prevent infinite loops

  // Request location permission and get user location for nearby stories
  const requestLocationAndLoadNearby = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (locationRequestedRef.current) {
      return;
    }
    
    locationRequestedRef.current = true;
    
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === "granted") {
        setLocationPermissionGranted(true);
        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = location.coords;
        
        const newLocation = { latitude, longitude };
        setUserLocation(newLocation);
        
        if (__DEV__) {
          console.log('📍 Got user location:', { latitude, longitude });
        }
        
        // Update user location in backend
        try {
          const result = await dispatch(updateUserLocation(newLocation)).unwrap();
          console.log('✅ User location updated in backend:', {
            latitude: result.latitude,
            longitude: result.longitude,
          });
        } catch (error: any) {
          console.error("❌ Failed to update user location:", {
            error: error.message || error,
            latitude,
            longitude,
          });
        }
        
        // Verify location was saved by checking it from backend
        try {
          const token = await SecureStore.getItemAsync('authToken');
          if (token) {
            const myLocation = await storyService.getMyLocation(token);
            console.log('📍 Verified location in database:', {
              latitude: myLocation.latitude,
              longitude: myLocation.longitude,
              locationUpdatedAt: myLocation.locationUpdatedAt,
              hasActiveStories: myLocation.hasActiveStories,
            });
          }
        } catch (error) {
          console.error('Failed to verify location:', error);
        }
        
        // Load nearby stories with a larger radius for emulator/testing
        // Using 1000km for testing to account for different emulator locations
        // In production, you might want to use 10km
        const searchRadius = __DEV__ ? 1000 : 10;
        if (__DEV__) {
          console.log('🔍 Loading nearby stories with radius:', searchRadius, 'km');
        }
        dispatch(loadNearbyStories({ latitude, longitude, radius: searchRadius }));
      } else {
        setLocationPermissionGranted(false);
        Alert.alert(
          "Location Permission",
          "Location permission is required to see nearby stories. You can enable it in your device settings.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setLocationPermissionGranted(false);
    } finally {
      // Reset after a delay to allow retry if needed
      setTimeout(() => {
        locationRequestedRef.current = false;
      }, 1000);
    }
  }, [dispatch]);

  // Get greeting based on current time in user's location timezone
  const updateGreeting = useCallback(async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === "granted") {
        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = location.coords;

        // Get timezone from coordinates using reverse geocoding
        // For more accurate timezone, you could use a timezone API service
        // For now, we'll estimate timezone from longitude
        const timezoneOffset = Math.round(longitude / 15);
        const now = new Date();
        const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
        const localTime = new Date(utcTime + timezoneOffset * 3600000);
        const hour = localTime.getHours();

        // Update greeting based on local time in user's location
        // Morning: 5:00 AM - 11:59 AM
        // Afternoon: 12:00 PM - 4:59 PM
        // Evening: 5:00 PM - 8:59 PM
        // Night: 9:00 PM - 4:59 AM
        if (hour >= 5 && hour < 12) {
          setGreeting("Good morning,");
        } else if (hour >= 12 && hour < 17) {
          setGreeting("Good afternoon,");
        } else if (hour >= 17 && hour < 21) {
          setGreeting("Good evening,");
        } else {
          setGreeting("Good night,");
        }
      } else {
        // Fallback to device timezone if permission denied
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
          setGreeting("Good morning,");
        } else if (hour >= 12 && hour < 17) {
          setGreeting("Good afternoon,");
        } else if (hour >= 17 && hour < 21) {
          setGreeting("Good evening,");
        } else {
          setGreeting("Good night,");
        }
      }
    } catch (error) {
      console.error("Error getting location for greeting:", error);
      // Fallback to device timezone on error
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting("Good morning,");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good afternoon,");
      } else if (hour >= 17 && hour < 21) {
        setGreeting("Good evening,");
      } else {
        setGreeting("Good night,");
      }
    }
  }, []);

  // Update greeting on mount and periodically
  useEffect(() => {
    updateGreeting();
    
    // Update greeting every hour
    const greetingInterval = setInterval(() => {
      updateGreeting();
    }, 3600000); // 1 hour

    return () => {
      if (greetingInterval) {
        clearInterval(greetingInterval);
      }
    };
  }, [updateGreeting]);

  // Auto-scroll carousel
  const startAutoScroll = useCallback(() => {
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
    }

    autoScrollTimerRef.current = setInterval(() => {
      if (!isUserScrollingRef.current && carouselScrollViewRef.current) {
        setCurrentCarouselIndex((prev) => {
          const nextIndex = (prev + 1) % carouselItems.length;
          carouselScrollViewRef.current?.scrollTo({
            x: nextIndex * width,
            animated: true,
          });
          return nextIndex;
        });
      }
    }, CAROUSEL_AUTO_SCROLL_INTERVAL);
  }, []);

  // Handle scroll events
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    
    if (index !== currentCarouselIndex) {
      setCurrentCarouselIndex(index);
    }
  }, [currentCarouselIndex]);

  const handleScrollBeginDrag = useCallback(() => {
    isUserScrollingRef.current = true;
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
    }
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    isUserScrollingRef.current = false;
    startAutoScroll();
  }, [startAutoScroll]);

  // Initialize auto-scroll
  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [startAutoScroll]);

  // Store location in ref to avoid dependency issues
  const userLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const locationPermissionGrantedRef = useRef(false);
  
  // Update refs when state changes
  useEffect(() => {
    userLocationRef.current = userLocation;
    locationPermissionGrantedRef.current = locationPermissionGranted;
  }, [userLocation, locationPermissionGranted]);

  // Load user stories on mount and when screen comes into focus (like Instagram)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        // Load stories from database when screen is focused (persists across app restarts)
        console.log('🔄 Loading stories on screen focus...');
        dispatch(loadUserStories());
        
        // Reload nearby stories if location is already available (using ref to avoid dependency issues)
        const currentLocation = userLocationRef.current;
        const hasPermission = locationPermissionGrantedRef.current;
        if (currentLocation && hasPermission) {
          const searchRadius = __DEV__ ? 1000 : 10;
          dispatch(loadNearbyStories({ ...currentLocation, radius: searchRadius }));
        }
      }
    }, [user, dispatch])
  );

  // Initial load and cleanup expired stories on mount
  useEffect(() => {
    if (user && !locationRequestedRef.current) {
      console.log('🔄 Loading stories on mount...');
      // Load stories immediately when user is available
      dispatch(loadUserStories()).then((result) => {
        if (__DEV__) {
          console.log('📖 Stories loaded result:', result);
        }
      });
      // Cleanup expired stories on mount
      dispatch(cleanupExpiredStories());
      
      // Request location and load nearby stories (only once on mount)
      requestLocationAndLoadNearby();
      
      // Set up interval to cleanup expired stories every hour
      const cleanupInterval = setInterval(() => {
        dispatch(cleanupExpiredStories());
        // Reload stories after cleanup to update UI
        dispatch(loadUserStories());
      }, 60 * 60 * 1000); // Every hour

      return () => {
        clearInterval(cleanupInterval);
      };
    }
  }, [user, dispatch, requestLocationAndLoadNearby]);

  // Handle story upload
  const handleAddStory = async () => {
    try {
      // Request camera roll permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos to upload stories."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16], // Instagram story aspect ratio
        quality: 0.8,
        base64: true, // Get base64 for upload
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Store both URI and base64
        (global as any).pendingStoryImageUri = asset.uri;
        (global as any).pendingStoryImageBase64 = asset.base64 
          ? `data:image/jpeg;base64,${asset.base64}` 
          : null;
        setLocationInput("");
        setShowLocationInput(true);
      }
    } catch (error: any) {
      setIsUploadingStory(false);
      setUploadProgress(0);
      Alert.alert("Error", error.message || "Failed to upload story");
    }
  };

  // Handle location input confirmation
  const handleLocationConfirm = async () => {
    const imageUri = (global as any).pendingStoryImageUri;
    const imageBase64 = (global as any).pendingStoryImageBase64;
    if (!imageUri) return;

    const location = locationInput.trim()
      ? { name: locationInput.trim() }
      : undefined;

    setShowLocationInput(false);
    setLocationInput("");
    (global as any).pendingStoryImageUri = null;
    (global as any).pendingStoryImageBase64 = null;

    // Start upload with location
    setIsUploadingStory(true);
    setUploadProgress(0);
    await uploadStoryWithProgress(imageUri, location, imageBase64);
  };

  // Handle location input cancellation
  const handleLocationCancel = async () => {
    const imageUri = (global as any).pendingStoryImageUri;
    const imageBase64 = (global as any).pendingStoryImageBase64;
    if (!imageUri) {
      setShowLocationInput(false);
      setLocationInput("");
      return;
    }

    // Upload story without location
    setShowLocationInput(false);
    setLocationInput("");
    (global as any).pendingStoryImageUri = null;
    (global as any).pendingStoryImageBase64 = null;

    // Start upload without location
    setIsUploadingStory(true);
    setUploadProgress(0);
    await uploadStoryWithProgress(imageUri, undefined, imageBase64);
  };

  // Helper function to upload story with progress
  const uploadStoryWithProgress = async (
    imageUri: string,
    location?: { name: string; address?: string },
    imageBase64?: string | null
  ) => {
    // Simulate upload progress (in production, this would come from actual upload)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Upload story via Redux (pass base64 if available)
      await dispatch(uploadStory({ imageUri, location, imageBase64 })).unwrap();
      setUploadProgress(100);
      
      // After uploading story, update location and reload nearby stories
      // This ensures that when you upload a story, your location is current
      const currentLocation = userLocationRef.current;
      const hasPermission = locationPermissionGrantedRef.current;
      if (hasPermission && currentLocation) {
        // Update location to ensure it's current
        try {
          await dispatch(updateUserLocation(currentLocation)).unwrap();
          // Reload nearby stories to include your new story for others
          const searchRadius = __DEV__ ? 1000 : 10;
          dispatch(loadNearbyStories({ ...currentLocation, radius: searchRadius }));
        } catch (error) {
          console.error("Failed to update location after story upload:", error);
        }
      } else if (hasPermission) {
        // Try to get location again if permission is granted but location not set
        requestLocationAndLoadNearby();
      }

      // Small delay to show 100% completion
      setTimeout(() => {
        setIsUploadingStory(false);
        setUploadProgress(0);
        Alert.alert("Success", "Your story has been uploaded!");
      }, 500);
    } catch (error: any) {
      clearInterval(progressInterval);
      setIsUploadingStory(false);
      setUploadProgress(0);
      Alert.alert("Error", error.message || "Failed to upload story");
    }
  };

  // Handle viewing story
  const handleViewStory = async (story?: any) => {
    const storyToView = story || userStory;
    if (storyToView) {
      setShowStoryViewer(true);
      // Mark story as viewed (only if it's not your own story)
      // Your own stories don't need to be marked as viewed
      const isOwnStory = storyToView.userId === user?.id;
      if (!isOwnStory) {
        try {
          await dispatch(viewStory(storyToView.id)).unwrap();
        } catch (error: any) {
          // Silently fail - don't show error for view tracking
          if (__DEV__) {
            console.log("Note: Could not mark story as viewed:", error?.message || error);
          }
        }
      }
    }
  };

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reload user stories
      await dispatch(loadUserStories()).unwrap();
      
      // Reload nearby stories if location is available
      const currentLocation = userLocationRef.current;
      const hasPermission = locationPermissionGrantedRef.current;
      if (currentLocation && hasPermission) {
        // Get fresh location to ensure it's current (in case emulator location changed)
        try {
          const freshLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const newLocation = {
            latitude: freshLocation.coords.latitude,
            longitude: freshLocation.coords.longitude,
          };
          console.log('🔄 Refreshing location during pull-to-refresh:', newLocation);
          await dispatch(updateUserLocation(newLocation)).unwrap();
          setUserLocation(newLocation);
          userLocationRef.current = newLocation;
          const searchRadius = __DEV__ ? 1000 : 10;
          await dispatch(loadNearbyStories({ ...newLocation, radius: searchRadius })).unwrap();
        } catch (error: any) {
          console.error("❌ Failed to update location during refresh:", error);
          // Fallback to using cached location
          const searchRadius = __DEV__ ? 1000 : 10;
          await dispatch(loadNearbyStories({ ...currentLocation, radius: searchRadius })).unwrap();
        }
      } else if (hasPermission) {
        // If permission is granted but location is not set, try to get it again
        // Temporarily allow location request during refresh
        locationRequestedRef.current = false;
        await requestLocationAndLoadNearby();
      }
    } catch (error) {
      console.error("Error refreshing stories:", error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, requestLocationAndLoadNearby]);

  // Handle closing story viewer
  const handleCloseStoryViewer = () => {
    setShowStoryViewer(false);
  };

  // Handle deleting story
  const handleDeleteStory = async () => {
    const storyToDelete = userStory;
    if (!storyToDelete) return;

    Alert.alert(
      "Delete Story",
      "Are you sure you want to delete this story?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(deleteStory(storyToDelete.id)).unwrap();
              setShowStoryViewer(false);
              Alert.alert("Success", "Story deleted successfully!");
              // Reload stories to update the UI
              dispatch(loadUserStories());
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete story");
            }
          },
        },
      ]
    );
  };

  // Mock data for trending spots
  const trendingSpots = [
    { id: 1, name: "Marouf Cafe", image: "cafe", tags: ["Cafe"] },
    { id: 2, name: "Lulu's Garden", image: "coffee", tags: ["Restaurant", "Cafe"] },
    { id: 3, name: "Ray's Fried Chicken", image: "chicken", tags: ["Restaurant"] },
    { id: 4, name: "Marouf Cafe", image: "cafe2", tags: ["Cafe"] },
  ];

  // Mock data for events
  const events = [
    { id: 1, title: "MOMENTS", date: "28 SEP", days: "3 days out", fullDate: "11th Oct 2025", image: "event1" },
    { id: 2, title: "AN 30", image: "event2" },
    { id: 3, title: "AMR DIAB", image: "event3" },
  ];

  // Mock data for exclusive offers
  const exclusiveOffers = [
    { id: 1, discount: "10% OFF", image: "chicken", name: "Fried Chicken" },
    { id: 2, discount: "25% OFF", image: "kebab", name: "Kebab Platter", arabic: "استكانه" },
    { id: 3, discount: "5% OFF", image: "pizza", name: "Pizza Napolia", arabic: "بيتزا نابوليا", price: "10 دنانير فقط !", phone: "91913553" },
    { id: 4, discount: "20% OFF", image: "burger", name: "Economy Meal", arabic: "اقتصاد", price: "دينار فقط", phone: "9191355" },
  ];

  // Mock data for map avatars (Where is Everyone)
  const mapAvatars = [
    { id: 1, x: 30, y: 25, avatar: "person1" },
    { id: 2, x: 60, y: 40, avatar: "person2" },
    { id: 3, x: 45, y: 60, avatar: "person3" },
    { id: 4, x: 75, y: 30, avatar: "person4" },
    { id: 5, x: 20, y: 70, avatar: "person5" },
    { id: 6, x: 80, y: 65, avatar: "person6" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#522EE8"
            colors={["#522EE8"]}
          />
        }
      >
        {/* Carousel Header Section */}
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={carouselScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            scrollEventThrottle={16}
            style={styles.carousel}
          >
            {carouselItems.map((item) => (
              <LinearGradient
                key={item.id}
                colors={["#4527C3", "#522EE8", "#381F9E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { width }]}
              >
                <View style={styles.headerContent}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.welcomeText}>{item.title}</Text>
                    <Text style={styles.welcomeSubtext}>{item.subtitle}</Text>
                    <View style={styles.dots}>
                      {carouselItems.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.dot,
                            index === currentCarouselIndex && styles.dotActive,
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                  {item.phoneVisible && (
                    <View style={styles.phoneMockup}>
                      <View style={styles.phoneScreen}>
                        <View style={styles.phoneHeader}>
                          <Text style={styles.phoneTime}>5:14</Text>
                        </View>
                        <View style={styles.phoneIcons}>
                          <View style={styles.phoneIcon}>
                            <View style={styles.sawaIcon}>
                              <Text style={styles.sawaIconText}>S</Text>
                            </View>
                            <View style={styles.notificationBadge}>
                              <Text style={styles.badgeText}>2</Text>
                            </View>
                          </View>
                          <View style={styles.phoneIcon}>
                            <Ionicons name="images" size={20} color="#FFFFFF" />
                          </View>
                          <View style={styles.phoneIcon}>
                            <Ionicons name="document-text" size={20} color="#FFFFFF" />
                          </View>
                          <View style={styles.phoneIcon}>
                            <Ionicons name="mail" size={20} color="#FFFFFF" />
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </LinearGradient>
            ))}
          </ScrollView>
        </View>

        {/* Main Content */}
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
          {/* User Greeting Section */}
          <View style={styles.greetingSection}>
            <View style={styles.greetingLeft}>
              <Text style={styles.greetingText}>{greeting}</Text>
              <Text style={styles.userName}>{user?.name || user?.email || "User"}</Text>
            </View>
            <View style={styles.greetingRight}>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.pointsBadge}>
                <Ionicons name="star" size={16} color="#FFFFFF" />
                <Text style={styles.pointsText}>1,200</Text>
              </View>
            </View>
          </View>

          {/* Nearby/Following Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "Nearby" && styles.tabActive]}
              onPress={() => setActiveTab("Nearby")}
            >
              <Text style={[styles.tabText, activeTab === "Nearby" && styles.tabTextActive]}>
                Nearby
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "Following" && styles.tabActive]}
              onPress={() => setActiveTab("Following")}
            >
              <Text style={[styles.tabText, activeTab === "Following" && styles.tabTextActive]}>
                Following
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stories Section - Only show in Nearby tab */}
          {activeTab === "Nearby" && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.storiesContainer}
              contentContainerStyle={styles.storiesContent}
            >
              {/* Your Story */}
              <TouchableOpacity
                style={styles.storyCard}
                onPress={userStory ? handleViewStory : handleAddStory}
                disabled={isUploadingStory || storiesLoading}
                activeOpacity={0.7}
              >
                <View style={styles.yourStoryCard}>
                  <View style={styles.yourStoryAvatar}>
                    {user?.profilePhoto ? (
                      <ExpoImage
                        source={{ uri: user.profilePhoto }}
                        style={styles.profileImage}
                        contentFit="cover"
                      />
                    ) : (
                      <DefaultAvatar
                        gender={user?.gender}
                        size={60}
                        color="#522EE8"
                        backgroundColor="#F0F0F0"
                      />
                    )}
                    {userStory ? (
                      <View style={styles.storyRing}>
                        <View style={styles.storyRingInner} />
                      </View>
                    ) : (
                      <View style={styles.addStoryIcon}>
                        {isUploadingStory ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Ionicons name="add" size={16} color="#FFFFFF" />
                        )}
                      </View>
                    )}
                  </View>
                  <Text style={styles.yourStoryText}>
                    {userStory ? "Your Story" : "Add Story"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Nearby Users' Stories */}
              {isLoadingNearby ? (
                <View style={styles.storyCard}>
                  <View style={styles.yourStoryCard}>
                    <View style={styles.yourStoryAvatar}>
                      <ActivityIndicator size="small" color="#522EE8" />
                    </View>
                    <Text style={styles.yourStoryText}>Loading...</Text>
                  </View>
                </View>
              ) : nearbyStories.length > 0 ? (
                nearbyStories.map((story) => (
                  <TouchableOpacity
                    key={story.id}
                    style={styles.storyCard}
                    onPress={() => handleViewStory(story)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.yourStoryCard}>
                      <View style={styles.yourStoryAvatar}>
                        {story.userProfilePhoto ? (
                          <ExpoImage
                            source={{ uri: story.userProfilePhoto }}
                            style={styles.profileImage}
                            contentFit="cover"
                          />
                        ) : (
                          <DefaultAvatar
                            gender={(story as any).userGender}
                            size={60}
                            color="#522EE8"
                            backgroundColor="#F0F0F0"
                          />
                        )}
                        <View style={styles.storyRing}>
                          <View style={styles.storyRingInner} />
                        </View>
                      </View>
                      <Text style={styles.yourStoryText} numberOfLines={1}>
                        {story.userName || "User"}
                      </Text>
                      {(story as any).distance && (
                        <Text style={styles.storyDistance}>
                          {(story as any).distance} km
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              ) : locationPermissionGranted ? (
                <View style={styles.storyCard}>
                  <View style={styles.yourStoryCard}>
                    <View style={styles.yourStoryAvatar}>
                      <Ionicons name="location-outline" size={30} color="#A3A3A3" />
                    </View>
                    <Text style={[styles.yourStoryText, { color: "#A3A3A3" }]}>
                      No nearby stories
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.storyCard}
                  onPress={requestLocationAndLoadNearby}
                  activeOpacity={0.7}
                >
                  <View style={styles.yourStoryCard}>
                    <View style={styles.yourStoryAvatar}>
                      <Ionicons name="location-outline" size={30} color="#522EE8" />
                    </View>
                    <Text style={styles.yourStoryText}>Enable Location</Text>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* Trending Spots Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Spots</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.spotsContent}
            >
              {trendingSpots.map((spot) => (
                <View key={spot.id} style={styles.spotCard}>
                  <View style={styles.spotImage}>
                    <Ionicons name="cafe" size={40} color="#522EE8" />
                  </View>
                  <Text style={styles.spotName}>{spot.name}</Text>
                  <View style={styles.spotTags}>
                    {spot.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Upcoming Events Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity>
                <Ionicons name="ellipsis-vertical" size={20} color="#1e1e1e" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventsContent}
            >
              {events.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <LinearGradient
                    colors={["#4527C3", "#522EE8", "#381F9E"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.eventGradient}
                  >
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.date && (
                      <>
                        <Text style={styles.eventDate}>{event.date}</Text>
                        <Text style={styles.eventDays}>
                          {event.days} • {event.fullDate}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Exclusive Offers Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exclusive Offers</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.offersContent}
            >
              {exclusiveOffers.map((offer) => (
                <View key={offer.id} style={styles.offerCard}>
                  <View style={styles.offerImage}>
                    <Ionicons name="restaurant" size={40} color="#522EE8" />
                  </View>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{offer.discount}</Text>
                  </View>
                  {offer.arabic && (
                    <Text style={styles.offerArabic}>{offer.arabic}</Text>
                  )}
                  <Text style={styles.offerName}>{offer.name}</Text>
                  {offer.price && (
                    <Text style={styles.offerPrice}>{offer.price}</Text>
                  )}
                  {offer.phone && (
                    <View style={styles.offerFooter}>
                      <Ionicons name="call-outline" size={12} color="#7D7D7D" />
                      <Text style={styles.offerPhone}>{offer.phone}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Where is Everyone Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where is Everyone</Text>
            <View style={styles.mapContainer}>
              <View style={styles.mapBackground}>
                {/* Map grid lines */}
                <View style={styles.mapGrid}>
                  {[...Array(6)].map((_, i) => (
                    <View key={`h-${i}`} style={[styles.gridLine, styles.gridLineHorizontal, { top: `${i * 20}%` }]} />
                  ))}
                  {[...Array(5)].map((_, i) => (
                    <View key={`v-${i}`} style={[styles.gridLine, styles.gridLineVertical, { left: `${i * 20}%` }]} />
                  ))}
                </View>
                
                {/* Avatar pins */}
                {mapAvatars.map((avatar) => (
                  <View
                    key={avatar.id}
                    style={[
                      styles.mapAvatar,
                      {
                        left: `${avatar.x}%`,
                        top: `${avatar.y}%`,
                      },
                    ]}
                  >
                    <View style={styles.avatarPin}>
                      <Ionicons name="person" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.avatarPinTail} />
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Bottom spacing for navigation bar */}
          <View style={{ height: 90 }} />
          </View>
        </View>
      </ScrollView>

      {/* Story Upload Loader */}
      <StoryUploadLoader
        visible={isUploadingStory}
        progress={uploadProgress}
      />

      {/* Story Viewer */}
      {(userStory || nearbyStories.length > 0) && (
        <StoryViewer
          visible={showStoryViewer}
          story={userStory || nearbyStories[0] || null}
          onClose={handleCloseStoryViewer}
          onNext={() => {
            // For now, just close since we only have one story
            // In future, you can add multiple stories support
            handleCloseStoryViewer();
          }}
          onLike={async () => {
            const currentStory = userStory || nearbyStories[0];
            if (currentStory) {
              try {
                await dispatch(likeStory(currentStory.id)).unwrap();
              } catch (error: any) {
                console.error("Failed to like story:", error);
              }
            }
          }}
          onShare={async () => {
            try {
              const currentStory = userStory || nearbyStories[0];
              if (currentStory) {
                const shareMessage = `Check out this story from ${currentStory.userName || user?.name || 'Sawa'}!`;
                await Share.share({
                  message: shareMessage,
                  title: 'Share Story',
                });
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to share story");
            }
          }}
          onDelete={userStory ? handleDeleteStory : undefined}
          onNext={() => {
            // For nearby stories, navigate to next story
            if (nearbyStories.length > 1) {
              const currentIndex = nearbyStories.findIndex(s => s.id === (userStory || nearbyStories[0])?.id);
              const nextIndex = (currentIndex + 1) % nearbyStories.length;
              handleViewStory(nearbyStories[nextIndex]);
            } else {
              handleCloseStoryViewer();
            }
          }}
        />
      )}

      {/* Location Input Modal */}
      <Modal
        visible={showLocationInput}
        transparent
        animationType="slide"
                onRequestClose={() => {
                  (global as any).pendingStoryImageUri = null;
                  (global as any).pendingStoryImageBase64 = null;
                  handleLocationCancel();
                }}
      >
        <View style={styles.locationModalOverlay}>
          <View style={styles.locationModalContent}>
            <Text style={styles.locationModalTitle}>Add Location</Text>
            <Text style={styles.locationModalSubtitle}>
              Add a location to your story (optional)
            </Text>
            <TextInput
              style={styles.locationInput}
              placeholder="Enter location name (e.g., Lulu's Garden)"
              placeholderTextColor="#A3A3A3"
              value={locationInput}
              onChangeText={setLocationInput}
              autoFocus
            />
            <View style={styles.locationModalButtons}>
              <TouchableOpacity
                style={[styles.locationModalButton, styles.locationModalButtonCancel]}
                onPress={handleLocationCancel}
              >
                <Text style={styles.locationModalButtonTextCancel}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.locationModalButton, styles.locationModalButtonConfirm]}
                onPress={handleLocationConfirm}
              >
                <Text style={styles.locationModalButtonTextConfirm}>
                  {locationInput.trim() ? "Add" : "Continue"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    
  },
  carouselContainer: {
    height: 320,
  },
  carousel: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 24,
    height: 320,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flex: 1,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 1,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 12,
  },
  dots: {
    flexDirection: "row",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    opacity: 1,
    width: 24,
  },
  phoneMockup: {
    width: 120,
    height: 200,
    backgroundColor: "#FF6B35",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
  },
  phoneHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  phoneTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e1e1e",
  },
  phoneIcons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  phoneIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#522EE8",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 8,
  },
  sawaIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sawaIconText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#522EE8",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF0000",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  contentWrapper: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -50,
    paddingTop: 50,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  greetingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greetingLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: "#7D7D7D",
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e1e1e",
  },
  greetingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#522EE8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#c4f582",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e1e1e",
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  tab: {
    paddingBottom: 8,
    marginRight: 16,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#522EE8",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A3A3A3",
  },
  tabTextActive: {
    color: "#1e1e1e",
  },
  storiesContainer: {
    marginBottom: 32,
  },
  storiesContent: {
    paddingRight: 24,
  },
  storyCard: {
    marginRight: 16,
  },
  yourStoryCard: {
    alignItems: "center",
    width: 80,
  },
  yourStoryAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  defaultAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  storyRing: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: "#522EE8",
    top: -3,
    left: -3,
    justifyContent: "center",
    alignItems: "center",
  },
  storyRingInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  addStoryIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#522EE8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  yourStoryText: {
    fontSize: 12,
    color: "#1e1e1e",
    fontWeight: "500",
    textAlign: "center",
  },
  storyDistance: {
    fontSize: 10,
    color: "#7D7D7D",
    marginTop: 2,
    textAlign: "center",
  },
  locationCard: {
    width: 100,
    alignItems: "center",
  },
  locationImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  locationName: {
    fontSize: 10,
    color: "#1e1e1e",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  locationDistance: {
    fontSize: 11,
    color: "#7D7D7D",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e1e1e",
    marginBottom: 16,
  },
  spotsContent: {
    paddingRight: 24,
  },
  spotCard: {
    width: 200,
    marginRight: 16,
  },
  spotImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  spotName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e1e1e",
    marginBottom: 8,
  },
  spotTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#522EE8",
    fontWeight: "600",
  },
  eventsContent: {
    paddingRight: 24,
  },
  eventCard: {
    width: 180,
    height: 220,
    marginRight: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  eventGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  eventDays: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  offersContent: {
    paddingRight: 24,
  },
  offerCard: {
    width: 200,
    marginRight: 16,
    position: "relative",
  },
  offerImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FF0000",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  offerArabic: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e1e1e",
    marginBottom: 4,
    textAlign: "left",
  },
  offerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e1e1e",
    marginBottom: 4,
  },
  offerPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#522EE8",
    marginBottom: 8,
  },
  offerFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  offerPhone: {
    fontSize: 12,
    color: "#7D7D7D",
  },
  mapContainer: {
    marginTop: 16,
  },
  mapBackground: {
    width: "100%",
    height: 300,
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  mapGrid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "#E0E0E0",
  },
  gridLineHorizontal: {
    width: "100%",
    height: 1,
  },
  gridLineVertical: {
    width: 1,
    height: "100%",
  },
  mapAvatar: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "flex-start",
    zIndex: 10,
  },
  avatarPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#522EE8",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarPinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#522EE8",
    marginTop: -2,
  },
  locationModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  locationModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  locationModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e1e1e",
    marginBottom: 8,
    textAlign: "center",
  },
  locationModalSubtitle: {
    fontSize: 14,
    color: "#7D7D7D",
    marginBottom: 16,
    textAlign: "center",
  },
  locationInput: {
    borderWidth: 2,
    borderColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1e1e1e",
    marginBottom: 20,
    backgroundColor: "#FBFBFB",
  },
  locationModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  locationModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  locationModalButtonCancel: {
    backgroundColor: "#F0F0F0",
  },
  locationModalButtonConfirm: {
    backgroundColor: "#522EE8",
  },
  locationModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e1e1e",
  },
  locationModalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
