// app/services/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://localhost:3000/api";

// Function to get the auth token
const getToken = async () => {
  return await AsyncStorage.getItem("authToken");
};

// Function to set the auth token
export const setToken = async (token: string) => {
  await AsyncStorage.setItem("authToken", token);
};

// Function to clear the auth token (logout)
export const clearToken = async () => {
  await AsyncStorage.removeItem("authToken");
};

// Default headers
const headers = async () => {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Google Sign In
export const googleSignIn = async (idToken: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: await headers(),
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to sign in with Google");
    }

    // Store the token
    await setToken(data.token);

    return data;
  } catch (error) {
    console.error("Google sign in error:", error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await fetch(`${API_URL}/user/profile`, {
      method: "GET",
      headers: await headers(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get user profile");
    }

    return data.user;
  } catch (error) {
    console.error("Get user profile error:", error);
    throw error;
  }
};

// Get restaurants
export const getRestaurants = async () => {
  try {
    const response = await fetch(`${API_URL}/restaurants`, {
      method: "GET",
      headers: await headers(),
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
};

// Create new order
export const createOrder = async (orderData: {
  restaurantId: number;
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string;
  notes?: string;
}) => {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: await headers(),
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
};

// Get user orders
export const getUserOrders = async () => {
  try {
    const response = await fetch(`${API_URL}/user/orders`, {
      method: "GET",
      headers: await headers(),
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
};

// Get delivery requests
export const getDeliveryRequests = async () => {
  try {
    const response = await fetch(`${API_URL}/delivery/requests`, {
      method: "GET",
      headers: await headers(),
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
};

// Accept delivery request
export const acceptDeliveryRequest = async (orderId: string) => {
  try {
    const response = await fetch(`${API_URL}/delivery/accept/${orderId}`, {
      method: "POST",
      headers: await headers(),
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
};

// Update order status
export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: "PUT",
      headers: await headers(),
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
};
