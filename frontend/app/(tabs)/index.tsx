import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

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
  const [activeTab, setActiveTab] = useState<"Nearby" | "Following">("Nearby");
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [greeting, setGreeting] = useState("Good afternoon,");
  const carouselScrollViewRef = useRef<ScrollView>(null);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrollingRef = useRef(false);

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

  // Mock data for stories
  const stories = [
    { id: 1, type: "your-story", label: "Your Story" },
    { id: 2, location: "2km, Khalda", image: "building" },
    { id: 3, location: "3km, Gardens", image: "building" },
    { id: 4, location: "3km, Dabouq", name: "Café Dam boo SINCE 2003", image: "cafe" },
    { id: 5, location: "4km", image: "building" },
  ];

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
      <ScrollView showsVerticalScrollIndicator={false}>
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

          {/* Stories Section */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.storiesContainer}
            contentContainerStyle={styles.storiesContent}
          >
            {stories.map((story) => (
              <View key={story.id} style={styles.storyCard}>
                {story.type === "your-story" ? (
                  <View style={styles.yourStoryCard}>
                    <View style={styles.yourStoryAvatar}>
                      <Ionicons name="person" size={30} color="#522EE8" />
                      <View style={styles.addStoryIcon}>
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </View>
                    </View>
                    <Text style={styles.yourStoryText}>Your Story</Text>
                  </View>
                ) : (
                  <View style={styles.locationCard}>
                    <View style={styles.locationImage}>
                      <Ionicons name="location" size={24} color="#522EE8" />
                    </View>
                    {story.name && (
                      <Text style={styles.locationName} numberOfLines={1}>
                        {story.name}
                      </Text>
                    )}
                    <Text style={styles.locationDistance}>{story.location}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

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
});
