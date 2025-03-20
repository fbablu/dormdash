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
}

const defaultOrderContext: OrderContextType = {
  orders: [],
  isOrdersLoading: false,
  activeDeliveries: [],
  availableDeliveryRequests: [],
  isDeliveryLoading: false,
  isOnlineForDelivery: false,
  refreshOrders: async () => {},
  refreshDeliveries: async () => {},
  placeOrder: async () => "",
  cancelOrder: async () => false,
  acceptDelivery: async () => false,
  updateDeliveryStatus: async () => false,
  toggleDeliveryMode: () => {},
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

  // Get user orders
  const refreshOrders = async () => {
    if (!isSignedIn || !user) return;

    try {
      setIsOrdersLoading(true);

      // Try to get orders from Firestore first
      try {
        const orderQuery = query(
          collection(db, "orders"),
          where("customerId", "==", user.id),
          orderBy("timestamp", "desc"),
        );
        const querySnapshot = await getDocs(orderQuery);
        const userOrders: Order[] = [];

        querySnapshot.forEach((doc) => {
          userOrders.push({ id: doc.id, ...doc.data() } as Order);
        });

        if (userOrders.length > 0) {
          setOrders(userOrders);
          setIsOrdersLoading(false);
          return;
        }
      } catch (firestoreError) {
        console.error("Firestore orders query failed:", firestoreError);
      }

      // Fallback to AsyncStorage
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const allOrders = JSON.parse(ordersJson) as Order[];
        const userOrders = allOrders.filter(
          (order) => order.customerId === user.id,
        );
        setOrders(userOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  // Refresh delivery information
  const refreshDeliveries = async () => {
    if (!isSignedIn || !isOnlineForDelivery || !user) return;

    try {
      setIsDeliveryLoading(true);

      // Get active deliveries for this user from Firestore
      try {
        const deliveriesQuery = query(
          collection(db, "orders"),
          where("delivererId", "==", user.id),
          where("status", "in", ["accepted", "picked_up"]),
        );
        const deliveriesSnapshot = await getDocs(deliveriesQuery);
        const deliveries: Order[] = [];

        deliveriesSnapshot.forEach((doc) => {
          deliveries.push({ id: doc.id, ...doc.data() } as Order);
        });

        if (deliveries.length > 0) {
          setActiveDeliveries(deliveries);
          // Continue to get available requests
          await getAvailableRequests();
          return;
        }
      } catch (firestoreError) {
        console.error("Firestore deliveries query failed:", firestoreError);
      }

      // Fallback to AsyncStorage for active deliveries
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const allOrders = JSON.parse(ordersJson) as Order[];
        // Filter for orders the user is delivering
        const userDeliveries = allOrders.filter(
          (order) =>
            (order.status === "accepted" || order.status === "picked_up") &&
            order.delivererId === user.id,
        );
        setActiveDeliveries(userDeliveries);
      } else {
        setActiveDeliveries([]);
      }

      // Get available delivery requests
      await getAvailableRequests();
    } catch (error) {
      console.error("Error fetching delivery information:", error);
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
    status: Order["status"],
  ): Promise<boolean> => {
    if (!isSignedIn || !user) return false;

    try {
      // Try to update in Firestore first
      try {
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await getDoc(orderRef);

        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          // Check if this user is the deliverer
          if (orderData.delivererId !== user.id) {
            return false;
          }

          // Update status
          await setDoc(
            orderRef,
            { status, updatedAt: new Date().toISOString() },
            { merge: true },
          );
        }
      } catch (firestoreError) {
        console.error(
          "Error updating delivery status in Firestore:",
          firestoreError,
        );
      }

      // Update in AsyncStorage as backup
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const allOrders = JSON.parse(ordersJson) as Order[];
        // Update the specific order
        const updatedOrders = allOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        );

        // Save back to AsyncStorage
        await AsyncStorage.setItem(
          "dormdash_orders",
          JSON.stringify(updatedOrders),
        );
      }

      // If delivered, remove from active deliveries
      if (status === "delivered") {
        setActiveDeliveries((prev) =>
          prev.filter((delivery) => delivery.id !== orderId),
        );
      } else {
        // Otherwise update the status
        setActiveDeliveries((prev) =>
          prev.map((delivery) =>
            delivery.id === orderId ? { ...delivery, status } : delivery,
          ),
        );
      }
      return true;
    } catch (error) {
      console.error("Error updating delivery status:", error);
      return false;
    }
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
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;
