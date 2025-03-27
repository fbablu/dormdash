// app/utils/createTestOrders.ts
// Contributor: @Fardeen Bablu
// Time spent: 30 minutes

import AsyncStorage from "@react-native-async-storage/async-storage";
import restaurants from "@/data/ton_restaurants.json";
import dorms from "@/data/dorms.json";

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  totalAmount: string;
  deliveryFee: string;
  status: "pending" | "accepted" | "picked_up" | "delivered" | "cancelled";
  timestamp: string;
  paymentMethod: string;
  delivererId?: string;
  notes?: string;
  deliveryAddress?: string;
}

// Default menu items for creating mock orders
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: "item1", name: "Cheeseburger", price: 8.99 },
  { id: "item2", name: "French Fries", price: 3.99 },
  { id: "item3", name: "Chicken Sandwich", price: 9.99 },
  { id: "item4", name: "Caesar Salad", price: 7.99 },
  { id: "item5", name: "Chocolate Milkshake", price: 4.99 },
  { id: "item6", name: "Onion Rings", price: 4.49 },
  { id: "item7", name: "Grilled Chicken Bowl", price: 11.99 },
  { id: "item8", name: "Veggie Burger", price: 10.99 },
];

// Generate a random order
export const generateRandomOrder = (userId: string): Order => {
  // Pick a random restaurant
  const restaurant =
    restaurants[Math.floor(Math.random() * restaurants.length)];

  // Pick a random delivery address (dorm)
  const dorm = dorms[Math.floor(Math.random() * dorms.length)];

  // Generate 1-4 random items
  const itemCount = Math.floor(Math.random() * 4) + 1;
  const items: OrderItem[] = [];

  for (let i = 0; i < itemCount; i++) {
    const menuItem =
      DEFAULT_MENU_ITEMS[Math.floor(Math.random() * DEFAULT_MENU_ITEMS.length)];
    const quantity = Math.floor(Math.random() * 2) + 1;

    // Check if item already exists in order
    const existingItemIndex = items.findIndex(
      (item) => item.id === menuItem.id,
    );

    if (existingItemIndex >= 0) {
      // Increase quantity if item already in order
      items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      items.push({
        ...menuItem,
        quantity,
      });
    }
  }

  // Calculate total amount
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = 3.99;
  const totalAmount = subtotal + deliveryFee;

  // Generate random order ID
  const orderId = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Random timestamp within the last 24 hours
  const timestamp = new Date(
    Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000),
  );

  return {
    id: orderId,
    customerId: userId,
    restaurantId: restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    restaurantName: restaurant.name,
    items,
    totalAmount: totalAmount.toFixed(2),
    deliveryFee: deliveryFee.toFixed(2),
    status: "pending",
    timestamp: timestamp.toISOString(),
    paymentMethod: Math.random() > 0.5 ? "Commodore Cash" : "Credit Card",
    deliveryAddress: dorm.name,
    notes:
      Math.random() > 0.7 ? "Please bring extra napkins and utensils!" : "",
  };
};

// Create test orders
export const createTestOrders = async (
  userId: string,
  count: number = 5,
): Promise<void> => {
  try {
    // Get existing orders
    const ordersJson = await AsyncStorage.getItem("dormdash_orders");
    const existingOrders: Order[] = ordersJson ? JSON.parse(ordersJson) : [];

    // Generate new orders
    const newOrders: Order[] = [];

    for (let i = 0; i < count; i++) {
      newOrders.push(generateRandomOrder(userId));
    }

    // Combine and save
    const updatedOrders = [...newOrders, ...existingOrders];
    await AsyncStorage.setItem(
      "dormdash_orders",
      JSON.stringify(updatedOrders),
    );

    console.log(`Created ${count} test orders for user ${userId}`);
  } catch (error) {
    console.error("Error creating test orders:", error);
  }
};

export default {
  createTestOrders,
  generateRandomOrder,
};
