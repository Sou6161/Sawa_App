import { useEffect } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
  return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4527C3" />
    </View>
  );
  }

  // Redirect to splash screen (which will handle routing based on auth)
  return <Redirect href="/splash" />;
}
