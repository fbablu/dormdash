// app/restaurant/[id].tsx
// Contributors: Fardeen Bablu
// Time spent: 9 hours

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Color } from "@/GlobalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePayment } from "@/app/context/PaymentContext";
import ReviewsSection from "@/components/restaurant/ReviewsSection";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/app/config/firebase";
import restaurants from "@/data/ton_restaurants.json";
import { useOrders } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";
import { createDemoMenu, hasMenu } from "../utils/RestaurantMenuIntegration";
import RestaurantMenuDisplay from "@/components/RestaurantMenuDisplay";

const { width } = Dimensions.get("window");

// Use a smaller resolution version of the image to prevent memory issues
const FOOD_IMAGE_URL =
  "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface Restaurant {
  id: string;
  name: string;
  image: string;
  location: string;
  address: string;
  cuisines: string[];
  rating: number;
  reviewCount: string;
  deliveryTime: string;
  deliveryFee: number;
}

// Menu categories specific to each restaurant
const getMenuCategoriesForRestaurant = (restaurantId: string) => {
  // Taco Mama menu
  if (restaurantId === "taco-mama") {
    return [
      {
        id: "burritos",
        name: "Burritos",
        items: [
          {
            id: "yo-mama",
            name: "Yo Mama",
            description:
              "Ground beef, shredded cheddar, lettuce, tomato, sour cream with side of queso",
            price: 9.99,
          },
          {
            id: "big-client",
            name: "The Big Client",
            description:
              "Barbacoa (braised beef), refried beans, queso, shredded cheddar, tomatoes, mild salsa ranchera",
            price: 10.99,
          },
          {
            id: "judge",
            name: "The Judge",
            description:
              "Marinated chicken, black beans, cilantro-lime rice, shredded cheddar, lettuce, mild salsa ranchera, creamy cilantro pesto",
            price: 10.49,
          },
          {
            id: "q-burrito",
            name: "Q-Burrito",
            description:
              "Roasted pulled barbacoa, ancho chile slaw, pickles, homemade chipotle BBQ sauce",
            price: 11.99,
          },
        ],
      },
      {
        id: "tacos",
        name: "Tacos",
        items: [
          {
            id: "classico-beef",
            name: "Classico Beef",
            description:
              "Ground beef, shredded cheddar, lettuce, tomato, sour cream",
            price: 8.99,
          },
          {
            id: "cheezy-beef",
            name: "Cheezy Beef",
            description:
              "Barbacoa (braised beef), tomatoes, onions, cilantro, queso, lettuce, queso fresco, mild salsa ranchera",
            price: 9.49,
          },
          {
            id: "mayor",
            name: "The Mayor",
            description:
              "Marinated chicken, lettuce, tomatoes, creamy-cilantro pesto, queso fresco",
            price: 8.99,
          },
          {
            id: "sizzler",
            name: "The Sizzler",
            description:
              "Grilled steak tenderloin, grilled onions, avocado, lettuce, tomatoes, red chile butter sauce, queso fresco",
            price: 10.99,
          },
        ],
      },
      {
        id: "sides",
        name: "Sides",
        items: [
          {
            id: "street-corn",
            name: "Street Corn",
            description: "Grilled corn with chile, lime and queso fresco",
            price: 4.99,
          },
          {
            id: "ancho-slaw",
            name: "Ancho Chile Slaw",
            description: "Fresh cabbage with ancho chile dressing",
            price: 3.99,
          },
          {
            id: "rice",
            name: "Cilantro-Lime Rice",
            description: "Rice with fresh cilantro and lime",
            price: 3.49,
          },
          {
            id: "mac",
            name: "Mexican Mac & Cheese",
            description: "Macaroni with queso and mild spices",
            price: 4.49,
          },
        ],
      },
      {
        id: "drinks",
        name: "Drinks",
        items: [
          {
            id: "margarita",
            name: "Mi Casa Margarita",
            description: "House margarita with fresh lime",
            price: 7.99,
          },
          {
            id: "beer",
            name: "Imported Beer",
            description: "Selection of imported beers",
            price: 5.99,
          },
          {
            id: "soda",
            name: "Fountain Drink",
            description: "Assorted sodas",
            price: 2.49,
          },
          {
            id: "water",
            name: "Bottled Water",
            description: "Purified water",
            price: 1.99,
          },
        ],
      },
    ];
  }
  // Default generic menu
  else {
    return [
      {
        id: "appetizers",
        name: "Appetizers",
        items: [
          {
            id: "app-1",
            name: "House Special Appetizer",
            description: "Our signature starter with seasonal ingredients",
            price: 8.99,
          },
          {
            id: "app-2",
            name: "Mixed Salad",
            description: "Fresh greens with house dressing",
            price: 6.99,
          },
        ],
      },
      {
        id: "entrees",
        name: "Main Courses",
        items: [
          {
            id: "entree-1",
            name: "Chef's Special",
            description:
              "Our most popular dish, prepared with the finest ingredients",
            price: 14.99,
          },
          {
            id: "entree-2",
            name: "House Special Plate",
            description:
              "A delicious combination of flavors unique to our restaurant",
            price: 13.99,
          },
        ],
      },
      {
        id: "sides",
        name: "Sides",
        items: [
          {
            id: "side-1",
            name: "Side Item 1",
            description: "Delicious side to complement any meal",
            price: 3.99,
          },
          {
            id: "side-2",
            name: "Side Item 2",
            description: "Another tasty side option",
            price: 4.49,
          },
        ],
      },
      {
        id: "beverages",
        name: "Beverages",
        items: [
          {
            id: "bev-1",
            name: "Soft Drink",
            description: "Assorted soft drinks",
            price: 2.49,
          },
          {
            id: "bev-2",
            name: "Bottled Water",
            description: "Purified water",
            price: 1.99,
          },
        ],
      },
    ];
  }
};

