// lib/api/config.ts
// Contributor: @Fardeen Bablu
// Time spent: 45 minutes

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define a flag to disable API calls completely if server is not running
export const API_DISABLED = false;

// Export the API base URL - configure properly for different platforms
export const API_BASE_URL = Platform.select({
  ios: "http://127.0.0.1:3000", // iOS simulator local loopback
  android: "http://10.0.2.2:3000", // Android emulator redirect to host loopback
  default: "http://localhost:3000", // Web/browser default
});

// Favorites API module
export const favoritesApi = {
  getFavorites: async (userId: string): Promise<string[]> => {
    try {
      const response = await apiRequest<{ data: string[] }>(
        `/api/users/${userId}/favorites`,
      );
      return response.data;
    } catch (error) {
      console.log("Error fetching favorites:", error);
      throw error;
    }
  },

  toggleFavorite: async (
    userId: string,
    restaurantName: string,
    action: "add" | "remove",
  ): Promise<boolean> => {
    try {
      await apiRequest("/api/users/favorites", {
        method: "POST",
        body: JSON.stringify({ userId, restaurantName, action }),
      });
      return true;
    } catch (error) {
      console.log(
        `Error ${action === "add" ? "adding" : "removing"} favorite:`,
        error,
      );
      throw error;
    }
  },
};

export const checkApiHealth = () => {
  // Return fake healthy status for Expo Go
  return Promise.resolve({ status: "healthy" });
};
/**
 * Generic API request function that first checks if the API is disabled
 * to avoid making requests when we know they'll fail
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    // Check if API is disabled to avoid useless network requests
    const apiDisabled = await AsyncStorage.getItem("api_disabled");
    if (apiDisabled === "true" || API_DISABLED) {
      throw new Error("API is disabled");
    }

    // Get auth token if available
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      // Only add auth header if we have a token
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (err) {
      console.log("Error getting auth token");
    }

    // Set timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    // Format endpoint to ensure it starts with a slash
    const formattedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

    // Make the request
    const response = await fetch(`${API_BASE_URL}${formattedEndpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Mark API as disabled if we get a connection error
      if (response.status === 0 || response.status >= 500) {
        await AsyncStorage.setItem("api_disabled", "true");
      }
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Parse response
    const data = await response.json();
    return data as T;
  } catch (error: any) {
    // Don't log full details, just reduce to a simple message
    console.log(`API Request failed: ${error.message || "Unknown error"}`);
    throw error;
  }
}

export const initializeApiStatus = () => {
  const isExpoGo = true;

  if (isExpoGo) {
    console.log("API health checks disabled in Expo Go preview");
    return;
  }
  checkApiHealth();
};
