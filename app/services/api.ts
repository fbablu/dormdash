// app/services/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://127.0.0.1:3000/api";

async function getAuthToken() {
  try {
    return await AsyncStorage.getItem("userToken");
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // User profile
  getUserProfile: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/profile`);
  },

  // Favorites
  getUserFavorites: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/favorites`);
  },

  toggleFavorite: async (userId: string, restaurantName: string, action: "add" | "remove") => {
    return fetchWithAuth("/users/favorites", {
      method: "POST",
      body: JSON.stringify({ userId, restaurantName, action }),
    });
  },

  // Google Sign In
  googleSignIn: async (idToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign in with Google");
      }

      // Store both token and userId
      await AsyncStorage.setItem("authToken", data.token);
      await AsyncStorage.setItem("userId", data.user.id);

      return data;
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  },

  // Get restaurants
  getRestaurants: async () => {
    try {
      const response = await fetch(`${BASE_URL}/restaurants`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get restaurants");
      }

      return data.restaurants;
    } catch (error) {
      console.error("Get restaurants error:", error);
      throw error;
    }
  },

  // Create new order
  createOrder: async (orderData: {
    restaurantId: number;
    totalAmount: number;
    deliveryFee: number;
    deliveryAddress: string;
    notes?: string;
  }) => {
    try {
      const response = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      return data;
    } catch (error) {
      console.error("Create order error:", error);
      throw error;
    }
  },

  // Get user orders
  getUserOrders: async () => {
    try {
      const response = await fetch(`${BASE_URL}/user/orders`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get user orders");
      }

      return data.orders;
    } catch (error) {
      console.error("Get user orders error:", error);
      throw error;
    }
  },

  // Get delivery requests
  getDeliveryRequests: async () => {
    try {
      const response = await fetch(`${BASE_URL}/delivery/requests`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get delivery requests");
      }

      return data.deliveryRequests;
    } catch (error) {
      console.error("Get delivery requests error:", error);
      throw error;
    }
  },

  // Accept delivery request
  acceptDeliveryRequest: async (orderId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/delivery/accept/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept delivery request");
      }

      return data;
    } catch (error) {
      console.error("Accept delivery request error:", error);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: string) => {
    try {
      const response = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update order status");
      }

      return data;
    } catch (error) {
      console.error("Update order status error:", error);
      throw error;
    }
  },
};

export default api;
