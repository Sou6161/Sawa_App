import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface DefaultAvatarProps {
  gender?: string | null;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * Default Avatar Component
 * Shows gender-specific avatar icons when no profile photo is available
 */
export default function DefaultAvatar({
  gender,
  size = 50,
  color = "#522EE8",
  backgroundColor = "#F0F0F0",
}: DefaultAvatarProps) {
  // Determine icon based on gender
  // Using person icon which is available in all Ionicons versions
  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    return "person";
  };

  // Ensure we have valid values
  const bgColor = backgroundColor || "#F0F0F0";
  const iconColor = color || "#522EE8";
  const iconSize = Math.max(size * 0.6, 20);
  
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Ionicons 
        name={getIcon()} 
        size={iconSize} 
        color={iconColor} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});

