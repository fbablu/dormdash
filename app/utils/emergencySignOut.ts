// app/utils/emergencySignOut.ts
// Contributor: @Fardeen Bablu
// Time spent: 10 minutes

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { router } from "expo-router";

/**
 * Emergency function to force sign out by clearing all auth-related data
 */
export const emergencySignOut = async () => {
  try {
    const keysToRemove = [
      "mock_current_user",
      "userToken",
      "userId",
      "user_data",
      "api_disabled",
      "dormdash_orders",
    ];

    // Remove all keys in parallel
    await Promise.all(keysToRemove.map((key) => AsyncStorage.removeItem(key)));

    // Notify user
    Alert.alert(
      "Signed Out Successfully",
      "You have been signed out. Redirecting to onboarding...",
      [
        {
          text: "OK",
          onPress: () => {
            // Force navigation to onboarding
            setTimeout(() => {
              router.replace("/onboarding");
            }, 500);
          },
        },
      ],
    );

    return true;
  } catch (error) {
    console.error("Force sign out error:", error);
    Alert.alert(
      "Error",
      "Failed to sign out. Please close and restart the app.",
    );
    return false;
  }
};
