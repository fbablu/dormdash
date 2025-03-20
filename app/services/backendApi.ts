// app/services/backendApi.ts
// Contributors: @Fardeen Bablu
// Time spent: 3 hours

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/lib/api/config";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

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

export interface ApiResponse<T> {
  data: T;
  message?: string;
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
): Promise<T> {
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

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);

    // For development/demo purposes - if server is down, use AsyncStorage as fallback
    if ((error as Error).message.includes("Network request failed")) {
      console.log("Using AsyncStorage fallback for:", endpoint);
      return handleOfflineFallback<T>(endpoint, options);
    }

    throw error;
  }
}

// Fallback to AsyncStorage when server is unavailable (for development/demo)
async function handleOfflineFallback<T>(
  endpoint: string,
  options: RequestInit,
): Promise<T> {
  const method = options.method || "GET";

  // Offline handling for authentication
  if (endpoint === "/api/auth/google" && method === "POST") {
    const body = JSON.parse(options.body as string);
    const googleUser = await GoogleSignin.getCurrentUser();

    if (!googleUser) throw new Error("Not signed in with Google");

    const mockUser = {
      id: googleUser.user.id || String(Date.now()),
      name: googleUser.user.name || "Vanderbilt Student",
      email: googleUser.user.email || "",
      image: googleUser.user.photo || "",
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    // Store user data in AsyncStorage as a simple offline database
    await AsyncStorage.setItem("currentUser", JSON.stringify(mockUser));
    const mockToken = "mock-jwt-token-" + Date.now();
    await AsyncStorage.setItem("userToken", mockToken);

    return {
      data: {
        token: mockToken,
        user: mockUser,
      },
    } as unknown as T;
  }

  // Offline handling for user profile
  if (
    endpoint.startsWith("/api/users/") &&
    endpoint.includes("/profile") &&
    method === "GET"
  ) {
    const userData = await AsyncStorage.getItem("currentUser");
    if (!userData) throw new Error("User not found");
    return { data: JSON.parse(userData) } as unknown as T;
  }

  // Offline handling for orders
  if (endpoint === "/api/orders" && method === "GET") {
    const ordersData = await AsyncStorage.getItem("dormdash_orders");
    const orders = ordersData ? JSON.parse(ordersData) : [];
    return { data: orders } as unknown as T;
  }

  // Offline handling for delivery requests
  if (endpoint === "/api/delivery/requests" && method === "GET") {
    const ordersData = await AsyncStorage.getItem("dormdash_orders");
    const orders = ordersData ? JSON.parse(ordersData) : [];

    // Filter for pending orders and transform to delivery requests
    const pendingOrders = orders.filter(
      (order: any) => order.status === "pending",
    );
    const deliveryRequests = pendingOrders.map((order: any) => ({
      id: order.id,
      orderId: order.id,
      customerId: "mock-user-id",
      customerName: "Vanderbilt Student",
      restaurantId: order.restaurantId,
      restaurantName: order.restaurantName,
      deliveryAddress: "Vanderbilt Campus",
      totalAmount: parseFloat(order.total),
      deliveryFee: parseFloat(order.deliveryFee),
      status: "pending",
      notes: order.notes || "",
      createdAt: order.timestamp,
    }));

    return { data: deliveryRequests } as unknown as T;
  }

  throw new Error(`No offline fallback available for ${endpoint}`);
}

// Auth API
export const authApi = {
  loginWithGoogle: async (
    idToken: string,
  ): Promise<ApiResponse<{ token: string; user: User }>> => {
    return fetchWithAuth("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("currentUser");
    await GoogleSignin.signOut();
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

    return fetchWithAuth(`/api/users/${user.id}/profile`);
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    return fetchWithAuth(`/api/users/${user.id}/profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  verifyDorm: async (
    dormCode: string,
  ): Promise<ApiResponse<{ isVerified: boolean }>> => {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    return fetchWithAuth(`/api/users/${user.id}/verify-dorm`, {
      method: "POST",
      body: JSON.stringify({ dormCode }),
    });
  },

  toggleFavorite: async (
    restaurantName: string,
    action: "add" | "remove",
  ): Promise<ApiResponse<{ success: boolean }>> => {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    return fetchWithAuth("/api/users/favorites", {
      method: "POST",
      body: JSON.stringify({
        userId: user.id,
        restaurantName,
        action,
      }),
    });
  },

  getFavorites: async (): Promise<ApiResponse<string[]>> => {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    return fetchWithAuth(`/api/users/${user.id}/favorites`);
  },
};

// Restaurant API
export const restaurantApi = {
  getAllRestaurants: async (): Promise<ApiResponse<Restaurant[]>> => {
    return fetchWithAuth("/api/restaurants");
  },

  getRestaurantById: async (id: string): Promise<ApiResponse<Restaurant>> => {
    return fetchWithAuth(`/api/restaurants/${id}`);
  },

  getRestaurantMenu: async (id: string): Promise<ApiResponse<any>> => {
    return fetchWithAuth(`/api/restaurants/${id}/menu`);
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
      const order = {
        id: `order-${Date.now()}`,
        customerId: user.id,
        ...orderData,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

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
    } catch (error) {
      console.error("Error saving order to AsyncStorage:", error);
    }

    return fetchWithAuth("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        ...orderData,
        customerId: user.id,
      }),
    });
  },

  getUserOrders: async (): Promise<ApiResponse<Order[]>> => {
    // Fallback for offline/demo mode
    try {
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const orders = JSON.parse(ordersJson);
        return { data: orders };
      }
    } catch (error) {
      console.error("Error getting orders from AsyncStorage:", error);
    }

    return fetchWithAuth("/api/user/orders");
  },

  getOrderById: async (id: string): Promise<ApiResponse<Order>> => {
    return fetchWithAuth(`/api/orders/${id}`);
  },

  updateOrderStatus: async (
    orderId: string,
    status: Order["status"],
  ): Promise<ApiResponse<{ success: boolean }>> => {
    // Update in AsyncStorage for offline/demo mode
    try {
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const orders = JSON.parse(ordersJson);
        const updatedOrders = orders.map((order: any) => {
          if (order.id === orderId) {
            return { ...order, status, updatedAt: new Date().toISOString() };
          }
          return order;
        });
        await AsyncStorage.setItem(
          "dormdash_orders",
          JSON.stringify(updatedOrders),
        );
      }
    } catch (error) {
      console.error("Error updating order in AsyncStorage:", error);
    }

    return fetchWithAuth(`/api/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },
};

// Delivery API
export const deliveryApi = {
  getDeliveryRequests: async (): Promise<ApiResponse<DeliveryRequest[]>> => {
    return fetchWithAuth("/api/delivery/requests");
  },

  acceptDeliveryRequest: async (
    orderId: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Update in AsyncStorage for offline/demo mode
    try {
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const orders = JSON.parse(ordersJson);
        const updatedOrders = orders.map((order: any) => {
          if (order.id === orderId) {
            return {
              ...order,
              status: "accepted",
              delivererId: user.id,
              updatedAt: new Date().toISOString(),
            };
          }
          return order;
        });
        await AsyncStorage.setItem(
          "dormdash_orders",
          JSON.stringify(updatedOrders),
        );
      }
    } catch (error) {
      console.error("Error accepting delivery in AsyncStorage:", error);
    }

    return fetchWithAuth(`/api/delivery/accept/${orderId}`, {
      method: "POST",
    });
  },

  getUserDeliveries: async (): Promise<ApiResponse<Order[]>> => {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Get from AsyncStorage for offline/demo mode
    try {
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const orders = JSON.parse(ordersJson);
        const deliveries = orders.filter(
          (order: any) =>
            order.delivererId === user.id &&
            ["accepted", "picked_up"].includes(order.status),
        );
        return { data: deliveries };
      }
    } catch (error) {
      console.error("Error getting deliveries from AsyncStorage:", error);
    }

    return fetchWithAuth("/api/user/deliveries");
  },
};

// Export a unified API object
const backendApi = {
  auth: authApi,
  user: userApi,
  restaurant: restaurantApi,
  order: orderApi,
  delivery: deliveryApi,
};

export default backendApi;
