// app/(tabs)/deliver.tsx
// Contributors: @Albert Castrejon, @Fardeen Bablu
// Time spent: 6 hours
// app/(tabs)/deliver.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/app/context/AuthContext";
import { Color } from "@/GlobalStyles";

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
}

export default function Deliver() {
  const { user } = useAuth();

  const [isOnlineForDelivery, setIsOnlineForDelivery] =
    useState<boolean>(false);
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);
  const [availableDeliveryRequests, setAvailableDeliveryRequests] = useState<
    Order[]
  >([]);
  const [isDeliveryLoading, setIsDeliveryLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Toggle visibility options
  const toggleVisibilityOptions = () => {
    setIsVisible((prev) => !prev);
  };

  // Toggle online status
  const toggleOnline = () => {
    setIsOnlineForDelivery(true);
    setIsVisible(false);
  };

  // Toggle offline status
  const toggleOffline = () => {
    setIsOnlineForDelivery(false);
    setIsVisible(false);
  };

  // Fetch delivery requests from AsyncStorage
  const fetchDeliveryRequests = async () => {
    if (!isOnlineForDelivery || !user) return;

    setRefreshing(true);
    setIsDeliveryLoading(true);

    try {
      // Get all orders from AsyncStorage
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (!ordersJson) {
        setAvailableDeliveryRequests([]);
        setActiveDeliveries([]);
        return;
      }

      const orders = JSON.parse(ordersJson) as Order[];

      // Filter for pending orders (available for delivery)
      const pendingOrders = orders.filter(
        (order) => order.status === "pending",
      );

      // Filter for orders the user is delivering
      const userDeliveries = orders.filter(
        (order) =>
          (order.status === "accepted" || order.status === "picked_up") &&
          order.delivererId === user.id,
      );

      // Set states
      setAvailableDeliveryRequests(pendingOrders);
      setActiveDeliveries(userDeliveries);
    } catch (error) {
      console.error("Error fetching delivery data:", error);
      Alert.alert("Error", "Failed to fetch delivery requests");
    } finally {
      setIsDeliveryLoading(false);
      setRefreshing(false);
    }
  };

  // Accept a delivery request
  const handleAcceptDelivery = async (orderId: string) => {
    try {
      // Get all orders
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (!ordersJson || !user) return false;

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

      // Refresh the lists
      await fetchDeliveryRequests();

      return true;
    } catch (error) {
      console.error("Error accepting delivery:", error);
      return false;
    }
  };

  // Update delivery status
  const handleUpdateStatus = async (
    orderId: string,
    newStatus: Order["status"],
  ) => {
    try {
      // Get all orders
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (!ordersJson) return false;

      const allOrders = JSON.parse(ordersJson) as Order[];

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
      } else {
        // Otherwise update the status
        setActiveDeliveries((prev) =>
          prev.map((delivery) =>
            delivery.id === orderId
              ? { ...delivery, status: newStatus }
              : delivery,
          ),
        );
      }

      return true;
    } catch (error) {
      console.error("Error updating delivery status:", error);
      return false;
    }
  };

  // Fetch delivery requests when going online
  useEffect(() => {
    if (isOnlineForDelivery) {
      fetchDeliveryRequests();
    } else {
      // Clear delivery data when going offline
      setAvailableDeliveryRequests([]);
    }
  }, [isOnlineForDelivery]);

  // Handle refresh
  const onRefresh = () => {
    fetchDeliveryRequests();
  };

  // Render an available delivery request item
  const renderAvailableDeliveryItem = ({ item }: { item: Order }) => {
    // Check if this is the user's own order
    const isOwnOrder = item.customerId === user?.id;

    return (
      <View style={styles.deliveryItem}>
        {isOwnOrder && (
          <View style={styles.ownOrderBadge}>
            <Text style={styles.ownOrderText}>Your Order</Text>
          </View>
        )}

        <View style={styles.deliveryHeader}>
          <Text style={styles.restaurantName}>{item.restaurantName}</Text>
          <Text style={styles.deliveryAmount}>${item.totalAmount}</Text>
        </View>

        <Text style={styles.deliveryAddress}>
          Order #{item.id.substring(6, 12)}
        </Text>

        {item.notes && (
          <Text style={styles.deliveryNotes}>Notes: {item.notes}</Text>
        )}

        <View style={styles.deliveryFooter}>
          <Text style={styles.deliveryFee}>
            Delivery Fee: ${item.deliveryFee}
          </Text>

          {!isOwnOrder && (
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                handleAcceptDelivery(item.id).then((success) => {
                  if (success) {
                    Alert.alert("Success", "Delivery request accepted!");
                  } else {
                    Alert.alert(
                      "Error",
                      "Failed to accept delivery. Please try again.",
                    );
                  }
                });
              }}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render an active delivery item
  const renderActiveDeliveryItem = ({ item }: { item: Order }) => (
    <View style={styles.activeDeliveryItem}>
      <View style={styles.deliveryHeader}>
        <Text style={styles.restaurantName}>{item.restaurantName}</Text>
        <Text style={styles.deliveryAmount}>${item.totalAmount}</Text>
      </View>

      <Text style={styles.deliveryAddress}>
        Order #{item.id.substring(6, 12)}
      </Text>

      {item.notes && (
        <Text style={styles.deliveryNotes}>Notes: {item.notes}</Text>
      )}

      <View style={styles.statusButtons}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            item.status === "picked_up" && styles.activeStatusButton,
          ]}
          onPress={() => {
            handleUpdateStatus(item.id, "picked_up").then((success) => {
              if (success) {
                Alert.alert("Success", "Order marked as picked up!");
              } else {
                Alert.alert(
                  "Error",
                  "Failed to update status. Please try again.",
                );
              }
            });
          }}
        >
          <Text style={styles.statusButtonText}>Picked Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusButton, styles.deliveredButton]}
          onPress={() => {
            handleUpdateStatus(item.id, "delivered").then((success) => {
              if (success) {
                Alert.alert("Success", "Delivery marked as completed!");
              } else {
                Alert.alert(
                  "Error",
                  "Failed to update status. Please try again.",
                );
              }
            });
          }}
        >
          <Text style={styles.statusButtonText}>Delivered</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const DeliveryToggle = ({
    isOnline,
    onToggle,
  }: {
    isOnline: boolean;
    onToggle: () => void;
  }) => {
    const switchAnimation = useRef(
      new Animated.Value(isOnline ? 1 : 0),
    ).current;

    useEffect(() => {
      Animated.spring(switchAnimation, {
        toValue: isOnline ? 1 : 0,
        useNativeDriver: true,
        tension: 30,
        friction: 7,
      }).start();
    }, [isOnline]);

    return (
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={styles.switchContainer}
      >
        <Animated.View
          style={[
            styles.switchTrack,
            {
              backgroundColor: isOnline ? "#4CAF50" : "#ddd",
            },
          ]}
        >
          <Animated.View
            style={[
              styles.switchKnob,
              {
                transform: [
                  {
                    translateX: switchAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 40],
                    }),
                  },
                ],
              },
            ]}
          >
            <Feather
              name={isOnline ? "truck" : "moon"}
              size={24}
              color={isOnline ? "#4CAF50" : "#666"}
            />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Page header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Deliver</Text>
      </View>

      {/* Status indicator and toggle */}
      <View style={styles.statusContainer}>
        <DeliveryToggle
          isOnline={isOnlineForDelivery}
          onToggle={() => {
            if (isOnlineForDelivery) {
              toggleOffline();
            } else {
              toggleOnline();
            }
          }}
        />
        <Text style={styles.switchText}>
          {isOnlineForDelivery ? "Ready to Deliver!" : "Offline"}
        </Text>
      </View>

      {/* Status indicator */}
      <View style={styles.statusIndicator}>
        <Text style={styles.statusText}>
          Status: {isOnlineForDelivery ? "Online" : "Offline"}
        </Text>
        <View
          style={[
            styles.statusDot,
            isOnlineForDelivery ? styles.onlineDot : styles.offlineDot,
          ]}
        />
      </View>

      {isOnlineForDelivery ? (
        <View style={styles.contentContainer}>
          {isDeliveryLoading && !refreshing ? (
            <ActivityIndicator
              size="large"
              color="#cfae70"
              style={styles.loader}
            />
          ) : (
            <>
              {/* Active Deliveries Section */}
              {activeDeliveries.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Active Deliveries</Text>
                  <FlatList
                    data={activeDeliveries}
                    keyExtractor={(item) => item.id}
                    renderItem={renderActiveDeliveryItem}
                    contentContainerStyle={styles.listContent}
                  />
                </View>
              )}

              {/* Available Requests Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Available Requests</Text>
                {availableDeliveryRequests.length > 0 ? (
                  <FlatList
                    data={availableDeliveryRequests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderAvailableDeliveryItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                      />
                    }
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      No delivery requests available
                    </Text>
                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={onRefresh}
                    >
                      <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      ) : (
        <View style={styles.offlineMessage}>
          <Text style={styles.offlineText}>You are currently offline</Text>
          <Text style={styles.offlineSubtext}>
            Go online to view and accept delivery requests
          </Text>
        </View>
      )}

      {/* Visibility options */}
      {isVisible && (
        <View style={styles.visibilityOptions}>
          <TouchableOpacity style={styles.item} onPress={toggleOnline}>
            <Text style={styles.visibilityText}>Go Online</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={toggleOffline}>
            <Text style={styles.visibilityText}>Go Offline</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom button */}
      <TouchableOpacity
        style={styles.VisibilityConfigButton}
        onPress={toggleVisibilityOptions}
      >
        <Text style={styles.buttonText}>
          {isOnlineForDelivery ? "You are Online" : "You are Offline"}
        </Text>
        <Image
          style={styles.visibilityConfig}
          resizeMode="contain"
          source={require("../../assets/deliver-page/VisibilityConfig.png")}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statusContainer: {
    alignItems: "center",
    marginVertical: 5,
  },
  switchContainer: {
    padding: 8,
  },
  switchTrack: {
    width: 80,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    padding: 4,
    borderWidth: 2,
    borderColor: "#eee",
  },
  switchKnob: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  switchText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  onlineDot: {
    backgroundColor: "#4CAF50",
  },
  offlineDot: {
    backgroundColor: "#F44336",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginBottom: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  ownOrderBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#ff9800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  ownOrderText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  deliveryItem: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#cfae70",
  },
  activeDeliveryItem: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deliveryAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deliveryAddress: {
    fontSize: 14,
    marginBottom: 8,
  },
  deliveryNotes: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: "italic",
  },
  deliveryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  deliveryFee: {
    fontSize: 14,
    fontWeight: "bold",
  },
  acceptButton: {
    backgroundColor: "#cfae70",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  acceptButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  statusButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statusButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  activeStatusButton: {
    backgroundColor: "#8BC34A",
  },
  deliveredButton: {
    backgroundColor: "#4CAF50",
  },
  statusButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 12,
  },
  refreshButton: {
    backgroundColor: "#cfae70",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  offlineMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  offlineText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  offlineSubtext: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  visibilityOptions: {
    position: "absolute",
    bottom: 105,
    width: "90%",
    borderRadius: 8,
    overflow: "hidden",
    alignSelf: "center",
  },
  item: {
    backgroundColor: "#D9D9D9",
    padding: 20,
    marginVertical: 1,
    alignItems: "center",
  },
  visibilityText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  visibilityConfig: {
    position: "absolute",
    right: 20,
  },
  VisibilityConfigButton: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "#D9D9D9",
    width: "90%",
    height: 75,
    borderColor: "#897A7A",
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    alignSelf: "center",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
