// app/(tabs)/index.tsx
// Contributors: @Fardeen Bablu
// Time spent: 3 hours

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  GestureResponderEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import restaurants from "@/data/ton_restaurants.json";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { API_BASE_URL } from "@/lib/api/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import AddressSelector from "@/components/AddressSelector";
import favoritesApi, {
  favoritesEventEmitter,
} from "@/app/services/favoritesApi";
import { loadPartialConfigAsync } from "@babel/core";

const { width } = Dimensions.get("window");

// Use a smaller resolution version of the image to prevent memory issues
const FOOD_IMAGE_URL =
  "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop";

// TypeScript Interfaces
interface Restaurant {
  name: string;
  location: string;
  address: string;
  website: string;
  cuisine: string[];
  acceptsCommodoreCash: boolean;
}

interface CategoryIconProps {
  name: string;
  color: string;
  iconName: keyof typeof Feather.glyphMap;
  onPress: () => void;
}

let hasLoggedAPIError = false;
const LOG_THROTTLE_TIME = 10000;

const FAVORITES_STORAGE_KEY = "dormdash_favorites";

// Add this interface near the top with your other interfaces
interface FavoriteRestaurant {
  name: string;
  rating: string;
  reviewCount: string;
  deliveryTime: string;
  deliveryFee: string;
  imageUrl: string;
}

// LocationHeader Component
const LocationHeader = ({
  searchQuery,
  setSearchQuery,
  onAddressChange,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddressChange?: (address: string) => void;
}) => (
  <View style={styles.locationHeaderContainer}>
    <View style={styles.locationHeader}>
      <AddressSelector onAddressChange={onAddressChange} />
      {/* <TouchableOpacity style={styles.cartButton}>
        <Feather name="shopping-cart" size={24} color="black" />
      </TouchableOpacity> */}
    </View>
    <View style={styles.searchBar}>
      <Feather name="search" size={20} color="gray" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search Taste of Nashville"
        placeholderTextColor="gray"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  </View>
);

// CategoryIcon Component
const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  color,
  iconName,
  onPress,
}) => (
  <TouchableOpacity style={styles.categoryContainer} onPress={onPress}>
    <View style={[styles.categoryCircle, { backgroundColor: color }]}>
      <Feather name={iconName} size={24} color="black" />
    </View>
    <Text style={styles.categoryText}>{name}</Text>
  </TouchableOpacity>
);

// RestaurantCard Component
const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    checkIfFavorite();
  }, []);

  const checkIfFavorite = async () => {
    try {
      if (!user) return;
      const status = await favoritesApi.isFavorite(restaurant.name);
      setIsFavorite(status);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const toggleFavorite = async (event: GestureResponderEvent) => {
    // Stop event propagation to prevent navigation when tapping heart icon
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
        // Generate id from restaurant name
        const id = restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
        console.log(
          `Navigating to restaurant: ${restaurant.name} with ID: ${id}`,
        );
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

// Main Component
export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState(restaurants);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    filterRestaurants();
  }, [searchQuery, selectedCategory]);

  // Add event listener for favorites changes
  useEffect(() => {
    const handleFavoritesChange = (data: {
      action: string;
      restaurantName: string;
    }) => {
      console.log(
        `Favorites changed: ${data.action} for ${data.restaurantName}`,
      );
      setFilteredRestaurants([...filteredRestaurants]);
      filterRestaurants();
    };

    favoritesEventEmitter.addListener(
      "favoritesChanged",
      handleFavoritesChange,
    );

    return () => {
      favoritesEventEmitter.removeAllListeners("favoritesChanged");
    };
  }, [filteredRestaurants]);

  const filterRestaurants = () => {
    let filtered = restaurants;

    if (searchQuery) {
      filtered = filtered.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          restaurant.cuisine.some((c) =>
            c.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((restaurant) =>
        restaurant.cuisine.some(
          (c) => c.toLowerCase() === selectedCategory.toLowerCase(),
        ),
      );
    }

    setFilteredRestaurants(filtered);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Home</Text>
      </View>

      <ScrollView>
        <LocationHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <View style={styles.categoriesContainer}>
          <CategoryIcon
            name="Pizza"
            color="#FFE55C"
            iconName="pie-chart"
            onPress={() =>
              setSelectedCategory(selectedCategory === "Pizza" ? null : "Pizza")
            }
          />
          <CategoryIcon
            name="Asian"
            color="#FF5C5C"
            iconName="box"
            onPress={() =>
              setSelectedCategory(selectedCategory === "Asian" ? null : "Asian")
            }
          />
          <CategoryIcon
            name="Coffee"
            color="#CFAE70"
            iconName="coffee"
            onPress={() =>
              setSelectedCategory(
                selectedCategory === "Coffee" ? null : "Coffee",
              )
            }
          />
          <CategoryIcon
            name="All"
            color="#D9D9D9"
            iconName="grid"
            onPress={() => setSelectedCategory(null)}
          />
        </View>

        <View style={styles.restaurantsSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory || "All Restaurants"}
          </Text>
          <ScrollView>
            {filteredRestaurants.map((restaurant, index) => (
              <RestaurantCard key={index} restaurant={restaurant} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
  },
  locationHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cartButton: {
    padding: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#000",
    fontSize: 16,
  },
  categoriesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
  categoryContainer: {
    alignItems: "center",
  },
  categoryCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  restaurantsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
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
