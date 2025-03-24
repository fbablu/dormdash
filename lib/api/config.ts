// lib/api/config.ts
// Contributor: @Fardeen Bablu
// time spent: 30 minutes

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL = Platform.select({
  ios: "http://127.0.0.1:3000",
  android: "http://10.0.2.2:3000", 
  default: "http://localhost:3000",
});

/**
 * Checks if the API server is running and reachable
 * @returns Promise<boolean> True if the API is available, false otherwise
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    // Use an AbortController to set a timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

/**
 * Check connection with detailed debugging
 * @param endpoint The API endpoint to test
 * @param options Additional fetch options
 * @returns Response data and status information
 */
export const checkApiEndpoint = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data?: any; error?: string }> => {
  try {
    console.log(`Checking endpoint: ${API_BASE_URL}${endpoint}`);
    
    // Set default headers and merge with any provided headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    
    // Set timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    // Make the request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Try to parse response as JSON
    let data;
    let responseText;
    try {
      responseText = await response.text();
      data = JSON.parse(responseText);
    } catch (e) {
      data = responseText;
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data: data
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      error: error.message || 'Unknown error'
    };
  }
};

/**
 * Generic API request function with better error handling
 * @param endpoint The API endpoint to request
 * @param options Fetch options
 * @returns Promise with response data
 */
export async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    // Get auth token if available
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    
    try {
      // Only add auth header if we have a token
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (err) {
      console.log('Error getting auth token:', err);
    }
    
    // Set timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    // Format endpoint to ensure it starts with a slash
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Make the request with detailed logging
    console.log(`API Request: ${API_BASE_URL}${formattedEndpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${formattedEndpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Parse response
    const data = await response.json();
    return data as T;
  } catch (error: any) {
    console.error('API Request failed:', error.message || 'Unknown error');
    throw error;
  }
}

/**
 * Favorites API to manage favorite restaurants
 */
export const favoritesApi = {
  /**
   * Retrieve the list of favorite restaurant names for a user
   * @param userId The user ID
   * @returns Promise<string[]> List of restaurant names
   */
  getFavorites: async (userId: string): Promise<string[]> => {
    const { ok, data, error } = await checkApiEndpoint(`/favorites/${userId}`, {
      method: "GET",
    });
    if (ok && Array.isArray(data)) {
      return data;
    }
    console.error("Failed to fetch favorites:", error);
    return [];
  },

  /**
   * Toggle a favorite restaurant for a user
   * @param userId The user ID
   * @param restaurantName The restaurant name
   * @param action "add" or "remove"
   * @returns Promise with status information
   */
  toggleFavorite: async (
    userId: string, 
    restaurantName: string, 
    action: "add" | "remove"
  ): Promise<{ ok: boolean; status: number; data?: any; error?: string }> => {
    const endpoint = `/favorites/${userId}`;
    const method = action === "add" ? "POST" : "DELETE";
    const body = JSON.stringify({ restaurantName });
    return await checkApiEndpoint(endpoint, { method, body });
  },
};
