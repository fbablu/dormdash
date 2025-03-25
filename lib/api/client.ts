// lib/api/client.ts
import { API_BASE_URL } from "./config";
import authTokenService from "@/app/services/authTokenService";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Generic API request function with token handling and retry on expiration
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  try {
    // Check if API is disabled to avoid useless network requests
    const apiDisabled = await AsyncStorage.getItem("api_disabled");
    if (apiDisabled === "true") {
      throw new Error("API is disabled");
    }
    
    // Get auth headers
    const headers = await authTokenService.getAuthHeaders();
    
    // Set timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    // Format endpoint to ensure it starts with a slash
    const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    
    // Make the request
    const response = await fetch(`${API_BASE_URL}${formattedEndpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...((options.headers as Record<string, string>) || {}),
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Handle token expiration
    if (response.status === 401 && retry) {
      console.log("Token expired, attempting refresh and retry");
      const refreshed = await authTokenService.handleTokenExpiry();
      
      if (refreshed) {
        // Retry the request with the new token
        return apiRequest<T>(endpoint, options, false); // Only retry once
      }
    }
    
    if (!response.ok) {
      // Mark API as disabled if we get a server error
      if (response.status === 0 || response.status >= 500) {
        await AsyncStorage.setItem("api_disabled", "true");
      }
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Parse response
    const data = await response.json();
    return data as T;
  } catch (error: any) {
    // Log the error but keep it simple
    console.log(`API Request failed: ${error.message || "Unknown error"}`);
    throw error;
  }
}