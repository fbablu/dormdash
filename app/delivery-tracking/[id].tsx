// app/delivery-tracking/[id].tsx
// Contributor: @Fardeen Bablu
// Time spent: 3.5 hours

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { useAuth } from "../context/AuthContext";
import { Color } from "@/GlobalStyles";
import DeliveryMap from "@/components/delivery/DeliveryMap";
import deliveryTrackingService, {
  DeliveryTracking,
  RouteStage,
  startTracking,
  stopTracking,
  updateRouteStage,
  getCurrentDeliveryTracking,
} from "../services/deliveryTrackingService";
import {
  getRestaurantCoordinates,
  getDormCoordinates,
} from "../utils/routingUtils";

export default function DeliveryTrackingScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load order and initialize tracking
  useEffect(() => {
    const loadOrderAndInitializeTracking = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);

        // Get order details
        const ordersJson = await AsyncStorage.getItem("dormdash_orders");
        if (!ordersJson) {
          Alert.alert("Error", "Could not load order details");
          router.back();
          return;
        }

        const orders = JSON.parse(ordersJson);
        const currentOrder = orders.find((o: any) => o.id === id);

        if (!currentOrder || currentOrder.delivererId !== user.id) {
          Alert.alert("Error", "You are not assigned to this delivery");
          router.back();
          return;
        }

        setOrder(currentOrder);

        // Check if tracking already exists
        const existingTracking = await getCurrentDeliveryTracking();

        if (existingTracking && existingTracking.orderId === id) {
          setTracking(existingTracking);
        } else {
          // Initialize new tracking
          await initializeTracking(currentOrder);
        }
      } catch (error) {
        console.error("Error loading order or initializing tracking:", error);
        Alert.alert("Error", "Failed to load delivery details");
      } finally {
        setLoading(false);
      }
    };

    loadOrderAndInitializeTracking();

    // Cleanup function
    return () => {
      // If navigating away, don't stop tracking automatically
      // This allows tracking to continue in the background
    };
  }, [id, user]);

  // Initialize tracking for an order
  const initializeTracking = async (order: any) => {
    if (!order || !user) return;

    try {
      // Get coordinates for restaurant
      const restaurantCoords = await getRestaurantCoordinates(
        order.restaurantId,
      );
      if (!restaurantCoords) {
        throw new Error("Could not get restaurant coordinates");
      }

      // Get coordinates for delivery location
      const customerCoords = await getDormCoordinates(order.deliveryAddress);
      if (!customerCoords) {
        throw new Error("Could not get delivery location coordinates");
      }

      // Start tracking
      const success = await startTracking(order.id, user.id);

      if (!success) {
        throw new Error("Failed to start delivery tracking");
      }

      // Get tracking info after initialization
      const trackingInfo = await getCurrentDeliveryTracking();

      if (trackingInfo) {
        // Update tracking with restaurant and customer locations
        const updatedTracking: DeliveryTracking = {
          ...trackingInfo,
          restaurantLocation: {
            latitude: restaurantCoords.latitude,
            longitude: restaurantCoords.longitude,
            address: order.restaurantName,
          },
          customerLocation: {
            latitude: customerCoords.latitude,
            longitude: customerCoords.longitude,
            address: order.deliveryAddress || "Customer Address",
          },
        };

        // Update tracking in AsyncStorage
        await AsyncStorage.setItem(
          "current_delivery_key",
          JSON.stringify(updatedTracking),
        );

        setTracking(updatedTracking);
      }
    } catch (error) {
      console.error("Error initializing tracking:", error);
      Alert.alert("Error", "Failed to initialize delivery tracking");
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: "picked_up" | "delivered") => {
    if (!order || !user || isUpdatingStatus) return;

    // Provide haptic feedback
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      setIsUpdatingStatus(true);

      // Get all orders
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (!ordersJson) {
        throw new Error("Could not load orders");
      }

      const allOrders = JSON.parse(ordersJson);

      // Update specific order
      const updatedOrders = allOrders.map((o: any) =>
        o.id === order.id ? { ...o, status: newStatus } : o,
      );

      // Save back to AsyncStorage
      await AsyncStorage.setItem(
        "dormdash_orders",
        JSON.stringify(updatedOrders),
      );

      // Update order state
      setOrder({ ...order, status: newStatus });

      // If picked up, update route stage
      if (newStatus === "picked_up") {
        await updateRouteStage(order.id, "to_customer");
      }

      // If delivered, stop tracking
      if (newStatus === "delivered") {
        await stopTracking();

        // Show success message
        Alert.alert(
          "Delivery Completed",
          "Delivery marked as completed. Thank you!",
          [{ text: "OK", onPress: () => router.replace("/(tabs)/deliver") }],
        );
      }

      // Refresh tracking info
      const updatedTracking = await getCurrentDeliveryTracking();
      if (updatedTracking) {
        setTracking(updatedTracking);
      }
    } catch (error) {
      console.error("Error updating delivery status:", error);
      Alert.alert("Error", "Failed to update delivery status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // End delivery and stop tracking
  const handleEndDelivery = async () => {
    Alert.alert(
      "End Delivery",
      "Are you sure you want to stop tracking this delivery?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Delivery",
          style: "destructive",
          onPress: async () => {
            try {
              await stopTracking();
              router.replace("/(tabs)/deliver");
            } catch (error) {
              console.error("Error stopping delivery tracking:", error);
              Alert.alert("Error", "Failed to end delivery tracking");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.colorBurlywood} />
          <Text style={styles.loadingText}>Loading delivery details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Delivery Tracking</Text>
        <TouchableOpacity style={styles.menuButton} onPress={handleEndDelivery}>
          <Feather name="more-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Order Info Card */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>
                Order #{order.id.substring(0, 8)}
              </Text>
              <Text style={styles.orderTime}>
                {new Date(order.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                order.status === "accepted"
                  ? styles.statusAccepted
                  : order.status === "picked_up"
                    ? styles.statusPickedUp
                    : styles.statusDelivered,
              ]}
            >
              <Text style={styles.statusText}>
                {order.status === "accepted"
                  ? "Preparing"
                  : order.status === "picked_up"
                    ? "In Transit"
                    : "Delivered"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.restaurantRow}>
            <Feather name="home" size={20} color="#666" />
            <Text style={styles.restaurantName}>{order.restaurantName}</Text>
          </View>

          <View style={styles.addressRow}>
            <Feather name="map-pin" size={20} color="#666" />
            <Text style={styles.addressText}>
              {order.deliveryAddress || "Vanderbilt Campus"}
            </Text>
          </View>

          {order.notes && (
            <View style={styles.notesRow}>
              <Feather name="message-square" size={20} color="#666" />
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          )}
        </View>

        {/* Map View */}
        <DeliveryMap tracking={tracking} isDeliverer={true} />

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {order.status === "accepted" ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStatusUpdate("picked_up")}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="package" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Mark as Picked Up</Text>
                </>
              )}
            </TouchableOpacity>
          ) : order.status === "picked_up" ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.deliveredButton]}
              onPress={() => handleStatusUpdate("delivered")}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="check-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Mark as Delivered</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionButton, styles.completedButton]}>
              <Feather name="check" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Delivery Completed</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  menuButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  orderTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusAccepted: {
    backgroundColor: "#3498db",
  },
  statusPickedUp: {
    backgroundColor: "#f39c12",
  },
  statusDelivered: {
    backgroundColor: "#2ecc71",
  },
  statusText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  restaurantRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  addressText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notesText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    fontStyle: "italic",
    flex: 1,
  },
  actionContainer: {
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: "#3498db",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
  },
  deliveredButton: {
    backgroundColor: "#2ecc71",
  },
  completedButton: {
    backgroundColor: "#7f8c8d",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 18,
    marginBottom: 20,
  },
});
