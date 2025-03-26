// app/services/authService.ts
// Contributor: @Fardeen Bablu
// Time spent: 30 minutes

import AsyncStorage from "@react-native-async-storage/async-storage";
import { mockAuth } from "../utils/mockAuth";

const authService = {
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const user = await AsyncStorage.getItem("mock_current_user");
      return !!user;
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
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      return false;
    }
  },
};

export default authService;
