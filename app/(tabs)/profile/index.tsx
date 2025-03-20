// app/(tabs)/profile/index.tsx
// Contributors: @Fardeen Bablu, @Yuening Li
// Time spent: 3 hours
// app/(tabs)/profile/index.tsx
// Contributors: @Fardeen Bablu, @Yuening Li
// Time spent: 3 hours

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/app/context/AuthContext";
import { usePayment } from "@/app/context/PaymentContext";

const FAVORITES_STORAGE_KEY = "dormdash_favorites";

const ProfileScreen = () => {
  const { paymentMethod, refreshPaymentMethod } = usePayment();
  const { user, refreshUser, signOut } = useAuth();

  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    defaultAddress: "",
  });
  const [defaultAddress, setDefaultAddress] = useState<string>("");
  const [favoriteCount, setFavoriteCount] = useState<number>(0);
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    refreshPaymentMethod();
    fetchUserProfile();
    fetchDefaultAddress();
    fetchFavoriteCount();
  }, []);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchFavoriteCount();
      return () => {};
    }, [])
  );

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);

      if (!user) {
        console.log("No user found in AuthContext");
        return;
      }

      // Use user data from AuthContext
      setUserProfile({
        name: user.name || "Vanderbilt Student",
        email: user.email || "",
        phoneNumber: "",
        defaultAddress: "",
      });

      // Try to refresh user data from Firebase
      try {
        await refreshUser();
      } catch (refreshError) {
        console.error("Error refreshing user data:", refreshError);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDefaultAddress = async () => {
    try {
      // Try to get the current address
      const currentAddress = await AsyncStorage.getItem(
        "dormdash_current_address"
      );
      if (currentAddress) {
        setDefaultAddress(currentAddress);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const fetchFavoriteCount = async () => {
    setLoadingFavorites(true);
    try {
      // Try to get user ID first
      const userId = await AsyncStorage.getItem("userId");

      // Try API first
      if (userId) {
        try {
          const response = await fetch(
            `http://localhost:3000/api/users/${userId}/favorites`,
            {
              headers: {
                Authorization: `Bearer ${await AsyncStorage.getItem("userToken")}`,
              },
            }
          );

          if (response.ok) {
            const favorites = await response.json();
            setFavoriteCount(favorites.length);
            setLoadingFavorites(false);
            return;
          }
        } catch (error) {
          console.log("API fetch failed, falling back to AsyncStorage", error);
        }
      }

      // Fallback to AsyncStorage
      const savedFavorites = await AsyncStorage.getItem(
        FAVORITES_STORAGE_KEY,
      );
      if (savedFavorites) {
        const favorites = JSON.parse(savedFavorites);
        setFavoriteCount(favorites.length);
      } else {
        setFavoriteCount(0);
      }
    } catch (error) {
      console.error("Error fetching favorite count:", error);
      setFavoriteCount(0);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/onboarding");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#cfae70" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.heading}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => console.log("Settings")}
          >
            <Feather name="settings" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <Image
            style={styles.profileImage}
            source={
              user?.image
                ? { uri: user.image }
                : require("@/assets/profile_picture.png")
            }
            defaultSource={require("@/assets/profile_picture.png")}
          />
          <Text style={styles.profileName}>{userProfile.name}</Text>
        </View>

        {/* My Information Section */}
        <Text style={styles.sectionHeading}>My Account</Text>
        <View style={styles.section}>
          <MenuItem
            icon="user"
            title="My Information"
            onPress={() => router.push("/profile/myinfo")}
          />

          {/* Enhanced Favorites MenuItem with count */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/favorites")}
          >
            <Feather name="heart" size={24} color="#000" />
            <View style={styles.menuItemTextContainer}>
              <Text style={styles.menuItemText}>Favorites</Text>
              {loadingFavorites ? (
                <ActivityIndicator
                  size="small"
                  color="#cfae70"
                  style={styles.favoriteIndicator}
                />
              ) : favoriteCount > 0 ? (
                <View style={styles.favoriteCountBadge}>
                  <Text style={styles.favoriteCountText}>{favoriteCount}</Text>
                </View>
              ) : null}
            </View>
            <Feather name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <MenuItem
            icon="mail"
            title={userProfile.email}
            onPress={() => console.log("Email")}
          />
        </View>

        {/* Account Settings Section */}
        <Text style={styles.sectionHeading}>Account Settings</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/address")}
          >
            <Feather name="map-pin" size={24} color="#000" />
            <View style={styles.addressContainer}>
              <Text style={styles.menuItemText}>Address</Text>
              {defaultAddress ? (
                <View style={styles.currentAddress}>
                  <Text style={styles.currentAddressText} numberOfLines={1}>
                    {defaultAddress.length > 30
                      ? defaultAddress.substring(0, 30) + "..."
                      : defaultAddress}
                  </Text>
                </View>
              ) : null}
            </View>
            <Feather name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/payment")}
          >
            <Feather name="credit-card" size={24} color="#000" />
            <View style={styles.paymentMethodContainer}>
              <Text style={styles.menuItemText}>Payment Methods</Text>
              <View style={styles.currentPayment}>
                <Text style={styles.currentPaymentText}>Current: </Text>
                {paymentMethod === "Commodore Cash" && (
                  <Text style={styles.paymentIcon}>CC</Text>
                )}
                {paymentMethod === "PayPal" && (
                  <FontAwesome5 name="paypal" size={16} color="#0070BA" />
                )}
                {paymentMethod === "Stripe" && (
                  <FontAwesome5 name="stripe" size={16} color="#635BFF" />
                )}
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <MenuItem
            icon="bell"
            title="Notifications"
            onPress={() => router.push("/profile/notifications")}
          />
          <MenuItem
            icon="help-circle"
            title="Support"
            onPress={() => router.replace("https://dormdash.github.io/support")}
          />
          <MenuItem icon="log-out" title="Sign Out" onPress={handleSignOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  onPress: () => void;
}

const MenuItem = ({ icon, title, onPress }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Feather name={icon} size={24} color="#000" />
    <Text style={styles.menuItemText}>{title}</Text>
    <Feather name="chevron-right" size={24} color="#666" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#cfae70",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "500",
    marginTop: 10,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 16,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuItemTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
  menuTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  favoriteCountBadge: {
    backgroundColor: "#cfae70",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  favoriteCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  favoriteIndicator: {
    marginLeft: 8,
  },
  paymentMethodContainer: {
    flex: 1,
  },
  currentPayment: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  currentPaymentText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 16,
  },
  paymentIcon: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#cfae70",
  },
  addressContainer: {
    flex: 1,
  },
  currentAddress: {
    marginTop: 4,
  },
  currentAddressText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 16,
  },
});

export default ProfileScreen;