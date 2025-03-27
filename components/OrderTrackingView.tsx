// components/OrderTrackingView.tsx
// Contributor: @Fardeen Bablu
// Time spent: 2 hours

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Color } from "@/GlobalStyles";
import {
  getRestaurants,
  getDorms,
  calculateDistance,
  calculateEstimatedTime,
} from "@/lib/data/dataLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OrderTrackingViewProps {
  status: "pending" | "accepted" | "picked_up" | "delivered" | "cancelled";
  orderId: string;
}

const { width } = Dimensions.get("window");

const OrderTrackingView = ({ status, orderId }: OrderTrackingViewProps) => {
  const [order, setOrder] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId, status]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);

      // Load order data
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (!ordersJson) {
        setLoading(false);
        return;
      }

      const orders = JSON.parse(ordersJson);
      const currentOrder = orders.find((o: any) => o.id === orderId);

      if (!currentOrder) {
        setLoading(false);
        return;
      }

      setOrder(currentOrder);

      // Load restaurant data
      const allRestaurants = await getRestaurants();
      const matchedRestaurant = allRestaurants.find(
        (r: any) => r.name === currentOrder.restaurantName,
      );

      if (matchedRestaurant) {
        setRestaurant(matchedRestaurant);
      }

      // Load delivery address (dorm) data
      if (currentOrder.deliveryAddress) {
        const allDorms = await getDorms();
        const matchedDorm = allDorms.find(
          (d: any) =>
            d.name === currentOrder.deliveryAddress ||
            d.address.includes(currentOrder.deliveryAddress),
        );

        if (matchedDorm) {
          setDeliveryAddress(matchedDorm);

          // Calculate distance and estimated time
          if (matchedRestaurant?.coordinates && matchedDorm?.coordinates) {
            const dist = calculateDistance(
              matchedRestaurant.coordinates,
              matchedDorm.coordinates,
            );
            setDistance(dist);
            setEstimatedTime(calculateEstimatedTime(dist));
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading order details:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.colorBurlywood} />
        <Text style={styles.loadingText}>Loading tracking information...</Text>
      </View>
    );
  }

  // Simple map SVG with route visualization
  const renderMap = () => {
    // Simple SVG visualization of the route
    return (
      <View style={styles.mapContainer}>
        <Text style={styles.mapTitle}>Delivery Route</Text>
        <View style={styles.svgContainer}>
          <View style={styles.mapLine} />

          {/* Restaurant Point */}
          <View style={[styles.mapPoint, styles.restaurantPoint]}>
            <Feather name="home" size={20} color="#fff" />
          </View>
          <Text style={[styles.mapLabel, styles.restaurantLabel]}>
            {restaurant?.name || "Restaurant"}
          </Text>

          {/* Current Location Point */}
          <View
            style={[
              styles.mapPoint,
              styles.currentPoint,
              {
                left:
                  status === "pending"
                    ? "10%"
                    : status === "accepted"
                      ? "30%"
                      : status === "picked_up"
                        ? "70%"
                        : "90%",
              },
            ]}
          >
            <Feather name="truck" size={20} color="#fff" />
          </View>

          {/* Delivery Point */}
          <View style={[styles.mapPoint, styles.destinationPoint]}>
            <Feather name="map-pin" size={20} color="#fff" />
          </View>
          <Text style={[styles.mapLabel, styles.destinationLabel]}>
            {deliveryAddress?.name ||
              order?.deliveryAddress ||
              "Delivery Location"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.orderId}>Order #{orderId.substring(6, 12)}</Text>

      <View style={styles.progressContainer}>
        {/* Step 1: Order Accepted */}
        <View style={styles.stepContainer}>
          <View
            style={[
              styles.iconCircle,
              status !== "pending" ? styles.completedStep : styles.pendingStep,
            ]}
          >
            <Feather
              name="user"
              size={18}
              color={status !== "pending" ? "#fff" : "#666"}
            />
          </View>
          <Text style={styles.stepText}>Accepted</Text>
        </View>

        <View
          style={[
            styles.connector,
            status === "picked_up" || status === "delivered"
              ? styles.completedConnector
              : styles.pendingConnector,
          ]}
        />

        {/* Step 2: Food Picked Up */}
        <View style={styles.stepContainer}>
          <View
            style={[
              styles.iconCircle,
              status === "picked_up" || status === "delivered"
                ? styles.completedStep
                : styles.pendingStep,
            ]}
          >
            <Feather
              name="package"
              size={18}
              color={
                status === "picked_up" || status === "delivered"
                  ? "#fff"
                  : "#666"
              }
            />
          </View>
          <Text style={styles.stepText}>Picked Up</Text>
        </View>

        <View
          style={[
            styles.connector,
            status === "delivered"
              ? styles.completedConnector
              : styles.pendingConnector,
          ]}
        />

        {/* Step 3: Delivered */}
        <View style={styles.stepContainer}>
          <View
            style={[
              styles.iconCircle,
              status === "delivered"
                ? styles.completedStep
                : styles.pendingStep,
            ]}
          >
            <Feather
              name="check"
              size={18}
              color={status === "delivered" ? "#fff" : "#666"}
            />
          </View>
          <Text style={styles.stepText}>Delivered</Text>
        </View>
      </View>

      {renderMap()}

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <View style={[styles.statusBadge, getStatusStyle(status)]}>
            <Text style={styles.statusText}>{getStatusText(status)}</Text>
          </View>
        </View>

        {distance !== null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance:</Text>
            <Text style={styles.detailValue}>{distance.toFixed(2)} km</Text>
          </View>
        )}

        {estimatedTime !== null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Est. Time:</Text>
            <Text style={styles.detailValue}>{estimatedTime} minutes</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "Waiting for acceptance";
    case "accepted":
      return "Being prepared for pickup";
    case "picked_up":
      return "On the way";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "pending":
      return { backgroundColor: "#f39c12" };
    case "accepted":
      return { backgroundColor: "#3498db" };
    case "picked_up":
      return { backgroundColor: "#2ecc71" };
    case "delivered":
      return { backgroundColor: "#27ae60" };
    case "cancelled":
      return { backgroundColor: "#e74c3c" };
    default:
      return { backgroundColor: "#7f8c8d" };
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  stepContainer: {
    alignItems: "center",
    width: 70,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  completedStep: {
    backgroundColor: Color.colorBurlywood,
  },
  pendingStep: {
    backgroundColor: "#f1f1f1",
  },
  connector: {
    height: 3,
    flex: 1,
  },
  completedConnector: {
    backgroundColor: Color.colorBurlywood,
  },
  pendingConnector: {
    backgroundColor: "#f1f1f1",
  },
  stepText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  mapContainer: {
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 12,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    textAlign: "center",
  },
  svgContainer: {
    height: 120,
    position: "relative",
    justifyContent: "center",
  },
  mapLine: {
    position: "absolute",
    top: "50%",
    left: "5%",
    width: "90%",
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
  },
  mapPoint: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  restaurantPoint: {
    backgroundColor: "#f39c12",
    left: "5%",
  },
  currentPoint: {
    backgroundColor: "#3498db",
    // Position will be set dynamically based on status
  },
  destinationPoint: {
    backgroundColor: "#2ecc71",
    right: "5%",
  },
  mapLabel: {
    position: "absolute",
    fontSize: 12,
    width: 120,
    textAlign: "center",
  },
  restaurantLabel: {
    top: 80,
    left: "5%",
    transform: [{ translateX: -40 }],
  },
  destinationLabel: {
    top: 80,
    right: "5%",
    transform: [{ translateX: 40 }],
  },
  detailsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
});

export default OrderTrackingView;
