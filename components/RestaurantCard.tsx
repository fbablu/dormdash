// components/RestaurantCard.tsx
// Contributor: @Fardeen Bablu
// time spent: 45 minutes

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  GestureResponderEvent,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useAuth } from "@/app/context/AuthContext";
import { API_BASE_URL, favoritesApi } from "@/lib/api/config";

// Constants
const FAVORITES_STORAGE_KEY = "dormdash_favorites";
const FOOD_IMAGE_URL =
  "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop";

// Types
interface Restaurant {
  name: string;
  location: string;
  address: string;
  website: string;
  cuisine: string[];
  acceptsCommodoreCash: boolean;
}

interface FavoriteRestaurant {
  name: string;
  rating: string;
  reviewCount: string;
  deliveryTime: string;
  deliveryFee: string;
  imageUrl: string;
}

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    checkIfFavorite();
  }, [user?.id, restaurant.name]);

  const checkIfFavorite = async () => {
    if (!user) return;

    try {
      // Try AsyncStorage first (faster response)
      const savedFavoritesJson = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (savedFavoritesJson) {
        const savedFavorites = JSON.parse(savedFavoritesJson);
        const isFav = savedFavorites.some(
          (fav: FavoriteRestaurant) => fav.name === restaurant.name
        );
        setIsFavorite(isFav);
      }
      
      // Try to sync with API in background
      if (user.id) {
        favoritesApi.getFavorites(user.id)
          .then(apiFavorites => {
            const isFav = apiFavorites.includes(restaurant.name);
            setIsFavorite(isFav);
            
            // Update local storage with API data
            if (apiFavorites.length > 0) {
              syncFavoritesToStorage(apiFavorites);
            }
          })
          .catch(err => {
            // Silently fail on API errors - we're already using local data
            console.log("Background API sync failed:", err);
          });
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const syncFavoritesToStorage = async (favoriteNames: string[]) => {
    try {
      const savedFavoritesJson = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      let savedFavorites: FavoriteRestaurant[] = savedFavoritesJson 
        ? JSON.parse(savedFavoritesJson) 
        : [];
      
      // Create new favorites entries for any API favorites not in local storage
      const localFavoriteNames = savedFavorites.map(fav => fav.name);
      const newFavorites = favoriteNames
        .filter(name => !localFavoriteNames.includes(name))
        .map(name => ({
          name,
          rating: "4.5",
          reviewCount: "100+",
          deliveryTime: "15 min",
          deliveryFee: "$3",
          imageUrl: FOOD_IMAGE_URL
        }));
      
      if (newFavorites.length > 0) {
        const updatedFavorites = [...savedFavorites, ...newFavorites];
        await AsyncStorage.setItem(
          FAVORITES_STORAGE_KEY, 
          JSON.stringify(updatedFavorites)
        );
      }
    } catch (error) {
      console.error("Error syncing favorites to storage:", error);
    }
  };

  const toggleFavorite = async (event: GestureResponderEvent) => {
    // Stop event propagation to prevent navigation when tapping heart icon
    event.stopPropagation();

    if (!user) {
      Alert.alert("Error", "Please sign in to save favorites");
      return;
    }

    if (isProcessing) return; // Prevent duplicate requests

    setIsProcessing(true);
    
    // Update state immediately for responsive UI
    setIsFavorite(!isFavorite);

    try {
      // Update locally first
      const savedFavoritesJson = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      let savedFavorites = savedFavoritesJson ? JSON.parse(savedFavoritesJson) : [];

      if (isFavorite) {
        // Remove from favorites
        savedFavorites = savedFavorites.filter(
          (item: FavoriteRestaurant) => item.name !== restaurant.name
        );
      } else {
        // Add to favorites with additional info
        const newFavorite = {
          name: restaurant.name,
          rating: "4.5",
          reviewCount: "100+",
          deliveryTime: "15 min",
          deliveryFee: "$3",
          imageUrl: FOOD_IMAGE_URL,
        };

        // Check if it already exists
        const existingIndex = savedFavorites.findIndex(
          (item: FavoriteRestaurant) => item.name === restaurant.name
        );
        
        if (existingIndex === -1) {
          savedFavorites.push(newFavorite);
        }
      }

      // Save updated favorites locally
      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(savedFavorites)
      );

      // Try to sync with API
      if (user.id) {
        const action = isFavorite ? "remove" : "add";
        
        favoritesApi.toggleFavorite(user.id, restaurant.name, action)
          .catch(apiError => {
            console.log(`API favorites sync failed for ${action}:`, apiError);
            // API error doesn't affect local operation, so no need to revert UI
          });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert UI state on error
      setIsFavorite(isFavorite);
      Alert.alert("Error", "Failed to update favorites");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => {
        // Generate ID from restaurant name for routing
        const id = restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
        router.push(`/restaurant/${id}`);
      }}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: FOOD_IMAGE_URL }}
        style={styles.restaurantImage}
        resizeMode="cover"
        defaultSource={require("@/assets/icons/splash-icon-light.png")}
      />
      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <TouchableOpacity
            onPress={toggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isProcessing}
          >
            <Feather
              name="heart"
              size={20}
              color={isFavorite ? "#ff0000" : "#ddd"}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.restaurantDetails} numberOfLines={1}>
          {restaurant.location} • {restaurant.cuisine.join(", ")}
        </Text>
        <Text style={styles.deliveryInfo}>
          {restaurant.acceptsCommodoreCash ? "Accepts Commodore Cash" : "Cash & Card Only"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  restaurantCard: {
    width: "100%",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  restaurantImage: {
    width: "100%",
    height: 150,
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  restaurantDetails: {
    fontSize: 14,
    color: "gray",
    marginTop: 4,
  },
  deliveryInfo: {
    fontSize: 14,
    color: "gray",
    marginTop: 2,
  },
});

export default RestaurantCard;