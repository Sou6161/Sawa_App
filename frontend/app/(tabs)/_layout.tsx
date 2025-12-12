import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { useNavigation, useNavigationState } from "@react-navigation/native";

// Global variable to track the last active tab (before profile)
let lastActiveTab: string | null = null;

export default function TabsLayout() {
  const navigation = useNavigation();
  
  // Track the active tab whenever it changes
  useEffect(() => {
    const unsubscribe = navigation.addListener("state", (e) => {
      const state = e.data.state;
      if (state) {
        const tabNavigator = state.routes.find((route) => route.name === "(tabs)");
        if (tabNavigator && tabNavigator.state) {
          const tabState = tabNavigator.state;
          const currentTabIndex = tabState.index || 0;
          const tabRoutes = tabState.routes || [];
          const currentTab = tabRoutes[currentTabIndex];
          
          // Store the current tab as last active (only if it's not profile)
          if (currentTab && currentTab.name !== "profile") {
            lastActiveTab = `/(tabs)/${currentTab.name}`;
            // Also store in SecureStore for persistence
            SecureStore.setItemAsync("last_active_tab", lastActiveTab).catch(console.error);
          }
        }
      }
    });
    
    return unsubscribe;
  }, [navigation]);
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#c4f582",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name="paper-plane" 
              size={size} 
              color={focused ? "#FFFFFF" : "#c4f582"} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name="search-outline" 
              size={size} 
              color={focused ? "#FFFFFF" : "#c4f582"} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.homeIconContainer}>
              <Ionicons 
                name="home" 
                size={size + 2} 
                color="#FFFFFF" 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name="heart" 
              size={size} 
              color={focused ? "#FFFFFF" : "#c4f582"} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name="happy" 
              size={size} 
              color={focused ? "#FFFFFF" : "#c4f582"} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          href: null, // Hide from tab bar, index is the home screen
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null, // Hide from tab bar, this is a modal screen
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 5 : 60,
    left: "50%",
    marginLeft: 30,
    width: 400,
    backgroundColor: "#4527C3",
    borderTopWidth: 0,
    height: 65,
    paddingBottom: Platform.OS === "ios" ? 8 : 8,
    paddingTop: 8,
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 0,
  },
  homeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#381F9E",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#522EE8",
  },
});
