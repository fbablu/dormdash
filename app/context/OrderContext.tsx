// app/context/OrderContext.tsx
// Contributors: Fardeen Bablu
// Time spent: 3 hours

import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from "uuid";
import { router } from "expo-router";
import syncManager from "../utils/syncUtils";

// Define order interfaces
interface OrderItem {
  id: string;
  name: string;
  price: number;
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

interface DeliveryRequest {
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
  notes?: string;
  deliveryAddress?: string;
}

interface OrderContextType {
  // Order state
  orders: Order[];
  isOrdersLoading: boolean;

  // Delivery state
  activeDeliveries: Order[];
  availableDeliveryRequests: DeliveryRequest[];
  isDeliveryLoading: boolean;
  isOnlineForDelivery: boolean;
  isUserDelivering: () => boolean; // Add this line

  // Functions
  refreshOrders: () => Promise<void>;
  refreshDeliveries: () => Promise<void>;
  placeOrder: (orderData: any) => Promise<string>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  acceptDelivery: (orderId: string) => Promise<boolean>;
  updateDeliveryStatus: (
    orderId: string,
    status: Order["status"],
  ) => Promise<boolean>;
  toggleDeliveryMode: (isOnline: boolean) => void;

  // Missing state and functions - Assuming their types
  selectedDelivery: Order | null;
  setSelectedDelivery: React.Dispatch<React.SetStateAction<Order | null>>;
  showMap: boolean;
  setShowMap: React.Dispatch<React.SetStateAction<boolean>>;
}

const defaultOrderContext: OrderContextType = {
  orders: [],
  isOrdersLoading: false,
  activeDeliveries: [],
  availableDeliveryRequests: [],
  isDeliveryLoading: false,
  isOnlineForDelivery: false,
  isUserDelivering: () => false, // Added default implementation
  refreshOrders: async () => {},
  refreshDeliveries: async () => {},
  placeOrder: async () => "",
  cancelOrder: async () => false,
  acceptDelivery: async () => false,
  updateDeliveryStatus: async () => false,
  toggleDeliveryMode: () => {},
  selectedDelivery: null,
  setSelectedDelivery: () => {},
  showMap: false,
  setShowMap: () => {},
};

const OrderContext = createContext<OrderContextType>(defaultOrderContext);

export const useOrders = () => useContext(OrderContext);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isSignedIn, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);
  const [availableDeliveryRequests, setAvailableDeliveryRequests] = useState<
    DeliveryRequest[]
  >([]);
  const [isDeliveryLoading, setIsDeliveryLoading] = useState(false);
  const [isOnlineForDelivery, setIsOnlineForDelivery] = useState(false);

  // State variables that were missing
  const [selectedDelivery, setSelectedDelivery] = useState<Order | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);

  // Load initial data when signed in
  useEffect(() => {
    if (isSignedIn) {
      refreshOrders();
    }
  }, [isSignedIn]);

  // Refresh delivery requests when online mode changes
  useEffect(() => {
    if (isSignedIn && isOnlineForDelivery) {
      refreshDeliveries();
    }
  }, [isSignedIn, isOnlineForDelivery]);

  const refreshOrders = async () => {
    if (!isSignedIn || !user) return;

    try {
      setIsOrdersLoading(true);

      // Add this line to sync with Firebase first
      if (user.id) {
        await syncManager.syncOrders(user.id);
      }

      // Rest of the existing function...
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");

      if (!ordersJson) {
        setOrders([]);
        setIsOrdersLoading(false);
        return;
      }

      const allOrders = JSON.parse(ordersJson) as Order[];
      const userOrders = allOrders.filter(
        (order) => order.customerId === user.id,
      );
      setOrders(userOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  // Similarly update refreshDeliveries
  const refreshDeliveries = async () => {
    if (!isSignedIn || !isOnlineForDelivery || !user) return;

    try {
      setIsDeliveryLoading(true);

      // Add this line to sync with Firebase first
      if (user.id) {
        await syncManager.syncDeliveries(user.id);
      }

      // Rest of the existing function...
    } catch (error) {
      console.error("Error fetching delivery information:", error);
    } finally {
      setIsDeliveryLoading(false);
    }
  };
  // Place a new order
  const placeOrder = async (orderData: any): Promise<string> => {
    if (!isSignedIn || !user)
      throw new Error("User must be signed in to place an order");

    try {
      const orderId = `order-${Date.now()}`;
      const timestamp = new Date().toISOString();
      const fullOrderData = {
        id: orderId,
        customerId: user.id,
        ...orderData,
        status: "pending",
        timestamp: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Try to save to Firestore first
      try {
        await setDoc(doc(db, "orders", orderId), fullOrderData);
      } catch (firestoreError) {
        console.error("Error saving order to Firestore:", firestoreError);
      }

      // Save to AsyncStorage as backup
      const existingOrdersJson = await AsyncStorage.getItem("dormdash_orders");
      const existingOrders = existingOrdersJson
        ? JSON.parse(existingOrdersJson)
        : [];
      const updatedOrders = [fullOrderData, ...existingOrders];
      await AsyncStorage.setItem(
        "dormdash_orders",
        JSON.stringify(updatedOrders),
      );

      // Refresh the orders list
      refreshOrders();
      return orderId;
    } catch (error) {
      console.error("Error placing order:", error);
      throw error;
    }
  };

  // Cancel an order
  const cancelOrder = async (orderId: string): Promise<boolean> => {
    if (!isSignedIn || !user) return false;

    try {
      // Try to update in Firestore first
      try {
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await getDoc(orderRef);

        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          // Check if this user owns the order
          if (orderData.customerId !== user.id) {
            return false;
          }

          // Update status
          await setDoc(
            orderRef,
            { status: "cancelled", updatedAt: new Date().toISOString() },
            { merge: true },
          );
        }
      } catch (firestoreError) {
        console.error("Error cancelling order in Firestore:", firestoreError);
      }

      // Update in AsyncStorage as backup
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const allOrders = JSON.parse(ordersJson) as Order[];
        // Update the specific order
        const updatedOrders = allOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: "cancelled" as const }
            : order,
        );

        // Save back to AsyncStorage
        await AsyncStorage.setItem(
          "dormdash_orders",
          JSON.stringify(updatedOrders),
        );
      }

      // Refresh orders
      refreshOrders();
      return true;
    } catch (error) {
      console.error("Error cancelling order:", error);
      return false;
    }
  };

  // Accept a delivery request
  const acceptDelivery = async (orderId: string): Promise<boolean> => {
    if (!isSignedIn || !isOnlineForDelivery || !user) return false;

    try {
      // Try to update in Firestore first
      try {
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await getDoc(orderRef);

        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          // Check if order is still available
          if (orderData.status !== "pending" || orderData.delivererId) {
            return false;
          }

          // Update the order
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

      // Update in AsyncStorage as backup
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const allOrders = JSON.parse(ordersJson) as Order[];
        // Update the specific order
        const updatedOrders = allOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: "accepted" as const, delivererId: user.id }
            : order,
        );

        // Save back to AsyncStorage
        await AsyncStorage.setItem(
          "dormdash_orders",
          JSON.stringify(updatedOrders),
        );
      }

      // Refresh deliveries
      refreshDeliveries();
      return true;
    } catch (error) {
      console.error("Error accepting delivery:", error);
      return false;
    }
  };

  // Update delivery status
  const updateDeliveryStatus = async (
    orderId: string,
    newStatus: Order["status"],
  ): Promise<boolean> => {
    try {
      if (!isSignedIn || !user) return false;

      // Get affected order to find the customer ID
      let customerId = null;

      // Get all orders
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (!ordersJson) return false;

      const allOrders = JSON.parse(ordersJson) as Order[];

      // Find the order to get its customer ID
      const orderToUpdate = allOrders.find((order) => order.id === orderId);
      if (orderToUpdate) {
        customerId = orderToUpdate.customerId;
      }

      // Update the specific order
      const updatedOrders = allOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order,
      );

      // Save back to AsyncStorage
      await AsyncStorage.setItem(
        "dormdash_orders",
        JSON.stringify(updatedOrders),
      );

      // If delivered, remove from active deliveries
      if (newStatus === "delivered") {
        setActiveDeliveries((prev) =>
          prev.filter((delivery) => delivery.id !== orderId),
        );
        setSelectedDelivery(null);
        setShowMap(false);
      } else {
        // Otherwise update the status
        setActiveDeliveries((prev) =>
          prev.map((delivery) =>
            delivery.id === orderId
              ? { ...delivery, status: newStatus }
              : delivery,
          ),
        );

        // Update selected delivery if it's the one being updated
        if (selectedDelivery && selectedDelivery.id === orderId) {
          setSelectedDelivery((prev) =>
            prev ? { ...prev, status: newStatus } : null,
          );
        }
      }

      // Refresh orders to ensure both customer and deliverer see updated status
      refreshOrders();

      return true;
    } catch (error) {
      console.error("Error updating delivery status:", error);
      return false;
    }
  };

  const isUserDelivering = (): boolean => {
    return activeDeliveries.length > 0;
  };

  // Toggle delivery mode
  const toggleDeliveryMode = (isOnline: boolean) => {
    setIsOnlineForDelivery(isOnline);
    if (isOnline) {
      refreshDeliveries();
    } else {
      // Clear delivery data when going offline
      setAvailableDeliveryRequests([]);
    }
  };

  // Helper function to get available delivery requests
  const getAvailableRequests = async () => {
    if (!user) {
      setIsDeliveryLoading(false);
      return;
    }

    try {
      // Try Firestore first
      try {
        const requestsQuery = query(
          collection(db, "orders"),
          where("status", "==", "pending"),
          where("delivererId", "==", null),
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const requests: DeliveryRequest[] = [];

        requestsSnapshot.forEach((doc) => {
          const requestData = doc.data();
          requests.push({
            id: doc.id,
            ...requestData,
          } as DeliveryRequest);
        });

        if (requests.length > 0) {
          // Filter out user's own orders
          const filteredRequests = requests.filter(
            (request) => request.customerId !== user.id,
          );
          setAvailableDeliveryRequests(filteredRequests);
          setIsDeliveryLoading(false);
          return;
        }
      } catch (firestoreError) {
        console.error(
          "Firestore delivery requests query failed:",
          firestoreError,
        );
      }

      // Fallback to AsyncStorage
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const allOrders = JSON.parse(ordersJson) as Order[];
        // Filter for pending orders with no deliverer
        const pendingOrders = allOrders.filter(
          (order) => order.status === "pending" && !order.delivererId,
        );

        // Filter out the user's own orders
        const filteredRequests = pendingOrders.filter(
          (order) => order.customerId !== user.id,
        );

        setAvailableDeliveryRequests(filteredRequests);
      } else {
        setAvailableDeliveryRequests([]);
      }
    } catch (error) {
      console.error("Error fetching delivery requests:", error);
    } finally {
      setIsDeliveryLoading(false);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        isOrdersLoading,
        activeDeliveries,
        availableDeliveryRequests,
        isDeliveryLoading,
        isOnlineForDelivery,
        refreshOrders,
        refreshDeliveries,
        placeOrder,
        cancelOrder,
        acceptDelivery,
        updateDeliveryStatus,
        toggleDeliveryMode,
        isUserDelivering,
        selectedDelivery,
        setSelectedDelivery,
        showMap,
        setShowMap,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;
