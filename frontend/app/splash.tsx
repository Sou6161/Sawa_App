import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";

function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const spiralOpacity = useRef(new Animated.Value(0)).current;
  const spiralTranslateY = useRef(new Animated.Value(150)).current; // Start further down

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return;
    // Logo animation: fade in and scale up with bounce effect (faster)
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600, // Reduced from 1000
        delay: 200, // Reduced from 300
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.1,
          duration: 500, // Reduced from 700
          delay: 200, // Reduced from 300
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 200, // Reduced from 300
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Bottom spiral animation: fade in while sliding up from bottom (faster)
    Animated.parallel([
      Animated.timing(spiralOpacity, {
        toValue: 1,
        duration: 800, // Reduced from 1200
        delay: 500, // Reduced from 800
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(spiralTranslateY, {
        toValue: 0,
        duration: 800, // Reduced from 1200
        delay: 500, // Reduced from 800
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate based on authentication status after splash screen
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          router.replace("/(tabs)");
        } else {
          router.replace("/auth/signin");
        }
      }
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(timer);
  }, [router, logoOpacity, logoScale, spiralOpacity, spiralTranslateY, isAuthenticated, isLoading]);

  return (
    <View className="flex-1 bg-[#4527C3]">
      {/* Logo - Centered in upper-middle section */}
      <Animated.View
        style={{
          position: "absolute",
          top: "30%",
          left: 0,
          right: 0,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <Image
          source={require("../assets/images/Logo for Sawa App.png")}
          style={{ width: 140, height: 140 }}
          contentFit="contain"
          transition={200}
          onLoad={() => console.log("✅ Logo image loaded")}
          onError={(error) => console.error("❌ Logo error:", error)}
        />
      </Animated.View>

      {/* Bottom Spiral Design - Slides up from bottom with fade */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "28%",
          zIndex: 5,
          opacity: spiralOpacity,
          transform: [{ translateY: spiralTranslateY }],
        }}
      >
        <Image
          source={require("../assets/images/Splash screen design.png")}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
          onLoad={() => console.log("✅ Spiral image loaded")}
          onError={(error) => console.error("❌ Spiral error:", error)}
        />
      </Animated.View>
    </View>
  );
}

export default SplashScreen;
