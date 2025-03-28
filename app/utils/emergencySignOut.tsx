// app/utils/emergencySignOut.tsx
// Contributor: @Fardeen Bablu
// Time spent: 1 hour

import AsyncStorage from "@react-native-async-storage/async-storage";
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

    // Directly navigate to onboarding
    router.replace("/onboarding");

    return true;
  } catch (error) {
    console.error("Force sign out error:", error);
    return false;
  }
};

export default emergencySignOut;
