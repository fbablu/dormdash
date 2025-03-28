// app/services/backendApi.ts
import React from "react";
import { View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/lib/api/config";
import { mockGoogleSignin } from "../utils/mockAuth";
import {
  doc,
  collection,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Types for our models
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  isVerified?: boolean;
  phone?: string;
  dormLocation?: string;
  isActive?: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  restaurantName: string;
  status: "pending" | "accepted" | "picked_up" | "delivered" | "cancelled";
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string;
  items: OrderItem[];
  notes?: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  delivererId?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DeliveryRequest {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  restaurantId: string;
  restaurantName: string;
  deliveryAddress: string;
  totalAmount: number;
  deliveryFee: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  location: string;
  address: string;
  image?: string;
  cuisines: string[];
  acceptsCommodoreCash: boolean;
  rating?: number;
  reviewCount?: string;
  deliveryTime?: string;
  deliveryFee?: number;
}

// Modify ApiResponse to include array properties for TypeScript compatibility
export interface ApiResponse<T> {
  data: T;
  message?: string;
  [key: string]: any;
}

// Helper functions for HTTP requests
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("userToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! Status: ${response.status}`,
      );
    }

    return (await response.json()) as ApiResponse<T>;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);

    // For development/demo purposes - use Firestore instead if server is down
    if ((error as Error).message.includes("Network request failed")) {
      console.log("Using Firestore/AsyncStorage fallback for:", endpoint);
      return handleFirestoreFallback<T>(endpoint, options);
    }

    throw error;
  }
}

