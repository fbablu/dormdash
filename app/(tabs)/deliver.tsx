// app/(tabs)/deliver.tsx
// Contributors: @Fardeen Bablu, @Albert Castrejon
// Time spent: 8 hours

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
  AppState,
  AppStateStatus,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/app/context/AuthContext";
import { Color } from "@/GlobalStyles";
import OrderTrackingView from "@/components/OrderTrackingView";
import { initializeLocalData } from "@/lib/data/dataLoader";
import deliveryTrackingService, {
  DeliveryTracking,
} from "../services/deliveryTrackingService";
import {
  getRestaurantCoordinates,
  getDormCoordinates,
  formatETA,
  getETAWithTime,
} from "../utils/routingUtils";

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

const REFRESH_INTERVAL = 10000;

export default function Deliver() {
  const { user } = useAuth();
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);
  const [availableRequests, setAvailableRequests] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [selectedDelivery, setSelectedDelivery] = useState<Order | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);

  // Refs for tracking interval and app state
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const [trackingData, setTrackingData] = useState<DeliveryTracking | null>(
    null,
  );
  const [etaInfo, setEtaInfo] = useState<{
    etaString: string;
    timeString: string;
  } | null>(null);

  // Initialize location data
  useEffect(() => {
    initializeLocalData();
    deliveryTrackingService.initializeTrackingService();
  }, []);

  // Set up auto-refresh and app state listeners
  useEffect(() => {
    fetchDeliveryData();
    startRefreshInterval();

    // Set up app state listener
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    // Clean up on unmount
    return () => {
      stopRefreshInterval();
      subscription.remove();
      deliveryTrackingService.stopTracking();
    };
  }, []);

  useEffect(() => {
    const checkActiveTracking = async () => {
      const currentTracking =
        await deliveryTrackingService.getCurrentDeliveryTracking();
      if (currentTracking) {
        setTrackingData(currentTracking);
        // Find the corresponding order
        const ordersJson = await AsyncStorage.getItem("dormdash_orders");
        if (ordersJson) {
          const orders = JSON.parse(ordersJson) as Order[];
          const trackedOrder = orders.find(
            (order) => order.id === currentTracking.orderId,
          );
          if (trackedOrder) {
            setSelectedDelivery(trackedOrder);
            setShowMap(true);
            updateETA(currentTracking);
          }
        }
      }
    };

    checkActiveTracking();
  }, []);

  const updateETA = (tracking: DeliveryTracking) => {
    if (
      !tracking.currentLocation ||
      (!tracking.restaurantLocation && !tracking.customerLocation)
    ) {
      return;
    }

    const destLocation =
      tracking.routeStage === "to_restaurant"
        ? tracking.restaurantLocation
        : tracking.customerLocation;

    if (destLocation) {
      const { etaString, timeString } = getETAWithTime(
        tracking.currentLocation.latitude,
        tracking.currentLocation.longitude,
        destLocation.latitude,
        destLocation.longitude,
      );

      setEtaInfo({ etaString, timeString });
    }
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      fetchDeliveryData();
      startRefreshInterval();
    } else if (nextAppState.match(/inactive|background/)) {
      stopRefreshInterval();
    }

    appStateRef.current = nextAppState;
  };

  // Start refresh interval
  const startRefreshInterval = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      fetchDeliveryData(false);
    }, REFRESH_INTERVAL);
  };

  // Stop refresh interval
  const stopRefreshInterval = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  // Format the last refreshed time
  const getRefreshTimeString = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshed.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    return `${diffMins} minutes ago`;
  };

  const fetchDeliveryData = async (showLoadingIndicator = true) => {
    if (!user) return;

    if (showLoadingIndicator) {
      setRefreshing(true);
      setIsLoading(true);
    }

    try {
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");

      if (!ordersJson) {
        setAvailableRequests([]);
        setActiveDeliveries([]);
        return;
      }

      const orders = JSON.parse(ordersJson) as Order[];
      const pendingOrders = orders.filter(
        (order) => order.status === "pending",
      );

      // Filter for orders the user is delivering
      const userDeliveries = orders.filter(
        (order) =>
          (order.status === "accepted" || order.status === "picked_up") &&
          order.delivererId === user.id,
      );

      // Update state
      setAvailableRequests(pendingOrders);
      setActiveDeliveries(userDeliveries);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error fetching delivery data:", error);
      Alert.alert("Error", "Failed to fetch delivery requests");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcceptDelivery = async (orderId: string) => {
    try {
      if (activeDeliveries.length > 0) {
        Alert.alert(
          "Delivery in Progress",
          "You already have an active delivery. Please complete it before accepting a new one.",
        );
        return false;
      }

      // Get all orders
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (!ordersJson || !user) return false;

      const allOrders = JSON.parse(ordersJson) as Order[];
      const order = allOrders.find((o) => o.id === orderId);

      // Double check this isn't the user's own order
      if (order && order.customerId === user.id) {
        Alert.alert("Error", "You cannot deliver your own order");
        return false;
      }

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

      // Start tracking the delivery
      if (order) {
        const restaurantCoords = await getRestaurantCoordinates(
          order.restaurantId,
        );
        const dormCoords = order.deliveryAddress
          ? await getDormCoordinates(order.deliveryAddress)
          : null;

        // Initialize tracking with coordinates if available
        await deliveryTrackingService.startTracking(orderId, user.id);

        const tracking =
          await deliveryTrackingService.getCurrentDeliveryTracking();
        if (tracking) {
          if (restaurantCoords) {
            tracking.restaurantLocation = {
              ...restaurantCoords,
              address: order.restaurantName,
            };
          }

          if (dormCoords && order.deliveryAddress) {
            tracking.customerLocation = {
              ...dormCoords,
              address: order.deliveryAddress,
            };
          }

          setTrackingData(tracking);
          updateETA(tracking);
        }
      }

      // Refresh the lists
      await fetchDeliveryData();

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

      // Update tracking status and route stage
      if (newStatus === "picked_up") {
        await deliveryTrackingService.updateRouteStage(orderId, "to_customer");
        const tracking =
          await deliveryTrackingService.getCurrentDeliveryTracking();
        if (tracking) {
          setTrackingData(tracking);
          updateETA(tracking);
        }
      } else if (newStatus === "delivered") {
        await deliveryTrackingService.stopTracking();
        setTrackingData(null);
        setEtaInfo(null);

        // Remove from active deliveries
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

      // Trigger a refresh to ensure all state is updated
      setTimeout(() => fetchDeliveryData(false), 500);

      return true;
    } catch (error) {
      console.error("Error updating delivery status:", error);
      return false;
    }
  };

  // Handle order selection for map view
  const handleSelectDelivery = async (order: Order) => {
    setSelectedDelivery(order);
    setShowMap(true);

    // Get tracking data if available for this order
    const tracking = await deliveryTrackingService.getDeliveryTracking(
      order.id,
    );
    if (tracking) {
      setTrackingData(tracking);
      updateETA(tracking);
    } else if (order.status === "accepted" || order.status === "picked_up") {
      // If tracking doesn't exist but this is an active delivery, start tracking
      if (user && order.delivererId === user.id) {
        await deliveryTrackingService.startTracking(order.id, user.id);
        const newTracking =
          await deliveryTrackingService.getCurrentDeliveryTracking();

        if (newTracking) {
          // Get coordinates
          const restaurantCoords = await getRestaurantCoordinates(
            order.restaurantId,
          );
          const dormCoords = order.deliveryAddress
            ? await getDormCoordinates(order.deliveryAddress)
            : null;

          if (restaurantCoords) {
            newTracking.restaurantLocation = {
              ...restaurantCoords,
              address: order.restaurantName,
            };
          }

          if (dormCoords && order.deliveryAddress) {
            newTracking.customerLocation = {
              ...dormCoords,
              address: order.deliveryAddress,
            };
          }

          // Set appropriate route stage
          if (order.status === "picked_up") {
            await deliveryTrackingService.updateRouteStage(
              order.id,
              "to_customer",
            );
          }

          const updatedTracking =
            await deliveryTrackingService.getCurrentDeliveryTracking();
          if (updatedTracking) {
            setTrackingData(updatedTracking);
            updateETA(updatedTracking);
          }
        }
      }
    }
  };

  // Close map view
  const handleCloseMap = () => {
    setShowMap(false);
  };

  // Modified map view to include tracking info
  const renderDeliveryMap = () => {
    if (!selectedDelivery) return null;

    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>
            Delivery Progress - {selectedDelivery.restaurantName}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseMap}>
            <Feather name="x" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.mapContent}>
          <OrderTrackingView
            status={selectedDelivery.status}
            orderId={selectedDelivery.id}
            trackingData={trackingData}
          />

          {etaInfo && (
            <View style={styles.etaContainer}>
              <Text style={styles.etaTitle}>Estimated Arrival</Text>
              <Text style={styles.etaText}>
                {etaInfo.etaString} (arriving around {etaInfo.timeString})
              </Text>
            </View>
          )}

          <View style={styles.deliveryInfo}>
            <Text style={styles.infoLabel}>Order #:</Text>
            <Text style={styles.infoValue}>
              {selectedDelivery.id.substring(6, 12)}
            </Text>
          </View>

          <View style={styles.deliveryInfo}>
            <Text style={styles.infoLabel}>Restaurant:</Text>
            <Text style={styles.infoValue}>
              {selectedDelivery.restaurantName}
            </Text>
          </View>

          {selectedDelivery.deliveryAddress && (
            <View style={styles.deliveryInfo}>
              <Text style={styles.infoLabel}>Delivery to:</Text>
              <Text style={styles.infoValue}>
                {selectedDelivery.deliveryAddress}
              </Text>
            </View>
          )}

          {selectedDelivery.notes && (
            <View style={styles.deliveryInfo}>
              <Text style={styles.infoLabel}>Notes:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.notes}</Text>
            </View>
          )}

          {/* Display current stage if tracking is active */}
          {trackingData && (
            <View style={styles.deliveryInfo}>
              <Text style={styles.infoLabel}>Current Stage:</Text>
              <Text style={styles.infoValue}>
                {trackingData.routeStage === "to_restaurant"
                  ? "Heading to restaurant"
                  : trackingData.routeStage === "to_customer"
                    ? "Delivering to customer"
                    : "Completed"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.mapActions}>
          {selectedDelivery.status === "accepted" ? (
            <TouchableOpacity
              style={styles.statusUpdateButton}
              onPress={() =>
                handleUpdateStatus(selectedDelivery.id, "picked_up")
              }
            >
              <Feather name="package" size={20} color="#fff" />
              <Text style={styles.statusUpdateButtonText}>
                Mark as Picked Up
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.statusUpdateButton, styles.deliveredButton]}
              onPress={() =>
                handleUpdateStatus(selectedDelivery.id, "delivered")
              }
            >
              <Feather name="check-circle" size={20} color="#fff" />
              <Text style={styles.statusUpdateButtonText}>
                Mark as Delivered
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render an available delivery request item
  const renderAvailableRequest = ({ item }: { item: Order }) => {
    return (
      <View style={styles.deliveryItem}>
        <View style={styles.deliveryHeader}>
          <Text style={styles.restaurantName}>{item.restaurantName}</Text>
          <Text style={styles.deliveryAmount}>${item.totalAmount}</Text>
        </View>

        <View style={styles.deliveryContent}>
          <View style={styles.deliveryDetails}>
            <Text style={styles.orderNumber}>
              Order #{item.id.substring(6, 12)}
            </Text>
            {item.deliveryAddress && (
              <Text style={styles.deliveryAddress} numberOfLines={1}>
                <Feather name="map-pin" size={14} color="#666" />{" "}
                {item.deliveryAddress}
              </Text>
            )}
            {item.notes && (
              <Text style={styles.deliveryNotes} numberOfLines={1}>
                <Feather name="message-square" size={14} color="#666" />{" "}
                {item.notes}
              </Text>
            )}
          </View>

          <View style={styles.itemPreview}>
            {item.items.slice(0, 2).map((orderItem, index) => (
              <Text key={index} style={styles.itemText} numberOfLines={1}>
                {orderItem.quantity}x {orderItem.name}
              </Text>
            ))}
            {item.items.length > 2 && (
              <Text style={styles.itemText}>+{item.items.length - 2} more</Text>
            )}
          </View>
        </View>

        <View style={styles.deliveryFooter}>
          <Text style={styles.deliveryFee}>
            Delivery Fee: ${item.deliveryFee}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => handleSelectDelivery(item)}
            >
              <Feather name="map" size={16} color="#666" />
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                handleAcceptDelivery(item.id).then((success) => {
                  if (success) {
                    Alert.alert("Success", "Delivery request accepted!");
                    handleSelectDelivery({
                      ...item,
                      status: "accepted",
                      delivererId: user?.id,
                    });
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
          </View>
        </View>
      </View>
    );
  };

  // Render an active delivery item
  const renderActiveDelivery = ({ item }: { item: Order }) => (
    <View style={styles.activeDeliveryItem}>
      <View style={styles.deliveryHeader}>
        <Text style={styles.restaurantName}>{item.restaurantName}</Text>
        <View style={styles.statusChip}>
          <Text style={styles.statusChipText}>
            {item.status === "accepted" ? "Pickup" : "In Transit"}
          </Text>
        </View>
      </View>

      <View style={styles.deliveryContent}>
        <View style={styles.deliveryDetails}>
          <Text style={styles.orderNumber}>
            Order #{item.id.substring(6, 12)}
          </Text>
          {item.deliveryAddress && (
            <Text style={styles.deliveryAddress} numberOfLines={1}>
              <Feather name="map-pin" size={14} color="#666" />{" "}
              {item.deliveryAddress}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.deliveryFooter}>
        <Text style={styles.deliveryAmount}>${item.totalAmount}</Text>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => handleSelectDelivery(item)}
        >
          <Feather name="map" size={16} color="#fff" />
          <Text style={styles.trackButtonText}>Track</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // If the map is showing, render the map view
  if (showMap) {
    return (
      <SafeAreaView style={styles.container}>
        {renderDeliveryMap()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Page header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Deliver</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
          </View>
          <Text style={styles.refreshText}>
            Last refreshed: {getRefreshTimeString()}
          </Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {isLoading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color="#cfae70"
            style={styles.loader}
          />
        ) : (
          <>
            {/* Active Deliveries Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Active Deliveries</Text>
              {activeDeliveries.length > 0 ? (
                <FlatList
                  data={activeDeliveries}
                  keyExtractor={(item) => item.id}
                  renderItem={renderActiveDelivery}
                  contentContainerStyle={styles.listContent}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyActiveState}>
                  <Feather name="package" size={32} color="#ddd" />
                  <Text style={styles.emptyStateText}>
                    No active deliveries
                  </Text>
                </View>
              )}
            </View>

            {/* Available Requests Section */}
            <View style={styles.availableSection}>
              <Text style={styles.sectionTitle}>Available Requests</Text>
              {availableRequests.length > 0 ? (
                <FlatList
                  data={availableRequests}
                  keyExtractor={(item) => item.id}
                  renderItem={renderAvailableRequest}
                  contentContainerStyle={styles.listContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={() => fetchDeliveryData(true)}
                      colors={["#cfae70"]}
                      tintColor="#cfae70"
                    />
                  }
                />
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="inbox" size={64} color="#ddd" />
                  <Text style={styles.emptyStateText}>
                    No delivery requests available
                  </Text>
                  <Text style={styles.emptyStateSubText}>
                    Pull down to refresh
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  etaContainer: {
    padding: 12,
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 10,
  },
  etaTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  etaText: {
    fontSize: 14,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    marginRight: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
  refreshText: {
    fontSize: 12,
    color: "#666",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  availableSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyActiveState: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    height: 120,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#888",
    marginTop: 12,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 16,
  },
  deliveryItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  activeDeliveryItem: {
    backgroundColor: "#f8f9ff",
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e6e8f0",
    width: 280,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  deliveryAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: Color.colorBurlywood,
  },
  deliveryContent: {
    marginBottom: 12,
  },
  deliveryDetails: {
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  deliveryNotes: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  itemPreview: {
    marginTop: 8,
  },
  itemText: {
    fontSize: 13,
    color: "#666",
  },
  deliveryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  deliveryFee: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: "#f5f5f5",
  },
  viewButtonText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  acceptButton: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4a6fa5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  trackButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
    marginLeft: 4,
  },
  statusChip: {
    backgroundColor: "#e3f2fd",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1976d2",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  mapContent: {
    flex: 1,
    position: "relative",
    padding: 16,
  },
  deliveryInfo: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  mapActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  statusUpdateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4a6fa5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deliveredButton: {
    backgroundColor: "#4CAF50",
  },
  statusUpdateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
});
