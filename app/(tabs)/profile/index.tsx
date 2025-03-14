// app/(tabs)/profile/index.tsx
// Contributors: @Fardeen Bablu, @Yuening Li
// Time spent: 2 hours

import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/app/services/api";
import { usePayment } from "@/app/context/PaymentContext";

const ProfileScreen = () => {
  const { paymentMethod, refreshPaymentMethod } = usePayment();
  const [userProfile, setUserProfile] = useState({
    name: "Lily Li",
    email: "dormdash@gmail.com",
    phoneNumber: "",
    defaultAddress: ""
  });
  const [defaultAddress, setDefaultAddress] = useState<string>("");
  
  useEffect(() => {
    fetchUserProfile();
    fetchDefaultAddress();
    // Refresh payment method when component mounts
    refreshPaymentMethod();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      if (!currentUser) {
        // If not logged in, we'll just use the default state
        return;
      }
      
      // Try to get the profile from API
      try {
        // Comment out the API call temporarily to avoid the network error
        // const data = await api.getUserProfile(currentUser.user.id);
        // setUserProfile(data);
        
        // Just use the static data for now
        setUserProfile({
          name: currentUser.user.name || "Lily Li",
          email: currentUser.user.email || "dormdash@gmail.com",
          phoneNumber: "",
          defaultAddress: ""
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    } catch (error) {
      console.error("Google sign-in check error:", error);
    }
  };

  const fetchDefaultAddress = async () => {
    try {
      // Try to get the current address
      const currentAddress = await AsyncStorage.getItem('dormdash_current_address');
      if (currentAddress) {
        setDefaultAddress(currentAddress);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userId");
      router.replace("/onboarding");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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
            source={require('@/assets/icons/splash-icon-light.png')}
            defaultSource={require('@/assets/icons/splash-icon-light.png')}
          />
          <Text style={styles.profileName}>{userProfile.name}</Text>
        </View>

        {/* My Information Section */}
        <Text style={styles.sectionHeading}>My Account</Text>
        <View style={styles.section}>
          <MenuItem
            icon="user"
            title="My Information"
            // onPress={() => router.push("/profile/myinfo")}
            onPress={() => console.log("My Info")}
          />
          <MenuItem
            icon="heart"
            title="Favorites"
            onPress={() => router.push("/profile/favorites")}
          />
          <MenuItem
            icon="mail"
            title={userProfile.email}
            onPress={() => console.log("Email")}
          />
        </View>

        {/* Account Settings Section */}
        <Text style={styles.sectionHeading}>Account Settings</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/address")}>
            <Feather name="map-pin" size={24} color="#000" />
            <View style={styles.addressContainer}>
              <Text style={styles.menuItemText}>Address</Text>
              {defaultAddress ? (
                <View style={styles.currentAddress}>
                  <Text style={styles.currentAddressText} numberOfLines={1}>
                    {defaultAddress.length > 30 ? defaultAddress.substring(0, 30) + "..." : defaultAddress}
                  </Text>
                </View>
              ) : null}
            </View>
            <Feather name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/payment")}>
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
            // onPress={() => router.push("/profile/notifications")}
            onPress={() => console.log("Notifications")}
          />
          <MenuItem
            icon="help-circle"
            title="Support"
            onPress={() => router.replace("https://dormdash.github.io/support")}
          />
          <MenuItem
            icon="log-out"
            title="Sign Out"
            onPress={handleSignOut}
          />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#cfae70',
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
  menuItemText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
  paymentMethodContainer: {
    flex: 1,
  },
  currentPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  currentPaymentText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 16,
  },
  paymentIcon: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#cfae70',
  },
  addressContainer: {
    flex: 1,
  },
  currentAddress: {
    marginTop: 4,
  },
  currentAddressText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 16,
  }
});

export default ProfileScreen;