// Fallback to Firestore/AsyncStorage when server is unavailable
async function handleFirestoreFallback<T>(
  endpoint: string,
  options: RequestInit,
): Promise<ApiResponse<T>> {
  const method = options.method || "GET";

  // Offline handling for authentication
  if (endpoint === "/api/auth/google" && method === "POST") {
    const body = JSON.parse(options.body as string);
    const googleUser = await mockGoogleSignin.getCurrentUser();

    if (!googleUser) throw new Error("Not signed in with Google");

    // Create or get the user from Firestore
    try {
      // Check if user exists
      const userRef = doc(db, "users", googleUser.user.id);
      const userDoc = await getDoc(userRef);

      const mockUser = {
        id: googleUser.user.id,
        name: googleUser.user.name || "Vanderbilt Student",
        email: googleUser.user.email || "",
        image: googleUser.user.photo || "",
        isVerified: true,
        createdAt: new Date().toISOString(),
      };

      // If user doesn't exist, create it
      if (!userDoc.exists()) {
        await setDoc(userRef, mockUser);
      }

      // Store user data in AsyncStorage as a simple offline database
      await AsyncStorage.setItem("currentUser", JSON.stringify(mockUser));

      const mockToken = "mock-jwt-token-" + Date.now();
      await AsyncStorage.setItem("userToken", mockToken);

      return {
        data: { token: mockToken, user: mockUser },
      } as ApiResponse<T>;
    } catch (error) {
      console.error("Firestore user creation error:", error);
      throw error;
    }
  }

  // Offline handling for user profile
  if (
    endpoint.startsWith("/api/users/") &&
    endpoint.includes("/profile") &&
    method === "GET"
  ) {
    const userId = endpoint.split("/")[3]; // Extract userId from URL

    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return { data: userDoc.data() } as ApiResponse<T>;
      } else {
        const userData = await AsyncStorage.getItem("currentUser");
        if (!userData) throw new Error("User not found");
        return { data: JSON.parse(userData) } as ApiResponse<T>;
      }
    } catch (error) {
      console.error("Firestore user fetch error:", error);
      const userData = await AsyncStorage.getItem("currentUser");
      if (!userData) throw new Error("User not found");
      return { data: JSON.parse(userData) } as ApiResponse<T>;
    }
  }

  // Offline handling for orders
  if (endpoint === "/api/user/orders" && method === "GET") {
    try {
      const currentUser = await AsyncStorage.getItem("currentUser");
      if (!currentUser) throw new Error("User not found");

      const userId = JSON.parse(currentUser).id;

      // Try to get orders from Firestore
      try {
        const ordersQuery = query(
          collection(db, "orders"),
          where("customerId", "==", userId),
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const orders: any[] = [];

        ordersSnapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() });
        });

        if (orders.length > 0) {
          return { data: orders } as ApiResponse<T>;
        }
      } catch (firestoreError) {
        console.error("Firestore orders fetch error:", firestoreError);
      }

      // Fallback to AsyncStorage
      const ordersData = await AsyncStorage.getItem("dormdash_orders");
      const orders = ordersData ? JSON.parse(ordersData) : [];

      // Filter to only this user's orders
      const userOrders = orders.filter(
        (order: any) => order.customerId === userId,
      );

      return { data: userOrders } as ApiResponse<T>;
    } catch (error) {
      console.error("AsyncStorage orders fetch error:", error);
      throw error;
    }
  }

  // Offline handling for delivery requests
  if (endpoint === "/api/delivery/requests" && method === "GET") {
    try {
      // Try to get pending orders from Firestore
      try {
        const ordersQuery = query(
          collection(db, "orders"),
          where("status", "==", "pending"),
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const pendingOrders: any[] = [];

        ordersSnapshot.forEach((doc) => {
          pendingOrders.push({ id: doc.id, ...doc.data() });
        });

        if (pendingOrders.length > 0) {
          // Transform to delivery requests format
          const deliveryRequests = pendingOrders.map((order) => ({
            id: order.id,
            orderId: order.id,
            customerId: order.customerId,
            customerName: "Vanderbilt Student", // We don't have this info readily available
            restaurantId: order.restaurantId,
            restaurantName: order.restaurantName,
            deliveryAddress: order.deliveryAddress || "Vanderbilt Campus",
            totalAmount: order.totalAmount,
            deliveryFee: order.deliveryFee,
            status: order.status,
            notes: order.notes || "",
            createdAt: order.createdAt,
          }));

          return { data: deliveryRequests } as ApiResponse<T>;
        }
      } catch (firestoreError) {
        console.error(
          "Firestore delivery requests fetch error:",
          firestoreError,
        );
      }

      // Fallback to AsyncStorage
      const ordersData = await AsyncStorage.getItem("dormdash_orders");
      const orders = ordersData ? JSON.parse(ordersData) : [];

      // Filter for pending orders
      const pendingOrders = orders.filter(
        (order: any) => order.status === "pending",
      );

      // Transform to delivery requests format
      const deliveryRequests = pendingOrders.map((order: any) => ({
        id: order.id,
        orderId: order.id,
        customerId: order.customerId || "mock-user-id",
        customerName: "Vanderbilt Student",
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
        deliveryAddress: order.deliveryAddress || "Vanderbilt Campus",
        totalAmount: parseFloat(order.totalAmount),
        deliveryFee: parseFloat(order.deliveryFee),
        status: "pending",
        notes: order.notes || "",
        createdAt: order.timestamp || order.createdAt,
      }));

      return { data: deliveryRequests } as ApiResponse<T>;
    } catch (error) {
      console.error("AsyncStorage delivery requests fetch error:", error);
      throw error;
    }
  }

  throw new Error(`No offline fallback available for ${endpoint}`);
}

// Auth API
export const authApi = {
  loginWithGoogle: async (
    idToken: string,
  ): Promise<ApiResponse<{ token: string; user: User }>> => {
    try {
      return fetchWithAuth<{ token: string; user: User }>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("currentUser");
    await mockGoogleSignin.signOut();
  },

  checkAuth: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem("userToken");
    return !!token;
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const userData = await AsyncStorage.getItem("currentUser");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },
};

