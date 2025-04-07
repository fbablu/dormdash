// components/delivery/CustomerTrackingView.tsx
// Contributor: @Fardeen Bablu
// Time spent: 3 hours

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Color } from "@/GlobalStyles";
import DeliveryMap from "./DeliveryMap";
import {
  DeliveryTracking,
  startCustomerTracking,
  stopCustomerTracking,
} from "../../app/services/deliveryTrackingService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDormCoordinates,
  getRestaurantCoordinates,
  formatETA,
} from "@/app/utils/routingUtils";

interface CustomerTrackingViewProps {
  orderId: string;
  order: any;
  onClose?: () => void;
}

const CustomerTrackingView: React.FC<CustomerTrackingViewProps> = ({
  orderId,
  order,
  onClose,
}) => {
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [delivererInfo, setDelivererInfo] = useState<any>(null);
  const [eta, setEta] = useState<string | null>(null);

  // Initialize tracking and fetch deliverer info
  useEffect(() => {
    const initialize = async () => {
      try {
        setInitializing(true);

        // Try to find tracking data in local storage first
        const trackingKey = `tracking_${orderId}`;
        const localTracking = await AsyncStorage.getItem(trackingKey);

        if (localTracking) {
          setTracking(JSON.parse(localTracking));
        }

        // Get restaurant coordinates
        const restaurantCoords = await getRestaurantCoordinates(
          order.restaurantId,
        );

        // Get delivery address coordinates
        const customerCoords = await getDormCoordinates(
          order.deliveryAddress || "Vanderbilt Campus",
        );

        // If both coordinates are available, create initial tracking object
        if (restaurantCoords && customerCoords && !tracking) {
          const initialTracking: DeliveryTracking = {
            orderId,
            delivererId: order.delivererId || "",
            restaurantLocation: {
              latitude: restaurantCoords.latitude,
              longitude: restaurantCoords.longitude,
              address: order.restaurantName,
            },
            customerLocation: {
              latitude: customerCoords.latitude,
              longitude: customerCoords.longitude,
              address: order.deliveryAddress || "Vanderbilt Campus",
            },
            status: order.status,
            routeStage:
              order.status === "accepted" ? "to_restaurant" : "to_customer",
            lastUpdated: Date.now(),
          };

          setTracking(initialTracking);
          await AsyncStorage.setItem(
            trackingKey,
            JSON.stringify(initialTracking),
          );
        }

        // Get deliverer info if available
        if (order.delivererId) {
          try {
            const usersJson = await AsyncStorage.getItem("dormdash_users");
            if (usersJson) {
              const users = JSON.parse(usersJson);
              const deliverer = users.find(
                (u: any) => u.id === order.delivererId,
              );
              if (deliverer) {
                setDelivererInfo(deliverer);
              }
            }
          } catch (error) {
            console.error("Error fetching deliverer info:", error);
          }
        }

        // Start tracking subscription
        startCustomerTracking(orderId, (updatedTracking) => {
          setTracking(updatedTracking);

          // Save to local storage
          AsyncStorage.setItem(trackingKey, JSON.stringify(updatedTracking));

          // Update ETA
          if (updatedTracking.estimatedTimeRemaining) {
            const etaDate = new Date(
              Date.now() + updatedTracking.estimatedTimeRemaining * 60 * 1000,
            );
            setEta(formatETA(etaDate));
          }
        });
      } catch (error) {
        console.error("Error initializing customer tracking:", error);
      } finally {
        setInitializing(false);
        setLoading(false);
      }
    };

    initialize();

    // Clean up subscription on unmount
    return () => {
      stopCustomerTracking();
    };
  }, [orderId, order]);

  // Handle calling the deliverer
  const handleCallDeliverer = () => {
    if (!delivererInfo || !delivererInfo.phone) {
      Alert.alert(
        "Contact Not Available",
        "Deliverer contact information is not available",
      );
      return;
    }

    const phoneNumber = delivererInfo.phone.replace(/\D/g, "");

    if (Platform.OS === "android") {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Linking.openURL(`telprompt:${phoneNumber}`);
    }
  };

  // Get delivery status text
  const getStatusText = () => {
    if (!tracking) return "Preparing your order";

    switch (tracking.status) {
      case "pending":
        return "Looking for a deliverer";
      case "accepted":
        return "Deliverer is heading to restaurant";
      case "picked_up":
        return "Deliverer is on the way to you";
      case "delivered":
        return "Order delivered";
      case "cancelled":
        return "Order cancelled";
      default:
        return "Tracking your order";
    }
  };

  if (loading || initializing) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.colorBurlywood} />
          <Text style={styles.loadingText}>Initializing tracking...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Tracking</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>{getStatusText()}</Text>
          {eta && (
            <View style={styles.etaBadge}>
              <Feather name="clock" size={14} color="#fff" />
              <Text style={styles.etaText}>ETA: {eta}</Text>
            </View>
          )}
        </View>

        {tracking && tracking.status !== "pending" && (
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View
                style={[
                  styles.stepCircle,
                  tracking.status === "accepted" ||
                  tracking.status === "picked_up" ||
                  tracking.status === "delivered"
                    ? styles.activeStepCircle
                    : styles.inactiveStepCircle,
                ]}
              >
                <Feather
                  name="check"
                  size={16}
                  color={
                    tracking.status === "accepted" ||
                    tracking.status === "picked_up" ||
                    tracking.status === "delivered"
                      ? "#fff"
                      : "#ccc"
                  }
                />
              </View>
              <Text style={styles.stepText}>Order Accepted</Text>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.step}>
              <View
                style={[
                  styles.stepCircle,
                  tracking.status === "picked_up" ||
                  tracking.status === "delivered"
                    ? styles.activeStepCircle
                    : styles.inactiveStepCircle,
                ]}
              >
                <Feather
                  name="package"
                  size={16}
                  color={
                    tracking.status === "picked_up" ||
                    tracking.status === "delivered"
                      ? "#fff"
                      : "#ccc"
                  }
                />
              </View>
              <Text style={styles.stepText}>Food Picked Up</Text>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.step}>
              <View
                style={[
                  styles.stepCircle,
                  tracking.status === "delivered"
                    ? styles.activeStepCircle
                    : styles.inactiveStepCircle,
                ]}
              >
                <Feather
                  name="home"
                  size={16}
                  color={tracking.status === "delivered" ? "#fff" : "#ccc"}
                />
              </View>
              <Text style={styles.stepText}>Delivered</Text>
            </View>
          </View>
        )}
      </View>

      {/* Delivery Map */}
      <View style={styles.mapWrapper}>
        <DeliveryMap tracking={tracking} isDeliverer={false} />
      </View>

      {/* Deliverer info */}
      {order.delivererId && order.status !== "delivered" && (
        <View style={styles.delivererContainer}>
          <View style={styles.delivererHeader}>
            <Text style={styles.delivererTitle}>Your Deliverer</Text>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallDeliverer}
            >
              <Feather name="phone" size={16} color="#fff" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.delivererInfo}>
            <View style={styles.delivererAvatar}>
              <Feather name="user" size={20} color="#fff" />
            </View>
            <View style={styles.delivererDetails}>
              <Text style={styles.delivererName}>
                {delivererInfo ? delivererInfo.name : "Vandy Student"}
              </Text>
              <Text style={styles.delivererSubtext}>Vanderbilt University</Text>
            </View>
          </View>
        </View>
      )}

      {/* Order completed message */}
      {order.status === "delivered" && (
        <View style={styles.completedContainer}>
          <Feather name="check-circle" size={40} color="#2ecc71" />
          <Text style={styles.completedText}>
            Your order has been delivered!
          </Text>
          <Text style={styles.completedSubtext}>
            Thank you for using DormDash
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  statusContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  etaBadge: {
    backgroundColor: Color.colorBurlywood,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  etaText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  stepsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  step: {
    alignItems: "center",
    width: 80,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  activeStepCircle: {
    backgroundColor: Color.colorBurlywood,
  },
  inactiveStepCircle: {
    backgroundColor: "#e0e0e0",
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: "#e0e0e0",
  },
  stepText: {
    fontSize: 12,
    textAlign: "center",
  },
  mapWrapper: {
    flex: 1,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  delivererContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  delivererHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  delivererTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  callButton: {
    backgroundColor: "#2ecc71",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  callButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  delivererInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  delivererAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Color.colorBurlywood,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  delivererDetails: {
    flex: 1,
  },
  delivererName: {
    fontSize: 16,
    fontWeight: "500",
  },
  delivererSubtext: {
    fontSize: 14,
    color: "#666",
  },
  completedContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  completedText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
  },
  completedSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});

export default CustomerTrackingView;
