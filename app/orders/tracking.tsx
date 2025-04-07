// app/orders/tracking.tsx
// Contributor: @Fardeen Bablu
// Time spent: 1.5 hours

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams, Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Color } from "@/GlobalStyles";
import { useAuth } from "../context/AuthContext";
import CustomerTrackingView from "@/components/delivery/CustomerTrackingView";

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadOrder = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);

        // Get order from AsyncStorage
        const ordersJson = await AsyncStorage.getItem("dormdash_orders");
        if (!ordersJson) {
          throw new Error("No orders found");
        }

        const orders = JSON.parse(ordersJson);
        const orderData = orders.find((o: any) => o.id === id);

        if (!orderData) {
          throw new Error("Order not found");
        }

        // Verify that this user is the customer
        if (orderData.customerId !== user.id) {
          throw new Error("You do not have permission to view this order");
        }

        setOrder(orderData);
      } catch (error) {
        console.error("Error loading order:", error);
        alert(error instanceof Error ? error.message : "Failed to load order");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.colorBurlywood} />
          <Text style={styles.loadingText}>Loading order tracking...</Text>
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen
        options={{
          title: "Order Tracking",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />

      <CustomerTrackingView
        orderId={order.id}
        order={order}
        onClose={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  backButton: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
