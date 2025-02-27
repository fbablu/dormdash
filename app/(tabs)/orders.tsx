import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getOrders, Order } from "../../data/orders"; // Import orders data

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setOrders(getOrders()); // Load orders when screen loads
  }, []);

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setReceiptModalVisible(true);
  };

  const handleOrderAgain = (order: Order) => {
    console.log("Ordering again:", order);
    setReceiptModalVisible(false);
    router.push("/(tabs)"); // Navigate to home screen
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => handleOrderPress(item)}
    >
      <Text style={styles.orderNumber}>Order #{item.id}</Text>
      <Text style={styles.orderDate}>
        {item.date}, {item.total} →
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            You haven't placed any orders yet
          </Text>
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
                Order #{selectedOrder?.id}
              </Text>
            </View>

            {selectedOrder && (
              <View style={styles.receiptContent}>
                <View style={styles.itemsContainer}>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.item}>
                      <Text style={styles.itemName}>
                        {item.quantity}x {item.name}
                      </Text>
                      <Text style={styles.itemPrice}>
                        ${item.price.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>{selectedOrder.total}</Text>
                </View>

                <TouchableOpacity
                  style={styles.orderAgainButton}
                  onPress={() => handleOrderAgain(selectedOrder)}
                >
                  <Text style={styles.orderAgainText}>Order Again</Text>
                </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#000" },
  ordersList: { padding: 16 },
  orderItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNumber: { fontSize: 16, fontWeight: "600" },
  orderDate: { color: "#666" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#666" },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "85%",
    backgroundColor: "#E6BF83",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  receiptTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  receiptSubtitle: { fontSize: 14, color: "#333" },
  receiptContent: { backgroundColor: "#fff", borderRadius: 10, padding: 15 },
  itemsContainer: { marginBottom: 20 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  itemName: { fontSize: 15 },
  itemPrice: { fontSize: 15, fontWeight: "500" },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
    marginTop: 5,
  },
  totalLabel: { fontSize: 18, fontWeight: "bold" },
  totalAmount: { fontSize: 18, fontWeight: "bold" },
  orderAgainButton: {
    backgroundColor: "#E6BF83",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  orderAgainText: { color: "#000", fontSize: 16, fontWeight: "bold" },
  closeButton: { position: "absolute", top: 15, right: 15 },
});
