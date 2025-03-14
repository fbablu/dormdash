// app/(tabs)/profile/favorites.tsx
// Contributors: @Fardeen Bablu, @Yuening Li
// Time spent: 2 hours

import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Image,
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Color, FontSize } from "@/GlobalStyles";

// Define the restaurant type
interface Restaurant {
  name: string;
  rating: string;
  reviewCount: string;
  deliveryTime: string;
  deliveryFee: string;
  imageUrl: string;
}

// Mock data in case API fails - Using Taste of Nashville restaurants from the app
const MOCK_FAVORITES: Restaurant[] = [
  {
    name: "Bahn Mi & Roll",
    rating: "4.1",
    reviewCount: "200+",
    deliveryTime: "10 min",
    deliveryFee: "$2",
    imageUrl: "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop",
  },
  {
    name: "Sun & Fork",
    rating: "4.5",
    reviewCount: "400+",
    deliveryTime: "15 min",
    deliveryFee: "$5",
    imageUrl: "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop",
  }
];

const FAVORITES_STORAGE_KEY = 'dormdash_favorites';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      // First try to get the userId
      const userId = await AsyncStorage.getItem("userId");
      
      // Try to fetch from API
      if (userId) {
        try {
          const apiResponse = await fetch(`http://localhost:3000/api/users/${userId}/favorites`, {
            headers: {
              'Authorization': `Bearer ${await AsyncStorage.getItem("userToken")}`
            }
          });
          
          if (apiResponse.ok) {
            const data = await apiResponse.json();
            setFavorites(data);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.log("API fetch failed, falling back to AsyncStorage", apiError);
        }
      }
      
      // Fallback to AsyncStorage if API fails
      const savedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      } else {
        // Use mock data if nothing is saved yet
        setFavorites(MOCK_FAVORITES);
        // Save mock data to AsyncStorage for future use
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(MOCK_FAVORITES));
      }
    } catch (err) {
      console.error("Error loading favorites:", err);
      setError("Failed to load favorites");
      // Fallback to mock data on error
      setFavorites(MOCK_FAVORITES);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (restaurantName: string) => {
    try {
      Alert.alert(
        "Remove Favorite",
        `Are you sure you want to remove ${restaurantName} from your favorites?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              const updatedFavorites = favorites.filter(
                restaurant => restaurant.name !== restaurantName
              );
              setFavorites(updatedFavorites);
              
              // Update AsyncStorage
              await AsyncStorage.setItem(
                FAVORITES_STORAGE_KEY, 
                JSON.stringify(updatedFavorites)
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error removing favorite:", error);
      Alert.alert("Error", "Failed to remove favorite");
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const renderRestaurantCard = ({ item }: { item: Restaurant }) => (
    <View style={styles.restaurantCard}>
      <Image
        source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop" }}
        style={styles.restaurantImage}
        defaultSource={require('@/assets/icons/splash-icon-light.png')}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <TouchableOpacity 
            onPress={() => handleRemoveFavorite(item.name)}
            style={styles.heartButton}
          >
            <Feather name="heart" size={22} color="#ff0000" />
          </TouchableOpacity>
        </View>
        <Text style={styles.restaurantDetails}>
          {item.rating}★ ({item.reviewCount}) • {item.deliveryTime}
        </Text>
        <Text style={styles.deliveryFee}>
          {item.deliveryFee} Delivery min
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.heading}>Saved Restaurants</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.colorBurlywood} />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={50} color="#ff6b6b" />
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadFavorites}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.introContainer}>
            <Text style={styles.introText}>
              Your favorite restaurants from Taste of Nashville are saved here for quick access.
            </Text>
          </View>
          
          <FlatList
            data={favorites}
            renderItem={renderRestaurantCard}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="heart" size={50} color="#ddd" />
                <Text style={styles.emptyText}>No favorite restaurants yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap the heart icon on any restaurant to add it to your favorites
                </Text>
                <TouchableOpacity 
                  style={styles.exploreButton}
                  onPress={() => router.replace("/")}
                >
                  <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
                </TouchableOpacity>
              </View>
            }
          />
          
          {favorites.length > 0 && (
            <TouchableOpacity 
              style={styles.orderButton}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.orderButtonText}>Order from favorites</Text>
            </TouchableOpacity>
          )}
        </>
      )}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  introContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
  },
  introText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Extra space for the order button
  },
  restaurantCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantImage: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Color.colorBlack,
  },
  heartButton: {
    padding: 4,
  },
  restaurantDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  deliveryFee: {
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    marginTop: 50,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    maxWidth: 250,
    marginBottom: 20,
  },
  exploreButton: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  exploreButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  orderButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  orderButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  }
});