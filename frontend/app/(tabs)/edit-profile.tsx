import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image as ExpoImage } from "expo-image";

// Category mapping (same as in categories screen)
const categories = [
  { id: "tech", name: "Tech", emoji: "🎧" },
  { id: "events", name: "Events", emoji: "👥" },
  { id: "fashion", name: "Fashion", emoji: "👠" },
  { id: "food", name: "Food & Drinks", emoji: "🍔" },
  { id: "pharmacy", name: "Pharmacy", emoji: "💊" },
  { id: "furniture", name: "Furniture", emoji: "🪑" },
  { id: "baby", name: "Baby & Child", emoji: "👶" },
  { id: "delivery", name: "Delivery & Services", emoji: "🚚" },
  { id: "gaming", name: "Gaming", emoji: "🎮" },
  { id: "cars", name: "Cars", emoji: "🚗" },
  { id: "jewellery", name: "Jewellery", emoji: "💎" },
  { id: "bikes", name: "Bikes", emoji: "🚲" },
  { id: "fitness", name: "Fitness", emoji: "💪" },
  { id: "sports", name: "Sports", emoji: "🎾" },
  { id: "love", name: "Love & Sex", emoji: "❤️" },
  { id: "outdoors", name: "Outdoors", emoji: "⛺" },
  { id: "music", name: "Music", emoji: "🎸" },
  { id: "travel", name: "Travel", emoji: "🧳" },
  { id: "glasses", name: "Glasses", emoji: "🕶️" },
  { id: "pets", name: "Pets", emoji: "🐶" },
  { id: "decorations", name: "Decorations", emoji: "🪴" },
  { id: "garden", name: "Garden", emoji: "🏡" },
];

const MAX_SELECTIONS = 8;

interface EditProfileScreenProps {
  onClose?: () => void;
}

export default function EditProfileScreen({ onClose }: EditProfileScreenProps = {}) {
  const router = useRouter();
  const { user, updateProfile, checkAuth } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    user?.categories || []
  );
  const [profilePhoto, setProfilePhoto] = useState<string | null>(
    user?.profilePhoto || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [imagePickerResult, setImagePickerResult] = useState<ImagePicker.ImagePickerResult | null>(null);

  // Track original values to detect changes
  const originalName = user?.name || "";
  const originalCategories = user?.categories || [];
  const originalProfilePhoto = user?.profilePhoto || null;

  // Check if any changes have been made
  const hasChanges =
    name.trim() !== originalName ||
    JSON.stringify([...selectedCategories].sort()) !== JSON.stringify([...originalCategories].sort()) ||
    profilePhoto !== originalProfilePhoto;

  // Update state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setSelectedCategories(user.categories || []);
      setProfilePhoto(user.profilePhoto || null);
      setImagePickerResult(null);
    }
  }, [user]);

  useEffect(() => {
    // Request camera roll permissions
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Sorry, we need camera roll permissions to upload photos!");
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImagePickerResult(result);
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      if (selectedCategories.length < MAX_SELECTIONS) {
        setSelectedCategories([...selectedCategories, categoryId]);
      } else {
        Alert.alert(
          "Maximum Reached",
          `You can only select up to ${MAX_SELECTIONS} categories.`
        );
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    setIsLoading(true);
    try {
      // Convert image to base64 if new image selected
      let photoBase64 = null;
      if (imagePickerResult && !imagePickerResult.canceled && imagePickerResult.assets[0]) {
        // For now, we'll send the URI. In production, upload to cloud storage first
        photoBase64 = imagePickerResult.assets[0].uri;
      }

      await updateProfile({
        name: name.trim(),
        categories: selectedCategories,
        profilePhoto: photoBase64 || user?.profilePhoto || null,
      });

      // Refresh user data
      await checkAuth();

      Alert.alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            if (onClose) {
              onClose();
            } else {
              router.back();
            }
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (onClose) {
              onClose();
            } else {
              router.back();
            }
          }}
          style={styles.headerButton}
        >
          <Ionicons name="close" size={24} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading || !hasChanges}
          style={[
            styles.saveButton,
            (!hasChanges || isLoading) && styles.saveButtonDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                !hasChanges && styles.saveButtonTextDisabled,
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          {profilePhoto ? (
            <View style={styles.photoContainer}>
              <ExpoImage
                source={{ uri: profilePhoto }}
                style={styles.profilePhoto}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={pickImage}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Ionicons name="camera" size={40} color="#522EE8" />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Name Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#A3A3A3"
          />
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.label}>Categories ({selectedCategories.length}/{MAX_SELECTIONS})</Text>
          <Text style={styles.subLabel}>Select up to {MAX_SELECTIONS} categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    isSelected && styles.categoryButtonSelected,
                  ]}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  )}
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingTop: Platform.OS === "ios" ? 60 : 40,
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#522EE8",
  },
  saveButtonTextDisabled: {
    color: "#A3A3A3",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  photoContainer: {
    position: "relative",
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  changePhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#522EE8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  addPhotoText: {
    fontSize: 12,
    color: "#7D7D7D",
    marginTop: 8,
    fontWeight: "600",
  },
  inputSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e1e1e",
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: "#7D7D7D",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#FBFBFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F0F0F0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1e1e1e",
  },
  categoriesSection: {
    marginBottom: 32,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  categoryButton: {
    width: "30%",
    aspectRatio: 1.2,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    margin: 6,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    position: "relative",
  },
  categoryButtonSelected: {
    backgroundColor: "#522EE8",
    borderColor: "#522EE8",
  },
  checkIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e1e1e",
    textAlign: "center",
  },
  categoryTextSelected: {
    color: "#FFFFFF",
  },
});

