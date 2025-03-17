// app/restaurant/[id].tsx
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
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/config/firebase";

const { width } = Dimensions.get("window");

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

export default function RestaurantMenuScreen() {
  const { id } = useLocalSearchParams();
  const { paymentMethod } = usePayment();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("");

  // Calculate total price
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const deliveryFee = restaurant?.deliveryFee ?? 3.99;
  const orderTotal = cartTotal + deliveryFee;

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        
        // Firebase query to get restaurant
        const restaurantRef = doc(db, "restaurants", id as string);
        const restaurantSnap = await getDoc(restaurantRef);
        
        if (restaurantSnap.exists()) {
          const data = restaurantSnap.data();
          setRestaurant({
            id: restaurantSnap.id,
            name: data.name || '',
            image: data.image || '',
            location: data.location || '',
            address: data.address || '',
            cuisines: data.cuisines || [],
            rating: data.rating || 0,
            reviewCount: data.reviewCount || '',
            deliveryTime: data.deliveryTime || '',
            deliveryFee: data.deliveryFee || 0
          } as Restaurant);
          
          // Fetch menu categories
          const menuRef = collection(db, "restaurants", id as string, "menu");
          const menuSnap = await getDocs(menuRef);
          
          const categories: MenuCategory[] = [];
          menuSnap.forEach((doc) => {
            categories.push({
              id: doc.id,
              ...doc.data() as Omit<MenuCategory, 'id'>
            });
          });
          
          // Sort categories
          const sortedCategories = categories.sort((a, b) => a.name.localeCompare(b.name));
          setMenuCategories(sortedCategories);
          
          // Set initial active category
          if (sortedCategories.length > 0) {
            setActiveCategory(sortedCategories[0].id);
          }
        } else {
          console.error("Restaurant not found");
          Alert.alert("Error", "Restaurant not found");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
        Alert.alert("Error", "Failed to load restaurant data");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();

    // Load cart from AsyncStorage
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem(`cart_${id}`);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    };

    loadCart();
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

    try {
      // Save order to AsyncStorage (in a real app, this would be a Firebase call)
      const order = {
        id: `order-${Date.now()}`,
        restaurantId: id,
        restaurantName: restaurant?.name,
        items: cart,
        total: orderTotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        status: "pending",
        timestamp: new Date().toISOString(),
        paymentMethod: paymentMethod,
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
        [{ text: "OK", onPress: () => router.push("/(tabs)/orders") }],
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
          <Text style={styles.loadingText}>Loading menu...</Text>
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
                activeCategory === category.id && styles.activeCategoryButton,
              ]}
              onPress={() => setActiveCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === category.id && styles.activeCategoryText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>
          {menuCategories.find((c) => c.id === activeCategory)?.name || "Menu"}
        </Text>
        {menuCategories.find((c) => c.id === activeCategory)?.items.map(
          (item) => (
            <View key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                <Text style={styles.menuItemDescription}>
                  {item.description}
                </Text>
                <Text style={styles.menuItemPrice}>
                  ${item.price.toFixed(2)}
                </Text>
              </View>
              <View style={styles.quantityControls}>
                {(cart.find((cartItem) => cartItem.id === item.id)?.quantity ??
                0) > 0 ? (
                  <View style={styles.quantityControlsContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => removeFromCart(item.id)}
                    >
                      <Feather name="minus" size={18} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>
                      {cart.find((cartItem) => cartItem.id === item.id)
                        ?.quantity || 0}
                    </Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => addToCart(item)}
                    >
                      <Feather name="plus" size={18} color="black" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addToCart(item)}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ),
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Cart Summary and Checkout */}
      {cart.length > 0 && (
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