export default function RestaurantMenuScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { paymentMethod } = usePayment();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [activeTab, setActiveTab] = useState<"menu" | "reviews">("menu");

  const { activeDeliveries } = useOrders();

  const [menuAvailable, setMenuAvailable] = useState(false);

  // Calculate total price
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const deliveryFee = restaurant?.deliveryFee ?? 3.99;
  const orderTotal = cartTotal + deliveryFee;

  useEffect(() => {
    const checkForMenu = async () => {
      if (id) {
        const restaurantId = typeof id === "string" ? id : String(id);
        const hasExistingMenu = await hasMenu(restaurantId);
        setMenuAvailable(hasExistingMenu);

        if (!hasExistingMenu && restaurantId === "blenz-bowls") {
          await createDemoMenu(restaurantId);
          setMenuAvailable(true);
        }
      }
    };

    checkForMenu();
  }, [id]);

  const addToCart = (item: MenuItem) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) => cartItem.id === item.id,
      );

      let newCart;
      if (existingItem) {
        // Increase quantity if item already exists
        newCart = currentCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        );
      } else {
        // Add new item
        newCart = [...currentCart, { ...item, quantity: 1 }];
      }

      // Save to AsyncStorage
      AsyncStorage.setItem(`cart_${id}`, JSON.stringify(newCart)).catch((err) =>
        console.error("Error saving cart:", err),
      );

      return newCart;
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === itemId);

      let newCart;
      if (existingItem && existingItem.quantity > 1) {
        // Decrease quantity
        newCart = currentCart.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item,
        );
      } else {
        // Remove item completely
        newCart = currentCart.filter((item) => item.id !== itemId);
      }

      // Save to AsyncStorage
      AsyncStorage.setItem(`cart_${id}`, JSON.stringify(newCart)).catch((err) =>
        console.error("Error saving cart:", err),
      );

      return newCart;
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert(
        "Empty Cart",
        "Please add items to your cart before checking out.",
      );
      return;
    }

    // Check if the user is currently delivering any orders
    if (activeDeliveries.length > 0) {
      Alert.alert(
        "Delivery in Progress",
        "You cannot place orders while you are delivering an order. Please complete your current delivery first.",
      );
      return;
    }

    try {
      // Save order to AsyncStorage (in a real app, this would be a Firebase call)
      const order = {
        id: `order-${Date.now()}`,
        restaurantId: id,
        restaurantName: restaurant?.name,
        items: cart,
        totalAmount: orderTotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        status: "pending",
        timestamp: new Date().toISOString(),
        paymentMethod: paymentMethod,
        customerId: user?.id,
      };

      // Get existing orders
      const existingOrdersJson = await AsyncStorage.getItem("dormdash_orders");
      const existingOrders = existingOrdersJson
        ? JSON.parse(existingOrdersJson)
        : [];

      // Add new order and save
      const updatedOrders = [order, ...existingOrders];
      await AsyncStorage.setItem(
        "dormdash_orders",
        JSON.stringify(updatedOrders),
      );

      // Clear cart
      await AsyncStorage.removeItem(`cart_${id}`);
      setCart([]);

      // Show success and navigate
      Alert.alert(
        "Order Placed!",
        "Your order has been placed successfully. You can view it in your orders tab.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)/orders") }],
      );
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "Failed to place order. Please try again.");
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.colorBurlywood} />
          <Text style={styles.loadingText}>Loading restaurant...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.restaurantName}>{restaurant?.name}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Restaurant Info */}
      <View style={styles.restaurantInfo}>
        <Image
          source={{ uri: restaurant?.image }}
          style={styles.coverImage}
          defaultSource={require("@/assets/icons/splash-icon-light.png")}
        />
        <View style={styles.restaurantDetails}>
          <Text style={styles.location}>{restaurant?.location}</Text>
          <Text style={styles.address}>{restaurant?.address}</Text>
          <View style={styles.ratingContainer}>
            <Feather name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{restaurant?.rating}</Text>
            <Text style={styles.reviewCount}>
              ({restaurant?.reviewCount} reviews)
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.deliveryTime}>{restaurant?.deliveryTime}</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "menu" && styles.activeTab]}
          onPress={() => setActiveTab("menu")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "menu" && styles.activeTabText,
            ]}
          >
            Menu
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "reviews" && styles.activeTab]}
          onPress={() => setActiveTab("reviews")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "reviews" && styles.activeTabText,
            ]}
          >
            Reviews
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "menu" ? (
        menuAvailable && restaurant ? (
          <>
            {/* Category Selector */}
            <View style={styles.categorySelectorContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {menuCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      activeCategory === category.id &&
                        styles.activeCategoryButton,
                    ]}
                    onPress={() => setActiveCategory(category.id)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        activeCategory === category.id &&
                          styles.activeCategoryText,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Menu Display */}
            <RestaurantMenuDisplay
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
            />
          </>
        ) : (
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 16, color: "gray" }}>
              Menu not available.
            </Text>
          </View>
        )
      ) : (
        <ReviewsSection
          restaurantId={id as string}
          restaurantName={restaurant?.name || "Restaurant"}
        />
      )}

      {/* Cart Summary and Checkout */}
      {cart.length > 0 && activeTab === "menu" && (
        <View style={styles.cartSummary}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartItemCount}>
              {cart.reduce((total, item) => total + item.quantity, 0)} items
            </Text>
            <Text style={styles.cartTotal}>${orderTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  coverImage: {
    width: "100%",
    height: 150,
  },
  restaurantInfo: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  restaurantDetails: {
    padding: 16,
  },
  location: {
    fontSize: 16,
    fontWeight: "500",
  },
  address: {
    color: "#666",
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  rating: {
    fontWeight: "bold",
    marginLeft: 4,
  },
  reviewCount: {
    color: "#666",
    marginLeft: 4,
  },
  dot: {
    marginHorizontal: 6,
    color: "#666",
  },
  deliveryTime: {
    color: "#666",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Color.colorBurlywood,
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    fontWeight: "bold",
    color: Color.colorBurlywood,
  },
  categorySelectorContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  activeCategoryButton: {
    backgroundColor: Color.colorBurlywood,
  },
  categoryText: {
    fontWeight: "500",
    fontSize: 14,
  },
  activeCategoryText: {
    color: "#fff",
  },
  menuContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  menuItemDescription: {
    color: "#666",
    marginTop: 4,
    marginBottom: 8,
  },
  menuItemPrice: {
    fontWeight: "500",
  },
  quantityControls: {
    justifyContent: "center",
    minWidth: 80,
  },
  quantityControlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontWeight: "bold",
    minWidth: 20,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: Color.colorBurlywood,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  bottomPadding: {
    height: 100,
  },
  cartSummary: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartInfo: {
    justifyContent: "center",
  },
  cartItemCount: {
    color: "#666",
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: "bold",
  },
  checkoutButton: {
    backgroundColor: Color.colorBurlywood,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
