// app/services/favoritesApi.ts
// Contributor: @Fardeen Bablu
// Time spent: 30 minutes

import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

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
  // Get favorites with proper sync between Firebase and AsyncStorage
  getFavorites: async (): Promise<FavoriteRestaurant[]> => {
    try {
      // First try to load from local storage for immediate UI response
      const localFavorites = await loadFavoritesFromStorage();

      // Try to get user ID for Firebase
      const userId = await AsyncStorage.getItem("userId");

      if (userId) {
        try {
          // Try fetching from Firebase
          const userRef = doc(db, "users", userId);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists() && userDoc.data().favorites) {
            const firebaseFavorites = userDoc.data().favorites;

            // Transform to full restaurant objects
            const updatedFavorites =
              await transformToRestaurantObjects(firebaseFavorites);

            // Save to AsyncStorage and return
            await AsyncStorage.setItem(
              FAVORITES_STORAGE_KEY,
              JSON.stringify(updatedFavorites),
            );
            return updatedFavorites;
          }
        } catch (error) {
          console.log("Firebase fetch failed, using local storage:", error);
        }
      }

      // Return local favorites as fallback
      return localFavorites;
    } catch (error) {
      console.error("Error getting favorites:", error);
      return [];
    }
  },

  // Add favorite with sync between Firebase and AsyncStorage
  addFavorite: async (restaurant: {
    name: string;
    imageUrl?: string;
  }): Promise<boolean> => {
    try {
      // First add to local storage for immediate UI update
      const currentFavorites = await loadFavoritesFromStorage();

      // Check if already exists
      if (currentFavorites.some((fav) => fav.name === restaurant.name)) {
        return true; // Already favorited
      }

      // Create new favorite object
      const newFavorite: FavoriteRestaurant = {
        name: restaurant.name,
        rating: "4.5", // Default rating
        reviewCount: "100+", // Default
        deliveryTime: "15 min", // Default
        deliveryFee: "$3", // Default
        imageUrl:
          restaurant.imageUrl ||
          "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop",
      };

      // Add to local array and save to storage
      const updatedFavorites = [...currentFavorites, newFavorite];
      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(updatedFavorites),
      );

      // Sync with Firebase if possible
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        try {
          const userRef = doc(db, "users", userId);
          const userDoc = await getDoc(userRef);

          const favorites =
            userDoc.exists() && userDoc.data().favorites
              ? [...userDoc.data().favorites, restaurant.name]
              : [restaurant.name];

          await setDoc(userRef, { favorites }, { merge: true });
        } catch (error) {
          console.log("Firebase add favorite failed:", error);
          // Already updated AsyncStorage, so still return success
        }
      }

      return true;
    } catch (error) {
      console.error("Error adding favorite:", error);
      return false;
    }
  },

  // Remove favorite with sync
  removeFavorite: async (restaurantName: string): Promise<boolean> => {
    try {
      // First update local storage for immediate UI response
      const currentFavorites = await loadFavoritesFromStorage();
      const updatedFavorites = currentFavorites.filter(
        (fav) => fav.name !== restaurantName,
      );

      // Save updated list
      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(updatedFavorites),
      );

      // Sync with Firebase
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        try {
          const userRef = doc(db, "users", userId);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists() && userDoc.data().favorites) {
            const favorites = userDoc
              .data()
              .favorites.filter((name: string) => name !== restaurantName);

            await setDoc(userRef, { favorites }, { merge: true });
          }
        } catch (error) {
          console.log("Firebase remove favorite failed:", error);
          // Already updated AsyncStorage, so still return success
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
      return favorites.some((fav) => fav.name === restaurantName);
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return false;
    }
  },
};

// Helper function to load favorites from AsyncStorage
async function loadFavoritesFromStorage(): Promise<FavoriteRestaurant[]> {
  try {
    const savedFavoritesJson = await AsyncStorage.getItem(
      FAVORITES_STORAGE_KEY,
    );
    return savedFavoritesJson ? JSON.parse(savedFavoritesJson) : [];
  } catch (error) {
    console.error("Error loading favorites from storage:", error);
    return [];
  }
}

// Helper function to transform restaurant names to full objects
async function transformToRestaurantObjects(
  restaurantNames: string[],
): Promise<FavoriteRestaurant[]> {
  // First get existing favorites to preserve metadata
  const existingFavorites = await loadFavoritesFromStorage();

  // Map restaurant names to full objects
  return restaurantNames.map((name) => {
    // Try to find existing favorite with this name
    const existingFav = existingFavorites.find((f) => f.name === name);
    if (existingFav) return existingFav;

    // Create new default object if not found
    return {
      name,
      rating: "4.5",
      reviewCount: "100+",
      deliveryTime: "15 min",
      deliveryFee: "$3",
      imageUrl:
        "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop",
    };
  });
}

export default favoritesApi;
