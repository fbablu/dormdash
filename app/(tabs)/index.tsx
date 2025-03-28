// app/(tabs)/index.tsx
// Contributors: @Fardeen Bablu @Rushi Patel
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
import { useCart } from "../context/CartContext";
import AddressSelector from "@/components/AddressSelector";

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
  const { user } = useAuth();

  useEffect(() => {
    checkIfFavorite();
  }, []);

  const checkIfFavorite = async () => {
    try {
      // Use the user from context instead of GoogleSignin
      if (!user) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/users/${user.id}/favorites`,
          {
            headers: {
              Authorization: `Bearer ${await AsyncStorage.getItem("userToken")}`,
            },
          },
        );

        if (response.ok) {
          const responseData = await response.json();
          const favorites = responseData.data || [];
          if (Array.isArray(favorites)) {
            setIsFavorite(favorites.includes(restaurant.name));
          }
          return;
        }

        throw new Error("API request failed");
      } catch (apiError) {
        console.log(
          "API call failed for favorites check, using AsyncStorage fallback",
          apiError,
        );

        // Fallback to AsyncStorage
        const savedFavoritesJson = await AsyncStorage.getItem(
          FAVORITES_STORAGE_KEY,
        );
        if (savedFavoritesJson) {
          const savedFavorites = JSON.parse(savedFavoritesJson);
          const isFav = savedFavorites.some(
            (fav: FavoriteRestaurant) => fav.name === restaurant.name,
          );
          setIsFavorite(isFav);
        }
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const toggleFavorite = async (event: GestureResponderEvent) => {
    // Stop event propagation to prevent navigation when tapping heart icon
    event.stopPropagation();

    try {
      // Use the user from context instead of GoogleSignin
      // TODO: Fix later, this is incorrect because it maps all restaurants as Taco Mama data
      if (!user) {
        Alert.alert("Error", "Please sign in to save favorites");
        return;
      }

      // Try API first
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await AsyncStorage.getItem("userToken")}`,
          },
          body: JSON.stringify({
            userId: user.id,
            restaurantName: restaurant.name,
            action: isFavorite ? "remove" : "add",
          }),
        });

        if (response.ok) {
          setIsFavorite(!isFavorite);
          return;
        }

        throw new Error("API request failed");
      } catch (apiError) {
        console.log(
          "API call failed for toggle favorite, using AsyncStorage fallback",
        );

        // Fallback to AsyncStorage
        let savedFavorites = [];
        try {
          const savedFavoritesJson = await AsyncStorage.getItem(
            FAVORITES_STORAGE_KEY,
          );
          if (savedFavoritesJson) {
            savedFavorites = JSON.parse(savedFavoritesJson);
          }
        } catch (storageError) {
          console.error("Error reading favorites from storage:", storageError);
          savedFavorites = [];
        }

        if (isFavorite) {
          // Remove from favorites
          savedFavorites = savedFavorites.filter(
            (item: FavoriteRestaurant) => item.name !== restaurant.name,
          );
        } else {
          // Add to favorites with additional info
          const newFavorite = {
            name: restaurant.name,
            rating: "4.5", // Default rating
            reviewCount: "100+", // Default
            deliveryTime: "15 min", // Default
            deliveryFee: "$3", // Default
            imageUrl: FOOD_IMAGE_URL, // Use the same food image URL
          };

          // Check if it already exists
          const existingIndex = savedFavorites.findIndex(
            (item: FavoriteRestaurant) => item.name === restaurant.name,
          );
          if (existingIndex === -1) {
            savedFavorites.push(newFavorite);
          }
        }

        // Save updated favorites
        await AsyncStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(savedFavorites),
        );

        // Update state
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorites");
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
        router.push(`../app/restaurant/[id].tsx`);
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
  const { cartItems } = useCart();

  useEffect(() => {
    filterRestaurants();
  }, [searchQuery, selectedCategory]);

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

        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
            Cart Preview
          </Text>
          {cartItems.length === 0 ? (
            <Text style={{ color: "gray" }}>Your cart is empty.</Text>
          ) : (
            cartItems.map((item, index) => (
              <Text key={index}>
                {item.quantity}x {item.name} - ${item.price.toFixed(2)}
              </Text>
            ))
          )}
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
    marginBottom: 5,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
  },
  locationHeaderContainer: {
    padding: 16,
    gap: 12,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D9D9D9",
    padding: 8,
    borderRadius: 24,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "500",
  },
  cartButton: {
    backgroundColor: "#D9D9D9",
    padding: 8,
    borderRadius: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D9D9D9",
    padding: 12,
    borderRadius: 24,
  },
  searchInput: {
    flex: 1,
    color: "#000",
    fontSize: 16,
  },
  categoriesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
  },
  categoryContainer: {
    alignItems: "center",
    gap: 8,
  },
  categoryCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  restaurantsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
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
