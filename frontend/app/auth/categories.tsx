import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

// Category data with emojis
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

export default function CategoriesScreen() {
  const router = useRouter();
  const { user, token, saveCategories } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    // Initialize with user's existing categories (if any)
    return user?.categories || [];
  });
  const [isLoading, setIsLoading] = useState(false);

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      // Deselect
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      // Select (only if under limit)
      if (selectedCategories.length < MAX_SELECTIONS) {
        setSelectedCategories([...selectedCategories, categoryId]);
      } else {
        Alert.alert(
          "Maximum Reached",
          `You can only select up to ${MAX_SELECTIONS} categories. Please deselect one to choose another.`
        );
      }
    }
  };

  const handleContinue = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert("No Selection", "Please select at least one category to continue.");
      return;
    }

    setIsLoading(true);
    try {
      await saveCategories(selectedCategories);
      // Navigate back (could be from signup or profile)
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save categories. Please try again.");
      setIsLoading(false);
    }
  };

  // Update selected categories when user data changes (when coming from profile)
  React.useEffect(() => {
    if (user?.categories && user.categories.length > 0) {
      setSelectedCategories(user.categories);
    }
  }, [user?.categories]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e1e1e" />
        </TouchableOpacity>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "66%" }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>What are you interested in the most?</Text>
          <Text style={styles.subtitle}>Choose upto {MAX_SELECTIONS} categories</Text>
        </View>

        {/* Categories Grid */}
        <View style={styles.categoriesGrid}>
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <View style={styles.closeIcon}>
                    <Ionicons name="close" size={16} color="#FFFFFF" />
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

        {/* Selection Counter */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {selectedCategories.length} / {MAX_SELECTIONS} selected
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (selectedCategories.length === 0 || isLoading) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedCategories.length === 0 || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#1e1e1e",
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e1e1e",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#7D7D7D",
    fontWeight: "500",
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
  closeIcon: {
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
  counterContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  counterText: {
    fontSize: 14,
    color: "#7D7D7D",
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  continueButton: {
    width: "100%",
    backgroundColor: "#522EE8",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#522EE8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: "#A3A3A3",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});

