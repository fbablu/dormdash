// app/(tabs)/orders.tsx
// Contributors: @Rushi Patel, @Fardeen Bablu
// Time spent: 4 hours
// app/(tabs)/orders.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { Color } from "@/GlobalStyles";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  totalAmount: string;
  deliveryFee: string;
  status: "pending" | "accepted" | "picked_up" | "delivered" | "cancelled";
  timestamp: string;
  paymentMethod: string;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (ordersJson) {
        const parsedOrders = JSON.parse(ordersJson) as Order[];
        setOrders(parsedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      Alert.alert("Error", "Failed to load your orders");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setReceiptModalVisible(true);
  };

  const handleOrderAgain = (order: Order) => {
    setReceiptModalVisible(false);
    router.push(`/restaurant/${order.restaurantId}`);
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      // Get all orders
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      if (!ordersJson) return;

      const allOrders = JSON.parse(ordersJson) as Order[];

      // Update the status of the specific order
      const updatedOrders = allOrders.map((order) =>
        order.id === orderId
          ? { ...order, status: "cancelled" as const }
          : order,
      );

      // Save updated orders back to storage
      await AsyncStorage.setItem(
        "dormdash_orders",
        JSON.stringify(updatedOrders),
      );

      // Update local state
      setOrders(updatedOrders);

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: "cancelled" });
      }

      Alert.alert("Success", "Order cancelled successfully");
    } catch (error) {
      console.error("Error cancelling order:", error);
      Alert.alert("Error", "Failed to cancel order");
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      ", " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "Waiting for acceptance";
      case "accepted":
        return "Being prepared";
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

  const getStatusColor = (status: Order["status"]) => {
    // Based off of the deliver.tsx status options
    switch (status) {
      case "pending":
        return "#f39c12";
      case "accepted":
        return "#3498db";
      case "picked_up":
        return "#2ecc71";
      case "delivered":
        return "#27ae60";
      case "cancelled":
        return "#e74c3c";
      default:
        return "#7f8c8d";
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => handleOrderPress(item)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>
          Order #{item.id.substring(6, 12)}
        </Text>
        <Text style={styles.orderDate}>{formatDate(item.timestamp)}</Text>
      </View>

      <Text style={styles.restaurantName}>{item.restaurantName}</Text>

      <View style={styles.orderDetailsRow}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
        <Text style={styles.orderAmount}>${item.totalAmount}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Orders</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadOrders}>
          <Feather name="refresh-cw" size={20} color={Color.colorBurlywood} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.colorBurlywood} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="shopping-bag" size={60} color="#ddd" />
          <Text style={styles.emptyText}>
            You haven't placed any orders yet
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Receipt Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={receiptModalVisible}
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptTitle}>Receipt</Text>
              <Text style={styles.receiptSubtitle}>
                Order #{selectedOrder?.id.substring(6, 12)}
              </Text>
              <View
                style={[
                  styles.modalStatusBadge,
                  {
                    backgroundColor: selectedOrder
                      ? getStatusColor(selectedOrder.status)
                      : "#7f8c8d",
                  },
                ]}
              >
                <Text style={styles.modalStatusText}>
                  {selectedOrder ? getStatusText(selectedOrder.status) : ""}
                </Text>
              </View>
            </View>

            {selectedOrder && (
              <View style={styles.receiptContent}>
                <Text style={styles.receiptRestaurantName}>
                  {selectedOrder.restaurantName}
                </Text>
                <Text style={styles.receiptDate}>
                  {formatDate(selectedOrder.timestamp)}
                </Text>

                <View style={styles.itemsContainer}>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.item}>
                      <Text style={styles.itemName}>
                        {item.quantity}x {item.name}
                      </Text>
                      <Text style={styles.itemPrice}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.subtotalContainer}>
                  <Text style={styles.subtotalLabel}>Subtotal:</Text>
                  <Text style={styles.subtotalAmount}>
                    $
                    {(
                      parseFloat(selectedOrder.totalAmount) -
                      parseFloat(selectedOrder.deliveryFee)
                    ).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.feeContainer}>
                  <Text style={styles.feeLabel}>Delivery Fee:</Text>
                  <Text style={styles.feeAmount}>
                    ${selectedOrder.deliveryFee}
                  </Text>
                </View>

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>
                    ${selectedOrder.totalAmount}
                  </Text>
                </View>

                <View style={styles.paymentContainer}>
                  <Text style={styles.paymentLabel}>Payment Method:</Text>
                  <Text style={styles.paymentMethod}>
                    {selectedOrder.paymentMethod}
                  </Text>
                </View>

                <View style={styles.modalButtonsContainer}>
                  {selectedOrder.status === "pending" && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelOrder(selectedOrder.id)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel Order</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.orderAgainButton}
                    onPress={() => handleOrderAgain(selectedOrder)}
                  >
                    <Text style={styles.orderAgainText}>Order Again</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setReceiptModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  ordersList: {
    padding: 16,
  },
  orderItem: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  orderDate: {
    color: "#666",
    fontSize: 14,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  orderDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 12,
  },
  orderAmount: {
    fontSize: 17,
    fontWeight: "bold",
    color: Color.colorBurlywood,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  exploreButton: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  receiptHeader: {
    alignItems: "center",
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  receiptTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#fff",
  },
  receiptSubtitle: {
    fontSize: 14,
    color: "#fff",
  },
  modalStatusBadge: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  modalStatusText: {
    color: "#fff",
    fontWeight: "bold",
  },
  receiptContent: {
    padding: 20,
  },
  receiptRestaurantName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  receiptDate: {
    color: "#666",
    marginBottom: 20,
  },
  itemsContainer: {
    marginBottom: 20,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemName: { fontSize: 16 },
  itemPrice: {
    fontSize: 16,
    fontWeight: "500",
  },
  subtotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  subtotalLabel: { fontSize: 16 },
  subtotalAmount: { fontSize: 16 },
  feeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  feeLabel: { fontSize: 16 },
  feeAmount: { fontSize: 16 },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: Color.colorBurlywood,
  },
  paymentContainer: {
    flexDirection: "row",
    paddingVertical: 8,
    marginBottom: 20,
  },
  paymentLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderAgainButton: {
    backgroundColor: Color.colorBurlywood,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },
  orderAgainText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#f1f1f1",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#fff",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
