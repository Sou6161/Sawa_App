import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
  TextInput,
  Share,
} from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments, usePathname, useFocusEffect } from "expo-router";
import { useNavigationState, useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { Image as ExpoImage } from "expo-image";
import EditProfileScreen from "./edit-profile";
import * as ImagePicker from "expo-image-picker";
import { Platform, ActivityIndicator } from "react-native";
import DefaultAvatar from "../../src/components/DefaultAvatar";

// Category mapping (same as in categories screen)
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

const { width } = Dimensions.get("window");
const IMAGE_SIZE = (width - 48 - 32) / 3; // 3 columns with padding and gaps

export default function ProfileScreen() {
  const { user, signOut, checkAuth, updateProfile } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const segments = useSegments();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [instagramHandle, setInstagramHandle] = useState(user?.instagramHandle || "");
  const [isSavingInstagram, setIsSavingInstagram] = useState(false);

  // Update instagramHandle state when user changes
  useEffect(() => {
    setInstagramHandle(user?.instagramHandle || "");
  }, [user?.instagramHandle]);
  
  // Track the previous tab using SecureStore (loaded from tab layout)
  const [previousTab, setPreviousTab] = React.useState<string | null>(null);
  
  // Load the last active tab when component mounts
  React.useEffect(() => {
    const loadPreviousTab = async () => {
      try {
        const stored = await SecureStore.getItemAsync("last_active_tab");
        if (stored && stored !== "/(tabs)/profile" && stored !== "/profile") {
          setPreviousTab(stored);
        } else {
          // Default to home if no previous tab stored or if stored tab is profile
          setPreviousTab("/(tabs)/index");
        }
      } catch (error) {
        console.error("Error loading previous tab:", error);
        setPreviousTab("/(tabs)/index");
      }
    };
    loadPreviousTab();
  }, []);
  
  // Also update when screen is focused (in case it changed)
  useFocusEffect(
    React.useCallback(() => {
      const updatePreviousTab = async () => {
        try {
          const stored = await SecureStore.getItemAsync("last_active_tab");
          if (stored && stored !== "/(tabs)/profile" && stored !== "/profile") {
            setPreviousTab(stored);
          } else if (!stored) {
            // If no stored tab, default to index
            setPreviousTab("/(tabs)/index");
          }
        } catch (error) {
          console.error("Error loading previous tab:", error);
          setPreviousTab("/(tabs)/index");
        }
      };
      updatePreviousTab();
    }, [])
  );
  
  // Statistics - will be populated from backend later
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Liked items - will be populated from backend later
  // For now, show empty state or placeholder
  const likedItems: Array<{ id: number }> = [];

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    try {
      if (!user) {
        Alert.alert("Error", "User data not available");
        return;
      }

      // Create a shareable profile link using username
      // Extract username from email or use name
      const profileUsername = user?.email?.split("@")[0] || user?.name?.toLowerCase().replace(/\s+/g, "") || "profile";
      const profileLink = `https://sawa.app/profile/${profileUsername}`;
      
      // Alternative: Use deep link format (if you have deep linking configured)
      // const profileLink = `sawa://profile/${profileUsername}`;

      // Create share message similar to Instagram
      const shareMessage = `Check out ${user?.name || profileUsername}'s profile on Sawa!\n\n${profileLink}`;

      const result = await Share.share({
        message: shareMessage,
        title: `Share ${user?.name || profileUsername}'s Profile`,
        // On iOS, you can also provide a URL
        ...(Platform.OS === 'ios' && { url: profileLink }),
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          console.log("Shared with activity type:", result.activityType);
        } else {
          // Shared
          console.log("Profile shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log("Share dismissed");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to share profile");
      console.error("Share error:", error);
    }
  };

  // Request camera roll permissions
  React.useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          // Permission not granted, but we'll show an alert when user tries to upload
        }
      }
    })();
  }, []);

  const handlePickImage = async () => {
    try {
      // Check permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Sorry, we need camera roll permissions to upload photos!"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true, // Request base64 for direct upload
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const photoBase64 = `data:image/jpeg;base64,${selectedAsset.base64}`;
        
        setIsUploadingPhoto(true);
        try {
          await updateProfile({
            profilePhoto: photoBase64,
          });
          // updateProfile already updates the user state in AuthContext
          // The state will automatically update and trigger a re-render
          Alert.alert("Success", "Profile picture updated successfully!");
        } catch (error: any) {
          Alert.alert("Error", error.message || "Failed to update profile picture");
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to pick image");
      setIsUploadingPhoto(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={async () => {
            // Navigate back to the previous tab (Instagram-like behavior)
            try {
              // Get the current stored tab
              const stored = await SecureStore.getItemAsync("last_active_tab");
              let targetRoute = "/(tabs)/index"; // Default to index
              
              if (stored && stored !== "/(tabs)/profile" && stored !== "/profile") {
                // Validate the stored route
                const validRoutes = ["/(tabs)/index", "/(tabs)/explore", "/(tabs)/search", "/(tabs)/favorites"];
                if (validRoutes.includes(stored)) {
                  targetRoute = stored;
                }
              }
              
              // For tab navigation in Expo Router, navigate to root tabs first
              // This ensures we're in the correct navigation context
              if (targetRoute === "/(tabs)/index") {
                // Navigate to root tabs which defaults to index
                router.replace("/(tabs)" as any);
              } else {
                // For other tabs, use the full route
                router.replace(targetRoute as any);
              }
            } catch (error) {
              // Fallback: always go to index if navigation fails
              console.error("Navigation error:", error);
              try {
                // Navigate to root tabs which defaults to index
                router.replace("/(tabs)" as any);
              } catch (fallbackError) {
                // If that fails, try navigating to root
                router.replace("/" as any);
              }
            }
          }}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#c4f582" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {user?.email?.split("@")[0] || user?.name?.toLowerCase().replace(/\s+/g, "") || "profile"}
        </Text>
        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.headerButton}>
          <View style={styles.dotsContainer}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={isUploadingPhoto}
              activeOpacity={0.8}
            >
              {user?.profilePhoto ? (
                <ExpoImage
                  source={{ uri: user.profilePhoto }}
                  style={styles.profileImage}
                  contentFit="cover"
                />
              ) : (
                <DefaultAvatar
                  gender={user?.gender}
                  size={120}
                  color="#522EE8"
                  backgroundColor="#F0F0F0"
                />
              )}
              {/* Camera icon overlay */}
              <View style={styles.cameraIconOverlay}>
                {isUploadingPhoto ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || user?.email || "User"}</Text>
            
            {/* Categories Section - Show first 2 categories or link to select */}
            {user?.categories && user.categories.length > 0 ? (
              <View style={styles.categoriesContainer}>
                {user.categories.slice(0, 2).map((categoryId, index) => {
                  const categoryName = categoryMap[categoryId] || categoryId;
                  return (
                    <View key={`${categoryId}-${index}`} style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{categoryName}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectCategoryButton}
                onPress={() => router.push("/auth/categories")}
              >
                <Ionicons name="add-circle-outline" size={16} color="#522EE8" />
                <Text style={styles.selectCategoryText}>Choose what interests you more</Text>
              </TouchableOpacity>
            )}
            
            {user?.instagramHandle ? (
              <View style={styles.instagramLink}>
                <Ionicons name="logo-instagram" size={18} color="#522EE8" />
                <Text style={styles.instagramText}>@{user.instagramHandle}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favoritesCount}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
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

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setShowEditProfile(true)}
          >
            <Text style={styles.editButtonText}>EDIT PROFILE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Likes Section */}
        <View style={styles.likesSection}>
          <Text style={styles.likesTitle}>Likes</Text>
          {likedItems.length > 0 ? (
            <View style={styles.likesGrid}>
              {likedItems.map((item) => (
                <TouchableOpacity key={item.id} style={styles.likeItem}>
                  <View style={styles.likeImage}>
                    <Ionicons name="restaurant" size={30} color="#522EE8" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyLikesContainer}>
              <Ionicons name="heart-outline" size={48} color="#A3A3A3" />
              <Text style={styles.emptyLikesText}>No likes yet</Text>
              <Text style={styles.emptyLikesSubtext}>Start exploring and like your favorite places!</Text>
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <EditProfileScreen
          onClose={() => {
            setShowEditProfile(false);
            // Refresh user data when modal closes
            checkAuth();
          }}
        />
      </Modal>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                // Navigate to settings
                Alert.alert("Settings", "Settings screen coming soon");
              }}
            >
              <Ionicons name="settings-outline" size={24} color="#1e1e1e" />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            {user?.instagramHandle ? (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    setInstagramHandle(user.instagramHandle || "");
                    setShowInstagramModal(true);
                  }}
                >
                  <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                  <Text style={styles.menuItemText}>Edit Instagram</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    Alert.alert(
                      "Disconnect Instagram",
                      `Are you sure you want to disconnect @${user.instagramHandle}?`,
                      [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "Disconnect",
                          style: "destructive",
                          onPress: async () => {
                            setIsSavingInstagram(true);
                            try {
                              await updateProfile({
                                instagramHandle: null,
                              });
                              Alert.alert("Success", "Instagram handle disconnected successfully!");
                            } catch (error: any) {
                              Alert.alert("Error", error.message || "Failed to disconnect Instagram handle");
                            } finally {
                              setIsSavingInstagram(false);
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="close-circle-outline" size={24} color="#FF0000" />
                  <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Disconnect Instagram</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  setInstagramHandle("");
                  setShowInstagramModal(true);
                }}
              >
                <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                <Text style={styles.menuItemText}>Connect Instagram</Text>
              </TouchableOpacity>
            )}
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={24} color="#FF0000" />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Instagram Connection Modal */}
      <Modal
        visible={showInstagramModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInstagramModal(false)}
      >
        <View style={styles.instagramModalOverlay}>
          <View style={styles.instagramModalContainer}>
            <View style={styles.instagramModalHeader}>
              <Text style={styles.instagramModalTitle}>
                {user?.instagramHandle ? "Edit Instagram Handle" : "Connect Instagram"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowInstagramModal(false)}
                style={styles.instagramModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#1e1e1e" />
              </TouchableOpacity>
            </View>

            <View style={styles.instagramModalContent}>
              <Text style={styles.instagramModalLabel}>Instagram Handle</Text>
              <View style={styles.instagramInputContainer}>
                <Text style={styles.instagramAtSymbol}>@</Text>
                <TextInput
                  style={styles.instagramInput}
                  value={instagramHandle}
                  onChangeText={(text) => {
                    // Remove @ if user types it
                    const cleaned = text.replace(/^@/, "").replace(/\s/g, "");
                    setInstagramHandle(cleaned);
                  }}
                  placeholder="username"
                  placeholderTextColor="#A3A3A3"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={30}
                />
              </View>
              <Text style={styles.instagramModalHint}>
                Enter your Instagram username without @ symbol
              </Text>

              <View style={styles.instagramModalButtons}>
                {user?.instagramHandle && (
                  <TouchableOpacity
                    style={styles.instagramRemoveButton}
                    onPress={async () => {
                    setIsSavingInstagram(true);
                    try {
                      await updateProfile({
                        instagramHandle: null,
                      });
                      // updateProfile already updates the user state in AuthContext
                      // The state will automatically update and trigger a re-render
                      setShowInstagramModal(false);
                      Alert.alert("Success", "Instagram handle removed successfully!");
                    } catch (error: any) {
                      Alert.alert("Error", error.message || "Failed to remove Instagram handle");
                    } finally {
                      setIsSavingInstagram(false);
                    }
                    }}
                    disabled={isSavingInstagram}
                  >
                    <Text style={styles.instagramRemoveButtonText}>Remove</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.instagramSaveButton,
                    (!instagramHandle.trim() || isSavingInstagram) && styles.instagramSaveButtonDisabled,
                  ]}
                  onPress={async () => {
                    if (!instagramHandle.trim()) {
                      Alert.alert("Error", "Please enter an Instagram handle");
                      return;
                    }

                    setIsSavingInstagram(true);
                    try {
                      await updateProfile({
                        instagramHandle: instagramHandle.trim(),
                      });
                      // updateProfile already updates the user state in AuthContext
                      // The state will automatically update and trigger a re-render
                      setShowInstagramModal(false);
                      Alert.alert("Success", "Instagram handle updated successfully!");
                    } catch (error: any) {
                      Alert.alert("Error", error.message || "Failed to update Instagram handle");
                    } finally {
                      setIsSavingInstagram(false);
                    }
                  }}
                  disabled={!instagramHandle.trim() || isSavingInstagram}
                >
                  {isSavingInstagram ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.instagramSaveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e1e1e",
  },
  dotsContainer: {
    flexDirection: "row",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#c4f582",
    marginRight: 4,
  },
  profileSection: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  profileImageContainer: {
    marginRight: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: "hidden",
  },
  cameraIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#522EE8",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e1e1e",
    marginBottom: 8,
  },
  instagramLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  instagramText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#522EE8",
    marginLeft: 6,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    marginHorizontal: 24,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e1e1e",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7D7D7D",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#522EE8",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#522EE8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  shareButton: {
    width: 50,
    height: 50,
    backgroundColor: "#522EE8",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    shadowColor: "#522EE8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  likesSection: {
    paddingHorizontal: 24,
  },
  likesTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e1e1e",
    marginBottom: 16,
  },
  likesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  likeItem: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 4,
    marginBottom: 8,
  },
  likeImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e1e1e",
    marginLeft: 16,
  },
  menuItemTextDanger: {
    color: "#FF0000",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  emptyLikesContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyLikesText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e1e1e",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyLikesSubtext: {
    fontSize: 14,
    color: "#7D7D7D",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
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
    fontWeight: "600",
    color: "#522EE8",
  },
  moreCategoriesText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7D7D7D",
    marginLeft: 4,
  },
  selectCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  selectCategoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#522EE8",
    marginLeft: 6,
  },
  instagramModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  instagramModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    maxHeight: "80%",
  },
  instagramModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  instagramModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e1e1e",
  },
  instagramModalCloseButton: {
    padding: 4,
  },
  instagramModalContent: {
    marginBottom: 20,
  },
  instagramModalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e1e1e",
    marginBottom: 12,
  },
  instagramInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 8,
  },
  instagramAtSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e1e1e",
    marginRight: 4,
  },
  instagramInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e1e1e",
    paddingVertical: 12,
  },
  instagramModalHint: {
    fontSize: 12,
    color: "#7D7D7D",
    marginBottom: 24,
  },
  instagramModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  instagramSaveButton: {
    flex: 1,
    backgroundColor: "#522EE8",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  instagramSaveButtonDisabled: {
    backgroundColor: "#A3A3A3",
  },
  instagramSaveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  instagramRemoveButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF0000",
    alignItems: "center",
    justifyContent: "center",
  },
  instagramRemoveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF0000",
  },
});
