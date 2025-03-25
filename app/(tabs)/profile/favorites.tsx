// app/(tabs)/profile/favorites.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Color } from "@/GlobalStyles";
import { useAuth } from "@/app/context/AuthContext";
import favoritesApi, { FavoriteRestaurant } from "@/app/services/favoritesApi";

// Image URL constant
const FOOD_IMAGE_URL =
  "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop";

export default function FavoritesScreen() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the dedicated favorites API
      const favorites = await favoritesApi.getFavorites();
      console.log("Loaded favorites:", favorites.length);
      setFavorites(favorites);
    } catch (err) {
      console.error("Error loading favorites:", err);
      setError("Failed to load favorites");
      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
            style: "cancel",
          },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                // Update UI immediately
                setFavorites(prev => 
                  prev.filter(restaurant => restaurant.name !== restaurantName)
                );

                // Use the favorites API to remove
                const success = await favoritesApi.removeFavorite(restaurantName);
                
                if (!success) {
                  // If failed, reload to get accurate state
                  loadFavorites();
                  Alert.alert("Error", "Failed to remove favorite");
                }
              } catch (error) {
                console.error("Error removing favorite:", error);
                // Reload to sync state
                loadFavorites();
                Alert.alert("Error", "Failed to remove favorite");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error with remove favorite dialog:", error);
      Alert.alert("Error", "Failed to process request");
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const renderRestaurantCard = ({ item }: { item: FavoriteRestaurant }) => (
    <View style={styles.restaurantCard}>
      <Image
        source={{
          uri: item.imageUrl || FOOD_IMAGE_URL,
        }}
        style={styles.restaurantImage}
        defaultSource={require("@/assets/icons/splash-icon-light.png")}
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
        <Text style={styles.deliveryFee}>{item.deliveryFee} Delivery min</Text>
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
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.colorBurlywood} />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={50} color="#ff6b6b" />
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFavorites}>
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Color.colorBurlywood]}
                tintColor={Color.colorBurlywood}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="heart" size={50} color="#ddd" />
                <Text style={styles.emptyText}>
                  No favorite restaurants yet
                </Text>
                <Text style={styles.emptySubtext}>
                  Tap the heart icon on any restaurant to add it to your favorites
                </Text>
                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => router.replace("/")}
                >
                  <Text style={styles.exploreButtonText}>
                    Explore Restaurants
                  </Text>
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
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
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
  },
});