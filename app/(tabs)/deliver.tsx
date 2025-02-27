// app/(tabs)/deliver.tsx
import React, { useState, useEffect } from "react";
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
} from "react-native";
import { getDeliveryRequests, acceptDeliveryRequest, updateOrderStatus } from "../services/api";

// Define DeliveryRequest type
interface DeliveryRequest {
  id: string;
  customer_name: string;
  restaurant_name: string;
  delivery_address: string;
  total_amount: number;
  delivery_fee: number;
  notes?: string;
  created_at: string;
  status?: string;
}

export default function DeliverPage() {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<DeliveryRequest[]>([]);

  // Toggle visibility options
  const toggleVisibilityOptions = () => {
    setIsVisible((prev) => !prev);
  };

  // Toggle online status
  const toggleOnline = () => {
    setIsOnline(true);
    setIsVisible(false);
    fetchDeliveryRequests();
  };

  // Toggle offline status
  const toggleOffline = () => {
    setIsOnline(false);
    setIsVisible(false);
  };

  // Fetch delivery requests from the API
  const fetchDeliveryRequests = async () => {
    if (!isOnline) return;
    
    setLoading(true);
    try {
      const requests = await getDeliveryRequests();
      setDeliveryRequests(requests);
    } catch (error) {
      console.error("Error fetching delivery requests:", error);
      Alert.alert("Error", "Failed to load delivery requests. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Accept a delivery request
  const handleAcceptDelivery = async (requestId: string) => {
    setLoading(true);
    try {
      await acceptDeliveryRequest(requestId);
      
      // Find the accepted request
      const acceptedRequest = deliveryRequests.find(req => req.id === requestId);
      
      if (acceptedRequest) {
        // Add to active deliveries
        setActiveDeliveries(prev => [...prev, acceptedRequest]);
        
        // Remove from available requests
        setDeliveryRequests(prev => prev.filter(req => req.id !== requestId));
      }
      
      Alert.alert("Success", "Delivery request accepted!");
    } catch (error) {
      console.error("Error accepting delivery request:", error);
      Alert.alert("Error", "Failed to accept delivery. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update the status of a delivery
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setLoading(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      
      if (newStatus === 'delivered') {
        // Remove from active deliveries when completed
        setActiveDeliveries(prev => prev.filter(delivery => delivery.id !== orderId));
        Alert.alert("Success", "Delivery marked as completed!");
      } else {
        // Update the status in the active deliveries list
        setActiveDeliveries(prev => 
          prev.map(delivery => 
            delivery.id === orderId ? { ...delivery, status: newStatus } : delivery
          )
        );
        Alert.alert("Success", `Delivery status updated to ${newStatus}!`);
      }
    } catch (error) {
      console.error("Error updating delivery status:", error);
      Alert.alert("Error", "Failed to update delivery status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveryRequests();
  };

  // Fetch delivery requests when going online
  useEffect(() => {
    if (isOnline) {
      fetchDeliveryRequests();
    }
  }, [isOnline]);

  // Render an available delivery request item
  const renderAvailableDeliveryItem = ({ item }: { item: DeliveryRequest }) => (
    <View style={styles.deliveryItem}>
      <View style={styles.deliveryHeader}>
        <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
        <Text style={styles.deliveryAmount}>${item.total_amount.toFixed(2)}</Text>
      </View>
      
      <Text style={styles.deliveryAddress}>To: {item.delivery_address}</Text>
      
      {item.notes && (
        <Text style={styles.deliveryNotes}>Notes: {item.notes}</Text>
      )}
      
      <View style={styles.deliveryFooter}>
        <Text style={styles.deliveryFee}>Delivery Fee: ${item.delivery_fee.toFixed(2)}</Text>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAcceptDelivery(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render an active delivery item
  const renderActiveDeliveryItem = ({ item }: { item: DeliveryRequest }) => (
    <View style={styles.activeDeliveryItem}>
      <View style={styles.deliveryHeader}>
        <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
        <Text style={styles.deliveryAmount}>${item.total_amount.toFixed(2)}</Text>
      </View>
      
      <Text style={styles.deliveryAddress}>To: {item.delivery_address}</Text>
      
      {item.notes && (
        <Text style={styles.deliveryNotes}>Notes: {item.notes}</Text>
      )}
      
      <View style={styles.statusButtons}>
        <TouchableOpacity 
          style={styles.statusButton}
          onPress={() => handleUpdateStatus(item.id, 'picked_up')}
        >
          <Text style={styles.statusButtonText}>Picked Up</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.statusButton, styles.deliveredButton]}
          onPress={() => handleUpdateStatus(item.id, 'delivered')}
        >
          <Text style={styles.statusButtonText}>Delivered</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Image
        style={styles.dormdashIcon}
        resizeMode="contain"
        source={require("../../assets/deliver-page/TopBar.png")}
      />

      {/* Status indicator */}
      <View style={styles.statusIndicator}>
        <Text style={styles.statusText}>
          Status: {isOnline ? "Online" : "Offline"}
        </Text>
        <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
      </View>

      {isOnline ? (
        <View style={styles.contentContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#cfae70" style={styles.loader} />
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
                {deliveryRequests.length > 0 ? (
                  <FlatList
                    data={deliveryRequests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderAvailableDeliveryItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No delivery requests available</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
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
          <Text style={styles.offlineSubtext}>Go online to view and accept delivery requests</Text>
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
      <TouchableOpacity style={styles.VisibilityConfigButton} onPress={toggleVisibilityOptions}>
        <Text style={styles.buttonText}>{isOnline ? "You are Online" : "You are Offline"}</Text>
        <Image
          style={styles.visibilityConfig}
          resizeMode="contain"
          source={require("../../assets/deliver-page/VisibilityConfig.png")}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  dormdashIcon: {
    marginTop: 10,
    width: 393,
    height: 66,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
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
  deliveredButton: {
    backgroundColor: "#4CAF50",
  },
  statusButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 100, // Add padding for the bottom button
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
    width: 375,
    height: 75,
    borderColor: "#897A7A",
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
});