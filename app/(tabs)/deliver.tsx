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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/app/context/AuthContext";
import { Color } from "@/GlobalStyles";
import OrderTrackingView from "@/components/OrderTrackingView";
import { initializeLocalData } from "@/lib/data/dataLoader";
import deliveryTrackingService from "../services/deliveryTrackingService";
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

export default function Deliver() {
  const { user } = useAuth();
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);
  const [availableRequests, setAvailableRequests] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Order | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [etaInfo, setEtaInfo] = useState<{
    etaString: string;
    timeString: string;
  } | null>(null);

  // Initialize location data
  useEffect(() => {
    initializeLocalData();
    deliveryTrackingService.initializeTrackingService();
    fetchDeliveryData();
  }, []);

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

  const updateETA = (tracking: any) => {
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
        setSelectedDelivery(null);
        setShowMap(false);

        // Show completion message
        Alert.alert(
          "Delivery Completed",
          "Thank you for completing this delivery!",
          [
            {
              text: "OK",
              onPress: () => {
                // Remove from active deliveries and refresh
                setActiveDeliveries((prev) =>
                  prev.filter((delivery) => delivery.id !== orderId),
                );
                fetchDeliveryData(false);
              },
            },
          ],
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

        // Update selected delivery if it's the one being updated
        if (selectedDelivery && selectedDelivery.id === orderId) {
          setSelectedDelivery((prev) =>
            prev ? { ...prev, status: newStatus } : null,
          );
        }

        // Refresh data
        fetchDeliveryData(false);
      }

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

  // Simplified delivery map
  const renderDeliveryMap = () => {
    if (!selectedDelivery) return null;

    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>
            Delivery - {selectedDelivery.restaurantName}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseMap}>
            <Feather name="x" size={24} color="#000" />
          </TouchableOpacity>
        </View>

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

        <View style={styles.orderDetailsCard}>
          <Text style={styles.orderDetailsTitle}>Order Details</Text>

          <View style={styles.orderDetail}>
            <Text style={styles.orderDetailLabel}>Order #:</Text>
            <Text style={styles.orderDetailValue}>
              {selectedDelivery.id.substring(6, 12)}
            </Text>
          </View>

          <View style={styles.orderDetail}>
            <Text style={styles.orderDetailLabel}>Restaurant:</Text>
            <Text style={styles.orderDetailValue}>
              {selectedDelivery.restaurantName}
            </Text>
          </View>

          {selectedDelivery.deliveryAddress && (
            <View style={styles.orderDetail}>
              <Text style={styles.orderDetailLabel}>Delivery to:</Text>
              <Text style={styles.orderDetailValue}>
                {selectedDelivery.deliveryAddress}
              </Text>
            </View>
          )}

          {selectedDelivery.notes && (
            <View style={styles.orderDetail}>
              <Text style={styles.orderDetailLabel}>Notes:</Text>
              <Text style={styles.orderDetailValue}>
                {selectedDelivery.notes}
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
      <View style={styles.deliveryCard}>
        <View style={styles.deliveryHeader}>
          <Text style={styles.restaurantName}>{item.restaurantName}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Available</Text>
          </View>
        </View>

        <View style={styles.deliverySummary}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>
              Order #{item.id.substring(6, 12)}
            </Text>
            {item.items.length > 0 && (
              <Text style={styles.itemCount}>{item.items.length} items</Text>
            )}
          </View>

          <Text style={styles.deliveryPrice}>${item.totalAmount}</Text>
        </View>

        {item.deliveryAddress && (
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={14} color="#666" />
            <Text style={styles.deliveryAddress} numberOfLines={1}>
              {item.deliveryAddress}
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleSelectDelivery(item)}
          >
            <Feather name="info" size={16} color="#666" />
            <Text style={styles.viewButtonText}>Details</Text>
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
                }
              });
            }}
          >
            <Text style={styles.acceptButtonText}>Accept Delivery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render an active delivery item
  const renderActiveDelivery = ({ item }: { item: Order }) => (
    <View style={styles.activeDeliveryCard}>
      <View style={styles.activeDeliveryHeader}>
        <Text style={styles.activeDeliveryTitle}>Active Delivery</Text>
        <View style={styles.activeStatusChip}>
          <Text style={styles.activeStatusText}>
            {item.status === "accepted" ? "Pickup Phase" : "Delivering"}
          </Text>
        </View>
      </View>

      <Text style={styles.activeRestaurantName}>{item.restaurantName}</Text>

      <View style={styles.activeOrderInfo}>
        <View style={styles.activeOrderDetail}>
          <Feather name="hash" size={16} color="#555" />
          <Text style={styles.activeOrderText}>
            Order #{item.id.substring(6, 12)}
          </Text>
        </View>

        {item.deliveryAddress && (
          <View style={styles.activeOrderDetail}>
            <Feather name="map-pin" size={16} color="#555" />
            <Text style={styles.activeOrderText}>{item.deliveryAddress}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.trackButton}
        onPress={() => handleSelectDelivery(item)}
      >
        <Feather name="navigation" size={16} color="#fff" />
        <Text style={styles.trackButtonText}>Track & Update</Text>
      </TouchableOpacity>
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
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchDeliveryData(true)}
        >
          <Feather name="refresh-cw" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {isLoading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#cfae70" />
            <Text style={styles.loaderText}>Loading delivery requests...</Text>
          </View>
        ) : (
          <>
            {/* Active Deliveries Section */}
            {activeDeliveries.length > 0 && (
              <View style={styles.activeDeliveriesSection}>
                <FlatList
                  data={activeDeliveries}
                  keyExtractor={(item) => item.id}
                  renderItem={renderActiveDelivery}
                  horizontal={false}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
  },
  refreshButton: {
    backgroundColor: Color.colorBurlywood,
    padding: 8,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  activeDeliveriesSection: {
    padding: 16,
    backgroundColor: "#f9f9ff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
    marginLeft: 16,
  },
  availableSection: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  // New card-based design for delivery items
  deliveryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  deliverySummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    color: "#555",
  },
  itemCount: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: Color.colorBurlywood,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  deliveryAddress: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
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
  // Active delivery card
  activeDeliveryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e6e6ff",
    borderLeftWidth: 4,
    borderLeftColor: "#4a6fa5",
  },
  activeDeliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  activeDeliveryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a6fa5",
  },
  activeStatusChip: {
    backgroundColor: "#e6f0ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatusText: {
    fontSize: 12,
    color: "#4a6fa5",
  },
  activeRestaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  activeOrderInfo: {
    marginBottom: 12,
  },
  activeOrderDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  activeOrderText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
  },
  trackButton: {
    backgroundColor: "#4a6fa5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  trackButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  // Map view styles
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
  etaContainer: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0e1f9",
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
  orderDetailsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  orderDetailsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  orderDetail: {
    flexDirection: "row",
    marginBottom: 8,
  },
  orderDetailLabel: {
    fontSize: 14,
    fontWeight: "500",
    width: 100,
    color: "#666",
  },
  orderDetailValue: {
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
    paddingVertical: 14,
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
