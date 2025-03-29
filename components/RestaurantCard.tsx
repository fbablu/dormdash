// app/components/RestaurantCard.tsx
// Contributor: @Fardeen Bablu
// Time spent: 1 hour

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
import { router } from "expo-router";
import { useAuth } from "@/app/context/AuthContext";
import favoritesApi from "@/app/services/favoritesApi";

// Constants
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

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check favorite status when component mounts
    const checkStatus = async () => {
      if (user) {
        const status = await favoritesApi.isFavorite(restaurant.name);
        setIsFavorite(status);
      }
    };

    checkStatus();
  }, [restaurant.name, user]);

  const toggleFavorite = async (event: GestureResponderEvent) => {
    // Stop event propagation
    event.stopPropagation();

    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to save favorites");
      return;
    }

    if (isProcessing) return; // Prevent duplicate requests
    setIsProcessing(true);

    try {
      // Update UI immediately for responsive feel
      setIsFavorite(!isFavorite);

      // Add or remove from favorites
      let success = false;
      if (isFavorite) {
        success = await favoritesApi.removeFavorite(restaurant.name);
      } else {
        success = await favoritesApi.addFavorite({
          name: restaurant.name,
          imageUrl: FOOD_IMAGE_URL,
        });
      }

      if (!success) {
        // If operation failed, revert UI state
        setIsFavorite(isFavorite);
        Alert.alert(
          "Error",
          `Failed to ${isFavorite ? "remove from" : "add to"} favorites`,
        );
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
        // Fixed navigation to use proper route path instead of file path
        router.push(`/restaurant/${id}`);
      }}
    >
      <Image
        source={{ uri: FOOD_IMAGE_URL }}
        style={styles.restaurantImage}
        resizeMode="cover"
        defaultSource={require("../../assets/icons/splash-icon-light.png")}
      />
      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
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
        <Text style={styles.restaurantDetails}>
          {restaurant.location} • {restaurant.cuisine.join(", ")}
        </Text>
        <Text style={styles.deliveryFee}>Accepts Commodore Cash</Text>
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
  },
  restaurantDetails: {
    fontSize: 14,
    color: "gray",
    marginTop: 4,
  },
  deliveryFee: {
    fontSize: 14,
    color: "gray",
    marginTop: 2,
  },
});

export default RestaurantCard;
