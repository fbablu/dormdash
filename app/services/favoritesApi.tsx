// app/services/favoritesApi.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/api/client";
import authTokenService from "./authTokenService";

// Storage key
const FAVORITES_STORAGE_KEY = "dormdash_favorites";

// Types
export interface FavoriteRestaurant {
  name: string;
  rating: string;
  reviewCount: string;
  deliveryTime: string;
  deliveryFee: string;
  imageUrl: string;
}

export const favoritesApi = {
  // Get favorites with proper token handling and fallback
  getFavorites: async (): Promise<FavoriteRestaurant[]> => {
    try {
      // First try to load from local storage for immediate UI response
      const localFavorites = await loadFavoritesFromStorage();
      
      // Try to get favorites from server
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        try {
          // Use the improved API client with token refresh
          const response = await apiRequest<{ data: string[] }>(
            `/api/users/${userId}/favorites`
          );
          
          if (response.data && Array.isArray(response.data)) {
            console.log("Server returned favorites:", response.data);
            
            // Convert server's string array to full restaurant objects and sync to storage
            if (response.data.length > 0) {
              // Get existing favorites to preserve metadata
              const existingFavorites = await loadFavoritesFromStorage();
              
              // Map server favorites to full objects
              const updatedFavorites = response.data.map(name => {
                // Try to find existing favorite with this name to preserve its metadata
                const existingFav = existingFavorites.find(f => f.name === name);
                if (existingFav) return existingFav;
                
                // Otherwise create a new favorite with default values
                return {
                  name,
                  rating: "4.5",
                  reviewCount: "100+",
                  deliveryTime: "15 min",
                  deliveryFee: "$3",
                  imageUrl: "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop"
                };
              });
              
              // Save to storage and return
              await AsyncStorage.setItem(
                FAVORITES_STORAGE_KEY,
                JSON.stringify(updatedFavorites)
              );
              return updatedFavorites;
            }
          }
        } catch (apiError) {
          console.log("API fetch failed, using local storage:", apiError);
          // Continue with local storage data
        }
      }
      
      // Return local favorites as fallback
      return localFavorites;
    } catch (error) {
      console.error("Error getting favorites:", error);
      return [];
    }
  },
  
  // Add favorite with token refresh
  addFavorite: async (restaurant: {
    name: string;
    imageUrl?: string;
  }): Promise<boolean> => {
    try {
      // First add to local storage for immediate UI update
      const currentFavorites = await loadFavoritesFromStorage();
      
      // Check if already exists
      if (currentFavorites.some(fav => fav.name === restaurant.name)) {
        return true; // Already favorited
      }
      
      // Create new favorite object
      const newFavorite: FavoriteRestaurant = {
        name: restaurant.name,
        rating: "4.5", // Default rating
        reviewCount: "100+", // Default
        deliveryTime: "15 min", // Default
        deliveryFee: "$3", // Default
        imageUrl: restaurant.imageUrl || 
          "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop"
      };
      
      // Add to array and save to storage
      const updatedFavorites = [...currentFavorites, newFavorite];
      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY, 
        JSON.stringify(updatedFavorites)
      );
      
      // Try to sync with server
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        try {
          // Use apiRequest with token refresh
          await apiRequest(
            `/api/users/favorites`,
            {
              method: "POST",
              body: JSON.stringify({
                userId,
                restaurantName: restaurant.name,
                action: "add"
              })
            }
          );
          console.log(`Added ${restaurant.name} to favorites on server`);
        } catch (apiError) {
          console.log("API add favorite failed (non-blocking):", apiError);
          // Non-blocking - we've already updated local storage
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error adding favorite:", error);
      return false;
    }
  },
  
  // Remove favorite with token refresh
  removeFavorite: async (restaurantName: string): Promise<boolean> => {
    try {
      // First update local storage for immediate UI response
      const currentFavorites = await loadFavoritesFromStorage();
      const updatedFavorites = currentFavorites.filter(
        fav => fav.name !== restaurantName
      );
      
      // Save updated list
      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY, 
        JSON.stringify(updatedFavorites)
      );
      
      // Try to sync with server
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        try {
          // Use apiRequest with token refresh
          await apiRequest(
            `/api/users/favorites`,
            {
              method: "POST",
              body: JSON.stringify({
                userId,
                restaurantName,
                action: "remove"
              })
            }
          );
          console.log(`Removed ${restaurantName} from favorites on server`);
        } catch (apiError) {
          console.log("API remove favorite failed (non-blocking):", apiError);
          // Non-blocking - we've already updated local storage
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error removing favorite:", error);
      return false;
    }
  },
  
  // Check if a restaurant is favorited
  isFavorite: async (restaurantName: string): Promise<boolean> => {
    try {
      const favorites = await loadFavoritesFromStorage();
      return favorites.some(fav => fav.name === restaurantName);
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return false;
    }
  }
};

// Helper function to load favorites from AsyncStorage
async function loadFavoritesFromStorage(): Promise<FavoriteRestaurant[]> {
  try {
    const savedFavoritesJson = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    return savedFavoritesJson ? JSON.parse(savedFavoritesJson) : [];
  } catch (error) {
    console.error("Error loading favorites from storage:", error);
    return [];
  }
}

export default favoritesApi;