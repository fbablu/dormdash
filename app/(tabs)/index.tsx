// app/(tabs)/index.tsx
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import restaurants from "@/data/ton_restaurants.json";

const { width } = Dimensions.get("window");

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

// LocationHeader Component
const LocationHeader = ({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (query: string) => void }) => (
  <View style={styles.locationHeaderContainer}>
    <View style={styles.locationHeader}>
      <View style={styles.locationSelector}>
        <Feather name="map-pin" size={20} color="black" />
        <Text style={styles.locationText}>Vanderbilt Campus</Text>
        <Feather name="chevron-down" size={20} color="black" />
      </View>
      <TouchableOpacity style={styles.cartButton}>
        <Feather name="shopping-cart" size={24} color="black" />
      </TouchableOpacity>
    </View>
    <View style={styles.searchBar}>
      <Feather name="search" size={20} color="gray" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search Taste of Nashville"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  </View>
);

// CategoryIcon Component
const CategoryIcon: React.FC<CategoryIconProps> = ({ name, color, iconName, onPress }) => (
  <TouchableOpacity style={styles.categoryContainer} onPress={onPress}>
    <View style={[styles.categoryCircle, { backgroundColor: color }]}>
      <Feather name={iconName} size={24} color="black" />
    </View>
    <Text style={styles.categoryText}>{name}</Text>
  </TouchableOpacity>
);

// RestaurantCard Component
const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
  <TouchableOpacity style={styles.restaurantCard}>
    <Image 
      source={{ uri: 'https://via.placeholder.com/400x320' }} 
      style={styles.restaurantImage} 
    />
    <View style={styles.restaurantInfo}>
      <View style={styles.restaurantHeader}>
        <Text style={styles.restaurantName}>{restaurant.name}</Text>
        <TouchableOpacity>
          <Feather name="heart" size={20} color="black" />
        </TouchableOpacity>
      </View>
      <Text style={styles.restaurantDetails}>
        {restaurant.location} • {restaurant.cuisine.join(", ")}
      </Text>
      <Text style={styles.deliveryFee}>Accepts Commodore Cash</Text>
    </View>
  </TouchableOpacity>
);

// Main Component
export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState(restaurants);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    filterRestaurants();
  }, [searchQuery, selectedCategory]);

  const filterRestaurants = () => {
    let filtered = restaurants;

    if (searchQuery) {
      filtered = filtered.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(restaurant =>
        restaurant.cuisine.some(c => c.toLowerCase() === selectedCategory.toLowerCase())
      );
    }

    setFilteredRestaurants(filtered);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <LocationHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        
        <View style={styles.categoriesContainer}>
          <CategoryIcon 
            name="Pizza" 
            color="#FFE55C" 
            iconName="pie-chart"
            onPress={() => setSelectedCategory(selectedCategory === "Pizza" ? null : "Pizza")}
          />
          <CategoryIcon 
            name="Asian" 
            color="#FF5C5C" 
            iconName="box"
            onPress={() => setSelectedCategory(selectedCategory === "Asian" ? null : "Asian")}
          />
          <CategoryIcon 
            name="Coffee" 
            color="#CFAE70" 
            iconName="coffee"
            onPress={() => setSelectedCategory(selectedCategory === "Coffee" ? null : "Coffee")}
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