// User API
export const userApi = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    return fetchWithAuth<User>(`/api/users/${user.id}/profile`);
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    try {
      // Try to update in Firestore first
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, data, { merge: true });

      // Update local storage
      const currentUserStr = await AsyncStorage.getItem("currentUser");
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        await AsyncStorage.setItem(
          "currentUser",
          JSON.stringify({
            ...currentUser,
            ...data,
          }),
        );
      }
    } catch (error) {
      console.error("Error updating user in Firestore:", error);
    }

    return fetchWithAuth<User>(`/api/users/${user.id}/profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  verifyDorm: async (
    dormCode: string,
  ): Promise<ApiResponse<{ isVerified: boolean }>> => {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    return fetchWithAuth<{ isVerified: boolean }>(
      `/api/users/${user.id}/verify-dorm`,
      {
        method: "POST",
        body: JSON.stringify({ dormCode }),
      },
    );
  },

  toggleFavorite: async (
    restaurantName: string,
    action: "add" | "remove",
  ): Promise<ApiResponse<{ success: boolean }>> => {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    try {
      // Update favorites in AsyncStorage regardless of API success
      const FAVORITES_STORAGE_KEY = "dormdash_favorites";
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

      if (action === "remove") {
        // Remove from favorites
        savedFavorites = savedFavorites.filter(
          (item: any) => item.name !== restaurantName,
        );
      } else {
        // Add to favorites with additional info
        const newFavorite = {
          name: restaurantName,
          rating: "4.5", // Default rating
          reviewCount: "100+", // Default
          deliveryTime: "15 min", // Default
          deliveryFee: "$3", // Default
          imageUrl:
            "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop", // Default image
        };

        // Check if it already exists
        const existingIndex = savedFavorites.findIndex(
          (item: any) => item.name === restaurantName,
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
    } catch (error) {
      console.error("Error updating favorites in local storage:", error);
    }

    return fetchWithAuth<{ success: boolean }>("/api/users/favorites", {
      method: "POST",
      body: JSON.stringify({ userId: user.id, restaurantName, action }),
    });
  },

  getFavorites: async (): Promise<ApiResponse<string[]>> => {
    try {
      const user = await authApi.getCurrentUser();
      if (!user) {
        return { data: [] } as ApiResponse<string[]>;
      }
      return fetchWithAuth<string[]>(`/api/users/${user.id}/favorites`);
    } catch (error) {
      console.log("Error fetching favorites:", error);
      return { data: [] } as ApiResponse<string[]>;
    }
  },
};

export const deliveryApi = {
  getDeliveryRequests: async (): Promise<ApiResponse<DeliveryRequest[]>> => {
    try {
      // Try Firestore first
      try {
        const ordersQuery = query(
          collection(db, "orders"),
          where("status", "==", "pending"),
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const pendingOrders: any[] = [];

        ordersSnapshot.forEach((doc) => {
          pendingOrders.push({ id: doc.id, ...doc.data() });
        });

        if (pendingOrders.length > 0) {
          // Transform to delivery requests format
          const deliveryRequests = pendingOrders.map((order) => ({
            id: order.id,
            orderId: order.id,
            customerId: order.customerId,
            customerName: "Vanderbilt Student", // We don't have this info readily available
            restaurantId: order.restaurantId,
            restaurantName: order.restaurantName,
            deliveryAddress: order.deliveryAddress || "Vanderbilt Campus",
            totalAmount: order.totalAmount,
            deliveryFee: order.deliveryFee,
            status: order.status,
            notes: order.notes || "",
            createdAt: order.createdAt,
          }));

          return { data: deliveryRequests } as ApiResponse<DeliveryRequest[]>;
        }
      } catch (firestoreError) {
        console.error(
          "Firestore delivery requests fetch error:",
          firestoreError,
        );
      }

      // Fallback to AsyncStorage
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const orders = JSON.parse(ordersJson);

        // Filter for pending orders
        const pendingOrders = orders.filter(
          (order: any) => order.status === "pending",
        );

        // Transform to delivery requests format
        const deliveryRequests = pendingOrders.map((order: any) => ({
          id: order.id,
          orderId: order.id,
          customerId: order.customerId || "mock-user-id",
          customerName: "Vanderbilt Student",
          restaurantId: order.restaurantId,
          restaurantName: order.restaurantName,
          deliveryAddress: order.deliveryAddress || "Vanderbilt Campus",
          totalAmount: parseFloat(order.totalAmount),
          deliveryFee: parseFloat(order.deliveryFee),
          status: "pending",
          notes: order.notes || "",
          createdAt: order.timestamp || order.createdAt,
        }));

        return { data: deliveryRequests } as ApiResponse<DeliveryRequest[]>;
      }

      // Try API last
      return fetchWithAuth<DeliveryRequest[]>("/api/delivery/requests");
    } catch (error) {
      console.error("Error getting delivery requests:", error);
      return { data: [] } as ApiResponse<DeliveryRequest[]>;
    }
  },

  acceptDeliveryRequest: async (
    orderId: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    try {
      const user = await authApi.getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      // Update in Firestore first
      try {
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await getDoc(orderRef);

        if (orderDoc.exists()) {
          const orderData = orderDoc.data();

          // Verify order is still pending
          if (orderData.status !== "pending" || orderData.delivererId) {
            return { data: { success: false } } as ApiResponse<{
              success: boolean;
            }>;
          }

          // Update order in Firestore
          await setDoc(
            orderRef,
            {
              status: "accepted",
              delivererId: user.id,
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
        }
      } catch (firestoreError) {
        console.error("Error accepting delivery in Firestore:", firestoreError);
      }

      // Update in AsyncStorage as fallback
      try {
        const ordersJson = await AsyncStorage.getItem("dormdash_orders");
        if (ordersJson) {
          const orders = JSON.parse(ordersJson);

          // Check if order exists and is still pending
          const orderIndex = orders.findIndex((o: any) => o.id === orderId);
          if (orderIndex === -1) {
            return { data: { success: false } } as ApiResponse<{
              success: boolean;
            }>;
          }

          if (
            orders[orderIndex].status !== "pending" ||
            orders[orderIndex].delivererId
          ) {
            return { data: { success: false } } as ApiResponse<{
              success: boolean;
            }>;
          }

          // Update order
          orders[orderIndex] = {
            ...orders[orderIndex],
            status: "accepted",
            delivererId: user.id,
            updatedAt: new Date().toISOString(),
          };

          // Save updated orders
          await AsyncStorage.setItem("dormdash_orders", JSON.stringify(orders));
        }
      } catch (error) {
        console.error("Error accepting delivery in AsyncStorage:", error);
      }

      // Try API last
      return fetchWithAuth<{ success: boolean }>(
        `/api/delivery/accept/${orderId}`,
        {
          method: "POST",
        },
      );
    } catch (error) {
      console.error("Error accepting delivery request:", error);
      return { data: { success: false } } as ApiResponse<{ success: boolean }>;
    }
  },

  getUserDeliveries: async (): Promise<ApiResponse<Order[]>> => {
    try {
      const user = await authApi.getCurrentUser();
      if (!user) {
        return { data: [] } as ApiResponse<Order[]>;
      }

      // Try Firestore first
      try {
        const deliveriesQuery = query(
          collection(db, "orders"),
          where("delivererId", "==", user.id),
          where("status", "in", ["accepted", "picked_up"]),
        );

        const deliveriesSnapshot = await getDocs(deliveriesQuery);
        const deliveries: any[] = [];

        deliveriesSnapshot.forEach((doc) => {
          deliveries.push({ id: doc.id, ...doc.data() });
        });

        if (deliveries.length > 0) {
          return { data: deliveries } as ApiResponse<Order[]>;
        }
      } catch (firestoreError) {
        console.error(
          "Error getting deliveries from Firestore:",
          firestoreError,
        );
      }

      // Fallback to AsyncStorage
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const orders = JSON.parse(ordersJson);

        // Filter for orders the user is delivering
        const deliveries = orders.filter(
          (order: any) =>
            order.delivererId === user.id &&
            ["accepted", "picked_up"].includes(order.status),
        );

        return { data: deliveries } as ApiResponse<Order[]>;
      }

      // Try API last
      return fetchWithAuth<Order[]>("/api/user/deliveries");
    } catch (error) {
      console.error("Error getting user deliveries:", error);
      return { data: [] } as ApiResponse<Order[]>;
    }
  },
};

// Restaurant API
export const restaurantApi = {
  getAllRestaurants: async (): Promise<ApiResponse<Restaurant[]>> => {
    return fetchWithAuth<Restaurant[]>("/api/restaurants");
  },

  getRestaurantById: async (id: string): Promise<ApiResponse<Restaurant>> => {
    return fetchWithAuth<Restaurant>(`/api/restaurants/${id}`);
  },

  getRestaurantMenu: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth<any>(`/api/restaurants/${id}/menu`);
  },
};

// Orders API
export const orderApi = {
  createOrder: async (
    orderData: Omit<
      Order,
      "id" | "customerId" | "status" | "createdAt" | "updatedAt"
    >,
  ): Promise<ApiResponse<{ orderId: string }>> => {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // For offline/demo mode
    try {
      // Create new order with generated ID
      const orderId = `order-${Date.now()}`;
      const order = {
        id: orderId,
        customerId: user.id,
        ...orderData,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        // Try to save to Firestore first
        await setDoc(doc(db, "orders", orderId), order);
      } catch (firestoreError) {
        console.error("Error saving order to Firestore:", firestoreError);
      }

      // Save to AsyncStorage as fallback
      const existingOrdersJson = await AsyncStorage.getItem("dormdash_orders");
      const existingOrders = existingOrdersJson
        ? JSON.parse(existingOrdersJson)
        : [];
      const updatedOrders = [order, ...existingOrders];
      await AsyncStorage.setItem(
        "dormdash_orders",
        JSON.stringify(updatedOrders),
      );

      return { data: { orderId } } as ApiResponse<{ orderId: string }>;
    } catch (error) {
      console.error("Error saving order to AsyncStorage:", error);

      // Attempt to use the API anyway
      return fetchWithAuth<{ orderId: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          ...orderData,
          customerId: user.id,
        }),
      });
    }
  },

  getUserOrders: async (): Promise<ApiResponse<Order[]>> => {
    const user = await authApi.getCurrentUser();
    if (!user) {
      return { data: [] } as ApiResponse<Order[]>;
    }

    try {
      // Try to get orders from Firestore first
      try {
        const ordersQuery = query(
          collection(db, "orders"),
          where("customerId", "==", user.id),
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const orders: any[] = [];

        ordersSnapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() });
        });

        if (orders.length > 0) {
          return { data: orders } as ApiResponse<Order[]>;
        }
      } catch (firestoreError) {
        console.error("Error getting orders from Firestore:", firestoreError);
      }

      // Fallback to AsyncStorage
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const allOrders = JSON.parse(ordersJson);

        // Filter to get only this user's orders
        const userOrders = allOrders.filter(
          (order: any) => order.customerId === user.id,
        );

        return { data: userOrders } as ApiResponse<Order[]>;
      }

      return { data: [] } as ApiResponse<Order[]>;
    } catch (error) {
      console.error("Error getting orders from AsyncStorage:", error);

      // Try API as last resort
      return fetchWithAuth<Order[]>("/api/user/orders");
    }
  },

  getOrderById: async (id: string): Promise<ApiResponse<Order>> => {
    try {
      // First try Firestore
      try {
        const orderRef = doc(db, "orders", id);
        const orderDoc = await getDoc(orderRef);

        if (orderDoc.exists()) {
          return {
            data: { id: orderDoc.id, ...orderDoc.data() } as Order,
          } as ApiResponse<Order>;
        }
      } catch (firestoreError) {
        console.error("Error getting order from Firestore:", firestoreError);
      }

      // Fallback to AsyncStorage
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const orders = JSON.parse(ordersJson);
        const order = orders.find((o: any) => o.id === id);

        if (order) {
          return { data: order as Order } as ApiResponse<Order>;
        }
      }

      // If still not found, try the API
      return fetchWithAuth<Order>(`/api/orders/${id}`);
    } catch (error) {
      console.error("Error getting order:", error);
      throw error;
    }
  },
};

const backendApi: React.FC = () => null;
export default backendApi;
