import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as SecureStore from "expo-secure-store";
import authService from "../../src/services/auth.service";
import followService from "../../src/services/follow.service";
import DefaultAvatar from "../../src/components/DefaultAvatar";

const TOKEN_KEY = "auth_token";
const { width } = Dimensions.get("window");
const IMAGE_SIZE = (width - 48 - 32) / 3; // 3 columns with padding and gaps

// Category mapping
const categoryMap: Record<string, string> = {
  tech: "Tech",
  events: "Events",
  fashion: "Fashion",
  food: "Food & Drinks",
  pharmacy: "Pharmacy",
  furniture: "Furniture",
  baby: "Baby & Child",
  delivery: "Delivery & Services",
  gaming: "Gaming",
  cars: "Cars",
  jewellery: "Jewellery",
  bikes: "Bikes",
  fitness: "Fitness",
  sports: "Sports",
  love: "Love & Sex",
  outdoors: "Outdoors",
  music: "Music",
  travel: "Travel",
  glasses: "Glasses",
  pets: "Pets",
  decorations: "Decorations",
  garden: "Garden",
};

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  profilePhoto: string | null;
  instagramHandle: string | null;
  categories: string[];
  gender: string | null;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const getToken = async (): Promise<string> => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      throw new Error("User not authenticated");
    }
    return token;
  };

  const loadUserProfile = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      
      // Get user profile
      const profileResponse = await authService.getUserProfile(userId, token);
      if (profileResponse.success && profileResponse.data?.user) {
        const user = profileResponse.data.user;
        setProfileUser({
          id: user.id,
          name: user.name,
          email: user.email,
          profilePhoto: user.profilePhoto,
          instagramHandle: user.instagramHandle,
          categories: user.categories || [],
          gender: user.gender,
          createdAt: user.createdAt,
        });
      }

      // Get follow status and counts
      try {
        const isFollowingStatus = await followService.checkFollowStatus(userId, token);
        setIsFollowing(isFollowingStatus);
      } catch (error) {
        console.error("Error checking follow status:", error);
      }

      try {
        const followers = await followService.getFollowersCount(userId, token);
        setFollowersCount(followers);
      } catch (error) {
        console.error("Error getting followers count:", error);
      }

      try {
        const following = await followService.getFollowingCount(userId, token);
        setFollowingCount(following);
      } catch (error) {
        console.error("Error getting following count:", error);
      }
    } catch (error: any) {
      console.error("Error loading user profile:", error);
      Alert.alert("Error", "Failed to load user profile");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!userId || followLoading) return;

    setFollowLoading(true);
    try {
      const token = await getToken();
      
      if (isFollowing) {
        await followService.unfollowUser(userId, token);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        await followService.followUser(userId, token);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error("Follow/unfollow error:", error);
      Alert.alert("Error", "Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#522EE8" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {profileUser.name || profileUser.email?.split("@")[0] || "Profile"}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {profileUser.profilePhoto ? (
              <ExpoImage
                source={{ uri: profileUser.profilePhoto }}
                style={styles.profileImage}
                contentFit="cover"
              />
            ) : (
              <DefaultAvatar
                gender={profileUser.gender}
                size={120}
                color="#522EE8"
                backgroundColor="#F0F0F0"
              />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profileUser.name || profileUser.email?.split("@")[0] || "User"}
            </Text>

            {/* Categories Section */}
            {profileUser.categories && profileUser.categories.length > 0 ? (
              <View style={styles.categoriesContainer}>
                {profileUser.categories.slice(0, 2).map((categoryId, index) => {
                  const categoryName = categoryMap[categoryId] || categoryId;
                  return (
                    <View key={`${categoryId}-${index}`} style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{categoryName}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {profileUser.instagramHandle ? (
              <View style={styles.instagramLink}>
                <Ionicons name="logo-instagram" size={18} color="#522EE8" />
                <Text style={styles.instagramText}>@{profileUser.instagramHandle}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Follow Button */}
        <View style={styles.followButtonContainer}>
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollow}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? "#1e1e1e" : "#FFFFFF"} />
            ) : (
              <Text
                style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText,
                ]}
              >
                {isFollowing ? "Following" : "Follow"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Posts Grid Placeholder */}
        <View style={styles.postsSection}>
          <Text style={styles.postsSectionTitle}>Posts</Text>
          <View style={styles.postsGrid}>
            {/* Placeholder for posts - can be implemented later */}
            <Text style={styles.noPostsText}>No posts yet</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e1e1e",
    flex: 1,
    textAlign: "center",
  },
  headerButton: {
    width: 40,
  },
  profileSection: {
    flexDirection: "row",
    padding: 16,
    alignItems: "flex-start",
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e1e1e",
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 8,
  },
  categoryTag: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryTagText: {
    fontSize: 12,
    color: "#522EE8",
    fontWeight: "500",
  },
  instagramLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  instagramText: {
    fontSize: 14,
    color: "#522EE8",
    marginLeft: 6,
    fontWeight: "500",
  },
  followButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  followButton: {
    backgroundColor: "#522EE8",
    paddingVertical: 10,
    borderRadius: 8,
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
    fontSize: 16,
    fontWeight: "600",
  },
  followingButtonText: {
    color: "#1e1e1e",
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e1e1e",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#F0F0F0",
  },
  postsSection: {
    padding: 16,
  },
  postsSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e1e1e",
    marginBottom: 16,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  noPostsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    width: "100%",
    paddingVertical: 40,
  },
  backButtonText: {
    color: "#522EE8",
    fontSize: 16,
    fontWeight: "600",
  },
});

