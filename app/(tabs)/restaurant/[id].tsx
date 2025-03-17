// app/(tabs)/restaurant/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Color } from '@/GlobalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePayment } from '@/app/context/PaymentContext';

// Sample menu items based on Taco Mama menu
const MENU_CATEGORIES = [
  {
    id: 'burritos',
    name: 'Burritos',
    items: [
      { id: 'yo-mama', name: 'Yo Mama', description: 'Ground beef, shredded cheddar, lettuce, tomato, sour cream with side of queso', price: 9.99 },
      { id: 'big-client', name: 'The Big Client', description: 'Barbacoa (braised beef), refried beans, queso, shredded cheddar, tomatoes, mild salsa ranchera', price: 10.99 },
      { id: 'judge', name: 'The Judge', description: 'Marinated chicken, black beans, cilantro-lime rice, shredded cheddar, lettuce, mild salsa ranchera, creamy cilantro pesto', price: 10.49 },
      { id: 'q-burrito', name: 'Q-Burrito', description: 'Roasted pulled barbacoa, ancho chile slaw, pickles, homemade chipotle BBQ sauce', price: 11.99 },
    ]
  },
  {
    id: 'tacos',
    name: 'Tacos',
    items: [
      { id: 'classico-beef', name: 'Classico Beef', description: 'Ground beef, shredded cheddar, lettuce, tomato, sour cream', price: 8.99 },
      { id: 'cheezy-beef', name: 'Cheezy Beef', description: 'Barbacoa (braised beef), tomatoes, onions, cilantro, queso, lettuce, queso fresco, mild salsa ranchera', price: 9.49 },
      { id: 'mayor', name: 'The Mayor', description: 'Marinated chicken, lettuce, tomatoes, creamy-cilantro pesto, queso fresco', price: 8.99 },
      { id: 'sizzler', name: 'The Sizzler', description: 'Grilled steak tenderloin, grilled onions, avocado, lettuce, tomatoes, red chile butter sauce, queso fresco', price: 10.99 },
    ]
  },
  {
    id: 'sides',
    name: 'Sides',
    items: [
      { id: 'street-corn', name: 'Street Corn', description: 'Grilled corn with chile, lime and queso fresco', price: 4.99 },
      { id: 'ancho-slaw', name: 'Ancho Chile Slaw', description: 'Fresh cabbage with ancho chile dressing', price: 3.99 },
      { id: 'rice', name: 'Cilantro-Lime Rice', description: 'Rice with fresh cilantro and lime', price: 3.49 },
      { id: 'mac', name: 'Mexican Mac & Cheese', description: 'Macaroni with queso and mild spices', price: 4.49 },
    ]
  },
  {
    id: 'drinks',
    name: 'Drinks',
    items: [
      { id: 'margarita', name: 'Mi Casa Margarita', description: 'House margarita with fresh lime', price: 7.99 },
      { id: 'beer', name: 'Imported Beer', description: 'Selection of imported beers', price: 5.99 },
      { id: 'soda', name: 'Fountain Drink', description: 'Assorted sodas', price: 2.49 },
      { id: 'water', name: 'Bottled Water', description: 'Purified water', price: 1.99 },
    ]
  }
];

