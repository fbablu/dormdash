// app/services/authService.ts
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const authService = {
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const user = await AsyncStorage.getItem("user_data");
      const token = await AsyncStorage.getItem("userToken");
      return !!user && !!token;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  },

  getCurrentUser: async () => {
    try {
      const userJson = await AsyncStorage.getItem("mock_current_user");
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  signOut: async () => {
    try {
      await AsyncStorage.removeItem("mock_current_user");
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userId");
      await AsyncStorage.removeItem("user_data");
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      return false;
    }
  },
};

// Default export to satisfy router requirements
export default function AuthService() {
  return null;
}

export { authService };
