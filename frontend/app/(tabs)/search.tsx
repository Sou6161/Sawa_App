import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useAuth } from "../../src/contexts/AuthContext";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import authService from "../../src/services/auth.service";
import followService from "../../src/services/follow.service";
import DefaultAvatar from "../../src/components/DefaultAvatar";

const { width } = Dimensions.get("window");
const TOKEN_KEY = "auth_token"; // Same as used in AuthContext and storiesSlice

/**
 * Get authentication token from SecureStore
 */
const getToken = async (): Promise<string> => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) {
    throw new Error("User not authenticated");
  }
  return token;
};

interface SearchUser {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string | null;
  instagramHandle?: string | null;
  categories?: string[];
  followersCount: number;
  followingCount: number;
  hasActiveStory: boolean;
  isFollowing: boolean;
  gender?: string | null;
}

export default function SearchScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const token = await getToken();
      const response = await authService.searchUsers(query, token, 20);
      
      if (response.success && response.data) {
        // Handle nested response structure
        // The API service may wrap the backend response
        let users: any[] = [];
        
        if (Array.isArray(response.data)) {
          // If response.data is already an array, use it directly
          users = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Check if it's a nested response object
          const backendData = response.data as any;
          if (backendData.data && Array.isArray(backendData.data)) {
            // Nested structure: { success: true, data: [...] }
            users = backendData.data;
          } else if (Array.isArray(backendData)) {
            // Direct array
            users = backendData;
          }
        }
        
        if (__DEV__) {
          console.log('Search response structure:', {
            responseSuccess: response.success,
            responseDataType: typeof response.data,
            isArray: Array.isArray(response.data),
            usersCount: users.length,
          });
        }
        
        setSearchResults(users as SearchUser[]);
      } else {
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (followLoading) return;

    setFollowLoading(userId);
    try {
      const token = await getToken();
      if (isCurrentlyFollowing) {
        await followService.unfollowUser(userId, token);
      } else {
        await followService.followUser(userId, token);
      }

      // Update local state
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                isFollowing: !isCurrentlyFollowing,
                followersCount: isCurrentlyFollowing
                  ? u.followersCount - 1
                  : u.followersCount + 1,
              }
            : u
        )
      );
    } catch (error: any) {
      console.error("Follow/unfollow error:", error);
    } finally {
      setFollowLoading(null);
    }
  };

  const handleUserPress = (userId: string) => {
    // Navigate to user profile view
    router.push({
      pathname: "/user-profile/[userId]",
      params: { userId },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSearchResults([]);
                setHasSearched(false);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isSearching ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#522EE8" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : hasSearched && searchResults.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              Try searching with a different name or username
            </Text>
          </View>
        ) : !hasSearched ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Search for users</Text>
            <Text style={styles.emptySubtext}>
              Find people by name, email, or Instagram handle
            </Text>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            {searchResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={styles.userCard}
                onPress={() => handleUserPress(result.id)}
                activeOpacity={0.7}
              >
                <View style={styles.userInfo}>
                  <View style={styles.avatarContainer}>
                    {result.profilePhoto ? (
                      <ExpoImage
                        source={{ uri: result.profilePhoto }}
                        style={styles.avatar}
                        contentFit="cover"
                      />
                    ) : (
                      <DefaultAvatar
                        gender={result.gender || null}
                        size={50}
                        color="#522EE8"
                        backgroundColor="#F0F0F0"
                      />
                    )}
                    {result.hasActiveStory && (
                      <View style={styles.storyRing}>
                        <View style={styles.storyRingInner} />
                      </View>
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {result.name}
                    </Text>
                    {result.instagramHandle && (
                      <Text style={styles.instagramHandle} numberOfLines={1}>
                        @{result.instagramHandle}
                      </Text>
                    )}
                    <View style={styles.statsContainer}>
                      <Text style={styles.statsText}>
                        {result.followersCount ?? 0} followers
                      </Text>
                      <Text style={styles.statsDot}> • </Text>
                      <Text style={styles.statsText}>
                        {result.followingCount ?? 0} following
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    result.isFollowing && styles.followingButton,
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleFollow(result.id, result.isFollowing);
                  }}
                  disabled={followLoading === result.id}
                >
                  {followLoading === result.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.followButtonText,
                        result.isFollowing && styles.followingButtonText,
                      ]}
                    >
                      {result.isFollowing ? "Following" : "Follow"}
                    </Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F5FD", // Very light lavender-grey (Neutral.50 from palette)
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8F5FD", // Very light lavender-grey (Neutral.50 from palette)
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e1e1e",
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#1e1e1e",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  resultsContainer: {
    paddingVertical: 8,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  storyRing: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "#522EE8",
    justifyContent: "center",
    alignItems: "center",
  },
  storyRingInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e1e1e",
    marginBottom: 2,
  },
  instagramHandle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statsText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "400",
  },
  statsDot: {
    fontSize: 13,
    color: "#666",
    marginHorizontal: 4,
  },
  followButton: {
    backgroundColor: "#522EE8",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  followingButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  followingButtonText: {
    color: "#1e1e1e",
  },
});