// Mock restaurant data
const RESTAURANT_DATA = {
  'taco-mama': {
    id: 'taco-mama',
    name: 'Taco Mama',
    image: 'https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop',
    location: 'HILLSBORO VILLAGE',
    address: '2119 Belcourt Ave. Nashville, TN 37212',
    cuisines: ['Mexican', 'Tacos'],
    rating: 4.5,
    reviewCount: '200+',
    deliveryTime: '15-25 min',
    deliveryFee: 3.99,
  }
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Helper function to get restaurant by ID (will be replaced with API call)
const getRestaurantById = (id: string) => {
  return RESTAURANT_DATA[id as keyof typeof RESTAURANT_DATA] || null;
};

export default function RestaurantMenuScreen() {
  const { id } = useLocalSearchParams();
  const { paymentMethod } = usePayment();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('burritos');

  // Calculate total price
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = restaurant?.deliveryFee ?? 3.99;
  const orderTotal = cartTotal + deliveryFee;

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
          const data = getRestaurantById(id as string);
          if (data) {
            setRestaurant(data);
          } else {
            Alert.alert('Error', 'Restaurant not found');
            router.back();
          }
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        Alert.alert('Error', 'Failed to load restaurant data');
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
        console.error('Error loading cart:', error);
      }
    };
    
    loadCart();
  }, [id]);

  const addToCart = (item: any) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(cartItem => cartItem.id === item.id);
      
      let newCart;
      if (existingItem) {
        // Increase quantity if item already exists
        newCart = currentCart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 } 
            : cartItem
        );
      } else {
        // Add new item
        newCart = [...currentCart, { ...item, quantity: 1 }];
      }
      
      // Save to AsyncStorage
      AsyncStorage.setItem(`cart_${id}`, JSON.stringify(newCart))
        .catch(err => console.error('Error saving cart:', err));
      
      return newCart;
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === itemId);
      
      let newCart;
      if (existingItem && existingItem.quantity > 1) {
        // Decrease quantity
        newCart = currentCart.map(item => 
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        );
      } else {
        // Remove item completely
        newCart = currentCart.filter(item => item.id !== itemId);
      }
      
      // Save to AsyncStorage
      AsyncStorage.setItem(`cart_${id}`, JSON.stringify(newCart))
        .catch(err => console.error('Error saving cart:', err));
      
      return newCart;
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checking out.');
      return;
    }

    try {
      // Save order to AsyncStorage (in a real app, this would be an API call)
      const order = {
        id: `order-${Date.now()}`,
        restaurantId: id,
        restaurantName: restaurant?.name,
        items: cart,
        total: orderTotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        status: 'pending',
        timestamp: new Date().toISOString(),
        paymentMethod: paymentMethod
      };

      // Get existing orders
      const existingOrdersJson = await AsyncStorage.getItem('dormdash_orders');
      const existingOrders = existingOrdersJson ? JSON.parse(existingOrdersJson) : [];
      
      // Add new order and save
      const updatedOrders = [order, ...existingOrders];
      await AsyncStorage.setItem('dormdash_orders', JSON.stringify(updatedOrders));
      
      // Clear cart
      await AsyncStorage.removeItem(`cart_${id}`);
      setCart([]);
      
      // Show success and navigate
      Alert.alert(
        'Order Placed!', 
        'Your order has been placed successfully. You can view it in your orders tab.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/orders') }]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
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
          defaultSource={require('@/assets/icons/splash-icon-light.png')}
        />
        <View style={styles.restaurantDetails}>
          <Text style={styles.location}>{restaurant?.location}</Text>
          <Text style={styles.address}>{restaurant?.address}</Text>
          <View style={styles.ratingContainer}>
            <Feather name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{restaurant?.rating}</Text>
            <Text style={styles.reviewCount}>({restaurant?.reviewCount} reviews)</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.deliveryTime}>{restaurant?.deliveryTime}</Text>
          </View>
        </View>
      </View>

      {/* Category Selector */}
      <ScrollView horizontal style={styles.categorySelector} showsHorizontalScrollIndicator={false}>
        {MENU_CATEGORIES.map(category => (
          <TouchableOpacity 
            key={category.id}
            style={[
              styles.categoryButton,
              activeCategory === category.id && styles.activeCategoryButton
            ]}
            onPress={() => setActiveCategory(category.id)}
          >
            <Text style={[
              styles.categoryText,
              activeCategory === category.id && styles.activeCategoryText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>
          {MENU_CATEGORIES.find(c => c.id === activeCategory)?.name}
        </Text>
        {MENU_CATEGORIES.find(c => c.id === activeCategory)?.items.map(item => (
          <View key={item.id} style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemDescription}>{item.description}</Text>
              <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.quantityControls}>
              {cart.find(cartItem => cartItem.id === item.id)?.quantity ?? 0 > 0 ? (
                <View style={styles.quantityControlsContainer}>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => removeFromCart(item.id)}
                  >
                    <Feather name="minus" size={18} color="black" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>
                    {cart.find(cartItem => cartItem.id === item.id)?.quantity || 0}
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
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Cart Summary and Checkout */}
      {cart.length > 0 && (
        <View style={styles.cartSummary}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartItemCount}>{cart.reduce((total, item) => total + item.quantity, 0)} items</Text>
            <Text style={styles.cartTotal}>${orderTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  coverImage: {
    width: '100%',
    height: 150,
  },
  restaurantInfo: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  restaurantDetails: {
    padding: 16,
  },
  location: {
    fontSize: 16,
    fontWeight: '500',
  },
  address: {
    color: '#666',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reviewCount: {
    color: '#666',
    marginLeft: 4,
  },
  dot: {
    marginHorizontal: 6,
    color: '#666',
  },
  deliveryTime: {
    color: '#666',
  },
  categorySelector: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeCategoryButton: {
    backgroundColor: Color.colorBurlywood,
  },
  categoryText: {
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#fff',
  },
  menuContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItemDescription: {
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  menuItemPrice: {
    fontWeight: '500',
  },
  quantityControls: {
    justifyContent: 'center',
    minWidth: 90,
  },
  quantityControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: Color.colorBurlywood,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 100,
  },
  cartSummary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartInfo: {
    justifyContent: 'center',
  },
  cartItemCount: {
    color: '#666',
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: Color.colorBurlywood,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});