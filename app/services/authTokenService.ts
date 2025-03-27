// app/services/authTokenService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../config/firebase";

class AuthTokenService {
  // Get the current auth token, refreshing if needed
  async getToken(forceRefresh = false): Promise<string | null> {
    try {
      // First try to get token from AsyncStorage
      let token = await AsyncStorage.getItem("userToken");

      // If no token or force refresh requested, try to get a fresh token
      if (!token || forceRefresh) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            token = await currentUser.getIdToken(true);
            await AsyncStorage.setItem("userToken", token);
            console.log("Token refreshed successfully");
          } catch (error) {
            console.error("Failed to refresh token:", error);
          }
        }
      }

      return token;
    } catch (error) {
      console.error("Error in getToken:", error);
      return null;
    }
  }

  // Get auth headers for API requests
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Handle token refresh on 401 errors
  async handleTokenExpiry(): Promise<boolean> {
    try {
      const token = await this.getToken(true); // Force refresh token
      return !!token; // Return true if we got a new token
    } catch (error) {
      console.error("Failed to handle token expiry:", error);
      return false;
    }
  }

  // Clear token on logout
  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem("userToken");
    } catch (error) {
      console.error("Error clearing token:", error);
    }
  }
}

export default new AuthTokenService();
